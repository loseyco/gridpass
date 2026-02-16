const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// CONFIG
// Use dedicated automation profile (first run: login manually, then it's saved)
const USER_DATA_DIR = path.join(__dirname, '..', 'chrome_automation_profile');
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
        await page.goto(MESSAGES_URL, {
            waitUntil: 'domcontentloaded', // Less strict than networkidle2
            timeout: 90000 // 90 seconds
        });

        // Wait for manual login if needed (first run)
        log('⏳ Waiting 60 seconds for manual login (if needed)...');
        await new Promise(r => setTimeout(r, 60000));

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

        log('🚀 Launching Chrome with automation profile...');
        browser = await puppeteer.launch({
            headless: false, // Always visible
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            userDataDir: USER_DATA_DIR,
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox']
        });
        const result = await checkMessages(browser);

        log('✅ Agent completed successfully');

        // Don't close browser in visible mode - user might want to see results or log in
        log('✅ Done. Browser will stay open.');

    } catch (err) {
        log(`💥 Fatal error: ${err.message}`);
        if (browser) await browser.close();
        process.exit(1);
    }
})();
