# Giancarlo Podcast Dataset — Schema-Dokumentation

**Version:** 2.0.0  
**Datum:** 2026-04-20  
**Feed:** https://feeds.redcircle.com/89770731-4660-47ca-a340-82e9fec2873e

---

## Überblick

Dieses Dataset enthält alle Episoden des *Elektrotechnik Podcast by Giancarlo* im JSON-Format.  
Es ist für die Nutzung in einer Lern-App konzipiert und trennt strikt zwischen **Rohdaten** (verifiziert) und **abgeleiteten Feldern** (heuristisch).

---

## Top-Level-Struktur

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `schema_version` | string | Schema-Version (SemVer) |
| `schema_type` | string | `"podcast_episode_dataset"` |
| `extraction` | object | Metadaten zur Extraktion |
| `podcast` | object | Podcast-Metadaten |
| `field_semantics` | object | Erklärung zu Raw/Derived |
| `episodes` | array[] | Alle Episoden (sortiert nach `episode_number`) |

---

## Episode-Objekt

```json
{
  "episode_number": 42,
  "title": "Elektrotechnik-Podcast #42: ...",
  "raw": { ... },
  "derived": { ... }
}
```

### `raw` — Rohdaten (RSS 1:1)

| Feld | Typ | Quelle | Vertrauen |
|------|-----|--------|-----------|
| `description_html` | string | RSS `<description>` | HIGH |
| `content_html` | string | RSS `<content:encoded>` | HIGH |
| `pub_date` | string | RSS `<pubDate>` | HIGH |
| `duration_seconds` | int|null | RSS `<itunes:duration>` | HIGH |
| `guid` | string | RSS `<guid>` | HIGH |
| `audio_url` | string | RSS `<enclosure url>` | HIGH |

### `derived` — Abgeleitete Felder

| Feld | Typ | Methode | Confidence |
|------|-----|---------|------------|
| `description_clean` | string | HTML strip + whitespace norm | HIGH |
| `content_clean` | string | HTML strip + whitespace norm | HIGH |
| `difficulty.value` | string | Keyword-Matching | LOW |
| `difficulty.method` | string | `"heuristic_keyword_matching"` | — |
| `difficulty.confidence` | string | `"low"` | — |
| `topics.values` | string[] | Keyword-Matching | LOW |
| `topics.method` | string | `"heuristic_keyword_matching"` | — |
| `topics.confidence` | string | `"low"` | — |
| `sources.values` | object[] | Regex auf raw HTML | HIGH |
| `sources.method` | string | `"regex_raw_html_extraction"` | — |
| `sources.confidence` | string | `"high"` | — |
| `source_count` | int | Anzahl extrahierter Quellen | HIGH |

### Source-Objekt

```json
{
  "q_number": 1,
  "label": "RLC Circuit Analysis",
  "url": "https://www.electrical4u.com/rlc-circuit/"
}
```

---

## Pipeline

```
RSS-Feed (XML)
    │
    ▼
[Parser v2] ──► Rohdaten extrahieren (raw)
    │
    ├──► Sources aus raw HTML (Regex)
    │
    ├──► HTML stripping (clean text)
    │
    ├──► Difficulty-Heuristik (Keyword-Matching)
    │
    └──► Topics-Heuristik (Keyword-Matching)
    │
    ▼
Normalisiertes JSON (raw + derived)
    │
    ▼
Markdown-Analyse (aggregiert)
```

---

## Verwendung in der Lern-App

### Zuverlässige Felder (HIGH confidence)
- `title`, `episode_number`
- `raw.audio_url` (für Audio-Player)
- `raw.pub_date`, `raw.duration_seconds`
- `derived.sources` (für Quellenverweise)

### Heuristische Felder (LOW confidence — Review empfohlen)
- `derived.difficulty.value` — Basis/Standard/Pro
- `derived.topics.values` — Themen-Zuordnung

---

## Changelog

### v2.0.0 (2026-04-20)
- **Reparatur:** Sources werden jetzt korrekt aus raw HTML extrahiert
- **Schema:** Einführung von `raw` / `derived` Trennung
- **Qualität:** Confidence-Levels für alle derived Felder
- **Verifikation:** Stichproben gegen RSS-Feed durchgeführt

### v1.0.0 (2026-04-20)
- Initiale Extraktion aus RSS-Feed
- **Bekannter Defekt:** Sources waren 0/252 (Parser arbeitete auf gestripptem HTML)
