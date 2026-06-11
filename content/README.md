# content/ — V1-Core Content-Paket (Truth)

## Truth-Regel

- **`content/`** = Produktive, kuratierte Wahrheit. Diese Dateien werden von der App geladen.
- **`examples/`** = Demo- und Referenzmaterial. Nicht produktiv. Nicht von der App geladen.
- **Einstiegspunkt** = `content/v1_core_manifest.json`

## Verzeichnisstruktur

```
content/
├── v1_core_manifest.json          # Zentraler Einstiegspunkt — hier beginnt jede App-Instanz
├── concepts/
│   └── v1_core_concepts.json      # 10 Core-Concepts (Strom, Spannung, Widerstand, ...)
├── episode_cards/
│   └── v1_anchor_episodes.json    # 5 Anchor-Episoden (aus Dataset automatisch generiert)
├── modules/
│   └── module_grundlagen_v1.json  # Modul-Definition + 12-Schritte-Lernpfad
└── practice/
    ├── module_grundlagen_flashcards.json   # 10 Flashcards
    └── module_grundlagen_quiz.json         # 15 Quizfragen
```

## Statistik (V1-Core)

| Asset | Anzahl |
|-------|--------|
| Module | 1 |
| Anchor-Episoden | 5 |
| Core-Concepts | 10 |
| Lernpfad-Schritte | 12 |
| Flashcards | 10 |
| Quizfragen | 15 |

## Datei-Status

Alle Dateien in `content/` sind:
- JSON-valide (geprueft mit `python3 -m json.tool`)
- Mit `schema_version` versehen
- Aufeinander referenzierend (Modul → Concepts → Episodes → Practice)

## Repo-Kontext

Dieses Repository (`elektro-circuit-core`) beherbergt zwei unabhaengige Schichten:

1. **Schaltplan-Generator** (`src/generator/`, `test_output/`, `final/`)
   - Reift DIN/LAB-Schaltplaene als HTML/SVG
   - Eigene Manifest-Struktur unter `test_output/manifest/`
   - Heute nutzbar fuer visuelle Lernassets, aber **nicht** mit V1-Core gekoppelt

2. **Giancarlo V1-Core Content** (`content/`, `examples/giancarlo*.json`)
   - Podcast-basierte Lerninhalte (Audio, Concepts, Quiz, Flashcards)
   - Eigenstaendiger Truth-Layer mit eigenem Manifest
   - Keine Abhaengigkeit zum Schaltplan-Generator

**Entscheidung:** Die beiden Schichten bleiben bewusst entkoppelt. Eine spaetere Integration (z. B. Schaltplaene als visuelle Lernassets in Lerneinheiten) ist perspektivisch moeglich, aber nicht Teil von V1-Core.

## Nicht in `content/` (Beispiele/Referenz)

- `examples/giancarlo_20_concepts.json` — Erweitertes Concept-Set (20 Stueck), Referenz
- `examples/giancarlo_mvp_content_model.json` — Fruehes MVP-Modell, Referenz
- `examples/giancarlo_mvp_module_seed.json` — Seed-Daten fuer Modul-Planung, Referenz

Diese Dateien dienen der Dokumentation und dem Archiv. Sie sind nicht Teil des produktiven V1-Core-Pakets.
