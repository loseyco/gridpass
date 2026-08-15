import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Unified StorageSpaceForm E2E Visual Verification Suite', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

    // Inject Playwright mock environment
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('__playwright_mock__', 'true');
    });
  });

  test('1. Create Mode (/dash/space/new) - Verify form fields match requirements', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    console.log('[STEP 1] Navigating to http://localhost:3000/dash/space/new...');
    await page.goto('http://localhost:3000/dash/space/new', { waitUntil: 'domcontentloaded' });

    // Verify main header
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Add Physical Storage Space');

    // 1. Space Name field
    const nameInput = page.locator('[data-testid="space-name-input"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute('placeholder', /Main HQ Garage/);

    // 2. Space Type select with "Other Storage Location / Custom"
    const typeSelect = page.locator('[data-testid="space-type-select"]');
    await expect(typeSelect).toBeVisible();
    const typeOptions = await typeSelect.locator('option').allInnerTexts();
    expect(typeOptions).toContain('Other Storage Location / Custom');

    // 3. Dimensions / Size field
    const dimensionsInput = page.locator('[data-testid="space-dimensions-input"]');
    await expect(dimensionsInput).toBeVisible();

    // 4. Location / Address field
    const locationInput = page.locator('[data-testid="space-location-input"]');
    await expect(locationInput).toBeVisible();

    // 5. Access Code & Security Notes textarea
    const accessNotesInput = page.locator('[data-testid="space-access-notes-input"]');
    await expect(accessNotesInput).toBeVisible();

    // 6. Storage Space Photo dropzone / uploader
    const photoDropzone = page.locator('[data-testid="space-photo-dropzone"]');
    await expect(photoDropzone).toBeVisible();
    await expect(photoDropzone).toContainText('[ 📸 Upload Space Photo ]');

    // 7. Dual-Native Vehicle Sync Section
    const dualVehicleSection = page.locator('[data-testid="dual-vehicle-sync-section"]');
    await expect(dualVehicleSection).toBeVisible();

    const vehicleCheckbox = page.locator('[data-testid="register-as-vehicle-checkbox"]');
    await expect(vehicleCheckbox).toBeVisible();

    // Select Utility Trailer to reveal trailer options & hitch select
    await typeSelect.selectOption('Utility Trailer');
    const hitchSelect = page.locator('[data-testid="trailer-hitch-select"]');
    await expect(hitchSelect).toBeVisible();

    const hitchOptions = await hitchSelect.locator('option').allInnerTexts();
    expect(hitchOptions).toContain('1-7/8" Ball Hitch');

    // 8. Delete button should NOT be present in Create mode
    const deleteBtn = page.locator('[data-testid="soft-delete-space-btn"]');
    await expect(deleteBtn).toHaveCount(0);

    // Ensure screenshots directory exists
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, 'storage_space_form_create_mode.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[CREATE MODE SCREENSHOT] Saved proof to ${screenshotPath}`);

    expect(pageErrors.length).toBe(0);
  });

  test('2. Edit Mode (/dash/space/space-1/edit) - Verify 100% field parity & Delete button', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    console.log('[STEP 2] Navigating to http://localhost:3000/dash/space/space-1/edit...');
    await page.goto('http://localhost:3000/dash/space/space-1/edit', { waitUntil: 'domcontentloaded' });

    // Verify header in edit mode
    const header = page.locator('h1');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Physical Storage Space Passport');

    // 1. Space Name field populated with initial data
    const nameInput = page.locator('[data-testid="space-name-input"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue("Kristina's Garage");

    // 2. Space Type select with "Other Storage Location / Custom" option
    const typeSelect = page.locator('[data-testid="space-type-select"]');
    await expect(typeSelect).toBeVisible();
    await expect(typeSelect).toHaveValue('Garage');
    const typeOptions = await typeSelect.locator('option').allInnerTexts();
    expect(typeOptions).toContain('Other Storage Location / Custom');

    // 3. Dimensions / Size field populated with initial data
    const dimensionsInput = page.locator('[data-testid="space-dimensions-input"]');
    await expect(dimensionsInput).toBeVisible();
    await expect(dimensionsInput).toHaveValue('600 sqft');

    // 4. Location / Address field populated with initial data
    const locationInput = page.locator('[data-testid="space-location-input"]');
    await expect(locationInput).toBeVisible();
    await expect(locationInput).toHaveValue('Grayslake, IL');

    // 5. Access Code Notes textarea populated with initial data
    const accessNotesInput = page.locator('[data-testid="space-access-notes-input"]');
    await expect(accessNotesInput).toBeVisible();
    await expect(accessNotesInput).toHaveValue('Gate code #4092, keybox next to side door.');

    // 6. Photo Uploader
    const photoDropzone = page.locator('[data-testid="space-photo-dropzone"]');
    await expect(photoDropzone).toBeVisible();

    // 7. Dual Vehicle Sync card & 1-7/8" Ball option check
    const dualVehicleSection = page.locator('[data-testid="dual-vehicle-sync-section"]');
    await expect(dualVehicleSection).toBeVisible();

    const vehicleCheckbox = page.locator('[data-testid="register-as-vehicle-checkbox"]');
    await expect(vehicleCheckbox).toBeVisible();

    // Check the dual vehicle checkbox to inspect hitch options in edit mode
    await vehicleCheckbox.check();
    const hitchSelect = page.locator('[data-testid="trailer-hitch-select"]');
    await expect(hitchSelect).toBeVisible();

    const hitchOptions = await hitchSelect.locator('option').allInnerTexts();
    expect(hitchOptions).toContain('1-7/8" Ball Hitch');

    // 8. Delete button MUST be visible and active in Edit mode
    const deleteBtn = page.locator('[data-testid="soft-delete-space-btn"]');
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toContainText('Delete');

    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, 'storage_space_form_edit_mode.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[EDIT MODE SCREENSHOT] Saved proof to ${screenshotPath}`);

    expect(pageErrors.length).toBe(0);
  });

});
