import { test, expect } from '@playwright/test';

test.describe('Skills & Tools Used Tag Pill Input E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

    // Inject mock flag for deterministic test execution
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('__playwright_mock__', 'true');
    });
  });

  test('1. http://localhost:3000/exp/new - Tag Input, Suggestion Chips, and Touch Target Conformance', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/exp/new', { waitUntil: 'domcontentloaded' });

    // Verify Title & Skills section
    const heading = page.locator('h1', { hasText: 'New Experience Asset' });
    await expect(heading).toBeVisible();

    const tagInput = page.locator('[data-testid="skill-tag-input"]');
    const addTagBtn = page.locator('[data-testid="add-skill-tag-btn"]');
    await expect(tagInput).toBeVisible();
    await expect(addTagBtn).toBeVisible();

    // 1. Add tag via typing and pressing Enter
    await tagInput.fill('Haltech Tuning');
    await tagInput.press('Enter');

    const tagCloud = page.locator('[data-testid="skills-tag-cloud"]');
    await expect(tagCloud).toBeVisible();
    await expect(tagCloud).toContainText('Haltech Tuning');

    // 2. Add tag via typing and pressing Comma
    await tagInput.fill('CAD / Fusion 360');
    await tagInput.press(',');
    await expect(tagCloud).toContainText('CAD / Fusion 360');

    // 3. Add tag via clicking [+ Add Tag] button
    await tagInput.fill('Telemetry Analysis');
    await addTagBtn.click();
    await expect(tagCloud).toContainText('Telemetry Analysis');

    // 4. Test 1-Tap Suggestion Chips
    const tigWeldingChip = page.locator('[data-testid="suggested-skill-tig-welding"]');
    const engineBuildingChip = page.locator('[data-testid="suggested-skill-engine-building"]');
    await expect(tigWeldingChip).toBeVisible();
    await expect(engineBuildingChip).toBeVisible();

    await tigWeldingChip.click();
    await expect(tagCloud).toContainText('TIG Welding');
    await expect(tigWeldingChip).toBeDisabled();

    await engineBuildingChip.click();
    await expect(tagCloud).toContainText('Engine Building');
    await expect(engineBuildingChip).toBeDisabled();

    // 5. Test removing a tag pill
    const removeHaltechBtn = page.locator('[data-testid="remove-skill-haltech-tuning"]');
    await expect(removeHaltechBtn).toBeVisible();
    await removeHaltechBtn.click();
    await expect(tagCloud).not.toContainText('Haltech Tuning');

    // 6. Touch Target Audit >= 44px
    const interactiveLocators = [
      tagInput,
      addTagBtn,
      tigWeldingChip,
      engineBuildingChip,
      page.locator('[data-testid="suggested-skill-ecu-tuning"]'),
      page.locator('[data-testid="suggested-skill-shop-management"]'),
      page.locator('[data-testid="suggested-skill-excel---data"]'),
      page.locator('[data-testid="suggested-skill-suspension-setup"]'),
      page.locator('[data-testid="suggested-skill-fabrication"]'),
      page.locator('[data-testid="suggested-skill-photography"]'),
      page.locator('[data-testid="cancel-exp-btn"]'),
      page.locator('button[type="submit"]')
    ];

    for (const locator of interactiveLocators) {
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/exp_new_skills_tag_input.png', fullPage: true });
  });

  test('2. http://localhost:3000/exp/exp-hrc-2021/edit - Pre-populated skills, Tag Removal, and Editing', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/exp/exp-hrc-2021/edit', { waitUntil: 'domcontentloaded' });

    // Verify Title
    const heading = page.locator('h1', { hasText: 'Edit Experience Asset' });
    await expect(heading).toBeVisible();

    // Verify pre-populated skills
    const tagCloud = page.locator('[data-testid="skills-tag-cloud"]');
    await expect(tagCloud).toBeVisible();
    await expect(tagCloud).toContainText('Telemetry Analysis');
    await expect(tagCloud).toContainText('ECU Tuning');
    await expect(tagCloud).toContainText('Engine Building');

    // Add a new skill on edit
    const tagInput = page.locator('[data-testid="skill-tag-input"]');
    await tagInput.fill('Suspension Setup');
    await tagInput.press('Enter');
    await expect(tagCloud).toContainText('Suspension Setup');

    // Remove an existing skill
    const removeEcuBtn = page.locator('[data-testid="remove-skill-ecu-tuning"]');
    await expect(removeEcuBtn).toBeVisible();
    await removeEcuBtn.click();
    await expect(tagCloud).not.toContainText('ECU Tuning');

    // Verify touch targets >= 44px
    const cancelBtn = page.locator('a', { hasText: 'Cancel' });
    const saveBtn = page.locator('button[type="submit"]');

    for (const elem of [tagInput, cancelBtn, saveBtn]) {
      const box = await elem.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/exp_edit_skills_tag_input.png', fullPage: true });
  });

});
