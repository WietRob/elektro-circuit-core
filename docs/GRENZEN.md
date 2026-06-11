# Grenzen und Ausblick Elektro-Circuit-Core

Generiert: 2026-04-21

## Was heute geht (belastbar)

| Bereich | Status | Nachweis |
|---------|--------|----------|
| Hilfskontakt NO | Belastbar | 4 Schaltungen, Tests, PDF |
| Hilfskontakt NC | Belastbar | Template + PDF, aber keine Beispielschaltung |
| Spule | Belastbar | 4 Schaltungen, Tests, PDF |
| Lampe | Belastbar | 4 Schaltungen, Tests, PDF |
| Taster/Schalter NO/NC | Belastbar | 4 Schaltungen, Tests, PDF |
| Zeitrelais-Spule | Teilweise | Template + PDF, aber nur 1 Beispielschaltung |
| Zeitrelais-Kontakt V/P/S | Teilweise | Template + PDF, aber nur V+S in Beispiel |
| Klemme | Teilweise | Template + PDF, keine Beispielschaltung |
| Sicherung | Teilweise | Template + PDF, keine Beispielschaltung |
| Wechslerkontakt | Teilweise | Template + PDF + isolierter Render-Test + Mini-Praxisnachweis, keine Beispielschaltung |
| Leistungskontakt | Teilweise | Template + PDF, keine Beispielschaltung |

## Was teilweise geht

| Bereich | Einschränkung |
|---------|---------------|
| Zeitrelais-Variante P | Nicht in Beispielschaltung verwendet |
| Klemmennummerierung | IEC-nähere Terminalbeschriftung in PDF-Vorlagen: aux_no/aux_nc/button NO → 13/14, button NC → 21/22, coil/timer_coil → A1/A2, changeover → 11/14/12, power_contact → L1/T1, fuse → L/T, terminal_block → 1/2. Keine vollständige IEC-Klemmennummerierung (z.B. keine 21/22 für Öffner in allen Kontexten) |
| LAB-Ansicht für Einzelvorlagen | Nur DIN-Ansicht in PDFs |
| Querverweise | Mechanische Kopplung als Linie, aber keine elektrischen Querverweise |

## Was nicht geht

| Bereich | Grund |
|---------|-------|
| Motorschutz | Nicht implementiert |
| Transformator | Nicht implementiert |
| SPS-Ein-/Ausgänge | Nicht implementiert |
| Frequenzumrichter | Nicht implementiert |
| Leitungs-/Kabelsymbole | Nicht implementiert |
| Vollständige IEC 60617-Abdeckung | Nur ~14 von ~100+ Symbolen |

## Nächster Ausbaupfad (empfohlen)

1. **Motorschutz** - Thermische Auslösung
2. **Transformator** - Wicklungen und Anschlüsse

## Was bewusst außerhalb des Scopes bleibt

- Keine vollständige Normabdeckung (IEC 60617 hat 100+ Symbole)
- Keine 3D-Visualisierung
- Keine automatische Schaltplan-Generierung aus Logik
- Keine Echtzeit-Simulation
- Keine SPS-Programmierung

## Versionierung

- Generator: 2.0.0
- Symbolkern: 13 Part-Types
- PDF-Vorlagen: 14 Varianten
- Beispielschaltungen: 4

## Letzte Aktualisierung

2026-04-21: Terminal-Label-Policy (IEC-Klemmen), harter PDF-Test mit Manifest-Semantik (terminalLabels, terminalRolePolicy, labelPolicyType, sourceStatus), isolierter changeover_render-Test, Mini-Praxisnachweis für changeover_contact