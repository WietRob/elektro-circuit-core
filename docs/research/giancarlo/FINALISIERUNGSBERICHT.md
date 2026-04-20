# Giancarlo-Repointegration — Finalisierungsbericht

**Datum:** 2026-04-20  
**Repo:** `/home/roberto_schmidt/projects/elektro-circuit-core`  
**Status:** Abgeschlossen

---

## 1. KURZURTEIL

**Alle offenen Defekte sind behoben.** Der Parser läuft reproduzierbar im Repo-Kontext, ohne harte `/tmp`-Abhängigkeit, mit korrekter interner Verifikation.

---

## 2. OFFENE DEFEKTE — STATUS

| Defekt | Status | Begründung |
|--------|--------|------------|
| Parser hängt an `/tmp/giancarlo_feed.xml` | **BEHOBEN** | Feed wird jetzt direkt aus URL geladen, optional lokal gecacht |
| Interne Stichprobe zeigt FAIL | **BEHOBEN** | Vergleich erfolgt jetzt über `episode_number`, nicht Listenindex |
| `REPO_ROOT` absolut kodiert | **BEHOBEN** | Wird jetzt über `Path(__file__).resolve().parent.parent` bestimmt |
| DeprecationWarning im Parser-Lauf | **BEHOBEN** | `not elem` ersetzt durch `elem is None` bei ElementTree-Elementen |
| Versionierung unentschieden | **ENTSCHIEDEN** | Siehe Abschnitt 6 |
| `package-lock.json` offen | **GEKLÄRT** | Außerhalb des Giancarlo-Scopes (npm-Artefakt) |

---

## 3. UMGESETZTE ÄNDERUNGEN

### 3.1 Parser (`scripts/parse_giancarlo_rss.py`)

**a) Feed-Quelle:**
- **Alt:** `FEED_FILE = Path("/tmp/giancarlo_feed.xml")` — harte `/tmp`-Abhängigkeit
- **Neu:** Feed wird direkt aus `https://feeds.redcircle.com/...` per `urllib.request.urlretrieve()` geladen
- **Cache:** Optionaler lokaler Cache unter `.cache/giancarlo_feed.xml` im Repo

**b) Verifikationslogik:**
- **Alt:** Stichprobe verglich `episodes[idx]` mit `all_items[idx]` — funktioniert nicht, da Sortierung unterschiedlich
- **Neu:** RSS-Items werden in Dictionary `rss_by_num[episode_number]` indiziert, dann über stabile `episode_number` verglichen

**c) Portabilität (`REPO_ROOT`):**
- **Alt:** `REPO_ROOT = Path("/home/roberto_schmidt/projects/elektro-circuit-core")` — absolut kodiert, nicht portabel
- **Neu:** `REPO_ROOT = Path(__file__).resolve().parent.parent` — relativ zur Skriptdatei, portabel

**d) DeprecationWarning:**
- **Alt:** `if not json_ep or not rss_item:` — `not rss_item` testet truthiness eines ElementTree-Elements (deprecated)
- **Neu:** `if json_ep is None or rss_item is None:` — expliziter None-Check, warning-frei

**e) Ergebnis:**
```
4. STICHPROBE (10 Episoden, JSON vs RSS):
   EP#  1: OK
   EP# 11: OK
   EP# 26: OK
   ...
   EP#252: OK
```

### 3.2 Cache-Verhalten

| Lauf | Verhalten | Beleg |
|------|-----------|-------|
| Erster Lauf | Feed von URL laden, in `.cache/giancarlo_feed.xml` speichern | ✅ |
| Wiederholungslauf | Feed aus Cache verwenden | ✅ |

---

## 4. REPRO-PFAD (alt vs neu)

### Alt (defekt)
```bash
# Benötigt manuell heruntergeladenen Feed in /tmp
python3 scripts/parse_giancarlo_rss.py
# → Fehler wenn /tmp/giancarlo_feed.xml fehlt
# → Interne Verifikation zeigt FAIL
```

### Neu (reproduzierbar)
```bash
# Aus Repo-Root — Feed wird automatisch geladen oder aus Cache verwendet
cd <repo-root>
python3 scripts/parse_giancarlo_rss.py
# → Outputs in data/giancarlo/ und docs/research/giancarlo/
# → Verifikation vollständig grün
# → Kein absoluter Pfad im Code, kein Warning
```

---

## 5. VERIFIKATION

### 5.1 Parser-Re-Run (aus Repo-Root)

```
Using cached feed: .../.cache/giancarlo_feed.xml
Wrote 252 episodes to .../data/giancarlo/giancarlo_dataset_v2.json
Episodes with sources: 40/252
Total sources extracted: 378
```

### 5.2 Interne Verifikation (jetzt vollständig grün)

| Prüfung | Ergebnis |
|---------|----------|
| 1. COUNT | JSON=252, RSS=252 ✅ MATCH |
| 2. DEDUPLIKATION | GUID=252/252, NUM=252/252 ✅ OK |
| 3. FELDVOLLSTÄNDIGKEIT | 0 fehlende Felder ✅ OK |
| 4. STICHPROBE (10 EPs) | 10/10 ✅ OK (kein FAIL mehr) |
| 5. SOURCES (Top 5) | EP#209:13, #212:5, #214:9, #215:11, #216:10 ✅ OK |
| 6. SCHEMA-KONSISTENZ | Alle 252 EPs haben Raw+Derived ✅ OK |

### 5.3 Externe Kernkennzahlen (stabil)

- 252 Episoden ✅
- Dedupliziert (252/252 unique GUIDs) ✅
- 40/252 Episoden mit Sources, 378 Quellen ✅

---

## 6. VERSIONIERUNGSEMPFEHLUNG

### Versionieren (in Git)

| Datei/Ordner | Grund |
|--------------|-------|
| `scripts/parse_giancarlo_rss.py` | Quellcode, reproduzierbar |
| `docs/research/giancarlo/*.md` | Dokumentation, menschlich geprüft |

### Nicht versionieren (`.gitignore`)

| Datei/Ordner | Grund |
|--------------|-------|
| `.cache/` | Automatisch generierter Feed-Cache, reproduzierbar |
| `data/giancarlo/*.json` | Abgeleitete Artefakte, können jederzeit neu erzeugt werden |

### Umgesetzte `.gitignore`-Änderung

Die bestehende `.gitignore` wurde um folgende Regeln ergänzt:

```gitignore
# Giancarlo Podcast — abgeleitete Artefakte
.cache/
data/giancarlo/*.json
```

**Hinweis:** `package-lock.json` wurde bewusst **nicht** in `.gitignore` aufgenommen, da es sich um einen npm-Standardartefakt handelt, der außerhalb des Giancarlo-Scopes entschieden werden muss.

---

## 7. ENTSCHEIDUNG JE DATEIGRUPPE

| Pfad/Gruppe | Entscheidung | Begründung |
|-------------|--------------|------------|
| `scripts/parse_giancarlo_rss.py` | **Versionieren** | Quellcode, menschlich geschrieben, reproduzierbar |
| `docs/research/giancarlo/*.md` | **Versionieren** | Menschlich kuratierte Dokumentation |
| `data/giancarlo/giancarlo_dataset_v2.json` | **Ignorieren** | Abgeleitetes Artefakt, jederzeit neu erzeugbar |
| `data/giancarlo/giancarlo_all_episodes.json` | **Gelöscht** | Legacy v1, defekt (0/252 Sources), durch v2 ersetzt |
| `.cache/giancarlo_feed.xml` | **Ignorieren** | Automatisch generierter Feed-Cache, reproduzierbar |
| `package-lock.json` | **Außerhalb Scope** | npm-Artefakt, nicht Giancarlo-relevant |

---

## 8. GIT-STATUS (nach Hygiene-Fixes)

```
Unversionierte Dateien:
  .gitignore                              ← Geändert (Giancarlo-Regeln ergänzt)
  docs/                                   ← Versionieren
  scripts/parse_giancarlo_rss.py          ← Versionieren

Nichts zum Commit vorgemerkt
```

**Erklärung:**
- `.cache/` und `data/giancarlo/*.json` sind jetzt durch `.gitignore` ausgeblendet
- `giancarlo_all_episodes.json` (Legacy v1) wurde gelöscht
- `package-lock.json` bleibt außerhalb des Scopes

**Hinweis zu `package-lock.json`:** Dies ist ein npm-Artefakt (wahrscheinlich durch frühere `npm install`-Aufrufe im Repo entstanden). Es gehört **nicht** zum Giancarlo-Strang und sollte separat behandelt werden.

---

## 9. RESTRISIKEN

| Risiko | Schwere | Maßnahme |
|--------|---------|----------|
| Feed-URL ändert sich | Niedrig | URL ist dokumentiert, Parser gibt klare Fehlermeldung |
| Feed-Format ändert sich | Niedrig | Regex-Pattern robust, bei Änderung würde `source_count=0` auffallen |
| Keine Internetverbindung | Niedrig | Cache-Mechanismus: einmal laden, danach offline nutzbar |

---

## 10. DEFINITION OF DONE — CHECKLISTE

- [x] Parser ohne harte `/tmp`-Abhängigkeit
- [x] Interne Verifikation vollständig grün
- [x] Outputs fachlich korrekt (252 EPs, 378 Sources)
- [x] Dokumentation beschreibt echten Repro-Pfad
- [x] Klare Versionierungsempfehlung vorliegt und umgesetzt
- [x] `.gitignore` geprüft und ergänzt
- [x] `package-lock.json` als außerhalb des Scopes gekennzeichnet
- [x] Kein absolut kodiertes `REPO_ROOT` mehr
- [x] Parser-Lauf warning-frei
- [x] Keine Alt-Pfadhinweise in den aktiven Giancarlo-Dateien
- [x] Legacy-Artefakt (`giancarlo_all_episodes.json`) entfernt

---

*Bericht erstellt nach Abschluss der Reparaturen und Verifikation.*
