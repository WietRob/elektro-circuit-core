# Elektro-Circuit-Core

Elektrotechnik Schaltplan-Generator für DIN/LAB-Ansichten.

## Schnellstart

```bash
npm run check    # Konsistenz-Check
npm run build    # Build nach test_output/
npm test         # Alle Tests ausführen
```

## Build-Artefakte

Jede Schaltung wird in zwei strikt getrennten Varianten generiert:

| Variante | Datei-Suffix | Inhalt |
|----------|--------------|--------|
| **GRUNDBILD** | `_grundbild.html` | Reiner technischer Schaltplan ohne Didaktik |
| **OVERLAY** | `_overlay.html` | Interaktive Schaltung mit Didaktik-Layer |

### Unterschiede

**GRUNDBILD:** DIN-Ansicht + LAB-Ansicht, Rails, Wires, Komponenten

**OVERLAY:** Zusätzlich Zonen-Markierung, Topologie-Overlay, interaktive Steuerung, State-Machine-Animation

## Struktur

- `src/generator/` - Generator-Module (7 Module, ~2800 Zeilen)
- `examples/` - Schaltungs-Beispiele (selbsthaltung, tippbetrieb, folgeschaltung)
- `schemas/` - JSON-Schemas (Ontologie + Manifest-Validierung)
- `scripts/` - Build-Skripte
- `tests/` - Unit-Tests (Koordinatenbeweis, State-Engine, Geometrie-Vertrag)

## Generator-Modus

Der Generator unterstützt zwei Modi über die `mode`-Option:

```javascript
const generator = new CircuitGeneratorV2(specPath, { mode: 'grundbild' });
const generator = new CircuitGeneratorV2(specPath, { mode: 'overlay' });
```

## Lizenz

MIT
