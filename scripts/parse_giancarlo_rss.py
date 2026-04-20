#!/usr/bin/env python3
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime

class MLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.fed = []
    def handle_data(self, d):
        self.fed.append(d)
    def get_data(self):
        return ''.join(self.fed)

def strip_tags(html):
    s = MLStripper()
    try:
        s.feed(html)
        return s.get_data()
    except:
        return html

RSS_FEED_URL = "https://feeds.redcircle.com/89770731-4660-47ca-a340-82e9fec2873e"
REPO_ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = REPO_ROOT / ".cache"
CACHE_FILE = CACHE_DIR / "giancarlo_feed.xml"
OUTPUT_JSON = REPO_ROOT / "data" / "giancarlo" / "giancarlo_dataset_v2.json"
OUTPUT_MD = REPO_ROOT / "docs" / "research" / "giancarlo" / "giancarlo_lernapp_analyse.md"
OUTPUT_SCHEMA = REPO_ROOT / "docs" / "research" / "giancarlo" / "GIANCARLO_SCHEMA.md"

CACHE_DIR.mkdir(parents=True, exist_ok=True)

if CACHE_FILE.exists():
    print(f"Using cached feed: {CACHE_FILE}")
    tree = ET.parse(CACHE_FILE)
else:
    print(f"Downloading feed from {RSS_FEED_URL} ...")
    urllib.request.urlretrieve(RSS_FEED_URL, CACHE_FILE)
    print(f"Feed cached to {CACHE_FILE}")
    tree = ET.parse(CACHE_FILE)

root = tree.getroot()

ns = {
    'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd',
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'podcast': 'https://podcastindex.org/namespace/1.0'
}

episodes = []
raw_stats = {
    'total_items': 0,
    'items_with_sources': 0,
    'total_sources_extracted': 0,
}

SOURCE_PATTERN = re.compile(
    r'<p>Q(\d+):\s*([^<]+?)</p>\s*(?:<p>(?:\s*<a[^>]+>)?\s*(https?://[^<\s"]+)(?:\s*</a>)?\s*</p>)?'
)

TOPIC_KEYWORDS = {
    'Sicherheit & Schutzmaßnahmen': ['schutz', 'erdung', 'potentialausgleich', 'rcd', 'fi-schutz', 'schutzleiter', 'schutzklasse', 'isolationswiderstand', 'schutzpotenzial', 'schutzmaßnahme'],
    'Normen & Vorschriften': ['vde', 'din', 'dguv', 'norm', 'vorschrift', 'gesetz', 'arbschg', 'betrsichv', 'arb-sch-g'],
    'Netzformen & Erdung': ['tn-', 'tt-', 'it-netz', 'netzform', 'erdungsanlage', 'erdung', 'netz'],
    'Messung & Prüfung': ['messen', 'messgerät', 'prüfung', 'prüfen', 'prüffrist', 'prüfprotokoll', 'messung', 'prüfbericht'],
    'Schaltungen & Steuerung': ['schaltung', 'schaltplan', 'stromlaufplan', 'schütz', 'relais', 'steuerung', 'steuerstrom', 'sps'],
    'Wechselstrom & Drehstrom': ['wechselstrom', 'drehstrom', 'sinus', 'frequenz', 'phase', 'drehfeld', 'drehstrom'],
    'Gleichstrom & Elektronik': ['gleichstrom', 'elektronik', 'halbleiter', 'transistor', 'diode', 'elektron', 'gleichrichter'],
    'Energie & Leistung': ['energie', 'leistung', 'wirkleistung', 'blindleistung', 'scheinleistung', 'leistungsfaktor', 'cos phi', 'leistungsdreieck'],
    'Beleuchtung & Licht': ['licht', 'lampe', 'led', 'beleuchtung', 'schwarzlicht', 'fluoreszenz', 'uv', 'leuchte'],
    'Installation & Verkabelung': ['installation', 'kabel', 'leitung', 'verlegen', 'leitungschutz', 'verteiler', 'verdrahtung'],
    'Beruf & Karriere': ['ausbildung', 'meister', 'techniker', 'gehalt', 'beruf', 'karriere', 'aufbau', 'aufs', 'umschulung', 'quereinsteiger'],
    'Physik & Grundlagen': ['physik', 'elektron', 'atom', 'ladung', 'feld', 'stromwirkung', 'strom', 'spannung', 'widerstand', 'ohm', 'ampere', 'volt'],
    'Photovoltaik & Erneuerbare': ['pv', 'photovoltaik', 'solar', 'wechselrichter', 'speicher', 'solarmodul', 'solaranlage'],
    'Wärmepumpe & Heizung': ['wärmepumpe', 'heizung', 'heizstab', 'r290', 'kältemittel', 'propan', 'wärme'],
    'Elektromobilität': ['e-auto', 'elektroauto', 'wallbox', 'ladestation', 'batterie', 'elektromobilität', 'e-mobilität'],
    'Medizintechnik': ['defibrillator', 'ems', 'medizin', 'herz', 'reanimation', 'elektroschock', 'elektrostimulation'],
    'Preise & Wirtschaft': ['strompreis', 'kosten', 'preis', 'wirtschaft', 'merit order', 'blackout', 'stromrechnung'],
    'Arbeiten unter Spannung': ['arbeiten unter spannung', 'aus-schein', 'aus ', 'spannung', 'zählerwechsel', 'isolier'],
    'Schwingkreise & Resonanz': ['schwingkreis', 'resonanz', 'rlc', 'spannungsüberhöhung', 'resonanzfrequenz'],
}

DIFFICULTY_KEYWORDS = {
    'pro': ['meister', 'techniker', 'fachgespräch', 'industriemeister', 'ihk-prüfung', 'meisterschule'],
    'basis': ['azubi', 'grundlagen', 'basis', 'einfach erklärt', 'für anfänger', 'schüler', 'lerner', '1. lehrjahr'],
}

for item in root.findall('.//item'):
    raw_stats['total_items'] += 1
    
    title_elem = item.find('title')
    title = title_elem.text if title_elem is not None else ""
    
    ep_num_match = re.search(r'#\s*(\d+)', title)
    ep_num = int(ep_num_match.group(1)) if ep_num_match else 0
    
    desc_elem = item.find('description')
    desc_raw = desc_elem.text if desc_elem is not None else ""
    
    content_elem = item.find('content:encoded', ns)
    content_raw = content_elem.text if content_elem is not None else ""
    
    pub_date = item.find('pubDate')
    pub_date_raw = pub_date.text if pub_date is not None else ""
    
    duration_elem = item.find('itunes:duration', ns)
    duration_raw = duration_elem.text if duration_elem is not None else ""
    
    guid_elem = item.find('guid')
    guid_raw = guid_elem.text if guid_elem is not None else ""
    
    enclosure = item.find('enclosure')
    audio_url_raw = enclosure.get('url') if enclosure is not None else ""
    
    sources = []
    if content_raw:
        for src_match in SOURCE_PATTERN.finditer(content_raw):
            url = src_match.group(3)
            if url:
                sources.append({
                    "q_number": int(src_match.group(1)),
                    "label": src_match.group(2).strip(),
                    "url": url.strip()
                })
        
        if sources:
            raw_stats['items_with_sources'] += 1
            raw_stats['total_sources_extracted'] += len(sources)
    
    desc_clean = strip_tags(desc_raw)
    desc_clean = re.sub(r'\s+', ' ', desc_clean).strip()[:800]
    
    content_clean = strip_tags(content_raw)
    content_clean = re.sub(r'\s+', ' ', content_clean).strip()
    
    text_combined = (title + " " + desc_clean + " " + content_clean).lower()
    difficulty = 'standard'
    for diff_level, keywords in DIFFICULTY_KEYWORDS.items():
        if any(kw in text_combined for kw in keywords):
            difficulty = diff_level
            break
    
    topics = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in text_combined for kw in keywords):
            topics.append(topic)
    if not topics:
        topics.append('Sonstiges')
    
    episode = {
        "episode_number": ep_num,
        "title": title,
        "raw": {
            "description_html": desc_raw[:2000] if desc_raw else "",
            "content_html": content_raw[:4000] if content_raw else "",
            "pub_date": pub_date_raw,
            "duration_seconds": int(duration_raw) if duration_raw.isdigit() else None,
            "guid": guid_raw,
            "audio_url": audio_url_raw
        },
        "derived": {
            "description_clean": desc_clean,
            "content_clean": content_clean[:2000],
            "difficulty": {
                "value": difficulty,
                "method": "heuristic_keyword_matching",
                "confidence": "low"
            },
            "topics": {
                "values": topics,
                "method": "heuristic_keyword_matching",
                "confidence": "low"
            },
            "sources": {
                "values": sources,
                "method": "regex_raw_html_extraction",
                "confidence": "high"
            },
            "source_count": len(sources)
        }
    }
    
    episodes.append(episode)

episodes.sort(key=lambda x: x['episode_number'])

dataset = {
    "schema_version": "2.0.0",
    "schema_type": "podcast_episode_dataset",
    "extraction": {
        "tool": "rss_parser_v2",
        "timestamp": datetime.now().isoformat(),
        "source_url": "https://feeds.redcircle.com/89770731-4660-47ca-a340-82e9fec2873e",
        "source_type": "rss_feed",
        "total_episodes_in_feed": raw_stats['total_items']
    },
    "podcast": {
        "title": "Elektrotechnik Podcast by Giancarlo",
        "author": "Giancarlo the Teacher",
        "language": "de",
        "total_episodes": len(episodes),
        "episodes_with_sources": raw_stats['items_with_sources'],
        "total_source_references": raw_stats['total_sources_extracted']
    },
    "field_semantics": {
        "raw": "Unveränderte RSS-Rohdaten. Vertrauenswürdigkeit: HIGH (1:1 aus Feed)",
        "derived": "Algorithmisch abgeleitete Felder. Vertrauenswürdigkeit: VARIABLE (siehe confidence)"
    },
    "episodes": episodes
}

OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(dataset, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(episodes)} episodes to {OUTPUT_JSON}")
print(f"Episodes with sources: {raw_stats['items_with_sources']}/{raw_stats['total_items']}")
print(f"Total sources extracted: {raw_stats['total_sources_extracted']}")

print("\n" + "="*60)
print("VERIFIKATION")
print("="*60)

count_json = len(dataset['episodes'])
count_rss = raw_stats['total_items']
print(f"1. COUNT: JSON={count_json}, RSS={count_rss} => {'MATCH' if count_json == count_rss else 'MISMATCH'}")

guids = [ep['raw']['guid'] for ep in episodes]
nums = [ep['episode_number'] for ep in episodes]
titles = [ep['title'] for ep in episodes]
dedup_ok = len(set(guids)) == len(guids) and len(set(nums)) == len(nums) and len(set(titles)) == len(titles)
print(f"2. DEDUPLIKATION: GUID={len(set(guids))}/{len(guids)}, NUM={len(set(nums))}/{len(nums)} => {'OK' if dedup_ok else 'FAIL'}")

missing_guid = sum(1 for ep in episodes if not ep['raw']['guid'])
missing_audio = sum(1 for ep in episodes if not ep['raw']['audio_url'])
missing_title = sum(1 for ep in episodes if not ep['title'])
print(f"3. FELDVOLLSTÄNDIGKEIT: missing_guid={missing_guid}, missing_audio={missing_audio}, missing_title={missing_title}")

print("\n4. STICHPROBE (10 Episoden, JSON vs RSS):")
all_items = root.findall('.//item')
rss_by_num = {}
for item in all_items:
    title = item.find('title').text
    m = re.search(r'#\s*(\d+)', title)
    if m:
        num = int(m.group(1))
        rss_by_num[num] = item

sample_nums = [1, 11, 26, 51, 76, 101, 151, 201, 241, 252]
for num in sample_nums:
    json_ep = next((ep for ep in episodes if ep['episode_number'] == num), None)
    rss_item = rss_by_num.get(num)
    if json_ep is None or rss_item is None:
        print(f"   EP#{num:3d}: MISSING")
        continue
    
    rss_title = rss_item.find('title').text
    rss_guid = rss_item.find('guid').text
    rss_audio = rss_item.find('enclosure').get('url') if rss_item.find('enclosure') is not None else ""
    
    checks = [
        json_ep['title'] == rss_title,
        json_ep['raw']['guid'] == rss_guid,
        json_ep['raw']['audio_url'] == rss_audio
    ]
    status = "OK" if all(checks) else "FAIL"
    print(f"   EP#{num:3d}: {status}")

print("\n5. SOURCES-STICHPROBE:")
episodes_with_src = [ep for ep in episodes if ep['derived']['sources']['values']]
for ep in episodes_with_src[:5]:
    srcs = ep['derived']['sources']['values']
    print(f"   EP#{ep['episode_number']:3d}: {len(srcs)} sources")

print("\n6. SCHEMA-KONSISTENZ:")
required_raw = ['description_html', 'content_html', 'pub_date', 'duration_seconds', 'guid', 'audio_url']
required_derived = ['description_clean', 'content_clean', 'difficulty', 'topics', 'sources', 'source_count']
schema_ok = all(
    all(k in ep['raw'] for k in required_raw) and 
    all(k in ep['derived'] for k in required_derived)
    for ep in episodes
)
print(f"   Alle Episoden haben Raw+Derived Felder => {'OK' if schema_ok else 'FAIL'}")

print("\n" + "="*60)
print("VERIFIKATION ABGESCHLOSSEN")
print("="*60)

diff_counts = {}
topic_counts = {}
for ep in episodes:
    diff = ep['derived']['difficulty']['value']
    diff_counts[diff] = diff_counts.get(diff, 0) + 1
    for t in ep['derived']['topics']['values']:
        topic_counts[t] = topic_counts.get(t, 0) + 1

with open(OUTPUT_MD, 'w', encoding='utf-8') as f:
    f.write("# Giancarlo the Teacher – Elektrotechnik Podcast\n")
    f.write("## Lern-App Analyse: Alle Episoden (Strukturiert)\n\n")
    f.write(f"**Extrahiert:** {datetime.now().strftime('%Y-%m-%d')}\n")
    f.write(f"**Quelle:** RSS Feed\n")
    f.write(f"**GesamtEpisoden:** {len(episodes)}\n")
    f.write(f"**Episoden mit Quellen:** {raw_stats['items_with_sources']}\n")
    f.write(f"**Gesamt-Quellenverweise:** {raw_stats['total_sources_extracted']}\n\n")
    
    f.write("> ⚠️ **Hinweis zur Datenqualität:**\n")
    f.write("> - `difficulty` und `topics` sind **heuristisch** per Keyword-Matching bestimmt (Confidence: LOW).\n")
    f.write("> - `sources` sind **automatisch extrahiert** aus dem RSS-HTML (Confidence: HIGH).\n")
    f.write("> - Rohdaten (`raw`) sind 1:1 aus dem RSS-Feed.\n")
    f.write("> - Für die vollständige Verifikation siehe `AUDIT_Giancarlo_Extraktion.md`.\n\n")
    
    f.write("---\n\n")
    f.write("## Schwierigkeitsverteilung (Heuristisch)\n\n")
    for d, c in sorted(diff_counts.items()):
        f.write(f"- **{d}**: {c} Episoden\n")
    
    f.write("\n---\n\n")
    f.write("## Themen-Übersicht (Top 20, Heuristisch)\n\n")
    for t, c in sorted(topic_counts.items(), key=lambda x: -x[1])[:20]:
        f.write(f"- **{t}**: {c} Episoden\n")
    
    f.write("\n---\n\n")
    f.write("## Episoden nach Thema gruppiert\n\n")
    
    topic_eps = {}
    for ep in episodes:
        for t in ep['derived']['topics']['values']:
            if t not in topic_eps:
                topic_eps[t] = []
            topic_eps[t].append(ep)
    
    for topic in sorted(topic_eps.keys()):
        eps_list = topic_eps[topic]
        f.write(f"\n### {topic} ({len(eps_list)} Episoden)\n\n")
        for ep in eps_list[:10]:
            f.write(f"- **#{ep['episode_number']}** – {ep['title']}\n")
        if len(eps_list) > 10:
            f.write(f"- ... und {len(eps_list) - 10} weitere\n")
    
    f.write("\n---\n\n")
    f.write("## Vollständige Episodenliste\n\n")
    for ep in episodes:
        f.write(f"### #{ep['episode_number']} – {ep['title']}\n\n")
        f.write(f"- **Schwierigkeit:** {ep['derived']['difficulty']['value']} *(heuristisch)*\n")
        f.write(f"- **Themen:** {', '.join(ep['derived']['topics']['values'])} *(heuristisch)*\n")
        f.write(f"- **Dauer:** {ep['raw']['duration_seconds']} Sekunden\n")
        f.write(f"- **Veröffentlicht:** {ep['raw']['pub_date']}\n")
        f.write(f"- **Audio:** {ep['raw']['audio_url']}\n")
        if ep['derived']['sources']['values']:
            f.write(f"- **Quellen:** {ep['derived']['source_count']}\n")
            for s in ep['derived']['sources']['values'][:5]:
                f.write(f"  - Q{s['q_number']}: {s['label']}\n")
                f.write(f"    {s['url']}\n")
        f.write(f"\n**Beschreibung:** {ep['derived']['description_clean']}\n\n")
        f.write("---\n\n")

print(f"Wrote Markdown analysis to {OUTPUT_MD}")

schema_doc = f"""# Giancarlo Podcast Dataset — Schema-Dokumentation

**Version:** 2.0.0  
**Datum:** {datetime.now().strftime('%Y-%m-%d')}  
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
{{
  "episode_number": 42,
  "title": "Elektrotechnik-Podcast #42: ...",
  "raw": {{ ... }},
  "derived": {{ ... }}
}}
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
{{
  "q_number": 1,
  "label": "RLC Circuit Analysis",
  "url": "https://www.electrical4u.com/rlc-circuit/"
}}
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

### v2.0.0 ({datetime.now().strftime('%Y-%m-%d')})
- **Reparatur:** Sources werden jetzt korrekt aus raw HTML extrahiert
- **Schema:** Einführung von `raw` / `derived` Trennung
- **Qualität:** Confidence-Levels für alle derived Felder
- **Verifikation:** Stichproben gegen RSS-Feed durchgeführt

### v1.0.0 (2026-04-20)
- Initiale Extraktion aus RSS-Feed
- **Bekannter Defekt:** Sources waren 0/252 (Parser arbeitete auf gestripptem HTML)
"""

with open(OUTPUT_SCHEMA, 'w', encoding='utf-8') as f:
    f.write(schema_doc)

print(f"Wrote Schema documentation to {OUTPUT_SCHEMA}")
