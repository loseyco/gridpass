import { test, expect } from '@playwright/test';

test.describe('Standalone Inventory HQ & Site-wide Links Visual E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('__playwright_mock__', 'true');
    });
  });

  test('1. Navigate to /inventory and verify standalone app header INVENTORY HQ, 4 sub-tabs, and Stage Item Make/Model fields', async ({ page }) => {
    // Navigate directly to standalone /inventory route
    await page.goto('/inventory');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify standalone app header INVENTORY HQ
    const headerElement = page.locator('[data-testid="inventory-hq-header"]');
    await expect(headerElement).toBeVisible();
    await expect(headerElement).toContainText('INVENTORY HQ');

    // 2. Verify sub-tabs (Inventory, Storyboard, QR Tags, Insurance)
    const subtabInventory = page.locator('[data-testid="subtab-inventory"]');
    const subtabStoryboard = page.locator('[data-testid="subtab-storyboard"]');
    const subtabQRTags = page.locator('[data-testid="subtab-qr-tags"]');
    const subtabInsurance = page.locator('[data-testid="subtab-insurance"]');

    await expect(subtabInventory).toBeVisible();
    await expect(subtabInventory).toContainText('Inventory');

    await expect(subtabStoryboard).toBeVisible();
    await expect(subtabStoryboard).toContainText('Storyboard');

    await expect(subtabQRTags).toBeVisible();
    await expect(subtabQRTags).toContainText('QR Tags');

    await expect(subtabInsurance).toBeVisible();
    await expect(subtabInsurance).toContainText('Insurance');

    // Click through each subtab to verify UI reactivity
    await subtabStoryboard.click();
    await expect(page.locator('[data-testid="transformation-storyboard-section"]')).toBeVisible();

    await subtabQRTags.click();
    await expect(page.locator('[data-testid="qr-tags-section"]')).toBeVisible();

    await subtabInsurance.click();
    await expect(page.locator('[data-testid="insurance-schedule-section"]')).toBeVisible();

    // Switch back to Inventory subtab
    await subtabInventory.click();

    // 3. Open Stage Item modal and verify Make & Model fields
    const stageItemBtn = page.locator('[data-testid="stage-item-btn"]');
    await expect(stageItemBtn).toBeVisible();
    await stageItemBtn.click();

    const itemModal = page.locator('[data-testid="item-passport-modal"]');
    await expect(itemModal).toBeVisible();

    const makeInput = page.locator('[data-testid="item-make-input"]');
    const modelInput = page.locator('[data-testid="item-model-input"]');

    await expect(makeInput).toBeVisible();
    await expect(modelInput).toBeVisible();

    // Type sample values into Make and Model fields to demonstrate interactive input
    await makeInput.fill('Ford Performance');
    await modelInput.fill('GT 5.0 Intake Manifold');

    // Screenshot proof for Step 1
    await page.screenshot({ path: 'test-results/standalone_inventory_hq_verified.png', fullPage: true });

    // Close modal
    const closeModalBtn = page.locator('[data-testid="close-item-passport-modal-btn"]');
    await closeModalBtn.click();
    await expect(itemModal).not.toBeVisible();
  });

  test('2. Navigate to /dash?tab=spaces and click Inventory link on space card, verifying redirect to /inventory', async ({ page }) => {
    // Navigate to /dash?tab=spaces
    await page.goto('/dash?tab=spaces');
    await page.waitForLoadState('domcontentloaded');

    // Verify spaces tab container
    const spacesTabContainer = page.locator('[data-testid="dashboard-space-manager"]');
    await expect(spacesTabContainer).toBeVisible();

    // Locate "Inventory →" button on first space card
    const firstSpaceInventoryBtn = page.locator('[data-testid^="manage-space-"]').first();
    await expect(firstSpaceInventoryBtn).toBeVisible();
    await expect(firstSpaceInventoryBtn).toContainText('Inventory');

    // Click "Inventory →" and verify redirect to /inventory
    await firstSpaceInventoryBtn.click();
    await page.waitForURL('**/inventory**');
    expect(page.url()).toContain('/inventory');

    // Verify INVENTORY HQ header rendered on target page
    const headerElement = page.locator('[data-testid="inventory-hq-header"]');
    await expect(headerElement).toBeVisible();
    await expect(headerElement).toContainText('INVENTORY HQ');

    // Screenshot proof for Step 2
    await page.screenshot({ path: 'test-results/space_card_inventory_redirect_verified.png', fullPage: true });
  });
});
