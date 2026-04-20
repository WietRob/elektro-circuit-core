const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Spec-to-DOM Coverage Gate
 * 
 * Blockierender Test: Jede Komponente/Part/Wire aus der Spec
 * muss eine sichtbare DOM-Repräsentation haben.
 * 
 * Dieser Test verhindert "Spec formal valide, aber Darstellung kaputt"-Szenarien.
 */

test.describe('Coverage Gate: Spec-to-DOM Validation', () => {
  const specPath = path.resolve(__dirname, '../../examples/selbsthaltung.json');
  let spec;
  
  test.beforeAll(() => {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  });
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/selbsthaltung_overlay.html');
    await page.waitForTimeout(200);
  });

  test.describe('Component Coverage', () => {
    test('Jede Component aus der Spec hat DOM-Repräsentation in DIN', async ({ page }) => {
      const components = Object.keys(spec.components);
      
      for (const componentId of components) {
        const dinElement = page.locator(`#DIN-${componentId}`);
        const count = await dinElement.count();
        
        if (count === 0) {
          // Fallback: Suche nach Component-Parts (z.B. K1-COIL, K1-AUX-NO)
          const component = spec.components[componentId];
          const parts = Object.keys(component.parts || {});
          let partFound = false;
          
          for (const partId of parts) {
            const partShort = partId.replace(`${componentId}-`, '');
            const partElement = page.locator(`#DIN-${componentId}-${partShort}`);
            if (await partElement.count() > 0) {
              partFound = true;
              break;
            }
          }
          
          expect(partFound, `Component ${componentId} hat keine DOM-Repräsentation`).toBe(true);
        }
      }
    });

    test('Jede Component aus der Spec hat DOM-Repräsentation in LAB', async ({ page }) => {
      const components = Object.keys(spec.components);
      
      for (const componentId of components) {
        const labElement = page.locator(`#LAB-${componentId}`);
        const count = await labElement.count();
        
        if (count === 0) {
          // Fallback: Suche nach Parts
          const component = spec.components[componentId];
          const parts = Object.keys(component.parts || {});
          let partFound = false;
          
          for (const partId of parts) {
            const partShort = partId.replace(`${componentId}-`, '');
            const partElement = page.locator(`#LAB-${componentId}-${partShort}`);
            if (await partElement.count() > 0) {
              partFound = true;
              break;
            }
          }
          
          expect(partFound, `Component ${componentId} hat keine LAB-DOM-Repräsentation`).toBe(true);
        }
      }
    });
  });

  test.describe('Part Coverage', () => {
    test('Jedes Part aus der Spec hat DOM-Repräsentation in DIN', async ({ page }) => {
      const coverage = [];
      
      for (const [componentId, component] of Object.entries(spec.components)) {
        for (const [partId, part] of Object.entries(component.parts || {})) {
          const partShort = partId.replace(`${componentId}-`, '');
          const domId = `DIN-${componentId}-${partShort}`;
          const element = page.locator(`#${domId}`);
          const count = await element.count();
          
          coverage.push({
            componentId,
            partId,
            domId,
            found: count > 0
          });
        }
      }
      
      const missing = coverage.filter(c => !c.found);
      
      if (missing.length > 0) {
        console.log('Fehlende Parts:', missing.map(m => `${m.componentId}.${m.partId} → #${m.domId}`));
      }
      
      expect(missing.length, `${missing.length} Parts fehlen im DOM`).toBe(0);
    });
  });

  test.describe('Anchor/Terminal Coverage', () => {
    test('Jeder Anchor aus der Spec hat DOM-Verbindungspunkt', async ({ page }) => {
      const anchors = Object.values(spec.anchors || {});
      const missing = [];
      
      for (const anchor of anchors) {
        if (anchor.component === 'RAIL') continue;
        
        const domId = `${anchor.view}-${anchor.component}-${anchor.part.replace(`${anchor.component}-`, '')}-${anchor.terminal}`;
        const element = page.locator(`#${domId}`);
        const count = await element.count();
        
        if (count === 0) {
          missing.push({
            anchor: anchor.id,
            expectedDomId: domId
          });
        }
      }
      
      if (missing.length > 0) {
        console.log('Fehlende Anchors:', missing);
      }
      
      expect(missing.length, `${missing.length} Anchors fehlen`).toBe(0);
    });
  });

  test.describe('Wire Coverage', () => {
    test('Jeder Wire aus der Spec hat DOM-Repräsentation', async ({ page }) => {
      const wires = spec.wires || [];
      const missing = [];
      
      for (const wire of wires) {
        // Wires werden als Segmente gerendert: wire-id-seg0, wire-id-seg1, etc.
        const segment0 = page.locator(`[id^="${wire.id}-seg"]`);
        const count = await segment0.count();
        
        if (count === 0) {
          missing.push(wire.id);
        }
      }
      
      if (missing.length > 0) {
        console.log('Fehlende Wires:', missing);
      }
      
      expect(missing.length, `${missing.length} Wires fehlen`).toBe(0);
    });
  });

  test.describe('State/Transition Coverage', () => {
    test('Jeder State hat erreichbare DOM-Repräsentation', async ({ page }) => {
      const states = Object.keys(spec.states || {});
      
      for (const stateId of states) {
        const state = spec.states[stateId];
        
        // Prüfe, ob Component-States im State definiert sind
        if (state.expected && state.expected.componentStates) {
          for (const [componentId, expectedState] of Object.entries(state.expected.componentStates)) {
            // DOM-Elemente für diesen Component müssen existieren
            const element = page.locator(`#DIN-${componentId}`);
            const count = await element.count();
            
            if (count === 0) {
              // Versuche Parts
              const component = spec.components[componentId];
              if (component && component.parts) {
                for (const partId of Object.keys(component.parts)) {
                  const partShort = partId.replace(`${componentId}-`, '');
                  const partElement = page.locator(`#DIN-${componentId}-${partShort}`);
                  expect(await partElement.count(), 
                    `State ${stateId}: Component ${componentId} fehlt im DOM`).toBeGreaterThan(0);
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe('Didactic/Story Coverage', () => {
    test('Jeder Story-Schritt hat DOM-Zielelemente', async ({ page }) => {
      const functions = spec.didactic?.functions || [];
      
      for (let i = 0; i < functions.length; i++) {
        const func = functions[i];
        
        // Prüfe Focus-Elemente
        if (func.focus) {
          for (const dinId of func.focus.din || []) {
            const element = page.locator(`#${dinId}`);
            const count = await element.count();
            expect(count, `Story-Schritt ${i} (${func.title}): Focus-Element #${dinId} fehlt`).toBeGreaterThan(0);
          }
          
          for (const labId of func.focus.lab || []) {
            const element = page.locator(`#${labId}`);
            const count = await element.count();
            expect(count, `Story-Schritt ${i} (${func.title}): Focus-Element #${labId} fehlt`).toBeGreaterThan(0);
          }
        }
        
        // Prüfe Paths
        if (func.paths) {
          for (const pathId of func.paths) {
            const pathDef = (spec.currentPaths || []).find(p => p.id === pathId);
            if (pathDef) {
              // Prüfe, ob alle Wire-Segmente dieses Paths existieren
              for (const wireId of pathDef.wires || []) {
                const wireElement = page.locator(`[id^="${wireId}-seg"]`);
                const count = await wireElement.count();
                expect(count, `Story-Schritt ${i}: Path ${pathId} Wire ${wireId} fehlt`).toBeGreaterThan(0);
              }
            }
          }
        }
      }
    });
  });

  test.describe('Transfer Mapping Coverage', () => {
    test('Jedes Transfer-Mapping zeigt auf existierende Elemente', async ({ page }) => {
      const mappings = spec.transferMapping || [];
      const invalid = [];
      
      for (const mapping of mappings) {
        const dinElement = page.locator(`#${mapping.din}`);
        const labElement = page.locator(`#${mapping.lab}`);
        
        const dinCount = await dinElement.count();
        const labCount = await labElement.count();
        
        if (dinCount === 0 || labCount === 0) {
          invalid.push({
            mapping,
            dinExists: dinCount > 0,
            labExists: labCount > 0
          });
        }
      }
      
      if (invalid.length > 0) {
        console.log('Ungültige Transfer-Mappings:', invalid);
      }
      
      expect(invalid.length, `${invalid.length} Transfer-Mappings ungültig`).toBe(0);
    });
  });
});
