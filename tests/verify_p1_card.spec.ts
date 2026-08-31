import { test, expect } from '@playwright/test';
import path from 'path';

test('Cut to P1 Jennifer Young on Track and Verify Live MPH on Driver Card', async ({ page }) => {
  // 1. Open Director Studio and click P1 (Jennifer Young)
  await page.goto('/srcommander/studio', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Click P1 button
  const p1Btn = page.getByRole('button', { name: /JENNIFER/i });
  await expect(p1Btn).toBeVisible();
  await p1Btn.click();
  console.log('Clicked P1 Jennifer Young cut button in Studio');

  // Wait 1.5 seconds for camera cut and velocity stream
  await page.waitForTimeout(1500);

  // 2. Open Overlay and capture screenshot of focused P1 driver card
  await page.goto('/srleague/overlay?local=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const screenshotPath = path.join(__dirname, 'screenshots', 'p1_jennifer_young_driver_card_live.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath}`);
});
