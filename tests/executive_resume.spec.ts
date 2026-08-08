import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));
});

test.describe('Executive Resume (/u/pjlosey) Visual E2E Suite', () => {

  test('1. Executive Resume Experience Entries render Start Date - End Date with calculated durations', async ({ page }) => {
    await page.goto('/u/pjlosey?tab=career');

    // Verify Career & About Me tab is open
    const careerHeading = page.locator('text=Work Experience & Motorsport Career History');
    await expect(careerHeading).toBeVisible();

    // Verify Experience entries exist with Start Date - End Date and calculated duration (e.g. "Jan 2022 – Present • ... yrs ... mos")
    const durationBadge = page.locator('span', { hasText: /Jan 2022 – Present • \d+ yrs \d+ mos/i }).first();
    await expect(durationBadge).toBeVisible();

    // Verify another experience entry duration (e.g. "Jun 2019 – Dec 2021 • 2 yrs 7 mos")
    const durationBadge2 = page.locator('span', { hasText: /Jun 2019 – Dec 2021 • 2 yrs 7 mos/i }).first();
    await expect(durationBadge2).toBeVisible();
  });

  test('2. Interactive Skills Tag Pills (⚡ Next.js, ⚡ System Architecture) render cleanly under profile and experience cards', async ({ page }) => {
    await page.goto('/u/pjlosey?tab=career');

    // Profile card skill pills
    const nextjsPill = page.locator('button', { hasText: '⚡ Next.js' }).first();
    const sysArchPill = page.locator('button', { hasText: '⚡ System Architecture' }).first();

    await expect(nextjsPill).toBeVisible();
    await expect(sysArchPill).toBeVisible();

    // Verify clicking skill pill remains responsive and clean
    await nextjsPill.click();
    await expect(nextjsPill).toBeVisible();

    // Verify experience card specific skill pills
    const reactPill = page.locator('button', { hasText: '⚡ React' }).first();
    const firebasePill = page.locator('button', { hasText: '⚡ Firebase' }).first();
    await expect(reactPill).toBeVisible();
    await expect(firebasePill).toBeVisible();
  });

  test('3. Portfolio Photo Gallery Thumbnails render under experience cards with Lightbox zoom modal preview', async ({ page }) => {
    await page.goto('/u/pjlosey?tab=career');

    // Verify gallery header under experience card
    const galleryHeader = page.locator('text=📷 Portfolio & Proof Gallery').first();
    await expect(galleryHeader).toBeVisible();

    // Verify photo gallery thumbnails render under experience card
    const thumbnailBtn = page.locator('button[aria-label*="View photo thumbnail"]').first();
    await expect(thumbnailBtn).toBeVisible();

    // Click thumbnail to open Lightbox zoom modal preview
    await thumbnailBtn.click();

    // Verify Lightbox Zoom Modal opens
    const lightboxModal = page.locator('button[aria-label="Close Lightbox Preview"]');
    await expect(lightboxModal).toBeVisible();

    const previewImg = page.locator('img[alt*="Lightbox Zoom Preview"], img[alt*="Gridpass"], img[alt*="Executive"], img[alt*="Proof"]');
    await expect(previewImg.first()).toBeVisible();

    // Close Lightbox Modal
    await lightboxModal.click();
    await expect(lightboxModal).not.toBeVisible();
  });

  test('4. All interactive buttons and inputs have touch targets >= 44px', async ({ page }) => {
    await page.goto('/u/pjlosey?tab=career');

    // Get all visible interactive elements (buttons, links, inputs)
    const interactiveElements = await page.locator('button, a, input, textarea, select').all();

    console.log(`Auditing ${interactiveElements.length} interactive elements for minimum 44px touch targets...`);

    const failingElements: { tag: string; text: string; width: number; height: number; html: string }[] = [];

    for (const elem of interactiveElements) {
      const isVisible = await elem.isVisible().catch(() => false);
      if (!isVisible) continue;

      const box = await elem.boundingBox();
      if (!box) continue;

      const text = (await elem.innerText().catch(() => '')) || (await elem.getAttribute('title')) || (await elem.getAttribute('aria-label')) || '';
      const html = await elem.evaluate(el => el.outerHTML.slice(0, 120)).catch(() => '');

      // Check if width < 44 or height < 44
      if (box.width < 44 || box.height < 44) {
        failingElements.push({
          tag: await elem.evaluate(el => el.tagName.toLowerCase()),
          text: text.trim().replace(/\n/g, ' ').slice(0, 50),
          width: Math.round(box.width),
          height: Math.round(box.height),
          html
        });
      }
    }

    if (failingElements.length > 0) {
      console.log('Failing touch target elements (<44px):', JSON.stringify(failingElements, null, 2));
    }

    expect(failingElements, `Found ${failingElements.length} interactive elements with touch target size < 44px`).toEqual([]);
  });

  test('5. Executive Resume Header, Verified Badges, Role Title, and Share/Print buttons', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/u/pjlosey');

    // Display Name
    const nameLocator = page.locator('h1', { hasText: /PJ Losey|Marcus Mustang/i });
    await expect(nameLocator).toBeVisible();

    // Role Title (admin or SUPER ADMIN & FOUNDER)
    const roleBadge = page.locator('span', { hasText: /admin|SUPER ADMIN/i }).first();
    await expect(roleBadge).toBeVisible();

    // Share Button
    const shareBtn = page.locator('button', { hasText: /Share Passport/i });
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // Verify button text updates or toast appears
    const copiedText = page.locator('button', { hasText: /Copied Tab Link!/i });
    await expect(copiedText).toBeVisible();

    // Print PDF Resume Button
    const printBtn = page.locator('button', { hasText: /Print Passport Badge/i });
    await expect(printBtn).toBeVisible();
    await printBtn.click();

    // Verify Print Modal opens
    const modalHeading = page.locator('text=GRIDPASS PASSPORT RESUME BADGE');
    await expect(modalHeading).toBeVisible();

    // Close modal
    const closeBtn = page.locator('button[aria-label="Close Print Badge Modal"]');
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

});


