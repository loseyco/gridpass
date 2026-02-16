const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// CONFIG
const USER_DATA_DIR = path.join(__dirname, '..', 'chrome_automation_profile');
const GRIDPASS_PAGE_URL = 'https://www.facebook.com/gridpassapp';
const LOG_FILE = path.join(__dirname, 'facebook_page_log.txt');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(LOG_FILE, logMessage);
}

async function checkPageActivity(browser) {
    const page = await browser.newPage();

    try {
        log('🔗 Navigating to GridPass Facebook page...');
        await page.goto(GRIDPASS_PAGE_URL, {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });

        // Wait for page to load
        log('⏳ Waiting for page to load...');
        await new Promise(r => setTimeout(r, 5000));

        // Check if we're in page admin mode
        log('🔍 Detecting page admin mode...');

        // Look for page inbox/messages
        const pageData = await page.evaluate(() => {
            // Find inbox/messages link
            const inboxLink = Array.from(document.querySelectorAll('a[href*="inbox"], a[aria-label*="Inbox"], a[aria-label*="Messages"]'))
                .map(el => ({ text: el.innerText, href: el.href }));

            // Find notifications and badges
            const notificationBadges = Array.from(document.querySelectorAll('[role="banner"] [data-visualcompletion="ignore-dynamic"]'))
                .map(el => el.innerText)
                .filter(text => text && /\d+/.test(text)); // Look for numbers

            // Check for "new comment" or "new message" text
            const newActivityText = Array.from(document.querySelectorAll('*'))
                .map(el => el.innerText?.toLowerCase())
                .filter(text => text && (
                    text.includes('new comment') ||
                    text.includes('new message') ||
                    text.includes('unread')
                ))
                .slice(0, 10);

            // Get page posts with comment/like counts
            const posts = Array.from(document.querySelectorAll('[role="article"]')).slice(0, 5)
                .map(post => {
                    const text = post.innerText?.substring(0, 150);
                    const likesMatch = text?.match(/(\d+)\s*(like|reaction)/i);
                    const commentsMatch = text?.match(/(\d+)\s*comment/i);
                    const sharesMatch = text?.match(/(\d+)\s*share/i);

                    return {
                        preview: text?.substring(0, 100),
                        likes: likesMatch ? parseInt(likesMatch[1]) : 0,
                        comments: commentsMatch ? parseInt(commentsMatch[1]) : 0,
                        shares: sharesMatch ? parseInt(sharesMatch[1]) : 0,
                        hasActivity: !!(commentsMatch || likesMatch || sharesMatch)
                    };
                });

            // Look for admin panel indicators
            const isPageAdmin = document.body.innerText?.includes('Page Admin') ||
                document.body.innerText?.includes('Switch back to') ||
                !!document.querySelector('[aria-label*="Page"]');

            return {
                inboxLinks: inboxLink,
                notificationBadges,
                newActivityIndicators: newActivityText,
                recentPosts: posts,
                isPageAdminMode: isPageAdmin,
                pageTitle: document.title
            };
        });

        log(`📄 Page: ${pageData.pageTitle}`);
        log(`👤 Page Admin Mode: ${pageData.isPageAdminMode ? 'YES ✅' : 'NO ❌'}`);
        log(`📬 Inbox links found: ${pageData.inboxLinks.length}`);
        log(`🔔 Notification badges: ${pageData.notificationBadges.join(', ') || 'None'}`);
        log(`📝 Recent posts: ${pageData.recentPosts.length}`);

        // Report activity indicators
        if (pageData.newActivityIndicators.length > 0) {
            log('⚠️ NEW ACTIVITY DETECTED:');
            pageData.newActivityIndicators.forEach((text, i) => {
                log(`  ${i + 1}. ${text.substring(0, 100)}`);
            });
        }

        // Report post engagement
        const postsWithActivity = pageData.recentPosts.filter(p => p.hasActivity);
        if (postsWithActivity.length > 0) {
            log(`💬 Posts with engagement:`);
            postsWithActivity.forEach((post, i) => {
                log(`  ${i + 1}. ${post.comments} comments, ${post.likes} likes, ${post.shares} shares`);
                if (post.preview) log(`     "${post.preview}"`);
            });
        }

        // Save detailed results
        const resultsFile = path.join(__dirname, 'facebook_page_result.json');
        fs.writeFileSync(resultsFile, JSON.stringify(pageData, null, 2));
        log(`💾 Detailed results saved to ${resultsFile}`);

        await page.close();
        return pageData;

    } catch (err) {
        log(`❌ Error checking page: ${err.message}`);
        await page.close();
        throw err;
    }
}

(async () => {
    let browser;
    try {
        log('🚀 Starting GridPass Facebook Page Monitor...');

        log('🚀 Launching Chrome with automation profile...');
        browser = await puppeteer.launch({
            headless: false, // Visible for now
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            userDataDir: USER_DATA_DIR,
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox']
        });

        const result = await checkPageActivity(browser);

        log('✅ Agent completed successfully');
        log('✅ Done. Browser will stay open.');

    } catch (err) {
        log(`💥 Fatal error: ${err.message}`);
        if (browser) await browser.close();
        process.exit(1);
    }
})();
