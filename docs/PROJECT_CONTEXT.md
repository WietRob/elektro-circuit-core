# Projekt-Kontext

Dieses Repo ist Teil eines größeren Systems. Diese Datei hält die zentrale Wahrheit fest.

## Gesamtarchitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    Lern-App (Zielprodukt)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Inhaltliche │  │  Schaltplan- │  │  Interaktive │     │
│  │  Struktur    │  │  Grafiken    │  │  Übungen     │     │
│  │  (Didaktik)  │  │  (DIN/LAB)   │  │  (State)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
         │                    │
┌────────┴────────┐  ┌────────┴────────┐
│ Giancarlo       │  │ Elektro-Circuit-│
│ Elektrotechnik  │  │ Core (dieses    │
│ Podcasts        │  │ Repo)           │
│                 │  │                 │
│ → Inhaltliche   │  │ → Schaltplan-   │
│   Struktur      │  │   Generator     │
│   (Themen,      │  │   (HTML/SVG)    │
│   Didaktik)     │  │                 │
└─────────────────┘  └─────────────────┘
```

## Datenflüsse

### 1. Giancarlo Podcasts → Lern-App

- **Quelle:** Giancarlo Elektrotechnik Podcasts (RSS-Feed)
- **Verarbeitung:** Auswertung der Episoden für inhaltliche Struktur
- **Output:** Themen, Begriffe, Didaktik-Sequenzen für die Lern-App
- **Ort:** Extern, nicht in diesem Repo versioniert
- **Status:** Inhaltliche Analyse läuft parallel

### 2. Elektro-Circuit-Core → Lern-App

- **Quelle:** Dieses Repo (`elektro-circuit-core`)
- **Verarbeitung:** Schaltplan-Generator erzeugt HTML + SVG
- **Output:** Interaktive Schaltpläne (GRUNDBILD + OVERLAY)
- **Verwendung:** Direkte Einbindung in die Lern-App als Grafik-Asset
- **Status:** Generator operational, lokaler Gate grün

## Repo-Grenzen

**Was IN diesem Repo ist:**
- Schaltplan-Generator (CircuitGeneratorV2)
- JSON-Schemas für Schaltungs-Spezifikationen
- Build-Skripte für HTML/SVG-Output
- Tests für Generator-Korrektheit
- Lokaler Qualitäts-Gate

**Was AUSSERHALB dieses Repos bleibt:**
- Giancarlo Podcast-Auswertung (inhaltliche Analyse)
- Lern-App-Frontend (noch nicht begonnen)
- Didaktik-Struktur (kommt aus Podcast-Analyse)
- Final-Auslieferung (manuell gepflegt in `final/`)

## Artefaktvertrag

| Artefakt | Pfad | Status |
|----------|------|--------|
| Dev-HTML/SVG | `test_output/` | Temporär, .gitignore |
| Candidates | `candidates/` | Build-Kandidaten |
| Final | `final/` | Kanonisch, manuell |
| Giancarlo-Analyse | extern/lokal | Nicht versioniert |

## Lokaler Gate

```bash
npm run verify:local   # Build + 66 Unit-Tests + 18 Visual-Tests
```

## Verwandte Repos

- **GitHub:** `WietRob/elektro-circuit-core` (dieses Repo)
- **Extern:** Giancarlo Podcast-Auswertung (lokale Analyse)
