import { test, expect } from '@playwright/test';

test.describe('Full-Page Edit Routes Visual E2E Suite', () => {

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
  /* 1. VERIFY /dash/edit-profile                                               */
  /* -------------------------------------------------------------------------- */
  test('1. http://localhost:3000/dash/edit-profile - Full-page Passport & Profile Account Settings Manager', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash/edit-profile', { waitUntil: 'domcontentloaded' });

    // Verify header title
    const headerTitle = page.locator('h2', { hasText: 'Edit Profile' });
    await expect(headerTitle).toBeVisible();

    // Verify solid white background container
    const container = page.locator('div.flex-1.bg-white').first();
    await expect(container).toBeVisible();

    // Verify Profile Identity & Bio inputs
    const displayNameInput = page.locator('input[placeholder="PJ LOSEY"]');
    const usernameInput = page.locator('input[placeholder="pjlosey"]');
    const bioTextarea = page.locator('textarea[placeholder="Tell us about yourself..."]');
    await expect(displayNameInput).toBeVisible();
    await expect(usernameInput).toBeVisible();
    await expect(bioTextarea).toBeVisible();

    // Verify Career History section
    const careerHistorySection = page.locator('[data-testid="career-history-section"]');
    const careerHistoryHeading = page.locator('h4', { hasText: 'Career History' });
    const addExperienceBtn = page.locator('[data-testid="add-experience-btn"]');
    await expect(careerHistoryHeading).toBeVisible();
    await expect(addExperienceBtn).toBeVisible();
    expect(await addExperienceBtn.getAttribute('href')).toContain('/exp/new');

    // Verify Social Links section
    const socialLinksHeading = page.locator('h4', { hasText: 'Social Links' });
    await expect(socialLinksHeading).toBeVisible();
    const instagramInput = page.locator('input[placeholder="username"]').first();
    await expect(instagramInput).toBeVisible();

    // Verify Account Security section
    const securityHeading = page.locator('h4', { hasText: 'Security & Account' });
    const resetPasswordBtn = page.locator('button', { hasText: 'Reset Password' });
    await expect(securityHeading).toBeVisible();
    await expect(resetPasswordBtn).toBeVisible();

    // Touch targets audit >= 44px
    console.log('[TOUCH-TARGET AUDIT] Auditing interactive elements on /dash/edit-profile...');
    const interactiveElements = [
      addExperienceBtn,
      resetPasswordBtn,
      page.locator('button[type="submit"]'),
      page.locator('a', { hasText: 'Back' }).first()
    ];

    for (const elem of interactiveElements) {
      const box = await elem.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/edit_profile_full_page.png', fullPage: true });
  });

  /* -------------------------------------------------------------------------- */
  /* 2. VERIFY /u/pjlosey MANAGE PASSPORT BUTTON NAVIGATION                    */
  /* -------------------------------------------------------------------------- */
  test('2. http://localhost:3000/u/pjlosey - [ Manage Passport ] button links directly to /dash/edit-profile without drawer', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/u/pjlosey', { waitUntil: 'domcontentloaded' });

    // Verify Manage Passport button is visible
    const managePassportBtn = page.locator('[data-testid="edit-passport-btn"]');
    await managePassportBtn.waitFor({ state: 'visible', timeout: 10000 });
    await expect(managePassportBtn).toBeVisible();

    // Verify link href
    expect(await managePassportBtn.getAttribute('href')).toContain('/dash/edit-profile');

    // Click Manage Passport button and check direct route navigation
    await Promise.all([
      page.waitForURL('**/dash/edit-profile*'),
      managePassportBtn.click()
    ]);

    // Verify no drawer modal open, URL is strictly /dash/edit-profile
    expect(page.url()).toContain('/dash/edit-profile');
    const editProfileHeader = page.locator('h2', { hasText: 'Edit Profile' });
    await expect(editProfileHeader).toBeVisible();

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/manage_passport_navigation.png', fullPage: true });
  });

  /* -------------------------------------------------------------------------- */
  /* 3. VERIFY /exp/new EXPERIENCE ASSET CREATION WIZARD                       */
  /* -------------------------------------------------------------------------- */
  test('3. http://localhost:3000/exp/new - Full-page Experience Asset creation wizard with Cancel link to /dash/edit-profile', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/exp/new', { waitUntil: 'domcontentloaded' });

    // Verify heading
    const heading = page.locator('h1', { hasText: 'New Experience Asset' });
    await expect(heading).toBeVisible();

    // Verify Cancel link links back to /dash/edit-profile
    const cancelBtn = page.locator('[data-testid="cancel-exp-btn"]');
    await expect(cancelBtn).toBeVisible();
    expect(await cancelBtn.getAttribute('href')).toBe('/dash/edit-profile');

    // Verify form fields
    const titleInput = page.locator('input[placeholder*="Lead Race Engineer"]');
    const companyInput = page.locator('input[placeholder*="Losey Racing"]');
    const categorySelect = page.locator('select');
    const createBtn = page.locator('button[type="submit"]');

    await expect(titleInput).toBeVisible();
    await expect(companyInput).toBeVisible();
    await expect(categorySelect).toBeVisible();
    await expect(createBtn).toBeVisible();

    // Verify touch targets >= 44px
    for (const elem of [cancelBtn, createBtn]) {
      const box = await elem.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/exp_new_wizard.png', fullPage: true });
  });

  /* -------------------------------------------------------------------------- */
  /* 4. VERIFY /dash?tab=experiences                                            */
  /* -------------------------------------------------------------------------- */
  test('4. http://localhost:3000/dash?tab=experiences - "+ Create New Experience Asset" links to /exp/new and "Edit" links to /exp/[id]/edit', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash?tab=experiences', { waitUntil: 'domcontentloaded' });

    // Verify Dashboard Experience Manager
    const expManager = page.locator('[data-testid="dashboard-experience-manager"]');
    await expect(expManager).toBeVisible();

    // Verify "+ Create New Experience Asset" button links to /exp/new
    const createBtn = page.locator('[data-testid="create-experience-asset-btn"]');
    await expect(createBtn).toBeVisible();
    expect(await createBtn.getAttribute('href')).toBe('/exp/new');

    // Verify Edit buttons link to /exp/[id]/edit
    const editBtn = page.locator('[data-testid="edit-exp-exp-hrc-2021"]');
    await expect(editBtn).toBeVisible();
    expect(await editBtn.getAttribute('href')).toBe('/exp/exp-hrc-2021/edit');

    // Touch targets >= 44px
    for (const elem of [createBtn, editBtn]) {
      const box = await elem.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/dash_experiences_tab.png', fullPage: true });
  });

  /* -------------------------------------------------------------------------- */
  /* 5. VERIFY /dash?tab=spaces                                                 */
  /* -------------------------------------------------------------------------- */
  test('5. http://localhost:3000/dash?tab=spaces - "+ Add Physical Space" links to /dash/space/new and Edit links to /dash/space/[id]/edit', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash?tab=spaces', { waitUntil: 'domcontentloaded' });

    // Verify Dashboard Space Manager
    const spaceManager = page.locator('[data-testid="dashboard-space-manager"]');
    await expect(spaceManager).toBeVisible();

    // Verify "+ Add Physical Space" button links to /dash/space/new
    const addSpaceBtn = page.locator('[data-testid="add-physical-space-btn"]');
    await expect(addSpaceBtn).toBeVisible();
    expect(await addSpaceBtn.getAttribute('href')).toBe('/dash/space/new');

    // Verify Edit button on physical space card links directly to /dash/space/[id]/edit
    const editSpaceBtn = page.locator('[data-testid="edit-space-space-1"]');
    await expect(editSpaceBtn).toBeVisible();
    expect(await editSpaceBtn.getAttribute('href')).toBe('/dash/space/space-1/edit');

    // Touch targets >= 44px
    for (const elem of [addSpaceBtn, editSpaceBtn]) {
      const box = await elem.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/dash_spaces_tab.png', fullPage: true });
  });

  /* -------------------------------------------------------------------------- */
  /* 6. VERIFY /dash/space/space-1/edit PHYSICAL SPACE EDITOR                   */
  /* -------------------------------------------------------------------------- */
  test('6. http://localhost:3000/dash/space/space-1/edit - Standalone full-page Physical Storage Space Editor', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    await page.goto('http://localhost:3000/dash/space/space-1/edit', { waitUntil: 'domcontentloaded' });

    // Verify header title
    const headerTitle = page.locator('h1', { hasText: 'Physical Storage Space Editor' });
    await expect(headerTitle).toBeVisible();

    // Verify space name input
    const spaceNameInput = page.locator('[data-testid="space-name-input"]');
    await expect(spaceNameInput).toBeVisible();
    expect(await spaceNameInput.inputValue()).toBe("Kristina's Garage");

    // Verify type selector dropdown
    const spaceTypeSelect = page.locator('[data-testid="space-type-select"]');
    await expect(spaceTypeSelect).toBeVisible();
    expect(await spaceTypeSelect.inputValue()).toBe('Garage');

    // Verify dimensions input
    const dimensionsInput = page.locator('[data-testid="space-dimensions-input"]');
    await expect(dimensionsInput).toBeVisible();
    expect(await dimensionsInput.inputValue()).toBe('600 sqft');

    // Verify location input
    const locationInput = page.locator('[data-testid="space-location-input"]');
    await expect(locationInput).toBeVisible();
    expect(await locationInput.inputValue()).toBe('Grayslake, IL');

    // Verify access code & notes field
    const accessNotesInput = page.locator('[data-testid="space-access-notes-input"]');
    await expect(accessNotesInput).toBeVisible();
    expect(await accessNotesInput.inputValue()).toContain('Gate code');

    // Verify soft-delete button
    const softDeleteBtn = page.locator('[data-testid="soft-delete-space-btn"]');
    await expect(softDeleteBtn).toBeVisible();

    // Verify Save CTA button
    const saveBtn = page.locator('[data-testid="save-space-btn"]');
    await expect(saveBtn).toBeVisible();

    // Verify Back / Cancel buttons
    const backBtn = page.locator('[data-testid="back-to-spaces-btn"]');
    const cancelBtn = page.locator('[data-testid="cancel-space-edit-btn"]');
    await expect(backBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();
    expect(await backBtn.getAttribute('href')).toBe('/dash?tab=spaces');
    expect(await cancelBtn.getAttribute('href')).toBe('/dash?tab=spaces');

    // Audit Touch targets >= 44px
    console.log('[TOUCH-TARGET AUDIT] Auditing interactive elements on /dash/space/space-1/edit...');
    const interactiveElements = [backBtn, softDeleteBtn, cancelBtn, saveBtn];
    for (const elem of interactiveElements) {
      const box = await elem.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/space_edit_full_page.png', fullPage: true });
  });

});

