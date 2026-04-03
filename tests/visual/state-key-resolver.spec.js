const { test, expect } = require('@playwright/test');

test.describe('State-Key-Resolver Unit Tests', () => {
  
  test('Format 1: Single-Part Komponente (S2 → S2-BUTTON)', async ({ page }) => {
    await page.goto('/artifacts/selbsthaltung/generated.html');
    await page.waitForTimeout(200);
    
    const result = await page.evaluate(() => {
      return resolveStateKey('S2');
    });
    
    expect(result).not.toBeNull();
    expect(result.partType).toBe('button_mechanism');
    expect(result.fullPartId).toBe('S2-BUTTON');
    expect(result.componentId).toBe('S2');
  });

  test('Format 2: Direkter Part-Key (K1-COIL)', async ({ page }) => {
    await page.goto('/artifacts/selbsthaltung/generated.html');
    await page.waitForTimeout(200);
    
    const result = await page.evaluate(() => {
      return resolveStateKey('K1-COIL');
    });
    
    expect(result).not.toBeNull();
    expect(result.partType).toBe('coil');
    expect(result.fullPartId).toBe('K1-COIL');
    expect(result.componentId).toBe('K1');
  });

  test('Format 2: Direkter Part-Key mit Bindestrich (K1-AUX-NO)', async ({ page }) => {
    await page.goto('/artifacts/selbsthaltung/generated.html');
    await page.waitForTimeout(200);
    
    const result = await page.evaluate(() => {
      return resolveStateKey('K1-AUX-NO');
    });
    
    expect(result).not.toBeNull();
    expect(result.partType).toBe('aux_no');
    expect(result.fullPartId).toBe('K1-AUX-NO');
    expect(result.componentId).toBe('K1');
  });

  test('Format 1: Lamp (P1 → P1-LAMP)', async ({ page }) => {
    await page.goto('/artifacts/selbsthaltung/generated.html');
    await page.waitForTimeout(200);
    
    const result = await page.evaluate(() => {
      return resolveStateKey('P1');
    });
    
    expect(result).not.toBeNull();
    expect(result.partType).toBe('lamp_element');
    expect(result.fullPartId).toBe('P1-LAMP');
    expect(result.componentId).toBe('P1');
  });

  test('Ungültiger Key gibt null zurück', async ({ page }) => {
    await page.goto('/artifacts/selbsthaltung/generated.html');
    await page.waitForTimeout(200);
    
    const result = await page.evaluate(() => {
      return resolveStateKey('NICHT-EXISTENT');
    });
    
    expect(result).toBeNull();
  });

  test('Folgeschaltung: K2-COIL', async ({ page }) => {
    await page.goto('/artifacts/folgeschaltung/generated.html');
    await page.waitForTimeout(200);
    
    const result = await page.evaluate(() => {
      return resolveStateKey('K2-COIL');
    });
    
    expect(result).not.toBeNull();
    expect(result.partType).toBe('coil');
    expect(result.fullPartId).toBe('K2-COIL');
    expect(result.componentId).toBe('K2');
  });

  test('Folgeschaltung: P2 (single-part)', async ({ page }) => {
    await page.goto('/artifacts/folgeschaltung/generated.html');
    await page.waitForTimeout(200);
    
    const result = await page.evaluate(() => {
      return resolveStateKey('P2');
    });
    
    expect(result).not.toBeNull();
    expect(result.partType).toBe('lamp_element');
    expect(result.fullPartId).toBe('P2-LAMP');
    expect(result.componentId).toBe('P2');
  });
});
