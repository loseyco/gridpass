import { test, expect } from '@playwright/test';
import path from 'path';

test('Capture Live Overlay with Active Telemetry', async ({ page }) => {
  await page.goto('/srleague/overlay?local=true', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const screenshotPath = path.join(__dirname, 'screenshots', 'srleague_overlay_live_active.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath}`);
});
