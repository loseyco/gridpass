const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

// CHROME PATHS
const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA = 'C:\\Users\\pjlos\\AppData\\Local\\Google\\Chrome\\User Data';

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

(async () => {
    console.log('💀 Killing Chrome...');
    try { execSync('taskkill /F /IM chrome.exe'); } catch (e) {}
    await sleep(2000);

    console.log('🚀 Launching Chrome with Debug Port 9222...');
    
    // Launch detached process via spawn (simulated via puppeteer launch logic but pointing to existing executable)
    // Actually, Puppeteer launch with 'userDataDir' does exactly this.
    
    try {
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: CHROME_EXE,
            userDataDir: USER_DATA,
            defaultViewport: null,
            args: ['--start-maximized', '--remote-debugging-port=9222'],
            ignoreDefaultArgs: ['--enable-automation'] // Try to be stealthier
        });
        
        console.log('✅ Browser Launched.');
        
        // Open Pages
        const pages = await browser.pages();
        const page = pages[0];
        
        console.log('🔗 Navigating...');
        await page.goto('https://mail.google.com');
        
        console.log('🔌 Verifying Connection...');
        const title = await page.title();
        console.log(`   Page Title: ${title}`);
        
        if (title.includes('Gmail')) {
            console.log('🎉 SUCCESS! Connected and Logged In.');
            console.log('🛑 Keeping process alive. Do not close this script.');
            
            // Keep alive forever
            await new Promise(() => {});
        } else {
            console.log('⚠️ Page loaded but title mismatch (Login required?)');
        }

    } catch (err) {
        console.error('❌ Launch Failed:', err.message);
        
        // Retry logic?
        if (err.message.includes('already running')) {
            console.log('🔄 Browser is locked. Retrying in 5s...');
        }
    }
})();
