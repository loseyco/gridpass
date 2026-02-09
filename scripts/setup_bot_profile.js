const puppeteer = require('puppeteer');
const path = require('path');

const BOT_PROFILE = path.join(__dirname, '..', 'gridpass_bot_profile');

(async () => {
  console.log('🚀 Launching GridPass Bot Browser...');
  console.log('📂 Profile:', BOT_PROFILE);
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir: BOT_PROFILE,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  await page.goto('https://www.facebook.com');
  
  console.log('🛑 PAUSED. Please log in to Facebook, Discord, etc.');
  console.log('You have 5 minutes before I close this setup window.');
  
  await new Promise(r => setTimeout(r, 300000)); // 5 mins
  await browser.close();
})();
