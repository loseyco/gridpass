const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    
    // Open Outlook and Hotmail in new tabs
    const pageOutlook = await browser.newPage();
    await pageOutlook.goto('https://outlook.live.com/mail/0/', { timeout: 0 });
    
    const pageHotmail = await browser.newPage();
    await pageHotmail.goto('https://outlook.live.com/mail/1/', { timeout: 0 }); // Might be same inbox if aliases, but opening both.

    console.log('✅ Tabs opened. Waiting for user login...');
    
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
})();
