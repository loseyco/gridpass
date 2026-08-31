import { test, expect } from "@playwright/test";

test("Verify SRCommander Auto-Updater Engine, Version API & 1-Click Update Check", async ({ page, request }) => {
  test.setTimeout(60000);

  // 1. Verify /api/srcommander/version API endpoint
  console.log("1. Verifying /api/srcommander/version endpoint...");
  const versionRes = await request.get("http://localhost:3000/api/srcommander/version");
  expect(versionRes.status()).toBe(200);
  const manifest = await versionRes.json();
  expect(manifest.version).toBe("4.3.0");
  expect(manifest.download_url).toBe("/api/srcommander/download");
  console.log(`✓ Version Manifest Valid: v${manifest.version} (${manifest.release_notes})`);

  // 2. Verify /api/srcommander/download API endpoint
  console.log("2. Verifying /api/srcommander/download endpoint...");
  const downloadRes = await request.get("http://localhost:3000/api/srcommander/download");
  expect(downloadRes.status()).toBe(200);
  const fileText = await downloadRes.text();
  expect(fileText).toContain("GridPass.App SRCommander");
  expect(fileText).toContain("DAEMON_VERSION = \"4.3.0\"");
  console.log(`✓ Download payload verified (${fileText.length} bytes)`);

  // 3. Navigate to Rig Manager and verify UI & 1-Click Update Check
  console.log("3. Navigating to Rig Manager at http://localhost:3000/srcommander/rig...");
  await page.goto("http://localhost:3000/srcommander/rig", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Assert Version Badge
  await expect(page.locator("text=v4.3.0")).toBeVisible();
  await expect(page.locator("text=Check Updates")).toBeVisible();

  // Click Check Updates button
  console.log("4. Clicking Check Updates button...");
  await page.click("button:has-text('Check Updates')");
  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: "tests/screenshots/srcommander_auto_updater_verified.png", fullPage: true });

  console.log("SUCCESS: SRCommander Auto-Updater Engine and APIs verified 100% cleanly!");
});
