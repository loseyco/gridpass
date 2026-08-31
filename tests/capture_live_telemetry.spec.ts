import { test, expect } from '@playwright/test';
import path from 'path';

test('Capture Live Studio and Overlay with iRacing Telemetry', async ({ page }) => {
  // 1. Studio
  await page.goto('/srcommander/studio', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const screenshotPath1 = path.join(__dirname, 'screenshots', 'srcommander_studio_live_telemetry.png');
  await page.screenshot({ path: screenshotPath1, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath1}`);

  // 2. Overlay
  await page.goto('/srleague/overlay?local=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const screenshotPath2 = path.join(__dirname, 'screenshots', 'srleague_overlay_live_telemetry.png');
  await page.screenshot({ path: screenshotPath2, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath2}`);
});
