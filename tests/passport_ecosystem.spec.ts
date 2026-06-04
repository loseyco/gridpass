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
    await expect(page.locator('h3:has-text("Become an Original Supporter")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Back Gridpass")').first()).toBeVisible();
  });

  test('Dashboard Mock Profile & Supporter Gold Ring', async ({ page }) => {
    await page.goto('/dash');
    await expect(page.locator('h2:has-text("Digital Garage")')).toBeVisible();
    
    // Default mock is supporter in playwright mode, check gold ring gradient class
    const avatarContainer = page.locator('#user-avatar-container');
    await expect(avatarContainer).toHaveClass(/bg-gradient-to-tr/);
    await expect(avatarContainer).toHaveClass(/from-\[#ffe066\]/);
    
    // Check Back the Cause card active status
    await expect(page.locator('text=Supporter Active')).toBeVisible();
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
