const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'master_feed.json');

// The List
const TARGETS = [
    'https://www.facebook.com/groups/373733806854468', // Racing Jobs
    'https://www.facebook.com/groups/566053494035822', // Chicago Sim Racing
    'https://www.linkedin.com/jobs/search/?keywords=remote%20software%20engineer&refresh=true'
];

(async () => {
  try {
    console.log('📡 Piggybacking on Edge (Port 9222)...');
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    console.log('✅ Connected!');

    let allData = [];

    const page = await browser.newPage();

    for (const url of TARGETS) {
        console.log(`🔗 Visiting: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 5000)); // Wait for render

        // Generic Scraper (Grab all text blocks that look like posts)
        const data = await page.evaluate(() => {
            // Heuristics for "Cards"
            const potentialCards = [
                ...document.querySelectorAll('div[role="feed"] > div'), // FB
                ...document.querySelectorAll('.job-card-container'), // LinkedIn
                ...document.querySelectorAll('.feed-shared-update-v2') // LinkedIn Feed
            ];
            
            return potentialCards.map(el => el.innerText)
                .filter(t => t.length > 50)
                .slice(0, 5); // Top 5
        });

        console.log(`   -> Found ${data.length} items.`);
        allData.push({ source: url, items: data });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log(`💾 Saved ${allData.length} sources to ${OUTPUT_FILE}`);
    
    console.log('👋 Done. Closing tab (keeping browser open).');
    await page.close();
    browser.disconnect();

  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
})();
