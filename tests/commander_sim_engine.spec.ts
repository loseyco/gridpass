import { test, expect } from "@playwright/test";

test.describe("GridPass Commander Sim Racing Engine & Mobile Paddock E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Set test mock flag to bypass auth guards cleanly
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test("1. Admin Commander HQ (/admin/commander) loads with simulator controls and QR modal", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/admin/commander");

    // Assert main header and subtext
    await expect(page.locator("h1")).toContainText("Commander Sim HQ");
    await expect(page.getByText(/LIVE SIMULATOR TELEMETRY STREAMING|HARDWARE & TELEMETRY ENGINE/i)).toBeVisible();

    // Assert Simulator Connection & Telemetry status
    await expect(page.getByText("Simulator Connection")).toBeVisible();
    await expect(page.getByText("DirectInput Macro & Hardware Triggers")).toBeVisible();

    // Assert DirectInput Macro buttons
    await expect(page.getByRole("button", { name: /Force Enter Car/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Return to Garage/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Reset to Pit/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cut Ignition/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Kick & Advance/i })).toBeVisible();

    // Test Trailer QR Modal with real first-party QR generator
    await page.getByRole("button", { name: /Trailer QR Code/i }).click();
    await expect(page.getByText("TRAILER DOOR QR DECAL")).toBeVisible();
    await expect(page.getByRole("img", { name: "Gridpass QR Code" })).toBeVisible();
    await page.getByRole("button", { name: "✕" }).click();

    // Test Tab 2: Live 323+ Channel Inspector
    await page.getByRole("button", { name: /Live 323\+ Channel Inspector/i }).click();
    await expect(page.getByText("Live 323+ Channel Telemetry Matrix")).toBeVisible();
    await expect(page.getByPlaceholder(/Search variables e.g./i)).toBeVisible();
    await page.fill('input[placeholder*="Search variables"]', "LFtemp");
    await expect(page.getByText("LFtempCL")).toBeVisible();

    // Test Tab 3: Rig Hardware Specs
    await page.getByRole("button", { name: /Rig Hardware Specs/i }).click();
    await expect(page.getByText("MOBILE PADDOCK ARCHITECTURE")).toBeVisible();
    await expect(page.getByText("CHASSIS & MONOCOQUE")).toBeVisible();

    // Switch back to Host Controls
    await page.getByRole("button", { name: /Host Controls Deck/i }).click();
    await expect(page.getByText("DirectInput Macro & Hardware Triggers")).toBeVisible();
  });

  test("2. Mobile Driver Intake & Queue (/rig/gp_trailer_pod1) handles standby guardrails", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/rig/gp_trailer_pod1");

    // Wait for header and mobile paddock unit branding
    await expect(page.locator("h1")).toContainText("GridPass Mobile Sim Trailer", { timeout: 15000 });
    await expect(page.getByText(/Mobile Paddock Unit/i)).toBeVisible({ timeout: 10000 });

    // Assert Simulator Standby state when no daemon stream is active
    const standbyBadge = page.getByText("SIMULATOR STANDBY").first();
    const joinBtn = page.getByRole("button", { name: /JOIN HOT LAP QUEUE/i });

    if (await standbyBadge.isVisible()) {
      await expect(page.getByText("Simulator Standing By").first()).toBeVisible();
      await expect(page.getByRole("button", { name: /SIMULATOR STANDBY/i })).toBeDisabled();
    } else if (await joinBtn.isVisible()) {
      await joinBtn.click();
      await expect(page.getByText("Driver Check-In")).toBeVisible({ timeout: 10000 });
      await page.fill('input[placeholder="e.g. Marcus Miller"]', "GPTestUser_Marcus");
      await page.fill('input[placeholder="@driver"]', "@GPTestUser_Marcus");
      await page.getByRole("button", { name: /CLAIM SPOT IN QUEUE/i }).click();
      await expect(page.getByText("YOUR LIVE SESSION STATUS")).toBeVisible({ timeout: 15000 });
    }
  });

  test("3. Paddock TV Leaderboard (/rig/gp_trailer_pod1/leaderboard) displays 4K broadcast layout", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/rig/gp_trailer_pod1/leaderboard");

    // Verify main leaderboard elements
    await expect(page.getByText("LIVE PADDOCK TIMING")).toBeVisible();
    await expect(page.getByText("Event Leaderboard & Fastest Laps")).toBeVisible();

    // Test TV Mode button
    const tvBtn = page.getByRole("button", { name: /TV Mode/i });
    await expect(tvBtn).toBeVisible();
    await tvBtn.click();

    // Verify TV Mode broadcast header
    await expect(page.getByText("GRIDPASS COMMANDER 4K PADDOCK BROADCAST")).toBeVisible();
    await expect(page.getByRole("button", { name: /Exit TV/i })).toBeVisible();

    // Exit TV Mode
    await page.getByRole("button", { name: /Exit TV/i }).click();
    await expect(page.getByText("LIVE PADDOCK TIMING")).toBeVisible();
  });
});
