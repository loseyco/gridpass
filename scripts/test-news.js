
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
require('dotenv').config({ path: '.env.local' });

async function testNews() {
    const url = 'http://localhost:3000/api/cron/daily-news';
    const secret = process.env.CRON_SECRET || 'gp_news_2026_secure_key_x9A2';

    console.log(`Triggering ${url}...`);

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${secret}` }
        });

        const text = await res.text();
        console.log('Status:', res.status);
        try {
            const json = JSON.parse(text);
            console.log('Response:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Raw Text:', text);
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testNews();
