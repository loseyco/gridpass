const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, '..', 'insert_pjlosey_services.sql');

(async () => {
  try {
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    console.log('📡 Connecting to Edge to FORCE run SQL...');

    // Connect to existing browser (assuming it's still open on port 9222)
    // If not, we might need to relaunch, but let's try connect first
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('supabase.com'));

    if (!page) {
      console.log('Opening Supabase SQL Editor...');
      page = await browser.newPage();
    } else {
      await page.bringToFront();
    }

    // Navigate specifically to the SQL Editor
    await page.goto('https://supabase.com/dashboard/project/wonlunpmgsnxctvgozva/sql/new', { waitUntil: 'networkidle2' });

    console.log('⏳ Waiting for Monaco Editor...');
    // The class for the editor line is usually .view-lines
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // Focus and Paste
    console.log('🖊️ Typing SQL...');
    await page.click('.monaco-editor');

    // We'll use clipboard API or typing. Typing is safer but slow for big files.
    // Let's try clipboard if possible, or chunked typing.
    // Actually, setting value via JS is best if we can access the monaco instance.
    // Fallback: Type it fast.

    // Chunk it to avoid lag
    const chunks = sqlContent.match(/.{1,100}/g);
    for (const chunk of chunks) {
      await page.keyboard.sendCharacter(chunk); // sendCharacter is faster than type
    }

    console.log('▶️ Looking for Run button...');
    // Try to find the "Run" button by text content
    const runButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Run') || b.textContent.includes('Run'));
    });

    if (runButton) {
      console.log('👇 Clicking Run...');
      await runButton.click();
      console.log('✅ Clicked!');
    } else {
      console.error('❌ Could not find Run button. Please click it manually.');
    }

    // Keep open for verification
    // browser.disconnect();

  } catch (err) {
    console.error('❌ Automation Failed:', err.message);
  }
})();
