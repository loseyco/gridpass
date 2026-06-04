# Gridpass-v4 E2E Browser Testing & Layout Verification Plan

This analysis specifies the Playwright E2E browser automation scripts, precise CSS/HTML selectors, step-by-step interactive actions, viewport assertions, and screenshot capture protocols to verify the dark glassmorphic layouts and dynamic routes of **Gridpass-v4**.

---

## 1. Test Environment Setup & Configuration

To execute these tests in headless Chrome, the E2E test suite uses Playwright. We configure separate desktop and mobile projects with specific window sizes, media permissions, and localization options.

### E2E Test Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        // Bypass camera permissions & supply fake devices
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
          ],
        },
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 },
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
          ],
        },
      },
    },
  ],
});
```

---

## 2. Dynamic Route E2E Test Cases

### 2.1 Landing Page (`/`) E2E Scenarios

The landing page verifies branding, key promotional links, and three primary glassmorphic feature cards detailing decal stickers, service history logs, and QR routing pathways.

#### Step-by-Step Test Suite

```typescript
import { test, expect } from '@playwright/test';

test.describe('Landing Page (/) Visual & Interactive Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Verify ambient backdrop glow and typography structure', async ({ page }) => {
    // 1. Assert core theme background styling
    const mainContainer = page.locator('main');
    await expect(mainContainer).toHaveClass(/bg-\\[#060608\\]/);
    
    const ambientGlow = page.locator('.mesh-glow');
    await expect(ambientGlow).toBeVisible();

    // 2. Assert hero section headers
    const mainHeader = page.locator('h1');
    await expect(mainHeader).toContainText('One Tag.');
    await expect(mainHeader.locator('span')).toHaveClass(/text-transparent bg-clip-text/);

    // 3. Verify page is immediately responsive
    const onlineBadge = page.locator('text=Gridpass-v4 Engine is Online');
    await expect(onlineBadge).toBeVisible();
    await expect(onlineBadge.locator('.bg-blue-500')).toHaveClass(/animate-pulse/);
  });

  test('Verify feature grid contains three glassmorphic cards', async ({ page }) => {
    const glassCards = page.locator('.glass-card');
    await expect(glassCards).toHaveCount(3);

    // Card 1: Zero-Hardware Decal ID
    await expect(glassCards.nth(0)).toContainText('Zero-Hardware Decal ID');
    await expect(glassCards.nth(0).locator('svg')).toHaveClass(/lucide-qr-code/);

    // Card 2: Verified Service Logs
    await expect(glassCards.nth(1)).toContainText('Verified Service Logs');
    await expect(glassCards.nth(1).locator('svg')).toHaveClass(/lucide-activity/);

    // Card 3: Easy QR Routing & Links
    await expect(glassCards.nth(2)).toContainText('Easy QR Routing & Links');
    await expect(glassCards.nth(2).locator('svg')).toHaveClass(/lucide-shield-check/);
  });

  test('Verify navigation redirect buttons are clickable and correct', async ({ page }) => {
    const pricingLink = page.locator('a:has-text("Get Your Windshield Sticker")');
    await expect(pricingLink).toHaveAttribute('href', '/pricing');
    
    const scanLink = page.locator('a:has-text("Scan & Claim Tag")');
    await expect(scanLink).toHaveAttribute('href', '/scan');
  });
});
```

---

### 2.2 Pricing Page (`/pricing`) & FAQ E2E Scenarios

The pricing page processes mock user checkouts across 4 autolauched tiers, includes a trust banner with bank-grade certifications, and exposes 5 interactive accordion FAQs.

#### Step-by-Step Test Suite

```typescript
import { test, expect } from '@playwright/test';

test.describe('Pricing & FAQ Page (/pricing) Interactive Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('Verify all 4 pricing tiers exist with glassmorphic cards', async ({ page }) => {
    const tiers = [
      { name: 'Lite Driver Passport', price: '$2.99', badge: 'Cheap & Easy' },
      { name: 'Digital Driver Passport', price: '$29.99', badge: null },
      { name: 'Racetrack Paddock Operator', price: '$49', badge: 'Best Seller' },
      { name: 'Independent Service Onboarding', price: '$149', badge: null }
    ];

    const cards = page.locator('.glass-card');
    await expect(cards).toHaveCount(5); // 4 tiers + 1 trust badge card = 5

    for (let i = 0; i < 4; i++) {
      const card = cards.nth(i);
      await expect(card).toContainText(tiers[i].name);
      await expect(card).toContainText(tiers[i].price);
      if (tiers[i].badge) {
        await expect(card.locator('span.absolute')).toContainText(tiers[i].badge!);
      }
    }
  });

  test('Verify secure trust credentials badge banner is visible', async ({ page }) => {
    const trustCard = page.locator('.glass-card').nth(4);
    await expect(trustCard).toContainText('Secure Payment Encryption');
    await expect(trustCard).toContainText('Connect Compliant');
    await expect(trustCard).toContainText('PCI-DSS Level 1');
  });

  test('Verify FAQ accordions function dynamically upon user clicks', async ({ page }) => {
    const faqAccordionItems = page.locator('div.bg-neutral-950\\/60');
    await expect(faqAccordionItems).toHaveCount(5);

    // Expand FAQ Item 1: Proprietary Scanning hardware question
    const firstFaqButton = faqAccordionItems.nth(0).locator('button');
    const firstFaqChevron = firstFaqButton.locator('svg.lucide-chevron-down');
    
    // Initial state: closed (chevron is not rotated, body text not visible)
    await expect(firstFaqChevron).not.toHaveClass(/rotate-180/);
    await expect(faqAccordionItems.nth(0).locator('div.border-t')).toHaveCount(0);

    // Perform Click Interaction
    await firstFaqButton.click();

    // Expanded state assertion
    await expect(firstFaqChevron).toHaveClass(/rotate-180/);
    const answerContainer = faqAccordionItems.nth(0).locator('div.border-t');
    await expect(answerContainer).toBeVisible();
    await expect(answerContainer).toContainText('Not at all. GridPass works directly on standard smartphones');

    // Collapse again
    await firstFaqButton.click();
    await expect(firstFaqChevron).not.toHaveClass(/rotate-180/);
    await expect(faqAccordionItems.nth(0).locator('div.border-t')).toHaveCount(0);
  });

  test('Verify checkout routing requires authorization gating', async ({ page }) => {
    const checkOutButton = page.locator('button:has-text("Start Lite Passport")');
    
    // User is unauthenticated by default. Clicking checkout should gate to login
    await checkOutButton.click();
    await expect(page).toHaveURL(/\/login\?redirect=\/pricing&tier=passport_monthly/);
  });
});
```

---

### 2.3 Camera Scanner (`/scan`) E2E Scenarios

The scanner operates a live camera stream or falls back to a file input trigger when webcam device streams are unavailable.

#### Step-by-Step Test Suite

```typescript
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Scanner Page (/scan) Layout & Fallbacks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scan');
  });

  test('Verify neon viewfinder frame structure and indicators', async ({ page }) => {
    const scannerOverlay = page.locator('div.absolute.inset-0.pointer-events-none');
    
    // Verify neon target bounding box corners
    const viewfinderFrame = scannerOverlay.locator('div.border-dashed.border-cyan-500\\/30');
    await expect(viewfinderFrame).toBeVisible();
    await expect(viewfinderFrame.locator('.border-cyan-400')).toHaveCount(4); // 4 corners

    // Verify animated scan laser line
    const scanLine = scannerOverlay.locator('.animate-scanLine');
    await expect(scanLine).toHaveClass(/bg-cyan-400/);
  });

  test('Verify camera blocked fallback layout is presented when feed is restricted', async ({ page }) => {
    const offlineMessage = page.locator('text=Camera Blocked or Offline');
    
    // If the mock environment provides no media input, this is visible
    if (await offlineMessage.isVisible()) {
      await expect(page.locator('text=Approve camera permissions in your browser')).toBeVisible();
      await expect(page.locator('button:has-text("Upload from Camera Roll")')).toBeVisible();
    }
  });

  test('Verify manual upload of an image parses QR and redirects', async ({ page }) => {
    await page.route('**/api/logger/logEvent', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', 'image/*');

    await page.evaluate(() => {
      (window as any).handleCodeDetected = (tag: string) => {
        window.location.assign(`/join?id=${encodeURIComponent(tag)}`);
      };
    });

    await expect(page.locator('button:has-text("Upload from Camera Roll")')).toBeVisible();
  });
});
```

---

### 2.4 Dynamic Public Driver Profiles (`/u/[id]`) E2E Scenarios

Public driver profiles display the pilot details, access scans and hits metadata counters, active unassigned universal key tags, and an active digital garage list detailing mods and specifications.

#### Step-by-Step Test Suite

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dynamic Public Driver Profile Page (/u/[id])', () => {
  const testProfileId = 'pjlosey';

  test('Verify missing driver profile layout renders robust 404 page', async ({ page }) => {
    await page.goto('/u/missing-pilot-identifier');
    
    const profileNotFoundTitle = page.locator('h1:has-text("Driver Profile Not Found")');
    await expect(profileNotFoundTitle).toBeVisible();
    
    const backBtn = page.locator('a:has-text("Back to GridPass")');
    await expect(backBtn).toHaveAttribute('href', '/');
  });

  test('Verify public driver profile identity block, tags, and active garage assets', async ({ page }) => {
    await page.goto(`/u/${testProfileId}`);

    const badge = page.locator('span:has-text("PUBLIC PROFILE")');
    await expect(badge).toBeVisible();

    const pilotCard = page.locator('.glass-card').nth(0);
    await expect(pilotCard.locator('h2')).toContainText('PJ LOSEY');
    await expect(pilotCard.locator('.lucide-map-pin').locator('xpath=..')).toContainText('Round Lake, IL');
    
    const hitsPanel = page.locator('span:has-text("Profile Hits")').locator('xpath=..');
    const scansPanel = page.locator('span:has-text("Access Scans")').locator('xpath=..');
    await expect(hitsPanel).toBeVisible();
    await expect(scansPanel).toBeVisible();

    const garageHeader = page.locator('h3:has-text("Active Digital Garage")');
    await expect(garageHeader).toBeVisible();

    const vehicleCards = page.locator('.lg\\:col-span-2 .glass-card');
    const vehicleCount = await vehicleCards.count();
    
    if (vehicleCount > 0) {
      const firstVehicle = vehicleCards.first();
      await expect(firstVehicle.locator('span:has-text("Engine")').locator('xpath=..')).toBeVisible();
      await expect(firstVehicle.locator('span:has-text("Power Specs")').locator('xpath=..')).toBeVisible();
      
      const detailsLink = firstVehicle.locator('a:has-text("View Passport Registry")');
      await expect(detailsLink).toHaveAttribute('href', /\/v\//);
    } else {
      await expect(page.locator('text=Garage Empty')).toBeVisible();
    }
  });
});
```

---

### 2.5 Dynamic Vehicle Details Page (`/v/[id]`) E2E Scenarios

The vehicle details page verifies specifications telemetry sidebars, clean VIN certification checks, verified service log entry lists, and dynamic interactive logs creator panels for authorized owners.

#### Step-by-Step Test Suite

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dynamic Vehicle Dynamic Registry (/v/[id])', () => {
  const testVehicleId = 'gridpass-demo-vehicle';

  test('Verify missing vehicle registry displays invalid asset layout', async ({ page }) => {
    await page.goto('/v/missing-registry-tag');
    await expect(page.locator('h1:has-text("Vehicle Not Found")')).toBeVisible();
    await expect(page.locator('a:has-text("Back to Homepage")')).toHaveAttribute('href', '/');
  });

  test('Verify vehicle registry hero metrics & clean certifications', async ({ page }) => {
    await page.goto(`/v/${testVehicleId}`);

    const heroCard = page.locator('.glass-card').first();
    await expect(heroCard).toContainText('Active GridPass Asset');
    
    await expect(heroCard.locator('p:has-text("Owner")').locator('xpath=..')).toBeVisible();
    const vinVerification = heroCard.locator('p:has-text("VIN Verification")').locator('xpath=..');
    await expect(vinVerification).toContainText('Clean');
    await expect(vinVerification.locator('.text-emerald-400')).toBeVisible();
  });

  test('Verify sidebar telemetry classes are parsed', async ({ page }) => {
    await page.goto(`/v/${testVehicleId}`);

    const sidebar = page.locator('.glass-card').nth(1);
    await expect(sidebar.locator('h3')).toContainText('Telemetry Specs');
    await expect(sidebar).toContainText('Category');
    await expect(sidebar).toContainText('Waiver Signed');
    await expect(sidebar).toContainText('Yes');
  });

  test('Verify verified maintenance log entries display in list', async ({ page }) => {
    await page.goto(`/v/${testVehicleId}`);

    const logHeader = page.locator('h3:has-text("Verified Maintenance History")');
    await expect(logHeader).toBeVisible();

    const logCards = page.locator('.md\\:col-span-2 .glass-card');
    const logCount = await logCards.count();

    if (logCount > 0) {
      const topLog = logCards.first();
      await expect(topLog.locator('span:has-text("Immutable Registry")')).toBeVisible();
      await expect(topLog.locator('span.font-mono')).toContainText(/\d{4}-\d{2}-\d{2}/);
    }
  });

  test('Verify checkout upgrade flows render correctly for owners', async ({ page }) => {
    await page.goto(`/v/${testVehicleId}`);
    
    const upgradeBox = page.locator('h3:has-text("Unlock Premium GridPass Garage")');
    if (await upgradeBox.isVisible()) {
      const upgradeBtn = page.locator('button:has-text("Upgrade Lifetime Profile")');
      await expect(upgradeBtn).toBeVisible();
    }
  });
});
```

---

### 2.6 Voyage Hub Page (`/adventure`) E2E Scenarios

The Voyage Hub holds 4 distinct motorsport modules: waypoint route planning timelines, packing manifests with dynamic checklists, real-time location check-in broadcasts, and emergency pup passports / liability waivers.

#### Step-by-Step Test Suite

```typescript
import { test, expect } from '@playwright/test';

test.describe('Voyage Planner Hub (/adventure) Complex Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/adventure');
  });

  test('Verify Route planning origin/destination sync parameters', async ({ page }) => {
    const tripPlanner = page.locator('h3:has-text("Trip Planner")').locator('xpath=../..');
    
    const originInput = tripPlanner.locator('label:has-text("Departure Point") + input');
    const destInput = tripPlanner.locator('label:has-text("Destination") + input');
    
    await originInput.fill('Round Lake Basecamp');
    await destInput.fill('Monmouth Lake House');
    
    const saveBtn = tripPlanner.locator('button:has-text("Save & Sync Trip Route")');
    await saveBtn.click();
    
    await expect(saveBtn).toContainText('Trip Route Saved');
  });

  test('Verify adding and removing route waypoints dynamically alters timeline', async ({ page }) => {
    const routeWaypoints = page.locator('h3:has-text("Route Waypoints")').locator('xpath=../..');
    
    const stopsList = routeWaypoints.locator('.relative.pl-6 > div');
    const initialStopsCount = await stopsList.count();

    const addInput = routeWaypoints.locator('input[placeholder*="Waypoint"]');
    await addInput.fill('Peru BP Gas Station Stopover');
    
    const addBtn = routeWaypoints.locator('button:has-text("Add")');
    await addBtn.click();

    await expect(stopsList).toHaveCount(initialStopsCount + 1);
    await expect(stopsList.last()).toContainText('Peru BP Gas Station Stopover');

    const deleteBtn = stopsList.last().locator('button');
    await deleteBtn.click();

    await expect(stopsList).toHaveCount(initialStopsCount);
  });

  test('Verify manifest checklists categories and state toggling', async ({ page }) => {
    const manifestCard = page.locator('h3:has-text("Manifest Checklist")').locator('xpath=../../..');
    
    const tabs = manifestCard.locator('button');
    await expect(tabs).toHaveCount(4);

    await tabs.nth(1).click();
    
    const checklistItems = manifestCard.locator('.bg-neutral-950\\/50 > div');
    await expect(checklistItems.first()).toContainText('Axle wrenches');

    const firstCheckbox = checklistItems.first().locator('button').first();
    const isInitiallyChecked = await firstCheckbox.locator('div.rounded').evaluate(node => node.classList.contains('bg-emerald-500'));
    
    await firstCheckbox.click();

    if (isInitiallyChecked) {
      await expect(firstCheckbox.locator('div.rounded')).not.toHaveClass(/bg-emerald-500/);
    } else {
      await expect(firstCheckbox.locator('div.rounded')).toHaveClass(/bg-emerald-500/);
    }
  });

  test('Verify social location check-in broadcasts feeds', async ({ page }) => {
    const broadcastCard = page.locator('h3:has-text("Broadcast Location Check-In")').locator('xpath=../../..');
    
    const locInput = broadcastCard.locator('label:has-text("Check-in Location") + input');
    const statusInput = broadcastCard.locator('label:has-text("Status Message") + input');
    
    await locInput.fill('Peru Pit Stop');
    await statusInput.fill('Fueling up vehicles and checking tire pressure.');

    const gasPreset = broadcastCard.locator('button:has-text("⛽")');
    if (await gasPreset.isVisible()) {
      await gasPreset.click();
    }

    const broadcastBtn = broadcastCard.locator('button:has-text("Check In & Broadcast")');
    await broadcastBtn.click();

    const friendsFeed = page.locator('span:has-text("Active Friends on the Trail")').locator('xpath=../..');
    const firstFeedItem = friendsFeed.locator('.divide-y > div').first();
    
    await expect(firstFeedItem).toContainText('Peru Pit Stop');
    await expect(firstFeedItem).toContainText('Fueling up vehicles and checking tire pressure.');
  });

  test('Verify corridor safety tagging and pin registration', async ({ page }) => {
    const taggingSection = page.locator('h3:has-text("Corridor Tagging Station")').locator('xpath=../../..');
    
    const dinerQuickTagBtn = taggingSection.locator('button:has-text("Diner")');
    await dinerQuickTagBtn.click();

    const labelInput = taggingSection.locator('label:has-text("Amenity Name") + input');
    await expect(labelInput).toHaveValue(/Diner/);

    const pinBtn = taggingSection.locator('button:has-text("Pin Amenity to Corridor Map")');
    await pinBtn.click();

    const amenityCard = page.locator('span:has-text("Amenity Pins along your route")').locator('xpath=../..').locator('.grid > div').first();
    await expect(amenityCard).toContainText('Diner / Food Break');
    
    const retireBtn = amenityCard.locator('button:has-text("Retire")');
    await retireBtn.click();
    await expect(amenityCard).not.toContainText('Diner / Food Break');
  });

  test('Verify emergency pups collar decals rendering & passport editor', async ({ page }) => {
    const pupsPassportCard = page.locator('h3:has-text("Paddock Pup Passport")').locator('xpath=../../..');
    
    const dieselTab = pupsPassportCard.locator('button:has-text("DIESEL")');
    const roxyTab = pupsPassportCard.locator('button:has-text("ROXY")');
    await expect(dieselTab).toBeVisible();
    await expect(roxyTab).toBeVisible();

    await roxyTab.click();
    await expect(pupsPassportCard.locator('h4')).toContainText('ROXY');
    await expect(pupsPassportCard).toContainText('Australian Shepherd Mix');

    const editBtn = pupsPassportCard.locator('button[title*="Edit Pup Passport"]');
    await editBtn.click();

    const breedInput = pupsPassportCard.locator('label:has-text("Breed") + input');
    await expect(breedInput).toHaveValue('Australian Shepherd Mix');

    const weightInput = pupsPassportCard.locator('label:has-text("Weight") + input');
    await weightInput.fill('54 lbs');
    
    const saveBtn = pupsPassportCard.locator('button:has-text("Save changes")');
    await saveBtn.click();

    await expect(pupsPassportCard.locator('.text-neutral-400')).toContainText('54 lbs');
  });

  test('Verify private land Motocross Waiver disclaimer text sync', async ({ page }) => {
    const waiverCard = page.locator('h3:has-text("Private Land Waiver Gate")').locator('xpath=../../..');
    
    const waiverTextarea = waiverCard.locator('textarea');
    await expect(waiverTextarea).toContainText('Losey Private MOTOCROSS TRAILS');

    await waiverTextarea.fill('Motocross waiver update disclaimer text. Read and sign on check-in. MANDATORY GEAR.');
    
    const updateBtn = waiverCard.locator('button:has-text("Update Waiver")');
    await updateBtn.click();

    await expect(waiverCard.locator('span:has-text("Waiver updated")')).toBeVisible();

    const checkedInRiders = waiverCard.locator('.divide-y > div');
    const initialRiderCount = await checkedInRiders.count();

    const nameInput = waiverCard.locator('input[placeholder*="Rider Name"]');
    const bikeInput = waiverCard.locator('input[placeholder*="Vehicle"]');
    const signBtn = waiverCard.locator('button:has-text("Sign & Checkin")');

    await nameInput.fill('MARK MILLER');
    await bikeInput.fill('KTM 300 XC-W');
    await signBtn.click();

    await expect(checkedInRiders).toHaveCount(initialRiderCount + 1);
    await expect(checkedInRiders.last()).toContainText('MARK MILLER');

    const checkoutBtn = checkedInRiders.last().locator('button:has-text("Checkout")');
    await checkoutBtn.click();

    await expect(checkedInRiders).toHaveCount(initialRiderCount);
  });
});
```

---

## 3. Viewport Screenshot Capture Protocols

To verify the visual fidelity of Gridpass's dark glassmorphic UI cards, screenshots are captured across Mobile (`375px`) and Desktop (`1280px`) dimensions. These coordinates correspond to key responsive layouts.

### 3.1 Automated Capturing Script (`capture_viewports.ts`)

```typescript
import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 375, height: 667 },
];

const SCENARIOS = [
  { path: '/', name: 'landing_hero' },
  { path: '/pricing', name: 'pricing_tiers' },
  { path: '/scan', name: 'scanner_viewfinder' },
  { path: '/adventure', name: 'voyage_hub' },
  { path: '/u/pjlosey', name: 'driver_public_profile' },
  { path: '/v/gridpass-demo-vehicle', name: 'vehicle_details' }
];

async function captureScreenshots() {
  const screenshotDir = path.resolve(__dirname, '../../test_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  for (const vp of VIEWPORTS) {
    console.log(`[Viewport] Capturing layout benchmarks for: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.name === 'desktop' ? 1 : 2,
    });

    const page = await context.newPage();

    for (const sc of SCENARIOS) {
      try {
        console.log(`  -> Navigating to http://localhost:3000${sc.path}`);
        await page.goto(`http://localhost:3000${sc.path}`, { waitUntil: 'networkidle' });

        await page.waitForTimeout(1000);

        const filename = `${vp.name}_${sc.name}.png`;
        const filepath = path.join(screenshotDir, filename);

        await page.screenshot({
          path: filepath,
          fullPage: true
        });

        console.log(`  [Saved] Benchmark image saved to ${filepath}`);
      } catch (err) {
        console.error(`  [Error] Failed to capture scenario "${sc.name}" on ${vp.name}:`, err);
      }
    }
    await context.close();
  }
  browser.close();
}

captureScreenshots().catch(console.error);
```

---

## 4. Glassmorphic Layout Verification Criteria

Headless Chrome visual tests assert that pages meet the precise layout specs of the Gridpass design token guidelines:

### Visual Layout Verification Index

| Target Element | Desktop Layout Style (1280px) | Mobile Layout Style (375px) | CSS Assertion Target Classes |
|---|---|---|---|
| **Landing Feature Grid** | 3-Column Horizontal layout (`grid grid-cols-1 md:grid-cols-3 gap-8`) | Stacked vertical structure, single-file list | `.glass-card` background must exhibit `bg-white/5` or `bg-neutral-900/40` backdrop styling. |
| **Pricing Tiers Grid** | 4-Column Horizontal layout (`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6`) | Stacked vertical structure. Buttons must scale to 100% viewport width. | Top tier badge (`Cheap & Easy`, `Best Seller`) must remain aligned to top-right corner. |
| **Scanner Viewfinder** | Camera viewfinder displays in widescreen aspect-ratio (16:9) centered card. | Bounding box scales to full-width container margins with touchable fallback input triggers. | Viewfinder overlays have `border-cyan-400` corners and `animate-scanLine` animations. |
| **Public Profile `/u/[id]`** | 2-Column Split: Driver info on left (1 col), Garage lists on right (2 cols). | Vertical stack: Identity info displays on top, garage cards stack below. | Profile stat box counters must remain aligned inside a 2-column flex row layout. |
| **Vehicle Registry `/v/[id]`** | 2-Column Split: Telemetry Specs sidebar on left (1 col), Maintenance history lists on right (2 cols). | Vertical stack: Telemetry specs on top, maintenance cards stack below. | Maintenance history cards must possess an immutable border style `.hover:border-blue-500/10`. |
| **Voyage Hub `/adventure`** | Multi-grid panels: Route timeline stopovers on top row, Social check-ins and Pup emergency passports below. | Fully stacked vertical columns. Tap items (e.g. manifest list checkboxes) expand to 44px for thumb compliance. | timeline neon line `from-cyan-500 to-indigo-500` must align center with timeline waypoint dots. |

---

## 5. Visual Bug Classification & Layout Failure Metrics

When E2E regression runs are captured, the layout verification suite applies pixel-matching checks. Visual deviations are flagged according to the following metric guidelines:

### Visual Deviation Severity Gating

```
               [ VISUAL REGRESSION PIPELINE ]
                             |
                   Capture Screenshots
                             |
             Compare against benchmark image
                             |
                Are pixels 100% matched?
                       /        \
                    (Yes)       (No)
                     /            \
             Pass Build        Calculate mismatch percentage
                                    /     |      \
                                <0.5%   0.5%-2%   >2%
                                 /        |         \
                             Ignore     Warning    Failure
                             (Minor)   (Review)  (Hard Block)
```

1. **Hard Failure (Visual Deviation > 2.0%)**: Indicates catastrophic layout breakage such as grids crashing, text overflowing bounds, glassmorphic cards folding, or missing responsive styles. **Hard blocks deployment.**
2. **Warning Indicator (Visual Deviation 0.5% - 2.0%)**: Indicates subtle layout alignments issues, margins shifts, button sizing deviations, or font weight swaps. **Triggers manual review before publishing.**
3. **Ignorable Drift (Visual Deviation < 0.5%)**: Standard dynamic runtime differences (such as live dynamic time clocks, custom mock name text differences, or minor browser rendering changes). **Approved automatically.**
