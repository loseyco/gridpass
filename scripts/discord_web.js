const puppeteer = require('puppeteer');
const fs = require('fs');

// TARGET: GridPass Server -> General
const DISCORD_URL = 'https://discord.com/channels/1392265020317896734/1392265021307879508';

(async () => {
    console.log('🎮 [Discord Web] Connecting...');
    
    let browser;
    try {
        browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
        console.log('✅ Connected.');
    } catch (e) {
        console.error('❌ Failed to connect to browser:', e.message);
        process.exit(1);
    }
    
    // Find or Open Discord Tab
    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('discord.com/channels'));
    
    if (page) {
        console.log('Found Discord tab:', page.url());
        await page.bringToFront();
    } else {
        console.log('Opening Discord...');
        page = await browser.newPage();
        await page.goto(DISCORD_URL, { waitUntil: 'networkidle2' });
    }
    
    // 1. READ MESSAGES (Scrape DOM)
    console.log('📜 Reading Chat...');
    // Discord classes are obfuscated. We use aria-labels and roles.
    const messages = await page.evaluate(() => {
        const msgElements = document.querySelectorAll('li[id^="chat-messages-"]'); // Reliable selector
        return Array.from(msgElements).map(el => {
            const author = el.querySelector('h3 span')?.innerText || 'Unknown';
            const content = el.querySelector('div[id^="message-content"]')?.innerText || '';
            return { author, content };
        }).slice(-5); // Last 5
    });
    
    console.log('Recent Messages:', messages);
    
    // 2. POST UPDATE (Example)
    const update = "**[Auto]** Chase is now connected via Web Client. Monitoring #general.";
    
    console.log('✍️ Typing...');
    // Focus text area
    await page.click('div[role="textbox"]');
    await page.keyboard.type(update);
    await page.keyboard.press('Enter');
    
    console.log('✅ Sent.');
    
    // 3. LISTEN LOOP (Future: Keep script running)
    // For now, we exit.
    browser.disconnect();

})();
