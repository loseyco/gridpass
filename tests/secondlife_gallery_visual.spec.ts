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

  test('4. Direct File Dropzone in Add Photo modal with file picker & drag-and-drop', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=gallery');
    await expect(page.getByText('Resort Photo Gallery')).toBeVisible();

    // Click Add Photo CTA
    const addBtn = page.locator('[data-testid="add-photo-btn"]');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    const addModal = page.locator('[data-testid="add-photo-modal"]');
    await expect(addModal).toBeVisible();

    // Verify Direct File Dropzone and File Picker
    const dropzone = addModal.locator('[data-testid="add-photo-dropzone"]');
    await expect(dropzone).toBeVisible();
    const fileInput = addModal.locator('[data-testid="add-photo-file-input"]');
    await expect(fileInput).toBeAttached();

    // Set sample file input payload
    await fileInput.setInputFiles({
      name: 'test-resort-photo.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    });

    // Check selected file name text appears in dropzone
    await expect(dropzone).toContainText('Selected: test-resort-photo.png');
  });

  test('5. Edit Photo modal dropzone and preview thumbnail', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=gallery');
    await expect(page.getByText('Resort Photo Gallery')).toBeVisible();

    // Open edit modal for photo-1
    const editBtn = page.locator('[data-testid="edit-btn-photo-1"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const editModal = page.locator('[data-testid="edit-photo-modal"]');
    await expect(editModal).toBeVisible();

    // Verify preview thumbnail and dropzone
    const previewThumbnail = editModal.locator('[data-testid="edit-photo-preview-thumbnail"]');
    await expect(previewThumbnail).toBeVisible();
    const previewImg = previewThumbnail.locator('img');
    await expect(previewImg).toBeVisible();

    const editDropzone = editModal.locator('[data-testid="edit-photo-dropzone"]');
    await expect(editDropzone).toBeVisible();
    const editFileInput = editModal.locator('[data-testid="edit-photo-file-input"]');
    await expect(editFileInput).toBeAttached();

    // Set file replacement
    await editFileInput.setInputFiles({
      name: 'replacement-cabana.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    });

    await expect(editDropzone).toContainText('Selected: replacement-cabana.png');
  });

  test('6. All interactive elements have touch targets >= 44px', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=gallery');
    await expect(page.getByText('Resort Photo Gallery')).toBeVisible();

    // Check category filter buttons
    const filterButtons = page.locator('[data-testid^="category-filter-btn-"]');
    const filterCount = await filterButtons.count();
    for (let i = 0; i < filterCount; i++) {
      const btn = filterButtons.nth(i);
      await expect(btn).toBeVisible();
      const box = await btn.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Check Add Photo CTA button
    const addBtnBox = await page.locator('[data-testid="add-photo-btn"]').boundingBox();
    expect(addBtnBox).not.toBeNull();
    if (addBtnBox) {
      expect(addBtnBox.width).toBeGreaterThanOrEqual(44);
      expect(addBtnBox.height).toBeGreaterThanOrEqual(44);
    }

    // Check Photo Card interactive buttons
    const upvoteBtnBox = await page.locator('[data-testid="upvote-btn-photo-1"]').boundingBox();
    expect(upvoteBtnBox).not.toBeNull();
    if (upvoteBtnBox) {
      expect(upvoteBtnBox.width).toBeGreaterThanOrEqual(44);
      expect(upvoteBtnBox.height).toBeGreaterThanOrEqual(44);
    }

    const pinBtnBox = await page.locator('[data-testid="pin-btn-photo-1"]').boundingBox();
    expect(pinBtnBox).not.toBeNull();
    if (pinBtnBox) {
      expect(pinBtnBox.width).toBeGreaterThanOrEqual(44);
      expect(pinBtnBox.height).toBeGreaterThanOrEqual(44);
    }

    // Open Add Photo modal and check modal touch targets
    await page.locator('[data-testid="add-photo-btn"]').click();
    const addModal = page.locator('[data-testid="add-photo-modal"]');
    await expect(addModal).toBeVisible();

    const addDropzoneBox = await addModal.locator('[data-testid="add-photo-dropzone"]').boundingBox();
    expect(addDropzoneBox).not.toBeNull();
    if (addDropzoneBox) {
      expect(addDropzoneBox.width).toBeGreaterThanOrEqual(44);
      expect(addDropzoneBox.height).toBeGreaterThanOrEqual(44);
    }

    const cancelBtnBox = await addModal.locator('button:has-text("Cancel")').boundingBox();
    expect(cancelBtnBox).not.toBeNull();
    if (cancelBtnBox) {
      expect(cancelBtnBox.width).toBeGreaterThanOrEqual(44);
      expect(cancelBtnBox.height).toBeGreaterThanOrEqual(44);
    }

    const uploadBtnBox = await addModal.locator('button:has-text("Add Photo"), button[type="submit"]').boundingBox();
    expect(uploadBtnBox).not.toBeNull();
    if (uploadBtnBox) {
      expect(uploadBtnBox.width).toBeGreaterThanOrEqual(44);
      expect(uploadBtnBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('7. Staff Admin Album Management (Create, Edit, Delete albums & Dynamic Category Filter Pills updates)', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=gallery');
    await expect(page.getByText('Resort Photo Gallery')).toBeVisible();

    // 1. Verify Manage Albums CTA button is visible & touch target >= 44px
    const manageAlbumsBtn = page.locator('[data-testid="manage-albums-btn"]');
    await expect(manageAlbumsBtn).toBeVisible();

    // 2. Open Manage Albums Modal cleanly
    await manageAlbumsBtn.click();
    const albumsModal = page.locator('[data-testid="manage-albums-modal"]');
    await expect(albumsModal).toBeVisible();

    const manageBtnBox = await manageAlbumsBtn.boundingBox();
    if (manageBtnBox) {
      expect(manageBtnBox.width).toBeGreaterThanOrEqual(44);
      expect(manageBtnBox.height).toBeGreaterThanOrEqual(44);
    }

    // Verify modal close button touch target >= 44px
    const closeBtn = albumsModal.locator('[data-testid="close-albums-modal-btn"]');
    await expect(closeBtn).toBeVisible();
    const closeBox = await closeBtn.boundingBox();
    expect(closeBox).not.toBeNull();
    if (closeBox) {
      expect(closeBox.width).toBeGreaterThanOrEqual(44);
      expect(closeBox.height).toBeGreaterThanOrEqual(44);
    }

    // 3. Album Creation (➕ Create Album)
    const createAlbumBtn = albumsModal.locator('[data-testid="create-album-btn"]');
    await expect(createAlbumBtn).toBeVisible();
    const createBtnBox = await createAlbumBtn.boundingBox();
    expect(createBtnBox).not.toBeNull();
    if (createBtnBox) {
      expect(createBtnBox.width).toBeGreaterThanOrEqual(44);
      expect(createBtnBox.height).toBeGreaterThanOrEqual(44);
    }
    await createAlbumBtn.click();

    // Fill form and check inputs >= 44px
    const nameInput = albumsModal.locator('[data-testid="album-name-input"]');
    const descInput = albumsModal.locator('[data-testid="album-desc-input"]');
    const saveAlbumBtn = albumsModal.locator('[data-testid="save-album-btn"]');

    await expect(nameInput).toBeVisible();
    const nameBox = await nameInput.boundingBox();
    if (nameBox) {
      expect(nameBox.height).toBeGreaterThanOrEqual(44);
    }

    await nameInput.fill('Poolside VIP Parties');
    await descInput.fill('Exclusive nighttime poolside party snapshots');

    const saveBox = await saveAlbumBtn.boundingBox();
    if (saveBox) {
      expect(saveBox.width).toBeGreaterThanOrEqual(44);
      expect(saveBox.height).toBeGreaterThanOrEqual(44);
    }

    await saveAlbumBtn.click();

    // Verify toast notice
    await expect(page.getByText('📁 Album Created!')).toBeVisible();

    // Close Manage Albums Modal
    await closeBtn.click();
    await expect(albumsModal).not.toBeVisible();

    // Verify dynamic filter pill updated dynamically
    const newFilterPill = page.locator('[data-testid="category-filter-btn-poolside-vip-parties"]');
    await expect(newFilterPill).toBeVisible();
    await expect(newFilterPill).toContainText('Poolside VIP Parties');

    // Verify new filter pill touch target >= 44px
    const newPillBox = await newFilterPill.boundingBox();
    if (newPillBox) {
      expect(newPillBox.width).toBeGreaterThanOrEqual(44);
      expect(newPillBox.height).toBeGreaterThanOrEqual(44);
    }

    // Click dynamic filter pill
    await newFilterPill.click();

    // 4. Album Edit (✏️ Edit Album)
    await manageAlbumsBtn.click();
    await expect(albumsModal).toBeVisible();

    const createdAlbumItem = albumsModal.locator('[data-testid^="album-item-"]').filter({ hasText: 'Poolside VIP Parties' });
    await expect(createdAlbumItem).toBeVisible();

    const editAlbumBtn = createdAlbumItem.locator('[data-testid^="edit-album-btn-"]');
    await expect(editAlbumBtn).toBeVisible();
    const editBox = await editAlbumBtn.boundingBox();
    if (editBox) {
      expect(editBox.width).toBeGreaterThanOrEqual(44);
      expect(editBox.height).toBeGreaterThanOrEqual(44);
    }
    await editAlbumBtn.click();

    await expect(nameInput).toBeVisible();
    await nameInput.clear();
    await nameInput.fill('VIP Ocean Sunsets');
    await saveAlbumBtn.click();

    await expect(page.getByText('✏️ Album Updated!')).toBeVisible();

    // Close modal and verify updated category filter pill
    await closeBtn.click();
    await expect(albumsModal).not.toBeVisible();

    const editedFilterPill = page.locator('[data-testid="category-filter-[#vip-ocean-sunsets]"], [data-testid="category-filter-btn-vip-ocean-sunsets"]');
    await expect(editedFilterPill).toBeVisible();
    await expect(editedFilterPill).toContainText('VIP Ocean Sunsets');

    // 5. Album Delete (🗑️ Delete Album)
    await manageAlbumsBtn.click();
    await expect(albumsModal).toBeVisible();

    const editedAlbumItem = albumsModal.locator('[data-testid^="album-item-"]').filter({ hasText: 'VIP Ocean Sunsets' });
    await expect(editedAlbumItem).toBeVisible();

    const deleteAlbumBtn = editedAlbumItem.locator('[data-testid^="delete-album-btn-"]');
    await expect(deleteAlbumBtn).toBeVisible();
    const deleteBox = await deleteAlbumBtn.boundingBox();
    if (deleteBox) {
      expect(deleteBox.width).toBeGreaterThanOrEqual(44);
      expect(deleteBox.height).toBeGreaterThanOrEqual(44);
    }
    await deleteAlbumBtn.click();

    await expect(page.getByText('🗑️ Album Deleted')).toBeVisible();

    // Close modal and verify category filter pill was removed dynamically
    await closeBtn.click();
    await expect(albumsModal).not.toBeVisible();

    await expect(editedFilterPill).not.toBeVisible();
  });

});
