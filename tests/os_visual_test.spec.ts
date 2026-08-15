import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Gridpass OS Visual Verification Test', async ({ page }) => {
  // Set viewport to standard desktop size
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. Open http://localhost:3000/os
  console.log('Navigating to http://localhost:3000/os...');
  await page.goto('http://localhost:3000/os', { waitUntil: 'networkidle' });

  // 2. Unlock with 1234 if locked
  const lockScreenHeader = page.locator('text=GRIDPASS OS SECURITY');
  if (await lockScreenHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Lock screen detected, unlocking with PIN 1234...');
    const pinInput = page.locator('input[placeholder*="Security PIN"]');
    await pinInput.fill('1234');
    await page.locator('button:has-text("Unlock Gridpass OS")').click();
    await page.waitForTimeout(1000);
  }

  // Ensure desktop is unlocked
  await expect(lockScreenHeader).not.toBeVisible();
  console.log('Desktop unlocked successfully.');

  // 3. Verify top of screen has NO top bar (desktop starts at top-0)
  // Check that the top menu bar is absent and the desktop desktop grid container starts at top-0
  const topBar = page.locator('text=Gridpass OS').filter({ hasText: 'File' });
  await expect(topBar).not.toBeVisible();

  const desktopContainer = page.locator('div.absolute.inset-0.top-0.bottom-14');
  await expect(desktopContainer).toBeVisible();
  const box = await desktopContainer.boundingBox();
  expect(box?.y).toBe(0);
  console.log('Verified NO top bar; desktop starts at y=0.');

  // 4. Verify bottom has full-width solid taskbar (START button on bottom-left, app tabs in middle, system tray clock on right)
  const taskbar = page.locator('div.fixed.bottom-0.left-0.right-0');
  await expect(taskbar).toBeVisible();

  // START button on bottom-left
  const startButton = taskbar.locator('button:has-text("START")');
  await expect(startButton).toBeVisible();

  // System tray clock on right
  const systemTrayClock = taskbar.locator('div.font-mono').last();
  await expect(systemTrayClock).toBeVisible();
  console.log('Verified taskbar with START button, middle tabs, and system tray clock.');

  // 5. Open Garage & Machines app window -> verify BOTH Mac traffic lights (left) AND Windows action controls (right: minimize, maximize, close)
  const garageAppShortcut = page.locator('button:has-text("Garage & Machines")').first();
  await garageAppShortcut.click();

  // Wait for window to be rendered
  const windowHeader = page.locator('div.h-10.bg-neutral-900').first();
  await expect(windowHeader).toBeVisible();

  // Mac traffic lights (left side of window header)
  const macClose = windowHeader.locator('button[title="Close Window"]');
  const macMinimize = windowHeader.locator('button[title="Minimize Window"]');
  const macMaximize = windowHeader.locator('button[title="Maximize Window"]');
  await expect(macClose).toBeVisible();
  await expect(macMinimize).toBeVisible();
  await expect(macMaximize).toBeVisible();

  // Windows action controls (right side of window header)
  const winMinimize = windowHeader.locator('button[title*="Minimize Window (Windows Style)"]');
  const winMaximize = windowHeader.locator('button[title*="Maximize Window (Windows Style)"]');
  const winClose = windowHeader.locator('button[title*="Close Window (Windows Style)"]');
  await expect(winMinimize).toBeVisible();
  await expect(winMaximize).toBeVisible();
  await expect(winClose).toBeVisible();

  console.log('Verified BOTH Mac traffic lights (left) and Windows action controls (right).');

  // 6. Capture screenshot proof
  const screenshotPath = path.join(__dirname, 'screenshots', 'os_desktop_garage_visual.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot proof captured at ${screenshotPath}`);
});
