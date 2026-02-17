import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    // Basic Auth Check (Cron or Admin)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow if CRON_SECRET matches OR if user is admin (simple check for now)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const isAuthorized = (cronSecret && authHeader === `Bearer ${cronSecret}`) || user;
    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Use fetch instead of Puppeteer for Reddit JSON
        const response = await fetch('https://www.reddit.com/r/Simracingstewards/hot.json?limit=25', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Reddit API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const posts = data.data.children;
        const newIncidents = [];

        for (const post of posts) {
            const p = post.data;

            // Filter for YouTube or Streamable ONLY (per user request to avoid blank Reddit videos)
            const isYouTube = p.url.includes('youtu');
            const isStreamable = p.url.includes('streamable.com');

            if (!isYouTube && !isStreamable) continue;

            // Skip if already exists
            const { data: existing } = await supabase
                .from('os_stewards_incidents')
                .select('id')
                .eq('reddit_post_id', p.id)
                .single();

            if (existing) continue;

            // Extract Thumbnail (Try preview image first, then thumbnail field)
            let thumbnail = null;
            if (p.preview && p.preview.images && p.preview.images.length > 0) {
                thumbnail = p.preview.images[0].source.url.replace(/&amp;/g, '&');
            } else if (p.thumbnail && p.thumbnail.startsWith('http')) {
                thumbnail = p.thumbnail;
            }

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
                thumbnail: thumbnail
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
            source: 'Fetch via Reddit JSON'
        });

    } catch (error: any) {
        console.error('Scraper error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
