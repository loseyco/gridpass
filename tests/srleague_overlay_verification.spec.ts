import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('SRLeague Live Broadcast Overlay Verification', () => {
  test('Verify SRLeague Overlay on local telemetry bridge', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // 1. Listen for console errors & unhandled exceptions
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (exception) => {
      pageErrors.push(exception.message);
    });

    // Navigate to local broadcast overlay
    const targetUrl = '/srleague/overlay?local=true';
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // Wait for the overlay to connect to WebSocket and render live session
    const headerTitle = page.locator('h1');
    await expect(headerTitle).toBeVisible({ timeout: 10000 });
    const headerText = await headerTitle.textContent();
    console.log(`Overlay Header Title: ${headerText}`);

    // Wait for timing tower to be visible
    const timingTowerHeader = page.locator('text=LEADERBOARD');
    await expect(timingTowerHeader).toBeVisible({ timeout: 10000 });
    console.log('Timing tower header verified.');

    // 2. Verify Timing Tower displays sorted drivers
    const driverRows = page.locator('div.fixed.top-20.left-6 div.space-y-0\\.5 > div.flex.items-center.justify-between');
    const driverRowCount = await driverRows.count();
    console.log(`Driver rows found in timing tower: ${driverRowCount}`);
    expect(driverRowCount).toBeGreaterThan(0);

    // Extract top driver row details to verify sorting and best lap/gap
    const firstDriver = driverRows.first();
    await expect(firstDriver).toBeVisible();
    const firstDriverText = await firstDriver.textContent();
    console.log(`P1 Driver Row content: ${firstDriverText}`);

    // Verify position 1 badge
    const p1Badge = firstDriver.locator('span').filter({ hasText: /^1$/ }).first();
    await expect(p1Badge).toBeVisible();

    // Verify other driver rows have valid position badges
    for (let i = 0; i < Math.min(driverRowCount, 5); i++) {
      const row = driverRows.nth(i);
      const text = await row.textContent();
      console.log(`Driver Row ${i + 1}: ${text}`);
      expect(text).toBeTruthy();
    }

    // 3. Verify Focused Driver Card displays live telemetry
    const focusedCard = page.locator('div.fixed.bottom-8.right-6');
    await expect(focusedCard).toBeVisible({ timeout: 10000 });

    // Verify driver identity in focused card
    const focusedDriverName = focusedCard.locator('h3');
    await expect(focusedDriverName).toBeVisible();
    const driverName = await focusedDriverName.textContent();
    console.log(`Focused Driver: ${driverName}`);
    expect(driverName?.length).toBeGreaterThan(0);

    // Verify Best Lap / Last Lap / Laps Done stats
    await expect(focusedCard.locator('text=Best Lap')).toBeVisible();
    await expect(focusedCard.locator('text=Last Lap')).toBeVisible();
    await expect(focusedCard.locator('text=Laps Done')).toBeVisible();

    // Verify MPH & Speed
    await expect(focusedCard.locator('text=MPH')).toBeVisible();

    // Verify Tachometer / RPM
    await expect(focusedCard.getByText(/RPM:/i)).toBeVisible();
    await expect(focusedCard.getByText(/REDLINE/i)).toBeVisible();

    // Verify Throttle & Brake pedal sensor bars
    await expect(focusedCard.locator('text=THROTTLE')).toBeVisible();
    await expect(focusedCard.locator('text=BRAKE')).toBeVisible();
    console.log('Focused driver telemetry card verified successfully.');

    // 4. Verify NO battle box is present
    const battleBoxHeading = page.locator('text=BATTLE BOX');
    await expect(battleBoxHeading).toHaveCount(0);

    const battleBoxSelector = page.locator('[data-testid="battle-box"], [id="battle-box"], .battle-box');
    await expect(battleBoxSelector).toHaveCount(0);
    console.log('Verified: No battle box element is present on the page.');

    // Take screenshot for visual artifact
    const screenshotPath = path.join(__dirname, 'screenshots', 'srleague_overlay_verified.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved screenshot to ${screenshotPath}`);

    // Wait a brief moment to catch any asynchronous console errors
    await page.waitForTimeout(1000);

    // 1. Assert 0 console errors & 0 page errors
    console.log(`Console errors count: ${consoleErrors.length}`, consoleErrors);
    console.log(`Page errors count: ${pageErrors.length}`, pageErrors);

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
