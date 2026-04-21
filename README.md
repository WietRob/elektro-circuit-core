# Elektro-Circuit-Core

Elektrotechnik Schaltplan-Generator für DIN/LAB-Ansichten.

## Schnellstart

```bash
npm run check    # Konsistenz-Check
npm run build    # Build nach test_output/
npm test         # Alle Tests ausführen
```

## Build-Artefakte

Jede Schaltung wird in zwei strikt getrennten Varianten generiert, jeweils als HTML und SVG:

| Variante | HTML | SVG | Inhalt |
|----------|------|-----|--------|
| **GRUNDBILD** | `_grundbild.html` | `_grundbild.svg` | Reiner technischer Schaltplan ohne Didaktik |
| **OVERLAY** | `_overlay.html` | `_overlay.svg` | Interaktive Schaltung mit Didaktik-Layer |

### Unterschiede

**GRUNDBILD:** DIN-Ansicht + LAB-Ansicht, Rails, Wires, Komponenten

**OVERLAY:** Zusätzlich Zonen-Markierung, Topologie-Overlay, interaktive Steuerung, State-Machine-Animation

### Output-Struktur

```
test_output/          # Dev-Build (vom Generator erzeugt, .gitignore)
├── html/             # HTML-Dateien
├── svg/              # SVG-Dateien
└── manifest/         # Manifeste + Root-Index
    ├── index.json                      # Root-Index für App-Discovery
    ├── selbsthaltung.manifest.json
    ├── tippbetrieb.manifest.json
    └── folgeschaltung.manifest.json

candidates/           # Build-Kandidaten (vom Generator erzeugt)
├── html/
├── svg/
└── manifest/

final/                # KANONISCH (manuell gepflegt, NICHT vom Build überschrieben)
├── html/             # Kanonische HTML (manuell)
└── svg/              # Kanonische SVG (manuell)
# Hinweis: final/manifest/ existiert aktuell nicht automatisch
```

## App-Integrations-Manifest

### Root-Index (`manifest/index.json`)

Der Build erzeugt einen Root-Index für App-Discovery:

```json
{
  "generatedAt": "2026-04-21T10:52:48.924Z",
  "buildType": "dev",
  "circuits": [
    {
      "circuitId": "selbsthaltung",
      "title": "selbsthaltung",
      "manifest": "manifest/selbsthaltung.manifest.json",
      "variants": ["grundbild", "overlay"],
      "formats": ["html", "svg"]
    }
  ]
}
```

**Nutzung:** Die Lern-App lädt `manifest/index.json` und findet damit alle verfügbaren Schaltungen ohne Verzeichnis-Scanning.

### Per-Circuit-Manifest (`manifest/{circuit}.manifest.json`)

Jede Schaltung erhält ein Detail-Manifest:

```json
{
  "circuitId": "selbsthaltung",
  "version": "2.1.0",
  "title": "selbsthaltung",
  "variants": ["grundbild", "overlay"],
  "formats": ["html", "svg"],
  "artifacts": {
    "grundbild": {
      "html": "html/selbsthaltung_grundbild.html",
      "svg": "svg/selbsthaltung_grundbild.svg"
    },
    "overlay": {
      "html": "html/selbsthaltung_overlay.html",
      "svg": "svg/selbsthaltung_overlay.svg"
    }
  },
  "states": ["initial", "active", "reset"],
  "triggers": ["S1.pressed", "S2.pressed", "S2.released"],
  "componentIds": ["S2", "S1", "K1", "P1"]
}
```

**Nutzung für die Lern-App:**
- `variants` + `artifacts` → Pfade zu den Grafik-Assets
- `states` + `triggers` → Interaktions-Modell
- `componentIds` → Verfügbare Bauteile

## Struktur

- `src/generator/` - Generator-Module (7 Module, ~2800 Zeilen)
- `examples/` - Schaltungs-Beispiele (selbsthaltung, tippbetrieb, folgeschaltung)
- `schemas/` - JSON-Schemas (Ontologie + Manifest-Validierung)
- `scripts/` - Build-Skripte
- `tests/` - Unit-Tests (Koordinatenbeweis, State-Engine, Geometrie-Vertrag)

## Generator-API

```javascript
const { CircuitGeneratorV2 } = require('./src/generator/circuit-generator-v2.js');

// HTML-Export (beide Ansichten in einer Datei)
const generator = new CircuitGeneratorV2(specPath, { mode: 'grundbild' });
const html = generator.generate();

// SVG-Export (einzelne Ansicht)
const svgDin = generator.generateSVG('DIN');   // DIN-Ansicht
const svgLab = generator.generateSVG('LAB');   // LAB-Ansicht
```

### Modi

| Modus | HTML | SVG | Beschreibung |
|-------|------|-----|--------------|
| `grundbild` | DIN + LAB, keine Didaktik | DIN, keine Didaktik | Reiner technischer Schaltplan |
| `overlay` | DIN + LAB, mit Didaktik | DIN, mit Didaktik | Interaktive Lehrvariante |

## Lokaler Qualitäts-Gate

Der lokale Prüfpfad verifiziert den aktuell belastbaren Generator-Stand ohne CI/CD:

```bash
npm run verify:local        # Build + Unit-Tests + Minimale Visual-Tests
npm run verify:visual:local # Build + Nur Visual-Tests
npm run check               # Konsistenz-Check (kein Build)
```

### Was geprüft wird

| Befehl | Build | Unit-Tests | Visual-Tests | Tests |
|--------|-------|------------|--------------|-------|
| `npm run verify:local` | ✓ | 66 | 18 | 84 |
| `npm test` | – | 66 | – | 66 |
| `npm run test:visual` | – | – | 18 | 18 |

**Unit-Tests (66):**
- Koordinatenbeweis (Terminal-Positionen, Geometrie)
- State-Engine (Zustandsübergänge, Initialzustände)
- Geometrie-Vertrag (Bounds, Rails, Caching)

**Visual-Tests (18):**
- DOM-Struktur (DIN/LAB-Ansichten vorhanden)
- Rails-Farben (IEC 60446)
- Orthogonale Verdrahtung
- SVG viewBox
- Controls und Reset-Button

### Was bewusst NICHT geprüft wird

- Story-Mode / Didaktik-Panel (noch nicht im Generator)
- Screenshot-Baselines (Snapshots veraltet)
- Transfer-Highlighting DIN↔LAB

## Lokaler Runtime-Gate (getrennt)

Ein eigener Prüfpfad für Runtime-State-Tests, die DOM-Interaktionen erfordern:

```bash
npm run verify:runtime:local   # Build + Runtime-Smoke-Tests
npm run test:runtime           # Nur Runtime-Tests (ohne Build)
```

**Runtime-Tests (6):**
- `smoke.spec.js` (3) – Selbsthaltung: State-Transitions, data-projected-state
- `folgeschaltung-smoke.spec.js` (3) – Folgeschaltung: Multi-Step-Transitions

**Warum getrennt:** Runtime-Tests brauchen einen laufenden Browser und sind langsamer als der Haupt-Gate. Sie prüfen `window.currentState`, `data-runtime-target` und `data-projected-state` nach DOM-Interaktionen. Der Haupt-Gate bleibt schlank und schnell.

## Lizenz

MIT
