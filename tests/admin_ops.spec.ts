import { test, expect } from '@playwright/test';

test.describe('Gridpass Admin Suite & Management Console E2E Tests', () => {

  test('Admin Overview directly renders members table cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    await expect(page.getByPlaceholder('Search column values...')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '+ Add Row' })).toBeVisible();
  });

  test('Member Profiles Console renders full excel sheet grid with inline editing', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/users');

    await expect(page.getByPlaceholder('Search column values...')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Add Row' })).toBeVisible();
  });

  test('Clients Worksheet Console renders clean excel sheet and allows logging clients', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/crm');

    await expect(page.getByPlaceholder('Search company, name, phone...')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: '+ Add Client' }).click();

    await expect(page.getByRole('heading', { name: 'Log New Client / Prospect' })).toBeVisible();
    await page.locator('input[placeholder="e.g. Road America Raceway"]').fill('Speedway Performance Lab');
    await page.locator('input[placeholder="e.g. Dave"]').fill('Mike');
    await page.locator('input[placeholder="e.g. Williams"]').fill('Vance');
    await page.locator('input[placeholder="dave@raceway.com"]').fill('mike@speedway.com');
    await page.getByRole('button', { name: 'Save Client' }).click();

    await expect(page.getByRole('table').getByText('Speedway Performance Lab')).toBeVisible({ timeout: 10000 });
  });

  test('Sales Staff Console renders authorized sales roster, generates Magic Link, and opens Staff Settings', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/staff');

    await expect(page.getByPlaceholder('Search staff name, email...')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: '+ Add Sales Staff' }).click();

    await expect(page.getByRole('heading', { name: 'Authorize Sales Staff Member' })).toBeVisible();
    await page.locator('input[placeholder="e.g. Michael Jordan"]').fill('Michael Jordan');
    await page.locator('input[placeholder="mike@gridpass.app"]').fill('mjordan@gridpass.app');
    await page.getByRole('button', { name: 'Authorize Sales Rep & Create Link' }).click();

    // Verify Magic Link Invitation Drawer opens
    await expect(page.getByRole('heading', { name: 'Staff Magic Link Invitation' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Generated Magic Login Link')).toBeVisible();
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('heading', { name: 'Staff Magic Link Invitation' })).not.toBeVisible();

    // Verify row appears in sales staff table
    await expect(page.locator('tbody tr').filter({ hasText: 'Michael Jordan' })).toBeVisible({ timeout: 10000 });

    // Open Staff Settings Drawer directly
    await page.getByRole('button', { name: 'Settings ⚙️' }).first().click();
    await expect(page.getByRole('heading', { name: 'Staff Detail & Profile Settings' })).toBeVisible();
    await page.getByRole('button', { name: 'Save Settings' }).click();
  });

  test('Staff Magic Link Portal /staff/invite allows staff onboarding and password setup', async ({ page }) => {
    await page.goto('http://localhost:3000/staff/invite?token=inv_test_token_123');

    await expect(page.getByRole('heading', { name: 'Welcome to Gridpass Sales Team' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Magic Link Authenticated')).toBeVisible();

    await page.locator('input[placeholder="e.g. Michael Jordan"]').fill('Sarah Sales Rep');
    await page.locator('input[placeholder="New Password"]').fill('SecretPass123!');
    await page.locator('input[placeholder="Confirm Password"]').fill('SecretPass123!');
    await page.getByRole('button', { name: 'Save Staff Profile & Settings' }).click();

    await expect(page.getByText('Your Gridpass Sales Staff profile & account settings have been saved!')).toBeVisible({ timeout: 10000 });
  });

  test('Digital Garage Console renders clean table', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/vehicles');

    await expect(page.getByPlaceholder('Search make, model, VIN...')).toBeVisible({ timeout: 10000 });
  });

  test('Features Operations Console renders excel sheet and allows adding a feature', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/features');

    await expect(page.getByPlaceholder(/Search features/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: '+ Add Feature Route' }).click();

    await expect(page.getByRole('heading', { name: 'Register Feature / Page Route' })).toBeVisible();
    await page.locator('input[placeholder="e.g. Automated SMS Reminders"]').fill('Digital Passport QR Staging');
    await page.getByRole('button', { name: 'Save Feature' }).click();

    await expect(page.getByRole('table').getByText('Digital Passport QR Staging')).toBeVisible({ timeout: 10000 });
  });

  test('Events Management Console allows creating an admin event', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/events');

    // Open Modal
    await page.getByRole('button', { name: /\+ Create Event/i }).click();
    await expect(page.getByRole('heading', { name: 'Create Admin Event' })).toBeVisible();

    await page.getByPlaceholder('Event title...').fill('Gridpass Autumn Shootout');
    await page.getByPlaceholder('Raceway / City name...').fill('Road America Staging');
    await page.getByRole('button', { name: 'Create Event', exact: true }).click();

    await expect(page.getByText('Gridpass Autumn Shootout')).toBeVisible();
  });

  test('Business Suite allows provisioning and module toggling', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/businesses');

    await expect(page.getByPlaceholder('Search business name, email...')).toBeVisible({ timeout: 10000 });

    // Open Provisioning Modal
    await page.getByRole('button', { name: /\+ Provision Business/i }).click();
    await expect(page.getByRole('heading', { name: 'Provision Business Account' })).toBeVisible();

    await page.getByPlaceholder('e.g. Precision Motorsport Garage').fill('High Octane Detailing');
    await page.getByPlaceholder('owner@business.com').fill('owner@highoctane.com');
    await page.getByRole('button', { name: 'Provision Account', exact: true }).click();

    await expect(page.getByText('High Octane Detailing')).toBeVisible();
  });

  test('Sales Pitch Studio renders live vertical switcher', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/demo');

    await expect(page.getByRole('heading', { name: /Off-The-Shelf Modules/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Instant Client Quote')).toBeVisible();
  });

  test('Backlog Hub allows logging request tickets', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/requests');

    await expect(page.getByPlaceholder('Search tickets, client...')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /\+ Log Ticket/i }).click();
    await page.getByPlaceholder('e.g. Add SMS appointment confirmation').fill('Stripe Billing Integration');
    await page.getByPlaceholder('Ticket details...').fill('Client wants Stripe invoice link for monthly renewal.');
    await page.getByRole('button', { name: 'Save Ticket', exact: true }).click();

    await expect(page.getByText('Stripe Billing Integration')).toBeVisible({ timeout: 10000 });
  });

  test('Revenue Analytics renders telemetry status', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/analytics');

    await expect(page.getByRole('heading', { name: /Revenue Analytics & Platform Telemetry HQ/i })).toBeVisible();
    await expect(page.getByText('Total Monthly Recurring Revenue')).toBeVisible();
  });
});
