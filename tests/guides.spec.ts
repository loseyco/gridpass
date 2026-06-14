import { test, expect } from '@playwright/test';

test.describe('Gridpass Guides & Slalom Map E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error('[BROWSER ERROR]', err.message));
    // Inject mock environment variable
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });
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
    // Click on Wilmot Dam pin/element via DOM-level click
    await page.locator('.checkpoint-wilmot-dam').evaluate(el => (el as HTMLElement).click());
    // Verify details panel updates with Wilmot Dam information
    await expect(page.locator('.md\\:col-span-7').locator('h3:has-text("Wilmot Dam")')).toBeVisible();
    await expect(page.locator('.md\\:col-span-7').locator('text=low-head dam').first()).toBeVisible();

    // Click on Stratton Lock pin/element via DOM-level click
    await page.locator('.checkpoint-stratton-lock').evaluate(el => (el as HTMLElement).click());
    // Verify details panel updates with Stratton Lock information
    await expect(page.locator('.md\\:col-span-7').locator('h3:has-text("Stratton Lock & Dam")')).toBeVisible();
    await expect(page.locator('.md\\:col-span-7').locator('text=transit is free').first()).toBeVisible();

    // Click on Ben Watts Marina pin/element via DOM-level click
    await page.locator('.checkpoint-watts-marina').evaluate(el => (el as HTMLElement).click());
    // Verify details panel updates with Ben Watts Marina information
    await expect(page.locator('.md\\:col-span-7').locator('h3:has-text("Ben Watts Marina")')).toBeVisible();
    await expect(page.locator('.md\\:col-span-7').locator('text=floating fuel docks').first()).toBeVisible();

    // Verify /water app integration: active riders and custom spots are rendered on the map
    await expect(page.locator('.rider-buddy-1')).toBeVisible();
    await expect(page.locator('.rider-buddy-2')).toBeVisible();
    await expect(page.locator('.custom-spot-marker').first()).toBeVisible();
  });

  test('Fox Chain 4th of July guide loads correctly and interactive map works', async ({ page }) => {
    // Navigate directly to the 4th of July guide
    await page.goto('/guides/fox-chain-july-4th-boating-guide');

    // Verify the title
    await expect(page.locator('h1')).toContainText(/Fox Chain/i);
    await expect(page.locator('h1')).toContainText(/4th of July/i);

    // Verify that the interactive map section is present
    await expect(page.locator('h2:has-text("Interactive July 4th Event Map")').first()).toBeVisible();

    // Verify default details text is present (boating overview)
    await expect(page.locator('text=July 4th Boating Overview')).toBeVisible();

    // Click on Celebrate Fox Lake Fireworks pin/element
    // Click on Celebrate Fox Lake Fireworks pin/element via DOM-level click
    await page.locator('.checkpoint-celebrate-fox-lake').evaluate(el => (el as HTMLElement).click());
    // Verify details panel updates
    await expect(page.locator('.md\\:col-span-7').locator('h3:has-text("Celebrate Fox Lake (Nippersink Lake)")')).toBeVisible();
    await expect(page.locator('.md\\:col-span-7').locator('text=Sat, June 27, 2026').first()).toBeVisible();

    // Click on Pistakee Bay Fireworks pin/element via DOM-level click
    await page.locator('.checkpoint-pistakee-bay-fireworks').evaluate(el => (el as HTMLElement).click());
    // Verify details panel updates
    await expect(page.locator('.md\\:col-span-7').locator('h3:has-text("Pistakee Bay Fireworks")')).toBeVisible();
    await expect(page.locator('.md\\:col-span-7').locator('text=Sat, July 11, 2026').first()).toBeVisible();

    // Click on Antioch Fireworks pin/element via DOM-level click
    await page.locator('.checkpoint-antioch-fireworks').evaluate(el => (el as HTMLElement).click());
    // Verify details panel updates
    await expect(page.locator('.md\\:col-span-7').locator('h3:has-text("Antioch Fireworks")')).toBeVisible();
    await expect(page.locator('.md\\:col-span-7').locator('text=Sat, July 4, 2026').first()).toBeVisible();

    // Click on Grass Lake Sandbar pin/element via DOM-level click
    await page.locator('.checkpoint-grass-lake-sandbar').evaluate(el => (el as HTMLElement).click());
    // Verify details panel updates
    await expect(page.locator('.md\\:col-span-7').locator('h3:has-text("Grass Lake Sandbar")')).toBeVisible();

    // Verify /water active riders and custom spots are on the map
    await expect(page.locator('.rider-buddy-1')).toBeVisible();
    await expect(page.locator('.rider-buddy-2')).toBeVisible();
  });

  test('Channel Lake guide loads correctly and displays detailed sections', async ({ page }) => {
    // Navigate directly to the Channel Lake guide
    await page.goto('/guides/channel-lake-boating-fishing-guide');

    // Verify the title
    await expect(page.locator('h1')).toContainText(/Channel Lake/i);
    await expect(page.locator('h1')).toContainText(/PWC & Boating Guide/i);

    // Verify gear section title is correct
    await expect(page.locator('text=Recommended Channel Lake Gear')).toBeVisible();

    // Verify that the launch locations are present
    await expect(page.locator('text=Featured Boat Launches & Access Ramps')).toBeVisible();
    await expect(page.locator('text=Anchor Pointe Marina Launch')).toBeVisible();
    await expect(page.locator('text=Sequoit Harbor Marina Launch')).toBeVisible();

    // Verify that hotspots are displayed
    await expect(page.locator('text=Channel Lake Beach Bar').first()).toBeVisible();
    await expect(page.locator('text=Route 173 Channel & Bridge').first()).toBeVisible();

    // Verify specific rules are present
    await expect(page.locator('text=Fox Waterway Agency Sticker')).toBeVisible();
    await expect(page.locator('text=Strict No-Wake Channel Limits')).toBeVisible();
    await expect(page.locator('text=Wisconsin Border Regulations')).toBeVisible();
  });

  test('North Point Marina guide loads correctly and displays detailed sections with interactive map & geolocation', async ({ context, page }) => {
    // Grant geolocation permissions and set mock location near public launch
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 42.4845, longitude: -87.8020 });

    // Navigate directly to the North Point Marina guide
    await page.goto('/guides/north-point-marina-boating-pwc-guide');

    // Verify the title
    await expect(page.locator('h1')).toContainText(/North Point Marina/i);
    await expect(page.locator('h1')).toContainText(/PWC & Boating Guide/i);

    // Verify gear section title is correct
    await expect(page.locator('text=Recommended Great Lakes PWC Gear')).toBeVisible();
    await expect(page.locator('text=Uniden MHS75 Handheld VHF Marine Radio').first()).toBeVisible();

    // Verify that the launch locations are present
    await expect(page.locator('text=Featured Boat Launches & Access Ramps')).toBeVisible();
    await expect(page.locator('text=North Point Marina Public Boat Launch')).toBeVisible();

    // Verify that hotspots are displayed
    await expect(page.locator('text=North Point Marina Harbor Basin').first()).toBeVisible();
    await expect(page.locator('text=Winthrop Harbor Yacht Club').first()).toBeVisible();

    // Verify specific rules are present
    await expect(page.locator('text=Open Water Equipment Requirements')).toBeVisible();
    await expect(page.locator('text=Trailer Parking & Daily Fee')).toBeVisible();

    // Verify interactive map section is present
    await expect(page.locator('h2:has-text("Interactive Marina & Riding Map")').first()).toBeVisible();
    
    // Verify default details text is present (riding overview)
    await expect(page.locator('text=North Point Marina Riding Overview')).toBeVisible();

    // Verify active riders and custom user spots are visible on the map (due to mock data in Leaflet component)
    await expect(page.locator('.rider-marker').first()).toBeVisible();
    await expect(page.locator('.custom-spot-marker').first()).toBeVisible();

    // Trigger GPS locating
    await page.locator('button[title="Start GPS Tracking"]').click();

    // Verify proximity HUD alert card shows closest checkpoint (Public Boat Launch)
    await expect(page.locator('text=Live Proximity Alert')).toBeVisible();
    await expect(page.locator('text=Public Boat Launch (10 Lanes)')).toBeVisible();

    // Click on Yacht Club marker on the map
    await page.locator('.checkpoint-yacht-club').evaluate(el => (el as HTMLElement).click());
    
    // Verify details panel updates with Winthrop Harbor Yacht Club information
    await expect(page.locator('.md\\:col-span-7').locator('h3:has-text("Winthrop Harbor Yacht Club")')).toBeVisible();
    await expect(page.locator('.md\\:col-span-7').locator('text=Transient/Guest').first()).toBeVisible();
  });
});

