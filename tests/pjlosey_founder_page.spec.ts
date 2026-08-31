import { test, expect } from '@playwright/test';

test.describe('PJ Losey Dedicated Founder Page (/pjlosey) Visual & Functional E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('1. /pjlosey renders hero header, avatar, founder crown, and manifesto cleanly', async ({ page }) => {
    await page.goto('http://localhost:3000/pjlosey');

    // 1. Assert Main Title and Founder Badge
    await expect(page.locator('h1', { hasText: 'PJ Losey' })).toBeVisible();
    await expect(page.locator('text=👑 FOUNDER').first()).toBeVisible();
    await expect(page.locator('text=@pjlosey').first()).toBeVisible();

    // 2. Assert Cover Image
    const coverImg = page.locator('img[src*="/images/profile/pjlosey_cover.jpg"]').first();
    await expect(coverImg).toBeVisible();
    const coverLoaded = await coverImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(coverLoaded).toBe(true);

    // 3. Assert Avatar Image
    const avatarImg = page.locator('img[src*="/images/profile/pjlosey_avatar.jpg"]').first();
    await expect(avatarImg).toBeVisible();
    const avatarLoaded = await avatarImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(avatarLoaded).toBe(true);

    // 4. Assert Founder Manifesto & Mission Story
    await expect(page.locator('text=Clinical Precision. Motorsport Velocity.')).toBeVisible();
    await expect(page.locator('text=THE FOUNDER\'S MISSION').first()).toBeVisible();
    await expect(page.locator('text=Why I Built GridPass: Rebuilding the Digital Car Culture From the Ground Up.')).toBeVisible();
    await expect(page.locator('text=Zero Algorithmic Garbage')).toBeVisible();
    await expect(page.locator('text=Physical-to-Digital Bridge')).toBeVisible();
  });

  test('2. All official social media channels and direct links are present and valid', async ({ page }) => {
    await page.goto('http://localhost:3000/pjlosey');

    const expectedLinks = [
      { text: 'GitHub', href: 'https://github.com/loseyco' },
      { text: 'LinkedIn', href: 'https://linkedin.com/in/pjlosey' },
      { text: 'YouTube', href: 'https://youtube.com/@pjlosey' },
      { text: 'Facebook', href: 'https://facebook.com/pjlosey' },
      { text: 'Instagram', href: 'https://instagram.com/pjlosey' },
      { text: 'X / Twitter', href: 'https://x.com/pjlosey' },
      { text: 'LOSEY.CO', href: 'https://losey.co' },
    ];

    for (const item of expectedLinks) {
      const link = page.locator(`a:has-text("${item.text}")`).first();
      await expect(link).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href).toBe(item.href);
      const target = await link.getAttribute('target');
      expect(target).toBe('_blank');
    }
  });

  test('3. Engineering Timeline tab renders verified pedigree (HRC, Siemens, Davidson, Getz, Ford, Losey.co)', async ({ page }) => {
    await page.goto('http://localhost:3000/pjlosey');

    // Click Timeline tab if not active
    await page.click('button:has-text("Engineering Timeline")');

    // Verify key organizations
    await expect(page.locator('text=Honda Racing (HRC)')).toBeVisible();
    await expect(page.locator('text=IndyCar Trackside Engineer')).toBeVisible();

    await expect(page.locator('text=Siemens Healthineers')).toBeVisible();
    await expect(page.locator('text=Proton Accelerator Project Engineer')).toBeVisible();

    await expect(page.locator('text=Davidson Racing')).toBeVisible();
    await expect(page.locator('text=Getz Fire Equipment')).toBeVisible();
    await expect(page.locator('text=Ford Dealership')).toBeVisible();
    await expect(page.locator('text=LOSEY.CO').first()).toBeVisible();
  });

  test('3b. Verified Credentials tab renders Honda, Siemens, OSHA, and 25H Thunderhill win', async ({ page }) => {
    await page.goto('http://localhost:3000/pjlosey');

    // Click Credentials tab
    await page.click('button:has-text("Verified Credentials")');

    await expect(page.locator('h3:has-text("IndyCar Trackside Engine & Telemetry Specialist")')).toBeVisible();
    await expect(page.locator('h3:has-text("ProBeam 360 Proton Particle Accelerator Project Engineer")')).toBeVisible();
    await expect(page.locator('h3:has-text("25 Hours of Thunderhill Overall Champion (2014)")')).toBeVisible();
    await expect(page.locator('h3:has-text("OSHA 10-Hour General Industry Outreach Certification")')).toBeVisible();
  });

  test('4. Venture Ecosystem tab renders GridPass, iRacersResource, ISRA League, SRCommander, UpfittersOS, GridPass Water, LOCO', async ({ page }) => {
    await page.goto('http://localhost:3000/pjlosey');

    // Click Venture tab
    await page.click('button:has-text("Venture Ecosystem")');

    await expect(page.locator('h3:has-text("GridPass Platform")')).toBeVisible();
    await expect(page.locator('h3:has-text("iRacers Resource")')).toBeVisible();
    await expect(page.locator('h3:has-text("ISRA League")')).toBeVisible();
    await expect(page.locator('h3:has-text("SRCommander")')).toBeVisible();
    await expect(page.locator('h3:has-text("GridPass Water")')).toBeVisible();
    await expect(page.locator('h3:has-text("UpfittersOS")')).toBeVisible();
    await expect(page.locator('h3:has-text("LOCO System Monitor")')).toBeVisible();
  });

  test('5. Engineering Visuals Gallery renders photo cards and opens lightbox modal on click', async ({ page }) => {
    await page.goto('http://localhost:3000/pjlosey');

    // Click Gallery tab
    await page.click('button:has-text("Engineering Visuals")');

    const galleryPhotos = [
      '/images/profile/hrc_telemetry.jpg',
      '/images/profile/siemens_proton.jpg',
      '/images/profile/davidson_paddock.jpg'
    ];

    for (const photoPath of galleryPhotos) {
      const img = page.locator(`img[src*="${photoPath}"]`).first();
      await expect(img).toBeVisible();
      const isLoaded = await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0);
      expect(isLoaded).toBe(true);
    }

    // Click first photo to open lightbox
    await page.locator('img[src*="/images/profile/hrc_telemetry.jpg"]').first().click();

    // Verify modal appears
    const modal = page.locator('div.fixed.inset-0');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Indianapolis 500 & IndyCar Series high-speed telemetry')).toBeVisible();

    // Close modal
    await modal.locator('button:has-text("✕")').click();
  });

  test('6. QR Badge modal opens and renders first-party QR matrix for /pjlosey', async ({ page }) => {
    await page.goto('http://localhost:3000/pjlosey');

    await page.click('button:has-text("QR Badge")');

    // Assert QR modal is visible
    await expect(page.locator('text=FOUNDER QR PASSPORT')).toBeVisible();
    await expect(page.locator('img[alt="Gridpass QR Code"]')).toBeVisible();
    await expect(page.locator('text=Download High-Res QR')).toBeVisible();
  });

  test('7. /u/pjlosey profile page has direct link to /pjlosey founder showcase', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    const founderLink = page.locator('a[href="/pjlosey"]').first();
    await expect(founderLink).toBeVisible();
    await expect(founderLink).toContainText('View Founder Showcase (/pjlosey)');
  });

});
