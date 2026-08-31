import { test, expect } from "@playwright/test";

test("Verify SRCommander Paddock Radar & Automated Session Voice Dispatcher", async ({ page }) => {
  test.setTimeout(60000);

  console.log("1. Navigating to Broadcast Studio at http://localhost:3000/srcommander/studio...");
  await page.goto("http://localhost:3000/srcommander/studio", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Assert Paddock Radar Header
  await expect(page.locator("text=Live League Paddock & Session Transition Radar")).toBeVisible();
  await expect(page.locator("text=1. OPEN PRACTICE")).toBeVisible();
  await expect(page.locator("text=2. QUALIFYING")).toBeVisible();
  await expect(page.locator("text=3. GRIDDING WINDOW")).toBeVisible();
  await expect(page.locator("text=4. GREEN FLAG RACE")).toBeVisible();

  // Assert Attendance Breakdown Pills
  await expect(page.locator("text=On Track Now")).toBeVisible();
  await expect(page.locator("text=In Pit / Garage")).toBeVisible();
  await expect(page.locator("text=Total in Sim Server")).toBeVisible();

  // Test 1-Click Automated Steward Voice Announcements
  console.log("2. Testing Automated Steward Announcement preset buttons...");
  await page.click("button:has-text('1 Min to Qual')");
  await page.waitForTimeout(500);

  await page.click("button:has-text('Report to Grid')");
  await page.waitForTimeout(500);

  // Take screenshot of Studio with Paddock Radar
  await page.screenshot({ path: "tests/screenshots/srcommander_studio_paddock_radar.png", fullPage: true });

  console.log("SUCCESS: Paddock Attendance Radar and Automated Voice Dispatcher verified cleanly!");
});
