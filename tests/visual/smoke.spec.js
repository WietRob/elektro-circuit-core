const { test, expect } = require('@playwright/test');

test.describe('Runtime Smoke Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selbsthaltung_overlay.html');
    await page.waitForTimeout(200);
  });

  test('Initial: dynamische Controls existieren', async ({ page }) => {
    const controls = await page.locator('.controls .trigger-btn').count();
    expect(controls).toBeGreaterThanOrEqual(1);
  });

  test('Initial: Button hat semantische data-Attribute', async ({ page }) => {
    const btn = await page.locator('[data-runtime-control="transition"]').first();
    await expect(btn).toHaveAttribute('data-trigger', 'S1.pressed');
    await expect(btn).toHaveAttribute('data-runtime-target', 'active');
  });

  test('Transition: S1.pressed wechselt zu active State', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    const runtimeState = await page.evaluate(() => window.currentState);
    expect(runtimeState).toBe('active');
    
    const bodyState = await page.locator('body').getAttribute('data-runtime-state');
    expect(bodyState).toBe('active');
  });
});
