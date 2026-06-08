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
    const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64Png, 'base64');
    await route.fulfill({
      contentType: 'image/png',
      body: buffer,
    });
  });
});

test.describe('Sticker Customizer & Claims Onboarding E2E Suite', () => {

  test('Short-link /qr/[id] redirects to /join?id=[id]', async ({ page }) => {
    await page.goto('/qr/GP-SHORT-LINK-TEST');
    await expect(page).toHaveURL(/.*\/join\?id=GP-SHORT-LINK-TEST/);
  });

  test('Decal Studio & Print Customizer features', async ({ page }, testInfo) => {
    // Navigate to print page with vehicle parameter
    await page.goto('/dash/print?vehicleId=mock-v1');
    
    // Verify vehicle details are loaded
    await expect(page.locator('text=GP-PRNT-Z06MOCK')).toBeVisible();

    // Verify layout options
    const avery94500Btn = page.locator('button:has-text("Round Decals")');
    const avery22806Btn = page.locator('button:has-text("Square Stickers")');
    const keytagBtn = page.locator('button:has-text("Keytag")');
    const windshieldBtn = page.locator('button:has-text("Windshield Spec")');

    await expect(avery94500Btn).toBeVisible();
    await expect(avery22806Btn).toBeVisible();
    await expect(keytagBtn).toBeVisible();
    await expect(windshieldBtn).toBeVisible();

    // Select Round sticker template (Avery 94500) and verify it's the active layout
    await avery94500Btn.click();
    await expect(page.locator('text=GRIDPASS').first()).toBeVisible();

    // Select Square sticker template (Avery 22806)
    await avery22806Btn.click();
    await expect(page.locator('text=GRIDPASS DECAL')).toBeVisible();

    // Select Keytag template
    await keytagBtn.click();
    await expect(page.locator('text=Key Ring Tag')).toBeVisible();

    // Select Windshield Poster template
    await windshieldBtn.click();
    await expect(page.locator('text=GRIDPASS PASSPORT')).toBeVisible();
    await expect(page.locator('text=SPECIFICATIONS')).toBeVisible();
    await expect(page.locator('h1:has-text("Corvette Z06")').first()).toBeVisible();

    // Select Border Themes
    const carbonThemeBtn = page.locator('button:has-text("Carbon")');
    const crimsonThemeBtn = page.locator('button:has-text("Crimson")');
    const goldThemeBtn = page.locator('button:has-text("Gold")');

    await expect(carbonThemeBtn).toBeVisible();
    await expect(crimsonThemeBtn).toBeVisible();
    await expect(goldThemeBtn).toBeVisible();

    // PJ LOSEY mock is supporter, click gold theme should work directly
    await goldThemeBtn.click();
    await expect(page.locator('.gold-glow-ring')).toBeVisible();

    // Action buttons visible
    await expect(page.locator('button:has-text("Print Decal")')).toBeVisible();
    await expect(page.locator('button:has-text("Download Printable File")')).toBeVisible();

    // Take screenshot of customizer layout
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `sticker-customizer-studio-${projName}.png`) });
  });

  test('Claims resolver with unassigned tag displays onboarding and Wi-Fi alert', async ({ page }) => {
    // Navigate to join with new mock tag ID
    await page.goto('/join?id=GP-MOCK-NEW');

    // Verify Wi-Fi helper Connections Alert is visible
    await expect(page.locator('text=Wi-Fi Connection Alert')).toBeVisible();
    await expect(page.locator('text=Wi-Fi sign-in browser detected')).toBeVisible();

    // Since mock user is logged in automatically, verify they see the claim options
    await expect(page.locator('text=My Driver Profile')).toBeVisible();
    await expect(page.locator('text=Register New Vehicle')).toBeVisible();
  });

  test('Gate check clearance view displays flashing border and brightness prompt', async ({ page }) => {
    // Navigate to join with claimed mock tag ID
    await page.goto('/join?id=GP-MOCK-CLAIMED');

    // Verify gate check clearance pass is active
    await expect(page.locator('text=CLEARED — PASS ACTIVE')).toBeVisible();
    await expect(page.locator('text=GATE SCAN PASS')).toBeVisible();

    // Verify flashing border wrapper exists
    const clearanceCard = page.locator('.animate-border-flash');
    await expect(clearanceCard).toBeVisible();
    
    // Verify manual screen brightness prompt
    await expect(page.locator('text=For Instant Scanning')).toBeVisible();
    await expect(page.locator('text=Please manually turn your screen brightness to maximum')).toBeVisible();

    // Verify vehicle specifications are displayed
    await expect(page.locator('text=Corvette Z06')).toBeVisible();
    await expect(page.locator('text=5.5L V8')).toBeVisible();
  });

  test('Public spectator scan of claimed vehicle redirects to vehicle profile page', async ({ page }) => {
    // Navigate to join with claimed mock tag ID but specifying spectator mode (meaning NOT a marshal check-in)
    await page.goto('/join?id=GP-MOCK-CLAIMED&spectator=true');

    // Verify it redirects directly to vehicle profile page instead of displaying the Gate Pass
    await expect(page).toHaveURL(/.*\/v\/mock-v1/);
  });

  test('Claiming a pre-registered wild asset', async ({ page }) => {
    // Navigate to join with unclaimed pre-registered tag ID
    await page.goto('/join?id=GP-MOCK-UNCLAIMED');

    // Verify pre-registered badge is active
    await expect(page.locator('text=Pre-Registered Vehicle Detected')).toBeVisible();
    await expect(page.locator('text=Porsche 911 GT3 RS')).toBeVisible();

    // Claim ownership (mock user is signed in)
    const claimBtn = page.locator('button:has-text("Claim Ownership")');
    await expect(claimBtn).toBeVisible();
    await claimBtn.click();

    // After claiming, verify we are navigated to dashboard
    await expect(page).toHaveURL(/.*\/dash/);
  });

});
