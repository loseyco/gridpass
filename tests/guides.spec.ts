import { test, expect } from '@playwright/test';

test.describe('Gridpass Guides & Slalom Map E2E Suite', () => {
  test('Guides page loads and displays horizontal releases, featured billboard, and buoy details with slalom visualizer', async ({ page }) => {
    // Go to the guides index page
    await page.goto('/guides');

    // Verify featured handbook billboard banner is visible
    await expect(page.locator('text=Billboard Feature')).toBeVisible();
    
    // Check for the cinematic featured banner description or title
    await expect(page.locator('text=Read Complete Lakes Handbook')).toBeVisible();

    // Verify trending scrollable releases exist
    const trendingCards = page.locator('.flex.overflow-x-auto.snap-x a');
    await expect(trendingCards.first()).toBeVisible();

    // Go to the Round Lake Beach buoy meanings guide page
    await page.goto('/guides/round-lake-buoy-colored-meanings');

    // Verify the guide loads with the updated title
    await expect(page.locator('h1')).toContainText(/Round Lake Beach Buoys & Slalom Course Meanings/i);

    // Verify that the interactive map section is present
    await expect(page.locator('h2:has-text("Interactive Slalom Course Map")').first()).toBeVisible();

    // Verify that the default overview text is shown
    await expect(page.locator('text=The slalom course on Round Lake is a sanctioned zone')).toBeVisible();

    // Click the green gate button
    await page.locator('button:has-text("Gate (Green)")').first().click();

    // Verify the description panel updates to show green gates information
    await expect(page.locator('text=Entry / Exit Gates')).toBeVisible();

    // Click on Submerged Cable Grid & Anchors
    await page.locator('button:has-text("Submerged Cable Grid & Anchors")').click();

    // Verify the warning box and impeller warning details are displayed
    await expect(page.locator('text=PWC IMPELLER DESTRUCTION RISK')).toBeVisible();
  });

  test('Life jacket and PFD guide loads correctly and shows child/pet details', async ({ page }) => {
    // Navigate directly to the life jacket guide
    await page.goto('/guides/watercraft-life-jacket-pfd-guide');

    // Verify the title
    await expect(page.locator('h1')).toContainText(/Life Jacket & PFD Guide/i);

    // Verify gear section title is correct
    await expect(page.locator('text=Top Rated Personal Flotation Devices')).toBeVisible();

    // Verify specific rules list child and dog safety details
    await expect(page.locator('text=Infant (under 30 lbs), Child (30-50 lbs), and Youth (50-90 lbs)')).toBeVisible();
    await expect(page.locator('text=Dog & Pet Flotation Safety')).toBeVisible();
  });

  test('Fox River jet ski guide loads correctly and interactive map works', async ({ page }) => {
    // Navigate directly to the Fox River guide
    await page.goto('/guides/fox-river-mchenry-wisconsin-jet-ski-guide');

    // Verify the title
    await expect(page.locator('h1')).toContainText(/Fox River/i);
    await expect(page.locator('h1')).toContainText(/Jet Skiing Guide/i);

    // Verify that the interactive map section is present
    await expect(page.locator('h2:has-text("Interactive River Cruise Map")').first()).toBeVisible();

    // Verify default details text is present (River overview)
    await expect(page.locator('text=Fox River Cruise Overview')).toBeVisible();
    await expect(page.locator('text=Wisconsin border').first()).toBeVisible();

    // Click on Wilmot Dam pin/element
    await page.locator('#pin-wilmot-dam').click();
    // Verify details panel updates with Wilmot Dam information
    await expect(page.locator('h3:has-text("Wilmot Dam")')).toBeVisible();
    await expect(page.locator('text=low-head dam').first()).toBeVisible();

    // Click on Stratton Lock pin/element
    await page.locator('#pin-stratton-lock').click();
    // Verify details panel updates with Stratton Lock information
    await expect(page.locator('h3:has-text("Stratton Lock & Dam")')).toBeVisible();
    await expect(page.locator('text=transit is free').first()).toBeVisible();

    // Click on Ben Watts Marina pin/element
    await page.locator('#pin-watts-marina').click();
    // Verify details panel updates with Ben Watts Marina information
    await expect(page.locator('h3:has-text("Ben Watts Marina")')).toBeVisible();
    await expect(page.locator('text=floating fuel docks').first()).toBeVisible();
  });
});
