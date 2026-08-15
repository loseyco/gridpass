import { test, expect } from '@playwright/test';

test.describe('Experience Asset AI URL & Text Auto-Filler E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

    // Inject mock flag for deterministic test execution
    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('1. API Route POST /api/ai/extract-experience returns valid structured JSON', async ({ request }) => {
    const rawResumeText = `
      Lead Race Engineer & Dyno Specialist
      Losey Racing Development (2022 - Present)
      Designed and calibrated custom ECU maps for GT3 endurance racers.
      Trained pit crew for rapid tire changes and telemetry data logging.
      Skills: ECU Tuning, Telemetry Analysis, Motec, Engine Building, TIG Welding
      Website: https://losey.co
    `;

    const response = await request.post('/api/ai/extract-experience', {
      data: {
        raw_text: rawResumeText,
        url: 'https://losey.co/pedigree',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('title');
    expect(body.data).toHaveProperty('company');
    expect(body.data).toHaveProperty('date_range');
    expect(body.data).toHaveProperty('description');
    expect(body.data).toHaveProperty('skills');
    expect(Array.isArray(body.data.skills)).toBe(true);
    expect(body.data).toHaveProperty('links');
    expect(Array.isArray(body.data.links)).toBe(true);
    expect(body.data.links.length).toBeGreaterThan(0);
  });

  test('2. /exp/new - AI Instant Auto-Fill populates form, displays success banner & AI badges', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Mock the API response to guarantee deterministic UI test
    await page.route('**/api/ai/extract-experience', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            title: 'Lead Race Engineer / Pro Driver',
            company: 'Losey Racing Engineering',
            date_range: '2023 - Present',
            description: 'Engineered high-performance aerodynamic setups and managed real-time pit telemetry data.',
            skills: ['Telemetry Analysis', 'ECU Tuning', 'Chassis Setup', 'TIG Welding'],
            links: [
              { title: 'Losey Racing Pedigree', url: 'https://losey.co' },
              { title: 'Championship Results', url: 'https://gridpass.app' }
            ]
          },
          source: 'mock_test'
        })
      });
    });

    await page.goto('/exp/new', { waitUntil: 'domcontentloaded' });

    // Verify AI Auto-Fill Card is visible
    const aiCard = page.locator('[data-testid="ai-autofill-card"]');
    await expect(aiCard).toBeVisible();

    const aiInput = page.locator('[data-testid="ai-autofill-input"]');
    await expect(aiInput).toBeVisible();

    const aiBtn = page.locator('[data-testid="ai-autofill-btn"]');
    await expect(aiBtn).toBeVisible();

    // Enter test text
    await aiInput.fill('https://losey.co - Lead Race Engineer for Losey Racing');
    await aiBtn.click();

    // Verify Success Banner is shown
    const successBanner = page.locator('[data-testid="ai-autofill-success-banner"]');
    await expect(successBanner).toBeVisible({ timeout: 7000 });
    await expect(successBanner).toContainText('Form pre-filled by AI!');

    // Verify Form Fields populated
    const titleInput = page.locator('input[placeholder="e.g. Lead Race Engineer / Pro Driver"]');
    await expect(titleInput).toHaveValue('Lead Race Engineer / Pro Driver');

    const companyInput = page.locator('input[placeholder="e.g. Losey Racing / Road America"]');
    await expect(companyInput).toHaveValue('Losey Racing Engineering');

    const dateRangeInput = page.locator('input[placeholder="e.g. 2024 - Present"]');
    await expect(dateRangeInput).toHaveValue('2023 - Present');

    const descInput = page.locator('textarea[placeholder*="Detail key responsibilities"]');
    await expect(descInput).toHaveValue('Engineered high-performance aerodynamic setups and managed real-time pit telemetry data.');

    // Verify Skills & Links
    const skillsCloud = page.locator('[data-testid="skills-tag-cloud"]');
    await expect(skillsCloud).toContainText('Telemetry Analysis');
    await expect(skillsCloud).toContainText('ECU Tuning');

    const linksList = page.locator('[data-testid="experience-links-list"]');
    await expect(linksList).toContainText('Losey Racing Pedigree');

    // Verify AI Pre-filled Badges are displayed
    const badges = page.locator('[data-testid="ai-prefilled-badge"]');
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(4);

    // Audit Touch Targets >= 44px
    const interactiveElements = await page.locator('button:visible, a:visible, input:visible, textarea:visible').all();
    let touchTargetFailures = 0;
    for (const el of interactiveElements) {
      const box = await el.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        if (box.height < 44 || box.width < 44) {
          const text = (await el.textContent())?.trim() || (await el.getAttribute('aria-label')) || (await el.getAttribute('placeholder')) || 'unnamed';
          console.warn(`[TOUCH-TARGET SUB-44] Element "${text}": ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
          touchTargetFailures++;
        }
      }
    }
    expect(touchTargetFailures).toBe(0);
    expect(pageErrors.length).toBe(0);

    await page.screenshot({ path: 'tests/screenshots/exp_new_ai_autofill.png', fullPage: true });
  });

  test('3. /exp/[id]/edit - AI Instant Auto-Fill card updates existing experience asset', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Mock extraction
    await page.route('**/api/ai/extract-experience', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            title: 'Honda Racing Senior Telemetry Director',
            company: 'Honda Performance Development (HPD)',
            date_range: '2021 - 2026',
            description: 'Overseeing multi-car telemetry pipelines, sensor calibration, and pit strategy analytics.',
            skills: ['Telemetry Analysis', 'ECU Calibration', 'CAN-Bus Reverse Engineering', 'Data Acquisition'],
            links: [
              { title: 'HPD Official Site', url: 'https://honda.com' }
            ]
          },
          source: 'mock_test'
        })
      });
    });

    await page.goto('/exp/exp-hrc-2021/edit', { waitUntil: 'domcontentloaded' });

    // Verify AI Auto-Fill Card is visible
    const aiCard = page.locator('[data-testid="ai-autofill-card"]');
    await expect(aiCard).toBeVisible();

    const aiInput = page.locator('[data-testid="ai-autofill-input"]');
    await aiInput.fill('Updated HPD role description with CAN-Bus and telemetry details');

    const aiBtn = page.locator('[data-testid="ai-autofill-btn"]');
    await aiBtn.click();

    // Verify Success Banner
    const successBanner = page.locator('[data-testid="ai-autofill-success-banner"]');
    await expect(successBanner).toBeVisible({ timeout: 7000 });

    // Verify updated values using label relative lookup or form index
    const form = page.locator('form').nth(1); // the main experience form (nth 0 is inside AI card)
    const titleInput = form.locator('input').first();
    await expect(titleInput).toHaveValue('Honda Racing Senior Telemetry Director');

    const companyInput = form.locator('input').nth(1);
    await expect(companyInput).toHaveValue('Honda Performance Development (HPD)');

    // Audit Touch Targets >= 44px
    const interactiveElements = await page.locator('button:visible, a:visible, input:visible, textarea:visible').all();
    let touchTargetFailures = 0;
    for (const el of interactiveElements) {
      const box = await el.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        if (box.height < 44 || box.width < 44) {
          const text = (await el.textContent())?.trim() || (await el.getAttribute('aria-label')) || 'unnamed';
          console.warn(`[TOUCH-TARGET SUB-44] Element "${text}": ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
          touchTargetFailures++;
        }
      }
    }
    expect(touchTargetFailures).toBe(0);
    expect(pageErrors.length).toBe(0);

    await page.screenshot({ path: 'tests/screenshots/exp_edit_ai_autofill.png', fullPage: true });
  });

  test('4. /exp/new - Multi-Experience Batch Staging Queue renders duplicate badge, merge action, expand toggle, and batch import', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', err => pageErrors.push(err));

    // Mock extraction returning 3 experiences (including 1 existing duplicate)
    await page.route('**/api/ai/extract-experience', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          experiences: [
            {
              title: 'Honda Racing / HRC Trackside Engineer',
              company: 'Honda Racing Corporation (HRC)',
              date_range: '2021 - 2026',
              description: 'Telemetry engineering and real-time live ECU calibration.',
              skills: ['Telemetry Analysis', 'ECU Tuning', 'CAN-Bus', 'Data Acquisition'],
              links: [
                { title: 'HRC Team Page', url: 'https://honda.com/hrc' }
              ]
            },
            {
              title: 'Lead Dyno Specialist & Engine Builder',
              company: 'Losey Racing Engineering',
              date_range: '2023 - Present',
              description: 'Built bespoke 800hp turbocharged endurance engines and managed dyno cell.',
              skills: ['Engine Building', 'Dyno Tuning', 'Machining', 'TIG Welding'],
              links: [
                { title: 'Losey Dyno Cell', url: 'https://losey.co/dyno' }
              ]
            },
            {
              title: 'Chassis & Aerodynamics Consultant',
              company: 'Road America Motorsport Group',
              date_range: '2022 - 2023',
              description: 'Wind tunnel validation and trackside suspension geometry optimization.',
              skills: ['Chassis Setup', 'Suspension Tuning', 'CAD / CAM'],
              links: [
                { title: 'Road America Results', url: 'https://roadamerica.com' }
              ]
            }
          ],
          data: {
            title: 'Honda Racing / HRC Trackside Engineer',
            company: 'Honda Racing Corporation (HRC)',
            date_range: '2021 - 2026',
            description: 'Telemetry engineering and real-time live ECU calibration.',
            skills: ['Telemetry Analysis', 'ECU Tuning', 'CAN-Bus', 'Data Acquisition'],
            links: [
              { title: 'HRC Team Page', url: 'https://honda.com/hrc' }
            ]
          },
          source: 'gemini_ai'
        })
      });
    });

    await page.goto('/exp/new', { waitUntil: 'domcontentloaded' });

    // Submit batch input
    const aiInput = page.locator('[data-testid="ai-autofill-input"]');
    await aiInput.fill('https://linkedin.com/in/pjlosey multi-job profile with 3 motorsport roles');

    const aiBtn = page.locator('[data-testid="ai-autofill-btn"]');
    await aiBtn.click();

    // Verify Batch Staging Queue appears
    const queue = page.locator('[data-testid="batch-staging-queue"]');
    await expect(queue).toBeVisible({ timeout: 7000 });
    await expect(queue).toContainText('Batch Experience Review & Import');

    // Verify 3 cards rendered
    const card0 = page.locator('[data-testid="staged-experience-card-0"]');
    const card1 = page.locator('[data-testid="staged-experience-card-1"]');
    const card2 = page.locator('[data-testid="staged-experience-card-2"]');

    await expect(card0).toBeVisible();
    await expect(card1).toBeVisible();
    await expect(card2).toBeVisible();

    // Verify duplicate detection: Card 0 should have "Already in Profile" badge & default unchecked
    await expect(card0).toContainText('Already in Profile');
    const card0Checkbox = card0.locator('input[type="checkbox"]');
    expect(await card0Checkbox.isChecked()).toBe(false);
    await expect(card0).toContainText('Merge / Update Existing');

    // Card 1 & 2 should be marked "New Asset" and checked by default
    await expect(card1).toContainText('New Asset');
    const card1Checkbox = card1.locator('input[type="checkbox"]');
    expect(await card1Checkbox.isChecked()).toBe(true);

    await expect(card2).toContainText('New Asset');
    const card2Checkbox = card2.locator('input[type="checkbox"]');
    expect(await card2Checkbox.isChecked()).toBe(true);

    // Test inline expand/edit toggle
    const expandBtn1 = card1.locator('button', { hasText: /Edit/i }).first();
    await expandBtn1.click();
    await expect(card1.locator('input[value="Lead Dyno Specialist & Engine Builder"]')).toBeVisible();

    // Test Merge action on duplicate
    const mergeBtn = card0.locator('button', { hasText: /Merge/i }).first();
    await mergeBtn.click();
    await expect(card0).toContainText('Will Merge');

    // Verify Batch Import Button is active with count
    const importBtn = page.locator('[data-testid="batch-import-btn"]');
    await expect(importBtn).toBeVisible();
    await expect(importBtn).toContainText('Import All (3) Selected Experiences');

    // Audit Touch Targets >= 44px
    const interactiveElements = await page.locator('button:visible, a:visible, input:visible, textarea:visible').all();
    let touchTargetFailures = 0;
    for (const el of interactiveElements) {
      const box = await el.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        if (box.height < 44 || box.width < 44) {
          const text = (await el.textContent())?.trim() || (await el.getAttribute('aria-label')) || 'unnamed';
          console.warn(`[BATCH TOUCH-TARGET SUB-44] Element "${text}": ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
          touchTargetFailures++;
        }
      }
    }
    expect(touchTargetFailures).toBe(0);
    expect(pageErrors.length).toBe(0);

    // Click Import All to test navigation
    await importBtn.click();
    await page.waitForURL(url => url.pathname.includes('/u/') || url.pathname.includes('/dash'), { timeout: 7000 });

    await page.screenshot({ path: 'tests/screenshots/exp_batch_staging_queue.png', fullPage: true });
  });

});

