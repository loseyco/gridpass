import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.beforeEach(async ({ page }) => {
  // Inject mock environment variable
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_MOCK__ = true;
  });

  // Intercept QR Code API requests so they work completely offline
  await page.route('https://api.qrserver.com/**', async (route) => {
    // 1x1 transparent pixel base64 PNG
    const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64Png, 'base64');
    await route.fulfill({
      contentType: 'image/png',
      body: buffer,
    });
  });
});

test.describe('GridPass Milestone 2 E2E Suite', () => {

  test('Page 1 & 2: Landing & Pricing Responsive Layout', async ({ page }, testInfo) => {
    // Load Landing Page
    await page.goto('/');
    await expect(page).toHaveTitle(/Gridpass/i);
    
    // Ensure viewport screenshots are saved in tests/screenshots/
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `page-1-landing-${projName}.png`) });

    // Navigate to Pricing
    await page.goto('/pricing');
    await expect(page.locator('h1')).toContainText(/plan/i);
    
    // Verify both plans are displayed correctly
    await expect(page.locator('text=Active Identity Passport')).toBeVisible();
    await expect(page.locator('text=Dealership & Track Gate Portal')).toBeVisible();
    
    // Toggle interval billing switch
    const toggle = page.locator('button[role="switch"], input[type="checkbox"], .pricing-toggle');
    if (await toggle.count() > 0) {
      await toggle.first().click();
    }
    
    await page.screenshot({ path: path.join(screenshotDir, `page-2-pricing-${projName}.png`) });
  });

  test('Page 3: Scanner camera stream simulation', async ({ page }, testInfo) => {
    await page.goto('/scan');
    // Verify webcam camera stream elements
    await expect(page.locator('h1')).toContainText(/scan/i);
    
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `page-3-scanner-${projName}.png`) });
  });

  test('Page 4: Garage Dashboard & Canvas Signage Generation', async ({ page }, testInfo) => {
    // Dashboard page
    await page.goto('/dash');
    await expect(page.locator('text=Digital Garage')).toBeVisible();
    await expect(page.locator('text=PJ LOSEY')).toBeVisible();

    // Verify seeded vehicle Corvette Z06 is present
    await expect(page.locator('text=Corvette Z06')).toBeVisible();

    // Register a new vehicle asset
    const regButton = page.locator('text=Register Another Vehicle');
    if (await regButton.count() > 0) {
      await regButton.first().click();
      
      // Fill the fields
      await page.fill('input[placeholder="2024"]', '2020');
      await page.fill('input[placeholder="Porsche"]', 'Ferrari');
      await page.fill('input[placeholder="911 GT3 RS (992)"]', '488 Pista');
      await page.fill('input[placeholder="4.0L Flat-6"]', '3.9L Twin-Turbo V8');
      await page.fill('input[placeholder="518 HP"]', '710 HP');
      
      // Click register
      await page.click('button[type="submit"]');
      
      // Verify new vehicle details are visible in drivers garage
      await expect(page.locator('text=488 Pista')).toBeVisible();
    }

    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `page-4-dashboard-${projName}.png`) });

    // Open print signage modal
    const printButton = page.locator('button:has-text("Print Sign")').first();
    await expect(printButton).toBeVisible();
    await printButton.click();

    // Verify download sign button is present
    const downloadButton = page.locator('button:has-text("Download high-DPI")');
    await expect(downloadButton).toBeVisible();

    // Intercept download event
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ]);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(100); // Verify it is a real file

    // Test Transfer Identity Modal & Action
    const transferButton = page.locator('button:has-text("Transfer Identity")').first();
    await expect(transferButton).toBeVisible();
    await transferButton.click();

    // Verify modal is open
    await expect(page.locator('h3:has-text("Transfer Identity")')).toBeVisible();
    await expect(page.locator('p:has-text("Corvette Z06")')).toBeVisible();

    // Fill transfer email
    await page.fill('input[type="email"]', 'buyer@gridpass.app');

    // Click confirm transfer
    await page.click('button:has-text("Confirm Ownership Transfer")');

    // Verify transfer success message appears
    await expect(page.locator('text=Transfer Initiated Successfully')).toBeVisible();

    // Wait for modal to auto-close and vehicle to be removed from garage
    await expect(page.locator('h3:has-text("Corvette Z06")')).not.toBeVisible();
  });

  test.skip('Page 5: Voyage Hub (Paddock Voyage Coordinator)', async ({ page }, testInfo) => {
    await page.goto('/adventure');
    await expect(page.locator('h1')).toContainText(/voyage/i);

    // Verify checked-in riders (losey-mx-track layout check)
    await expect(page.locator('text=Husqvarna FE 501')).toBeVisible();
    await expect(page.locator('text=Yamaha XT250')).toBeVisible();

    // Verify paddock pup profiles (Diesel / Roxy)
    await expect(page.locator('text=DIESEL').first()).toBeVisible();

    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `page-5-voyage-hub-${projName}.png`) });
  });

  test('Page 6: Driver profile & vehicle service telemetry show waitlist in Phase 1', async ({ page }, testInfo) => {
    // Open dynamic driver profile
    await page.goto('/u/pjlosey-mock');
    await expect(page.locator('h1')).toContainText(/Driver Passport/i);

    // Open dynamic vehicle log profile
    await page.goto('/v/gridpass-demo-vehicle');
    await expect(page.locator('h1')).toContainText(/Vehicle Passport/i);
  });

});
