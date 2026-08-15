import { test, expect } from '@playwright/test';

test.describe('Gridpass Driver Passport - Portfolio Photo Gallery & E2E Visual Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('1. Multi-file portfolio photos render in smooth horizontal scroll gallery strip', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // Verify profile loaded (PJ Losey driver passport)
    await expect(page.locator('h1', { hasText: /PJ Losey|Marcus Mustang/ })).toBeVisible();

    // Locate the portfolio gallery strip
    const galleryStrip = page.locator('[data-testid="portfolio-gallery-strip"]').first();
    await expect(galleryStrip).toBeVisible();

    // Verify it has overflow-x-auto / scroll-smooth classes
    await expect(galleryStrip).toHaveClass(/overflow-x-auto/);

    // Verify thumbnails exist in the scroll strip
    const thumbnails = galleryStrip.locator('[data-testid^="portfolio-photo-thumbnail-"]');
    const count = await thumbnails.count();
    expect(count).toBeGreaterThan(0);
  });

  test('2. Lightbox zoom modal features ChevronLeft/ChevronRight buttons, keyboard shortcuts, and "Photo X of Y" counter', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // Click the first photo thumbnail to open Lightbox
    const firstThumbnail = page.locator('[data-testid="portfolio-photo-thumbnail-0"]').first();
    await expect(firstThumbnail).toBeVisible();
    await firstThumbnail.click();

    // Lightbox modal must be visible
    const modal = page.locator('[data-testid="lightbox-modal"]');
    await expect(modal).toBeVisible();

    // Counter badge displays "Photo 1 of X"
    const counter = page.locator('[data-testid="lightbox-counter"]');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText(/Photo 1 of/i);

    // ChevronLeft and ChevronRight buttons visible
    const prevBtn = page.locator('[data-testid="lightbox-prev-btn"]');
    const nextBtn = page.locator('[data-testid="lightbox-next-btn"]');
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    // Close lightbox modal
    const closeBtn = page.locator('[data-testid="lightbox-close-btn"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });

  test('3. EditPassportDrawer drag-and-drop dropzone with multiple file selection & live upload progress status', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // Click Manage Passport button to open EditPassportDrawer
    const editBtn = page.locator('[data-testid="edit-passport-btn"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Dropzone element is visible in the drawer
    const dropzone = page.locator('[data-testid="edit-passport-dropzone"]');
    await expect(dropzone).toBeVisible();

    // File input allows multiple files
    const fileInput = page.locator('[data-testid="portfolio-file-input"]');
    await expect(fileInput).toBeAttached();
    const isMultiple = await fileInput.getAttribute('multiple');
    expect(isMultiple).not.toBeNull();

    // Set multiple files input
    await fileInput.setInputFiles([
      {
        name: 'dyno-run-1.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
      },
      {
        name: 'track-recap-2.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
      }
    ]);

    // Verify status text or progress bar displays live progress
    const statusText = page.locator('[data-testid="upload-status-text"]');
    await expect(statusText).toBeVisible();
    await expect(statusText).toContainText(/Uploaded 2 photos successfully!/i);

    // Verify selected/uploaded filenames list displays dyno-run-1.png & track-recap-2.png
    await expect(dropzone).toContainText('dyno-run-1.png');
    await expect(dropzone).toContainText('track-recap-2.png');
  });

  test('4. All interactive buttons and controls have touch targets >= 44px', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // 1. Check Top control buttons (Back button & Manage Passport button)
    const editPassportBtnBox = await page.locator('[data-testid="edit-passport-btn"]').first().boundingBox();
    expect(editPassportBtnBox).not.toBeNull();
    if (editPassportBtnBox) {
      expect(editPassportBtnBox.width).toBeGreaterThanOrEqual(44);
      expect(editPassportBtnBox.height).toBeGreaterThanOrEqual(44);
    }

    // 2. Check Portfolio photo thumbnails
    const thumbnailBox = await page.locator('[data-testid="portfolio-photo-thumbnail-0"]').first().boundingBox();
    expect(thumbnailBox).not.toBeNull();
    if (thumbnailBox) {
      expect(thumbnailBox.width).toBeGreaterThanOrEqual(44);
      expect(thumbnailBox.height).toBeGreaterThanOrEqual(44);
    }

    // 3. Open Lightbox and check Lightbox control touch targets (Prev, Next, Close, Counter)
    await page.locator('[data-testid="portfolio-photo-thumbnail-0"]').first().click();
    const modal = page.locator('[data-testid="lightbox-modal"]');
    await expect(modal).toBeVisible();

    const prevBox = await page.locator('[data-testid="lightbox-prev-btn"]').boundingBox();
    expect(prevBox).not.toBeNull();
    if (prevBox) {
      expect(prevBox.width).toBeGreaterThanOrEqual(44);
      expect(prevBox.height).toBeGreaterThanOrEqual(44);
    }

    const nextBox = await page.locator('[data-testid="lightbox-next-btn"]').boundingBox();
    expect(nextBox).not.toBeNull();
    if (nextBox) {
      expect(nextBox.width).toBeGreaterThanOrEqual(44);
      expect(nextBox.height).toBeGreaterThanOrEqual(44);
    }

    const closeBox = await page.locator('[data-testid="lightbox-close-btn"]').boundingBox();
    expect(closeBox).not.toBeNull();
    if (closeBox) {
      expect(closeBox.width).toBeGreaterThanOrEqual(44);
      expect(closeBox.height).toBeGreaterThanOrEqual(44);
    }

    await page.locator('[data-testid="lightbox-close-btn"]').click();

    // 4. Open EditPassportDrawer and check drawer interactive elements
    await page.locator('[data-testid="edit-passport-btn"]').first().click();
    const dropzoneBox = await page.locator('[data-testid="edit-passport-dropzone"]').boundingBox();
    expect(dropzoneBox).not.toBeNull();
    if (dropzoneBox) {
      expect(dropzoneBox.width).toBeGreaterThanOrEqual(44);
      expect(dropzoneBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('5. Experience External Link Pills render cleanly under work experience cards', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // Experience 0 link pills container
    const linkPillsContainer = page.locator('[data-testid="experience-links-0"]');
    await expect(linkPillsContainer).toBeVisible();

    // First experience link pill (Losey.co Pedigree)
    const pedigreePill = page.locator('[data-testid="experience-link-pill-0-0"]');
    await expect(pedigreePill).toBeVisible();
    await expect(pedigreePill).toContainText('Losey.co Pedigree');
  });

  test('6. External link pills open external links in a new tab (target="_blank" rel="noopener noreferrer")', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    const pedigreePill = page.locator('[data-testid="experience-link-pill-0-0"]');
    await expect(pedigreePill).toBeVisible();

    // Verify HTML attributes for security & opening in new tab
    const targetAttr = await pedigreePill.getAttribute('target');
    const relAttr = await pedigreePill.getAttribute('rel');
    const hrefAttr = await pedigreePill.getAttribute('href');
    expect(targetAttr).toBe('_blank');
    expect(relAttr).toContain('noopener');
    expect(relAttr).toContain('noreferrer');
    expect(hrefAttr).toBe('https://losey.co');
  });

  test('7. EditPassportDrawer includes Link Title & URL inputs with "+ Add Link" button and >= 44px delete targets', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // Open EditPassportDrawer
    await page.locator('[data-testid="edit-passport-btn"]').first().click();

    // Switch to Work & Career tab
    const careerTab = page.locator('button', { hasText: 'Work & Career' });
    await expect(careerTab).toBeVisible();
    await careerTab.click();

    // Verify Link Title & Link URL inputs exist
    const titleInput = page.locator('[data-testid="exp-link-title-input"]');
    const urlInput = page.locator('[data-testid="exp-link-url-input"]');
    const addLinkBtn = page.locator('[data-testid="add-exp-link-btn"]');

    await expect(titleInput).toBeVisible();
    await expect(urlInput).toBeVisible();
    await expect(addLinkBtn).toBeVisible();

    // Fill link title & URL
    await titleInput.fill('V4 Release Notes');
    await urlInput.fill('https://gridpass.app/v4');

    // Click "+ Add Link" button
    await addLinkBtn.click();

    // Verify pending link pill was created
    const pendingList = page.locator('[data-testid="pending-exp-links-list"]');
    await expect(pendingList).toBeVisible();
    await expect(pendingList).toContainText('V4 Release Notes');

    // Verify Delete target touch target size is >= 44px x 44px
    const deleteBtn = pendingList.locator('[data-testid^="delete-link-btn-"]').first();
    await expect(deleteBtn).toBeVisible();
    const deleteBox = await deleteBtn.boundingBox();
    expect(deleteBox).not.toBeNull();
    if (deleteBox) {
      expect(deleteBox.width).toBeGreaterThanOrEqual(44);
      expect(deleteBox.height).toBeGreaterThanOrEqual(44);
    }

    // Delete link
    await deleteBtn.click();
    await expect(pendingList).not.toBeVisible();
  });

  test('8. All interactive link pills and controls have touch targets >= 44px', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // Wait for async profile load to render link pills
    const firstPill = page.locator('[data-testid="experience-link-pill-0-0"]');
    await expect(firstPill).toBeVisible();

    // Check Experience external link pill touch target dimensions
    const linkPills = page.locator('[data-testid^="experience-link-pill-"]');
    const count = await linkPills.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const pillBox = await linkPills.nth(i).boundingBox();
      expect(pillBox).not.toBeNull();
      if (pillBox) {
        expect(pillBox.width).toBeGreaterThanOrEqual(44);
        expect(pillBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

});
