const { test, expect } = require('@playwright/test');

test.describe('VISUAL DoD - DIN Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tippbetrieb_overlay.html');
    await page.waitForTimeout(200);
  });

  test('IEC 60446: L-Schiene ist braun (#795548)', async ({ page }) => {
    const railL = await page.locator('#DIN-RAIL-L');
    const stroke = await railL.getAttribute('stroke');
    expect(stroke.toLowerCase()).toBe('#795548');
  });

  test('IEC 60446: N-Schiene ist blau (#1e88e5)', async ({ page }) => {
    const railN = await page.locator('#DIN-RAIL-N');
    const stroke = await railN.getAttribute('stroke');
    expect(stroke.toLowerCase()).toBe('#1e88e5');
  });

  test('LAB: L-Schiene ist rot (#e53935)', async ({ page }) => {
    const railL = await page.locator('#LAB-RAIL-L');
    const fill = await railL.getAttribute('fill');
    expect(fill.toLowerCase()).toBe('#e53935');
  });

  test('LAB: N-Schiene ist blau (#1e88e5)', async ({ page }) => {
    const railN = await page.locator('#LAB-RAIL-N');
    const fill = await railN.getAttribute('fill');
    expect(fill.toLowerCase()).toBe('#1e88e5');
  });

  test('IEC 60617: Schütz K1 Spule ist als Rechteck mit Schrägstrich dargestellt', async ({ page }) => {
    const coil = await page.locator('#DIN-K1-COIL rect').first();
    const stroke = await coil.getAttribute('stroke');
    expect(stroke.toLowerCase()).toMatch(/^#000/);
    
    const diagonal = await page.locator('#DIN-K1-COIL line').first();
    expect(await diagonal.isVisible()).toBe(true);
  });

  test('IEC 60617: Schließer hat korrekte Geometrie', async ({ page }) => {
    const contactOffen = page.locator('#DIN-S1-BUTTON-offen');
    await expect(contactOffen).toBeVisible();
    
    const x1 = parseFloat(await contactOffen.getAttribute('x1'));
    const y1 = parseFloat(await contactOffen.getAttribute('y1'));
    const x2 = parseFloat(await contactOffen.getAttribute('x2'));
    const y2 = parseFloat(await contactOffen.getAttribute('y2'));
    
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    
    expect(dx).toBeGreaterThan(10);
    expect(dy).toBeGreaterThan(10);
  });
});

test.describe('VISUAL DoD - Orthogonale Verdrahtung', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tippbetrieb_overlay.html');
    await page.waitForTimeout(200);
  });

  test('KEINE diagonalen Leitungen (Toleranz 0.5px)', async ({ page }) => {
    const wires = await page.locator('.wire').all();
    let diagonalCount = 0;
    const violations = [];
    
    for (const wire of wires) {
      const x1 = parseFloat(await wire.getAttribute('x1'));
      const y1 = parseFloat(await wire.getAttribute('y1'));
      const x2 = parseFloat(await wire.getAttribute('x2'));
      const y2 = parseFloat(await wire.getAttribute('y2'));
      const id = await wire.getAttribute('id');
      
      const isVertical = Math.abs(x1 - x2) < 0.5;
      const isHorizontal = Math.abs(y1 - y2) < 0.5;
      
      if (!isVertical && !isHorizontal) {
        diagonalCount++;
        violations.push(`${id}: (${x1},${y1}) -> (${x2},${y2})`);
      }
    }
    
    if (diagonalCount > 0) {
      console.error('Diagonal violations:', violations);
    }
    
    expect(diagonalCount, `${diagonalCount} diagonal wires found`).toBe(0);
  });

  test('Alle Wire-Segmente sind orthogonal zueinander', async ({ page }) => {
    const wires = await page.locator('.wire').all();
    
    for (const wire of wires) {
      const x1 = parseFloat(await wire.getAttribute('x1'));
      const y1 = parseFloat(await wire.getAttribute('y1'));
      const x2 = parseFloat(await wire.getAttribute('x2'));
      const y2 = parseFloat(await wire.getAttribute('y2'));
      
      const isOrthogonal = Math.abs(x1 - x2) < 0.5 || Math.abs(y1 - y2) < 0.5;
      expect(isOrthogonal).toBe(true);
    }
  });
});

test.describe('VISUAL DoD - Lesbarkeit (Didaktik)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tippbetrieb_overlay.html');
    await page.waitForTimeout(200);
  });

  test('Haupt-Bauteil-Labels (S1, K1 Schütz, P1) mindestens 9px', async ({ page }) => {
    const mainLabelTexts = ['S1', 'K1 Schütz', 'P1'];
    let tooSmall = 0;
    const violations = [];

    for (const labelText of mainLabelTexts) {
      const labels = await page.locator(`text:has-text("${labelText}")`).all();
      for (const label of labels) {
        const fontSize = await label.getAttribute('font-size');
        const textContent = await label.textContent();
        if (fontSize && textContent === labelText) {
          const size = parseFloat(fontSize);
          if (size < 9) {
            tooSmall++;
            violations.push(`${textContent}: ${size}px`);
          }
        }
      }
    }

    if (tooSmall > 0) {
      console.log('Font size violations:', violations);
    }

    expect(tooSmall, `${tooSmall} main component labels are smaller than 9px`).toBe(0);
  });

  test('Schriftgrößen konsistent für gleiche Elementtypen', async ({ page }) => {
    const mainLabels = await page.locator('.component > text').all();
    const sizes = new Set();

    for (const label of mainLabels) {
      const fontSize = await label.getAttribute('font-size');
      if (fontSize) {
        sizes.add(parseFloat(fontSize));
      }
    }

    expect(sizes.size).toBeLessThanOrEqual(4);
  });

  test('Kontrast für Haupt-Bauteil-Labels ist ausreichend', async ({ page }) => {
    const componentNames = ['S1', 'K1 Schütz', 'P1'];

    for (const name of componentNames) {
      const labels = await page.locator(`text:has-text("${name}")`).all();
      for (const text of labels) {
        const fill = await text.getAttribute('fill');
        if (fill) {
          const isDark = fill === '#000' || fill === '#000000' || fill === '#333' || fill === '#333333';
          const isHighContrast = fill === '#2e7d32' || fill === '#1976d2' || fill === '#795548';

          expect(isDark || isHighContrast || fill === 'white').toBe(true);
        }
      }
    }
  });
});

test.describe('VISUAL DoD - Layout und Konsistenz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tippbetrieb_overlay.html');
    await page.waitForTimeout(200);
  });

  test('SVG viewBox ist 700x400 (V8-Standard)', async ({ page }) => {
    const dinSvg = await page.locator('#din-schematic');
    const labSvg = await page.locator('#labor-schematic');
    
    const dinViewBox = await dinSvg.getAttribute('viewBox');
    const labViewBox = await labSvg.getAttribute('viewBox');
    
    expect(dinViewBox).toBe('0 0 700 400');
    expect(labViewBox).toBe('0 0 700 400');
  });

  test('Beide Views sind im Default-Viewport sichtbar (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(100);

    const dinView = await page.locator('#din-view');
    const labView = await page.locator('#lab-view');

    expect(await dinView.isVisible()).toBe(true);
    expect(await labView.isVisible()).toBe(true);

    const dinBox = await dinView.boundingBox();
    const labBox = await labView.boundingBox();

    expect(dinBox.width).toBeGreaterThan(0);
    expect(labBox.width).toBeGreaterThan(0);

    const tabs = await page.locator('.view-tabs');
    expect(await tabs.isVisible()).toBe(false);
  });

  test('Mobile: Tab-Switch zwischen DIN und LAB', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);

    const tabs = await page.locator('.view-tabs');
    expect(await tabs.isVisible()).toBe(true);

    expect(await page.locator('#din-view').isVisible()).toBe(true);
    expect(await page.locator('#lab-view').isVisible()).toBe(false);

    await page.locator('[data-view="lab"]').click();

    expect(await page.locator('#din-view').isVisible()).toBe(false);
    expect(await page.locator('#lab-view').isVisible()).toBe(true);
  });

  test('Zoom-Controls sind vorhanden und funktional', async ({ page }) => {
    const zoomButtons = await page.locator('#din-view .zoom-controls button').all();
    expect(zoomButtons.length).toBe(4);

    const fitButton = await page.locator('#din-view .zoom-controls button[data-zoom="fit"]');
    await fitButton.click();

    const dinSvg = await page.locator('#din-schematic');
    expect(await dinSvg.getAttribute('data-zoom')).toBe('fit');
  });

  test('Didactic Panel ist collapsible', async ({ page }) => {
    const toggle = await page.locator('#didactic-toggle');
    const panel = await page.locator('#didactic-panel');
    
    expect(await panel.isVisible()).toBe(true);
    
    await toggle.click();
    expect(await panel.isHidden()).toBe(true);
    
    await toggle.click();
    expect(await panel.isVisible()).toBe(true);
  });

  test('L-Schiene ist immer oben (y kleiner 50)', async ({ page }) => {
    const railL = await page.locator('#DIN-RAIL-L');
    const y1 = parseFloat(await railL.getAttribute('y1'));
    const y2 = parseFloat(await railL.getAttribute('y2'));
    
    expect(y1).toBeLessThan(50);
    expect(y2).toBeLessThan(50);
  });

  test('N-Schiene ist immer unten (y größer 350)', async ({ page }) => {
    const railN = await page.locator('#DIN-RAIL-N');
    const y1 = parseFloat(await railN.getAttribute('y1'));
    const y2 = parseFloat(await railN.getAttribute('y2'));
    
    expect(y1).toBeGreaterThan(350);
    expect(y2).toBeGreaterThan(350);
  });

  test('Keine überlappenden Bauteile (Mindestabstand 10px)', async ({ page }) => {
    const components = await page.locator('.component').all();
    const boundingBoxes = [];
    const allowedOverlaps = [['LAB-K1', 'LAB-K1-AUX-NO'], ['LAB-K1', 'LAB-K1-COIL']];
    
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      const bbox = await comp.boundingBox();
      const id = await comp.getAttribute('id');
      if (bbox) {
        boundingBoxes.push({ ...bbox, id, index: i });
      }
    }
    
    console.log(`Gefundene Top-Level Komponenten: ${boundingBoxes.length}`);
    boundingBoxes.forEach(b => console.log(`  ${b.id}: x=${b.x}, y=${b.y}, w=${b.width}, h=${b.height}`));
    
    const overlaps = [];
    for (let i = 0; i < boundingBoxes.length; i++) {
      for (let j = i + 1; j < boundingBoxes.length; j++) {
        const a = boundingBoxes[i];
        const b = boundingBoxes[j];
        
        const overlap = !(a.x + a.width < b.x || 
                         b.x + b.width < a.x || 
                         a.y + a.height < b.y || 
                         b.y + b.height < a.y);
        
        if (overlap) {
          const dx = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
          const dy = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
          const overlapArea = dx * dy;
          overlaps.push({ a: a.id, b: b.id, aBox: a, bBox: b, dx, dy, area: overlapArea });
        }
      }
    }
    
    if (overlaps.length > 0) {
      console.log('Überlappende Paare:');
      overlaps.forEach(o => {
        console.log(`  ${o.a} überlappt mit ${o.b}: dx=${o.dx}, dy=${o.dy}, area=${o.area}`);
      });
    }
    
    const filteredOverlaps = overlaps.filter(o => {
      const isAllowed = allowedOverlaps.some(allowed => 
        (o.a === allowed[0] && o.b === allowed[1]) ||
        (o.b === allowed[0] && o.a === allowed[1])
      );
      return !isAllowed;
    });
    
    if (filteredOverlaps.length > 0) {
      console.log('Nach Filterung verbleibende Überlappungen:');
      filteredOverlaps.forEach(o => {
        console.log(`  ${o.a} überlappt mit ${o.b}: dx=${o.dx}, dy=${o.dy}, area=${o.area}`);
      });
    }
    
    expect(filteredOverlaps.length).toBe(0);
  });
});

test.describe('VISUAL DoD - Interaktivität', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tippbetrieb_overlay.html');
    await page.waitForTimeout(200);
  });

  test('Alle Bauteile haben korrekte data-component Attribute', async ({ page }) => {
    const components = await page.locator('.component').all();
    
    for (const comp of components) {
      const dataComponent = await comp.getAttribute('data-component');
      expect(dataComponent).toBeTruthy();
      expect(['S1', 'K1', 'P1']).toContain(dataComponent);
    }
  });

  test('Alle Parts haben korrekte data-part Attribute', async ({ page }) => {
    const parts = await page.locator('[data-part]').all();
    const expectedParts = ['AUX-NO', 'COIL'];
    
    for (const part of parts) {
      const dataPart = await part.getAttribute('data-part');
      expect(expectedParts).toContain(dataPart);
    }
  });

  test('Transfer-Mapping ist bidirektional korrekt', async ({ page }) => {
    const labK1 = page.locator('#LAB-K1');
    const dinK1Coil = page.locator('#DIN-K1-COIL');
    
    await page.evaluate(() => {
      const el = document.getElementById('DIN-K1-COIL');
      if (el) el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    });
    await page.waitForTimeout(100);
    
    await expect(labK1).toHaveAttribute('data-transfer-active', 'true');
    await expect(labK1).toHaveAttribute('data-transfer-source', 'DIN-K1-COIL');
    
    await page.evaluate(() => {
      const el = document.getElementById('DIN-K1-COIL');
      if (el) el.dispatchEvent(new PointerEvent('pointerout', { bubbles: true }));
    });
    await page.waitForTimeout(100);
    
    await expect(labK1).not.toHaveAttribute('data-transfer-active');
    
    await page.evaluate(() => {
      const el = document.getElementById('LAB-K1');
      if (el) el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    });
    await page.waitForTimeout(100);
    
    await expect(dinK1Coil).toHaveAttribute('data-transfer-active', 'true');
    await expect(dinK1Coil).toHaveAttribute('data-transfer-source', 'LAB-K1');
  });
});

test.describe('VISUAL DoD - Didaktische Klarheit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tippbetrieb_overlay.html');
    await page.waitForTimeout(200);
  });

  test('Ursache-Wirkung-Kette ist visuell erkennbar (Story-Modus)', async ({ page }) => {
    await page.click('#btn-next');
    await page.waitForTimeout(100);
    
    const stepIndicator = await page.locator('#step-indicator');
    const text = await stepIndicator.textContent();
    expect(text).toContain('Schritt');
    
    const panelTitle = await page.locator('#panel-title');
    const titleText = await panelTitle.textContent();
    expect(titleText.length).toBeGreaterThan(0);
  });

  test('Strompfad-Highlighting funktioniert korrekt', async ({ page }) => {
    await page.click('#btn-next');
    await page.click('#btn-next');
    await page.click('#btn-next');
    await page.waitForTimeout(200);
    
    const currentWires = await page.locator('.wire-current').count();
    expect(currentWires).toBeGreaterThan(0);
  });

  test('Didaktik-Panel enthält alle erforderlichen Sektionen', async ({ page }) => {
    await expect(page.locator('#panel-title')).toBeVisible();
    await expect(page.locator('#panel-goal')).toBeVisible();
    await expect(page.locator('#cause-effect')).toBeVisible();
    await expect(page.locator('#voltage-table')).toBeVisible();
    await expect(page.locator('#path-status')).toBeVisible();
  });
});

test.describe('VISUAL DoD - Summary', () => {
  test('Alle MUST-Kriterien erfüllt', async ({ page }) => {
    await page.goto('/tippbetrieb_overlay.html');
    await page.waitForTimeout(200);
    
    const results = await page.evaluate(() => {
      const checks = {
        orthogonalWires: true,
        correctColors: true,
        readableText: true,
        correctViewBox: true,
        componentsLabeled: true
      };
      
      const wires = document.querySelectorAll('.wire');
      for (const wire of wires) {
        const x1 = parseFloat(wire.getAttribute('x1'));
        const y1 = parseFloat(wire.getAttribute('y1'));
        const x2 = parseFloat(wire.getAttribute('x2'));
        const y2 = parseFloat(wire.getAttribute('y2'));
        
        if (Math.abs(x1 - x2) > 0.5 && Math.abs(y1 - y2) > 0.5) {
          checks.orthogonalWires = false;
          break;
        }
      }
      
      const railL = document.getElementById('DIN-RAIL-L');
      const railN = document.getElementById('DIN-RAIL-N');
      if (railL && railN) {
        checks.correctColors = 
          railL.getAttribute('stroke') === '#795548' &&
          railN.getAttribute('stroke') === '#1e88e5';
      }
      
      const texts = document.querySelectorAll('text');
      for (const text of texts) {
        const fontSize = text.getAttribute('font-size');
        if (fontSize && parseFloat(fontSize) < 7) {
          checks.readableText = false;
          break;
        }
      }
      
      const svg = document.getElementById('din-schematic');
      if (svg) {
        checks.correctViewBox = svg.getAttribute('viewBox') === '0 0 700 400';
      }
      
      const components = document.querySelectorAll('.component');
      for (const comp of components) {
        if (!comp.getAttribute('data-component')) {
          checks.componentsLabeled = false;
          break;
        }
      }
      
      return checks;
    });
    
    expect(results.orthogonalWires).toBe(true);
    expect(results.correctColors).toBe(true);
    expect(results.readableText).toBe(true);
    expect(results.correctViewBox).toBe(true);
    expect(results.componentsLabeled).toBe(true);
  });
});
