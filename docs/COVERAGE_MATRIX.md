# Abdeckungsmatrix Elektro-Circuit-Core Symbolkern

Generiert: 2026-04-21
Basis: Realer Code, Templates, Registry, Beispiele, Tests

## Legende

- **ja** = implementiert, getestet, verwendbar
- **teilweise** = implementiert, aber mit Einschränkungen
- **nein** = nicht implementiert
- **belastbar** = in Schaltplan + Tests + PDF verwendet
- **teilweise** = Code vorhanden, aber nicht in allen Pfaden verifiziert
- **fehlt** = Code nicht vorhanden

## Matrix

| Symbolfamilie | Part-Type | Varianten | Klemmenlogik | Betriebsmittel-kennzeichnung | Querverweis-Notation | HTML/SVG | PDF-Vorlage | Im Schaltplan | Testabdeckung | Status |
|--------------|-----------|-----------|--------------|------------------------------|----------------------|----------|-------------|---------------|---------------|--------|
| Hilfskontakt NO | aux_no | NO | ja (13/14) | ja (im Rahmen) | ja (mechanischCoupledTo) | ja | ja | ja (4 Schaltungen) | ja (Visual) | belastbar |
| Hilfskontakt NC | aux_nc | NC | ja (21/22) | ja (im Rahmen) | ja (mechanischCoupledTo) | ja | ja | nein | ja (Visual) | teilweise |
| Spule | coil | standard | ja (A1/A2) | ja (im Rahmen) | ja (ANKER) | ja | ja | ja (4 Schaltungen) | ja (Visual) | belastbar |
| Lampe | lamp_element | standard | ja (IN/OUT) | ja (im Rahmen) | nein | ja | ja | ja (4 Schaltungen) | ja (Visual) | belastbar |
| Taster/Schalter | button_mechanism | NO, NC | ja (13/14 bzw. 21/22) | ja (im Rahmen) | nein | ja | ja | ja (4 Schaltungen) | ja (Visual) | belastbar |
| Zeitrelais-Spule | timer_coil | standard | ja (A1/A2) | ja (im Rahmen) | ja (ANKER) | ja | ja | ja (1 Schaltung) | nein | teilweise |
| Zeitrelais-Kontakt V | timer_contact_v | V (verzoegert) | ja (13/14) | ja (im Rahmen) | ja (mechanischCoupledTo) | ja | ja | ja (1 Schaltung) | nein | teilweise |
| Zeitrelais-Kontakt P | timer_contact_p | P (potentialfrei) | ja (13/14) | ja (im Rahmen) | ja (mechanischCoupledTo) | ja | ja | nein | nein | teilweise |
| Zeitrelais-Kontakt S | timer_contact_s | S (sofort) | ja (13/14) | ja (im Rahmen) | ja (mechanischCoupledTo) | ja | ja | ja (1 Schaltung) | nein | teilweise |
| Klemme | terminal_block | standard | ja (1/2) | ja (im Rahmen) | nein | ja | ja | nein | nein | teilweise |
| Sicherung | fuse | standard | ja (L/T) | ja (im Rahmen) | nein | ja | ja | nein | nein | teilweise |
| Wechslerkontakt | changeover_contact | standard | ja (11/14/12) | ja (im Rahmen) | nein | ja | ja | nein | ja (Render-Test) | teilweise |
| Leistungskontakt | power_contact | standard | ja (L1/T1) | ja (im Rahmen) | nein | ja | ja | nein | nein | teilweise |
| **Motorschutz** | — | — | **nein** | **nein** | **nein** | **nein** | **nein** | **nein** | **nein** | **fehlt** |
| **Motorschutz** | — | — | **nein** | **nein** | **nein** | **nein** | **nein** | **nein** | **nein** | **fehlt** |
| **Transformator** | — | — | **nein** | **nein** | **nein** | **nein** | **nein** | **nein** | **nein** | **fehlt** |
| **Leitung / Kabel** | — | — | **nein** | **nein** | **nein** | **nein** | **nein** | **nein** | **nein** | **fehlt** |

## Zusammenfassung

| Kategorie | Anzahl |
|-----------|--------|
| Belastbar (in Schaltplan + Tests + PDF) | 4 |
| Teilweise (Code vorhanden, nicht in allen Pfaden) | 9 |
| Fehlt (nicht implementiert) | 3 |
| **Gesamt implementiert** | **13 Part-Types** |
| **Gesamt fehlend** | **3 Familien** |

## Hinweise zu Teilweise-Einträgen

1. **aux_nc**: Template und Rendering vorhanden, aber in keiner Beispielschaltung verwendet
2. **timer_coil, timer_contact_v, timer_contact_p, timer_contact_s**: In zeitverzoegerung.json verwendet, aber keine dedizierten Visual-Tests für diese Schaltung
3. **timer_contact_p**: Nicht einmal in zeitverzoegerung.json verwendet (nur V und S)
4. **terminal_block, fuse, power_contact**: Template, Rendering und PDF vorhanden, aber keine Beispielschaltung
5. **changeover_contact**: Template, Rendering, PDF und Mini-Praxis-Test vorhanden, aber keine Beispielschaltung

## Implementierungsnachweise

- Templates: `src/generator/template-system.js`
- Registry: `src/generator/template-system.js`
- Rendering: `src/generator/template-system.js`
- Beispiele: `examples/*.json`
- Tests: `tests/visual/ci-minimal.spec.js` (prüft nur selbsthaltung, tippbetrieb, folgeschaltung)
- PDF: `scripts/generate-pdf-templates.js`
- Terminal-Labels: `scripts/generate-pdf-templates.js` (TERMINAL_LABELS Mapping)
- Changeover-Render-Test: `tests/changeover-render.test.js`