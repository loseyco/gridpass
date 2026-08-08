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
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Skinny Dip Inn/i);
    
    // Tab active button check
    const applyTabBtn = page.getByRole('button', { name: /Apply \(DJ \/ Host\)/i });
    await expect(applyTabBtn).toBeVisible();

    // Verify Apply tab content is rendered
    await expect(page.getByText(/Apply/i).first()).toBeVisible();
  });

  test('Skinny Dip Inn - Staff tab rendering', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=staff');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').first()).toContainText(/Skinny Dip Inn/i);
    
    const staffTabBtn = page.getByRole('button', { name: /Staff Roster/i });
    await expect(staffTabBtn).toBeVisible();

    // Verify Staff Roster / Staff section content
    await expect(page.getByText(/Staff/i).first()).toBeVisible();
  });

  test('Skinny Dip Inn - Schedule tab rendering', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=schedule');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').first()).toContainText(/Skinny Dip Inn/i);
    
    const scheduleTabBtn = page.getByRole('button', { name: /Party Schedule/i });
    await expect(scheduleTabBtn).toBeVisible();

    // Verify Schedule section content
    await expect(page.getByText(/Schedule/i).first()).toBeVisible();
  });

  test('Skinny Dip Inn - Applications tab rendering', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=applications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').first()).toContainText(/Skinny Dip Inn/i);
    
    const appsBtn = page.getByRole('button', { name: /Applications/i });
    await expect(appsBtn).toBeVisible();
  });

  test('Skinny Dip Inn - Resort Photo Gallery tab category pills & photo grid rendering', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=gallery');
    await page.waitForLoadState('networkidle');

    // Title / Header verification
    await expect(page.locator('h1, h2, h3').first()).toContainText(/Skinny Dip Inn/i);

    // Gallery section title & button
    await expect(page.getByText('Resort Photo Gallery')).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Photo/i })).toBeVisible();

    // Category pills check
    await expect(page.getByRole('button', { name: /Beach & Pool/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /DJ & Parties/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Resort Grounds/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /VIP Cabanas/i })).toBeVisible();

    // Verify photo grid items are visible
    await expect(page.getByText('Sunset Beach Deck & Pool')).toBeVisible();
    await expect(page.getByText('Friday Night Live DJ Set')).toBeVisible();

    // Category filtering test
    await page.getByRole('button', { name: /DJ & Parties/i }).click();
    await expect(page.getByText('Friday Night Live DJ Set')).toBeVisible();
    await expect(page.getByText('Sunset Beach Deck & Pool')).not.toBeVisible();

    // Reset filter
    await page.getByRole('button', { name: /All/i }).first().click();
    await expect(page.getByText('Sunset Beach Deck & Pool')).toBeVisible();
  });

  test('Skinny Dip Inn - Lightbox modal preview interaction', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=gallery');
    await page.waitForLoadState('networkidle');

    // Click on photo card
    await page.getByText('Sunset Beach Deck & Pool').click();

    // Lightbox modal should open
    const modal = page.locator('[data-testid="lightbox-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Golden hour at the main resort infinity pool and ocean lounge.')).toBeVisible();

    // Close lightbox modal
    await page.getByRole('button', { name: /Close Lightbox/i }).click();
    await expect(modal).not.toBeVisible();
  });

  test('Skinny Dip Inn - Add Photo modal interaction', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=gallery');
    await page.waitForLoadState('networkidle');

    // Open Add Photo Modal
    await page.getByRole('button', { name: /Add Photo/i }).click();

    const addModal = page.locator('[data-testid="add-photo-modal"]');
    await expect(addModal).toBeVisible();

    // Fill out form
    await addModal.getByPlaceholder('e.g. VIP Sunset Party').fill('E2E Sunset Paradise');
    await addModal.getByPlaceholder('Describe the photo snapshot...').fill('Beautiful dusk shot from the E2E visual test runner.');
    
    // Submit form
    await addModal.getByRole('button', { name: /Upload Photo/i }).click();

    // Modal closes
    await expect(addModal).not.toBeVisible();

    // New photo visible in grid
    await expect(page.getByText('E2E Sunset Paradise')).toBeVisible();
  });

});

