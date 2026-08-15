import { test, expect } from '@playwright/test';

test.describe('Dashboard Tabs, Experience Manager & Space Manager Visual E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

    // Inject Playwright mock environment
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('__playwright_mock__', 'true');
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 1. VERIFY /dash?tab=vehicles                                               */
  /* -------------------------------------------------------------------------- */
  test('1. http://localhost:3000/dash?tab=vehicles - Verify 6 tab pills, Vehicles tab active, touch targets >= 44px', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash?tab=vehicles', { waitUntil: 'domcontentloaded' });

    // Verify 6 tab pills rendered
    const tabPillsContainer = page.locator('[data-testid="dashboard-tab-pills"]');
    await tabPillsContainer.waitFor({ state: 'visible', timeout: 10000 });
    await expect(tabPillsContainer).toBeVisible();

    const tabPills = tabPillsContainer.locator('> button');
    const pillCount = await tabPills.count();
    expect(pillCount).toBe(6);

    // Verify Tab labels
    const pillTexts = await tabPills.allTextContents();
    console.log('[DASH-TABS] Rendered 6 tab pills:', pillTexts);
    expect(pillTexts.some(t => t.includes('Vehicles'))).toBe(true);
    expect(pillTexts.some(t => t.includes('Experiences'))).toBe(true);
    expect(pillTexts.some(t => t.includes('Spaces'))).toBe(true);
    expect(pillTexts.some(t => t.includes('Businesses'))).toBe(true);
    expect(pillTexts.some(t => t.includes('Hosted Events'))).toBe(true);
    expect(pillTexts.some(t => t.includes('Membership'))).toBe(true);

    // Verify Vehicles tab is active
    const vehiclesPill = page.locator('[data-testid="dash-tab-vehicles"]');
    await expect(vehiclesPill).toBeVisible();
    await expect(vehiclesPill).toHaveClass(/bg-\[#ff3b30\]/);

    // Verify Digital Garage section rendered
    const vehiclesManager = page.locator('[data-testid="dashboard-vehicles-manager"]');
    await expect(vehiclesManager).toBeVisible();

    // Verify touch targets >= 44px for tab pills and interactive buttons
    console.log('[TOUCH-TARGET AUDIT] Auditing tab pills and buttons on /dash?tab=vehicles...');
    for (let i = 0; i < pillCount; i++) {
      const pill = tabPills.nth(i);
      const box = await pill.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/dash_tab_vehicles.png', fullPage: true });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. VERIFY /dash?tab=experiences                                            */
  /* -------------------------------------------------------------------------- */
  test('2. http://localhost:3000/dash?tab=experiences - Verify DashboardExperienceManager, Experience Assets, "+ Create New Experience Asset" button, View/Edit/Delete actions, touch targets >= 44px', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash?tab=experiences', { waitUntil: 'domcontentloaded' });

    // Verify DashboardExperienceManager rendered
    const expManager = page.locator('[data-testid="dashboard-experience-manager"]');
    await expect(expManager).toBeVisible();

    // Verify "+ Create New Experience Asset" button
    const createBtn = page.locator('[data-testid="create-experience-asset-btn"]');
    await expect(createBtn).toBeVisible();

    const createBox = await createBtn.boundingBox();
    expect(createBox).not.toBeNull();
    if (createBox) {
      expect(createBox.width).toBeGreaterThanOrEqual(44);
      expect(createBox.height).toBeGreaterThanOrEqual(44);
    }

    // Verify Experience Assets rendered
    const expCard1 = page.locator('text=Honda Racing / HRC Trackside Engineer').first();
    const expCard2 = page.locator('text=Gridpass Platform & Waterway Radar').first();
    const expCard3 = page.locator('text=Siemens Healthineers Project Engineer').first();

    await expect(expCard1).toBeVisible();
    await expect(expCard2).toBeVisible();
    await expect(expCard3).toBeVisible();

    // Verify View, Edit, Delete actions on cards & check touch targets >= 44px
    const viewBtn = page.locator('[data-testid="view-exp-exp-hrc-2021"]');
    const editBtn = page.locator('[data-testid="edit-exp-exp-hrc-2021"]');
    const deleteBtn = page.locator('[data-testid="delete-exp-exp-hrc-2021"]');

    await expect(viewBtn).toBeVisible();
    await expect(editBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();

    for (const btn of [viewBtn, editBtn, deleteBtn]) {
      const box = await btn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/dash_tab_experiences.png', fullPage: true });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. VERIFY /dash?tab=spaces                                                 */
  /* -------------------------------------------------------------------------- */
  test('3. http://localhost:3000/dash?tab=spaces - Verify DashboardSpaceManager, registered physical spaces, "+ Add Physical Space" button, touch targets >= 44px', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash?tab=spaces', { waitUntil: 'domcontentloaded' });

    // Verify DashboardSpaceManager rendered
    const spaceManager = page.locator('[data-testid="dashboard-space-manager"]');
    await expect(spaceManager).toBeVisible();

    // Verify "+ Add Physical Space" modal button
    const addSpaceBtn = page.locator('[data-testid="add-physical-space-btn"]');
    await expect(addSpaceBtn).toBeVisible();

    const addSpaceBox = await addSpaceBtn.boundingBox();
    expect(addSpaceBox).not.toBeNull();
    if (addSpaceBox) {
      expect(addSpaceBox.width).toBeGreaterThanOrEqual(44);
      expect(addSpaceBox.height).toBeGreaterThanOrEqual(44);
    }

    // Verify registered physical spaces:
    // 1. "Kristina's Garage"
    // 2. "Monmouth Beach Self-Storage Unit #402"
    // 3. "Rented Workshop Room"
    // 4. "7'x14' Enclosed Utility Trailer"
    // 5. "Kristina's House"
    const space1 = page.locator('text=Kristina\'s Garage').first();
    const space2 = page.locator('text=Monmouth Beach Self-Storage Unit #402').first();
    const space3 = page.locator('text=Rented Workshop Room').first();
    const space4 = page.locator('text=7\'x14\' Enclosed Utility Trailer').first();
    const space5 = page.locator('text=Kristina\'s House').first();

    await expect(space1).toBeVisible();
    await expect(space2).toBeVisible();
    await expect(space3).toBeVisible();
    await expect(space4).toBeVisible();
    await expect(space5).toBeVisible();

    // Verify space photo thumbnail is positioned on the FAR LEFT SIDE of the row before space title and badge
    const thumbnailContainer = page.locator('[data-testid="space-thumbnail-container-space-1"]');
    await expect(thumbnailContainer).toBeVisible();

    const spaceTitle = page.locator('[data-testid="space-title-space-1"]');
    const spaceBadge = page.locator('[data-testid="space-badge-space-1"]');
    await expect(spaceTitle).toBeVisible();
    await expect(spaceBadge).toBeVisible();

    const thumbBox = await thumbnailContainer.boundingBox();
    const titleBox = await spaceTitle.boundingBox();
    const badgeBox = await spaceBadge.boundingBox();

    expect(thumbBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(badgeBox).not.toBeNull();

    if (thumbBox && titleBox && badgeBox) {
      console.log(`[FAR-LEFT THUMBNAIL AUDIT] Thumbnail X: ${thumbBox.x}, Badge X: ${badgeBox.x}, Title X: ${titleBox.x}`);
      expect(thumbBox.x).toBeLessThan(badgeBox.x);
      expect(thumbBox.x).toBeLessThan(titleBox.x);
    }

    // Check actions and touch targets >= 44px for space buttons
    const manageBtn = page.locator('[data-testid="manage-space-space-1"]');
    const editBtn = page.locator('[data-testid="edit-space-space-1"]');
    const deleteBtn = page.locator('[data-testid="delete-space-space-1"]');

    await expect(manageBtn).toBeVisible();
    await expect(editBtn).toBeVisible();
    expect(await editBtn.getAttribute('href')).toBe('/dash/space/space-1/edit');
    await expect(deleteBtn).toBeVisible();

    for (const btn of [manageBtn, editBtn, deleteBtn]) {
      const box = await btn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/dash_tab_spaces.png', fullPage: true });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. VERIFY /dash/garage SPACE SELECTOR DROPDOWN                             */
  /* -------------------------------------------------------------------------- */
  test('4. http://localhost:3000/dash/garage - Verify top active Space Selector dropdown allowing filtering of items and inventory by physical location, touch targets >= 44px', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash/garage', { waitUntil: 'domcontentloaded' });

    // Verify top active Space Selector dropdown
    const spaceDropdown = page.locator('[data-testid="space-selector-dropdown"]');
    await spaceDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await expect(spaceDropdown).toBeVisible();

    // Verify touch target bounds >= 44px
    const dropdownBox = await spaceDropdown.boundingBox();
    expect(dropdownBox).not.toBeNull();
    if (dropdownBox) {
      expect(dropdownBox.width).toBeGreaterThanOrEqual(44);
      expect(dropdownBox.height).toBeGreaterThanOrEqual(44);
    }

    // Verify dropdown options contain registered physical locations
    const options = await spaceDropdown.locator('option').allTextContents();
    console.log('[GARAGE-SPACES] Dropdown options:', options);

    expect(options.some(o => o.includes('All Physical Spaces'))).toBe(true);
    expect(options.some(o => o.includes('Kristina\'s Garage'))).toBe(true);
    expect(options.some(o => o.includes('Monmouth Beach Self-Storage Unit #402'))).toBe(true);
    expect(options.some(o => o.includes('Rented Workshop Room'))).toBe(true);
    expect(options.some(o => o.includes('7\'x14\' Enclosed Utility Trailer'))).toBe(true);
    expect(options.some(o => o.includes('Kristina\'s House'))).toBe(true);

    // Test selecting a specific location option
    await spaceDropdown.selectOption({ label: 'Kristina\'s Garage' });
    expect(await spaceDropdown.inputValue()).toBe('kristina-garage');

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/garage_space_selector.png', fullPage: true });
  });

});
