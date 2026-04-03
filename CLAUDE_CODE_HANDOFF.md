# flow.phangan — Claude Code Handoff

## Project Overview
Mobile-first PWA for event discovery on Koh Phangan island, Thailand.
Single file: `index.html` (~1560 lines, all JS/CSS inline).

**Live URL:** https://flowphangan.cagkanineroglu.workers.dev  
**GitHub:** https://github.com/cagkan5/FlowPhangan  
**Deploy:** Cloudflare Pages (auto-deploy from GitHub main branch)

---

## Architecture

```
index.html (single file PWA)
├── CSS — dark/light theme, 8 category colors, mobile-first
├── HTML — 4 tabs: Events, Venues, Saved, Map
└── JS (inline <script>)
    ├── Data fetching
    │   ├── PRIMARY: todo.today API (direct from browser, works)
    │   ├── FALLBACK 1: Claude AI web search (requires Anthropic API key — broken in browser)
    │   └── FALLBACK 2: Hardcoded offline data (FALLBACK_TODAY / FALLBACK_TMRW)
    ├── Event rendering (buildCard, renderEvents)
    ├── Venue rendering (renderVenues, buildVCard, openVenue)
    ├── Weather (Open-Meteo API — working)
    ├── Moon phase (astronomical calculation — working)
    └── PWA features (install prompt, favorites, i18n 6 languages)
```

**No backend.** Railway scraper (`scraper.js`) exists in repo but is **no longer used** — remove it.

---

## Data Source

**todo.today API** (primary, working):
```
GET https://todo.today/api/todo-today/v1/events?channel=koh-phangan&event_date=today
GET https://todo.today/api/todo-today/v1/events?channel=koh-phangan&event_date=tomorrow
```
- No auth required, no nonce, no CORS issues
- Response: `{ sections: [{ key: "daypart_X", events: [...] }] }`
- Today sections: `happening_now`, `today_highlight`, `up_next`, `daypart_*`, `more_tomorrow`
- Tomorrow sections: only `daypart_*` (no highlight/up_next)
- Each event has: `id`, `name`, `venue`, `start_time` (12h format e.g. "8:00 PM"), `end_time`, `price_label`, `category_id`, `area`, `link`, `image`, `ticket_type`

**Category ID mapping:**
```js
1 → practices    // Wellness
2 → movement     // Dance & Movement  
3 → sport        // Sports & Fitness
4 → practices    // Consciousness & Spirituality
5 → workshop     // Arts & Creativity
6 → workshop     // Community & Social
7 → music        // Music (keyword-based)
10 → workshop    // Relationships & Connection
13 → workshop    // Learning & Discussion
17 → party       // Parties & Nightlife
19 → practices   // Tantra & Sensual Arts
```

---

## Known Bugs to Fix

### 1. Dead code — remove entirely
- `fetchFromRailway()` (line ~1002) — Railway scraper removed, never called
- `fetchFromAPI()` (line ~632) — phangan.events removed, never called  
- `loadAllVenuePhotos()` (line ~1334) — Railway venues endpoint gone
- `SCRAPER_URL` constant (line 1331)
- `translateDesc()` (line ~625) — calls Anthropic API without key, always fails silently

### 2. Claude AI fallback broken
`fetchFromClaude()` calls `https://api.anthropic.com/v1/messages` directly from browser — no API key, always returns 401. Either:
- Remove it entirely (go straight to offline fallback), OR
- Replace with a simple static message "Check todo.today for more events"

### 3. Verify tomorrow fix is working
Recent fix: `setDay()` now resets `fetching` lock and checks `cache[d]` instead of `allEvs[d].length`.
Previously `allEvs.tomorrow` was pre-populated with `FALLBACK_TMRW` in DOMContentLoaded, so `setDay` never triggered a real fetch.
**Test:** Click Tomorrow tab → should show ~80 real events from todo.today, not hardcoded fallback data.

### 4. Venue photos missing
51 venues are hardcoded in `VENUES` object. Photos were planned via Google Places API but never implemented properly.
Current state: venues show gradient placeholder backgrounds.
**Options:** 
- Manual: add `imageUrl` field to each venue object pointing to a hosted image
- Skip for now — placeholders look fine

---

## File Structure (single index.html)

| Section | Lines | Notes |
|---------|-------|-------|
| CSS | 1–280 | Theme vars, component styles |
| HTML | 281–560 | 4 tab pages + modals + nav |
| JS: Theme + Moon | 561–620 | Working |
| JS: i18n | 621–615 | 6 languages (EN/TR/FR/ES/RU/TH) |
| JS: Dead code | ~625–680 | translateDesc, fetchFromAPI |
| JS: todo.today fetch | 762–827 | PRIMARY data source |
| JS: Dead code | ~1002–1030 | fetchFromRailway |
| JS: fetchEvents | 1032–1082 | Main fetch orchestrator |
| JS: renderEvents | 1176–1255 | Event card rendering |
| JS: Venues | 1331–1510 | 51 hardcoded venues |
| JS: Fallback data | 1505–1527 | 8 today + 7 tomorrow events |
| JS: Init | 1528–1548 | DOMContentLoaded |

---

## What's Working
- Weather (Open-Meteo) ✓
- Moon phase calculation ✓
- Today events from todo.today ✓
- 6-language UI ✓
- Dark/light theme ✓
- Favorites (localStorage) ✓
- PWA install prompt ✓
- Add to Calendar (Google + Apple .ics) ✓
- Venues tab (51 hardcoded venues) ✓ (render bug recently fixed)
- Category filtering ✓
- Event search ✓

## What's Broken / Missing
- Tomorrow tab — fix deployed but needs verification
- Claude AI fallback — 401 every time, should be removed
- Dead code from Railway/phangan.events era cluttering the file
- Venue photos — placeholders only
- Translation — removed (was broken anyway)

---

## Quick Start for Claude Code

```bash
git clone https://github.com/cagkan5/FlowPhangan
cd FlowPhangan
# Open index.html — everything is in this one file
# Test in browser: open index.html locally or push to Cloudflare
```

**Priority tasks:**
1. Remove all dead code (fetchFromRailway, fetchFromAPI, translateDesc, loadAllVenuePhotos, SCRAPER_URL, fetchFromClaude or replace with no-op)
2. Verify tomorrow tab shows real events
3. Clean up scraper.js (either delete or ignore)
