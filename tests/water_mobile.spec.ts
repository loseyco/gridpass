import { test, expect, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.beforeEach(async ({ page }) => {
  // Set execution timeout to 60 seconds to avoid flaky timeouts under heavy Next.js compilation loads
  test.setTimeout(60000);

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
    // Authenticate a mocked user so they have full map permissions (e.g. SOS, Drop Spot, telemetry)
    await page.addInitScript(() => {
      (window as any).__MOCK_USER__ = {
        uid: 'cap-pj',
        email: 'captainpj@gridpass.app',
        displayName: 'Cap PJ'
      };
    });

    // Navigate to Round Lake Beach Waterway Mobile dashboard
    await page.goto('/water/round-lake-beach');

    // Wait for the leaflet map to mount and hydrate
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 25000 });

    // 1. Verify User Profile Welcome button is visible instead of Login button
    await expect(page.locator('text=Welcome Cap')).toBeVisible();

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
    
    // Wait for the dynamic import loader to complete and Leaflet container to mount
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 55000 });
    
    // Verify it auto-detects and binds to Round Lake Beach
    await expect(page.locator('text=Round Lake Beach & Waterway').first()).toBeVisible();

    // 2. Mock location far away (New York coordinates)
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 });
    
    // Reload page to test fresh coordinates auto-binding
    await page.reload();
    
    // Wait for the map to mount again
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 55000 });
    
    // Verify it auto-binds to Local Waterway instead of Round Lake Beach
    await expect(page.locator('text=Local Waterway').first()).toBeVisible();
  });

  test('Search Box Overlay - spots and friends search filtering and map centering', async ({ page }) => {
    // Navigate to Round Lake Beach
    await page.goto('/water/round-lake-beach');

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
    // Mock user login since claiming Google spots requires authentication
    await page.addInitScript(() => {
      (window as any).__MOCK_USER__ = {
        uid: 'marcus-mustang',
        email: 'marcus@gridpass.app',
        displayName: 'Marcus Mustang'
      };
    });

    // Navigate to Round Lake Beach
    await page.goto('/water/round-lake-beach');

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

  test('Sign In / Out flow, onboarding button, HUD controls, and URL query parameter parsing', async ({ page }) => {
    // 1. Check Guest banner Log In button opens inline auth sheet
    await page.goto('/water/round-lake-beach');
    // Wait for map container to render and page to hydrate
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20000 });
    const guestLoginBtn = page.locator('button:has-text("Log In")');
    await expect(guestLoginBtn).toBeVisible();
    await guestLoginBtn.click();
    await expect(page.locator('text=Passport Verification')).toBeVisible();
    
    // Close the inline sheet
    await page.click('#close-auth-sheet-btn');
    await expect(page.locator('text=Passport Verification')).not.toBeVisible();

    // 2. Parse URL parameters for shared friend
    await page.goto('/water/round-lake-beach?lat=42.4430&lng=-88.1250&nickname=Kristina');
    
    // Wait for map container to render and page to hydrate
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 25000 });
    
    // Check for the welcome toast
    await expect(page.locator('text=Found shared friend: Kristina!')).toBeVisible();

    // In guest mode, we should see the "Login / Register" button in bottom center HUD
    const bottomLoginBtn = page.locator('button:has-text("Login / Register")');
    await expect(bottomLoginBtn).toBeVisible();

    // Click bottom HUD Login / Register and check inline sheet opens
    await bottomLoginBtn.click();
    await expect(page.locator('text=Passport Verification')).toBeVisible();
    await page.click('#close-auth-sheet-btn');

    // 3. Test authenticated user view (MOCKED User)
    await page.addInitScript(() => {
      (window as any).__MOCK_USER__ = {
        uid: 'marcus-mustang',
        email: 'marcus@gridpass.app',
        displayName: 'Marcus Mustang'
      };
    });
    
    // Navigate back to water view
    await page.goto('/water/round-lake-beach');
    
    // Wait for map container to render and page to hydrate
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 25000 });
    
    // Onboarding should NOT be visible for logged in user on load
    await expect(page.locator('text=Join Live Waterway Map')).not.toBeVisible();
    
    // The HUD should display the Welcome Marcus button instead of "Login / Register"
    const hudWelcomeBtn = page.locator('button:has-text("Welcome Marcus")');
    await expect(hudWelcomeBtn).toBeVisible();

    // Click Welcome button (opens Profile sheet)
    await hudWelcomeBtn.click();
    await expect(page.locator('text=Rider Passport Details')).toBeVisible();
    await expect(page.locator('text=marcus@gridpass.app')).toBeVisible();

    // Click Log Out inside profile sheet
    await page.click('#profile-logout-btn');

    // Onboarding should be visible again after logging out
    await expect(page.locator('text=Join Live Waterway Map')).toBeVisible();
  });

  test('Map Auto-Follow mode and Screen Wake Lock Settings Toggles', async ({ page }) => {
    // Inject mock user and mock wakeLock API
    await page.addInitScript(() => {
      (window as any).__MOCK_USER__ = {
        uid: 'settings-pj',
        email: 'settingspj@gridpass.app',
        displayName: 'Settings PJ'
      };
      const mockWakeLockSentinel = {
        released: false,
        release: async function() { this.released = true; }
      };
      (navigator as any).wakeLock = {
        request: async () => mockWakeLockSentinel
      };
    });

    await page.goto('/water/round-lake-beach');
    // Wait for map container to render and page to hydrate
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 25000 });

    // Verify Welcome button is visible
    await expect(page.locator('text=Welcome Settings')).toBeVisible();

    // Verify HUD Recenter button starts as highlighted (follow mode is true by default)
    const recenterBtn = page.locator('#recenter-btn');
    await expect(recenterBtn).toBeVisible();
    await expect(recenterBtn).toHaveClass(/border-cyan-500/);

    // Open Telemetry sidebar
    const telemetryBtn = page.locator('button:has(.lucide-compass)');
    await telemetryBtn.click();

    // Verify Settings section and toggles are visible
    await expect(page.locator('text=Settings').first()).toBeVisible();
    await expect(page.locator('text=Follow GPS Location')).toBeVisible();
    await expect(page.locator('text=Keep Screen Awake')).toBeVisible();

    // Verify follow-gps-toggle and wake-lock-toggle are active/inactive initially
    const followGpsToggle = page.locator('#follow-gps-toggle');
    const wakeLockToggle = page.locator('#wake-lock-toggle');

    await expect(followGpsToggle).toHaveClass(/bg-cyan-500/);
    await expect(wakeLockToggle).not.toHaveClass(/bg-cyan-500/);

    // Toggle Follow GPS off
    await followGpsToggle.click();
    await expect(followGpsToggle).not.toHaveClass(/bg-cyan-500/);

    // Close Telemetry sidebar to inspect Recenter button
    await page.click('#close-telemetry-btn');

    // Verify HUD Recenter button is no longer highlighted
    await expect(recenterBtn).not.toHaveClass(/border-cyan-500/);

    // Click Recenter button in HUD
    await recenterBtn.click();
    // Recenter button should be highlighted again
    await expect(recenterBtn).toHaveClass(/border-cyan-500/);

    // Open Telemetry sidebar again
    await telemetryBtn.click();
    // Toggle should be active again
    await expect(followGpsToggle).toHaveClass(/bg-cyan-500/);

    // Toggle Wake Lock on
    await wakeLockToggle.click();
    await expect(wakeLockToggle).toHaveClass(/bg-cyan-500/);

    // Toggle Wake Lock off
    await wakeLockToggle.click();
    await expect(wakeLockToggle).not.toHaveClass(/bg-cyan-500/);
  });

});

