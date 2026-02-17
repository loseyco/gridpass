import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Basic Auth Check (Cron or Admin)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow if CRON_SECRET matches OR if user is admin (simple check for now)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const isAuthorized = (cronSecret && authHeader === `Bearer ${cronSecret}`) || user;
    if (!isAuthorized) {
        return NextResponse.json({
            error: 'Unauthorized',
            debug: {
                received: authHeader,
                expected: cronSecret ? `${cronSecret.substring(0, 3)}...` : 'undefined',
                match: cronSecret && authHeader === `Bearer ${cronSecret}`
            }
        }, { status: 401 });
    }

    try {
        // Fetch from Reddit
        const response = await fetch('https://www.reddit.com/r/Simracingstewards/hot.json?limit=25', {
            headers: {
                'User-Agent': 'GridPass-Scraper/1.0'
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
            imported_titles: newIncidents
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
