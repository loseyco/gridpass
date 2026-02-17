
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Config
const SITE_URL = 'https://gridpass.app';
const SECRET = process.env.CRON_SECRET;
const POLL_INTERVAL_MS = 60 * 1000; // Check every minute

if (!SECRET) {
    console.error('❌ CRON_SECRET missing.');
    process.exit(1);
}

// Initialize Supabase (Public Client is fine for reading settings if RLS allows, 
// using Anon key. Admin key would be better but we only have Anon in .env.local usually?
// Actually we need to Write 'heartbeat'. If RLS allows auth users, we might need to sign in?
// For now, let's assume Anon key has access or we use Service key if available.)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// State tracking
let lastRun = {
    news: 0,
    facebook: 0,
    youtube: 0
};

async function log(msg) {
    const ts = new Date().toLocaleTimeString();
    console.log(`[${ts}] ${msg}`);
}

async function trigger(endpoint) {
    try {
        const res = await fetch(`${SITE_URL}/api/cron/${endpoint}`, {
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });
        const json = await res.json();
        return { success: res.ok, data: json };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function loop() {
    // 1. Heartbeat
    await supabase.from('os_system_settings').upsert({
        key: 'system.heartbeat',
        value: {
            status: 'online',
            last_seen: new Date().toISOString(),
            hostname: require('os').hostname()
        }
    });

    // 2. Fetch Settings
    const { data: settings } = await supabase.from('os_system_settings').select('*');
    if (!settings) return;

    const config = {};
    settings.forEach(s => config[s.key] = s.value);

    const now = Date.now();

    // --- News Scraper ---
    if (config['cron.news_scraper.enabled']?.enabled) {
        const freq = (config['cron.news_scraper.enabled'].frequency_mins || 15) * 60000;
        if (now - lastRun.news > freq) {
            log('📰 Running News Scraper...');
            const res = await trigger('daily-news');
            log(`   Result: ${res.success ? '✅' : '❌'} ${res.success ? (res.data.scraped?.inserted + ' new') : res.error}`);
            lastRun.news = now;
        }
    }

    // --- Facebook Publisher ---
    if (config['cron.facebook_publisher.enabled']?.enabled) {
        const freq = (config['cron.facebook_publisher.enabled'].frequency_mins || 60) * 60000;
        if (now - lastRun.facebook > freq) {
            log('face Running Facebook Publisher...');
            const res = await trigger('facebook-publisher');
            log(`   Result: ${res.success ? '✅' : '❌'}`);
            lastRun.facebook = now;
        }
    }

    // --- YouTube Monitor ---
    if (config['cron.youtube_monitor.enabled']?.enabled) {
        const freq = (config['cron.youtube_monitor.enabled'].frequency_mins || 5) * 60000;
        if (now - lastRun.youtube > freq) {
            log('📺 Checking YouTube Live...');
            const res = await trigger('youtube-monitor');
            log(`   Status: ${res.data?.status || 'Active'}`);
            lastRun.youtube = now;
        }
    }
}

log('🚀 Mission Control Started.');
log('   Listening for commands from GridPass OS...');

// Initial Loop
loop();
setInterval(loop, POLL_INTERVAL_MS);
