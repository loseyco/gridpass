const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// CONFIG
// Use your personal Chrome profile (already logged into Facebook, etc.)
const USER_DATA_DIR = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data');
const MESSAGES_URL = 'https://www.facebook.com/messages';
const LOG_FILE = path.join(__dirname, 'facebook_agent_log.txt');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMessage);
}

async function checkMessages(browser) {
    const page = await browser.newPage();

    try {
        log('🔗 Navigating to Facebook Messages...');
        await page.goto(MESSAGES_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait a bit for messages to load
        await new Promise(r => setTimeout(r, 5000));

        log('📬 Checking for unread messages...');

        // Extract unread message count and recent conversations
        const messageData = await page.evaluate(() => {
            // Look for unread indicators (these selectors may need adjustment)
            const unreadBadges = document.querySelectorAll('[aria-label*="unread"], [data-visualcompletion="ignore-dynamic"]');

            // Get conversation list
            const conversations = Array.from(document.querySelectorAll('div[role="row"]')).slice(0, 10).map(conv => {
                return {
                    text: conv.innerText?.substring(0, 200), // First 200 chars
                    isUnread: conv.querySelector('[aria-label*="unread"]') !== null
                };
            });

            return {
                unreadCount: unreadBadges.length,
                conversations: conversations.filter(c => c.text && c.text.length > 10)
            };
        });

        log(`📊 Found ${messageData.unreadCount} potential unread indicators`);
        log(`💬 Recent conversations: ${messageData.conversations.length}`);

        // Log unread messages
        const unreadConvos = messageData.conversations.filter(c => c.isUnread);
        if (unreadConvos.length > 0) {
            log(`⚠️ UNREAD MESSAGES DETECTED (${unreadConvos.length}):`);
            unreadConvos.forEach((conv, i) => {
                log(`  ${i + 1}. ${conv.text.substring(0, 100)}...`);
            });
        } else {
            log('✅ No unread messages detected');
        }

        // Save detailed results to JSON
        const resultsFile = path.join(__dirname, 'facebook_messages_result.json');
        fs.writeFileSync(resultsFile, JSON.stringify(messageData, null, 2));
        log(`💾 Detailed results saved to ${resultsFile}`);

        await page.close();
        return messageData;

    } catch (err) {
        log(`❌ Error checking messages: ${err.message}`);
        await page.close();
        throw err;
    }
}

(async () => {
    let browser;
    try {
        log('🚀 Starting Facebook Message Agent...');

        browser = await puppeteer.launch({
            headless: process.env.PUPPETEER_HEADLESS === 'true', // Headless for scheduled runs
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            userDataDir: USER_DATA_DIR,
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox']
        });

        const result = await checkMessages(browser);

        log('✅ Agent completed successfully');

        // Keep browser open for 10 seconds so you can see the result
        log('👋 Closing in 10 seconds...');
        await new Promise(r => setTimeout(r, 10000));

        await browser.close();
        process.exit(0);

    } catch (err) {
        log(`💥 Fatal error: ${err.message}`);
        if (browser) await browser.close();
        process.exit(1);
    }
})();
