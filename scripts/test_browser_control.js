const { launchBrowser } = require('./browser_launcher');

(async () => {
    try {
        console.log('🤖 OpenClaw Test Command: Searching Google');

        // 1. Get the browser (connected or new)
        const browser = await launchBrowser();

        // 2. Open a new tab
        const page = await browser.newPage();

        // 3. Navigate
        console.log('🌐 Navigating to Google...');
        await page.goto('https://www.google.com');

        // 4. Perform Action
        console.log('⌨️ Typing search query...');
        // Google's search box usually has name="q"
        const searchInput = await page.waitForSelector('[name="q"]');
        await searchInput.type('Hello OpenClaw! I am browsing with your profile.');
        await new Promise(r => setTimeout(r, 500)); // distinct pause for effect
        await page.keyboard.press('Enter');

        console.log('✅ Search submitted. Check your Chrome window!');
        console.log('ℹ️ Disconnecting from browser session (leaving window open for you to see)...');

        // 5. Disconnect (don't close) so user can see it
        browser.disconnect();

    } catch (e) {
        console.error('❌ Test failed:', e);
        process.exit(1);
    }
})();
