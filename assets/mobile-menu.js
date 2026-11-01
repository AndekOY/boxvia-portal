/* BOXVIA MOBILE MENU V1 */
(function () {
  function init() {
    var toggle = document.querySelector('header .mobile-menu-toggle');
    var header = toggle && toggle.closest('header');
    var nav = header && header.querySelector('nav[aria-label="Main navigation"]');
    if (!toggle || !header || !nav) return;
    function close() {
      header.classList.remove('boxvia-menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
    }
    toggle.addEventListener('click', function () {
      var opened = header.classList.toggle('boxvia-menu-open');
      toggle.setAttribute('aria-expanded', String(opened));
      toggle.textContent = opened ? '✕' : '☰';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) close();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
