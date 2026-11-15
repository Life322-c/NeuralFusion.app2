/* NeuralFusion public pages: privacy-conscious funnel analytics (no build step, no dependencies).

   What it records, only for visitors who have NOT sent Do Not Track / Global Privacy Control:
     - marketing_page_viewed : which public page (path only, no query string, no title)
     - cta_clicked           : which [data-track] link was used and where on the page it sat
     - lead_submitted        : via window.nfPublicTrack, called by commercial.js after a successful enquiry
   Each event carries a random per-tab session id (sessionStorage; never a cookie, never an account id), a coarse
   traffic source (utm_source token or referring hostname) on the first page of a session, and nothing else.
   No names, emails, form text, IP addresses or fingerprinting. Rows go to public.public_events, which anonymous
   visitors can insert into but never read (see migration_funnel_analytics.sql).
   The Supabase anon key below is the public client key already shipped in app.js and commercial.js. */
(function () {
  'use strict';
  var URL_ = 'https://ckrxgbosyohcmjtemrvu.supabase.co/rest/v1/public_events';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcnhnYm9zeW9oY21qdGVtcnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzYwNjgsImV4cCI6MjA5NDYxMjA2OH0.imuN5Z-nq_RE7uGckOnqUQgaNtDWT6eq_k2ibkEfq9c';
  var TOKEN = /^[a-z0-9_.\-]{1,40}$/i;
  var ALLOWED = ['marketing_page_viewed', 'cta_clicked', 'lead_submitted'];

  function blocked() {
    try { return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true; } catch (e) { return false; }
  }
  function sid() {
    try {
      var s = sessionStorage.getItem('nf_sid');
      if (!s) {
        s = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
        sessionStorage.setItem('nf_sid', s);
      }
      return s;
    } catch (e) { return null; }
  }
  function source() {
    try {
      var u = new URLSearchParams(location.search).get('utm_source');
      if (u && TOKEN.test(u)) return u.toLowerCase();
      if (document.referrer) {
        var h = new URL(document.referrer).hostname.replace(/^www\./, '');
        if (h && h !== location.hostname.replace(/^www\./, '')) return h.slice(0, 40);
      }
    } catch (e) { /* ignore */ }
    return 'direct';
  }
  function clean(props) {
    var out = {};
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (typeof v === 'string' && TOKEN.test(v)) out[k] = v.toLowerCase();
      else if (typeof v === 'number' || typeof v === 'boolean') out[k] = v;
    });
    return out;
  }
  function send(name, props, withSource) {
    if (ALLOWED.indexOf(name) === -1 || blocked()) return;
    var id = sid(); if (!id) return;
    var row = { session_id: id, event_name: name, page: location.pathname.slice(0, 80), source: withSource ? source() : null, props: clean(props) };
    try {
      fetch(URL_, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Prefer': 'return=minimal' },
        body: JSON.stringify(row),
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* analytics must never break the page */ }
  }
  window.nfPublicTrack = function (name, props) { send(name, props, false); };

  var first = false;
  try { if (!sessionStorage.getItem('nf_pv')) { sessionStorage.setItem('nf_pv', '1'); first = true; } } catch (e) { /* ignore */ }
  send('marketing_page_viewed', {}, first);

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-track]') : null;
    if (!t) return;
    send('cta_clicked', { cta: t.getAttribute('data-track') || '', where: t.getAttribute('data-where') || '' }, false);
  }, true);
})();
