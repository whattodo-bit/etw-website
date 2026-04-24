/* =========================================================
   ETW — Shared scripts: topbar date, popup, FAQ, search
========================================================= */
(function(){

  /* ------ Topbar current date ------ */
  const dateEl = document.getElementById('topbar-date');
  if (dateEl){
    const d = new Date();
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    dateEl.textContent = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ------ Social popup ------ */
  // Every element with class .social-trigger and data attributes
  // data-articles-url and data-official-url opens the popup.
  const overlay = document.getElementById('social-popup');
  const articlesLink = document.getElementById('popup-articles');
  const officialLink = document.getElementById('popup-official');
  const closeBtn = overlay ? overlay.querySelector('.close') : null;

  function openPopup(articlesUrl, officialUrl){
    if (!overlay) return;
    if (articlesUrl) articlesLink.setAttribute('href', articlesUrl);
    if (officialUrl) officialLink.setAttribute('href', officialUrl);
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closePopup(){
    if (!overlay) return;
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.social-trigger').forEach(function(el){
    el.addEventListener('click', function(e){
      e.preventDefault();
      openPopup(el.dataset.articlesUrl, el.dataset.officialUrl);
    });
  });
  if (closeBtn) closeBtn.addEventListener('click', closePopup);
  if (overlay) overlay.addEventListener('click', function(e){
    if (e.target === overlay) closePopup();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closePopup();
  });

  /* ------ FAQ accordion ------ */
  document.querySelectorAll('.faq-item').forEach(function(item){
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', function(){
      item.classList.toggle('open');
    });
  });

  /* ------ Generic search filter (archive or faq) ------ */
  function wireSearch(inputId, containerId, rowSelector, titleSelector, noResId){
    const input = document.getElementById(inputId);
    const cont  = document.getElementById(containerId);
    if (!input || !cont) return;
    const rows  = Array.from(cont.querySelectorAll(rowSelector));
    const noRes = noResId ? document.getElementById(noResId) : null;
    const original = rows.slice();

    function count(text, term){
      if (!term) return 0;
      let n = 0, i = 0;
      while ((i = text.indexOf(term, i)) !== -1){ n++; i += term.length; }
      return n;
    }
    function restore(){
      original.forEach(function(r){
        r.style.display = '';
        if (noRes) cont.insertBefore(r, noRes);
      });
      if (noRes) noRes.classList.remove('show');
    }
    function filter(){
      const q = input.value.toLowerCase().trim();
      if (!q){ restore(); return; }
      const scored = rows.map(function(r){
        const t = (r.querySelector(titleSelector) ? r.querySelector(titleSelector).textContent : r.textContent).toLowerCase();
        const full = r.textContent.toLowerCase();
        return { r: r, score: count(t, q) * 3 + count(full, q) };
      });
      scored.sort(function(a, b){ return b.score - a.score; });
      let shown = 0;
      scored.forEach(function(s){
        if (s.score > 0){
          s.r.style.display = '';
          if (noRes) cont.insertBefore(s.r, noRes);
          shown++;
        } else {
          s.r.style.display = 'none';
        }
      });
      if (noRes) noRes.classList.toggle('show', shown === 0);
    }
    input.addEventListener('input', filter);
  }

  wireSearch('archive-search', 'archive-list', '.archive-row', '.title', 'no-results');
  wireSearch('faq-search', 'faq-list', '.faq-item', '.faq-q', 'faq-no-results');

})();
