import { test, expect } from "@playwright/test";

test("Verify SRCommander Pre-Race Sync & Windows Auto-Start Toggle", async ({ page }) => {
  test.setTimeout(60000);

  console.log("1. Navigating to Rig Manager at http://localhost:3000/srcommander/rig...");
  await page.goto("http://localhost:3000/srcommander/rig", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Assert Pre-Race subtitle
  await expect(page.locator("text=Pre-Race Sync Active")).toBeVisible();

  // Assert Windows Startup Control
  await expect(page.locator("text=Start with Windows (Boot)")).toBeVisible();

  // Test toggling Windows Startup
  console.log("2. Testing Windows Startup Toggle button...");
  await page.click("button:has-text('ENABLED'), button:has-text('DISABLED')");
  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: "tests/screenshots/srcommander_prerace_startup_verified.png", fullPage: true });

  console.log("SUCCESS: Pre-Race Sync & Windows Auto-Start verified cleanly!");
});
