const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const USER_DATA_DIR = path.join(__dirname, '..', 'chrome_automation_profile');
const FACEBOOK_PAGE_URL = 'https://www.facebook.com/gridpassapp';
const LOG_FILE = path.join(__dirname, 'gridpass_facebook_bot_log.txt');

function log(message) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`);
}

async function getNewMembers() {
    const announcedFile = path.join(__dirname, 'announced_members.json');
    let announced = fs.existsSync(announcedFile) ? JSON.parse(fs.readFileSync(announcedFile, 'utf8')) : [];
    const announcedUsernames = new Set(announced.map(a => a.username));

    const mockMembers = [{ username: 'newracer123', name: 'John Doe', created_at: new Date().toISOString() }];
    const newMembers = mockMembers.filter(m => !announcedUsernames.has(m.username));

    log(`📊 ${newMembers.length} new members to announce`);
    return newMembers;
}

async function postToFacebook(browser, member) {
    const page = await browser.newPage();

    try {
        log('🔗 Navigating...');
        await page.goto(FACEBOOK_PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await new Promise(r => setTimeout(r, 6000));

        // STRATEGY: Click the "Create" button or photo/video upload area instead of text
        // This avoids comment boxes entirely
        log('✍️ Looking for Create/Post button...');

        const clicked = await page.evaluate(() => {
            // Try multiple strategies

            // Strategy 1: Look for "Photo/video" or "Create" buttons (unique to main composer)
            const buttons = document.querySelectorAll('div[role="button"], span[role="button"]');
            for (const btn of buttons) {
                const text = (btn.textContent || '').toLowerCase();
                if (text.includes('photo') && text.includes('video') && btn.offsetParent) {
                    btn.click();
                    return 'Clicked Photo/Video button';
                }
            }

            // Strategy 2: Look for the post composer form/textbox that's NOT inside an article
            const textboxes = document.querySelectorAll('[contenteditable="true"], [role="textbox"]');
            for (const box of textboxes) {
                // Make sure it's NOT inside a post article (which would be a comment box)
                const insideArticle = box.closest('[role="article"]');
                const rect = box.getBoundingClientRect();

                if (!insideArticle && rect.top < window.innerHeight * 0.5 && box.offsetParent) {
                    box.click();
                    return `Clicked top textbox at Y=${Math.round(rect.top)}`;
                }
            }

            return null;
        });

        if (!clicked) {
            await page.screenshot({ path: path.join(__dirname, 'composer_fail.png'), fullPage: true });
            throw new Error('Could not find post composer');
        }

        log(`✅ ${clicked}`);
        await new Promise(r => setTimeout(r, 3000));

        // Type the message
        const postText = `🎉 Welcome to GridPass, ${member.name}!\n\nCheck out their profile: https://gridpass.app/u/${member.username}\n\n#GridPass #Motorsports #NewMember`;

        log('📝 Typing...');
        await page.keyboard.type(postText, { delay: 30 });
        await new Promise(r => setTimeout(r, 2000));

        await page.screenshot({ path: path.join(__dirname, 'draft.png') });

        // Click Post - try multiple strategies with retries
        log('📤 Looking for Post button...');
        let posted = false;

        // Wait a moment for button to become enabled
        await new Promise(r => setTimeout(r, 2000));

        // Strategy 1: Find by text "Post"
        posted = await page.evaluate(() => {
            const buttons = document.querySelectorAll('div[role="button"], button, span[role="button"]');
            for (const btn of buttons) {
                const text = (btn.textContent || '').trim();
                const disabled = btn.getAttribute('aria-disabled') === 'true' || btn.hasAttribute('disabled');
                if (text === 'Post' && !disabled && btn.offsetParent) {
                    btn.click();
                    return true;
                }
            }
            return false;
        });

        if (!posted) {
            log('⏩ Strategy 1 failed, trying aria-label...');
            // Strategy 2: Find by aria-label
            posted = await page.evaluate(() => {
                const buttons = document.querySelectorAll('[aria-label*="Post"], [aria-label*="Publish"]');
                for (const btn of buttons) {
                    if (btn.getAttribute('aria-disabled') !== 'true' && btn.offsetParent) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            });
        }

        if (!posted) {
            log('⏩ Strategy 2 failed, trying Puppeteer click...');
            // Strategy 3: Use Puppeteer's click
            try {
                const postBtn = await page.$('div[role="button"]:has-text("Post")');
                if (postBtn) {
                    await postBtn.click();
                    posted = true;
                }
            } catch (e) {
                log(`⏩ Puppeteer click failed: ${e.message}`);
            }
        }

        if (posted) {
            log('✅ Post button clicked successfully!');
            await new Promise(r => setTimeout(r, 3000));
        } else {
            await page.screenshot({ path: path.join(__dirname, 'post_button_missing.png'), fullPage: true });
            log('⚠️ Could not find Post button - screenshot saved');
            log('ℹ️ Please click Post manually');
        }

        // Save
        const announcedFile = path.join(__dirname, 'announced_members.json');
        let announced = fs.existsSync(announcedFile) ? JSON.parse(fs.readFileSync(announcedFile, 'utf8')) : [];
        announced.push({ username: member.username, announced_at: new Date().toISOString() });
        fs.writeFileSync(announcedFile, JSON.stringify(announced, null, 2));

        log(`✅ Announced ${member.username}`);
        await page.close();
        return true;

    } catch (err) {
        log(`❌ ${err.message}`);
        await page.close();
        return false;
    }
}

(async () => {
    let browser;
    try {
        log('🚀 Starting...');
        const newMembers = await getNewMembers();
        if (newMembers.length === 0) { log('ℹ️ No new members'); process.exit(0); }

        browser = await puppeteer.launch({
            headless: false,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            userDataDir: USER_DATA_DIR,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--window-size=1920,1080', '--no-sandbox']
        });

        for (const member of newMembers) {
            await postToFacebook(browser, member);
        }

        const pages = await browser.pages();
        for (const p of pages) await p.close();
        log('✅ Done!');

    } catch (err) {
        log(`💥 ${err.message}`);
        if (browser) await browser.close();
        process.exit(1);
    }
})();
