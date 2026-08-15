import { test, expect } from '@playwright/test';

test.describe('Gridpass News & Notification System Suite (Desktop & Mobile)', () => {
  
  // 1. Desktop Tests
  test('News portal renders dual-mode switcher, timeline feed, search, and hubs bar', async ({ page }) => {
    await page.goto('http://localhost:3000/news');

    // Verify Paddock Wire Header and View Mode Switcher
    await expect(page.locator('h1:has-text("Paddock Wire & Feed")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Timeline")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Magazine Grid")').first()).toBeVisible();

    // Verify Paddock Directory navigation link exists
    await expect(page.locator('a[href="/news/directory"]').first()).toBeAttached();

    // Verify category filter
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible();

    // Verify switching to Magazine Grid view
    await page.locator('button:has-text("Magazine Grid")').first().click();
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10000 });

    // Switch back to Timeline
    await page.locator('button:has-text("Timeline")').first().click();
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10000 });
  });

  test('Article reader renders Trackside Attendance, Discussion Thread, and simple back navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/news');

    // Wait for story cards to render in main feed and click first story headline link
    const storyLink = page.locator('article a[href^="/news/"]').first();
    await expect(storyLink).toBeVisible({ timeout: 10000 });
    await Promise.all([
      page.waitForURL(/\/news\/.+/, { timeout: 15000 }),
      storyLink.click(),
    ]);

    // Verify title and clean back button
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a:has-text("Back to All News")').first()).toBeVisible({ timeout: 10000 });

    // Verify Trackside Attendance button
    const tracksideBtn = page.locator('button:has-text("Trackside")').first();
    await expect(tracksideBtn).toBeVisible({ timeout: 10000 });

    // Verify Discussion Thread
    await expect(page.locator('text=Paddock Discussion & Comments')).toBeVisible({ timeout: 10000 });
    const upvoteBtn = page.locator('button:has-text("Like Story"), button:has-text("Liked")');
    await expect(upvoteBtn).toBeVisible({ timeout: 10000 });

    // Verify friendly comment form copy
    await expect(page.locator('button:has-text("Post Comment")')).toBeVisible({ timeout: 10000 });
  });

  test('Dedicated Paddock Directory page renders all entities and allows filtering', async ({ page }) => {
    await page.goto('http://localhost:3000/news/directory');

    // Verify Directory Header
    await expect(page.locator('h1:has-text("Motorsport Hubs Directory")')).toBeVisible();
    await expect(page.locator('a:has-text("Back to All News")')).toBeVisible();

    // Verify Filter Tabs
    await expect(page.locator('button:has-text("Championship Series")')).toBeVisible();
    await expect(page.locator('button:has-text("Race Teams")')).toBeVisible();

    // Click NASCAR card
    await expect(page.getByRole('link', { name: 'NASCAR Cup Series' }).first()).toBeVisible();
    const followBtns = page.locator('button:has-text("+ Follow"), button:has-text("Following")');
    await expect(followBtns.first()).toBeVisible();
  });

  // 2. Mobile Viewport Tests (iPhone 14/15 Pro: 390x844)
  test('Mobile: Notification Bell opens drawer, Homepage shows Latest News, and Navbar includes News link', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000');

    // Verify Homepage Latest News section on Mobile
    await expect(page.locator('text=Latest News')).toBeVisible();

    // Verify Notification Bell in Mobile Header
    const bellBtn = page.locator('button[aria-label="Member Notifications & Digest"]').first();
    await expect(bellBtn).toBeVisible();
    await bellBtn.click();

    // Verify Notification Drawer opened on Mobile
    await expect(page.locator('h2:has-text("Notifications & Digest")')).toBeVisible();
    await expect(page.locator('button:has-text("News Digest")')).toBeVisible();

    // Close Drawer
    const closeDrawerBtn = page.locator('button[aria-label="Close notifications"]');
    await closeDrawerBtn.click();
    await expect(page.locator('h2:has-text("Notifications & Digest")')).not.toBeVisible();

    // Verify Mobile Navigation Drawer contains News
    const hamburgerBtn = page.locator('button[aria-label="Toggle Mobile Navigation Drawer"], button[aria-label="Toggle Navigation Menu"]').first();
    await hamburgerBtn.click();
    const mobileNewsLink = page.locator('a:has-text("News")').last();
    await expect(mobileNewsLink).toBeVisible();
  });

  test('Mobile: Hub page renders clean SVG logo and back button on 390px mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/news/hub/series/nascar');

    // Verify Series Header and Back Button
    await expect(page.locator('h1:has-text("NASCAR Cup Series")')).toBeVisible();
    await expect(page.locator('a:has-text("Back to All News")')).toBeVisible();

    // Verify SVG Logo renders inside banner
    const logoImg = page.locator('img[alt="NASCAR Cup Series"]');
    await expect(logoImg).toBeVisible();
  });
});
