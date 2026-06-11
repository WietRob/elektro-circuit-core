#!/usr/bin/env node
/**
 * generate-pdf-templates.js - PDF-Vorlagenbibliothek für Schaltzeichen
 *
 * Nutzung:
 *   node scripts/generate-pdf-templates.js              # Dev-Build nach test_output/pdf/
 *   node scripts/generate-pdf-templates.js --candidate  # Candidate-Build nach candidates/pdf/
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const { TemplateRenderer, TEMPLATE_REGISTRY } = require('../src/generator/template-system.js');

const isCandidate = process.argv.includes('--candidate');
const baseDir = isCandidate
  ? path.join(__dirname, '..', 'candidates')
  : path.join(__dirname, '..', 'test_output');
const pdfDir = path.join(baseDir, 'pdf');
const svgDir = path.join(baseDir, 'pdf-svg');

const SYMBOL_DEFINITIONS = [
  { symbolClass: 'contact', variant: 'NO', label: 'Schliesser (NO)' },
  { symbolClass: 'contact', variant: 'NC', label: 'Oeffner (NC)' },
  { symbolClass: 'coil', variant: 'standard', label: 'Spule' },
  { symbolClass: 'lamp', variant: 'standard', label: 'Lampe' },
  { symbolClass: 'button', variant: 'NO', label: 'Taster Schliesser (NO)' },
  { symbolClass: 'button', variant: 'NC', label: 'Taster Oeffner (NC)' },
  { symbolClass: 'timer_coil', variant: 'standard', label: 'Zeitrelais-Spule' },
  { symbolClass: 'timer_contact', variant: 'V', label: 'Zeitrelais-Verzoegert (V)' },
  { symbolClass: 'timer_contact', variant: 'P', label: 'Zeitrelais-Potentialfrei (P)' },
  { symbolClass: 'timer_contact', variant: 'S', label: 'Zeitrelais-Sofort (S)' },
  { symbolClass: 'terminal_block', variant: 'standard', label: 'Klemme' },
  { symbolClass: 'fuse', variant: 'standard', label: 'Sicherung' },
  { symbolClass: 'changeover_contact', variant: 'standard', label: 'Wechsler' },
  { symbolClass: 'power_contact', variant: 'standard', label: 'Leistungskontakt' }
];

const PAGE_SIZE = { width: '150px', height: '150px' };

const TERMINAL_LABELS = {
  contact: { NO: ['13', '14'], NC: ['21', '22'] },
  button: { NO: ['13', '14'], NC: ['21', '22'] },
  coil: { standard: ['A1', 'A2'] },
  timer_coil: { standard: ['A1', 'A2'] },
  timer_contact: { V: ['13', '14'], P: ['13', '14'], S: ['13', '14'] },
  lamp: { standard: ['IN', 'OUT'] },
  terminal_block: { standard: ['1', '2'] },
  fuse: { standard: ['L', 'T'] },
  changeover_contact: { standard: ['11', '14', '12'] },
  power_contact: { standard: ['L1', 'T1'] }
};

const TERMINAL_ROLE_POLICIES = {
  contact: { NO: { in: '13', out: '14' }, NC: { in: '21', out: '22' } },
  button: { NO: { in: '13', out: '14' }, NC: { in: '21', out: '22' } },
  coil: { standard: { in: 'A1', out: 'A2' } },
  timer_coil: { standard: { in: 'A1', out: 'A2' } },
  timer_contact: { V: { in: '13', out: '14' }, P: { in: '13', out: '14' }, S: { in: '13', out: '14' } },
  lamp: { standard: { in: 'IN', out: 'OUT' } },
  terminal_block: { standard: { top: '1', bottom: '2' } },
  fuse: { standard: { line: 'L', load: 'T' } },
  changeover_contact: { standard: { common: '11', no: '14', nc: '12' } },
  power_contact: { standard: { in: 'L1', out: 'T1' } }
};

const LABEL_POLICY_TYPES = {
  contact: 'iec_like',
  button: 'iec_like',
  coil: 'iec_like',
  timer_coil: 'iec_like',
  timer_contact: 'iec_like',
  lamp: 'neutral',
  terminal_block: 'neutral',
  fuse: 'neutral',
  changeover_contact: 'iec_like',
  power_contact: 'neutral'
};

const SOURCE_STATUS = {
  contact: 'used_in_example',
  button: 'used_in_example',
  coil: 'used_in_example',
  lamp: 'used_in_example',
  timer_coil: 'used_in_example',
  timer_contact: 'used_in_example',
  terminal_block: 'template_and_pdf_only',
  fuse: 'template_and_pdf_only',
  changeover_contact: 'render_test_only',
  power_contact: 'template_and_pdf_only'
};

function getTerminalLabels(symbolClass, variant) {
  const mapping = TERMINAL_LABELS[symbolClass];
  if (!mapping) return null;
  return mapping[variant] || null;
}

async function generateSymbolSvg(symbolDef) {
  const renderer = new TemplateRenderer();
  const { symbolClass, variant, label } = symbolDef;

  const labels = getTerminalLabels(symbolClass, variant);

  let terminals;
  if (symbolClass === 'changeover_contact') {
    terminals = [
      { terminal: labels ? labels[0] : '11', x: 75, y: 30 },
      { terminal: labels ? labels[1] : '14', x: 105, y: 120 },
      { terminal: labels ? labels[2] : '12', x: 45, y: 120 }
    ];
  } else {
    terminals = [
      { terminal: labels ? labels[0] : '1', x: 75, y: 30 },
      { terminal: labels ? labels[1] : '2', x: 75, y: 120 }
    ];
  }

  let templateKey;
  if (symbolClass === 'contact') templateKey = variant === 'NO' ? 'aux_no' : 'aux_nc';
  else if (symbolClass === 'button') templateKey = 'button_mechanism';
  else if (symbolClass === 'coil') templateKey = 'coil';
  else if (symbolClass === 'lamp') templateKey = 'lamp_element';
  else if (symbolClass === 'timer_coil') templateKey = 'timer_coil';
  else if (symbolClass === 'timer_contact') templateKey = `timer_contact_${variant.toLowerCase()}`;
  else if (symbolClass === 'terminal_block') templateKey = 'terminal_block';
  else if (symbolClass === 'fuse') templateKey = 'fuse';
  else if (symbolClass === 'changeover_contact') templateKey = 'changeover_contact';
  else if (symbolClass === 'power_contact') templateKey = 'power_contact';

  const template = renderer.getTemplate(templateKey);
  if (!template) {
    throw new Error(`Template nicht gefunden: ${templateKey}`);
  }

  const state = {};
  if (symbolClass === 'lamp') state.lit = false;
  else if (symbolClass === 'button') state.pressed = false;
  else state.closed = false;

  if (symbolClass === 'coil' || symbolClass === 'timer_coil') state.active = false;

  const symbolSvg = renderer.render(templateKey, terminals, variant, state);

  const terminalCircles = terminals.map(t =>
    `  <circle cx="${t.x}" cy="${t.y}" r="3" fill="#000" stroke="none"/>`
  ).join('\n');

  const terminalLabels = terminals.map(t => {
    let tx = t.x, ty = t.y - 8, anchor = 'middle';
    if (symbolClass === 'changeover_contact') {
      if (t.x > 75) { tx = t.x + 8; ty = t.y; anchor = 'start'; }
      else if (t.x < 75) { tx = t.x - 8; ty = t.y; anchor = 'end'; }
    }
    return `  <text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="8" fill="#000" font-family="Arial, sans-serif">${t.terminal}</text>`;
  }).join('\n');

  const viewBox = '0 0 150 150';
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="150" height="150">
  <rect x="0" y="0" width="150" height="150" fill="white" stroke="none"/>
  <g transform="translate(0, 0)">
${symbolSvg}  </g>
  ${terminalCircles}
  ${terminalLabels}
  <text x="75" y="145" text-anchor="middle" font-size="10" fill="#000" font-family="Arial, sans-serif">${label}</text>
</svg>`;

  return svgContent;
}

async function svgToPdf(svgContent, outputPath) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: white; }
        svg { display: block; }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>
  `);

  await page.waitForLoadState('networkidle');

  await page.pdf({
    path: outputPath,
    width: PAGE_SIZE.width,
    height: PAGE_SIZE.height,
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });

  await browser.close();
}

async function main() {
  console.log(`╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  PDF-Vorlagenbibliothek Generator                         ║`);
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  console.log(`║  Modus: ${isCandidate ? 'CANDIDATE -> candidates/pdf/' : 'DEV      -> test_output/pdf/'} ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝\n`);

  [pdfDir, svgDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const results = [];

  for (const symbolDef of SYMBOL_DEFINITIONS) {
    const { symbolClass, variant } = symbolDef;
    const fileName = `${symbolClass}__${variant.toLowerCase()}__din`;
    const svgPath = path.join(svgDir, `${fileName}.svg`);
    const pdfPath = path.join(pdfDir, `${fileName}.pdf`);

    try {
      const svgContent = await generateSymbolSvg(symbolDef);
      fs.writeFileSync(svgPath, svgContent);

      await svgToPdf(svgContent, pdfPath);

      const pdfSize = fs.statSync(pdfPath).size;
      results.push({ symbolClass, variant, pdfPath, svgPath, size: pdfSize, status: 'ok' });
      console.log(`  ✓ ${fileName}.pdf (${(pdfSize / 1024).toFixed(2)} KB)`);
    } catch (error) {
      results.push({ symbolClass, variant, pdfPath, svgPath, error: error.message, status: 'error' });
      console.error(`  ✗ ${fileName}.pdf - ${error.message}`);
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    buildType: isCandidate ? 'candidate' : 'dev',
    symbolCount: results.filter(r => r.status === 'ok').length,
    symbols: results.filter(r => r.status === 'ok').map(r => {
      const partTypeMap = {
        contact: r.variant === 'NO' ? 'aux_no' : 'aux_nc',
        button: 'button_mechanism',
        coil: 'coil',
        lamp: 'lamp_element',
        timer_coil: 'timer_coil',
        timer_contact: `timer_contact_${r.variant.toLowerCase()}`,
        terminal_block: 'terminal_block',
        fuse: 'fuse',
        changeover_contact: 'changeover_contact',
        power_contact: 'power_contact'
      };
      return {
        symbolClass: r.symbolClass,
        variant: r.variant,
        partType: partTypeMap[r.symbolClass] || r.symbolClass,
        view: 'din',
        pdf: path.basename(r.pdfPath),
        svg: path.basename(r.svgPath),
        sizeBytes: r.size,
        terminalLabels: TERMINAL_LABELS[r.symbolClass]?.[r.variant] || null,
        terminalRolePolicy: TERMINAL_ROLE_POLICIES[r.symbolClass]?.[r.variant] || null,
        labelPolicyType: LABEL_POLICY_TYPES[r.symbolClass] || 'neutral',
        sourceStatus: SOURCE_STATUS[r.symbolClass] || 'template_and_pdf_only'
      };
    })
  };

  const manifestPath = path.join(pdfDir, 'symbol-templates.manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n══════════════════════════════════════════════════════════════`);
  console.log(`Ergebnis: ${results.filter(r => r.status === 'ok').length} erfolgreich, ${results.filter(r => r.status === 'error').length} fehlgeschlagen`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`══════════════════════════════════════════════════════════════`);
}

main().catch(error => {
  console.error('Fehler:', error);
  process.exit(1);
});