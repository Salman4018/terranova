# AGENTS.md — Terranova Ohligs Website

## Project Overview

Production-ready static website for **Terranova Ohligs**, an Italian café and bakery located at Düsseldorfer Str. 41, 42697 Solingen, Germany. Hosted on **GitHub Pages** with zero build step.

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
│   └── style.css                       # All styles
├── js/
│   └── main.js                         # All interactivity
├── images/                             # Local image assets + favicons
│   ├── hero.jpg
│   ├── about.jpg
│   ├── insta.jpg
│   ├── favicon.svg
│   ├── favicon-32x32.png
│   └── favicon-180x180.png
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
- **Hardening:** rotating User-Agent strings, exponential backoff retries, JSON validation in CI

### Bilingual EN / DE
All user-facing strings are duplicated as `data-en` / `data-de` HTML attributes. A single JS toggle (`langToggle` button) swaps all text by reading those attributes. **Default language is German (DE)** and the default visible text is also German to avoid language flash.

### No Build Step
The site is pure static files. GitHub Pages serves `index.html` directly. `.nojekyll` prevents Jekyll processing.

### Privacy-First External Content
Google Maps and Google Fonts are treated as optional third-party content. A consent banner is shown; the Maps iframe is injected only after consent. A `noscript` fallback embed is still provided for users without JavaScript.

### Local Image Assets
The hero, about, and Instagram banner images live in `images/` rather than hotlinking remote URLs, making the site reliable for production.

---

## CSS Architecture

- **CSS custom properties** defined in `:root` — edit colours/fonts there only
- **Dark espresso theme** — `--bg: #0f0a08`, accent `--terra: #c4622d`, `--gold: #d4a853`
- **Mobile-first breakpoints:** `1024px`, `768px`, `640px`, `480px`
- **Scroll reveal** via `IntersectionObserver` — add class `reveal` (+ `reveal--delay-1/2/3`) to any element. Content remains visible if JS is disabled or user prefers reduced motion.
- **Grain texture overlay** — CSS `body::after` SVG filter, purely decorative
- **Focus states** — `2px solid var(--terra)` outline with offset; buttons use gold
- **Skip link** — `.skip-link` becomes visible on focus
- **Privacy banner** — fixed bottom banner, `z-index: 300`

### Key CSS sections (by line range — approximate)
| Section | ~Lines |
|---|---|
| Custom properties / reset / skip link | 1–90 |
| Buttons | 95–150 |
| Nav | 180–275 |
| Hero | 280–415 |
| About | 420–485 |
| Marquee | 490–525 |
| Cards / Menu | 530–610 |
| Hours | 615–705 |
| Location |710–790 |
| Instagram banner | 795–850 |
| Footer | 855–925 |
| Privacy banner | 930–975 |
| Reviews | 980–1170 |
| Responsive | 1175–1220 |
| Grain texture | 1225+ |

---

## JS Architecture (`js/main.js`)

Functions and IIFEs in order:

| Name | Purpose |
|---|---|
| `CONFIG` | Central config incl. Maps embed URL |
| `currentLang()` / `getText()` | Global helpers used by multiple features |
| `initReviews()` | Fetches `data/reviews.json`, renders cards + summary |
| `updateSummary()` | Updates score number, star display, count, bar chart |
| `buildStars()` | Returns star HTML for a given float rating |
| `renderBarChart()` | Computes distribution from live data and animates bars |
| `renderReviews()` | Populates review card HTML from data object |
| `renderSkeletons()` | Shows shimmer placeholder cards while loading |
| `escHtml()` | Minimal HTML entity escaper |
| Language toggle IIFE | Swaps `data-en`/`data-de` attributes; updates `lang`, meta description, aria-labels |
| Sticky nav IIFE | Adds `.scrolled` class after 40px scroll |
| Mobile burger IIFE | Toggles `.open` + `.menu-open`, manages `aria-expanded` and focus trap, Escape to close |
| Scroll reveal observer | Attaches `IntersectionObserver` to `.reveal` elements |
| `parseTime()` / `highlightToday()` | Highlights today's row, derives open/closed from `data-opens`/`data-closes` |
| Footer year IIFE | Sets `#year` to current year |
| Parallax IIFE | Subtle hero image translateY on scroll; respects reduced motion |
| Privacy / Maps consent IIFE | Consent banner, lazy-loads Maps iframe, persists choice |

---

## Opening Hours

| Day | Hours |
|---|---|
| Monday | Closed |
| Tuesday – Saturday | 06:00 – 22:00 |
| Sunday | 07:30 – 22:00 |

Rows in `index.html` use `data-opens` / `data-closes` attributes so `js/main.js` derives the open/closed badge automatically.

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
1. Add HTML `<section>` with `class="section"` and an `id`
2. Add nav link in both the `<nav>` and `<footer>` with `data-en`/`data-de` attributes
3. Use `.container`, `.section__eyebrow`, `.section__title` for consistent styling
4. Add `.reveal` to elements for scroll animation

### Update opening hours
1. Edit the `<table class="hours__table">` rows in `index.html`
2. Keep or set `data-opens` / `data-closes` attributes on each row
3. The JS automatically derives the open/closed badge

### Update images
Replace files in `images/` with new assets of the same name, or update the `src` attributes in `index.html`.

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
- Google Maps iframe must only load after user consent (handled by `js/main.js`)
- Keep image assets in `images/` and prefer local files over remote hotlinks for production reliability
