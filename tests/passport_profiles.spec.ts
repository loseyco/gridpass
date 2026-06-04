import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Inject mock environment variable
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_MOCK__ = true;
  });
});

test.describe('Passport Profiles Context-Aware E2E Suite', () => {

  test('Spectator view of vehicle profile', async ({ page }) => {
    // Navigate to vehicle profile route as anonymous spectator
    await page.goto('/v/mock-v1');

    // Verify specification cards are visible
    await expect(page.locator('text=Mustang GT')).toBeVisible();
    await expect(page.locator('text=5.0L Coyote V8')).toBeVisible();
    await expect(page.locator('text=480 HP')).toBeVisible();

    // Verify modifications list is visible
    await expect(page.locator('text=Roush')).toBeVisible();
    await expect(page.locator('text=Cat-Back Exhaust System')).toBeVisible();

    // Verify Vibe-Check voting button
    const vibeBtn = page.locator('button:has-text("Vibe Check")');
    await expect(vibeBtn).toBeVisible();
    await vibeBtn.click();
    await expect(page.locator('text=Vibe Checked')).toBeVisible();

    // Verify owner-gated Telemetry tab is HIDDEN for spectators
    const telemetryTab = page.locator('button:has-text("Scan Telemetry")');
    await expect(telemetryTab).not.toBeVisible();
  });

  test('Owner view of vehicle profile displays private scan telemetry', async ({ page }) => {
    // Mock Marcus (Owner) login
    await page.addInitScript(() => {
      (window as any).__MOCK_USER__ = {
        uid: "user-marcus-123",
        email: "marcus@enthusiast.com",
        is_supporter: true,
        display_name: "Marcus Mustang"
      };
    });

    // Navigate to vehicle profile page
    await page.goto('/v/mock-v1');

    // Verify private owner-gated tabs are now VISIBLE
    const telemetryTab = page.locator('button:has-text("Scan Telemetry")');
    await expect(telemetryTab).toBeVisible();
    await telemetryTab.click();

    // Verify scan coordinate nodes & logs are rendered
    await expect(page.locator('text=Geographic Scan Telemetry')).toBeVisible();
    await expect(page.locator('text=Wall Stadium Speedway')).toBeVisible();
    await expect(page.locator('text=Recent Scan Events')).toBeVisible();
  });

  test('Mechanic view of vehicle profile allows certified service stamping', async ({ page }) => {
    // Mock Mike (Mechanic) login
    await page.addInitScript(() => {
      (window as any).__MOCK_USER__ = {
        uid: "user-mike-789",
        email: "mike@performancetuning.com",
        is_supporter: false,
        display_name: "Mike Mechanic"
      };
    });

    await page.goto('/v/mock-v1');

    // Select Service Logbook tab
    const serviceTab = page.locator('button:has-text("Service Logbook")');
    await expect(serviceTab).toBeVisible();
    await serviceTab.click();

    // Verify Certified Shop stamping inputs exist
    await expect(page.locator('text=Log Maintenance Event')).toBeVisible();
    await expect(page.locator('text=Stamping as Certified Shop')).toBeVisible();

    // Submit a mock service entry
    await page.fill('input[placeholder*="Synthetic Oil Change"]', 'Custom Intake Dyno Stamp');
    await page.fill('textarea[placeholder*="parts, dyno results"]', 'Fitted aftermarket air intake. Peak power up by +15 hp.');
    await page.click('button:has-text("Stamp Certified Record")');

    // Verify it was appended to the list with verified badge
    await expect(page.locator('text=Custom Intake Dyno Stamp').first()).toBeVisible();
    await expect(page.locator('text=Shop Certified').first()).toBeVisible();
  });

  test('Universal Driver Passport displays garage & socials', async ({ page }) => {
    await page.goto('/u/pjlosey-mock');

    // Verify avatar profile headers
    await expect(page.locator('text=Marcus Mustang')).toBeVisible();
    await expect(page.locator('text=marcus@enthusiast.com')).toBeVisible();

    // Verify digital garage displays vehicle cards linking to passports
    await expect(page.locator('text=2024 Ford Mustang GT')).toBeVisible();
    const linkBtn = page.locator('a:has-text("View Passport Details")');
    await expect(linkBtn).toBeVisible();
  });

  test('Business storefront displays inventory & CRM leads', async ({ page }) => {
    // Mock Steve (Dealer GM) login to verify CRM leads dashboard
    await page.addInitScript(() => {
      (window as any).__MOCK_USER__ = {
        uid: "user-steve-456",
        email: "steve@monmouthmarine.com",
        is_supporter: true,
        display_name: "Steve Dealer"
      };
    });

    await page.goto('/b/monmouth-marine-demo');

    // Verify business storefront header and sponsored inventories lot
    await expect(page.locator('text=Monmouth Marine Ford & Boats')).toBeVisible();
    await expect(page.locator('text=250 State Highway 35')).toBeVisible();
    await expect(page.locator('text=Porsche 911 GT3 RS')).toBeVisible();

    // Verify CRM leads tab is visible and shows CRM check-in logs table
    const crmTab = page.locator('button:has-text("B2B CRM Warm Leads")');
    await expect(crmTab).toBeVisible();
    await crmTab.click();

    // Verify lead email items exist in table
    await expect(page.locator('text=sarah@spotter.com')).toBeVisible();
    await expect(page.locator('text=marcus@enthusiast.com')).toBeVisible();
  });

});
