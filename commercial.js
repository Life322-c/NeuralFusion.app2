/* NeuralFusion commercial pages: shared behaviour (CSP-safe external script, no inline JS).
   - Responsive nav with accessible mobile menu and active page state
   - Analytics events pushed to the existing GTM dataLayer (no personal data)
   - Lead forms: rendered from data attributes, validated, and sent to the
     server-side Supabase function public.submit_business_lead (see migration_business_leads.sql)
   The Supabase anon key below is the public client key already shipped in app.js.
   It is not a secret. All write authority lives in the database function and RLS. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var SUPABASE_URL = 'https://ckrxgbosyohcmjtemrvu.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcnhnYm9zeW9oY21qdGVtcnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzYwNjgsImV4cCI6MjA5NDYxMjA2OH0.imuN5Z-nq_RE7uGckOnqUQgaNtDWT6eq_k2ibkEfq9c';
  var RPC_URL = SUPABASE_URL + '/rest/v1/rpc/submit_business_lead';
  var PAGE_LOADED_AT = Date.now();

  /* ---------- analytics (privacy conscious: names and short labels only) ---------- */
  function track(name, props) {
    try {
      var clean = {};
      Object.keys(props || {}).forEach(function (k) {
        var v = props[k];
        if (typeof v === 'number' || typeof v === 'boolean' || (typeof v === 'string' && v.length <= 60)) clean[k] = v;
      });
      (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: 'nf_' + name }, clean));
    } catch (e) { /* analytics must never break the page */ }
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ---------- UTM and referrer capture (session only) ---------- */
  function captureSource() {
    try {
      var p = new URLSearchParams(window.location.search);
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
        var v = p.get(k);
        if (v) sessionStorage.setItem('nf_' + k, v.slice(0, 100));
      });
      if (!sessionStorage.getItem('nf_ref') && document.referrer) {
        var r = new URL(document.referrer);
        if (r.host !== window.location.host) sessionStorage.setItem('nf_ref', (r.host + r.pathname).slice(0, 300));
      }
    } catch (e) { /* storage can be blocked */ }
  }
  function stored(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }

  /* ---------- navigation ---------- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('nf-nav');
    if (toggle && nav) {
      var close = function () { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('open')) { close(); toggle.focus(); }
      });
      nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
      window.addEventListener('resize', function () { if (window.innerWidth > 1180) close(); });
    }
    var current = document.body.getAttribute('data-nav');
    if (current) {
      var links = document.querySelectorAll('.nf-nav a[data-nav-id]');
      for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute('data-nav-id') === current) links[i].setAttribute('aria-current', 'page');
      }
    }
  }

  /* ---------- click tracking via data-track ---------- */
  function initClickTracking() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-track]');
      if (!el) return;
      var name = el.getAttribute('data-track');
      track(name, { page: document.body.getAttribute('data-page') || 'unknown', where: el.getAttribute('data-where') || '' });
    });
  }

  /* ---------- lead forms ---------- */
  var ERRORS = {
    invalid_name: 'Enter your full name (2 to 120 characters).',
    invalid_email: 'Enter a valid email address.',
    invalid_category: 'Something went wrong with this form. Please reload the page and try again.',
    message_required: 'Tell us a little about what you need (at least 10 characters).',
    message_too_long: 'Your message is too long (4000 characters maximum).',
    consent_required: 'Please confirm that we may contact you about this enquiry.',
    organisation_required: 'Enter your organisation or institution.',
    field_too_long: 'One of the fields is too long. Please shorten it and try again.',
    rate_limited: 'You have sent several enquiries in a short time. Please wait an hour or email us directly.',
    busy: 'We are receiving a very high volume of enquiries. Please try again later.',
    server_error: 'We could not send your enquiry. Please try again in a moment.',
    network: 'Network problem. Check your connection and try again.',
    timeout: 'The request took too long. Please try again.'
  };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (attrs[k] === true) n.setAttribute(k, '');
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function field(id, label, control, opts) {
    opts = opts || {};
    var lab = el('label', { 'for': id }, [document.createTextNode(label)]);
    if (opts.required) lab.appendChild(el('span', { 'class': 'req', 'aria-hidden': 'true', text: '*' }));
    var wrap = el('div', { 'class': 'field' + (opts.full ? ' full' : '') }, [lab, control]);
    if (opts.hint) wrap.appendChild(el('div', { 'class': 'hint', id: id + '-hint', text: opts.hint }));
    wrap.appendChild(el('div', { 'class': 'err', id: id + '-err', 'aria-live': 'polite' }));
    return wrap;
  }

  function buildForm(host, idx) {
    var cat = host.getAttribute('data-category');
    var key = 'f' + idx;
    var title = host.getAttribute('data-title') || 'Send an enquiry';
    var sub = host.getAttribute('data-sub') || '';
    var enquiries = (host.getAttribute('data-enquiry-options') || '').split('|').filter(Boolean);
    var showTeam = host.getAttribute('data-team-size') === '1';
    var orgRequired = host.getAttribute('data-org-required') === '1';
    var orgLabel = host.getAttribute('data-org-label') || 'Organisation';
    var posLabel = host.getAttribute('data-position-label') || 'Role or position';
    var msgLabel = host.getAttribute('data-message-label') || 'How can we help?';
    var msgPlaceholder = host.getAttribute('data-message-placeholder') || '';
    var button = host.getAttribute('data-button') || 'Send enquiry';
    var source = host.getAttribute('data-source') || window.location.pathname || '/';
    var partnershipValues = (host.getAttribute('data-partnership-values') || '').split('|').filter(Boolean);

    var form = el('form', { 'class': 'lead-form', novalidate: true, id: key + '-form', 'aria-labelledby': key + '-title' });
    form.appendChild(el('h3', { id: key + '-title', text: title }));
    if (sub) form.appendChild(el('p', { 'class': 'sub', text: sub }));

    var grid = el('div', { 'class': 'field-grid' });
    grid.appendChild(field(key + '-name', 'Full name', el('input', { id: key + '-name', name: 'full_name', type: 'text', autocomplete: 'name', maxlength: '120', required: true }), { required: true }));
    grid.appendChild(field(key + '-email', 'Work or institutional email', el('input', { id: key + '-email', name: 'email', type: 'email', autocomplete: 'email', maxlength: '254', inputmode: 'email', required: true }), { required: true }));
    grid.appendChild(field(key + '-org', orgLabel, el('input', { id: key + '-org', name: 'organisation', type: 'text', autocomplete: 'organization', maxlength: '200' }), { required: orgRequired }));
    grid.appendChild(field(key + '-pos', posLabel, el('input', { id: key + '-pos', name: 'position', type: 'text', autocomplete: 'organization-title', maxlength: '120' })));
    grid.appendChild(field(key + '-country', 'Country', el('input', { id: key + '-country', name: 'country', type: 'text', autocomplete: 'country-name', maxlength: '100' })));

    if (enquiries.length) {
      var sel = el('select', { id: key + '-enq', name: 'enquiry_type' }, [el('option', { value: '', text: 'Select one' })]);
      enquiries.forEach(function (o) { sel.appendChild(el('option', { value: o, text: o })); });
      // Optional preselect from ?enquiry=partnership (matches the first option containing that text)
      try {
        var want = (new URLSearchParams(window.location.search).get('enquiry') || '').toLowerCase().slice(0, 40);
        if (want) {
          for (var oi = 0; oi < enquiries.length; oi++) {
            if (enquiries[oi].toLowerCase().indexOf(want) !== -1) { sel.value = enquiries[oi]; break; }
          }
        }
      } catch (err) { /* ignore */ }
      grid.appendChild(field(key + '-enq', 'Enquiry type', sel));
    }
    if (showTeam) {
      var ts = el('select', { id: key + '-team', name: 'team_size' }, [el('option', { value: '', text: 'Select one' })]);
      ['1 to 10 people', '11 to 50 people', '51 to 250 people', '251 to 1000 people', 'More than 1000 people', 'Not sure yet'].forEach(function (o) { ts.appendChild(el('option', { value: o, text: o })); });
      grid.appendChild(field(key + '-team', 'Approximate group size', ts));
    }
    grid.appendChild(field(key + '-msg', msgLabel, el('textarea', { id: key + '-msg', name: 'message', maxlength: '4000', required: true, placeholder: msgPlaceholder }), { required: true, full: true }));
    form.appendChild(grid);

    // Honeypot: real people never see or fill this.
    var hp = el('div', { 'class': 'hp', 'aria-hidden': 'true' }, [
      el('label', { 'for': key + '-web', text: 'Leave this field empty' }),
      el('input', { id: key + '-web', name: 'website', type: 'text', tabindex: '-1', autocomplete: 'off' })
    ]);
    form.appendChild(hp);

    var consent = el('div', { 'class': 'consent' }, [
      el('input', { id: key + '-consent', name: 'consent', type: 'checkbox', required: true }),
      el('label', { 'for': key + '-consent', text: 'I agree that NeuralFusion may use these details to reply to this enquiry. I understand how my data is handled as described in the privacy policy.' })
    ]);
    var consentWrap = el('div', { 'class': 'field full', style: 'margin-top:16px' }, [consent, el('div', { 'class': 'err', id: key + '-consent-err', 'aria-live': 'polite' })]);
    form.appendChild(consentWrap);

    var submit = el('button', { type: 'submit', 'class': 'btn', text: button });
    form.appendChild(submit);
    var status = el('div', { 'class': 'form-status', id: key + '-status', role: 'status', 'aria-live': 'polite' });
    form.appendChild(status);
    var note = el('p', { 'class': 'privacy-note' });
    note.appendChild(document.createTextNode('We use your details only to respond to this enquiry. See the '));
    note.appendChild(el('a', { href: '/privacy', text: 'privacy policy' }));
    note.appendChild(document.createTextNode('.'));
    form.appendChild(note);

    var startedAt = Date.now();
    var busy = false;

    function setErr(id, msg) {
      var box = document.getElementById(id + '-err');
      var input = document.getElementById(id);
      if (box) box.textContent = msg || '';
      if (input) {
        var f = input.closest('.field');
        if (f) f.classList.toggle('invalid', !!msg);
        if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
        if (msg) input.setAttribute('aria-describedby', id + '-err'); else input.removeAttribute('aria-describedby');
      }
    }

    function validate() {
      var first = null;
      function bad(id, msg) { setErr(id, msg); if (!first) first = document.getElementById(id); }
      var name = document.getElementById(key + '-name').value.trim();
      var email = document.getElementById(key + '-email').value.trim();
      var org = document.getElementById(key + '-org').value.trim();
      var msg = document.getElementById(key + '-msg').value.trim();
      var consentOk = document.getElementById(key + '-consent').checked;
      setErr(key + '-name', ''); setErr(key + '-email', ''); setErr(key + '-org', ''); setErr(key + '-msg', ''); setErr(key + '-consent', '');
      if (name.length < 2) bad(key + '-name', ERRORS.invalid_name);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) bad(key + '-email', ERRORS.invalid_email);
      if (orgRequired && !org) bad(key + '-org', ERRORS.organisation_required);
      if (msg.length < 10) bad(key + '-msg', ERRORS.message_required);
      if (msg.length > 4000) bad(key + '-msg', ERRORS.message_too_long);
      if (!consentOk) { document.getElementById(key + '-consent-err').textContent = ERRORS.consent_required; if (!first) first = document.getElementById(key + '-consent'); }
      return first;
    }

    function fp(email, msg, category) {
      var s = (email.toLowerCase() + '|' + category + '|' + msg), h = 5381;
      for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
      return 'nf_lead_' + h;
    }

    function showSuccess(duplicate) {
      var box = el('div', { 'class': 'form-success', role: 'status', tabindex: '-1' }, [
        el('h3', { text: duplicate ? 'We already have this enquiry' : 'Thank you. Your enquiry has been received.' }),
        el('p', { text: duplicate
          ? 'This enquiry was already sent. There is no need to submit it again. We will reply to the email address you provided.'
          : 'We will review it and reply to the email address you provided. If your matter is time sensitive, you can also use the contact options on the Contact page.' })
      ]);
      host.replaceChild(box, form);
      box.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      status.textContent = ''; status.className = 'form-status';
      var firstBad = validate();
      if (firstBad) { firstBad.focus(); status.textContent = 'Please correct the highlighted fields.'; status.className = 'form-status error'; return; }

      var enqValue = enquiries.length ? document.getElementById(key + '-enq').value : '';
      var effCat = partnershipValues.indexOf(enqValue) !== -1 ? 'partnership' : cat;
      var data = {
        full_name: document.getElementById(key + '-name').value.trim(),
        email: document.getElementById(key + '-email').value.trim().toLowerCase(),
        organisation: document.getElementById(key + '-org').value.trim(),
        position: document.getElementById(key + '-pos').value.trim(),
        country: document.getElementById(key + '-country').value.trim(),
        enquiry_type: enqValue,
        team_size: showTeam ? document.getElementById(key + '-team').value : '',
        message: document.getElementById(key + '-msg').value.trim(),
        lead_category: effCat,
        source_page: source,
        referrer: stored('nf_ref'),
        utm_source: stored('nf_utm_source'),
        utm_medium: stored('nf_utm_medium'),
        utm_campaign: stored('nf_utm_campaign'),
        consent: true,
        website: document.getElementById(key + '-web').value,
        elapsed_ms: Date.now() - Math.min(startedAt, PAGE_LOADED_AT)
      };

      // Client-side duplicate guard for this browser session (the database also de-duplicates).
      var fpKey = fp(data.email, data.message, effCat);
      try { if (sessionStorage.getItem(fpKey)) { showSuccess(true); return; } } catch (err) { /* ignore */ }

      busy = true; submit.disabled = true; submit.textContent = 'Sending...';
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);

      fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON, 'Authorization': 'Bearer ' + SUPABASE_ANON },
        body: JSON.stringify({ payload: data }),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        return res.json().then(function (j) { return { ok: res.ok, body: j }; }, function () { return { ok: false, body: null }; });
      }).then(function (r) {
        clearTimeout(timer);
        if (r.ok && r.body && r.body.ok === true) {
          try { sessionStorage.setItem(fpKey, '1'); } catch (err) { /* ignore */ }
          track('lead_submitted', { category: effCat, page: document.body.getAttribute('data-page') || 'unknown' });
          if ((document.body.getAttribute('data-page') || '') === 'contact') track('contact_conversion', { category: effCat });
          showSuccess(r.body.duplicate === true);
          return;
        }
        var code = r.body && r.body.error ? r.body.error : 'server_error';
        status.textContent = ERRORS[code] || ERRORS.server_error;
        status.className = 'form-status error';
        busy = false; submit.disabled = false; submit.textContent = button;
      }).catch(function (err) {
        clearTimeout(timer);
        status.textContent = (err && err.name === 'AbortError') ? ERRORS.timeout : ERRORS.network;
        status.className = 'form-status error';
        busy = false; submit.disabled = false; submit.textContent = button;
      });
    });

    host.textContent = '';
    host.appendChild(form);
  }

  function initForms() {
    var hosts = document.querySelectorAll('[data-lead-form]');
    for (var i = 0; i < hosts.length; i++) buildForm(hosts[i], i);
  }

  onReady(function () {
    captureSource();
    initNav();
    initClickTracking();
    initForms();
    var page = document.body.getAttribute('data-page');
    if (page) track('commercial_page_view', { page: page });
  });
})();
