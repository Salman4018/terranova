/* ═══════════════════════════════════════════════════════════════
   TERRANOVA OHLIGS — main.js
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── Language toggle ──────────────────────────────────────────────
(function () {
  let currentLang = 'en';

  const btn      = document.getElementById('langToggle');
  const labelEN  = btn.querySelector('.lang-toggle__en');
  const labelDE  = btn.querySelector('.lang-toggle__de');

  function applyLang(lang) {
    currentLang = lang;

    // toggle active class on button labels
    labelEN.classList.toggle('active', lang === 'en');
    labelDE.classList.toggle('active', lang === 'de');

    // update all elements that carry data-en / data-de
    document.querySelectorAll('[data-en]').forEach(el => {
      const text = el.getAttribute('data-' + lang);
      if (!text) return;

      // support <br> in strings
      if (text.includes('<br')) {
        el.innerHTML = text;
      } else {
        el.textContent = text;
      }
    });

    // update html lang attribute for accessibility
    document.documentElement.lang = lang;

    // re-apply today highlight labels (day names change)
    highlightToday();
  }

  btn.addEventListener('click', () => {
    applyLang(currentLang === 'en' ? 'de' : 'en');
  });
})();


// ── Sticky nav on scroll ─────────────────────────────────────────
(function () {
  const nav = document.getElementById('nav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


// ── Mobile burger menu ───────────────────────────────────────────
(function () {
  const burger    = document.getElementById('burger');
  const navLinks  = document.getElementById('navLinks');

  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // close on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      burger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();


// ── Scroll reveal via IntersectionObserver ───────────────────────
(function () {
  const revealEls = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach(el => observer.observe(el));
})();


// ── Today's hours highlight + open/closed status ─────────────────
function highlightToday() {
  const now    = new Date();
  const day    = now.getDay();  // 0 = Sunday
  const hour   = now.getHours();
  const minute = now.getMinutes();
  const time   = hour + minute / 60;

  const isGerman = document.documentElement.lang === 'de';

  // remove previous today class
  document.querySelectorAll('.hours__row--today').forEach(r =>
    r.classList.remove('hours__row--today')
  );

  // highlight today's row
  const todayRow = document.querySelector(`.hours__row[data-day="${day}"]`);
  if (todayRow) todayRow.classList.add('hours__row--today');

  // determine if currently open
  const statusEl = document.getElementById('hoursStatus');
  if (!statusEl) return;

  let open = false;
  if (day === 1) {
    // Monday — closed
    open = false;
  } else if (day === 0) {
    // Sunday 07:30–22:00
    open = time >= 7.5 && time < 22;
  } else {
    // Tue–Sat 06:00–22:00
    open = time >= 6 && time < 22;
  }

  if (open) {
    statusEl.textContent = isGerman ? 'Jetzt geöffnet' : 'Open now';
    statusEl.className   = 'hours__status hours__status--open';
  } else {
    statusEl.textContent = isGerman ? 'Derzeit geschlossen' : 'Currently closed';
    statusEl.className   = 'hours__status hours__status--closed';
  }
}

highlightToday();


// ── Footer year ───────────────────────────────────────────────────
(function () {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();


// ── Smooth parallax on hero image (desktop only) ──────────────────
(function () {
  const heroImg = document.querySelector('.hero__img');
  if (!heroImg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY;
      heroImg.style.transform = `translateY(${scrolled * 0.28}px)`;
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();
