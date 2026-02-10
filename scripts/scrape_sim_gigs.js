const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'sim_gigs.json');

// High-value targets for "Broken Rigs" / "Need Help"
const TARGETS = [
    { url: 'https://www.facebook.com/groups/iracingsetups', type: 'fb' },
    { url: 'https://www.facebook.com/groups/simracinghardware', type: 'fb' },
    { url: 'https://www.facebook.com/groups/fanatecowners', type: 'fb' }
];

(async () => {
  try {
    console.log('📡 Connecting to Edge (Sim Gig Hunt)...');
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    
    let gigs = [];
    const page = await browser.newPage();

    for (const target of TARGETS) {
        console.log(`🔗 Scanning: ${target.url}`);
        await page.goto(target.url, { waitUntil: 'domcontentloaded' });
        
        // Search within group for pain keywords?
        // Actually, just recent feed is best for immediate response.
        
        console.log('📜 Scrolling for pain...');
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
            await new Promise(r => setTimeout(r, 2000));
        }

        const posts = await page.evaluate(() => {
            const textBlocks = document.body.innerText.split('\n');
            const candidates = [];
            
            let buffer = '';
            textBlocks.forEach(line => {
                if (line.length > 20) buffer += line + '\n';
                if (buffer.length > 200) {
                    // Keyword Filter
                    if (buffer.match(/help|issue|problem|broken|setup|config|cant|won't|error/i)) {
                        candidates.push(buffer);
                    }
                    buffer = '';
                }
            });
            return candidates;
        });

        console.log(`   -> Found ${posts.length} potential leads.`);
        gigs = gigs.concat(posts.map(p => ({ source: target.url, text: p })));
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(gigs, null, 2));
    console.log(`💾 Saved ${gigs.length} gigs to ${OUTPUT_FILE}`);
    
    await page.close();
    browser.disconnect();

  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
})();
