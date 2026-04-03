#!/usr/bin/env node
/**
 * build.js - Batch 2 (gehärtet): Expliziter Build-Vertrag
 * 
 * Nutzung:
 *   node build.js              # Dev-Build nach test_output/
 *   node build.js --candidate  # Candidate-Build nach candidates/html/
 *   node build.js --check      # Prüft Konsistenz ohne Schreiben
 * 
 * Artefaktvertrag:
 *   - test_output/     = Entwicklung, temporär (in .gitignore)
 *   - candidates/html/ = Build-Kandidaten, nicht kanonisch
 *   - final/html/      = KANONISCH, nicht durch automatischen Build überschreibbar
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

// Output-Verzeichnis - NIE direkt nach final/
const outputDir = isCandidate 
  ? path.join(__dirname, '..', 'candidates', 'html')
  : path.join(__dirname, '..', 'test_output');

console.log(`╔════════════════════════════════════════════════════════════╗`);
console.log(`║  Batch 2 Build-Vertrag                                    ║`);
console.log(`╠════════════════════════════════════════════════════════════╣`);
console.log(`║  Modus: ${isCandidate ? 'CANDIDATE -> candidates/html/' : 'DEV      -> test_output/'}${' '.repeat(isCandidate ? 8 : 9)}║`);
console.log(`║  Generator: CircuitGeneratorV2                            ║`);
console.log(`╚════════════════════════════════════════════════════════════╝\n`);

if (isCheck) {
  console.log('CHECK-Modus: Prüfe Konsistenz...\n');
  const finalExists = fs.existsSync(path.join(__dirname, 'final', 'html'));
  const candidatesExists = fs.existsSync(path.join(__dirname, 'candidates', 'html'));
  const testExists = fs.existsSync(path.join(__dirname, 'test_output'));
  console.log(`  final/html/       : ${finalExists ? '✓ (kanonisch)' : '✗'}`);
  console.log(`  candidates/html/  : ${candidatesExists ? '✓' : '✗'}`);
  console.log(`  test_output/      : ${testExists ? '✓' : '✗'}`);
  console.log(`  Generator         : ✓`);
  console.log(`\nHINWEIS: final/ wird durch diesen Build NICHT verändert.`);
  console.log(`         Verwenden Sie --candidate für Build-Kandidaten.\n`);
  process.exit(0);
}

// Sicherstellen, dass Output-Verzeichnis existiert
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`  Verzeichnis erstellt: ${outputDir}\n`);
}

// Build
console.log('Generiere Schaltungen...\n');
let successCount = 0;
let failCount = 0;

for (const circuit of circuits) {
  try {
    const circuitPath = path.join(__dirname, '..', circuit.file);
    const generator = new CircuitGeneratorV2(circuitPath, { 
      generateStates: true  // Immer mit State-Machine
    });
    
    // Generiere Grundbild-Variante (Interaktiv)
    const html = generator.generate({});
    
    const outputName = isCandidate 
      ? `${circuit.name}_grundbild.html`
      : `${circuit.name}_din_v2.html`;
    
    const outputPath = path.join(outputDir, outputName);
    fs.writeFileSync(outputPath, html);
    
    const sizeKB = (html.length / 1024).toFixed(2);
    const target = isCandidate ? 'candidates/' : 'test_output/';
    console.log(`  ✓ ${circuit.name.padEnd(15)} ${sizeKB.padStart(6)}KB -> ${target}${outputName}`);
    successCount++;
  } catch (error) {
    console.error(`  ✗ ${circuit.name.padEnd(15)} ${error.message}`);
    failCount++;
  }
}

console.log(`\n${'═'.repeat(62)}`);
console.log(`Ergebnis: ${successCount} erfolgreich, ${failCount} fehlgeschlagen`);
console.log(`${'═'.repeat(62)}\n`);

if (isCandidate) {
  console.log('HINWEIS: Candidate-Artefakte nach candidates/html/ geschrieben.');
  console.log('         Diese Dateien sind Build-Kandidaten, NICHT kanonisch.');
  console.log('         Manuelle Prüfung erforderlich vor Übernahme nach final/.\n');
} else {
  console.log('HINWEIS: Dev-Artefakte nach test_output/ geschrieben.');
  console.log('         Diese Dateien sind in .gitignore und temporär.\n');
  console.log('Für Candidate-Build: node build.js --candidate\n');
}

process.exit(failCount > 0 ? 1 : 0);
