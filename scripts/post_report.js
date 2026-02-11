const puppeteer = require('puppeteer');

const DISCORD_URL = 'https://discord.com/channels/1392265020317896734/1392265021307879508';

const REPORT = `**🌅 Daily Standup: 2/11/2026**

**📧 Inbox**
> Tab: Inbox (816) - loseyp@gmail.com - Gmail
> (Detailed email scrape pending v2 upgrade)

**🏎️ Gigs**
- **New Opportunity** (Jason Alder) - Stratus Racing CDL
- **Transport Driver** (Meyer Shank Racing)
- **Drivers Needed** (XO9 Racing)

**📈 Stats**
Total Listings: 3 (Need fresh scrape)`;

(async () => {
    console.log('🎮 [Discord Web] Posting Report...');
    
    let browser;
    try {
        browser = await puppeteer.connect({ 
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null // Use actual window size
        });
    } catch (e) {
        console.error('❌ Failed:', e.message);
        process.exit(1);
    }
    
    // Find Discord
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('discord.com/channels'));
    
    if (page) {
        await page.bringToFront();
    } else {
        page = await browser.newPage();
        await page.goto(DISCORD_URL, { waitUntil: 'networkidle2' });
    }
    
    // Type
    console.log('✍️ Typing...');
    await page.waitForSelector('div[role="textbox"]', { timeout: 10000 });
    await page.click('div[role="textbox"]');
    
    // Chunked typing for stability
    const chunks = REPORT.match(/.{1,100}/g) || [REPORT];
    for (const chunk of chunks) {
         await page.keyboard.type(chunk);
    }
    
    await page.keyboard.press('Enter');
    console.log('✅ Sent.');
    browser.disconnect();

})();

