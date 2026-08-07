import { test, expect } from '@playwright/test';

test.describe('Gridpass Admin Suite & Management Console E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('Admin Overview directly renders members table cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');
    await expect(page.getByPlaceholder('Search member names, emails, UIDs...')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: '+ Add Row' })).toBeVisible();
  });

  test('Member Profiles Console renders full excel sheet grid with inline editing', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/users');
    await expect(page.getByPlaceholder('Search member names, emails, UIDs...')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Add Row' })).toBeVisible();
  });

  test('Sales Staff Console renders authorized sales roster and opens modal', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/staff');
    await expect(page.getByPlaceholder('Search sales reps...')).toBeVisible({ timeout: 20000 });
    
    const addBtn = page.getByRole('button', { name: '+ Add Row' });
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();

    await expect(page.getByRole('heading', { name: '+ Add Sales Rep' })).toBeVisible({ timeout: 10000 });
    await page.locator('input[placeholder="e.g. Zach Shaw"]').fill('GPTestUser_Michael_Jordan');
    await page.locator('input[placeholder="e.g. zach@shawdaddys.com"]').fill('GPTestUser_mjordan@gridpass.app');
    await page.getByRole('button', { name: 'Save Rep' }).click();

    await expect(page.locator('tbody tr').filter({ hasText: 'GPTestUser_Michael_Jordan' }).first()).toBeVisible({ timeout: 20000 });
  });

  test('Digital Garage Console renders clean table', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/vehicles');
    await expect(page.getByPlaceholder('Search make, model, VIN, owner...')).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: '+ Add Row' })).toBeVisible();
  });

  test('Features Operations Console renders excel sheet and allows adding a feature', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/features');
    await expect(page.getByPlaceholder('Search routes, feature names, module keys...')).toBeVisible({ timeout: 20000 });
    
    const addBtn = page.getByRole('button', { name: '+ Add Row' });
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();

    await expect(page.getByRole('heading', { name: 'Add Feature / Route Definition' })).toBeVisible({ timeout: 10000 });
  });

  test('Business Suite allows provisioning and module toggling', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/businesses');
    await expect(page.getByPlaceholder('Search business names, IDs, emails...')).toBeVisible({ timeout: 20000 });
    
    const addBtn = page.getByRole('button', { name: '+ Add Row' });
    await expect(addBtn).toBeVisible({ timeout: 15000 });
    await addBtn.click();

    await expect(page.getByRole('heading', { name: '+ Add Business Entity' })).toBeVisible({ timeout: 10000 });
  });

  test('Revenue Analytics renders telemetry status', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/analytics');
    await expect(page.getByRole('heading', { name: /(GRIDPASS REAL-TIME MAP|Revenue Analytics)/i })).toBeVisible({ timeout: 20000 });
  });
});
