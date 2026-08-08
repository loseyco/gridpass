import { test, expect } from '@playwright/test';

test.describe('Gridpass Driver Passport - Portfolio Photo Gallery & E2E Visual Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('1. Multi-file portfolio photos render in smooth horizontal scroll gallery strip with "View All (X Photos)" badge', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');

    // Verify profile loaded (Marcus Mustang or PJ Losey driver passport)
    await expect(page.locator('h1', { hasText: 'Marcus Mustang' })).toBeVisible();

    // Locate the portfolio gallery strip
    const galleryStrip = page.locator('[data-testid="portfolio-gallery-strip"]').first();
    await expect(galleryStrip).toBeVisible();

    // Verify it has overflow-x-auto / scroll-smooth classes
    await expect(galleryStrip).toHaveClass(/overflow-x-auto/);

    // Verify "View All (6 Photos)" badge is visible since 6 photos exist (> 4 photos)
    const viewAllBadge = page.locator('[data-testid="view-all-photos-badge"]').first();
    await expect(viewAllBadge).toBeVisible();
    await expect(viewAllBadge).toContainText('View All (6 Photos)');

    // Verify thumbnails exist in the scroll strip
    const thumbnails = galleryStrip.locator('[data-testid^="portfolio-photo-thumbnail-"]');
    const count = await thumbnails.count();
    expect(count).toBeGreaterThan(4);
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

    // Counter badge displays "Photo 1 of 6"
    const counter = page.locator('[data-testid="lightbox-counter"]');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText('Photo 1 of 6');

    // ChevronLeft and ChevronRight buttons visible
    const prevBtn = page.locator('[data-testid="lightbox-prev-btn"]');
    const nextBtn = page.locator('[data-testid="lightbox-next-btn"]');
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    // Click Next Chevron -> counter updates to "Photo 2 of 6"
    await nextBtn.click();
    await expect(counter).toContainText('Photo 2 of 6');

    // Click Prev Chevron -> counter updates back to "Photo 1 of 6"
    await prevBtn.click();
    await expect(counter).toContainText('Photo 1 of 6');

    // Keyboard navigation: ArrowRight -> updates counter to "Photo 2 of 6"
    await page.keyboard.press('ArrowRight');
    await expect(counter).toContainText('Photo 2 of 6');

    // Keyboard navigation: ArrowLeft -> updates counter back to "Photo 1 of 6"
    await page.keyboard.press('ArrowLeft');
    await expect(counter).toContainText('Photo 1 of 6');

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

    // 2. Check "View All (6 Photos)" badge button
    const viewAllBadgeBox = await page.locator('[data-testid="view-all-photos-badge"]').first().boundingBox();
    expect(viewAllBadgeBox).not.toBeNull();
    if (viewAllBadgeBox) {
      expect(viewAllBadgeBox.width).toBeGreaterThanOrEqual(44);
      expect(viewAllBadgeBox.height).toBeGreaterThanOrEqual(44);
    }

    // 3. Check Portfolio photo thumbnails
    const thumbnailBox = await page.locator('[data-testid="portfolio-photo-thumbnail-0"]').first().boundingBox();
    expect(thumbnailBox).not.toBeNull();
    if (thumbnailBox) {
      expect(thumbnailBox.width).toBeGreaterThanOrEqual(44);
      expect(thumbnailBox.height).toBeGreaterThanOrEqual(44);
    }

    // 4. Open Lightbox and check Lightbox control touch targets (Prev, Next, Close, Counter)
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

    // 5. Open EditPassportDrawer and check drawer interactive elements
    await page.locator('[data-testid="edit-passport-btn"]').first().click();
    const dropzoneBox = await page.locator('[data-testid="edit-passport-dropzone"]').boundingBox();
    expect(dropzoneBox).not.toBeNull();
    if (dropzoneBox) {
      expect(dropzoneBox.width).toBeGreaterThanOrEqual(44);
      expect(dropzoneBox.height).toBeGreaterThanOrEqual(44);
    }
  });

});
