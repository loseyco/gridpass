import { test, expect } from '@playwright/test';

test.describe('Gridpass Ops B2B Partner Portal & Demo Studio E2E Tests', () => {

  test('Partner Overview renders stats, KPI cards, and backlog feed', async ({ page }) => {
    await page.goto('http://localhost:3000/partner');

    // Header title
    await expect(page.locator('h1')).toContainText(/Gridpass Ops Hub/i);

    // KPI Cards
    await expect(page.getByText('Monthly Recurring Revenue')).toBeVisible();
    await expect(page.getByText('Active Client Orgs')).toBeVisible();
    await expect(page.getByText('Open Requests & Bugs')).toBeVisible();
    await expect(page.getByText('Platform QR Scans')).toBeVisible();
  });

  test('Sales Pitch Studio switches verticals and updates dynamic quote', async ({ page }) => {
    await page.goto('http://localhost:3000/partner/demo');

    await expect(page.locator('h1')).toContainText(/Live Sales Pitch & Quote Builder/i);

    // Test Vertical Switcher Buttons
    await page.getByRole('button', { name: /food truck/i }).click();
    await expect(page.getByText('Live Location Pin')).toBeVisible();

    await page.getByRole('button', { name: /race team/i }).click();
    await expect(page.getByText('Car #88 Transponder Sync')).toBeVisible();

    await page.getByRole('button', { name: /track venue/i }).click();
    await expect(page.getByRole('heading', { name: 'Midwest Raceway Complex' })).toBeVisible();

    // Pricing Quote Generator
    await expect(page.getByText('Total Projected Price')).toBeVisible();
  });

  test('Client Management allows toggling module entitlements and account provisioning', async ({ page }) => {
    await page.goto('http://localhost:3000/partner/clients');

    await expect(page.locator('h1')).toContainText(/Client Business Management/i);

    // Open Provisioning Modal
    await page.getByRole('button', { name: /\+ Provision New Client/i }).click();
    await expect(page.getByText('Provision New Client Account')).toBeVisible();

    // Fill form
    await page.getByPlaceholder('e.g. Blarney Island Speedboats').fill('Precision Auto Wraps');
    await page.getByPlaceholder('owner@client.com').fill('contact@precisionwraps.com');
    await page.getByRole('button', { name: /Provision Account/i }).click();

    // Verify new client added
    await expect(page.getByRole('heading', { name: 'Precision Auto Wraps' })).toBeVisible();
  });

  test('Requests and Bugs Backlog Hub allows submitting and updating tickets', async ({ page }) => {
    await page.goto('http://localhost:3000/partner/requests');

    await expect(page.locator('h1')).toContainText(/Feature Requests & Bug Backlog Hub/i);

    // Open Modal
    await page.getByRole('button', { name: /\+ Log Request \/ Bug/i }).click();

    await page.getByPlaceholder('e.g. Add SMS appointment confirmation for Auto Shop').fill('Mobile Invoice PDF Export');
    await page.getByPlaceholder('Describe what the client needs or what bug occurred...').fill('Auto shop client needs one-click PDF invoice generation.');
    await page.getByRole('button', { name: /Log Ticket/i }).click();

    // Verify new ticket logged
    await expect(page.getByText('Mobile Invoice PDF Export')).toBeVisible();
  });

  test('Revenue Analytics HQ renders MRR breakdown and telemetry status', async ({ page }) => {
    await page.goto('http://localhost:3000/partner/analytics');

    await expect(page.locator('h1')).toContainText(/Revenue Analytics & Platform Telemetry HQ/i);

    await expect(page.getByText('Total Monthly Recurring Revenue')).toBeVisible();
    await expect(page.getByText('MRR Breakdown by Business Vertical')).toBeVisible();
    await expect(page.getByText('Firestore Businesses Collection')).toBeVisible();
  });
});
