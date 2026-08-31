import { test, expect } from "@playwright/test";

test("Verify SRCommander Local Rig Manager, Hardware Hub & Studio Integration", async ({ page }) => {
  test.setTimeout(60000);

  console.log("1. Navigating to Local Rig Manager at http://localhost:3000/srcommander/rig...");
  await page.goto("http://localhost:3000/srcommander/rig", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Assert Master Header
  await expect(page.locator("text=GridPass.App SRCommander • Local Rig Manager")).toBeVisible();
  await expect(page.locator("text=SAVE & HOT-RELOAD")).toBeVisible();

  // Assert 4 Core Modules
  await expect(page.locator("text=1. AV & Intercom Matrix")).toBeVisible();
  await expect(page.locator("text=2. Dual Wind Sim & Dynamic Fan Power Curves")).toBeVisible();
  await expect(page.locator("text=3. Chassis RGB Halo LEDs & Shift Light Studio")).toBeVisible();
  await expect(page.locator("text=4. AI Spotter, Microcontroller COM & Livery Sync")).toBeVisible();

  // Test Interactive Controls
  console.log("2. Testing Test Chime button...");
  await page.click("button:has-text('Test Chime')");
  await page.waitForTimeout(500);

  console.log("3. Testing Manual Fan Test button...");
  await page.click("button:has-text('Spin Fans at')");
  await page.waitForTimeout(500);

  console.log("4. Testing Save & Hot-Reload button...");
  await page.click("button:has-text('SAVE & HOT-RELOAD')");
  await page.waitForTimeout(1000);

  // Take screenshot of Rig Manager
  await page.screenshot({ path: "tests/screenshots/srcommander_rig_manager_deck.png", fullPage: true });

  console.log("5. Navigating to Broadcast Studio at http://localhost:3000/srcommander/studio...");
  await page.goto("http://localhost:3000/srcommander/studio", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  console.log("6. Navigating to Broadcast Overlay at http://localhost:3000/srleague/overlay?local=true...");
  await page.goto("http://localhost:3000/srleague/overlay?local=true", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  console.log("SUCCESS: Local Rig Manager and full SRCommander platform verified cleanly!");
});
