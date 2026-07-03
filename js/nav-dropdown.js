(function () {
  'use strict';

  /* ── Desktop dropdown ── */
  var drop  = document.getElementById('svcDrop');
  var btn   = document.getElementById('svcBtn');
  var panel = document.getElementById('svcPanel');

  if (drop && btn && panel) {
    function openDrop() {
      drop.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
    function closeDrop() {
      drop.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    /* Keyboard: Enter/Space toggles, Escape closes, Arrow Down moves focus into panel */
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        drop.classList.contains('open') ? closeDrop() : openDrop();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        openDrop();
        var first = panel.querySelector('a');
        if (first) first.focus();
      }
    });

    /* Arrow navigation inside panel */
    panel.addEventListener('keydown', function (e) {
      var items = Array.from(panel.querySelectorAll('a'));
      var idx   = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx < items.length - 1) items[idx + 1].focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) items[idx - 1].focus();
        else btn.focus();
      }
      if (e.key === 'Escape') { closeDrop(); btn.focus(); }
      if (e.key === 'Tab') { closeDrop(); }
    });

    /* Touch: tap to toggle (CSS :hover doesn't fire on touch) */
    btn.addEventListener('click', function (e) {
      if (window.matchMedia('(hover: none)').matches) {
        e.preventDefault();
        drop.classList.contains('open') ? closeDrop() : openDrop();
      }
    });

    /* Close when any panel link is clicked */
    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { closeDrop(); });
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (!drop.contains(e.target)) closeDrop();
    });

    /* Close on global Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrop();
    });
  }

  /* ── Mobile accordion ── */
  var mmBtn  = document.getElementById('mmSvcBtn');
  var mmList = document.getElementById('mmSvcList');

  if (mmBtn && mmList) {
    mmBtn.addEventListener('click', function () {
      var isOpen = mmList.classList.contains('open');
      mmList.classList.toggle('open', !isOpen);
      mmBtn.setAttribute('aria-expanded', String(!isOpen));
    });
  }
})();
