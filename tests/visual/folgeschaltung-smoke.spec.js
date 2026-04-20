const { test, expect } = require('@playwright/test');

test.describe('Folgeschaltung - Generischer Runtime-Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/folgeschaltung_overlay.html');
    await page.waitForTimeout(200);
  });

  test('Initial: korrekte Anzahl dynamischer Controls', async ({ page }) => {
    const controls = await page.locator('[data-runtime-control="transition"]').count();
    expect(controls).toBe(1);
  });

  test('Transition: S1.pressed → k1_only', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    const runtimeState = await page.evaluate(() => window.currentState);
    expect(runtimeState).toBe('k1_only');
    
    const p1State = await page.locator('#DIN-P1-LAMP').getAttribute('data-projected-state');
    expect(p1State).toBe('lit');
  });

  test('Transition: S2.pressed → k1_and_k2', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    await page.locator('[data-runtime-control="transition"][data-trigger="S2.pressed"]').click();
    await page.waitForTimeout(300);
    
    const runtimeState = await page.evaluate(() => window.currentState);
    expect(runtimeState).toBe('k1_and_k2');
    
    const p2State = await page.locator('#DIN-P2-LAMP').getAttribute('data-projected-state');
    expect(p2State).toBe('lit');
  });
});
