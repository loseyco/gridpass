const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');

puppeteer.use(StealthPlugin());

const BOT_PROFILE = path.join(__dirname, '..', '..', 'gridpass_bot_profile');

(async () => {
  console.log('🚀 Launching Stealth Bot Browser...');
  console.log('📂 Profile:', BOT_PROFILE);
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir: BOT_PROFILE,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  console.log('🔗 Going to Facebook...');
  await page.goto('https://www.facebook.com');
  
  console.log('🛑 PLEASE LOG IN NOW. Cookies will be saved.');
  console.log('You have 5 mins.');
  
  await new Promise(r => setTimeout(r, 300000));
  await browser.close();
})();
