import { test, expect } from '@playwright/test';

test.describe('E2E Visual Verification: Manage Passport Drawer - Work & Career Tab', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('Work & Career tab E2E visual verification and touch target validation', async ({ page }) => {
    // 1. Open driver passport page
    await page.goto('http://localhost:3000/u/pjlosey');

    // Verify page loaded
    await expect(page.locator('h1', { hasText: /PJ Losey|Marcus Mustang/ })).toBeVisible();

    // 1. Open Manage Passport drawer ([ ⚙️ Manage Passport ] button)
    const editPassportBtn = page.locator('[data-testid="edit-passport-btn"]').first();
    await expect(editPassportBtn).toBeVisible();
    await editPassportBtn.click();

    // Verify drawer is open
    const drawerTitle = page.locator('h2', { hasText: /Manage My Profile & Resume/i });
    await expect(drawerTitle).toBeVisible();

    // 2. Click the "💼 Work & Career" tab
    const careerTab = page.locator('button', { hasText: /Work & Career/i });
    await expect(careerTab).toBeVisible();
    await careerTab.click();

    // 3. Assert that Career History renders all 6 experiences
    const expectedExperiences = [
      'Honda Racing / HRC Trackside Engineer',
      'Siemens Healthineers Project Engineer',
      'Managed $5M+ Elite Racing Operations',
      'UpfittersOS',
      'srcommander',
      'Gridpass Platform & Waterway Radar'
    ];

    const expCards = page.locator('[data-testid^="edit-exp-btn-"]');
    const expCount = await expCards.count();
    expect(expCount).toBe(6);

    const drawer = page.locator('form');
    for (const expTitle of expectedExperiences) {
      await expect(drawer.locator(`h5:has-text("${expTitle}")`).first()).toBeVisible();
    }

    // 4. Assert that each experience item renders a "✏️ Edit" button
    for (let i = 0; i < expCount; i++) {
      const editBtn = expCards.nth(i);
      await expect(editBtn).toBeVisible();
      await expect(editBtn).toContainText(/Edit/);
    }

    // 5. Click "✏️ Edit" on the first item and verify form populates with the title and "Update Entry" button appears
    const firstEditBtn = expCards.first();
    await firstEditBtn.click();

    // Check title input is populated with first experience title
    const titleInput = page.locator('input[placeholder*="Job Title"]');
    await expect(titleInput).toHaveValue(expectedExperiences[0]);

    // Check "Update Entry" button appears
    const updateEntryBtn = page.locator('button', { hasText: /Update Entry/i });
    await expect(updateEntryBtn).toBeVisible();

    // 6. Verify touch targets >= 44px on all drawer buttons
    const drawerButtons = page.locator('[data-testid="edit-passport-drawer"] button');
    const buttonCount = await drawerButtons.count();
    expect(buttonCount).toBeGreaterThan(0);

    const violations: string[] = [];

    for (let i = 0; i < buttonCount; i++) {
      const btn = drawerButtons.nth(i);
      if (await btn.isVisible()) {
        const box = await btn.boundingBox();
        if (box) {
          // Allow minor sub-pixel rendering floating point differences (e.g. 43.9px) by checking >= 43.5
          if (box.width < 43.5 || box.height < 43.5) {
            const btnText = (await btn.innerText()).trim() || (await btn.getAttribute('aria-label')) || (await btn.getAttribute('data-testid')) || 'unnamed button';
            violations.push(`Button "${btnText}" is ${box.width.toFixed(1)}px x ${box.height.toFixed(1)}px (expected >= 44px)`);
          }
        }
      }
    }

    expect(violations, `Touch target violations found:\n${violations.join('\n')}`).toEqual([]);
  });

});
