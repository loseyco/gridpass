import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Configure stealth plugin
puppeteer.use(StealthPlugin());

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow 60s for scraper

export async function GET(req: NextRequest) {
    // Basic Auth Check (Cron or Admin)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'gp_news_2026_secure_key_x9A2';

    // Allow if CRON_SECRET matches OR if user is admin (simple check for now)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const isAuthorized = (cronSecret && authHeader === `Bearer ${cronSecret}`) || user;
    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Launch Puppeteer with Stealth
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Set a realistic User Agent explicitly just in case
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Go to Reddit JSON
        await page.goto('https://www.reddit.com/r/Simracingstewards/hot.json?limit=25', {
            waitUntil: 'networkidle2', // Wait for network to be idle
            timeout: 30000
        });

        // Extract JSON content from body (browser wraps JSON in <pre> or pure text)
        const content = await page.evaluate(() => document.body.innerText);
        const data = JSON.parse(content);

        await browser.close();

        const posts = data.data.children;
        const newIncidents = [];

        for (const post of posts) {
            const p = post.data;

            // Filter for video content
            const isVideo = p.is_video || p.url.includes('youtu') || p.url.includes('streamable');
            if (!isVideo) continue;

            // Skip if already exists
            const { data: existing } = await supabase
                .from('os_stewards_incidents')
                .select('id')
                .eq('reddit_post_id', p.id)
                .single();

            if (existing) continue;

            // Determine Sim Title mostly from flair or title text
            let simTitle = 'Unknown';
            const textToSearch = (p.title + ' ' + (p.link_flair_text || '')).toLowerCase();

            if (textToSearch.includes('iracing')) simTitle = 'iRacing';
            else if (textToSearch.includes('acc') || textToSearch.includes('competizione')) simTitle = 'ACC';
            else if (textToSearch.includes('f1')) simTitle = 'F1 24'; // Generic F1
            else if (textToSearch.includes('gran turismo') || textToSearch.includes('gt7')) simTitle = 'Gran Turismo';
            else if (textToSearch.includes('forza')) simTitle = 'Forza';

            // Insert
            const { error } = await supabase.from('os_stewards_incidents').insert({
                title: p.title,
                description: `Imported from r/Simracingstewards by u/${p.author}`,
                video_url: p.url,
                sim_title: simTitle,
                reddit_post_id: p.id,
                // user_id is null for scraped content
            });

            if (!error) {
                newIncidents.push(p.title);
            }
        }

        return NextResponse.json({
            success: true,
            imported_count: newIncidents.length,
            imported_titles: newIncidents,
            source: 'Puppeteer via Reddit'
        });

    } catch (error: any) {
        console.error('Puppeteer scraper error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
