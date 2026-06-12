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

  test('Search Box Overlay - spots and friends search filtering and map centering', async ({ page }) => {
    // Navigate to Round Lake Beach
    await page.goto('/water/round-lake-beach');

    // Onboarding
    await page.fill('input[placeholder="e.g. Captain PJ"]', 'Searcher PJ');
    await page.click('button:has-text("Join Live Map")');

    // 1. Open Search Overlay
    const searchToggle = page.locator('#search-toggle-btn');
    await expect(searchToggle).toBeVisible();
    await searchToggle.click();

    // Verify search overlay panel opens
    await expect(page.locator('text=Search Waterway')).toBeVisible();
    const searchInput = page.locator('input[placeholder*="Search food, fuel"]');
    await expect(searchInput).toBeVisible();

    // 2. Search for a spot
    await searchInput.fill('Blarney');

    // Expect to see Port of Blarney Boat Launch & Grill and Blarney Island Sandbar & Docks
    await expect(page.locator('text=Port of Blarney Boat Launch & Grill').first()).toBeVisible();
    await expect(page.locator('text=Blarney Island Sandbar & Docks').first()).toBeVisible();

    // 3. Search for a friend
    await searchInput.fill('Marcus');
    await expect(page.locator('text=Marcus Mustang').first()).toBeVisible();
    await expect(page.locator('text=Port of Blarney Boat Launch & Grill')).not.toBeVisible();

    // 4. Click result and check details open
    await searchInput.fill('Blarney');
    await page.click('text=Port of Blarney Boat Launch & Grill');

    // Search overlay should close
    await expect(page.locator('text=Search Waterway')).not.toBeVisible();

    // Spot detail bottom sheet should open
    await expect(page.locator('h4:has-text("Port of Blarney Boat Launch & Grill")')).toBeVisible();
    await expect(page.locator('text=verified Spot')).toBeVisible();
    
    // Close detail sheet
    await page.click('#close-details-btn');
  });

  test('Search Filters and Muted Google Maps results', async ({ page }) => {
    // Navigate to Round Lake Beach
    await page.goto('/water/round-lake-beach');

    // Onboarding
    await page.fill('input[placeholder="e.g. Captain PJ"]', 'Google Finder');
    await page.click('button:has-text("Join Live Map")');

    // Open search
    const searchToggle = page.locator('#search-toggle-btn');
    await searchToggle.click();

    // Verify filter buttons exist
    const allFilter = page.locator('#search-filter-all');
    const gpFilter = page.locator('#search-filter-gridpass');
    const gFilter = page.locator('#search-filter-google');
    await expect(allFilter).toBeVisible();
    await expect(gpFilter).toBeVisible();
    await expect(gFilter).toBeVisible();

    // Click "All" filter chip to enable third-party Google Maps place search (since search defaults to gridpass-only)
    await allFilter.click();

    // Search for "Lake" (should match Gridpass "Petite Lake Sandbar" AND Google Maps "Lakeshore Grillhouse & Bar")
    const searchInput = page.locator('input[placeholder*="Search food, fuel"]');
    await searchInput.fill('Lake');

    // Verify both are listed
    await expect(page.locator('text=Petite Lake Sandbar').first()).toBeVisible();
    await expect(page.locator('text=Lakeshore Grillhouse & Bar').first()).toBeVisible();

    // Verify Google Maps item has "Google Maps" tag
    await expect(page.locator('text=Google Maps').first()).toBeVisible();

    // Click "Gridpass Only" filter
    await gpFilter.click();
    await expect(page.locator('text=Petite Lake Sandbar').first()).toBeVisible();
    await expect(page.locator('text=Lakeshore Grillhouse & Bar')).not.toBeVisible();

    // Click "Google Maps" filter
    await gFilter.click();
    await expect(page.locator('text=Lakeshore Grillhouse & Bar').first()).toBeVisible();
    await expect(page.locator('text=Petite Lake Sandbar')).not.toBeVisible();

    // Click the Google Maps result
    await page.click('text=Lakeshore Grillhouse & Bar');

    // Search closes, and Google Maps place details sheet opens
    await expect(page.locator('text=Search Waterway')).not.toBeVisible();
    await expect(page.locator('text=Google Maps Place').first()).toBeVisible();
    await expect(page.locator('h4:has-text("Lakeshore Grillhouse & Bar")')).toBeVisible();

    // Check click CTA
    const claimBtn = page.locator('#claim-google-spot-btn');
    await expect(claimBtn).toBeVisible();
    await claimBtn.click();

    // Claim opens the drop spot form with prefilled values
    await expect(page.locator('text=Drop New Pin At GPS')).toBeVisible();
    await expect(page.locator('input[value="Lakeshore Grillhouse & Bar"]')).toBeVisible();

    // Close add spot
    await page.click('#close-add-spot-btn');
  });

});
