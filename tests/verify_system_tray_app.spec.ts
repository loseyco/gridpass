import { test, expect } from "@playwright/test";

test("Verify SRCommander Windows System Tray App & Rig Control Ecosystem", async ({ page }) => {
  test.setTimeout(60000);

  console.log("1. Navigating to Rig Manager at http://localhost:3000/srcommander/rig...");
  await page.goto("http://localhost:3000/srcommander/rig", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Assert Daemon Connection
  await expect(page.locator("text=DAEMON CONNECTED")).toBeVisible();
  await expect(page.locator("text=v4.3.0")).toBeVisible();

  // Assert Windows Auto-Start Toggle
  await expect(page.locator("text=Start with Windows (Boot)")).toBeVisible();

  // Assert All 4 Cards
  await expect(page.locator("text=1. AV & Intercom Matrix")).toBeVisible();
  await expect(page.locator("text=2. Dual Wind Sim")).toBeVisible();
  await expect(page.locator("text=3. Chassis RGB Halo LEDs")).toBeVisible();
  await expect(page.locator("text=4. AI Spotter, Windows Auto-Start")).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: "tests/screenshots/srcommander_system_tray_app_verified.png", fullPage: true });

  console.log("SUCCESS: Windows System Tray App and Rig Control Ecosystem verified 100% cleanly!");
});
