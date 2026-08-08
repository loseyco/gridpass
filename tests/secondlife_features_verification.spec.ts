import { test, expect } from '@playwright/test';

test.describe('Second Life Skinny Dip Inn - Visual & Functional Feature Verification Suite', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('gp_rules_accepted_skinny-dip-inn_guest', new Date().toISOString());
      localStorage.setItem('gp_rules_accepted_skinny-dip-inn_', new Date().toISOString());
    });
  });

  test('1. Live Audio Stream Player Bar on home tab', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=home');
    await page.waitForLoadState('networkidle');

    // Look for Live Audio Stream Player Bar on Home tab
    const audioPlayerBar = page.locator('[data-testid="live-audio-player-bar"]');
    await expect(audioPlayerBar).toBeVisible();
    await expect(audioPlayerBar.getByText(/STREAM LIVE|Resort Live DJ Parcel Stream|Audio/i).first()).toBeVisible();
  });

  test('2. 🏆 Top Resident Dwell Champions Podium on home tab', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=home');
    await page.waitForLoadState('networkidle');

    // Look for Top Resident Dwell Champions Podium
    const podiumSection = page.locator('[data-testid="top-dwell-champions-podium"]');
    await expect(podiumSection).toBeVisible();
    await expect(podiumSection.getByText(/Top Resident Dwell Champions/i).first()).toBeVisible();
  });

  test('3. 🗺️ Interactive 2D Sim Minimap Radar Grid on home tab', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=home');
    await page.waitForLoadState('networkidle');

    // Look for Interactive 2D Sim Minimap Radar Grid on home tab
    const radarGridHome = page.locator('[data-testid="2d-sim-minimap-radar-grid"]');
    await expect(radarGridHome).toBeVisible();
    await expect(radarGridHome.getByText(/Sim Minimap Radar Grid|256m Sim Minimap/i).first()).toBeVisible();
  });

  test('4. 💬 Live Sim Event Broadcast Shouter card on admin tab', async ({ page }) => {
    await page.goto('http://localhost:3000/secondlife/skinny-dip-inn?tab=admin');
    await page.waitForLoadState('networkidle');

    // Look for Live Sim Event Broadcast Shouter card on admin tab
    const shouterCard = page.locator('[data-testid="live-sim-broadcast-shouter-card"]');
    await expect(shouterCard).toBeVisible();
    await expect(shouterCard.getByText(/Live Sim Event Broadcast Shouter/i).first()).toBeVisible();
  });

});
