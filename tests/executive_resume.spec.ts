import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));
});

test.describe('Executive Resume (/u/pjlosey) Visual E2E Suite', () => {

  test('1. Executive Resume Header with Verified Badges, Role Title, Location, and Social Links', async ({ page }) => {
    await page.goto('/u/pjlosey');

    // Display Name
    const nameLocator = page.locator('h1', { hasText: /PJ Losey|Marcus Mustang/i });
    await expect(nameLocator).toBeVisible();

    // Role Title (admin or SUPER ADMIN & FOUNDER)
    const roleBadge = page.locator('span', { hasText: /admin|SUPER ADMIN/i }).first();
    await expect(roleBadge).toBeVisible();

    // Verified Badges (e.g. ⭐ GOLD)
    const goldBadge = page.locator('text=⭐ GOLD');
    await expect(goldBadge).toBeVisible();

    // Location (Chicago, IL or Monmouth Beach, NJ)
    const locationText = page.locator('text=/Chicago, IL|Monmouth Beach, NJ/i');
    await expect(locationText).toBeVisible();

    // Social Links (Instagram, YouTube, Twitter/Facebook)
    const instaLink = page.locator('a[title*="Instagram"]');
    const ytLink = page.locator('a[title*="YouTube"]');

    await expect(instaLink).toBeVisible();
    await expect(ytLink).toBeVisible();
  });

  test('2. 1-Tap Copy Resume Link button ([share button]) and Print PDF Resume button', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/u/pjlosey');

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

    const downloadQrBtn = page.locator('button', { hasText: /Download High-Res QR Passport Badge/i });
    await expect(downloadQrBtn).toBeVisible();

    // Close modal
    const closeBtn = page.locator('button', { hasText: '✕' });
    await closeBtn.click();
    await expect(modalHeading).not.toBeVisible();
  });

  test('3. 4 Interactive Tabs: Executive Resume (career), Digital Garage (garage), Managed Ventures (businesses), Endorsements Wall (guestbook)', async ({ page }) => {
    await page.goto('/u/pjlosey');

    // 1. Executive Resume (tab === 'career')
    const careerTab = page.locator('button', { hasText: /Career & About Me/i });
    await expect(careerTab).toBeVisible();
    await careerTab.click();
    await expect(page).toHaveURL(/\/u\/pjlosey\?tab=career/);
    await expect(page.locator('text=Motorsport Achievements & Telemetry Stats')).toBeVisible();

    // 2. Digital Garage (tab === 'garage')
    const garageTab = page.locator('button', { hasText: /Digital Garage/i });
    await expect(garageTab).toBeVisible();
    await garageTab.click();
    await expect(page).toHaveURL(/\/u\/pjlosey\?tab=garage/);
    await expect(page.locator('text=Verified Garage Builds')).toBeVisible();

    // 3. Managed Ventures / Businesses (tab === 'businesses')
    const bizTab = page.locator('button', { hasText: /Businesses & Teams/i });
    await expect(bizTab).toBeVisible();
    await bizTab.click();
    await expect(page).toHaveURL(/\/u\/pjlosey\?tab=businesses/);
    await expect(page.locator('text=Affiliated Businesses & Race Teams')).toBeVisible();

    // 4. Endorsements Wall / Guestbook (tab === 'guestbook')
    const guestbookTab = page.locator('button', { hasText: /Fan Wall & Guestbook/i });
    await expect(guestbookTab).toBeVisible();
    await guestbookTab.click();
    await expect(page).toHaveURL(/\/u\/pjlosey\?tab=guestbook/);
    await expect(page.locator('text=Post Message on')).toBeVisible();

    // Deep linking directly test for each tab query param
    await page.goto('/u/pjlosey?tab=career');
    await expect(page.locator('text=Motorsport Achievements & Telemetry Stats')).toBeVisible();

    await page.goto('/u/pjlosey?tab=garage');
    await expect(page.locator('text=Verified Garage Builds')).toBeVisible();

    await page.goto('/u/pjlosey?tab=businesses');
    await expect(page.locator('text=Affiliated Businesses & Race Teams')).toBeVisible();

    await page.goto('/u/pjlosey?tab=guestbook');
    await expect(page.locator('text=Post Message on')).toBeVisible();
  });

  test('4. All interactive elements have touch targets >= 44px', async ({ page }) => {
    await page.goto('/u/pjlosey');

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

});

