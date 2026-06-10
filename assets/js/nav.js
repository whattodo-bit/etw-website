/* ═══════════════════════════════════════════════════════════
   ETW — nav.js
   Navbar scroll · Social popups · Hamburger menu · Notify form
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── Navbar: transparent → solid on scroll ────────────── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    function handleScroll() {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // apply on load (e.g. page refresh mid-scroll)
  }

  /* ─── Social popups ─────────────────────────────────────── */
  function closeAllPopups() {
    document.querySelectorAll('.social-popup').forEach(function (p) {
      p.classList.remove('active');
    });
  }

  document.querySelectorAll('.icon-btn[data-popup]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      // Find the sibling popup inside the same icon-wrapper
      var wrapper = btn.closest('.icon-wrapper');
      var popup   = wrapper && wrapper.querySelector('.social-popup');
      if (!popup) return;
      var isOpen  = popup.classList.contains('active');
      closeAllPopups();
      if (!isOpen) popup.classList.add('active');
    });
  });

  // Close on any outside click
  document.addEventListener('click', closeAllPopups);

  /* ─── Hamburger / mobile overlay ───────────────────────── */
  var hamburger  = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');
  var closeBtn   = document.getElementById('mobile-close');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      mobileMenu.classList.add('active');
    });
  }
  if (closeBtn && mobileMenu) {
    closeBtn.addEventListener('click', function () {
      mobileMenu.classList.remove('active');
    });
  }
  // Close overlay when a nav link inside it is tapped
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('active');
      });
    });
  }

  /* ─── Notify form (Web3Forms) ───────────────────────────── */
  document.querySelectorAll('.notify-form').forEach(function (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var btn     = form.querySelector('.notify-btn');
      var success = form.querySelector('.notify-success');
      var orig    = btn ? btn.textContent : '';

      if (btn) { btn.textContent = '…'; btn.disabled = true; }
      if (success) { success.textContent = ''; success.style.color = ''; }

      try {
        var res  = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body:   new FormData(form),
        });
        var json = await res.json();

        if (json.success) {
          if (success) success.textContent = "You'll be the first to know.";
          form.reset();
        } else {
          if (success) {
            success.textContent = 'Something went wrong. Try again.';
            success.style.color = '#ff6b6b';
          }
        }
      } catch (_) {
        if (success) {
          success.textContent = 'Connection error. Try again.';
          success.style.color = '#ff6b6b';
        }
      } finally {
        if (btn) { btn.textContent = orig; btn.disabled = false; }
      }
    });
  });

})();
