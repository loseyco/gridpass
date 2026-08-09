import { test, expect } from '@playwright/test';

test.describe('E2E Visual Verification: /exp/exp-hrc-2021', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER-ERROR] ${err.stack || err.message}`));

    await page.addInitScript(() => {
      (window as any).__PLAYWRIGHT_MOCK__ = true;
    });
  });

  test('Verify all 5 visual design & touch target requirements on /exp/exp-hrc-2021', async ({ page }) => {
    const response = await page.goto('/exp/exp-hrc-2021', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);

    // Wait for content to render past loading state
    const titleEl = page.locator('[data-testid="experience-title"]');
    await expect(titleEl).toBeVisible({ timeout: 10000 });

    const results: Record<string, { pass: boolean; details: string }> = {};

    // 1. Verify page background is solid white (#ffffff / bg-white)
    const pageBg = await titleEl.evaluate((el) => {
      const container = el.closest('.min-h-screen') || document.body;
      return window.getComputedStyle(container).backgroundColor;
    });
    const isBgWhite = pageBg === 'rgb(255, 255, 255)';
    results['1. Page Background Solid White (#ffffff / bg-white)'] = {
      pass: isBgWhite,
      details: `Computed background-color: ${pageBg}`
    };

    // 2. Verify text is high-contrast charcoal black (text-neutral-900)
    const titleColor = await titleEl.evaluate((el) => window.getComputedStyle(el).color);
    const descColor = await page.locator('[data-testid="experience-description"]').evaluate((el) => window.getComputedStyle(el).color);
    // text-neutral-900 evaluates to rgb(23, 23, 23) or oklch(0.205 0 0)
    const isTextCharcoal = titleColor === 'rgb(23, 23, 23)' || titleColor.includes('oklch(0.205') || titleColor === 'oklch(0.205 0 0)';
    results['2. High-Contrast Charcoal Black Text (text-neutral-900)'] = {
      pass: isTextCharcoal,
      details: `Title color: ${titleColor}, Desc color: ${descColor}`
    };

    // 3. Verify cards use white/neutral-50 backgrounds with thin neutral-200 borders
    const cardStyles = await page.locator('[data-testid="owner-passport-card"]').evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        bgColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth
      };
    });
    // neutral-50 is rgb(250, 250, 250) or oklch(0.985 0 0) or rgb(255, 255, 255); neutral-200 border is rgb(229, 229, 229) or oklch(0.922 0 0)
    const isCardBgValid = ['rgb(255, 255, 255)', 'rgb(250, 250, 250)', 'oklch(0.985 0 0)'].some(val => cardStyles.bgColor.includes(val) || cardStyles.bgColor === val);
    const isCardBorderValid = ['rgb(229, 229, 229)', 'oklch(0.922 0 0)'].some(val => cardStyles.borderColor.includes(val) || cardStyles.borderColor === val);
    
    results['3. Cards White/Neutral-50 with Thin Neutral-200 Borders'] = {
      pass: isCardBgValid && isCardBorderValid,
      details: `Card bg: ${cardStyles.bgColor}, border-color: ${cardStyles.borderColor}, border-width: ${cardStyles.borderWidth}`
    };

    // 4. Verify category pill is crimson system red (bg-[#ff3b30]/10 text-[#ff3b30])
    const categoryPill = page.locator('[data-testid="experience-category-pill"]');
    const pillStyles = await categoryPill.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        bgColor: style.backgroundColor,
        textColor: style.color
      };
    });
    const isPillBgRed = pillStyles.bgColor.includes('rgba(255, 59, 48, 0.1)') || 
                        pillStyles.bgColor.includes('oklab(0.654224 0.203716 0.111346 / 0.1)') || 
                        pillStyles.bgColor.includes('0.1');
    const isPillTextRed = pillStyles.textColor === 'rgb(255, 59, 48)';
    results['4. Category Pill Crimson System Red (bg-[#ff3b30]/10 text-[#ff3b30])'] = {
      pass: isPillBgRed && isPillTextRed,
      details: `Category pill bg: ${pillStyles.bgColor}, text: ${pillStyles.textColor}`
    };

    // 5. Verify touch targets >= 44px on all buttons and pills
    const interactiveElements = await page.locator('button:visible, a:visible, [data-testid="experience-category-pill"]').all();
    const touchFailures: string[] = [];
    for (const el of interactiveElements) {
      const box = await el.boundingBox();
      const text = (await el.textContent())?.trim() || 'unnamed element';
      if (box) {
        if (box.width < 44 || box.height < 44) {
          touchFailures.push(`"${text}": ${box.width.toFixed(1)}x${box.height.toFixed(1)}px`);
        }
      }
    }
    results['5. Touch Targets >= 44px on all buttons and pills'] = {
      pass: touchFailures.length === 0,
      details: touchFailures.length === 0 
        ? `All ${interactiveElements.length} buttons and pills have bounds >= 44px`
        : `Failures (${touchFailures.length}): ${touchFailures.join('; ')}`
    };

    console.log('=== E2E AUDIT RESULTS FOR http://localhost:3000/exp/exp-hrc-2021 ===');
    console.log(JSON.stringify(results, null, 2));

    await page.screenshot({ path: 'tests/screenshots/exp_hrc_2021_verification.png', fullPage: true });

    // Final assertion check
    const allPassed = Object.values(results).every(r => r.pass);
    expect(allPassed).toBe(true);
  });
});
