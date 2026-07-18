const { chromium } = require('@playwright/test');
const path = require('path');

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Desktop view
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/guides/north-point-marina-boating-pwc-guide');
  await page.waitForTimeout(2000); // Wait for page hydration and renders
  await page.screenshot({ path: 'C:/Users/pjlos/.gemini/antigravity/brain/3a7729ba-e7d8-41e1-87e7-c7ae7a2e53e3/desktop_guide.png', fullPage: false });
  console.log('Desktop screenshot captured.');

  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000/guides/north-point-marina-boating-pwc-guide');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/pjlos/.gemini/antigravity/brain/3a7729ba-e7d8-41e1-87e7-c7ae7a2e53e3/mobile_guide.png', fullPage: false });
  console.log('Mobile screenshot captured.');

  await browser.close();
}

run().catch(console.error);
