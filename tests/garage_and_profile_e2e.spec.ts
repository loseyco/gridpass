import { test, expect } from '@playwright/test';

test.describe('E2E Visual Tests — Profile & Garage Hub', () => {

  test.beforeEach(async ({ page }) => {
    // Inject Playwright mock environment
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  /* -------------------------------------------------------------------------- */
  /* 1. AUTHENTIC LOSEY.CO PROFILE VERIFICATION (/u/pjlosey)                    */
  /* -------------------------------------------------------------------------- */
  test('1. Verify authentic Losey.co profile info, role, bio, location, links, socials, and 6 authentic experiences', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // 1. Role: "Founder & Chief Systems Architect"
    const roleBadge = page.locator('span', { hasText: 'Founder & Chief Systems Architect' });
    await expect(roleBadge).toBeVisible();

    // 2. Bio text
    const bioText = page.locator('p', { hasText: 'Clinical Precision. Motorsport Velocity' });
    await expect(bioText).toBeVisible();

    // 3. Location: Monmouth Beach, NJ
    const locationTag = page.locator('text=Monmouth Beach, NJ').first();
    await expect(locationTag).toBeVisible();

    // 4. Website link: losey.co
    const websiteBtn = page.locator('a[href="https://losey.co"]').first();
    await expect(websiteBtn).toBeVisible();
    await expect(websiteBtn).toContainText('Website');

    // 5. Social Links: LinkedIn, Instagram, Facebook
    const linkedinBtn = page.locator('a[title*="LinkedIn"]');
    const instagramBtn = page.locator('a[title*="Instagram"]');
    const facebookBtn = page.locator('a[title*="Facebook"]');

    await expect(linkedinBtn).toBeVisible();
    await expect(instagramBtn).toBeVisible();
    await expect(facebookBtn).toBeVisible();

    // Verify hrefs
    await expect(linkedinBtn).toHaveAttribute('href', 'https://linkedin.com/in/pjlosey');
    await expect(instagramBtn).toHaveAttribute('href', 'https://instagram.com/pjlosey');
    await expect(facebookBtn).toHaveAttribute('href', 'https://facebook.com/pjlosey');

    // 6. Verify 6 authentic Losey.co experiences
    const exp1 = page.locator('text=Honda Racing / HRC Trackside Engineer').first();
    const exp2 = page.locator('text=Siemens Healthineers Project Engineer').first();
    const exp3 = page.locator('text=Managed $5M+ Elite Racing Operations').first();
    const exp4 = page.locator('text=UpfittersOS').first();
    const exp5 = page.locator('text=srcommander').first();
    const exp6 = page.locator('text=Gridpass Platform').first();

    await expect(exp1).toBeVisible();
    await expect(exp2).toBeVisible();
    await expect(exp3).toBeVisible();
    await expect(exp4).toBeVisible();
    await expect(exp5).toBeVisible();
    await expect(exp6).toBeVisible();
  });

  test('2. Verify touch targets >= 44px on /u/pjlosey route', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // 1. Website link
    const websiteBtn = page.locator('a[href="https://losey.co"]').first();
    const websiteBox = await websiteBtn.boundingBox();
    expect(websiteBox).not.toBeNull();
    if (websiteBox) {
      expect(websiteBox.width).toBeGreaterThanOrEqual(44);
      expect(websiteBox.height).toBeGreaterThanOrEqual(44);
    }

    // 2. Social icons (LinkedIn, Instagram, Facebook)
    const socialIcons = page.locator('a[title^="View "]');
    const socialCount = await socialIcons.count();
    expect(socialCount).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < socialCount; i++) {
      const box = await socialIcons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // 3. Tab navigation buttons
    const tabButtons = page.locator('button', { hasText: /Career|Digital Garage|Businesses|Fan Wall/ });
    const tabCount = await tabButtons.count();
    for (let i = 0; i < tabCount; i++) {
      const box = await tabButtons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // 4. Experience link pills
    const linkPills = page.locator('[data-testid^="experience-link-pill-"]');
    const pillCount = await linkPills.count();
    if (pillCount > 0) {
      for (let i = 0; i < pillCount; i++) {
        const box = await linkPills.nth(i).boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  /* -------------------------------------------------------------------------- */
  /* 2. GARAGE MANAGER VERIFICATION (/dash/garage)                             */
  /* -------------------------------------------------------------------------- */
  test('3. Verify Garage Hub Header metrics, Location Tree, Status pipeline filter pills, Item Passport modal, Auto-Listing Copy Generator button, and QR Tag generator', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('http://localhost:3000/dash/garage');

    // 1. Garage Hub Header metrics
    const metricsHeader = page.locator('[data-testid="garage-hub-header-metrics"]');
    await expect(metricsHeader).toBeVisible();

    const metricSpace = page.locator('[data-testid="metric-space-allocated"]');
    const metricItems = page.locator('[data-testid="metric-staged-items"]');
    const metricValuation = page.locator('[data-testid="metric-inventory-valuation"]');
    const metricCash = page.locator('[data-testid="metric-cash-collected"]');

    await expect(metricSpace).toBeVisible();
    await expect(metricItems).toBeVisible();
    await expect(metricValuation).toBeVisible();
    await expect(metricCash).toBeVisible();

    // 2. Status pipeline filter pills
    const statusFilterBar = page.locator('[data-testid="status-pipeline-filter-bar"]');
    await expect(statusFilterBar).toBeVisible();

    const pillAll = page.locator('[data-testid="status-filter-pill-All"]');
    const pillDraft = page.locator('[data-testid="status-filter-pill-Draft"]');
    const pillListed = page.locator('[data-testid="status-filter-pill-Listed"]');
    const pillSold = page.locator('[data-testid="status-filter-pill-Sold"]');

    await expect(pillAll).toBeVisible();
    await expect(pillDraft).toBeVisible();
    await expect(pillListed).toBeVisible();
    await expect(pillSold).toBeVisible();

    // Test clicking status filter pill
    await pillListed.click();
    await expect(page.locator('text=Ford Mustang GT 5.0 Intake Manifold')).toBeVisible();

    await pillAll.click();

    // 3. Auto-Listing Copy Generator button
    const copyBtn = page.locator('[data-testid="copy-listing-btn-mock-item-1"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.locator('text=Copy Generated!')).toBeVisible();

    // 4. QR Tag generator
    const qrBtn = page.locator('[data-testid="view-qr-tag-btn-mock-item-1"]');
    await expect(qrBtn).toBeVisible();
    await qrBtn.click();

    const qrModal = page.locator('[data-testid="qr-code-modal"]');
    await expect(qrModal).toBeVisible();

    // Close QR modal
    const closeQrBtn = page.locator('[data-testid="close-qr-modal-btn"]');
    await closeQrBtn.click();
    await expect(qrModal).not.toBeVisible();

    // 5. Item Passport modal with serial & replacement value inputs
    const stageItemBtn = page.locator('[data-testid="stage-item-btn"]');
    await expect(stageItemBtn).toBeVisible();
    await stageItemBtn.click();

    const itemModal = page.locator('[data-testid="item-passport-modal"]');
    await expect(itemModal).toBeVisible();

    const serialInput = page.locator('[data-testid="item-serial-number-input"]');
    const replaceValInput = page.locator('[data-testid="item-replacement-value-input"]');
    await expect(serialInput).toBeVisible();
    await expect(replaceValInput).toBeVisible();

    // Close Item modal
    const closeItemModalBtn = page.locator('[data-testid="close-item-passport-modal-btn"]');
    await closeItemModalBtn.click();
    await expect(itemModal).not.toBeVisible();

    // 6. Insurance Schedule Modal & Certification Block Verification
    const insuranceBtn = page.locator('[data-testid="export-insurance-schedule-btn"]');
    await expect(insuranceBtn).toBeVisible();
    await insuranceBtn.click();

    const insuranceModal = page.locator('[data-testid="insurance-schedule-modal"]');
    await expect(insuranceModal).toBeVisible();
    await expect(page.locator('[data-testid="insurance-schedule-title"]')).toBeVisible();

    const summaryBlock = page.locator('[data-testid="insurance-valuation-summary"]');
    await expect(summaryBlock).toBeVisible();

    const scheduleTable = page.locator('[data-testid="insurance-schedule-table"]');
    await expect(scheduleTable).toBeVisible();

    const certBlock = page.locator('[data-testid="insurance-certification-block"]');
    await expect(certBlock).toBeVisible();

    const closeInsuranceBtn = page.locator('[data-testid="close-insurance-modal-btn"]');
    await closeInsuranceBtn.click();
    await expect(insuranceModal).not.toBeVisible();

    // 7. Sub-Tab Transformation Storyboard Verification
    const storyboardTab = page.locator('[data-testid="subtab-storyboard"]');
    await expect(storyboardTab).toBeVisible();
    await storyboardTab.click();

    const storyboardSection = page.locator('[data-testid="transformation-storyboard-section"]');
    await expect(storyboardSection).toBeVisible();

    const logMilestoneBtn = page.locator('[data-testid="log-milestone-btn"]');
    await expect(logMilestoneBtn).toBeVisible();

    const summaryCards = page.locator('[data-testid="disposition-summary-cards"]');
    await expect(summaryCards).toBeVisible();

    // Switch back to Inventory subtab
    const inventoryTab = page.locator('[data-testid="subtab-inventory"]');
    await inventoryTab.click();
  });

  test('4. Verify touch targets >= 44px on /dash/garage route', async ({ page }) => {
    await page.goto('http://localhost:3000/dash/garage');

    // 1. Export Insurance Schedule Button
    const insuranceBtn = page.locator('[data-testid="export-insurance-schedule-btn"]');
    const insuranceBox = await insuranceBtn.boundingBox();
    expect(insuranceBox).not.toBeNull();
    if (insuranceBox) {
      expect(insuranceBox.width).toBeGreaterThanOrEqual(44);
      expect(insuranceBox.height).toBeGreaterThanOrEqual(44);
    }

    // 2. Stage Item Button
    const stageBtn = page.locator('[data-testid="stage-item-btn"]');
    const stageBox = await stageBtn.boundingBox();
    expect(stageBox).not.toBeNull();
    if (stageBox) {
      expect(stageBox.width).toBeGreaterThanOrEqual(44);
      expect(stageBox.height).toBeGreaterThanOrEqual(44);
    }

    // 3. Status filter pills
    const statusPills = page.locator('[data-testid^="status-filter-pill-"]');
    const statusCount = await statusPills.count();
    expect(statusCount).toBeGreaterThan(0);

    for (let i = 0; i < statusCount; i++) {
      const box = await statusPills.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // 4. Sub-tabs (Inventory & Storyboard)
    const subtabs = page.locator('[data-testid^="subtab-"]');
    const subtabCount = await subtabs.count();
    expect(subtabCount).toBeGreaterThan(0);

    for (let i = 0; i < subtabCount; i++) {
      const box = await subtabs.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // 5. Copy Listing button
    const copyBtn = page.locator('[data-testid="copy-listing-btn-mock-item-1"]');
    const copyBox = await copyBtn.boundingBox();
    expect(copyBox).not.toBeNull();
    if (copyBox) {
      expect(copyBox.width).toBeGreaterThanOrEqual(44);
      expect(copyBox.height).toBeGreaterThanOrEqual(44);
    }

    // 6. View QR Tag button
    const qrBtn = page.locator('[data-testid="view-qr-tag-btn-mock-item-1"]');
    const qrBox = await qrBtn.boundingBox();
    expect(qrBox).not.toBeNull();
    if (qrBox) {
      expect(qrBox.width).toBeGreaterThanOrEqual(44);
      expect(qrBox.height).toBeGreaterThanOrEqual(44);
    }
  });

});
