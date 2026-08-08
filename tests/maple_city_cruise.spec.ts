import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.beforeEach(async ({ page }) => {
  // Inject mock environment flag and mock user for Playwright E2E test runs
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_MOCK__ = true;
    (window as any).__MOCK_USER__ = {
      uid: 'pjlosey',
      email: 'driver@gridpass.app',
      displayName: 'PJ LOSEY'
    };
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

test.describe('Maple City Cruise Event Page E2E Visual Tests', () => {

  const ensureScreenshotDir = () => {
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    return screenshotDir;
  };

  test('Page Load & Tab Navigation (HUB, MAP, PASSES, GRID, CHAT)', async ({ page }, testInfo) => {
    const screenshotDir = ensureScreenshotDir();
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');

    // 1. Initial Page Load (HUB Tab)
    await page.goto('/events/maple-city-cruise');
    const pageHeading = page.locator('h1').first();
    await expect(pageHeading).toBeVisible({ timeout: 15000 });
    
    // Screenshot: Hub Tab
    await page.screenshot({ path: path.join(screenshotDir, `maple-city-cruise-1-hub-${projName}.png`) });

    // 2. Click MAP Tab
    const mapTabBtn = page.locator('button').filter({ hasText: /^MAP$/i }).first();
    await expect(mapTabBtn).toBeVisible();
    await mapTabBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, `maple-city-cruise-2-map-${projName}.png`) });

    // 3. Click PASSES Tab
    const passesTabBtn = page.locator('button').filter({ hasText: /^PASSES$/i }).first();
    await expect(passesTabBtn).toBeVisible();
    await passesTabBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('h3:has-text("My Event Passes")').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotDir, `maple-city-cruise-3-passes-${projName}.png`) });

    // 4. Click GRID (Entrants) Tab
    const gridTabBtn = page.locator('button').filter({ hasText: /^GRID$/i }).first();
    await expect(gridTabBtn).toBeVisible();
    await gridTabBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, `maple-city-cruise-4-grid-${projName}.png`) });

    // 5. Click CHAT (Discussion) Tab
    const chatTabBtn = page.locator('button').filter({ hasText: /^CHAT$/i }).first();
    await expect(chatTabBtn).toBeVisible();
    await chatTabBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, `maple-city-cruise-5-chat-${projName}.png`) });

    // 6. Return to HUB Tab
    const hubTabBtn = page.locator('button').filter({ hasText: /^HUB$/i }).first();
    await expect(hubTabBtn).toBeVisible();
    await hubTabBtn.click();
    await page.waitForTimeout(300);
  });

  test('Pass Claims Flow & Claim Organizer Ownership View', async ({ page }, testInfo) => {
    const screenshotDir = ensureScreenshotDir();
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');

    await page.goto('/events/maple-city-cruise?tab=passes');
    await expect(page.locator('h3:has-text("My Event Passes")').first()).toBeVisible({ timeout: 15000 });

    // Navigate to Claim Organizer Ownership view
    const claimOrgBtn = page.locator('button:has-text("Claim Official Organizer Ownership")')
      .or(page.locator('a:has-text("Claim Official Organizer Ownership")'))
      .first();

    if (await claimOrgBtn.count() > 0) {
      await claimOrgBtn.click();
      await page.waitForTimeout(500);
      
      const claimHeader = page.locator('h2:has-text("Claim Official Organizer Ownership")').first();
      await expect(claimHeader).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: path.join(screenshotDir, `maple-city-cruise-6-claim-page-${projName}.png`) });

      // Verify Organizer Claim form inputs are interactive
      const roleInput = page.locator('input[placeholder*="Club President"]').first();
      if (await roleInput.count() > 0) {
        await roleInput.fill('Event Director / Promoter');
        await expect(roleInput).toHaveValue('Event Director / Promoter');
      }
    }
  });

  test('Modal Popups Verification (Register Modal, Dash Pass Modal, Share Modal)', async ({ page }, testInfo) => {
    const screenshotDir = ensureScreenshotDir();
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');

    await page.goto('/events/maple-city-cruise?tab=passes');
    await expect(page.locator('h3:has-text("My Event Passes")').first()).toBeVisible({ timeout: 15000 });

    // 1. Trigger Vehicle Registration Modal via "Register Another Vehicle" on Passes tab
    const regModalBtn = page.locator('button:has-text("Register Another Vehicle")').first();
    if (await regModalBtn.count() > 0) {
      await regModalBtn.click();
      await page.waitForTimeout(500);

      const modalHeading = page.locator('h3:has-text("Add Vehicle Pass to Event")').first();
      await expect(modalHeading).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: path.join(screenshotDir, `maple-city-cruise-modal-register-${projName}.png`) });

      // Close modal
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      if (await cancelBtn.count() > 0) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    } else {
      // Fallback: trigger register vehicle sub-tab
      const joinVehicleBtn = page.locator('button:has-text("+ Join Vehicle")').first();
      if (await joinVehicleBtn.count() > 0) {
        await joinVehicleBtn.click();
        await page.waitForTimeout(500);
        await expect(page.locator('h2:has-text("Register Vehicle Pass for Event")').first()).toBeVisible({ timeout: 5000 });
        await page.screenshot({ path: path.join(screenshotDir, `maple-city-cruise-modal-register-${projName}.png`) });
      }
    }

    // Return to Passes Tab
    await page.goto('/events/maple-city-cruise?tab=passes');
    await expect(page.locator('h3:has-text("My Event Passes")').first()).toBeVisible({ timeout: 15000 });

    // 2. Trigger Print Windshield Dash Pass Modal
    const printPassBtn = page.locator('button:has-text("Print Gridpass")').first();
    if (await printPassBtn.count() > 0) {
      await printPassBtn.click();
      await page.waitForTimeout(500);

      const dashPassHeader = page.locator('h3:has-text("8.5x11 Display Pass Preview")').first();
      await expect(dashPassHeader).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: path.join(screenshotDir, `maple-city-cruise-modal-dashpass-${projName}.png`) });

      // Close modal
      const closeDashPass = page.locator('button:has-text("Close")').first();
      if (await closeDashPass.count() > 0) {
        await closeDashPass.click();
        await page.waitForTimeout(300);
      }
    }

    // 3. Trigger Share & Collect Votes Modal
    const shareBtn = page.locator('button:has-text("Share & Get Votes")').first();
    if (await shareBtn.count() > 0) {
      await shareBtn.click();
      await page.waitForTimeout(500);

      const shareHeader = page.locator('text=VIRAL ENTRY & VOTING LINK').first();
      await expect(shareHeader).toBeVisible({ timeout: 5000 });
      await page.screenshot({ path: path.join(screenshotDir, `maple-city-cruise-modal-share-${projName}.png`) });

      // Close modal
      const closeShareBtn = page.locator('div.fixed button').first();
      if (await closeShareBtn.count() > 0) {
        await closeShareBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

});
