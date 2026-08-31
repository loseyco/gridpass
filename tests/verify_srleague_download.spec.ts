import { test, expect } from "@playwright/test";

test("Verify SRLeague Driver Companion Download Page & League Hub Links", async ({ page }) => {
  test.setTimeout(60000);

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  // 1. Visit /srleague/download directly
  console.log("1. Navigating to http://localhost:3000/srleague/download...");
  await page.goto("http://localhost:3000/srleague/download", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Assert Header & CTA
  await expect(page.locator("text=SRLeague Driver PC Companion").first()).toBeVisible();
  await expect(page.locator("text=Connect Your Rig to League Races").first()).toBeVisible();
  await expect(page.locator("text=DOWNLOAD DRIVER COMPANION (v4.3.0)").first()).toBeVisible();

  // Assert 3-step guide
  await expect(page.locator("text=1. Download & Save").first()).toBeVisible();
  await expect(page.locator("text=2. Double-Click Launcher").first()).toBeVisible();
  await expect(page.locator("text=3. Join League Session").first()).toBeVisible();

  // Verify 0 console errors on download portal
  console.log("Console errors on /srleague/download:", consoleErrors);
  expect(consoleErrors.filter(e => !e.includes("favicon") && !e.includes("DevTools"))).toHaveLength(0);

  // Take screenshot of download hub
  await page.screenshot({ path: "tests/screenshots/srleague_download_hub_verified.png", fullPage: true });
  console.log("SUCCESS: /srleague/download rendered cleanly with 0 console errors!");

  // 2. Visit /srleague to verify Download Engine button
  console.log("2. Navigating to http://localhost:3000/srleague...");
  await page.goto("http://localhost:3000/srleague", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const downloadBtn = page.locator("header a[href='/srleague/download']").first();
  await expect(downloadBtn).toBeVisible();
  console.log("SUCCESS: /srleague header contains Download Engine button!");

  // 3. Verify /srleague/[leagueId] renders the Driver Companion card
  console.log("3. Checking for Championship League card or navigating to detail...");
  // Look for league items that match /srleague/ followed by an ID that is not 'download', 'new', 'news'
  const leagueCards = page.locator("main a[href^='/srleague/']").filter({
    hasNot: page.locator("[href='/srleague/download'], [href='/srleague/new'], [href='/srleague/news']")
  });
  
  const allHrefs = await page.locator("a[href^='/srleague/']").evaluateAll((elements) =>
    elements.map((el) => el.getAttribute("href"))
  );
  console.log("All /srleague/ links found on page:", allHrefs);

  const leagueHrefs = allHrefs.filter(
    (h) => h && !["/srleague/download", "/srleague/new", "/srleague/news"].includes(h)
  );

  if (leagueHrefs.length > 0) {
    const targetHref = leagueHrefs[0]!;
    console.log(`Navigating to league detail: ${targetHref}...`);
    await page.goto(`http://localhost:3000${targetHref}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // Verify Driver Companion card
    await expect(page.locator("text=GridPass SRCommander Companion").first()).toBeVisible();
    await expect(page.locator("a[href='/srleague/download']").first()).toBeVisible();
    await expect(page.locator("text=Download Engine").first()).toBeVisible();
    console.log(`SUCCESS: League page (${targetHref}) renders Driver Companion card!`);
  } else {
    console.log("No specific league entries found in Firestore database list; verifying download hub & /srleague hub links.");
  }
});

