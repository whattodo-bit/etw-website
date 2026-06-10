/* ============================================================
   nav.js — Shared navbar behaviour for all ETW pages
   Handles: scroll | hamburger overlay | social popups (YT/IG/X)
============================================================ */

(function () {
  'use strict';

  /* ── Scroll: transparent → solid #0A0A0A ── */
  var nav = document.getElementById('mainNav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeOverlay(); closeAllPopups(); }
  });

  /* ── Social popups: YouTube / Instagram / X ── */
  var POPUP_IDS = { yt: 'social-popup-yt', ig: 'social-popup-ig', x: 'social-popup-x' };
  var popups = {};
  Object.keys(POPUP_IDS).forEach(function (k) {
    popups[k] = document.getElementById(POPUP_IDS[k]);
  });

  function closeAllPopups() {
    Object.keys(popups).forEach(function (k) {
      if (popups[k]) popups[k].classList.remove('open');
    });
  }

  function openPopup(triggerEl, type) {
    var popup = popups[type];
    if (!popup) return;
    var rect = triggerEl.getBoundingClientRect();
    /* Position above trigger, right-aligned */
    popup.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
    popup.style.right  = (window.innerWidth - rect.right) + 'px';
    popup.style.top    = 'auto';
    popup.style.left   = 'auto';
    popup.classList.add('open');
  }

  /* Bind all buttons with data-popup="yt|ig|x" */
  document.querySelectorAll('[data-popup]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var type = btn.dataset.popup;
      var isOpen = popups[type] && popups[type].classList.contains('open');
      closeAllPopups();
      if (!isOpen) openPopup(btn, type);
    });
  });

  /* Click outside closes any open popup */
  document.addEventListener('click', closeAllPopups);
  Object.keys(popups).forEach(function (k) {
    if (popups[k]) {
      popups[k].addEventListener('click', function (e) { e.stopPropagation(); });
    }
  });

})();
