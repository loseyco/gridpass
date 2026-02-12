const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'streeters_resources.json');
const URL = 'https://northernillinoisstreeters.org/Resource/Resources.html';

(async () => {
  try {
    console.log('🕵️‍♂️ Scraping Streeters Resources...');
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    const page = await browser.newPage();
    
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    
    const resources = await page.evaluate(() => {
        // Find all external links
        const links = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href && !a.href.includes('northernillinoisstreeters.org'));
            
        return links.map(a => ({
            name: a.innerText.trim() || 'Unknown',
            url: a.href
        }));
    });
    
    console.log(`✅ Found ${resources.length} resources.`);
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resources, null, 2));
    console.log(`💾 Saved to ${OUTPUT_FILE}`);
    
    await page.close();
    browser.disconnect();

  } catch (e) { console.error('❌ Error:', e.message); }
})();
