import { test, expect } from "@playwright/test";

test("Verify SRCommander Zero-Install Download Hub Page", async ({ page }) => {
  test.setTimeout(60000);

  console.log("1. Navigating to Download Page at http://localhost:3000/srcommander/download...");
  await page.goto("http://localhost:3000/srcommander/download", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Assert Header & Hero
  await expect(page.locator("text=The All-In-One Sim Racing PC Engine")).toBeVisible();
  await expect(page.locator("text=DOWNLOAD SRCOMMANDER (v4.3.0)")).toBeVisible();

  // Assert 3-Step Guide
  await expect(page.locator("text=1. Download & Save")).toBeVisible();
  await expect(page.locator("text=2. Double-Click to Run")).toBeVisible();
  await expect(page.locator("text=3. Automatic Updates")).toBeVisible();

  // Take screenshot
  await page.screenshot({ path: "tests/screenshots/srcommander_download_hub.png", fullPage: true });

  console.log("SUCCESS: Zero-Install Download Hub Page verified cleanly!");
});
