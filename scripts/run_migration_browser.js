const puppeteer = require('puppeteer');

// SQL to run
const fs = require('fs');
const path = require('path');

// Get file from args
const filename = process.argv[2];
if (!filename) {
  console.error('Usage: node scripts/run_migration_browser.js <path_to_sql_file>');
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), filename);
if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const SQL_MIGRATION = fs.readFileSync(filePath, 'utf8');

(async () => {
  try {
    console.log('📡 Connecting to Edge to run SQL...');
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('supabase.com'));

    if (!page) {
      console.log('Opening new Supabase tab...');
      page = await browser.newPage();
      await page.goto('https://supabase.com/dashboard/project/bwpmqsdykumtfusflhri/sql/new', { waitUntil: 'networkidle2' });
    } else {
      await page.bringToFront();
      if (!page.url().includes('/sql')) {
        await page.goto('https://supabase.com/dashboard/project/bwpmqsdykumtfusflhri/sql/new', { waitUntil: 'networkidle2' });
      }
    }

    console.log('💻 Pasting SQL...');

    // Wait for the Monaco editor or text area
    // This selector is tricky, Supabase uses Monaco. 
    // Strategy: Click in the middle, Select All, Type.

    await new Promise(r => setTimeout(r, 5000)); // Wait for loading

    // Simulate user typing (robust)
    await page.keyboard.type(SQL_MIGRATION);

    console.log('▶️ Running Query (Manual click required maybe)...');

    // Try to find the "Run" button. It usually says "Run" or has a play icon.
    // We'll rely on you clicking run if I can't find it, but I'll try.
    // Selector for the "Run" button in Supabase SQL editor is constantly changing.

    console.log('⚠️ PLEASE CLICK "RUN" IN THE BROWSER NOW!');

  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
})();
