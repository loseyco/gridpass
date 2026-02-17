
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function seed() {
    console.log('🌱 Seeding os_system_settings...');

    const settings = [
        { key: 'cron.news_scraper.enabled', value: { enabled: true, frequency_mins: 15 }, description: 'Auto-scrape RSS feeds' },
        { key: 'cron.facebook_publisher.enabled', value: { enabled: true, frequency_mins: 60 }, description: 'Auto-post to Facebook' },
        { key: 'cron.youtube_monitor.enabled', value: { enabled: true, frequency_mins: 5 }, description: 'Check for live streams' },
        { key: 'site.live_stream', value: { is_live: false, video_id: null }, description: 'Current Live Stream Status' },
        { key: 'system.heartbeat', value: { last_seen: null, status: 'offline' }, description: 'Local Script Heartbeat' }
    ];

    const { error } = await supabase
        .from('os_system_settings')
        .upsert(settings, { onConflict: 'key' });

    if (error) {
        console.error('❌ Error seeding settings:', error.message);
    } else {
        console.log('✅ Settings seeded successfully.');
    }
}

seed();
