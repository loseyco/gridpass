const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'facebook_feed.json');

(async () => {
  console.log('📡 Connecting to existing Chrome instance...');
  try {
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    
    console.log('✅ Connected!');
    const pages = await browser.pages();
    // Find the Facebook tab
    const page = pages.find(p => p.url().includes('facebook.com')) || pages[0];
    
    console.log(`📜 Scraping page: ${page.url()}...`);
    
    // Scroll loop
    for (let i = 0; i < 5; i++) {
        process.stdout.write(`Scroll ${i+1}/5... `);
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log('\n');

    console.log('🕷️ Extracting posts...');
    const posts = await page.evaluate(() => {
        const postElements = document.querySelectorAll('div[role="feed"] > div');
        return Array.from(postElements).map(el => {
            return {
                html: el.innerHTML,
                text: el.innerText
            };
        }).filter(p => p.text && p.text.length > 50);
    });

    console.log(`✅ Found ${posts.length} posts.`);
    
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
    console.log(`💾 Saved to ${OUTPUT_FILE}`);
    console.log('👋 Disconnecting...');
    browser.disconnect();

  } catch (err) {
    console.error('❌ Failed to connect.', err.message);
    process.exit(1);
  }
})();
