import { test, expect } from '@playwright/test';

test.describe('Dashboard Businesses Tab Filtering & Navigation E2E Verification Suite', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

    // Inject Playwright mock environment
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('__playwright_mock__', 'true');
    });
  });

  test('1. http://localhost:3000/dash?tab=businesses - Verify unclaimed directory listings like Monarch Defender are filtered out', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash?tab=businesses', { waitUntil: 'domcontentloaded' });

    // 1. Verify Businesses Tab Pill active
    const businessesPill = page.locator('[data-testid="dash-tab-businesses"]');
    await businessesPill.waitFor({ state: 'visible', timeout: 10000 });
    await expect(businessesPill).toBeVisible();
    await expect(businessesPill).toHaveClass(/bg-\[#ff3b30\]/);

    // 2. Verify Businesses Manager section is visible
    const bizManager = page.locator('[data-testid="dashboard-businesses-manager"]');
    await expect(bizManager).toBeVisible();

    // 3. Verify unclaimed directory listing "Monarch Defender" IS FILTERED OUT
    const unclaimedBiz = page.locator('text=Monarch Defender');
    await expect(unclaimedBiz).toHaveCount(0);
    console.log('[FILTER-VERIFICATION] Unclaimed listing "Monarch Defender" successfully filtered out of My Businesses tab.');

    // 4. Verify claimed user businesses (Shaw Daddy\'s BBQ, NIELSEN ENTERPRISES) are rendered
    const claimedBiz1 = page.locator('text=Shaw Daddy\'s BBQ').first();
    const claimedBiz2 = page.locator('text=NIELSEN ENTERPRISES').first();

    await expect(claimedBiz1).toBeVisible();
    await expect(claimedBiz2).toBeVisible();

    // 5. Verify action links & touch targets for claimed businesses
    const testCases = [
      { id: 'shaw-daddys-bbq', viewHref: '/b/shaw-daddys-bbq', editHref: '/dash/businesses/edit?id=shaw-daddys-bbq' },
      { id: 'nielsens', viewHref: '/b/nielsens', editHref: '/dash/businesses/edit?id=nielsens' },
    ];

    for (const item of testCases) {
      const viewBtn = page.locator(`[data-testid="view-business-${item.id}"]`);
      const editBtn = page.locator(`[data-testid="edit-business-${item.id}"]`);

      await expect(viewBtn).toBeVisible();
      await expect(editBtn).toBeVisible();

      expect(await viewBtn.getAttribute('href')).toBe(item.viewHref);
      expect(await editBtn.getAttribute('href')).toBe(item.editHref);

      const viewBox = await viewBtn.boundingBox();
      const editBox = await editBtn.boundingBox();

      expect(viewBox).not.toBeNull();
      if (viewBox) {
        expect(viewBox.width).toBeGreaterThanOrEqual(44);
        expect(viewBox.height).toBeGreaterThanOrEqual(44);
      }

      expect(editBox).not.toBeNull();
      if (editBox) {
        expect(editBox.width).toBeGreaterThanOrEqual(44);
        expect(editBox.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);

    // 6. Save visual screenshot proof
    await page.screenshot({ path: 'tests/screenshots/dash_businesses_tab_filtered.png', fullPage: true });
    console.log('[SUCCESS] Saved visual screenshot proof to tests/screenshots/dash_businesses_tab_filtered.png');
  });

  test('2. Click [+ ADD BUSINESS] button and verify navigation to http://localhost:3000/b/create', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash?tab=businesses', { waitUntil: 'domcontentloaded' });

    // Wait for Businesses Manager section
    const bizManager = page.locator('[data-testid="dashboard-businesses-manager"]');
    await bizManager.waitFor({ state: 'visible', timeout: 10000 });

    // Find [+ ADD BUSINESS] button
    const addBizBtn = bizManager.locator('button', { hasText: /Add Business/i });
    await expect(addBizBtn).toBeVisible();

    // Verify touch target size
    const btnBox = await addBizBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    if (btnBox) {
      expect(btnBox.width).toBeGreaterThanOrEqual(44);
      expect(btnBox.height).toBeGreaterThanOrEqual(44);
    }

    // Click [+ ADD BUSINESS] button
    await addBizBtn.click();

    // Verify navigation to http://localhost:3000/b/create
    await page.waitForURL('**/b/create', { timeout: 10000 });
    expect(page.url()).toContain('/b/create');
    console.log('[NAVIGATION-VERIFICATION] Successfully navigated to /b/create after clicking Add Business.');

    expect(pageErrors.length).toBe(0);

    // Save visual screenshot proof
    await page.screenshot({ path: 'tests/screenshots/b_create_page.png', fullPage: true });
    console.log('[SUCCESS] Saved visual screenshot proof to tests/screenshots/b_create_page.png');
  });

});
