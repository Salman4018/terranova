# Terranova Ohligs — Website

A modern, responsive pitch website for **Terranova**, an Italian café and bakery in Solingen-Ohligs, Germany. Built as a static site hosted on GitHub Pages — no build step, no framework, no running costs.

**Live site:** https://salman4018.github.io/terranova/

---

## Features

- **Dark espresso design** — premium Italian café aesthetic with terracotta and gold accents
- **Fully responsive** — mobile-first, tested from 375px to 1440px
- **Bilingual EN / DE** — instant language toggle, default German
- **Live Google Reviews** — scraped daily via GitHub Actions, no API key required
- **Leave a Review button** — deep-links directly to Google's write-review dialog
- **Animated scroll reveals** — elements fade and slide in as you scroll
- **Live opening hours** — today's row highlighted, pulsing open/closed status
- **Parallax hero** — subtle depth on scroll (respects `prefers-reduced-motion`)
- **Animated marquee** — scrolling menu items between sections
- **Google Maps embed** — dark-tinted, clears to full colour on hover
- **Glassmorphism nav** — transparent → frosted glass on scroll, solid when menu open
- **Mobile hamburger menu** — full-screen overlay with large staggered serif links
- **Grain texture overlay** — subtle premium tactile feel

---

## Tech Stack

No dependencies. No build step. Pure static files.

```
HTML5  ·  CSS3 (custom properties, grid, flexbox)  ·  Vanilla JS (ES2020)
GitHub Pages  ·  GitHub Actions (Python scraper)
```

---

## Project Structure

```
terranova/
├── index.html                    # Single-page site (all sections)
├── css/
│   └── style.css                 # Complete stylesheet
├── js/
│   └── main.js                   # All interactivity
├── data/
│   └── reviews.json              # Auto-updated daily by GitHub Actions
├── scripts/
│   └── scrape_reviews.py         # Google Maps scraper (no API key)
├── .github/
│   └── workflows/
│       └── scrape-reviews.yml    # Daily scrape at 06:00 UTC
├── .nojekyll                     # Bypasses Jekyll on GitHub Pages
├── AGENTS.md                     # Developer / AI agent reference
└── README.md                     # This file
```

---

## Getting Started

### View locally

No server required — just open in a browser:

```bash
# Clone the repo
git clone https://github.com/Salman4018/terranova.git
cd terranova

# Open directly (reviews won't load due to CORS on file://)
open index.html

# For full functionality including reviews, use a local server:
python -m http.server 8080
# then visit http://localhost:8080
```

### Deploy to GitHub Pages

1. Push to the `main` branch
2. Go to **Settings → Pages → Source → Deploy from branch → main / root**
3. Live at `https://<your-username>.github.io/terranova/` within ~60 seconds

---

## Google Reviews — How It Works

Reviews are fetched **without an API key** using a daily GitHub Actions workflow:

```
GitHub Actions (daily 06:00 UTC)
  └── scripts/scrape_reviews.py
        ├── Fetches public Google Maps HTML for Place ID
        ├── Extracts: rating, review count, up to 5 reviews
        └── Commits result to data/reviews.json

Browser (on page load)
  └── fetch('data/reviews.json')
        └── Renders review cards, rating summary, bar chart
```

### Trigger a manual scrape

1. Go to the **Actions** tab in GitHub
2. Select **Scrape Google Reviews**
3. Click **Run workflow**

### To use the official Places API instead (optional)

1. Create a key at [console.cloud.google.com](https://console.cloud.google.com) with **Places API (New)** enabled
2. Restrict the key to your GitHub Pages domain
3. Open `js/main.js` and set:

```js
const CONFIG = {
  REVIEWS_JSON : 'data/reviews.json',
  // add your key here and update initReviews() to call the Places API endpoint
  ...
};
```

---

## Customisation

### Brand colours

All colours are CSS custom properties in `:root` at the top of `css/style.css`:

```css
--terra:  #c4622d   /* primary accent — buttons, highlights */
--gold:   #d4a853   /* secondary accent — ratings, numbers  */
--cream:  #faf6f1   /* primary text                         */
--bg:     #0f0a08   /* page background                      */
```

### Add a specialty card

Copy any `<article class="card">` in `index.html` and update the `data-en`, `data-de`, emoji, and description. The grid auto-fits.

### Change default language

In `js/main.js`, find:

```js
let currentLang = 'de';
```

Change to `'en'` for English default.

### Update opening hours

1. Edit the `<table class="hours__table">` rows in `index.html`
2. Update the open/closed time logic in `highlightToday()` in `js/main.js`

---

## Business Information

| | |
|---|---|
| **Name** | Terranova |
| **Type** | Italian Café & Bakery |
| **Address** | Düsseldorfer Str. 41, 42697 Solingen, Germany |
| **Phone** | +49 212 23086710 |
| **Hours** | Tue–Sat 06:00–22:00 · Sun 07:30–22:00 · Mon closed |
| **Instagram** | [@terranova_ohligs](https://www.instagram.com/terranova_ohligs/) |
| **Google Maps** | [View on Maps](https://www.google.com/maps/place/?q=place_id:ChIJ17LUOQDTuEcRZeLG8OCF06c) |
| **Google Place ID** | `ChIJ17LUOQDTuEcRZeLG8OCF06c` |

---

## Browser Support

All modern browsers. No polyfills needed.

| Feature | Requirement |
|---|---|
| CSS custom properties | Chrome 49+, Firefox 31+, Safari 9.1+ |
| IntersectionObserver | Chrome 51+, Firefox 55+, Safari 12.1+ |
| CSS Grid | Chrome 57+, Firefox 52+, Safari 10.1+ |
| `fetch()` | Chrome 42+, Firefox 39+, Safari 10.1+ |

---

## License

This project is a client pitch demo. All rights reserved.
