# AGENTS.md — Terranova Ohligs Website

## Project Overview

Static website for **Terranova Ohligs**, an Italian café and bakery located at Düsseldorfer Str. 41, 42697 Solingen, Germany. Built as a pitch/demo site, hosted on **GitHub Pages** with zero build step.

---

## Stack

| Layer | Technology |
|---|---|
| Markup | Plain HTML5 (`index.html`) |
| Styles | Plain CSS3 (`css/style.css`) — no preprocessor |
| Scripts | Vanilla JS ES2020 (`js/main.js`) — no framework |
| Data | JSON file (`data/reviews.json`) — fetched at runtime |
| Automation | GitHub Actions (`scrape-reviews.yml`) — Python scraper |
| Hosting | GitHub Pages — branch `main`, root `/` |

---

## Repository Structure

```
terranova/
├── index.html                          # Single-page site
├── css/
│   └── style.css                       # All styles (~1100 lines)
├── js/
│   └── main.js                         # All interactivity (~350 lines)
├── data/
│   └── reviews.json                    # Auto-updated daily by GitHub Actions
├── scripts/
│   └── scrape_reviews.py               # Python scraper (runs in CI)
├── .github/
│   └── workflows/
│       └── scrape-reviews.yml          # Daily scrape workflow
├── .nojekyll                           # Disables Jekyll on GitHub Pages
├── AGENTS.md                           # This file
└── README.md                           # Project documentation
```

---

## Key Design Decisions

### No API Key for Reviews
Google Places API is not used. Instead a GitHub Actions workflow scrapes the **public Google Maps HTML** for the place ID daily and writes `data/reviews.json` to the repo. The site fetches this file at runtime — completely free, no credentials needed.

- **Place ID:** `ChIJ17LUOQDTuEcRZeLG8OCF06c`
- **Write Review URL:** `https://search.google.com/local/writereview?placeid=ChIJ17LUOQDTuEcRZeLG8OCF06c`
- **Scraper:** `scripts/scrape_reviews.py`
- **Workflow:** `.github/workflows/scrape-reviews.yml` — runs daily at 06:00 UTC, can be triggered manually

### Bilingual EN / DE
All user-facing strings are duplicated as `data-en` / `data-de` HTML attributes. A single JS toggle (`langToggle` button) swaps all text by reading those attributes. **Default language is German (DE).**

### No Build Step
The site is pure static files. GitHub Pages serves `index.html` directly. `.nojekyll` prevents GitHub from running Jekyll processing.

---

## CSS Architecture

- **CSS custom properties** defined in `:root` — edit colours/fonts there only
- **Dark espresso theme** — `--bg: #0f0a08`, accent `--terra: #c4622d`, `--gold: #d4a853`
- **Mobile-first breakpoints:** `768px` (tablet/mobile), `1024px` (tablet), `480px` (small mobile)
- **Scroll reveal** via `IntersectionObserver` — add class `reveal` (+ `reveal--delay-1/2/3`) to any element
- **Grain texture overlay** — CSS `body::after` SVG filter, purely decorative

### Key CSS sections (by line range)
| Section | ~Lines |
|---|---|
| Custom properties / reset | 1–65 |
| Buttons | 79–130 |
| Nav | 161–250 |
| Hero | 251–380 |
| About | 381–440 |
| Marquee | 441–470 |
| Cards / Menu | 471–540 |
| Hours | 541–625 |
| Location | 626–685 |
| Instagram banner | 686–730 |
| Footer | 731–800 |
| Reviews | 805–980 |
| Responsive | 981–1080 |
| Grain texture | 1081–1095 |

---

## JS Architecture (`js/main.js`)

Functions and IIFEs in order:

| Name | Purpose |
|---|---|
| `CONFIG` | Central config: `REVIEWS_JSON` path, review/maps URLs |
| `initReviews()` | Fetches `data/reviews.json`, renders cards + summary |
| `renderReviews()` | Populates review card HTML from data object |
| `updateSummary()` | Updates score number, star display, review count |
| `buildStars()` | Returns star HTML for a given float rating |
| `renderSkeletons()` | Shows shimmer placeholder cards while loading |
| `escHtml()` | Minimal HTML entity escaper |
| Language toggle IIFE | Swaps `data-en`/`data-de` attributes on all elements |
| Sticky nav IIFE | Adds `.scrolled` class after 40px scroll |
| Mobile burger IIFE | Toggles `.open` + `.menu-open` classes |
| `observeReveal()` | Attaches IntersectionObserver to `.reveal` elements |
| `highlightToday()` | Highlights today's row in hours table + open/closed badge |
| Footer year IIFE | Sets `#year` to current year |
| Parallax IIFE | Subtle hero image translateY on scroll |
| Bar chart IIFE | Triggers bar fill animations when summary enters viewport |

---

## Opening Hours

| Day | Hours |
|---|---|
| Monday | Closed |
| Tuesday – Saturday | 06:00 – 22:00 |
| Sunday | 07:30 – 22:00 |

---

## Contact & Business Info

- **Address:** Düsseldorfer Str. 41, 42697 Solingen, Germany
- **Phone:** +49 212 23086710
- **Instagram:** [@terranova_ohligs](https://www.instagram.com/terranova_ohligs/)
- **Google Maps:** [View location](https://www.google.com/maps/place/?q=place_id:ChIJ17LUOQDTuEcRZeLG8OCF06c)

---

## Common Tasks for AI Agents

### Add a new menu item / specialty card
1. Copy an existing `<article class="card">` block in `index.html`
2. Update `data-en`, `data-de`, icon emoji, and description
3. No CSS changes needed — grid auto-fits

### Change brand colours
Edit only the `:root` block at the top of `css/style.css`:
- `--terra` — primary accent (buttons, highlights)
- `--gold` — secondary accent (ratings, numbers)
- `--cream` — primary text
- `--bg` — page background

### Add a new page section
1. Add HTML section with `class="section"` and an `id`
2. Add nav link in both the `<nav>` and `<footer>` with `data-en`/`data-de` attributes
3. Use `.container`, `.section__eyebrow`, `.section__title` for consistent styling
4. Add `.reveal` to elements for scroll animation

### Update opening hours
Edit the `<table class="hours__table">` in `index.html` AND the `highlightToday()` function in `js/main.js` (the open/closed time logic).

### Trigger a manual review scrape
Go to **Actions tab → Scrape Google Reviews → Run workflow**.

### Deploy changes
Push to `main` branch — GitHub Pages auto-deploys within ~60 seconds. No build command needed.

---

## Guardrails

- Do **not** introduce npm, a bundler, or a framework — the zero-dependency constraint is intentional
- Do **not** commit API keys or secrets
- Do **not** modify `data/reviews.json` manually — it is managed by the scraper
- Keep all text strings bilingual (`data-en` + `data-de` on every user-facing element)
- Test responsive layout at 375px, 768px, and 1280px before committing style changes
