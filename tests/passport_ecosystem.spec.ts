import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_MOCK__ = true;
  });
});

test.describe('Gridpass Phase 1: Core Foundation & Support Portal Tests', () => {

  test('Homepage Loads & Displays Back the Cause', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(/One Tag/i);
    await expect(page.locator('text=Become an Original Supporter')).toBeVisible();
    await expect(page.locator('text=Back Gridpass')).toBeVisible();
  });

  test('Dashboard Mock Profile & Supporter Gold Ring', async ({ page }) => {
    await page.goto('/dash');
    await expect(page.locator('text=Digital Garage')).toBeVisible();
    
    // Default mock is supporter in playwright mode, check gold ring gradient class
    const avatarContainer = page.locator('#user-avatar-container');
    await expect(avatarContainer).toHaveClass(/bg-gradient-to-tr/);
    await expect(avatarContainer).toHaveClass(/from-\[#ffe066\]/);
    
    // Check Back the Cause card active status
    await expect(page.locator('text=Supporter Active')).toBeVisible();
  });

  test('Sitemap Waitlist Gates Redirect Correctly', async ({ page }) => {
    const soonPages = [
      { path: '/spotted', title: 'Spotted Near You' },
      { path: '/leaderboard', title: 'Ecosystem Leaderboards' },
      { path: '/track/demo-track', title: 'Racetrack Waiver Portal' },
      { path: '/grid/demo-grid', title: 'Grid Marshall Console' },
      { path: '/b/demo-biz', title: 'B2B Dealership & Shop Hub' },
      { path: '/v/demo-vehicle', title: 'Vehicle Passport' },
      { path: '/u/demo-user', title: 'Driver Passport' }
    ];

    for (const pageInfo of soonPages) {
      await page.goto(pageInfo.path);
      await expect(page.locator('h1')).toContainText(pageInfo.title);
      await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
      await expect(page.locator('button:has-text("Join Waitlist")')).toBeVisible();
    }
  });

  test('Meta Sharing Headers Exist in Layout', async ({ page }) => {
    await page.goto('/');
    
    // Verify og:title and og:description meta tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toContain('Gridpass');

    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBe('summary_large_image');
  });

});
