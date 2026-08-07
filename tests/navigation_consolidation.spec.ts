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

  test('Home page event card links and category navigation pills function correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Verify Hero Header
    await expect(page.locator('h1')).toContainText(/ONE TAG FOR EVERYTHING/i);

    // Verify category navigation pills
    await expect(page.locator('a[href="/vehicles"]').first()).toBeVisible();
    await expect(page.locator('a[href="/events"]').first()).toBeVisible();
    await expect(page.locator('a[href="/businesses"]').first()).toBeVisible();
    await expect(page.locator('a[href="/explore"]').first()).toBeVisible();

    // Verify Featured Events section and event card links
    await expect(page.locator('text=Featured Events & Meets')).toBeVisible();

    // Verify "All Events" link
    const allEventsLink = page.locator('a[href="/events"]').first();
    await expect(allEventsLink).toBeVisible();
  });

  test('Explore page features searchable Events directory link & navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/explore');

    // Verify Title
    await expect(page.locator('h1')).toContainText(/Explore Gridpass/i);

    // Verify Events link in directory categories
    const eventsLink = page.locator('a[href="/events"]').first();
    await expect(eventsLink).toBeVisible();

    // Click Events link
    await eventsLink.click();

    // Verify redirected to Events page
    await expect(page).toHaveURL(/.*\/events/);
  });

  test('Live Feed route /feed renders community activity stream', async ({ page }) => {
    await page.goto('http://localhost:3000/feed');

    // Verify Header and Live Activity Feed component
    await expect(page.locator('h1')).toContainText(/Live Feed/i);
    await expect(page.locator('text=Community Activity Stream')).toBeVisible();
  });

});

