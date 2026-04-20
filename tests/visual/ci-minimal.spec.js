const { test, expect } = require('@playwright/test');

const CIRCUITS = [
  { name: 'selbsthaltung', url: '/selbsthaltung_overlay.html' },
  { name: 'tippbetrieb', url: '/tippbetrieb_overlay.html' },
  { name: 'folgeschaltung', url: '/folgeschaltung_overlay.html' }
];

/**
 * CI-Minimal: Statische Struktur- und Layout-Tests.
 *
 * Diese Tests prüfen nur das, was der aktuelle Generator
 * garantiert ausgibt – keine Runtime-Features, keine Story-Mode-Elemente.
 *
 * Ziel: Schnell, stabil, reproduzierbar. Geeignet für CI in Batch 3C.
 */

for (const circuit of CIRCUITS) {
  test.describe(`CI-Minimal: ${circuit.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(circuit.url);
      await page.waitForTimeout(200);
    });

    test('DIN- und LAB-Ansicht sind vorhanden', async ({ page }) => {
      await expect(page.locator('#din-schematic')).toBeVisible();
      await expect(page.locator('#labor-schematic')).toBeVisible();
    });

    test('Rails sind vorhanden und korrekt gefärbt', async ({ page }) => {
      const dinRailL = page.locator('#DIN-RAIL-L');
      const dinRailN = page.locator('#DIN-RAIL-N');
      const labRailL = page.locator('#LAB-RAIL-L');
      const labRailN = page.locator('#LAB-RAIL-N');

      await expect(dinRailL).toHaveAttribute('stroke', '#795548');
      await expect(dinRailN).toHaveAttribute('stroke', '#1e88e5');
      await expect(labRailL).toHaveAttribute('fill', '#e53935');
      await expect(labRailN).toHaveAttribute('fill', '#1e88e5');
    });

    test('Alle Wires sind orthogonal (horizontal oder vertikal)', async ({ page }) => {
      const wires = await page.locator('.wire').all();
      expect(wires.length).toBeGreaterThan(0);

      let violations = 0;
      for (const wire of wires) {
        const x1 = parseFloat(await wire.getAttribute('x1'));
        const y1 = parseFloat(await wire.getAttribute('y1'));
        const x2 = parseFloat(await wire.getAttribute('x2'));
        const y2 = parseFloat(await wire.getAttribute('y2'));

        const isHorizontal = Math.abs(y1 - y2) < 0.5;
        const isVertical = Math.abs(x1 - x2) < 0.5;

        if (!isHorizontal && !isVertical) {
          violations++;
        }
      }
      expect(violations, `${violations} nicht-orthogonale Wires gefunden`).toBe(0);
    });

    test('SVG viewBox ist 700x400', async ({ page }) => {
      const dinSvg = page.locator('#din-schematic');
      const labSvg = page.locator('#labor-schematic');
      await expect(dinSvg).toHaveAttribute('viewBox', '0 0 700 400');
      await expect(labSvg).toHaveAttribute('viewBox', '0 0 700 400');
    });

    test('Controls sind vorhanden', async ({ page }) => {
      await expect(page.locator('.controls')).toBeVisible();
      await expect(page.locator('#state-display')).toContainText('Status:');

      const triggerBtns = page.locator('.trigger-btn');
      const count = await triggerBtns.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Reset-Button ist vorhanden', async ({ page }) => {
      await expect(page.locator('#btn-reset')).toBeVisible();
    });
  });
}
