import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Create Space Visual & Touch Target E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

    // Inject Playwright mock environment
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('__playwright_mock__', 'true');
    });
  });

  test('Verify /dash/space/new visual background, dropzone field, and touch targets >= 44px', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash/space/new', { waitUntil: 'domcontentloaded' });

    // 1. Verify page background is solid white (bg-white)
    const pageContainer = page.locator('main').first();
    await expect(pageContainer).toBeVisible();
    await expect(pageContainer).toHaveClass(/bg-white/);

    const innerPageDiv = page.locator('div.bg-white').first();
    await expect(innerPageDiv).toBeVisible();
    await expect(innerPageDiv).toHaveClass(/bg-white/);

    const backgroundColor = await innerPageDiv.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log('[VISUAL-TEST] Main background computed color:', backgroundColor);
    expect(backgroundColor).toBe('rgb(255, 255, 255)');

    // 2. Verify Access Code & Security Notes textarea field is rendered
    const accessNotesInput = page.locator('[data-testid="space-access-notes-input"]');
    await expect(accessNotesInput).toBeVisible();
    await expect(accessNotesInput).toHaveAttribute('placeholder', /Gate codes, keybox combinations/);

    // 3. Verify "[ 📸 Upload Space Photo ]" dropzone field is visibly rendered under Location / Address
    const locationInput = page.locator('[data-testid="space-location-input"]');
    await expect(locationInput).toBeVisible();

    const dropzone = page.locator('[data-testid="space-photo-dropzone"]');
    await expect(dropzone).toBeVisible();
    await expect(dropzone).toContainText('[ 📸 Upload Space Photo ]');

    // Verify positioning: dropzone is rendered under location input
    const locationBox = await locationInput.boundingBox();
    const dropzoneBox = await dropzone.boundingBox();

    expect(locationBox).not.toBeNull();
    expect(dropzoneBox).not.toBeNull();

    if (locationBox && dropzoneBox) {
      console.log(`[VISUAL-TEST] Location Y: ${locationBox.y}, Dropzone Y: ${dropzoneBox.y}`);
      expect(dropzoneBox.y).toBeGreaterThan(locationBox.y);
    }

    // 4. Verify all inputs and buttons satisfy touch targets >= 44px
    const touchTargetSelectors = [
      { name: 'Back to Spaces button', selector: '[data-testid="back-to-spaces-btn"]' },
      { name: 'Space Name input', selector: '[data-testid="space-name-input"]' },
      { name: 'Space Type select', selector: '[data-testid="space-type-select"]' },
      { name: 'Dimensions / Size input', selector: '[data-testid="space-dimensions-input"]' },
      { name: 'Location / Address input', selector: '[data-testid="space-location-input"]' },
      { name: 'Access Code Notes textarea', selector: '[data-testid="space-access-notes-input"]' },
      { name: 'Upload Space Photo dropzone', selector: '[data-testid="space-photo-dropzone"]' },
      { name: 'Cancel button', selector: '[data-testid="cancel-space-btn"]' },
      { name: 'Submit Add Space button', selector: '[data-testid="submit-space-btn"]' },
    ];

    console.log('[TOUCH-TARGET AUDIT] Auditing interactive inputs & buttons on /dash/space/new:');
    for (const item of touchTargetSelectors) {
      const element = page.locator(item.selector);
      await expect(element).toBeVisible();
      const box = await element.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        console.log(` - ${item.name}: ${box.width.toFixed(1)}px x ${box.height.toFixed(1)}px`);
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);

    // Save screenshot proof
    await page.screenshot({ path: 'tests/screenshots/dash_space_new_visual.png', fullPage: true });
    console.log('[VISUAL-TEST] Screenshot successfully saved to tests/screenshots/dash_space_new_visual.png');
  });

  test('Verify space type select includes "Other Storage Location" and Utility Trailer hitch ball sizes', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // 1. Navigate to http://localhost:3000/dash/space/new
    await page.goto('http://localhost:3000/dash/space/new', { waitUntil: 'domcontentloaded' });

    // 2. Verify space type select includes "Other Storage Location"
    const spaceTypeSelect = page.locator('[data-testid="space-type-select"]');
    await expect(spaceTypeSelect).toBeVisible();

    const spaceTypeOptions = await spaceTypeSelect.locator('option').allInnerTexts();
    console.log('[VISUAL-TEST] Space Type Options:', spaceTypeOptions);
    expect(spaceTypeOptions).toContain('Other Storage Location');

    // 3. Select "Utility Trailer" space type
    await spaceTypeSelect.selectOption({ label: 'Utility Trailer' });

    // Verify trailer-hitch-select is visible
    const hitchSelect = page.locator('[data-testid="trailer-hitch-select"]');
    await expect(hitchSelect).toBeVisible();

    // Verify trailer-hitch-select includes expected ball sizes & hitch types
    const hitchOptions = await hitchSelect.locator('option').allInnerTexts();
    console.log('[VISUAL-TEST] Trailer Hitch Options:', hitchOptions);

    const expectedHitchOptions = [
      '1-7/8" Ball Hitch',
      '2" Ball Hitch',
      '2-5/16" Ball Hitch',
      '3" Gooseneck Ball',
      '5th Wheel Kingpin',
      'Pintle Hook / Ring',
      'Weight Distribution Hitch',
      'Other / Custom Hitch',
    ];

    for (const expectedOpt of expectedHitchOptions) {
      expect(hitchOptions).toContain(expectedOpt);
    }

    expect(pageErrors.length).toBe(0);

    // Save screenshot proof
    const screenshotPath = path.join(process.cwd(), 'tests', 'screenshots', 'trailer_hitch_space_types_visual.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[VISUAL-TEST] Screenshot proof successfully saved to ${screenshotPath}`);
  });

});

