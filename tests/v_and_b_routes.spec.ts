import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

  // Inject mock environment variable for deterministic offline data
  await page.addInitScript(() => {
    (window as any).__PLAYWRIGHT_MOCK__ = true;
  });
});

test.describe('/v/[id] and /b/[id] Comprehensive E2E Verification Suite', () => {

  test.describe('/v/[id] Vehicle Profile Route', () => {
    test('Route Rendering: verifies vehicle details, specs, and mods', async ({ page }) => {
      await page.goto('/v/mock-v1');

      // Verify header and core metadata
      await expect(page.locator('h1')).toContainText('Mustang GT');
      await expect(page.locator('text=2024 Ford Mustang GT')).toBeVisible();

      // Verify specification cards
      await expect(page.locator('text=5.0L Coyote V8')).toBeVisible();
      await expect(page.locator('text=480 HP')).toBeVisible();

      // Verify modification list items
      await expect(page.locator('text=Roush')).toBeVisible();
      await expect(page.locator('text=Cat-Back Exhaust System')).toBeVisible();

      // Verify social / interactivity controls
      const likeBtn = page.getByRole('button', { name: 'Like', exact: true });
      await expect(likeBtn).toBeVisible();
    });

    test('Tab Navigation & Sections: verifies section rendering and owner-gated tab switching', async ({ page }) => {
      // 1. Spectator view section verification
      await page.goto('/v/mock-v1');
      await expect(page.locator('text=Factory Specifications')).toBeVisible();
      await expect(page.locator('text=Modification List')).toBeVisible();

      // 2. Owner view tab switching verification
      await page.addInitScript(() => {
        (window as any).__MOCK_USER__ = {
          uid: "user-marcus-123",
          email: "marcus@enthusiast.com",
          is_supporter: true,
          display_name: "Marcus Mustang"
        };
      });
      await page.goto('/v/mock-v1');

      // Verify owner-gated tabs if present or management actions
      const telemetryTab = page.locator('button:has-text("Scan Telemetry")');
      if (await telemetryTab.isVisible()) {
        await telemetryTab.click();
        await expect(page.locator('text=Geographic Scan Telemetry')).toBeVisible();
      }

      const serviceTab = page.locator('button:has-text("Service Logbook")');
      if (await serviceTab.isVisible()) {
        await serviceTab.click();
        await expect(page.locator('text=Maintenance History & Service Logbook')).toBeVisible();
      }
    });

    test('Link Health: verifies all anchor links on /v/[id] have valid hrefs', async ({ page }) => {
      await page.goto('/v/mock-v1');

      const anchors = page.locator('a');
      const count = await anchors.count();
      expect(count).toBeGreaterThan(0);

      const brokenLinks: string[] = [];
      for (let i = 0; i < count; i++) {
        const href = await anchors.nth(i).getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) {
          const text = await anchors.nth(i).innerText();
          brokenLinks.push(`Link ${i} ("${text.trim()}") has invalid href: "${href}"`);
        }
      }

      expect(brokenLinks).toEqual([]);
    });
  });

  test.describe('/b/[id] Business Profile Route', () => {
    test('Route Rendering: verifies business storefront branding, address, and overview', async ({ page }) => {
      await page.goto('/b/monmouth-marine-demo');

      // Verify business title & location
      await expect(page.locator('text=Monmouth Marine Ford & Boats')).toBeVisible();
      await expect(page.locator('text=250 State Highway 35')).toBeVisible();

      // Verify business category badge
      await expect(page.locator('text=dealership').first()).toBeVisible();

      // Verify inventory section rendered on overview
      await expect(page.locator('text=Porsche 911 GT3 RS')).toBeVisible();
    });

    test('Tab Navigation: verifies switching across business profile tabs', async ({ page }) => {
      await page.goto('/b/monmouth-marine-demo');

      // 1. Overview tab (default)
      const overviewTab = page.locator('button:has-text("Overview")');
      await expect(overviewTab).toBeVisible();

      // 2. Inventory tab
      const invTab = page.locator('button:has-text("Inventory")');
      if (await invTab.isVisible()) {
        await invTab.click();
        await expect(page.locator('text=Porsche 911 GT3 RS')).toBeVisible();
      }

      // 3. CRM Leads tab (gated or mock owner)
      const crmTab = page.locator('button:has-text("B2B CRM Warm Leads")');
      if (await crmTab.isVisible()) {
        await crmTab.click();
        await expect(page.locator('text=sarah@spotter.com')).toBeVisible();
        await expect(page.locator('text=marcus@enthusiast.com')).toBeVisible();
      }

      // Return to Overview
      await overviewTab.click();
      await expect(page.locator('text=Monmouth Marine Ford & Boats')).toBeVisible();
    });

    test('Link Health: verifies all anchor links on /b/[id] have valid hrefs', async ({ page }) => {
      await page.goto('/b/monmouth-marine-demo');

      const anchors = page.locator('a');
      const count = await anchors.count();
      expect(count).toBeGreaterThan(0);

      const brokenLinks: string[] = [];
      for (let i = 0; i < count; i++) {
        const href = await anchors.nth(i).getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) {
          const text = await anchors.nth(i).innerText();
          brokenLinks.push(`Link ${i} ("${text.trim()}") has invalid href: "${href}"`);
        }
      }

      expect(brokenLinks).toEqual([]);
    });
  });

});
