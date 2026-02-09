const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// CONFIG
// Use a temp profile relative to the script to avoid locks
const USER_DATA_DIR = path.join(__dirname, '..', 'temp_chrome_profile'); 
const GROUP_URL = 'https://www.facebook.com/groups/373733806854468';
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'facebook_feed.json');

// Reusable scraping logic
async function runScrape(browser) {
  const page = await browser.newPage();
  
  console.log(`🔗 Navigating to ${GROUP_URL}...`);
  await page.goto(GROUP_URL, { waitUntil: 'networkidle2' });

  // Wait for user to ensure login if needed
  console.log('👀 Waiting 60s for MANUAL LOGIN (if needed)...');
  await new Promise(r => setTimeout(r, 60000));

  console.log('📜 Scrolling to load posts...');
  // Scroll a bit to trigger lazy loading
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('🕷️ Extracting posts...');
  const posts = await page.evaluate(() => {
    const postElements = document.querySelectorAll('div[role="feed"] > div');
    return Array.from(postElements).map(el => {
        // Basic extraction - this selector is brittle and changes often on FB
        // We'll grab all text for now and parse with LLM later
        return {
            html: el.innerHTML,
            text: el.innerText
        };
    }).filter(p => p.text && p.text.length > 50); // Filter empty/short
  });

  console.log(`✅ Found ${posts.length} posts.`);
  
  // Ensure directory exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
  console.log(`💾 Saved to ${OUTPUT_FILE}`);

  // Keep browser open for a bit so you can see
  console.log('👋 Done. Leaving browser open for inspection.');
}

(async () => {
  try {
    console.log('🚀 Launching Chrome with TEMP profile...');
    const browser = await puppeteer.launch({
      headless: false, // Visible!
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      userDataDir: USER_DATA_DIR,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    await runScrape(browser);

  } catch (err) {
    console.error('❌ Failed to launch:', err.message);
  }
})();
