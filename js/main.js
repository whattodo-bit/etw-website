/* ============================================================
   EXPLAINING THE WORLD — main.js
   Social popup · FAQ accordion · Archive search · FAQ search
============================================================ */
(function () {
  'use strict';

  /* ── Topbar date (unused in new design but kept for compatibility) ── */

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
          { label: 'ETW Articles', handle: '@etw.articles',        url: 'https://www.instagram.com/etw.articles' },
          { label: 'ETW Official', handle: '@explaining_theworld', url: 'https://www.instagram.com/explainingtheworld' }
        ];
      } else if (platform === 'X') {
        options = [
          { label: 'ETW Articles', handle: '@etw_articles', url: 'https://x.com/etw_articles' }
        ];
      } else if (platform === 'YouTube') {
        options = [
          { label: 'ETW Articles', handle: '@etw_articles', url: '#' }
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

  wireSearch('archive-search', '.archive-grid', '.archive-card', 'no-results');
  wireSearch('faq-search',     '.faq-list',     '.faq-item',     'faq-no-results');

  /* ── Collaborations form (prevent default, show confirmation) ── */
  var collabForm = document.getElementById('collab-form');
  if (collabForm) {
    collabForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = collabForm.querySelector('[type="submit"]');
      if (btn) {
        btn.textContent = 'Message sent — we\'ll be in touch.';
        btn.disabled = true;
      }
    });
  }

})();
