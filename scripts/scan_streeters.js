const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
        const page = await browser.newPage();
        
        console.log('🕵️‍♂️ Scanning Northern Illinois Streeters...');
        await page.goto('http://northernillinoisstreeters.org', { waitUntil: 'domcontentloaded' });
        
        // Find links
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => a.href);
        });
        
        console.log('🔗 Found Links:', links);
        
        // Check Contact Page if exists
        const contactLink = links.find(l => l.includes('contact') || l.includes('officers') || l.includes('members'));
        if (contactLink) {
            console.log(`➡️ Visiting ${contactLink}`);
            await page.goto(contactLink);
            const text = await page.evaluate(() => document.body.innerText);
            console.log('📄 Content snippet:', text.substring(0, 500));
        }

        browser.disconnect();
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
})();
