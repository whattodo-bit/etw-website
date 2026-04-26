/* ============================================================
   EXPLAINING THE WORLD — main.js
   Social popup · FAQ accordion · Archive search · FAQ search
============================================================ */
(function () {
  'use strict';

  /* ── Topbar date (unused in new design but kept for compatibility) ── */

  /* ── Mobile nav hamburger ── */
  var hamburger = document.querySelector('.nav__hamburger');
  var navLinks  = document.querySelector('.nav__links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      hamburger.classList.toggle('is-open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Social popup ── */
  var overlay  = document.getElementById('social-popup');
  var popupEl  = overlay ? overlay.querySelector('.popup') : null;
  var closeBtn = overlay ? overlay.querySelector('.popup__close') : null;

  function openPopup(platform, options) {
    if (!overlay) return;
    var platformEl = overlay.querySelector('.popup__platform');
    var headingEl  = overlay.querySelector('.popup__heading');
    var optionsEl  = overlay.querySelector('.popup__options');
    if (platformEl) platformEl.textContent = platform;
    if (headingEl)  headingEl.textContent  = 'Follow ETW on ' + platform;
    if (optionsEl) {
      optionsEl.innerHTML = '';
      options.forEach(function (opt) {
        var a = document.createElement('a');
        a.href   = opt.url || '#';
        a.target = '_blank';
        a.rel    = 'noopener noreferrer';
        a.className = 'popup__option';
        if (opt.dimmed) a.classList.add('popup__option--dimmed');
        a.innerHTML =
          '<div class="popup__option-left">' +
            '<span>' + opt.label + '</span>' +
            '<span class="popup__option-handle">' + opt.handle + '</span>' +
          '</div>' +
          '<span class="popup__option-arrow">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
          '</span>';
        optionsEl.appendChild(a);
      });
    }
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closePopup() {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closePopup);
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closePopup();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePopup();
  });

  /* Trigger buttons */
  document.querySelectorAll('[data-popup]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var platform = btn.dataset.popup;
      var options  = [];
      if (platform === 'Instagram') {
        options = [
          { label: 'ETW Articles', handle: '@etw.articles',         url: 'https://instagram.com/etw.articles' },
          { label: 'ETW Official', handle: '@explaining_the.world', url: 'https://instagram.com/explaining_the.world' }
        ];
      } else if (platform === 'X') {
        options = [
          { label: 'ETW Articles', handle: '@etw_articles',    url: 'https://x.com/etw_articles' },
          { label: 'ETW Official', handle: '@explaning_world', url: 'https://x.com/explaning_world' }
        ];
      } else if (platform === 'YouTube') {
        options = [
          { label: 'ETW Articles', handle: '@etw_articles',        url: 'https://youtube.com/@etw_articles' },
          { label: 'ETW Official', handle: '@explaining_theworld',  url: 'https://youtube.com/@explaining_theworld' }
        ];
      }
      openPopup(platform, options);
    });
  });

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      // Close all open items
      document.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
      });
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── Generic search filter ── */
  function wireSearch(inputId, containerSelector, cardSelector, noResultsId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var container = document.querySelector(containerSelector);
    if (!container) return;
    var cards     = Array.from(container.querySelectorAll(cardSelector));
    var noResults = noResultsId ? document.getElementById(noResultsId) : null;

    function score(card, term) {
      var text = card.textContent.toLowerCase();
      var titleEl = card.querySelector('h2, h3, .archive-card__title, .faq-question');
      var title   = titleEl ? titleEl.textContent.toLowerCase() : '';
      var count   = 0;
      var i = 0;
      while ((i = title.indexOf(term, i)) !== -1) { count += 3; i++; }
      i = 0;
      while ((i = text.indexOf(term, i)) !== -1)  { count += 1; i++; }
      return count;
    }

    input.addEventListener('input', function () {
      var q = input.value.toLowerCase().trim();
      if (!q) {
        cards.forEach(function (c) { c.style.display = ''; });
        if (noResults) noResults.classList.remove('visible');
        return;
      }
      var visible = 0;
      cards.forEach(function (c) {
        if (score(c, q) > 0) { c.style.display = ''; visible++; }
        else                  { c.style.display = 'none'; }
      });
      if (noResults) noResults.classList.toggle('visible', visible === 0);
    });
  }

  wireSearch('archive-search', '.archive-grid--single, .archive-grid', '.archive-card', 'no-results');
  wireSearch('faq-search',     '.faq-list',     '.faq-item',     'faq-no-results');

  /* ── Scroll reveal (IntersectionObserver) ── */
  var srTargets = [
    '.archive-card', '.article-card', '.principle-item',
    '.faq-item', '.contact-form-box', '.collab-info > h2',
    '.collab-info > p', '.collab-info > ul', '.legal-section'
  ].join(',');

  var srEls = document.querySelectorAll(srTargets);
  srEls.forEach(function (el, i) {
    el.classList.add('sr');
    var delayClasses = ['', 'd1', 'd2', 'd3'];
    var sibIdx = 0;
    var sib = el.previousElementSibling;
    while (sib) { sibIdx++; sib = sib.previousElementSibling; }
    var dc = delayClasses[sibIdx % 4];
    if (dc) el.classList.add(dc);
  });

  if ('IntersectionObserver' in window && srEls.length) {
    var srObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add('in');
          srObserver.unobserve(el);
          el.addEventListener('transitionend', function () {
            el.classList.remove('sr', 'in', 'd1', 'd2', 'd3');
          }, { once: true });
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    srEls.forEach(function (el) { srObserver.observe(el); });
  } else {
    /* fallback: show all immediately */
    srEls.forEach(function (el) { el.classList.remove('sr'); });
  }

  /* ── Reading progress bar (article pages) ── */
  var progressBar = document.querySelector('.reading-progress');
  if (progressBar) {
    window.addEventListener('scroll', function () {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        progressBar.style.width = Math.min(100, (window.scrollY / total) * 100) + '%';
      }
    }, { passive: true });
  }

})();
