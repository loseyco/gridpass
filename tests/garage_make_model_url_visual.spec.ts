import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('E2E Visual Tests — Garage Item Make, Model & Product Link Fields', () => {

  test.beforeEach(async ({ page }) => {
    // Inject Playwright mock environment
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('Verify Make, Model, Product Link fields rendering, touch targets >= 44px, and card rendering upon save', async ({ page }) => {
    // Ensure screenshot directory exists
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // 1. Navigate to http://localhost:3000/dash/garage
    await page.goto('http://localhost:3000/dash/garage');

    // 2. Open Stage New Garage Item modal
    const stageItemBtn = page.locator('[data-testid="stage-item-btn"]');
    await expect(stageItemBtn).toBeVisible();
    await stageItemBtn.click();

    const itemModal = page.locator('[data-testid="item-passport-modal"]');
    await expect(itemModal).toBeVisible();

    // 3. Locate target inputs
    const makeInput = page.locator('[data-testid="item-make-input"]');
    const modelInput = page.locator('[data-testid="item-model-input"]');
    const urlInput = page.locator('[data-testid="item-website-url-input"]');

    // Verify fields are rendered
    await expect(makeInput).toBeVisible();
    await expect(modelInput).toBeVisible();
    await expect(urlInput).toBeVisible();

    // Verify touch targets >= 44px
    const makeBox = await makeInput.boundingBox();
    expect(makeBox).not.toBeNull();
    if (makeBox) {
      expect(makeBox.width).toBeGreaterThanOrEqual(44);
      expect(makeBox.height).toBeGreaterThanOrEqual(44);
    }

    const modelBox = await modelInput.boundingBox();
    expect(modelBox).not.toBeNull();
    if (modelBox) {
      expect(modelBox.width).toBeGreaterThanOrEqual(44);
      expect(modelBox.height).toBeGreaterThanOrEqual(44);
    }

    const urlBox = await urlInput.boundingBox();
    expect(urlBox).not.toBeNull();
    if (urlBox) {
      expect(urlBox.width).toBeGreaterThanOrEqual(44);
      expect(urlBox.height).toBeGreaterThanOrEqual(44);
    }

    // 4. Fill fields
    const titleInput = page.locator('form input[required]').first();
    await titleInput.fill('Ford Mustang GT 5.0 Crate Engine');

    await makeInput.fill('Ford');
    await modelInput.fill('Mustang GT 5.0');
    await urlInput.fill('https://www.fordperformance.com/part/M-6007-D50');

    // Verify inputs have expected values
    await expect(makeInput).toHaveValue('Ford');
    await expect(modelInput).toHaveValue('Mustang GT 5.0');
    await expect(urlInput).toHaveValue('https://www.fordperformance.com/part/M-6007-D50');

    // Screenshot of modal with filled fields
    await page.screenshot({ path: 'tests/screenshots/garage_item_modal_filled.png' });

    // 5. Save item
    const saveBtn = page.locator('button[type="submit"]', { hasText: 'Save Item Passport' });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify modal closes
    await expect(itemModal).not.toBeVisible();

    // 6. Verify Make/Model badge and Product Link button rendered on inventory item card
    const makeModelBadge = page.locator('text="Ford • Mustang GT 5.0"').first();
    await expect(makeModelBadge).toBeVisible();

    const productLinkBtn = page.locator('a[href="https://www.fordperformance.com/part/M-6007-D50"]').first();
    await expect(productLinkBtn).toBeVisible();
    await expect(productLinkBtn).toContainText('Product Link');

    // Screenshot proof of saved inventory item card
    await page.screenshot({ path: 'tests/screenshots/garage_item_card_saved.png', fullPage: true });
  });

});
