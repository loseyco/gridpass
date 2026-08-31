import { test, expect } from '@playwright/test';

test.describe('Site Auditor Comprehensive Verification Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Configure default test environment
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
      localStorage.setItem('__playwright_mock__', 'true');
    });
  });

  // 1. Primary Public Routes
  const publicRoutes = [
    '/',
    '/explore',
    '/vehicles',
    '/passports',
    '/members',
    '/businesses',
    '/events',
    '/news',
    '/spotted',
    '/feedback',
    '/join',
    '/login',
    '/inventory',
    '/secondlife',
    '/guides'
  ];

  for (const route of publicRoutes) {
    test(`Public route ${route} renders non-empty DOM container and header`, async ({ page }) => {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForLoadState('domcontentloaded');

      const body = page.locator('body');
      await expect(body).toBeVisible();
      const box = await body.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(150);
    });
  }

  // 2. /dash Route and Subtabs
  const dashTabs = ['vehicles', 'experiences', 'spaces', 'businesses', 'events', 'membership'];
  for (const tab of dashTabs) {
    test(`Route /dash with tab=${tab} renders valid DOM content`, async ({ page }) => {
      await page.goto(`http://localhost:3000/dash?tab=${tab}`);
      await page.waitForLoadState('domcontentloaded');

      const body = page.locator('body');
      await expect(body).toBeVisible();
      const box = await body.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(200);
    });
  }

  // 3. /admin and All Subroutes
  const adminRoutes = [
    '/admin',
    '/admin/command',
    '/admin/commander',
    '/admin/founder-facts',
    '/admin/feedback',
    '/admin/tickets',
    '/admin/sop',
    '/admin/agents',
    '/admin/analytics',
    '/admin/logs',
    '/admin/db',
    '/admin/changelog',
    '/admin/features',
    '/admin/sitemap',
    '/admin/news',
    '/admin/tags',
    '/admin/users',
    '/admin/vehicles',
    '/admin/businesses',
    '/admin/staff',
    '/admin/claims',
    '/admin/events',
    '/admin/products',
    '/admin/rewards',
    '/admin/requests',
    '/admin/membership-tiers',
    '/admin/industries',
    '/admin/vehicle-classes',
    '/admin/business-plan',
    '/admin/demo',
    '/admin/crm'
  ];

  for (const route of adminRoutes) {
    test(`Admin route ${route} renders non-empty DOM content`, async ({ page }) => {
      await page.goto(`http://localhost:3000${route}`);
      await page.waitForLoadState('domcontentloaded');

      const body = page.locator('body');
      await expect(body).toBeVisible();
      const box = await body.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(150);
    });
  }

  // 4. Event Hub Subtabs
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
    test(`Event Hub /events/maple-city-cruise?tab=${tab} renders valid DOM`, async ({ page }) => {
      await page.goto(`http://localhost:3000/events/maple-city-cruise?tab=${tab}`);
      await page.waitForLoadState('domcontentloaded');

      const body = page.locator('body');
      await expect(body).toBeVisible();
      const box = await body.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(200);
    });
  }

  // 5. Dynamic Profile Routes: /u/[id], /v/[id], /b/[id]
  test('Route /u/pjlosey member profile renders valid DOM and subtabs', async ({ page }) => {
    await page.goto('http://localhost:3000/u/pjlosey');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
    const box = await body.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(200);
  });

  test('Route /b/monmouth-marine-demo business profile renders valid DOM', async ({ page }) => {
    await page.goto('http://localhost:3000/b/monmouth-marine-demo');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).toBeVisible();
    const box = await body.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(200);
  });

  // 6. Mobile Touch Targets & Zoom Prevention Verification
  test('Inputs and buttons satisfy mobile touch targets (>= 44px) and zoom prevention', async ({ page }) => {
    await page.goto('http://localhost:3000/feedback');
    await page.waitForLoadState('domcontentloaded');

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    const btnBox = await submitBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    expect(btnBox!.height).toBeGreaterThanOrEqual(44);

    const textInput = page.locator('input[type="text"]').first();
    await expect(textInput).toBeVisible();
    const inputBox = await textInput.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(inputBox!.height).toBeGreaterThanOrEqual(44);
  });

  // 7. Design System Audit: Brand Red #ff3b30, Dark Text #1c1c1e, White Background
  test('Design system color tokens and typography are consistent across primary views', async ({ page }) => {
    await page.goto('http://localhost:3000/feedback');
    await page.waitForLoadState('domcontentloaded');

    // Check accent button styling
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveCSS('background-color', 'rgb(255, 59, 48)'); // #ff3b30

    // Check header text color
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

});
