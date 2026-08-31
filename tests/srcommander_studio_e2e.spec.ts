import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('GridPass.App SRCommander Broadcast Studio & TV Director Deck E2E', () => {
  test('Verify Broadcast Studio UI, Camera Switcher, Replay & Overlay Overrides', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (exception) => {
      pageErrors.push(exception.message);
    });

    // 1. Navigate to /srcommander/studio
    console.log('Navigating to /srcommander/studio...');
    await page.goto('/srcommander/studio', { waitUntil: 'domcontentloaded' });

    // 2. Verify Master Header & Return to Live button
    const headerTitle = page.locator('h1');
    await expect(headerTitle).toBeVisible({ timeout: 15000 });
    await expect(headerTitle).toContainText(/Broadcast Studio/i);

    const liveBtn = page.getByRole('button', { name: /ON-AIR LIVE|RETURN TO LIVE/i });
    await expect(liveBtn).toBeVisible({ timeout: 10000 });

    // 3. Verify Section 1: Live Program Monitor
    await expect(page.getByText(/Section 1: Live Program Monitor/i)).toBeVisible();
    await expect(page.getByText(/PROGRAM OUT:/i)).toBeVisible();

    // 4. Verify Section 2: Camera Switcher Matrix
    await expect(page.getByText(/Section 2: Camera Switcher Matrix/i)).toBeVisible();
    await expect(page.getByText(/Leaderboard Quick-Cut Buttons/i)).toBeVisible();
    
    // Check P1-P10 Quick-Cut buttons exist
    const p1Cut = page.getByRole('button', { name: /PJ L/i });
    await expect(p1Cut).toBeVisible();
    
    // Check Camera Angle buttons exist
    await expect(page.getByRole('button', { name: /TV1 Trackside/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cockpit/i })).toBeVisible();

    // 5. Test Camera Angle click reactivity
    await page.getByRole('button', { name: /Cockpit/i }).click();

    // 6. Verify Section 3: Instant Replay & Incidents
    await expect(page.getByText(/Section 3: Instant Replay/i)).toBeVisible();
    const replay10sBtn = page.getByRole('button', { name: /⏪ -10s/i });
    await expect(replay10sBtn).toBeVisible();

    // Test Replay Jump
    await replay10sBtn.click();

    // Test Return to Live
    await liveBtn.click();

    // 7. Verify Section 4: Broadcast Graphic Master Controls
    await expect(page.getByText(/Section 4: Broadcast Graphic Master Controls/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Tower Visible|Tower Hidden/i })).toBeVisible();

    // 8. Verify Section 5: AI Race Director
    await expect(page.getByText(/Section 5: AI Race Director/i)).toBeVisible();
    const aiToggleBtn = page.getByRole('button', { name: /AI ACTIVE|AI DISABLED/i });
    await expect(aiToggleBtn).toBeVisible();
    await aiToggleBtn.click();

    // Take screenshot of Director Studio
    const screenshotDir = path.join(__dirname, 'screenshots');
    if (!require('fs').existsSync(screenshotDir)) {
      require('fs').mkdirSync(screenshotDir, { recursive: true });
    }
    const studioScreenshotPath = path.join(screenshotDir, 'srcommander_studio_verified.png');
    await page.screenshot({ path: studioScreenshotPath, fullPage: true });
    console.log(`Saved screenshot to ${studioScreenshotPath}`);

    // Assert 0 fatal console errors
    const fatalErrors = consoleErrors.filter(
      (err) => !err.includes('favicon.ico') && !err.includes('WebSocket') && !err.includes('firebase')
    );
    expect(fatalErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
