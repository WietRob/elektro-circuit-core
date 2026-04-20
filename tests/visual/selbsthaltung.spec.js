const { test, expect } = require('@playwright/test');

test.describe('Selbsthaltung - Generalisierungsnachweis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selbsthaltung_overlay.html');
    await page.waitForTimeout(200);
  });

  test.describe('DOM Struktur', () => {
    test('Alle Bauteile vorhanden: S2, S1, K1, P1', async ({ page }) => {
      await expect(page.locator('#DIN-S2-BUTTON')).toBeVisible();
      await expect(page.locator('#DIN-S1-BUTTON')).toBeVisible();
      await expect(page.locator('#DIN-K1-COIL')).toBeVisible();
      await expect(page.locator('#DIN-P1-LAMP')).toBeVisible();
    });

    test('S2 (Oeffner) hat korrekte NC-Darstellung', async ({ page }) => {
      const s2Offen = page.locator('#DIN-S2-BUTTON-offen');
      const s2Zu = page.locator('#DIN-S2-BUTTON-zu');
      await expect(s2Offen).toHaveAttribute('style', /display:\s*none/);
      const zuStyle = await s2Zu.getAttribute('style');
      expect(zuStyle === null || !zuStyle.includes('display:none')).toBe(true);
    });

    test('Mechanische Kopplung: Linie + Label', async ({ page }) => {
      const kopplungLinie = page.locator('line[stroke-dasharray="8,4"]');
      const kopplungText = page.locator('text:has-text("mechanisch gekoppelt")');
      await expect(kopplungLinie).toHaveCount(1);
      await expect(kopplungText).toContainText('Spule → K1h');
    });
  });

  test.describe('Orthogonale Verdrahtung', () => {
    test('Keine diagonalen Leitungen', async ({ page }) => {
      const wires = await page.locator('.wire').all();
      expect(wires.length).toBeGreaterThan(0);
      
      for (const wire of wires) {
        const x1 = parseFloat(await wire.getAttribute('x1'));
        const y1 = parseFloat(await wire.getAttribute('y1'));
        const x2 = parseFloat(await wire.getAttribute('x2'));
        const y2 = parseFloat(await wire.getAttribute('y2'));
        
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        const isHorizontal = dy < 0.5;
        const isVertical = dx < 0.5;
        
        expect(isHorizontal || isVertical).toBe(true);
      }
    });
  });

  test.describe('Zustandsautomaten', () => {
    test('Initial: Kein Strom, S2 geschlossen', async ({ page }) => {
      const stateDisplay = page.locator('#state-display');
      await expect(stateDisplay).toContainText('initial');
      const s2Component = page.locator('#DIN-S2-BUTTON');
      await expect(s2Component).toHaveAttribute('data-projected-state', 'closed');
    });

    test('Start: S1 druecken aktiviert Selbsthaltung', async ({ page }) => {
      await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
      await page.waitForTimeout(200);
      
      const stateDisplay = page.locator('#state-display');
      await expect(stateDisplay).toContainText('active');
    });

    test('Selbsthaltung: K1h haelt nach S1 loslassen', async ({ page }) => {
      await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
      await page.waitForTimeout(200);
      
      const k1hZu = page.locator('#DIN-K1-AUX-NO-zu');
      const zuStyle = await k1hZu.getAttribute('style');
      expect(zuStyle === null || !zuStyle.includes('display:none')).toBe(true);
    });

    test('Stopp: S2 druecken unterbricht Selbsthaltung', async ({ page }) => {
      await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
      await page.waitForTimeout(200);
      
      await page.locator('[data-runtime-control="transition"][data-trigger="S2.pressed"]').click();
      await page.waitForTimeout(200);
      
      const stateDisplay = page.locator('#state-display');
      await expect(stateDisplay).toContainText('reset');
    });
  });

  test.describe('Story-Mode', () => {
    test('Story hat 5 Schritte mit self_hold Erklaerung', async ({ page }) => {
      const steps = ['Überblick', 'Starten', 'Selbsthaltung', 'Stoppen', 'Komplett'];
      
      for (let i = 0; i < steps.length; i++) {
        const title = page.locator('#panel-title');
        const titleText = await title.textContent();
        expect(titleText).toContain(steps[i]);
        
        await page.click('#btn-next');
        await page.waitForTimeout(100);
      }
    });

    test('Selbsthaltung-Schritt erklaert Memory-Funktion', async ({ page }) => {
      await page.click('#btn-next');
      await page.click('#btn-next');
      await page.waitForTimeout(100);
      
      const title = page.locator('#panel-title');
      const titleText = await title.textContent();
      expect(titleText).toContain('Selbsthaltung');
      
      const explain = page.locator('#cause-effect');
      const text = await explain.textContent();
      expect(text).toMatch(/hält sich selbst|haelt sich selbst|Memory|parallel/i);
    });
  });

  test.describe('Transfer DIN ↔ LAB', () => {
    test('DIN-S2 hover highlightet LAB-S2 via data-transfer-active', async ({ page }) => {
      const labS2 = page.locator('#LAB-S2-BUTTON');
      
      await page.evaluate(() => {
        const dinS2 = document.getElementById('DIN-S2-BUTTON');
        if (dinS2) {
          dinS2.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
        }
      });
      await page.waitForTimeout(100);
      
      await expect(labS2).toHaveAttribute('data-transfer-active', 'true');
      await expect(labS2).toHaveAttribute('data-transfer-source', 'DIN-S2-BUTTON');
      
      await page.evaluate(() => {
        const dinS2 = document.getElementById('DIN-S2-BUTTON');
        if (dinS2) {
          dinS2.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse' }));
        }
      });
      await page.waitForTimeout(100);
      
      await expect(labS2).not.toHaveAttribute('data-transfer-active');
    });
    
    test('Bidirektional: LAB-S2 hover highlightet DIN-S2', async ({ page }) => {
      const dinS2 = page.locator('#DIN-S2-BUTTON');
      
      await page.evaluate(() => {
        const labS2 = document.getElementById('LAB-S2-BUTTON');
        if (labS2) {
          labS2.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
        }
      });
      await page.waitForTimeout(100);
      
      await expect(dinS2).toHaveAttribute('data-transfer-active', 'true');
      await expect(dinS2).toHaveAttribute('data-transfer-source', 'LAB-S2-BUTTON');
    });
  });

  test.describe('Responsive', () => {
    test('Mobile: Tab-Switch funktioniert', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(100);
      
      const labTab = page.locator('.view-tab[data-view="lab"]');
      await labTab.click();
      await page.waitForTimeout(100);
      
      const labView = page.locator('#lab-view');
      await expect(labView).toHaveClass(/active/);
    });

    test('Zoom-Controls vorhanden', async ({ page }) => {
      const zoomButtons = page.locator('.zoom-controls button');
      await expect(zoomButtons).toHaveCount(8);
      
      const labels = ['Fit', '100%', '125%', '150%'];
      for (const label of labels) {
        const buttons = page.locator(`.zoom-controls button:has-text("${label}")`);
        await expect(buttons).toHaveCount(2);
      }
    });
  });

  test.describe('Visual Baseline', () => {
    test('Screenshot: Initial-Zustand', async ({ page }) => {
      await expect(page).toHaveScreenshot('selbsthaltung-initial.png', {
        maxDiffPixels: 100
      });
    });

    test('Screenshot: Aktiv (Selbsthaltung)', async ({ page }) => {
      await page.locator('[data-runtime-control="transition"][data-trigger="S1.pressed"]').click();
      await page.waitForTimeout(200);
      
      await expect(page).toHaveScreenshot('selbsthaltung-active.png', {
        maxDiffPixels: 100
      });
    });
  });
});
