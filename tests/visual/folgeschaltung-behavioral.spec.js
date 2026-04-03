const { test, expect } = require('@playwright/test');

test.describe('Folgeschaltung - Behavioral Gate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/artifacts/folgeschaltung/generated.html');
    await page.waitForTimeout(200);
  });

  test('Initial: Runtime-State korrekt', async ({ page }) => {
    const runtimeState = await page.evaluate(() => window.currentState);
    expect(runtimeState).toBe('initial');
    
    const bodyState = await page.locator('body').getAttribute('data-runtime-state');
    expect(bodyState).toBe('initial');
  });

  test('Initial: Component-States korrekt', async ({ page }) => {
    expect(await page.locator('#DIN-S1-BUTTON').getAttribute('data-projected-state')).toBe('open');
    expect(await page.locator('#DIN-K1-AUX-NO').getAttribute('data-projected-state')).toBe('open');
    expect(await page.locator('#DIN-P1-LAMP').getAttribute('data-projected-state')).toBe('dark');
    expect(await page.locator('#DIN-P2-LAMP').getAttribute('data-projected-state')).toBe('dark');
  });

  test('Transition: S1.pressed → k1_only State', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    expect(await page.evaluate(() => window.currentState)).toBe('k1_only');
    expect(await page.locator('body').getAttribute('data-runtime-state')).toBe('k1_only');
  });

  test('Transition: S1.pressed → K1 aktiv, P1 leuchtet', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    expect(await page.locator('#DIN-K1-AUX-NO').getAttribute('data-projected-state')).toBe('closed');
    expect(await page.locator('#DIN-P1-LAMP').getAttribute('data-projected-state')).toBe('lit');
    expect(await page.locator('#DIN-P2-LAMP').getAttribute('data-projected-state')).toBe('dark');
  });

  test('Transition: S2.pressed → k1_and_k2 State', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    await page.locator('[data-runtime-control="transition"][data-trigger="S2.pressed"]').click();
    await page.waitForTimeout(300);
    
    expect(await page.evaluate(() => window.currentState)).toBe('k1_and_k2');
    expect(await page.locator('body').getAttribute('data-runtime-state')).toBe('k1_and_k2');
  });

  test('Transition: S2.pressed → K2 aktiv, P2 leuchtet', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    await page.locator('[data-runtime-control="transition"][data-trigger="S2.pressed"]').click();
    await page.waitForTimeout(300);
    
    expect(await page.locator('#DIN-K1-AUX-NO').getAttribute('data-projected-state')).toBe('closed');
    expect(await page.locator('#DIN-K2-AUX-NO').getAttribute('data-projected-state')).toBe('closed');
    expect(await page.locator('#DIN-P1-LAMP').getAttribute('data-projected-state')).toBe('lit');
    expect(await page.locator('#DIN-P2-LAMP').getAttribute('data-projected-state')).toBe('lit');
  });

  test('State-Machine: Zustände sind erreichbar', async ({ page }) => {
    const states = ['initial', 'k1_only', 'k1_and_k2'];
    
    expect(await page.evaluate(() => window.currentState)).toBe('initial');
    
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.currentState)).toBe('k1_only');
    
    await page.locator('[data-runtime-control="transition"][data-trigger="S2.pressed"]').click();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.currentState)).toBe('k1_and_k2');
  });
});
