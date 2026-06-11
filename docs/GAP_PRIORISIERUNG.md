# Gap-Priorisierung Elektro-Circuit-Core

Generiert: 2026-04-21
Basis: docs/COVERAGE_MATRIX.md und docs/coverage-matrix.json

## A. Bereits belastbar (4 Familien)

| Familie | Part-Type | Nachweis |
|---------|-----------|----------|
| Hilfskontakt NO | aux_no | 4 Schaltungen, Visual-Tests, PDF |
| Spule | coil | 4 Schaltungen, Visual-Tests, PDF |
| Lampe | lamp_element | 4 Schaltungen, Visual-Tests, PDF |
| Taster/Schalter | button_mechanism | 4 Schaltungen, Visual-Tests, PDF |

## B. Teilweise belastbar (9 Familien)

| Familie | Part-Type | Was fehlt |
|---------|-----------|-----------|
| Hilfskontakt NC | aux_nc | Keine Beispielschaltung |
| Zeitrelais-Spule | timer_coil | Keine dedizierten Tests |
| Zeitrelais-Kontakt V | timer_contact_v | Keine dedizierten Tests |
| Zeitrelais-Kontakt P | timer_contact_p | Nicht in Beispielschaltung |
| Zeitrelais-Kontakt S | timer_contact_s | Keine dedizierten Tests |
| Klemme | terminal_block | Keine Beispielschaltung |
| Sicherung | fuse | Keine Beispielschaltung |
| Wechslerkontakt | changeover_contact | Keine Beispielschaltung |
| Leistungskontakt | power_contact | Keine Beispielschaltung |

## C. Nächste Ausbaupfade (nach Priorität)

### C1. Motorschutz / Overload Relay (HÖCHSTE PRIORITÄT)

**Begründung:**
- Wichtig für Motorschutz
- Komplexere Geometrie
- Mehr Terminals

**Technische Einschätzung:**
- Terminals: mehrere (Strompfad + Hilfskontakt)
- Geometrie: Rechteck mit speziellem Symbol
- State-Logik: thermisch auslösend
- Höhere Komplexität

### C2. Transformator (NIEDRIGE PRIORITÄT)

**Begründung:**
- Netzteil, Potenzialtrennung
- Komplexere Geometrie, mehrere Wicklungen

**Technische Einschätzung:**
- Terminals: mehrere (Primär- und Sekundärwicklung)
- Geometrie: Kreise mit Wicklungen
- Keine State-Logik
- Mittlere Komplexität

**Begründung:**
- Wichtig für Motorschutz
- Komplexere Geometrie
- Mehr Terminals

**Technische Einschätzung:**
- Terminals: mehrere (Strompfad + Hilfskontakt)
- Geometrie: Rechteck mit speziellem Symbol
- State-Logik: thermisch auslösend
- Höhere Komplexität

## D. Außerhalb des aktuellen Scopes

| Familie | Grund |
|---------|-------|
| Transformator | Komplexere Geometrie, mehrere Wicklungen |
| Leitung / Kabel | Kein Schaltzeichen im engeren Sinn |
| Steuertransformator | Spezialanwendung |
| Frequenzumrichter | Sehr komplex |
| SPS-Eingang/Ausgang | Digital/Analog, sehr breites Feld |

## Empfohlene Implementierungsreihenfolge

1. **overload_relay** (Motorschutz)
2. **transformer** (Transformator)

## Gelöste technische Fragen

1. **Klemme:** Einzelklemme mit top/bottom Terminals
2. **Sicherung:** IEC-Symbol (Rechteck mit Mittelstrich)
3. **Wechsler:** 3 Terminals (common, no, nc) mit State-Logik
4. **Leistungskontakt:** Dickere Linie als visueller Unterschied

## Offene technische Fragen

1. **Motorschutz:** Thermische Auslösung als State oder nur statisches Symbol?
2. **Transformator:** Primär- und Sekundärwicklung als separate Terminals oder gemeinsam?