const { test, expect } = require('@playwright/test');

test.describe('Tippbetrieb - Runtime-Verifikation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/artifacts/tippbetrieb/generated.html');
    await page.waitForTimeout(200);
  });

  test('Initial: Runtime-State ist initial', async ({ page }) => {
    expect(await page.evaluate(() => window.currentState)).toBe('initial');
    expect(await page.locator('body').getAttribute('data-runtime-state')).toBe('initial');
  });

  test('Initial: Kein Strom (keine wire-current)', async ({ page }) => {
    const currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBe(0);
  });

  test('Transition: S1.pressed → active State', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    expect(await page.evaluate(() => window.currentState)).toBe('active');
    expect(await page.locator('body').getAttribute('data-runtime-state')).toBe('active');
  });

  test('Transition: S1.pressed → Strom fließt', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    const currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBeGreaterThan(0);
  });

  test('Transition: S1.released → reset State', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(200);
    
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.released"]').click();
    await page.waitForTimeout(200);
    
    expect(await page.evaluate(() => window.currentState)).toBe('reset');
    expect(await page.locator('body').getAttribute('data-runtime-state')).toBe('reset');
  });

  test('Transition: S1.released → Kein Strom', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(200);
    
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.released"]').click();
    await page.waitForTimeout(200);
    
    const currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBe(0);
  });

  test('Dynamische Controls: Initial 1 Button, Active 1 Button', async ({ page }) => {
    expect(await page.locator('[data-runtime-control="transition"]').count()).toBe(1);
    
    await page.locator('[data-runtime-control="transition"]').first().click();
    await page.waitForTimeout(200);
    
    expect(await page.locator('[data-runtime-control="transition"]').count()).toBe(1);
  });
});
