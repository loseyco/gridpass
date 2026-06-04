import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.beforeEach(async ({ page }) => {
  // Inject mock environment variable
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_MOCK__ = true;
  });
});

test.describe('Gridpass Phase 4: Track Operations & Marshall E2E Suite', () => {

  test('Driver safety waiver submission and gate ticket generation', async ({ page }, testInfo) => {
    // Navigate to track day waiver portal
    await page.goto('/track/demo-track');
    
    // Check titles
    await expect(page.locator('h1')).toContainText(/Badlands Offroad/i);
    await expect(page.locator('text=Digital Waiver Portal')).toBeVisible();

    // Verify liability alert
    await expect(page.locator('text=Liability Information')).toBeVisible();

    // Fill in the form
    await page.fill('input[placeholder="Type Driver Name for digital signature"]', 'PJ Losey');
    await page.fill('input[placeholder="e.g. PJ Losey"]', 'PJ LOSEY');
    await page.fill('input[placeholder="e.g. driver@gridpass.app"]', 'pjlosey@gridpass.app');
    await page.fill('input[placeholder="e.g. Sarah Spotter"]', 'Sarah Emergency');
    await page.fill('input[placeholder="e.g. 555-0199"]', '123-456-7890');
    
    // Choose Run Group B
    await page.selectOption('select', 'Group B');

    // Agree and check checkbox
    await page.click('input[type="checkbox"]');

    // Screenshot of filled form
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `track-waiver-form-${projName}.png`) });

    // Submit form
    await page.click('button:has-text("Sign Liability Waiver")');

    // Verify Gate Ticket Cleared panel
    await expect(page.locator('text=Waiver Signed Successfully')).toBeVisible();
    await expect(page.locator('text=Cleared — Gate Scan Ticket Active')).toBeVisible();
    await expect(page.locator('text=Group B')).toBeVisible();
    
    await page.screenshot({ path: path.join(screenshotDir, `track-waiver-ticket-${projName}.png`) });
  });

  test('Grid Marshall dashboard scans, safety blocks, and overrides', async ({ page }, testInfo) => {
    // Navigate to Grid Marshall console
    await page.goto('/grid/demo-track');

    // Check header
    await expect(page.locator('text=Marshall Station: DEMO TRACK')).toBeVisible();
    await expect(page.locator('text=Green flag active')).toBeVisible();

    // Verify idle state
    await expect(page.locator('text=WAITING FOR SCANNED SIGNAL')).toBeVisible();

    // Select Sarah BRZ (which has tech passed but waiver missing)
    await page.selectOption('select', 'GP-SARAH-CAR');

    // Verify check results panel displays HOLD status
    await expect(page.locator('h4:has-text("Sarah Spotter")')).toBeVisible();
    await expect(page.locator('text=HOLD — DO NOT RELEASE')).toBeVisible();
    await expect(page.locator('text=Waiver Missing')).toBeVisible();

    // Toggle Waiver override status
    await page.click('button:has-text("Toggle Waiver Override")');

    // Verify warning changes to RELEASE TO PIT LANE
    await expect(page.locator('text=RELEASE TO PIT LANE')).toBeVisible();

    // Select Billy Silverado (which has tech missing but waiver signed)
    await page.selectOption('select', 'GP-BILLY-RIG');

    // Verify hold warning active
    await expect(page.locator('h4:has-text("Billy BigRig")')).toBeVisible();
    await expect(page.locator('text=HOLD — DO NOT RELEASE')).toBeVisible();
    await expect(page.locator('text=Tech Pass Missing')).toBeVisible();

    // Toggle Tech pass override
    await page.click('button:has-text("Toggle Tech Override")');

    // Verify release verdict is active
    await expect(page.locator('text=RELEASE TO PIT LANE')).toBeVisible();

    // Click "Wave onto Track" to release Billy Silverado
    await page.click('button:has-text("Wave onto Track")');

    // Verify Billy released and logged in history table
    await expect(page.locator('td:has-text("Billy BigRig")')).toBeVisible();
    
    // Select Marcus Mustang (both tech and waiver are true automatically)
    await page.selectOption('select', 'GP-MARCUS-GT');
    await expect(page.locator('text=RELEASE TO PIT LANE')).toBeVisible();
    await page.click('button:has-text("Wave onto Track")');

    // Verify Marcus also in log feed
    await expect(page.locator('td:has-text("Marcus Mustang")')).toBeVisible();

    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `grid-marshall-console-${projName}.png`) });
  });

});
