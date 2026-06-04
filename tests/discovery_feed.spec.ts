import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.beforeEach(async ({ page }) => {
  // Inject mock environment variable
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_MOCK__ = true;
  });
});

test.describe('Gridpass Phase 5: Discovery Feed & Leaderboard E2E Suite', () => {

  test('Spotter logs sighting on discovery feed', async ({ page }, testInfo) => {
    // Navigate to spotted feed
    await page.goto('/spotted');
    
    // Check title banner
    await expect(page.locator('h1')).toContainText(/Spotted Near You/i);
    await expect(page.locator('text=Log Sighting')).toBeVisible();

    // Open add sighting form
    await page.click('button:has-text("Log Sighting")');
    
    // Fill out the sighting form
    await page.fill('input[placeholder="e.g. GP-MARCUS-GT"]', 'GP-MARCUS-GT');
    await page.fill('input[placeholder="e.g. Englishtown Raceway Pit"]', 'Limerock Paddock B');
    await page.fill('textarea[placeholder="Describe the build mods, sounds, or visual state..."]', 'Fitted with Roush spoiler. Exhaust tone is unbelievable!');

    // Screenshot of filled form
    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `spotted-log-form-${projName}.png`) });

    // Submit sighting
    await page.click('button:has-text("Submit Sighting Spot")');

    // Verify spot added to timeline feed
    await expect(page.locator('text=Limerock Paddock B').first()).toBeVisible();
    await expect(page.locator('text=Fitted with Roush spoiler. Exhaust tone is unbelievable!').first()).toBeVisible();
    
    await page.screenshot({ path: path.join(screenshotDir, `spotted-log-timeline-${projName}.png`) });
  });

  test('Ecosystem leaderboards navigation and ranking logs', async ({ page }, testInfo) => {
    // Navigate to leaderboard
    await page.goto('/leaderboard');

    // Verify main header
    await expect(page.locator('h1')).toContainText(/Ecosystem Leaderboards/i);
    await expect(page.locator('button:has-text("Top Spotted Builds")')).toBeVisible();

    // Verify Rank 1 build is Marcus Mustang
    await expect(page.locator('h3:has-text("2024 Ford Mustang GT")')).toBeVisible();
    await expect(page.locator('text=Owner: Marcus Mustang')).toBeVisible();

    // Click Active Spotters tab
    await page.click('button:has-text("Active Spotters")');

    // Verify Rank 1 spotter is Sarah Spotter
    await expect(page.locator('h3:has-text("Sarah Spotter")')).toBeVisible();
    await expect(page.locator('text=sarah@spotter.com')).toBeVisible();

    // Click Pro Partner score tab
    await page.click('button:has-text("Pro Partner score")');

    // Verify Rank 1 partner is Monmouth Marine
    await expect(page.locator('h3:has-text("Monmouth Marine Ford & Boats")')).toBeVisible();

    const screenshotDir = path.join(process.cwd(), 'tests', 'screenshots');
    const projName = testInfo.project.name.toLowerCase().replace(/\s+/g, '_');
    await page.screenshot({ path: path.join(screenshotDir, `leaderboards-${projName}.png`) });
  });

});
