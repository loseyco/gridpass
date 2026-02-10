const puppeteer = require('puppeteer');
const path = require('path');

const BOT_PROFILE = path.join(__dirname, '..', '..', 'gridpass_bot_profile');

(async () => {
  console.log('🚀 Launching Browser for Login...');
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir: BOT_PROFILE,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page1 = await browser.newPage();
  const page2 = await browser.newPage();
  
  console.log('🔗 Opening Gmail...');
  await page1.goto('https://mail.google.com', { timeout: 0 });
  
  console.log('🔗 Opening Outlook...');
  await page2.goto('https://outlook.live.com/mail/0/', { timeout: 0 });
  
  console.log('🛑 Waiting for you to log in...');
  console.log('You have 10 minutes.');
  
  await new Promise(r => setTimeout(r, 600000)); // 10 mins
  await browser.close();
})();
