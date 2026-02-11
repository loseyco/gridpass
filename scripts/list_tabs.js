const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
        const pages = await browser.pages();
        
        console.log('📑 Open Tabs:');
        for (const page of pages) {
            console.log(`- ${page.url()} (${await page.title()})`);
        }
        
        browser.disconnect();
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
})();
