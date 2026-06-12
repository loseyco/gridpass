import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.beforeEach(async ({ page }) => {
  // Inject mock environment variable
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_MOCK__ = true;
  });
});

test.describe('Gridpass: Polymorphic Venue & Mapping E2E Suite', () => {

  test('Water Mode (Boat Mode) - Map, Spot Dropping, Radar & Privacy', async ({ page }, testInfo) => {
    // Navigate to Round Lake Beach Waterway
    await page.goto('/venue/round-lake-beach');

    // Verify Title & Badges
    await expect(page.locator('h1')).toContainText(/Round Lake Beach/i);
    await expect(page.locator('text=Smart-Water Ecosystem')).toBeVisible();
    await expect(page.locator('text=Boat Mode Active')).toBeVisible();
    await expect(page.locator('text=Geofence Active')).toBeVisible();

    // Verify Map and Radar are present
    const map = page.locator('svg[viewBox="0 0 400 300"]');
    await expect(map).toBeVisible();

    // Check off-screen friend radar display
    await expect(page.locator('text=Kristina')).toBeVisible();
    await expect(page.locator('text=Marcus')).toBeVisible();
    await expect(page.locator('text=Sarah')).toBeVisible();

    // Verify privacy "Go Ghost" toggle behavior
    const privacyBtn = page.locator('#privacy-toggle');
    await expect(privacyBtn).toBeVisible();
    await privacyBtn.click();
    await expect(page.locator('text=Ghost Mode Active')).toBeVisible();
    // Friend beacons and self indicator should hide in ghost mode
    await expect(page.locator('text=Kristina')).not.toBeVisible();

    // Toggle location sharing back on
    await privacyBtn.click();
    await expect(page.locator('text=Sharing Location')).toBeVisible();

    // Open Drop Spot Form
    await page.click('button:has-text("Drop Spot")');
    await expect(page.locator('text=Drop New Spot')).toBeVisible();

    // Fill in new spot details
    await page.fill('input[placeholder="e.g. Grass Lake Marina / Sandbar"]', 'Lakeside Fuel & Burgers');
    await page.selectOption('select', 'monmouth-marine-demo'); // Link to verified business
    await page.click('form button:has-text("dock")');
    await page.click('form button:has-text("fuel")');
    await page.click('form button:has-text("food")');
    await page.fill('textarea', 'Excellent fuel dock and fast burgers. Heavy weekend wake.');

    // Save and verify spot dropped
    await page.click('button:has-text("Verify & Drop Pin")');
    await expect(page.locator('h4:has-text("Lakeside Fuel & Burgers")')).toBeVisible();
    await expect(page.locator('text=verified Spot')).toBeVisible();
    await expect(page.locator('text=Verified Business Partner')).toBeVisible();

    // Suggest edits on spot
    await page.click('button:has-text("Suggest Edits / Note")');
    await expect(page.locator('text=Suggest Edits: Lakeside Fuel & Burgers')).toBeVisible();
    await page.fill('textarea[placeholder*="Leave suggestions"]', 'Water depth is around 4ft at dock.');
    await page.click('button:has-text("Submit Recommendations")');

    // Verify note is appended
    await expect(page.locator('text=Water depth is around 4ft at dock.')).toBeVisible();

    // Take screenshot of Boat Mode
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `venue-boat-mode-${projName}.png`) });
  });

  test('Trail Mode (Offroad) - Map, Campgrounds & Topo details', async ({ page }, testInfo) => {
    // Navigate to Redbird Offroad State Park
    await page.goto('/venue/redbird-sra');

    // Verify Title & Badges
    await expect(page.locator('h1')).toContainText(/Redbird State/i);
    await expect(page.locator('text=Offroad Trail Portal')).toBeVisible();

    // Switch to Campgrounds tab
    await page.click('button:has-text("Campgrounds")');
    await expect(page.locator('text=Clay Pit Campsite #4')).toBeVisible();
    await expect(page.locator('text=Fire ring')).toBeVisible();

    // Switch to Rules tab
    await page.click('button:has-text("Rules")');
    await expect(page.locator('text=Registered ORV Decal Required')).toBeVisible();
    await expect(page.locator('text=Winching Safety Gear Mandatory')).toBeVisible();

    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `venue-trail-mode-${projName}.png`) });
  });

  test('Show Mode (Event Center) - Schedule & Exhibition Vendors', async ({ page }, testInfo) => {
    // Navigate to Cultural Center
    await page.goto('/venue/rlb-cultural-center');

    // Verify Title & Badges
    await expect(page.locator('h1')).toContainText(/Cultural Center/i);
    await expect(page.locator('text=Event & Car Show Center')).toBeVisible();

    // Switch to Vendors tab
    await page.click('button:has-text("Vendors")');
    await expect(page.locator('text=Sponsor Row Exhibition Walk')).toBeVisible();
    await expect(page.locator('text=Gridpass Sticker Customizer Booth')).toBeVisible();
    await expect(page.locator('text=Food Truck Court')).toBeVisible();

    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `venue-show-mode-${projName}.png`) });
  });

});
