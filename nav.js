/* ============================================================
   nav.js — Shared navbar behaviour for all ETW pages
   Handles: scroll effect | hamburger overlay | Instagram popup
============================================================ */

(function () {
  'use strict';

  /* ── Scroll: transparent → solid ── */
  var nav = document.getElementById('mainNav');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on load

  /* ── Mobile hamburger / full-screen overlay ── */
  var hamburger = document.getElementById('navHamburger');
  var overlay   = document.getElementById('navOverlay');
  var closeBtn  = document.getElementById('navOverlayClose');

  function openOverlay() {
    if (!overlay) return;
    overlay.classList.add('open');
    if (hamburger) hamburger.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('open');
    if (hamburger) hamburger.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openOverlay);
  if (closeBtn)  closeBtn.addEventListener('click', closeOverlay);

  /* Close overlay on Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeOverlay();
  });

  /* ── Instagram popup ── */
  var instaPopup = document.getElementById('instaPopup');

  function positionAndOpen(triggerEl) {
    if (!instaPopup) return;
    var rect = triggerEl.getBoundingClientRect();
    /* Appear above the trigger */
    instaPopup.style.top    = 'auto';
    instaPopup.style.left   = 'auto';
    instaPopup.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
    instaPopup.style.right  = (window.innerWidth  - rect.right + 0) + 'px';
    instaPopup.classList.add('open');
  }

  function closeInsta() {
    if (instaPopup) instaPopup.classList.remove('open');
  }

  /* Bind to every element with data-insta-trigger */
  document.querySelectorAll('[data-insta-trigger]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      if (instaPopup && instaPopup.classList.contains('open')) {
        closeInsta();
      } else {
        positionAndOpen(el);
      }
    });
  });

  /* Click outside closes popup */
  document.addEventListener('click', closeInsta);
  if (instaPopup) {
    instaPopup.addEventListener('click', function (e) { e.stopPropagation(); });
  }

})();
