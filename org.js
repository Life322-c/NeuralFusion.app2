// NeuralFusion self-serve team assessments (B2B). Loaded BEFORE app.js; it only touches the globals
// app.js defines (React, sb, SUPABASE_URL, C, mono, syne, inter) at call time, inside functions.
// All authority lives in Supabase RPCs/RLS and the team-checkout / paystack-webhook Edge Functions.
(function () {
  const h = React.createElement;
  const { useState, useEffect } = React;

  // ---------- analytics (existing GTM dataLayer, no new framework) ----------
  const track = (name, props) => { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: 'nf_' + name }, props || {})); } catch (_) {} };
  const naira = (k) => '\u20A6' + Math.round(k / 100).toLocaleString();
  const rpc = async (name, args) => {
    const { data, error } = await sb.rpc(name, args || {});
    if (error) { console.error('[NF_ORG ' + name + ']', error); return { ok: false, error: 'request_failed' }; }
    return data;
  };
  const callCheckout = async (session, body) => {
    try {
      const res = await fetch(SUPABASE_URL + '/functions/v1/team-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify(body),
      });
      return await res.json();
    } catch (e) { return { success: false, error: 'network' }; }
  };
  const ERR = {
    not_signed_in: 'Please sign in first.', not_authorised: 'You do not have permission to do that.',
    plan_unavailable: 'That package is not available right now.', invalid_org_name: 'Enter an organisation name (2 to 120 characters).',
    seat_price_not_set: 'Extra seats are not enabled yet. Contact enterprise.', invalid_quantity: 'Enter a valid number of seats.',
    organisation_inactive: 'This organisation is not active.', invalid_invitation: 'This invitation link is not valid.',
    invitation_not_active: 'This invitation has already been used or was withdrawn.', invitation_expired: 'This invitation has expired. Ask your organisation for a new one.',
    email_mismatch: 'This invitation was sent to a different email address. Sign in with the invited email.',
    amount_mismatch: 'The amount paid did not match the order. Contact support with your reference.',
    network: 'Network error. Please try again.', server_error: 'Something went wrong. Please try again.', request_failed: 'Something went wrong. Please try again.',
  };
  const errText = (r) => ERR[r && r.error] || 'Something went wrong. Please try again.';

  // ---------- URL entry points (payment return, invitation links) ----------
  function initialView() {
    try {
      const p = new URLSearchParams(window.location.search);
      const ref = p.get('team_ref'), inv = p.get('invite');
      if (ref) sessionStorage.setItem('nf_team_ref', ref);
      if (inv) localStorage.setItem('nf_invite_token', inv);
      if (ref || inv) window.history.replaceState({}, '', window.location.pathname);
      if (inv || localStorage.getItem('nf_invite_token')) return 'invite';
      if (ref) return 'org';
    } catch (_) {}
    return null;
  }
  const loadMyOrgs = async () => { const r = await rpc('my_organisations'); return Array.isArray(r) ? r : []; };

  // CFI hook: app.js calls this after a completed CFI-1.0 save. Links (does not copy) the result
  // to the organisation the participant explicitly started from. Membership is re-checked in SQL.
  async function afterCfiSaved(resultId) {
    let ctx = null;
    try { ctx = JSON.parse(sessionStorage.getItem('nf_org_assess') || 'null'); } catch (_) {}
    if (!ctx || !resultId || Date.now() - ctx.t > 2 * 3600 * 1000) return;
    const r = await rpc('link_cfi_result_to_org', { p_result_id: resultId, p_org: ctx.org });
    if (r && r.ok) { sessionStorage.removeItem('nf_org_assess'); track('cfi_completed', { organisation_id: ctx.org }); }
  }

  // ---------- small UI kit (matches the existing NeuralFusion look) ----------
  const card = (extra) => Object.assign({ background: C.surface, border: '1px solid ' + C.border, borderRadius: 4, padding: 28 }, extra || {});
  const label = { ...mono, fontSize: 10, letterSpacing: 1.5, color: C.muted, marginBottom: 8, textTransform: 'uppercase' };
  const inputStyle = { width: '100%', background: C.deep, border: '1px solid ' + C.borderBright, color: C.text, padding: '12px 14px', borderRadius: 2, fontSize: 14, boxSizing: 'border-box' };
  function Btn({ children, onClick, variant, disabled, style }) {
    const ghost = variant === 'ghost';
    return h('button', { onClick, disabled, style: Object.assign({ ...syne, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', padding: '14px 28px', borderRadius: 2, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
      background: ghost ? 'transparent' : C.cyan, color: ghost ? C.cyan : C.void, border: '1px solid ' + C.cyan }, style || {}) }, children);
  }
  const Stat = (l, v, sub) => h('div', { key: l, style: card({ padding: 20 }) }, h('div', { style: label }, l), h('div', { style: { ...syne, fontSize: 26, fontWeight: 800, color: C.cyanBright } }, v), sub ? h('div', { style: { fontSize: 12, color: C.muted, marginTop: 4 } }, sub) : null);
  const Msg = ({ m }) => m ? h('div', { style: { padding: '12px 16px', marginBottom: 16, borderRadius: 2, fontSize: 13, background: m.type === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(76,247,192,0.08)', border: '1px solid ' + (m.type === 'error' ? 'rgba(248,113,113,0.3)' : 'rgba(76,247,192,0.3)'), color: m.type === 'error' ? '#F87171' : '#4CF7C0' } }, m.text) : null;
  const Shell = (children) => h('div', { style: { background: C.void, minHeight: '100vh', paddingTop: 90, paddingBottom: 100, color: C.text } }, h('div', { style: { maxWidth: 1000, margin: '0 auto', padding: '0 24px' } }, children));

  // ====================================================================
  // ENTERPRISE LANDING + SELF-SERVE CHECKOUT
  // ====================================================================
  function EnterpriseLanding({ user, session, setShowAuth }) {
    const [plans, setPlans] = useState(null);
    const [sel, setSel] = useState(null);
    const [orgName, setOrgName] = useState('');
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const [pendingPay, setPendingPay] = useState(false);

    useEffect(() => {
      track('enterprise_page_viewed');
      sb.from('team_plans').select('*').eq('is_active', true).order('sort_order').then(({ data }) => setPlans(data || []));
    }, []);
    useEffect(() => { if (pendingPay && user && session) { setPendingPay(false); startCheckout(); } }, [pendingPay, user, session]);

    const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };
    const startCheckout = async () => {
      if (!sel) { setMsg({ type: 'error', text: 'Choose a package first.' }); return; }
      if (orgName.trim().length < 2) { setMsg({ type: 'error', text: ERR.invalid_org_name }); return; }
      if (!user || !session) { setPendingPay(true); setShowAuth(true); return; }
      setBusy(true); setMsg(null); track('checkout_started', { package: sel.code });
      const r = await callCheckout(session, { action: 'init', type: 'new_team', package_code: sel.code, org_name: orgName.trim() });
      if (!r.success) { setBusy(false); setMsg({ type: 'error', text: errText(r) }); return; }
      window.location.href = r.authorization_url; // Paystack hosted checkout; verified server-side on return
    };

    const sec = (title, items) => h('div', { style: { marginBottom: 56 } },
      h('div', { style: { ...mono, fontSize: 11, letterSpacing: 2, color: C.cyan, marginBottom: 20 } }, title),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 } },
        items.map(([t, d]) => h('div', { key: t, style: card() }, h('div', { style: { ...syne, fontSize: 16, fontWeight: 800, marginBottom: 8 } }, t), h('div', { style: { fontSize: 13, color: C.muted, lineHeight: 1.7 } }, d)))));

    return Shell([
      h('div', { key: 'hero', style: { textAlign: 'center', padding: '40px 0 64px' } },
        h('div', { style: { ...mono, fontSize: 11, letterSpacing: 2, color: C.cyan, marginBottom: 20 } }, 'NEURALFUSION\u2122 FOR ORGANIZATIONS'),
        h('h1', { style: { ...syne, fontSize: 'clamp(30px,5vw,52px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 20px' } }, 'Understand how your team thinks under pressure.'),
        h('p', { style: { fontSize: 16, color: C.muted, maxWidth: 640, margin: '0 auto 32px', lineHeight: 1.8 } }, 'Measure cognitive fragmentation. Understand team thinking patterns. Strengthen integrated thinking. Improve decision-making.'),
        h('div', { style: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' } },
          h(Btn, { onClick: () => { track('start_team_assessment_clicked'); scrollTo('nf-packages'); } }, 'START A TEAM ASSESSMENT'),
          h(Btn, { variant: 'ghost', onClick: () => scrollTo('nf-explore') }, 'EXPLORE ENTERPRISE'))),
      h('div', { key: 'explore', id: 'nf-explore' }, sec('WHAT YOUR TEAM GETS', [
        ['CFI\u2122 assessment', 'A 13-item Cognitive Fragmentation Index each team member completes in about four minutes.'],
        ['Cognitive fragmentation', 'How scattered or integrated thinking becomes under load, scored on the CFI 13 to 65 scale.'],
        ['Four Thinking Modes', 'Analytical, Intuitive, Associative and Reflective patterns, shown at team level.'],
        ['Team-level insight', 'Aggregate results for your team. Individual profiles stay private to each person.'],
        ['Decision-making', 'Practice with the Integration Protocol and Decision Vault for real decisions.'],
        ['Structured cognitive training', 'The NeuralFusion Academy builds integrated thinking step by step.'],
        ['Cohort analytics', 'Completion tracking and aggregate trends across cohorts.'],
        ['Enterprise development', 'Facilitated programmes and custom rollout for larger organizations.'],
      ])),
      h('div', { key: 'pk', id: 'nf-packages', style: { marginBottom: 40 } },
        h('div', { style: { ...mono, fontSize: 11, letterSpacing: 2, color: C.cyan, marginBottom: 20 } }, 'CHOOSE A TEAM ASSESSMENT'),
        plans === null ? h('div', { style: { color: C.muted } }, 'Loading packages...') :
        plans.length === 0 ? h('div', { style: card() }, h('div', { style: { color: C.muted, lineHeight: 1.7 } }, 'Team packages are not open for online purchase yet. Use Contact Enterprise below to be notified.')) :
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 } },
          plans.map((p) => h('div', { key: p.code, onClick: () => { setSel(p); track('package_selected', { package: p.code }); },
            style: card({ cursor: 'pointer', borderColor: sel && sel.code === p.code ? C.cyan : C.border, boxShadow: sel && sel.code === p.code ? '0 0 30px rgba(196,160,80,0.2)' : 'none' }) },
            h('div', { style: { ...mono, fontSize: 11, letterSpacing: 1.5, color: C.cyan } }, p.name.toUpperCase()),
            h('div', { style: { ...syne, fontSize: 30, fontWeight: 900, margin: '10px 0 4px' } }, naira(p.price_kobo)),
            h('div', { style: { fontSize: 13, color: C.muted } }, p.seats + ' participant seats'))))),
      sel ? h('div', { key: 'co', style: card({ maxWidth: 520, margin: '0 auto 48px', borderColor: C.borderBright }) },
        h('div', { style: label }, 'Organisation or team name'),
        h('input', { value: orgName, onChange: (e) => setOrgName(e.target.value), placeholder: 'e.g. Acme Leadership Team', style: Object.assign({}, inputStyle, { marginBottom: 16 }), maxLength: 120 }),
        h(Msg, { m: msg }),
        h(Btn, { onClick: startCheckout, disabled: busy, style: { width: '100%' } }, busy ? 'REDIRECTING TO PAYSTACK...' : (user ? 'PAY ' + naira(sel.price_kobo) + ' FOR ' + sel.name.toUpperCase() : 'CREATE ACCOUNT OR SIGN IN TO PAY')),
        h('div', { style: { fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 1.6 } }, 'You become the organisation owner. Payment is confirmed server-side before your workspace is created.')) : null,
      h('div', { key: 'ent', style: Object.assign(card({ textAlign: 'center' })) },
        h('div', { style: { ...syne, fontSize: 18, fontWeight: 800, marginBottom: 8 } }, 'Larger organization?'),
        h('div', { style: { fontSize: 13, color: C.muted, marginBottom: 16 } }, 'Custom seat counts, facilitated cohorts and enterprise development programmes.'),
        h('a', { href: '/contact', style: { ...syne, color: C.cyan, fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' } }, 'CONTACT ENTERPRISE \u2192')),
    ]);
  }

  // ====================================================================
  // ORG PORTAL (owner/admin dashboard, participant panel, payment return)
  // ====================================================================
  function OrgPortal({ user, session, setView, setShowAuth, onOrgsChanged }) {
    const [orgs, setOrgs] = useState(null);
    const [active, setActive] = useState(() => sessionStorage.getItem('nf_active_org'));
    const [notice, setNotice] = useState(null);

    const reload = async () => { const l = await loadMyOrgs(); setOrgs(l); if (onOrgsChanged) onOrgsChanged(l); return l; };

    useEffect(() => {
      if (!user || !session) return;
      (async () => {
        const ref = sessionStorage.getItem('nf_team_ref');
        if (ref) {
          setNotice({ type: 'ok', text: 'Confirming your payment...' });
          const r = await callCheckout(session, { action: 'verify', reference: ref });
          sessionStorage.removeItem('nf_team_ref');
          if (r.success) {
            track('payment_successful'); if (r.organisation_id) { sessionStorage.setItem('nf_active_org', r.organisation_id); setActive(r.organisation_id); track('organisation_created'); }
            setNotice({ type: 'ok', text: 'Payment confirmed. Your workspace is ready.' });
          } else setNotice({ type: 'error', text: errText(r) + ' Reference: ' + ref + '. If you were charged, the workspace will appear shortly once Paystack confirms; contact support if it does not.' });
        }
        await reload();
      })();
    }, [user && user.id, session && session.access_token]);

    if (!user) return Shell(h('div', { style: card({ textAlign: 'center' }) }, h('div', { style: { marginBottom: 16 } }, 'Sign in to open your team dashboard.'), h(Btn, { onClick: () => setShowAuth(true) }, 'SIGN IN')));
    if (orgs === null) return Shell(h('div', { style: { color: C.muted } }, notice ? notice.text : 'Loading...'));
    if (orgs.length === 0) return Shell([h(Msg, { key: 'm', m: notice }), h('div', { key: 'c', style: card({ textAlign: 'center' }) }, h('div', { style: { ...syne, fontSize: 18, fontWeight: 800, marginBottom: 12 } }, 'No team workspace yet'), h(Btn, { onClick: () => setView('enterprise') }, 'START A TEAM ASSESSMENT'))]);
    const org = orgs.find((o) => o.id === active) || orgs[0];
    const pick = (id) => { sessionStorage.setItem('nf_active_org', id); setActive(id); };
    const header = h('div', { key: 'hd', style: { marginBottom: 28 } },
      h('div', { style: { ...mono, fontSize: 11, letterSpacing: 2, color: C.cyan, marginBottom: 8 } }, 'ORGANISATION OVERVIEW'),
      h('div', { style: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' } },
        h('h1', { style: { ...syne, fontSize: 28, fontWeight: 900, margin: 0 } }, org.name),
        orgs.length > 1 ? h('select', { value: org.id, onChange: (e) => pick(e.target.value), style: Object.assign({}, inputStyle, { width: 'auto' }) }, orgs.map((o) => h('option', { key: o.id, value: o.id }, o.name))) : null));
    const body = (org.role === 'owner' || org.role === 'admin') ? h(Dashboard, { key: org.id, org, user, session, reload }) : h(ParticipantPanel, { key: org.id, org, setView });
    return Shell([h(Msg, { key: 'n', m: notice }), header, body]);
  }

  function Dashboard({ org, user, session, reload }) {
    const [tab, setTab] = useState('overview');
    const [ov, setOv] = useState(null);
    const refresh = async () => setOv(await rpc('org_overview', { p_org: org.id }));
    useEffect(() => { refresh(); }, [org.id]);
    const tabs = [['overview', 'Overview'], ['invite', 'Invite'], ['results', 'Team Results'], ['team', 'Team and Cohorts'], ['billing', 'Billing and Seats']];
    if (!ov) return h('div', { style: { color: C.muted } }, 'Loading...');
    if (!ov.ok) return h(Msg, { m: { type: 'error', text: errText(ov) } });
    return h('div', null,
      h('div', { style: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' } }, tabs.map(([k, l]) => h('button', { key: k, onClick: () => setTab(k), style: { ...mono, fontSize: 11, letterSpacing: 1, padding: '10px 16px', cursor: 'pointer', borderRadius: 2, background: tab === k ? C.cyan : 'transparent', color: tab === k ? C.void : C.muted, border: '1px solid ' + (tab === k ? C.cyan : C.border) } }, l.toUpperCase()))),
      tab === 'overview' ? h(OverviewTab, { ov, go: setTab }) : null,
      tab === 'invite' ? h(InviteTab, { org, ov, refresh, go: setTab, role: ov.role }) : null,
      tab === 'results' ? h(ResultsTab, { org }) : null,
      tab === 'team' ? h(TeamTab, { org, role: ov.role, refresh }) : null,
      tab === 'billing' ? h(BillingTab, { org, ov, session }) : null);
  }

  function OverviewTab({ ov, go }) {
    const s = ov.seats;
    return h('div', null,
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 } },
        Stat('Team Assessment', ov.plan.name || 'Custom'), Stat('Seats', s.used + ' / ' + s.limit + ' used', s.remaining + ' remaining'),
        Stat('Invited', ov.invited_total), Stat('Completed', ov.completed), Stat('Awaiting assessment', ov.awaiting_assessment), Stat('Completion rate', ov.completion_rate + '%')),
      h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Team progress'),
        h('div', { style: { height: 10, background: C.deep, borderRadius: 5, overflow: 'hidden' } }, h('div', { style: { width: ov.completion_rate + '%', height: '100%', background: C.cyan } })),
        h('div', { style: { fontSize: 13, color: C.muted, marginTop: 12 } }, ov.completed >= ov.report_threshold ? 'Aggregate team results are available.' : 'Aggregate team results unlock when ' + ov.report_threshold + ' people have completed the CFI. ' + ov.completed + ' so far.')),
      h('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap' } }, h(Btn, { onClick: () => go('invite') }, 'INVITE TEAM MEMBERS'), h(Btn, { variant: 'ghost', onClick: () => go('results') }, 'TEAM RESULTS')));
  }

  function InviteTab({ org, ov, refresh, go, role }) {
    const [text, setText] = useState('');
    const [kind, setKind] = useState('participant');
    const [msg, setMsg] = useState(null);
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(false);
    const load = async () => setData(await rpc('list_org_members', { p_org: org.id }));
    useEffect(() => { load(); }, [org.id]);
    const linkFor = (t) => window.location.origin + '/?invite=' + t;
    const full = ov.seats.remaining <= 0;
    const send = async () => {
      const emails = text.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean);
      if (!emails.length) { setMsg({ type: 'error', text: 'Enter at least one email address.' }); return; }
      setBusy(true); const r = await rpc('create_org_invitations', { p_org: org.id, p_emails: emails, p_role: kind }); setBusy(false);
      if (!r.ok) { setMsg({ type: 'error', text: errText(r) }); return; }
      r.created.forEach(() => track('invitation_sent', { organisation_id: org.id }));
      const skipped = r.skipped || [], seatSkipped = skipped.filter((x) => x.reason === 'seat_limit');
      let t = r.created.length + ' invitation(s) created.';
      if (seatSkipped.length) t += " You've reached your " + r.seat_limit + '-seat limit, so ' + seatSkipped.length + ' were not sent.';
      const other = skipped.filter((x) => x.reason !== 'seat_limit'); if (other.length) t += ' Skipped: ' + other.map((x) => x.email + ' (' + x.reason.replace('_', ' ') + ')').join(', ') + '.';
      setMsg({ type: seatSkipped.length ? 'error' : 'ok', text: t }); setText(''); load(); refresh();
    };
    const revoke = async (id) => { await rpc('revoke_org_invitation', { p_id: id }); load(); refresh(); };
    const copy = (t) => { try { navigator.clipboard.writeText(linkFor(t)); setMsg({ type: 'ok', text: 'Invitation link copied.' }); } catch (_) { window.prompt('Copy this link', linkFor(t)); } };
    return h('div', null,
      h('div', { style: card({ marginBottom: 20 }) },
        h('div', { style: label }, 'Invite by email (one or many, separated by commas, spaces or new lines)'),
        full ? h('div', { style: { marginBottom: 14, color: '#F87171', fontSize: 14 } }, "You've reached your " + ov.seats.limit + '-seat limit.') : null,
        h('textarea', { value: text, onChange: (e) => setText(e.target.value), rows: 4, placeholder: 'name@company.com', style: Object.assign({}, inputStyle, { marginBottom: 12 }) }),
        role === 'owner' ? h('select', { value: kind, onChange: (e) => setKind(e.target.value), style: Object.assign({}, inputStyle, { marginBottom: 12 }) }, [['participant', 'Participant'], ['facilitator', 'Facilitator'], ['admin', 'Organisation admin']].map(([v, l]) => h('option', { key: v, value: v }, l))) : null,
        h(Msg, { m: msg }),
        h('div', { style: { display: 'flex', gap: 12, flexWrap: 'wrap' } }, h(Btn, { onClick: send, disabled: busy || full }, busy ? 'SENDING...' : 'SEND INVITATIONS'), full ? h(Btn, { variant: 'ghost', onClick: () => go('billing') }, 'ADD MORE SEATS') : null),
        h('div', { style: { fontSize: 12, color: C.muted, marginTop: 12 } }, ov.seats.remaining + ' of ' + ov.seats.limit + ' seats remaining. Invitees receive an email when email delivery is configured; you can always copy the link below.')),
      h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Pending invitations'),
        !data ? 'Loading...' : (data.invitations || []).length === 0 ? h('div', { style: { color: C.muted, fontSize: 13 } }, 'None pending.') :
        data.invitations.map((i) => h('div', { key: i.id, style: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '10px 0', borderBottom: '1px solid ' + C.border, flexWrap: 'wrap', alignItems: 'center' } },
          h('div', { style: { fontSize: 14 } }, i.email, h('span', { style: { ...mono, fontSize: 10, color: C.muted, marginLeft: 8 } }, i.role)),
          h('div', { style: { display: 'flex', gap: 8 } }, h('button', { onClick: () => copy(i.token), style: { ...mono, fontSize: 10, background: 'none', border: '1px solid ' + C.border, color: C.cyan, padding: '6px 10px', cursor: 'pointer' } }, 'COPY LINK'), h('button', { onClick: () => revoke(i.id), style: { ...mono, fontSize: 10, background: 'none', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', padding: '6px 10px', cursor: 'pointer' } }, 'REVOKE'))))),
      h('div', { style: card() }, h('div', { style: label }, 'Assessment status'),
        !data ? 'Loading...' : (data.members || []).map((m) => h('div', { key: m.user_id, style: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid ' + C.border, fontSize: 14 } },
          h('div', null, m.email, h('span', { style: { ...mono, fontSize: 10, color: C.muted, marginLeft: 8 } }, m.role)),
          h('div', { style: { ...mono, fontSize: 11, color: m.completed ? '#4CF7C0' : C.muted } }, m.completed ? 'COMPLETED' : 'NOT YET COMPLETED'))),
        h('div', { style: { fontSize: 12, color: C.muted, marginTop: 12 } }, 'You see completion status only. Individual scores are never shown to organisation owners.')));
  }

  const DIM_LABELS = { analytical: 'Analytical', intuitive: 'Intuitive', associative: 'Associative', reflective: 'Reflective', integration: 'Pressure and overload (single item)' };
  function ResultsTab({ org }) {
    const [r, setR] = useState(null);
    useEffect(() => { rpc('org_team_results', { p_org: org.id }).then((x) => { setR(x); if (x && x.unlocked) track('team_report_unlocked', { organisation_id: org.id }); }); }, [org.id]);
    if (!r) return h('div', { style: { color: C.muted } }, 'Loading...');
    if (!r.ok) return h(Msg, { m: { type: 'error', text: errText(r) } });
    if (!r.unlocked) return h('div', { style: card() }, h('div', { style: { ...syne, fontSize: 18, fontWeight: 800, marginBottom: 10 } }, 'Team results are not available yet'),
      h('div', { style: { color: C.muted, lineHeight: 1.7, fontSize: 14 } }, 'To protect individual privacy, aggregate insight appears once ' + r.threshold + ' people have completed the CFI. ' + r.completed + ' of ' + r.members + ' members have completed it so far.'));
    const dims = r.avg_dimensions || {};
    return h('div', null,
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 20 } },
        Stat('Team average CFI', r.avg_total, 'Scale 13 to 65. Higher means more fragmentation.'), Stat('Completed', r.completed + ' of ' + r.members), Stat('Instrument', r.assessment_version)),
      h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Average fragmentation by thinking mode'),
        Object.keys(DIM_LABELS).map((k) => h('div', { key: k, style: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid ' + C.border, fontSize: 14 } }, h('span', null, DIM_LABELS[k]), h('span', { style: { ...mono, color: C.cyanBright } }, dims[k] == null ? 'n/a' : dims[k]))),
        h('div', { style: { fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 1.6 } }, 'Values are average stored dimension scores from CFI-1.0. Higher means more fragmentation in that area. These describe thinking patterns reported on the CFI, not personality, health or clinical status.')),
      h('div', { style: card() }, h('div', { style: label }, 'Band distribution'),
        Object.keys(r.bands || {}).length === 0 ? 'No data' : Object.keys(r.bands).map((b) => h('div', { key: b, style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 } }, h('span', null, b), h('span', { style: mono }, String(r.bands[b])))),
        h('div', { style: { fontSize: 12, color: C.muted, marginTop: 8 } }, 'Counts below 2 are hidden to protect individuals.')));
  }

  function TeamTab({ org, role, refresh }) {
    const [data, setData] = useState(null); const [cohorts, setCohorts] = useState([]); const [name, setName] = useState(''); const [msg, setMsg] = useState(null);
    const load = async () => { setData(await rpc('list_org_members', { p_org: org.id })); const c = await rpc('org_cohorts', { p_org: org.id }); setCohorts(Array.isArray(c) ? c : []); };
    useEffect(() => { load(); }, [org.id]);
    const act = async (fn, args) => { const r = await rpc(fn, args); setMsg(r.ok ? { type: 'ok', text: 'Updated.' } : { type: 'error', text: errText(r) }); load(); refresh(); };
    return h('div', null, h(Msg, { m: msg }),
      h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Members and roles'),
        !data || !data.members ? 'Loading...' : data.members.map((m) => h('div', { key: m.user_id, style: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '10px 0', borderBottom: '1px solid ' + C.border, flexWrap: 'wrap', alignItems: 'center', fontSize: 14 } },
          h('div', null, m.email), h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
            m.role === 'owner' ? h('span', { style: { ...mono, fontSize: 11, color: C.cyan } }, 'OWNER') :
            [role === 'owner' ? h('select', { key: 's', value: m.role, onChange: (e) => act('set_member_role', { p_org: org.id, p_user: m.user_id, p_role: e.target.value }), style: Object.assign({}, inputStyle, { width: 'auto', padding: '6px 10px' }) }, ['participant', 'facilitator', 'admin'].map((x) => h('option', { key: x, value: x }, x))) : h('span', { key: 'r', style: { ...mono, fontSize: 11, color: C.muted } }, m.role.toUpperCase()),
             (role === 'owner' || m.role === 'participant' || m.role === 'facilitator') ? h('button', { key: 'x', onClick: () => { if (window.confirm('Remove this member? Their seat is freed.')) act('remove_org_member', { p_org: org.id, p_user: m.user_id }); }, style: { ...mono, fontSize: 10, background: 'none', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171', padding: '6px 10px', cursor: 'pointer' } }, 'REMOVE') : null])))),
      h('div', { style: card() }, h('div', { style: label }, 'Cohorts'),
        cohorts.map((c) => h('div', { key: c.id, style: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid ' + C.border, fontSize: 14 } }, h('span', null, c.name), h('span', { style: { ...mono, fontSize: 11, color: C.muted } }, c.members + ' members'))),
        h('div', { style: { display: 'flex', gap: 8, marginTop: 14 } }, h('input', { value: name, onChange: (e) => setName(e.target.value), placeholder: 'New cohort name', style: inputStyle }), h(Btn, { onClick: async () => { await act('create_org_cohort', { p_org: org.id, p_name: name }); setName(''); } }, 'CREATE'))));
  }

  function BillingTab({ org, ov, session }) {
    const [qty, setQty] = useState(5); const [price, setPrice] = useState(0); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
    useEffect(() => { getPlatformSetting('team_extra_seat_price_kobo').then((v) => setPrice(parseInt(v) || 0)); }, []);
    const buy = async () => {
      setBusy(true); track('add_seats_started', { organisation_id: org.id });
      const r = await callCheckout(session, { action: 'init', type: 'add_seats', organisation_id: org.id, quantity: parseInt(qty) });
      if (!r.success) { setBusy(false); setMsg({ type: 'error', text: errText(r) }); return; }
      window.location.href = r.authorization_url;
    };
    const row = (l, v) => h('div', { key: l, style: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid ' + C.border, fontSize: 14 } }, h('span', { style: { color: C.muted } }, l), h('span', null, v));
    return h('div', null,
      h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Plan and payment'),
        row('Current plan', ov.plan.name || 'Custom'), row('Purchased seats', ov.seats.limit), row('Used seats', ov.seats.used), row('Remaining seats', ov.seats.remaining),
        row('Payment status', ov.organisation.payment_status || 'n/a'), row('Transaction reference', ov.organisation.payment_reference || 'n/a'),
        row('Purchase date', ov.purchase_date ? new Date(ov.purchase_date).toLocaleDateString() : 'n/a')),
      h('div', { style: card() }, h('div', { style: label }, 'Add seats'),
        price > 0 ? h('div', null, h('div', { style: { fontSize: 13, color: C.muted, marginBottom: 12 } }, naira(price) + ' per additional seat.'),
          h('div', { style: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' } }, h('input', { type: 'number', min: 1, max: 500, value: qty, onChange: (e) => setQty(e.target.value), style: Object.assign({}, inputStyle, { width: 120 }) }), h(Btn, { onClick: buy, disabled: busy }, busy ? 'REDIRECTING...' : 'PAY ' + naira(price * (parseInt(qty) || 0)))), h(Msg, { m: msg }))
          : h('div', { style: { fontSize: 14, color: C.muted, lineHeight: 1.7 } }, 'Online seat top-ups are not enabled yet. ', h('a', { href: '/contact', style: { color: C.cyan } }, 'Contact Enterprise'), ' to add seats or move to a custom plan.')));
  }

  function ParticipantPanel({ org, setView }) {
    const [ov, setOv] = useState(null);
    useEffect(() => { rpc('org_overview', { p_org: org.id }).then(setOv); }, [org.id]);
    const start = () => { sessionStorage.setItem('nf_org_assess', JSON.stringify({ org: org.id, t: Date.now() })); track('cfi_started', { organisation_id: org.id }); setView('cfi'); };
    if (!ov) return h('div', { style: { color: C.muted } }, 'Loading...');
    return h('div', { style: card({ maxWidth: 640 }) },
      h('div', { style: { fontSize: 15, lineHeight: 1.8, marginBottom: 20 } }, "You've been invited to complete the NeuralFusion\u2122 CFI\u2122 as part of your organization's team assessment."),
      ov.my_assessment_completed ? h('div', { style: { color: '#4CF7C0' } }, 'You have completed the assessment. Thank you. Your own result is on your Analytics page.') :
      h('div', null, h(Btn, { onClick: start }, 'START ASSESSMENT'), h('div', { style: { fontSize: 12, color: C.muted, marginTop: 14, lineHeight: 1.7 } }, org.name + ' will see aggregate team results and whether you have completed the assessment. Your individual answers and score are not shown to your organisation.')));
  }

  // ====================================================================
  // INVITATION PAGE
  // ====================================================================
  function InvitePage({ user, session, setShowAuth, setView, onOrgsChanged }) {
    const token = localStorage.getItem('nf_invite_token');
    const [pv, setPv] = useState(null); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
    useEffect(() => { if (token) rpc('get_invitation_preview', { p_token: token }).then((x) => { if (!x.ok || x.expired || x.status !== 'pending') localStorage.removeItem('nf_invite_token'); setPv(x); }); else setPv({ ok: false, error: 'invalid_invitation' }); }, [token]);
    const accept = async () => {
      setBusy(true); const r = await rpc('accept_org_invitation', { p_token: token }); setBusy(false);
      if (!r.ok) { setMsg({ type: 'error', text: errText(r) }); return; }
      track('invitation_accepted', { organisation_id: r.organisation_id });
      localStorage.removeItem('nf_invite_token'); sessionStorage.setItem('nf_active_org', r.organisation_id);
      if (onOrgsChanged) loadMyOrgs().then(onOrgsChanged);
      setView('org');
    };
    if (!pv) return Shell(h('div', { style: { color: C.muted } }, 'Loading invitation...'));
    if (!pv.ok) return Shell(h('div', { style: card() }, h(Msg, { m: { type: 'error', text: errText(pv) } }), h(Btn, { variant: 'ghost', onClick: () => setView('home') }, 'GO HOME')));
    const dead = pv.expired || pv.status !== 'pending';
    return Shell(h('div', { style: card({ maxWidth: 600, margin: '0 auto' }) },
      h('div', { style: { ...mono, fontSize: 11, letterSpacing: 2, color: C.cyan, marginBottom: 12 } }, 'TEAM INVITATION'),
      h('div', { style: { ...syne, fontSize: 22, fontWeight: 800, marginBottom: 12 } }, pv.org_name),
      h('div', { style: { fontSize: 15, lineHeight: 1.8, marginBottom: 16 } }, "You've been invited to complete the NeuralFusion\u2122 CFI\u2122 as part of your organization's team assessment."),
      h('div', { style: { fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.7 } }, 'Invitation sent to ' + pv.email_hint + '. Your organisation sees aggregate team results and whether you completed the assessment. It does not see your individual answers or score.'),
      dead ? h(Msg, { m: { type: 'error', text: pv.expired ? ERR.invitation_expired : ERR.invitation_not_active } }) : null,
      h(Msg, { m: msg }),
      !dead ? (user ? h(Btn, { onClick: accept, disabled: busy }, busy ? 'JOINING...' : 'ACCEPT AND CONTINUE') : h(Btn, { onClick: () => setShowAuth(true) }, 'CREATE ACCOUNT OR SIGN IN TO ACCEPT')) : null));
  }

  // ====================================================================
  // ADMIN > TEAMS (platform admin only; enforced by RLS and RPC checks)
  // ====================================================================
  function AdminTeamsPanel() {
    const [plans, setPlans] = useState([]); const [orgs, setOrgs] = useState([]); const [msg, setMsg] = useState(null);
    const [seatPrice, setSeatPrice] = useState(''); const [thr, setThr] = useState('');
    const load = async () => {
      const { data } = await sb.from('team_plans').select('*').order('sort_order'); setPlans(data || []);
      const r = await rpc('admin_list_organisations'); setOrgs(r.ok ? r.organisations : []);
      const sp = await getPlatformSetting('team_extra_seat_price_kobo'); setSeatPrice(String(Math.round((parseInt(sp) || 0) / 100)));
      const t = await getPlatformSetting('org_min_report_threshold'); setThr(String(parseInt(t) || 5));
    };
    useEffect(() => { load(); }, []);
    const savePlan = async (p) => {
      const { error } = await sb.from('team_plans').update({ name: p.name, seats: p.seats, price_kobo: p.price_kobo, is_active: p.is_active, updated_at: new Date().toISOString() }).eq('id', p.id);
      setMsg(error ? { type: 'error', text: error.message } : { type: 'ok', text: 'Saved ' + p.name }); load();
    };
    const edit = (id, k, v) => setPlans((ps) => ps.map((p) => p.id === id ? Object.assign({}, p, { [k]: v }) : p));
    const saveSettings = async () => {
      await sb.from('platform_settings').upsert({ key: 'team_extra_seat_price_kobo', value: Math.round((parseFloat(seatPrice) || 0) * 100) }, { onConflict: 'key' });
      await sb.from('platform_settings').upsert({ key: 'org_min_report_threshold', value: Math.max(2, parseInt(thr) || 5) }, { onConflict: 'key' });
      setMsg({ type: 'ok', text: 'Settings saved.' });
    };
    const cell = { padding: '8px 6px', fontSize: 12, borderBottom: '1px solid ' + C.border };
    return h('div', null, h(Msg, { m: msg }),
      h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Team packages (price in naira)'),
        plans.map((p) => h('div', { key: p.id, style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 } },
          h('input', { value: p.name, onChange: (e) => edit(p.id, 'name', e.target.value), style: Object.assign({}, inputStyle, { width: 150 }) }),
          h('input', { type: 'number', value: p.seats, onChange: (e) => edit(p.id, 'seats', parseInt(e.target.value) || 1), style: Object.assign({}, inputStyle, { width: 90 }) }),
          h('input', { type: 'number', value: Math.round(p.price_kobo / 100), onChange: (e) => edit(p.id, 'price_kobo', Math.round((parseFloat(e.target.value) || 0) * 100)), style: Object.assign({}, inputStyle, { width: 140 }) }),
          h('label', { style: { fontSize: 12 } }, h('input', { type: 'checkbox', checked: p.is_active, disabled: p.is_custom, onChange: (e) => edit(p.id, 'is_active', e.target.checked) }), ' active'),
          p.is_custom ? h('span', { style: { ...mono, fontSize: 10, color: C.muted } }, 'custom, not purchasable online') : null,
          h(Btn, { onClick: () => savePlan(p), style: { padding: '8px 16px' } }, 'SAVE')))),
      h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Extra seat price (naira, 0 disables) and minimum completions for aggregate results'),
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } }, h('input', { type: 'number', value: seatPrice, onChange: (e) => setSeatPrice(e.target.value), style: Object.assign({}, inputStyle, { width: 160 }) }), h('input', { type: 'number', value: thr, onChange: (e) => setThr(e.target.value), style: Object.assign({}, inputStyle, { width: 120 }) }), h(Btn, { onClick: saveSettings, style: { padding: '8px 16px' } }, 'SAVE'))),
      h('div', { style: card({ overflowX: 'auto' }) }, h('div', { style: label }, 'Organisations (' + orgs.length + ')'),
        h('table', { style: { width: '100%', borderCollapse: 'collapse', color: C.text } }, h('thead', null, h('tr', null, ['Organisation', 'Owner', 'Plan', 'Seats', 'Payment', 'Members', 'Completed', 'Cohorts', 'Created', 'Active'].map((x) => h('th', { key: x, style: Object.assign({}, cell, { ...mono, fontSize: 10, color: C.muted, textAlign: 'left' }) }, x)))),
          h('tbody', null, orgs.map((o) => h('tr', { key: o.id }, [o.name, o.owner_email || o.source, o.plan || 'n/a', o.active_members + o.pending_invites + ' / ' + o.seat_limit, o.payment_status || 'n/a', o.active_members, o.completed, o.cohorts, new Date(o.created_at).toLocaleDateString()].map((v, i) => h('td', { key: i, style: cell }, String(v))),
            h('td', { style: cell }, h('button', { onClick: async () => { await rpc('admin_set_org_active', { p_org: o.id, p_active: !o.is_active }); load(); }, style: { ...mono, fontSize: 10, background: 'none', border: '1px solid ' + C.border, color: o.is_active ? '#4CF7C0' : '#F87171', padding: '4px 8px', cursor: 'pointer' } }, o.is_active ? 'ON' : 'OFF'))))))));
  }

  window.NF_ORG = { EnterpriseLanding, OrgPortal, InvitePage, AdminTeamsPanel, initialView, loadMyOrgs, afterCfiSaved, track };
})();
