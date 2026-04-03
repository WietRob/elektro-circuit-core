const { GeometryEngine } = require('../generator/geometry-engine.js');

const testSpec = {
  circuitId: 'test-circuit',
  version: '2.0.0',
  components: {
    S1: {
      id: 'S1',
      type: 'pushbutton',
      parts: {
        'S1-BUTTON': {
          id: 'S1-BUTTON',
          type: 'button_mechanism',
          terminals: {
            '13': { id: '13', function: 'input', potential: 'L' },
            '14': { id: '14', function: 'output', potential: 'switched' }
          }
        }
      }
    },
    K1: {
      id: 'K1',
      type: 'contactor',
      parts: {
        'K1-COIL': {
          id: 'K1-COIL',
          type: 'coil',
          terminals: {
            'A1': { id: 'A1', function: 'coil_in', potential: 'control' },
            'A2': { id: 'A2', function: 'coil_out', potential: 'N' }
          }
        }
      }
    }
  },
  anchors: {
    'DIN-S1-BUTTON-13': { id: 'DIN-S1-BUTTON-13', view: 'DIN', component: 'S1', part: 'S1-BUTTON', terminal: '13', x: 100, y: 55 },
    'DIN-S1-BUTTON-14': { id: 'DIN-S1-BUTTON-14', view: 'DIN', component: 'S1', part: 'S1-BUTTON', terminal: '14', x: 100, y: 80 },
    'DIN-K1-COIL-A1': { id: 'DIN-K1-COIL-A1', view: 'DIN', component: 'K1', part: 'K1-COIL', terminal: 'A1', x: 135, y: 220 },
    'DIN-K1-COIL-A2': { id: 'DIN-K1-COIL-A2', view: 'DIN', component: 'K1', part: 'K1-COIL', terminal: 'A2', x: 175, y: 220 },
    'LAB-S1-BUTTON-13': { id: 'LAB-S1-BUTTON-13', view: 'LAB', component: 'S1', part: 'S1-BUTTON', terminal: '13', x: 80, y: 55 },
    'LAB-S1-BUTTON-14': { id: 'LAB-S1-BUTTON-14', view: 'LAB', component: 'S1', part: 'S1-BUTTON', terminal: '14', x: 80, y: 80 }
  }
};

console.log('=== GEOMETRY CONTRACT TESTS ===\n');

const engine = new GeometryEngine(testSpec);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('✓ PASS: ' + name);
    passed++;
  } catch (e) {
    console.log('✗ FAIL: ' + name);
    console.log('  ' + e.message);
    failed++;
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

test('getTerminal returns correct position for DIN', () => {
  const term = engine.getTerminal('DIN', 'S1', 'S1-BUTTON', '13');
  assertEqual(term.x, 100, 'X coordinate');
  assertEqual(term.y, 55, 'Y coordinate');
  assertEqual(term.component, 'S1', 'Component');
  assertEqual(term.terminal, '13', 'Terminal');
});

test('getTerminal returns correct position for LAB', () => {
  const term = engine.getTerminal('LAB', 'S1', 'S1-BUTTON', '13');
  assertEqual(term.x, 80, 'X coordinate');
  assertEqual(term.y, 55, 'Y coordinate');
});

test('getTerminal includes potential info', () => {
  const term = engine.getTerminal('DIN', 'S1', 'S1-BUTTON', '13');
  assertEqual(term.potential, 'L', 'Potential');
  assertEqual(term.type, 'input', 'Function type');
});

test('getPartBounds calculates bounds from terminals', () => {
  const bounds = engine.getPartBounds('DIN', 'S1', 'S1-BUTTON');
  assertTrue(bounds.x < 100, 'X should be less than terminal X (padding)');
  assertTrue(bounds.y < 55, 'Y should be less than terminal Y (padding)');
  assertTrue(bounds.width > 0, 'Width should be positive');
  assertTrue(bounds.height > 0, 'Height should be positive');
  assertEqual(bounds.terminals.length, 2, 'Terminal count');
});

test('getComponentBounds aggregates part bounds', () => {
  const bounds = engine.getComponentBounds('DIN', 'K1');
  assertTrue(bounds.x > 0, 'X should be positive');
  assertTrue(bounds.y > 0, 'Y should be positive');
  assertTrue(bounds.width > 0, 'Width should be positive');
  assertTrue(bounds.height > 0, 'Height should be positive');
  assertTrue(Array.isArray(bounds.parts), 'Parts should be array');
});

test('getAllTerminals returns all terminals for view', () => {
  const terms = engine.getAllTerminals('DIN');
  assertEqual(terms.length, 4, 'Terminal count for DIN');
  
  const labTerms = engine.getAllTerminals('LAB');
  assertEqual(labTerms.length, 2, 'Terminal count for LAB');
});

test('loadConfig merges custom with defaults', () => {
  const customEngine = new GeometryEngine({
    ...testSpec,
    config: { symbolPadding: 20 }
  });
  assertEqual(customEngine.config.symbolPadding, 20, 'Custom config');
  assertEqual(customEngine.config.labelOffset.x, -8, 'Default config preserved');
});

test('getAllComponentIds returns all component IDs', () => {
  const ids = engine.getAllComponentIds();
  assertEqual(ids.length, 2, 'Component count');
  assertTrue(ids.includes('S1'), 'Includes S1');
  assertTrue(ids.includes('K1'), 'Includes K1');
});

test('getPartIds returns parts for component', () => {
  const parts = engine.getPartIds('K1');
  assertEqual(parts.length, 1, 'Part count');
  assertEqual(parts[0], 'K1-COIL', 'Part ID');
});

test('getComponentType returns correct type', () => {
  assertEqual(engine.getComponentType('S1'), 'pushbutton', 'S1 type');
  assertEqual(engine.getComponentType('K1'), 'contactor', 'K1 type');
});

test('getPartType returns correct type', () => {
  assertEqual(engine.getPartType('S1', 'S1-BUTTON'), 'button_mechanism', 'Button type');
  assertEqual(engine.getPartType('K1', 'K1-COIL'), 'coil', 'Coil type');
});

test('getTerminal uses cache', () => {
  const term1 = engine.getTerminal('DIN', 'S1', 'S1-BUTTON', '13');
  const term2 = engine.getTerminal('DIN', 'S1', 'S1-BUTTON', '13');
  assertTrue(term1 === term2 || (term1.x === term2.x && term1.y === term2.y), 'Same result from cache');
});

test('getRailPosition returns rail positions', () => {
  const dinL = engine.getRailPosition('DIN', 'L');
  const dinN = engine.getRailPosition('DIN', 'N');
  assertEqual(dinL, 40, 'DIN L rail');
  assertEqual(dinN, 360, 'DIN N rail');
});

test('clearCache clears all cached values', () => {
  engine.getTerminal('DIN', 'S1', 'S1-BUTTON', '13');
  engine.clearCache();
  const term = engine.getTerminal('DIN', 'S1', 'S1-BUTTON', '13');
  assertEqual(term.x, 100, 'Terminal still works after cache clear');
});

console.log('\n=== RESULT ===');
console.log('Passed: ' + passed);
console.log('Failed: ' + failed);

process.exit(failed > 0 ? 1 : 0);
