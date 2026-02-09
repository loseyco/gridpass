const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'master_feed_v2.json');
const ERROR_SCREENSHOT = path.join(__dirname, 'scrape_error.png');

const TARGETS = [
    { url: 'https://www.facebook.com/groups/373733806854468', type: 'fb' },
    { url: 'https://www.facebook.com/groups/566053494035822', type: 'fb' },
    { url: 'https://www.linkedin.com/jobs/search/?keywords=remote%20software%20engineer&refresh=true', type: 'li' }
];

(async () => {
  try {
    console.log('📡 Connecting to Edge...');
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    console.log('✅ Connected!');

    let allData = [];
    const page = await browser.newPage();

    for (const target of TARGETS) {
        console.log(`🔗 Visiting: ${target.url}`);
        await page.goto(target.url, { waitUntil: 'domcontentloaded' });
        
        // Wait for body
        await page.waitForSelector('body');
        
        // Scroll Strategy: Aggressive
        console.log('📜 Scrolling...');
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
            await new Promise(r => setTimeout(r, 1500));
        }

        // Robust Extraction using Accessibility Tree (Semantic)
        const snapshot = await page.accessibility.snapshot();
        
        function findJobs(node) {
            let jobs = [];
            // FB: Posts are often 'article' or generic list items with 'feed'
            // LI: List items
            
            // Heuristic: Look for blocks of text with specific keywords
            if (node.name && (node.name.includes('Hiring') || node.name.includes('Job') || node.name.includes('Opportunity') || node.name.length > 50)) {
                 // Basic text density check
                 jobs.push(node.name);
            }
            
            if (node.children) {
                for (const child of node.children) {
                    jobs = jobs.concat(findJobs(child));
                }
            }
            return jobs;
        }

        // Fallback: Text content if accessibility fails
        const textContent = await page.evaluate(() => document.body.innerText);
        
        // Parse text content for "Job-like" blocks (Regex splitting)
        const blocks = textContent.split(/\n{3,}/).filter(b => b.length > 100 && (b.includes('Hiring') || b.includes('Job') || b.includes('Experience')));

        console.log(`   -> Found ${blocks.length} candidates (Text Method).`);
        
        if (blocks.length === 0) {
            console.log('⚠️ No data found. Taking screenshot...');
            await page.screenshot({ path: ERROR_SCREENSHOT });
        }

        allData.push({ source: target.url, items: blocks });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
    console.log(`💾 Saved to ${OUTPUT_FILE}`);
    
    await page.close();
    browser.disconnect();

  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
})();
