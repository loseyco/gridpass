import { test, expect } from '@playwright/test';

test.describe('Space Creation & Live Dashboard Sync E2E Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

    // Inject Playwright mock environment
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('__playwright_mock__', 'true');
    });
  });

  test('Create "U-Haul Storage Hub" space, verify direct edit redirect & live dashboard sync', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Step 1: Navigate to space creation page
    console.log('[STEP 1] Navigating to http://localhost:3000/dash/space/new...');
    await page.goto('http://localhost:3000/dash/space/new', { waitUntil: 'domcontentloaded' });

    const nameInput = page.locator('[data-testid="space-name-input"]');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);

    await nameInput.click();
    await nameInput.fill('U-Haul Storage Hub');
    await expect(nameInput).toHaveValue('U-Haul Storage Hub');

    const typeSelect = page.locator('[data-testid="space-type-select"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('Storage Unit');
    }

    const locationInput = page.locator('[data-testid="space-location-input"]');
    if (await locationInput.isVisible()) {
      await locationInput.fill('Elkhart Lake, WI');
      await expect(locationInput).toHaveValue('Elkhart Lake, WI');
    }

    const dimensionsInput = page.locator('[data-testid="space-dimensions-input"]');
    if (await dimensionsInput.isVisible()) {
      await dimensionsInput.fill('1,200 sqft');
      await expect(dimensionsInput).toHaveValue('1,200 sqft');
    }

    // Step 2: Submit form and verify direct redirect to editor page (/dash/space/[id]/edit)
    console.log('[STEP 2] Submitting space form and verifying redirect to /dash/space/[id]/edit...');
    const submitBtn = page.locator('[data-testid="submit-space-btn"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Wait for redirect to /dash/space/[id]/edit
    await page.waitForURL(/\/dash\/space\/.*\/edit/, { timeout: 10000 });
    const currentUrl = page.url();
    console.log(`[VERIFICATION] Redirected successfully to space editor page: ${currentUrl}`);
    expect(currentUrl).toMatch(/\/dash\/space\/.*\/edit/);

    // Verify Space Editor rendered with the created space name
    const editNameInput = page.locator('[data-testid="space-name-input"]');
    await expect(editNameInput).toBeVisible();
    await expect(editNameInput).toHaveValue('U-Haul Storage Hub');

    // Take screenshot proof of space editor redirect page
    await page.screenshot({ path: 'tests/screenshots/space_creation_editor_redirect.png', fullPage: true });
    console.log('[SCREENSHOT] Saved editor redirect screenshot proof: tests/screenshots/space_creation_editor_redirect.png');

    // Step 3: Navigate to http://localhost:3000/dash?tab=spaces and verify live dashboard sync
    console.log('[STEP 3] Navigating to http://localhost:3000/dash?tab=spaces...');
    await page.goto('http://localhost:3000/dash?tab=spaces', { waitUntil: 'domcontentloaded' });

    const spaceManager = page.locator('[data-testid="dashboard-space-manager"]');
    await expect(spaceManager).toBeVisible();

    // Verify "U-Haul Storage Hub" card is dynamically rendered in the spaces list
    const createdSpaceCard = page.locator('text=U-Haul Storage Hub').first();
    await expect(createdSpaceCard).toBeVisible();
    console.log('[VERIFICATION] "U-Haul Storage Hub" space card dynamically rendered in dashboard spaces tab!');

    // Take screenshot proof of dashboard spaces tab showing the rendered space card
    await page.screenshot({ path: 'tests/screenshots/space_creation_dashboard_sync.png', fullPage: true });
    console.log('[SCREENSHOT] Saved dashboard sync screenshot proof: tests/screenshots/space_creation_dashboard_sync.png');

    expect(pageErrors.length).toBe(0);
  });

});
