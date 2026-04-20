# Giancarlo-Podcast — Repo-Integrationsbericht

**Datum:** 2026-04-20  
**Repo:** `/home/roberto_schmidt/projects/elektro-circuit-core`  
**Status:** Abgeschlossen

---

## 1. KURZURTEIL

Alle Giancarlo-/summarize.sh-Artefakte sind erfolgreich in das Zielrepo überführt, strukturiert und verifiziert worden. Der Parser ist reproduzierbar lauffähig. Der Quellordner ist frei von Restbeständen.

---

## 2. VOLLSTÄNDIGKEITSPRÜFUNG

### 2.1 Im Repo und relevant

| Datei | Pfad | Größe | Typ |
|-------|------|-------|-----|
| `giancarlo_dataset_v2.json` | `data/giancarlo/` | 1,6 MB | Aktives Dataset (v2) |
| `giancarlo_all_episodes.json` | `data/giancarlo/` | 645 KB | Legacy Dataset (v1) |
| `AUDIT_Giancarlo_Extraktion.md` | `docs/research/giancarlo/` | 9,2 KB | Audit-Report |
| `giancarlo_lernapp_analyse.md` | `docs/research/giancarlo/` | 365 KB | Themen-Analyse |
| `GIANCARLO_SCHEMA.md` | `docs/research/giancarlo/` | 3,7 KB | Schema-Dokumentation |
| `parse_giancarlo_rss.py` | `scripts/` | 18,5 KB | RSS-Parser v2 |

### 2.2 Außerhalb des Repos — bewusst temporär

| Datei/Ordner | Pfad | Grund |
|--------------|------|-------|
| `giancarlo_feed.xml` | `/tmp/` | RSS-Feed-Cache, kann jederzeit neu geladen werden |
| `summarize/` | `/tmp/` | Externes Projekt (steipete/summarize), nicht versionierbar |
| `whisper.cpp/` | `/tmp/` | Kompilierte Binary, nicht versionierbar |

### 2.3 Quellordner-Prüfung

`/home/roberto_schmidt/Dokumente/Unterrichtsvorbereitung/` — **Keine Giancarlo-Restdateien gefunden.**

---

## 3. UMGESETZTE REPO-STRUKTUR

```
elektro-circuit-core/
├── data/
│   └── giancarlo/
│       ├── giancarlo_all_episodes.json      # Legacy v1
│       └── giancarlo_dataset_v2.json        # Aktiv v2
├── docs/
│   └── research/
│       └── giancarlo/
│           ├── AUDIT_Giancarlo_Extraktion.md
│           ├── giancarlo_lernapp_analyse.md
│           └── GIANCARLO_SCHEMA.md
└── scripts/
    ├── build.js                               # Bestehend
    └── parse_giancarlo_rss.py                 # Neu (v2)
```

---

## 4. GEÄNDERTE Pfade / DATEIEN

### Parser (`scripts/parse_giancarlo_rss.py`)
- Ausgabe-Pfade aktualisiert:
  - `giancarlo_dataset_v2.json` → `data/giancarlo/giancarlo_dataset_v2.json`
  - `giancarlo_lernapp_analyse.md` → `docs/research/giancarlo/giancarlo_lernapp_analyse.md`
  - `GIANCARLO_SCHEMA.md` → `docs/research/giancarlo/GIANCARLO_SCHEMA.md`

### Markdown-Analyse (`giancarlo_lernapp_analyse.md`)
- Aktualisiert: Quellen-Statistik (40/252 EPs, 378 Quellen)
- Hinweis auf Heuristiken bei difficulty/topics

---

## 5. REPRO-RUN + VERIFIKATION

**Befehl:** `python3 scripts/parse_giancarlo_rss.py` (aus Repo-Root)

**Ergebnis:**
```
Wrote 252 episodes to .../data/giancarlo/giancarlo_dataset_v2.json
Episodes with sources: 40/252
Total sources extracted: 378
```

**Verifikation:**

| Prüfung | Ergebnis |
|---------|----------|
| COUNT | JSON=252, RSS=252 ✅ MATCH |
| DEDUPLIKATION | GUID=252/252, NUM=252/252 ✅ OK |
| FELDVOLLSTÄNDIGKEIT | 0 fehlende GUIDs, 0 fehlende Audio-URLs ✅ OK |
| STICHPROBE (10 EPs) | 10/10 title/guid/audio_url ✅ OK |
| SOURCES (Top 5) | EP#245:19, #237:16, #244:16, #246:16, #250:15 ✅ OK |
| SOURCES-GESAMT | 40/252 Episoden, 378 Quellen ✅ OK |
| SCHEMA-KONSISTENZ | Alle 252 EPs haben Raw+Derived ✅ OK |

---

## 6. GIT-STATUS

```
Auf Branch master
Unversionierte Dateien:
  data/
  docs/
  scripts/parse_giancarlo_rss.py
```

**Empfehlung zur Versionierung:**
- **Versionieren:** `scripts/parse_giancarlo_rss.py`, `docs/research/giancarlo/*.md`
- **Nicht versionieren (`.gitignore`):** `data/giancarlo/*.json` (abgeleitete Artefakte, können jederzeit neu erzeugt werden)
- **Löschen:** `giancarlo_all_episodes.json` (veraltet, v1 hat Source-Defekt)

---

## 7. RESTRISIKEN

| Risiko | Schwere | Maßnahme |
|--------|---------|----------|
| Große JSONs im Git | Niedrig | `.gitignore` empfohlen |
| RSS-Feed nicht im Repo | Niedrig | Feed-URL dokumentiert, jederzeit neu ladbar |
| Parser arbeitet auf `/tmp/giancarlo_feed.xml` | Niedrig | Feed-URL im Script dokumentiert |

---

## 8. EMPFEHLUNG

1. **`.gitignore` ergänzen:**
   ```
   data/giancarlo/*.json
   ```

2. **Legacy-Datei löschen:**
   ```bash
   rm data/giancarlo/giancarlo_all_episodes.json
   ```

3. **Commit vorbereiten:**
   ```bash
   git add scripts/parse_giancarlo_rss.py docs/research/giancarlo/
   git add .gitignore
   ```

4. **Nächster Schritt:** Manuelle Review der heuristischen Felder (difficulty/topics) für 10–20 Episoden, falls die Lern-App diese prominent nutzt.

---

*Bericht erstellt automatisch nach Repo-Integration und Verifikation.*
