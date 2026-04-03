const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const circuits = [
  { name: 'tippbetrieb', specPath: '../../circuits/tippbetrieb.json', htmlPath: '/artifacts/tippbetrieb/generated.html' },
  { name: 'selbsthaltung', specPath: '../../circuits/selbsthaltung.json', htmlPath: '/artifacts/selbsthaltung/generated.html' },
  { name: 'folgeschaltung', specPath: '../../circuits/folgeschaltung.json', htmlPath: '/artifacts/folgeschaltung/generated.html' }
];

for (const circuit of circuits) {
  test.describe(`Coverage Gate: ${circuit.name}`, () => {
    const specPath = path.resolve(__dirname, circuit.specPath);
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    
    test.beforeEach(async ({ page }) => {
      await page.goto(circuit.htmlPath);
      await page.waitForTimeout(300);
    });

    test('Alle Components haben DOM-Repräsentation', async ({ page }) => {
      for (const [componentId, component] of Object.entries(spec.components)) {
        let found = false;
        
        for (const partId of Object.keys(component.parts || {})) {
          const dinId = `DIN-${partId}`;
          const count = await page.locator(`#${dinId}`).count();
          if (count > 0) {
            found = true;
            break;
          }
        }
        
        expect(found, `Component ${componentId} in ${circuit.name} hat keine DOM-Repräsentation`).toBe(true);
      }
    });

    test('Alle Wires haben DOM-Repräsentation', async ({ page }) => {
      for (const wire of spec.wires || []) {
        if (wire.id.startsWith('din-')) {
          const seg0 = page.locator(`#${wire.id}-seg0`);
          expect(await seg0.count(), `Wire ${wire.id} in ${circuit.name} fehlt`).toBeGreaterThan(0);
        }
      }
    });

    test('Alle States sind erreichbar', async ({ page }) => {
      for (const [stateId, stateDef] of Object.entries(spec.states || {})) {
        if (stateDef.initial) {
          const currentState = await page.evaluate(() => window.currentState);
          expect(currentState).toBe(stateId);
        }
      }
    });

    test('Dynamische Controls existieren pro State', async ({ page }) => {
      const initialState = Object.entries(spec.states).find(([_, s]) => s.initial)?.[0];
      if (initialState) {
        const transitions = spec.states[initialState].transitions || [];
        const btnCount = await page.locator('[data-runtime-control="transition"]').count();
        expect(btnCount).toBe(transitions.length);
      }
    });

    test('Runtime-State-Attribute korrekt', async ({ page }) => {
      const bodyState = await page.locator('body').getAttribute('data-runtime-state');
      const windowState = await page.evaluate(() => window.currentState);
      expect(bodyState).toBe(windowState);
    });
  });
}
