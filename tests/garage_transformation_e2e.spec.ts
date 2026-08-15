import { test, expect } from '@playwright/test';

test.describe('E2E Visual Tests — Garage Transformation Storyboard & Insurance Schedule', () => {

  test.beforeEach(async ({ page }) => {
    // Inject Playwright mock environment
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 1. SUB-TAB SELECTOR TOGGLE                                                 */
  /* -------------------------------------------------------------------------- */
  test('1. Verify Sub-Tab selector toggle between "📦 Inventory & Pipeline" and "📖 Transformation Story"', async ({ page }) => {
    await page.goto('http://localhost:3000/dash/garage');

    // Sub-tab buttons
    const inventoryTab = page.locator('[data-testid="subtab-inventory"]');
    const transformationTab = page.locator('[data-testid="subtab-storyboard"]');

    await expect(inventoryTab).toBeVisible();
    await expect(transformationTab).toBeVisible();

    // Click Transformation Story sub-tab
    await transformationTab.click();

    // Verify Transformation Storyboard section is visible
    const storyboardSection = page.locator('[data-testid="transformation-storyboard-section"]');
    await expect(storyboardSection).toBeVisible();

    // Click back to Inventory & Pipeline sub-tab
    await inventoryTab.click();
    const inventorySection = page.locator('[data-testid="status-pipeline-filter-bar"]');
    await expect(inventorySection).toBeVisible();
  });

  /* -------------------------------------------------------------------------- */
  /* 2. TRANSFORMATION STORYBOARD SECTION                                       */
  /* -------------------------------------------------------------------------- */
  test('2. Verify Transformation Storyboard section components (Disposition Summary Cards, Timeline Logbook container, and "+ Log Transformation Milestone" button)', async ({ page }) => {
    await page.goto('http://localhost:3000/dash/garage');

    // Switch to Transformation Story sub-tab
    const transformationTab = page.locator('[data-testid="subtab-storyboard"]');
    await expect(transformationTab).toBeVisible();
    await transformationTab.click();

    // Storyboard section container
    const storyboardSection = page.locator('[data-testid="transformation-storyboard-section"]');
    await expect(storyboardSection).toBeVisible();

    // Disposition Summary Cards
    const dispositionCards = page.locator('[data-testid="disposition-summary-cards"]');
    await expect(dispositionCards).toBeVisible();

    // Timeline Logbook container
    const timelineLogbook = page.locator('[data-testid="timeline-logbook-container"]');
    await expect(timelineLogbook).toBeVisible();

    // "+ Log Transformation Milestone" button
    const logMilestoneBtn = page.locator('[data-testid="log-milestone-btn"]');
    await expect(logMilestoneBtn).toBeVisible();
    await expect(logMilestoneBtn).toContainText('Log Transformation Milestone');
  });

  /* -------------------------------------------------------------------------- */
  /* 3. "+ LOG TRANSFORMATION MILESTONE" DRAWER MODAL                           */
  /* -------------------------------------------------------------------------- */
  test('3. Verify "+ Log Transformation Milestone" drawer modal (form inputs, category selector, date picker, photo uploader trigger)', async ({ page }) => {
    await page.goto('http://localhost:3000/dash/garage');

    // Switch to Transformation Story sub-tab
    const transformationTab = page.locator('[data-testid="subtab-storyboard"]');
    await expect(transformationTab).toBeVisible();
    await transformationTab.click();

    // Open milestone drawer modal
    const logMilestoneBtn = page.locator('[data-testid="log-milestone-btn"]');
    await expect(logMilestoneBtn).toBeVisible();
    await logMilestoneBtn.click();

    // Modal container
    const modal = page.locator('[data-testid="milestone-drawer-modal"]');
    await expect(modal).toBeVisible();

    // Form title input
    const titleInput = page.locator('[data-testid="milestone-title-input"]');
    await expect(titleInput).toBeVisible();

    // Category selector
    const categorySelector = page.locator('[data-testid="milestone-category-selector"]');
    await expect(categorySelector).toBeVisible();

    // Date picker
    const datePicker = page.locator('[data-testid="milestone-date-picker"]');
    await expect(datePicker).toBeVisible();

    // Form notes input
    const notesInput = page.locator('[data-testid="milestone-notes-input"]');
    await expect(notesInput).toBeVisible();

    // Photo uploader trigger
    const photoUploader = page.locator('[data-testid="milestone-photo-uploader"]');
    await expect(photoUploader).toBeVisible();

    // Close modal
    const closeBtn = page.locator('[data-testid="close-milestone-modal-btn"]');
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });

  /* -------------------------------------------------------------------------- */
  /* 4. EXPORT INSURANCE SCHEDULE BUTTON & MODAL                                */
  /* -------------------------------------------------------------------------- */
  test('4. Verify "🛡️ Export Insurance Schedule (PDF/Print)" button and printable valuation schedule modal', async ({ page }) => {
    await page.goto('http://localhost:3000/dash/garage');

    // Export Insurance Schedule button
    const exportInsuranceBtn = page.locator('[data-testid="export-insurance-schedule-btn"]');
    await expect(exportInsuranceBtn).toBeVisible();
    await expect(exportInsuranceBtn).toContainText('Export Insurance Schedule');

    // Click to open Insurance Schedule Modal
    await exportInsuranceBtn.click();

    // Verify modal elements
    const insuranceModal = page.locator('[data-testid="insurance-schedule-modal"]');
    await expect(insuranceModal).toBeVisible();

    const scheduleTitle = page.locator('[data-testid="insurance-schedule-title"]');
    await expect(scheduleTitle).toBeVisible();
    await expect(scheduleTitle).toContainText('Printable Insurance Valuation Schedule');

    const valuationSummary = page.locator('[data-testid="insurance-valuation-summary"]');
    await expect(valuationSummary).toBeVisible();

    const scheduleTable = page.locator('[data-testid="insurance-schedule-table"]');
    await expect(scheduleTable).toBeVisible();

    const certBlock = page.locator('[data-testid="insurance-certification-block"]');
    await expect(certBlock).toBeVisible();

    // Close modal
    const closeInsuranceBtn = page.locator('[data-testid="close-insurance-modal-btn"]');
    await closeInsuranceBtn.click();
    await expect(insuranceModal).not.toBeVisible();
  });

  /* -------------------------------------------------------------------------- */
  /* 5. TOUCH TARGETS >= 44PX ON ALL NEW BUTTONS                                */
  /* -------------------------------------------------------------------------- */
  test('5. Verify touch targets >= 44px on all new buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/dash/garage');

    // 1. Inventory & Pipeline Sub-tab
    const inventoryTab = page.locator('[data-testid="subtab-inventory"]');
    const invBox = await inventoryTab.boundingBox();
    expect(invBox).not.toBeNull();
    if (invBox) {
      expect(invBox.width).toBeGreaterThanOrEqual(44);
      expect(invBox.height).toBeGreaterThanOrEqual(44);
    }

    // 2. Transformation Story Sub-tab
    const transformationTab = page.locator('[data-testid="subtab-storyboard"]');
    const storyBox = await transformationTab.boundingBox();
    expect(storyBox).not.toBeNull();
    if (storyBox) {
      expect(storyBox.width).toBeGreaterThanOrEqual(44);
      expect(storyBox.height).toBeGreaterThanOrEqual(44);
    }

    // 3. Export Insurance Schedule Button
    const insuranceBtn = page.locator('[data-testid="export-insurance-schedule-btn"]');
    const insBox = await insuranceBtn.boundingBox();
    expect(insBox).not.toBeNull();
    if (insBox) {
      expect(insBox.width).toBeGreaterThanOrEqual(44);
      expect(insBox.height).toBeGreaterThanOrEqual(44);
    }

    // Switch to Storyboard tab
    await transformationTab.click();

    // 4. Log Milestone Button
    const logMilestoneBtn = page.locator('[data-testid="log-milestone-btn"]');
    const milestoneBox = await logMilestoneBtn.boundingBox();
    expect(milestoneBox).not.toBeNull();
    if (milestoneBox) {
      expect(milestoneBox.width).toBeGreaterThanOrEqual(44);
      expect(milestoneBox.height).toBeGreaterThanOrEqual(44);
    }

    // Open drawer modal to check modal buttons
    await logMilestoneBtn.click();
    const closeMilestoneBtn = page.locator('[data-testid="close-milestone-modal-btn"]');
    const closeBox = await closeMilestoneBtn.boundingBox();
    expect(closeBox).not.toBeNull();
    if (closeBox) {
      expect(closeBox.width).toBeGreaterThanOrEqual(44);
      expect(closeBox.height).toBeGreaterThanOrEqual(44);
    }

    const photoUploader = page.locator('[data-testid="milestone-photo-uploader"]');
    const photoBox = await photoUploader.boundingBox();
    expect(photoBox).not.toBeNull();
    if (photoBox) {
      expect(photoBox.width).toBeGreaterThanOrEqual(44);
      expect(photoBox.height).toBeGreaterThanOrEqual(44);
    }
  });

});
