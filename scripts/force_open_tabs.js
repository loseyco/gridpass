const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
        
        // Find existing Google tab or open new one
        const pages = await browser.pages();
        const page = pages[0]; // Reuse first tab
        
        console.log('🔗 Navigating to Gmail...');
        await page.goto('https://mail.google.com', { waitUntil: 'domcontentloaded' });
        
        console.log('🔗 Navigating to Outlook...');
        const page2 = await browser.newPage();
        await page2.goto('https://outlook.live.com/mail/0/', { waitUntil: 'domcontentloaded' });
        
        console.log('✅ Tabs Opened.');
        browser.disconnect();
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
})();
