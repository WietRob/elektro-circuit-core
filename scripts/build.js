#!/usr/bin/env node
/**
 * build.js - Batch 3A: Artefaktvertrag mit HTML + SVG
 *
 * Nutzung:
 *   node build.js              # Dev-Build nach test_output/{html,svg}/
 *   node build.js --candidate  # Candidate-Build nach candidates/{html,svg}/
 *   node build.js --check      # Prüft Konsistenz ohne Schreiben
 *
 * Artefaktvertrag:
 *   - test_output/html/ = Dev-HTML, temporär (in .gitignore)
 *   - test_output/svg/  = Dev-SVG, temporär (in .gitignore)
 *   - candidates/html/  = HTML-Kandidaten, nicht kanonisch
 *   - candidates/svg/   = SVG-Kandidaten, nicht kanonisch
 *   - final/html/       = KANONISCH, nicht durch automatischen Build überschreibbar
 *   - final/svg/        = KANONISCH, nicht durch automatischen Build überschreibbar
 */

const fs = require('fs');
const path = require('path');

const V2_GENERATOR_PATH = './src/generator/circuit-generator-v2.js';
const v2FullPath = path.join(__dirname, '..', V2_GENERATOR_PATH);

if (!fs.existsSync(v2FullPath)) {
  console.error('✗ FEHLER: CircuitGeneratorV2 nicht gefunden: ' + V2_GENERATOR_PATH);
  process.exit(1);
}

const { CircuitGeneratorV2 } = require(v2FullPath);

// Konfiguration
const circuits = [
  { name: 'selbsthaltung', file: './examples/selbsthaltung.json' },
  { name: 'tippbetrieb', file: './examples/tippbetrieb.json' },
  { name: 'folgeschaltung', file: './examples/folgeschaltung.json' }
];

// CLI Args
const isCandidate = process.argv.includes('--candidate');
const isCheck = process.argv.includes('--check');

// Output-Verzeichnisse - NIE direkt nach final/
const baseDir = isCandidate
  ? path.join(__dirname, '..', 'candidates')
  : path.join(__dirname, '..', 'test_output');
const htmlDir = path.join(baseDir, 'html');
const svgDir = path.join(baseDir, 'svg');

console.log(`╔════════════════════════════════════════════════════════════╗`);
console.log(`║  Batch 3A Build-Vertrag                                   ║`);
console.log(`╠════════════════════════════════════════════════════════════╣`);
console.log(`║  Modus: ${isCandidate ? 'CANDIDATE -> candidates/{html,svg}/' : 'DEV      -> test_output/{html,svg}/'}║`);
console.log(`║  Generator: CircuitGeneratorV2                            ║`);
console.log(`╚════════════════════════════════════════════════════════════╝\n`);

if (isCheck) {
  console.log('CHECK-Modus: Prüfe Konsistenz...\n');
  const finalHtmlExists = fs.existsSync(path.join(__dirname, '..', 'final', 'html'));
  const finalSvgExists = fs.existsSync(path.join(__dirname, '..', 'final', 'svg'));
  const candidatesHtmlExists = fs.existsSync(path.join(__dirname, '..', 'candidates', 'html'));
  const candidatesSvgExists = fs.existsSync(path.join(__dirname, '..', 'candidates', 'svg'));
  const testExists = fs.existsSync(path.join(__dirname, '..', 'test_output'));
  console.log(`  final/html/         : ${finalHtmlExists ? '✓ (kanonisch)' : '✗'}`);
  console.log(`  final/svg/          : ${finalSvgExists ? '✓ (kanonisch)' : '✗'}`);
  console.log(`  candidates/html/    : ${candidatesHtmlExists ? '✓' : '✗'}`);
  console.log(`  candidates/svg/     : ${candidatesSvgExists ? '✓' : '✗'}`);
  console.log(`  test_output/        : ${testExists ? '✓' : '✗'}`);
  console.log(`  Generator           : ✓`);
  console.log(`\nHINWEIS: final/ wird durch diesen Build NICHT verändert.`);
  console.log(`         Verwenden Sie --candidate für Build-Kandidaten.\n`);
  process.exit(0);
}

// Sicherstellen, dass Output-Verzeichnisse existieren
[htmlDir, svgDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Build
console.log('Generiere Schaltungen...\n');
let successCount = 0;
let failCount = 0;

for (const circuit of circuits) {
  const circuitPath = path.join(__dirname, '..', circuit.file);
  const target = isCandidate ? 'candidates/' : 'test_output/';

  // 1. GRUNDBILD HTML: Reiner technischer Schaltplan
  try {
    const grundGenerator = new CircuitGeneratorV2(circuitPath, {
      generateStates: true,
      mode: 'grundbild'
    });
    const grundHtml = grundGenerator.generate({});
    const grundName = `${circuit.name}_grundbild.html`;
    fs.writeFileSync(path.join(htmlDir, grundName), grundHtml);
    const grundSize = (grundHtml.length / 1024).toFixed(2);
    console.log(`  ✓ ${circuit.name.padEnd(15)} ${grundSize.padStart(6)}KB -> ${target}html/${grundName}`);
    successCount++;
  } catch (error) {
    console.error(`  ✗ ${circuit.name.padEnd(15)} GRUNDBILD-HTML ${error.message}`);
    failCount++;
  }

  // 2. GRUNDBILD SVG: Reiner technischer Schaltplan als SVG
  try {
    const grundSvgGenerator = new CircuitGeneratorV2(circuitPath, {
      generateStates: true,
      mode: 'grundbild'
    });
    const grundSvg = grundSvgGenerator.generateSVG('DIN', {});
    const grundSvgName = `${circuit.name}_grundbild.svg`;
    fs.writeFileSync(path.join(svgDir, grundSvgName), grundSvg);
    const grundSvgSize = (grundSvg.length / 1024).toFixed(2);
    console.log(`  ✓ ${circuit.name.padEnd(15)} ${grundSvgSize.padStart(6)}KB -> ${target}svg/${grundSvgName}`);
    successCount++;
  } catch (error) {
    console.error(`  ✗ ${circuit.name.padEnd(15)} GRUNDBILD-SVG ${error.message}`);
    failCount++;
  }

  // 3. OVERLAY HTML: Mit Didaktik-Layer
  try {
    const overlayGenerator = new CircuitGeneratorV2(circuitPath, {
      generateStates: true,
      mode: 'overlay'
    });
    const overlayHtml = overlayGenerator.generate({});
    const overlayName = `${circuit.name}_overlay.html`;
    fs.writeFileSync(path.join(htmlDir, overlayName), overlayHtml);
    const overlaySize = (overlayHtml.length / 1024).toFixed(2);
    console.log(`  ✓ ${circuit.name.padEnd(15)} ${overlaySize.padStart(6)}KB -> ${target}html/${overlayName}`);
    successCount++;
  } catch (error) {
    console.error(`  ✗ ${circuit.name.padEnd(15)} OVERLAY-HTML ${error.message}`);
    failCount++;
  }

  // 4. OVERLAY SVG: Mit Didaktik-Layer als SVG
  try {
    const overlaySvgGenerator = new CircuitGeneratorV2(circuitPath, {
      generateStates: true,
      mode: 'overlay'
    });
    const overlaySvg = overlaySvgGenerator.generateSVG('DIN', {});
    const overlaySvgName = `${circuit.name}_overlay.svg`;
    fs.writeFileSync(path.join(svgDir, overlaySvgName), overlaySvg);
    const overlaySvgSize = (overlaySvg.length / 1024).toFixed(2);
    console.log(`  ✓ ${circuit.name.padEnd(15)} ${overlaySvgSize.padStart(6)}KB -> ${target}svg/${overlaySvgName}`);
    successCount++;
  } catch (error) {
    console.error(`  ✗ ${circuit.name.padEnd(15)} OVERLAY-SVG ${error.message}`);
    failCount++;
  }
}

console.log(`\n${'═'.repeat(62)}`);
console.log(`Ergebnis: ${successCount} erfolgreich, ${failCount} fehlgeschlagen`);
console.log(`${'═'.repeat(62)}\n`);

if (isCandidate) {
  console.log('HINWEIS: Candidate-Artefakte nach candidates/{html,svg}/ geschrieben.');
  console.log('         Diese Dateien sind Build-Kandidaten, NICHT kanonisch.');
  console.log('         Manuelle Prüfung erforderlich vor Übernahme nach final/.\n');
} else {
  console.log('HINWEIS: Dev-Artefakte nach test_output/{html,svg}/ geschrieben.');
  console.log('         Diese Dateien sind in .gitignore und temporär.\n');
  console.log('Für Candidate-Build: node build.js --candidate\n');
}

process.exit(failCount > 0 ? 1 : 0);
