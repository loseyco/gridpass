const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });
    console.log('✅ Connected to Edge!');
    
    const pages = await browser.pages();
    
    // 1. Find Supabase Tab
    const sbPage = pages.find(p => p.url().includes('supabase.com'));
    if (sbPage) {
        console.log('found Supabase tab:', sbPage.url());
        await sbPage.bringToFront();
        
        // Wait for user to navigate to API keys page if not there
        // Or extract if there
        const keys = await sbPage.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input[readonly]'));
            return inputs.map(i => i.value).filter(v => v.startsWith('sbp_') || v.startsWith('ey') || v.includes('supabase.co'));
        });
        
        console.log('Found keys:', keys);
        if (keys.length > 0) {
            fs.writeFileSync('src/data/keys.json', JSON.stringify(keys));
        }
    }

    // 2. Find Vercel Tab
    const vercelPage = pages.find(p => p.url().includes('vercel.com'));
    if (vercelPage) {
        console.log('found Vercel tab:', vercelPage.url());
        await vercelPage.bringToFront();
        // Vercel env vars are usually in Settings -> Environment Variables
    }

  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
})();
