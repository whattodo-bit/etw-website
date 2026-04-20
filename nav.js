/* ============================================
   ETW — Navbar scroll + mobile drawer
============================================ */
(function(){
  const nav = document.querySelector('.nav');
  if (nav){
    const onScroll = () => {
      if (window.scrollY > 20) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  const burger = document.querySelector('.burger');
  const drawer = document.querySelector('.drawer');
  if (burger && drawer){
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      drawer.classList.toggle('active');
      document.body.style.overflow = drawer.classList.contains('active') ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('active');
        drawer.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  const explore = document.getElementById('heroExplore');
  const content = document.getElementById('content');
  if (explore && content){
    explore.addEventListener('click', () => content.scrollIntoView({behavior:'smooth'}));
  }
})();
