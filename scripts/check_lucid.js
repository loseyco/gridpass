const puppeteer = require('puppeteer');

const URL = 'https://lucidmotors.com/careers/search?location=Chicago%2C+IL%2C+United+States';

(async () => {
  try {
    const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const page = await browser.newPage();
    
    console.log('🔗 Checking Lucid Jobs...');
    await page.goto(URL, { waitUntil: 'networkidle2' });
    
    // Wait for list
    await new Promise(r => setTimeout(r, 5000));
    
    const jobs = await page.evaluate(() => {
        // Look for job items
        // Try common classes or just text lines
        return Array.from(document.querySelectorAll('a[href*="/careers/search/"]'))
            .map(el => el.innerText)
            .filter(t => t.length > 5);
    });
    
    console.log('Job List:', jobs);
    
    browser.disconnect();
  } catch (e) { console.error(e.message); }
})();
