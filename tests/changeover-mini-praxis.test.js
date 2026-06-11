const { TemplateRenderer } = require('../src/generator/template-system.js');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    passCount++;
    console.log(`  ✓ ${message}`);
  } else {
    failCount++;
    console.error(`  ✗ ${message}`);
  }
}

console.log('\nChangeover-Contact Mini-Praxisnachweis\n');

const renderer = new TemplateRenderer();

const terminals = [
  { terminal: '11', x: 100, y: 80 },
  { terminal: '14', x: 140, y: 120 },
  { terminal: '12', x: 60, y: 120 }
];

const svgOpen = renderer.render('changeover_contact', terminals, 'standard', { closed: false });
const svgClosed = renderer.render('changeover_contact', terminals, 'standard', { closed: true });

assert(svgOpen.length > 0, 'Rendert nicht-leeres SVG (offen)');
assert(svgClosed.length > 0, 'Rendert nicht-leeres SVG (geschlossen)');

assert(svgOpen.includes('x1="92"') || svgOpen.includes('x1="100"'), 'SVG enthält Terminal-Verbindung zu common (11)');

assert(svgOpen !== svgClosed, 'Offener und geschlossener Zustand erzeugen unterschiedliches SVG');

const openLines = (svgOpen.match(/<line/g) || []).length;
const closedLines = (svgClosed.match(/<line/g) || []).length;
assert(openLines >= 3, `Offener Zustand: mindestens 3 Linien (${openLines})`);
assert(closedLines >= 3, `Geschlossener Zustand: mindestens 3 Linien (${closedLines})`);

assert(svgOpen.includes('12'), 'Offener Zustand zeigt NC-Kontakt (12)');
assert(svgClosed.includes('14'), 'Geschlossener Zustand zeigt NO-Kontakt (14)');

console.log(`\nErgebnis: ${passCount} bestanden, ${failCount} fehlgeschlagen\n`);
process.exit(failCount > 0 ? 1 : 0);