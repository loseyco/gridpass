const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'streeters_leads.json');
const MEMBERS_URL = 'https://northernillinoisstreeters.org/Members/Members.html';

(async () => {
  try {
    console.log('🕵️‍♂️ Scraping Streeters Members...');
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    const page = await browser.newPage();
    
    await page.goto(MEMBERS_URL, { waitUntil: 'domcontentloaded' });
    
    // Logic: Look for tables, lists, or divs with "Member" info.
    // Based on classic sites, it's likely a table or list of images.
    
    const members = await page.evaluate(() => {
        // Heuristic: Find text blocks that look like "Name - Car"
        // Or images with alt text.
        
        const textNodes = document.body.innerText.split('\n');
        const validLines = textNodes.filter(t => t.length > 5 && t.length < 100);
        
        // This is a "Spray and Pray" scrape. We'll filter later.
        // Better: look for <img> tags and their captions.
        
        const imgs = Array.from(document.querySelectorAll('img'));
        const people = imgs.map(img => {
            // Check for caption or nearby text
            const caption = img.nextElementSibling?.innerText || img.title || img.alt;
            return {
                src: img.src,
                caption: caption
            };
        }).filter(p => p.caption && p.caption.length > 3);
        
        return people;
    });
    
    console.log(`✅ Found ${members.length} potential members.`);
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(members, null, 2));
    console.log(`💾 Saved to ${OUTPUT_FILE}`);
    
    await page.close();
    browser.disconnect();

  } catch (e) {
    console.error('❌ Error:', e.message);
  }
})();
