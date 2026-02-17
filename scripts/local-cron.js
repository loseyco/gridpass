require('dotenv').config({ path: '.env.local' });

// Config
const NEWS_URL = 'https://gridpass.app/api/cron/daily-news';
const FB_URL = 'https://gridpass.app/api/cron/facebook-publisher';
const SECRET = process.env.CRON_SECRET;

if (!SECRET) {
    console.error('❌ Error: CRON_SECRET not found in .env.local');
    process.exit(1);
}

async function triggerEndpoint(name, url) {
    console.log(`\n[${new Date().toLocaleTimeString()}] 🚀 Triggering ${name}...`);

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${SECRET}` }
        });

        const status = response.status;
        const text = await response.text();

        try {
            const json = JSON.parse(text);
            if (response.ok) {
                console.log(`✅ ${name} Success (${status}):`, json.success ? 'OK' : json);
                if (json.logs) console.log(json.logs.join('\n'));
            } else {
                console.error(`⚠️ ${name} Failed (${status}):`, json);
            }
        } catch (e) {
            console.log(`ℹ️ ${name} Response (${status}):`, text.slice(0, 100));
        }

    } catch (error) {
        console.error(`❌ ${name} Network Error:`, error.message);
    }
}

// Start
console.log(`🤖 Local Mission Control Started.`);
console.log(`   News Scraper: Every 15 mins`);
console.log(`   Facebook Publisher: Every 60 mins`);
console.log(`   Target: gridpass.app`);
console.log(`   Press Ctrl+C to stop.`);

// Initial Run
triggerEndpoint('News Scraper', NEWS_URL);
triggerEndpoint('Facebook Publisher', FB_URL);

// Schedules
setInterval(() => triggerEndpoint('News Scraper', NEWS_URL), 15 * 60 * 1000);
setInterval(() => triggerEndpoint('Facebook Publisher', FB_URL), 60 * 60 * 1000);
