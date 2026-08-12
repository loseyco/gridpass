import { test, expect } from '@playwright/test';

test('visually add new vehicle through /v/new form', async ({ page }) => {
  console.log("Navigating to http://localhost:3000/v/new ...");
  await page.goto('http://localhost:3000/v/new', { waitUntil: 'domcontentloaded' });

  console.log("Filling out Vehicle Identity...");
  await page.locator('input[placeholder="2024"]').fill('2024');
  
  const makeInput = page.locator('input[placeholder="e.g. Chevrolet"]');
  await makeInput.focus();
  await makeInput.fill('Ford');
  await makeInput.dispatchEvent('input');

  const modelInput = page.locator('input[placeholder="e.g. Corvette Stingray"]');
  await modelInput.focus();
  await modelInput.fill('Bronco');
  await modelInput.dispatchEvent('input');

  await page.locator('input[placeholder="e.g. 3LT Z51"]').fill('Wildtrak');
  await page.locator('input[placeholder="e.g. Torch Red"]').fill('Velocity Blue');

  console.log("Filling out Powertrain & Drivetrain Specs...");
  await page.locator('input[placeholder="e.g. 6.2L LT2 V8 - 495 HP"]').fill('2.7L EcoBoost V6 - 330 HP');
  await page.locator('input[placeholder="e.g. Tremec 8-Speed Dual-Clutch / 6-Speed Manual"]').fill('10-Speed SelectShift Automatic');
  await page.locator('input[placeholder="e.g. Electronic Limited-Slip (eLSD) / Dana 44"]').fill('Dana AdvanTEK M220 Rear Axle w/ Locker');
  await page.locator('input[placeholder="e.g. 3.73 / 4.10 / 4.56"]').fill('4.70 Final Drive Ratio');

  console.log("Filling out Build Modifications...");
  await page.locator('textarea[placeholder*="Borla ATAK"]').fill('Baja Designs LP6 Pro LED Driving Lights\nFabtech 3-Inch Dirt Logic Lift Kit\nBFGoodrich 37-Inch KO2 All-Terrain Tires');

  console.log("Submitting Vehicle Creation Form...");
  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  await page.waitForTimeout(4000);
  console.log("Current URL after submission:", page.url());
  expect(page.url()).toContain('/v/');
});
