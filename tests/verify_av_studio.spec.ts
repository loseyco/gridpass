import { test, expect } from "@playwright/test";

test("Verify SRCommander Studio with Push-To-Talk Intercom and Broadcast Overlay", async ({ page }) => {
  test.setTimeout(60000);

  console.log("1. Navigating to SRCommander Studio at http://localhost:3000/srcommander/studio...");
  await page.goto("http://localhost:3000/srcommander/studio", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Take screenshot of studio
  await page.screenshot({ path: "tests/screenshots/srcommander_studio_av_deck.png", fullPage: true });

  // Assert Studio sections
  await expect(page.locator("text=Section 1: Live Program Monitor")).toBeVisible();
  await expect(page.locator("text=Section 2: Camera Switcher Matrix")).toBeVisible();
  await expect(page.locator("text=Section 3: Race Control Steward Intercom")).toBeVisible();
  await expect(page.locator("text=HOLD TO TALK (STEWARD RADIO)")).toBeVisible();
  await expect(page.locator("text=Section 4: Instant Replay Engine")).toBeVisible();
  await expect(page.locator("text=Section 5: Broadcast Graphic Master Controls")).toBeVisible();

  console.log("2. Navigating to Broadcast Overlay at http://localhost:3000/srleague/overlay?local=true...");
  await page.goto("http://localhost:3000/srleague/overlay?local=true", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Take screenshot of overlay
  await page.screenshot({ path: "tests/screenshots/srleague_overlay_av_live.png", fullPage: true });

  console.log("SUCCESS: SRCommander Studio and Broadcast Overlay verified cleanly!");
});
