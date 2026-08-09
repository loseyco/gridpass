import { test, expect } from '@playwright/test';

test.describe('http://localhost:3000/u/pjlosey Visual Verification Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('1. First-party generated cover photo (/images/profile/pjlosey_cover.jpg) renders cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    const coverImg = page.locator('img[src*="/images/profile/pjlosey_cover.jpg"]').first();
    await expect(coverImg).toBeVisible();

    const isLoaded = await coverImg.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isLoaded).toBe(true);

    const src = await coverImg.getAttribute('src');
    expect(src).toContain('/images/profile/pjlosey_cover.jpg');
  });

  test('2. First-party generated avatar photo (/images/profile/pjlosey_avatar.jpg) renders cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    const avatarImg = page.locator('img[src*="/images/profile/pjlosey_avatar.jpg"]').first();
    await expect(avatarImg).toBeVisible();

    const isLoaded = await avatarImg.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isLoaded).toBe(true);

    const src = await avatarImg.getAttribute('src');
    expect(src).toContain('/images/profile/pjlosey_avatar.jpg');
  });

  test('3. First-party generated experience gallery photos (/images/profile/hrc_telemetry.jpg, /images/profile/siemens_proton.jpg, /images/profile/davidson_paddock.jpg) render cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    const galleryPhotos = [
      '/images/profile/hrc_telemetry.jpg',
      '/images/profile/siemens_proton.jpg',
      '/images/profile/davidson_paddock.jpg'
    ];

    for (const photoPath of galleryPhotos) {
      const img = page.locator(`img[src*="${photoPath}"]`).first();
      await expect(img).toBeVisible();

      const isLoaded = await img.evaluate((el: HTMLImageElement) => {
        return el.complete && el.naturalWidth > 0 && el.naturalHeight > 0;
      });
      expect(isLoaded).toBe(true);
    }
  });

  test('4. Touch targets >= 44px on all social links and buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // Wait for social icons and control buttons to load
    await page.waitForSelector('a[href*="instagram.com"]', { timeout: 10000 });

    // 1. Social Links Verification
    const socialLinks = page.locator('a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="twitter.com"], a[href*="facebook.com"], a[href*="losey.co"]');
    const socialCount = await socialLinks.count();
    expect(socialCount).toBeGreaterThan(0);

    for (let i = 0; i < socialCount; i++) {
      const link = socialLinks.nth(i);
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // 2. Control & Tab Buttons Verification
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    const violatingButtons: Array<{ index: number; text: string; width: number; height: number }> = [];

    for (let i = 0; i < buttonCount; i++) {
      const btn = buttons.nth(i);
      const isVisible = await btn.isVisible();
      if (!isVisible) continue;

      const box = await btn.boundingBox();
      if (!box) continue;

      // Filter out hidden or zero-size elements
      if (box.width === 0 || box.height === 0) continue;

      const text = (await btn.innerText()).trim() || (await btn.getAttribute('aria-label')) || `button-${i}`;

      if (box.width < 44 || box.height < 44) {
        violatingButtons.push({ index: i, text, width: box.width, height: box.height });
      }
    }

    expect(violatingButtons).toEqual([]);
  });

});
