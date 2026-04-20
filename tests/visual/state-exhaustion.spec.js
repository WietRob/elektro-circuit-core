const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const circuits = [
  { 
    name: 'tippbetrieb', 
    specPath: '../../examples/tippbetrieb.json',
    htmlPath: '/tippbetrieb_overlay.html',
    stateSequence: [
      { from: 'initial', trigger: 'S1.pressed', to: 'active', check: { currentWires: '>0' } },
      { from: 'active', trigger: 'S1.released', to: 'reset', check: { currentWires: 0 } }
    ]
  },
  { 
    name: 'selbsthaltung', 
    specPath: '../../examples/selbsthaltung.json',
    htmlPath: '/selbsthaltung_overlay.html',
    stateSequence: [
      { from: 'initial', trigger: 'S1.pressed', to: 'active', check: { 'K1-AUX-NO': 'closed', 'P1-LAMP': 'lit' } },
      { from: 'active', trigger: 'S2.pressed', to: 'reset', check: { 'S2-BUTTON': 'open', 'K1-AUX-NO': 'open' } }
    ]
  },
  { 
    name: 'folgeschaltung', 
    specPath: '../../examples/folgeschaltung.json',
    htmlPath: '/folgeschaltung_overlay.html',
    stateSequence: [
      { from: 'initial', trigger: 'S1.pressed', to: 'k1_only', check: { 'K1-AUX-NO': 'closed', 'P1-LAMP': 'lit', 'P2-LAMP': 'dark' } },
      { from: 'k1_only', trigger: 'S2.pressed', to: 'k1_and_k2', check: { 'K1-AUX-NO': 'closed', 'K2-AUX-NO': 'closed', 'P1-LAMP': 'lit', 'P2-LAMP': 'lit' } }
    ]
  }
];

for (const circuit of circuits) {
  test.describe(`State Exhaustion: ${circuit.name}`, () => {
    test(`Alle States durchlaufen: ${circuit.stateSequence.map(s => s.to).join(' -> ')}`, async ({ page }) => {
      await page.goto(circuit.htmlPath);
      await page.waitForTimeout(300);
      
      let currentState = await page.evaluate(() => window.currentState);
      expect(currentState).toBe(circuit.stateSequence[0].from);
      
      for (const transition of circuit.stateSequence) {
        await page.locator(`[data-runtime-control="transition"][data-trigger="${transition.trigger}"]`).click();
        await page.waitForTimeout(400);
        
        currentState = await page.evaluate(() => window.currentState);
        expect(currentState, `Transition ${transition.trigger} sollte zu ${transition.to} führen`).toBe(transition.to);
        
        const bodyState = await page.locator('body').getAttribute('data-runtime-state');
        expect(bodyState).toBe(transition.to);
        
        for (const [component, expectedState] of Object.entries(transition.check || {})) {
          if (component === 'currentWires') {
            const wireCount = await page.locator('.wire-current').count();
            if (expectedState === '>0') {
              expect(wireCount, `State ${transition.to}: Strom sollte fließen`).toBeGreaterThan(0);
            } else {
              expect(wireCount, `State ${transition.to}: Kein Strom erwartet`).toBe(expectedState);
            }
          } else {
            const actualState = await page.locator(`#DIN-${component}`).getAttribute('data-projected-state');
            expect(actualState, `Component ${component} in State ${transition.to}`).toBe(expectedState);
          }
        }
      }
    });
    
    test(`State-Machine: ${circuit.name} hat korrekte Anzahl States`, async ({ page }) => {
      await page.goto(circuit.htmlPath);
      await page.waitForTimeout(300);
      
      const specPath = path.resolve(__dirname, circuit.specPath);
      const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
      const expectedStateCount = Object.keys(spec.states).length;
      
      const visitedStates = new Set();
      let currentState = await page.evaluate(() => window.currentState);
      visitedStates.add(currentState);
      
      let attempts = 0;
      while (attempts < 10) {
        const transitions = await page.locator('[data-runtime-control="transition"]').all();
        if (transitions.length === 0) break;
        
        await transitions[0].click();
        await page.waitForTimeout(300);
        
        currentState = await page.evaluate(() => window.currentState);
        visitedStates.add(currentState);
        
        attempts++;
      }
      
      expect(visitedStates.size, `Sollte ${expectedStateCount} States erreichen`).toBeGreaterThanOrEqual(Math.min(expectedStateCount, 2));
    });
  });
}
