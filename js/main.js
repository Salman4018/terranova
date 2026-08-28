/* ═══════════════════════════════════════════════════════════════
   TERRANOVA OHLIGS — main.js
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   CONFIG
   ────────────────────────────────────────────────────────────── */
const CONFIG = {
  REVIEWS_JSON : 'data/reviews.json',   // updated daily by GitHub Actions
  REVIEW_URL   : 'https://search.google.com/local/writereview?placeid=ChIJ17LUOQDTuEcRZeLG8OCF06c',
  MAPS_URL     : 'https://www.google.com/maps/place/?q=place_id:ChIJ17LUOQDTuEcRZeLG8OCF06c',
};

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
    // Cache-bust with date so visitors always get today's data
    const today = new Date().toISOString().slice(0, 10);
    const res   = await fetch(`${CONFIG.REVIEWS_JSON}?v=${today}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    renderReviews(cardsEl, data);

    if (noteEl && data.updatedAt) {
      const date = new Date(data.updatedAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      noteEl.textContent = `Reviews last refreshed ${date}`;
    }
  } catch (err) {
    console.warn('[Terranova] Could not load reviews.json:', err.message);
    cardsEl.innerHTML = '<p style="color:var(--cream-muted);text-align:center;grid-column:1/-1">Reviews temporarily unavailable.</p>';
  }
}

/* Render summary numbers */
function updateSummary(rating, count) {
  const scoreEl = document.getElementById('reviewScore');
  const countEl = document.getElementById('reviewCount');
  const starsEl = document.getElementById('reviewStars');

  if (scoreEl) scoreEl.textContent = rating.toFixed(1);
  if (countEl) {
    const isDE = document.documentElement.lang === 'de';
    countEl.textContent = isDE
      ? `Basierend auf ${count} Google-Bewertungen`
      : `Based on ${count} Google reviews`;
  }
  if (starsEl) starsEl.innerHTML = buildStars(rating);
}

/* Build star HTML for a given rating */
function buildStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i)               html += '<span class="star filled">★</span>';
    else if (rating >= i - 0.5)    html += '<span class="star half">★</span>';
    else                           html += '<span class="star">★</span>';
  }
  return html;
}

/* Render review cards into container */
function renderReviews(container, place) {
  container.innerHTML = '';
  updateSummary(place.rating, place.reviewCount);

  place.reviews.forEach(review => {
    const initials = review.author
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const avatarHtml = review.avatar
      ? `<img src="${review.avatar}" alt="${review.author}" loading="lazy" />`
      : initials;

    const card = document.createElement('article');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-card__header">
        <div class="review-card__avatar">${avatarHtml}</div>
        <div>
          <p class="review-card__name">${escHtml(review.author)}</p>
          <p class="review-card__date">${escHtml(review.time)}</p>
        </div>
      </div>
      <div class="review-card__stars">${buildStars(review.rating)}</div>
      <p class="review-card__text">${escHtml(review.text)}</p>
      <div class="review-card__source">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google Review
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
  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <div class="review-skeleton">
        <div class="skeleton-line skeleton-line--short"></div>
        <div class="skeleton-line skeleton-line--med"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-line--short"></div>
      </div>`;
  }
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
(function () {
  let currentLang = 'de';

  const btn     = document.getElementById('langToggle');
  const labelEN = btn.querySelector('.lang-toggle__en');
  const labelDE = btn.querySelector('.lang-toggle__de');

  function applyLang(lang) {
    currentLang = lang;
    labelEN.classList.toggle('active', lang === 'en');
    labelDE.classList.toggle('active', lang === 'de');

    document.querySelectorAll('[data-en]').forEach(el => {
      const text = el.getAttribute('data-' + lang);
      if (!text) return;
      if (text.includes('<br')) el.innerHTML = text;
      else el.textContent = text;
    });

    document.documentElement.lang = lang;
    highlightToday();

    // re-render review count label in correct language
    const scoreEl = document.getElementById('reviewScore');
    if (scoreEl) {
      const count = document.getElementById('reviewCount');
      const score = parseFloat(scoreEl.textContent);
      if (count && !isNaN(score)) {
        // extract the number from current text
        const match = count.textContent.match(/\d+/);
        const n = match ? match[0] : '47';
        count.textContent = lang === 'de'
          ? `Basierend auf ${n} Google-Bewertungen`
          : `Based on ${n} Google reviews`;
      }
    }
  }

  btn.addEventListener('click', () => applyLang(currentLang === 'en' ? 'de' : 'en'));

  // init with DE
  applyLang('de');
})();

/* ═══════════════════════════════════════════════════════════════
   STICKY NAV
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const nav = document.getElementById('nav');
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

  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      burger.classList.remove('open');
      nav.classList.remove('menu-open');
      document.body.style.overflow = '';
    });
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
   TODAY HOURS HIGHLIGHT
   ═══════════════════════════════════════════════════════════════ */
function highlightToday() {
  const now    = new Date();
  const day    = now.getDay();
  const time   = now.getHours() + now.getMinutes() / 60;
  const isDE   = document.documentElement.lang === 'de';

  document.querySelectorAll('.hours__row--today').forEach(r =>
    r.classList.remove('hours__row--today')
  );
  const todayRow = document.querySelector(`.hours__row[data-day="${day}"]`);
  if (todayRow) todayRow.classList.add('hours__row--today');

  const statusEl = document.getElementById('hoursStatus');
  if (!statusEl) return;

  let open = false;
  if (day === 1)       open = false;
  else if (day === 0)  open = time >= 7.5 && time < 22;
  else                 open = time >= 6   && time < 22;

  if (open) {
    statusEl.textContent = isDE ? 'Jetzt geöffnet' : 'Open now';
    statusEl.className   = 'hours__status hours__status--open';
  } else {
    statusEl.textContent = isDE ? 'Derzeit geschlossen' : 'Currently closed';
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
   BAR CHART ANIMATION (trigger when summary enters view)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const summary = document.querySelector('.reviews__summary');
  if (!summary || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      summary.querySelectorAll('.reviews__bar-fill').forEach(bar => {
        bar.style.animationPlayState = 'running';
      });
      obs.disconnect();
    }
  }, { threshold: 0.3 });
  obs.observe(summary);

  // Pause bars initially
  document.querySelectorAll('.reviews__bar-fill').forEach(bar => {
    bar.style.animationPlayState = 'paused';
  });
})();

/* ── Boot ── */
initReviews();
