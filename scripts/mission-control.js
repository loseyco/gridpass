
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

// Initialize Supabase
// Use Service Role Key if available to bypass RLS for writing heartbeat
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Using Anon key. Heartbeat write might fail if RLS is strict.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function trigger(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${SECRET}`,
                'Content-Type': 'application/json'
            }
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`${SITE_URL}/api/cron/${endpoint}`, { ...options });
        const json = await res.json();
        return { success: res.ok, data: json };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

async function loop() {
    // 1. Heartbeat
    // Use API to bypass RLS
    try {
        await trigger('heartbeat', 'POST', {
            hostname: require('os').hostname()
        });
    } catch (e) {
        console.error('Heartbeat failed:', e.message);
    }

    // 2. Fetch Settings
    const { data: settings, error } = await supabase.from('os_system_settings').select('*');
    if (error) {
        log(`❌ Settings Fetch Error: ${error.message} (Key: ${supabaseKey ? 'Present' : 'Missing'})`);
        return;
    }
    if (!settings) return;

    const config = {};
    settings.forEach(s => config[s.key] = s.value);

    // DEBUG: Log keys on first run
    if (lastRun.news === 0) {
        log(`Loaded settings keys: ${Object.keys(config).join(', ')}`);
        log(`News Scraper Config: ${JSON.stringify(config['cron.news_scraper.enabled'])}`);
    }

    const now = Date.now();

    // --- News Scraper ---
    if (config['cron.news_scraper.enabled']?.enabled) {
        const freq = (config['cron.news_scraper.enabled'].frequency_mins || 15) * 60000;
        if (now - lastRun.news > freq) {
            log('📰 Running News Scraper...');
            const res = await trigger('daily-news');
            if (res.success) {
                log(`   Result: ✅ ${res.data.scraped?.inserted} new articles`);
                if (res.data.summary) {
                    log(`   Summary: Generated=${res.data.summary.summariesGenerated}, Errors=${res.data.summary.errors?.length}`);
                    if (res.data.summary.errors?.length > 0) {
                        log(`   ⚠️ Summary Errors: ${JSON.stringify(res.data.summary.errors)}`);
                    }
                }
            } else {
                log(`   ❌ Error: ${res.error}`);
            }
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
