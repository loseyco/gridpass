const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// CONFIG
const USER_DATA_DIR = 'C:\\Users\\pjlos\\AppData\\Local\\Microsoft\\Edge\\User Data';
const GROUP_URL = 'https://www.facebook.com/groups/373733806854468';
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'facebook_feed.json');

(async () => {
  try {
    console.log('🚀 Launching Edge...');
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      userDataDir: USER_DATA_DIR,
      defaultViewport: null,
      args: ['--start-maximized', '--remote-debugging-port=9222']
    });
    
    await runScrape(browser);

  } catch (err) {
    console.log('⚠️ Launch failed (browser likely open). Attempting to connect...');
    try {
        const browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null
        });
        console.log('✅ Connected to existing Edge instance!');
        await runScrape(browser);
    } catch (connErr) {
        console.error('❌ Failed to launch AND failed to connect.', err.message);
        process.exit(1);
    }
  }
})();

async function runScrape(browser) {
  const page = await browser.newPage();
  
  console.log(`🔗 Navigating to ${GROUP_URL}...`);
  await page.goto(GROUP_URL, { waitUntil: 'networkidle2' });

  console.log('👀 Waiting 10s for page load...');
  await new Promise(r => setTimeout(r, 10000));

  console.log('📜 Scrolling...');
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await new Promise(r => setTimeout(r, 2000));
  }

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
  console.log('👋 Done.');
}
