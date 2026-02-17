/* eslint-disable */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Configure stealth
puppeteer.use(StealthPlugin());

async function scrape() {
    console.log('Starting scraper...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        console.log('Navigating to Reddit...');
        await page.goto('https://www.reddit.com/r/Simracingstewards/hot.json?limit=25', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        const content = await page.evaluate(() => document.body.innerText);

        let data;
        try {
            data = JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse JSON:', content.substring(0, 100));
            throw new Error('Invalid JSON response');
        }

        const posts = data.data.children;
        console.log(`Found ${posts.length} posts.`);

        let newCount = 0;

        for (const post of posts) {
            const p = post.data;

            // Filter
            const isVideo = p.is_video || p.url.includes('youtu') || p.url.includes('streamable');
            if (!isVideo) continue;

            // Check existing
            const { data: existing } = await supabase
                .from('os_stewards_incidents')
                .select('id')
                .eq('reddit_post_id', p.id)
                .single();

            if (existing) continue;

            // Sim Title
            let simTitle = 'Unknown';
            const textToSearch = (p.title + ' ' + (p.link_flair_text || '')).toLowerCase();

            if (textToSearch.includes('iracing')) simTitle = 'iRacing';
            else if (textToSearch.includes('acc') || textToSearch.includes('competizione')) simTitle = 'ACC';
            else if (textToSearch.includes('f1')) simTitle = 'F1 24';
            else if (textToSearch.includes('gran turismo') || textToSearch.includes('gt7')) simTitle = 'Gran Turismo';
            else if (textToSearch.includes('forza')) simTitle = 'Forza';

            // Insert
            const { error } = await supabase.from('os_stewards_incidents').insert({
                title: p.title,
                description: `Imported from r/Simracingstewards by u/${p.author}`,
                video_url: p.url,
                sim_title: simTitle,
                reddit_post_id: p.id
            });

            if (!error) {
                console.log(`Imported: ${p.title}`);
                newCount++;
            } else {
                console.error(`Failed to import ${p.title}:`, error.message);
            }
        }

        console.log(`Scrape complete. Imported ${newCount} new incidents.`);

    } catch (error) {
        console.error('Scrape error:', error);
    } finally {
        await browser.close();
    }
}

scrape();
