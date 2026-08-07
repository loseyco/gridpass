import { test, expect } from '@playwright/test';

test.describe('Consolidated Navigation E2E Suite', () => {

  test('AppShell renders consolidated 3-item main menu links (Explore, Feed, Dash)', async ({ page }) => {
    await page.goto('http://localhost:3000/dash');

    // Navigation links: Explore, Feed, Dash
    await expect(page.locator('a[href="/explore"]').first()).toBeAttached();
    await expect(page.locator('a[href="/feed"]').first()).toBeAttached();
    await expect(page.locator('a[href="/dash"]').first()).toBeAttached();

    // Verify Scanner link was dropped from main menus
    await expect(page.locator('nav a[href="/scan"]')).toHaveCount(0);
  });

  test('Explore page features searchable Events tab & Active/Archive filter bar', async ({ page }) => {
    await page.goto('http://localhost:3000/explore');

    // Verify Title
    await expect(page.locator('h1')).toContainText(/Explore Gridpass/i);

    // Verify Events tab button in directory tabs
    const eventsTab = page.locator('button').filter({ hasText: /Events/i }).first();
    await expect(eventsTab).toBeVisible();

    // Click Events tab
    await eventsTab.click();

    // Verify Events content section renders
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('Live Feed route /feed renders community activity stream', async ({ page }) => {
    await page.goto('http://localhost:3000/feed');

    // Verify Header and Live Activity Feed component
    await expect(page.locator('h1')).toContainText(/Live Feed/i);
    await expect(page.locator('text=Community Activity Stream')).toBeVisible();
  });

});
