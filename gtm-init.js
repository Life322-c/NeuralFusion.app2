/* Consent Mode defaults, consent banner and Google Tag Manager loader.
   Served from 'self' so the CSP does not need 'unsafe-inline' for scripts.
   Analytics storage is DENIED until the visitor accepts. A stored choice is restored on later visits.
   Visitors sending Global Privacy Control / Do Not Track are treated as declined and are not shown the banner.
   Must run before the GTM container loads. */
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

(function () {
  'use strict';
  var KEY = 'nf_consent';

  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* ignore */ } }
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function signalOptOut() {
    try { return navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1'; }
    catch (e) { return false; }
  }

  var choice = saved();
  var granted = choice === 'granted' && !signalOptOut();

  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': granted ? 'granted' : 'denied'
  });

  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0],
        j = d.createElement(s),
        dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-P47TD9MS');

  if (choice || signalOptOut()) return;

  function btn(label, primary, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = 'font:600 14px/1 system-ui,-apple-system,Segoe UI,sans-serif;padding:11px 18px;border-radius:8px;cursor:pointer;min-height:44px;' +
      (primary ? 'background:#E8B931;color:#0B0B0D;border:1px solid #E8B931;' : 'background:transparent;color:#FFFFFF;border:1px solid rgba(255,255,255,0.4);');
    b.addEventListener('click', onClick);
    return b;
  }

  function show() {
    if (document.getElementById('nf-consent')) return;
    var bar = document.createElement('div');
    bar.id = 'nf-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Analytics consent');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;' +
      'max-width:640px;margin:0 auto;background:#0B0B0D;color:#FFFFFF;border:1px solid rgba(232,185,49,0.5);border-radius:12px;' +
      'padding:16px;box-shadow:0 8px 32px rgba(0,0,0,0.5);font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;';

    var p = document.createElement('p');
    p.style.cssText = 'margin:0 0 12px;';
    p.appendChild(document.createTextNode('We use analytics cookies to understand how the site is used. Nothing is collected until you accept. '));
    var a = document.createElement('a');
    a.href = '/privacy';
    a.textContent = 'Privacy';
    a.style.cssText = 'color:#E8B931;';
    p.appendChild(a);
    bar.appendChild(p);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;';
    function close() { if (bar.parentNode) bar.parentNode.removeChild(bar); }
    row.appendChild(btn('Accept', true, function () {
      store('granted');
      gtag('consent', 'update', { 'analytics_storage': 'granted' });
      close();
    }));
    row.appendChild(btn('Decline', false, function () { store('denied'); close(); }));
    bar.appendChild(row);
    document.body.appendChild(bar);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
})();
