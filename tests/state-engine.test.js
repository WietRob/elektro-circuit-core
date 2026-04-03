const { StateEngine } = require('../generator/state-engine.js');
const fs = require('fs');
const path = require('path');

console.log('=== STATE ENGINE TESTS ===\n');

const circuitsDir = path.join(__dirname, '../circuits');
const circuits = ['tippbetrieb.json', 'selbsthaltung.json', 'folgeschaltung.json'];

let totalPassed = 0;
let totalFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('✓ ' + name);
    totalPassed++;
  } catch (e) {
    console.log('✗ ' + name);
    console.log('  ' + e.message);
    totalFailed++;
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg + ': expected ' + expected + ', got ' + actual);
  }
}

function assertTrue(condition, msg) {
  if (!condition) {
    throw new Error(msg);
  }
}

circuits.forEach(file => {
  const filePath = path.join(circuitsDir, file);
  const spec = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const engine = new StateEngine(spec);
  
  console.log('--- ' + spec.circuitId + ' ---');
  
  test(spec.circuitId + ': StateEngine initializes', () => {
    assertTrue(engine.getCurrentState() !== null, 'Current state exists');
    assertTrue(engine.getCurrentStateId() !== null, 'Current state ID exists');
  });
  
  test(spec.circuitId + ': Initial state resolved', () => {
    const state = engine.resolveFullState();
    assertTrue(Object.keys(state).length > 0, 'State has components');
  });
  
  test(spec.circuitId + ': Can get component state', () => {
    const firstComp = Object.keys(spec.components)[0];
    const state = engine.getComponentState(firstComp);
    assertTrue(state !== null, 'Component state exists');
  });
  
  test(spec.circuitId + ': Mechanical coupling built', () => {
    const couplings = engine.mechanicalCouplings;
    assertTrue(typeof couplings === 'object', 'Couplings is object');
  });
  
  test(spec.circuitId + ': States are defined', () => {
    assertTrue(Object.keys(engine.states).length > 0, 'States exist');
  });
  
  test(spec.circuitId + ': At least one initial state', () => {
    const initialStates = Object.values(engine.states).filter(s => s.initial);
    assertTrue(initialStates.length >= 1, 'Has initial state');
  });
  
  if (spec.circuitId === 'selbsthaltung') {
    test('selbsthaltung: Initial state - S1 offen', () => {
      engine.reset();
      const state = engine.getFullState();
      assertEqual(state['S1'], 'open', 'S1 should be open initially');
    });
    
    test('selbsthaltung: Initial state - S2 geschlossen', () => {
      engine.reset();
      const state = engine.getFullState();
      assertEqual(state['S2'], 'closed', 'S2 should be closed initially');
    });
    
    test('selbsthaltung: Initial state - K1-COIL inactive', () => {
      engine.reset();
      const state = engine.getFullState();
      assertEqual(state['K1-COIL'], 'inactive', 'K1-COIL should be inactive initially');
    });
    
    test('selbsthaltung: Initial state - K1-AUX-NO offen', () => {
      engine.reset();
      const state = engine.getFullState();
      assertEqual(state['K1-AUX-NO'], 'open', 'K1-AUX-NO should be open initially');
    });
    
    test('selbsthaltung: Initial state - P1 dark', () => {
      engine.reset();
      const state = engine.getFullState();
      assertEqual(state['P1'], 'dark', 'P1 should be dark initially');
    });
    
    test('selbsthaltung: Transition to active - K1-COIL active', () => {
      engine.reset();
      engine.setState('active');
      const state = engine.getFullState();
      assertEqual(state['K1-COIL'], 'active', 'K1-COIL should be active');
    });
    
    test('selbsthaltung: Transition to active - K1-AUX-NO geschlossen', () => {
      engine.reset();
      engine.setState('active');
      const state = engine.getFullState();
      assertEqual(state['K1-AUX-NO'], 'closed', 'K1-AUX-NO should be closed');
    });
    
    test('selbsthaltung: Transition to active - P1 lit', () => {
      engine.reset();
      engine.setState('active');
      const state = engine.getFullState();
      assertEqual(state['P1'], 'lit', 'P1 should be lit');
    });
  }
  
  if (spec.circuitId === 'tippbetrieb') {
    test('tippbetrieb: Initial - S1 offen', () => {
      engine.reset();
      const state = engine.getFullState();
      assertEqual(state['S1'], 'open', 'S1 should be open');
    });
    
    test('tippbetrieb: Active - S1 geschlossen', () => {
      engine.reset();
      engine.setState('active');
      const state = engine.getFullState();
      assertEqual(state['S1'], 'closed', 'S1 should be closed');
    });
    
    test('tippbetrieb: Active - K1-COIL active', () => {
      engine.reset();
      engine.setState('active');
      const state = engine.getFullState();
      assertEqual(state['K1-COIL'], 'active', 'K1-COIL should be active');
    });
  }
  
  if (spec.circuitId === 'folgeschaltung') {
    test('folgeschaltung: Initial - S1 offen', () => {
      engine.reset();
      const state = engine.getFullState();
      assertEqual(state['S1'], 'open', 'S1 should be open');
    });
    
    test('folgeschaltung: k1_only - K1-COIL active', () => {
      engine.reset();
      engine.setState('k1_only');
      const state = engine.getFullState();
      assertEqual(state['K1-COIL'], 'active', 'K1-COIL should be active');
    });
    
    test('folgeschaltung: k1_only - K1-AUX-NO geschlossen', () => {
      engine.reset();
      engine.setState('k1_only');
      const state = engine.getFullState();
      assertEqual(state['K1-AUX-NO'], 'closed', 'K1-AUX-NO should be closed');
    });
  }
  
  console.log();
});

console.log('=== TOTAL RESULT ===');
console.log('Passed: ' + totalPassed);
console.log('Failed: ' + totalFailed);

process.exit(totalFailed > 0 ? 1 : 0);
