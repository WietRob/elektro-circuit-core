const { test, expect } = require('@playwright/test');

/**
 * Behavioral Gate Test
 * 
 * Blockierender Test: Prüft ob die Runtime-Semantik korrekt funktioniert.
 * Trigger → State-Transition → DOM-Projection
 */

test.describe('Behavioral Gate: Runtime-Semantik', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/artifacts/selbsthaltung/generated.html');
    await page.waitForTimeout(200);
  });

  test('Initial: Runtime-State korrekt projiziert', async ({ page }) => {
    // 1. Prüfe Runtime-State
    const runtimeState = await page.evaluate(() => window.currentState);
    expect(runtimeState).toBe('initial');
    
    // 2. Prüfe DOM-Attribute
    const bodyState = await page.locator('body').getAttribute('data-runtime-state');
    expect(bodyState).toBe('initial');
    
    // 3. Prüfe Component-States
    const s2State = await page.locator('#DIN-S2-BUTTON').getAttribute('data-projected-state');
    expect(s2State).toBe('closed');
    
    const k1AuxState = await page.locator('#DIN-K1-AUX-NO').getAttribute('data-projected-state');
    expect(k1AuxState).toBe('open');
    
    const p1State = await page.locator('#DIN-P1-LAMP').getAttribute('data-projected-state');
    expect(p1State).toBe('dark');
  });

  test('Transition: S1.pressed → active State', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    // 1. Prüfe Runtime-State
    const runtimeState = await page.evaluate(() => window.currentState);
    expect(runtimeState).toBe('active');
    
    // 2. Prüfe DOM-Attribute
    const bodyState = await page.locator('body').getAttribute('data-runtime-state');
    expect(bodyState).toBe('active');
    
    // 3. Prüfe Component-States im active Zustand
    const s2State = await page.locator('#DIN-S2-BUTTON').getAttribute('data-projected-state');
    expect(s2State).toBe('closed'); // S2 bleibt geschlossen
    
    const k1AuxState = await page.locator('#DIN-K1-AUX-NO').getAttribute('data-projected-state');
    expect(k1AuxState).toBe('closed'); // K1h schließt sich
    
    const p1State = await page.locator('#DIN-P1-LAMP').getAttribute('data-projected-state');
    expect(p1State).toBe('lit'); // P1 leuchtet
    
    // 4. Prüfe aktive Pfade über data-path-active Attribut
    const controlPathActive = await page.locator('#din-wire-s1-k1-seg0').getAttribute('data-path-active');
    expect(controlPathActive).toBe('true');
  });

  test('Transition: S2.pressed → reset State', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(300);
    
    await page.locator('[data-runtime-control="transition"][data-trigger="S2.pressed"]').click();
    await page.waitForTimeout(300);
    
    // Prüfe Runtime-State
    const runtimeState = await page.evaluate(() => window.currentState);
    expect(runtimeState).toBe('reset');
    
    // Prüfe Component-States
    const s2State = await page.locator('#DIN-S2-BUTTON').getAttribute('data-projected-state');
    expect(s2State).toBe('open'); // S2 öffnet
    
    const k1AuxState = await page.locator('#DIN-K1-AUX-NO').getAttribute('data-projected-state');
    expect(k1AuxState).toBe('open'); // K1h öffnet
    
    const p1State = await page.locator('#DIN-P1-LAMP').getAttribute('data-projected-state');
    expect(p1State).toBe('dark'); // P1 dunkel
  });
});
