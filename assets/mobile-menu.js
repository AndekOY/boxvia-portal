/* BoxVia mobile navigation v2: one source of truth for visibility and state. */
(function () {
  function init() {
    var toggle = document.querySelector('header .mobile-menu-toggle');
    var header = toggle && toggle.closest('header');
    var nav = header && header.querySelector('nav[aria-label="Main navigation"]');
    if (!toggle || !header || !nav) return;
    var media = window.matchMedia('(max-width: 760px)');
    function setOpen(open) {
      var active = !!open && media.matches;
      header.classList.toggle('boxvia-menu-open', active);
      toggle.setAttribute('aria-expanded', String(active));
      toggle.setAttribute('aria-label', active ? 'Close navigation menu' : 'Open navigation menu');
      toggle.textContent = active ? '✕' : '☰';
      if (media.matches) {
        nav.hidden = !active;
        nav.style.setProperty('display', active ? 'flex' : 'none', 'important');
      } else {
        nav.hidden = false;
        nav.style.removeProperty('display');
      }
    }
    setOpen(false);
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });
    document.addEventListener('click', function (event) {
      if (media.matches && !header.contains(event.target)) setOpen(false);
    });
    window.addEventListener('resize', function () { setOpen(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
