const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'remote_leads.json');

// Broader target list for Remote work
const TARGETS = [
    { url: 'https://www.indeed.com/jobs?q=remote+part+time&l=Remote', type: 'indeed' },
    { url: 'https://www.facebook.com/groups/242626576392345', type: 'fb' }, // "Remote Job Seekers" (Example Group ID)
    { url: 'https://www.facebook.com/groups/WorkFromHomeJobsUS', type: 'fb' },
    { url: 'https://www.linkedin.com/jobs/search/?keywords=remote%20technical%20support&refresh=true', type: 'li' }
];

(async () => {
  try {
    console.log('📡 Connecting to Edge...');
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    console.log('✅ Connected!');

    let leads = [];
    const page = await browser.newPage();

    for (const target of TARGETS) {
        console.log(`🔗 Scanning: ${target.url}`);
        
        try {
            await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Scroll to trigger load
            console.log('📜 Scrolling...');
            for (let i = 0; i < 3; i++) {
                await page.evaluate(() => window.scrollBy(0, window.innerHeight));
                await new Promise(r => setTimeout(r, 1500));
            }

            // Generic Text Extractor (Robust)
            const textBlocks = await page.evaluate(() => {
                // Get all text nodes, split by newlines, filter short ones
                return document.body.innerText
                    .split('\n')
                    .map(s => s.trim())
                    .filter(s => s.length > 30 && (
                        s.toLowerCase().includes('remote') || 
                        s.toLowerCase().includes('hiring') || 
                        s.toLowerCase().includes('hourly') ||
                        s.toLowerCase().includes('salary')
                    ));
            });

            console.log(`   -> Found ${textBlocks.length} text blocks.`);
            
            // Filter blocks for likely job titles/descriptions
            const potentialJobs = textBlocks.slice(0, 15); // Top 15 relevant lines
            leads.push({ source: target.url, content: potentialJobs });

        } catch (e) {
            console.error(`   ❌ Error scanning ${target.url}:`, e.message);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(leads, null, 2));
    console.log(`💾 Saved leads to ${OUTPUT_FILE}`);
    
    await page.close();
    // browser.disconnect(); // Keep connection open?

  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
})();
