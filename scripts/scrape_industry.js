const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SOURCES_DIR = path.join(__dirname, 'sources');

// Argument Parsing
const args = process.argv.slice(2);
const targetArg = args.find(a => a.startsWith('--target='));
const dryRun = args.includes('--dry-run');

if (!targetArg) {
    console.error('❌ Missing --target argument. Usage: node scrape_industry.js --target=tracks|teams|all');
    process.exit(1);
}

const target = targetArg.split('=')[1];

(async () => {
    console.log(`🚀 Starting Industry Scraper for target: ${target} ${dryRun ? '(DRY RUN)' : ''}`);

    let browser;
    try {
        // Try connecting to existing browser first for speed/debugging
        browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
        console.log('✅ Connected to existing browser.');
    } catch (e) {
        console.log('🌐 Launching new browser...');
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    const page = await browser.newPage();

    // Load Sources
    let sources = [];
    if (target === 'all') {
        sources = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.js')).map(f => require(path.join(SOURCES_DIR, f)));
    } else {
        // Convention: target 'tracks' -> loads sources/tracks_*.js or just checks if a specific file exists
        // For simplicity, let's look for exact matches or prefix matches in the sources dir
        const files = fs.readdirSync(SOURCES_DIR).filter(f => f.includes(target) && f.endsWith('.js'));
        sources = files.map(f => require(path.join(SOURCES_DIR, f)));
    }

    if (sources.length === 0) {
        console.error(`❌ No source scripts found for target: ${target}`);
        await browser.close();
        process.exit(1);
    }

    for (const sourceMod of sources) {
        console.log(`\n🔍 Running Source: ${sourceMod.name}...`);
        try {
            const data = await sourceMod.run(page);
            console.log(`   -> Extracted ${data.length} items.`);

            if (!dryRun) {
                console.log('   💾 Saving to Database...');
                const { error } = await supabase.from('organizations').upsert(data, {
                    onConflict: 'name, location', // Ideally we have a better unique constraint, but this is a start
                    ignoreDuplicates: false
                });

                if (error) console.error('   ❌ DB Error:', error.message);
                else console.log('   ✅ Saved.');
            } else {
                console.log('   Create (DRY RUN):', JSON.stringify(data.slice(0, 2), null, 2));
            }

        } catch (err) {
            console.error(`   ❌ Failed to run source ${sourceMod.name}:`, err.message);
        }
    }

    console.log('\n🏁 Scrape Complete.');
    if (!browser.isConnected()) await browser.close();
    else await page.close();

    // Clean exit
    process.exit(0);
})();
