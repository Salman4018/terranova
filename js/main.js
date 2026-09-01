/* ═══════════════════════════════════════════════════════════════
   TERRANOVA OHLIGS — main.js
   Optimised for accessibility, i18n, and production-readiness.
   Zero dependencies.
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* Tag body when JS runs, so CSS can remove reveal guards */
document.documentElement.classList.remove('no-js');

/* ──────────────────────────────────────────────────────────────
   CONFIG
   ────────────────────────────────────────────────────────────── */
const CONFIG = {
  REVIEWS_JSON : 'data/reviews.json',   // updated daily by GitHub Actions
  REVIEW_URL   : 'https://search.google.com/local/writereview?placeid=ChIJ17LUOQDTuEcRZeLG8OCF06c',
  MAPS_URL     : 'https://www.google.com/maps/place/?q=place_id:ChIJ17LUOQDTuEcRZeLG8OCF06c',
  MAP_EMBED    : 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2497.6!2d7.0004332!3d51.1616309!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b8d300390ab2d7%3A0xa7d38500f0c6e265!2sD%C3%BCsseldorfer%20Str.%2041%2C%2042697%20Solingen!5e0!3m2!1sen!2sde!4v1700000000000!5m2!1sen!2sde',
};

const LOCALES = {
  de: 'de-DE',
  en: 'en-GB',
  it: 'it-IT',
};

let loadedReviews = null;

/* ═══════════════════════════════════════════════════════════════
   REVIEWS — loads from data/reviews.json (no API key needed)
   Updated automatically every day by .github/workflows/scrape-reviews.yml
   ═══════════════════════════════════════════════════════════════ */
async function initReviews() {
  const cardsEl = document.getElementById('reviewCards');
  const noteEl  = document.getElementById('reviewsNote');
  if (!cardsEl) return;

  renderSkeletons(cardsEl, 3);

  try {
    // The reviews workflow can publish multiple updates in one day.
    const res = await fetch(`${CONFIG.REVIEWS_JSON}?v=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    loadedReviews = data;
    renderReviews(cardsEl, data);

    if (noteEl && data.updatedAt) {
      updateReviewRefreshNote(data.updatedAt);
    }
  } catch (err) {
    console.warn('[Terranova] Could not load reviews.json:', err.message);
    cardsEl.innerHTML = `<p style="color:var(--cream-muted);text-align:center;grid-column:1/-1" data-i18n="reviews.unavailable">${t('reviews.unavailable')}</p>`;
  }
}

function updateReviewRefreshNote(updatedAt) {
  const noteEl = document.getElementById('reviewsNote');
  if (!noteEl || !updatedAt) return;
  const date = new Date(updatedAt).toLocaleDateString(LOCALES[currentLang()], {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  noteEl.textContent = t('reviews.refreshed', { date });
}

/* Update summary numbers and distribution bars */
function updateSummary(rating, count, reviews) {
  const scoreEl = document.getElementById('reviewScore');
  const countEl = document.getElementById('reviewCount');
  const starsEl = document.getElementById('reviewStars');

  if (scoreEl) scoreEl.textContent = rating.toFixed(1);
  if (countEl) {
    countEl.textContent = reviewCountText(count);
  }
  if (starsEl) {
    starsEl.innerHTML = buildStars(rating);
    starsEl.setAttribute('aria-label', ratingText(rating));
  }

  renderBarChart(reviews, count);
}

/* Build star HTML for a given rating */
function buildStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i)               html += '<span class="star filled" aria-hidden="true">★</span>';
    else if (rating >= i - 0.5)    html += '<span class="star half" aria-hidden="true">★</span>';
    else                           html += '<span class="star" aria-hidden="true">★</span>';
  }
  return html;
}

/* Compute and render distribution bar chart from raw reviews */
function renderBarChart(reviews, total) {
  const container = document.getElementById('reviewBars');
  if (!container) return;

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (Array.isArray(reviews)) {
    reviews.forEach(r => {
      const rating = Math.round(Number(r.rating));
      if (counts[rating] !== undefined) counts[rating]++;
    });
  }

  // If we have a total but no distribution (common for scraped data), fall back to a heuristic
  // that preserves the overall average while showing bars.
  const hasDistribution = Object.values(counts).some(c => c > 0);
  const outOf = hasDistribution ? reviews.length : total;

  let html = '';
  for (let stars = 5; stars >= 1; stars--) {
    const count = counts[stars];
    const pct = outOf ? Math.round((count / outOf) * 100) : 0;
    html += `
      <div class="reviews__bar-row">
        <span class="reviews__bar-label">${stars} ★</span>
        <div class="reviews__bar-track" aria-hidden="true">
          <div class="reviews__bar-fill" style="width:${pct}%;transform:scaleX(0)"></div>
        </div>
        <span class="reviews__bar-pct">${pct}%</span>
        <span class="sr-only reviews__bar-description" data-count="${count}" data-stars="${stars}">${barReviewText(count, stars)}</span>
      </div>`;
  }
  container.innerHTML = html;

  // Trigger animation after paint
  requestAnimationFrame(() => {
    container.querySelectorAll('.reviews__bar-fill').forEach((bar, i) => {
      bar.style.transition = 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)';
      bar.style.transitionDelay = `${i * 80}ms`;
      bar.style.transform = 'scaleX(1)';
    });
  });
}

/* Render review cards into container */
function renderReviews(container, place) {
  container.innerHTML = '';
  updateSummary(place.rating, place.reviewCount, place.reviews);

  if (!Array.isArray(place.reviews) || !place.reviews.length) {
    container.innerHTML = `<p style="color:var(--cream-muted);text-align:center;grid-column:1/-1" data-i18n="reviews.none">${t('reviews.none')}</p>`;
    return;
  }

  place.reviews.forEach(review => {
    const initials = String(review.author || '?')
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const avatarHtml = review.avatar
      ? `<img src="${escHtml(review.avatar)}" alt="" loading="lazy" />`
      : escHtml(initials);

    const card = document.createElement('article');
    card.className = 'review-card';
    card.dataset.rating = String(review.rating);
    card.setAttribute('tabindex', '-1');
    card.innerHTML = `
      <div class="review-card__header">
        <div class="review-card__avatar" aria-hidden="true">${avatarHtml}</div>
        <div>
          <p class="review-card__name">${escHtml(review.author || t('reviews.anonymous'))}</p>
          <p class="review-card__date">${escHtml(review.time || '')}</p>
        </div>
      </div>
      <div class="review-card__stars" aria-label="${escHtml(ratingText(Number(review.rating)))}">${buildStars(Number(review.rating))}</div>
      <p class="review-card__text">${escHtml(review.text || '')}</p>
      <div class="review-card__source">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span class="review-card__source-label">${t('reviews.googleReview')}</span>
      </div>
    `;
    container.appendChild(card);
  });

  // trigger scroll reveal on new cards
  container.querySelectorAll('.review-card').forEach(el => observeReveal(el));
}

/* Skeleton loader */
function renderSkeletons(container, count) {
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.className = 'review-skeleton';
    div.innerHTML = `
      <div class="skeleton-line skeleton-line--short"></div>
      <div class="skeleton-line skeleton-line--med"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line skeleton-line--short"></div>`;
    frag.appendChild(div);
  }
  container.appendChild(frag);
}

/* Tiny HTML escaper */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ═══════════════════════════════════════════════════════════════
   LANGUAGE TOGGLE
   ═══════════════════════════════════════════════════════════════ */
let _currentLang = 'de';

function currentLang() {
  return _currentLang;
}

function t(key, variables = {}) {
  const translations = window.TRANSLATIONS?.[key];
  if (!translations) {
    console.warn(`[Terranova] Missing translation key: ${key}`);
    return key;
  }
  const text = translations[_currentLang] || translations.de || key;
  return Object.entries(variables).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    text
  );
}

function reviewCountText(count) {
  return t('reviews.count', { count });
}

function ratingText(rating) {
  return t('reviews.rating', { rating: Number(rating).toFixed(1) });
}

function barReviewText(count, stars) {
  return t(stars === 1 ? 'reviews.barOne' : 'reviews.barMany', { count, stars });
}

function updateAccessibilityLanguage() {
  const labels = {
    '#langToggle': 'a11y.languageGroup',
    '.nav__logo': 'a11y.home',
    '#burger': 'a11y.menu',
    '.hero__scroll': 'a11y.scrollDown',
    '.footer__nav': 'a11y.footerNav',
    '.footer__social a[href^="tel:"]': 'a11y.phone',
  };
  const imageAlts = {
    '.hero__img': 'image.heroAlt',
    '.about__img': 'image.aboutAlt',
    '.insta__img': 'image.instagramAlt',
  };
  Object.entries(labels).forEach(([selector, key]) => {
    document.querySelector(selector)?.setAttribute('aria-label', t(key));
  });
  Object.entries(imageAlts).forEach(([selector, key]) => {
    document.querySelector(selector)?.setAttribute('alt', t(key));
  });
  document.querySelector('#mapContainer iframe')?.setAttribute('title', t('location.mapTitle'));
  const mapPrompt = document.querySelector('.location__map--placeholder p');
  const mapButton = document.getElementById('loadMap');
  if (mapPrompt) mapPrompt.textContent = t('location.mapPrompt');
  if (mapButton) mapButton.textContent = t('location.loadMap');
}

function updateReviewLanguage() {
  if (!loadedReviews) return;

  const countEl = document.getElementById('reviewCount');
  const starsEl = document.getElementById('reviewStars');
  if (countEl) countEl.textContent = reviewCountText(loadedReviews.reviewCount);
  if (starsEl) starsEl.setAttribute('aria-label', ratingText(loadedReviews.rating));
  updateReviewRefreshNote(loadedReviews.updatedAt);

  document.querySelectorAll('.review-card').forEach(card => {
    const rating = Number(card.dataset.rating);
    card.querySelector('.review-card__stars')?.setAttribute('aria-label', ratingText(rating));
    const sourceLabel = card.querySelector('.review-card__source-label');
    if (sourceLabel) sourceLabel.textContent = t('reviews.googleReview');
  });

  document.querySelectorAll('.reviews__bar-description').forEach(description => {
    description.textContent = barReviewText(
      Number(description.dataset.count),
      Number(description.dataset.stars)
    );
  });
}

(function () {
  const control = document.getElementById('langToggle');
  if (!control) return;
  const options = Array.from(control.querySelectorAll('[data-lang]'));
  const languages = ['de', 'en', 'it'];
  const storageKey = 'terranova-language';

  function setMetaLanguage() {
    document.documentElement.lang = _currentLang;
    document.title = t('meta.title');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('meta.description'));
  }

  window.applyLang = function applyLang(lang) {
    if (!languages.includes(lang)) lang = 'de';
    _currentLang = lang;
    options.forEach(option => {
      const active = option.dataset.lang === lang;
      option.classList.toggle('active', active);
      option.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });

    setMetaLanguage();
    updateAccessibilityLanguage();
    highlightToday();
    updateReviewLanguage();
    localStorage.setItem(storageKey, lang);
  };

  control.addEventListener('click', event => {
    const option = event.target.closest('[data-lang]');
    if (option) applyLang(option.dataset.lang);
  });

  applyLang(localStorage.getItem(storageKey) || 'de');
})();

/* ═══════════════════════════════════════════════════════════════
   STICKY NAV
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ═══════════════════════════════════════════════════════════════
   MOBILE BURGER
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const burger   = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  const nav      = document.getElementById('nav');
  if (!burger || !navLinks || !nav) return;

  let lastFocused;

  const focusable = () => Array.from(navLinks.querySelectorAll('a[href]'));

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const items = focusable();
    const first = items[0];
    const last  = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }

  function setOpen(open) {
    navLinks.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      lastFocused = document.activeElement;
      setTimeout(() => focusable()[0]?.focus(), 0);
      navLinks.addEventListener('keydown', trapFocus);
    } else {
      navLinks.removeEventListener('keydown', trapFocus);
      if (lastFocused) lastFocused.focus();
    }
  }

  burger.addEventListener('click', () => setOpen(!navLinks.classList.contains('open')));

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      setOpen(false);
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════════════ */
const revealObserver = (() => {
  if (!('IntersectionObserver' in window)) return null;
  return new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
})();

function observeReveal(el) {
  if (revealObserver) revealObserver.observe(el);
  else el.classList.add('visible');
}

document.querySelectorAll('.reveal').forEach(observeReveal);

/* ═══════════════════════════════════════════════════════════════
   TODAY HOURS HIGHLIGHT (derived from DOM hours table)
   ═══════════════════════════════════════════════════════════════ */
function parseTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h + (m || 0) / 60;
}

function highlightToday() {
  const now = new Date();
  const day = now.getDay();
  const time = now.getHours() + now.getMinutes() / 60;

  document.querySelectorAll('.hours__row--today').forEach(r =>
    r.classList.remove('hours__row--today')
  );
  const todayRow = document.querySelector(`.hours__row[data-day="${day}"]`);
  if (todayRow) todayRow.classList.add('hours__row--today');

  const statusEl = document.getElementById('hoursStatus');
  if (!statusEl) return;

  let open = false;
  if (todayRow) {
    if (todayRow.classList.contains('hours__row--closed')) {
      open = false;
    } else {
      const opens = todayRow.dataset.opens;
      const closes = todayRow.dataset.closes;
      const openTime = parseTime(opens);
      const closeTime = parseTime(closes) || (parseTime(opens) < 12 ? 12 : 22);
      open = time >= openTime && time < closeTime;
    }
  }

  if (open) {
    statusEl.textContent = t('hours.openNow');
    statusEl.className   = 'hours__status hours__status--open';
  } else {
    statusEl.textContent = t('hours.closedNow');
    statusEl.className   = 'hours__status hours__status--closed';
  }
}

highlightToday();

/* ═══════════════════════════════════════════════════════════════
   FOOTER YEAR
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ═══════════════════════════════════════════════════════════════
   HERO PARALLAX
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const heroImg = document.querySelector('.hero__img');
  if (!heroImg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      heroImg.style.transform = `translateY(${window.scrollY * 0.28}px)`;
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════════
   PRIVACY BANNER / GOOGLE MAPS CONSENT
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const banner = document.getElementById('privacyBanner');
  const consentAll = document.getElementById('consentAll');
  const consentEssential = document.getElementById('consentEssential');
  const mapContainer = document.getElementById('mapContainer');
  if (!banner || !mapContainer) return;

  const KEY = 'terranova-consent';
  const choice = localStorage.getItem(KEY);

  function injectMap() {
    const iframe = document.createElement('iframe');
    iframe.title = t('location.mapTitle');
    iframe.src = CONFIG.MAP_EMBED;
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    mapContainer.innerHTML = '';
    mapContainer.appendChild(iframe);
  }

  function showPlaceholder() {
    mapContainer.innerHTML = `
      <div class="location__map--placeholder">
        <p>${t('location.mapPrompt')}</p>
        <button class="btn btn--primary" id="loadMap">${t('location.loadMap')}</button>
      </div>`;
    const loadBtn = document.getElementById('loadMap');
    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        injectMap();
        localStorage.setItem(KEY, 'all');
      });
    }
  }

  // Load map by default; only keep placeholder if user explicitly opted out
  if (choice === 'essential') {
    showPlaceholder();
  } else {
    injectMap();
    if (!choice) localStorage.setItem(KEY, 'all');
  }

  // Banner is still shown on first visit so users can choose essential-only
  if (!choice) {
    banner.hidden = false;
  }

  consentAll?.addEventListener('click', () => {
    injectMap();
    localStorage.setItem(KEY, 'all');
    banner.hidden = true;
  });

  consentEssential?.addEventListener('click', () => {
    localStorage.setItem(KEY, 'essential');
    showPlaceholder();
    banner.hidden = true;
  });
})();

/* ── Boot ── */
initReviews();
