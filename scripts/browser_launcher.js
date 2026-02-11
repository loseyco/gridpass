const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');

puppeteer.use(StealthPlugin());

// Configuration
const CONFIG = {
    // User's actual Chrome profile
    chromeExecutablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    userDataDir: "C:\\Users\\pjlos\\AppData\\Local\\Google\\Chrome\\User Data",
    remoteDebuggingPort: 9222,
    defaultViewport: null,
    headless: false // Always false for user profile to avoid detection/issues
};

/**
 * Launches Chrome with the user's profile, or connects to an existing instance.
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function launchBrowser() {
    console.log('🚀 Initializing Browser...');

    // 1. Try connecting to existing Chrome instance first
    try {
        console.log(`🔌 Attempting to connect to existing Chrome on port ${CONFIG.remoteDebuggingPort}...`);
        const browser = await puppeteer.connect({
            browserURL: `http://127.0.0.1:${CONFIG.remoteDebuggingPort}`,
            defaultViewport: CONFIG.defaultViewport
        });
        console.log('✅ Connected to existing Chrome instance.');
        return browser;
    } catch (e) {
        console.log('ℹ️ Could not connect to existing Chrome. Launching new instance...');
    }

    // 2. Launch new instance with User Profile
    const launchOptions = {
        headless: CONFIG.headless,
        executablePath: CONFIG.chromeExecutablePath,
        userDataDir: CONFIG.userDataDir,
        defaultViewport: CONFIG.defaultViewport,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--start-maximized',
            '--disable-notifications',
            `--remote-debugging-port=${CONFIG.remoteDebuggingPort}` // Enable remote debugging for future connections
        ]
    };

    try {
        console.log(`📂 Using User Profile: ${CONFIG.userDataDir}`);
        const browser = await puppeteer.launch(launchOptions);
        console.log('✅ Launched new Chrome instance with User Profile.');
        return browser;
    } catch (error) {
        if (error.message.includes('EBUSY') || error.message.includes('SingletonLock')) {
            console.error('\n\x1b[31m❌ Error: Could not launch Chrome with user profile because it is locked.\x1b[0m');
            console.error('\x1b[33mTo fix this, either:\x1b[0m');
            console.error(`1. Close ALL Chrome windows and run this script again.`);
            console.error(`2. Launch Chrome manually with remote debugging enabled:`);
            console.error(`   "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=${CONFIG.remoteDebuggingPort}`);
            console.error(`   (Then run this script again)`);
            process.exit(1);
        }
        throw error;
    }
}

module.exports = { launchBrowser, CONFIG };
