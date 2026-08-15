import { test, expect } from '@playwright/test';

test.describe('Automated Visual E2E Tests: User Profiles & Passports', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

    // Inject mock flag for deterministic test execution
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('1. Non-existent User Profile loads empty state without SSR error screen', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Navigate to non-existent user profile
    const response = await page.goto('/u/YOYN2HDCwqXc3OYsHd8mdJlwr9K2', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Verify Next.js SSR error screen ("This page couldn't load") is NOT present
    await expect(page.locator('text="This page couldn\'t load"')).not.toBeVisible();
    await expect(page.locator('text="Application error: a client-side exception has occurred"')).not.toBeVisible();

    // Verify "Member Passport Not Found" empty state heading and tag exist and are visible
    const emptyStateHeading = page.getByRole('heading', { name: 'Member Passport Not Found' });
    await expect(emptyStateHeading).toBeVisible();

    const emptyStateBadge = page.locator('text="⚪ Member Passport Not Found"');
    await expect(emptyStateBadge).toBeVisible();

    // Verify "Back to Safety" button exists and is visible
    const backBtn = page.getByRole('link', { name: /Back to Safety/i });
    await expect(backBtn).toBeVisible();

    // Check touch target for Back to Safety button
    const box = await backBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      console.log(`[TOUCH-TARGET] Back to Safety button: width=${box.width}px, height=${box.height}px`);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    // Take screenshot for visual confirmation
    await page.screenshot({ path: 'tests/screenshots/passport_not_found.png', fullPage: true });

    // Verify zero page crashes
    expect(pageErrors.length).toBe(0);
  });

  test('2. /u/pjlosey Profile loads smoothly, Manage Passport drawer opens without crashing, touch targets >= 44px', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Navigate to PJ Losey profile
    const response = await page.goto('/u/pjlosey', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Verify profile loads smoothly
    await expect(page.locator('h1', { hasText: /PJ Losey/i })).toBeVisible();

    // Take screenshot of main profile before opening drawer
    await page.screenshot({ path: 'tests/screenshots/pjlosey_profile.png' });

    // Locate and click "Manage Passport" button
    const manageBtn = page.locator('button', { hasText: 'Manage Passport' });
    await expect(manageBtn).toBeVisible();

    // Measure Manage Passport button touch target box
    const manageBtnBox = await manageBtn.boundingBox();
    expect(manageBtnBox).not.toBeNull();
    if (manageBtnBox) {
      console.log(`[TOUCH-TARGET] Manage Passport button: width=${manageBtnBox.width}px, height=${manageBtnBox.height}px`);
      expect(manageBtnBox.height).toBeGreaterThanOrEqual(44);
      expect(manageBtnBox.width).toBeGreaterThanOrEqual(44);
    }

    // Click Manage Passport button to open drawer
    await manageBtn.click();

    // Verify drawer opens without crashing
    const drawerTitle = page.locator('text=/Edit Passport|Passport Settings|Manage Passport|Edit Profile/i').first();
    await expect(drawerTitle).toBeVisible();

    // Take screenshot of opened Manage Passport drawer
    await page.screenshot({ path: 'tests/screenshots/pjlosey_manage_drawer.png' });

    // Audit interactive elements for minimum touch target height & width (>= 44px)
    const interactiveElements = await page.locator('button:visible, a:visible').all();
    console.log(`Auditing ${interactiveElements.length} visible interactive elements for >= 44px touch target bounds...`);

    let touchTargetFailures = 0;
    for (let i = 0; i < interactiveElements.length; i++) {
      const el = interactiveElements[i];
      const box = await el.boundingBox();
      if (box && (box.width > 0 && box.height > 0)) {
        if (box.height < 44 || box.width < 44) {
          const text = (await el.textContent())?.trim() || (await el.getAttribute('aria-label')) || 'unnamed element';
          console.warn(`[TOUCH-TARGET SUB-44] Element "${text}": ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
          touchTargetFailures++;
        }
      }
    }

    console.log(`Touch target audit result: ${touchTargetFailures} elements under 44px out of ${interactiveElements.length} elements.`);
    expect(touchTargetFailures).toBe(0);
    expect(pageErrors.length).toBe(0);
  });

});
