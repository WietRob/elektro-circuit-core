const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'test_output');
const MANIFEST_DIR = path.join(OUTPUT_DIR, 'manifest');
const INDEX_PATH = path.join(MANIFEST_DIR, 'index.json');

let totalPassed = 0;
let totalFailed = 0;

function assert(condition, message) {
  if (condition) {
    totalPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    totalFailed++;
    console.log(`  ✗ ${message}`);
  }
}

console.log('=== MANIFEST KONTRAKT-TEST ===\n');

// 1. Build-Output existiert
assert(fs.existsSync(OUTPUT_DIR), 'Build-Output-Verzeichnis existiert');
assert(fs.existsSync(MANIFEST_DIR), 'Manifest-Verzeichnis existiert');
assert(fs.existsSync(INDEX_PATH), 'Root-Index manifest/index.json existiert');

// 2. Root-Index parsebar
let index;
try {
  index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  assert(true, 'Root-Index ist valides JSON');
} catch (e) {
  assert(false, `Root-Index ist kein valides JSON: ${e.message}`);
  process.exit(1);
}

// 3. Index-Struktur
assert(Array.isArray(index.circuits), 'circuits[] ist vorhanden');
assert(index.circuits.length > 0, 'circuits[] ist nicht leer');
assert(typeof index.generatedAt === 'string', 'generatedAt ist vorhanden');
assert(index.buildType === 'dev' || index.buildType === 'candidate', 'buildType ist dev oder candidate');

// 4. Per-Circuit-Prüfung
for (const circuitEntry of index.circuits) {
  const cid = circuitEntry.circuitId;
  console.log(`\n--- ${cid} ---`);

  assert(typeof circuitEntry.manifest === 'string', `${cid}: manifest-Pfad ist String`);
  assert(circuitEntry.variants.includes('grundbild'), `${cid}: grundbild-Variante deklariert`);
  assert(circuitEntry.variants.includes('overlay'), `${cid}: overlay-Variante deklariert`);
  assert(circuitEntry.formats.includes('html'), `${cid}: html-Format deklariert`);
  assert(circuitEntry.formats.includes('svg'), `${cid}: svg-Format deklariert`);

  // Manifest-Pfad relativ zu manifest/index.json aufloesen
  const manifestPath = path.resolve(MANIFEST_DIR, circuitEntry.manifest);
  assert(fs.existsSync(manifestPath), `${cid}: Manifest-Datei existiert: ${circuitEntry.manifest}`);

  // 5. Per-Circuit-Manifest laden
  let circuitManifest;
  try {
    circuitManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert(true, `${cid}: Per-Circuit-Manifest ist valides JSON`);
  } catch (e) {
    assert(false, `${cid}: Per-Circuit-Manifest kaputt: ${e.message}`);
    continue;
  }

  // 6. circuitId-Konsistenz
  assert(circuitManifest.circuitId === cid, `${cid}: circuitId konsistent (Index: ${cid}, Manifest: ${circuitManifest.circuitId})`);

  // 7. Artifact-Pfade pruefen
  for (const [variant, files] of Object.entries(circuitManifest.artifacts || {})) {
    for (const [format, filePath] of Object.entries(files)) {
      // Pfad relativ zum Per-Circuit-Manifest aufloesen
      const resolvedPath = path.resolve(MANIFEST_DIR, filePath);
      assert(fs.existsSync(resolvedPath), `${cid}: ${variant}.${format} existiert: ${filePath}`);
    }
  }
}

// Zusammenfassung
console.log(`\n=== RESULT ===`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalFailed}`);

if (totalFailed > 0) {
  process.exit(1);
}
