import { test, expect } from '@playwright/test';

test.describe('Route & Tab Visual Coverage Audit', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('__playwright_mock__', 'true');
      localStorage.setItem('gp_rules_accepted_skinny-dip-inn_guest', new Date().toISOString());
      localStorage.setItem('gp_rules_accepted_skinny-dip-inn_', new Date().toISOString());
      localStorage.setItem('gp_upvoted_builds_maple-city-cruise', JSON.stringify({ 'v1': 1 }));
    });
  });

  const slTabs = [
    'home',
    'passport',
    'apply',
    'staff',
    'schedule',
    'applications',
    'admin',
    'logs',
    'rules',
    'lsl',
    'gallery',
    'analytics',
    'visitors',
    'telemetry'
  ];

  for (const tab of slTabs) {
    test(`SecondLife Community Hub - Tab: ?tab=${tab} renders non-empty visible DOM`, async ({ page }) => {
      await page.goto(`http://localhost:3000/secondlife/skinny-dip-inn?tab=${tab}`);
      await page.waitForLoadState('domcontentloaded');

      // Assert header is visible
      await expect(page.locator('h1, h2, h3').first()).toBeVisible();

      // Assert body has non-zero height and visible elements
      const body = page.locator('body');
      await expect(body).toBeVisible();

      const box = await body.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(200);
    });
  }

  const eventTabs = [
    'hub',
    'map',
    'passes',
    'entrants',
    'discussion',
    'host',
    'register-vehicle',
    'register-vendor',
    'edit-event',
    'submit-news',
    'check-in',
    'claim-event',
    'edit-cover'
  ];

  for (const tab of eventTabs) {
    test(`Event Hub - Tab: ?tab=${tab} renders non-empty visible DOM`, async ({ page }) => {
      await page.goto(`http://localhost:3000/events/maple-city-cruise?tab=${tab}`);
      await page.waitForLoadState('domcontentloaded');

      // Assert header or content is visible
      await expect(page.locator('h1, h2, h3, header').first()).toBeVisible();

      const body = page.locator('body');
      await expect(body).toBeVisible();
      const box = await body.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(200);
    });
  }

  const dashTabs = [
    'vehicles',
    'experiences',
    'spaces',
    'businesses',
    'events',
    'membership',
    'unknown_fallback_check'
  ];

  for (const tab of dashTabs) {
    test(`Dashboard - Tab: ?tab=${tab} renders non-empty visible DOM`, async ({ page }) => {
      await page.goto(`http://localhost:3000/dash?tab=${tab}`);
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('h1, h2, h3').first()).toBeVisible();
      const body = page.locator('body');
      await expect(body).toBeVisible();
      const box = await body.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(200);
    });
  }

  const adminRoutes = [
    '/admin/command',
    '/admin/feedback',
    '/admin/analytics',
    '/admin/logs',
    '/admin/agents',
    '/admin/tickets',
    '/admin/sop',
    '/admin/db',
    '/admin/changelog',
    '/admin/features',
    '/admin/sitemap',
    '/admin/news',
    '/admin/tags',
    '/admin/users',
    '/admin/vehicles',
    '/admin/businesses',
    '/admin/staff'
  ];

  for (const route of adminRoutes) {
    test(`Admin Route: ${route} renders non-empty visible DOM`, async ({ page }) => {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('h1, h2, h3').first()).toBeVisible();
      const body = page.locator('body');
      await expect(body).toBeVisible();
      const box = await body.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(100);
    });
  }

  const publicRoutes = [
    '/explore',
    '/join',
    '/login',
    '/about',
    '/businesses',
    '/events',
    '/news',
    '/dash/garage'
  ];

  for (const route of publicRoutes) {
    test(`Public Route: ${route} renders non-empty visible DOM`, async ({ page }) => {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('h1, h2, h3, header, nav').first()).toBeVisible();
      const body = page.locator('body');
      await expect(body).toBeVisible();
      const box = await body.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(100);
    });
  }

});
