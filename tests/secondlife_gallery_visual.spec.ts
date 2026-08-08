import { test, expect } from '@playwright/test';

test.describe('Skinny Dip Inn - Resort Photo Gallery E2E Visual Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('gp_rules_accepted_skinny-dip-inn_guest', new Date().toISOString());
      localStorage.setItem('gp_rules_accepted_skinny-dip-inn_', new Date().toISOString());
    });
  });

  test('1. Lightbox Carousel Navigation (Prev/Next buttons, Arrow keys, Photo counter)', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=gallery');
    await expect(page.getByText('Resort Photo Gallery')).toBeVisible();

    // Click first photo card to open Lightbox
    const firstPhotoHeading = page.getByRole('heading', { name: 'Sunset Beach Deck & Pool' });
    await expect(firstPhotoHeading).toBeVisible();
    await firstPhotoHeading.click();

    const modal = page.locator('[data-testid="lightbox-modal"]');
    await expect(modal).toBeVisible();

    // Verify initial counter: "Photo 1 of 6"
    const counter = modal.locator('[data-testid="lightbox-counter"]');
    await expect(counter).toContainText(/Photo 1 of 6/i);
    await expect(modal.locator('h3')).toHaveText('Sunset Beach Deck & Pool');

    // Test Next button click
    const nextBtn = modal.locator('[data-testid="lightbox-next-btn"]');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Counter updates to "Photo 2 of 6" and title updates
    await expect(counter).toContainText(/Photo 2 of 6/i);
    await expect(modal.locator('h3')).toHaveText('Friday Night Live DJ Set');

    // Test Previous button click
    const prevBtn = modal.locator('[data-testid="lightbox-prev-btn"]');
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();

    // Counter returns to "Photo 1 of 6"
    await expect(counter).toContainText(/Photo 1 of 6/i);
    await expect(modal.locator('h3')).toHaveText('Sunset Beach Deck & Pool');

    // Test Keyboard Navigation: ArrowRight
    await page.keyboard.press('ArrowRight');
    await expect(counter).toContainText(/Photo 2 of 6/i);
    await expect(modal.locator('h3')).toHaveText('Friday Night Live DJ Set');

    // Test Keyboard Navigation: ArrowLeft
    await page.keyboard.press('ArrowLeft');
    await expect(counter).toContainText(/Photo 1 of 6/i);
    await expect(modal.locator('h3')).toHaveText('Sunset Beach Deck & Pool');

    // Close lightbox
    await modal.locator('[data-testid="lightbox-close-btn"]').click();
    await expect(modal).not.toBeVisible();
  });

  test('2. Interactive Heart Upvoting (Click ❤️, count increment, toast notice)', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=gallery');
    await expect(page.getByText('Resort Photo Gallery')).toBeVisible();

    // Locate upvote button for photo-1 (Sunset Beach Deck & Pool) - initial likes: 42
    const upvoteBtn = page.locator('[data-testid="upvote-btn-photo-1"]');
    await expect(upvoteBtn).toBeVisible();
    await expect(upvoteBtn).toContainText('42');

    // Click ❤️ upvote button
    await upvoteBtn.click();

    // Verify count incremented to 43
    await expect(upvoteBtn).toContainText('43');

    // Verify Toast notification appeared
    await expect(page.getByText(/Photo Upvoted!/i)).toBeVisible();
  });

  test('3. Staff Admin Operations Toolbar (Pin ⭐, Hide/Unhide 👁️, Edit ✏️, Delete 🗑️)', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=gallery');
    await expect(page.getByText('Resort Photo Gallery')).toBeVisible();

    // --- Pin ⭐ Test ---
    const pinBtn = page.locator('[data-testid="pin-btn-photo-3"]'); // VIP Oceanfront Cabana
    await expect(pinBtn).toBeVisible();
    await pinBtn.click();

    // Verify Pinned badge and toast notice
    await expect(page.getByText(/Photo Pinned/i)).toBeVisible();
    await expect(page.getByText('Pinned').first()).toBeVisible();

    // --- Hide/Unhide 👁️ Test ---
    const hideBtn = page.locator('[data-testid="hide-btn-photo-4"]'); // Tropical Palms Walkway
    await expect(hideBtn).toBeVisible();
    await hideBtn.click();

    // Verify Hidden badge and toast notice
    await expect(page.getByText(/Photo Hidden/i)).toBeVisible();

    // Unhide photo
    await hideBtn.click();
    await expect(page.getByText(/Photo Unhidden/i)).toBeVisible();

    // --- Edit ✏️ Test ---
    const editBtn = page.locator('[data-testid="edit-btn-photo-2"]'); // Friday Night Live DJ Set
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const editModal = page.locator('[data-testid="edit-photo-modal"]');
    await expect(editModal).toBeVisible();

    // Change title
    const titleInput = editModal.locator('[data-testid="edit-photo-title-input"]');
    await titleInput.clear();
    await titleInput.fill('Friday Night Neon Raves');

    // Save changes
    await editModal.locator('[data-testid="save-edit-photo-btn"]').click();
    await expect(editModal).not.toBeVisible();

    // Verify updated title on card and toast notice
    await expect(page.getByRole('heading', { name: 'Friday Night Neon Raves' })).toBeVisible();
    await expect(page.getByText(/Photo Updated/i)).toBeVisible();

    // --- Delete 🗑️ Test ---
    const deleteBtn = page.locator('[data-testid="delete-btn-photo-6"]'); // Sunrise Water Lounge
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Verify photo card is deleted and toast notice appears
    await expect(page.getByRole('heading', { name: 'Sunrise Water Lounge' })).not.toBeVisible();
    await expect(page.getByText(/Photo Deleted/i)).toBeVisible();
  });

});
