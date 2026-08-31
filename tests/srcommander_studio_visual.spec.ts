import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Broadcast Studio & TV Director Deck Automated Verification', () => {

  test('Verify /srcommander/studio loads cleanly with 0 errors and all director sections render and react', async ({ page }) => {
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

    // 2. Navigate to /srcommander/studio
    const targetUrl = '/srcommander/studio';
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // Verify main header
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible({ timeout: 10000 });
    await expect(mainHeading).toContainText('Broadcast Studio & TV Director Deck');
    console.log('Main header verified: Broadcast Studio & TV Director Deck');

    // Verify Live Indicator Pill
    const livePill = page.locator('[data-testid="live-indicator-pill"]');
    await expect(livePill).toBeVisible();
    await expect(livePill).toContainText('PROGRAM LIVE');

    // ───────────────────────────────────────────────────────────────────────────
    // 3. VERIFY ALL 5+ DIRECTOR SECTIONS RENDER PROPERLY
    // ───────────────────────────────────────────────────────────────────────────

    // Section 1: Program Monitor & Return to Live Safety Button
    console.log('Verifying Section 1: Program Monitor...');
    const programMonitor = page.locator('[data-testid="program-monitor-section"]');
    await expect(programMonitor).toBeVisible();

    const returnToLiveBtn = page.locator('[data-testid="return-to-live-safety-btn"]');
    await expect(returnToLiveBtn).toBeVisible();

    const monitorLiveBadge = page.locator('[data-testid="monitor-live-badge"]');
    await expect(monitorLiveBadge).toBeVisible();
    await expect(monitorLiveBadge).toContainText('LIVE PGM');

    const monitorAngleBadge = page.locator('[data-testid="monitor-angle-badge"]');
    await expect(monitorAngleBadge).toBeVisible();
    await expect(monitorAngleBadge).toContainText('CAM: TV1');

    const monitorDriverName = page.locator('[data-testid="monitor-driver-name"]');
    await expect(monitorDriverName).toBeVisible();
    console.log(`Program Monitor initial driver: ${await monitorDriverName.textContent()}`);

    // Section 2: P1–P10 Camera Quick-Cut Switcher
    console.log('Verifying Section 2: P1–P10 Camera Quick-Cut Switcher...');
    const quickCutSection = page.locator('[data-testid="quick-cut-section"]');
    await expect(quickCutSection).toBeVisible();

    for (let p = 1; p <= 10; p++) {
      const cutBtn = page.locator(`[data-testid="quick-cut-p${p}"]`);
      await expect(cutBtn).toBeVisible();
      await expect(cutBtn).toContainText(`P${p}`);
    }
    console.log('All 10 Quick-Cut buttons (P1–P10) verified.');

    // Section 3: 6 Camera Angle Selector Buttons
    console.log('Verifying Section 3: 6 Camera Angle Selectors...');
    const cameraAngleSection = page.locator('[data-testid="camera-angle-section"]');
    await expect(cameraAngleSection).toBeVisible();

    const expectedAngles = ['tv1', 'tv2', 'heli', 'cockpit', 'chase', 'pit'];
    for (const angle of expectedAngles) {
      const angleBtn = page.locator(`[data-testid="camera-angle-${angle}"]`);
      await expect(angleBtn).toBeVisible();
    }
    console.log('All 6 Camera Angle selectors (TV1, TV2, Heli, Cockpit, Chase, Pit) verified.');

    // Section 4: Replay Transport Buttons
    console.log('Verifying Section 4: Replay Transport Buttons...');
    const replaySection = page.locator('[data-testid="replay-transport-section"]');
    await expect(replaySection).toBeVisible();

    await expect(page.locator('[data-testid="replay-jump-15s"]')).toBeVisible();
    await expect(page.locator('[data-testid="replay-jump-10s"]')).toBeVisible();
    await expect(page.locator('[data-testid="replay-jump-5s"]')).toBeVisible();
    await expect(page.locator('[data-testid="replay-pause-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="replay-slowmo-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="replay-live-btn"]')).toBeVisible();
    console.log('All Replay transport buttons (-15s, -10s, -5s, Pause, 0.5x Slow-Mo, Return to Live) verified.');

    // Section 5: Graphic Master Controls
    console.log('Verifying Section 5: Graphic Master Controls...');
    const graphicSection = page.locator('[data-testid="graphic-master-section"]');
    await expect(graphicSection).toBeVisible();

    await expect(page.locator('[data-testid="toggle-timing-tower-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="hud-mode-full"]')).toBeVisible();
    await expect(page.locator('[data-testid="hud-mode-minimal"]')).toBeVisible();
    await expect(page.locator('[data-testid="hud-mode-off"]')).toBeVisible();
    await expect(page.locator('[data-testid="banner-text-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="push-banner-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="splash-none"]')).toBeVisible();
    await expect(page.locator('[data-testid="splash-starting_grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="splash-safety_car"]')).toBeVisible();
    await expect(page.locator('[data-testid="splash-race_results"]')).toBeVisible();
    console.log('All Graphic master controls verified.');

    // Section 6: AI Race Director Autonomous Toggle
    console.log('Verifying Section 6: AI Race Director Autonomous Toggle...');
    const aiDirectorSection = page.locator('[data-testid="ai-race-director-section"]');
    await expect(aiDirectorSection).toBeVisible();

    const aiToggleBtn = page.locator('[data-testid="toggle-ai-director-btn"]');
    await expect(aiToggleBtn).toBeVisible();
    const aiBadge = page.locator('[data-testid="ai-director-badge"]');
    await expect(aiBadge).toBeVisible();
    await expect(aiBadge).toContainText('STANDBY');
    console.log('AI Race Director Autonomous section verified.');

    // ───────────────────────────────────────────────────────────────────────────
    // 4. TEST UI REACTIVITY: CAMERA SWITCHES, REPLAY CONTROLS, LOWER-THIRD & AI
    // ───────────────────────────────────────────────────────────────────────────

    // A. Quick-Cut to P1 (Jennifer Young)
    console.log('Testing Quick-Cut to P1...');
    await page.locator('[data-testid="quick-cut-p1"]').click();
    await expect(monitorDriverName).toContainText('Jennifer Young');

    // B. Quick-Cut to P4 (Robert Nash)
    console.log('Testing Quick-Cut to P4...');
    await page.locator('[data-testid="quick-cut-p4"]').click();
    await expect(monitorDriverName).toContainText('Robert Nash');

    // C. Camera Angle switch: Cockpit
    console.log('Testing Camera Angle switch to Cockpit...');
    await page.locator('[data-testid="camera-angle-cockpit"]').click();
    await expect(monitorAngleBadge).toContainText('CAM: Cockpit');

    // D. Camera Angle switch: Heli
    console.log('Testing Camera Angle switch to Heli...');
    await page.locator('[data-testid="camera-angle-heli"]').click();
    await expect(monitorAngleBadge).toContainText('CAM: Heli');

    // E. Replay: -10s Jump
    console.log('Testing Replay -10s Jump...');
    await page.locator('[data-testid="replay-jump-10s"]').click();
    await expect(monitorLiveBadge).toContainText('REPLAY');
    await expect(livePill).toContainText('REPLAY -10s');
    await expect(returnToLiveBtn).toHaveClass(/animate-pulse/);

    // F. Replay: 0.5x Slow-Mo
    console.log('Testing Replay 0.5x Slow-Mo...');
    await page.locator('[data-testid="replay-slowmo-btn"]').click();
    await expect(livePill).toContainText('0.5x');

    // G. Replay: Pause / Play
    console.log('Testing Replay Pause/Play...');
    await page.locator('[data-testid="replay-pause-btn"]').click();
    await expect(livePill).toContainText('paused');
    await page.locator('[data-testid="replay-pause-btn"]').click();
    await expect(livePill).toContainText('1x');

    // H. Return to Live
    console.log('Testing Return to Live...');
    await returnToLiveBtn.click();
    await expect(monitorLiveBadge).toContainText('LIVE PGM');
    await expect(livePill).toContainText('PROGRAM LIVE');

    // I. Lower-Third Banner Push & Clear
    console.log('Testing Lower-Third Banner Push & Clear...');
    const bannerInput = page.locator('[data-testid="banner-text-input"]');
    await bannerInput.fill('BREAKING: Battle for P1 heading into Turn 4 chicane');
    await page.locator('[data-testid="push-banner-btn"]').click();

    const monitorLowerThird = page.locator('[data-testid="monitor-lower-third-overlay"]');
    await expect(monitorLowerThird).toBeVisible();
    await expect(monitorLowerThird).toContainText('BREAKING: Battle for P1 heading into Turn 4 chicane');

    // Clear Lower-Third
    await page.locator('[data-testid="clear-banner-btn"]').click();
    await expect(monitorLowerThird).toHaveCount(0);

    // J. Timing Tower Toggle & HUD Mode
    console.log('Testing Timing Tower Toggle & HUD Mode...');
    const towerBtn = page.locator('[data-testid="toggle-timing-tower-btn"]');
    await towerBtn.click();
    await expect(towerBtn).toContainText('Hidden (OFF)');
    await towerBtn.click();
    await expect(towerBtn).toContainText('Visible (ON)');

    await page.locator('[data-testid="hud-mode-minimal"]').click();
    await expect(page.locator('[data-testid="hud-mode-minimal"]')).toHaveClass(/bg-red-600/);

    // K. AI Race Director Autonomous Toggle
    console.log('Testing AI Race Director Toggle...');
    await aiToggleBtn.click();
    await expect(aiBadge).toContainText('AUTO DIRECTING');
    await aiToggleBtn.click();
    await expect(aiBadge).toContainText('STANDBY');

    // ───────────────────────────────────────────────────────────────────────────
    // 5. SCREENSHOT CAPTURE & CONSOLE ERROR ASSERTION
    // ───────────────────────────────────────────────────────────────────────────
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const studioScreenshotPath = path.join(screenshotDir, 'srcommander_studio_verified.png');
    await page.screenshot({ path: studioScreenshotPath, fullPage: true });
    console.log(`Saved studio screenshot to ${studioScreenshotPath}`);

    // Allow brief time for async events
    await page.waitForTimeout(500);

    // Assert 0 console errors & 0 page exceptions
    console.log(`Console errors (${consoleErrors.length}):`, consoleErrors);
    console.log(`Page errors (${pageErrors.length}):`, pageErrors);

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('Verify OBS Overlay at /srleague/overlay?local=true renders cleanly', async ({ page }) => {
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

    const targetUrl = '/srleague/overlay?local=true';
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // Verify header title
    const headerTitle = page.locator('h1');
    await expect(headerTitle).toBeVisible({ timeout: 10000 });
    const headerText = await headerTitle.textContent();
    console.log(`Overlay Header Title: ${headerText}`);

    // Verify Timing Tower Leaderboard
    const timingTowerHeader = page.locator('text=LEADERBOARD');
    await expect(timingTowerHeader).toBeVisible({ timeout: 10000 });

    const driverRows = page.locator('div.fixed.top-20.left-6 div.space-y-0\\.5 > div.flex.items-center.justify-between');
    const rowCount = await driverRows.count();
    console.log(`Driver rows count: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);

    // Verify Focused Driver Card
    const focusedCard = page.locator('div.fixed.bottom-8.right-6');
    await expect(focusedCard).toBeVisible({ timeout: 10000 });
    await expect(focusedCard.locator('text=Best Lap')).toBeVisible();
    await expect(focusedCard.locator('text=THROTTLE')).toBeVisible();
    await expect(focusedCard.locator('text=BRAKE')).toBeVisible();

    // Screenshot
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const overlayScreenshotPath = path.join(screenshotDir, 'srleague_overlay_live_verified.png');
    await page.screenshot({ path: overlayScreenshotPath, fullPage: true });
    console.log(`Saved overlay screenshot to ${overlayScreenshotPath}`);

    // Assert 0 console errors & 0 page exceptions
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

});
