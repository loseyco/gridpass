import { test, expect } from '@playwright/test';

test.describe('Founder Fact-Checking HQ (/admin/founder-facts) E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('1. /admin/founder-facts renders truth counters, category pills, and fact cards', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/founder-facts');

    // Assert Header
    await expect(page.locator('h1', { hasText: 'PJ Losey Life & Career Fact-Checking HQ' })).toBeVisible();
    await expect(page.locator('text=FOUNDER TRUTH MATRIX').first()).toBeVisible();

    // Assert Metric Counter Cards
    await expect(page.locator('text=Total Facts')).toBeVisible();
    await expect(page.getByText('✅ Verified True', { exact: true })).toBeVisible();
    await expect(page.getByText('❌ False / Rejected', { exact: true })).toBeVisible();
    await expect(page.getByText('⏳ Pending Review', { exact: true })).toBeVisible();

    // Assert Key Verified Claims
    await expect(page.locator('h3:has-text("IndyCar Trackside Systems Liaison & Data Engineer")')).toBeVisible();
    await expect(page.locator('h3:has-text("Overall Winner of the 25 Hours of Thunderhill (2014)")')).toBeVisible();
    await expect(page.locator('h3:has-text("Proton Accelerator Project & Electrical Engineer")')).toBeVisible();
  });

  test('2. Toggling truth status (TRUE / FALSE / PENDING) updates UI immediately', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/founder-facts');

    // Locate the first fact card
    const firstCard = page.locator('div.border-2.rounded-2xl').first();
    await expect(firstCard).toBeVisible();

    // Click FALSE button inside the first card
    const falseBtn = firstCard.locator('button:has-text("FALSE")');
    await falseBtn.click();
    await expect(firstCard.locator('button.bg-red-600:has-text("FALSE")')).toBeVisible();

    // Click TRUE button back
    const trueBtn = firstCard.locator('button:has-text("TRUE")');
    await trueBtn.click();
    await expect(firstCard.locator('button.bg-emerald-600:has-text("TRUE")')).toBeVisible();
  });

  test('3. Personal note editor opens, accepts text, and saves', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/founder-facts');

    const firstCard = page.locator('div.border-2.rounded-2xl').first();

    // Click Edit Note or Add Note
    const noteBtn = firstCard.locator('button:has-text("Edit Note"), button:has-text("+ Add Note")').first();
    await noteBtn.click();

    // Fill note textarea
    const textarea = firstCard.locator('textarea');
    await expect(textarea).toBeVisible();
    await textarea.fill('Verified personally by PJ Losey during testing.');

    // Click Save Note
    await firstCard.locator('button:has-text("Save Note")').click();
    await expect(page.locator('text=Note Saved ✍️')).toBeVisible();
    await expect(firstCard.locator('text=Verified personally by PJ Losey during testing.')).toBeVisible();
  });

  test('4. Add Life Fact modal opens, validates, and adds new fact to the database', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/founder-facts');

    // Click Add Life Fact button
    await page.click('button:has-text("Add Life Fact")');

    // Verify modal appears
    await expect(page.locator('h3:has-text("Add New Life Story & Verification Fact")')).toBeVisible();

    // Fill form
    await page.fill('input[placeholder="e.g. Lead Engineer for..."]', 'Custom Test Milestone by PJ');
    await page.fill('input[placeholder="e.g. Honda Racing (HRC)"]', 'Losey Racing Engineering');
    await page.fill('input[placeholder="e.g. 2024 – 2025"]', '2026');
    await page.fill('textarea[placeholder*="Provide full details"]', 'High-performance engineering and database testing milestone.');
    await page.fill('input[placeholder*="Add your direct thoughts"]', '100% verified test entry.');

    // Submit form
    await page.click('button:has-text("Add to Database")');

    // Verify added fact appears in the list
    await expect(page.locator('text=Life Fact Added 🌟')).toBeVisible();
    await expect(page.locator('h3:has-text("Custom Test Milestone by PJ")').first()).toBeVisible();
  });

  test('5. Category filtering and search input narrow down results', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/founder-facts');

    // Click Racing category pill
    await page.click('button:has-text("Racing & Paddock")');
    await expect(page.locator('h3:has-text("Overall Winner of the 25 Hours of Thunderhill (2014)")')).toBeVisible();

    // Search query
    await page.fill('input[placeholder*="Search facts"]', 'Thunderhill');
    await expect(page.locator('h3:has-text("Overall Winner of the 25 Hours of Thunderhill (2014)")')).toBeVisible();
  });

});
