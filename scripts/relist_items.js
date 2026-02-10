const puppeteer = require('puppeteer');
const path = require('path');

// Configuration
const ITEMS = [
    'https://www.facebook.com/marketplace/item/1050290677044683/',
    'https://www.facebook.com/marketplace/item/1002692365281018/', // Resolved redirect for 16zmkK4i6f
    'https://www.facebook.com/marketplace/item/950235333844133/'   // Resolved redirect for 188NZfMKbQ
];
const TARGET_LOCATION = 'Grayslake, Illinois';
const USER_DATA_DIR = path.join(__dirname, '..', 'temp_chrome_profile');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log('🚀 Starting Relist Agent...');
    console.log(`Using Profile: ${USER_DATA_DIR}`);

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: USER_DATA_DIR,
        defaultViewport: null,
        args: ['--start-maximized', '--disable-notifications']
    });

    const page = await browser.newPage();

    for (const url of ITEMS) {
        console.log(`\n👉 Processing: ${url}`);

        try {
            await page.goto(url, { waitUntil: 'networkidle2' });
            await delay(3000);

            // 1. Check if we can EDIT the listing
            // Look for "Edit listing" button
            // Note: Selectors are tricky. We'll try aria-labels and text.
            const editButton = await page.evaluateHandle(() => {
                const buttons = Array.from(document.querySelectorAll('div[role="button"], span[role="button"]'));
                return buttons.find(b => b.innerText.includes('Edit listing') || b.getAttribute('aria-label') === 'Edit listing');
            });

            if (editButton && editButton.asElement()) {
                console.log('   ✅ Found "Edit listing" button. Clicking...');
                await editButton.click();
                await delay(5000); // Wait for modal

                // 2. Find Location Input
                // Usually an input with aria-label="Location" or similar
                console.log('   🔍 Searching for Location input...');

                // We might need to click "Next" if it's a multi-step wizard, but usually Update is single page or sidebar.
                // Let's try to find the input directly.
                await page.waitForSelector('label[aria-label="Location"], input[aria-label="Location"]', { timeout: 5000 }).catch(() => console.log('   ⚠️ Location input not found immediately.'));

                const locationInput = await page.$('label[aria-label="Location"] input, input[aria-label="Location"]');

                if (locationInput) {
                    console.log('   ✅ Found Location input. Updating...');

                    // Clear and Type
                    await locationInput.click();
                    await page.keyboard.down('Control');
                    await page.keyboard.press('A');
                    await page.keyboard.up('Control');
                    await page.keyboard.press('Backspace');
                    await delay(500);

                    await page.keyboard.type(TARGET_LOCATION, { delay: 100 });
                    await delay(2000);

                    // Select the first suggestion
                    await page.keyboard.press('ArrowDown');
                    await delay(500);
                    await page.keyboard.press('Enter');
                    console.log('   📍 Selected new location.');
                    await delay(2000);

                    // 3. Save / Update
                    const updateButton = await page.evaluateHandle(() => {
                        const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
                        return buttons.find(b => b.innerText === 'Update' || b.innerText === 'Save');
                    });

                    if (updateButton && updateButton.asElement()) {
                        console.log('   💾 Clicking Update...');
                        await updateButton.click();
                        await delay(5000); // Wait for save
                        console.log('   🎉 Listing updated successfully!');
                    } else {
                        console.log('   ❌ Could not find "Update" button.');
                    }

                } else {
                    console.log('   ❌ Could not find Location input field in Edit mode.');
                }

            } else {
                console.log('   ❌ "Edit listing" button not found. You might not be the owner or not logged in.');
                // Debug: Take screenshot
                await page.screenshot({ path: `debug_fail_${Date.now()}.png` });
            }

        } catch (e) {
            console.error(`   🚨 Error processing Item: ${e.message}`);
        }
    }

    console.log('\n🏁 Process Complete.');
    // await browser.close(); // Keep open for verification
}

run();
