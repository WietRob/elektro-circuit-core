const fs = require('fs');
const path = require('path');

const PDF_DIR = path.join(__dirname, '..', 'test_output', 'pdf');
const MANIFEST_PATH = path.join(PDF_DIR, 'symbol-templates.manifest.json');

const EXPECTED_SYMBOLS = [
  { symbolClass: 'contact', variant: 'NO' },
  { symbolClass: 'contact', variant: 'NC' },
  { symbolClass: 'coil', variant: 'standard' },
  { symbolClass: 'lamp', variant: 'standard' },
  { symbolClass: 'button', variant: 'NO' },
  { symbolClass: 'button', variant: 'NC' },
  { symbolClass: 'timer_coil', variant: 'standard' },
  { symbolClass: 'timer_contact', variant: 'V' },
  { symbolClass: 'timer_contact', variant: 'P' },
  { symbolClass: 'timer_contact', variant: 'S' },
  { symbolClass: 'terminal_block', variant: 'standard' },
  { symbolClass: 'fuse', variant: 'standard' },
  { symbolClass: 'changeover_contact', variant: 'standard' },
  { symbolClass: 'power_contact', variant: 'standard' }
];

const EXPECTED_TERMINAL_LABELS = {
  'contact__no': ['13', '14'],
  'contact__nc': ['21', '22'],
  'coil__standard': ['A1', 'A2'],
  'lamp__standard': ['IN', 'OUT'],
  'button__no': ['13', '14'],
  'button__nc': ['21', '22'],
  'timer_coil__standard': ['A1', 'A2'],
  'timer_contact__v': ['13', '14'],
  'timer_contact__p': ['13', '14'],
  'timer_contact__s': ['13', '14'],
  'terminal_block__standard': ['1', '2'],
  'fuse__standard': ['L', 'T'],
  'changeover_contact__standard': ['11', '14', '12'],
  'power_contact__standard': ['L1', 'T1']
};

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

console.log('\nPDF-Vertragstest\n');

assert(fs.existsSync(PDF_DIR), `PDF-Verzeichnis existiert: ${PDF_DIR}`);
assert(fs.existsSync(MANIFEST_PATH), `PDF-Manifest existiert: ${MANIFEST_PATH}`);

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  passCount++;
  console.log(`  ✓ Manifest ist valides JSON`);
} catch (e) {
  failCount++;
  console.error(`  ✗ Manifest ist kein valides JSON: ${e.message}`);
  manifest = null;
}

if (manifest) {
  assert(typeof manifest.symbolCount === 'number', 'Manifest hat symbolCount');
  assert(Array.isArray(manifest.symbols), 'Manifest hat symbols-Array');
  assert(manifest.symbolCount === EXPECTED_SYMBOLS.length,
    `symbolCount (${manifest.symbolCount}) === erwartet (${EXPECTED_SYMBOLS.length})`);

  for (const expected of EXPECTED_SYMBOLS) {
    const found = manifest.symbols.find(s =>
      s.symbolClass === expected.symbolClass && s.variant === expected.variant
    );
    assert(found, `Symbol im Manifest: ${expected.symbolClass}__${expected.variant}`);

    if (found) {
      const pdfPath = path.join(PDF_DIR, found.pdf);
      const svgPath = path.join(PDF_DIR, '..', 'pdf-svg', found.svg);

      assert(fs.existsSync(pdfPath), `PDF-Datei existiert: ${found.pdf}`);
      assert(fs.existsSync(svgPath), `SVG-Quelldatei existiert: ${found.svg}`);

      const pdfSize = fs.statSync(pdfPath).size;
      assert(pdfSize > 1000, `PDF hat Mindestgroesse (>1KB): ${found.pdf} (${pdfSize} Bytes)`);

      const namePattern = /^[a-z_]+__[a-z0-9]+__din\.(pdf|svg)$/;
      assert(namePattern.test(found.pdf), `PDF-Dateiname folgt Vertrag: ${found.pdf}`);
      assert(namePattern.test(found.svg), `SVG-Dateiname folgt Vertrag: ${found.svg}`);

      const svgContent = fs.readFileSync(svgPath, 'utf8');
      const key = `${found.symbolClass}__${found.variant.toLowerCase()}`;
      const expectedLabels = EXPECTED_TERMINAL_LABELS[key];
      if (expectedLabels) {
        let allLabelsFound = true;
        for (const label of expectedLabels) {
          if (!svgContent.includes(`>${label}<`)) {
            allLabelsFound = false;
            assert(false, `SVG enthält Terminal-Label "${label}": ${found.svg}`);
          }
        }
        if (allLabelsFound) {
          assert(true, `SVG enthält alle Terminal-Labels [${expectedLabels.join(', ')}]: ${found.svg}`);
        }
      }

      assert(found.terminalLabels && Array.isArray(found.terminalLabels), `Manifest hat terminalLabels: ${found.symbolClass}`);
      assert(found.terminalRolePolicy && typeof found.terminalRolePolicy === 'object', `Manifest hat terminalRolePolicy: ${found.symbolClass}`);
      assert(found.labelPolicyType && typeof found.labelPolicyType === 'string', `Manifest hat labelPolicyType: ${found.symbolClass}`);
      assert(found.sourceStatus && typeof found.sourceStatus === 'string', `Manifest hat sourceStatus: ${found.symbolClass}`);

      const pdfBuffer = fs.readFileSync(pdfPath);
      const isPdf = pdfBuffer.toString('ascii', 0, 5) === '%PDF-';
      assert(isPdf, `PDF-Datei beginnt mit gültiger PDF-Signatur: ${found.pdf}`);
    }
  }

  const rootIndexPath = path.join(__dirname, '..', 'test_output', 'manifest', 'index.json');
  if (fs.existsSync(rootIndexPath)) {
    try {
      const rootIndex = JSON.parse(fs.readFileSync(rootIndexPath, 'utf8'));
      const st = rootIndex.symbolTemplates;
      assert(st && st.symbolCount === EXPECTED_SYMBOLS.length,
        `Root-Index symbolCount (${st ? st.symbolCount : 'fehlt'}) === erwartet (${EXPECTED_SYMBOLS.length})`);
    } catch (e) {
      assert(false, `Root-Index parsebar: ${e.message}`);
    }
  }

  const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
  assert(pdfFiles.length === EXPECTED_SYMBOLS.length,
    `Anzahl PDFs (${pdfFiles.length}) === erwartet (${EXPECTED_SYMBOLS.length})`);
}

console.log(`\nErgebnis: ${passCount} bestanden, ${failCount} fehlgeschlagen\n`);
process.exit(failCount > 0 ? 1 : 0);