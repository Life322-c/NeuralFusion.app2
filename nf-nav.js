/* NeuralFusion public navigation: behaviour for the static pages.
   Load in <head> WITHOUT defer so the "nfx-js" class lands before first paint (no flash of the no-JS layout).
   CSP-safe: external file, no inline JS, no dependencies.

   Desktop (>= 900px)  disclosure dropdowns: click toggles, one open at a time, outside tap / Escape / Tab-away closes.
   Mobile  (<  900px)  full-screen overlay with three independent accordions, focus trap, scroll lock, Escape to close.
   The React app's signed-out bar (app.js, PublicNav) implements the same behaviour with the same classes. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('nfx-js');

  function init() {
    var header = document.querySelector('header.nfx-header');
    if (!header) return;
    var nav = header.querySelector('.nfx-nav');
    var toggle = header.querySelector('.nfx-toggle');
    var brand = header.querySelector('.nfx-brand');
    var groups = [].slice.call(header.querySelectorAll('.nfx-group'));
    var mq = window.matchMedia('(max-width: 899.98px)');

    function trigger(g) { return g.querySelector('.nfx-trigger'); }
    function panel(g) { return g.querySelector('.nfx-panel'); }
    function linksOf(g) { return [].slice.call(panel(g).querySelectorAll('a')); }
    function isOpen(g) { return g.classList.contains('is-open'); }
    function menuOpen() { return header.classList.contains('nfx-open'); }

    groups.forEach(function (g) { if (g.querySelector('a[aria-current="page"]')) g.classList.add('has-current'); });

    /* keep a desktop panel inside the viewport */
    function place(g) {
      var p = panel(g);
      p.style.left = '';
      var r = p.getBoundingClientRect();
      var over = r.right - (window.innerWidth - 12);
      if (over > 0) p.style.left = (-over) + 'px';
    }
    function setGroup(g, open) {
      g.classList.toggle('is-open', open);
      trigger(g).setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && !mq.matches) place(g);
    }
    function closeAll(except) {
      groups.forEach(function (g) { if (g !== except && isOpen(g)) setGroup(g, false); });
    }
    function focusLink(g, which) {
      var items = linksOf(g);
      if (!items.length) return;
      (which === 'last' ? items[items.length - 1] : items[0]).focus();
    }

    /* ---- group triggers + panels ---- */
    groups.forEach(function (g, idx) {
      var t = trigger(g);
      t.addEventListener('click', function () {
        var willOpen = !isOpen(g);
        if (!mq.matches) closeAll(g); /* desktop: one at a time. mobile: sections are independent */
        setGroup(g, willOpen);
      });
      t.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowDown' || k === 'ArrowUp') {
          e.preventDefault();
          if (!mq.matches) closeAll(g);
          setGroup(g, true);
          focusLink(g, k === 'ArrowUp' ? 'last' : 'first');
        } else if (!mq.matches && (k === 'ArrowRight' || k === 'ArrowLeft')) {
          var next = groups[(idx + (k === 'ArrowRight' ? 1 : groups.length - 1)) % groups.length];
          e.preventDefault();
          var wasOpen = isOpen(g);
          if (wasOpen) { setGroup(g, false); setGroup(next, true); }
          trigger(next).focus();
        }
      });
      panel(g).addEventListener('keydown', function (e) {
        var items = linksOf(g), i = items.indexOf(document.activeElement), k = e.key;
        if (k === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
        else if (k === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
        else if (k === 'Home') { e.preventDefault(); items[0].focus(); }
        else if (k === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      });
    });

    /* ---- mobile overlay ---- */
    function setInert(on) {
      var el = header;
      while (el && el !== document.body) {
        var parent = el.parentNode;
        [].forEach.call(parent.children, function (s) {
          if (s === el || /^(SCRIPT|STYLE|LINK|NOSCRIPT|TEMPLATE)$/.test(s.tagName)) return;
          if (on) { if (!s.hasAttribute('inert')) { s.setAttribute('inert', ''); s.setAttribute('data-nfx-inert', '1'); } }
          else if (s.getAttribute('data-nfx-inert')) { s.removeAttribute('inert'); s.removeAttribute('data-nfx-inert'); }
        });
        el = parent;
      }
    }
    function openMenu() {
      header.classList.add('nfx-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close menu');
      root.classList.add('nfx-lock');
      setInert(true);
      var first = groups[0] && trigger(groups[0]);
      if (first) first.focus();
    }
    function closeMenu(restoreFocus) {
      if (!menuOpen()) return;
      header.classList.remove('nfx-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      root.classList.remove('nfx-lock');
      setInert(false);
      closeAll(); /* next open starts with the three categories only */
      if (restoreFocus) toggle.focus();
    }
    if (toggle) toggle.addEventListener('click', function () { if (menuOpen()) closeMenu(true); else openMenu(); });

    /* keep Tab inside the overlay (brand, close button, links) while it is open */
    header.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !menuOpen()) return;
      var list = [brand, toggle].concat([].slice.call(nav.querySelectorAll('a[href], button:not([disabled])')))
        .filter(function (el) { return el && getComputedStyle(el).visibility !== 'hidden'; });
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1], a = document.activeElement;
      if (e.shiftKey && (a === first || list.indexOf(a) === -1)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || list.indexOf(a) === -1)) { e.preventDefault(); first.focus(); }
    });

    /* ---- global dismissals ---- */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (menuOpen()) { e.preventDefault(); closeMenu(true); return; }
      var open = groups.filter(isOpen)[0];
      if (open) { var hadFocus = open.contains(document.activeElement); closeAll(); if (hadFocus) trigger(open).focus(); }
    });
    /* pointerdown (not click) so a tap on a non-clickable area also closes the panel on iOS */
    document.addEventListener('pointerdown', function (e) {
      if (!mq.matches && !header.contains(e.target)) closeAll();
    });
    /* desktop: tabbing out of an open group closes it */
    header.addEventListener('focusout', function (e) {
      if (mq.matches) return;
      var g = e.target.closest && e.target.closest('.nfx-group');
      if (g && isOpen(g) && e.relatedTarget && !g.contains(e.relatedTarget)) setGroup(g, false);
    });
    /* choosing a destination closes everything */
    nav.addEventListener('click', function (e) {
      if (!e.target.closest('a[href]')) return;
      if (mq.matches) closeMenu(false); else closeAll();
    });
    function reset() { closeMenu(false); closeAll(); }
    if (mq.addEventListener) mq.addEventListener('change', reset); else if (mq.addListener) mq.addListener(reset);
    window.addEventListener('pageshow', function (e) { if (e.persisted) reset(); });
    window.addEventListener('resize', function () { if (!mq.matches) groups.forEach(function (g) { if (isOpen(g)) place(g); }); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
