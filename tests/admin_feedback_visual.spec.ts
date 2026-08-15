import { test, expect } from '@playwright/test';

test.describe('Admin Feedback & Feature Triage HQ Visual E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Inject Playwright mock / auth environment
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('__playwright_mock__', 'true');
    });
  });

  test('http://localhost:3000/admin/feedback - Verify clean page load, 0 console TypeError crashes, formatted submission dates for all feedback rows (including Firestore timestamp objects), and screenshot proof', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`[BROWSER-CONSOLE-ERROR] ${msg.text()}`);
      } else {
        console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      pageErrors.push(err);
      console.error(`[BROWSER-PAGEERROR] ${err.stack || err.message}`);
    });

    // 1. Load /admin/feedback
    await page.goto('http://localhost:3000/admin/feedback', { waitUntil: 'domcontentloaded' });

    // 2. Verify Member Ideas & Triage HQ Header
    const header = page.getByRole('heading', { name: /Member Ideas & Feature Request Triage HQ/i });
    await expect(header).toBeVisible({ timeout: 15000 });

    // 3. Verify Table title
    await expect(page.getByText(/Member Feedback & Feature Intake Queue|Member Feedback & Intakes Queue/i)).toBeVisible({ timeout: 15000 });

    // 4. Verify Feedback rows exist (either real Firestore documents or fallback items)
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
    console.log(`Verified ${rowCount} feedback row(s) rendered in table.`);

    // 5. Verify all feedback rows render formatted submission dates (including Firestore timestamp objects)
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const dateCell = row.locator('td').nth(1); // Index 1 is SUBMITTED column (index 0 is checkbox)
      const dateText = (await dateCell.innerText()).trim();
      console.log(`Row ${i + 1} submission date: "${dateText}"`);
      
      // Must match YYYY-MM-DD date format and not be undefined, NaN, or raw Firestore Timestamp object
      expect(dateText).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dateText).not.toContain('NaN');
      expect(dateText).not.toContain('undefined');
      expect(dateText).not.toContain('[object');
    }

    // 6. Verify Filter Pills rendered
    await expect(page.getByRole('button', { name: /All Submissions/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Pending Triage/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Approved for Dev/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Roadmap Ideas/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Archived/i })).toBeVisible();

    // 7. Verify Action Buttons rendered
    const detailsButtons = page.getByRole('button', { name: /Details/i });
    await expect(detailsButtons.first()).toBeVisible();

    // 8. Test drawer modal interaction
    await detailsButtons.first().click();
    await expect(page.getByText('Super Admin Directive & Subagent Instructions')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Close Drawer' }).click();

    // 9. Capture visual E2E screenshot proof
    await page.screenshot({ path: 'tests/screenshots/admin_feedback_hq.png', fullPage: true });

    // 10. Assert zero JS runtime uncaught crashes, page errors, or console TypeError exceptions
    const typeErrors = consoleErrors.filter(e => e.toLowerCase().includes('typeerror'));
    expect(typeErrors.length, `Console TypeError crashes detected: ${typeErrors.join(', ')}`).toBe(0);
    expect(pageErrors.length, `Uncaught page errors detected: ${pageErrors.map(e => e.message).join(', ')}`).toBe(0);
  });

});
