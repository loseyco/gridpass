import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Capture console messages
  page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

  // Inject mock environment variable
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_MOCK__ = true;
  });

  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}\n${err.stack}`));
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

  test('Owner can modify passport settings, manage joint owners, compliance documents, and maintenance tasks', async ({ page }) => {
    // Mock Marcus (Owner) login
    await page.addInitScript(() => {
      (window as any).__MOCK_USER__ = {
        uid: "user-marcus-123",
        email: "marcus@enthusiast.com",
        is_supporter: true,
        display_name: "Marcus Mustang"
      };
    });

    await page.goto('/v/mock-v1');

    // Click Settings tab
    const settingsTab = page.locator('button:has-text("Settings")');
    await expect(settingsTab).toBeVisible();
    await settingsTab.click();

    // Fill settings inputs
    await page.fill('input[placeholder="2007"]', '2007');
    await page.fill('input[placeholder="Sea-Doo"]', 'Sea-Doo');
    await page.fill('input[placeholder="GTI SE"]', 'GTI SE');
    await page.fill('input[placeholder="130"]', '130');
    await page.fill('textarea[placeholder="Tell the story"]', 'We bought this 2007 Sea-Doo GTI SE to share our weekend adventures.');

    // Add Co-owner
    await page.click('button:has-text("+ Add Co-Owner")');
    await page.locator('input[placeholder="Kristina"]').last().fill('Kristina');
    await page.locator('input[placeholder="50%"]').last().fill('50/50');
    await page.locator('input[placeholder="pjlosey-mock"]').last().fill('pjlosey-mock');

    // Add Compliance Document
    await page.click('button:has-text("+ Add Document")');
    await page.locator('input[placeholder="Wisconsin Registration"]').last().fill('Wisconsin Registration');
    
    // Add Due Maintenance Item
    await page.click('button:has-text("+ Add Task")');
    await page.locator('input[placeholder="Jet Pump Inspection"]').last().fill('Jet Pump Inspection');
    await page.locator('input[placeholder="Spark Plugs"]').last().fill('Spark Plugs');
    await page.locator('input[placeholder="amazon.com"]').last().fill('https://www.amazon.com/s?k=Spark+Plugs');

    // Save passport settings
    await page.click('button:has-text("Save Passport Settings")');

    // Verify redirects back to Specs & Mod List tab and shows the updated title/story
    await expect(page.locator('text=2007 Sea-Doo')).toBeVisible();
    await expect(page.locator('text=GTI SE')).toBeVisible();
    await expect(page.locator('text=We bought this 2007 Sea-Doo GTI SE')).toBeVisible();

    // Verify co-owner Kristina is visible
    await expect(page.locator('a', { hasText: 'Kristina' })).toBeVisible();

    // Verify Wisconsin Registration is visible
    await expect(page.locator('text=Wisconsin Registration')).toBeVisible();

    // Navigate to Service tab
    const serviceTab = page.locator('button:has-text("Service Logbook")');
    await expect(serviceTab).toBeVisible();
    await serviceTab.click();

    // Verify the new maintenance task is visible in the checklist
    await expect(page.locator('text=Jet Pump Inspection')).toBeVisible();
    await expect(page.locator('text=Spark Plugs')).toBeVisible();
    await expect(page.locator('a:has-text("Buy Parts")').first()).toBeVisible();

    // Toggle the checkbox for the Jet Pump Inspection task
    const checkbox = page.locator('input[type="checkbox"]').first();
    await expect(checkbox).toBeVisible();
    
    // Expect initially unchecked
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    
    // Expect checked after toggling
    await expect(checkbox).toBeChecked();
  });

  test('Owner view of vehicle profile allows expense tracking and TCO ledger management', async ({ page }) => {
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

    // Verify "Expenses & TCO" tab is visible
    const expensesTab = page.locator('button:has-text("Expenses & TCO")');
    await expect(expensesTab).toBeVisible();
    await expensesTab.click();

    // Verify stats cards are rendered with default mock math
    // Default mock has: purchase_price: 4500, fuel: 45, addon: 1200, license: 120
    // Total Investment TCO should be: 4500 + 45 + 1200 + 120 = 5865.00
    await expect(page.locator('text=$5,865.00')).toBeVisible();
    await expect(page.getByRole('heading', { name: '$4,500' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '$120' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '$45' })).toBeVisible();

    // Log a new expense
    await page.fill('#expense-title-input', 'Performance Dyno Tune');
    await page.selectOption('#expense-category-input', 'addon');
    await page.fill('#expense-cost-input', '250.00');
    await page.fill('#expense-date-input', '2026-06-10');
    await page.fill('#expense-notes-input', 'Tuned on 93 octane. Gained 15hp.');
    await page.click('#submit-expense-btn');

    // Verify it was appended to the timeline ledger
    await expect(page.locator('text=Performance Dyno Tune').first()).toBeVisible();

    // TCO should increase by 250 (5865 + 250 = 6115.00)
    await expect(page.locator('text=$6,115.00')).toBeVisible();

    // Setup dialog listener for delete confirmation
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    // Delete the Premium Gas Fill-up expense ($45)
    // Total TCO should decrease by 45 (6115 - 45 = 6070.00)
    const gasItem = page.locator('[data-testid="expense-item"]', { hasText: 'Premium Gas Fill-up' });
    await gasItem.hover();
    const deleteBtn = gasItem.locator('button[title="Delete expense"]');
    await deleteBtn.click();

    // Verify the item is gone and TCO is updated
    await expect(page.locator('text=Premium Gas Fill-up')).not.toBeVisible();
    await expect(page.locator('text=$6,070.00')).toBeVisible();
  });

});

