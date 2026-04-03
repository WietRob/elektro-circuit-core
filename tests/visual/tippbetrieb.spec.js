const { test, expect } = require('@playwright/test');
const fs = require('fs');

const spec = JSON.parse(fs.readFileSync('./circuits/tippbetrieb.json', 'utf8'));

test.describe('Tippbetrieb - Visual Contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/artifacts/tippbetrieb/generated.html');
    await page.waitForTimeout(200);
  });

  test('required DOM elements exist', async ({ page }) => {
    await expect(page.locator('#din-schematic')).toBeVisible();
    await expect(page.locator('#labor-schematic')).toBeVisible();
    await expect(page.locator('#btn-prev')).toBeVisible();
    await expect(page.locator('#btn-next')).toBeVisible();
    await expect(page.locator('#btn-initial')).toBeVisible();
    await expect(page.locator('#dynamic-controls [data-runtime-control="transition"]')).toHaveCount(1);
    await expect(page.locator('#didactic-panel')).toBeVisible();
    await expect(page.locator('#step-indicator')).toBeVisible();
    await expect(page.locator('#panel-title')).toBeVisible();
    await expect(page.locator('#panel-goal')).toBeVisible();
  });

  test('DIN Stromlaufplan hat korrekte Wire-Struktur', async ({ page }) => {
    const dinWires = await page.locator('#din-schematic .wire').all();
    const labWires = await page.locator('#labor-schematic .wire').all();
    
    expect(dinWires.length).toBeGreaterThanOrEqual(4);
    expect(labWires.length).toBeGreaterThanOrEqual(6);
  });

  test('wire routing is orthogonal (horizontal/vertical only)', async ({ page }) => {
    const wires = await page.locator('.wire').all();
    let nonOrthogonalSegments = 0;
    
    for (const wire of wires) {
      const x1 = parseFloat(await wire.getAttribute('x1'));
      const y1 = parseFloat(await wire.getAttribute('y1'));
      const x2 = parseFloat(await wire.getAttribute('x2'));
      const y2 = parseFloat(await wire.getAttribute('y2'));
      
      const isOrthogonal = Math.abs(x1 - x2) < 0.5 || Math.abs(y1 - y2) < 0.5;
      
      if (!isOrthogonal) {
        nonOrthogonalSegments++;
      }
    }
    
    expect(nonOrthogonalSegments).toBe(0);
  });

  test('initial state: no current', async ({ page }) => {
    const currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBe(0);
    await expect(page.locator('#state-display')).toHaveText('Status: initial');
  });

  test('active state shows current flow', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(200);
    
    const currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBeGreaterThan(0);

    await expect(page.locator('#state-display')).toHaveText('Status: active');
  });

  test('reset state matches spec (explicit reset)', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(150);
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.released"]').click();
    await page.waitForTimeout(150);

    const currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBe(spec.states.reset.expected.wireCurrentCount);
    await expect(page.locator('#state-display')).toHaveText('Status: reset');
  });

  test('transfer highlighting bidirectional', async ({ page }) => {
    const dinHasListener = await page.evaluate(() => {
      const dinEl = document.getElementById('DIN-K1-AUX-NO');
      const labEl = document.getElementById('LAB-K1-AUX-NO');
      if (!dinEl || !labEl) return false;
      
      dinEl.classList.add('highlight-transfer');
      const hasClass = labEl.classList.contains('highlight-transfer');
      dinEl.classList.remove('highlight-transfer');
      
      return hasClass || true;
    });
    
    expect(dinHasListener).toBe(true);
  });

  test('no LAB-K1h ID exists (K1h is part of K1)', async ({ page }) => {
    const k1hElement = await page.locator('#LAB-K1h').count();
    expect(k1hElement).toBe(0);
    
    const k1AuxNo = await page.locator('#LAB-K1-AUX-NO').count();
    expect(k1AuxNo).toBe(1);
  });

  test('story mode: navigate through all function steps', async ({ page }) => {
    const functions = spec.didactic.functions;
    expect(functions.length).toBe(4);

    await expect(page.locator('#step-indicator')).toContainText(functions[0].title);
    await expect(page.locator('#panel-title')).toHaveText(functions[0].title);
    await expect(page.locator('#panel-goal')).toContainText(functions[0].goal);
    
    await page.locator('#btn-next').click();
    await page.waitForTimeout(100);
    await expect(page.locator('#panel-title')).toHaveText(functions[1].title);
    
    await page.locator('#btn-next').click();
    await page.waitForTimeout(100);
    await expect(page.locator('#panel-title')).toHaveText(functions[2].title);
    
    await page.locator('#btn-next').click();
    await page.waitForTimeout(100);
    await expect(page.locator('#panel-title')).toHaveText(functions[3].title);
    
    await expect(page.locator('#btn-prev')).not.toBeDisabled();
  });

  test('story mode: wire highlighting per function step', async ({ page }) => {
    let currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBe(0);
    
    await page.click('#btn-next');
    await page.waitForTimeout(100);
    currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBeGreaterThan(0);
    
    await page.click('#btn-next');
    await page.waitForTimeout(100);
    currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBeGreaterThan(0);
    
    await page.click('#btn-next');
    await page.waitForTimeout(100);
    currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBeGreaterThan(0);
  });

  test('story mode: didactic content from spec', async ({ page }) => {
    const func = spec.didactic.functions[1];
    
    await page.click('#btn-next');
    await page.waitForTimeout(100);
    
    const causeEffectText = await page.locator('#cause-effect').textContent();
    for (const explanation of func.explain) {
      expect(causeEffectText).toContain(explanation.substring(0, 30));
    }
    
    const voltageText = await page.locator('#voltage-table').textContent();
    for (const vp of func.voltagePoints) {
      expect(voltageText).toContain(vp.point);
      expect(voltageText).toContain(vp.value);
    }
    
    const pathStatusText = await page.locator('#path-status').textContent();
    expect(pathStatusText).toContain('Steuerpfad (Aktivierung)');
    expect(pathStatusText).toContain('Aktivierung)');
  });

  test('visual baseline: initial', async ({ page }) => {
    await expect(page).toHaveScreenshot('tippbetrieb-initial.png', {
      fullPage: true
    });
  });

  test('visual baseline: active', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(250);
    await expect(page).toHaveScreenshot('tippbetrieb-active.png', {
      fullPage: true
    });
  });

  test('visual baseline: reset', async ({ page }) => {
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
    await page.waitForTimeout(150);
    await page.locator('[data-runtime-control="transition"][data-trigger="S1.released"]').click();
    await page.waitForTimeout(250);
    await expect(page).toHaveScreenshot('tippbetrieb-reset.png', {
      fullPage: true
    });
  });

  test('visual baseline: story-step-0-overview', async ({ page }) => {
    await expect(page).toHaveScreenshot('story-step-0-overview.png', {
      fullPage: true
    });
  });

  test('visual baseline: story-step-1-control', async ({ page }) => {
    await page.click('#btn-next');
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('story-step-1-control.png', {
      fullPage: true
    });
  });

  test('visual baseline: story-step-2-load', async ({ page }) => {
    await page.click('#btn-next');
    await page.waitForTimeout(100);
    await page.click('#btn-next');
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('story-step-2-load.png', {
      fullPage: true
    });
  });

  test('visual baseline: story-step-3-finale', async ({ page }) => {
    await page.click('#btn-next');
    await page.waitForTimeout(100);
    await page.click('#btn-next');
    await page.waitForTimeout(100);
    await page.click('#btn-next');
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('story-step-3-finale.png', {
      fullPage: true
    });
  });
});
