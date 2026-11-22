/* NeuralFusion Team Cognitive Development Experience: ENGINE + UI.
 * Loaded before app.js (see index.html). Needs React at load time; Supabase (sb) is handed in by app.js.
 * Exposes window.NF_TEAMX = { useTeamData, Section, TAB_LABELS, useStyles, _pure }.
 * One runner (Runner) powers lessons, challenges, the Team Thinking Room and the Team Decision Lab.
 * All persistence goes through the team_xp_* RPCs (migration_team_experience.sql).
 */
(function () {
  'use strict';
  const C = window.NF_TEAMX_CONTENT;
  if (!C || !window.React) { console.error('[NF_TEAMX] content or React missing'); return; }
  const h = React.createElement;
  const { useState, useEffect, useRef, useCallback, useMemo } = React;
  const MODES = C.MODES;
  // e(tag, className, props?, ...kids) for elements (props optional); e(Component, props, ...kids) for components.
  const isProps = (x) => x && typeof x === 'object' && !Array.isArray(x) && !React.isValidElement(x);
  const e = (tag, a, b, ...kids) => {
    if (tag === 'h2' || tag === 'h3') { const lvl = Number(tag[1]); const extra = { role: 'heading', 'aria-level': lvl };
      return e('div', a, isProps(b) ? Object.assign({}, b, extra) : extra, ...(isProps(b) || b === undefined || b === null ? [] : [b]), ...kids); }
    if (typeof tag === 'function') return h(tag, a, ...[b].concat(kids).filter((x) => x !== undefined));
    if (isProps(b)) return h(tag, Object.assign({ className: a || undefined }, b), ...kids);
    return h(tag, { className: a || undefined }, ...(b === undefined || b === null ? [] : [b]), ...kids);
  };

  // ====================================================================
  // Pure helpers (unit-tested in node)
  // ====================================================================
  const norm = (s) => String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
  const listVals = (v) => (Array.isArray(v) ? v : (v == null ? [] : [v])).map(norm).filter(Boolean);
  const isBlank = (v) => listVals(v).length === 0;

  function cleanValue(v) {
    if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : x)).filter((x) => (typeof x === 'string' ? norm(x) : true)).map((x) => (typeof x === 'string' ? norm(x) : x));
    if (v && typeof v === 'object') { const o = {}; Object.keys(v).forEach((k) => { o[k] = cleanValue(v[k]); }); return o; }
    return typeof v === 'string' ? v.slice(0, 2000) : v;
  }

  // Split local answers into what is shared with the team and what stays private to the person.
  function splitAnswers(steps, answers, stepIdx) {
    const shared = {}, priv = { _step: stepIdx };
    steps.forEach((s) => {
      if (!(s.id in answers)) return;
      (s.private ? priv : shared)[s.id] = cleanValue(answers[s.id]);
    });
    return { shared, priv };
  }

  function fieldDone(f, v) {
    if (f.optional) return true;
    if (f.kind === 'list') return listVals(v).length >= (f.min || 1);
    return norm(v).length > 0;
  }
  function stepComplete(step, ans, ctx) {
    const a = ans || {};
    switch (step.type) {
      case 'fields': return step.fields.every((f) => fieldDone(f, a[f.id]));
      case 'classify': return step.items.every((it) => a[it.id]) && (step.noCheck || !!a._c);
      case 'choice': return !!a.choice;
      case 'pick': return Array.isArray(a.picked) && a.picked.length >= 1;
      case 'outcome': return true;
      default: return true;
    }
  }

  // Which items in a classify step match the key.
  function classifyScore(step, a) {
    let right = 0;
    step.items.forEach((it) => { if (a && a[it.id] === it.key) right++; });
    return { right, total: step.items.length };
  }

  // Tally of picks or choices across teammates' shared entries.
  function tallyEntries(entries, from) {
    const counts = {}, whys = [];
    let people = 0;
    entries.forEach((en) => {
      const a = en.shared && en.shared[from]; if (!a) return;
      const ids = Array.isArray(a.picked) ? a.picked : (a.choice ? [a.choice] : []);
      if (!ids.length) return;
      people++;
      ids.forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
      if (norm(a.why)) whys.push({ text: norm(a.why), mine: !!en.mine, name: en.name || null });
    });
    return { counts, whys, people };
  }

  function classifyAgreement(entries, from, items) {
    const out = {};
    items.forEach((it) => { out[it.id] = {}; });
    let people = 0;
    entries.forEach((en) => {
      const a = en.shared && en.shared[from]; if (!a) return;
      people++;
      items.forEach((it) => { if (a[it.id]) out[it.id][a[it.id]] = (out[it.id][a[it.id]] || 0) + 1; });
    });
    return { byItem: out, people };
  }

  // Everything contributed in the round steps, de-duplicated, with how many people raised each item
  // and how many marked it as important (Integration step).
  function aggregateItems(entries, flow, localMarked, localAnswers) {
    const map = new Map();
    const roundIds = flow.steps.filter((s) => s.type === 'integrate').flatMap((s) => s.rounds);
    const stepById = {}; flow.steps.forEach((s) => { stepById[s.id] = s; });
    entries.forEach((en) => {
      const sh = en.shared || {};
      roundIds.forEach((rid) => {
        const st = stepById[rid]; if (!st || !sh[rid]) return;
        st.fields.forEach((f) => {
          listVals(sh[rid][f.id]).forEach((t) => {
            const k = rid + '.' + f.id + '|' + t.toLowerCase();
            const rec = map.get(k) || { key: k, text: t, step: rid, field: f.id, people: 0, marks: 0 };
            rec.people++; map.set(k, rec);
          });
        });
      });
      const marked = en.mine && localMarked ? localMarked : (sh.integrate && sh.integrate.marked) || [];
      marked.forEach((k) => { const rec = map.get(k); if (rec) rec.marks++; });
    });
    // my own unsaved local answers should also appear (the server copy can lag by one autosave)
    if (localAnswers) {
      roundIds.forEach((rid) => {
        const st = stepById[rid]; const a = localAnswers[rid]; if (!st || !a) return;
        st.fields.forEach((f) => listVals(a[f.id]).forEach((t) => {
          const k = rid + '.' + f.id + '|' + t.toLowerCase();
          if (!map.has(k)) map.set(k, { key: k, text: t, step: rid, field: f.id, people: 1, marks: (localMarked || []).includes(k) ? 1 : 0 });
        }));
      });
    }
    return Array.from(map.values());
  }

  // Suggest outcome content for a field from marked (or, failing that, most-raised) items.
  function suggestFor(items, keys, limit) {
    const pool = items.filter((i) => keys.indexOf(i.step + '.' + i.field) >= 0);
    const marked = pool.filter((i) => i.marks > 0).sort((a, b) => b.marks - a.marks || b.people - a.people);
    const src = marked.length ? marked : pool.sort((a, b) => b.people - a.people);
    return src.slice(0, limit || 5).map((i) => i.text);
  }

  // The one ordered journey. Status per item for THIS person.
  function pathState(entries, flags) {
    const done = {}, prog = {};
    (entries || []).forEach((en) => {
      if (en.kind === 'lesson' || en.kind === 'challenge') { (en.status === 'completed' ? done : prog)[en.ref] = true; }
      if ((en.kind === 'room' || en.kind === 'lab') && en.status === 'completed') done[en.kind] = true;
      if ((en.kind === 'room' || en.kind === 'lab') && en.status !== 'completed') prog[en.kind] = true;
    });
    if (flags && flags.assessed) done.assess = true;
    let found = false;
    const items = C.PATH.map((p) => {
      const isDone = !!done[p.key];
      let status = 'locked';
      if (isDone) status = 'done'; else if (!found) { status = 'current'; found = true; }
      return Object.assign({}, p, { status, inProgress: !!prog[p.key] && !isDone });
    });
    return { items, current: items.find((i) => i.status === 'current') || null, doneCount: items.filter((i) => i.status === 'done').length, total: items.length };
  }

  // Team-level progress from real aggregate counts. Returns null when counts are withheld.
  function teamProgress(ins, members) {
    if (!ins || !ins.ok || ins.suppressed || !members) return null;
    const comp = ins.completed || {};
    const frac = (k) => Math.min(1, (comp[k] || 0) / members);
    const units = [];
    C.LESSONS.forEach((l) => units.push({ key: l.id, stage: l.stage, f: frac('lesson:' + l.id) }));
    C.CHALLENGES.forEach((c) => units.push({ key: c.id, stage: c.stage, f: frac('challenge:' + c.id) }));
    units.push({ key: 'room', stage: 4, f: ins.sessions && ins.sessions.room_completed > 0 ? 1 : 0 });
    units.push({ key: 'lab', stage: 5, f: ins.sessions && ins.sessions.lab_completed > 0 ? 1 : 0 });
    const pct = Math.round((units.reduce((s, u) => s + u.f, 0) / units.length) * 100);
    // current stage: the first stage in which any unit is not yet completed by most of the team
    let stage = 6;
    for (let n = 1; n <= 5; n++) { const us = units.filter((u) => u.stage === n); if (us.length && us.some((u) => u.f < 0.5)) { stage = n; break; } }
    if (stage === 6) stage = 5;
    const allDone = units.every((u) => u.f >= 0.5);
    return { pct, stage, allDone, units };
  }

  function recordText(rec, flow) {
    const o = rec.outcome || {};
    const lines = [rec.title, 'Team Decision Record', 'Date: ' + (rec.completed_at ? new Date(rec.completed_at).toLocaleDateString() : ''), ''];
    const parts = rec.names && rec.names.length ? rec.names.join(', ') : (rec.participants ? rec.participants + ' participants' : '');
    if (parts) lines.push('Participants: ' + parts, '');
    (flow.fields || []).forEach((f) => {
      const v = o[f.id]; const vals = listVals(v); if (!vals.length) return;
      lines.push(f.label.toUpperCase());
      if (f.kind === 'list') vals.forEach((x) => lines.push('- ' + x)); else lines.push(vals.join(' '));
      lines.push('');
    });
    return lines.join('\n');
  }

  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch (_) { return ''; } };

  // ====================================================================
  // Styles (scoped under .tx; brand tokens match the existing portal)
  // ====================================================================
  const CSS = `
.tx{--ink:#111827;--muted:#4B5563;--line:#D1D5DB;--navy:#0A2A6B;--gold:#E8B931;--goldt:#FFF6DB;--ok:#166534;--okt:#F0FDF4;--bad:#B91C1C;--badt:#FEF2F2;--surf:#fff;--alt:#F9FAFB;font-family:'Atkinson Hyperlegible','Inter',-apple-system,sans-serif;color:var(--ink);font-size:16px;line-height:1.6}
.tx *,.tx *::before,.tx *::after{box-sizing:border-box}
:where(.tx) p{margin:0;max-width:none;color:inherit;font-family:inherit;font-size:inherit;line-height:inherit;font-weight:inherit}
.tx button,.tx input,.tx textarea,.tx select{font-family:inherit;font-size:16px}
.tx :focus-visible{outline:3px solid var(--navy);outline-offset:2px}
.tx-eyebrow{font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--navy);margin-bottom:8px}
.tx-h2{font-size:clamp(22px,4.2vw,30px);font-weight:800;line-height:1.25;overflow-wrap:anywhere}
.tx-h3{font-size:19px;font-weight:800;line-height:1.35;overflow-wrap:anywhere}
.tx-muted{color:var(--muted)}
.tx-sm{font-size:15px}
.tx-card{background:var(--surf);border:1px solid var(--line);border-radius:16px;padding:22px;min-width:0;box-shadow:0 1px 3px rgba(17,24,39,.06)}
.tx-card--tint{background:var(--goldt);border-color:var(--gold)}
.tx-card--navy{background:var(--navy);color:#fff;border-color:var(--navy)}
.tx-card--navy .tx-muted,.tx-card--navy .tx-eyebrow{color:#DCE6FA}
.tx-bento{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:16px;margin-bottom:16px}
.tx-span2{grid-column:span 2}.tx-span3{grid-column:span 3}.tx-span4{grid-column:span 4}.tx-span6{grid-column:span 6}
.tx-stack{display:flex;flex-direction:column;gap:14px}
.tx-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.tx-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 22px;border-radius:12px;border:2px solid var(--navy);background:var(--navy);color:#fff;font-weight:700;cursor:pointer;text-decoration:none;transition:background .15s,transform .1s}
.tx-btn:hover:not([disabled]){background:#061431}
.tx-btn:active:not([disabled]){transform:translateY(1px)}
.tx-btn--ghost{background:#fff;color:var(--navy)}
.tx-btn--ghost:hover:not([disabled]){background:var(--goldt)}
.tx-btn--gold{background:var(--gold);color:#111827;border-color:var(--gold)}
.tx-btn--gold:hover:not([disabled]){background:#d4a51f}
.tx-btn--sm{min-height:44px;padding:8px 16px;font-size:15px}
.tx-btn[disabled]{opacity:.5;cursor:not-allowed}
.tx-link{background:none;border:none;color:var(--navy);text-decoration:underline;cursor:pointer;min-height:44px;font-weight:700;padding:0 4px}
.tx-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 12px;border-radius:999px;border:1px solid var(--line);background:#fff;font-size:14px;font-weight:700;line-height:1.5;white-space:nowrap}
.tx-pill--ok{color:var(--ok);border-color:#86EFAC;background:var(--okt)}
.tx-pill--now{color:var(--navy);border-color:var(--navy);background:var(--goldt)}
.tx-mode{display:inline-flex;align-items:center;gap:6px;padding:3px 12px 3px 4px;border-radius:999px;background:var(--mt);color:var(--m);font-weight:800;font-size:14px;border:1px solid var(--m)}
.tx-mode i{font-style:normal;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--m);color:#fff;font-size:12px}
.tx-bar{height:10px;border-radius:999px;background:#E5E7EB;overflow:hidden}
.tx-bar>span{display:block;height:100%;border-radius:999px;background:var(--m,var(--navy));transition:width .5s ease}
.tx-big{font-size:clamp(32px,6vw,46px);font-weight:800;line-height:1.1}
.tx-tabsub{margin-bottom:20px}
.tx-field{margin-bottom:18px}
.tx-label{display:block;font-weight:700;margin-bottom:4px}
.tx-hint{font-size:14px;color:var(--muted);margin-bottom:6px}
.tx-input,.tx-area{width:100%;border:2px solid var(--line);border-radius:12px;padding:12px 14px;background:#fff;color:var(--ink);min-height:48px}
.tx-area{min-height:96px;resize:vertical;line-height:1.6}
.tx-input:focus,.tx-area:focus{border-color:var(--navy);outline:none;box-shadow:0 0 0 3px rgba(10,42,107,.15)}
.tx-listrow{display:flex;gap:8px;margin-bottom:8px}
.tx-opt{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;padding:14px 16px;border:2px solid var(--line);border-radius:14px;background:#fff;cursor:pointer;min-height:56px;color:var(--ink);transition:border-color .15s,background .15s}
.tx-opt:hover{border-color:var(--navy)}
.tx-opt[aria-checked="true"],.tx-opt[aria-pressed="true"]{border-color:var(--navy);background:var(--goldt)}
.tx-opt .tx-mark{flex:0 0 22px;height:22px;border:2px solid var(--muted);border-radius:50%;margin-top:2px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff}
.tx-opt[aria-checked="true"] .tx-mark,.tx-opt[aria-pressed="true"] .tx-mark{background:var(--navy);border-color:var(--navy)}
.tx-opt--sq .tx-mark{border-radius:6px}
.tx-opt--ok{border-color:#16A34A!important;background:var(--okt)!important}
.tx-opt--bad{border-color:var(--bad)!important;background:var(--badt)!important}
.tx-cat{min-height:44px;padding:8px 14px;border:2px solid var(--line);border-radius:999px;background:#fff;font-weight:700;cursor:pointer;color:var(--ink)}
.tx-cat:hover{border-color:var(--c,var(--navy))}
.tx-cat[aria-pressed="true"]{background:var(--ct,var(--goldt));border-color:var(--c,var(--navy));color:var(--c,var(--navy))}
.tx-item{padding:16px 0;border-top:1px solid var(--line)}
.tx-item:first-child{border-top:none}
.tx-stepper{display:flex;gap:4px;margin:14px 0 6px}
.tx-stepper span{flex:1;height:8px;border-radius:999px;background:#E5E7EB;transition:background .3s}
.tx-stepper span.on{background:var(--m,var(--navy))}
.tx-stepper span.cur{background:var(--m,var(--navy));box-shadow:0 0 0 2px #fff,0 0 0 4px var(--m,var(--navy))}
.tx-enter{animation:txin .22s ease both}
@keyframes txin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.tx-scen{border-left:5px solid var(--gold);background:var(--goldt);padding:16px 18px;border-radius:0 14px 14px 0}
.tx-scen strong{display:block;margin-bottom:4px}
.tx-modegrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.tx-mc{border:2px solid var(--m);background:var(--mt);border-radius:16px;padding:16px}
.tx-mc [aria-level="3"]{color:var(--m);font-size:20px;font-weight:800}
.tx-mc dt{font-weight:700;font-size:14px;margin-top:8px;text-transform:uppercase;letter-spacing:.04em}
.tx-mc dd{margin:0}
.tx-stage{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px}
.tx-stage>div{padding:12px 10px;border-radius:12px;border:1px solid var(--line);background:#fff;font-weight:800;font-size:13px;letter-spacing:.05em;text-align:center}
.tx-stage>div small{display:block;font-weight:600;letter-spacing:0;color:var(--muted);margin-top:2px;font-size:13px}
.tx-stage .done{background:var(--okt);border-color:#86EFAC;color:var(--ok)}
.tx-stage .cur{background:var(--navy);color:#fff;border-color:var(--navy)}
.tx-stage .cur small{color:#DCE6FA}
.tx-lrow{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 0;border-top:1px solid var(--line)}
.tx-lrow:first-child{border-top:none}
.tx-num{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;border:2px solid var(--line);background:#fff;color:var(--muted)}
.tx-lrow.is-done .tx-num{background:var(--ok);border-color:var(--ok);color:#fff}
.tx-lrow.is-cur .tx-num{background:var(--navy);border-color:var(--navy);color:#fff}
.tx-lrow.is-locked{opacity:.62}
.tx-wk{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.tx-wk>div{overflow-wrap:anywhere;padding:12px;border-radius:12px;border:1px solid var(--line);background:#fff}
.tx-wk .cur{border-color:var(--navy);background:var(--goldt)}
.tx-spark{display:flex;align-items:flex-end;gap:6px;height:70px}
.tx-spark span{flex:1;background:var(--navy);border-radius:4px 4px 0 0;min-height:3px;opacity:.85}
.tx-tally{display:grid;grid-template-columns:minmax(0,1fr) 54px;gap:6px 12px;align-items:center;margin-bottom:10px}
.tx-chip{display:inline-block;padding:2px 10px;border-radius:999px;background:var(--alt);border:1px solid var(--line);font-size:14px;margin:2px 4px 2px 0}
.tx-chip--me{background:var(--goldt);border-color:var(--gold)}
.tx-msg{padding:12px 14px;border-radius:12px;font-size:15px;line-height:1.6}
.tx-msg--err{background:var(--badt);color:var(--bad);border:1px solid #FCA5A5}
.tx-msg--ok{background:var(--okt);color:var(--ok);border:1px solid #86EFAC}
.tx-msg--info{background:var(--alt);border:1px solid var(--line)}
.tx-details>summary{cursor:pointer;font-weight:700;min-height:44px;display:flex;align-items:center}
.tx-rec [aria-level="3"]{margin:18px 0 6px;font-size:15px;text-transform:uppercase;letter-spacing:.05em;color:var(--navy)}
.tx-rec ul{margin:0;padding-left:20px}
.tx-sticky{position:sticky;bottom:0;background:linear-gradient(to top,#fff 78%,rgba(255,255,255,0));padding:14px 0 6px;margin-top:8px;z-index:2}
@media (max-width:820px){.tx-bento{grid-template-columns:repeat(2,minmax(0,1fr))}.tx-span2,.tx-span3,.tx-span4,.tx-span6{grid-column:span 2}.tx-wk{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:640px){.tx-card{padding:16px}.tx-modegrid{grid-template-columns:minmax(0,1fr)}.tx-stage{grid-template-columns:repeat(auto-fit,minmax(110px,1fr))}.tx-lrow{grid-template-columns:40px minmax(0,1fr)}.tx-lrow .tx-lact{grid-column:1 / -1}.tx-lrow .tx-lact .tx-btn{width:100%}.tx-btn--block-m{width:100%}}
@media (prefers-reduced-motion:reduce){.tx *,.tx *::before,.tx *::after{animation:none!important;transition:none!important}}
@media print{body *{visibility:hidden!important}.tx-print,.tx-print *{visibility:visible!important}.tx-print{position:absolute;left:0;top:0;width:100%;border:none!important;box-shadow:none!important}.tx-noprint{display:none!important}}
`;
  function useStyles() {
    useEffect(() => {
      if (document.getElementById('tx-styles')) return;
      const s = document.createElement('style'); s.id = 'tx-styles'; s.textContent = CSS; document.head.appendChild(s);
    }, []);
  }

  const modeStyle = (m) => { const d = MODES[m]; return d ? { '--m': d.color, '--mt': d.tint } : {}; };
  const ModeChip = ({ mode }) => { const d = MODES[mode]; return d ? e('span', 'tx-mode', { style: modeStyle(mode) }, e('i', null, { 'aria-hidden': true }, d.glyph), d.name + ' · ' + d.word) : null; };
  const Msg = ({ kind, children, role }) => e('div', 'tx-msg tx-msg--' + (kind || 'info'), { role: role || (kind === 'err' ? 'alert' : 'status') }, children);
  const Bar = ({ pct, mode, label }) => e('div', 'tx-bar', { style: modeStyle(mode), role: 'progressbar', 'aria-valuenow': Math.round(pct), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label || 'Progress' }, e('span', null, { style: { width: Math.max(0, Math.min(100, pct)) + '%' } }));

  // ====================================================================
  // Data hook: my progress + team aggregates. Called once by the dashboard.
  // ====================================================================
  function makeRpc(sb) {
    return async (name, args) => {
      try {
        const { data, error } = await sb.rpc(name, args || {});
        if (error) { console.error('[NF_TEAMX ' + name + ']', error); return { ok: false, error: 'request_failed' }; }
        return data || { ok: false, error: 'request_failed' };
      } catch (err) { console.error('[NF_TEAMX ' + name + ']', err); return { ok: false, error: 'network' }; }
    };
  }

  function useTeamData({ org, ov, sb, user, role, setView, startAssessment, track, setTab }) {
    const rpc = useMemo(() => makeRpc(sb), [sb]);
    const [entries, setEntries] = useState(null);
    const [ins, setIns] = useState(null);
    const [active, setActive] = useState(null); // { kind, ref, tab }
    const [unavailable, setUnavailable] = useState(false);
    const lead = role === 'owner' || role === 'admin';
    const reload = useCallback(async () => {
      const [m, i] = await Promise.all([rpc('team_xp_my_entries', { p_org: org.id }), rpc('team_xp_insights', { p_org: org.id })]);
      if (!m.ok) { setUnavailable(m.error === 'request_failed'); setEntries([]); } else { setUnavailable(false); setEntries(m.entries || []); }
      setIns(i && i.ok ? i : null);
    }, [org.id, rpc]);
    useEffect(() => { setEntries(null); setIns(null); setActive(null); reload(); }, [org.id]);
    const members = (ov && ov.seats && Number(ov.seats.used)) || 0;
    const assessed = !!(ov && ov.my_assessment_completed);
    const path = useMemo(() => pathState(entries || [], { assessed }), [entries, assessed]);
    const team = useMemo(() => teamProgress(ins, members), [ins, members]);
    return { org, ov, sb, rpc, user, role, lead, setView, startAssessment, track: track || function () {}, setTab, entries, ins, path, team, members, unavailable, active, open: setActive, close: () => setActive(null), reload, loading: entries === null };
  }

  // ====================================================================
  // Runner: one engine for lessons, challenges, Thinking Room, Decision Lab
  // ====================================================================
  function FieldInput({ f, value, onChange, answers, id }) {
    if (f.kind === 'list') {
      const vals = Array.isArray(value) ? value : (value ? [value] : []);
      const min = Math.max(f.min || 1, 1);
      const shown = vals.length >= min ? vals : vals.concat(new Array(min - vals.length).fill(''));
      const set = (i, v) => { const n = shown.slice(); n[i] = v; onChange(n); };
      return e('div', null,
        shown.map((v, i) => e('div', 'tx-listrow', { key: i },
          e('input', 'tx-input', { type: 'text', value: v, maxLength: 300, 'aria-label': f.label + ' ' + (i + 1), onChange: (ev) => set(i, ev.target.value) }),
          shown.length > min ? e('button', 'tx-btn tx-btn--ghost tx-btn--sm', { type: 'button', 'aria-label': 'Remove item ' + (i + 1), onClick: () => onChange(shown.filter((_, j) => j !== i)) }, '×') : null)),
        e('button', 'tx-btn tx-btn--ghost tx-btn--sm', { type: 'button', onClick: () => onChange(shown.concat('')) }, '+ Add another'));
    }
    if (f.kind === 'pickown') {
      const [sid, fid] = f.from.split('.');
      const opts = listVals(answers && answers[sid] && answers[sid][fid]);
      if (!opts.length) return e(Msg, { kind: 'info' }, 'Add your alternatives in the previous step first.');
      return e('div', 'tx-stack', { role: 'radiogroup', 'aria-label': f.label }, opts.map((o) => e('button', 'tx-opt', { key: o, type: 'button', role: 'radio', 'aria-checked': value === o, onClick: () => onChange(o) }, e('span', 'tx-mark', null, value === o ? '✓' : ''), e('span', null, o))));
    }
    return f.long
      ? e('textarea', 'tx-area', { id, value: value || '', maxLength: 2000, onChange: (ev) => onChange(ev.target.value) })
      : e('input', 'tx-input', { id, type: 'text', value: value || '', maxLength: 300, onChange: (ev) => onChange(ev.target.value) });
  }

  function ReadStep({ step }) {
    return e('div', 'tx-stack', step.blocks.map((b, i) => {
      if (b.t === 'p') return e('p', null, { key: i, style: { fontSize: 17, lineHeight: 1.75 } }, b.text);
      if (b.t === 'list') return e('ul', null, { key: i, style: { margin: 0, paddingLeft: 22, lineHeight: 1.8, fontSize: 17 } }, b.items.map((x, j) => e('li', null, { key: j }, x)));
      if (b.t === 'scenario') return e('div', 'tx-scen', { key: i }, e('strong', null, null, b.title), e('span', null, { style: { fontSize: 17, lineHeight: 1.75 } }, b.text));
      if (b.t === 'note') return e(Msg, { key: i, kind: 'info' }, b.text);
      if (b.t === 'facts') return e('div', 'tx-card', { key: i }, e('div', 'tx-eyebrow', null, 'What is known'), e('ul', null, { style: { margin: 0, paddingLeft: 22, lineHeight: 1.8 } }, b.items.map((x, j) => e('li', null, { key: j }, x))));
      if (b.t === 'modes') return e('div', 'tx-modegrid', { key: i }, C.MODE_ORDER.map((m) => { const d = MODES[m]; return e('div', 'tx-mc', { key: m, style: modeStyle(m) }, e('h3', null, null, d.name), e('div', null, { style: { fontWeight: 700, color: d.color, marginBottom: 4 } }, d.word),
        e('dl', null, { style: { margin: 0 } }, e('dt', null, null, 'What it does'), e('dd', null, null, d.does), e('dt', null, null, 'Strongest when'), e('dd', null, null, d.strong), e('dt', null, null, 'On its own'), e('dd', null, null, d.alone))); }));
      return null;
    }));
  }

  function PickStep({ step, a, set }) {
    const picked = (a && a.picked) || [];
    const toggle = (id) => { const has = picked.includes(id); let n = has ? picked.filter((x) => x !== id) : picked.concat(id); if (n.length > step.max) n = n.slice(n.length - step.max); set({ picked: n, why: (a && a.why) || '' }); };
    return e('div', 'tx-stack', e('p', null, { style: { fontSize: 17 } }, step.prompt), e('div', 'tx-hint', null, 'Choose up to ' + step.max + '.'),
      e('div', 'tx-stack', { role: 'group', 'aria-label': step.title }, step.items.map((it) => e('button', 'tx-opt tx-opt--sq', { key: it.id, type: 'button', 'aria-pressed': picked.includes(it.id), onClick: () => toggle(it.id) }, e('span', 'tx-mark', null, picked.includes(it.id) ? '✓' : ''), e('span', null, it.text)))),
      e('div', 'tx-field', e('label', 'tx-label', { htmlFor: 'tx-why' }, step.whyLabel || 'Why? (optional)'), e('textarea', 'tx-area', { id: 'tx-why', style: { minHeight: 72 }, value: (a && a.why) || '', maxLength: 600, onChange: (ev) => set({ picked, why: ev.target.value }) })));
  }

  function ChoiceStep({ step, a, set }) {
    const chosen = a && a.choice;
    return e('div', 'tx-stack', e('p', null, { style: { fontSize: 17 } }, step.prompt),
      e('div', 'tx-stack', { role: 'radiogroup', 'aria-label': step.title }, step.options.map((o) => e('button', 'tx-opt', { key: o.id, type: 'button', role: 'radio', 'aria-checked': chosen === o.id, onClick: () => set({ choice: o.id }) }, e('span', 'tx-mark', null, chosen === o.id ? '✓' : ''), e('span', null, o.label)))),
      chosen ? e('div', 'tx-card tx-card--tint tx-enter', { 'aria-live': 'polite' }, e('div', 'tx-eyebrow', null, 'What each choice leads to'),
        step.options.map((o) => e('div', 'tx-item', { key: o.id }, e('strong', null, null, (o.id === chosen ? 'You chose: ' : '') + o.label), e('div', 'tx-muted', null, o.consequence))),
        step.note ? e('div', 'tx-muted tx-sm', { style: { marginTop: 8 } }, step.note) : null) : null);
  }

  function ClassifyStep({ step, a, set }) {
    const cur = a || {};
    const checked = !!cur._c && !step.noCheck;
    const all = step.items.every((it) => cur[it.id]);
    const sc = classifyScore(step, cur);
    return e('div', 'tx-stack', e('p', null, { style: { fontSize: 17 } }, step.prompt),
      e('div', 'tx-card', step.items.map((it) => {
        const mine = cur[it.id]; const ok = checked && mine === it.key;
        const keyCat = step.cats.find((c) => c.id === it.key);
        return e('div', 'tx-item', { key: it.id },
          e('div', null, { style: { fontWeight: 700, fontSize: 17 } }, it.text),
          step.showSource && it.source ? e('div', 'tx-muted tx-sm', null, 'Source: ' + it.source) : null,
          e('div', 'tx-row', { role: 'radiogroup', 'aria-label': it.text, style: { marginTop: 10 } }, step.cats.map((c) => {
            const m = c.mode && MODES[c.mode];
            return e('button', 'tx-cat', { key: c.id, type: 'button', role: 'radio', 'aria-checked': mine === c.id, 'aria-pressed': mine === c.id, style: m ? { '--c': m.color, '--ct': m.tint } : null, onClick: () => set(Object.assign({}, cur, { [it.id]: c.id, _c: 0 })) }, c.label);
          })),
          checked ? e('div', ok ? 'tx-msg tx-msg--ok' : 'tx-msg tx-msg--info', { style: { marginTop: 10 }, role: 'status' }, (ok ? 'Matches. ' : 'Suggested: ' + (keyCat ? keyCat.label : '') + '. ') + (it.why || '')) : null);
      })),
      !step.noCheck ? e('div', 'tx-row', e('button', 'tx-btn' + (checked ? ' tx-btn--ghost' : ''), { type: 'button', disabled: !all, onClick: () => set(Object.assign({}, cur, { _c: 1 })) }, checked ? 'Checked' : 'Check my answers'),
        checked ? e('strong', null, null, sc.right + ' of ' + sc.total + ' match. A difference is a reason to talk, not a wrong answer.') : (all ? null : e('span', 'tx-muted tx-sm', null, 'Answer every item to check.'))) : null);
  }

  function FieldsStep({ step, a, set, answers }) {
    const cur = a || {};
    return e('div', 'tx-stack', step.prompt ? e('p', null, { style: { fontSize: 17 } }, step.prompt) : null,
      step.private ? e(Msg, { kind: 'info' }, 'This reflection is private. Only you can see it.') : e('div', 'tx-muted tx-sm', null, 'Shared with your team without your name once you save, unless the session shows first names.'),
      step.fields.map((f, i) => e('div', 'tx-field', { key: f.id },
        e('label', 'tx-label', { htmlFor: 'tx-f-' + f.id }, f.label + (f.optional ? ' (optional)' : '')),
        f.hint ? e('div', 'tx-hint', null, f.hint + (f.min > 1 ? ' At least ' + f.min + '.' : '')) : (f.kind === 'list' && f.min > 1 ? e('div', 'tx-hint', null, 'At least ' + f.min + '.') : null),
        e(FieldInput, { f, id: 'tx-f-' + f.id, value: cur[f.id], answers, onChange: (v) => set(Object.assign({}, cur, { [f.id]: v })) }))));
  }

  // Shared-view helpers
  function TeamEmpty({ count }) { return e(Msg, { kind: 'info' }, count <= 1 ? 'You are the first to answer. Teammates’ contributions will appear here as they complete this step. Use Refresh to check.' : 'Nothing else to show yet.'); }

  function TeamStep({ step, flow, sh, refresh, answers }) {
    const src = flow.steps.find((s) => s.id === step.from);
    if (!sh) return e(Msg, { kind: 'info' }, 'Loading...');
    if (sh.error) return e(Msg, { kind: 'err' }, 'Could not load your team’s contributions right now.');
    if (sh.locked) return e(Msg, { kind: 'info' }, 'Save your own answer first. You see teammates’ contributions after you have shared yours.');
    const entries = sh.entries || [];
    const refreshBtn = e('button', 'tx-btn tx-btn--ghost tx-btn--sm', { type: 'button', onClick: refresh }, 'Refresh');
    let body = null;
    if (step.show === 'tally') {
      const t = tallyEntries(entries, step.from);
      const items = src.items || [];
      const max = Math.max(1, ...items.map((it) => t.counts[it.id] || 0));
      body = e('div', 'tx-stack', e('div', 'tx-muted', null, t.people + (t.people === 1 ? ' person has' : ' people have') + ' answered.'),
        e('div', null, items.map((it) => e('div', null, { key: it.id }, e('div', 'tx-tally', e('div', null, null, it.text), e('strong', null, { style: { textAlign: 'right' } }, String(t.counts[it.id] || 0))),
          e(Bar, { pct: ((t.counts[it.id] || 0) / max) * 100, mode: it.mode || null, label: it.text })))),
        step.withWhy && t.whys.length ? e('div', null, e('div', 'tx-eyebrow', { style: { marginTop: 8 } }, 'Their reasons'), t.whys.map((w, i) => e('div', 'tx-item', { key: i }, w.mine ? e('span', 'tx-chip tx-chip--me', null, 'You') : e('span', 'tx-chip', null, w.name || 'Teammate'), ' ' + w.text))) : null,
        step.after ? e(Msg, { kind: 'info' }, step.after) : null);
    } else if (step.show === 'classify') {
      const ag = classifyAgreement(entries, step.from, src.items);
      body = e('div', 'tx-stack', e('div', 'tx-muted', null, ag.people + (ag.people === 1 ? ' person has' : ' people have') + ' classified these statements.'),
        e('div', 'tx-card', src.items.map((it) => {
          const tallies = ag.byItem[it.id]; const kinds = Object.keys(tallies); const split = kinds.length > 1;
          return e('div', 'tx-item', { key: it.id }, e('div', null, { style: { fontWeight: 700 } }, it.text),
            e('div', null, kinds.map((k) => e('span', 'tx-chip', { key: k }, (src.cats.find((c) => c.id === k) || {}).label + ': ' + tallies[k]))),
            split ? e('div', 'tx-sm', { style: { color: '#9A4A00', fontWeight: 700, marginTop: 4 } }, 'Your team saw this differently. Worth a conversation.') : null);
        })));
    } else {
      const fields = (step.fieldIds ? src.fields.filter((f) => step.fieldIds.indexOf(f.id) >= 0) : src.fields);
      const people = entries.filter((en) => en.shared && en.shared[step.from]);
      body = people.length === 0 ? e(TeamEmpty, { count: 0 }) : e('div', 'tx-stack', people.map((en, i) => e('div', 'tx-card', { key: i, style: en.mine ? { borderColor: '#E8B931', background: '#FFFBEB' } : null },
        e('div', 'tx-eyebrow', null, en.mine ? 'You' : (en.name || 'Teammate')),
        fields.map((f) => { const v = en.shared[step.from][f.id]; if (isBlank(v)) return null; return e('div', null, { key: f.id, style: { marginBottom: 10 } }, e('div', 'tx-muted tx-sm', null, f.label), Array.isArray(v) ? e('ul', null, { style: { margin: '2px 0 0', paddingLeft: 20 } }, listVals(v).map((x, j) => e('li', null, { key: j }, x))) : e('div', null, null, norm(v))); }))),
        people.length <= 1 ? e(TeamEmpty, { count: people.length }) : null);
    }
    return e('div', 'tx-stack', step.prompt ? e('p', 'tx-muted', null, step.prompt) : null, body, e('div', null, refreshBtn));
  }

  function ResultStep({ step, flow, answers }) {
    const src = flow.steps.find((s) => s.id === step.from); const a = answers[step.from] || {};
    const total = src.items.length; const byKey = {};
    src.items.forEach((it) => { byKey[it.key] = (byKey[it.key] || 0) + 1; });
    const confirmed = byKey.fact || 0; const unconfirmed = total - confirmed;
    const myFacts = src.items.filter((it) => a[it.id] === 'fact').length;
    const myFactsRight = src.items.filter((it) => a[it.id] === 'fact' && it.key === 'fact').length;
    const differ = src.items.filter((it) => a[it.id] && a[it.id] !== it.key);
    return e('div', 'tx-stack',
      e('div', 'tx-card tx-card--tint', e('div', 'tx-eyebrow', null, 'The original understanding'),
        e('div', 'tx-big', null, Math.round((unconfirmed / total) * 100) + '%'),
        e('p', null, { style: { fontSize: 17 } }, unconfirmed + ' of the ' + total + ' statements were not confirmed facts. They were assumptions (' + (byKey.assumption || 0) + '), interpretations (' + (byKey.interpretation || 0) + ') or unknowns (' + (byKey.unknown || 0) + '). Only ' + confirmed + ' rested on a record.'),
        e(Bar, { pct: (unconfirmed / total) * 100, mode: 'analytical', label: 'Share not confirmed' })),
      e('div', 'tx-card', e('div', 'tx-eyebrow', null, 'Your classification'),
        e('p', null, null, 'You marked ' + myFacts + ' statement' + (myFacts === 1 ? '' : 's') + ' as confirmed fact. ' + myFactsRight + ' of them ' + (myFactsRight === 1 ? 'was' : 'were') + ' backed by a record.'),
        differ.length ? e('div', null, e('div', 'tx-muted tx-sm', { style: { margin: '10px 0 4px' } }, 'Where you differed from the suggested reading:'), differ.map((it) => e('div', 'tx-item', { key: it.id }, e('div', null, { style: { fontWeight: 700 } }, it.text), e('div', 'tx-muted tx-sm', null, 'Suggested: ' + src.cats.find((c) => c.id === it.key).label + '. ' + it.why)))) : e(Msg, { kind: 'ok' }, 'Every classification matched the suggested reading.')));
  }

  function IntegrateStep({ step, flow, sh, refresh, answers, setMarked }) {
    if (!sh) return e(Msg, { kind: 'info' }, 'Loading...');
    if (sh.error) return e(Msg, { kind: 'err' }, 'Could not load the team’s contributions right now.');
    const marked = (answers.integrate && answers.integrate.marked) || [];
    const items = aggregateItems(sh.entries || [], flow, marked, answers);
    const people = (sh.entries || []).filter((en) => en.shared && Object.keys(en.shared).length).length;
    const toggle = (k) => setMarked(marked.includes(k) ? marked.filter((x) => x !== k) : marked.concat(k));
    return e('div', 'tx-stack', e('p', null, { style: { fontSize: 17 } }, step.prompt),
      e('div', 'tx-muted', null, people + (people === 1 ? ' person has' : ' people have') + ' contributed. Items raised by more than one person are shown first.'),
      step.rounds.map((rid) => {
        const st = flow.steps.find((s) => s.id === rid); const rows = items.filter((i) => i.step === rid);
        return e('div', 'tx-card', { key: rid, style: st.mode ? modeStyle(st.mode) : null }, e('div', 'tx-row', { style: { marginBottom: 6 } }, st.mode ? e(ModeChip, { mode: st.mode }) : null, e('strong', null, null, st.title)),
          st.fields.map((f) => { const fr = rows.filter((r) => r.field === f.id).sort((a, b) => b.people - a.people || b.marks - a.marks); if (!fr.length) return null;
            return e('div', null, { key: f.id, style: { marginTop: 12 } }, e('div', 'tx-muted tx-sm', null, f.label),
              fr.map((r) => e('button', 'tx-opt tx-opt--sq', { key: r.key, type: 'button', 'aria-pressed': marked.includes(r.key), style: { marginTop: 6, minHeight: 48 }, onClick: () => toggle(r.key) },
                e('span', 'tx-mark', null, marked.includes(r.key) ? '✓' : ''), e('span', { style: { flex: 1 } }, r.text),
                r.people > 1 ? e('span', 'tx-chip', null, 'raised by ' + r.people) : null, r.marks > 0 ? e('span', 'tx-chip tx-chip--me', null, r.marks + ' marked') : null))); }),
          rows.length ? null : e('div', 'tx-muted tx-sm', null, 'Nothing contributed to this round yet.'));
      }),
      e('div', null, e('button', 'tx-btn tx-btn--ghost tx-btn--sm', { type: 'button', onClick: refresh }, 'Refresh')));
  }

  function OutcomeStep({ step, flow, sh, refresh, answers, session, outcome, setOutcome, canEdit, closed, saveOutcome, finalize, outState }) {
    const items = sh && !sh.error ? aggregateItems(sh.entries || [], flow, (answers.integrate && answers.integrate.marked) || [], answers) : [];
    const [confirm, setConfirm] = useState(false);
    const req = step.fields.filter((f) => !f.optional);
    const complete = req.every((f) => fieldDone(Object.assign({}, f, { min: 1 }), outcome[f.id]));
    const note = closed ? e(Msg, { kind: 'ok' }, 'This outcome has been finalised and saved as the team record.') :
      canEdit ? e(Msg, { kind: 'info' }, 'You can write the outcome because you started this session or you are a team owner. Teammates see the draft as you save it.') :
      e(Msg, { kind: 'info' }, 'The session starter or a team owner writes the outcome. You can read the draft here as it is saved. Use Refresh to see updates.');
    return e('div', 'tx-stack', e('p', null, { style: { fontSize: 17 } }, step.prompt), note,
      step.fields.map((f) => {
        const ro = !canEdit || closed;
        const sug = f.suggest ? suggestFor(items, f.suggest, 5) : [];
        const v = outcome[f.id];
        return e('div', 'tx-field', { key: f.id },
          e('label', 'tx-label', { htmlFor: 'tx-o-' + f.id }, f.label + (f.optional ? ' (optional)' : '')),
          ro ? (isBlank(v) ? e('div', 'tx-muted', null, 'Not written yet.') : (f.kind === 'list' ? e('ul', null, { style: { margin: 0, paddingLeft: 20 } }, listVals(v).map((x, i) => e('li', null, { key: i }, x))) : e('div', null, null, norm(v))))
            : e('div', null, e(FieldInput, { f, id: 'tx-o-' + f.id, value: v, answers: outcome, onChange: (nv) => setOutcome(Object.assign({}, outcome, { [f.id]: nv })) }),
              sug.length && isBlank(v) ? e('button', 'tx-link', { type: 'button', onClick: () => setOutcome(Object.assign({}, outcome, { [f.id]: f.kind === 'list' ? sug : sug.join('; ') })) }, 'Fill from what the team marked (' + sug.length + ')') : null));
      }),
      canEdit && !closed ? e('div', 'tx-stack', e('div', 'tx-row',
        e('button', 'tx-btn tx-btn--ghost', { type: 'button', onClick: () => saveOutcome(false) }, 'Save draft'),
        !confirm ? e('button', 'tx-btn tx-btn--gold', { type: 'button', disabled: !complete, onClick: () => setConfirm(true) }, 'Finalise record') : null,
        e('span', 'tx-muted tx-sm', { 'aria-live': 'polite' }, outState === 'saving' ? 'Saving...' : outState === 'saved' ? 'Draft saved' : outState === 'error' ? 'Could not save' : '')),
        !complete ? e('div', 'tx-muted tx-sm', null, 'Complete every required field to finalise.') : null,
        confirm ? e('div', 'tx-msg tx-msg--info', e('div', null, { style: { marginBottom: 10 } }, 'Finalise this record? It becomes read-only and appears for the whole team.'),
          e('div', 'tx-row', e('button', 'tx-btn', { type: 'button', onClick: () => { setConfirm(false); finalize(); } }, 'Yes, finalise'), e('button', 'tx-btn tx-btn--ghost', { type: 'button', onClick: () => setConfirm(false) }, 'Keep editing'))) : null) :
        e('div', null, e('button', 'tx-btn tx-btn--ghost tx-btn--sm', { type: 'button', onClick: refresh }, 'Refresh')));
  }

  function TakeawayStep({ step, done, goNext }) {
    const next = step.next ? (step.next === 'room' ? 'Team Thinking Room' : step.next === 'lab' ? 'Team Decision Lab' : ((C.byId(step.next) || {}).title || '')) : '';
    return e('div', 'tx-stack', e('div', 'tx-card tx-card--tint', e('div', 'tx-eyebrow', null, 'Takeaway'), e('p', null, { style: { fontSize: 'clamp(18px,3.6vw,22px)', fontWeight: 700, lineHeight: 1.5 } }, step.text)),
      done && next ? e('div', 'tx-row', e('button', 'tx-btn', { type: 'button', onClick: goNext }, 'Next: ' + next + ' →')) : null);
  }

  function Runner({ ctx, kind, refId, def, session, onExit, exitLabel }) {
    const { rpc, org } = ctx;
    const flow = def;
    const steps = flow.steps;
    const [idx, setIdx] = useState(0);
    const [answers, setAnswers] = useState(null);
    const [save, setSave] = useState('idle'); // idle|saving|saved|error
    const [sh, setSh] = useState(null);
    const [finished, setFinished] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [sess, setSess] = useState(session || null);
    const [outcome, setOutcome] = useState((session && session.outcome) || {});
    const [outState, setOutState] = useState('idle');
    const timer = useRef(null), latest = useRef({}), outTimer = useRef(null), outLatest = useRef({});
    const kindRef = kind;

    const modes = flow.modes || [];
    latest.current = { answers, idx };
    outLatest.current = outcome;

    // load my entry (resume)
    useEffect(() => {
      let live = true;
      rpc('team_xp_get_entry', { p_org: org.id, p_kind: kindRef, p_ref: refId }).then((r) => {
        if (!live) return;
        if (!r.ok) { setAnswers({}); setSave('error'); return; }
        const en = r.entry;
        if (!en) { setAnswers({}); return; }
        const priv = Object.assign({}, en.private || {}); const startAt = Number(priv._step) || 0; delete priv._step;
        setAnswers(Object.assign({}, en.shared || {}, priv));
        setCompleted(en.status === 'completed');
        setIdx(en.status === 'completed' ? 0 : Math.min(startAt, steps.length - 1));
      });
      return () => { live = false; };
    }, [org.id, kindRef, refId]);

    const flush = useCallback(async (status, stepIdx) => {
      const L = latest.current; if (!L.answers) return true;
      const { shared, priv } = splitAnswers(steps, L.answers, stepIdx == null ? L.idx : stepIdx);
      setSave('saving');
      const r = await rpc('team_xp_save_entry', { p_org: org.id, p_kind: kindRef, p_ref: refId, p_shared: shared, p_private: priv, p_modes: status === 'completed' ? modes : (flow.entryModes || modes), p_status: status || 'in_progress' });
      if (r && r.ok) { setSave('saved'); if (r.status === 'completed') setCompleted(true); return true; }
      setSave('error'); return false;
    }, [org.id, kindRef, refId, rpc, steps]);

    // debounce autosave on edits
    const setStepAnswer = (stepId, val) => {
      setAnswers((a) => Object.assign({}, a, { [stepId]: val }));
      setSave('idle');
      clearTimeout(timer.current);
      timer.current = setTimeout(() => { flush('in_progress'); }, 1400);
    };
    useEffect(() => () => { clearTimeout(timer.current); clearTimeout(outTimer.current); }, []);
    // best-effort save on leaving
    useEffect(() => () => { if (latest.current.answers) { const L = latest.current; const sp = splitAnswers(steps, L.answers, L.idx); rpc('team_xp_save_entry', { p_org: org.id, p_kind: kindRef, p_ref: refId, p_shared: sp.shared, p_private: sp.priv, p_modes: flow.entryModes || modes, p_status: 'in_progress' }); } }, []);

    const step = steps[idx];
    const needsTeam = step && (step.type === 'team' || step.type === 'integrate' || step.type === 'outcome');
    const loadShared = useCallback(async () => {
      const r = await rpc('team_xp_shared_entries', { p_org: org.id, p_kind: kindRef, p_ref: refId });
      setSh(r.ok ? r : { error: true });
      if (kindRef === 'room' || kindRef === 'lab') {
        const g = await rpc('team_xp_get_session', { p_org: org.id, p_id: refId });
        if (g.ok) { setSess(g.session); if (g.session.status === 'completed' || !(g.session.can_finalize)) setOutcome(g.session.outcome || {}); }
      }
    }, [org.id, kindRef, refId, rpc]);
    useEffect(() => { if (needsTeam && answers) { setSh(null); loadShared(); } }, [idx, !!answers]);

    const go = async (n) => {
      clearTimeout(timer.current);
      await flush('in_progress', n);
      setIdx(n); setFinished(false);
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
    };

    const canFinalize = !!(sess && sess.can_finalize);
    const closed = !!(sess && sess.status === 'completed');
    const saveOutcome = async (complete) => {
      setOutState('saving');
      const r = await rpc('team_xp_update_session', { p_org: org.id, p_id: refId, p_outcome: cleanValue(outLatest.current), p_complete: !!complete });
      if (r.ok) { setOutState('saved'); if (complete) { setSess((s) => Object.assign({}, s, { status: 'completed' })); ctx.track(kindRef === 'lab' ? 'team_decision_record_created' : 'team_room_outcome_created', { organisation_id: org.id }); } }
      else setOutState('error');
    };
    const onOutcome = (v) => { setOutcome(v); setOutState('idle'); clearTimeout(outTimer.current); outTimer.current = setTimeout(() => saveOutcome(false), 2200); };

    const finish = async () => {
      const ok = await flush('completed', steps.length - 1);
      if (ok) { setFinished(true); setCompleted(true); ctx.track('team_' + kindRef + '_completed', { organisation_id: org.id, ref: refId }); ctx.reload(); }
    };

    if (!answers) return e('div', 'tx-card', { role: 'status' }, 'Loading...');

    const a = answers[step.id];
    const setA = (v) => setStepAnswer(step.id, v);
    const ok = stepComplete(step, a, ctx);
    const last = idx === steps.length - 1;
    const modeOfStep = step.mode || flow.mode || null;
    let body;
    switch (step.type) {
      case 'read': body = e(ReadStep, { step }); break;
      case 'fields': body = e(FieldsStep, { step, a, set: setA, answers }); break;
      case 'classify': body = e(ClassifyStep, { step, a, set: setA }); break;
      case 'choice': body = e(ChoiceStep, { step, a, set: setA }); break;
      case 'pick': body = e(PickStep, { step, a, set: setA }); break;
      case 'team': body = e(TeamStep, { step, flow, sh, refresh: loadShared, answers }); break;
      case 'result': body = e(ResultStep, { step, flow, answers }); break;
      case 'integrate': body = e(IntegrateStep, { step, flow, sh, refresh: loadShared, answers, setMarked: (m) => setStepAnswer('integrate', { marked: m }) }); break;
      case 'outcome': body = e(OutcomeStep, { step, flow, sh, refresh: loadShared, answers, session: sess, outcome, setOutcome: onOutcome, canEdit: canFinalize && !closed, closed, saveOutcome, finalize: () => saveOutcome(true), outState }); break;
      case 'takeaway': body = e(TakeawayStep, { step, done: finished || completed, goNext: () => { onExit(); ctx.goTo(step.next); } }); break;
      default: body = null;
    }

    return e('div', 'tx-stack tx-enter', { key: 'runner' },
      e('div', 'tx-row tx-noprint', { style: { justifyContent: 'space-between' } },
        e('button', 'tx-link', { type: 'button', onClick: async () => { clearTimeout(timer.current); await flush('in_progress'); onExit(); } }, '← ' + (exitLabel || 'Back')),
        e('span', 'tx-muted tx-sm', { 'aria-live': 'polite' }, save === 'saving' ? 'Saving...' : save === 'saved' ? 'Saved. You can leave and resume.' : save === 'error' ? 'Could not save. Check your connection.' : '')),
      e('div', 'tx-card', { style: modeOfStep ? modeStyle(modeOfStep) : null },
        e('div', 'tx-row', { style: { marginBottom: 6 } }, kindRef === 'lesson' ? e('span', 'tx-pill', null, 'Lesson ' + flow.num) : kindRef === 'challenge' ? e('span', 'tx-pill', null, 'Challenge ' + flow.num) : null, flow.mode ? e(ModeChip, { mode: flow.mode }) : null, flow.minutes ? e('span', 'tx-muted tx-sm', null, 'About ' + flow.minutes + ' minutes') : null),
        e('h2', 'tx-h2', null, flow.title),
        e('div', 'tx-stepper', { 'aria-hidden': true }, steps.map((s, i) => e('span', i === idx ? 'cur' : (i < idx ? 'on' : ''), { key: s.id, style: modeStyle(s.mode || flow.mode) }))),
        e('div', 'tx-muted tx-sm', null, 'Step ' + (idx + 1) + ' of ' + steps.length + ' · ' + step.title)),
      flow.scenario && step.type !== 'read' ? e('details', 'tx-card tx-details', { key: 'scen-' + (idx === 0), open: idx === 0 }, e('summary', null, null, 'Scenario: ' + flow.scenario.title), e('p', null, { style: { marginTop: 6 } }, flow.scenario.text)) : null,
      e('div', 'tx-card tx-enter', { key: 'step-' + step.id, style: modeOfStep ? modeStyle(modeOfStep) : null },
        e('div', 'tx-row', { style: { marginBottom: 12 } }, step.mode ? e(ModeChip, { mode: step.mode }) : null, e('h3', 'tx-h3', null, step.title)),
        body),
      e('div', 'tx-sticky tx-noprint', e('div', 'tx-row', { style: { justifyContent: 'space-between' } },
        e('button', 'tx-btn tx-btn--ghost tx-btn--block-m', { type: 'button', disabled: idx === 0, onClick: () => go(idx - 1) }, '← Back'),
        last ? (finished ? e('button', 'tx-btn tx-btn--block-m', { type: 'button', onClick: onExit }, 'Done') : e('button', 'tx-btn tx-btn--gold tx-btn--block-m', { type: 'button', onClick: finish }, completed ? 'Save and finish' : 'Complete')) :
          e('button', 'tx-btn tx-btn--block-m', { type: 'button', disabled: !ok, onClick: () => go(idx + 1) }, 'Continue →'),
        !ok && !last ? e('div', 'tx-muted tx-sm', { style: { width: '100%', textAlign: 'right' } }, step.type === 'classify' && !step.noCheck ? 'Answer every item and check your answers to continue.' : 'Complete the required items to continue.') : null),
        finished ? e(Msg, { kind: 'ok' }, 'Completed and recorded for your team.') : null));
  }

  // ====================================================================
  // Records
  // ====================================================================
  function RecordView({ rec, flow, onBack, backLabel }) {
    const outStep = flow.steps.find((s) => s.type === 'outcome');
    const o = rec.outcome || {};
    const mode = rec.kind === 'lab' ? 'Decision record' : 'Team outcome';
    const parts = rec.names && rec.names.length ? rec.names.join(', ') : (rec.participants ? rec.participants + ' participant' + (rec.participants === 1 ? '' : 's') : '');
    const [copied, setCopied] = useState(false);
    const copy = () => { const t = recordText(rec, outStep); try { navigator.clipboard.writeText(t).then(() => setCopied(true), () => window.prompt('Copy this record', t)); } catch (_) { window.prompt('Copy this record', t); } };
    return e('div', 'tx-stack tx-enter',
      e('div', 'tx-row tx-noprint', e('button', 'tx-link', { type: 'button', onClick: onBack }, '← ' + (backLabel || 'Back')),
        e('div', null, { style: { marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' } }, e('button', 'tx-btn tx-btn--ghost tx-btn--sm', { type: 'button', onClick: copy }, copied ? 'Copied' : 'Copy as text'), e('button', 'tx-btn tx-btn--sm', { type: 'button', onClick: () => window.print() }, 'Print or save as PDF'))),
      e('article', 'tx-card tx-print tx-rec', e('div', 'tx-eyebrow', null, 'NeuralFusion · ' + (rec.kind === 'lab' ? 'Team Decision Record' : 'Team Thinking Room outcome')),
        e('h2', 'tx-h2', null, rec.title),
        e('div', 'tx-muted', null, 'Date: ' + fmtDate(rec.completed_at) + (parts ? ' · Participants: ' + parts : '')),
        outStep.fields.map((f) => { const v = o[f.id]; if (isBlank(v)) return null; return e('div', null, { key: f.id }, e('h3', null, null, f.label), f.kind === 'list' ? e('ul', null, null, listVals(v).map((x, i) => e('li', null, { key: i }, x))) : e('p', null, null, norm(v))); }),
        e('p', 'tx-muted tx-sm', { style: { marginTop: 22 } }, 'This record contains the team’s agreed outcome. Individual reflections are private and are not part of it.')));
  }

  // ====================================================================
  // Session lists: Thinking Room and Decision Lab
  // ====================================================================
  function SessionHub({ ctx, kind }) {
    const isLab = kind === 'lab';
    const scenarios = isLab ? C.LAB_SCENARIOS : C.ROOM_SCENARIOS;
    const flowOf = (sid) => { const sc = scenarios.find((s) => s.id === sid) || scenarios[0]; return isLab ? C.labFlow(sc) : C.roomFlow(sc); };
    const [list, setList] = useState(null); const [recs, setRecs] = useState(null);
    const [scen, setScen] = useState(scenarios[0].id);
    const [title, setTitle] = useState(''); const [anon, setAnon] = useState(true); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
    const [view, setView] = useState(null); // {mode:'run'|'record', session|rec}
    const load = useCallback(async () => {
      const [l, r] = await Promise.all([ctx.rpc('team_xp_list_sessions', { p_org: ctx.org.id, p_kind: kind }), ctx.rpc('team_xp_records', { p_org: ctx.org.id })]);
      setList(l.ok ? l.sessions : []); setRecs(r.ok ? r.records.filter((x) => x.kind === kind) : []);
      if (!l.ok) setMsg({ kind: 'err', text: 'Could not load sessions. Please try again.' });
    }, [ctx.org.id, kind]);
    useEffect(() => { load(); }, [load, view]);
    // allow another part of the app to open a specific session
    const label = isLab ? 'Decision Lab' : 'Thinking Room';
    const create = async () => {
      const sc = scenarios.find((s) => s.id === scen);
      const t = (title.trim() || sc.title + ' · ' + new Date().toLocaleDateString());
      setBusy(true); setMsg(null);
      const r = await ctx.rpc('team_xp_create_session', { p_org: ctx.org.id, p_kind: kind, p_scenario: scen, p_title: t, p_anonymous: anon });
      setBusy(false);
      if (!r.ok) { setMsg({ kind: 'err', text: r.error === 'too_many_open' ? 'Too many sessions are open. Finish or ask an owner to finish some first.' : r.error === 'invalid_title' ? 'Give the session a name of 3 to 120 characters.' : 'Could not start the session. Please try again.' }); return; }
      ctx.track(isLab ? 'team_lab_started' : 'team_room_started', { organisation_id: ctx.org.id });
      setTitle(''); const g = await ctx.rpc('team_xp_get_session', { p_org: ctx.org.id, p_id: r.session.id });
      setView({ mode: 'run', session: g.ok ? g.session : r.session });
    };
    const openSession = async (s) => {
      const g = await ctx.rpc('team_xp_get_session', { p_org: ctx.org.id, p_id: s.id });
      if (!g.ok) { setMsg({ kind: 'err', text: 'Could not open that session.' }); return; }
      setView({ mode: 'run', session: g.session });
    };
    if (view && view.mode === 'run') {
      const s = view.session; const flow = flowOf(s.scenario_id);
      return e(Runner, { key: s.id, ctx, kind, refId: s.id, def: Object.assign({ title: s.title }, flow), session: s, onExit: () => { setView(null); ctx.reload(); }, exitLabel: 'Back to ' + label });
    }
    if (view && view.mode === 'record') return e(RecordView, { rec: view.rec, flow: flowOf(view.rec.scenario_id), onBack: () => setView(null), backLabel: 'Back to ' + label });
    const open = (list || []).filter((s) => s.status === 'open');
    return e('div', 'tx-stack',
      e('div', 'tx-card tx-card--navy', e('div', 'tx-eyebrow', null, isLab ? 'Team Decision Lab' : 'Team Thinking Room'),
        e('h2', 'tx-h2', null, isLab ? 'Make a real decision, with a record' : 'Think through one problem together, using all four modes'),
        e('p', 'tx-muted', { style: { marginTop: 8, maxWidth: 720, fontSize: 17 } }, isLab ? 'DEFINE → ANALYZE → SENSE → EXPAND → REFLECT → INTEGRATE → DECIDE. Everyone contributes at their own pace. The team ends with a Team Decision Record you can revisit, print or copy.' : 'Problem brief, then an Analytical, Intuitive, Associative and Reflective round, then Integration and a Team Outcome. Everyone contributes at their own pace and the team’s contributions are brought together. This is not live: you see teammates’ contributions when you open or refresh a step.')),
      msg ? e(Msg, { kind: msg.kind }, msg.text) : null,
      e('div', 'tx-card', e('h3', 'tx-h3', null, 'Start a ' + (isLab ? 'decision' : 'session')),
        e('div', 'tx-stack', { role: 'radiogroup', 'aria-label': 'Scenario', style: { marginTop: 12 } }, scenarios.map((s) => e('button', 'tx-opt', { key: s.id, type: 'button', role: 'radio', 'aria-checked': scen === s.id, onClick: () => setScen(s.id) }, e('span', 'tx-mark', null, scen === s.id ? '✓' : ''), e('span', null, e('strong', null, null, s.title), e('br'), e('span', 'tx-muted', null, s.blurb))))),
        e('div', 'tx-field', { style: { marginTop: 14 } }, e('label', 'tx-label', { htmlFor: 'tx-sess-title' }, 'Session name (optional)'), e('input', 'tx-input', { id: 'tx-sess-title', value: title, maxLength: 120, placeholder: scenarios.find((s) => s.id === scen).title, onChange: (ev) => setTitle(ev.target.value) })),
        e('label', 'tx-row', { style: { marginBottom: 14, cursor: 'pointer' } }, e('input', null, { type: 'checkbox', checked: !anon, style: { width: 22, height: 22 }, onChange: (ev) => setAnon(!ev.target.checked) }), e('span', null, null, 'Show first names with contributions and on the record. Off by default: contributions are anonymous.')),
        e('button', 'tx-btn', { type: 'button', disabled: busy, onClick: create }, busy ? 'Starting...' : isLab ? 'Start Decision Lab session' : 'Start Thinking Room session')),
      e('div', 'tx-card', e('h3', 'tx-h3', null, 'Open sessions'),
        list === null ? e('div', 'tx-muted', null, 'Loading...') : open.length === 0 ? e('p', 'tx-muted', { style: { marginTop: 8 } }, 'No open sessions. Start one above, then tell your team to open this tab and join.') :
          open.map((s) => e('div', 'tx-lrow', { key: s.id }, e('div', 'tx-num', { 'aria-hidden': true }, s.my_status === 'completed' ? '✓' : (s.my_status ? '…' : '+')),
            e('div', null, e('div', null, { style: { fontWeight: 800 } }, s.title), e('div', 'tx-muted tx-sm', null, (scenarios.find((x) => x.id === s.scenario_id) || {}).title + ' · ' + s.participants + ' joined · ' + s.finished + ' finished · started ' + fmtDate(s.created_at))),
            e('div', 'tx-lact', e('button', 'tx-btn tx-btn--sm', { type: 'button', onClick: () => openSession(s) }, s.my_status === 'completed' ? 'Review' : s.my_status ? 'Resume' : 'Join'))))),
      e('div', 'tx-card', e('h3', 'tx-h3', null, isLab ? 'Team Decision Records' : 'Team outcomes'),
        recs === null ? e('div', 'tx-muted', null, 'Loading...') : recs.length === 0 ? e('p', 'tx-muted', { style: { marginTop: 8 } }, isLab ? 'No records yet. Finalise a Decision Lab session and its record appears here for the whole team.' : 'No outcomes yet. When a session’s outcome is finalised it appears here.') :
          recs.map((r) => e('div', 'tx-lrow', { key: r.id }, e('div', 'tx-num', { 'aria-hidden': true, style: { background: '#0A2A6B', borderColor: '#0A2A6B', color: '#fff' } }, '▤'),
            e('div', null, e('div', null, { style: { fontWeight: 800 } }, r.title), e('div', 'tx-muted tx-sm', null, fmtDate(r.completed_at) + ' · ' + r.participants + ' participant' + (r.participants === 1 ? '' : 's'))),
            e('div', 'tx-lact', e('button', 'tx-btn tx-btn--ghost tx-btn--sm', { type: 'button', onClick: () => setView({ mode: 'record', rec: r }) }, 'Open record'))))));
  }

  // ====================================================================
  // Journey, Challenges
  // ====================================================================
  const itemTitle = (it) => it.kind === 'assessment' ? 'Baseline assessment' : it.kind === 'room' ? 'Team Thinking Room' : it.kind === 'lab' ? 'Team Decision Lab' : (C.byId(it.id) || {}).title;
  const itemLabel = (it) => it.kind === 'lesson' ? 'Lesson ' + C.byId(it.id).num : it.kind === 'challenge' ? 'Challenge ' + C.byId(it.id).num : it.kind === 'assessment' ? 'Assessment' : it.kind === 'room' ? 'Shared session' : 'Shared session';

  function openItem(ctx, it) {
    if (it.kind === 'lesson' || it.kind === 'challenge') ctx.open({ kind: it.kind, ref: it.id });
    else if (it.kind === 'room') ctx.setTab('room');
    else if (it.kind === 'lab') ctx.setTab('lab');
    else if (it.kind === 'assessment') ctx.startAssessment();
  }

  function ItemRow({ ctx, it, i }) {
    const st = it.status; const open = st !== 'locked' || ctx.lead;
    const cta = st === 'done' ? (it.kind === 'assessment' ? 'Done' : 'Review') : it.inProgress ? 'Resume' : st === 'current' ? (it.kind === 'room' || it.kind === 'lab' ? 'Open' : 'Start') : (ctx.lead ? 'Preview' : 'Locked');
    const d = it.id ? C.byId(it.id) : null;
    return e('div', 'tx-lrow is-' + st, { key: it.key },
      e('div', 'tx-num', { 'aria-hidden': true }, st === 'done' ? '✓' : d ? String(d.num) : (it.kind === 'room' ? 'R' : it.kind === 'lab' ? 'D' : 'A')),
      e('div', null, e('div', null, { style: { fontWeight: 800 } }, itemTitle(it)),
        e('div', 'tx-muted tx-sm', null, itemLabel(it) + ' · Week ' + it.week + (d && d.mode ? ' · ' + MODES[d.mode].name : '') + (d && d.minutes ? ' · ' + d.minutes + ' min' : '')),
        d && d.summary && st !== 'locked' ? e('div', 'tx-muted tx-sm', null, d.summary) : null),
      e('div', 'tx-lact', st === 'done' && it.kind === 'assessment' ? e('span', 'tx-pill tx-pill--ok', null, 'Completed') : e('button', 'tx-btn tx-btn--sm' + (st === 'current' ? '' : ' tx-btn--ghost'), { type: 'button', disabled: !open, 'aria-label': cta + ': ' + itemTitle(it), onClick: () => openItem(ctx, it) }, cta)));
  }

  function Journey({ ctx, legacy }) {
    const p = ctx.path;
    return e('div', 'tx-stack',
      e('div', 'tx-card', e('div', 'tx-eyebrow', null, 'Learning Journey'), e('h2', 'tx-h2', null, 'Recognize → Understand → Practice → Integrate → Apply'),
        e('p', 'tx-muted', { style: { margin: '8px 0 14px', maxWidth: 720 } }, 'One path through four pilot weeks. Each step opens when the one before it is complete' + (ctx.lead ? '. As a team owner you can open any step to prepare.' : '.')),
        e(StageRail, { ctx })),
      C.STAGES.map((s) => { const its = p.items.filter((i) => i.stage === s.n); if (!its.length) return null;
        const done = its.filter((i) => i.status === 'done').length;
        return e('section', 'tx-card', { key: s.n, 'aria-label': 'Stage ' + s.n + ' ' + s.name },
          e('div', 'tx-row', { style: { justifyContent: 'space-between' } }, e('div', null, e('div', 'tx-eyebrow', null, 'Stage ' + s.n + ' · ' + s.name), e('div', 'tx-muted', null, s.line)), e('span', 'tx-pill' + (done === its.length ? ' tx-pill--ok' : ''), null, done + ' of ' + its.length)),
          e('div', null, { style: { marginTop: 8 } }, its.map((it, i) => e(ItemRow, { key: it.key, ctx, it, i }))));
      }),
      legacy && legacy.guides ? e('div', 'tx-card', e('div', 'tx-eyebrow', null, 'For facilitators'), e('h3', 'tx-h3', null, 'Facilitator session guides'),
        e('p', 'tx-muted', { style: { margin: '6px 0 10px' } }, 'Printable session plans for running the five core NeuralFusion lessons live with your team. Their completion is tracked separately from the interactive journey above.'),
        e('details', 'tx-details', e('summary', null, null, 'Open the facilitator guides'), legacy.guides())) : null);
  }

  function StageRail({ ctx }) {
    const cur = ctx.team ? ctx.team.stage : (ctx.path.current ? ctx.path.current.stage : 5);
    const doneAll = ctx.team ? ctx.team.allDone : !ctx.path.current;
    return e('div', 'tx-stage', { role: 'list', 'aria-label': 'Stages' }, C.STAGES.map((s) => e('div', (doneAll || s.n < cur) ? 'done' : s.n === cur ? 'cur' : '', { key: s.n, role: 'listitem' }, (s.n < cur || doneAll ? '✓ ' : '') + s.name, e('small', null, null, 'Stage ' + s.n))));
  }

  function Challenges({ ctx, legacy }) {
    const p = ctx.path;
    return e('div', 'tx-stack',
      e('div', 'tx-card tx-card--navy', e('div', 'tx-eyebrow', null, 'Team Challenges'), e('h2', 'tx-h2', null, 'Short, purposeful, progressively harder'),
        e('p', 'tx-muted', { style: { marginTop: 8, fontSize: 17, maxWidth: 720 } }, 'Five challenges, one for each mode and then all four together. Work on your own first. Your answers are shared with the team without names once you save them. Your reflections stay private.')),
      e('div', 'tx-card', C.CHALLENGES.map((c) => { const it = p.items.find((i) => i.key === c.id);
        return e('div', 'tx-lrow is-' + it.status, { key: c.id }, e('div', 'tx-num', { 'aria-hidden': true }, it.status === 'done' ? '✓' : String(c.num)),
          e('div', null, e('div', 'tx-row', e('strong', null, null, c.title), e(ModeChip, { mode: c.mode })), e('div', 'tx-muted tx-sm', null, c.summary + ' · about ' + c.minutes + ' min · Week ' + c.week)),
          e('div', 'tx-lact', e('button', 'tx-btn tx-btn--sm' + (it.status === 'current' ? '' : ' tx-btn--ghost'), { type: 'button', disabled: it.status === 'locked' && !ctx.lead, onClick: () => ctx.open({ kind: 'challenge', ref: c.id }) },
            it.status === 'done' ? 'Review' : it.inProgress ? 'Resume' : it.status === 'locked' ? (ctx.lead ? 'Preview' : 'Locked') : 'Start')));
      }), p.items.find((i) => i.key === 'c1').status === 'locked' && !ctx.lead ? e(Msg, { kind: 'info' }, 'Challenges open as you move through the lessons. Complete Lesson 3 to unlock Challenge 1.') : null),
      legacy && legacy.weekly ? e('div', null, e('div', 'tx-eyebrow', { style: { margin: '8px 0' } }, 'Also this week'), legacy.weekly()) : null);
  }

  // ====================================================================
  // Overview
  // ====================================================================
  function Overview({ ctx, legacy }) {
    const p = ctx.path; const cur = p.current; const t = ctx.team; const ins = ctx.ins;
    const myPct = Math.round((p.doneCount / p.total) * 100);
    const pct = t ? t.pct : myPct;
    const stage = t ? t.stage : (cur ? cur.stage : 5);
    const stageObj = C.STAGES[stage - 1];
    const week = cur ? cur.week : 4;
    const doneItems = p.items.filter((i) => i.status === 'done');
    const milestones = [];
    C.STAGES.forEach((s) => { const its = p.items.filter((i) => i.stage === s.n); if (its.length && its.every((i) => i.status === 'done')) milestones.push('Stage ' + s.n + ' · ' + s.name + ' complete'); });
    if (ins && ins.sessions && ins.sessions.room_completed > 0) milestones.push('First Thinking Room outcome recorded');
    if (ins && ins.sessions && ins.sessions.lab_completed > 0) milestones.push('First Team Decision Record created');
    if (ctx.ov && ctx.ov.completed > 0) milestones.push(ctx.ov.completed + ' baseline assessment' + (ctx.ov.completed === 1 ? '' : 's') + ' completed');
    const nextText = !cur ? { title: 'You have completed the journey', why: 'Retake the assessment and review your Team Cognitive Insights.', cta: 'Open insights', act: () => ctx.setTab('insights') } :
      { title: itemTitle(cur), why: itemLabel(cur) + ' · Week ' + cur.week + ' · ' + C.STAGES[cur.stage - 1].name, cta: cur.inProgress ? 'Resume' : (cur.kind === 'assessment' ? 'Start assessment' : (cur.kind === 'room' || cur.kind === 'lab' ? 'Open' : 'Start')), act: () => openItem(ctx, cur) };
    const wk = C.WEEKS.map((w) => { const its = p.items.filter((i) => i.week === w.n); return { w, done: its.filter((i) => i.status === 'done').length, total: its.length }; });
    return e('div', 'tx-stack',
      e('div', 'tx-bento',
        e('section', 'tx-card tx-card--navy tx-span4', { 'aria-label': 'Next recommended activity' }, e('div', 'tx-eyebrow', null, cur && cur.inProgress ? 'Pick up where you left off' : 'Next recommended activity'),
          e('h2', 'tx-h2', null, nextText.title), e('p', 'tx-muted', { style: { margin: '6px 0 16px' } }, nextText.why),
          e('button', 'tx-btn tx-btn--gold', { type: 'button', onClick: nextText.act }, nextText.cta + ' →')),
        e('section', 'tx-card tx-span2', { 'aria-label': 'Team progress' }, e('div', 'tx-eyebrow', null, t ? 'Team progress' : 'Your progress'), e('div', 'tx-big', null, pct + '%'),
          e(Bar, { pct, label: 'Programme progress' }), e('div', 'tx-muted tx-sm', { style: { marginTop: 8 } }, t ? 'Average completion across lessons, challenges and shared sessions.' : (ins && ins.suppressed ? 'Team totals appear once ' + ins.threshold + ' people have started (' + ins.participants + ' so far). This is your own progress.' : p.doneCount + ' of ' + p.total + ' steps complete.'))),
        e('section', 'tx-card tx-span3', { 'aria-label': 'Current stage' }, e('div', 'tx-eyebrow', null, 'Current development stage'), e('h3', 'tx-h3', null, 'Stage ' + stage + ' · ' + stageObj.name), e('p', 'tx-muted', { style: { margin: '4px 0 12px' } }, stageObj.line), e(StageRail, { ctx })),
        e('section', 'tx-card tx-span3', { 'aria-label': 'Pilot weeks' }, e('div', 'tx-eyebrow', null, '4-week pilot · your steps'), e('div', 'tx-wk', wk.map((x) => e('div', x.w.n === week ? 'cur' : '', { key: x.w.n }, e('div', 'tx-sm', { style: { fontWeight: 800 } }, 'Week ' + x.w.n), e('div', 'tx-muted tx-sm', null, x.w.name), e('div', null, { style: { fontWeight: 800, marginTop: 4 } }, x.done + '/' + x.total))))),
        e('section', 'tx-card tx-span3', { 'aria-label': 'Completed milestones' }, e('div', 'tx-eyebrow', null, 'Completed milestones'),
          milestones.length ? e('ul', null, { style: { margin: 0, paddingLeft: 20, lineHeight: 1.8 } }, milestones.map((m) => e('li', null, { key: m }, m))) : e('p', 'tx-muted', null, 'Milestones appear here as the team completes stages and shared sessions.')),
        e('section', 'tx-card tx-span3', { 'aria-label': 'What we have learned' }, e('div', 'tx-eyebrow', null, 'What we have done so far'),
          e('p', null, null, doneItems.length ? 'You have completed ' + doneItems.length + ' of ' + p.total + ' steps' + (ctx.ov && ctx.ov.my_assessment_completed ? ', starting with the baseline assessment.' : '.') : 'Nothing completed yet. Your first step is above.'),
          ins && ins.ok ? e('p', 'tx-muted', { style: { marginTop: 6 } }, ins.participants + ' of ' + ctx.members + ' team members have started training' + (ins.sessions ? '. ' + (ins.sessions.room_completed + ins.sessions.lab_completed) + ' shared session outcome' + ((ins.sessions.room_completed + ins.sessions.lab_completed) === 1 ? '' : 's') + ' recorded.' : '.')) : null,
          e('button', 'tx-link', { type: 'button', onClick: () => ctx.setTab('insights') }, 'Open Team Cognitive Insights'))),
      week >= 4 && p.items.find((i) => i.key === 'assess').status === 'done' ? e('div', 'tx-card tx-card--tint', e('div', 'tx-eyebrow', null, 'Week 4 · Programme review'), e('p', null, null, 'To close the pilot, retake the assessment to see your own change, then review your Team Cognitive Insights.'), e('div', 'tx-row', { style: { marginTop: 10 } }, e('button', 'tx-btn tx-btn--ghost', { type: 'button', onClick: () => ctx.setView('cfi') }, 'Retake the assessment'), e('button', 'tx-btn tx-btn--ghost', { type: 'button', onClick: () => ctx.setTab('insights') }, 'Review insights'))) : null,
      legacy && legacy.home ? legacy.home() : null);
  }

  // ====================================================================
  // Team Cognitive Insights (real data only)
  // ====================================================================
  function Insights({ ctx, legacy }) {
    const ins = ctx.ins; const t = ctx.team; const members = ctx.members;
    const p = ctx.path;
    const comp = (ins && ins.completed) || {};
    const modes = (ins && ins.modes) || {};
    const maxMode = Math.max(1, ...Object.values(modes).map(Number));
    const isolated = ['lesson:l3', 'lesson:l4', 'lesson:l5', 'lesson:l6', 'challenge:c1', 'challenge:c2', 'challenge:c3', 'challenge:c4'].reduce((s, k) => s + (comp[k] || 0), 0);
    const integratedA = ['lesson:l7', 'lesson:l8', 'challenge:c5'].reduce((s, k) => s + (comp[k] || 0), 0);
    const sess = (ins && ins.sessions) || {};
    const shared = (sess.room_completed || 0) + (sess.lab_completed || 0);
    const weekly = (ins && ins.weekly) || [];
    const maxW = Math.max(1, ...weekly.map((w) => w.n));
    const hdr = (t1, sub) => e('div', null, e('div', 'tx-eyebrow', null, t1), sub ? e('div', 'tx-muted tx-sm', { style: { marginBottom: 10 } }, sub) : null);
    const supp = ins && ins.suppressed;
    return e('div', 'tx-stack',
      e('div', 'tx-card tx-card--navy', e('div', 'tx-eyebrow', null, 'Team Cognitive Insights'), e('h2', 'tx-h2', null, 'What your team has practised'),
        e('p', 'tx-muted', { style: { marginTop: 8, fontSize: 17, maxWidth: 720 } }, 'These figures count training done and participation. They are not scores, and they say nothing about any person’s ability or about how your team thinks.')),
      !ins ? e(Msg, { kind: 'info' }, 'Insights are not available right now.') : null,
      supp ? e(Msg, { kind: 'info' }, 'Team figures appear once ' + ins.threshold + ' people have started training, which protects individuals. ' + ins.participants + ' so far.') : null,
      e('div', 'tx-bento',
        e('section', 'tx-card tx-span3', { 'aria-label': 'Learning progress' }, hdr('Learning progress', 'Overall programme progress and what has been completed.'),
          e('div', 'tx-big', null, (t ? t.pct : Math.round((p.doneCount / p.total) * 100)) + '%'), e(Bar, { pct: t ? t.pct : (p.doneCount / p.total) * 100, label: 'Overall progress' }),
          e('div', 'tx-muted tx-sm', { style: { margin: '6px 0 12px' } }, t ? 'Team average across 8 lessons, 5 challenges and 2 shared session types.' : 'Your own progress. Team progress appears when enough people have started.'),
          t ? e('div', 'tx-stack', { style: { gap: 8 } }, C.LESSONS.map((l) => e('div', null, { key: l.id }, e('div', 'tx-tally', e('span', 'tx-sm', null, 'Lesson ' + l.num + ' · ' + l.title), e('strong', null, { style: { textAlign: 'right' } }, (comp['lesson:' + l.id] || 0) + '/' + members)), e(Bar, { pct: Math.min(100, ((comp['lesson:' + l.id] || 0) / Math.max(1, members)) * 100), label: l.title, mode: l.mode })))) : null,
          t ? e('div', 'tx-stack', { style: { gap: 8, marginTop: 14 } }, C.CHALLENGES.map((c) => e('div', null, { key: c.id }, e('div', 'tx-tally', e('span', 'tx-sm', null, 'Challenge ' + c.num + ' · ' + c.title), e('strong', null, { style: { textAlign: 'right' } }, (comp['challenge:' + c.id] || 0) + '/' + members)), e(Bar, { pct: Math.min(100, ((comp['challenge:' + c.id] || 0) / Math.max(1, members)) * 100), label: c.title, mode: c.mode })))) : null),
        e('section', 'tx-card tx-span3', { 'aria-label': 'Thinking mode practice' }, hdr('Thinking mode practice', 'Completed activities that exercised each mode. Exposure, not ability.'),
          supp || !ins ? e('p', 'tx-muted', null, 'Appears once enough people have started.') : e('div', 'tx-stack', { style: { gap: 10 } }, C.MODE_ORDER.concat(['integrated']).map((m) => e('div', null, { key: m, style: modeStyle(m) }, e('div', 'tx-tally', e(ModeChip, { mode: m }), e('strong', null, { style: { textAlign: 'right' } }, String(modes[m] || 0))), e(Bar, { pct: ((modes[m] || 0) / maxMode) * 100, mode: m, label: MODES[m].name + ' practice' })))),
          !supp && ins ? e('p', 'tx-muted tx-sm', { style: { marginTop: 10 } }, 'Counts are completed lessons, challenges and shared sessions per person. Shared sessions count towards all four modes.') : null),
        e('section', 'tx-card tx-span3', { 'aria-label': 'Participation' }, hdr('Participation'),
          e('div', 'tx-row', { style: { gap: 24 } }, e('div', null, e('div', 'tx-big', null, ins ? String(ins.participants) : '–'), e('div', 'tx-muted tx-sm', null, 'of ' + members + ' members have started')),
            !supp && ins ? e('div', null, e('div', 'tx-big', null, String(ins.active_7d || 0)), e('div', 'tx-muted tx-sm', null, 'active in the last 7 days')) : null),
          !supp && weekly.length ? e('div', null, e('div', 'tx-muted tx-sm', { style: { margin: '14px 0 6px' } }, 'Completed activities per week'), e('div', 'tx-spark', { role: 'img', 'aria-label': 'Weekly completed activities: ' + weekly.map((w) => w.n).join(', ') }, weekly.map((w) => e('span', null, { key: w.week, title: w.week + ': ' + w.n, style: { height: Math.max(4, (w.n / maxW) * 100) + '%' } })))) : null),
        e('section', 'tx-card tx-span3', { 'aria-label': 'Integration progress' }, hdr('Integration progress', 'Is the team moving from single-mode exercises towards integrated thinking?'),
          supp || !ins ? e('p', 'tx-muted', null, 'Appears once enough people have started.') : e('div', 'tx-stack', { style: { gap: 10 } },
            [['Single-mode exercises completed', isolated, 'Lessons 3–6 and Challenges 1–4'], ['Integrated lessons and challenges completed', integratedA, 'Lessons 7–8 and Challenge 5'], ['Shared sessions finished', shared, (sess.room_completed || 0) + ' Thinking Room · ' + (sess.lab_completed || 0) + ' Decision Lab']].map(([l, n, s]) => e('div', 'tx-row', { key: l, style: { justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', paddingTop: 8 } }, e('div', null, e('div', null, { style: { fontWeight: 700 } }, l), e('div', 'tx-muted tx-sm', null, s)), e('strong', null, { style: { fontSize: 24 } }, String(n)))))),
        e('section', 'tx-card tx-card--tint tx-span6', { 'aria-label': 'Team development summary' }, hdr('Team development summary'),
          !ins ? e('p', null, null, 'Not available right now.') : e('div', 'tx-stack', { style: { gap: 6, fontSize: 17 } },
            e('p', null, null, ins.participants + ' of ' + members + ' team members have started the programme' + (supp ? '.' : ' and ' + (ins.active_7d || 0) + ' were active in the last week.')),
            !supp ? e('p', null, null, 'Together the team has completed ' + Object.keys(comp).filter((k) => k.indexOf('lesson:') === 0).reduce((s, k) => s + comp[k], 0) + ' lesson completions and ' + Object.keys(comp).filter((k) => k.indexOf('challenge:') === 0).reduce((s, k) => s + comp[k], 0) + ' challenge completions.') : null,
            e('p', null, null, shared ? 'The team has finished ' + shared + ' shared session' + (shared === 1 ? '' : 's') + ': ' + (sess.room_completed || 0) + ' in the Thinking Room and ' + (sess.lab_completed || 0) + ' in the Decision Lab.' : 'No shared sessions have been finished yet.'),
            ctx.ov && ctx.ov.completed ? e('p', null, null, ctx.ov.completed + ' baseline assessment' + (ctx.ov.completed === 1 ? '' : 's') + ' completed. Aggregate assessment results are shown below once enough people have completed it.') : null))),
      legacy && legacy.results ? e('div', null, e('div', 'tx-eyebrow', { style: { margin: '12px 0 8px' } }, 'Assessment results'), legacy.results()) : null);
  }

  // ====================================================================
  // Entry point used by the dashboard
  // ====================================================================
  const TAB_LABELS = [['home', 'Overview'], ['journey', 'Learning Journey'], ['room', 'Thinking Room'], ['challenges', 'Challenges'], ['lab', 'Decision Lab'], ['results', 'Insights']];
  const TAB_KEYS = TAB_LABELS.map((t) => t[0]);

  function Section({ tab, ctx, legacy }) {
    useStyles();
    const c = ctx;
    c.goTo = (k) => { c.close(); if (k === 'room' || k === 'lab') c.setTab(k); else if (k) { const it = C.byId(k); if (it) c.open({ kind: it.kind, ref: it.id }); } };
    if (c.loading) return e('div', 'tx tx-card', { role: 'status' }, 'Loading...');
    if (c.unavailable) return e('div', 'tx tx-stack', e('div', 'tx-card', e('div', 'tx-eyebrow', null, 'Team experience'),
      e(Msg, { kind: 'err' }, c.lead ? 'The team experience is not enabled on the database yet. Run migration_team_experience.sql in the Supabase SQL editor, then reload.' : 'The team experience is not available right now. Please try again later.')),
      tab === 'results' && legacy && legacy.results ? legacy.results() : null);
    if (c.active) {
      const a = c.active; const def = C.byId(a.ref);
      if (def) return e('div', 'tx', null, e(Runner, { key: a.kind + a.ref, ctx: c, kind: a.kind, refId: a.ref, def, onExit: () => { c.close(); c.reload(); }, exitLabel: a.kind === 'lesson' ? 'Back to Learning Journey' : 'Back to Challenges' }));
    }
    let body = null;
    if (tab === 'home') body = e(Overview, { ctx: c, legacy });
    else if (tab === 'journey') body = e(Journey, { ctx: c, legacy });
    else if (tab === 'room') body = e(SessionHub, { key: 'room', ctx: c, kind: 'room' });
    else if (tab === 'lab') body = e(SessionHub, { key: 'lab', ctx: c, kind: 'lab' });
    else if (tab === 'challenges') body = e(Challenges, { ctx: c, legacy });
    else if (tab === 'results') body = e(Insights, { ctx: c, legacy });
    return e('div', 'tx', null, body, tab === 'lab' && legacy && legacy.decisions ? e('div', null, { style: { marginTop: 20 } }, e('div', 'tx-eyebrow', { style: { marginBottom: 8 } }, 'Individual decisions shared with the team'), legacy.decisions()) : null);
  }

  window.NF_TEAMX = { useTeamData, Section, TAB_LABELS, TAB_KEYS, useStyles, _pure: { norm, listVals, splitAnswers, stepComplete, classifyScore, tallyEntries, classifyAgreement, aggregateItems, suggestFor, pathState, teamProgress, recordText, fieldDone } };
})();
