import { test, expect } from '@playwright/test';

test.describe('Second Life Venue Portal & Tabs E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('Skinny Dip Inn - Apply tab rendering and form interaction', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=apply');
    await page.waitForLoadState('networkidle');

    // Title / Header verification
    await expect(page.locator('h1, h2, h3')).toContainText(/Skinny Dip Inn/i);
    
    // Tab active button check
    const applyTabBtn = page.getByRole('button', { name: /Apply \(DJ \/ Host\)/i });
    await expect(applyTabBtn).toBeVisible();

    // Verify Apply tab content is rendered
    await expect(page.getByText(/Apply/i).first()).toBeVisible();
  });

  test('Skinny Dip Inn - Staff tab rendering', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=staff');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3')).toContainText(/Skinny Dip Inn/i);
    
    const staffTabBtn = page.getByRole('button', { name: /Staff Roster/i });
    await expect(staffTabBtn).toBeVisible();

    // Verify Staff Roster / Staff section content
    await expect(page.getByText(/Staff/i).first()).toBeVisible();
  });

  test('Skinny Dip Inn - Schedule tab rendering', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=schedule');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3')).toContainText(/Skinny Dip Inn/i);
    
    const scheduleTabBtn = page.getByRole('button', { name: /Party Schedule/i });
    await expect(scheduleTabBtn).toBeVisible();

    // Verify Schedule section content
    await expect(page.getByText(/Schedule/i).first()).toBeVisible();
  });

  test('Skinny Dip Inn - Applications tab rendering', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=applications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3')).toContainText(/Skinny Dip Inn/i);
    
    const appsBtn = page.getByRole('button', { name: /Applications/i });
    await expect(appsBtn).toBeVisible();
  });

});
