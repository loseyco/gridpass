import { test, expect, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.beforeEach(async ({ page }) => {
  // Set viewport to mobile size (iPhone 14 Pro dimensions)
  await page.setViewportSize({ width: 390, height: 844 });

  // Inject mock environment variable
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_MOCK__ = true;
    (window as any).__MOCK_USER__ = null;
  });
});

test.describe('Gridpass: Mobile Waterway Dashboard E2E Suite', () => {

  test('Guest Onboarding, Real Leaflet Map, SOS countdown, and Telemetry Drawers', async ({ page }, testInfo) => {
    // Navigate to Round Lake Beach Waterway Mobile dashboard
    await page.goto('/water/round-lake-beach');

    // 1. Verify Guest Onboarding Modal
    await expect(page.locator('text=Join Live Waterway Map')).toBeVisible();
    await expect(page.locator('text=Join Live Map')).toBeVisible();

    // Type nickname and submit
    await page.fill('input[placeholder="e.g. Captain PJ"]', 'Cap PJ');
    await page.click('button:has-text("Join Live Map")');

    // Onboarding modal should be closed
    await expect(page.locator('text=Join Live Waterway Map')).not.toBeVisible();

    // 2. Verify Leaflet map container is mounted
    const leafletMap = page.locator('.leaflet-container');
    await expect(leafletMap).toBeVisible();

    // 3. Verify Privacy HUD selector exists and works
    const ghostBtn = page.locator('button:has-text("Private")');
    const friendsBtn = page.locator('button:has-text("Friends")');
    const publicBtn = page.locator('button:has-text("Public")');
    
    await expect(ghostBtn).toBeVisible();
    await expect(friendsBtn).toBeVisible();
    await expect(publicBtn).toBeVisible();

    // Toggle Privacy to Ghost
    await ghostBtn.click();
    await expect(ghostBtn).toHaveClass(/bg-red-650|bg-red-600/);

    // Toggle Privacy back to Public
    await publicBtn.click();
    await expect(publicBtn).toHaveClass(/bg-cyan-500/);

    // 4. Verify SOS Emergency Countdown Trigger
    const sosBtn = page.locator('button:has-text("SOS")');
    await expect(sosBtn).toBeVisible();
    await sosBtn.click();

    // SOS Countdown Overlay should be visible
    await expect(page.locator('text=Sharing Emergency SOS')).toBeVisible();
    
    // Cancel the countdown
    const cancelSosBtn = page.locator('button:has-text("Cancel SOS / I\'m Okay")');
    await expect(cancelSosBtn).toBeVisible();
    await cancelSosBtn.click();
    
    // Countdown Overlay should be hidden
    await expect(page.locator('text=Sharing Emergency SOS')).not.toBeVisible();

    // 5. Verify Telemetry Sidebar Drawer
    const compassToggle = page.locator('button >> has-text("Compass")').first();
    // Alternately select by child svg / compass container if text is hidden
    const telemetryBtn = page.locator('button:has(.lucide-compass)');
    await expect(telemetryBtn).toBeVisible();
    await telemetryBtn.click();

    // Telemetry drawer should slide open
    await expect(page.locator('text=Live Ride Stats')).toBeVisible();
    await expect(page.locator('text=Current Speed')).toBeVisible();
    await expect(page.locator('text=Water Temp')).toBeVisible();

    // Close Telemetry drawer
    await page.click('#close-telemetry-btn');
    await expect(page.locator('text=Live Ride Stats')).not.toBeVisible();

    // 6. Verify Drop Spot Bottom Sheet Form
    const addSpotBtn = page.locator('button:has(.lucide-plus)');
    await expect(addSpotBtn).toBeVisible();
    await addSpotBtn.click();

    // Drop Spot sheet should open
    await expect(page.locator('text=Drop New Pin At GPS')).toBeVisible();
    
    // Fill in spot info
    await page.fill('input[placeholder*="Grass Lake Fuel"]', 'Lakeside Grill & Docks');
    await page.selectOption('select:first-of-type', 'food');
    await page.fill('textarea[placeholder*="depth"]', 'Excellent burgers and drinks. Depth is 3ft.');
    
    // Submit the spot
    await page.click('button:has-text("Drop Verified Pin")');

    // Bottom sheet details for Lakeside Grill & Docks should open automatically
    await expect(page.locator('h4:has-text("Lakeside Grill & Docks")')).toBeVisible();
    await expect(page.locator('text=active Spot')).toBeVisible();

    // Close the details sheet
    await page.click('#close-details-btn');
    await expect(page.locator('h4:has-text("Lakeside Grill & Docks")')).not.toBeVisible();

    // Take screenshot of Mobile Water Dashboard
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `water-mobile-dashboard-${projName}.png`) });
  });

  test('Universal Route /water - Geolocation Auto-Binding and Out-of-Bounds fallback', async ({ context, page }) => {
    // Grant geolocation permissions
    await context.grantPermissions(['geolocation']);
    
    // 1. Mock location close to Round Lake Beach
    await context.setGeolocation({ latitude: 42.4412, longitude: -88.1322 });
    
    // Go to universal water portal
    await page.goto('/water');
    
    // Complete guest onboarding
    await page.fill('input[placeholder="e.g. Captain PJ"]', 'Auto Pilot');
    await page.click('button:has-text("Join Live Map")');
    
    // Verify it auto-detects and binds to Round Lake Beach
    await expect(page.locator('text=Round Lake Beach & Waterway').first()).toBeVisible();

    // 2. Mock location far away (New York coordinates)
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });
    
    // Reload page to test fresh coordinates auto-binding
    await page.reload();
    
    // Complete guest onboarding
    await page.fill('input[placeholder="e.g. Captain PJ"]', 'New Yorker');
    await page.click('button:has-text("Join Live Map")');
    
    // Verify it auto-binds to Local Waterway instead of Round Lake Beach
    await expect(page.locator('text=Local Waterway').first()).toBeVisible();
  });

});
