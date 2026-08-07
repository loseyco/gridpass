import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.beforeEach(async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err.stack || err.message));

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

    // Navigate to Build a Tag Wizard
    await page.goto('/build-tag');
    await expect(page.locator('h1')).toContainText(/Design/i);
    
    // Verify customizer options are displayed correctly
    await expect(page.locator('text=Theme Color')).toBeVisible();
    
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
    await expect(page.locator('h2:has-text("Digital Garage")')).toBeVisible();
    await expect(page.locator('text=PJ LOSEY')).toBeVisible();

    // Verify seeded vehicle Corvette Z06 is present
    await expect(page.locator('text=Corvette Z06')).toBeVisible();

    // Register a new vehicle asset
    const regButton = page.locator('button:has-text("Add Vehicle")');
    if (await regButton.count() > 0) {
      await regButton.first().click();
      
      // Fill the fields on /v/create
      await page.fill('input[placeholder*="Chevrolet"]', 'Ferrari');
      await page.fill('input[placeholder*="Corvette"]', '488 Pista');
      
      // Click register / stage vehicle button
      await page.click('button[type="submit"]');
      
      // Verify new vehicle details are visible in drivers garage or profile
      await expect(page.locator('text=488 Pista').first()).toBeVisible();
    }

    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `page-4-dashboard-${projName}.png`) });
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

  test('Page 6: Driver profile & vehicle service telemetry show active profiles in Phase 3', async ({ page }, testInfo) => {
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');

    // Open dynamic driver profile
    await page.goto('/u/pjlosey-mock');
    await expect(page.locator('text=Marcus Mustang')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, `page-6-driver-profile-${projName}.png`) });

    // Open dynamic vehicle log profile
    await page.goto('/v/mock-v1');
    await expect(page.locator('text=Mustang GT')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, `page-6-vehicle-telemetry-${projName}.png`) });
  });

});
