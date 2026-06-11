/* ============================================================
   nav.js — ETW
   Handles: hamburger overlay | social popups (YT / IG / X)
   Navbar is transparent always — no scroll handler needed.
============================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════
     SOCIAL POPUPS
     Click icon → position popup below button → open
     Click outside → close
  ══════════════════════════════════════════ */

  var activePopup = null;

  function positionPopup(popup, btn) {
    var rect = btn.getBoundingClientRect();
    popup.style.top   = (rect.bottom + 8) + 'px';
    popup.style.left  = 'auto';
    popup.style.right = (window.innerWidth - rect.right) + 'px';
  }

  function openPopup(popup, btn) {
    if (activePopup && activePopup !== popup) {
      activePopup.classList.remove('open');
    }
    positionPopup(popup, btn);
    popup.classList.add('open');
    activePopup = popup;
  }

  function closeAllPopups() {
    if (activePopup) {
      activePopup.classList.remove('open');
      activePopup = null;
    }
  }

  function togglePopup(popup, btn) {
    if (popup.classList.contains('open')) {
      closeAllPopups();
    } else {
      openPopup(popup, btn);
    }
  }

  /* Bind each icon button */
  var buttons = [
    { btnId: 'ytBtn', popId: 'popup-yt' },
    { btnId: 'igBtn', popId: 'popup-ig' },
    { btnId: 'xBtn',  popId: 'popup-x'  }
  ];

  buttons.forEach(function (pair) {
    var btn = document.getElementById(pair.btnId);
    var pop = document.getElementById(pair.popId);
    if (!btn || !pop) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePopup(pop, btn);
    });

    /* Clicks inside popup do not close it */
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
  });

  /* Click anywhere outside → close */
  document.addEventListener('click', closeAllPopups);

  /* Escape key */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllPopups();
      closeOverlay();
    }
  });


  /* ══════════════════════════════════════════
     HAMBURGER / FULL-SCREEN OVERLAY
  ══════════════════════════════════════════ */

  var hamburger = document.getElementById('hamburger');
  var overlay   = document.getElementById('navOverlay');
  var closeBtn  = document.getElementById('overlayClose');
  var ovAbout   = document.getElementById('overlayAbout');

  function openOverlay() {
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openOverlay);
  if (closeBtn)  closeBtn.addEventListener('click',  closeOverlay);
  if (ovAbout)   ovAbout.addEventListener('click', function () {
    closeOverlay();
  });

  /* Overlay overlay-icon popups (mobile) */
  var ovButtons = [
    { btnId: 'ovYt', popId: 'popup-yt' },
    { btnId: 'ovIg', popId: 'popup-ig' },
    { btnId: 'ovX',  popId: 'popup-x'  }
  ];

  ovButtons.forEach(function (pair) {
    var btn = document.getElementById(pair.btnId);
    var pop = document.getElementById(pair.popId);
    if (!btn || !pop) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePopup(pop, btn);
    });
  });

})();
