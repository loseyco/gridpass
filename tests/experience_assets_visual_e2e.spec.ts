import { test, expect } from '@playwright/test';

test.describe('Automated Playwright E2E Visual Tests: Experience Assets & Passport Profiles', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

    // Inject mock flag for deterministic test execution
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('1. http://localhost:3000/exp/exp-hrc-2021 - Verify experience asset detail view', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    const response = await page.goto('/exp/exp-hrc-2021', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Verify Title "Honda Racing / HRC Trackside Engineer"
    const titleEl = page.locator('[data-testid="experience-title"]');
    await expect(titleEl).toBeVisible();
    await expect(titleEl).toContainText('Honda Racing / HRC Trackside Engineer');

    // Verify Company "Honda Racing Corporation (HRC)"
    const companyEl = page.locator('[data-testid="experience-company"]');
    await expect(companyEl).toBeVisible();
    await expect(companyEl).toContainText('Honda Racing Corporation (HRC)');

    // Verify Category Pill "MOTORSPORT GIG"
    const categoryPill = page.locator('[data-testid="experience-category-pill"]');
    await expect(categoryPill).toBeVisible();
    await expect(categoryPill).toContainText('MOTORSPORT GIG');

    // Verify Description
    const descEl = page.locator('[data-testid="experience-description"]');
    await expect(descEl).toBeVisible();
    await expect(descEl).toContainText('High-speed telemetry extraction');

    // Verify Photo Gallery
    const galleryContainer = page.locator('[data-testid="experience-photo-gallery"]');
    await expect(galleryContainer).toBeVisible();
    const galleryImage = galleryContainer.locator('img').first();
    await expect(galleryImage).toBeVisible();
    const isImageLoaded = await galleryImage.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isImageLoaded).toBe(true);

    // Verify External Link Pills
    const externalLinksContainer = page.locator('[data-testid="external-link-pills"]');
    await expect(externalLinksContainer).toBeVisible();
    const pedigreeLink = externalLinksContainer.locator('a', { hasText: 'Losey.co Pedigree' });
    await expect(pedigreeLink).toBeVisible();

    // Verify Owner Passport Card
    const ownerPassportCard = page.locator('[data-testid="owner-passport-card"]');
    await expect(ownerPassportCard).toBeVisible();
    await expect(ownerPassportCard).toContainText('PJ Losey');

    // Verify Touch Targets >= 44px
    const interactiveElements = await page.locator('button:visible, a:visible').all();
    console.log(`[EXP-HRC-2021] Auditing ${interactiveElements.length} visible interactive elements for >= 44px bounds...`);

    let touchTargetFailures = 0;
    for (const el of interactiveElements) {
      const box = await el.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        if (box.height < 44 || box.width < 44) {
          const text = (await el.textContent())?.trim() || (await el.getAttribute('aria-label')) || 'unnamed element';
          console.warn(`[TOUCH-TARGET SUB-44] Element "${text}": ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
          touchTargetFailures++;
        }
      }
    }
    expect(touchTargetFailures).toBe(0);
    expect(pageErrors.length).toBe(0);

    await page.screenshot({ path: 'tests/screenshots/exp_hrc_2021_detail.png', fullPage: true });
  });

  test('2. http://localhost:3000/exp/exp-gridpass-2024 - Verify special project experience asset', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    const response = await page.goto('/exp/exp-gridpass-2024', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Verify Title "Gridpass Platform & Waterway Radar"
    const titleEl = page.locator('[data-testid="experience-title"]');
    await expect(titleEl).toBeVisible();
    await expect(titleEl).toContainText('Gridpass Platform & Waterway Radar');

    // Verify Category Pill "SPECIAL PROJECT"
    const categoryPill = page.locator('[data-testid="experience-category-pill"]');
    await expect(categoryPill).toBeVisible();
    await expect(categoryPill).toContainText('SPECIAL PROJECT');

    // Verify Description
    const descEl = page.locator('[data-testid="experience-description"]');
    await expect(descEl).toBeVisible();
    await expect(descEl).toContainText('Dynamic QR code portfolios');

    // Verify External Links
    const externalLinksContainer = page.locator('[data-testid="external-link-pills"]');
    await expect(externalLinksContainer).toBeVisible();
    const platformLink = externalLinksContainer.locator('a', { hasText: 'Gridpass Platform' });
    const radarLink = externalLinksContainer.locator('a', { hasText: 'Live Waterway Radar' });
    await expect(platformLink).toBeVisible();
    await expect(radarLink).toBeVisible();

    // Verify Touch Targets >= 44px
    const interactiveElements = await page.locator('button:visible, a:visible').all();
    console.log(`[EXP-GRIDPASS-2024] Auditing ${interactiveElements.length} visible interactive elements for >= 44px bounds...`);

    let touchTargetFailures = 0;
    for (const el of interactiveElements) {
      const box = await el.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        if (box.height < 44 || box.width < 44) {
          const text = (await el.textContent())?.trim() || (await el.getAttribute('aria-label')) || 'unnamed element';
          console.warn(`[TOUCH-TARGET SUB-44] Element "${text}": ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
          touchTargetFailures++;
        }
      }
    }
    expect(touchTargetFailures).toBe(0);
    expect(pageErrors.length).toBe(0);

    await page.screenshot({ path: 'tests/screenshots/exp_gridpass_2024_detail.png', fullPage: true });
  });

  test('3. http://localhost:3000/u/pjlosey - Verify experience snippet cards render "View Full Experience Asset ➔" buttons linking to /exp/[id]', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    const response = await page.goto('/u/pjlosey', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Ensure we are on Career tab
    const careerTab = page.locator('button', { hasText: /Career & About Me/i });
    if (await careerTab.isVisible()) {
      await careerTab.click();
    }

    // Wait for experience cards and "View Full Experience Asset ➔" buttons to render
    const viewExpButtons = page.locator('a', { hasText: 'View Full Experience Asset ➔' });
    await viewExpButtons.first().waitFor({ state: 'visible', timeout: 10000 });
    const count = await viewExpButtons.count();
    expect(count).toBeGreaterThan(0);

    console.log(`Found ${count} "View Full Experience Asset ➔" buttons on /u/pjlosey profile.`);

    // Check links and touch targets
    for (let i = 0; i < count; i++) {
      const btn = viewExpButtons.nth(i);
      await expect(btn).toBeVisible();

      const href = await btn.getAttribute('href');
      expect(href).toMatch(/\/exp\/[a-zA-Z0-9_-]+/);

      const box = await btn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Verify clicking the first "View Full Experience Asset ➔" button navigates to /exp/[id]
    const firstHref = await viewExpButtons.first().getAttribute('href');
    await viewExpButtons.first().click();
    await page.waitForURL(`**${firstHref}`, { timeout: 10000 });
    expect(page.url()).toContain(firstHref!);

    expect(pageErrors.length).toBe(0);
    await page.screenshot({ path: 'tests/screenshots/pjlosey_exp_asset_navigation.png' });
  });

});
