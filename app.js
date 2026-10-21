const { useState, useEffect, useCallback, useRef, useMemo } = React;

    // ── Supabase ──────────────────────────────────────────────────────
    const SUPABASE_URL  = "https://ckrxgbosyohcmjtemrvu.supabase.co";
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcnhnYm9zeW9oY21qdGVtcnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzYwNjgsImV4cCI6MjA5NDYxMjA2OH0.imuN5Z-nq_RE7uGckOnqUQgaNtDWT6eq_k2ibkEfq9c";
    const { createClient } = supabase;
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

    // ── Non-blocking notices (replaces alert()) ───────────────────────
    // opts: { type: 'info'|'success'|'error', sticky, actionLabel, onAction }
    function nfNotify(text, opts) {
      opts = opts || {};
      try {
        let host = document.getElementById('nf-notices');
        if (!host) {
          host = document.createElement('div');
          host.id = 'nf-notices';
          host.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:10px;width:min(440px,calc(100vw - 32px));';
          document.body.appendChild(host);
        }
        const box = document.createElement('div');
        box.setAttribute('role', opts.type === 'error' ? 'alert' : 'status');
        const accent = opts.type === 'error' ? '#F87171' : '#C4A050';
        box.style.cssText = 'background:#112240;color:#F5EDD8;border:1px solid ' + accent + ';border-radius:4px;padding:14px 16px;font:14px/1.5 "DM Sans",sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.5);';
        const msg = document.createElement('div');
        msg.textContent = text;
        box.appendChild(msg);
        const close = () => { if (box.parentNode) box.parentNode.removeChild(box); };
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:10px;margin-top:10px;justify-content:flex-end;';
        const mkBtn = (label, onClick, primary) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = label;
          b.style.cssText = 'cursor:pointer;border-radius:3px;padding:6px 14px;font:600 12px "DM Sans",sans-serif;border:1px solid ' + accent + ';' + (primary ? 'background:' + accent + ';color:#050C1A;' : 'background:transparent;color:#F5EDD8;');
          b.addEventListener('click', onClick);
          return b;
        };
        if (opts.actionLabel && typeof opts.onAction === 'function') {
          row.appendChild(mkBtn(opts.actionLabel, () => { close(); opts.onAction(); }, true));
        }
        if (opts.sticky || opts.actionLabel) row.appendChild(mkBtn('Dismiss', close, false));
        if (row.childNodes.length) box.appendChild(row);
        host.appendChild(box);
        if (!opts.sticky) setTimeout(close, 8000);
      } catch (_) {}
    }

    // ── Accessibility: make click-only containers keyboard operable ───
    // Many views attach onClick to div/span/li. This wraps createElement so
    // those elements get role="button", tabIndex=0 and Enter/Space handling.
    // Skipped for: fixed-position backdrops, stopPropagation-only wrappers,
    // and anything with its own role/tabIndex or data-no-a11y.
    (function () {
      const baseCreate = React.createElement;
      React.createElement = function (type, props) {
        if (typeof type === 'string' && (type === 'div' || type === 'span' || type === 'li') &&
            props && typeof props.onClick === 'function' &&
            props.role == null && props.tabIndex == null && !props['data-no-a11y']) {
          const st = props.style || {};
          let skip = st.position === 'fixed';
          if (!skip) {
            const src = Function.prototype.toString.call(props.onClick);
            skip = src.length < 90 && src.indexOf('stopPropagation') !== -1;
          }
          if (!skip) {
            const origKey = props.onKeyDown;
            const origClick = props.onClick;
            const next = Object.assign({}, props, {
              role: 'button',
              tabIndex: 0,
              onKeyDown: function (e) {
                if (typeof origKey === 'function') origKey(e);
                if (e.defaultPrevented || e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); origClick(e); }
              },
            });
            const args = Array.prototype.slice.call(arguments);
            args[1] = next;
            return baseCreate.apply(React, args);
          }
        }
        return baseCreate.apply(React, arguments);
      };
    })();

    // ── Design Tokens: Gold × Navy ───────────────────────────────────
    const C = {
      void: '#050C1A', deep: '#071020', surface: '#0C1A30', panel: '#112240',
      border: 'rgba(196,160,80,0.15)', borderBright: 'rgba(196,160,80,0.35)',
      cyan: '#C4A050', cyanBright: '#E2BE78', cyanDim: 'rgba(196,160,80,0.08)',
      text: '#F5EDD8', muted: '#9A8A6A', dim: '#4A5A78',
      brains: {
        analytical: { color: '#C4A050', dim: 'rgba(196,160,80,0.12)',  label: 'Analytical thinking', code: 'A', symbol: '◰' },
        intuitive:  { color: '#E2BE78', dim: 'rgba(226,190,120,0.12)', label: 'Intuitive thinking',  code: 'I', symbol: '◱' },
        associative:{ color: '#7AAFCF', dim: 'rgba(122,175,207,0.12)', label: 'Associative thinking',code: 'S', symbol: '◲' },
        reflective: { color: '#D4AF6A', dim: 'rgba(212,175,106,0.12)', label: 'Reflective thinking', code: 'R', symbol: '◳' },
        // Not a fifth brain: the CFI's pressure/overload item (dim E). Kept visually distinct
        // so it's never mistaken for the Analytical brain it used to silently fall back to.
        integration:{ color: '#8B8FA3', dim: 'rgba(139,143,163,0.12)',  label: 'Integration',     code: 'E', symbol: '◈' },
      }
    };

    // ── Brand Identity: NF Monogram ─────────────────────────────────────
    // Primary brand mark. Geometric N + F sharing a single stem - the
    // visual metaphor for "fusion": multiple thinking systems integrated
    // into one operating mark. Sharp edges, no gradients, no glow.
    const NF_GOLD = '#C8A24D';
    function NFMark({ size = 32, color = NF_GOLD, title = 'NeuralFusion' }) {
      return React.createElement(
        "svg",
        { width: size, height: size, viewBox: "0 0 100 100", role: "img", "aria-label": title, style: { flexShrink: 0, display: 'block' } },
        React.createElement("rect", { x: 13, y: 13, width: 14, height: 74, fill: color }),
        React.createElement("polygon", { points: "27,13 41,13 71,87 57,87", fill: color }),
        React.createElement("rect", { x: 57, y: 13, width: 14, height: 74, fill: color }),
        React.createElement("rect", { x: 57, y: 13, width: 30, height: 14, fill: color }),
        React.createElement("rect", { x: 57, y: 44, width: 24, height: 14, fill: color })
      );
    }
    // Icon on a dark square badge - for contexts needing a self-contained
    // mark (cards, loading states, standalone app-icon-style usage).
    // Horizontal lockup: icon + wordmark, vertically centered, consistent
    // gap. Used in the primary nav. Collapses to icon-only via CSS below
    // a set breakpoint (see .nf-lockup-text in style.css).
    function NFLogoLockup({ iconSize = 30, gap = 12, wordmarkColor = '#F5EDD8', tagline, taglineColor = '#9A8A6A' }) {
      return React.createElement(
        "div",
        { className: "nf-lockup", style: { display: 'flex', alignItems: 'center', gap } },
        React.createElement(NFMark, { size: iconSize }),
        React.createElement(
          "div",
          { className: "nf-lockup-text", style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 } },
          React.createElement("div", { style: { fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: '0.06em', color: wordmarkColor, lineHeight: 1.15, whiteSpace: 'nowrap' } }, 'NEURALFUSION', React.createElement("sup", { style: { fontSize: '0.5em', marginLeft: 1 } }, '')),
          tagline && React.createElement("div", { style: { fontFamily: "'Space Mono', monospace", fontSize: 10.5, letterSpacing: '0.08em', color: taglineColor, marginTop: 2, whiteSpace: 'nowrap' } }, tagline)
        )
      );
    }

    // ── Admin Config ──────────────────────────────────────────────────
    // Admin access is enforced server-side via profiles.is_admin (Supabase RLS).
    // No credentials are stored in the client bundle.


    // ── Currency Reference ────────────────────────────────────────────
    // All prices are charged and settled in Naira via Paystack. This is only
    // an approximate USD reference so international visitors aren't left
    // guessing what a price means, it is NOT used for any actual charge.
    // Update NGN_PER_USD periodically to keep the estimate reasonable.
    const NGN_PER_USD = 1500;
    const usdApprox = (kobo) => `~$${Math.round((kobo/100)/NGN_PER_USD).toLocaleString()} USD`;

    const syne = { fontFamily: "'Syne', sans-serif" };
    const mono = { fontFamily: "'Space Mono', monospace" };
    const inter = { fontFamily: "'DM Sans', sans-serif" };

    // ── Four Brains Data ──────────────────────────────────────────────

    // ── CFI Assessment Items: CFI-1.0, canonical 13-item instrument 
    // One instrument for everyone (individuals and teams). It replaces the drifted 15/16-item
    // versions. Dimension letters use the app's A/I/S/R/E scheme so
    // CFI_SECTIONS, CFI_DIMENSION_META, and the brainMap below stay unchanged:
    //   Dim A "Decision Latency"      → A "analytical"
    //   Dim B "Mode Rigidity"         → I "intuitive"
    //   Dim C "Emotional Reactivity"  → R "reflective"
    //   Dim D "Thought Interruption"  → S "associative"
    //   Dim E "Cognitive Overload"    → E "integration" (not a fifth brain, see dominantBrain calc)
    const CFI_ITEMS = [
      { id:1,  dim:'A', brain:'analytical',  text:'I delay making decisions even when I have sufficient information.' },
      { id:2,  dim:'A', brain:'analytical',  text:'I reconsider decisions I have already made even when no new information is available.' },
      { id:3,  dim:'A', brain:'analytical',  text:'When facing a decision under time pressure, my thinking becomes unclear.' },
      { id:4,  dim:'I', brain:'intuitive',   text:'I rely on facts and logic alone, even when something tells me to think differently.' },
      { id:5,  dim:'I', brain:'intuitive',   text:'I act on gut feelings without pausing to examine the evidence behind them.' },
      { id:6,  dim:'I', brain:'intuitive',   text:'I find it difficult to shift my thinking approach once I have started working on a problem.' },
      { id:7,  dim:'R', brain:'reflective',  text:'Strong emotions make my thinking less clear.' },
      { id:8,  dim:'R', brain:'reflective',  text:'I make decisions I later regret when I am under emotional pressure.' },
      { id:9,  dim:'R', brain:'reflective',  text:'I am able to remain mentally focused even when the situation feels stressful.', reversed:true },
      { id:10, dim:'S', brain:'associative', text:'My thinking gets interrupted by unrelated thoughts when I am trying to focus.' },
      { id:11, dim:'S', brain:'associative', text:'I experience competing thoughts when trying to reach a clear conclusion.' },
      { id:12, dim:'S', brain:'associative', text:'After completing a task, my thoughts feel organised and settled.', reversed:true },
      { id:13, dim:'E', brain:'integration', text:'When I am presented with too much information at once, my thinking becomes disorganised.' },
    ];
    // 13 items, each scored 1–5. Raw total range: 13 (best) – 65 (worst).
    // Items 9 and 12 are reverse-scored (`reversed:true`): scoring well there is a
    // *strength*, not fragmentation, so the raw 1–5 answer is inverted (6 - value)
    // everywhere fragmentation totals are computed.

    // ── CFI Section Intros ──────────────────────────────────────────────
    // FIX (audit findings B/#5/#6/#7): titles and blurbs rewritten to describe what the
    // items in each section actually ask about, rather than the broader trait the section
    // used to imply. See CFI_Audit_Report Section B for the item-by-item mapping.
    const CFI_SECTIONS = {
      A: { title:'Clear, Logical Thinking', icon:'◰', color:'#C4A050',
           blurb:"These questions look at how decisive and clear your thinking stays, especially when you're under time pressure to decide." },
      I: { title:'Instinct vs. Logic Flexibility', icon:'◱', color:'#E2BE78',
           blurb:"These questions look at whether you can move between logic and gut instinct, or tend to get stuck relying on only one of them even when it isn't working." },
      S: { title:'Focus & Mental Interruptions', icon:'◲', color:'#7AAFCF',
           blurb:"These questions look at how often unrelated or competing thoughts interrupt your focus, and whether your mind feels settled once a task is done." },
      R: { title:'Emotional Clarity Under Pressure', icon:'◳', color:'#D4AF6A',
           blurb:"These questions look at how much strong emotions affect your clarity and decisions, and whether you can stay focused when things feel stressful." },
      E: { title:'Staying Steady Under Pressure', icon:'◈', color:'#F5EDD8',
           blurb:"Last section, just one question. It looks at how your thinking holds up when you're given a lot of information at once. Because it's a single question, treat this section as a narrow snapshot, not a full picture." },
    };
    const CFI_SECTION_ORDER = ['A','I','S','R','E'];

    // ── CFI Dimension Content Library ───────────────────────────────────
    // Every dimension score is paired with plain-language meaning, strengths,
    // blind spots, decision style, behaviour under pressure, and 3 practical actions.
    // FIX (audit findings B/#5/#6/#7/#10): every block below was rewritten to describe
    // only what its 3 items (or, for E, its single item) actually ask about: decision
    // delay/reconsideration/clarity-under-pressure for A, logic-vs-gut rigidity for I,
    // attentional interruption for S, and emotional reactivity for R. Claims about
    // reasoning ability, creativity, intuition quality, and metacognition that the old
    // copy implied but that no item measures have been removed. See CFI_Audit_Report
    // Section B for the full item-to-construct mapping this rewrite is based on.
    const CFI_DIMENSION_META = {
      A: {
        name: 'Clear, Logical Thinking', brainKey:'analytical',
        strengths: ['Can decide without much delay once you have enough information', "Doesn't tend to reopen decisions without a new reason to", 'Thinking mostly stays clear even when a decision is time-pressured'],
        blindSpots: ['Can delay deciding even with enough information in hand', 'May reconsider a settled decision without any new information', 'Thinking can turn unclear specifically when a decision is time-pressured'],
        meaning: {
          high: "You tend to decide without much delay once you have enough information, and time pressure has a limited effect on your clarity.",
          moderate: "You sometimes delay or reconsider decisions, and time pressure occasionally makes your thinking less clear.",
          low: "Right now you often delay deciding, reconsider decisions you've already made, and time pressure regularly makes your thinking unclear. This is common, and trainable.",
        },
        decisionStyle: {
          high: "You commit to a decision once you have enough information, and you don't tend to relitigate it later.",
          moderate: 'You can commit to decisions, but you sometimes revisit them without anything new prompting it.',
          low: 'You tend to stall or reopen decisions, often without a clear reason to.',
        },
        underPressure: {
          high: 'Time pressure has a limited effect on how clearly you think.',
          moderate: 'Time pressure sometimes clouds your thinking, though you usually still reach a decision.',
          low: 'Time pressure tends to make your thinking noticeably less clear.',
        },
        improvements: [
          'Give yourself a hard deadline to decide once you have the key facts.',
          "If you catch yourself reconsidering a decision, ask first whether anything actually changed.",
          'Practice making one low-stakes decision daily under a short time limit.',
        ],
      },
      I: {
        name: 'Instinct vs. Logic Flexibility', brainKey:'intuitive',
        strengths: ['Can lean on logic and evidence when a situation calls for it', 'Can act on a gut read when speed matters', "Doesn't get permanently stuck in one approach once it stops working"],
        blindSpots: ['May rely on facts and logic alone even when something else is telling you differently', 'May act on gut feelings without pausing to check them against evidence', "Can find it difficult to shift approach once you've started working a problem"],
        meaning: {
          high: "You can move between logic and instinct depending on the situation, without getting stuck committed to one approach.",
          moderate: "You lean more on one of logic or instinct, and sometimes find it hard to switch once you've started.",
          low: "Right now you tend to get stuck in one way of thinking, either overriding useful signals with pure logic, or acting on gut feelings without checking them, and switching approach mid-problem is difficult.",
        },
        decisionStyle: {
          high: "You bring in whichever of logic or instinct fits the decision, and adjust if your first approach isn't working.",
          moderate: 'You tend to default to one approach, and switching takes deliberate effort.',
          low: 'You commit early to either pure logic or pure instinct and rarely revisit that choice mid-decision.',
        },
        underPressure: {
          high: "Pressure doesn't lock you into one approach.",
          moderate: "Pressure makes it harder to switch approaches if your first one isn't working.",
          low: "Under pressure you're most likely to get stuck in whichever way of thinking you started in.",
        },
        improvements: [
          "When a decision feels stuck, deliberately try the other approach: if you've been logical, ask what your gut says, and vice versa.",
          'Before acting on a gut feeling, name one piece of evidence that supports or challenges it.',
          'Notice the moment you feel resistant to changing approach mid-problem, and pause there.',
        ],
      },
      S: {
        name: 'Focus & Mental Interruptions', brainKey:'associative',
        strengths: ['Can hold a single train of thought without much interference', 'Mind tends to feel settled once a task is finished', 'Fewer competing thoughts getting in the way of reaching a conclusion'],
        blindSpots: ["Unrelated thoughts can interrupt your focus when you're trying to concentrate", 'Competing thoughts can make it harder to reach a clear conclusion', "Thoughts may still feel unsettled after a task is done"],
        meaning: {
          high: "Your focus holds steady: unrelated or competing thoughts rarely derail you, and your mind tends to feel settled once a task is done.",
          moderate: "Your focus holds up reasonably well, but competing or unrelated thoughts sometimes interrupt you, and you don't always feel settled afterward.",
          low: "Right now, unrelated or competing thoughts frequently interrupt your focus, and your mind often doesn't feel settled after finishing a task.",
        },
        decisionStyle: {
          high: 'You can reach a conclusion without much interference from competing thoughts.',
          moderate: 'Competing thoughts sometimes slow you down before you reach a conclusion.',
          low: 'Competing or unrelated thoughts often get in the way before you can reach a clear conclusion.',
        },
        underPressure: {
          high: "Pressure doesn't noticeably increase mental interruptions for you.",
          moderate: 'Pressure makes unrelated thoughts a bit more likely to intrude.',
          low: 'Pressure makes it much harder to hold a single train of thought.',
        },
        improvements: [
          'When an unrelated thought intrudes, jot it down and return to your task instead of following it.',
          'After finishing a task, take one minute to note anything that still feels unfinished, then set it aside.',
          'If competing thoughts are pulling you in different directions, list them out to separate them from each other.',
        ],
      },
      R: {
        name: 'Emotional Clarity Under Pressure', brainKey:'reflective',
        strengths: ['Thinking stays relatively clear even when emotions run high', "Fewer decisions made under emotional pressure that you later regret", 'Can stay mentally focused when a situation feels stressful'],
        blindSpots: ['Strong emotions can make your thinking less clear', "May make decisions under emotional pressure that you later regret", "Stress can pull your focus away from the task at hand"],
        meaning: {
          high: "Strong emotions have a limited effect on your clarity, and you can generally stay focused even when a situation feels stressful.",
          moderate: "Emotions sometimes cloud your thinking, and stress occasionally pulls your focus, though you can usually recover.",
          low: "Right now, strong emotions frequently reduce your clarity, and stressful situations often pull your focus and lead to decisions you later regret.",
        },
        decisionStyle: {
          high: "Emotional pressure doesn't strongly steer your decisions.",
          moderate: "Emotional pressure sometimes shapes a decision more than you'd like.",
          low: 'Decisions made under emotional pressure are more likely to be ones you regret later.',
        },
        underPressure: {
          high: 'You stay mentally focused even when a situation feels stressful.',
          moderate: 'Stress pulls at your focus, though you can usually pull it back.',
          low: 'Stress tends to overwhelm your focus and clarity.',
        },
        improvements: [
          "Before deciding under emotional pressure, pause and name the emotion you're feeling.",
          'If a decision feels emotionally charged, give it a short cooling-off period before acting.',
          'Notice the specific situations where stress most often affects your focus, and plan for them in advance.',
        ],
      },
      E: {
        // FIX (audit finding C / Section C): this dimension is built from ONE item, not
        // 3 like the others. It previously carried six distinct claims (integration,
        // staying steady under pressure, mode-switching, perspective, recovery, mode
        // selection) that a single 5-point question cannot support. Content below is
        // narrowed to only what the item actually asks: reaction to high information
        // volume, with an explicit single-item caveat kept in every string so the
        // limitation travels with the text wherever it's displayed.
        name: 'Handling Information Overload (single-item snapshot)', brainKey:null,
        strengths: ["Reported feeling relatively organized when given a lot of information at once; based on one question, treat as a rough signal only"],
        blindSpots: ["Reported feeling disorganized when given a lot of information at once; based on one question, treat as a rough signal only"],
        meaning: {
          high: "Based on a single question, you reported feeling relatively organized even when given a lot of information at once. This is a narrow, single-item signal, not a full profile of how you handle pressure.",
          moderate: "Based on a single question, you reported some disorganization when given a lot of information at once. Treat this as a rough signal rather than a firm conclusion.",
          low: "Based on a single question, you reported that too much information at once tends to leave your thinking disorganized. Treat this as a rough signal rather than a firm conclusion.",
        },
        decisionStyle: {
          high: "This dimension is based on one question and isn't detailed enough to describe a decision style.",
          moderate: "This dimension is based on one question and isn't detailed enough to describe a decision style.",
          low: "This dimension is based on one question and isn't detailed enough to describe a decision style.",
        },
        underPressure: {
          high: "You reported handling a high volume of information reasonably well (single-item measure).",
          moderate: "You reported some difficulty handling a high volume of information (single-item measure).",
          low: "You reported that a high volume of information tends to disorganize your thinking (single-item measure).",
        },
        improvements: [
          'If a large volume of information often leaves you disorganized, try breaking it into smaller chunks before deciding.',
          'Ask for a short summary or the top few points before diving into a large amount of information.',
          'Build in a short pause to reorganize your thoughts before responding to information overload.',
        ],
      },
    };

    const CFI_DIM_LABELS = { A:'Clear, Logical Thinking', I:'Gut Instinct', S:'Creative Connections', R:'Self-Awareness', E:'Staying Steady Under Pressure' };

    // Communication / leadership / learning style, keyed by brain
    const CFI_STYLE_TABLE = {
      analytical:  { communication:'Direct, structured, and fact-based.', leadership:'Leads with clear plans and measurable standards.', learning:'Learns best through step-by-step instruction and structured practice.' },
      intuitive:   { communication:'Concise and confident, sometimes short on detailed explanation.', leadership:'Leads by reading people and situations quickly, adjusting on the fly.', learning:'Learns best through hands-on experience and repeated exposure.' },
      associative: { communication:'Story-driven, uses analogies and big-picture framing.', leadership:'Leads by connecting people and ideas toward a shared vision.', learning:'Learns best by exploring, experimenting, and making unexpected connections.' },
      reflective:  { communication:'Thoughtful and measured, prefers to consider before responding.', leadership:'Leads through consistency, values, and long-term thinking.', learning:'Learns best through reflection, journaling, and reviewing past experience.' },
    };

    // Score → plain-language bucket (0 = perfectly integrated dimension, 100 = fully fragmented)
    function cfiLevel(fragScore) {
      const integ = 100 - fragScore;
      if (integ >= 70) return 'high';
      if (integ >= 40) return 'moderate';
      return 'low';
    }

    function cfiIntegrationScore(total) {
      // total ranges 13 (best) to 65 (worst) across the 13 five-point CFI-1.0 items
      const pct = ((total - 13) / 52) * 100;
      return Math.max(0, Math.min(100, Math.round(100 - pct)));
    }

    function buildDimensionReport(dim, fragScore) {
      const meta = CFI_DIMENSION_META[dim];
      const level = cfiLevel(fragScore);
      const integrationScore = Math.max(0, Math.min(100, 100 - fragScore));
      return {
        dim, name: meta.name, brainKey: meta.brainKey, level, integrationScore, fragScore,
        meaning: meta.meaning[level],
        strengths: meta.strengths,
        blindSpots: meta.blindSpots,
        decisionStyle: meta.decisionStyle[level],
        underPressure: meta.underPressure[level],
        improvements: meta.improvements,
      };
    }

    // Generic explainer for any score, independent of dimension; never show a bare number.
    // FIX (audit finding H): previously framed around how OFTEN / how RELIABLY a mode
    // "contributes to decisions"; no CFI item asks about frequency of use or reliability
    // of contribution; every item asks about self-reported DIFFICULTY in a domain. Reworded
    // to describe only what was actually measured. Never implies a "broken" brain, and
    // never implies 100% is the goal for every mode.

    // Band (internal value, unchanged) → coordination-framed label + one-line description.
    // The underlying `band` string itself (e.g. 'Critical fragmentation') is left exactly
    // as-is everywhere it drives logic (DB writes, admin filters, lesson gating); this
    // mapping only controls what the person actually reads on the results page.
    const CFI_COORDINATION_LABEL = {
      'Integrated':             'Clear and balanced',
      'Moderate fragmentation': 'Mostly clear',
      'High fragmentation':     'Often scattered',
      'Critical fragmentation': 'Very scattered',
    };
    function cfiCoordinationLabel(band) {
      return CFI_COORDINATION_LABEL[band] || band;
    }

    function buildCognitiveProfile(dimReports, integrationScore, band) {
      const core = ['A','I','S','R']; // exclude E (integration), it isn't a standalone way of thinking
      // Best-to-least-frequently-activated, NOT "best brain to worst brain." With four
      // modes: the top mode is Dominant, the middle two are Supporting, and the last is
      // currently Underutilized. Everyone has this shape, by definition.
      const sorted = [...core].sort((a,b)=> dimReports[a].fragScore - dimReports[b].fragScore);
      const primaryDim = sorted[0], secondaryDim = sorted[1], tertiaryDim = sorted[2], weakestDim = sorted[sorted.length-1];
      const primaryBrain = CFI_DIMENSION_META[primaryDim].brainKey;
      const secondaryBrain = CFI_DIMENSION_META[secondaryDim].brainKey;
      const weakestBrain = CFI_DIMENSION_META[weakestDim].brainKey;
      const pStyle = CFI_STYLE_TABLE[primaryBrain] || CFI_STYLE_TABLE.analytical;
      const coordinationLevel = cfiCoordinationLabel(band);

      const dominantModes = [primaryDim];
      const supportingModes = [secondaryDim, tertiaryDim];
      const underutilizedModes = [weakestDim];
      const modeNames = arr => arr.map(d => CFI_DIM_LABELS[d]).join(' and ');

      return {
        integrationScore,
        fragmentationLevel: band, // kept for backward compatibility; raw band value, unchanged
        coordinationLevel,        // new: display-facing label for the same band

        primaryDim, secondaryDim, tertiaryDim, weakestDim,
        primaryBrain, secondaryBrain, weakestBrain,
        primaryStyle: CFI_DIM_LABELS[primaryDim],
        secondaryStyle: CFI_DIM_LABELS[secondaryDim],

        // ── Cognitive Coordination Profile fields ──
        dominantModes: dominantModes.map(d => CFI_DIM_LABELS[d]),
        supportingModes: supportingModes.map(d => CFI_DIM_LABELS[d]),
        underutilizedModes: underutilizedModes.map(d => CFI_DIM_LABELS[d]),
        decisionCoordinationStyle: `You typically lead with ${CFI_DIM_LABELS[primaryDim]}, coordinated with ${modeNames(supportingModes)}. ${dimReports[primaryDim].decisionStyle}`,
        coordinationUnderPressure: dimReports[primaryDim].underPressure,
        decisionBlindSpots: `${CFI_DIM_LABELS[weakestDim]} currently contributes less often than your other modes, so watch for: ${CFI_DIMENSION_META[weakestDim].blindSpots[0].toLowerCase()}`,
        naturalStrengths: `${CFI_DIM_LABELS[primaryDim]}: ${CFI_DIMENSION_META[primaryDim].strengths[0]}`,
        suggestedCoordinationExercise: `${CFI_DIMENSION_META[weakestDim].improvements[0]} This helps ${CFI_DIM_LABELS[weakestDim].toLowerCase()} activate more often, alongside (not instead of) your dominant modes.`,

        // ── Legacy fields (kept for backward compatibility with any existing consumers) ──
        // FIX (audit finding #9 / C): no CFI item measures communication, leadership, or
        // learning behavior at all: these are coaching inferences drawn from whichever
        // dimension has the lowest fragmentation score, not measured findings. Labeled
        // as such inline so the caveat travels with the text wherever it's displayed.
        communicationStyle: `${pStyle.communication} (Coaching interpretation based on your primary mode, not directly measured by the CFI.)`,
        leadershipStyle: `${pStyle.leadership} (Coaching interpretation based on your primary mode, not directly measured by the CFI.)`,
        learningStyle: `${pStyle.learning} (Coaching interpretation based on your primary mode, not directly measured by the CFI.)`,
        decisionProfile: `You lead with ${CFI_DIM_LABELS[primaryDim]}, backed up by ${CFI_DIM_LABELS[secondaryDim]}. ${dimReports[primaryDim].decisionStyle}`,
        biggestStrength: `${CFI_DIM_LABELS[primaryDim]}: ${CFI_DIMENSION_META[primaryDim].strengths[0]}`,
        biggestBlindSpot: `${CFI_DIM_LABELS[weakestDim]}: ${CFI_DIMENSION_META[weakestDim].blindSpots[0]}`,
        biggestOpportunity: `${CFI_DIMENSION_META[weakestDim].improvements[0]}`,

        summary: `Your ways of thinking are currently ${coordinationLevel.toLowerCase()}, with an overall coordination score of ${integrationScore}/100 `
          + `(a scaled self-report score, not a percentile or clinical measure). `
          + `This is not a measure of intelligence. It reflects how well your natural ways of thinking work together right now. `
          + `You naturally lead with ${CFI_DIM_LABELS[primaryDim].toLowerCase()}, supported by ${modeNames(supportingModes).toLowerCase()}. `
          + `${CFI_DIM_LABELS[weakestDim]} is currently underutilized in your decision process. The goal isn't to make it equal to your dominant mode, `
          + `it's to bring it in deliberately when a decision calls for it.`,
      };
    }

    function buildImprovementPlan(dimReports, band) {
      const dims = CFI_SECTION_ORDER;
      const byStrength = [...dims].sort((a,b)=> dimReports[a].fragScore - dimReports[b].fragScore);
      const strong = byStrength.slice(0,3);
      const weak = [...byStrength].reverse().slice(0,3);

      const brainToLesson = { analytical:2, intuitive:5, associative:3, reflective:4 };
      const weakestBrain = CFI_DIMENSION_META[weak[0]].brainKey;
      const recommendedLessonIds = Array.from(new Set([1, brainToLesson[weakestBrain] || 2]));

      const timeByBand = {
        'Integrated': '2–3 weeks to sharpen further',
        'Moderate fragmentation': '3–4 weeks of consistent practice',
        'High fragmentation': '5–6 weeks with daily practice',
        'Critical fragmentation': '6–8 weeks, starting from Lesson 1',
      };
      const weeksByBand = { 'Integrated':14, 'Moderate fragmentation':21, 'High fragmentation':21, 'Critical fragmentation':14 };
      const nextDate = new Date(Date.now() + (weeksByBand[band] || 21) * 24 * 60 * 60 * 1000);

      return {
        topStrengths: strong.map(d => ({ dim:d, name: CFI_DIM_LABELS[d], text: CFI_DIMENSION_META[d].strengths[0] })),
        topGrowthAreas: weak.map(d => ({ dim:d, name: CFI_DIM_LABELS[d], text: CFI_DIMENSION_META[d].improvements[0] })),
        recommendedLessonIds,
        dailyExercise: CFI_DIMENSION_META[weak[0]].improvements[0],
        weeklyRoutine: `Three times this week, run the Core Loop training module (8 min), paying extra attention to your ${CFI_DIM_LABELS[weak[0]].toLowerCase()}.`,
        estimatedTime: timeByBand[band] || '3–4 weeks of consistent practice',
        nextAssessmentDate: nextDate.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }),
      };
    }


    // ── Lesson Data ───────────────────────────────────────────────────
    const LESSONS = [
      { id:1, title:'How your mind works', sub:'Understand your four ways of thinking and how to switch between them.', level:'Foundation', free:true, duration:'25 min', brain:'all' },
      { id:2, title:'Switching how you think', sub:'Move between ways of thinking on purpose.', level:'Intermediate', free:false, duration:'28 min', brain:'analytical' },
      { id:3, title:'Making clearer decisions', sub:'Turn scattered thoughts into one clear decision.', level:'Intermediate', free:false, duration:'32 min', brain:'associative' },
      { id:4, title:'Staying clear under pressure', sub:'Keep a clear head when things get urgent.', level:'Advanced', free:false, duration:'32 min', brain:'reflective' },
      { id:5, title:'Making it a habit', sub:'Turn deliberate effort into something automatic.', level:'Mastery', free:false, duration:'26 min', brain:'intuitive' },
      { id:6, title:'Quick reference', sub:'Glossary, templates, a scorecard and a final check.', level:'Reference', free:false, duration:'30 min', brain:'all' },
    ];

    const LESSON_CONTENT = {
      1: { pages: [
        { title: `Learning Objectives`, body: `By the end of Lesson One, you will be able to:

1. Explain what NeuralFusion is and the specific problem it is designed to solve.
2. Identify each of the Four Brains by name and function.
3. Walk through the four stages of the NeuralFusion Core Loop from memory.
4. Complete a first conscious NeuralFusion cycle on a real issue from your own life.
5. Begin noticing, in real time, which brain is currently active.

WHY THIS LESSON MATTERS

Every advanced skill in this curriculum (synthesis, stabilization, automatic fluency) is built on the foundation established here. If you rush Lesson One, later lessons will feel abstract, because you will be trying to switch and integrate brains you have not yet learned to recognize.

Think of this lesson as installing the map before you learn to navigate. Once you can name what is happening in your own mind, "this is Analytical," "this is Intuitive," you gain the first form of control: the ability to observe your thinking instead of simply being carried by it.` },
        { title: `Cognitive Principles`, body: `Two principles anchor this lesson, and both recur throughout the curriculum.

PRINCIPLE 1: FRAGMENTATION IS THE DEFAULT, NOT THE EXCEPTION

Left untrained, the mind moves between logic, emotion, memory, and impulse in an unstructured way. This is not a personal failing. It is simply what happens when thinking has no deliberate structure applied to it. NeuralFusion calls this cognitive fragmentation: the experience of thinking in disconnected pieces rather than as one coordinated process.

PRINCIPLE 2: INTEGRATION IS TRAINABLE

The Four Brains are not new; every person already uses all four. What NeuralFusion adds is a trainable method for engaging them on purpose, in sequence, so their outputs combine into a single, usable conclusion instead of competing with each other.` },
        { title: `What Is NeuralFusion?`, body: `NeuralFusion is a structured mental skill that trains the brain to combine multiple ways of thinking intentionally, instead of relying on only one at a time.

Most untrained thinking happens in fragments:

· Logic without intuition: decisions that are technically correct but feel wrong, and are later abandoned.
· Creativity without structure: good ideas that never convert into a workable plan.
· Emotion without reflection: reactive choices made under pressure, regretted once the pressure passes.

NeuralFusion teaches you how to fuse these modes into one coordinated thinking loop, so their strengths combine instead of colliding.

KEY TAKEAWAY: NeuralFusion is not intelligence. It is control over intelligence. You already have every raw thinking capacity you need. This system trains you to direct it.` },
        { title: `The Problem NeuralFusion Solves`, body: `The modern mind is exposed to more information, more competing demands, and more emotional pressure than at almost any point in human history. Left unmanaged, this produces five recognizable symptoms:

1. Overthinking: circling the same decision without reaching resolution.
2. Mental confusion: difficulty locating a clear next step, even on familiar problems.
3. Poor decisions: choices driven by whichever brain is loudest in the moment, not the one best suited to the problem.
4. Emotional reactivity: responding to pressure instead of to the actual situation.
5. Inconsistent focus: attention that shifts randomly rather than by intention.

These symptoms share a single root cause: the brain is switching modes randomly, without a structure to organize the switch. NeuralFusion introduces that structure.` },
        { title: `The Four Brains, Revisited`, body: `NeuralFusion works by consciously activating and integrating four natural ways of thinking that every person already possesses:

▰ ANALYTICAL: Logic, structure, and facts. The mode of breakdown, planning, and precision.

▱ INTUITIVE: Gut feeling, insight, and pattern recognition. The mode of fast judgment and direction.

▲ ASSOCIATIVE: Creativity, connection, and idea generation. The mode of expansion and new options.

△ REFLECTIVE: Self-awareness, evaluation, and meaning. The mode of learning and long-term perspective.

Every human being has access to all four brains. Very few people are ever taught to coordinate them on purpose; most simply default to whichever mode habit, mood, or urgency selects for them.` },
        { title: `The NeuralFusion Core Loop`, body: `NeuralFusion operates through a simple, repeatable four-stage loop:

1. DECOMPOSITION: Break the problem or thought into clear, separate parts.
2. MODE SWITCHING: Intentionally activate the brain best suited to each part.
3. SYNTHESIS: Combine the outputs of each brain into one unified insight.
4. STABILIZATION: Lock in the resulting clarity and reduce mental noise.

With training, this loop can be completed in under a minute. At the beginner stage, expect it to take several minutes. Speed comes later, in Lesson Five.` },
        { title: `Real-World Applications`, body: `BUSINESS: A founder is deciding whether to raise external funding. Analytical reviews the numbers. Intuitive surfaces unease about losing independence. Associative generates a middle option: a smaller raise from aligned investors. Reflective asks what kind of company the founder actually wants to build. Synthesis merges these into one direction; stabilization locks it in.

LEADERSHIP: A manager must decide whether to address a team conflict directly or let it resolve on its own. Analytical weighs delivery timelines. Intuitive senses that avoidance will make it worse. Associative considers a facilitated conversation. Reflective asks what kind of leader this decision reflects.

STUDENT: A student is choosing between two elective courses. Analytical compares workload and grading. Intuitive notices genuine excitement about one subject. Associative considers how each connects to future goals. Reflective asks which choice will still feel right in a year.

DAILY LIFE: Someone is deciding how to respond to a frustrating text message. Analytical reviews what was actually said. Intuitive notices the emotional charge. Associative considers alternative interpretations. Reflective asks what response actually serves the relationship.` },
        { title: `Try It Now`, body: `Pick one of the four examples above that most resembles a situation in your own life right now.

Write one sentence for what each brain, Analytical, Intuitive, Associative, Reflective, would say about it.

Notice which brain you would have defaulted to if you had not paused to check the other three.` },
        { title: `First Guided Practice: Conscious Thought Control`, body: `This is your first full pass through the NeuralFusion Core Loop. Use a real issue: something mildly unresolved in your life right now, not a hypothetical.

WORKSHEET

1. Sit comfortably and relax your body for a few breaths.
2. Choose a simple issue you are currently facing.
3. Decomposition: write the issue in one sentence.
4. Analytical: list facts only, no emotion, no interpretation.
5. Intuitive: pause, then write your immediate gut response.
6. Associative: write three ideas or connections related to the issue.
7. Reflective: ask, "What does this teach me?" and write the answer.
8. Observe how your sense of clarity has changed compared to when you started.

EXPERT TIP: Write your answers down rather than doing this exercise purely in your head. The act of writing forces true mode separation; without it, brains tend to blur together.` },
        { title: `Reflection Questions & Practice Exercises`, body: `REFLECTION QUESTIONS

· Which of the four brains did you notice yourself using most often today, before reading this lesson?
· Which brain do you tend to trust the least, and why?
· Describe a recent decision that might have gone differently if you had consciously used all four brains.
· What does "mental leadership" mean to you after completing the first guided practice?

EXERCISE A: MODE NAMING
Throughout one full day, pause five separate times and silently name which brain is currently active. No action is required beyond naming it; this builds raw awareness, the prerequisite for all later control.

EXERCISE B: THE ONE-SENTENCE DECOMPOSITION
Take any problem that feels overwhelming and force yourself to write it as a single sentence. Notice how much of the overwhelm was actually the problem itself, versus the absence of decomposition.

DECISION DRILL: LOW-STAKES FUSION
Choose a low-stakes decision you would normally make instantly. Deliberately run it through all four brains before deciding. The goal is not a better decision; it is building the habit of consulting all four.` },
        { title: `Common Mistakes & Success Indicators`, body: `COMMON MISTAKES

· Treating this as a one-time exercise rather than a repeatable skill; awareness fades quickly without practice.
· Skipping the writing step and trying to do the loop entirely in your head, which allows brains to blur together.
· Judging your gut response (Intuitive) as "wrong" before giving it a fair hearing alongside the other brains.
· Expecting instant speed; at the beginner stage, a slow, deliberate loop is the goal, not a fast one.

SUCCESS INDICATORS

· You can name, without hesitation, all four brains and their core function.
· You catch yourself mid-thought and can identify which brain you are currently in.
· The one-sentence decomposition step feels clarifying rather than reductive.
· You completed the full guided practice worksheet on a real issue, not a hypothetical one.` },
        { title: `Key Insight, Recap & Assignment`, body: `KEY INSIGHT: You are not your thoughts. You are the conductor of them. NeuralFusion trains mental leadership: the ability to direct thinking rather than be directed by it.

END-OF-LESSON RECAP

· NeuralFusion is a trainable skill that fuses four natural brains into one coordinated process.
· Fragmented thinking produces overthinking, confusion, and poor decisions.
· The Four Brains are Analytical, Intuitive, Associative, and Reflective.
· The Core Loop, Decomposition, Mode Switching, Synthesis, Stabilization, is the engine of every later lesson.
· Awareness of your current brain is the first and most essential form of control.

ASSIGNMENT (Next 24 Hours)

1. Observe when your thinking becomes chaotic or overwhelmed.
2. Pause and ask: "Which brain am I stuck in?"
3. Write one short reflection on what you noticed.

No perfection is required at this stage. Awareness itself is progress.` }
      ]},
      2: { pages: [
        { title: `Learning Objectives`, body: `By the end of Lesson Two, you will be able to:

1. Recognize your dominant, default brain without conscious effort.
2. Enter and exit any of the Four Brains on command, using a specific activation question.
3. Identify the risk of overusing any single brain and correct for it.
4. Apply the Emergency Reset protocol to interrupt mental overload within a minute.

WHY THIS LESSON MATTERS

Lesson One taught you to notice which brain is active. Lesson Two teaches you to choose it. This is the difference between observing your weather and being able to change it. Without this skill, awareness alone can become a passive habit: you notice you are overthinking, but you stay stuck in it. Mode activation gives you the lever to move.` },
        { title: `Cognitive Principles & The Core Truth`, body: `PRINCIPLE 1: REACTION IS THE DEFAULT STATE

Most people do not think; they react. Thoughts appear automatically because the brain defaults to habit, emotion, or urgency rather than deliberate selection. This is efficient for survival, but poorly suited to complex modern decisions.

PRINCIPLE 2: CONTROL BEGINS AT THE POINT OF CHOICE

NeuralFusion replaces reaction with activation. Control does not begin when a decision is made; it begins the moment you choose how to think about the situation in the first place.

KEY TAKEAWAY: Reaction is automatic. Activation is chosen. Every time you pause before a default thought pattern takes over, you are practicing NeuralFusion.` },
        { title: `Each Brain: Best Use & Overuse Risk`, body: `Lesson One introduced the four brains by function. Lesson Two adds a second dimension: what each brain is best used for, and the specific risk that appears when it is overused.

▰ ANALYTICAL (Precision): Best for decisions, planning, and problem breakdown. Overused, it produces rigidity and overthinking.

▱ INTUITIVE (Insight): Best for fast judgment, pattern sensing, and direction. Overused, it produces impulsiveness.

▲ ASSOCIATIVE (Expansion): Best for creativity, new ideas, and connections. Overused, it produces distraction.

△ REFLECTIVE (Meaning): Best for self-awareness, evaluation, and learning. Overused, it produces rumination.

NeuralFusion is not about staying in one brain. It is about moving between all four deliberately, spending only as much time in each as the situation actually requires.` },
        { title: `Mode Activation Signals`, body: `Each brain has a mental entry signal: a specific question that reliably switches your brain into that mode. Learning these signals is what gives you control.

▰ ANALYTICAL: "What are the facts?"

▱ INTUITIVE: Pause, then ask, "What feels correct?"

▲ ASSOCIATIVE: "What else is this connected to?"

△ REFLECTIVE: "What does this mean for me?"

Questions are switches. Asking the right question is often enough, on its own, to shift which part of your mind is doing the work.` },
        { title: `Real-World Applications`, body: `BUSINESS: A sales lead has gone quiet after weeks of promising conversation. The default reaction is anxious rumination, Reflective overused, spiraling. Applying the Analytical activation question interrupts the spiral: the facts are that the deal is delayed, not dead.

LEADERSHIP: A manager receives a sharply worded email from a senior stakeholder. The default reaction is Intuitive alarm. Deliberately activating Analytical mode reveals the email is blunt in tone but not actually escalatory in content.

STUDENT: A student receives a lower grade than expected and drops into Reflective rumination about their ability. Activating Associative mode surfaces a more useful angle: a fixable skill gap, not a fixed trait.

DAILY LIFE: Someone feels a sudden urge to buy something impulsively while browsing online, Intuitive running unchecked. Activating Reflective mode creates enough of a pause to notice the impulse is about boredom, not need.` },
        { title: `Try It Now`, body: `Recall the last time you felt "stuck" in a thought loop.

Identify which brain you were likely overusing, using the risk list above.

Say the activation question for a different brain out loud, right now, and notice the shift.` },
        { title: `The NeuralFusion Switching Drill`, body: `This drill builds mode awareness by deliberately spending time in each of the four brains, back to back, on the same neutral topic.

WORKSHEET: 7 MINUTES

1. Sit upright and breathe slowly for a few seconds.
2. Choose a neutral topic, for example, your day so far.
3. Spend 60 seconds in Analytical mode: facts only.
4. Spend 60 seconds in Intuitive mode: your gut response.
5. Spend 60 seconds in Associative mode: ideas and connections.
6. Spend 60 seconds in Reflective mode: meaning or lesson.
7. Spend the remaining time noticing the distinct mental "texture" of each mode.

EXPERT TIP: The goal is not the content you produce; it is building a felt sense of what each brain is like from the inside, so you can recognize it instantly in real situations.` },
        { title: `Stopping Mental Overload: The Emergency Reset`, body: `When thoughts feel overwhelming, use this four-step protocol:

1. Pause.
2. Name the brain you are stuck in.
3. Switch deliberately to Reflective mode.
4. Ask: "What is one thing I can control right now?"

This collapses noise into clarity by forcing a single, small, actionable focus, Reflective mode's natural function.

KEY TAKEAWAY: Mental freedom is the ability to switch your thoughts, not escape them. NeuralFusion gives you that freedom through the Emergency Reset.` },
        { title: `Reflection Questions & Practice Exercises`, body: `REFLECTION QUESTIONS

· What is your default brain, and in which situations does it serve you least well?
· Which activation question was hardest for you to use naturally? What made it difficult?
· Describe a moment this week when the Emergency Reset would have helped, in hindsight.
· How did the "texture" of each brain feel different during the Switching Drill?

EXERCISE A: FORCED MODE ENTRY
Three times today, deliberately activate a brain you are not currently in, using its activation question, regardless of the situation.

DECISION DRILL: OVERUSE DETECTION
Look back at a recent decision that did not go well. Identify which brain was likely overused. Name what the opposite, underused brain would have contributed.

MENTAL TRAINING ACTIVITY: THE RESET REHEARSAL
Even when not overwhelmed, rehearse the Emergency Reset once per day so it is already familiar when you actually need it under pressure.` },
        { title: `Common Mistakes & Success Indicators`, body: `COMMON MISTAKES

· Waiting until overload is severe before attempting the Emergency Reset; it works best used early.
· Treating one brain as "better" than the others rather than situational.
· Skipping the naming step in the Emergency Reset; naming the brain is what creates the separation needed to switch out of it.
· Practicing the Switching Drill only once instead of repeating it until transitions feel distinct.

SUCCESS INDICATORS

· You can identify your default brain without needing to think hard about it.
· You have used at least one activation question in a real, unplanned situation this week.
· You can recite the Emergency Reset from memory.
· You notice mode dominance, your own or observed in others, more often in daily life.` },
        { title: `Recap & Assignment`, body: `END-OF-LESSON RECAP

· Mental control begins at the point of choice, not after a thought has already run its course.
· Each brain has a best use and a risk when overused: rigidity, impulsiveness, distraction, or rumination.
· Each brain has a specific activation question that reliably switches you into it.
· The Emergency Reset, Pause, Name, Switch to Reflective, Ask what you can control, interrupts overload in under a minute.

ASSIGNMENT (Next 48 Hours)

1. Identify your default brain in three separate situations.
2. Practice switching brain deliberately at least once per day.
3. Write one sentence on what changed as a result.

Consistency builds mastery. A single successful switch matters less than repeating the practice across multiple days.` }
      ]},
      3: { pages: [
        { title: `Learning Objectives`, body: `By the end of Lesson Three, you will be able to:

1. Explain why most decisions fail, in NeuralFusion terms.
2. Define synthesis as integration rather than compromise.
3. Apply the four-step Synthesis Framework: Extract, Align, Compress, Decide.
4. Use the Commitment Lock to convert a decision into stable action.
5. Respond to post-decision doubt without breaking a completed synthesis.

WHY THIS LESSON MATTERS

Lessons One and Two built awareness and control of individual brains. Lesson Three is where those separate skills become useful: converting multiple, sometimes contradictory, streams of thought into one decision you can actually act on. This is the core power of NeuralFusion: most people are not short on information or ideas; they are short on a reliable method for integrating them.` },
        { title: `Cognitive Principles`, body: `PRINCIPLE 1: FRAGMENTATION, NOT EFFORT, CAUSES DECISION FAILURE

Decisions fail not because of a lack of intelligence but because of internal fragmentation: logic arguing with emotion, intuition contradicting the facts, creativity overwhelming focus. NeuralFusion ends this internal conflict by unifying the outputs of all four brains rather than letting one silence the others.

PRINCIPLE 2: A FUSED MIND DOES NOT HESITATE

Hesitation is frequently a symptom of unresolved fragmentation, not of an inherently difficult decision. Once brains are genuinely synthesized, the felt experience of the decision changes from uncertain to settled.

KEY TAKEAWAY: NeuralFusion ends internal conflict by unifying outputs. A fused mind does not hesitate.` },
        { title: `What Synthesis Really Means`, body: `Synthesis is not compromise. Synthesis is integration. Three conditions define real synthesis:

· Each brain contributes something to the final conclusion.
· No single brain dominates or silences the others.
· One clear conclusion emerges from the combination.

NeuralFusion treats the four brains as advisors, not rulers. Their role is to inform the decision, not to individually control it.` },
        { title: `The NeuralFusion Synthesis Framework`, body: `After activating all four brains on a given decision, synthesis follows a strict, repeatable order:

1. EXTRACT: Identify the single strongest output from each of the four brains.
2. ALIGN: Check the four outputs for overlap and for direct contradiction.
3. COMPRESS: Reduce the aligned outputs into one core insight.
4. DECIDE: Commit mentally to a single direction based on that insight.

KEY TAKEAWAY: Clarity is compression. The Synthesis Framework works because it forces multiple valid inputs down into one usable conclusion.` },
        { title: `Real-World Applications`, body: `BUSINESS: A founder is deciding whether to enter a new market. Extract: Analytical surfaces strong demand data; Intuitive surfaces hesitation about timing; Associative surfaces a phased-entry option; Reflective surfaces a concern about spreading focus too thin. Align: the hesitation and the focus concern point the same direction. Compress: "enter, but only through the phased option." Decide: a limited pilot rather than a full launch.

LEADERSHIP: A manager must decide whether to promote from within or hire externally. The four outputs converge on a hybrid path: promote internally, hire externally into a different open role. Decide: both moves happen together.

STUDENT: A student choosing a thesis topic finds the two candidate topics can be partially combined into one integrated question that serves long-term interests.

DAILY LIFE: Someone deciding whether to move to a new city finds all four brains align. The decision is made, and the Commitment Lock is applied so it is not relitigated every time nerves appear.` },
        { title: `Try It Now`, body: `Think of a decision you are currently sitting on.

Write one line of output for each brain: Analytical, Intuitive, Associative, Reflective.

Underline where they already agree; that overlap is the seed of your synthesis.` },
        { title: `Guided Practice: Full NeuralFusion Cycle`, body: `WORKSHEET: 10 MINUTES, ONE DECISION, ONE DIRECTION

1. Choose a real decision you are currently facing.
2. Write the Analytical output: facts and constraints.
3. Write the Intuitive output: your strongest gut signal.
4. Write the Associative output: your best idea or option.
5. Write the Reflective output: the lesson or value at stake.
6. Underline the common theme across all four.
7. Write your decision as a single sentence.
8. Read that sentence aloud, slowly.

Most people notice a measurable reduction in mental tension once the one-sentence decision is written and read aloud; this is the felt signature of synthesis.` },
        { title: `The Commitment Lock & Handling Doubt`, body: `THE COMMITMENT LOCK

Most people can think clearly but still fail to commit. Once synthesis is complete, re-analysis stops. Action begins immediately, even if only a small first step.

Revisiting a decision without new information breaks fusion. The Commitment Lock exists specifically to prevent this: it trains decisiveness, not stubbornness.

HANDLING DOUBT AFTER A DECISION

Doubt after a completed synthesis usually means a brain is reactivating unnecessarily, not that the decision itself was wrong.

1. Identify which brain has reactivated.
2. Acknowledge it without immediately acting on it.
3. Return deliberately to the fused conclusion you already reached.

EXPERT TIP: Doubt is data about a brain, not necessarily about the decision. Separating the two is what preserves stability after synthesis.` },
        { title: `Reflection Questions & Practice Exercises`, body: `REFLECTION QUESTIONS

· Describe a past decision where one brain clearly dominated the others. What was the outcome?
· What did the moment of "compression" feel like during your guided practice?
· Where in your life do you tend to break the Commitment Lock by re-analyzing after deciding?
· What is one decision currently waiting on you that could benefit from the Synthesis Framework?

EXERCISE A: THE OVERLAP HUNT
For any decision, write all four brain outputs before looking for agreement. Most people jump to compression too early; forcing full extraction first produces a more honest synthesis.

DECISION DRILL: 24-HOUR COMMITMENT
Apply the full Synthesis Framework to a real decision, then commit to taking no further analysis on it for 24 hours, regardless of doubt that surfaces.` },
        { title: `Common Mistakes & Success Indicators`, body: `COMMON MISTAKES

· Compressing before genuinely extracting all four brain outputs.
· Treating disagreement between brains as a problem to eliminate rather than information to align.
· Breaking the Commitment Lock the first time doubt appears, rather than running the doubt-handling protocol.
· Skipping the step of reading the decision sentence aloud, which measurably reinforces the felt sense of closure.

SUCCESS INDICATORS

· You can produce four distinct brain outputs for a real decision without effort.
· You can identify the common theme across those outputs without forcing it.
· You have applied the Commitment Lock at least once and held it despite doubt.
· Your decisions increasingly feel settled rather than merely made.` },
        { title: `Key Insight, Recap & Assignment`, body: `KEY INSIGHT: Clarity is not finding the right answer; it is unifying the mind. NeuralFusion makes clarity repeatable.

END-OF-LESSON RECAP

· Decisions fail from fragmentation, brains arguing with each other, not from a lack of intelligence.
· Synthesis is integration: every brain contributes, none dominates, one conclusion emerges.
· The Synthesis Framework runs Extract → Align → Compress → Decide.
· The Commitment Lock stops re-analysis once synthesis is complete.
· Post-decision doubt is handled by identifying, acknowledging, and returning to the fused conclusion.

ASSIGNMENT (Next 72 Hours)

1. Apply the full Synthesis Framework to one real decision.
2. Act on it.
3. Record what changed, emotionally and mentally, after acting.

Action completes the loop. Synthesis that is never acted on remains theoretical rather than trained.` }
      ]},
      4: { pages: [
        { title: `Learning Objectives`, body: `By the end of Lesson Four, you will be able to:

1. Explain why clarity collapses under pressure, in NeuralFusion terms.
2. Distinguish stabilization from suppression.
3. Apply the three NeuralFusion Stabilizers: Cognitive Anchor, Temporal Compression, and Mode Containment.
4. Complete the Pressure Simulation guided practice.
5. Recognize and interrupt the early signs of mental relapse after a decision.

WHY THIS LESSON MATTERS

Lessons One through Three build clarity under calm conditions: a seated practice, a quiet moment to write, time to think. Real decisions rarely happen that way. Pressure, urgency, and emotion are exactly the conditions under which fused thinking is most needed and most likely to collapse. Lesson Four closes that gap: it trains clarity that survives contact with stress, rather than clarity that only works in ideal conditions.` },
        { title: `Cognitive Principles`, body: `PRINCIPLE 1: PRESSURE IS NOT THE ENEMY, INSTABILITY IS

NeuralFusion does not treat pressure as something to eliminate or avoid. Pressure is a normal feature of meaningful decisions. The actual problem is instability: the tendency for a fused conclusion to collapse back into fragmentation the moment stress rises.

PRINCIPLE 2: STABILIZATION IS CONTAINMENT, NOT SUPPRESSION

Stabilizing a brain does not mean silencing it. It means preventing any one brain, usually emotion or urgency-driven analysis, from seizing full control of the decision. The other brains remain present; they are simply prevented from being overridden.` },
        { title: `Why Clarity Collapses Under Pressure`, body: `Pressure reliably triggers three responses in an untrained mind:

1. Emotional hijacking: feeling takes over before reasoning has a chance to contribute.
2. Narrow attention: the mind fixates on the most urgent-seeming detail and loses the wider picture.
3. Mode dominance: usually emotion or rushed analysis takes over completely, silencing the other brains.

Under real pressure, the brain shifts into survival prioritization rather than deliberate reasoning. This is a normal biological response, not a personal failure, but it is exactly the state NeuralFusion trains you to recognize and work with.

KEY TAKEAWAY: NeuralFusion does not fight pressure. It absorbs and stabilizes it. Pressure is not the enemy; instability is.` },
        { title: `The Stabilization Principle`, body: `Stabilization means holding one fused conclusion while emotion or urgency is present, without letting either take over the decision. This is containment, not suppression.

A stabilized mind under pressure feels distinctly different from either panic or forced calm:

· Calm but alert: not numb, not frozen.
· Focused but flexible: able to hold a direction while still noticing new information.
· Certain without aggression: decisive without needing to force the outcome.` },
        { title: `The Three NeuralFusion Stabilizers`, body: `1. COGNITIVE ANCHOR
A short internal statement that locks in a completed synthesis, preventing re-fragmentation. Examples: "This is my decision" or "I have already fused this." The anchor is a specific, repeatable interruption of the impulse to re-open a decision under stress.

2. TEMPORAL COMPRESSION
Pressure distorts time, making distant consequences feel as urgent as immediate ones. NeuralFusion compresses time deliberately by asking: "What matters in the next 10 minutes?" This narrows the decision space to what is actually actionable right now.

3. MODE CONTAINMENT
When one brain flares up under pressure, most often emotion, the response is not to eliminate it. It is to identify it, reduce its influence on the current decision, and return authority to the already-completed synthesis. No brain is removed; it is simply regulated back to its appropriate role as one advisor among four.` },
        { title: `Real-World Applications`, body: `BUSINESS: A founder receives an unexpectedly aggressive counteroffer minutes before a call. Anchor: "I already know my walk-away terms." Compression: "What matters in the next 10 minutes is staying calm on this call." Containment: the flare of anxious urgency is named and set aside.

LEADERSHIP: A manager is blindsided by a public complaint during a meeting. Anchor: "I lead by listening first, deciding later." Compression: focus only on responding calmly in the room, deferring resolution to a scheduled follow-up.

STUDENT: A student opens an exam and blanks on the first question. Anchor: "I know this material; the block is temporary." Compression: start with a question they do know.

DAILY LIFE: Someone receives a tense text while driving. Anchor: "I don't need to resolve this right now." Compression narrows focus to driving safely.` },
        { title: `Try It Now`, body: `Recall a recent moment of real pressure, not hypothetical, something that actually happened.

Write one Cognitive Anchor statement you could have used in that exact moment.

Write the one thing that genuinely mattered in the next 10 minutes of that situation.` },
        { title: `Guided Practice: Pressure Simulation`, body: `WORKSHEET: 8 MINUTES, STABILIZED THINKING DRILL

1. Recall a recent stressful moment in specific detail.
2. Identify which brain was dominant at the time.
3. Re-run the situation mentally using one Cognitive Anchor.
4. Apply Temporal Compression: name what actually mattered in the next 10 minutes.
5. Notice how the level of tension changes compared to your memory of the original moment.

EXPERT TIP: Rehearsing a stabilizer on a past event trains the same neural pathway as using it live, with none of the real-time cost of getting it wrong. Repeat this drill on different memories to generalize the skill.` },
        { title: `Preventing Mental Relapse`, body: `Relapse is the return of fragmented thinking after a decision has already been stabilized. It typically happens through two mechanisms:

· Decisions are revisited emotionally rather than because of genuinely new information.
· Old habitual patterns of reaction regain control once the pressure of the moment has passed.

Relapse is not a sign that stabilization failed permanently; it is a normal part of the training process, best treated as information rather than as failure.

RELAPSE PREVENTION PROTOCOL

1. Recognize the trigger that caused the relapse.
2. Re-state the fused conclusion you had already reached.
3. Take one action aligned with that conclusion, however small.

Action stabilizes thought. The fastest way out of a relapse is a small aligned action, not further analysis of why the relapse happened.` },
        { title: `Reflection, Mistakes & Success Indicators`, body: `REFLECTION QUESTIONS

· What is your default pressure response: emotional hijacking, narrow attention, or mode dominance?
· Which of the three Stabilizers feels most natural to you? Which feels hardest?
· Describe a recent relapse into fragmented thinking after a decision felt settled.

COMMON MISTAKES

· Trying to eliminate pressure or emotion entirely, rather than stabilizing while it is present.
· Using a Cognitive Anchor as empty positive self-talk rather than a specific reference to a completed synthesis.
· Skipping Temporal Compression and trying to resolve the entire situation at once under pressure.

SUCCESS INDICATORS

· You can name your own default pressure response.
· You have used a Cognitive Anchor in an actual moment of pressure, not just in rehearsal.
· You can apply Temporal Compression to a live situation within a few seconds.` },
        { title: `Key Insight, Recap & Assignment`, body: `KEY INSIGHT: Mental mastery is not calm thinking; it is stable thinking. NeuralFusion creates stability that survives pressure, rather than clarity that only works when conditions are ideal.

END-OF-LESSON RECAP

· Pressure triggers emotional hijacking, narrow attention, and mode dominance in an untrained mind.
· Stabilization is containment, not suppression: no brain is eliminated, only regulated.
· The three Stabilizers are the Cognitive Anchor, Temporal Compression, and Mode Containment.
· Relapse is normal and reversible through recognition, re-statement, and one aligned action.

ASSIGNMENT (Next 72 Hours)

1. Apply stabilization during one real stressful event.
2. Use at least one of the three Stabilizers deliberately.
3. Record the outcome, including what worked and what didn't.

Stability strengthens with use. The first application under real pressure is rarely smooth; that is expected, not a sign of failure.` }
      ]},
      5: { pages: [
        { title: `Learning Objectives`, body: `By the end of Lesson Five, you will be able to:

1. Define cognitive fluency and distinguish it from effortful thinking.
2. Explain the three stages every trained skill passes through, and identify which stage you are in.
3. Use the Automatic Fusion Trigger to initiate the Core Loop instinctively.
4. Recognize the practical signs that NeuralFusion is becoming automatic in daily life.
5. Commit to a lifetime maintenance protocol for the skill.

WHY THIS LESSON MATTERS

Every lesson so far has required deliberate effort: naming a brain, asking an activation question, running the Synthesis Framework step by step, applying a Stabilizer under pressure. This is appropriate for early training, but it is not the end state. Lesson Five completes the arc by training NeuralFusion to operate without conscious effort, the same way an experienced driver no longer thinks through each step of using a clutch.` },
        { title: `Cognitive Principles & Cognitive Fluency`, body: `PRINCIPLE 1: ELITE PERFORMANCE IS INTEGRATED, NOT EFFORTFUL

High performers across disciplines are rarely distinguished by thinking harder than others in the moment of performance. They are distinguished by thinking in a more integrated way, built through extensive prior deliberate practice.

PRINCIPLE 2: MASTERY IS EFFORT DISAPPEARING, NOT EFFORT INCREASING

A common misconception is that mastery means working harder at a skill indefinitely. In NeuralFusion, mastery is marked by the opposite: the loop that once took ten minutes of deliberate writing now runs in seconds, unnoticed.

COGNITIVE FLUENCY has three defining qualities: fast (the Core Loop completes in seconds), stable (clarity holds under pressure without conscious stabilization steps), and adaptive (the loop applies itself automatically to whatever is in front of you).` },
        { title: `From Skill to Instinct`, body: `Every trainable skill, physical or cognitive, passes through the same three stages:

STAGE 1, CONSCIOUS CONTROL: Slow and effortful. Every step of the Core Loop must be deliberately walked through, usually in writing.

STAGE 2, STRUCTURED PRACTICE: Consistent and deliberate. The steps are familiar but still require attention to execute correctly.

STAGE 3, AUTOMATIC EXECUTION: Fast and natural. The Core Loop runs without conscious step-by-step effort.

Lessons One through Four operate primarily in Stages One and Two. Lesson Five initiates Stage Three.` },
        { title: `The Automatic Fusion Trigger`, body: `NeuralFusion automation begins with a single internal cue: the word "Fuse."

This single word, used consistently, signals the brain to run the full loop without conscious step-by-step direction:

1. Decompose the situation automatically.
2. Activate the relevant brains.
3. Synthesize rapidly.
4. Stabilize instantly.

With repetition, this becomes reflexive, the same way a practiced athlete no longer consciously thinks through the individual components of a well-trained movement.` },
        { title: `Living NeuralFusion: Daily Integration`, body: `As automatic integration develops, it shows up as specific, observable changes in daily life rather than as an abstract feeling of "mastery":

· Faster decisions, without a corresponding drop in decision quality.
· Reduced overthinking, particularly on familiar categories of decision.
· Calm confidence that does not depend on external validation.
· Clearer prioritization, especially under competing demands.

The shift in identity is simple but significant: you stop managing your thoughts, and start leading them.

EXAMPLE: An experienced founder is asked a difficult question in an investor meeting with no time to prepare. The word "Fuse" runs silently, and a clear, integrated answer arrives in seconds, the same process from Lesson One, now compressed and unconscious.` },
        { title: `Guided Practice: Fluency Installation`, body: `EXERCISE: ONE-WORD FUSION (6 MINUTES)

1. Sit calmly for a moment.
2. Think of a current, real situation you are facing.
3. Say internally, "Fuse."
4. Allow the mind to organize itself without forcing a specific structure.
5. Notice the clarity that emerges, without straining for it.

EXPERT TIP: Repeat this exercise daily. The word itself is not magic; it works because of the extensive practice from Lessons One through Four that it now triggers automatically.` },
        { title: `Signs of Completion, Mistakes & Success Indicators`, body: `SIGNS OF COMPLETION

· You pause naturally before reacting, without consciously deciding to pause.
· Decisions feel settled rather than merely made.
· Mental noise reduces on its own, without needing to run a formal exercise.
· Confidence feels quiet rather than loud: certain without needing to be forceful.

COMMON MISTAKES

· Expecting fluency to arrive without having genuinely practiced Lessons One through Four.
· Treating the word "Fuse" as a standalone technique rather than a trigger built on prior training.
· Abandoning daily practice once fluency begins to appear, causing the skill to fade.

SUCCESS INDICATORS

· You can run a compressed version of the Core Loop in under a minute on a real decision.
· The word "Fuse" reliably produces a shift toward clarity when used.` },
        { title: `Final Insight & Lifetime Protocol`, body: `FINAL INSIGHT: You do not control the mind by force; you train it by structure. NeuralFusion is now part of you.

END-OF-LESSON RECAP

· Cognitive fluency is fast, stable, and adaptive thinking that requires no deliberate effort.
· Every skill passes through Conscious Control, Structured Practice, and Automatic Execution.
· The word "Fuse" is the trigger that activates the full Core Loop automatically, once trained.
· Daily integration shows up as faster decisions, reduced overthinking, calm confidence, and clearer priorities.

FINAL ASSIGNMENT: LIFETIME PROTOCOL

1. Use NeuralFusion daily, through the automatic trigger and the underlying loop it activates.
2. Teach it through behavior, not words; let others notice the change rather than announcing it.
3. Return to conscious structure whenever clarity fades, rather than assuming fluency is permanent.

This completes the core system of NeuralFusion Level One. "You do not control the mind by force; you train it by structure."` }
      ]},
      6: { pages: [
        { title: `Glossary, Part 1`, body: `NEURALFUSION: The overall trainable cognitive skill system that coordinates the Four Brains into one controlled process.

COGNITIVE FRAGMENTATION: The default, untrained state of thinking in disconnected pieces (logic without intuition, emotion without reflection) rather than as one coordinated process.

THE FOUR BRAINS: Analytical, Intuitive, Associative, and Reflective, the four natural modes of thought that NeuralFusion trains you to activate and coordinate deliberately.

ANALYTICAL BRAIN: Governs logic, structure, and facts. Best used for decisions, planning, and problem breakdown.

INTUITIVE BRAIN: Governs gut feeling, insight, and pattern recognition. Best used for fast judgment and direction.

ASSOCIATIVE BRAIN: Governs creativity, connection, and idea generation. Best used for expansion and new options.

REFLECTIVE BRAIN: Governs self-awareness, evaluation, and meaning. Best used for learning and long-term perspective.

MODE ACTIVATION SIGNAL: A short internal question used to deliberately switch into a specific brain.` },
        { title: `Glossary, Part 2`, body: `THE CORE LOOP: The four-stage process, Decomposition, Mode Switching, Synthesis, Stabilization, that structures every application of NeuralFusion.

SYNTHESIS: Combining the outputs of all four brains into one unified insight. Integration, not compromise.

THE SYNTHESIS FRAMEWORK: The four-step method for synthesis, Extract, Align, Compress, Decide.

STABILIZATION: Locking in a fused conclusion and reducing mental noise, especially under pressure.

THE COMMITMENT LOCK: The discipline of stopping re-analysis once synthesis is complete, converting a decision into stable action.

COGNITIVE ANCHOR: A short internal statement used to lock in synthesis and prevent re-fragmentation under pressure.

TEMPORAL COMPRESSION: A stabilizer that narrows focus to what matters in the next short window of time.

MODE CONTAINMENT: A stabilizer that reduces the influence of an overactive brain without eliminating it.

MENTAL RELAPSE: The return of fragmented thinking after a decision has already been stabilized.

COGNITIVE FLUENCY: The advanced state in which the Core Loop runs quickly, stably, and adaptively without deliberate effort.

THE AUTOMATIC FUSION TRIGGER: The single-word cue ("Fuse") used to activate the full Core Loop automatically, once trained.

MENTAL LEADERSHIP: The core identity shift NeuralFusion aims to produce, from being carried by one's thoughts to consciously directing them.` },
        { title: `Quick-Reference: The Core Loop & Synthesis Framework`, body: `THE CORE LOOP

1. Decomposition: break it into parts.
2. Mode Switching: activate the right brain for each part.
3. Synthesis: combine outputs into one insight.
4. Stabilization: lock in clarity, reduce noise.

THE SYNTHESIS FRAMEWORK

1. Extract: strongest output from each brain.
2. Align: check overlaps and contradictions.
3. Compress: reduce to one core insight.
4. Decide: commit to a single direction.

THE THREE STABILIZERS

· Cognitive Anchor: a short statement that locks synthesis in place.
· Temporal Compression: "What matters in the next 10 minutes?"
· Mode Containment: identify, reduce influence, return authority to synthesis.

THE EMERGENCY RESET

1. Pause. 2. Name the brain you are stuck in. 3. Switch to Reflective. 4. Ask: "What is one thing I can control right now?"` },
        { title: `Progress Tracker & Weekly Practice Schedule`, body: `Use this tracker to record your completion of each lesson's core components: Guided Practice completed, Assignment completed, date, and a personal confidence rating from 1 to 5.

· Lesson 1, Foundation of Integrated Cognition
· Lesson 2, Brain Mode Activation & Switching
· Lesson 3, Synthesis & Decision Architecture
· Lesson 4, Cognitive Stabilization Under Pressure
· Lesson 5, Cognitive Fluency Installation

SUGGESTED FOUR-WEEK SCHEDULE

WEEK 1: Lesson One. Daily mode-naming practice. Complete the First Guided Practice and 24-hour assignment.

WEEK 2: Lesson Two. Daily Switching Drill or a single deliberate mode switch. Rehearse the Emergency Reset once per day.

WEEK 3: Lesson Three. Apply the Full NeuralFusion Cycle to one real decision. Practice the Commitment Lock on smaller daily decisions.

WEEK 4: Lesson Four. Run the Pressure Simulation on a past event. Apply at least one Stabilizer to a real pressure moment.

WEEK 5+: Lesson Five. Begin using the Automatic Fusion Trigger daily. Shift from written exercises to in-the-moment application.

This schedule is a starting structure, not a fixed rule. If a lesson has not yet produced its Success Indicators, it is more effective to repeat that week than to advance on schedule.` },
        { title: `Decision Journal & Reflection Journal Templates`, body: `DECISION JOURNAL TEMPLATE

Use this each time you apply the Full NeuralFusion Cycle or the Synthesis Framework to a real decision.

· Date
· The Decision (one sentence)
· Analytical Output: facts and constraints
· Intuitive Output: strongest gut signal
· Associative Output: best idea or option
· Reflective Output: lesson or value at stake
· Common Theme
· Final Decision Sentence
· Commitment Lock Applied? Yes / Not yet
· Outcome (add later)

REFLECTION JOURNAL TEMPLATE

Use one entry per lesson, or more frequently if useful.

· Lesson / Date
· What I noticed about my thinking today
· Which brain I relied on most
· Which brain I underused
· One moment I would handle differently now
· What I want to practice next

Short, honest entries written consistently are more valuable than long, polished entries written occasionally. The Reflection Journal is a training log, not a performance.` },
        { title: `Cognitive Performance Scorecard`, body: `Use this scorecard monthly to track your own sense of progress across the five core NeuralFusion capacities. Rate each from 1 (Rarely) to 5 (Consistently). This is a self-assessment tool for personal tracking, not a diagnostic or clinical instrument.

· I can name my current brain on request.
· I can switch deliberately into a specific brain using an activation signal.
· I can complete a full synthesis and produce a one-sentence decision.
· I can apply at least one Stabilizer during a real pressure moment.
· I notice NeuralFusion operating automatically, without deliberate effort.

This scorecard measures your own subjective sense of skill, consistent with how NeuralFusion is designed to be practiced. It is not a psychological assessment and does not diagnose any condition.` },
        { title: `Mastery Checklist: Level One`, body: `Complete this checklist honestly before considering Level One finished. Every item should reflect something you have actually done, not something you understand conceptually.

· I completed all five lessons in order, including every guided practice.
· I can name the Four Brains and describe the risk of overusing each.
· I can state the four stages of the Core Loop from memory.
· I can state the four steps of the Synthesis Framework from memory.
· I have applied the Commitment Lock to a real decision.
· I can name the three Stabilizers and have used at least one under real pressure.
· I have used the Automatic Fusion Trigger ("Fuse") in a real, unplanned situation.
· I have completed at least one full Decision Journal entry.
· I have completed at least three Reflection Journal entries.
· I can explain, in my own words, why NeuralFusion is described as a trainable skill rather than a personality trait.` },
        { title: `Final Level One Assessment`, body: `This assessment is self-graded and reflective by design: NeuralFusion measures applied skill, not memorized theory.

PART A: CONCEPTUAL UNDERSTANDING
1. In your own words, define cognitive fragmentation and explain how NeuralFusion addresses it.
2. Name the Four Brains and describe one overuse risk for each.
3. Explain the difference between synthesis and compromise.
4. Explain the difference between stabilization and suppression.
5. Define cognitive fluency and describe what it feels like in practice.

PART B: APPLIED SKILL
1. Walk through a real decision using the full Synthesis Framework, and record the resulting one-sentence decision.
2. Describe a real instance where you used a Stabilizer under genuine pressure, and what happened.
3. Describe a real instance where the Automatic Fusion Trigger produced clarity without deliberate step-by-step effort.

PART C: SELF-EVALUATION
1. Which lesson required the most repetition for you, and why?
2. Which Success Indicators do you meet most confidently? Least confidently?
3. What is your personal plan for continuing to practice NeuralFusion after completing this curriculum?

There is no passing score. Completion of this assessment in full, honest written form is what qualifies you to proceed toward certification.` },
        { title: `Certification, Daily Practice & FAQ`, body: `LEVEL ONE CERTIFICATION REQUIREMENTS

1. Completion of all five lessons, including every guided practice and assignment.
2. A fully completed Mastery Checklist.
3. A fully completed Final Level One Assessment, in writing.
4. At least five completed Decision Journal entries, drawn from real decisions.
5. At least one documented, real-world application of a Stabilizer under genuine pressure.

RECOMMENDED DAILY PRACTICE ROUTINE

· Morning (2–3 min): One deliberate pass through the Core Loop on the day's first meaningful decision.
· Midday (1 min): A single mode check; pause and name whatever brain is currently active.
· As needed: Use the Automatic Fusion Trigger ("Fuse") whenever a decision or reaction arises.
· Under pressure: Apply a Stabilizer as the situation requires.
· Evening (3–5 min): One Reflection Journal entry, focused on what was noticed rather than what was achieved.

IS NEURALFUSION A FORM OF THERAPY?
No. NeuralFusion is a cognitive skill training system. It is not a medical, psychological, psychiatric, or therapeutic treatment, and it does not replace professional care. If you are working through a mental health concern, please consult a licensed professional.

HOW LONG DOES LEVEL ONE TAKE?
Most learners take four to six weeks working through the lessons at the suggested pace. The timeline matters far less than whether each lesson's Success Indicators have genuinely been met before moving on.` }
      ]},
    };

    // ── Supabase Helpers ──────────────────────────────────────────────
    const getProfile = async (id) => { try { const {data} = await sb.from('profiles').select('*').eq('id',id).maybeSingle(); return data; } catch(_){ return null; } };

    // ── My decisions Helpers ──────────────────────────────────────────
    // Backs the Decision Room / My decisions (persisted Integration
    // Protocol sessions). Table: decision_sessions, RLS-scoped to owner.
    const saveDecisionSession = async (userId, payload) => {
      try {
        const { data, error } = await sb.from('decision_sessions').insert({ user_id: userId, ...payload }).select().single();
        if (error) throw error;
        nfjInvalidate('dec:');
        return data;
      } catch (e) { console.error('[DECISION SAVE ERROR]', e); return null; }
    };
    const listDecisionSessions = async (userId) => {
      try {
        const { data, error } = await sb.from('decision_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (e) { console.error('[DECISION LIST ERROR]', e); return []; }
    };
    const updateDecisionSession = async (id, patch) => {
      try {
        const { data, error } = await sb.from('decision_sessions').update(patch).eq('id', id).select().single();
        if (error) throw error;
        nfjInvalidate('dec:');
        return data;
      } catch (e) { console.error('[DECISION UPDATE ERROR]', e); return null; }
    };

    const CFI_VERSION = 'CFI-1.0'; // the canonical 13-item instrument. Never mix with older 15/16-item data.

    // Defensive server-side-equivalent validation, mirrored client-side since this app has
    // no server layer of its own. Frontend can't be trusted alone (item 18 of the CFI
    // correction spec): this is the actual gate a completed attempt must pass before saveCFIResult
    // will submit it.
    function validateCFISubmission(answers) {
      const errors = [];
      const ids = CFI_ITEMS.map(i => i.id);
      if (ids.length !== 13) errors.push(`CFI_ITEMS has ${ids.length} items, expected exactly 13.`);
      const answeredIds = ids.filter(id => answers[id] !== undefined && answers[id] !== null);
      if (answeredIds.length !== 13) errors.push(`Expected 13 answers, got ${answeredIds.length}.`);
      answeredIds.forEach(id => {
        const v = answers[id];
        if (!(Number.isInteger(v) && v >= 1 && v <= 5)) errors.push(`Answer for item ${id} (${v}) is not an integer 1–5.`);
      });
      return { valid: errors.length === 0, errors };
    }
    function validateCFIScore(total) {
      return Number.isInteger(total) && total >= 13 && total <= 65;
    }

    // Looks up this user's prior completed CFI-1.0 attempts (most recent first) so a new
    // submission can be numbered and linked correctly. Per-user numbering only, never global,
    // never reset by logout/refresh/new session, and only rows on the current CFI_VERSION count,
    // so historical 15/16-item attempts never get silently mixed into CFI-1.0's numbering or deltas.
    const getPriorCFIResults = async (id) => {
      const { data, error } = await sb.from('cfi_results').select('*')
        .eq('user_id', id).eq('status', 'completed').eq('assessment_version', CFI_VERSION)
        .order('created_at', { ascending: false });
      if (error) { console.error('[CFI SAVE ERROR] loading prior results failed:', error); return []; }
      return data || [];
    };

    // saveCFIResult finalizes a completed assessment. If a draftId (an existing
    // in_progress row created via saveCFIProgress) is passed, it updates that
    // row in place instead of inserting a new one, so a single attempt never
    // produces two rows.
    // NOTE: supabase-js does NOT throw on a failed query: it resolves with
    // { data, error }. Every call here checks .error explicitly and logs it,
    // so a failed save is visible in the console instead of silently vanishing.
    const saveCFIResultCore = async (id, r, a, draftId) => {
      const check = validateCFISubmission(a);
      if (!check.valid || !validateCFIScore(r.total)) {
        const msg = 'CFI submission failed validation: ' + check.errors.concat(
          validateCFIScore(r.total) ? [] : [`total score ${r.total} outside 13–65`]
        ).join('; ');
        console.error('[CFI SAVE ERROR]', msg);
        return { data: null, error: { message: msg } };
      }
      const prior = await getPriorCFIResults(id);
      const previous = prior[0] || null;
      const assessmentNumber = prior.length + 1;
      const scoreChange = previous ? (r.total - previous.total_score) : null;
      const bandChanged = previous ? (previous.band !== r.band) : false;
      const payload = {
        user_id:id, total_score:r.total, band:r.band, dim_scores:r.dimScores, answers:a, status:'completed',
        assessment_version: CFI_VERSION,
        assessment_number: assessmentNumber,
        previous_assessment_id: previous ? previous.id : null,
        previous_band: previous ? previous.band : null,
        score_change: scoreChange,
        band_changed: bandChanged,
        analytical_score: r.dimScores?.A ?? null,
        intuitive_score: r.dimScores?.I ?? null,
        associative_score: r.dimScores?.S ?? null,
        reflective_score: r.dimScores?.R ?? null,
        integration_score: r.dimScores?.E ?? null,
        // Persists the (now-corrected) dominant-mode calculation so AdminView's per-row
        // table, which reads r.dominant_brain straight from the DB rather than
        // recomputing it, actually has a value to show instead of always falling
        // back to 'N/A'. REQUIRES a `dominant_brain` text column on `cfi_results`
        // (see migration note below) or this insert/update will fail.
        dominant_brain: r.dominantBrain ?? null,
      };
      if (draftId) {
        const { data, error } = await sb.from('cfi_results').update(payload).eq('id', draftId).eq('user_id', id).select('id');
        if (error) {
          console.error('[CFI SAVE ERROR] update by draftId failed, falling back to insert:', error);
        } else if (data && data.length > 0) {
          return { data, error: null };
        } else {
          console.warn('[CFI SAVE WARNING] update matched 0 rows for draftId', draftId, '- falling back to insert. This usually means an RLS policy blocked it or the row does not exist.');
        }
        // Fall back to a fresh insert so the result is never silently lost,
        // even if the draft row couldn't be updated for some reason.
      }
      const res = await sb.from('cfi_results').insert(payload).select('id');
      if (res.error) console.error('[CFI SAVE ERROR] insert failed:', res.error);
      return res;
    };
    // Wrapper: persistence is unchanged; afterwards, if the participant started from a team
    // team link, the saved result is LINKED (not copied) to their team server-side.
    const saveCFIResult = async (id, r, a, draftId) => {
      const out = await saveCFIResultCore(id, r, a, draftId);
      try { if (!out.error && window.NF_ORG) await window.NF_ORG.afterCfiSaved(out.data && out.data[0] && out.data[0].id); } catch (e) { console.error('[ORG LINK ERROR]', e); }
      return out;
    };
    // Looks up a signed-in user's in-progress CFI attempt, if one exists, so an
    // interrupted assessment (refresh, lost connection, returning later) can resume
    // instead of starting over.
    const getInProgressCFI = async (id) => {
      const { data, error } = await sb.from('cfi_results').select('*').eq('user_id', id).eq('status', 'in_progress').order('created_at', { ascending:false }).limit(1);
      if (error) { console.error('[CFI SAVE ERROR] loading in-progress attempt failed:', error); return null; }
      return data && data[0] ? data[0] : null;
    };
    // Persists in-progress answers as the user goes. First call creates the draft
    // row (status: in_progress); subsequent calls update that same row by id, so
    // changing an answer never creates a duplicate response.
    const saveCFIProgress = async (id, answers, draftId) => {
      if (draftId) {
        const { data, error } = await sb.from('cfi_results').update({ answers, status:'in_progress' }).eq('id', draftId).eq('user_id', id).select('id');
        if (error) { console.error('[CFI SAVE ERROR] progress update failed:', error); return draftId; }
        if (!data || data.length === 0) {
          console.warn('[CFI SAVE WARNING] progress update matched 0 rows for draftId', draftId, '- treating draft as lost and starting a new one.');
        } else {
          return draftId;
        }
      }
      const { data, error } = await sb.from('cfi_results').insert({ user_id:id, answers, status:'in_progress' }).select('id').maybeSingle();
      if (error) { console.error('[CFI SAVE ERROR] progress insert failed:', error); return draftId || null; }
      return data?.id || null;
    };
    const upsertLessonProgress = async (id, lid, p) => await sb.from('lesson_progress').upsert({user_id:id, lesson_id:lid, progress:p, completed:p===100},{onConflict:'user_id,lesson_id'});
    const loadLessonProgress = async (id) => {
      const {data} = await sb.from('lesson_progress').select('lesson_id,progress').eq('user_id',id);
      const map = {}; (data||[]).forEach(r=>{map[r.lesson_id]=r.progress;}); return map;
    };
    // Platform settings helpers
    const getPlatformSetting = async (key) => {
      try { const {data} = await sb.from('platform_settings').select('value,text_value').eq('key',key).maybeSingle(); return data?.text_value ?? data?.value ?? null; } catch(_){ return null; }
    };
    // Both writers return { ok, error } so callers can surface failures.
    const setPlatformSetting = async (key, value) => {
      try {
        const { error } = await sb.from('platform_settings').upsert({key, value},{onConflict:'key'});
        if (error) { console.error('[platform_settings write]', key, error); return { ok:false, error }; }
        return { ok:true };
      } catch(e){ console.error('[platform_settings write]', key, e); return { ok:false, error:e }; }
    };
    const setTextSetting = async (key, text_value) => {
      try {
        const { error } = await sb.from('platform_settings').upsert({key, text_value},{onConflict:'key'});
        if (error) { console.error('[platform_settings write]', key, error); return { ok:false, error }; }
        return { ok:true };
      } catch(e){ console.error('[platform_settings write]', key, e); return { ok:false, error:e }; }
    };

    // ── NEURAL VISUAL ─────────────────────────────────────────────────

    // ── SCAN LINE EFFECT ──────────────────────────────────────────────
    function ScanLine() {
      return (
        React.createElement("div", {style: { position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', borderRadius:'inherit' }}, React.createElement("div", {style: {
            position:'absolute', left:0, right:0, height:1,
            background:'linear-gradient(90deg, transparent, rgba(196,160,80,0.3), transparent)',
            animation:'scanH 4s ease-in-out infinite',
          }}))
      );
    }

    // ── BRAIN MODE CARD ───────────────────────────────────────────────

    // ── PROGRESS RING ─────────────────────────────────────────────────

    // ── AUTH MODAL ────────────────────────────────────────────────────
    function AuthModal({ onClose, onSuccess, initialTab = 'login' }) {
      const [tab, setTab] = useState(initialTab);
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [name, setName] = useState('');
      const [loading, setLoading] = useState(false);
      const [msg, setMsg] = useState({ text:'', type:'' });

      // Sync if parent changes initialTab (e.g. PASSWORD_RECOVERY fires after mount)
      useEffect(() => { setTab(initialTab); }, [initialTab]);

      const handleLogin = async () => {
        if (!email || !password) { setMsg({text:'Email and password required.',type:'error'}); return; }
        setLoading(true); setMsg({text:'',type:''});
        const { error } = await sb.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) setMsg({text:error.message,type:'error'});
        else { onSuccess(); onClose(); }
      };

      const handleSignup = async () => {
        if (!email||!password||!name) { setMsg({text:'All fields required.',type:'error'}); return; }
        if (password.length < 8) { setMsg({text:'Password must be at least 8 characters.',type:'error'}); return; }
        if (confirmPassword && password !== confirmPassword) { setMsg({text:'Passwords do not match.',type:'error'}); return; }
        setLoading(true); setMsg({text:'',type:''});
        try {
          const { data, error } = await sb.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options:{ data:{ full_name: name.trim() } }
          });
          if (error) {
            setLoading(false);
            setMsg({text: error.message, type:'error'});
            return;
          }

          // If email confirmation is required, identities will be empty or session null
          const needsConfirm = !data.session || data.user?.identities?.length === 0;
          if (needsConfirm) {
            setLoading(false);
            setMsg({text:'Account created. Check your inbox for a confirmation link.', type:'success'});
            return;
          }

          // Email confirmation disabled; user is already signed in via onAuthStateChange
          // Just upsert the profile as a safety net
          const uid = data.user?.id;
          if (uid) {
            await sb.from('profiles')
              .upsert({ id: uid, full_name: name.trim() }, { onConflict: 'id' });
          }

          setLoading(false);
          onSuccess();
          onClose();
        } catch(err) {
          setLoading(false);
          setMsg({text: err.message || 'Something went wrong. Please try again.', type:'error'});
        }
      };

      const handleForgotPassword = async () => {
        if (!email) { setMsg({text:'Please enter your email address.',type:'error'}); return; }
        setLoading(true); setMsg({text:'',type:''});
        const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: window.location.href,
        });
        setLoading(false);
        if (error) setMsg({text:error.message,type:'error'});
        else setMsg({text:'Reset link sent. Check your inbox.', type:'success'});
      };

      const handleUpdatePassword = async () => {
        if (!password) { setMsg({text:'Please enter a new password.',type:'error'}); return; }
        if (password.length < 8) { setMsg({text:'Password must be at least 8 characters.',type:'error'}); return; }
        if (password !== confirmPassword) { setMsg({text:'Passwords do not match.',type:'error'}); return; }
        setLoading(true); setMsg({text:'',type:''});
        const { error } = await sb.auth.updateUser({ password });
        setLoading(false);
        if (error) setMsg({text:error.message,type:'error'});
        else {
          setMsg({text:'Password updated. You are now signed in.', type:'success'});
          setTimeout(()=>{ onSuccess(); onClose(); }, 1500);
        }
      };

      const tabMeta = {
        login:           { title:'Sign in',      sub:'Welcome back.' },
        signup:          { title:'Create account',       sub:'Start learning to think better.' },
        'forgot-password':{ title:'Reset password',          sub:"We'll send a reset link to your inbox." },
        'update-password':{ title:'New password',        sub:'Choose a strong password (8+ characters).' },
      };

      const { title, sub } = tabMeta[tab] || tabMeta.login;

      return (
        React.createElement("div", {style: {
          position:'fixed', inset:0, background:'rgba(5,12,26,0.95)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20,
          backdropFilter:'blur(8px)',
        }}, React.createElement("div", {className: "card fade-up", style: { maxWidth:420, width:'100%', padding:'36px 32px', position:'relative' }}, React.createElement("button", {onClick: onClose, style: { position:'absolute', top:16, right:16, background:'none', border:'none', color:C.muted, fontSize:14, cursor:'pointer', lineHeight:1 }}, '×'), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:20 }}, 'Authentication'), React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:800, color:C.text, marginBottom:6, overflowWrap:'break-word', minWidth:0}}, title), React.createElement("div", {style: { fontSize:13, color:C.muted, marginBottom:28 }}, sub), (tab==='login'||tab==='signup') && (
              React.createElement("div", {style: { display:'flex', gap:2, marginBottom:24, background:C.deep, padding:4, borderRadius:2 }}, ['login','signup'].map(t=>(
                  React.createElement("button", {key: t, onClick: ()=>{ setTab(t); setMsg({text:'',type:''}); }, style: {
                    flex:1, padding:'10px', background:tab===t?C.cyan:'transparent',
                    color:tab===t?C.void:C.muted, ...syne, fontSize:11, fontWeight:700,
                    letterSpacing:1, borderRadius:2, border:'none', cursor:'pointer', overflowWrap:'break-word', minWidth:0}}, t==='login'?'Sign in':'Register')
                )))
            ), tab==='login' && (React.createElement(React.Fragment, null, React.createElement("div", {style: { marginBottom:14 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Email'), React.createElement("input", {type: "email", value: email, onChange: e=>setEmail(e.target.value), placeholder: "you@example.com"})), React.createElement("div", {style: { marginBottom:8 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Password'), React.createElement("input", {type: "password", value: password, onChange: e=>setPassword(e.target.value), placeholder: "••••••••", onKeyDown: e=>e.key==='Enter'&&handleLogin()})), React.createElement("div", {style: { textAlign:'right', marginBottom:20 }}, React.createElement("button", {onClick: ()=>{ setTab('forgot-password'); setMsg({text:'',type:''}); }, style: {
                  background:'none', border:'none', ...mono, fontSize:9, letterSpacing:1,
                  color:C.muted, cursor:'pointer', textDecoration:'underline',
                }}, 'Forgot password?')))), tab==='signup' && (React.createElement(React.Fragment, null, React.createElement("div", {style: { marginBottom:14 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Full name'), React.createElement("input", {value: name, onChange: e=>setName(e.target.value), placeholder: "Your name"})), React.createElement("div", {style: { marginBottom:14 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Email'), React.createElement("input", {type: "email", value: email, onChange: e=>setEmail(e.target.value), placeholder: "you@example.com"})), React.createElement("div", {style: { marginBottom:14 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Password'), React.createElement("input", {type: "password", value: password, onChange: e=>setPassword(e.target.value), placeholder: "••••••••"})), React.createElement("div", {style: { marginBottom:24 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Confirm password'), React.createElement("input", {type: "password", value: confirmPassword, onChange: e=>setConfirmPassword(e.target.value), placeholder: "••••••••", onKeyDown: e=>e.key==='Enter'&&handleSignup()})))), tab==='forgot-password' && (React.createElement(React.Fragment, null, React.createElement("div", {style: { marginBottom:24 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Email'), React.createElement("input", {type: "email", value: email, onChange: e=>setEmail(e.target.value), placeholder: "you@example.com", onKeyDown: e=>e.key==='Enter'&&handleForgotPassword()})))), tab==='update-password' && (React.createElement(React.Fragment, null, React.createElement("div", {style: { marginBottom:14 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'New password'), React.createElement("input", {type: "password", value: password, onChange: e=>setPassword(e.target.value), placeholder: "••••••••"})), React.createElement("div", {style: { marginBottom:24 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Confirm password'), React.createElement("input", {type: "password", value: confirmPassword, onChange: e=>setConfirmPassword(e.target.value), placeholder: "••••••••", onKeyDown: e=>e.key==='Enter'&&handleUpdatePassword()})))), msg.text && (
              React.createElement("div", {style: { marginBottom:20, padding:'12px 16px', background:msg.type==='error'?'rgba(248,113,113,0.1)':'rgba(128,203,196,0.1)',
                border:`1px solid ${msg.type==='error'?'#F8717144':'#7AAFCF44'}`, borderRadius:2,
                color:msg.type==='error'?'#F87171':'#7AAFCF', fontSize:13 }}, msg.text)
            ), React.createElement("button", {className: "btn-primary", style: { width:'100%', fontSize:12, opacity:loading?0.6:1 }, disabled: loading, onClick: 
                tab==='login'            ? handleLogin :
                tab==='signup'           ? handleSignup :
                tab==='forgot-password'  ? handleForgotPassword :
                                           handleUpdatePassword
              }, loading ? 'Working...' : (
                tab==='login'            ? 'Sign in →' :
                tab==='signup'           ? 'Create account →' :
                tab==='forgot-password'  ? 'Send reset link →' :
                                           'Update password →'
              )), (tab==='forgot-password'||tab==='update-password') && (
              React.createElement("div", {style: { textAlign:'center', marginTop:16 }}, React.createElement("button", {onClick: ()=>{ setTab('login'); setMsg({text:'',type:''}); setPassword(''); setConfirmPassword(''); }, style: {
                  background:'none', border:'none', ...mono, fontSize:9, letterSpacing:1,
                  color:C.muted, cursor:'pointer', textDecoration:'underline',
                }}, '← Back to sign in'))
            )))
      );
    }

    // ── NAVBAR ────────────────────────────────────────────────────────
    function Navbar({ view, setView, user, profile, setShowAuth, onSignOut, authLoading , hasOrg }) {
      const [menuOpen, setMenuOpen] = useState(false);
      // Awaiting-review indicator: a quiet dot next to "Decisions" when a
      // saved decision's review date has arrived. No push, no popups;
      // just visible where the person already looks.
      const [awaitingReview, setAwaitingReview] = useState(0);
      useEffect(() => {
        if (!user) { setAwaitingReview(0); return; }
        listDecisionSessions(user.id).then(rows => {
          setAwaitingReview(rows.filter(d => d.status === 'open' && d.review_date && new Date(d.review_date) <= new Date()).length);
        });
      }, [user]);
      // First-time and anonymous visitors get a short, plain-language nav.
      // Signed-in users get the full functional app nav (all routes below
      // remain unchanged and reachable, only the anonymous label set differs).
      const navItems = user ? [
        { v:'cfi', label:'Take the test' },
        { v:'lessons', label:'Lessons' },
        { v:'analytics', label:'My progress' },
        { v:'decisions', label: awaitingReview > 0 ? 'Decisions ●' : 'Decisions' },
        hasOrg ? { v:'org', label:'My Team' } : { v:'teams', label:'For Teams' },
        ...(profile?.is_admin === true ? [{ v:'admin', label:'⚙ Admin' }] : []),
      ] : [
        { v:'home', label:'Home' },
        { v:'cfi', label:'Take the test' },
        { v:'lessons', label:'Lessons' },
      ];
      const blogHref = '/blog';
      const aboutHref = '/about';

      return (
        React.createElement(React.Fragment, null, React.createElement("nav", {style: {
            position:'fixed', top:0, left:0, right:0, zIndex:100,
            background:'rgba(5,12,26,0.85)', backdropFilter:'blur(20px)',
            borderBottom:`1px solid ${C.border}`,
          }}, React.createElement("div", {style: { maxWidth:1280, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}, React.createElement("button", {className: "nf-logo-btn", onClick: ()=>setView('home'), style: { background:'none', border:'none', display:'flex', alignItems:'center', cursor:'pointer' }}, React.createElement(NFLogoLockup, {iconSize: 30, gap: 12, wordmarkColor: C.text, tagline: 'Think more clearly', taglineColor: C.muted})), React.createElement("div", {className: "desktop-nav"}, navItems.map(item => (
                  React.createElement("button", {key: item.v, onClick: ()=>setView(item.v), style: {
                    background:'none', border:'none', padding:'8px 12px',
                    color: view===item.v ? C.cyan : C.muted,
                    ...inter, fontSize:12, fontWeight:view===item.v?600:400,
                    cursor:'pointer', transition:'color 0.2s',
                    borderBottom: view===item.v ? `1px solid ${C.cyan}` : '1px solid transparent',
                  }}, item.label)
                )), React.createElement("a", {href: aboutHref, style: {
                  background:'none', border:'none', padding:'8px 12px',
                  color: C.muted,
                  ...inter, fontSize:12, fontWeight:400,
                  cursor:'pointer', transition:'color 0.2s',
                  borderBottom: '1px solid transparent',
                  textDecoration:'none',
                  display:'inline-block',
                }}, 'About'), React.createElement("a", {href: blogHref, target: "_blank", rel: "noopener noreferrer", style: {
                  background:'none', border:'none', padding:'8px 12px',
                  color: C.muted,
                  ...inter, fontSize:12, fontWeight:400,
                  cursor:'pointer', transition:'color 0.2s',
                  borderBottom: '1px solid transparent',
                  textDecoration:'none',
                  display:'inline-block',
                }}, 'Blog')), React.createElement("div", {style: { display:'flex', alignItems:'center', gap:12 }}, React.createElement("div", {className: "nav-user-label", style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted }}, user ? user.email?.split('@')[0].toUpperCase() : ''), authLoading ? (
                  React.createElement("div", {className: "desktop-only", style: { width:16, height:16, border:'2px solid rgba(196,160,80,0.3)', borderTopColor:'#C4A050', borderRadius:'50%', animation:'nf-spin 0.8s linear infinite' }})
                ) : user ? (
                  React.createElement("button", {className: "btn-outline desktop-only", style: { fontSize:10, padding:'8px 16px' }, onClick: onSignOut}, 'Sign out')
                ) : (
                  React.createElement(React.Fragment, null,
                    React.createElement("button", {className: "desktop-only", onClick: ()=>setShowAuth(true), style: { background:'none', border:'none', color:C.muted, ...inter, fontSize:11, cursor:'pointer' }}, 'Sign in'),
                    React.createElement("button", {className: "btn-primary desktop-only", style: { fontSize:10, padding:'10px 20px' }, onClick: ()=>setView('cfi')}, 'Take the test →')
                  )
                ), React.createElement("button", {className: "hamburger-btn", onClick: ()=>setMenuOpen(!menuOpen), style: {
                  background:'none', border:`1px solid ${C.border}`, borderRadius:2,
                  color:C.muted, width:40, height:36, flexDirection:'column',
                  alignItems:'center', justifyContent:'center', gap:5, cursor:'pointer',
                }}, React.createElement("div", {style: { width:18, height:1, background:C.muted }}), React.createElement("div", {style: { width:14, height:1, background:C.muted }}), React.createElement("div", {style: { width:10, height:1, background:C.muted }}))))), menuOpen && (
            React.createElement("div", {style: {
              position:'fixed', inset:0, zIndex:99, background:'rgba(5,12,26,0.97)',
              backdropFilter:'blur(20px)', paddingTop:70, display:'flex', flexDirection:'column',
            }}, React.createElement("button", {onClick: ()=>setMenuOpen(false), style: {
                position:'absolute', top:20, right:24, background:'none', border:'none',
                color:C.muted, fontSize:14, cursor:'pointer', lineHeight:1,
              }}, '×'), React.createElement("div", {style: { padding:'32px 24px', flex:1, overflowY:'auto' }}, navItems.map((item,i) => (
                  React.createElement("button", {key: item.v, onClick: ()=>{ setView(item.v); setMenuOpen(false); }, style: {
                    display:'flex', alignItems:'center', width:'100%', textAlign:'left',
                    background:'none', border:'none', borderBottom:`1px solid ${C.border}`,
                    padding:'18px 0', cursor:'pointer',
                    animation:`fadeUp 0.3s ease ${i*0.05}s both`,
                  }}, React.createElement("div", {style: { flex:1, ...syne, fontSize:14, fontWeight:700, color: view===item.v ? C.cyan : C.text, overflowWrap:'break-word', minWidth:0}}, item.label), view===item.v && (
                      React.createElement("div", {style: { ...mono, fontSize:10, color:C.cyan }}, '◈')
                    ))
                )), React.createElement("a", {href: aboutHref, style: {
                  display:'flex', alignItems:'center', width:'100%', textAlign:'left',
                  borderBottom:`1px solid ${C.border}`,
                  padding:'18px 0', cursor:'pointer', textDecoration:'none',
                  animation:`fadeUp 0.3s ease ${navItems.length*0.05}s both`,
                }}, React.createElement("div", {style: { flex:1, ...syne, fontSize:14, fontWeight:700, color:C.text, overflowWrap:'break-word', minWidth:0}}, 'About')), React.createElement("a", {href: blogHref, target: "_blank", rel: "noopener noreferrer", style: {
                  display:'flex', alignItems:'center', width:'100%', textAlign:'left',
                  borderBottom:`1px solid ${C.border}`,
                  padding:'18px 0', cursor:'pointer', textDecoration:'none',
                  animation:`fadeUp 0.3s ease ${(navItems.length+1)*0.05}s both`,
                }}, React.createElement("div", {style: { flex:1, ...syne, fontSize:14, fontWeight:700, color:C.text, overflowWrap:'break-word', minWidth:0}}, 'Blog'), React.createElement("div", {style: { ...mono, fontSize:10, color:C.muted }}, '↗'))), React.createElement("div", {style: {
                padding:'24px', borderTop:`1px solid ${C.border}`,
                animation:'fadeUp 0.35s ease 0.35s both',
              }}, user ? (
                  React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:12 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, 'Signed in as', user.email?.toUpperCase()), React.createElement("button", {className: "btn-outline", style: { width:'100%', fontSize:11, textAlign:'center' }, onClick: ()=>{ onSignOut(); setMenuOpen(false); }}, 'Sign out'))
                ) : (
                  React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:10 }},
                    React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:4 }}, 'Think more clearly'),
                    React.createElement("button", {className: "btn-primary", style: { width:'100%', fontSize:12, textAlign:'center' }, onClick: ()=>{ setView('cfi'); setMenuOpen(false); }}, 'Take the test →'),
                    React.createElement("button", {className: "btn-outline", style: { width:'100%', fontSize:11, textAlign:'center' }, onClick: ()=>{ setShowAuth(true); setMenuOpen(false); }}, 'Sign in')
                  )
                )))
          ))
      );
    }

    // ── BOTTOM NAV ────────────────────────────────────────────────────
    // Inactive nav colour: same slate family as C.dim, lifted to pass 4.5:1 on the navy bar.
    const NAV_INACTIVE = '#6F7F9E';
    function BottomNav({ view, setView, user, hasOrg }) {
      const items = [
        { v:'home', symbol:'⌂', label:'Home' },
        { v:'cfi', symbol:'◎', label:'Test' },
        { v:'lessons', symbol:'▲', label:'Lessons' },
        { v:'decisions', symbol:'◈', label:'Decisions' },
        hasOrg ? { v:'org', symbol:'⬡', label:'My Team' } : { v:'teams', symbol:'⬡', label:'Teams' },
      ];
      const [awaitingReview, setAwaitingReview] = useState(0);
      // Lets the footer reserve room for the fixed bar so it never covers content.
      useEffect(() => {
        document.body.classList.add('has-bottom-nav');
        return () => document.body.classList.remove('has-bottom-nav');
      }, []);
      useEffect(() => {
        if (!user) { setAwaitingReview(0); return; }
        listDecisionSessions(user.id).then(rows => {
          setAwaitingReview(rows.filter(d => d.status === 'open' && d.review_date && new Date(d.review_date) <= new Date()).length);
        });
      }, [user]);
      return (
        React.createElement("nav", {className: "bottom-nav", "aria-label": "Primary", style: {
          position:'fixed', bottom:0, left:0, right:0, zIndex:90,
          background:'rgba(5,12,26,0.95)', backdropFilter:'blur(20px)',
          borderTop:`1px solid ${C.border}`,
        }}, items.map(item => {
            const active = view === item.v;
            return React.createElement("button", {
              key: item.v,
              type: "button",
              className: "bottom-nav-item" + (active ? " is-active" : ""),
              "aria-current": active ? "page" : undefined,
              onClick: ()=>setView(item.v),
            },
              React.createElement("span", {className: "bottom-nav-icon", style: { ...mono, color: active ? C.cyan : NAV_INACTIVE }}, item.symbol,
                item.v==='decisions' && awaitingReview>0 && React.createElement("span", {className: "bottom-nav-dot"})),
              React.createElement("span", {className: "bottom-nav-label", style: { ...inter, color: active ? C.cyan : NAV_INACTIVE, fontWeight: active ? 600 : 400 }}, item.label)
            );
          }))
      );
    }


// ─────────────────────────────────────────────────────────────
//  BENTO HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Animated neural orb: shown in hero card */

/** Mini live-looking waveform strip */

/** A single stat chip for the metrics row */

/** CFI Progress bars card content */

/** Brain mode quad card: 2x2 grid */

/** Step timeline for "How it works" card */

// ═══════════════════════════════════════════════════════════════════
//  HOME VIEW: "You Are the Intelligence."
//  Cognitive Performance OS homepage. White / gold editorial system,
//  visually aligned with the CFI assessment (AC tokens in CFIView).
//  Scoped styles live under .nf-home so the rest of the app (which
//  uses the dark navy/gold "bento" system via the C token object)
//  is completely unaffected.
// ═══════════════════════════════════════════════════════════════════

// ── Homepage design tokens: now mapped onto the same dark navy/gold
// "bento" system (C) used by the Four Brains section, so the two feel
// like one continuous product instead of two different skins. ──────
const H = {
  bg: C.void, bgAlt: C.deep, ink: C.text, text: C.text,
  muted: C.muted, faint: C.dim, border: C.border,
  borderStrong: C.borderBright,
  gold: C.cyan, goldBright: C.cyanBright, goldDeep: C.cyanBright,
  goldTint: C.cyanDim, goldLine: C.borderBright,
  charcoal: C.surface, charcoalText: C.text, charcoalMuted: C.muted,
};
const hDisplay = { fontFamily: "'Clash Display','Syne',sans-serif" };
const hBody    = { fontFamily: "'Satoshi','DM Sans',sans-serif" };
const hMono    = { fontFamily: "'Space Mono',monospace" };


/** Shared radial diagram: four cognitive nodes around a center. Used in
 * the hero and in the "four ways of thinking" section at different sizes. */

/** Small uppercase mono label used as a recurring section marker. */

/** Renders the same note text, split into no-wrap phrases (each ending in the
 * existing " ·" separator) so a wrap can never strand a dot at the start of a line. */

// Logged-in recurring-use panel: "What are you trying to figure out?"
// Shown only to signed-in users on Home, right under the hero. Not part
// of the anonymous marketing funnel (which still leads with the CFI).

// ── Light caching so Home, Analytics and Academy never duplicate the same request ──
const nfjCache = {};
function nfjCached(key, ttl, loader) {
  const c = nfjCache[key];
  if (c && Date.now() - c.t < ttl) return c.p;
  const p = loader().catch(e => { delete nfjCache[key]; throw e; });
  nfjCache[key] = { t: Date.now(), p };
  return p;
}
function nfjInvalidate(prefix) { Object.keys(nfjCache).forEach(k => { if (k.indexOf(prefix) === 0) delete nfjCache[k]; }); }

const nfjLoadDecisions = (uid) => nfjCached('dec:' + uid, 15000, async () => {
  const { data, error } = await sb.from('decision_sessions')
    .select('id,title,decision,status,confidence,outcome,lesson_learned,review_date,reviewed_at,created_at')
    .eq('user_id', uid).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
});

// ── UI kit ───────────────────────────────────────────────────────────────────
function nfjTheme(light) {
  return light
    ? { light: true, ink: CP.ink, text: CP.text, muted: CP.muted, border: CP.border, strong: CP.borderStrong, card: CP.card, tint: CP.goldTint, accent: '#7A5F18', btn: CP.goldDeep, onAccent: '#FFFFFF', done: '#2F7D4F' }
    : { light: false, ink: C.text, text: C.text, muted: C.muted, border: C.border, strong: C.borderBright, card: C.surface, tint: C.cyanDim, accent: C.cyan, btn: C.cyan, onAccent: '#050C1A', done: '#7AAFCF' };
}
function nfjEnsureStyles() {
  if (typeof document === 'undefined' || document.getElementById('nfj-styles')) return;
  const s = document.createElement('style');
  s.id = 'nfj-styles';
  s.textContent = '.nfj-btn{min-height:48px;padding:12px 22px;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer;border:1px solid transparent;font-family:"DM Sans",sans-serif;max-width:100%;text-align:center}'
    + '.nfj-btn:focus-visible,.nfj-link:focus-visible{outline:2px solid #E2BE78;outline-offset:3px}'
    + '.nfj-light .nfj-btn:focus-visible,.nfj-light .nfj-link:focus-visible{outline-color:#8F701F}'
    + '.nfj-btn[disabled]{opacity:.6;cursor:not-allowed}.nfj-wrap{overflow-wrap:anywhere;min-width:0}'
    + '.nfj-sum{list-style:none;justify-content:space-between;gap:12px}.nfj-sum::-webkit-details-marker{display:none}.nfj-sum::after{content:"+";font-size:22px;line-height:1;flex-shrink:0}details[open]>.nfj-sum::after{content:"\\2212"}.nfj-sum:focus-visible{outline:2px solid #E2BE78;outline-offset:2px}'
    + '@media (min-width:720px){.nfj-two{display:grid;grid-template-columns:1fr 1fr;gap:20px}}';
  document.head.appendChild(s);
}
function useNFJStyles() { useEffect(nfjEnsureStyles, []); }

function NFJButton({ T, onClick, children, variant, disabled }) {
  const outline = variant === 'outline';
  return React.createElement('button', { className: 'nfj-btn', onClick, disabled,
    style: { background: outline ? 'transparent' : T.btn, color: outline ? T.accent : T.onAccent, borderColor: T.btn } }, children);
}
function NFJEyebrow({ T, children }) {
  return React.createElement('div', { style: { fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: '0.14em', color: T.accent, marginBottom: 10, textTransform: 'uppercase' } }, children);
}
// ── Opt-in sharing of a retest with the member's organisation (team before/after) ──
// Server: migration_team_progress.sql. Consent is per retest and per organisation; nothing is shared unless the
// person presses "Share". Renders nothing when the person isn't eligible OR when the migration isn't applied yet.
const nfjRetestRpc = async (name, args) => {
  const { data, error } = await sb.rpc(name, args);
  if (error) { console.error('[RETEST ' + name + ']', error); return { ok: false, error: 'request_failed' }; }
  return data;
};
function NFRetestShareView({ T, state, busy, error, onShare, onUnshare }) {
  if (!state || state.status !== 'ready' || !state.orgs || !state.orgs.length) return null;
  const thr = state.threshold || 5;
  return React.createElement('div', { className: 'nfj-light nfj-wrap', role: 'region', 'aria-label': 'Share your retest with your organisation' },
    state.orgs.map(o => React.createElement('div', { key: o.id, style: { background: T.card, border: '1px solid ' + T.border, borderRadius: 12, padding: '18px 18px', marginBottom: 20 } },
      React.createElement(NFJEyebrow, { T }, o.shared ? 'Shared with ' + o.name : 'Share this retest?'),
      React.createElement('div', { style: { fontSize: 14.5, color: T.text, lineHeight: 1.7, marginBottom: 14 } },
        o.shared
          ? 'This retest is included in ' + o.name + "'s team averages. " + o.name + ' only ever sees team averages, never your individual result. The first retest you share is the one counted. You can stop sharing at any time.'
          : 'You can include this retest in ' + o.name + "'s team averages, so the team can see how its thinking patterns develop. " + o.name + ' only ever sees team averages, never your individual result, and only once at least ' + thr + ' people have shared a retest. It is your choice: if you do nothing, nothing is shared. You can stop sharing at any time.'),
      o.shared
        ? React.createElement(NFJButton, { T, variant: 'outline', disabled: busy === o.id, onClick: () => onUnshare(o.id) }, busy === o.id ? 'Working…' : 'Stop sharing')
        : React.createElement(NFJButton, { T, disabled: busy === o.id, onClick: () => onShare(o.id) }, busy === o.id ? 'Working…' : 'Share my retest'))),
    error && React.createElement('div', { role: 'alert', style: { fontSize: 13.5, color: T.text, marginBottom: 16 } }, error));
}
function NFRetestShare({ user, resultId }) {
  useNFJStyles();
  const [state, setState] = useState({ status: 'loading', orgs: [], threshold: null });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!user || !resultId) return;
    let live = true;
    nfjRetestRpc('retest_share_options', { p_result_id: resultId }).then(r => {
      if (!live) return;
      if (r && r.ok) setState({ status: 'ready', orgs: r.orgs || [], threshold: r.threshold });
      else setState({ status: 'error', orgs: [], threshold: null });
    });
    return () => { live = false; };
  }, [user && user.id, resultId]);
  const act = async (fn, orgId, shared) => {
    setError(''); setBusy(orgId);
    const r = await nfjRetestRpc(fn, { p_result_id: resultId, p_org: orgId });
    setBusy(null);
    if (r && r.ok) setState(st => ({ ...st, orgs: st.orgs.map(o => o.id === orgId ? { ...o, shared } : o) }));
    else setError("We couldn't update that. Please try again.");
  };
  return React.createElement(NFRetestShareView, { T: nfjTheme(true), state, busy, error,
    onShare: (id) => act('link_cfi_retest_to_org', id, true), onUnshare: (id) => act('unlink_cfi_retest_from_org', id, false) });
}

// Plain-language names for the four result bands (the saved values stay the same in the database).
function plainBand(b) { return cfiCoordinationLabel(b) || ''; }

// Home: one simple page. Signed out = what it is + one button. Signed in = your next step.
function HomeView({ setView, user, setShowAuth, cfiResult, cfiHistory, lessonProgress, authLoading }) {
  const E = React.createElement;
  const completedLessons = Object.values(lessonProgress || {}).filter(v => v === 100).length;
  const wrap = { maxWidth: 760, margin: '0 auto', padding: '0 24px' };
  const h2 = { ...hDisplay, fontWeight: 600, fontSize: 'clamp(24px,3vw,32px)', lineHeight: 1.25, color: H.ink, margin: '0 0 12px' };
  const para = { ...hBody, fontSize: 16, lineHeight: 1.7, color: H.muted, margin: 0 };
  const tile = { background: C.surface, border: `1px solid ${H.border}`, borderRadius: 8, padding: '24px 22px', textAlign: 'left' };
  const tileTitle = { ...hDisplay, fontWeight: 600, fontSize: 17, color: H.ink, marginBottom: 6 };
  const section = (children, alt) => E("section", { style: { background: alt ? H.bgAlt : 'transparent', borderTop: `1px solid ${H.border}`, padding: '64px 0' } }, E("div", { style: wrap }, children));
  const styles = E("style", null, `
    .nf-home *, .nf-home *::before, .nf-home *::after { box-sizing:border-box; }
    .nf-home h1, .nf-home h2, .nf-home h3, .nf-home p { overflow-wrap:break-word; text-wrap:balance; }
    .nf-home .nf-home-cta-primary { background:${H.gold}; color:#151513; font-family:'Clash Display','Syne',sans-serif; font-weight:600; font-size:15px; letter-spacing:0.02em; padding:16px 30px; min-height:52px; border-radius:4px; border:none; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 6px 24px rgba(196,160,80,0.28); }
    .nf-home .nf-home-cta-outline { background:transparent; color:${H.ink}; font-family:'Satoshi','DM Sans',sans-serif; font-weight:500; font-size:15px; padding:15px 26px; min-height:52px; border-radius:4px; border:1px solid ${H.borderStrong}; cursor:pointer; }
    .nf-home .nf-home-cta-outline:hover { border-color:${H.goldDeep}; }
    .nf-home button:focus-visible, .nf-home summary:focus-visible { outline:2px solid ${H.gold}; outline-offset:2px; }
    .nf-home .nf-home-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; }
    .nf-home .nf-home-grid-4 { display:grid; grid-template-columns:repeat(2, 1fr); gap:16px; }
    @media (max-width: 700px) { .nf-home .nf-home-grid { grid-template-columns:1fr; } .nf-home .nf-home-grid-4 { grid-template-columns:1fr; } }
    .nf-home details { border-top:1px solid ${H.border}; padding:4px 0; }
    .nf-home summary { cursor:pointer; min-height:52px; display:flex; align-items:center; font-weight:600; font-size:16px; color:${H.ink}; }
    .nf-home details p { margin:0 0 16px; }
    .nf-home .nf-home-tile-btn { cursor:pointer; font:inherit; color:inherit; width:100%; }
    .nf-home .nf-home-tile-btn:hover { border-color:${H.goldDeep}; }
    .nf-home .nf-home-list { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
    .nf-home .nf-home-list li { font-family:'Satoshi','DM Sans',sans-serif; font-size:16px; line-height:1.6; color:${H.text}; padding:14px 18px; border-left:2px solid ${H.goldLine}; background:${C.surface}; border-radius:0 6px 6px 0; }
    .nf-home .nf-home-steps { display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; }
    @media (max-width: 900px) { .nf-home .nf-home-steps { grid-template-columns:repeat(2, 1fr); } }
    @media (max-width: 560px) { .nf-home .nf-home-steps { grid-template-columns:1fr; } }
    .nf-home .nf-home-quote { border-left:2px solid ${H.goldLine}; padding:4px 0 4px 20px; }
    .nf-home a.nf-home-link { color:${H.goldDeep}; text-decoration:underline; }
  `);
  const steps = [
    ['01', 'Take the test', '13 quick questions about how you approach situations and decisions.'],
    ['02', 'See your result', 'Understand your thinking patterns and where your thinking may become fragmented.'],
    ['03', 'Learn and practise', 'Use short lessons and exercises to build stronger thinking habits.'],
  ];
  const ways = [
    ['Logic & facts', 'Analytical'],
    ['Gut feeling', 'Intuitive'],
    ['Connecting ideas', 'Associative'],
    ['Stepping back', 'Reflective'],
  ];
  const faq = [
    ['Is this a medical test or a personality test?', 'No. It is not a diagnosis, a personality label or an intelligence test. It shows your thinking habits today, so you can improve them.'],
    ['Is it free?', 'Yes. The test and the first lesson are free. The full set of lessons is a one-time payment. Teams can create a team, share one link, and take the test and lessons together.'],
    ['Do I need an account?', 'Yes, a free one. It keeps your result safe so you can come back, take the test again and see how you have improved.'],
  ];

  // ---------- Signed in: your next step ----------
  if (user) {
    const hasResult = !!cfiResult;
    const next = !hasResult
      ? { title: 'Take the test', text: '13 quick questions, about 4 minutes. You will see how you think.', cta: 'Start the test', go: 'cfi' }
      : completedLessons < 1
        ? { title: 'Start your first lesson', text: 'Short lessons that build better thinking habits.', cta: 'Open lessons', go: 'lessons' }
        : { title: 'Keep going with your lessons', text: completedLessons + (completedLessons === 1 ? ' lesson' : ' lessons') + ' done so far.', cta: 'Continue', go: 'lessons' };
    return E("div", { className: "nf-home", style: { background: H.bg, color: H.text, paddingTop: 60, minHeight: '100vh' } }, styles,
      E("div", { style: { ...wrap, padding: '56px 24px 80px' } },
        E("h1", { style: { ...hDisplay, fontWeight: 600, fontSize: 'clamp(28px,5vw,40px)', lineHeight: 1.15, color: H.ink, margin: '0 0 28px' } }, 'Welcome back'),
        E("div", { style: { ...tile, padding: '32px 28px', marginBottom: 20, borderColor: H.goldLine } },
          E("div", { style: { ...hMono, fontSize: 11, letterSpacing: '0.1em', color: H.faint, marginBottom: 10 } }, 'YOUR NEXT STEP'),
          E("div", { style: { ...hDisplay, fontWeight: 600, fontSize: 22, color: H.ink, marginBottom: 8 } }, next.title),
          E("p", { style: { ...para, marginBottom: 20 } }, next.text),
          E("button", { className: "nf-home-cta-primary", onClick: () => setView(next.go) }, next.cta)),
        hasResult ? E("p", { style: { ...para, marginBottom: 28 } }, 'Your last result: ', E("strong", { style: { color: H.ink } }, plainBand(cfiResult.band)), '. ',
          E("button", { onClick: () => setView('analytics'), style: { background: 'none', border: 'none', padding: 0, font: 'inherit', color: H.goldDeep, textDecoration: 'underline', cursor: 'pointer' } }, 'See my progress')) : null,
        E("div", { className: "nf-home-grid" },
          E("button", { className: "nf-home-tile-btn", style: tile, onClick: () => setView('lessons') }, E("div", { style: tileTitle }, 'Lessons'), E("div", { style: { ...para, fontSize: 14 } }, 'Short lessons to think better.')),
          E("button", { className: "nf-home-tile-btn", style: tile, onClick: () => setView('decisions') }, E("div", { style: tileTitle }, 'Make a decision'), E("div", { style: { ...para, fontSize: 14 } }, 'Think a real decision through, step by step.')),
          E("button", { className: "nf-home-tile-btn", style: tile, onClick: () => setView('analytics') }, E("div", { style: tileTitle }, 'My progress'), E("div", { style: { ...para, fontSize: 14 } }, 'See how your thinking changes over time.')))));
  }

  // ---------- Signed out: the full homepage ----------
  const go = () => setView('cfi');
  const list = (items) => E("ul", { className: "nf-home-list" }, items.map(t => E("li", { key: t }, t)));
  const centered = { textAlign: 'center' };
  const symptoms = [
    'You research a decision for days and still can\u2019t make it.',
    'You ask AI first and your own head second.',
    'You know what to do, then freeze when the pressure comes.',
    'You finish the day tired and can\u2019t say what you actually figured out.',
    'You jump between ideas and finish none of them.',
  ];
  const costs = [
    ['Decisions that look fine at the time', 'and turn out wrong later.'],
    ['Decisions that come too late', 'so the opportunity is gone.'],
    ['Meetings that go in circles', 'because nobody is thinking the same way.'],
    ['Tiredness from thinking hard', 'without thinking well.'],
  ];
  const flow = [
    ['1', 'Take the test', 'The CFI maps how you think across four modes.'],
    ['2', 'See your pattern', 'You get your profile and where your thinking breaks down.'],
    ['3', 'Train it', 'Work a real decision through the Core Loop: break it down, check your gut, widen the options, step back, then land on one position.'],
    ['4', 'Check your progress', 'Retake the test later. Clarity Delta shows what changed.'],
  ];
  const modes = [
    ['Analytical', 'Facts, logic and evidence.'],
    ['Intuitive', 'Gut feel and fast pattern recognition.'],
    ['Associative', 'Connecting ideas that don\u2019t obviously belong together.'],
    ['Reflective', 'Looking back at your assumptions, your emotions and what it all means.'],
  ];
  const gets = [
    'Your cognitive profile',
    'Which thinking modes you rely on and which you avoid',
    'Where your thinking fragments under pressure',
    'A starting point to measure against later',
  ];
  const audience = [
    ['Students and graduates', 'who want to decide better, not just study more.'],
    ['Founders and professionals', 'making calls with incomplete information.'],
    ['Anyone whose thinking feels scattered', 'and wants to know why.'],
    ['Coaches and trainers', 'who want a structured way to work on thinking.'],
  ];
  const trust = [
    'The scoring method is public. You can read exactly how the CFI works, and where it falls short, on the methodology page.',
    'The instrument went through an expert content-validity review.',
    'We say plainly what it is not. It is not a diagnosis, and Clarity Delta is a NeuralFusion measure, not a clinical one.',
  ];
  const faqFull = [
    ['Is this a medical test or a personality test?', 'No. It is not a diagnosis, a personality label or an intelligence test. It shows your thinking habits today, so you can improve them.'],
    ['How long does it take?', '13 questions, about 4 minutes.'],
    ['Is it free?', 'The test and the first lesson are free. The full set of lessons is a one-time payment. Teams can create a team, share one link, and take the test and lessons together.'],
    ['Is this an AI chatbot?', 'No. NeuralFusion trains your own thinking. It does not think for you.'],
    ['Do I need an account?', 'Yes, a free one. It keeps your result safe so you can come back, take the test again and see how you have improved.'],
    ['What happens to my data?', null],
  ];
  const card = (title, text, key) => E("div", { key: key || title, style: tile }, E("div", { style: tileTitle }, title), E("p", { style: { ...para, fontSize: 14 } }, text));

  return E("div", { className: "nf-home", style: { background: H.bg, color: H.text, paddingTop: 60 } }, styles,

    // Hero
    E("div", { style: { ...wrap, padding: '80px 24px 72px', ...centered } },
      E("h1", { style: { ...hDisplay, fontWeight: 600, fontSize: 'clamp(34px,6vw,56px)', lineHeight: 1.08, letterSpacing: '-0.02em', color: H.ink, margin: '0 0 20px' } }, 'Why is it so hard to think clearly lately?'),
      E("p", { style: { ...para, fontSize: 18, maxWidth: 580, margin: '0 auto 32px' } }, 'Too much input, too many decisions, and AI answering before you\u2019ve finished the question. NeuralFusion shows you how you actually think, and trains the parts that are weak.'),
      E("button", { className: "nf-home-cta-primary", onClick: go }, 'Take the free test'),
      E("p", { style: { ...para, fontSize: 14, color: H.faint, marginTop: 16 } }, '13 questions, about 4 minutes. Free account to save your result.')),

    // Sound familiar
    section([
      E("h2", { key: 'h', style: h2 }, 'Sound familiar?'),
      E("div", { key: 'l', style: { marginTop: 20 } }, list(symptoms)),
      E("p", { key: 'p', style: { ...para, marginTop: 20 } }, 'If you nodded at two or more, keep reading.')
    ], true),

    // What is going on
    section([
      E("h2", { key: 'h', style: h2 }, 'What is going on'),
      E("p", { key: 'a', style: { ...para, marginBottom: 14 } }, 'Most people assume this is a focus problem or a discipline problem. It usually isn\u2019t. We call it cognitive fragmentation: your thinking splits into pieces that don\u2019t talk to each other.'),
      E("p", { key: 'b', style: { ...para, marginBottom: 14 } }, 'Some people overanalyze. Some run on gut feeling only. Some drown in ideas. Some replay everything and never act.'),
      E("p", { key: 'c', style: para }, 'It is common, it is not a medical condition, and it can be measured.')
    ]),

    // What it costs
    section([
      E("h2", { key: 'h', style: h2 }, 'What it costs you'),
      E("div", { key: 'g', className: "nf-home-grid-4", style: { marginTop: 20 } }, costs.map(([t, x]) => card(t, x)))
    ], true),

    // How it works
    section([
      E("h2", { key: 'h', style: { ...h2, marginBottom: 28 } }, 'How NeuralFusion works'),
      E("div", { key: 'g', className: "nf-home-steps" }, flow.map(([n, t, x]) => E("div", { key: n, style: tile },
        E("div", { style: { ...hMono, fontSize: 13, color: H.goldDeep, marginBottom: 10 } }, n),
        E("div", { style: tileTitle }, t), E("p", { style: { ...para, fontSize: 14 } }, x))))
    ]),

    // Four modes
    section([
      E("h2", { key: 'h', style: h2 }, 'The four ways you think'),
      E("p", { key: 'p', style: { ...para, marginBottom: 28 } }, 'Everyone uses four modes of thinking. Most people lean on one or two. Good decisions usually need all four. Bad ones usually skip one.'),
      E("div", { key: 'g', className: "nf-home-grid-4" }, modes.map(([t, x]) => card(t, x)))
    ], true),

    // What the free test gives you
    section([
      E("h2", { key: 'h', style: h2 }, 'What you get from the free test'),
      E("div", { key: 'l', style: { marginTop: 20 } }, list(gets)),
      E("div", { key: 'b', style: { marginTop: 28 } }, E("button", { className: "nf-home-cta-primary", onClick: go }, 'Take the free test'))
    ]),

    // AI era
    section([
      E("h2", { key: 'h', style: h2 }, 'Thinking in the AI era'),
      E("p", { key: 'a', style: { ...para, marginBottom: 14 } }, 'AI is useful. But if it writes the first draft of all your thinking, your own judgment gets weaker without you noticing.'),
      E("p", { key: 'b', style: para }, 'NeuralFusion is for people who want to use AI and still be the one who decides.')
    ], true),

    // Who it is for
    section([
      E("h2", { key: 'h', style: h2 }, 'Who it is for'),
      E("div", { key: 'g', className: "nf-home-grid-4", style: { marginTop: 20 } }, audience.map(([t, x]) => card(t, x)))
    ]),

    // Teams
    section([
      E("div", { key: 'c', style: centered },
        E("h2", { style: h2 }, 'For teams'),
        E("p", { style: { ...para, maxWidth: 560, margin: '0 auto 24px' } }, 'Teams rarely fail from a lack of intelligence. They fail because everyone thinks the same way, or because no one does. Create a team, share one link, and see how your group thinks as a whole. It works for leadership teams, HR and training programmes.'),
        E("button", { className: "nf-home-cta-outline", onClick: () => setView('teams') }, 'Create a team'))
    ], true),

    // Trust
    section([
      E("h2", { key: 'h', style: h2 }, 'Why you can trust this'),
      E("div", { key: 'l', style: { marginTop: 20 } }, list(trust)),
      E("p", { key: 'p', style: { ...para, marginTop: 20 } }, E("a", { className: "nf-home-link", href: "/methodology" }, 'Read the CFI methodology'))
    ]),

    // Founder note
    section([
      E("h2", { key: 'h', style: h2 }, 'Why I built this'),
      E("div", { key: 'q', className: "nf-home-quote" },
        E("p", { style: { ...para, color: H.text, marginBottom: 14 } }, 'I built NeuralFusion because smart people around me, and I too, kept making poor decisions and feeling mentally tired for no clear reason. I could not find a tool that trained thinking itself, so I built one.'),
        E("p", { style: { ...para, color: H.text, marginBottom: 14 } }, 'Take the test. If it helps, stay. If it doesn\u2019t, tell me why.'),
        E("p", { style: { ...para, fontSize: 14 } }, 'Life Edet, Founder'))
    ], true),

    // FAQ
    section([
      E("h2", { key: 'h', style: h2 }, 'Common questions'),
      E("div", { key: 'f', style: { marginTop: 16 } }, faqFull.map(([q, a]) => E("details", { key: q }, E("summary", null, q),
        a ? E("p", { style: para }, a)
          : E("p", { style: para }, 'How your data is handled is explained in the ', E("a", { className: "nf-home-link", href: "/privacy" }, 'privacy policy'), '.'))))
    ]),

    // Final CTA
    section([
      E("div", { key: 'c', style: centered },
        E("h2", { style: { ...h2, fontSize: 'clamp(28px,4vw,40px)' } }, 'Find out how you really think.'),
        E("p", { style: { ...para, maxWidth: 480, margin: '0 auto 24px' } }, '13 questions, about 4 minutes, free.'),
        E("button", { className: "nf-home-cta-primary", onClick: go }, 'Take the free test'))
    ], true));
}

    // ═══════════════════════════════════════════════════════════════════
    //  FOUR BRAINS VIEW
    // ═══════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════
    //  INTEGRATION PROTOCOL: interactive experience
    //  Decompose → Sense → Expand → Reflect → Fuse
    //
    //  Philosophy: NeuralFusion does not think for the visitor. It
    //  organizes and reflects the visitor's own thinking back to them.
    //  Every line of "synthesis" below is derived from words the visitor
    //  typed themselves, never a generated recommendation or decision.
    // ═══════════════════════════════════════════════════════════════════

    const PROTOCOL_STOPWORDS = new Set(['this','that','these','those','with','from','have','will','been','were','they','them','their','what','when','where','which','while','about','because','would','could','should','there','here','than','then','also','just','into','over','under','some','more','most','very','really','feel','feels','feeling','think','thinking','know','like','want','need','sure','maybe','things','thing','something','someone','anything','everything','being','doing','going','still','right','wrong']);

    function protocolTokenize(text) {
      if (!text) return [];
      return (text.toLowerCase().match(/[a-z']+/g) || [])
        .filter(w => w.length > 3 && !PROTOCOL_STOPWORDS.has(w));
    }

    function protocolWordFreq(words) {
      const freq = {};
      words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      return freq;
    }

    function protocolTopWords(freq, exclude, n = 3) {
      return Object.entries(freq)
        .filter(([w]) => !exclude.has(w))
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([w]) => w);
    }

    const PROTOCOL_UNCERTAINTY_RE = /\b(not sure|don'?t know|unsure|unclear|maybe|confused|torn|conflicted|undecided|can'?t tell|no idea)\b/i;

    // Reads the visitor's own four answers and reflects patterns back to
    // them in their own language. Hedged, non-directive phrasing throughout,
    // NeuralFusion never tells the visitor what to decide.
    function synthesizeProtocol(answers) {
      const logicalWords = [...protocolTokenize(answers.decompose), ...protocolTokenize(answers.expand)];
      const signalWords  = [...protocolTokenize(answers.sense), ...protocolTokenize(answers.reflect)];
      const logicalFreq = protocolWordFreq(logicalWords);
      const signalFreq  = protocolWordFreq(signalWords);
      const logicalSet = new Set(Object.keys(logicalFreq));
      const signalSet  = new Set(Object.keys(signalFreq));

      const convergence = [...logicalSet].filter(w => signalSet.has(w))
        .sort((a, b) => (logicalFreq[b] + signalFreq[b]) - (logicalFreq[a] + signalFreq[a]))
        .slice(0, 5);

      const divergentLogical = protocolTopWords(logicalFreq, signalSet, 3);
      const divergentSignal  = protocolTopWords(signalFreq, logicalSet, 3);
      const hasTension = divergentLogical.length > 0 && divergentSignal.length > 0;
      const uncertain = [answers.decompose, answers.sense, answers.expand, answers.reflect]
        .some(a => PROTOCOL_UNCERTAINTY_RE.test(a || ''));

      const topLogical = divergentLogical[0];
      const topSignal = divergentSignal[0];

      let insight;
      if (hasTension) {
        insight = `Your reasoning keeps returning to "${topLogical}," while your instincts and values keep raising "${topSignal}." That gap between what you can argue and what you're sensing may be worth investigating before you decide.`;
      } else if (convergence.length >= 2) {
        insight = `"${convergence[0]}" and "${convergence[1]}" show up in both your reasoning and your instincts. When your logic and your gut are naming the same thing, that convergence is usually worth paying attention to.`;
      } else if (convergence.length === 1) {
        insight = `"${convergence[0]}" is the one thread running through both your reasoning and your instincts. Everything else may still be unsettled, and that's useful to know before you decide.`;
      } else {
        insight = "Your four responses don't share much common language yet. That isn't a failure, it may simply mean this decision needs more time, more information, or a different question before it comes into focus.";
      }

      const gapQuestions = [
        topSignal ? `What evidence would explain why "${topSignal}" keeps coming up for you?` : "What evidence would explain what your intuition is picking up on?",
        topLogical ? `What might your intuition be detecting that "${topLogical}" doesn't fully capture?` : "What might your intuition be detecting that your analysis doesn't fully capture?",
        "What information would make the gap between your reasoning and your instincts clearer?",
      ];

      return { convergence, divergentLogical, divergentSignal, hasTension, uncertain, insight, gapQuestions };
    }

    const PROTOCOL_STEPS = [
      {
        key: 'decompose', num: '01', title: 'BREAK IT DOWN', brain: 'analytical',
        subtitle: 'Separate the problem from the noise.',
        intro: 'No interpretation, no emotion, no judgment yet, just the verifiable structure of what is actually happening.',
        questions: ['What do you know for certain?', 'What are you assuming?', 'What constraints are you dealing with?', 'What remains unclear?'],
        placeholder: 'What do you know for certain? What are you assuming? What constraints are you working with? What remains unclear?',
        cta: 'Next: check your gut',
      },
      {
        key: 'sense', num: '02', title: 'CHECK YOUR GUT', brain: 'intuitive',
        subtitle: 'What is your intuition noticing?',
        intro: "Not every useful signal arrives as a fully formed argument. Examine what your instincts and internal signals are telling you.",
        questions: ['What is your gut telling you?', 'What feels right?', 'What feels wrong or concerning?', "Is there something you're noticing that you can't fully explain yet?"],
        placeholder: "What does your gut tell you? What feels right, what feels off, what can't you quite explain?",
        cta: 'Next: look wider',
      },
      {
        key: 'expand', num: '03', title: 'LOOK WIDER', brain: 'associative',
        subtitle: 'Open the problem before narrowing it.',
        intro: 'Before choosing an answer, explore what else might be possible.',
        questions: ['What other options exist?', "What are you not considering?", 'What would you do if the obvious option disappeared?', 'Can the problem be reframed?'],
        placeholder: 'What other options exist? What are you not considering? How else could this be framed?',
        cta: 'Next: step back',
      },
      {
        key: 'reflect', num: '04', title: 'STEP BACK', brain: 'reflective',
        subtitle: 'Step back and examine the decision itself.',
        intro: 'Examine what actually matters here, beneath the pressure of the moment.',
        questions: ['What matters most to you here?', 'What are you trying to protect or achieve?', 'What might you regret?', 'Are fear, pressure, ego, or expectations influencing your thinking?'],
        placeholder: 'What matters most here? What are you protecting or trying to achieve? What might you regret? Would your answer change without outside expectations?',
        cta: 'See my summary',
      },
    ];

    // ── Accessible design tokens (WCAG AA, dyslexia-friendly) ──────────
    // Shared with the CFI assessment (CFIView) so the Decision helper
    // reads as one continuous experience with the CFI, not a separate style.
    const PROTOCOL_AC = {
      bg: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: '#F9FAFB',
      text: '#111827', muted: '#4B5563', border: '#D1D5DB',
      gold: '#C8A95A', goldDark: '#8A6D2F', goldTint: '#FBF3E3',
      focus: '#8A6D2F',
      font: "'Atkinson Hyperlegible', 'Inter', -apple-system, sans-serif",
    };

    // Injects the same dyslexia-friendly font + focus-visible styles CFIView
    // uses. Guarded by id so it's a no-op if CFIView already added them.
    function useProtocolA11yStyles() {
      useEffect(() => {
        if (!document.getElementById('nf-a11y-font')) {
          const link = document.createElement('link');
          link.id = 'nf-a11y-font';
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap';
          document.head.appendChild(link);
        }
        if (!document.getElementById('nf-a11y-styles')) {
          const style = document.createElement('style');
          style.id = 'nf-a11y-styles';
          style.textContent = `
            .nf-a11y-scale-btn:focus-visible,
            .nf-a11y-btn:focus-visible {
              outline: 3px solid ${PROTOCOL_AC.focus};
              outline-offset: 3px;
            }
            .nf-a11y-scale-btn:hover { border-color: ${PROTOCOL_AC.gold} !important; background: ${PROTOCOL_AC.goldTint} !important; }
            .nf-a11y-textarea:focus { border-color: ${PROTOCOL_AC.goldDark} !important; box-shadow: 0 0 0 3px rgba(138,109,47,0.12) !important; }
            @media (prefers-reduced-motion: reduce) {
              .nf-a11y-fade { animation: none !important; }
            }
          `;
          document.head.appendChild(style);
        }
      }, []);
    }

    function ProtocolTextarea({ value, onChange, placeholder, minHeight = 130 }) {
      return React.createElement("textarea", {
        className: "nf-a11y-textarea",
        value, onChange, placeholder, rows: 5,
        style: {
          width:'100%', minHeight, resize:'vertical',
          background:'#FFFFFF', border:`2px solid ${PROTOCOL_AC.border}`, borderRadius:16,
          color:PROTOCOL_AC.text, fontFamily:PROTOCOL_AC.font, fontSize:17, lineHeight:1.6,
          padding:'16px 18px', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s',
        },
      });
    }

    function ProtocolProgress({ percent, label }) {
      return (
        React.createElement("div", null,
          React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }},
            React.createElement("div", {style: { fontFamily:PROTOCOL_AC.font, fontSize:15, fontWeight:700, color:PROTOCOL_AC.text }}, label),
            React.createElement("div", {style: { fontFamily:PROTOCOL_AC.font, fontSize:15, fontWeight:600, color:PROTOCOL_AC.goldDark }}, percent, '% done')
          ),
          React.createElement("div", {role:'progressbar', 'aria-valuenow':percent, 'aria-valuemin':0, 'aria-valuemax':100, style: { height:10, background:PROTOCOL_AC.surfaceAlt, border:`1px solid ${PROTOCOL_AC.border}`, borderRadius:6, marginBottom:14, overflow:'hidden' }},
            React.createElement("div", {style: { width:`${percent}%`, height:'100%', background:PROTOCOL_AC.gold, borderRadius:6, transition:'width 0.4s ease' }})
          )
        )
      );
    }

    // ── Save This Decision (persists the Fuse output to the My decisions) ──
    function DecisionSavePanel({ problem, answers, synthesis, user, setShowAuth, setView }) {
      const AC = PROTOCOL_AC;
      const [title, setTitle] = useState('');
      const [confidence, setConfidence] = useState(60);
      const [nextAction, setNextAction] = useState('');
      const [reviewDate, setReviewDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
      });
      const [saving, setSaving] = useState(false);
      const [saved, setSaved] = useState(null);
      const teamCtx = (window.NF_ORG && window.NF_ORG.getDecisionContext && window.NF_ORG.getDecisionContext()) || null;
      const [toTeam, setToTeam] = useState(!!teamCtx);
      const [responsible, setResponsible] = useState('');
      const [error, setError] = useState('');

      const handleSave = async () => {
        if (!user) { setShowAuth(true); return; }
        if (!title.trim()) { setError('Give this decision a short title.'); return; }
        setSaving(true); setError('');
        const teamFields = (teamCtx && toTeam) ? { org_id: teamCtx.org, shared_with_org: true, responsible: responsible.trim() || null } : {};
        const row = await saveDecisionSession(user.id, {
          ...teamFields,
          title: title.trim(),
          problem,
          decompose_response: answers.decompose,
          sense_response: answers.sense,
          expand_response: answers.expand,
          reflect_response: answers.reflect,
          fuse_response: synthesis.insight,
          decision: title.trim(),
          confidence,
          key_uncertainty: synthesis.hasTension ? `${synthesis.divergentLogical.join(', ')} vs ${synthesis.divergentSignal.join(', ')}` : null,
          next_action: nextAction.trim() || null,
          review_date: reviewDate || null,
          status: 'open',
        });
        setSaving(false);
        if (row) { if (teamFields.org_id && window.NF_ORG) window.NF_ORG.clearDecisionContext(); setSaved(row); } else setError("Couldn't save right now. Check your connection and try again.");
      };

      if (saved) {
        return (
          React.createElement("div", { role: 'status', style: { padding: '24px', background: AC.goldTint, border: `1px solid ${AC.gold}`, borderRadius: 16, marginBottom: 24, textAlign: 'center' } },
            React.createElement("div", { style: { fontFamily: AC.font, fontSize: 16, fontWeight: 700, color: AC.text, marginBottom: 6 } }, 'Saved to My decisions'),
            React.createElement("div", { style: { fontSize: 14, color: AC.muted, marginBottom: 16 } }, saved.review_date ? `You'll be prompted to review this on ${saved.review_date}.` : 'You can reopen this any time.'),
            React.createElement("button", { className: "nf-a11y-btn", onClick: () => setView('decisions'), style: { fontFamily: AC.font, fontSize: 15, fontWeight: 700, padding: '14px 24px', minHeight: 48, background: AC.goldDark, color: '#FFFFFF', border: 'none', borderRadius: 14, cursor: 'pointer' } }, 'Open My decisions →')
          )
        );
      }

      return (
        React.createElement("div", { style: { padding: '26px 24px', background: AC.surface, border: `2px solid ${AC.goldDark}`, borderRadius: 16, marginBottom: 24 } },
          React.createElement("div", { style: { fontFamily: AC.font, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', color: AC.goldDark, marginBottom: 6, textTransform: 'uppercase' } }, 'Decide: save this decision'),
          React.createElement("p", { style: { fontSize: 13.5, color: AC.muted, lineHeight: 1.6, marginBottom: 18 } }, 'Turn this session into a decision record you can revisit, review, and learn from.'),
          React.createElement("label", { style: { display: 'block', fontSize: 13, fontWeight: 700, color: AC.text, marginBottom: 6 } }, 'Decision, in one line'),
          React.createElement("input", { type: 'text', value: title, onChange: e => setTitle(e.target.value), placeholder: 'e.g. Leave my job to build my company', className: "nf-a11y-textarea", style: { width: '100%', padding: '12px 14px', fontSize: 15, border: `2px solid ${AC.border}`, borderRadius: 12, marginBottom: 16, fontFamily: AC.font, color: AC.text } }),
          React.createElement("label", { style: { display: 'block', fontSize: 13, fontWeight: 700, color: AC.text, marginBottom: 6 } }, `Confidence: ${confidence}%`),
          React.createElement("input", { type: 'range', min: 0, max: 100, value: confidence, onChange: e => setConfidence(parseInt(e.target.value, 10)), style: { width: '100%', marginBottom: 16, accentColor: AC.goldDark } }),
          React.createElement("label", { style: { display: 'block', fontSize: 13, fontWeight: 700, color: AC.text, marginBottom: 6 } }, 'Next action'),
          React.createElement("input", { type: 'text', value: nextAction, onChange: e => setNextAction(e.target.value), placeholder: 'What happens next?', className: "nf-a11y-textarea", style: { width: '100%', padding: '12px 14px', fontSize: 15, border: `2px solid ${AC.border}`, borderRadius: 12, marginBottom: 16, fontFamily: AC.font, color: AC.text } }),
          React.createElement("label", { style: { display: 'block', fontSize: 13, fontWeight: 700, color: AC.text, marginBottom: 6 } }, 'Review this on'),
          React.createElement("input", { type: 'date', value: reviewDate, onChange: e => setReviewDate(e.target.value), className: "nf-a11y-textarea", style: { padding: '12px 14px', fontSize: 15, border: `2px solid ${AC.border}`, borderRadius: 12, marginBottom: 16, fontFamily: AC.font, color: AC.text } }),
          teamCtx && React.createElement("div", { style: { marginBottom: 16, padding: '12px 14px', border: `2px solid ${AC.border}`, borderRadius: 12 } },
            React.createElement("label", { style: { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, fontWeight: 700, color: AC.text, cursor: 'pointer' } },
              React.createElement("input", { type: 'checkbox', checked: toTeam, onChange: e => setToTeam(e.target.checked), style: { marginTop: 3 } }),
              React.createElement("span", null, `Save to my team${teamCtx.name ? ' (' + teamCtx.name + ')' : ''}. Teammates can read this decision, including your answers above.`)),
            toTeam && React.createElement("div", { style: { marginTop: 12 } },
              React.createElement("label", { style: { display: 'block', fontSize: 13, fontWeight: 700, color: AC.text, marginBottom: 6 } }, 'Who is responsible for the next action?'),
              React.createElement("input", { type: 'text', maxLength: 120, value: responsible, onChange: e => setResponsible(e.target.value), placeholder: 'A name or role', className: "nf-a11y-textarea", style: { width: '100%', padding: '12px 14px', fontSize: 15, border: `2px solid ${AC.border}`, borderRadius: 12, fontFamily: AC.font, color: AC.text } }))),
          error && React.createElement("div", { role: 'alert', style: { fontSize: 13, color: '#B42318', marginBottom: 12 } }, error),
          React.createElement("button", { className: "nf-a11y-btn", onClick: handleSave, disabled: saving, style: { fontFamily: AC.font, fontSize: 16, fontWeight: 700, padding: '16px 28px', minHeight: 52, background: AC.goldDark, color: '#FFFFFF', border: 'none', borderRadius: 16, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 } }, saving ? 'Saving…' : (user ? 'Save this decision' : 'Sign in to Save →'))
        )
      );
    }

    // ── Fuse / Result screen ────────────────────────────────────────────
    function ProtocolResult({ problem, answers, setView, user, setShowAuth, onRestart, cfiResult }) {
      useProtocolA11yStyles();
      const synthesis = useMemo(() => synthesizeProtocol(answers), [answers]);
      const AC = PROTOCOL_AC;
      const modes = [
        { key:'decompose', brain:'analytical', title:'Analytical', tag:'Facts · Logic · Evidence' },
        { key:'sense', brain:'intuitive', title:'Intuitive', tag:'Signals · Instinct · Patterns' },
        { key:'expand', brain:'associative', title:'Associative', tag:'Connections · Possibilities · Creativity' },
        { key:'reflect', brain:'reflective', title:'Reflective', tag:'Perspective · Meaning · Self-awareness' },
      ];

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:60, background:AC.bg, minHeight:'100vh', fontFamily:AC.font }},
          React.createElement("div", {style: { maxWidth:920, margin:'0 auto', padding:'24px 20px' }},

            React.createElement("div", {style: { fontFamily:AC.font, fontSize:14, fontWeight:700, letterSpacing:'0.06em', color:AC.goldDark, marginBottom:8, textTransform:'uppercase' }}, 'Decision helper · Your summary'),
            React.createElement("div", {style: { fontSize:14, color:AC.muted, lineHeight:1.6, marginBottom:20, maxWidth:640 }},
              'NeuralFusion does not think for you. It helps you see how you are thinking. Everything below is drawn from your own words, not a decision, diagnosis, or recommendation.'
            ),

            React.createElement("h1", {style: { fontFamily:AC.font, fontSize:'clamp(24px,4.5vw,30px)', fontWeight:800, color:AC.text, marginBottom:20, lineHeight:1.3 }}, 'Your thinking, pulled together.'),

            // Your Problem
            React.createElement("div", {style: { padding:'20px 22px', background:AC.surface, border:`1px solid ${AC.border}`, borderRadius:16, boxShadow:'0 1px 3px rgba(17,24,39,0.06)', marginBottom:28 }},
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:13, fontWeight:700, letterSpacing:'0.04em', color:AC.goldDark, marginBottom:10, textTransform:'uppercase' }}, 'Your Problem'),
              React.createElement("div", {style: { fontSize:16, color:AC.text, lineHeight:1.7 }}, problem || 'No problem entered.')
            ),

            // Four ways of thinking
            React.createElement("div", {style: { fontFamily:AC.font, fontSize:14, fontWeight:700, letterSpacing:'0.04em', color:AC.goldDark, marginBottom:14, textTransform:'uppercase' }}, 'Your Four Ways of Thinking'),
            React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(240px,100%),1fr))', gap:16, marginBottom:32 }},
              modes.map(m => {
                const b = C.brains[m.brain];
                return (
                  React.createElement("div", {key: m.key, style: {
                    padding:'20px 22px', background:AC.surface, border:`1px solid ${AC.border}`, borderLeft:`4px solid ${b.color}`,
                    borderRadius:16, boxShadow:'0 1px 3px rgba(17,24,39,0.06)',
                  }},
                    React.createElement("div", {style: { display:'flex', alignItems:'center', gap:10, marginBottom:10 }},
                      React.createElement("span", {style: { fontSize:17, color:b.color }}, b.symbol),
                      React.createElement("div", null,
                        React.createElement("div", {style: { fontFamily:AC.font, fontSize:15, fontWeight:700, color:AC.text }}, m.title),
                        React.createElement("div", {style: { fontSize:11.5, letterSpacing:'0.03em', color:b.color, fontWeight:600 }}, m.tag)
                      )
                    ),
                    React.createElement("div", {style: { fontSize:14, color:AC.muted, lineHeight:1.7, whiteSpace:'pre-wrap' }}, answers[m.key] || 'No response given.')
                  )
                );
              })
            ),

            // Convergence
            React.createElement("div", {style: { padding:'22px', background:AC.surfaceAlt, border:`1px solid ${AC.border}`, borderRadius:16, marginBottom:16 }},
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:13, fontWeight:700, letterSpacing:'0.04em', color:AC.goldDark, marginBottom:10, textTransform:'uppercase' }}, 'Where Your Thinking Converged'),
              React.createElement("div", {style: { fontSize:14, color:AC.text, lineHeight:1.8 }},
                synthesis.convergence.length
                  ? React.createElement("span", null, 'Across your reasoning and your instincts, these ideas kept resurfacing: ',
                      synthesis.convergence.map((w,i) => React.createElement("span", {key: w}, i>0 ? ', ' : '', React.createElement("strong", {style:{color:AC.goldDark}}, w))),
                      '. Your responses appear to converge around these themes.'
                    )
                  : "Your reasoning and your instincts didn't share much common language this time. That's fine, it may simply mean this is early-stage thinking."
              )
            ),

            // Divergence
            React.createElement("div", {style: { padding:'22px', background:AC.goldTint, border:`1px solid ${AC.gold}`, borderRadius:16, marginBottom:32 }},
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:13, fontWeight:700, letterSpacing:'0.04em', color:AC.goldDark, marginBottom:10, textTransform:'uppercase' }}, 'Where Your Thinking Diverged'),
              React.createElement("div", {style: { fontSize:14, color:AC.text, lineHeight:1.8, marginBottom: synthesis.hasTension ? 14 : 0 }},
                synthesis.hasTension
                  ? React.createElement("span", null,
                      'Your “break it down” and “look wider” answers lean toward ', React.createElement("strong", {style:{color:AC.goldDark}}, synthesis.divergentLogical.join(', ')),
                      ', while your Sense and Reflect answers keep raising ', React.createElement("strong", {style:{color:AC.goldDark}}, synthesis.divergentSignal.join(', ')), ". A tension appears between what you can argue and what you're sensing."
                    )
                  : "No strong tension surfaced between your reasoning and your instincts this time."
              ),
              React.createElement("div", {style: { fontSize:13, color:AC.muted, lineHeight:1.7, fontStyle:'italic' }}, 'Disagreement is information. A conflict between ways of thinking can reveal uncertainty, missing information, hidden assumptions, competing priorities, or an unresolved value, not failure.')
            ),

            // Integrated picture / fusion insight
            React.createElement("div", {style: { padding:'28px 24px', background:AC.surface, border:`2px solid ${AC.goldDark}`, borderRadius:16, boxShadow:'0 2px 8px rgba(138,109,47,0.12)', marginBottom:24 }},
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:13, fontWeight:700, letterSpacing:'0.04em', color:AC.goldDark, marginBottom:16, textTransform:'uppercase' }}, 'The full picture'),
              React.createElement("div", {style: { fontSize:17, color:AC.text, lineHeight:1.8, marginBottom:20, padding:'18px 20px', background:AC.surfaceAlt, borderRadius:12, border:`1px solid ${AC.border}` }}, synthesis.insight),
              synthesis.uncertain && React.createElement("div", {style: { fontSize:13.5, color:AC.muted, lineHeight:1.7, marginBottom:8 }}, "This may be worth investigating further: parts of your own answers suggest you're still uncertain, and that uncertainty is worth sitting with rather than rushing past."),
              React.createElement("div", {style: { fontSize:13, color:AC.muted, lineHeight:1.6, marginTop:12 }}, "NeuralFusion is not an AI decision-maker. You remain the intelligence. This is your thinking, organized and reflected back to you.")
            ),

            // Investigate the gap
            React.createElement("div", {style: { padding:'22px', background:AC.surface, border:`1px solid ${AC.border}`, borderRadius:16, boxShadow:'0 1px 3px rgba(17,24,39,0.06)', marginBottom:40 }},
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:13, fontWeight:700, letterSpacing:'0.04em', color:AC.goldDark, marginBottom:14, textTransform:'uppercase' }}, 'Investigate the Gap'),
              synthesis.gapQuestions.map((q,i) => (
                React.createElement("div", {key: i, style: { display:'flex', gap:10, marginBottom:10 }},
                  React.createElement("span", {style: { fontFamily:AC.font, fontSize:13, fontWeight:700, color:AC.goldDark, flexShrink:0 }}, `0${i+1}`),
                  React.createElement("span", {style: { fontSize:14, color:AC.text, lineHeight:1.7 }}, q)
                )
              ))
            ),


            // Save this decision to the persistent My decisions
            React.createElement(DecisionSavePanel, { problem, answers, synthesis, user, setShowAuth, setView }),

            // CTA after experience
            React.createElement("div", {style: { padding:'32px 24px', background:AC.goldTint, border:`1px solid ${AC.gold}`, borderRadius:16, marginBottom:24, textAlign:'center' }},
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:18, fontWeight:800, color:AC.text, marginBottom:10, lineHeight:1.3 }}, 'Want to strengthen how you think, not just solve one problem?'),
              React.createElement("p", {style: { fontSize:14, color:AC.muted, lineHeight:1.7, maxWidth:480, margin:'0 auto 22px' }}, 'The decision helper gives you a simple way to think one problem through. The more you use it, the easier it gets.'),
              React.createElement("div", {style: { display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }},
                React.createElement("button", {className: "nf-a11y-btn", onClick: () => user ? setView('protocol') : setShowAuth(true), style: {
                  fontFamily:AC.font, fontSize:16, fontWeight:700, padding:'16px 32px', minHeight:52,
                  background:AC.goldDark, color:'#FFFFFF', border:'none', borderRadius:16, cursor:'pointer',
                  boxShadow:'0 2px 8px rgba(138,109,47,0.35)',
                }}, 'Back to home'),
              )
            ),

            // Optional lead capture: reuses existing account creation, never forced
            !user && React.createElement("div", {style: { textAlign:'center', marginBottom:20 }},
              React.createElement("button", {className: "nf-a11y-btn", onClick: () => setShowAuth(true), style: {
                fontFamily:AC.font, fontSize:15, fontWeight:600, padding:'10px 16px', minHeight:44,
                background:'transparent', color:AC.muted, border:'none', cursor:'pointer', borderRadius:12,
              }}, 'Save your thinking map →')
            ),

            React.createElement("div", {style: { textAlign:'center' }},
              React.createElement("button", {className: "nf-a11y-btn", onClick: onRestart, style: {
                fontFamily:AC.font, fontSize:15, fontWeight:600, padding:'10px 16px', minHeight:44,
                background:'transparent', color:AC.muted, border:'none', cursor:'pointer', borderRadius:12,
              }}, 'Do it again')
            )
          )
        )
      );
    }

    function ProtocolView({ setView, user, setShowAuth, cfiResult }) {
      useProtocolA11yStyles();
      const AC = PROTOCOL_AC;
      const [phase, setPhase] = useState('intro'); // intro | steps | result
      const [stepIndex, setStepIndex] = useState(0);
      const [problem, setProblem] = useState('');
      const [answers, setAnswers] = useState({ decompose:'', sense:'', expand:'', reflect:'' });

      useEffect(() => { window.scrollTo(0, 0); }, [phase, stepIndex]);

      const restart = () => {
        setPhase('intro'); setStepIndex(0); setProblem(''); setAnswers({ decompose:'', sense:'', expand:'', reflect:'' });
      };

      // ── Intro (mirrors the CFI intro screen) ───────────────────────
      if (phase === 'intro') {
        return (
          React.createElement("div", {style: { paddingTop:80, paddingBottom:60, background:AC.bg, minHeight:'100vh', fontFamily:AC.font }},
            React.createElement("div", {style: { maxWidth:720, margin:'0 auto', padding:'32px 20px', textAlign:'center' }},
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:14, fontWeight:700, letterSpacing:'0.06em', color:AC.goldDark, marginBottom:20, textTransform:'uppercase' }}, 'The Decision helper'),
              React.createElement("h1", {style: { fontFamily:AC.font, fontSize:'clamp(26px,5vw,34px)', fontWeight:800, color:AC.text, marginBottom:20, lineHeight:1.3 }},
                'Think Through the Problem.', React.createElement("br", null), React.createElement("span", {style: {color:AC.goldDark}}, "Don't just think about it.")
              ),
              React.createElement("p", {style: { fontSize:19, color:AC.text, lineHeight:1.7, marginBottom:20, maxWidth:560, margin:'0 auto 20px' }},
                'Bring a real decision, challenge, or situation. Five short stages, about five minutes.'
              ),
              React.createElement("div", {role:'note', style: { fontSize:18, color:AC.text, lineHeight:1.7, marginBottom:20, maxWidth:560, margin:'0 auto 20px', padding:'20px 22px', background:AC.goldTint, border:`1px solid ${AC.gold}`, borderRadius:16, textAlign:'left' }},
                "NeuralFusion does not think for you. It helps you see how you are thinking. There are no wrong answers, and you'll see your own responses reflected back to you at the end, not a decision made for you."
              ),
              React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap:12, marginBottom:36, textAlign:'left' }},
                [
                  { brain:'analytical', label:'Decompose', text:'Separate the problem from the noise' },
                  { brain:'intuitive', label:'Sense', text:'Notice what your instincts are telling you' },
                  { brain:'associative', label:'Expand', text:'Open the problem before narrowing it' },
                  { brain:'reflective', label:'Reflect', text:'Examine what actually matters here' },
                ].map((s,i) => {
                  const b = C.brains[s.brain];
                  return (
                    React.createElement("div", {key: i, style: { padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:12, background:AC.surface, border:`1px solid ${AC.border}`, borderRadius:16, boxShadow:'0 1px 3px rgba(17,24,39,0.06)' }},
                      React.createElement("div", {style: { fontSize:18, color:b.color, flexShrink:0 }}, b.symbol),
                      React.createElement("div", null,
                        React.createElement("div", {style: { fontSize:15, fontWeight:700, color:AC.text }}, s.label),
                        React.createElement("div", {style: { fontSize:13, color:AC.muted, lineHeight:1.5 }}, s.text)
                      )
                    )
                  );
                })
              ),
              React.createElement("button", {className: "nf-a11y-btn", onClick: ()=>setPhase('steps'), style: {
                fontFamily:AC.font, fontSize:18, fontWeight:700, padding:'18px 40px', minHeight:56,
                background:AC.goldDark, color:'#FFFFFF', border:'none', borderRadius:16, cursor:'pointer',
                boxShadow:'0 2px 8px rgba(138,109,47,0.35)', marginBottom:16,
              }}, 'Start →'),
              React.createElement("div", null,
                React.createElement("button", {className: "nf-a11y-btn", onClick: ()=>setView('four-brains'), style: {
                  fontFamily:AC.font, fontSize:16, fontWeight:600, padding:'12px 20px', minHeight:48,
                  background:'transparent', color:AC.muted, border:'none', cursor:'pointer', borderRadius:12,
                }}, 'See how it works')
              )
            )
          )
        );
      }

      // ── Result / Fuse ──────────────────────────────────────────────
      if (phase === 'result') {
        return React.createElement(ProtocolResult, { problem, answers, setView, user, setShowAuth, cfiResult, onRestart: restart });
      }

      // ── Steps 1–4 (mirrors the CFI question screen) ────────────────
      const step = PROTOCOL_STEPS[stepIndex];
      const b = C.brains[step.brain];
      const isDecompose = step.key === 'decompose';
      const answerValue = answers[step.key];
      const canContinue = isDecompose
        ? problem.trim().length > 3 && answerValue.trim().length > 3
        : answerValue.trim().length > 3;
      const percent = Math.round(((stepIndex) / PROTOCOL_STEPS.length) * 100);

      const goNext = () => {
        if (stepIndex < PROTOCOL_STEPS.length - 1) setStepIndex(i => i + 1);
        else setPhase('result');
      };
      const goBack = () => {
        if (stepIndex > 0) setStepIndex(i => i - 1);
        else setPhase('intro');
      };

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:60, background:AC.bg, minHeight:'100vh', fontFamily:AC.font }},
          React.createElement("div", {style: { maxWidth:680, margin:'0 auto', padding:'32px 20px', width:'100%' }},
            React.createElement(ProtocolProgress, {percent, label: `Stage ${stepIndex+1} of ${PROTOCOL_STEPS.length}`}),

            React.createElement("div", {key: step.key, className: "nf-a11y-fade"},
              React.createElement("div", {style: { display:'flex', alignItems:'center', gap:10, marginBottom:16 }},
                React.createElement("div", {style: { fontSize:20, color:b.color }}, b.symbol),
                React.createElement("div", {style: { fontFamily:AC.font, fontSize:14, fontWeight:700, letterSpacing:'0.04em', color:AC.goldDark, textTransform:'uppercase' }}, step.title)
              ),
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:'clamp(20px,4.5vw,26px)', fontWeight:700, color:AC.text, lineHeight:1.5, marginBottom:14 }}, step.subtitle),
              React.createElement("p", {style: { fontSize:16, color:AC.muted, lineHeight:1.7, marginBottom:24 }}, step.intro),

              isDecompose && React.createElement("div", {style: { marginBottom:22 }},
                React.createElement("label", {style: { display:'block', fontFamily:AC.font, fontSize:14, fontWeight:700, color:AC.text, marginBottom:8 }}, 'What are you trying to understand?'),
                React.createElement(ProtocolTextarea, {
                  value: problem, onChange: e => setProblem(e.target.value),
                  placeholder: 'Describe the situation in your own words...', minHeight: 100,
                })
              ),

              React.createElement("div", {role:'note', style: { display:'flex', flexDirection:'column', gap:8, marginBottom:16, padding:'18px 20px', background:AC.goldTint, border:`1px solid ${AC.gold}`, borderRadius:16 }},
                step.questions.map((q,i) => (
                  React.createElement("div", {key: i, style: { fontSize:15, color:AC.text, lineHeight:1.6, display:'flex', gap:10 }},
                    React.createElement("span", {style:{color:AC.goldDark, fontWeight:700}}, '·'), q
                  )
                ))
              ),

              React.createElement("div", {style: { marginBottom:28 }},
                React.createElement(ProtocolTextarea, {
                  value: answerValue, onChange: e => setAnswers(prev => ({ ...prev, [step.key]: e.target.value })),
                  placeholder: step.placeholder, minHeight: 140,
                })
              ),

              React.createElement("div", {style: { display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }},
                React.createElement("button", {className: "nf-a11y-btn", onClick: goBack, style: {
                  fontFamily:AC.font, fontSize:16, fontWeight:600, padding:'12px 18px', minHeight:48,
                  background:'transparent', color:AC.muted, border:`1px solid ${AC.border}`, cursor:'pointer', borderRadius:12,
                }}, '← Back'),
                React.createElement("button", {
                  className: "nf-a11y-btn", onClick: goNext, disabled: !canContinue,
                  style: {
                    fontFamily:AC.font, fontSize:17, fontWeight:700, padding:'16px 32px', minHeight:52,
                    background:AC.goldDark, color:'#FFFFFF', border:'none', borderRadius:16,
                    opacity: canContinue ? 1 : 0.4, cursor: canContinue ? 'pointer' : 'not-allowed',
                    boxShadow: canContinue ? '0 2px 8px rgba(138,109,47,0.35)' : 'none', marginLeft:'auto',
                  },
                }, step.cta, ' →')
              )
            )
          )
        )
      );
    }


    // ═══════════════════════════════════════════════════════════════════
    //  UNDER PRESSURE: a fast (60-90s) cognitive stabilization protocol.
    //  Not therapy, not mental-health treatment: a compressed pass through
    //  the same Decompose/Sense/Expand/Reflect logic, for when there isn't
    //  time for the full Decision Room. Saves into the same My decisions.
    // ═══════════════════════════════════════════════════════════════════
    function PressureModeView({ user, setShowAuth, setView }) {
      const STEPS = [
        { key: 'facts', q: 'What are the facts?' },
        { key: 'sense', q: 'What are you sensing?' },
        { key: 'possibility', q: 'What else could be true?' },
        { key: 'matters', q: 'What matters most?' },
        { key: 'next', q: 'What needs to happen next?' },
      ];
      const [i, setI] = useState(0);
      const [answers, setAnswers] = useState({});
      const [saving, setSaving] = useState(false);
      const [saved, setSaved] = useState(null);
      const step = STEPS[i];
      const val = answers[step.key] || '';

      const finish = async () => {
        if (!user) { setShowAuth(true); return; }
        setSaving(true);
        const row = await saveDecisionSession(user.id, {
          title: (answers.matters || 'Under Pressure').slice(0, 120),
          problem: answers.matters || null,
          decompose_response: answers.facts || null,
          sense_response: answers.sense || null,
          expand_response: answers.possibility || null,
          reflect_response: answers.matters || null,
          decision: answers.matters || null,
          next_action: answers.next || null,
          status: 'open',
        });
        setSaving(false);
        if (row) setSaved(row);
      };
      const goNext = () => { if (i < STEPS.length - 1) setI(i + 1); else finish(); };

      if (saved) {
        return (
          React.createElement("div", { style: { maxWidth: 480, margin: '0 auto', padding: '120px 24px 60px', textAlign: 'center' } },
            React.createElement("div", { style: { ...mono, fontSize: 11, letterSpacing: 1.5, color: C.cyan, marginBottom: 16 } }, 'Your next step'),
            React.createElement("div", { style: { ...syne, fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.5, marginBottom: 32 } }, saved.next_action || 'Take the next small, concrete action.'),
            React.createElement("div", { style: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' } },
              React.createElement("button", { className: "btn-primary", onClick: () => setView('decisions') }, 'Open My decisions →'),
              React.createElement("button", { onClick: () => { setSaved(null); setAnswers({}); setI(0); }, style: { padding: '12px 20px', fontSize: 13, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, color: C.muted, cursor: 'pointer' } }, 'Run it again')
            )
          )
        );
      }

      return (
        React.createElement("div", { style: { maxWidth: 520, margin: '0 auto', padding: '100px 24px 60px' } },
          React.createElement("div", { style: { ...mono, fontSize: 11, letterSpacing: 1.5, color: C.cyan, marginBottom: 8 } }, `UNDER PRESSURE · ${i + 1}/${STEPS.length}`),
          React.createElement("div", { style: { height: 3, background: C.panel, borderRadius: 2, marginBottom: 32, overflow: 'hidden' } },
            React.createElement("div", { style: { width: `${((i + 1) / STEPS.length) * 100}%`, height: '100%', background: C.cyan, transition: 'width 0.3s ease' } })
          ),
          React.createElement("h1", { style: { ...syne, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 20, overflowWrap: 'break-word' } }, step.q),
          React.createElement("textarea", {
            autoFocus: true, value: val, rows: 4, placeholder: 'A few words is enough.',
            onChange: e => setAnswers({ ...answers, [step.key]: e.target.value }),
            style: { width: '100%', boxSizing: 'border-box', padding: '14px', fontSize: 16, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 2, color: C.text, marginBottom: 24, fontFamily: 'inherit' }
          }),
          React.createElement("button", { className: "btn-primary", onClick: goNext, disabled: saving }, saving ? 'Saving…' : (i < STEPS.length - 1 ? 'Next →' : 'Get My Next Step →'))
        )
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  DECISION VAULT
    // ═══════════════════════════════════════════════════════════════════
    function DecisionStatusBadge({ status }) {
      const map = {
        open: { label: 'Open', color: '#7AAFCF' },
        awaiting_review: { label: 'Awaiting Review', color: '#E2BE78' },
        reviewed: { label: 'Reviewed', color: '#7AAFCF' },
      };
      const s = map[status] || map.open;
      return React.createElement("span", { style: { ...mono, fontSize: 9, letterSpacing: 1, color: s.color, border: `1px solid ${s.color}`, borderRadius: 20, padding: '3px 10px', textTransform: 'uppercase', flexShrink: 0 } }, s.label);
    }

    function DecisionOutcomeForm({ decision, onSaved }) {
      const [outcome, setOutcome] = useState('');
      const [lesson, setLesson] = useState('');
      const [saving, setSaving] = useState(false);
      const options = ['Better than expected', 'As expected', 'Worse than expected', 'Still unfolding'];
      const submit = async () => {
        if (!outcome) return;
        setSaving(true);
        const status = outcome === 'Still unfolding' ? decision.status : 'reviewed';
        const row = await updateDecisionSession(decision.id, {
          outcome, outcome_rating: outcome, lesson_learned: lesson.trim() || null,
          status, reviewed_at: new Date().toISOString(),
        });
        setSaving(false);
        if (row) onSaved(row);
      };
      return (
        React.createElement("div", { style: { padding: '20px', background: C.deep, borderRadius: 2, border: `1px solid ${C.border}`, marginTop: 16 } },
          React.createElement("div", { style: { ...mono, fontSize: 11, letterSpacing: 1, color: C.cyan, marginBottom: 14 } }, 'Review: what happened?'),
          React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 } },
            options.map(o => React.createElement("button", {
              key: o, onClick: () => setOutcome(o), style: {
                padding: '10px 14px', fontSize: 12, borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${outcome === o ? C.cyan : C.border}`, background: outcome === o ? C.cyanDim : 'transparent', color: outcome === o ? C.cyan : C.muted,
              }
            }, o))
          ),
          React.createElement("div", { style: { fontSize: 12, color: C.muted, marginBottom: 8 } }, 'What did you notice? What did you learn? What would you do differently? Write as much or as little as you like.'),
          React.createElement("textarea", { value: lesson, onChange: e => setLesson(e.target.value), rows: 3, style: { width: '100%', padding: '12px', fontSize: 14, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 2, color: C.text, marginBottom: 14, fontFamily: 'inherit' } }),
          React.createElement("button", { className: "btn-primary", disabled: !outcome || saving, onClick: submit, style: { opacity: (!outcome || saving) ? 0.5 : 1 } }, saving ? 'Saving…' : 'Save Outcome')
        )
      );
    }

    function DecisionCard({ d, expanded, onToggle, onOutcomeSaved }) {
      return (
        React.createElement("div", { className: "card", style: { padding: '22px 24px', marginBottom: 16 } },
          React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }, onClick: onToggle },
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { ...syne, fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6, overflowWrap: 'break-word' } }, d.title || d.decision || 'Untitled decision'),
              React.createElement("div", { style: { ...mono, fontSize: 10, color: C.dim } }, new Date(d.created_at).toLocaleDateString(), d.review_date ? ` · review ${d.review_date}` : '')
            ),
            React.createElement(DecisionStatusBadge, { status: d.status })
          ),
          typeof d.confidence === 'number' && React.createElement("div", { style: { ...mono, fontSize: 11, color: C.muted, marginTop: 8 } }, 'Confidence: ', d.confidence, '%'),
          d.next_action && React.createElement("div", { style: { fontSize: 13, color: C.muted, marginTop: 6 } }, 'Next: ', d.next_action),
          expanded && React.createElement("div", { style: { marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.border}` } },
            [
              ['Decompose', d.decompose_response], ['Sense', d.sense_response],
              ['Expand', d.expand_response], ['Reflect', d.reflect_response],
            ].map(([label, text]) => text && React.createElement("div", { key: label, style: { marginBottom: 14 } },
              React.createElement("div", { style: { ...mono, fontSize: 10, letterSpacing: 1, color: C.cyan, marginBottom: 4 } }, label.toUpperCase()),
              React.createElement("div", { style: { fontSize: 13, color: C.muted, lineHeight: 1.7, whiteSpace: 'pre-wrap' } }, text)
            )),
            d.fuse_response && React.createElement("div", { style: { marginBottom: 14 } },
              React.createElement("div", { style: { ...mono, fontSize: 10, letterSpacing: 1, color: C.cyan, marginBottom: 4 } }, 'FUSE'),
              React.createElement("div", { style: { fontSize: 13, color: C.text, lineHeight: 1.7 } }, d.fuse_response)
            ),
            d.outcome && React.createElement("div", { style: { padding: '14px', background: C.deep, borderRadius: 2, border: `1px solid ${C.border}`, marginBottom: 8 } },
              React.createElement("div", { style: { ...mono, fontSize: 10, letterSpacing: 1, color: C.cyan, marginBottom: 6 } }, 'OUTCOME'),
              React.createElement("div", { style: { fontSize: 13, color: C.text, marginBottom: d.lesson_learned ? 6 : 0 } }, d.outcome),
              d.lesson_learned && React.createElement("div", { style: { fontSize: 13, color: C.muted, lineHeight: 1.6 } }, d.lesson_learned)
            ),
            (d.status !== 'reviewed') && React.createElement(DecisionOutcomeForm, { decision: d, onSaved: onOutcomeSaved })
          )
        )
      );
    }

    function DecisionVaultView({ user, setShowAuth, setView, cfiResult, cfiHistory, lessonProgress }) {
      const [decisions, setDecisions] = useState([]);
      const [loading, setLoading] = useState(true);
      const [filter, setFilter] = useState('all');
      const [expandedId, setExpandedId] = useState(null);

      const load = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        setLoading(true);
        const rows = await listDecisionSessions(user.id);
        setDecisions(rows);
        setLoading(false);
      }, [user]);

      useEffect(() => { load(); }, [load]);

      if (!user) {
        return (
          React.createElement("div", { style: { paddingTop: 100, paddingBottom: 100, textAlign: 'center' } },
            React.createElement("div", { className: "card", style: { maxWidth: 440, margin: '0 auto', padding: '48px 32px' } },
              React.createElement("div", { style: { ...mono, fontSize: 14, color: C.dim, marginBottom: 20 } }, '◈'),
              React.createElement("div", { style: { ...syne, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 } }, 'My decisions'),
              React.createElement("div", { style: { fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.7 } }, 'Sign in to save and revisit decisions you think through.'),
              React.createElement("button", { className: "btn-primary", onClick: () => setShowAuth(true) }, 'Sign in →')
            )
          )
        );
      }

      const isAwaitingReview = d => d.status === 'open' && d.review_date && new Date(d.review_date) <= new Date();
      const filtered = decisions.filter(d => {
        if (filter === 'all') return true;
        if (filter === 'awaiting_review') return isAwaitingReview(d);
        return d.status === filter;
      });
      const filters = [
        { v: 'all', label: 'All' }, { v: 'open', label: 'Open' },
        { v: 'awaiting_review', label: 'Awaiting Review' }, { v: 'reviewed', label: 'Reviewed' },
      ];

      return (
        React.createElement("div", { style: { paddingTop: 80, paddingBottom: 100 } },
          React.createElement("div", { style: { maxWidth: 820, margin: '0 auto', padding: '40px 24px' } },
            React.createElement("div", { style: { ...mono, fontSize: 11, letterSpacing: 1.5, color: C.cyan, marginBottom: 16 } }, 'My decisions'),
            React.createElement("h1", { style: { ...syne, fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 16, overflowWrap: 'break-word' } }, 'Your real decisions, thought through and remembered.'),
            React.createElement("div", { style: { marginBottom: 28 } },
              React.createElement("button", { className: "btn-primary", onClick: () => setView('protocol') }, 'Think Through a Decision')
            ),
            React.createElement("div", { style: { display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' } },
              filters.map(f => React.createElement("button", {
                key: f.v, onClick: () => setFilter(f.v), style: {
                  padding: '8px 16px', fontSize: 12, borderRadius: 20, cursor: 'pointer',
                  border: `1px solid ${filter === f.v ? C.cyan : C.border}`, background: filter === f.v ? C.cyanDim : 'transparent', color: filter === f.v ? C.cyan : C.muted,
                }
              }, f.label))
            ),
            loading ? React.createElement("div", { style: { color: C.muted, fontSize: 14 } }, 'Loading…') :
            filtered.length === 0 ? (
              React.createElement("div", { className: "card", style: { padding: '48px', textAlign: 'center' } },
                React.createElement("div", { style: { fontSize: 14, color: C.muted, marginBottom: 20 } }, decisions.length === 0 ? "You haven't saved a decision yet." : 'Nothing in this filter yet.'),
                decisions.length === 0 && React.createElement("button", { className: "btn-primary", onClick: () => setView('protocol') }, 'Think Through Your First Decision →')
              )
            ) : filtered.map(d => React.createElement(DecisionCard, {
              key: d.id, d, expanded: expandedId === d.id,
              onToggle: () => setExpandedId(expandedId === d.id ? null : d.id),
              onOutcomeSaved: (row) => { setDecisions(prev => prev.map(x => x.id === row.id ? row : x)); },
            }))
          )
        )
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  CFI ASSESSMENT VIEW
    // ═══════════════════════════════════════════════════════════════════
    //  CFI ASSESSMENT VIEW
    // ═══════════════════════════════════════════════════════════════════

    // Legacy radar chart. No longer used on the CFI results page (a four-way polygon
    // visually reads as "four scores competing" rather than "one coordinated system"),
    // but left in place in case anything else references it.

    // ── Coordination Wheel ──────────────────────────────────────────────
    // Replaces the four-way radar. Visual language: ONE coordinated system (a central
    // Decision Hub) with FOUR ways of thinking feeding into it, not four bars racing
    // each other to 100. Node size/glow reflects how often that mode currently
    // contributes, never "how good" the mode is. The hub always sits at full strength:
    // coordination, not any single mode, is the thing being measured.


    // ═══════════════════════════════════════════════════════════════════
    //  COGNITIVE PROFILE: white-first results experience
    //  Scoped light theme, distinct from the app's global dark navy/gold
    //  theme (same pattern as the accessible assessment screens above).
    //  Every number and sentence below is pulled from the real CFI
    //  scoring pipeline (dimensionReports / profile / plan): nothing on
    //  this page is hard-coded per user.
    // ═══════════════════════════════════════════════════════════════════
    const CP = {
      bg: '#FFFFFF', card: '#FFFFFF', surface: '#FAF9F5',
      ink: '#161616', text: '#2B2C31', muted: '#6B6E76', faint: '#9A9DA6',
      border: '#ECE7DA', borderStrong: '#DED2AE',
      gold: NF_GOLD, goldDeep: '#8F701F', goldTint: '#FBF4E3', goldTintStrong: '#F5E7C4',
    };
    const CP_BAND_COLORS = {
      'Integrated': '#3E7CA6',
      'Moderate fragmentation': '#B8923F',
      'High fragmentation': '#C97A2B',
      'Critical fragmentation': '#C24545',
    };
    const CP_MODE_META = {
      A: { name: 'Analytical',  tagline: 'Evidence. Logic. Structure.' },
      I: { name: 'Intuitive',   tagline: 'Patterns. Signals. Instinct.' },
      S: { name: 'Associative', tagline: 'Connections. Possibilities. Synthesis.' },
      R: { name: 'Reflective',  tagline: 'Awareness. Meaning. Learning.' },
    };
    const CP_MODE_ORDER = ['A', 'I', 'S', 'R'];
    const CP_JOURNEY = [
      { step: '01', title: 'Measure',    desc: 'Take the test.',                    view: 'cfi' },
      { step: '02', title: 'Understand', desc: 'See your result.',         view: 'cfi' },
      { step: '03', title: 'Train',      desc: 'Learn with short lessons.', view: 'lessons' },
      { step: '04', title: 'Integrate',  desc: 'Think decisions through.',      view: 'protocol' },
      { step: '05', title: 'Improve',    desc: 'Track your progress.',              view: 'analytics' },
    ];

    function CPCard({ children, style }) {
      return React.createElement("div", { style: { background: CP.card, border: `1px solid ${CP.border}`, borderRadius: 18, ...style } }, children);
    }

    function CPEyebrow({ children, color = CP.goldDeep }) {
      return React.createElement("div", { style: { ...mono, fontSize: 11, letterSpacing: 1.5, color, marginBottom: 12, textTransform: 'uppercase' } }, children);
    }

    function CPScoreRing({ value, size = 180, stroke = 12, color = CP.gold, label }) {
      const r = (size - stroke) / 2;
      const circumference = 2 * Math.PI * r;
      const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100);
      return (
        React.createElement("div", { style: { position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
          React.createElement("svg", { width: size, height: size, style: { transform: 'rotate(-90deg)' } },
            React.createElement("circle", { cx: size / 2, cy: size / 2, r, fill: 'none', stroke: CP.goldTintStrong, strokeWidth: stroke }),
            React.createElement("circle", { cx: size / 2, cy: size / 2, r, fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeDasharray: circumference, strokeDashoffset: offset, style: { transition: 'stroke-dashoffset 0.9s ease' } })
          ),
          React.createElement("div", { style: { position: 'absolute', textAlign: 'center', padding: '0 10px' } },
            React.createElement("div", { style: { ...syne, fontSize: 'clamp(30px,8vw,40px)', fontWeight: 800, color: CP.ink, lineHeight: 1 } }, value),
            label && React.createElement("div", { style: { ...mono, fontSize: 9.5, letterSpacing: 1, color: CP.muted, marginTop: 8, maxWidth: size - 30, lineHeight: 1.4 } }, label)
          )
        )
      );
    }

    // Four ways of thinking as one coordinated system, not four competing bars.
    function CPWheel({ dimensionReports, size = 236 }) {
      const dims = CP_MODE_ORDER;
      const angles = { A: -90, I: 0, S: 90, R: 180 };
      const cx = size / 2, cy = size / 2, orbitR = size / 2 - 52;
      const pos = angle => { const rad = angle * Math.PI / 180; return [cx + orbitR * Math.cos(rad), cy + orbitR * Math.sin(rad)]; };
      return (
        React.createElement("svg", { width: size, height: size, viewBox: `0 0 ${size} ${size}`, style: { maxWidth: '100%', height: 'auto' } },
          React.createElement("circle", { cx, cy, r: orbitR, fill: 'none', stroke: CP.border, strokeWidth: 1 }),
          dims.map(d => {
            const report = dimensionReports[d];
            const [x, y] = pos(angles[d]);
            const strength = Math.max(0.18, report.integrationScore / 100);
            return React.createElement("line", { key: 'conn' + d, x1: cx, y1: cy, x2: x, y2: y, stroke: CP.gold, strokeWidth: 1.5 + strength * 2.5, strokeOpacity: 0.25 + strength * 0.45, strokeLinecap: 'round' });
          }),
          React.createElement("circle", { cx, cy, r: 25, fill: CP.goldTint, stroke: CP.gold, strokeWidth: 1.5 }),
          React.createElement("text", { x: cx, y: cy + 3, fill: CP.goldDeep, fontSize: 8, fontFamily: mono.fontFamily, letterSpacing: 0.5, textAnchor: 'middle' }, 'SYSTEM'),
          dims.map(d => {
            const report = dimensionReports[d];
            const [x, y] = pos(angles[d]);
            const r = 17 + (report.integrationScore / 100) * 9;
            return (
              React.createElement("g", { key: 'node' + d },
                React.createElement("circle", { cx: x, cy: y, r, fill: '#FFFFFF', stroke: CP.gold, strokeWidth: 2 }),
                React.createElement("text", { x, y: y + 4.5, fill: CP.goldDeep, fontSize: 13, fontFamily: syne.fontFamily, fontWeight: 800, textAnchor: 'middle' }, d)
              )
            );
          }),
          dims.map(d => { const [x, y] = pos(angles[d]); const ly = y > cy ? y + 34 : y - 28; return React.createElement("text", { key: 'lbl' + d, x, y: ly, fill: CP.muted, fontSize: 10, fontFamily: mono.fontFamily, textAnchor: 'middle' }, CP_MODE_META[d].name); })
        )
      );
    }

    function CPModeCard({ dim, report }) {
      const meta = CP_MODE_META[dim];
      return (
        React.createElement(CPCard, { style: { padding: '20px 18px' } },
          React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } },
            React.createElement("div", { style: { ...syne, fontSize: 13, fontWeight: 800, color: CP.ink, flex: 1 } }, meta.name),
            React.createElement("div", { style: { ...syne, fontSize: 18, fontWeight: 800, color: CP.goldDeep } }, report.integrationScore, React.createElement("span", { style: { fontSize: 10, color: CP.faint, fontWeight: 500 } }, '%'))
          ),
          React.createElement("div", { style: { height: 5, background: CP.goldTint, borderRadius: 3, overflow: 'hidden', marginBottom: 10 } },
            React.createElement("div", { style: { width: `${report.integrationScore}%`, height: '100%', background: CP.gold, borderRadius: 3, transition: 'width 0.6s ease' } })
          ),
          React.createElement("div", { style: { ...mono, fontSize: 9.5, letterSpacing: 0.4, color: CP.faint } }, meta.tagline)
        )
      );
    }

    // Tap to expand a mode's full dimensional detail: keeps the page scannable
    // on mobile while still surfacing the real strengths/blind-spot data.
    function CPModeDetail({ dim, report }) {
      const [open, setOpen] = useState(false);
      const meta = CP_MODE_META[dim];
      return (
        React.createElement(CPCard, { style: { padding: 0, marginBottom: 10, overflow: 'hidden' } },
          React.createElement("button", { className: "nf-cp-row", onClick: () => setOpen(o => !o), style: { width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' } },
            React.createElement("div", { style: { ...syne, fontSize: 13, fontWeight: 800, color: CP.ink, flex: 1 } }, meta.name),
            React.createElement("div", { style: { ...syne, fontSize: 13, fontWeight: 800, color: CP.goldDeep } }, report.integrationScore, '%'),
            React.createElement("div", { style: { color: CP.faint, fontSize: 13, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' } }, '▾')
          ),
          open && React.createElement("div", { style: { padding: '0 18px 20px' } },
            React.createElement("div", { style: { fontSize: 13.5, color: CP.text, lineHeight: 1.7, marginBottom: 16 } }, report.meaning),
            React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px,100%),1fr))', gap: 16, marginBottom: 16 } },
              React.createElement("div", null,
                React.createElement("div", { style: { ...mono, fontSize: 9.5, letterSpacing: 1, color: CP.goldDeep, marginBottom: 6 } }, 'STRENGTHS'),
                report.strengths.map((s, i) => React.createElement("div", { key: i, style: { fontSize: 12.5, color: CP.muted, lineHeight: 1.6, marginBottom: 3 } }, '· ', s))
              ),
              React.createElement("div", null,
                React.createElement("div", { style: { ...mono, fontSize: 9.5, letterSpacing: 1, color: CP.faint, marginBottom: 6 } }, 'WATCH FOR'),
                report.blindSpots.map((s, i) => React.createElement("div", { key: i, style: { fontSize: 12.5, color: CP.muted, lineHeight: 1.6, marginBottom: 3 } }, '· ', s))
              )
            ),
            React.createElement("div", null,
              React.createElement("div", { style: { ...mono, fontSize: 9.5, letterSpacing: 1, color: CP.goldDeep, marginBottom: 6 } }, 'PRACTICE'),
              report.improvements.slice(0, 2).map((s, i) => React.createElement("div", { key: i, style: { fontSize: 12.5, color: CP.text, lineHeight: 1.6, marginBottom: 3 } }, `${i + 1}. `, s))
            )
          )
        )
      );
    }

    function CPButton({ children, onClick, variant = 'primary', style }) {
      const base = { ...syne, fontSize: 13.5, fontWeight: 700, padding: '14px 24px', borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, transition: 'opacity 0.15s ease', border: '1px solid transparent' };
      const variants = {
        primary: { background: CP.gold, color: '#1A1204', border: `1px solid ${CP.gold}` },
        outline: { background: '#FFFFFF', color: CP.ink, border: `1px solid ${CP.borderStrong}` },
        ghost: { background: 'none', color: CP.muted, border: '1px solid transparent' },
      };
      return React.createElement("button", { className: "nf-cp-btn", onClick, style: { ...base, ...variants[variant], ...style } }, children);
    }

    function CFIResults({ cfiResult, setView, user, setShowAuth, onRetake, saveState, shareResultId }) {
      const bandColor = CP_BAND_COLORS[cfiResult.band] || CP.gold;
      // Display-only label. cfiResult.band itself (raw DB value / lesson-gating
      // value) is never changed, exactly as in the rest of the app.
      const bandFriendly = cfiCoordinationLabel(cfiResult.band);
      const dimensionReports = cfiResult.dimensionReports || {};
      const profile = cfiResult.profile;
      const plan = cfiResult.plan;
      const hasEnrichedData = !!(profile && plan && dimensionReports.A);
      const integrationScore = cfiResult.integrationScore ?? Math.max(0, 100 - cfiResult.total * 2);

      const [shareState, setShareState] = useState('idle');

      // Inject scoped hover/focus styles once. Kept separate from the app's
      // global dark-theme CSS since this page is intentionally a light theme.
      useEffect(() => {
        if (!document.getElementById('nf-cp-styles')) {
          const style = document.createElement('style');
          style.id = 'nf-cp-styles';
          style.textContent = `
            .nf-cp-row:hover { background: ${CP.surface}; }
            .nf-cp-btn:hover { opacity: 0.88; }
            .nf-cp-btn:focus-visible, .nf-cp-row:focus-visible { outline: 2px solid ${CP.goldDeep}; outline-offset: 2px; }
            @media print { .nf-cp-noprint { display: none !important; } }
          `;
          document.head.appendChild(style);
        }
      }, []);

      const shareUrl = 'https://tryneuralfusion.com/cfi';
      const shareText = hasEnrichedData
        ? `My thinking result: Analytical ${dimensionReports.A.integrationScore}%, Intuitive ${dimensionReports.I.integrationScore}%, Associative ${dimensionReports.S.integrationScore}%, Reflective ${dimensionReports.R.integrationScore}%. Discover how you think.`
        : '';
      const handleShare = async () => {
        if (navigator.share) {
          try { await navigator.share({ title: 'My thinking result', text: shareText, url: shareUrl }); } catch (e) { /* user cancelled */ }
        } else if (navigator.clipboard) {
          try { await navigator.clipboard.writeText(`${shareText} ${shareUrl}`); setShareState('copied'); setTimeout(() => setShareState('idle'), 2200); } catch (e) { /* clipboard unavailable */ }
        }
      };

      // ── Minimal fallback for older/unenriched results (never fabricate
      // per-mode data that doesn't exist on this record) ──
      if (!hasEnrichedData) {
        return (
          React.createElement("div", { style: { background: CP.bg, paddingTop: 80, paddingBottom: 80 }, id: 'cfi-report' },
            React.createElement("div", { style: { maxWidth: 640, margin: '0 auto', padding: '24px 20px', textAlign: 'center' } },
              React.createElement(CPEyebrow, null, "Your thinking result"),
              React.createElement("h1", { style: { ...syne, fontSize: 'clamp(22px,5vw,30px)', fontWeight: 800, color: CP.ink, marginBottom: 28 } }, "Now you can see how your thinking works."),
              React.createElement(CPCard, { style: { padding: '36px 24px', marginBottom: 28 } },
                React.createElement(CPScoreRing, { value: integrationScore, color: bandColor, label: 'How clearly you think overall' }),
                React.createElement("div", { style: { marginTop: 16, display: 'inline-block', padding: '8px 18px', background: CP.goldTint, border: `1px solid ${CP.borderStrong}`, borderRadius: 999 } },
                  React.createElement("div", { style: { ...syne, fontSize: 13, fontWeight: 800, color: bandColor } }, bandFriendly)
                ),
                React.createElement("div", { style: { fontSize: 14, color: CP.muted, lineHeight: 1.7, marginTop: 16 } }, cfiResult.desc)
              ),
              React.createElement("div", { style: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' } },
                React.createElement(CPButton, { onClick: () => setView('protocol') }, 'Think through a decision →'),
                React.createElement(CPButton, { variant: 'outline', onClick: onRetake }, 'Retake Assessment')
              )
            )
          )
        );
      }

      const primaryMode = CP_MODE_META[profile.primaryDim];
      const secondaryMode = CP_MODE_META[profile.secondaryDim];
      const weakestMode = CP_MODE_META[profile.weakestDim];
      const topLessonId = plan.recommendedLessonIds[plan.recommendedLessonIds.length - 1];
      const topLesson = LESSONS.find(l => l.id === topLessonId) || LESSONS[0];

      return (
        React.createElement("div", { style: { background: CP.bg, paddingTop: 72, paddingBottom: 90 }, id: 'cfi-report' },
          React.createElement("div", { style: { maxWidth: 760, margin: '0 auto', padding: '24px 20px' } },

            // ── Header ──
            React.createElement("div", { style: { textAlign: 'center', marginBottom: 40 } },
              React.createElement(CPEyebrow, null, "Your result"),
              React.createElement("h1", { style: { ...syne, fontSize: 'clamp(24px,5.5vw,34px)', fontWeight: 800, color: CP.ink, marginBottom: 14, lineHeight: 1.15 } }, "Now you can see how your thinking works."),
              React.createElement("div", { style: { fontSize: 13.5, color: CP.muted, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' } }, "The CFI measures thinking clarity and how well your four ways of thinking work together. It is not a personality test, mental health screening, or medical evaluation.")
            ),

            user && shareResultId && React.createElement(NFRetestShare, { user, resultId: shareResultId }),

            // ── SECTION 1: Profile overview ──
            React.createElement(CPCard, { style: { padding: '36px 28px', marginBottom: 20 } },
              React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px,100%),1fr))', gap: 32, alignItems: 'center' } },
                React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 } },
                  React.createElement(CPScoreRing, { value: integrationScore, color: bandColor, label: 'Overall clarity' }),
                  React.createElement("div", { style: { display: 'inline-block', padding: '8px 18px', background: CP.goldTint, border: `1px solid ${CP.borderStrong}`, borderRadius: 999 } },
                    React.createElement("div", { style: { ...syne, fontSize: 13, fontWeight: 800, color: bandColor } }, bandFriendly)
                  ),
                  React.createElement("div", { style: { fontSize: 13, color: CP.muted, lineHeight: 1.7, maxWidth: 300 } }, cfiResult.desc)
                ),
                React.createElement("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
                  React.createElement("div", { style: { ...mono, fontSize: 9.5, letterSpacing: 1, color: CP.faint, marginBottom: 12 } }, 'FOUR WAYS OF THINKING'),
                  React.createElement(CPWheel, { dimensionReports })
                )
              )
            ),

            // ── SECTION 2: Four ways of thinking ──
            React.createElement("div", { style: { marginBottom: 28 } },
              React.createElement(CPEyebrow, null, 'Your four ways of thinking'),
              React.createElement("div", { style: { fontSize: 12.5, color: CP.muted, lineHeight: 1.6, marginBottom: 16, maxWidth: 560 } }, "These scores reflect how often each mode currently contributes to your decisions, not how intelligent or capable you are in that area."),
              React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px,100%),1fr))', gap: 12 } },
                CP_MODE_ORDER.map(d => React.createElement(CPModeCard, { key: d, dim: d, report: dimensionReports[d] }))
              )
            ),

            // ── SECTION 3: How you tend to think ──
            React.createElement(CPCard, { style: { padding: '32px 26px', marginBottom: 20 } },
              React.createElement(CPEyebrow, null, 'Your Thinking Profile'),
              React.createElement("h2", { style: { ...syne, fontSize: 18, fontWeight: 800, color: CP.ink, marginBottom: 18 } }, 'How You Tend to Think'),
              React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px,100%),1fr))', gap: 16, marginBottom: 22 } },
                [
                  ['Your strongest', primaryMode.name],
                  ['Supporting', secondaryMode.name],
                  ['Needs the most practice', weakestMode.name],
                ].map(([label, value], i) => (
                  React.createElement("div", { key: i, style: { padding: '14px 16px', background: CP.surface, borderRadius: 12, border: `1px solid ${CP.border}` } },
                    React.createElement("div", { style: { ...mono, fontSize: 9, letterSpacing: 1, color: CP.faint, marginBottom: 6 } }, label.toUpperCase()),
                    React.createElement("div", { style: { ...syne, fontSize: 14, fontWeight: 800, color: CP.ink } }, value)
                  )
                ))
              ),
              React.createElement("div", { style: { fontSize: 14.5, color: CP.text, lineHeight: 1.8 } }, profile.summary)
            ),

            // ── SECTION 4: Your dominant thinking pattern ──
            React.createElement(CPCard, { style: { padding: '32px 26px', marginBottom: 20 } },
              React.createElement(CPEyebrow, null, 'Your Thinking Pattern'),
              React.createElement("h2", { style: { ...syne, fontSize: 18, fontWeight: 800, color: CP.ink, marginBottom: 14 } }, 'The way you lean on most'),
              React.createElement("div", { style: { fontSize: 14.5, color: CP.text, lineHeight: 1.8, marginBottom: 14 } }, profile.decisionCoordinationStyle),
              React.createElement("div", { style: { padding: '16px 18px', background: CP.surface, borderRadius: 12, border: `1px solid ${CP.border}` } },
                React.createElement("div", { style: { ...mono, fontSize: 9, letterSpacing: 1, color: CP.faint, marginBottom: 6 } }, 'UNDER PRESSURE'),
                React.createElement("div", { style: { fontSize: 13.5, color: CP.muted, lineHeight: 1.6 } }, profile.coordinationUnderPressure)
              )
            ),

            // ── SECTION 5: Where your thinking may get stuck ──
            React.createElement(CPCard, { style: { padding: '32px 26px', marginBottom: 20 } },
              React.createElement(CPEyebrow, null, 'Potential Blind Spot'),
              React.createElement("h2", { style: { ...syne, fontSize: 18, fontWeight: 800, color: CP.ink, marginBottom: 14 } }, 'Where Your Thinking May Get Stuck'),
              React.createElement("div", { style: { fontSize: 14.5, color: CP.text, lineHeight: 1.8, marginBottom: 14 } }, profile.decisionBlindSpots),
              dimensionReports[profile.weakestDim] && React.createElement("div", null,
                dimensionReports[profile.weakestDim].blindSpots.slice(0, 2).map((s, i) => React.createElement("div", { key: i, style: { fontSize: 13, color: CP.muted, lineHeight: 1.7, marginBottom: 4 } }, '· ', s))
              )
            ),

            // ── SECTION 6: Where you can grow ──
            React.createElement(CPCard, { style: { padding: '32px 26px', marginBottom: 20, borderColor: CP.borderStrong } },
              React.createElement(CPEyebrow, null, 'Your biggest chance to improve'),
              React.createElement("h2", { style: { ...syne, fontSize: 18, fontWeight: 800, color: CP.ink, marginBottom: 6 } }, 'Where You Can Grow'),
              React.createElement("div", { style: { ...mono, fontSize: 11, letterSpacing: 0.5, color: CP.goldDeep, marginBottom: 14 } }, `Your next opportunity: ${weakestMode.name} integration`),
              React.createElement("div", { style: { fontSize: 14.5, color: CP.text, lineHeight: 1.8 } }, profile.suggestedCoordinationExercise)
            ),

            // ── SECTION 7: Integration session ──
            React.createElement(CPCard, { style: { padding: '36px 26px', marginBottom: 20, background: CP.ink } },
              React.createElement("div", { style: { ...mono, fontSize: 11, letterSpacing: 1.5, color: CP.gold, marginBottom: 12, textTransform: 'uppercase' } }, "Your First Integration Session"),
              React.createElement("h2", { style: { ...syne, fontSize: 19, fontWeight: 800, color: '#FFFFFF', marginBottom: 10 } }, "Let's Put Your Thinking to Work."),
              React.createElement("div", { style: { fontSize: 13.5, color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, marginBottom: 24, maxWidth: 480 } }, "Choose a real decision, problem, or idea you're currently working through. The Decision helper walks your four ways of thinking through it, one at a time."),
              React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px,100%),1fr))', gap: 14, marginBottom: 26 } },
                [...PROTOCOL_STEPS.map(s => ({ num: s.num, title: s.title, subtitle: s.subtitle })),
                 { num: '05', title: 'FUSE', subtitle: 'See where your reasoning and instincts agree, and where they don\u2019t.' }
                ].map((s, i) => (
                  React.createElement("div", { key: i, style: { padding: '14px 4px' } },
                    React.createElement("div", { style: { ...mono, fontSize: 10, letterSpacing: 1, color: CP.gold, marginBottom: 6 } }, s.num),
                    React.createElement("div", { style: { ...syne, fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginBottom: 4 } }, s.title),
                    React.createElement("div", { style: { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 } }, s.subtitle)
                  )
                ))
              ),
              React.createElement(CPButton, { onClick: () => setView('protocol'), style: { width: '100%', justifyContent: 'center' } }, 'Think through a decision →')
            ),

            // ── SECTION 8: Academy recommendation ──
            React.createElement(CPCard, { style: { padding: '32px 26px', marginBottom: 20 } },
              React.createElement(CPEyebrow, null, "Your recommended lesson"),
              React.createElement("div", { style: { fontSize: 13, color: CP.muted, lineHeight: 1.7, marginBottom: 22, maxWidth: 480 } }, "Your thinking result gives you a starting point. The Academy helps you train from there."),
              React.createElement("div", { style: { padding: '20px', background: CP.surface, borderRadius: 14, border: `1px solid ${CP.border}` } },
                React.createElement("div", { style: { ...mono, fontSize: 9.5, letterSpacing: 1, color: CP.goldDeep, marginBottom: 10 } }, 'RECOMMENDED FOR YOU'),
                React.createElement("div", { style: { ...syne, fontSize: 16, fontWeight: 800, color: CP.ink, marginBottom: 8 } }, topLesson.title),
                React.createElement("div", { style: { fontSize: 13, color: CP.muted, lineHeight: 1.6, marginBottom: 16 } }, topLesson.sub),
                React.createElement("div", { style: { marginBottom: 18 } },
                  React.createElement("div", { style: { ...mono, fontSize: 9, letterSpacing: 1, color: CP.faint, marginBottom: 6 } }, 'WHY THIS LESSON?'),
                  React.createElement("div", { style: { fontSize: 13, color: CP.text, lineHeight: 1.7 } }, `${weakestMode.name} is the way of thinking you could practise most. ${plan.dailyExercise}`)
                ),
                React.createElement("div", { style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
                  React.createElement(CPButton, { onClick: () => setView('lessons') }, 'Start This Lesson →'),
                  React.createElement(CPButton, { variant: 'outline', onClick: () => setView('lessons') }, 'See all lessons →')
                )
              )
            ),

            // ── SECTION 9: Training path ──
            React.createElement("div", { style: { marginBottom: 20 } },
              React.createElement(CPEyebrow, null, 'Your next steps'),
              React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px,100%),1fr))', gap: 12 } },
                CP_JOURNEY.map((s, i) => (
                  React.createElement("button", { key: i, onClick: () => setView(s.view), className: "nf-cp-row", style: { textAlign: 'left', cursor: 'pointer', padding: '16px 14px', background: CP.card, border: `1px solid ${CP.border}`, borderRadius: 12 } },
                    React.createElement("div", { style: { ...mono, fontSize: 10, letterSpacing: 1, color: CP.gold, marginBottom: 8 } }, s.step),
                    React.createElement("div", { style: { ...syne, fontSize: 13, fontWeight: 800, color: CP.ink, marginBottom: 4 } }, s.title),
                    React.createElement("div", { style: { fontSize: 11.5, color: CP.muted, lineHeight: 1.5 } }, s.desc)
                  )
                ))
              )
            ),

            // ── Dimensional deep dive (optional, tap to expand) ──
            React.createElement("div", { style: { marginBottom: 20 } },
              React.createElement(CPEyebrow, null, 'How your four ways compare'),
              CP_MODE_ORDER.map(d => React.createElement(CPModeDetail, { key: d, dim: d, report: dimensionReports[d] }))
            ),

            // ── SECTION 10: change ──
            React.createElement(CPCard, { style: { padding: '28px 26px', marginBottom: 20 } },
              React.createElement(CPEyebrow, null, 'Track Your Progress'),
              React.createElement("div", { style: { ...syne, fontSize: 15, fontWeight: 800, color: CP.ink, marginBottom: 8 } }, 'Your starting point'),
              React.createElement("div", { style: { fontSize: 13.5, color: CP.muted, lineHeight: 1.7, marginBottom: 16, maxWidth: 480 } }, "This CFI establishes your baseline. Complete NeuralFusion training and retake the assessment, and your change will show how your profile changes over time."),
              React.createElement(CPButton, { variant: 'outline', onClick: () => setView('analytics') }, 'Continue Training →')
            ),

            // ── SECTION 11: Shareable profile ──
            React.createElement(CPCard, { style: { padding: '28px 26px', marginBottom: 20, textAlign: 'center' } },
              React.createElement(CPEyebrow, null, 'Share your result'),
              React.createElement("div", { style: { fontSize: 13.5, color: CP.muted, lineHeight: 1.7, marginBottom: 18, maxWidth: 440, margin: '0 auto 18px' } }, "You discovered how you think. Now invite someone else to discover theirs."),
              React.createElement("div", { style: { display: 'inline-block', textAlign: 'left', padding: '20px 24px', background: CP.ink, borderRadius: 14, marginBottom: 20 } },
                React.createElement("div", { style: { ...syne, fontSize: 12, fontWeight: 800, color: CP.gold, letterSpacing: 1, marginBottom: 10 } }, 'NEURALFUSION · My thinking result'),
                CP_MODE_ORDER.map(d => (
                  React.createElement("div", { key: d, style: { display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', padding: '3px 0' } },
                    React.createElement("span", null, CP_MODE_META[d].name), React.createElement("span", { style: { color: CP.gold, fontWeight: 700 } }, dimensionReports[d].integrationScore, '%')
                  )
                )),
                React.createElement("div", { style: { fontSize: 10.5, color: 'rgba(255,255,255,0.4)', marginTop: 10 } }, 'Discover how you think. tryneuralfusion.com')
              ),
              React.createElement("div", null,
                React.createElement(CPButton, { onClick: handleShare }, shareState === 'copied' ? 'Link copied ✓' : 'Share Profile')
              )
            ),

            // ── Save / account ──
            React.createElement("div", { className: "nf-cp-noprint", style: { padding: '28px 24px', marginBottom: 24, textAlign: 'center' } },
              React.createElement("div", { style: { ...syne, fontSize: 14, fontWeight: 800, color: CP.ink, marginBottom: 8 } },
                !user ? 'Save your results and track your growth'
                  : saveState === 'saving' ? 'Saving your results…'
                  : saveState === 'failed' ? 'Your result could not be saved'
                  : 'Your progress is saved.'
              ),
              React.createElement("div", { style: { fontSize: 13, color: CP.muted, marginBottom: 20, maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.7 } },
                !user ? 'Create a free account to save this report, track your progress over time, and unlock your personalized learning path.'
                  : saveState === 'failed' ? 'See the notice above: retry the save, or it will be lost when you leave this page.'
                  : 'Retake the test over time to watch your thinking improve.'
              ),
              !user && React.createElement(CPButton, { onClick: () => setShowAuth(true) }, 'Create free account')
            ),

            // ── Final CTA ──
            React.createElement("div", { style: { textAlign: 'center', marginBottom: 32 } },
              React.createElement("h2", { style: { ...syne, fontSize: 20, fontWeight: 800, color: CP.ink, marginBottom: 8 } }, 'Think Better. Deliberately.'),
              React.createElement("div", { style: { fontSize: 13.5, color: CP.muted, marginBottom: 22 } }, 'Your result is only the beginning.'),
              React.createElement("div", { className: "nf-cp-noprint", style: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' } },
                React.createElement(CPButton, { onClick: () => setView('lessons') }, 'Keep going →'),
                React.createElement(CPButton, { variant: 'outline', onClick: () => window.print() }, 'Download PDF report'),
                React.createElement(CPButton, { variant: 'ghost', onClick: onRetake }, 'Retake assessment')
              )
            )
          )
        )
      );
    }

    function CFIView({ setView, user, setShowAuth, openAuth, cfiResult, setCfiResult, refreshCfiHistory, cfiHistory }) {
      const [started, setStarted] = useState(false);
      const [step, setStep] = useState(0);
      const [answers, setAnswers] = useState({});
      const [showResult, setShowResult] = useState(!!cfiResult);

      // ── Account-first gate state ────────────────────────────────────
      // showGate: the account-creation screen shown when a signed-out visitor
      //   tries to begin the assessment (instead of starting it directly).
      // awaitingAuth: true once they've tapped "Create Free Account" / "Sign In"
      //   from the gate, so we know to continue them into the assessment the
      //   moment auth succeeds, rather than dumping them back on the intro.
      // justAuthed: the brief "your account is ready" screen shown once, right
      //   after that succeeds.
      // draftId: id of this attempt's in-progress cfi_results row, once one
      //   exists, so subsequent saves update it instead of creating new rows.
      const [showGate, setShowGate] = useState(false);
      const [awaitingAuth, setAwaitingAuth] = useState(false);
      const [justAuthed, setJustAuthed] = useState(false);
      const [draftId, setDraftId] = useState(null);
      const [savedResultId, setSavedResultId] = useState(null);
      const [saveFailed, setSaveFailed] = useState(false);
      const [saveErrorMsg, setSaveErrorMsg] = useState('');
      // saveState drives the "Your progress is saved" message so it reflects
      // what actually happened in the database, not just whether someone is
      // logged in. 'idle' -> 'saving' -> 'saved' | 'failed'.
      const [saveState, setSaveState] = useState(cfiResult ? 'saved' : 'idle');
      const openAuthTab = (tab) => { setAwaitingAuth(true); if (openAuth) openAuth(tab); else setShowAuth(true); };

      // Once the user becomes authenticated after being sent through the gate,
      // close the gate and show the short "ready" transition rather than
      // silently dropping them back on the un-started intro screen.
      useEffect(() => {
        if (user && showGate) {
          // Came through the gate: show the short "ready" screen after fresh auth.
          // If the session simply finished restoring (no auth modal used), go straight in.
          setShowGate(false);
          if (awaitingAuth) { setAwaitingAuth(false); setJustAuthed(true); }
          else { setStarted(true); }
        }
      }, [user, awaitingAuth, showGate]);

      // Hard guard: the questions must never be reachable without a signed-in user.
      // If the session ends mid-assessment (sign out, expired token), drop back to the
      // intro and clear in-memory answers so nothing carries over to the next person.
      useEffect(() => {
        if (!user && (started || justAuthed)) {
          setStarted(false); setJustAuthed(false); setStep(0); setAnswers({});
          setDraftId(null); setShowResult(false); setSaveState('idle');
        }
      }, [user]);

      // Resume an interrupted attempt: if a signed-in user has an in-progress
      // CFI row (refresh, dropped connection, closed browser, came back later),
      // load its answers and continue from the first unanswered question
      // instead of making them start over.
      useEffect(() => {
        if (!user || started || showResult) return;
        let cancelled = false;
        getInProgressCFI(user.id).then(draft => {
          if (cancelled || !draft) return;
          const savedAnswers = draft.answers || {};
          if (Object.keys(savedAnswers).length === 0) return;
          setAnswers(savedAnswers);
          setDraftId(draft.id);
          const firstUnansweredIdx = flow.findIndex(f => f.type==='question' && !(f.item.id in savedAnswers));
          setStep(firstUnansweredIdx === -1 ? 0 : firstUnansweredIdx);
          setStarted(true);
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line
      }, [user]);

      // ── Accessible response scale: each option carries a short, concrete
      // subtitle so the label isn't the only cue (helps with ambiguity that
      // trips up literal/ADHD/autistic readers), and equal visual weight
      // across all five so no option "looks" like the right answer.
      const SCALE_OPTIONS = [
        { value:1, label:'Never',     subtitle:"This doesn't happen for me" },
        { value:2, label:'Rarely',    subtitle:'Happens once in a while' },
        { value:3, label:'Sometimes', subtitle:'Happens about half the time' },
        { value:4, label:'Often',     subtitle:'Happens most of the time' },
        { value:5, label:'Always',    subtitle:'This is true almost every time' },
      ];

      // ── Accessible design tokens (WCAG AA, dyslexia-friendly) ──────────
      // Scoped to the assessment screens only, distinct from the app's
      // global dark navy/gold theme used elsewhere.
      const AC = {
        bg: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: '#F9FAFB',
        text: '#111827', muted: '#4B5563', border: '#D1D5DB',
        gold: '#C8A95A', goldDark: '#8A6D2F', goldTint: '#FBF3E3',
        focus: '#8A6D2F',
        font: "'Atkinson Hyperlegible', 'Inter', -apple-system, sans-serif",
      };

      // Inject the dyslexia-friendly font + visible keyboard focus states once.
      useEffect(() => {
        if (!document.getElementById('nf-a11y-font')) {
          const link = document.createElement('link');
          link.id = 'nf-a11y-font';
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap';
          document.head.appendChild(link);
        }
        if (!document.getElementById('nf-a11y-styles')) {
          const style = document.createElement('style');
          style.id = 'nf-a11y-styles';
          style.textContent = `
            .nf-a11y-scale-btn:focus-visible,
            .nf-a11y-btn:focus-visible {
              outline: 3px solid ${AC.focus};
              outline-offset: 3px;
            }
            .nf-a11y-scale-btn:hover { border-color: ${AC.gold} !important; background: ${AC.goldTint} !important; }
            @media (prefers-reduced-motion: reduce) {
              .nf-a11y-fade { animation: none !important; }
            }
          `;
          document.head.appendChild(style);
        }
      }, []);

      const flow = useMemo(() => {
        const f = [];
        let lastDim = null;
        CFI_ITEMS.forEach(item => {
          if (item.dim !== lastDim) { f.push({ type:'section', dim: item.dim }); lastDim = item.dim; }
          f.push({ type:'question', item });
        });
        return f;
      }, []);

      const answeredCount = Object.keys(answers).length;
      const percent = Math.round((answeredCount / CFI_ITEMS.length) * 100);
      const remainingQ = CFI_ITEMS.length - answeredCount;
      const estMinutes = Math.max(1, Math.ceil((remainingQ * 12) / 60));
      const motivation = () => {
        if (answeredCount === 0) return "There are no wrong answers here. Go with your first instinct.";
        if (percent < 50) return "Good start. You're building an accurate picture.";
        if (percent < 100) return "Over halfway there. Keep going.";
        return "Nice work.";
      };

      const finalize = (finalAnswers) => {
        // Reverse-scored items (e.g. "focused under deadline pressure") are inverted
        // before summing, since a high raw answer there means LESS fragmentation.
        const effective = (item) => {
          const v = finalAnswers[item.id];
          return item.reversed ? (6 - v) : v;
        };
        const total = CFI_ITEMS.reduce((sum, item) => sum + effective(item), 0);
        // NOTE: band thresholds and internal band values are unchanged (scoring logic).
        // Only the `desc` / `recommendation` copy shown to the person is reframed around
        // coordination (how well their ways of thinking currently work together) rather
        // than framing lower scores as damage or deficiency.
        // Band thresholds are CFI-1.0's original 16-item bands, proportionally rescaled
        // onto the canonical 13–65 range (same relative cut points, not new thresholds).
        let band, desc, recommendation;
        if (total<=17) { band='Integrated'; desc='Your different ways of thinking already work well together.'; recommendation='Keep up your practice and move on to the later lessons.'; }
        else if (total<=28) { band='Moderate fragmentation'; desc='Your ways of thinking work well together some of the time. A couple of them are underused when you decide.'; recommendation='Start with Lesson 2. Practise a little each day for two weeks to use all four ways of thinking more often.'; }
        else if (total<=40) { band='High fragmentation'; desc='Your ways of thinking do not always work together, especially under pressure.'; recommendation='Begin with Lesson 1 and practise a little each day.'; }
        else { band='Critical fragmentation'; desc='Right now your ways of thinking rarely work together. One tends to take over every decision, even when it is not the best fit.'; recommendation='Start with Lesson 1 and retake the test every week or two to see your progress.'; }

        const dims = { A:[], I:[], S:[], R:[], E:[] };
        CFI_ITEMS.forEach(item => { if (finalAnswers[item.id]) dims[item.dim].push(effective(item)); });
        const dimScores = {};
        Object.keys(dims).forEach(d => { dimScores[d] = dims[d].length ? Math.round(dims[d].reduce((a,b)=>a+b,0)/dims[d].length*20) : 0; });

        // Dominant brain is chosen only among the four true ways of thinking (A/I/S/R).
        // E ("integration"/pressure-overload) is never a fifth brain and is excluded here:
        // it's reported separately via integrationScore.
        // FIX (audit finding #1): dimScores are FRAGMENTATION scores: higher = more
        // fragmented, i.e. that mode is currently coordinating WORSE, not better. The
        // dominant/strongest mode is therefore the one with the LOWEST score (ascending
        // sort), matching buildCognitiveProfile()'s primaryDim logic below. A previous
        // version of this file sorted descending here, which named the MOST fragmented
        // mode as "Dominant", contradicting the profile section on the same results page.
        const brainMap = { A:'analytical', I:'intuitive', S:'associative', R:'reflective' };
        const sortedDims = Object.entries(dimScores).filter(([d]) => d !== 'E').sort((a,b)=>a[1]-b[1]);
        const dominantBrain = brainMap[sortedDims[0][0]] || 'analytical';

        const integrationScore = cfiIntegrationScore(total);
        const dimensionReports = {};
        Object.keys(dimScores).forEach(d => { dimensionReports[d] = buildDimensionReport(d, dimScores[d]); });
        const profile = buildCognitiveProfile(dimensionReports, integrationScore, band);
        const plan = buildImprovementPlan(dimensionReports, band);

        const result = { total, band, desc, recommendation, dimScores, dominantBrain, integrationScore, dimensionReports, profile, plan };
        setCfiResult(result);
        setShowResult(true);
        // Finalizing updates the same in-progress row (draftId) if one exists,
        // rather than inserting a second row for this attempt.
        if (user) {
          setSaveState('saving');
          saveCFIResult(user.id, result, finalAnswers, draftId).then(({ data, error }) => {
            if (error) {
              // Keep draftId as-is on failure so a "Retry" click still targets
              // the same row instead of inserting a duplicate.
              console.error('[CFI SAVE ERROR] final result was NOT saved:', error);
              setSaveFailed(true);
              setSaveState('failed');
              setSaveErrorMsg(error.message || JSON.stringify(error));
            } else {
              setSaveState('saved');
              if (refreshCfiHistory) refreshCfiHistory();
              setSaveErrorMsg('row id: ' + (data && data[0] && data[0].id ? data[0].id : '(insert, id not returned)')); setSavedResultId(data && data[0] && data[0].id ? data[0].id : null);
              setDraftId(null);
            }
          });
        } else {
          setSaveState('idle');
          setSaveErrorMsg('not signed in: result was never sent to the database');
        }
      };

      const handleAnswer = (item, val) => {
        const newAnswers = { ...answers, [item.id]: val };
        setAnswers(newAnswers);
        // Persist progress as the user goes (not just at the end), so a refresh,
        // dropped connection, or closed tab doesn't lose an authenticated attempt.
        // Changing an earlier answer updates the same draft row rather than
        // creating a new one.
        const isLastQuestion = item.id === CFI_ITEMS[CFI_ITEMS.length-1].id;
        // On the last question, skip the in-progress autosave entirely and go
        // straight to finalize(). Previously both writes fired at once here,
        // racing to update the same row - if the in-progress save (which only
        // touches answers/status) landed on the server AFTER the completed
        // save, it silently reset status back to 'in_progress' while leaving
        // total_score/band populated, making a fully scored result vanish
        // from admin and from the user's own Analytics view.
        if (user && !isLastQuestion) {
          saveCFIProgress(user.id, newAnswers, draftId).then(id => { if (id && id !== draftId) setDraftId(id); });
        }
        if (isLastQuestion) { finalize(newAnswers); }
        else { setStep(s => s+1); }
      };

      const handleRetake = () => { setStarted(false); setStep(0); setAnswers({}); setShowResult(false); setDraftId(null); setSaveState('idle'); setSaveErrorMsg(''); };

      // ── Results screen ──
      if (showResult && cfiResult) {
        return (
          React.createElement(React.Fragment, null,
            saveFailed && React.createElement("div", {style: { background:'#FEE2E2', borderBottom:'1px solid #FCA5A5', color:'#991B1B', padding:'12px 20px', textAlign:'center', fontSize:14, fontFamily:AC.font }},
              "Your result is shown below, but we couldn't save it to your account. Please check your connection and retry, or contact support if this keeps happening.",
              React.createElement("button", {className:"nf-a11y-btn", onClick: ()=>{
                setSaveFailed(false);
                setSaveState('saving');
                saveCFIResult(user.id, cfiResult, answers, draftId).then(({ data, error }) => {
                  if (error) { setSaveFailed(true); setSaveState('failed'); setSaveErrorMsg(error.message || JSON.stringify(error)); }
                  else { setSaveState('saved'); setSaveErrorMsg('row id: ' + (data && data[0] && data[0].id ? data[0].id : '(insert, id not returned)')); setSavedResultId(data && data[0] && data[0].id ? data[0].id : null); setDraftId(null); }
                });
              }, style: { marginLeft:12, background:'none', border:'1px solid #991B1B', borderRadius:8, color:'#991B1B', padding:'4px 12px', cursor:'pointer', fontSize:13, fontWeight:700 }}, 'Retry')
            ),
            React.createElement(CFIResults, { cfiResult, setView, user, setShowAuth, onRetake: handleRetake, saveState, shareResultId: savedResultId || (cfiHistory && cfiHistory.length ? cfiHistory[cfiHistory.length - 1].id : null) })
          )
        );
      }

      // ── Account gate ──────────────────────────────────────────────────
      // Shown instead of the questions when a signed-out visitor tries to begin.
      // An unauthenticated visitor can never reach the question screens below:
      // this is the only path from the intro into `started`, and it requires
      // `user` to be set first.
      if (showGate && !user) {
        return (
          React.createElement("div", {style: { paddingTop:80, paddingBottom:60, background:AC.bg, minHeight:'100vh', fontFamily:AC.font, display:'flex', alignItems:'center' }},
            React.createElement("div", {style: { maxWidth:520, margin:'0 auto', padding:'32px 20px', textAlign:'center' }},
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:14, fontWeight:700, letterSpacing:'0.06em', color:AC.goldDark, marginBottom:20, textTransform:'uppercase' }}, 'Thinking Clarity Test'),
              React.createElement("h1", {style: { fontFamily:AC.font, fontSize:'clamp(24px,5vw,30px)', fontWeight:800, color:AC.text, marginBottom:16, lineHeight:1.3 }}, 'Your result starts here.'),
              React.createElement("p", {style: { fontSize:17, color:AC.text, lineHeight:1.7, marginBottom:28, maxWidth:440, margin:'0 auto 28px' }},
                'Create a free account first, so your result is saved.'
              ),
              React.createElement("div", {style: { fontSize:15, color:AC.muted, lineHeight:1.7, marginBottom:32, maxWidth:440, margin:'0 auto 32px', padding:'16px 20px', background:AC.surfaceAlt, border:`1px solid ${AC.border}`, borderRadius:16, textAlign:'left' }},
                'Your account keeps your result safe so you can see your progress later.'
              ),
              React.createElement("button", {className: "nf-a11y-btn", onClick: ()=>openAuthTab('signup'), style: {
                fontFamily:AC.font, fontSize:18, fontWeight:700, padding:'18px 40px', minHeight:56, width:'100%', maxWidth:360,
                background:AC.goldDark, color:'#FFFFFF', border:'none', borderRadius:16, cursor:'pointer',
                boxShadow:'0 2px 8px rgba(138,109,47,0.35)', marginBottom:16,
              }}, 'Create Free Account'),
              React.createElement("div", {style: { fontSize:15, color:AC.muted }},
                'Already have an account? ',
                React.createElement("button", {className: "nf-a11y-btn", onClick: ()=>openAuthTab('login'), style: {
                  background:'none', border:'none', color:AC.goldDark, fontWeight:700, fontSize:15, cursor:'pointer', textDecoration:'underline',
                }}, 'Sign In')
              ),
              React.createElement("div", {style: { marginTop:28 }},
                React.createElement("button", {className: "nf-a11y-btn", onClick: ()=>{ setShowGate(false); setAwaitingAuth(false); }, style: {
                  background:'none', border:'none', ...mono, fontSize:12, letterSpacing:1, color:AC.muted, cursor:'pointer',
                }}, '← Back')
              )
            )
          )
        );
      }

      // ── Post-auth transition ────────────────────────────────────────
      // Shown once, right after signup/login completes for someone who came
      // through the gate, before they land in the assessment itself.
      if (justAuthed) {
        return (
          React.createElement("div", {style: { paddingTop:80, paddingBottom:60, background:AC.bg, minHeight:'100vh', fontFamily:AC.font, display:'flex', alignItems:'center' }},
            React.createElement("div", {style: { maxWidth:520, margin:'0 auto', padding:'32px 20px', textAlign:'center' }},
              React.createElement("div", {style: { fontSize:30, color:AC.goldDark, marginBottom:16 }}, '✓'),
              React.createElement("h1", {style: { fontFamily:AC.font, fontSize:'clamp(24px,5vw,30px)', fontWeight:800, color:AC.text, marginBottom:16, lineHeight:1.3 }}, 'Your account is ready.'),
              React.createElement("p", {style: { fontSize:17, color:AC.text, lineHeight:1.7, marginBottom:32, maxWidth:440, margin:'0 auto 32px' }},
                'Your test is ready.'
              ),
              React.createElement("button", {className: "nf-a11y-btn", onClick: ()=>{ setJustAuthed(false); setStarted(true); }, style: {
                fontFamily:AC.font, fontSize:18, fontWeight:700, padding:'18px 40px', minHeight:56,
                background:AC.goldDark, color:'#FFFFFF', border:'none', borderRadius:16, cursor:'pointer',
                boxShadow:'0 2px 8px rgba(138,109,47,0.35)',
              }}, 'Begin Assessment →')
            )
          )
        );
      }

      // ── Intro screen (accessible) ──
      if (!started) {
        return (
          React.createElement("div", {style: { paddingTop:80, paddingBottom:60, background:AC.bg, minHeight:'100vh', fontFamily:AC.font }},
            React.createElement("div", {style: { maxWidth:720, margin:'0 auto', padding:'32px 20px', textAlign:'center' }},
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:14, fontWeight:700, letterSpacing:'0.06em', color:AC.goldDark, marginBottom:20, textTransform:'uppercase' }}, 'Thinking Clarity Test'),
              React.createElement("h1", {style: { fontFamily:AC.font, fontSize:'clamp(26px,5vw,34px)', fontWeight:800, color:AC.text, marginBottom:20, lineHeight:1.3 }},
                'Discover how you think', React.createElement("br", null), React.createElement("span", {style: {color:AC.goldDark}}, 'and where it gets stuck')
              ),
              React.createElement("p", {style: { fontSize:19, color:AC.text, lineHeight:1.7, marginBottom:20, maxWidth:560, margin:'0 auto 20px' }},
                `You'll answer ${CFI_ITEMS.length} short, everyday questions. No jargon, nothing tricky. It takes about 3–4 minutes.`
              ),
              // Neurodivergent-support note
              React.createElement("div", {role:'note', style: { fontSize:18, color:AC.text, lineHeight:1.7, marginBottom:20, maxWidth:560, margin:'0 auto 20px', padding:'20px 22px', background:AC.goldTint, border:`1px solid ${AC.gold}`, borderRadius:16, textAlign:'left' }},
                'This assessment is designed to support a wide range of thinking styles, including ADHD, dyslexia, autism, and other neurodivergent profiles. There are no right or wrong answers. Respond based on your typical experience, not how you think you should perform.'
              ),
              React.createElement("div", {style: { fontSize:16, color:AC.muted, lineHeight:1.7, marginBottom:36, maxWidth:560, margin:'0 auto 36px', padding:'16px 20px', background:AC.surfaceAlt, border:`1px solid ${AC.border}`, borderRadius:16, textAlign:'left' }},
                'The test shows how you take in information, make decisions and combine different ways of thinking. It is not a personality test, a mental health check or a diagnosis.'
              ),
              React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap:16, marginBottom:36, textAlign:'left' }},
                ['A score for how clear your thinking is right now', 'Your natural strengths and blind spots, explained plainly', 'A personalized, day-by-day improvement plan', 'A simple chart of your four ways of thinking'].map((item,i)=>(
                  React.createElement("div", {key: i, style: { padding:'18px 20px', display:'flex', alignItems:'center', gap:14, background:AC.surface, border:`1px solid ${AC.border}`, borderRadius:16, boxShadow:'0 1px 3px rgba(17,24,39,0.06)' }},
                    React.createElement("div", {style: { fontSize:20, color:AC.goldDark, flexShrink:0 }}, '◈'),
                    React.createElement("div", {style: { fontSize:16, color:AC.text, lineHeight:1.6 }}, item)
                  )
                ))
              ),
              React.createElement("button", {className: "nf-a11y-btn", onClick: ()=> {
                if (user) {
                  setStarted(true);
                } else {
                  setShowGate(true);
                }
              }, style: {
                fontFamily:AC.font, fontSize:18, fontWeight:700, padding:'18px 40px', minHeight:56,
                background:AC.goldDark, color:'#FFFFFF', border:'none', borderRadius:16, cursor:'pointer',
                boxShadow:'0 2px 8px rgba(138,109,47,0.35)',
              }}, 'Take the test →'),
              React.createElement("div", {style: { ...mono, fontSize:12, color:AC.muted, marginTop:14 }}, 'Free account required. Your results are saved automatically.')
            )
          )
        );
      }

      const current = flow[step];

      // ── Section intro screen (accessible) ──
      if (current.type === 'section') {
        const meta = CFI_SECTIONS[current.dim];
        const isFirst = current.dim === 'A';
        return (
          React.createElement("div", {style: { paddingTop:80, paddingBottom:40, minHeight:'70vh', display:'flex', alignItems:'center', background:AC.bg, fontFamily:AC.font }},
            React.createElement("div", {className: "nf-a11y-fade", style: { maxWidth:620, margin:'0 auto', padding:'32px 24px', width:'100%', textAlign:'center' }},
              !isFirst && React.createElement("div", {style: { fontFamily:AC.font, fontSize:15, fontWeight:700, letterSpacing:'0.02em', color:AC.goldDark, marginBottom:24 }}, motivation(), ' · ', percent, '% done'),
              React.createElement("div", {style: { fontSize:30, color:meta.color, marginBottom:16 }}, meta.icon),
              React.createElement("h2", {style: { fontFamily:AC.font, fontSize:'clamp(22px,4vw,26px)', fontWeight:800, color:AC.text, marginBottom:16, lineHeight:1.3 }}, meta.title),
              React.createElement("p", {style: { fontSize:18, color:AC.text, lineHeight:1.7, marginBottom:36, maxWidth:460, margin:'0 auto 36px' }}, meta.blurb),
              React.createElement("button", {className: "nf-a11y-btn", onClick: ()=>setStep(s=>s+1), style: {
                fontFamily:AC.font, fontSize:17, fontWeight:700, padding:'16px 36px', minHeight:56,
                background:AC.goldDark, color:'#FFFFFF', border:'none', borderRadius:16, cursor:'pointer',
                boxShadow:'0 2px 8px rgba(138,109,47,0.35)',
              }}, isFirst ? 'Start →' : 'Continue →'),
              step > 0 && React.createElement("div", null,
                React.createElement("button", {className: "nf-a11y-btn", onClick: ()=>setStep(s=>Math.max(0,s-1)), style: {
                  fontFamily:AC.font, fontSize:16, fontWeight:600, marginTop:20, padding:'12px 20px', minHeight:48,
                  background:'transparent', color:AC.muted, border:'none', cursor:'pointer', borderRadius:12,
                }}, '← Back')
              )
            )
          )
        );
      }

      // ── Question screen (accessible) ──
      const item = current.item;
      const brainInfo = C.brains[item.brain] || C.brains.analytical;
      const qIndex = CFI_ITEMS.findIndex(q=>q.id===item.id);

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:60, background:AC.bg, minHeight:'100vh', fontFamily:AC.font }},
          React.createElement("div", {style: { maxWidth:680, margin:'0 auto', padding:'32px 20px', width:'100%' }},
            // Progress indicator
            React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }},
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:15, fontWeight:700, color:AC.text }}, 'Question ', qIndex+1, ' of ', CFI_ITEMS.length),
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:15, fontWeight:600, color:AC.goldDark }}, '~', estMinutes, ' min left')
            ),
            React.createElement("div", {role:'progressbar', 'aria-valuenow':percent, 'aria-valuemin':0, 'aria-valuemax':100, style: { height:10, background:AC.surfaceAlt, border:`1px solid ${AC.border}`, borderRadius:6, marginBottom:14, overflow:'hidden' }},
              React.createElement("div", {style: { width:`${percent}%`, height:'100%', background:AC.gold, borderRadius:6, transition:'width 0.4s ease' }})
            ),
            React.createElement("div", {style: { fontFamily:AC.font, fontSize:15, color:AC.muted, marginBottom:36 }}, motivation()),
            React.createElement("div", {key: item.id, className: "nf-a11y-fade"},
              React.createElement("div", {style: { display:'flex', alignItems:'center', gap:10, marginBottom:16 }},
                React.createElement("div", {style: { fontSize:18, color:brainInfo.color }}, brainInfo.symbol),
                React.createElement("div", {style: { fontFamily:AC.font, fontSize:14, fontWeight:700, letterSpacing:'0.04em', color:AC.goldDark, textTransform:'uppercase' }}, CFI_SECTIONS[item.dim]?.title)
              ),
              React.createElement("div", {style: { fontFamily:AC.font, fontSize:'clamp(20px,4.5vw,26px)', fontWeight:700, color:AC.text, lineHeight:1.5, marginBottom:36 }}, item.text),
              // Card-style response scale
              React.createElement("div", {role:'radiogroup', 'aria-label':'Response', style: { display:'flex', flexDirection:'column', gap:12 }}, SCALE_OPTIONS.map((opt)=>{
                const isSelected = answers[item.id]===opt.value;
                return (
                  React.createElement("button", {
                    key: opt.value,
                    className: "nf-a11y-scale-btn",
                    role:'radio',
                    'aria-checked': isSelected,
                    onClick: ()=>handleAnswer(item, opt.value),
                    style: {
                      width:'100%', textAlign:'left', padding:'20px 22px', minHeight:72,
                      borderRadius:16, border:`2px solid ${isSelected?AC.goldDark:AC.border}`,
                      background: isSelected ? AC.goldTint : AC.surface,
                      display:'flex', alignItems:'center', justifyContent:'space-between', gap:16,
                      cursor:'pointer', boxShadow: isSelected ? '0 2px 8px rgba(138,109,47,0.25)' : '0 1px 2px rgba(17,24,39,0.05)',
                      fontFamily:AC.font,
                    }
                  },
                    React.createElement("div", null,
                      React.createElement("div", {style: { fontSize:19, fontWeight:700, color:AC.text, marginBottom:4 }}, opt.label),
                      React.createElement("div", {style: { fontSize:15, color:AC.muted, lineHeight:1.5 }}, opt.subtitle)
                    ),
                    React.createElement("div", {"aria-hidden":"true", style: {
                      width:26, height:26, borderRadius:'50%', flexShrink:0,
                      border:`2px solid ${isSelected?AC.goldDark:AC.border}`,
                      background: isSelected ? AC.goldDark : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}, isSelected && React.createElement("div", {style: { width:10, height:10, borderRadius:'50%', background:'#FFFFFF' }}))
                  )
                );
              }))
            ),
            React.createElement("button", {className: "nf-a11y-btn", onClick: ()=>setStep(s=>Math.max(0,s-1)), style: {
              fontFamily:AC.font, fontSize:16, fontWeight:600, marginTop:32, padding:'12px 18px', minHeight:48,
              background:'transparent', color:AC.muted, border:`1px solid ${AC.border}`, cursor:'pointer', borderRadius:12,
            }}, '← Previous')
          )
        )
      );
    }



    // ═══════════════════════════════════════════════════════════════════
    //  ANALYTICS VIEW
    // ═══════════════════════════════════════════════════════════════════
    // "YOUR PROGRESS": every completed CFI-1.0 attempt for this user, oldest→newest,
    // with per-assessment numbering, change vs. the previous attempt, and band movement.
    // A lower CFI score is less fragmentation, i.e. improvement; matches the change
    // sign convention used elsewhere on this page (baseline - latest).

    function AnalyticsView({ cfiResult, lessonProgress, cfiHistory=[], setView, user }) {
      const E = React.createElement;
      const completedLessons = Object.values(lessonProgress || {}).filter(v => v === 100).length;
      const [decisions, setDecisions] = useState([]);
      useEffect(() => { if (user) nfjLoadDecisions(user.id).then(setDecisions).catch(() => {}); }, [user]);
      const reviewed = decisions.filter(d => d.status === 'reviewed').length;
      const hist = cfiHistory || [];
      const first = hist[0], last = hist[hist.length - 1];
      const change = hist.length >= 2 ? first.total_score - last.total_score : null; // positive = clearer thinking
      const ways = [['A', 'Logic and facts'], ['I', 'Gut feeling'], ['S', 'Connecting ideas'], ['R', 'Stepping back']];
      const box = { padding: '28px', marginBottom: 20 };
      const eyebrow = { ...mono, fontSize: 11, letterSpacing: 1.5, color: C.cyan, marginBottom: 14, textTransform: 'uppercase' };
      const big = { ...syne, fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 6 };
      const small = { fontSize: 14, color: C.muted, lineHeight: 1.7 };
      const btn = (label, go, outline) => E("button", { className: outline ? 'btn-outline' : 'btn-primary', onClick: () => setView(go), style: { marginTop: 16 } }, label);
      const wayRow = ([d, name]) => {
        const b0 = first.dim_scores && first.dim_scores[d], b1 = last.dim_scores && last.dim_scores[d];
        if (b0 === undefined || b1 === undefined) return null;
        const diff = b1 - b0;
        const word = diff < 0 ? 'Better' : diff > 0 ? 'Needs work' : 'Same';
        return E("div", { key: d, style: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14, flexWrap: 'wrap' } },
          E("span", { style: { color: C.text } }, name),
          E("span", { style: { color: diff < 0 ? '#7AAFCF' : diff > 0 ? '#F87171' : C.muted } }, word));
      };
      return E("div", { style: { paddingTop: 80, paddingBottom: 100 } },
        E("div", { style: { maxWidth: 760, margin: '0 auto', padding: '40px 24px' } },
          E("h1", { style: { ...syne, fontSize: 'clamp(24px,5vw,34px)', fontWeight: 800, color: C.text, marginBottom: 24 } }, 'My progress'),
          !cfiResult
            ? E("div", { className: "card", style: box }, E("div", { style: big }, 'You have not taken the test yet'), E("div", { style: small }, 'Take the 4-minute test and this page will show how your thinking changes over time.'), btn('Take the test', 'cfi'))
            : E("div", { className: "card", style: box },
                E("div", { style: eyebrow }, 'Your latest result'),
                E("div", { style: big }, plainBand(cfiResult.band)),
                E("div", { style: small }, 'Score: ' + cfiResult.total + ' (the scale runs from 13 to 65, and a lower score means clearer thinking).'),
                btn('See my full result', 'cfi', true)),
          cfiResult ? E("div", { className: "card", style: box },
            E("div", { style: eyebrow }, 'Your change'),
            change === null
              ? E("div", { style: small }, 'Take the test again after a few lessons to see how your thinking has changed.')
              : E("div", null,
                  E("div", { style: big }, change > 0 ? 'Clearer by ' + change + (change === 1 ? ' point' : ' points') : change < 0 ? 'More scattered by ' + Math.abs(change) + (change === -1 ? ' point' : ' points') : 'No change yet'),
                  E("div", { style: { ...small, marginBottom: 14 } }, 'Compared with your first test.'),
                  ways.map(wayRow)),
            change === null ? btn('Take the test again', 'cfi', true) : null) : null,
          hist.length > 0 ? E("div", { className: "card", style: box },
            E("div", { style: eyebrow }, 'Your tests'),
            hist.slice().reverse().map((r, i) => E("div", { key: r.id || i, style: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.border}`, fontSize: 14, flexWrap: 'wrap' } },
              E("span", { style: { color: C.text } }, new Date(r.created_at).toLocaleDateString()),
              E("span", { style: { color: C.muted } }, plainBand(r.band) + ' · score ' + r.total_score)))) : null,
          E("div", { className: "card", style: box },
            E("div", { style: eyebrow }, 'Lessons'),
            E("div", { style: big }, completedLessons + (completedLessons === 1 ? ' lesson done' : ' lessons done')),
            btn(completedLessons ? 'Keep learning' : 'Start learning', 'lessons', true)),
          E("div", { className: "card", style: box },
            E("div", { style: eyebrow }, 'Decisions'),
            E("div", { style: big }, decisions.length + (decisions.length === 1 ? ' decision saved' : ' decisions saved')),
            decisions.length ? E("div", { style: small }, reviewed + ' reviewed so far.') : E("div", { style: small }, 'Think a real decision through and save it here.'),
            btn('Open my decisions', 'decisions', true))));
    }

    // ═══════════════════════════════════════════════════════════════════
    //  ACADEMY PERSONALIZATION ENGINE
    //  CFI → thinking result → Development Opportunity → Recommended
    //  Lesson → Training → Practice → Integration → Progress → Next.
    //  Reads ONLY real cfiResult / LESSONS / lessonProgress data. Never
    //  invents lessons, never fabricates metrics, never fakes completion.
    // ═══════════════════════════════════════════════════════════════════

    // Priority order (see master prompt "RECOMMENDATION LOGIC"):
    // 1. Cognitive development opportunity (weakest dim → matching lesson.brain)
    // 2. Current training progress (an in-progress lesson wins over a fresh one)
    // 3. Lessons already completed (skip them)
    // 4/5. Prerequisites / level progression (curriculum order, id ascending)
    function getAcademyRecommendation(cfiResult, lessonProgress) {
      const isComplete = id => (lessonProgress[id] || 0) === 100;
      const inProgress = LESSONS.find(l => { const p = lessonProgress[l.id] || 0; return p > 0 && p < 100; });
      if (inProgress) {
        return { lesson: inProgress, opportunityDim: cfiResult?.profile?.weakestDim || null,
          reason: `You're partway through this lesson. Finish it before starting something new: consistency matters more than coverage.` };
      }
      if (!cfiResult || !cfiResult.plan) {
        const first = LESSONS.find(l => !isComplete(l.id)) || LESSONS[0];
        return { lesson: first, opportunityDim: null,
          reason: `This is the best place to begin. Take the test and this suggestion will update to match how you think.` };
      }
      const { plan, profile } = cfiResult;
      // plan.recommendedLessonIds = [1, <weakest-brain lesson id>]; weakest-first.
      const ordered = [...plan.recommendedLessonIds].reverse();
      const fromPlan = ordered.map(id => LESSONS.find(l => l.id === id)).filter(Boolean).find(l => !isComplete(l.id));
      const nextInCurriculum = LESSONS.find(l => !isComplete(l.id));
      const lesson = fromPlan || nextInCurriculum || LESSONS[LESSONS.length - 1];
      const weakestName = CFI_DIM_LABELS[profile.weakestDim];
      const matchesOpportunity = lesson.brain === profile.weakestBrain;
      let reason;
      if (matchesOpportunity) reason = `${weakestName} is the way of thinking you could practise most. ${plan.dailyExercise}`;
      else if (lesson.id === 1) reason = `This lesson builds the foundation every later lesson depends on, including the practice that targets ${weakestName.toLowerCase()}.`;
      else if (!fromPlan && nextInCurriculum) reason = `You have finished the lessons picked for you. This is the next lesson, helping all four ways of thinking work together.`;
      else reason = `This is the most useful next step for you right now.`;
      return { lesson, opportunityDim: profile.weakestDim, reason };
    }

    // Five-step training path. Only marks a step complete/current when real
    // state supports it: never a fabricated "in progress" for a step with
    // no underlying data.


    // ── Section 7: Today's Cognitive Practice ──────────────────────────
    // Simplest functional version: no existing daily-practice engine to
    // reuse, so this tracks only in-session state (no DB table exists for
    // it yet): an honest, un-fabricated completion marker for today.

    // ── Full Academy homepage (Sections 1–10), rendered above the lesson
    // library when the person is on the Lessons list view. ──────────────
    function AcademyHome({ setView, user, setShowAuth, cfiResult, cfiHistory = [], lessonProgress, isPro, onStartLesson, onUpgrade }) {
      const hasCFI = !!(cfiResult && cfiResult.dimensionReports);
      const rec = getAcademyRecommendation(cfiResult, lessonProgress);
      const completedCount = Object.values(lessonProgress).filter(v => v === 100).length;
      const inProgressLesson = LESSONS.find(l => { const p = lessonProgress[l.id] || 0; return p > 0 && p < 100; });
      // A lesson is locked when it isn't free and the person isn't Pro.
      const isLessonLocked = lesson => !!lesson && !lesson.free && !isPro;
      const LessonCTA = ({ lesson, label }) => isLessonLocked(lesson)
        ? React.createElement("div", null,
            React.createElement("div", { style: { display: 'inline-flex', alignItems: 'center', gap: 8, ...mono, fontSize: 10, letterSpacing: 1, color: '#C24545', marginBottom: 14 } }, 'PRO LESSON'),
            React.createElement("div", null, React.createElement(CPButton, { onClick: onUpgrade }, 'Unlock all lessons')))
        : React.createElement(CPButton, { onClick: () => onStartLesson(lesson.id) }, label);
      return (
        React.createElement("div", { style: { marginBottom: 56 } },
          React.createElement("div", { style: { marginBottom: 28 } },
            React.createElement(CPEyebrow, null, 'Lessons'),
            React.createElement("h1", { style: { ...syne, fontSize: 'clamp(22px,4.5vw,30px)', fontWeight: 800, color: CP.ink, marginBottom: 12, lineHeight: 1.15 } }, 'Lessons to help you think better'),
            React.createElement("div", { style: { fontSize: 14, color: CP.muted, lineHeight: 1.7, maxWidth: 520, marginBottom: 16 } }, hasCFI ? 'Short lessons you can do at your own pace. We picked the best place to start for you.' : 'Short lessons you can do at your own pace. Take the test first and we will suggest where to start.'),
            !hasCFI ? React.createElement(CPButton, { onClick: () => setView('cfi') }, 'Take the test') : null,
            completedCount > 0 ? React.createElement("div", { style: { ...mono, fontSize: 11, letterSpacing: 1, color: CP.goldDeep, marginTop: 12 } }, completedCount + ' OF ' + LESSONS.length + ' LESSONS DONE') : null
          ),
          React.createElement(CPCard, { style: { padding: '28px 26px', marginBottom: 20, borderColor: CP.borderStrong } },
            React.createElement(CPEyebrow, null, inProgressLesson ? 'Continue where you left off' : 'Start here'),
            React.createElement("div", { style: { ...syne, fontSize: 17, fontWeight: 800, color: CP.ink, marginBottom: 8 } }, (inProgressLesson || rec.lesson).title),
            React.createElement("div", { style: { fontSize: 14, color: CP.muted, lineHeight: 1.6, marginBottom: 14 } }, (inProgressLesson || rec.lesson).sub),
            !inProgressLesson ? React.createElement("div", { style: { fontSize: 14, color: CP.text, lineHeight: 1.7, marginBottom: 18 } }, rec.reason) : null,
            inProgressLesson ? React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 } },
              React.createElement("div", { style: { flex: 1, height: 6, background: CP.goldTint, borderRadius: 3, overflow: 'hidden' } }, React.createElement("div", { style: { width: `${lessonProgress[inProgressLesson.id]}%`, height: '100%', background: CP.gold } })),
              React.createElement("div", { style: { ...mono, fontSize: 11, color: CP.muted } }, `${lessonProgress[inProgressLesson.id]}% done`)) : null,
            React.createElement(LessonCTA, { lesson: inProgressLesson || rec.lesson, label: inProgressLesson ? 'Continue lesson' : 'Start this lesson' })
          )
        )
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  LESSONS VIEW
    // ═══════════════════════════════════════════════════════════════════
    function LessonsView({ setView, user, session, paystackKey, setShowAuth, isPro, setIsPro, cfiResult, cfiHistory, lessonProgress, setLessonProgress, proPrice = 600000 }) {
      const [activeLesson, setActiveLesson] = useState(null);
      const [page, setPage] = useState(0);
      const [paystackLoading, setPaystackLoading] = useState(false);
      const paystackHandlerRef = React.useRef(null);

      // Load Paystack script dynamically then open popup
      const loadPaystackScript = () => new Promise((resolve, reject) => {
        if (typeof PaystackPop !== 'undefined') { resolve(); return; }
        const s = document.createElement('script');
        s.src = 'https://js.paystack.co/v1/inline.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });

      // Server-side verification. The edge function checks the amount, currency,
      // owner and one-time use of the reference before granting Pro.
      const verifyProPayment = async (reference) => {
        const pendingKey = 'nf_pending_ref';
        const fail = (detail) => {
          try { localStorage.setItem(pendingKey, reference); } catch(_) {}
          nfNotify('Payment received but not confirmed yet. ' + detail + ' Reference: ' + reference + '. Tap Retry, or contact support with this reference.', {
            type: 'error', sticky: true, actionLabel: 'Retry', onAction: () => verifyProPayment(reference),
          });
        };
        try {
          let token = session?.access_token;
          try { const { data: cur } = await sb.auth.getSession(); token = cur?.session?.access_token || token; } catch(_) {}
          const res = await fetch(SUPABASE_URL + '/functions/v1/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ reference, plan: 'pro' }),
          });
          let data = {};
          try { data = await res.json(); } catch(_) {}
          if (res.ok && data.success) {
            try { localStorage.removeItem(pendingKey); } catch(_) {}
            setIsPro(true);
            nfNotify('Payment confirmed. Pro is now active.', { type: 'success' });
          } else {
            console.error('[verify-payment]', res.status, data);
            fail(data && data.error ? String(data.error) + '.' : 'Verification did not succeed.');
          }
        } catch(e) {
          console.error('[verify-payment]', e);
          fail('Network error during verification.');
        }
      };

      const handleProPayment = () => {
        if (!user) { setShowAuth(true); return; }
        const PAYSTACK_KEY = paystackKey || 'pk_live_dfa71eca29f942cadc337cb8e41834857e2b129b';
        setPaystackLoading(true);
        loadPaystackScript().then(() => {
          const handler = PaystackPop.setup({
            key: PAYSTACK_KEY,
            email: user.email,
            amount: proPrice,
            currency: 'NGN',
            ref: 'nf_pro_' + Date.now() + '_' + user.id.slice(0, 8),
            metadata: { user_id: user.id, plan: 'pro' },
            onSuccess: async (transaction) => {
              setPaystackLoading(false);
              await verifyProPayment(transaction.reference);
            },
            onCancel: () => { setPaystackLoading(false); },
          });
          handler.openIframe();
        }).catch(() => {
          setPaystackLoading(false);
          nfNotify('Could not load the payment system. Check your connection and try again.', { type: 'error' });
        });
      };

      const levelColors = { Foundation:C.cyan, Intermediate:'#E2BE78', Advanced:'#C4A050', Mastery:'#7AAFCF', Reference:'#4CF7C0' };

      if (activeLesson) {
        const lesson = LESSONS.find(l=>l.id===activeLesson);
        const content = LESSON_CONTENT[activeLesson];
        const pageData = content.pages[page];
        const isLast = page === content.pages.length-1;
        const col = levelColors[lesson.level] || C.cyan;

        const handleComplete = () => {
          const updated = {...lessonProgress, [activeLesson]:100};
          setLessonProgress(updated);
          if (user) upsertLessonProgress(user.id, activeLesson, 100);
          setActiveLesson(null);
          setPage(0);
        };

        return (
          React.createElement("div", {style: { paddingTop:80, paddingBottom:60, minHeight:'100vh' }}, React.createElement("div", {style: { maxWidth:760, margin:'0 auto', padding:'40px 24px' }}, React.createElement("div", {style: { display:'flex', alignItems:'center', gap:16, marginBottom:32 }}, React.createElement("button", {className: "btn-ghost", onClick: ()=>{ setActiveLesson(null); setPage(0); }}, '← Manuals'), React.createElement("div", {style: { flex:1, height:1, background:C.border }}), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, page+1, '/', content.pages.length)), React.createElement("div", {style: { height:2, background:C.panel, borderRadius:2, marginBottom:20, overflow:'hidden' }}, React.createElement("div", {style: { width:`${((page+1)/content.pages.length)*100}%`, height:'100%', background:col, borderRadius:2, transition:'width 0.4s ease' }})), React.createElement("div", {key: `${activeLesson}-${page}`, style: { animation:'fadeUp 0.4s ease both' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:col, marginBottom:12 }}, 'Lesson', activeLesson, '·', lesson.level.toUpperCase()), React.createElement("h1", {style: { ...syne, fontSize:15, fontWeight:800, color:C.text, marginBottom:32, lineHeight:1.1, overflowWrap:'break-word', minWidth:0}}, pageData.title), React.createElement("div", {className: "card", style: { padding:'32px 36px', position:'relative', overflow:'hidden' }}, React.createElement("div", {style: { position:'absolute', top:0, left:0, width:2, height:'100%', background:col }}), pageData.body.split('\n\n').map((para,i)=>(
                    React.createElement("p", {key: i, style: { fontSize:15, color:para.startsWith('◰')||para.startsWith('◱')||para.startsWith('◲')||para.startsWith('◳')||para.startsWith('1.')||para.startsWith('·') ? C.text : C.muted,
                      lineHeight:1.9, marginBottom:i<pageData.body.split('\n\n').length-1?20:0,
                      fontFamily: para.startsWith('◰')||para.startsWith('◱')||para.startsWith('◲')||para.startsWith('◳') ? "'Space Mono'" : "'DM Sans'",
                      fontSize: para.startsWith('◰')||para.startsWith('◱')||para.startsWith('◲')||para.startsWith('◳') ? 13 : 15,
                      whiteSpace:'pre-line', overflowWrap:'break-word',
                    }}, para)
                  ))), React.createElement("div", {style: { display:'flex', justifyContent:'space-between', marginTop:32, alignItems:'center' }}, React.createElement("button", {className: "btn-ghost", disabled: page===0, onClick: ()=>setPage(p=>p-1), style: { opacity:page===0?0.3:1 }}, '← Previous'), isLast ? (
                    React.createElement("button", {className: "btn-primary", style: { background:col }, onClick: handleComplete}, 'Complete ✓')
                  ) : (
                    React.createElement("button", {className: "btn-primary", style: { background:col }, onClick: ()=>setPage(p=>p+1)}, 'Continue →')
                  )))))
        );
      }

      // ── Section 6: All lessons: categorize real lessons only,
      // never rename or fabricate. A lesson lands in the first category it
      // matches; nothing is duplicated or invented. ──
      const ACADEMY_CATEGORIES = [
        { name: 'Foundations', match: l => l.level === 'Foundation' },
        { name: 'Analytical Thinking', match: l => l.brain === 'analytical' },
        { name: 'Intuitive Thinking', match: l => l.brain === 'intuitive' },
        { name: 'Associative Thinking', match: l => l.brain === 'associative' },
        { name: 'Reflective Thinking', match: l => l.brain === 'reflective' },
        { name: 'Reference & Certification', match: l => l.level === 'Reference' },
      ];
      const assigned = new Set();
      const categorized = ACADEMY_CATEGORIES.map(cat => {
        const items = LESSONS.filter(l => !assigned.has(l.id) && cat.match(l));
        items.forEach(l => assigned.add(l.id));
        return { ...cat, items };
      }).filter(cat => cat.items.length > 0);

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:100, background:CP.bg }},
          React.createElement("div", {style: { maxWidth:1200, margin:'0 auto', padding:'40px 24px' }},

            React.createElement(AcademyHome, { setView, user, setShowAuth, cfiResult, cfiHistory, lessonProgress, isPro,
              onStartLesson: (id) => { const l = LESSONS.find(x=>x.id===id); if (l && (l.free || isPro)) { setActiveLesson(id); setPage(0); } },
              onUpgrade: handleProPayment }),

            React.createElement(CPEyebrow, null, 'All lessons'),
            React.createElement("h2", {style: { ...syne, fontSize:'clamp(18px,4vw,24px)', fontWeight:800, color:CP.ink, marginBottom:16, lineHeight:1.15 }}, 'Your lessons'),
            React.createElement("p", {style: { fontSize:14, color:CP.muted, maxWidth:560, lineHeight:1.8, marginBottom:40 }}, 'Short lessons you can read at your own pace.'),

            categorized.map(cat => (
              React.createElement("div", {key: cat.name, style: { marginBottom:36 }},
                React.createElement("div", {style: { ...mono, fontSize:10.5, letterSpacing:1, color:CP.goldDeep, marginBottom:14, textTransform:'uppercase' }}, cat.name),
                React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:14 }}, cat.items.map((lesson) => {
                  const col = levelColors[lesson.level] || CP.gold;
                  const prog = lessonProgress[lesson.id] || 0;
                  const isLocked = !lesson.free && !isPro;
                  const idx = LESSONS.findIndex(l => l.id === lesson.id);
                  return (
                    React.createElement(CPCard, {key: lesson.id, style: {
                      padding:'24px 26px', position:'relative', overflow:'hidden',
                      opacity: isLocked ? 0.65 : 1, cursor: isLocked ? 'default' : 'pointer',
                    }, onClick: ()=>{ if(!isLocked){ setActiveLesson(lesson.id); setPage(0); } }},
                      React.createElement("div", {style: { position:'absolute', top:0, left:0, width:3, height:'100%', background:prog===100?'#3E7CA6':prog>0?col:CP.border }}),
                      React.createElement("div", {style: { display:'grid', gridTemplateColumns:'auto 1fr auto', gap:20, alignItems:'center' }},
                        React.createElement("div", {style: { ...syne, fontSize:13, fontWeight:800, color:CP.faint }}, String(idx+1).padStart(2,'0')),
                        React.createElement("div", null,
                          React.createElement("div", {style: { display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }},
                            React.createElement("div", {style: { ...mono, fontSize:10, letterSpacing:1, color:col, padding:'3px 8px', border:`1px solid ${col}55`, borderRadius:2 }}, lesson.level.toUpperCase()),
                            React.createElement("div", {style: { ...mono, fontSize:10, letterSpacing:1, color:CP.muted, padding:'3px 8px', border:`1px solid ${CP.border}`, borderRadius:2 }}, lesson.duration.toUpperCase()),
                            lesson.free && React.createElement("div", {style: { ...mono, fontSize:10, letterSpacing:1, color:'#3E7CA6', padding:'3px 8px', border:'1px solid #3E7CA655', borderRadius:2 }}, 'Free'),
                            isLocked && React.createElement("div", {style: { ...mono, fontSize:10, letterSpacing:1, color:'#C24545', padding:'3px 8px', border:'1px solid #C2454555', borderRadius:2 }}, 'Pro required'),
                            prog===100 && React.createElement("div", {style: { ...mono, fontSize:10, letterSpacing:1, color:'#3E7CA6', padding:'3px 8px', border:'1px solid #3E7CA655', borderRadius:2 }}, '✓ Complete')
                          ),
                          React.createElement("div", {style: { ...syne, fontSize:13.5, fontWeight:700, color:CP.ink, marginBottom:6 }}, lesson.title),
                          React.createElement("div", {style: { fontSize:12.5, color:CP.muted }}, lesson.sub)
                        ),
                        React.createElement("div", {style: { ...mono, fontSize:14, color:CP.faint }}, isLocked ? '⊘' : prog===100 ? '✓' : '→')
                      ),
                      prog>0 && prog<100 && React.createElement("div", {style: { marginTop:14, height:4, background:CP.goldTint, borderRadius:2, overflow:'hidden' }},
                        React.createElement("div", {style: { width:`${prog}%`, height:'100%', background:col, borderRadius:2 }}))
                    )
                  );
                }))
              )
            )),

            !isPro && React.createElement(CPCard, {style: { marginTop:24, padding:'40px', textAlign:'center' }},
              React.createElement(CPEyebrow, null, 'Unlock all lessons'),
              React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:800, color:CP.ink, marginBottom:8 }}, 'Pro access'),
              React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:CP.goldDeep, marginBottom:2 }}, `₦${(proPrice/100).toLocaleString()}`),
              React.createElement("div", {style: { fontSize:12, color:CP.faint, marginBottom:16 }}, usdApprox(proPrice), ' · billed in Naira'),
              React.createElement("div", {style: { fontSize:14, color:CP.muted, marginBottom:32, maxWidth:400, margin:'0 auto 32px' }}, 'One-time payment. Unlocks Lessons 2 to 6.'),
              React.createElement(CPButton, {onClick: handleProPayment, style: paystackLoading ? { opacity:0.6, pointerEvents:'none' } : {}}, paystackLoading ? 'Opening...' : `Upgrade to Pro: ₦${(proPrice/100).toLocaleString()} →`)
            ),
            React.createElement(CPCard, {style: { marginTop:20, padding:'40px', textAlign:'center', borderColor:'#3E7CA655', background:'#F5F9FB' }},
              React.createElement(CPEyebrow, {color: '#3E7CA6'}, 'NeuralFusion for Teams'),
              React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:800, color:CP.ink, marginBottom:8 }}, 'Train your whole team together'),
              React.createElement("div", {style: { fontSize:14, color:CP.muted, marginBottom:32, maxWidth:480, margin:'0 auto 32px', lineHeight:1.8 }}, 'Create a team · share one link · CFI assessment · 5-lesson programme · team results'),
              React.createElement("button", {type:'button', onClick: () => setView('teams'), style: {
                display:'inline-block', textAlign:'center',
                ...syne, fontSize:14, fontWeight:700, letterSpacing:'0.02em',
                padding:'14px 32px', background:'#3E7CA6', color:'#FFFFFF',
                border:'1px solid #3E7CA6', cursor:'pointer', borderRadius:2,
              }}, 'Create a team →')
            )
          )
        )
      );
    }
    // ═══════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════
    //  LEGAL VIEW: Privacy, Terms & Data Protection
    // ═══════════════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════════════
    //  RESOURCES VIEW
    // ═══════════════════════════════════════════════════════════════════

    function LegalView({ setView }) {
      const [tab, setTab] = React.useState('privacy');

      const tabStyle = (id) => ({
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '10px 20px',
        fontFamily: "'Space Mono', monospace",
        fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
        color: tab === id ? C.cyan : C.muted,
        borderBottom: tab === id ? `1px solid ${C.cyan}` : '1px solid transparent',
        transition: 'color 0.2s, border-color 0.2s',
      });

      const Section = ({ num, title, children }) => (
        React.createElement("div", {style: { marginBottom: 48, paddingBottom: 48, borderBottom: `1px solid ${C.border}` }}, React.createElement("div", {style: { display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 20 }}, React.createElement("div", {style: { ...mono, fontSize: 9, letterSpacing: 2, color: C.cyan, opacity: 0.6, paddingTop: 5, minWidth: 26 }}, num), React.createElement("div", {style: { ...syne, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.2 }}, title)), React.createElement("div", {style: { paddingLeft: 44 }}, children))
      );

      const P = ({ children }) => (
        React.createElement("p", {style: { fontSize: 14, color: C.muted, lineHeight: 1.85, marginBottom: 14 }}, children)
      );

      const UL = ({ items }) => (
        React.createElement("ul", {style: { listStyle: 'none', padding: 0, margin: '0 0 14px' }}, items.map((item, i) => (
            React.createElement("li", {key: i, style: { position: 'relative', paddingLeft: 18, fontSize: 14, color: C.muted, marginBottom: 8, lineHeight: 1.7 }}, React.createElement("span", {style: { position: 'absolute', left: 0, top: 6, width: 6, height: 1, background: C.cyan, opacity: 0.5 }}), item)
          )))
      );

      const HB = ({ title: t, children }) => (
        React.createElement("div", {style: { background: 'rgba(196,160,80,0.06)', border: `1px solid rgba(196,160,80,0.18)`, borderLeft: `3px solid ${C.cyan}`, padding: '18px 22px', margin: '20px 0', fontSize: 14, color: C.muted, lineHeight: 1.8 }}, t && React.createElement("div", {style: { ...syne, fontSize: 12, fontWeight: 700, color: C.cyan, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}, t), children)
      );

      const DataTable = ({ rows }) => (
        React.createElement("div", {style: { overflowX: 'auto', margin: '20px 0' }}, React.createElement("table", {style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }}, React.createElement("thead", null, React.createElement("tr", null, ['Data category','Purpose','Legal basis'].map(h => (
                  React.createElement("th", {key: h, style: { ...mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, padding: '10px 14px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, background: C.deep }}, h)
                )))), React.createElement("tbody", null, rows.map((r,i) => (
                React.createElement("tr", {key: i, style: { borderBottom: `1px solid rgba(196,160,80,0.06)` }}, React.createElement("td", {style: { padding: '12px 14px', color: C.cyan, fontWeight: 600, fontSize: 13, verticalAlign: 'top' }}, r[0]), React.createElement("td", {style: { padding: '12px 14px', color: C.muted, fontSize: 13, verticalAlign: 'top', lineHeight: 1.6 }}, r[1]), React.createElement("td", {style: { padding: '12px 14px', color: C.muted, fontSize: 13, verticalAlign: 'top', lineHeight: 1.6 }}, r[2]))
              )))))
      );

      const ContactCard = ({ items }) => (
        React.createElement("div", {style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 20, background: C.deep, border: `1px solid ${C.border}`, padding: 28, margin: '20px 0' }}, items.map((item,i) => (
            React.createElement("div", {key: i}, React.createElement("div", {style: { ...mono, fontSize: 9, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}, item.label), React.createElement("div", {style: { fontSize: 13, color: C.cyan, fontWeight: 500 }}, item.value))
          )))
      );

      const tabs = [
        { id: 'privacy', label: 'Privacy policy' },
        { id: 'terms', label: 'Terms & conditions' },
        { id: 'data', label: 'Data protection' },
      ];

      const PrivacyContent = () => (
        React.createElement("div", null, React.createElement(Section, {num: "01", title: "Who we are"}, React.createElement(P, null, 'NeuralFusion is a thinking-skills platform developed and operated by', React.createElement("strong", {style: {color:C.text}}, 'Life Edet'), ', accessible at tryneuralfusion.com. The platform delivers a structured training programme teaching participants to work across four ways of thinking through a curriculum delivered to individual users and to teams.'), React.createElement(P, null, '"We," "us," and "our" refer to NeuralFusion and its operator. "You" refers to any individual who accesses or uses the platform, including individual subscribers and members of teams.')), React.createElement(Section, {num: "02", title: "Information we collect"}, React.createElement(P, null, 'We collect the following categories of personal information:'), React.createElement(UL, {items: [
              'Account Information: Name, email address, and password when you register.',
              'Test data: your answers, your scores across five areas of thinking, and your overall score.',
              'Learning Progress: Lesson completion records, module progress, and programme milestone data.',
              'Team data: team membership and role, whether you have completed each step, and test results linked to a team (shown to team owners only as aggregates).',
              'Payment Information: Transaction records processed through Paystack. Full card details are not stored on our systems.',
              'Usage Data: IP address, browser type, device type, pages visited, and session data collected automatically.',
            ]})), React.createElement(Section, {num: "03", title: "How we use your information"}, React.createElement(UL, {items: [
              'To create and manage your account and provide access to the platform.',
              'To deliver the lessons and track your progress.',
              'To create your result and give you personalised insights from the test.',
              'To provide team features, enabling team owners to see completion status and aggregate team results.',
              'To process payments and manage subscription access.',
              'To send transactional and, where consented, promotional communications.',
              'To improve the platform through analysis of aggregated, anonymised usage data.',
              'To comply with legal obligations.',
            ]})), React.createElement(Section, {num: "04", title: "Legal bases for processing"}, React.createElement(UL, {items: [
              'Contract performance: Processing necessary to deliver the platform services you have engaged.',
              'Legitimate interests: Platform security, fraud prevention, and service improvement where these do not override your rights.',
              'Consent: For marketing communications and any processing where we have sought your explicit consent.',
              'Legal obligation: Compliance with applicable Nigerian law and regulatory requirements.',
            ]})), React.createElement(Section, {num: "05", title: "Sharing your information"}, React.createElement(P, null, 'We do not sell your personal information. We may share data only in these circumstances:'), React.createElement(UL, {items: [
              'Service Providers: Supabase (database/authentication) and Paystack (payment processing), each bound to use your data only to deliver their services.',
              'Team owners: if you join a team, its owner can see whether you completed each step and aggregate team results. Your individual answers and score are not shown to them.',
              'Legal Requirements: Where required by law, court order, or government authority.',
              'Business Transfers: In the event of a merger or acquisition, subject to equivalent privacy protections.',
            ]}), React.createElement(HB, {title: "Team Members"}, 'Your team owner sees whether you completed each step, and aggregate team results once enough people have completed the assessment. They do not see your individual answers or score. If you have concerns, please contact your team owner before joining.')), React.createElement(Section, {num: "06", title: "Data storage & security"}, React.createElement(P, null, 'Your data is stored on Supabase infrastructure. We implement appropriate technical and organisational measures including TLS/HTTPS encryption in transit, row-level security and access control policies, and secure session management via Supabase Auth.'), React.createElement(P, null, 'We retain your personal data for as long as your account is active or as necessary to fulfil the purposes described here, and thereafter as required by applicable law.')), React.createElement(Section, {num: "07", title: "Your rights"}, React.createElement(P, null, 'Under the Nigeria Data Protection Act 2023, you have the right of access, rectification, erasure, restriction, data portability, and the right to object to certain processing. To exercise any right, contact us at the details below. We will respond within 30 days.')), React.createElement(Section, {num: "08", title: "Children's privacy"}, React.createElement(P, null, 'NeuralFusion is designed for professional and organisational use and is not directed at children under 13. We do not knowingly collect personal information from children.')), React.createElement(Section, {num: "09", title: "Changes & contact"}, React.createElement(P, null, 'We may update this policy from time to time. Continued use after changes constitutes acceptance. For privacy queries, contact us:'), React.createElement(ContactCard, {items: [
              { label: 'Platform', value: 'NeuralFusion' },
              { label: 'Operator', value: 'Life Edet' },
              { label: 'Website', value: 'tryneuralfusion.com' },
              { label: 'Subject Line', value: 'Privacy Request: NeuralFusion' },
            ]})))
      );

      const TermsContent = () => (
        React.createElement("div", null, React.createElement(Section, {num: "01", title: "Acceptance of terms"}, React.createElement(P, null, 'By accessing or using the NeuralFusion platform at tryneuralfusion.com, you agree to be bound by these Terms and Conditions. If you do not agree, you must not access or use the platform.'), React.createElement(P, null, 'These Terms constitute a legally binding agreement between you and', React.createElement("strong", {style: {color:C.text}}, 'Life Edet'), ', the developer and operator of NeuralFusion. If using the platform on behalf of an organisation, you represent that you have authority to bind that organisation.')), React.createElement(Section, {num: "02", title: "Description of service"}, React.createElement(P, null, 'NeuralFusion is a thinking-skills platform delivering:'), React.createElement(UL, {items: [
              'A structured 5-lesson, 7-week programme.',
              'The Thinking Clarity Test (CFI) Edition 2.0 assessment.',
              'A personal result across five areas of thinking.',
              'Team features: create a team, share one team link, run the assessment and training programme together, and see aggregate team results.',
            ]})), React.createElement(Section, {num: "03", title: "Account Registration"}, React.createElement(P, null, 'You agree to provide accurate information, maintain the security of your credentials, notify us promptly of any unauthorised access, and accept responsibility for all activity under your account.')), React.createElement(Section, {num: "04", title: "Subscription & Payments"}, React.createElement(P, null, React.createElement("strong", {style: {color:C.text}}, 'Pro Access:'), 'Full access requires payment of the current Pro fee, as displayed on the platform. Payments are processed via Paystack. Pricing may be updated by the platform administrator with reasonable notice.'), React.createElement(P, null, React.createElement("strong", {style: {color:C.text}}, 'Refunds:'), 'Due to the digital nature of platform content, all sales are generally final. Refund requests are considered on a case-by-case basis within 7 days of purchase where the platform has not been substantially accessed.')), React.createElement(Section, {num: "05", title: "Teams"}, React.createElement(P, null, 'Team owners agree to use the platform for legitimate organisational training purposes, share the team link responsibly, and comply with all applicable employment, data protection, and privacy laws when asking people to take assessments.'), React.createElement(HB, {title: "Participant Consent"}, 'Team owners are responsible for obtaining appropriate consent from participants before asking them to take the test and for complying with any applicable workplace data collection obligations in their jurisdiction.')), React.createElement(Section, {num: "06", title: "Permitted Use & Restrictions"}, React.createElement(P, null, 'You must not:'), React.createElement(UL, {items: [
              'Reproduce, distribute, or create derivative works of the platform content without written permission.',
              'Reverse engineer, decompile, or extract the source code of the platform.',
              'Use the platform to train competing AI or machine learning systems.',
              'Share, resell, or sublicense your account access to third parties.',
              'Use automated tools, bots, or scripts to access or interact with the platform.',
              'Use the platform for any unlawful purpose.',
            ]})), React.createElement(Section, {num: "07", title: "Intellectual property"}, React.createElement(P, null, 'All content on the NeuralFusion platform, including the curriculum, CFI assessment, cognitive framework, scoring methodologies, interface design, and software, is the intellectual property of', React.createElement("strong", {style: {color:C.text}}, 'Life Edet'), 'and is protected by Nigerian and international copyright law.'), React.createElement(P, null, 'The NeuralFusion name and logo are trademarks of Life Edet. You may not use these marks without prior written consent.')), React.createElement(Section, {num: "08", title: "Assessment Content & Accuracy"}, React.createElement("div", {style: { background: 'rgba(200,60,60,0.06)', border: '1px solid rgba(200,60,60,0.2)', borderLeft: '3px solid rgba(200,80,80,0.6)', padding: '18px 22px', margin: '0 0 16px', fontSize: 14, color: C.muted, lineHeight: 1.8 }}, React.createElement("div", {style: { ...syne, fontSize: 12, fontWeight: 700, color: 'rgba(240,160,160,0.85)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}, 'Not Clinical or Diagnostic'), 'NeuralFusion assessments are not clinical, psychological, or diagnostic tools. Results should not be used as a basis for medical or clinical evaluation. If you have concerns about your cognitive health, consult a qualified healthcare professional.'), React.createElement(P, null, 'We make no warranty that assessment results are accurate, complete, or suitable for any specific purpose beyond the developmental and training context for which they are designed.')), React.createElement(Section, {num: "09", title: "Disclaimers & Limitation of Liability"}, React.createElement(P, null, 'The platform is provided on an "as is" and "as available" basis. We disclaim all warranties, express or implied. To the maximum extent permitted by Nigerian law, our total aggregate liability shall not exceed the amount paid by you in the 12 months preceding any claim.')), React.createElement(Section, {num: "10", title: "Governing Law, Changes & Contact"}, React.createElement(P, null, 'These Terms are governed by the laws of the', React.createElement("strong", {style: {color:C.text}}, 'Federal Republic of Nigeria'), '. We may modify these Terms from time to time; continued use after changes constitutes acceptance.'), React.createElement(ContactCard, {items: [
              { label: 'Platform', value: 'NeuralFusion' },
              { label: 'Operator', value: 'Life Edet' },
              { label: 'Website', value: 'tryneuralfusion.com' },
              { label: 'Subject Line', value: 'Terms Query: NeuralFusion' },
            ]})))
      );

      const DataContent = () => (
        React.createElement("div", null, React.createElement(Section, {num: "01", title: "Our Commitment"}, React.createElement(P, null, 'NeuralFusion is committed to protecting the personal data of every individual who interacts with the platform. We process personal data lawfully, fairly, and transparently in accordance with the', React.createElement("strong", {style: {color:C.text}}, 'Nigeria Data Protection Act 2023 (NDPA)'), 'and regulations issued by the Nigeria Data Protection Commission (NDPC).'), React.createElement(HB, {title: "Regulatory Framework"}, 'This policy is written in compliance with the NDPA 2023. Where teams and organisations operate across jurisdictions subject to additional frameworks (such as GDPR), this policy is designed to be compatible with those requirements.')), React.createElement(Section, {num: "02", title: "Data controller"}, React.createElement(ContactCard, {items: [
              { label: 'Controller', value: 'Life Edet' },
              { label: 'Trading As', value: 'NeuralFusion' },
              { label: 'Platform', value: 'tryneuralfusion.com' },
              { label: 'Jurisdiction', value: 'Federal Republic of Nigeria' },
            ]})), React.createElement(Section, {num: "03", title: "Data we process"}, React.createElement(DataTable, {rows: [
              ['Name & Email', 'Account creation, authentication, communications', 'Contract performance'],
              ['Test answers', 'Your result and personalised insights', 'Contract performance / Consent'],
              ['Lesson Progress', 'Curriculum delivery and completion tracking', 'Contract performance'],
              ['Team Data', 'Team management and aggregate reporting', 'Contract performance / Legitimate interests'],
              ['Payment Records', 'Transaction processing and fraud prevention', 'Contract performance / Legal obligation'],
              ['Usage & Device Data', 'Platform security, analytics, improvements', 'Legitimate interests'],
            ]})), React.createElement(Section, {num: "04", title: "Data Retention"}, React.createElement(UL, {items: [
              'Active account data: Retained for the lifetime of your account until you request deletion.',
              'Test results: Retained for the duration of your account. Team results are retained for the duration of your account unless otherwise agreed.',
              'Payment records: Retained for 7 years in accordance with Nigerian financial record-keeping obligations.',
              'Usage/log data: Retained for up to 12 months for security and analytics purposes.',
            ]})), React.createElement(Section, {num: "05", title: "Third-Party Processors"}, React.createElement(P, null, 'We engage the following third-party processors, each contracted to process data only on our instruction:'), [
              { name: 'Supabase', role: 'Database & Authentication', desc: 'Provides database infrastructure, authentication, and row-level security. SOC 2 Type II compliant.' },
              { name: 'Paystack', role: 'Payment Processing', desc: 'Processes subscription payments. PCI-DSS compliant and regulated by the Central Bank of Nigeria.' },
              { name: 'Vercel', role: 'Platform Hosting', desc: 'Hosts the web application. May process request metadata (IP addresses, headers) as part of CDN operations.' },
            ].map((p,i) => (
              React.createElement("div", {key: i, style: { background: C.deep, border: `1px solid ${C.border}`, padding: '18px 22px', marginBottom: 10, display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, alignItems: 'start' }}, React.createElement("div", null, React.createElement("div", {style: { ...syne, fontSize: 14, fontWeight: 700, color: C.cyan }}, p.name), React.createElement("div", {style: { ...mono, fontSize: 9, letterSpacing: 1, color: C.muted, marginTop: 3, textTransform: 'uppercase' }}, p.role)), React.createElement("div", {style: { fontSize: 13, color: C.muted, lineHeight: 1.7 }}, p.desc))
            ))), React.createElement(Section, {num: "06", title: "Security Measures"}, React.createElement(UL, {items: [
              'Encryption in transit: All data is encrypted using TLS 1.2 or higher (HTTPS).',
              'Access control: Row-level security policies in Supabase ensure users can only access their own data. Team data is segmented by team.',
              'Authentication: Secure session-based authentication via Supabase Auth with password hashing and token management.',
              'Administrative access: Restricted and subject to strong credential requirements.',
            ]})), React.createElement(Section, {num: "07", title: "Your data rights"}, React.createElement(P, null, 'Under the NDPA 2023, you have the right to be informed, the right of access, rectification, erasure, restriction of processing, data portability, and the right to object to certain processing. To exercise any right, contact us at the details below. We will respond within', React.createElement("strong", {style: {color:C.text}}, '30 days'), '.')), React.createElement(Section, {num: "08", title: "Data Breach Response"}, React.createElement(P, null, 'In the event of a personal data breach, we will assess the breach without undue delay, notify the NDPC within 72 hours where required, notify affected individuals where there is high risk to their rights, and take appropriate remedial action.')), React.createElement(Section, {num: "09", title: "Contact & Complaints"}, React.createElement(P, null, 'For all data protection enquiries or to report a security concern:'), React.createElement(ContactCard, {items: [
              { label: 'Data Controller', value: 'Life Edet / NeuralFusion' },
              { label: 'Website', value: 'tryneuralfusion.com' },
              { label: 'Subject Line', value: 'Data Protection: NeuralFusion' },
              { label: 'Response Time', value: 'Within 30 days' },
            ]}), React.createElement(P, null, 'If unsatisfied with our response, you may lodge a complaint with the', React.createElement("strong", {style: {color:C.text}}, 'Nigeria Data Protection Commission (NDPC)'), 'at ndpc.gov.ng.')))
      );

      return (
        React.createElement("div", {style: { paddingTop: 80, paddingBottom: 120, minHeight: '100vh' }}, React.createElement("div", {style: { maxWidth: 900, margin: '0 auto', padding: '60px 24px 0' }}, React.createElement("div", {style: { marginBottom: 48 }}, React.createElement("div", {style: { ...mono, fontSize: 9, letterSpacing: 4, color: C.cyan, marginBottom: 16, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 12 }}, React.createElement("span", {style: { width: 28, height: 1, background: C.cyan, opacity: 0.5, display: 'inline-block' }}), 'Legal Documentation'), React.createElement("h1", {style: { ...syne, fontSize: 'clamp(16px,1.5vw,20px)', fontWeight: 800, color: C.text, letterSpacing: '-0.04em', lineHeight: 0.96, marginBottom: 16 }}, 'Legal &', React.createElement("span", {style: { color: C.cyan }}, 'Compliance')), React.createElement("p", {style: { fontSize: 14, color: C.muted, maxWidth: 520, lineHeight: 1.8 }}, 'Our commitments to your privacy, the terms governing your use of NeuralFusion, and our data protection practices under the Nigeria Data Protection Act 2023.'), React.createElement("div", {style: { display: 'flex', gap: 32, marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}, [{ label: 'Effective', value: '4 June 2026' }, { label: 'Governing Law', value: 'Nigeria (NDPA 2023)' }, { label: 'Controller', value: 'Life Edet' }].map((m,i) => (
                  React.createElement("div", {key: i}, React.createElement("div", {style: { ...mono, fontSize: 9, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', marginBottom: 3 }}, m.label), React.createElement("div", {style: { fontSize: 13, color: C.cyan, fontWeight: 500 }}, m.value))
                )))), React.createElement("div", {style: { borderBottom: `1px solid ${C.border}`, marginBottom: 48, display: 'flex', gap: 4, overflowX: 'auto' }}, tabs.map(t => (
                React.createElement("button", {key: t.id, style: tabStyle(t.id), onClick: () => setTab(t.id)}, t.label)
              ))), tab === 'privacy' && React.createElement(PrivacyContent, null), tab === 'terms'   && React.createElement(TermsContent, null), tab === 'data'    && React.createElement(DataContent, null)))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  FOOTER
    // ═══════════════════════════════════════════════════════════════════
    function Footer({ setView }) {
      const links = [
        { label:'Home', v:'home' },
        { label:'Take the test', v:'cfi' },
        { label:'Lessons', v:'lessons' },
        { label:'My progress', v:'analytics' },
        { label:'Decisions', v:'decisions' },
        { label:'For Teams', v:'teams' },
      ];
      const legalLinks = [
        { label:'About', href:'/about' },
        { label:'Research', href:'/research' },
        { label:'Methodology', href:'/methodology' },
        { label:'Contact', href:'/contact' },
        { label:'Privacy policy', href:'/privacy' },
        { label:'Terms & conditions', href:'/terms' },
      ];
      const articleLinks = [
        { label:'How to think better', href:'/blog/cognitive-performance-operating-system' },
        { label:'How to think more clearly', href:'/blog/how-to-think-more-clearly' },
        { label:'How to make decisions under pressure', href:'/blog/how-to-make-decisions-under-pressure' },
        { label:'Signs your thinking is scattered', href:'/blog/signs-of-cognitive-fragmentation' },
        { label:'Using AI without losing critical thinking', href:'/blog/how-to-use-ai-without-losing-critical-thinking' },
        { label:'All articles', href:'/blog' },
      ];
      return (
        React.createElement("footer", {className: "nf-footer", style: { borderTop:`1px solid ${C.border}`, padding:'48px 24px 32px', textAlign:'center' }}, React.createElement("div", {style: { maxWidth:1200, margin:'0 auto' }}, React.createElement("div", {style: { display:'flex', alignItems:'center', justifyContent:'center', marginBottom:32 }}, React.createElement(NFLogoLockup, {iconSize: 26, gap: 10, wordmarkColor: C.text})), React.createElement("div", {style: { display:'flex', justifyContent:'center', flexWrap:'wrap', gap:24, marginBottom:20 }}, links.map(l=>(
                React.createElement("button", {key: l.v, onClick: ()=>setView(l.v), style: { background:'none', border:'none', color:C.muted, fontSize:12, cursor:'pointer' }}, l.label)
              ))), React.createElement("div", {style: { marginBottom:12, paddingTop:16, borderTop:`1px solid ${C.border}`, ...mono, fontSize:10, letterSpacing:1, color:C.dim }}, 'LATEST ARTICLES'), React.createElement("div", {style: { display:'flex', justifyContent:'center', flexWrap:'wrap', gap:20, marginBottom:24 }}, articleLinks.map(l=>(
                React.createElement("a", {key: l.href, href: l.href, style: { color:C.muted, fontSize:12, textDecoration:'none' }}, l.label)
              ))), React.createElement("div", {style: { display:'flex', justifyContent:'center', flexWrap:'wrap', gap:20, marginBottom:32, paddingTop:16, borderTop:`1px solid ${C.border}` }}, legalLinks.map(l=>(
                React.createElement("a", {key: l.label, href: l.href, style: { background:'none', border:'none', color:C.dim, fontSize:10, cursor:'pointer', fontFamily:"'Space Mono', monospace", letterSpacing:1, textDecoration:'none' }}, l.label)
              ))), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.dim }}, '© 2026 LIFE EDET · NEURALFUSION · ALL RIGHTS RESERVED')))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  ADMIN PORTAL: Full Platform Management
    // ═══════════════════════════════════════════════════════════════════
    function AdminView({ user, setView, onPriceChange }) {
      // ── Light "CFI assessment" look ───────────────────────────────────
      // Same tokens as the CFI assessment (white surfaces, gold accents, Atkinson Hyperlegible).
      // They shadow the dark globals (C, mono, syne) inside AdminView only.
      const AC = {
        bg: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: '#F9FAFB',
        text: '#111827', muted: '#4B5563', border: '#D1D5DB',
        gold: '#C8A95A', goldDark: '#8A6D2F', goldTint: '#FBF3E3', focus: '#8A6D2F',
        error: '#B91C1C', errorTint: '#FEF2F2', success: '#166534', successTint: '#F0FDF4',
        font: "'Atkinson Hyperlegible', 'Inter', -apple-system, sans-serif",
      };
      const C = { void: AC.bg, deep: AC.surfaceAlt, surface: AC.surface, panel: AC.surfaceAlt, border: AC.border, borderBright: AC.gold,
        cyan: AC.goldDark, cyanBright: AC.goldDark, cyanDim: AC.goldTint, text: AC.text, muted: AC.muted, dim: AC.muted };
      const mono = { fontFamily: AC.font };
      const syne = { fontFamily: AC.font };
      useEffect(() => {
        if (!document.getElementById('nf-a11y-font')) {
          const link = document.createElement('link');
          link.id = 'nf-a11y-font';
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap';
          document.head.appendChild(link);
        }
      }, []);
      const [tab, setTab]           = useState('overview');

      // Data
      const [users,      setUsers]      = useState([]);
      const [cfiData,    setCfiData]    = useState([]);
      const [loading,    setLoading]    = useState(false);
      const [actionMsg,  setActionMsg]  = useState('');
      const [actionType, setActionType] = useState('info'); // info | success | error
      const [lastLoaded, setLastLoaded] = useState(null);

      // Pricing
      const [proPrice,    setProPrice]    = useState(600000);
      const [priceInput,  setPriceInput]  = useState('6000');
      const [priceSaved,  setPriceSaved]  = useState(false);
      const [paystackKeyInput, setPaystackKeyInput] = useState('');
      const [keySaved, setKeySaved] = useState(false);

      // Users search / filter
      const [userSearch, setUserSearch] = useState('');
      const [proFilter,  setProFilter]  = useState('all');

      // CFI filter
      const [cfiFilter, setCfiFilter] = useState('all');

      // Settings toggles


      const showMsg = (msg, type='info') => {
        setActionMsg(msg); setActionType(type);
        setTimeout(() => setActionMsg(''), 4000);
      };

      // Load admin data on mount, access is already gated server-side via profiles.is_admin
      useEffect(() => { loadAdminData(); }, []);

      const loadAdminData = async () => {
        setLoading(true);
        try {
          const [usersRes, cfiRes] = await Promise.all([
            sb.from('profiles').select('*').order('created_at', { ascending: false }),
            sb.from('cfi_results').select('*').order('created_at', { ascending: false }),
          ]);
          // Surface load errors instead of silently showing empty/stale data:
          // a blocked select (e.g. an RLS policy issue) previously failed silently
          // here, making the dashboard look correct while quietly showing nothing.
          if (usersRes.error) { console.error('[ADMIN LOAD ERROR] profiles select failed:', usersRes.error); showMsg('Could not load users: ' + usersRes.error.message, 'error'); }
          if (cfiRes.error)   { console.error('[ADMIN LOAD ERROR] cfi_results select failed:', cfiRes.error);   showMsg('Could not load CFI results: ' + cfiRes.error.message, 'error'); }
          setUsers(usersRes.data || []);
          setCfiData(cfiRes.data || []);
          setLastLoaded(new Date());
          try {
            const { data: s } = await sb.from('platform_settings').select('value').eq('key','pro_price').maybeSingle();
            if (s?.value) { setProPrice(s.value); setPriceInput(String(s.value/100)); }
          } catch(e) { console.error('[admin load pro_price]', e); }
          try {
            const { data: pk } = await sb.from('platform_settings').select('text_value').eq('key','paystack_public_key').maybeSingle();
            if (pk?.text_value) { setPaystackKeyInput(pk.text_value); }
          } catch(e) { console.error('[admin load paystack key]', e); }
        } catch(e) { showMsg('Error loading data: ' + e.message, 'error'); }
        setLoading(false);
      };

      const togglePro = async (uid, current) => {
        const { error } = await sb.from('profiles').update({ is_pro: !current }).eq('id', uid);
        if (!error) {
          setUsers(u => u.map(x => x.id === uid ? {...x, is_pro: !current} : x));
          showMsg(`Pro status ${!current ? 'granted' : 'revoked'}.`, 'success');
        } else { console.error('[togglePro]', error); showMsg('Could not update Pro status: ' + error.message, 'error'); }
      };

      const deleteUser = async (uid) => {
        if (!window.confirm('Delete this user profile? This cannot be undone.')) return;
        const { error } = await sb.from('profiles').delete().eq('id', uid);
        if (!error) { setUsers(u => u.filter(x => x.id !== uid)); showMsg('User deleted.', 'success'); }
        else { console.error('[deleteUser]', error); showMsg('Could not delete user: ' + error.message, 'error'); }
      };

      const savePrice = async () => {
        const raw = parseFloat(priceInput);
        if (isNaN(raw) || raw < 100) { showMsg('Enter a valid price (minimum ₦100).', 'error'); return; }
        const kobo = Math.round(raw * 100);
        const saved = await setPlatformSetting('pro_price', kobo);
        if (!saved.ok) { showMsg('Could not save Pro price: ' + (saved.error?.message || 'unknown error'), 'error'); return; }
        setProPrice(kobo);
        if (onPriceChange) onPriceChange(kobo);
        setPriceSaved(true);
        setTimeout(() => setPriceSaved(false), 3000);
        showMsg('Pro price saved.', 'success');
      };

      const savePaystackKey = async () => {
        const key = paystackKeyInput.trim();
        if (!key.startsWith('pk_')) { showMsg('Invalid Paystack public key. Must start with pk_', 'error'); return; }
        const saved = await setTextSetting('paystack_public_key', key);
        if (!saved.ok) { showMsg('Could not save Paystack key: ' + (saved.error?.message || 'unknown error'), 'error'); return; }
        setKeySaved(true);
        setTimeout(() => setKeySaved(false), 3000);
        showMsg('Paystack key saved.', 'success');
      };

      const deleteCFIResult = async (id) => {
        const { error } = await sb.from('cfi_results').delete().eq('id', id);
        if (!error) { setCfiData(d => d.filter(x => x.id !== id)); showMsg('CFI result deleted.', 'success'); }
        else { console.error('[deleteCFIResult]', error); showMsg('Could not delete CFI result: ' + error.message, 'error'); }
      };

      /* ── LOADING ── */
      if (loading && users.length === 0) return (
        React.createElement("div", {className: "nf-admin", style: { paddingTop:80, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:AC.bg, fontFamily:AC.font }}, React.createElement("div", {style: { textAlign:'center' }}, React.createElement("div", {style: { ...mono, fontSize:16, color:C.cyan, animation:'neuralPulse 2s ease-in-out infinite' }}, '◈'), React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.muted, marginTop:16 }}, 'LOADING ADMIN DATA...')))
      );

      /* ── TABS ── */
      const tabs = [
        { id:'overview',   label:'Overview',    icon:'◈' },
        { id:'users',      label:'Users',        icon:'◱' },
        { id:'cfi',        label:'CFI Results',  icon:'◎' },
        { id:'pro',        label:'Pro Subs',     icon:'★' },
        { id:'organisations', label:'Teams', icon:'⬡' },
        { id:'pricing',    label:'Pricing',      icon:'₦' },
      ];

      const proUsers     = users.filter(u => u.is_pro);
      const filteredUsers = users.filter(u => {
        const matchSearch = !userSearch || (u.full_name||'').toLowerCase().includes(userSearch.toLowerCase()) || (u.email||'').toLowerCase().includes(userSearch.toLowerCase());
        const matchPro = proFilter === 'all' || (proFilter === 'pro' ? u.is_pro : !u.is_pro);
        return matchSearch && matchPro;
      });
      // completedCFI excludes in-progress drafts (status:'in_progress') so counts
      // and band distribution only reflect finished, scored assessments.
      // Historical rows saved before the `status` column existed default to
      // 'completed' (see migration notes), so they're included here too.
      // Treat a row as a real result if it actually has a score, not only if
      // status says 'completed'. A row can be fully scored client-side but
      // still carry a stale/incorrect status (e.g. a partial write during
      // save), which previously made it vanish from this view entirely
      // even though the data was sitting right there.
      const completedCFI     = cfiData.filter(r => r.status === 'completed' || (r.status !== 'in_progress' && r.total_score != null));
      const uniqueCFIUserIds = new Set(completedCFI.map(r => r.user_id).filter(Boolean));
      // NeuralFusion 100 = count of unique authenticated users with at least one
      // completed CFI assessment, capped for display at the campaign target.
      // Computed dynamically from cfi_results every load, never hard-coded.
      const nf100Count = uniqueCFIUserIds.size;
      const filteredCFI = completedCFI.filter(r => cfiFilter === 'all' || r.band === cfiFilter);
      // IMPORTANT: rows saved before this correction (assessment_version is null/legacy) used a
      // different item set and a ~16–80 raw range: they are NOT on the CFI-1.0 13–65 scale.
      // "Completed CFI assessments" / "Unique CFI participants" above are legitimate headcounts
      // across all versions, but any *scored* aggregate (band distribution, average/median CFI,
      // retest deltas, band movement) must never mix scales, so those are scoped to CFI-1.0 only.
      const cfiV1 = completedCFI.filter(r => r.assessment_version === CFI_VERSION);
      const legacyCFICount = completedCFI.length - cfiV1.length;
      const bandCounts  = cfiV1.reduce((a,r) => { a[r.band] = (a[r.band]||0)+1; return a; }, {});
      const bandColors  = { 'Integrated':AC.success,'Moderate fragmentation':AC.goldDark,'High fragmentation':'#B45309','Critical fragmentation':AC.error };
      const msgColor = actionType === 'success' ? AC.success : actionType === 'error' ? AC.error : AC.goldDark;

      // ── Longitudinal admin stats (avg/median CFI, retest outcomes, band movement) ──
      // Uses only completed CFI-1.0 rows with a real total_score. Participants with
      // multiple assessments are counted once each in "retested"; every row after their
      // first counts toward improved/no-change/worsened by comparing score_change (falls
      // back to a direct diff against the row's own previous_assessment_id if unset).
      const scores = cfiV1.map(r => r.total_score).filter(v => v != null).sort((a,b)=>a-b);
      const avgCFI = scores.length ? Math.round((scores.reduce((a,b)=>a+b,0)/scores.length)*10)/10 : null;
      const medianCFI = scores.length ? (scores.length % 2 ? scores[(scores.length-1)/2] : Math.round(((scores[scores.length/2-1]+scores[scores.length/2])/2)*10)/10) : null;
      const byUser = {};
      cfiV1.forEach(r => { (byUser[r.user_id] = byUser[r.user_id] || []).push(r); });
      const retestedUserIds = Object.keys(byUser).filter(uid => byUser[uid].length > 1);
      let improved = 0, noChange = 0, worsened = 0, changeSum = 0, changeCount = 0;
      let bandImproved = 0, bandWorsened = 0, bandSame = 0;
      const bandRank = { 'Integrated':0, 'Moderate fragmentation':1, 'High fragmentation':2, 'Critical fragmentation':3 };
      Object.values(byUser).forEach(rows => {
        const sorted = [...rows].sort((a,b)=> new Date(a.created_at) - new Date(b.created_at));
        for (let i=1; i<sorted.length; i++) {
          const change = sorted[i].score_change != null ? sorted[i].score_change : (sorted[i].total_score - sorted[i-1].total_score);
          if (change < 0) improved++; else if (change > 0) worsened++; else noChange++;
          changeSum += change; changeCount++;
          const r0 = bandRank[sorted[i-1].band], r1 = bandRank[sorted[i].band];
          if (r0 != null && r1 != null) { if (r1 < r0) bandImproved++; else if (r1 > r0) bandWorsened++; else bandSame++; }
        }
      });
      const avgChangeRetested = changeCount ? Math.round((changeSum/changeCount)*10)/10 : null;

      return (
        React.createElement("div", {className: "nf-admin", style: { paddingTop:80, paddingBottom:60, minHeight:'100vh', background:AC.bg, color:AC.text, fontFamily:AC.font }}, React.createElement("div", {style: { maxWidth:1280, margin:'0 auto', padding:'32px 24px' }}, React.createElement("div", {style: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:32 }}, React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.cyan, marginBottom:8 }}, 'ADMIN PORTAL · NEURALFUSION'), React.createElement("div", {style: { ...syne, fontSize:30, fontWeight:800, color:C.text, marginBottom:6, overflowWrap:'break-word', minWidth:0}}, 'Control Dashboard'), React.createElement("div", {style: { fontSize:15, color:C.muted }}, 'Signed in as', React.createElement("span", {style: { color:C.cyan }}, user?.email))), React.createElement("div", {style: { display:'flex', gap:10, alignItems:'center' }}, actionMsg && (
                  React.createElement("div", {style: { padding:'8px 16px', background:(actionType==='error'?AC.errorTint:actionType==='success'?AC.successTint:AC.goldTint), border:`2px solid ${actionType==='error'?AC.error:actionType==='success'?AC.success:AC.goldDark}`, borderRadius:8, ...mono, fontSize:13, color:msgColor }}, actionMsg)
                ), React.createElement("button", {className: "btn-outline", style: { fontSize:13 }, onClick: loadAdminData}, '↺ Refresh'), React.createElement("button", {className: "btn-ghost", style: { fontSize:13 }, onClick: () => setView('home')}, '← Exit Admin'))), React.createElement("div", {style: { display:'flex', gap:4, marginBottom:32, background:C.deep, padding:4, borderRadius:12, flexWrap:'wrap', border:`1px solid ${AC.border}` }}, tabs.map(t => (
                React.createElement("button", {key: t.id, onClick: () => setTab(t.id), style: {
                  flex:'1 1 auto', padding:'12px 16px', minHeight:48, fontWeight:700,
                  background: tab===t.id ? C.surface : 'transparent',
                  border: tab===t.id ? `1px solid ${C.borderBright}` : '1px solid transparent',
                  color: tab===t.id ? C.cyan : C.muted,
                  ...mono, fontSize:12, letterSpacing:'0.04em', cursor:'pointer', borderRadius:8,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  transition:'all 0.2s',
                }}, React.createElement("span", null, t.icon), React.createElement("span", null, t.label.toUpperCase()))
              ))), loading && (
              React.createElement("div", {style: { textAlign:'center', padding:'60px', color:C.muted }}, React.createElement("div", {style: { ...mono, fontSize:18, color:C.cyan, animation:'neuralPulse 2s ease-in-out infinite' }}, '◈'), React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', marginTop:16 }}, 'LOADING DATA...'))
            ), !loading && (
              React.createElement(React.Fragment, null, tab === 'overview' && (
                  React.createElement("div", {style: { display:'flex', justifyContent:'flex-end', alignItems:'center', gap:10, marginBottom:12 }},
                    React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.dim }},
                      lastLoaded ? `Last refreshed ${lastLoaded.toLocaleTimeString()}` : ''
                    ),
                    React.createElement("button", {className:"btn-outline", style:{ fontSize:13, padding:'6px 12px' }, onClick: loadAdminData}, '↺ Refresh')
                  ),
                  React.createElement("div", {className: "card bento-shimmer", style: { padding:'24px 28px', marginBottom:20, borderColor:'#C8A95A' }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}, React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:AC.goldDark, marginBottom:8 }}, 'NEURALFUSION 100 · unique authenticated participants'), React.createElement("div", {style: { ...syne, fontSize:32, fontWeight:800, color:AC.goldDark }}, nf100Count, ' / 100')), React.createElement("div", {style: { textAlign:'right' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.muted, marginBottom:4 }}, 'Completed assessments'), React.createElement("div", {style: { ...syne, fontSize:16, fontWeight:700, color:C.text }}, completedCFI.length), React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.muted, marginTop:8, marginBottom:4 }}, 'Total attempts (incl. drafts)'), React.createElement("div", {style: { ...syne, fontSize:16, fontWeight:700, color:C.muted }}, cfiData.length)))), React.createElement("div", null, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(180px,100%),1fr))', gap:16, marginBottom:32 }}, [
                        { label:'Total users',       value:users.length,         color:AC.goldDark, icon:'◱' },
                        { label:'PRO subscribers',   value:proUsers.length,       color:AC.goldDark, icon:'★' },
                        { label:'Unique CFI participants', value:uniqueCFIUserIds.size, color:AC.goldDark, icon:'◈' },
                        { label:'Completed CFI assessments', value:completedCFI.length, color:AC.success, icon:'◇' },
                        { label:'FREE users',        value:users.filter(u=>!u.is_pro).length, color:AC.muted, icon:'◰' },
                      ].map((s,i) => (
                        React.createElement("div", {key: i, className: "card bento-shimmer", style: { padding:'24px 20px' }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:AC.muted }}, s.label), React.createElement("div", {style: { ...mono, fontSize:16, color:s.color }}, s.icon)), React.createElement("div", {style: { ...syne, fontSize:16, fontWeight:800, color:s.color, lineHeight:1.2, letterSpacing:'-0.02em', overflowWrap:'break-word', minWidth:0}}, s.value))
                      ))), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(320px,100%),1fr))', gap:24, marginBottom:24 }}, React.createElement("div", {className: "card", style: { padding:'28px' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.cyan, marginBottom:20 }}, 'CFI band distribution'), Object.keys(bandColors).map(band => {
                          const count = bandCounts[band] || 0;
                          const pct   = cfiV1.length ? Math.round(count/cfiV1.length*100) : 0;
                          return (
                            React.createElement("div", {key: band, style: { marginBottom:16 }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', marginBottom:6 }}, React.createElement("div", {style: { fontSize:14, color:C.muted }}, band), React.createElement("div", {style: { ...mono, fontSize:13, color:bandColors[band] }}, count, '(', pct, '%)')), React.createElement("div", {style: { height:10, background:AC.surfaceAlt, border:`1px solid ${AC.border}`, borderRadius:6, overflow:'hidden' }}, React.createElement("div", {style: { width:`${pct}%`, height:'100%', background:bandColors[band], borderRadius:6, transition:'width 0.8s ease' }})))
                          );
                        }), cfiV1.length === 0 && React.createElement("div", {style: { color:C.dim, fontSize:15 }}, 'No CFI-1.0 data yet.'), legacyCFICount > 0 && React.createElement("div", {style: { marginTop:12, ...mono, fontSize:13, color:C.dim }}, legacyCFICount, ' legacy (pre-correction) assessment(s) excluded: different scale, not shown here.')), React.createElement("div", {className: "card", style: { padding:'28px' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.cyan, marginBottom:20 }}, 'Retest outcomes · CFI-1.0'), [
                          { label:'Average CFI', value: avgCFI ?? '-' },
                          { label:'Median CFI', value: medianCFI ?? '-' },
                          { label:'Participants with multiple assessments', value: retestedUserIds.length },
                          { label:'Average change among retested', value: avgChangeRetested != null ? (avgChangeRetested>0?'+':'')+avgChangeRetested : '-' },
                          { label:'Improved (lower CFI)', value: improved, color:AC.success },
                          { label:'No change', value: noChange, color:C.muted },
                          { label:'Worsened (higher CFI)', value: worsened, color:AC.error },
                          { label:'Band improved', value: bandImproved, color:AC.success },
                          { label:'Band unchanged', value: bandSame, color:C.muted },
                          { label:'Band worsened', value: bandWorsened, color:AC.error },
                        ].map((s,i) => (
                          React.createElement("div", {key: i, style: { display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom: i<9?`1px solid ${C.border}`:'none' }}, React.createElement("div", {style: { fontSize:14, color:C.muted }}, s.label), React.createElement("div", {style: { ...mono, fontSize:14, color: s.color || C.text }}, s.value))
                        ))), React.createElement("div", {className: "card", style: { padding:'28px' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.cyan, marginBottom:20 }}, 'Recent signups'), users.slice(0,8).map((u,i) => (
                          React.createElement("div", {key: u.id, style: { display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}, React.createElement("div", {style: {
                              width:32, height:32, borderRadius:'50%',
                              background:AC.goldTint,
                              border:`1px solid ${C.border}`,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              ...mono, fontSize:13, color:C.cyan, flexShrink:0,
                            }}, (u.full_name||u.email||'?')[0].toUpperCase()), React.createElement("div", {style: { flex:1, minWidth:0 }}, React.createElement("div", {style: { fontSize:15, color:C.text, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, u.full_name || 'Unnamed'), React.createElement("div", {style: { ...mono, fontSize:12, color:C.muted, letterSpacing:'0.04em' }}, u.email || u.id?.slice(0,12))), u.is_pro && React.createElement("div", {style: { ...mono, fontSize:12, color:AC.goldDark, background:'#FBF3E3', border:'1px solid #C8A95A', padding:'4px 10px', borderRadius:100 }}, 'Pro'))
                        )), users.length === 0 && React.createElement("div", {style: { color:C.dim, fontSize:15 }}, 'No users yet.')), React.createElement("div", {className: "card", style: { padding:'28px' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.cyan, marginBottom:20 }}, 'Quick actions'), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:10 }}, [
                            { label:'Manage Users', desc:'Grant or revoke Pro', tab:'users', icon:'◱' },
                            { label:'View CFI Results', desc:'Filter and delete assessments', tab:'cfi', icon:'◎' },
                            { label:'Teams', desc:'Seats, on/off and report threshold', tab:'organisations', icon:'⬡' },
                            { label:'Edit Pricing', desc:'Pro price and Paystack key', tab:'pricing', icon:'₦' },
                          ].map((a,i) => (
                            React.createElement("button", {key: i, onClick: () => setTab(a.tab), style: {
                              display:'flex', alignItems:'center', gap:12,
                              padding:'12px 14px', background:C.deep,
                              border:`1px solid ${C.border}`, borderRadius:8,
                              cursor:'pointer', textAlign:'left', transition:'border-color 0.2s',
                            }, onMouseEnter: e => e.currentTarget.style.borderColor=C.borderBright, onMouseLeave: e => e.currentTarget.style.borderColor=C.border}, React.createElement("span", {style: { ...mono, fontSize:16, color:C.cyan }}, a.icon), React.createElement("div", null, React.createElement("div", {style: { fontSize:15, color:C.text, fontWeight:500 }}, a.label), React.createElement("div", {style: { ...mono, fontSize:12, color:C.muted, letterSpacing:'0.04em' }}, a.desc)))
                          )))), React.createElement("div", {className: "card", style: { padding:'28px', borderColor:'#C8A95A' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.cyan, marginBottom:20 }}, 'Revenue snapshot'), [
                          { label:'Pro Price', value:`₦${(proPrice/100).toLocaleString()}`, color:C.cyan },
                          { label:'Est. Pro Revenue', value:`₦${((proUsers.length * proPrice)/100).toLocaleString()}`, color:AC.goldDark },
                          { label:'Pro Conversion', value:`${users.length ? Math.round(proUsers.length/users.length*100) : 0}%`, color:AC.goldDark },
                        ].map((r,i) => (
                          React.createElement("div", {key: i, style: { display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}, React.createElement("div", {style: { ...mono, fontSize:12, color:C.muted, letterSpacing:'0.04em' }}, r.label.toUpperCase()), React.createElement("div", {style: { ...syne, fontSize:16, fontWeight:700, color:r.color, overflowWrap:'break-word', minWidth:0}}, r.value))
                        )), React.createElement("button", {className: "btn-outline", style: { fontSize:13, marginTop:16 }, onClick: () => setTab('pricing')}, 'Edit Pricing →'))))
                ), tab === 'users' && (
                  React.createElement("div", null, React.createElement("div", {style: { display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}, React.createElement("input", {value: userSearch, onChange: e => setUserSearch(e.target.value), placeholder: "Search by name or email...", style: { flex:1, minWidth:200, fontSize:15 }}), React.createElement("div", {style: { display:'flex', gap:4, background:C.deep, padding:4, borderRadius:8 }}, ['all','pro','free'].map(f => (
                          React.createElement("button", {key: f, onClick: () => setProFilter(f), style: {
                            padding:'8px 14px', background:proFilter===f?C.surface:'transparent',
                            border:proFilter===f?`1px solid ${C.borderBright}`:'1px solid transparent',
                            color:proFilter===f?C.cyan:C.muted,
                            ...mono, fontSize:12, letterSpacing:'0.04em', cursor:'pointer', borderRadius:8,
                          }}, f)
                        ))), React.createElement("div", {style: { ...mono, fontSize:12, color:C.muted, letterSpacing:'0.04em' }}, filteredUsers.length, 'USERS')), React.createElement("div", {className: "card", style: { overflow:'hidden' }}, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'1fr 1.5fr 80px 110px 200px', gap:12, padding:'14px 20px', borderBottom:`1px solid ${C.border}`, background:C.deep }}, ['NAME','EMAIL','Pro','JOINED','ACTIONS'].map(h => (
                          React.createElement("div", {key: h, style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.muted }}, h)
                        ))), React.createElement("div", {style: { maxHeight:560, overflowY:'auto' }}, filteredUsers.length === 0 && (
                          React.createElement("div", {style: { padding:'40px', textAlign:'center', color:C.dim, fontSize:15 }}, 'No users match filter.')
                        ), filteredUsers.map((u,i) => (
                          React.createElement("div", {key: u.id, style: {
                            display:'grid', gridTemplateColumns:'1fr 1.5fr 80px 110px 200px', gap:12,
                            padding:'12px 20px', borderBottom:`1px solid ${C.border}`,
                            transition:'background 0.15s',
                          }, onMouseEnter: e => e.currentTarget.style.background=C.deep, onMouseLeave: e => e.currentTarget.style.background='transparent'}, React.createElement("div", {style: { fontSize:14, color:C.text, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, u.full_name || 'N/A'), React.createElement("div", {style: { ...mono, fontSize:12, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, u.email || u.id?.slice(0,16)+'...'), React.createElement("div", null, u.is_pro
                                ? React.createElement("span", {style: { ...mono, fontSize:12, color:AC.goldDark, background:'#FBF3E3', border:'1px solid #C8A95A', padding:'4px 10px', borderRadius:100 }}, 'Pro')
                                : React.createElement("span", {style: { ...mono, fontSize:12, color:C.dim, background:C.deep, border:`1px solid ${C.border}`, padding:'4px 10px', borderRadius:100 }}, '--')
                              ), React.createElement("div", {style: { ...mono, fontSize:12, color:C.dim }}, u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}) : '--'), React.createElement("div", {style: { display:'flex', gap:6, flexWrap:'wrap' }}, React.createElement("button", {onClick: () => togglePro(u.id, u.is_pro), style: {
                                ...mono, fontSize:12, padding:'8px 12px', borderRadius:8, cursor:'pointer',
                                background: u.is_pro ? '#FEF2F2' : '#FBF3E3',
                                border: u.is_pro ? '1px solid #FCA5A5' : '1px solid #C8A95A',
                                color: u.is_pro ? AC.error : AC.goldDark,
                              }}, u.is_pro ? 'Revoke Pro' : 'Pro +'), React.createElement("button", {onClick: () => deleteUser(u.id), style: {
                                ...mono, fontSize:12, padding:'8px 12px', borderRadius:8, cursor:'pointer',
                                background:'#FEF2F2', border:'1px solid #FCA5A5', color:AC.error,
                              }}, '✕')))
                        )))))
                ), tab === 'cfi' && (
                  React.createElement("div", null, React.createElement("div", {style: { display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}, React.createElement("div", {style: { display:'flex', gap:4, background:C.deep, padding:4, borderRadius:8, flexWrap:'wrap' }}, ['all','Integrated','Moderate fragmentation','High fragmentation','Critical fragmentation'].map(f => (
                          React.createElement("button", {key: f, onClick: () => setCfiFilter(f), style: {
                            padding:'7px 12px', background:cfiFilter===f?C.surface:'transparent',
                            border:cfiFilter===f?`1px solid ${C.borderBright}`:'1px solid transparent',
                            color:cfiFilter===f?C.cyan:C.muted,
                            ...mono, fontSize:12, letterSpacing:'0.04em', cursor:'pointer', borderRadius:8,
                          }}, f === 'all' ? 'ALL' : f.toUpperCase().split(' ')[0])
                        ))), React.createElement("div", {style: { ...mono, fontSize:12, color:C.muted, letterSpacing:'0.04em' }}, filteredCFI.length, 'RESULTS')), React.createElement("div", {className: "card", style: { overflow:'hidden' }}, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'1.4fr 90px 200px 140px 120px 110px', gap:12, padding:'14px 20px', borderBottom:`1px solid ${C.border}`, background:C.deep }}, ['USER ID','SCORE','BAND','DOMINANT','DATE','ACTION'].map(h => (
                          React.createElement("div", {key: h, style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.muted }}, h)
                        ))), React.createElement("div", {style: { maxHeight:520, overflowY:'auto' }}, filteredCFI.length === 0 && (
                          React.createElement("div", {style: { padding:'40px', textAlign:'center', color:C.dim, fontSize:15 }}, 'No CFI results', cfiFilter !== 'all' ? ' for this band' : '', '.')
                        ), filteredCFI.map((r,i) => {
                          const bColor = bandColors[r.band] || C.cyan;
                          return (
                            React.createElement("div", {key: r.id, style: {
                              display:'grid', gridTemplateColumns:'1.4fr 90px 200px 140px 120px 110px', gap:12,
                              padding:'14px 20px', borderBottom:`1px solid ${C.border}`,
                              transition:'background 0.15s',
                            }, onMouseEnter: e => e.currentTarget.style.background=C.deep, onMouseLeave: e => e.currentTarget.style.background='transparent'}, React.createElement("div", {style: { ...mono, fontSize:12, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, r.user_id?.slice(0,18), '...'), React.createElement("div", {style: { ...syne, fontSize:16, fontWeight:800, color:bColor, overflowWrap:'break-word', minWidth:0}}, r.total_score), React.createElement("div", null, React.createElement("span", {style: { ...mono, fontSize:12, color:bColor, background:`${bColor}12`, border:`1px solid ${bColor}30`, padding:'4px 10px', borderRadius:100 }}, r.band?.split(' ')[0])), React.createElement("div", {style: { fontSize:14, color:C.muted, textTransform:'capitalize' }}, r.dominant_brain || r.dominantBrain || 'N/A'), React.createElement("div", {style: { ...mono, fontSize:12, color:C.dim }}, r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}) : '--'), React.createElement("div", null, React.createElement("button", {onClick: () => deleteCFIResult(r.id), style: {
                                  ...mono, fontSize:12, padding:'8px 12px', cursor:'pointer',
                                  background:'#FEF2F2', border:'1px solid #FCA5A5',
                                  color:AC.error, borderRadius:8,
                                }}, 'Delete')))
                          );
                        }))))
                ), tab === 'pro' && (
                  React.createElement("div", null, React.createElement("div", {style: { display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}, React.createElement("div", {className: "card", style: { padding:'24px 28px', flex:'none' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:AC.muted, marginBottom:10 }}, 'PRO subscribers'), React.createElement("div", {style: { ...syne, fontSize:40, fontWeight:800, color:AC.goldDark, overflowWrap:'break-word', minWidth:0}}, proUsers.length)), React.createElement("div", {className: "card", style: { padding:'24px 28px', flex:'none' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:AC.muted, marginBottom:10 }}, 'Conversion rate'), React.createElement("div", {style: { ...syne, fontSize:40, fontWeight:800, color:C.cyan, overflowWrap:'break-word', minWidth:0}}, users.length ? Math.round(proUsers.length/users.length*100) : 0, '%')), React.createElement("div", {className: "card", style: { padding:'24px 28px', flex:'none' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:AC.muted, marginBottom:10 }}, 'EST. REVENUE'), React.createElement("div", {style: { ...syne, fontSize:40, fontWeight:800, color:AC.success, overflowWrap:'break-word', minWidth:0}}, `₦${((proUsers.length * proPrice / 100)).toLocaleString()}`))), React.createElement("div", {className: "card", style: { overflow:'hidden' }}, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'1fr 1.5fr 100px 120px', gap:16, padding:'14px 20px', borderBottom:`1px solid ${C.border}`, background:C.deep }}, ['NAME','EMAIL','STATUS','ACTION'].map(h => (
                          React.createElement("div", {key: h, style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.muted }}, h)
                        ))), React.createElement("div", {style: { maxHeight:480, overflowY:'auto' }}, proUsers.length === 0 && (
                          React.createElement("div", {style: { padding:'40px', textAlign:'center', color:C.dim, fontSize:15 }}, 'No Pro subscribers yet.')
                        ), proUsers.map((u,i) => (
                          React.createElement("div", {key: u.id, style: {
                            display:'grid', gridTemplateColumns:'1fr 1.5fr 100px 120px', gap:16,
                            padding:'14px 20px', borderBottom:`1px solid ${C.border}`,
                            transition:'background 0.15s',
                          }, onMouseEnter: e => e.currentTarget.style.background=C.deep, onMouseLeave: e => e.currentTarget.style.background='transparent'}, React.createElement("div", {style: { fontSize:15, color:C.text, fontWeight:500 }}, u.full_name || 'N/A'), React.createElement("div", {style: { ...mono, fontSize:13, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, u.email || u.id?.slice(0,16)), React.createElement("div", null, React.createElement("span", {style: { ...mono, fontSize:12, color:AC.goldDark, background:'#FBF3E3', border:'1px solid #C8A95A', padding:'4px 10px', borderRadius:100 }}, 'Active PRO')), React.createElement("div", null, React.createElement("button", {onClick: () => togglePro(u.id, true), style: {
                                ...mono, fontSize:12, padding:'8px 14px', cursor:'pointer',
                                background:'#FEF2F2', border:'1px solid #FCA5A5',
                                color:AC.error, borderRadius:8,
                              }}, 'Revoke')))
                        )))))
                ), tab === 'organisations' && (
                  React.createElement(window.NF_ORG.AdminTeamsPanel, {onChanged: loadAdminData})
                ), tab === 'pricing' && (
                  React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(400px,100%),1fr))', gap:20 }}, React.createElement("div", {className: "card", style: { padding:'40px', position:'relative', overflow:'hidden', borderColor:'#C8A95A' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.cyan, marginBottom:16 }}, 'PRO plan pricing'), React.createElement("div", {style: { ...syne, fontSize:18, fontWeight:800, color:C.text, marginBottom:8, overflowWrap:'break-word', minWidth:0}}, 'Edit Pro Price'), React.createElement("div", {style: { fontSize:15, color:C.muted, marginBottom:28, lineHeight:1.7 }}, 'Updates the price shown on the platform and passed to Paystack for payment processing.'), React.createElement("div", {style: { marginBottom:20 }}, React.createElement("div", {style: { ...mono, fontSize:12, letterSpacing:'0.04em', color:C.muted, marginBottom:8 }}, 'CURRENT PRICE (NAIRA)'), React.createElement("div", {style: { ...syne, fontSize:16, fontWeight:800, color:C.cyan, lineHeight:1.2, marginBottom:4, overflowWrap:'break-word', minWidth:0}}, `₦${(proPrice/100).toLocaleString()}`), React.createElement("div", {style: { ...mono, fontSize:12, color:C.muted }}, '=', proPrice.toLocaleString(), 'kobo')), React.createElement("div", {style: { marginBottom:20 }}, React.createElement("div", {style: { ...mono, fontSize:12, letterSpacing:'0.04em', color:C.muted, marginBottom:8 }}, 'NEW PRICE (₦)'), React.createElement("div", {style: { display:'flex', gap:12, alignItems:'center' }}, React.createElement("div", {style: { position:'relative', flex:1 }}, React.createElement("div", {style: { position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', ...syne, fontSize:16, fontWeight:700, color:C.muted, overflowWrap:'break-word', minWidth:0}}, '₦'), React.createElement("input", {type: "number", value: priceInput, onChange: e => setPriceInput(e.target.value), style: { paddingLeft:36, fontSize:16, ...syne, fontWeight:700, overflowWrap:'break-word', minWidth:0}, min: "100", step: "100"})), React.createElement("button", {className: "btn-primary", onClick: savePrice, style: { whiteSpace:'nowrap' }}, priceSaved ? '✓ Saved!' : 'Save Price'))), React.createElement("div", {style: { padding:'20px', background:C.deep, borderRadius:8, border:`1px solid ${C.border}` }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:C.muted, marginBottom:8 }}, 'Paystack integration'), React.createElement("div", {style: { fontSize:15, color:C.muted, lineHeight:1.7 }}, 'Live key:', React.createElement("span", {style: { color:C.cyan, fontFamily:'monospace' }}, 'loaded from platform_settings at runtime'), React.createElement("br", null), 'Currency: NGN · Gateway: Paystack inline · Verified server-side'))), React.createElement("div", {className: "card", style: { padding:'40px', position:'relative', overflow:'hidden', borderColor:'#C8A95A', gridColumn:'1 / -1' }}, React.createElement("div", {style: { ...mono, fontSize:13, letterSpacing:'0.04em', color:AC.goldDark, marginBottom:16 }}, 'Payment gateway'), React.createElement("div", {style: { ...syne, fontSize:18, fontWeight:800, color:C.text, marginBottom:8, overflowWrap:'break-word', minWidth:0}}, 'Paystack Public Key'), React.createElement("div", {style: { fontSize:15, color:C.muted, marginBottom:28, lineHeight:1.7 }}, 'Your Paystack public key (pk_live_... or pk_test_...). Stored in platform_settings and loaded at runtime, so no redeploy is needed.'), React.createElement("div", {style: { display:'flex', gap:12, alignItems:'center' }}, React.createElement("input", {type: "text", value: paystackKeyInput, onChange: e => setPaystackKeyInput(e.target.value), placeholder: 'pk_live_...', style: { flex:1, fontSize:15, fontFamily:'monospace', letterSpacing:'0.02em', overflowWrap:'break-word', minWidth:0 }}), React.createElement("button", {className: "btn-primary", onClick: savePaystackKey, style: { whiteSpace:'nowrap' }}, keySaved ? '✓ Saved!' : 'Save Key')), paystackKeyInput && React.createElement("div", {style: { marginTop:16, padding:'12px 16px', background:C.deep, borderRadius:8, border:`1px solid ${C.border}`, ...mono, fontSize:13, color:C.muted }}, 'Active: ', React.createElement("span", {style: { color:AC.goldDark }}, paystackKeyInput.slice(0,12), '...', paystackKeyInput.slice(-6)))))
                                ))
            )))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  TEAM TRAINING PROGRAMME (the five lessons a team works through)
    //  One system: this is rendered inside the team dashboard (ProgrammePanel).
    // ═══════════════════════════════════════════════════════════════════


    // Design tokens for the training programme. Mirrors the CFI assessment palette.
    const TEAM_THEME = {
      bg: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: '#F9FAFB',
      text: '#111827', muted: '#4B5563', border: '#D1D5DB',
      gold: '#C8A95A', goldDark: '#8A6D2F', goldTint: '#FBF3E3',
      focus: '#8A6D2F',
      error: '#B91C1C', errorTint: '#FEF2F2', success: '#166534',
      font: "'Atkinson Hyperlegible', 'Inter', -apple-system, sans-serif",
    };
    const TT = TEAM_THEME;

    const TEAM_LESSONS = [
      { num:1, week:2, title:'Foundation of Integrated Thinking', skill:'Cognitive Mode Awareness', level:'Beginner', duration:90,
        framing:'Lesson One creates the cognitive baseline from which everything else builds. Your job is not to convince participants NeuralFusion works; give them their first conscious experience of a NeuralFusion cycle and let the experience do the convincing. By the end, every participant should have completed the Core Loop at least once with a real problem.',
        plan:[
          {t:'0–10 min',act:'Welcome & Programme Context',detail:'Explain 7-week structure, what the CFI measures, and what participants will be able to do by Week 5. Do NOT reveal CFI pre-scores.'},
          {t:'10–20 min',act:'Read Lesson One aloud',detail:'Cover: What is NeuralFusion, the Problem it Solves, the Four Modes, the Core Loop. Speak slowly and clearly.'},
          {t:'20–30 min',act:'Pair Discussion',detail:'"Which way of thinking do you default to most? When does that cause problems?" (8 min pairs + 2 min group feedback).'},
          {t:'30–55 min',act:'Guided Practice (Group Format)',detail:'Walk the whole team through the First Guided Practice simultaneously. 25 minutes.'},
          {t:'55–70 min',act:'Group Debrief',detail:'Use the debrief prompts. Capture key responses on the whiteboard.'},
          {t:'70–80 min',act:'Key Insight Delivery',detail:'Read the Key Insight of Lesson One. Ask each participant to write it in their own words.'},
          {t:'80–90 min',act:'Assignment Brief',detail:'Issue the 24-hour assignment. Set expectation for Lesson Two.'},
        ],
        practice:["'Sit comfortably, feet flat, pen in hand. We are going to run NeuralFusion together for the first time.'","'Think of a simple challenge you are currently facing at work, in your studies, or in a decision. Write it in one sentence. You have 90 seconds.'","'Now write only the FACTS about this challenge. No opinions, no feelings; only what is provably true.' [Pause 2 min]","'Put your pen down. Close your eyes for 30 seconds. What does your gut tell you about this situation?' [After 30 sec] 'Open your eyes and write that down in one sentence.'","'Write three ideas or connections this situation brings to mind, even unusual or unrelated ones.' [Pause 2 min]","'Finally, what does this challenge mean for you? What lesson is it offering? Write one sentence.' [Pause 2 min]","'Look at your page. You have just completed one NeuralFusion cycle. You activated all four modes in sequence. Notice how your relationship with the challenge has shifted.'"],
        debrief:['What was the most uncomfortable mode to enter? Why?','Which mode felt most natural to you? What does that tell you about your default?','Did the challenge feel different after completing the cycle? How?','What surprised you about the exercise?','Where in your daily work do you skip one of these modes entirely?'],
        watchpoints:["Participants who say they 'don't have gut feelings'; redirect: gut feeling is any immediate non-analytical response. It does not have to feel dramatic.","Those who overthink the Associative mode step; reassure them: unusual connections are the point.","Participants writing nothing during Reflective mode are stuck in Analysis. Prompt: 'What is one word that describes what this experience means for you?'","If someone shares something very personal, acknowledge briefly and redirect to cognitive mechanics: 'That is exactly what Lesson Four addresses.'"],
        assignment:'24-hour assignment: Observe which way of thinking you default to in at least three situations today. Record the situation, the mode, and what happened as a result.',
        keyInsight:'Cognitive clarity is not an absence of complexity; it is the ability to move through complexity using all four modes in sequence.',
      },
      { num:2, week:2, title:'Mode Activation & Mental Control', skill:'Deliberate Mode Switching', level:'Beginner–Intermediate', duration:90,
        framing:"Lesson Two moves from awareness to control. The key shift is: from 'I notice what mode I am in' to 'I choose what mode I enter.' Many participants will arrive with the 24-hour assignment incomplete; that is acceptable. Any observation is usable in today's session.",
        plan:[
          {t:'0–10 min',act:'Assignment Review',detail:'Ask 3–4 participants to share one observation from the 24-hour assignment. Record the dominant modes identified on the whiteboard.'},
          {t:'10–20 min',act:'Read Lesson Two content',detail:'Core Truth of Mental Control, the Four Modes revisited with risks, Mode Activation Signals. Emphasise: "Questions are switches."'},
          {t:'20–40 min',act:'The Switching Drill: Group Format',detail:'Run the full 7-minute drill as a group, led by the team lead, then repeat once independently.'},
          {t:'40–55 min',act:'Pair Exercise: Emergency Reset Practice',detail:'Each pair walks through a recalled stressful moment and applies the Emergency Reset protocol together.'},
          {t:'55–70 min',act:'Group Debrief',detail:'Use prompts below.'},
          {t:'70–80 min',act:'Key Insight Delivery',detail:"Ask participants: 'What does mental freedom mean to you now, vs what it meant before this lesson?'"},
          {t:'80–90 min',act:'Assignment Brief',detail:'48-hour assignment. Explain that Lesson Three requires participants to arrive with at least one real decision they are currently facing.'},
        ],
        practice:["'Sit upright. We are going to move through all four ways of thinking in sequence. I will time each one. Your topic is your day so far: what has happened since you woke up.'","ANALYTICAL: 60 sec: 'Facts only. What happened today? No feelings, no interpretations.' [60 sec silence] 'Stop.'","INTUITIVE: 60 sec: 'Gut only. What does today feel like overall? One word or one sentence.' [60 sec] 'Stop.'","ASSOCIATIVE: 60 sec: 'Connections. What does today remind you of? What ideas or images come to mind?' [60 sec] 'Stop.'","REFLECTIVE: 60 sec: 'Meaning. What is today teaching you?' [60 sec] 'Stop.'","'Notice what that felt like. Each mode has a different mental texture. Now repeat the drill silently and independently. Same topic. 7 minutes total.'","After the independent drill, ask: 'Was the second time faster? Did any mode feel different the second time?'"],
        debrief:['Which mode is hardest for you to enter deliberately? Which is hardest to exit?','What happened in your body when you shifted from Analytical to Intuitive?','Can you identify one situation this week where the Emergency Reset would have helped?','What is the difference between "thinking" and "reacting" now that you have experienced it?','Where in your professional role do you need the most mode control?'],
        watchpoints:['Participants from highly analytical environments (engineering, finance, law) may resist the Intuitive step. Let the discomfort stand as data; it is Mode Rigidity (Dim B on the CFI).','If group energy drops during the independent drill, that is not failure; it is concentration. Silence is productive.','The Emergency Reset pair exercise may surface real distress. Monitor the room. If visibly distressed, acknowledge privately after the session.','Some will try to combine all four modes simultaneously; sequential activation is the point. Fusion comes later. Control comes first.'],
        assignment:'48-hour assignment: Practice the Switching Drill once daily. Identify one moment where you used the Emergency Reset protocol. Arrive to Lesson Three with a real decision you are currently facing.',
        keyInsight:'Mental freedom is not doing whatever you feel; it is choosing which faculty of your mind to lead with in any given moment.',
      },
      { num:3, week:3, title:'Synthesis & Decision Mastery', skill:'Multi-mode Integration', level:'Intermediate', duration:90,
        framing:"Lesson Three is the technical core of NeuralFusion. This is where the framework moves from interesting to practical, and where visible behaviour change is most likely to emerge. Ask at the start: 'Did you bring a real decision?' If not, invite them to identify one in the first 5 minutes.",
        plan:[
          {t:'0–10 min',act:'Assignment Review',detail:'Ask who practiced mode-switching. Ask for one example of a mode shift that changed an outcome. Validate and reinforce.'},
          {t:'10–25 min',act:'Read Lesson Three content',detail:'Why Decisions Fail, What Synthesis Means, The Synthesis Framework (Extract → Align → Compress → Decide). Slow and clear.'},
          {t:'25–55 min',act:'Full Synthesis Drill',detail:'30 minutes with a real decision. Led by the team lead.'},
          {t:'55–65 min',act:'Commitment Lock Discussion',detail:'"When do you revisit decisions that don\'t need revisiting? What triggers that?" Map on whiteboard.'},
          {t:'65–75 min',act:'Group Debrief',detail:'Use prompts below.'},
          {t:'75–85 min',act:'Key Insight',detail:'"Write and discuss: \'Clarity is not finding the right answer; it is unifying the mind.\'"'},
          {t:'85–90 min',act:'Assignment Brief',detail:'72-hour assignment: apply full synthesis to one real decision and act on it.'},
        ],
        practice:['Phase 1: Individual Extraction (12 min): Each participant writes their decision at the top of a page.','ANALYTICAL (2.5 min): "List the facts and constraints of this decision only."','INTUITIVE (2.5 min): "What is your strongest gut signal about this? One sentence."','ASSOCIATIVE (2.5 min): "What is the most useful idea or angle you have not yet considered?"','REFLECTIVE (2.5 min): "What does your deepest value or lesson tell you here?"','Phase 2: Synthesis (10 min): "Underline the single most powerful output from each mode. What is the common direction they are pointing to? Write one sentence beginning with: My decision is..."','Phase 3: Commitment Lock (8 min): Ask 3–4 volunteers to read their decision sentence to the group. After each one, ask the group: "Is that a clear, committed decision or is it still a question?"'],
        debrief:['What did your four modes agree on? Where did they conflict?','Was the decision you wrote at the end different from what you expected at the start?','What happened when you read the decision sentence aloud?','Has anyone experienced the opposite: making a decision and then endlessly revisiting it? What mode was driving that?','How would your team or department operate differently if this process was normal?'],
        watchpoints:['Decision sentences that are still questions ("I think I might need to..."); push: "Rephrase that as a committed statement."','If someone cannot produce a one-sentence decision: "Your mind is still negotiating. What mode is blocking synthesis?"','The Commitment Lock discussion can provoke strong reactions in corporate environments where decisions are frequently revisited.','Watch for "decisions" about someone else\'s behaviour. Redirect: "NeuralFusion synthesises YOUR thinking. What is YOUR decision here?"'],
        assignment:'72-hour assignment: Apply the full Synthesis Framework to one real decision you are currently facing. Make the decision. Notice what happens.',
        keyInsight:'Clarity is not finding the right answer; it is unifying the mind.',
      },
      { num:4, week:4, title:'Stabilization Under Pressure', skill:'Cognitive Stability', level:'Intermediate–Advanced', duration:90,
        framing:'Lesson Four is the pressure test. Participants have learned to think clearly in calm conditions; this session trains the same clarity to survive stress, urgency, and emotional activation. It is arguably the most practically valuable lesson for corporate, leadership, and government teams. Deliver this lesson with a calmer, more grounded energy than previous sessions.',
        plan:[
          {t:'0–10 min',act:'Assignment Review',detail:'Who applied full synthesis to a real decision? Invite 2–3 brief accounts. Focus on what changed emotionally or mentally, not just the decision outcome.'},
          {t:'10–25 min',act:'Read Lesson Four content',detail:'Why Clarity Collapses, Stabilization Principle, Three Stabilizers: Cognitive Anchor, Temporal Compression, Mode Containment.'},
          {t:'25–45 min',act:'Pressure Simulation: Group Format',detail:'20 minutes.'},
          {t:'45–60 min',act:'Relapse Prevention Discussion',detail:'"What are your personal relapse triggers? When do you abandon a fused decision?" Map on whiteboard.'},
          {t:'60–72 min',act:'Group Debrief',detail:'Use prompts below.'},
          {t:'72–82 min',act:'Key Insight',detail:'"Mental mastery is not calm thinking; it is stable thinking." Ask: What is the difference?'},
          {t:'82–90 min',act:'Assignment Brief',detail:'72-hour assignment: apply stabilization during one real stressful event.'},
        ],
        practice:['Part A: Individual Recall (8 min): "Think of a recent stressful situation where your thinking became unclear or you acted in a way you later questioned."','"Write: (1) What was the situation. (2) Which mode dominated your thinking at the time. (3) What did you do or decide as a result." [6 min silent writing]','Part B: Retroactive Stabilization (8 min): "Now re-run that situation through NeuralFusion stabilization."','"Apply ONE cognitive anchor; write a short internal statement that would have locked your clarity."','"Apply temporal compression; what mattered most in the next 10 minutes of that situation?"','"Apply mode containment; name the mode that was flaring and write: I acknowledge [mode] and return authority to synthesis."','Part C: Forward Application (4 min): "Write one upcoming situation where you predict you will need stabilization. Write your cognitive anchor for it now, in advance."'],
        debrief:['What mode most commonly dominates your thinking under pressure?','Has anyone been in a situation where one person\'s emotional reactivity destabilized an entire team? What mode were they in?','What does a cognitive anchor feel like compared to positive thinking or affirmations?','Where in your role does temporal compression have the most practical value?','What are your top two personal relapse triggers? What do you now know to do?'],
        watchpoints:['This session can surface genuine workplace trauma. Stay alert. If anyone becomes visibly distressed, offer a private break. Do not allow the session to become a group debriefing of workplace grievances.','Some conflate stabilization with emotional suppression. Be clear: "Stabilization does not mean you stop feeling. It means the feeling does not take over your cognitive process."','Participants wanting to apply this to others; redirect: "Your assignment is your own stability first. Leading others with NeuralFusion is a Level Two competency."','Cognitive anchors should be short, personal, and grounded. If someone writes a long statement, help them compress: "What is the one sentence that locks clarity for you?"'],
        assignment:'72-hour assignment: Apply at least one stabilizer (Cognitive Anchor, Temporal Compression, or Mode Containment) during one real stressful event this week. Record what happened.',
        keyInsight:'Mental mastery is not calm thinking; it is stable thinking.',
      },
      { num:5, week:5, title:'Automatic Integration & Cognitive Fluency', skill:'Cognitive Automation', level:'Advanced', duration:90,
        framing:'Lesson Five completes the programme. The tone shifts from training to installation; you are not teaching new content, you are consolidating a cognitive habit. Many participants will arrive differently from how they arrived to Lesson One. Acknowledge that shift without dramatising it.',
        plan:[
          {t:'0–15 min',act:'Assignment Review & Reflection',detail:'Ask who applied stabilization in a stressful event. Invite 3–4 to share briefly. Then ask the whole group: "How has your thinking changed across the five weeks?"'},
          {t:'15–30 min',act:'Read Lesson Five content',detail:'Cognitive Fluency, From Skill to Instinct (three stages), The Automatic Fusion Trigger, Living NeuralFusion.'},
          {t:'30–50 min',act:'Fluency Installation: Group Format',detail:'20 minutes.'},
          {t:'50–65 min',act:'Signs of Completion Discussion',detail:'Read the five signs of completion aloud one by one. Ask the group to mark which they recognise in themselves.'},
          {t:'65–75 min',act:'Group Debrief',detail:'Use prompts below.'},
          {t:'75–82 min',act:'Final Insight Delivery',detail:'Read the Final Insight slowly and allow silence after.'},
          {t:'82–90 min',act:'Programme Closing',detail:'Announce CFI post-assessment (Week 6), change report and certification (Week 7). Thank the team.'},
        ],
        practice:['Part A: One Word Fusion (6 min): "Sit calmly and comfortably. Eyes open or closed, your choice."','"Think of any current situation: work, a relationship, a project, a decision, whatever is live in your mind right now."','"Internally, say the word: Fuse."','"Do not force anything. Just allow the mind to begin organising itself. Trust the four lessons you have completed. Observe what happens." [2 min silence]','"Write down one sentence, whatever arrived. It might be a clarity, a decision, a feeling, an insight." [90 seconds]','Part B: Group Fluency Round (8 min): Ask each table group to share their one sentence. 4 min. Then invite 2–3 from the room to share with the full group.','Part C: Lifetime Protocol Installation (6 min): "Write three personal commitments: (1) Use NeuralFusion daily; in what context specifically? (2) Teach it through behaviour; what behaviour will change first? (3) Return to structure when clarity fades; what is your first early warning signal?"'],
        debrief:['What does "thinking with structure" feel like differently from how you thought before this programme?','Which of the five Signs of Completion resonates most strongly for you right now?','What is the most important thing you are taking out of this programme?','Where in your professional or personal life will NeuralFusion have the most immediate impact?','What would you say to someone beginning this programme tomorrow?'],
        watchpoints:['Do not allow Lesson Five to become a celebration. The completion is real but the programme is a beginning; Level Two exists.','If participants say they "don\'t feel different", do not force it. The CFI will show the data.','Some participants will want to continue the conversation after the session. Invite them to the Week 7 certification session and encourage peer practice groups.','Remind clearly: Week 6 is the CFI post-assessment. Same format as Week 1. Same conditions.'],
        assignment:'Lifetime Protocol: three personal commitments for how you will use NeuralFusion going forward.',
        keyInsight:'You do not control the mind by force. You train it by structure.',
      },
    ];

    const teamH = React.createElement;

    function teamStylesCSS() {
      const T = TT;
      return `
/* Team training programme styles (scoped to .nf-team) */
.nf-team{font-family:${T.font};background:${T.bg};color:${T.text};min-height:100vh;font-size:17px;line-height:1.6;overflow-x:hidden;-webkit-text-size-adjust:100%;}
.nf-team *, .nf-team *::before, .nf-team *::after{box-sizing:border-box;}
.nf-team button, .nf-team input, .nf-team select, .nf-team textarea{font-family:inherit;}
.nf-team :focus-visible{outline:3px solid ${T.focus};outline-offset:3px;}
.nf-team h1, .nf-team h2, .nf-team h3, .nf-team p{margin:0;}
.nf-team-container{width:100%;max-width:1100px;margin:0 auto;padding:96px 24px 64px;}
.nf-team-container--mid{max-width:880px;}
.nf-team-container--narrow{max-width:720px;}
.nf-team-header{margin-bottom:32px;}
.nf-team-header--center{text-align:center;}
.nf-team-eyebrow{font-size:14px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${T.goldDark};margin-bottom:10px;overflow-wrap:anywhere;}
.nf-team-h1{font-size:clamp(26px,5vw,38px);font-weight:800;line-height:1.2;color:${T.text};margin-bottom:12px;overflow-wrap:anywhere;}
.nf-team-h3{font-size:20px;font-weight:700;line-height:1.35;color:${T.text};margin-bottom:8px;overflow-wrap:anywhere;}
.nf-team-lead{font-size:18px;line-height:1.7;color:${T.muted};max-width:640px;}
.nf-team-header--center .nf-team-lead{margin:0 auto;}
.nf-team-text{font-size:17px;line-height:1.7;color:${T.text};overflow-wrap:anywhere;}
.nf-team-muted{font-size:16px;line-height:1.6;color:${T.muted};overflow-wrap:anywhere;}
.nf-team-small{font-size:15px;color:${T.muted};}
.nf-team-section{margin-bottom:32px;}
.nf-team-stack{display:flex;flex-direction:column;gap:16px;}
.nf-team-stack--tight{gap:12px;}
.nf-team-card{background:${T.surface};border:1px solid ${T.border};border-radius:16px;padding:24px;min-width:0;}
.nf-team-card--interactive{cursor:pointer;transition:border-color .15s ease,box-shadow .15s ease;}
.nf-team-card--interactive:hover{border-color:${T.gold};box-shadow:0 2px 10px rgba(138,109,47,0.12);}
.nf-team-card--tint{background:${T.goldTint};border-color:${T.gold};}
.nf-team-card--alt{background:${T.surfaceAlt};}
.nf-team-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;}
.nf-team-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 22px;border-radius:12px;border:1px solid transparent;font-size:16px;font-weight:700;line-height:1.3;text-align:center;cursor:pointer;transition:background .15s ease,border-color .15s ease,color .15s ease;max-width:100%;}
.nf-team-btn--primary{background:${T.goldDark};color:#FFFFFF;box-shadow:0 1px 3px rgba(138,109,47,0.35);}
.nf-team-btn--primary:hover:not([disabled]){background:#735A26;}
.nf-team-btn--ghost{background:transparent;color:${T.text};}
.nf-team-btn--ghost:hover:not([disabled]){background:${T.goldTint};color:${T.goldDark};}
.nf-team-btn[disabled]{opacity:0.5;cursor:not-allowed;}
.nf-team-chips{display:flex;flex-wrap:wrap;gap:8px;}
.nf-team-chip{min-height:48px;padding:0 18px;border:1px solid ${T.border};border-radius:999px;background:#FFFFFF;color:${T.text};font-size:16px;font-weight:700;cursor:pointer;}
.nf-team-chip:hover{border-color:${T.gold};background:${T.goldTint};}
.nf-team-chip[aria-pressed="true"]{border-color:${T.goldDark};background:${T.goldTint};}
.nf-team-pill{display:inline-block;padding:4px 12px;border-radius:999px;border:1px solid ${T.border};background:#FFFFFF;font-size:14px;font-weight:700;line-height:1.4;white-space:nowrap;}
.nf-team-pill--wait{color:${T.goldDark};border-color:${T.gold};background:${T.goldTint};}
.nf-team-lesson{display:grid;grid-template-columns:56px minmax(0,1fr) auto;gap:20px;align-items:center;}
.nf-team-lesson__num{font-size:28px;font-weight:800;color:${T.goldDark};}
.nf-team-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}
.nf-team-planrow{display:grid;grid-template-columns:120px minmax(0,1fr);gap:20px;padding:16px 0;border-bottom:1px solid ${T.border};}
.nf-team-planrow__t{font-weight:700;color:${T.goldDark};}
.nf-team-step{display:flex;gap:16px;align-items:flex-start;}
.nf-team-step__n{font-weight:800;color:${T.goldDark};flex:0 0 auto;min-width:28px;}
.nf-team-dot{width:8px;height:8px;border-radius:50%;background:${T.gold};flex:0 0 auto;margin-top:11px;}
@media (max-width:767px){  .nf-team{font-size:16px;}
  .nf-team-container{padding:88px 16px 48px;}
  .nf-team-container--tabs{padding-top:136px;}
  .nf-team-header{margin-bottom:24px;}
  .nf-team-lead{font-size:17px;}
  .nf-team-card{padding:16px;}
  .nf-team-grid-2{grid-template-columns:minmax(0,1fr);}
  .nf-team-lesson{grid-template-columns:minmax(0,1fr);gap:8px;}
  .nf-team-lesson .nf-team-btn{width:100%;margin-top:8px;}
  .nf-team-planrow{grid-template-columns:minmax(0,1fr);gap:4px;}
  .nf-team-step{gap:12px;}}
@media (max-width:360px){  .nf-team-card{padding:14px 12px;}
  .nf-team-container{padding-left:12px;padding-right:12px;}}
@media (prefers-reduced-motion:reduce){  .nf-team *, .nf-team *::before, .nf-team *::after{animation:none !important;transition:none !important;}}

`;
    }

    function useTeamStyles() {
      useEffect(() => {
        if (!document.getElementById('nf-a11y-font')) {
          const link = document.createElement('link');
          link.id = 'nf-a11y-font';
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap';
          document.head.appendChild(link);
        }
        if (!document.getElementById('nf-team-styles')) {
          const style = document.createElement('style');
          style.id = 'nf-team-styles';
          style.textContent = teamStylesCSS();
          document.head.appendChild(style);
        }
      }, []);
    }

    function TeamMain({ width, tabs = true, children }) {
      const cls = 'nf-team-container' + (width ? ' nf-team-container--' + width : '') + (tabs ? ' nf-team-container--tabs' : '');
      return teamH("main", {className: cls}, children);
    }
    function TeamHeader({ eyebrow, title, lead, center }) {
      return teamH("header", {className: 'nf-team-header' + (center ? ' nf-team-header--center' : '')},
        eyebrow && teamH("div", {className: "nf-team-eyebrow"}, eyebrow),
        teamH("h1", {className: "nf-team-h1"}, title),
        lead && teamH("p", {className: "nf-team-lead"}, lead)
      );
    }

    // Seat-based lesson access: a team with 5 seats or fewer gets Lesson 1 only;
    // 6 seats and above (6-9, 10, 25, 50...) gets all five lessons.
    const TEAM_FULL_PROGRAMME_SEATS = 6;
    const teamOpenLessons = (seatLimit) => (seatLimit == null || seatLimit >= TEAM_FULL_PROGRAMME_SEATS) ? 5 : 1;

    function TeamProgrammeView({ session, done, onDone, openCount = 5, seatLimit = null }) {
      const [activeLesson, setActiveLesson] = useState(null);
      const [lessonTab, setLessonTab] = useState('plan');

      if (activeLesson!==null) {
        const L = TEAM_LESSONS[activeLesson];
        const tabs = [['plan','Session Plan'],['practice','Practice Script'],['debrief','Debrief Prompts'],['watchpoints','Watch-Points']];
        return (
          teamH(TeamMain, {width: 'mid'},
            teamH("div", {className: "nf-team-section"}, teamH("button", {type: "button", className: "nf-team-btn nf-team-btn--ghost", onClick: ()=>setActiveLesson(null)}, '← Back to Programme')),
            teamH(TeamHeader, {eyebrow: `Lesson ${L.num} · Week ${L.week} · ${L.level}`, title: L.title}),
            teamH("section", {className: "nf-team-card nf-team-card--tint nf-team-section"},
              teamH("h2", {className: "nf-team-h3"}, 'Session framing'),
              teamH("p", {className: "nf-team-text"}, L.framing)
            ),
            teamH("div", {className: "nf-team-chips nf-team-section", role: "group", "aria-label": "Lesson sections"}, tabs.map(([id,label]) =>
              teamH("button", {key: id, type: "button", className: "nf-team-chip", "aria-pressed": lessonTab===id, onClick: ()=>setLessonTab(id)}, label)
            )),
            lessonTab==='plan' && (
              teamH("div", null,
                L.plan.map((row,i) => (
                  teamH("div", {key: i, className: "nf-team-planrow"},
                    teamH("span", {className: "nf-team-planrow__t"}, row.t),
                    teamH("div", null, teamH("div", {className: "nf-team-text", style: {fontWeight: 700}}, row.act), teamH("div", {className: "nf-team-muted"}, row.detail))
                  )
                )),
                teamH("div", {className: "nf-team-card nf-team-card--tint", style: {marginTop: 24}},
                  teamH("div", {className: "nf-team-eyebrow"}, 'Assignment'),
                  teamH("p", {className: "nf-team-text"}, L.assignment)
                )
              )
            ),
            lessonTab==='practice' && (
              teamH("div", {className: "nf-team-stack nf-team-stack--tight"}, L.practice.map((step,i) => (
                teamH("div", {key: i, className: "nf-team-card nf-team-step"},
                  teamH("span", {className: "nf-team-step__n"}, String(i+1).padStart(2,'0')),
                  teamH("span", {className: "nf-team-text", style: {fontStyle: step.startsWith("'") ? 'italic' : 'normal'}}, step)
                )
              )))
            ),
            lessonTab==='debrief' && (
              teamH("div", {className: "nf-team-stack nf-team-stack--tight"}, L.debrief.map((q,i) => (
                teamH("div", {key: i, className: "nf-team-card nf-team-step"},
                  teamH("span", {className: "nf-team-step__n", "aria-hidden": "true"}, '→'),
                  teamH("span", {className: "nf-team-text"}, q)
                )
              )))
            ),
            lessonTab==='watchpoints' && (
              teamH("div", {className: "nf-team-grid-2"}, L.watchpoints.map((w,i) => (
                teamH("div", {key: i, className: "nf-team-card nf-team-step"},
                  teamH("span", {className: "nf-team-dot", "aria-hidden": "true"}),
                  teamH("span", {className: "nf-team-text"}, w)
                )
              )))
            ),
            teamH("section", {className: "nf-team-card nf-team-card--alt", style: {marginTop: 32, textAlign: 'center', padding: '28px 20px'}},
              teamH("div", {className: "nf-team-eyebrow"}, 'Key Insight · Lesson ', L.num),
              teamH("p", {style: {fontSize: 'clamp(19px,4vw,24px)', fontWeight: 700, lineHeight: 1.5}}, L.keyInsight)
            ),
            onDone && teamH("div", {style: {marginTop: 24, textAlign: 'center'}},
              (done && done.indexOf(L.num) >= 0)
                ? teamH("span", {className: "nf-team-pill"}, 'Lesson completed')
                : teamH("button", {type: "button", className: "nf-team-btn nf-team-btn--primary", onClick: ()=>onDone(L.num)}, 'Mark lesson complete')
            )
          )
        );
      }

      return (
        teamH(TeamMain, {width: 'mid'},
          teamH(TeamHeader, {eyebrow: '5-Lesson Programme · 7 Weeks', title: 'Your Programme', lead: 'Work through the five lessons in order. Each lesson builds on the one before.'}),
          openCount < 5 && teamH("div", {className: "nf-team-card nf-team-card--tint nf-team-section"}, teamH("p", {className: "nf-team-text"}, 'Your team has ' + (seatLimit != null ? seatLimit : 'a small number of') + ' seats, so Lesson 1 is open. Lessons 2 to 5 open when your team has ' + TEAM_FULL_PROGRAMME_SEATS + ' or more seats.')),
          teamH("div", {className: "nf-team-stack"}, TEAM_LESSONS.map((L,i) => (
            teamH("article", {key: i, className: "nf-team-card nf-team-card--interactive nf-team-lesson", onClick: ()=>{ if (L.num <= openCount) setActiveLesson(i); }, style: L.num > openCount ? { opacity: 0.65, cursor: 'default' } : undefined},
              teamH("div", {className: "nf-team-lesson__num", "aria-hidden": "true"}, String(L.num).padStart(2,'0')),
              teamH("div", {style: {minWidth: 0}},
                teamH("h2", {className: "nf-team-h3", style: {marginBottom: 4}}, teamH("span", {className: "nf-team-small", style: {display: 'block'}}, 'Lesson ', L.num), L.title),
                teamH("p", {className: "nf-team-muted"}, L.skill),
                teamH("div", {className: "nf-team-meta"},
                  teamH("span", {className: "nf-team-pill"}, L.duration, ' min'),
                  teamH("span", {className: "nf-team-pill"}, 'Week ', L.week),
                  teamH("span", {className: "nf-team-pill nf-team-pill--wait"}, L.level),
                  done && done.indexOf(L.num) >= 0 && teamH("span", {className: "nf-team-pill"}, 'Completed'),
                  L.num > openCount && teamH("span", {className: "nf-team-pill"}, 'Locked')
                )
              ),
              L.num > openCount
                ? teamH("button", {type: "button", className: "nf-team-btn nf-team-btn--ghost", disabled: true, "aria-label": 'Lesson ' + L.num + ' opens at ' + TEAM_FULL_PROGRAMME_SEATS + ' seats'}, 'Opens at ' + TEAM_FULL_PROGRAMME_SEATS + '+ seats')
                : teamH("button", {type: "button", className: "nf-team-btn nf-team-btn--primary", onClick: e => { e.stopPropagation(); setActiveLesson(i); }, "aria-label": 'Start lesson ' + L.num + ': ' + L.title}, 'Start Lesson →')
            )
          )))
        )
      );
    }

    window.NF_TRAINING = { TeamProgrammeView, useTeamStyles, teamOpenLessons };


    // ═══════════════════════════════════════════════════════════════════
    //  MAIN APP
    // ═══════════════════════════════════════════════════════════════════
    function App() {
      const [view, setView] = useState(() => (window.NF_ORG && window.NF_ORG.initialView()) || 'home');
      const [hasOrg, setHasOrg] = useState(false);
      const [showAuth, setShowAuth] = useState(false);
      const [authInitialTab, setAuthInitialTab] = useState('login');

      const [user, setUser] = useState(null);
      const [profile, setProfile] = useState(null);
      const [authLoading, setAuthLoading] = useState(false);
      const [session, setSession] = useState(null);       // JWT session for Edge Function calls

      const [isPro, setIsPro] = useState(false);
      const [cfiResult, setCfiResult] = useState(null);
      const [cfiHistory, setCfiHistory] = useState([]);   // full CFI attempt history, oldest→newest, for change
      const [lessonProgress, setLessonProgress] = useState({});
      // Display defaults only. The authoritative price is platform_settings on
      // the server and the verify-payment edge function re-checks the amount.
      const [proPrice, setProPrice] = useState(600000);
      const [paystackKey, setPaystackKey] = useState('pk_live_dfa71eca29f942cadc337cb8e41834857e2b129b');

      // Load platform settings from Supabase on mount
      useEffect(()=>{
        getPlatformSetting('pro_price').then(val=>{
          if (val) {
            const p = parseInt(val);
            if (!isNaN(p)) { setProPrice(p); }
          }
        });
        getPlatformSetting('paystack_public_key').then(val=>{
          if (val) { setPaystackKey(val); }
        });
      },[]);

      // Auth
      useEffect(()=>{
        sb.auth.getSession().then(({ data })=>{
          const u = data?.session?.user || null;
          setUser(u);
          setSession(data?.session || null);
          if (u) loadUser(u);
          else setAuthLoading(false);
        }).catch(()=>{
          // Supabase unreachable (paused project, network error, etc.)
          // Always unblock the app so users can still access the platform
          setAuthLoading(false);
        });
        const { data:{ subscription } } = sb.auth.onAuthStateChange((event, session)=>{
          if (event === 'PASSWORD_RECOVERY') {
            // User clicked the reset link: show update-password screen immediately
            setAuthInitialTab('update-password');
            setShowAuth(true);
            setAuthLoading(false);
            return;
          }
          if (event === 'USER_UPDATED') {
            // Password was successfully updated: close modal, sign them in normally
            setShowAuth(false);
            setAuthInitialTab('login');
          }
          if (event === 'SIGNED_IN' && session?.user) {
            // Upsert profile on first confirmed sign-in (covers email confirmation flow)
            const u = session.user;
            const name = u.user_metadata?.full_name || '';
            sb.from('profiles').upsert({ id: u.id, full_name: name, is_pro: false }, { onConflict: 'id' }).then(()=>{});
          }
          const u = session?.user || null;
          setSession(session || null);
          setUser(u);
          if (u) loadUser(u);
          else { setIsPro(false); setLessonProgress({}); setAuthLoading(false); }
        });
        return ()=>subscription.unsubscribe();
      },[]);

      useEffect(()=>{
        if (user && window.NF_ORG) window.NF_ORG.loadMyOrgs().then(l => setHasOrg(l.length > 0));
        else setHasOrg(false);
      }, [user && user.id]);

      const loadUser = async (u) => {
        setAuthLoading(true);
        try {
          const [prof, lp] = await Promise.all([getProfile(u.id), loadLessonProgress(u.id)]);
          if (prof) {
            setProfile(prof);
            // Admins get full platform access (Pro) without needing is_pro set on their profile row.
            const isAdmin = prof.is_admin === true;
            setIsPro(isAdmin || !!prof.is_pro);
          }
          setLessonProgress(lp);
          // Load full CFI history from Supabase (needed for change, not just the latest result)
          // IMPORTANT: only 'completed' rows have total_score/band/dim_scores populated.
          // 'in_progress' draft rows (auto-saved while taking the assessment) do not,
          // and including them here was causing Analytics to render blank whenever the
          // most recent row for a user happened to be an unfinished attempt.
          const { data: cfiRows, error: cfiErr } = await sb.from('cfi_results').select('*').eq('user_id', u.id).eq('status', 'completed').order('created_at', { ascending: false });
          if (cfiErr) console.error('[ANALYTICS LOAD ERROR] cfi_results fetch failed:', cfiErr);
          if (cfiRows && cfiRows.length > 0) {
            setCfiHistory([...cfiRows].reverse()); // oldest → newest
            const r = cfiRows[0];
            const dimScores = r.dim_scores || {};
            // Keys here are the A/I/S/R/E dimension letters (matches dimScores as stored
            // by finalize()), not brain names, and E is excluded, same as the fresh-quiz path.
            const brainMap = { A:'analytical', I:'intuitive', S:'associative', R:'reflective' };
            // FIX (audit finding #1): ascending sort: see matching comment in finalize()
            // above. Lowest fragmentation score = dominant mode, consistently everywhere.
            const sortedDims = Object.entries(dimScores).filter(([d]) => d !== 'E').sort((a,b)=>a[1]-b[1]);
            const dominantBrain = brainMap[sortedDims[0]?.[0]] || 'analytical';
            const total = r.total_score;
            // Same CFI-1.0 bands (13–65 scale) as the fresh-quiz path.
            let desc, recommendation;
            if (total<=17) { desc='Low fragmentation. Your ways of thinking are well-coordinated.'; recommendation='Maintain your daily integration protocol. Advance to Lessons 4–5 for fluency installation.'; }
            else if (total<=28) { desc='Some fragmentation detected. Specific modes need targeted training.'; recommendation='Focus on mode activation (Lesson 2). Daily mode-switching drills for 14 days.'; }
            else if (total<=40) { desc='Significant fragmentation. Integration is inconsistent under pressure.'; recommendation='Begin from Lesson 1. Run the Core Loop daily.'; }
            else { desc='Severe fragmentation. Decision-making and clarity are compromised.'; recommendation='Start Lesson 1 immediately and track your CFI weekly.'; }
            // Rebuild the same enriched fields the fresh-quiz path builds (integrationScore,
            // dimensionReports, profile, plan) so personalization works on every reload, not
            // only immediately after finishing the assessment.
            let integrationScore, dimensionReports, profile, plan;
            try {
              integrationScore = cfiIntegrationScore(total);
              dimensionReports = {};
              Object.keys(dimScores).forEach(d => { dimensionReports[d] = buildDimensionReport(d, dimScores[d]); });
              profile = buildCognitiveProfile(dimensionReports, integrationScore, r.band);
              plan = buildImprovementPlan(dimensionReports, r.band);
            } catch(e) { console.error('[CFI ENRICH ON LOAD ERROR]', e); }
            setCfiResult({ total, band: r.band, desc, recommendation, dimScores, dominantBrain, integrationScore, dimensionReports, profile, plan });
          }
        } catch(e){ console.error('[LOAD USER ERROR]', e); }
        setAuthLoading(false);
      };

      const handleSignOut = async () => {
        await sb.auth.signOut();
        setUser(null); setProfile(null); setIsPro(false); setLessonProgress({}); setCfiResult(null); setCfiHistory([]);
      };

      // Opens the auth modal on a specific tab (e.g. 'signup' or 'login'). Used by
      // the CFI account gate so "Create Free Account" and "Sign In" land on the
      // right tab instead of always defaulting to login.
      const openAuth = (tab='login') => { setAuthInitialTab(tab); setShowAuth(true); };

      const refreshCfiHistory = async () => {
        if (!user) return;
        const { data, error } = await sb.from('cfi_results').select('*').eq('user_id', user.id).eq('status', 'completed').order('created_at', { ascending: false });
        if (error) { console.error('[CFI HISTORY REFRESH ERROR]', error); return; }
        if (data) setCfiHistory([...data].reverse()); // oldest → newest, same shape as loadUser
      };

      const viewProps = { refreshCfiHistory, authLoading, setView, user, session, paystackKey, setShowAuth, openAuth, isPro, setIsPro, cfiResult, setCfiResult, cfiHistory, lessonProgress, setLessonProgress, proPrice };

      return (
        React.createElement("div", {style: { background:C.void, minHeight:'100vh', color:C.text }}, showAuth && React.createElement(AuthModal, {initialTab: authInitialTab, onClose: ()=>{ setShowAuth(false); setAuthInitialTab('login'); }, onSuccess: ()=>{ setShowAuth(false); setAuthInitialTab('login'); }}), React.createElement(Navbar, {view: view, setView: setView, user: user, profile: profile, setShowAuth: setShowAuth, onSignOut: handleSignOut, authLoading: authLoading, hasOrg: hasOrg}), React.createElement("main", null, view==='home'        && React.createElement(HomeView, viewProps), view==='cfi'         && React.createElement(CFIView, viewProps), view==='protocol'    && React.createElement(ProtocolView, viewProps), view==='decisions'   && React.createElement(DecisionVaultView, viewProps), view==='pressure'    && React.createElement(PressureModeView, viewProps), view==='analytics'   && React.createElement(AnalyticsView, viewProps), view==='lessons'     && React.createElement(LessonsView, viewProps), view==='legal'       && React.createElement(LegalView, {setView: setView}), view==='teams'       && React.createElement(window.NF_ORG.TeamsLanding, {user: user, setShowAuth: setShowAuth, setView: setView, openAuth: openAuth, onOrgsChanged: l => setHasOrg(l.length > 0)}), view==='org'         && React.createElement(window.NF_ORG.OrgPortal, {user: user, session: session, setView: setView, setShowAuth: setShowAuth, openAuth: openAuth, onOrgsChanged: l => setHasOrg(l.length > 0)}), view==='join'        && React.createElement(window.NF_ORG.JoinPage, {user: user, session: session, setView: setView, setShowAuth: setShowAuth, openAuth: openAuth, onOrgsChanged: l => setHasOrg(l.length > 0)}), view==='admin'       && profile?.is_admin === true && React.createElement(AdminView, {user: user, setView: setView, onPriceChange: setProPrice})), React.createElement(Footer, {setView: setView}), React.createElement(BottomNav, {view: view, setView: setView, user: user, hasOrg: hasOrg}))
      );
    }


    // ═══ NEURALFUSION_ORG_MODULE_START (self-serve team assessments, formerly org.js) ═══
// NeuralFusion teams module: the ONE team system. Anyone creates a team (create_my_organisation), becomes its owner,
// and shares ONE team link (?team=TOKEN). People who open it sign up, auto-join and go straight into the assessment.
// There are no cohort codes, facilitator portal, admin onboarding or email invitations any more.
// See migration_self_serve_teams.sql and migration_unify_one_system.sql.
// It only touches the globals
// app.js defines (React, sb, SUPABASE_URL, C, mono, syne, inter) at call time, inside functions.
// All authority lives in Supabase RPCs/RLS (the admin_* functions are platform-admin only).
(function () {
  const h = React.createElement;
  const { useState, useEffect } = React;

  // ---------- Theme: the SAME accessible light palette as the individual CFI assessment ----------
  // (white page, gold accents, Atkinson Hyperlegible, rounded cards, 48px+ touch targets).
  const AC = {
    bg: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: '#F9FAFB',
    text: '#111827', muted: '#4B5563', border: '#D1D5DB',
    gold: '#C8A95A', goldDark: '#8A6D2F', goldTint: '#FBF3E3', focus: '#8A6D2F',
    error: '#B91C1C', errorTint: '#FEF2F2', success: '#166534', successTint: '#F0FDF4',
    font: "'Atkinson Hyperlegible', 'Inter', -apple-system, sans-serif",
  };
  // Local light tokens. They shadow the app's dark globals (C, mono, syne) for this module only, so every
  // component below renders in the light CFI look without touching the rest of the app.
  const C = { void: AC.bg, deep: AC.surfaceAlt, surface: AC.surface, panel: AC.surfaceAlt, border: AC.border, borderBright: AC.border,
    cyan: AC.goldDark, cyanBright: AC.goldDark, cyanDim: AC.goldTint, text: AC.text, muted: AC.muted, dim: AC.muted };
  const mono = { fontFamily: AC.font };
  const syne = { fontFamily: AC.font };

  // Storage can throw (blocked cookies, some in-app browsers). Never let that blank the portal.
  const ses = {
    get(k) { try { return window.sessionStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { window.sessionStorage.setItem(k, v); } catch (_) {} },
    del(k) { try { window.sessionStorage.removeItem(k); } catch (_) {} },
  };

  // ---------- analytics (existing GTM dataLayer, no new framework) ----------
  const track = (name, props) => { try { (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: 'nf_' + name }, props || {})); } catch (_) {} };
  const rpc = async (name, args) => {
    try {
      const { data, error } = await sb.rpc(name, args || {});
      if (error) { console.error('[NF_ORG ' + name + ']', error); return { ok: false, error: 'request_failed' }; }
      return data;
    } catch (e) { console.error('[NF_ORG ' + name + ']', e); return { ok: false, error: 'network' }; }
  };
  const ERR = {
    not_signed_in: 'Please sign in first.', not_authorised: 'You do not have permission to do that.',
    invalid_org_name: 'Enter a team name (2 to 120 characters).', invalid_seats: 'Enter a seat count between 1 and 100000.',
    organisation_inactive: 'This team is not active.', not_found: 'That team no longer exists.', seats_below_used: 'Seat limit cannot be lower than the seats already in use.',
    network: 'Network error. Please try again.', server_error: 'Something went wrong. Please try again.', request_failed: 'Something went wrong. Please try again.',
    invalid_team_link: 'This team link is not valid or was reset. Ask your team owner for the current link.',
    team_full: 'This team has no seats left. Ask your team owner to add seats.',
    team_limit: 'You have reached the limit for teams created from one account. Contact us if you need more.',
    challenge_not_open: 'This challenge is no longer open.', already_submitted: 'You have already submitted this challenge.',
    invalid_option: 'Choose one of the listed actions.', invalid_text: 'Your answers are too long (2000 characters maximum each).',
  };
  const errText = (r) => ERR[r && r.error] || 'Something went wrong. Please try again.';

  // ---------- URL entry point: the one team link (?team=TOKEN) ----------
  // Retired links (?invite=..., ?enterprise=1&code=...) are not honoured any more; they land on the team start page.
  function initialView() {
    try {
      const p = new URLSearchParams(window.location.search);
      const team = p.get('team'), retired = p.get('invite') || p.get('enterprise');
      localStorage.removeItem('nf_invite_token'); sessionStorage.removeItem('nf_cohort_code');
      if (team) localStorage.setItem('nf_team_token', team.trim().slice(0, 80));
      if (team || retired) window.history.replaceState({}, '', window.location.pathname);
      if (team || localStorage.getItem('nf_team_token')) return 'join';
      if (retired) return 'teams';
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
    if (r && r.ok) { ses.del('nf_org_assess'); track('cfi_completed', { organisation_id: ctx.org }); }
  }

  // ---------- UI kit (matches the individual CFI assessment) ----------
  const card = (extra) => Object.assign({ background: AC.surface, border: '1px solid ' + AC.border, borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(17,24,39,0.06)', minWidth: 0 }, extra || {});
  const eyebrow = { fontFamily: AC.font, fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: AC.goldDark, textTransform: 'uppercase' };
  const label = Object.assign({}, eyebrow, { marginBottom: 10 });
  const inputStyle = { width: '100%', background: AC.surface, border: '2px solid ' + AC.border, color: AC.text, padding: '12px 14px', borderRadius: 12, fontSize: 16, minHeight: 48, boxSizing: 'border-box', fontFamily: AC.font };
  const btnBase = { fontFamily: AC.font, fontSize: 16, fontWeight: 700, minHeight: 48, padding: '12px 24px', borderRadius: 12, cursor: 'pointer', lineHeight: 1.3, textAlign: 'center', maxWidth: '100%' };
  const cap = (s) => { s = String(s == null ? '' : s); return s.charAt(0).toUpperCase() + s.slice(1); };
  // Buttons here were written in ALL CAPS; the CFI uses sentence case, so convert all-caps labels.
  const sentence = (t) => (typeof t === 'string' && t.length > 1 && t === t.toUpperCase())
    ? t.charAt(0) + t.slice(1).toLowerCase().replace(/\bcfi\b/g, 'CFI').replace(/\bwhatsapp\b/g, 'WhatsApp') : t;
  const pill = (color, bg) => ({ display: 'inline-block', padding: '4px 12px', borderRadius: 999, border: '1px solid ' + AC.border, background: bg || '#FFFFFF', color: color || AC.text, fontFamily: AC.font, fontSize: 14, fontWeight: 700, lineHeight: 1.4, whiteSpace: 'nowrap' });
  function Btn({ children, onClick, variant, disabled, style }) {
    const ghost = variant === 'ghost';
    return h('button', { type: 'button', onClick, disabled, className: 'nf-pbtn' + (ghost ? ' nf-pbtn--ghost' : ''),
      style: Object.assign({}, btnBase,
        ghost ? { background: '#FFFFFF', color: AC.goldDark, border: '2px solid ' + AC.goldDark }
              : { background: AC.goldDark, color: '#FFFFFF', border: '2px solid ' + AC.goldDark, boxShadow: '0 2px 8px rgba(138,109,47,0.35)' },
        disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}, style || {}) }, sentence(children));
  }
  function LinkBtn({ href, children, onClick, style }) {
    return h('a', { href, onClick, className: 'nf-pbtn',
      style: Object.assign({}, btnBase, { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        background: AC.goldDark, color: '#FFFFFF', border: '2px solid ' + AC.goldDark, boxShadow: '0 2px 8px rgba(138,109,47,0.35)' }, style || {}) }, sentence(children));
  }
  const Stat = (l, v, sub) => h('div', { key: l, style: card({ padding: 20 }) }, h('div', { style: label }, l),
    h('div', { style: { fontFamily: AC.font, fontSize: 30, fontWeight: 800, lineHeight: 1.2, color: AC.goldDark, overflowWrap: 'anywhere' } }, v),
    sub ? h('div', { style: { fontSize: 15, color: AC.muted, marginTop: 6, lineHeight: 1.5 } }, sub) : null);
  const Msg = ({ m }) => {
    if (!m) return null;
    const err = m.type === 'error';
    return h('div', { role: err ? 'alert' : 'status', style: { padding: '14px 18px', marginBottom: 16, borderRadius: 12, fontSize: 16, lineHeight: 1.6,
      background: err ? AC.errorTint : AC.successTint, border: '1px solid ' + (err ? '#FCA5A5' : '#86EFAC'), color: err ? AC.error : AC.success } }, m.text);
  };

  // Fonts + focus rings + hover states, injected once (same approach as the CFI assessment screens).
  function ensurePortalStyles() {
    if (typeof document === 'undefined') return;
    try { nfjEnsureStyles(); } catch (_) {}
    if (!document.getElementById('nf-a11y-font')) {
      const l = document.createElement('link');
      l.id = 'nf-a11y-font'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Inter:wght@400;600;700;800&display=swap';
      document.head.appendChild(l);
    }
    if (document.getElementById('nf-portal-styles')) return;
    const s = document.createElement('style');
    s.id = 'nf-portal-styles';
    s.textContent = '.nf-portal{font-size:17px;line-height:1.6;-webkit-text-size-adjust:100%;overflow-x:hidden}'
      + '.nf-portal *,.nf-portal *::before,.nf-portal *::after{box-sizing:border-box}'
      + '.nf-portal button,.nf-portal input,.nf-portal select,.nf-portal textarea{font-family:inherit}'
      + '.nf-portal h1,.nf-portal h2,.nf-portal h3,.nf-portal p{margin:0}'
      + '.nf-portal :focus-visible{outline:3px solid #8A6D2F;outline-offset:3px}'
      + '.nf-portal .nf-pbtn{transition:background .15s ease,border-color .15s ease}'
      + '.nf-portal .nf-pbtn:hover:not([disabled]){background:#735A26!important;border-color:#735A26!important;color:#FFFFFF!important}'
      + '.nf-portal .nf-pbtn--ghost:hover:not([disabled]){background:#FBF3E3!important;color:#8A6D2F!important;border-color:#8A6D2F!important}'
      + '.nf-portal .nf-tab:hover{border-color:#C8A95A!important;background:#FBF3E3!important}'
      + '.nf-portal .nf-team{background:transparent!important;min-height:0!important}'
      + '.nf-portal .nf-team-container{padding:8px 0 32px!important;max-width:none!important}'
      + '.nf-portal .nfj-sum:focus-visible{outline:3px solid #8A6D2F;outline-offset:3px}'
      + '@media (max-width:767px){.nf-portal{font-size:16px}}'
      + '@media (prefers-reduced-motion:reduce){.nf-portal *{animation:none!important;transition:none!important}}';
    document.head.appendChild(s);
  }
  function PortalFrame({ children }) {
    useEffect(ensurePortalStyles, []);
    return h('div', { className: 'nf-portal', style: { background: AC.bg, minHeight: '100vh', paddingTop: 80, paddingBottom: 100, color: AC.text, fontFamily: AC.font } },
      h('div', { style: { maxWidth: 1000, margin: '0 auto', padding: '32px 20px' } }, children));
  }
  const Shell = (children) => h(PortalFrame, null, children);

  // ====================================================================
  // TEAMS LANDING (create a team, share one link)
  // ====================================================================
  const FOUNDER_EMAIL = 'edetlife94@gmail.com';
  const TEAM_MAILTO = 'mailto:' + FOUNDER_EMAIL + '?subject=' + encodeURIComponent('Team enquiry: NeuralFusion') +
    '&body=' + encodeURIComponent('Organisation:\nCountry:\nApproximate team size:\nWhat you want to achieve:\n');


  // ---------- Team packages (USD per month; billed manually, see the invoice) ----------
  const TEAM_PACKAGES = [
    { seats: 10, price: 600,  per: 60, fit: 'A leadership team or a pilot' },
    { seats: 25, price: 800,  per: 32, fit: 'A department or several teams' },
    { seats: 50, price: 1000, per: 20, fit: 'A large team or multiple departments' },
  ];
  function packageMail(pkg, teamName) {
    return 'mailto:' + FOUNDER_EMAIL + '?subject=' + encodeURIComponent('Team package: ' + pkg.seats + ' seats') +
      '&body=' + encodeURIComponent('Team name: ' + (teamName || '') + '\nPackage: ' + pkg.seats + ' seats, $' + pkg.price + ' per month\nContact name:\nCountry:\n');
  }
  function TeamPackages({ teamName }) {
    return h('div', { key: 'pricing', style: { marginBottom: 56 } },
      h('div', { style: Object.assign({}, eyebrow, { marginBottom: 12 }) }, 'PRICING'),
      h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 20 } }, 'One seat is one person. Prices are in US dollars, billed monthly. Create your team first and try it with the starter seats, then pick a package when you need more.'),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 16 } },
        TEAM_PACKAGES.map((p) => h('div', { key: p.seats, style: card() },
          h('div', { style: { ...syne, fontSize: 20, fontWeight: 800, marginBottom: 4 } }, p.seats + ' seats'),
          h('div', { style: { ...syne, fontSize: 30, fontWeight: 800, color: C.cyan } }, '$' + p.price.toLocaleString(), h('span', { style: { fontSize: 15, color: C.muted, fontWeight: 500 } }, ' / month')),
          h('div', { style: { fontSize: 15, color: C.muted, margin: '6px 0 12px' } }, '$' + p.per + ' per seat per month'),
          h('div', { style: { fontSize: 15, color: C.muted, lineHeight: 1.6, marginBottom: 16 } }, 'Best for: ' + p.fit),
          h(LinkBtn, { href: packageMail(p, teamName), onClick: () => track('team_package_requested', { seats: p.seats }) }, 'REQUEST THIS PACKAGE')))),
      h('div', { style: { fontSize: 14, color: C.muted, lineHeight: 1.7 } }, 'We email you an invoice with payment details. Packages renew monthly, you can cancel with 30 days\u2019 notice, and monthly payments are not refundable. More than 50 seats? ', h('a', { href: TEAM_MAILTO, style: { color: C.cyan } }, 'Email us for a custom price'), '.'));
  }

  const TEAM_VALUES = [
    ['Measure how your team thinks', 'Each person takes the 13-item CFI in about four minutes. You see aggregate team patterns across the four ways of thinking once enough people have completed it.'],
    ['Train with five lessons', 'A guided five-lesson programme, with progress tracked for each person and a team progress summary for owners.'],
    ['Weekly thinking challenge', 'One realistic business scenario each week. Everyone works through it using the four ways of thinking and records a decision. Owners see participation and how the team split, never individual answers.'],
    ['Decision room', 'Work a real decision through facts, signals, alternatives, reflection and a decision. Save it to the team with an agreed action, a responsible person and a review date.'],
    ['Recommended practice', 'A short practice matched to your team\u2019s results by simple, visible rules. With too little data you get a general practice instead of a guess.'],
    ['See change over time', 'Everyone retakes the CFI after training. If they choose to share the retest, your before-and-after appears in Insights once enough people have shared.'],
    ['Privacy built in', 'Owners see completion status and aggregates, never individual scores or answers. Small groups are hidden to protect individuals.'],
    ['One link, one dashboard', 'No setup for your team. Share one link, people sign up and land in the assessment, and you manage everything in one place.'],
  ];
  function TeamsFAQ() {
    nfjEnsureStyles();
    const items = [
      ['How does my team join?', 'You create your team, then share one link. Each person opens it, creates an account, and goes straight into the assessment.'],
      ['What will each person do?', 'Each person completes the 13-item CFI (about four minutes), then does the five-lesson training programme, then retakes the CFI to see their own change.'],
      ['What does the CFI measure, and what does it not?', 'It measures how consistently your four ways of thinking (analytical, intuitive, associative, reflective) work together, and your self-reported steadiness under pressure, on a 13 to 65 scale where lower means better coordinated. It does not measure intelligence, personality, health or job performance.'],
      ['What will I see as the team owner?', 'Who has completed what, and aggregate team patterns once enough people have completed the CFI. Individual profiles stay private to each person.'],
      ['Can we measure development over time?', 'Yes. After the training, each person retakes the CFI. If they choose to share the retest, the team before-and-after appears under Insights once enough people have shared.'],
      ['What is the weekly challenge?', 'A short business scenario released each week. Each person works through the four ways of thinking and records a decision with their reasoning. You see who took part and how the team split, but not individual answers.'],
      ['Can we use NeuralFusion for real decisions?', 'Yes. The Decision Room guides a real decision from facts to an agreed action, owner and review date. A decision is shared with your team only if the person saving it chooses to.'],
      ['What if we need more seats?', 'Every new team starts with a few starter seats so you can try it. When you need more, pick a package (10, 25 or 50 seats) from the pricing section or the Plan and Seats tab.'],
    ];
    return h('div', { key: 'faq', style: { marginBottom: 56 } },
      h('div', { style: Object.assign({}, eyebrow, { marginBottom: 12 }) }, 'QUESTIONS'),
      items.map(([q, a]) => h('details', { key: q, style: { borderTop: '1px solid ' + C.border, padding: '4px 0' } },
        h('summary', { className: 'nfj-sum', style: { cursor: 'pointer', minHeight: 48, display: 'flex', alignItems: 'center', fontSize: 17, fontWeight: 700, color: C.text } }, q),
        h('p', { style: { fontSize: 16, color: C.muted, lineHeight: 1.8, margin: '4px 0 16px' } }, a))));
  }

  // ── Sample team report: FICTIONAL, display only. Mirrors the Team Results tab (org_team_results). ──
  // TEAM_REPORT_THRESHOLD must match the unlock threshold configured in the database (5). Figures are internally
  // consistent with CFI-1.0: total = (3*(A+I+S+R) + E) / 20 = (3*174 + 40) / 20 = 28.1, shown as 28 (Moderate band).
  const TEAM_REPORT_THRESHOLD = 5;
  const TEAM_SAMPLE = {
    members: 10, completed: 8, avgTotal: 28,
    dims: { analytical: 32, intuitive: 40, associative: 48, reflective: 54, integration: 40 },
    bands: { 'Moderate fragmentation': 4, 'High fragmentation': 3 },
  };

  function TeamsSampleReport() {
    nfjEnsureStyles();
    const d = TEAM_SAMPLE;
    const modes = ['analytical', 'intuitive', 'associative', 'reflective'].sort((a, b) => d.dims[a] - d.dims[b]);
    const lo = modes[0], hi = modes[modes.length - 1];
    const row = (k, v) => h('div', { key: k, style: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid ' + C.border, fontSize: 16 } }, h('span', null, k), h('span', { style: mono }, String(v)));
    const note = (t) => h('div', { style: { fontSize: 15, color: C.muted, marginTop: 12, lineHeight: 1.6 } }, t);
    return h('details', { key: 'sample-report', id: 'nf-sample-report', style: { borderTop: '1px solid ' + C.border, borderBottom: '1px solid ' + C.border, marginBottom: 56, padding: '4px 0' } },
      h('summary', { className: 'nfj-sum', style: { cursor: 'pointer', minHeight: 48, display: 'flex', alignItems: 'center', fontSize: 17, fontWeight: 700, color: C.text } }, 'See a sample team report'),
      h('div', { style: { padding: '8px 0 20px' } },
        h('div', { role: 'note', style: { fontSize: 15, color: C.muted, lineHeight: 1.6, marginBottom: 16 } }, 'SAMPLE: a fictional team, not real data. This is the layout a team owner sees under Team Results.'),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: 14, marginBottom: 20 } },
          Stat('Team average CFI', d.avgTotal, 'Scale 13 to 65. Higher means more scattered thinking.'), Stat('Completed', d.completed + ' of ' + d.members), Stat('Instrument', CFI_VERSION)),
        h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Average fragmentation by way of thinking'),
          Object.keys(DIM_LABELS).map((k) => row(DIM_LABELS[k], d.dims[k])),
          note('Average dimension scores out of 100. Higher means more scattered thinking in that area. These describe thinking patterns across the team, not individuals and not performance.')),
        h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Band distribution'),
          Object.keys(d.bands).map((b) => row(plainBand(b), d.bands[b])),
          note('Counts below 2 are hidden to protect individuals, so the bands shown may not add up to everyone who completed.')),
        h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'How to read this'),
          h('div', { style: { fontSize: 16, color: C.text, lineHeight: 1.8 } }, 'In this fictional team, ' + DIM_LABELS[hi].toLowerCase() + ' thinking has the highest average fragmentation (' + d.dims[hi] + ') and ' + DIM_LABELS[lo].toLowerCase() + ' thinking the lowest (' + d.dims[lo] + '). That is an observation about team thinking patterns, not a judgment of any person and not a prediction of results.'),
          note('A prompt for team discussion, not a measured result: run a real team decision through the Decision Room and give the step for the highest-scoring mode extra time.')),
        h('div', { style: card({ marginBottom: 12 }) }, h('div', { style: label }, 'Before enough people have completed'),
          h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7 } }, 'Team results are not available yet. To protect individual privacy, aggregate insight appears once ' + TEAM_REPORT_THRESHOLD + ' people have completed the CFI.')),
        note('A team report never shows individual results, and it does not claim business outcomes such as ROI. It shows measured CFI data only.')));
  }

  // ====================================================================
  // SELF-SERVE TEAM START: create a team, share one link, everything else is guided
  // ====================================================================
  const TEAM_NAME_KEY = 'nf_pending_team_name';
  const teamLinkUrl = (t) => window.location.origin + '/?team=' + t;
  const startAssessment = (org, setView) => {
    try { sessionStorage.setItem('nf_org_assess', JSON.stringify({ org: org.id, t: Date.now() })); } catch (_) {}
    track('cfi_started', { organisation_id: org.id });
    setView('cfi');
  };

  function CreateTeamCard({ user, setShowAuth, openAuth, setView, onOrgsChanged }) {
    const [name, setName] = useState(() => { try { return sessionStorage.getItem(TEAM_NAME_KEY) || ''; } catch (_) { return ''; } });
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState(null);
    const create = async () => {
      const n = name.trim();
      if (n.length < 2 || n.length > 120) { setMsg({ type: 'error', text: ERR.invalid_org_name }); return; }
      if (!user) {
        try { sessionStorage.setItem(TEAM_NAME_KEY, n); } catch (_) {}
        if (openAuth) openAuth('signup'); else setShowAuth(true);
        return;
      }
      setBusy(true); setMsg(null);
      const r = await rpc('create_my_organisation', { p_name: n });
      setBusy(false);
      if (!r || !r.ok) { setMsg({ type: 'error', text: errText(r) }); return; }
      try { sessionStorage.removeItem(TEAM_NAME_KEY); sessionStorage.setItem('nf_active_org', r.organisation_id); } catch (_) {}
      track('team_created', { organisation_id: r.organisation_id });
      const l = await loadMyOrgs();
      if (onOrgsChanged) onOrgsChanged(l);
      setView('org');
    };
    return h('div', { style: card({ maxWidth: 520, margin: '0 auto' }) },
      h('div', { style: label }, 'Team or organisation name'),
      h('input', { value: name, onChange: (e) => setName(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') create(); }, placeholder: 'For example: Acme Sales Team', maxLength: 120, style: Object.assign({}, inputStyle, { marginBottom: 14 }) }),
      h(Msg, { m: msg }),
      h(Btn, { onClick: create, disabled: busy, style: { width: '100%' } }, busy ? 'CREATING...' : (user ? 'CREATE MY TEAM' : 'SIGN UP AND CREATE MY TEAM')),
      h('div', { style: { fontSize: 14, color: C.muted, marginTop: 12, lineHeight: 1.6 } }, 'Takes under a minute. You become the team owner and get one link to share. Nothing else to set up.'));
  }

  function TeamsLanding({ user, setShowAuth, openAuth, setView, onOrgsChanged }) {
    useEffect(() => { track('enterprise_page_viewed'); }, []);
    useEffect(() => {
      if (!user) return;
      let live = true;
      loadMyOrgs().then((l) => { if (live && l.length > 0 && setView) setView('org'); });
      return () => { live = false; };
    }, [user && user.id]);
    const step = (n, t, d) => h('div', { key: n, style: card() },
      h('div', { style: Object.assign({}, eyebrow, { marginBottom: 12 }) }, 'STEP ' + n),
      h('div', { style: { ...syne, fontSize: 18, fontWeight: 800, marginBottom: 8 } }, t),
      h('div', { style: { fontSize: 15, color: C.muted, lineHeight: 1.7 } }, d));
    return Shell([
      h('div', { key: 'hero', style: { textAlign: 'center', padding: '16px 0 40px', maxWidth: 720, margin: '0 auto' } },
        h('div', { style: Object.assign({}, eyebrow, { marginBottom: 20 }) }, 'NeuralFusion for Teams'),
        h('h1', { style: { fontFamily: AC.font, fontSize: 'clamp(26px,5vw,34px)', fontWeight: 800, color: AC.text, margin: '0 0 20px', lineHeight: 1.3 } }, 'Measure and train how your team thinks.', h('br', null), h('span', { style: { color: AC.goldDark } }, 'One place.')),
        h('p', { style: { fontSize: 19, color: AC.text, maxWidth: 560, margin: '0 auto 20px', lineHeight: 1.7 } }, 'Create your team, share one link, and everything else is guided: assessment, training, a weekly thinking challenge, team decisions, practice and results.'),
        h('div', { role: 'note', style: { fontSize: 16, color: AC.text, lineHeight: 1.7, maxWidth: 560, margin: '0 auto', padding: '16px 20px', background: AC.goldTint, border: '1px solid ' + AC.gold, borderRadius: 16, textAlign: 'left' } }, 'You see how the team is doing, never anyone\u2019s personal answers. Small groups are hidden to protect individuals.')),
      h('div', { key: 'create', style: { marginBottom: 56 } }, h(CreateTeamCard, { user, setShowAuth, openAuth, setView, onOrgsChanged })),
      h('div', { key: 'how', id: 'nf-how', style: { marginBottom: 56 } },
        h('div', { style: Object.assign({}, eyebrow, { marginBottom: 12 }) }, 'HOW IT WORKS'),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 } },
          step(1, 'Create your team', 'Name your team. You are the owner and see everything in one dashboard.'),
          step(2, 'Share one link', 'Copy it or send it on WhatsApp. People sign up and land straight in the assessment.'),
          step(3, 'Assess, train, retake', 'Each person takes the CFI, does the five lessons, then retakes it. You see team results as they come in.'))),
      h('div', { key: 'values', id: 'nf-values', style: { marginBottom: 56 } },
        h('div', { style: Object.assign({}, eyebrow, { marginBottom: 12 }) }, 'WHAT YOUR TEAM GETS'),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: 16 } },
          TEAM_VALUES.map(([t, d]) => h('div', { key: t, style: card() },
            h('div', { style: { ...syne, fontSize: 18, fontWeight: 800, marginBottom: 8 } }, t),
            h('div', { style: { fontSize: 15, color: C.muted, lineHeight: 1.7 } }, d))))),
      h(TeamPackages, { key: 'pk', teamName: '' }),
      TeamsSampleReport(),
      TeamsFAQ(),
      h('div', { key: 'more', style: { textAlign: 'center', fontSize: 15, color: C.muted, lineHeight: 1.7 } }, 'Questions about pricing or a custom plan? ', h('a', { href: TEAM_MAILTO, onClick: () => track('contact_founder_clicked'), style: { color: C.cyan } }, 'Email the founder'), '.'),
    ]);
  }

  // ====================================================================
  // ORG PORTAL (owner/admin dashboard, participant panel, payment return)
  // ====================================================================
  function OrgPortal({ user, session, setView, setShowAuth, openAuth, onOrgsChanged }) {
    const [orgs, setOrgs] = useState(null);
    const [active, setActive] = useState(() => ses.get('nf_active_org'));
    const [notice, setNotice] = useState(null);

    const reload = async () => { const l = await loadMyOrgs(); setOrgs(l); if (onOrgsChanged) onOrgsChanged(l); return l; };

    useEffect(() => {
      if (!user) return;
      reload();
    }, [user && user.id, session && session.access_token]);

    if (!user) return Shell(h('div', { style: card({ textAlign: 'center' }) }, h('div', { style: { marginBottom: 16 } }, 'Sign in to open your team dashboard.'), h(Btn, { onClick: () => setShowAuth(true) }, 'SIGN IN')));
    if (orgs === null) return Shell(h('div', { style: { color: C.muted } }, notice ? notice.text : 'Loading...'));
    if (orgs.length === 0) return Shell([h(Msg, { key: 'm', m: notice }), h('div', { key: 'c', style: { textAlign: 'center', marginBottom: 24 } }, h('div', { style: { ...syne, fontSize: 24, fontWeight: 800, marginBottom: 8 } }, 'Create your team'), h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 20 } }, 'Name your team and get one link to share. Joining a team? Open the link your team owner sent you.')), h(CreateTeamCard, { key: 'f', user, setShowAuth, openAuth, setView, onOrgsChanged })]);
    const org = orgs.find((o) => o.id === active) || orgs[0];
    const pick = (id) => { ses.set('nf_active_org', id); setActive(id); };
    const header = h('div', { key: 'hd', style: { marginBottom: 28 } },
      h('div', { style: Object.assign({}, eyebrow, { marginBottom: 8 }) }, 'Your team'),
      h('div', { style: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' } },
        h('h1', { style: { fontFamily: AC.font, fontSize: 'clamp(26px,5vw,34px)', fontWeight: 800, color: AC.text, lineHeight: 1.3, margin: 0, overflowWrap: 'anywhere' } }, org.name),
        orgs.length > 1 ? h('select', { value: org.id, onChange: (e) => pick(e.target.value), style: Object.assign({}, inputStyle, { width: 'auto' }) }, orgs.map((o) => h('option', { key: o.id, value: o.id }, o.name))) : null));
    const body = (org.role === 'owner' || org.role === 'admin') ? h(Dashboard, { key: org.id, org, user, session, reload, setView }) : h(ParticipantPanel, { key: org.id, org, setView });
    return Shell([h(Msg, { key: 'n', m: notice }), header, body]);
  }

  function TeamLinkCard({ org, ov }) {
    const [tok, setTok] = useState(null);
    const [state, setState] = useState('loading');
    const [msg, setMsg] = useState(null);
    const load = () => rpc('get_team_link', { p_org: org.id }).then((r) => { if (r && r.ok && r.token) { setTok(r.token); setState('ok'); } else setState('error'); });
    useEffect(() => { load(); }, [org.id]);
    const url = tok ? teamLinkUrl(tok) : '';
    const copy = () => {
      const done = () => { setMsg({ type: 'ok', text: 'Team link copied. Paste it anywhere.' }); track('team_link_copied', { organisation_id: org.id }); };
      try { navigator.clipboard.writeText(url).then(done, () => window.prompt('Copy this link', url)); } catch (_) { window.prompt('Copy this link', url); }
    };
    const wa = 'https://wa.me/?text=' + encodeURIComponent('Join our team on NeuralFusion. Open this link, create a free account and take the 4 minute thinking assessment: ' + url);
    const reset = async () => {
      if (!window.confirm('Reset the team link? The old link stops working for new people. Current members stay.')) return;
      const r = await rpc('reset_team_link', { p_org: org.id });
      if (r && r.ok && r.token) { setTok(r.token); setMsg({ type: 'ok', text: 'New link created.' }); } else setMsg({ type: 'error', text: errText(r) });
    };
    const full = ov.seats.remaining <= 0;
    return h('div', { id: 'nf-team-link', style: card({ marginBottom: 20 }) },
      h('div', { style: label }, 'Your team link'),
      state === 'loading' ? h('div', { style: { color: C.muted, fontSize: 16 } }, 'Loading...') :
      state === 'error' ? h('div', { style: { color: AC.error, fontSize: 16, lineHeight: 1.7 } }, 'Team links are not enabled on the database yet. Run migration_self_serve_teams.sql in the Supabase SQL editor, then reload.') :
      h('div', null,
        h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 14 } }, 'Send this one link to your team. Each person opens it, creates a free account, and goes straight into the assessment. Nothing else to set up.'),
        h('div', { style: Object.assign({}, inputStyle, { wordBreak: 'break-all', marginBottom: 14, fontSize: 15 }) }, url),
        full ? h('div', { style: { color: AC.error, fontSize: 16, marginBottom: 12 } }, 'All ' + ov.seats.limit + ' seats are used. New people cannot join until you add seats (Plan and Seats tab).') : null,
        h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
          h(Btn, { onClick: copy, style: { padding: '12px 22px' } }, 'COPY LINK'),
          h(LinkBtn, { href: wa, style: { padding: '12px 22px', background: 'transparent', color: C.cyan } }, 'SHARE ON WHATSAPP'),
          h('button', { type: 'button', onClick: reset, style: { fontFamily: AC.font, fontSize: 16, fontWeight: 700, background: 'none', border: 'none', color: AC.muted, textDecoration: 'underline', cursor: 'pointer', minHeight: 48, padding: '0 12px' } }, 'Reset link')),
        h(Msg, { m: msg }),
        h('div', { style: { fontSize: 14, color: C.muted, marginTop: 12 } }, ov.seats.used + ' of ' + ov.seats.limit + ' seats used.')));
  }

  // One guided path for everyone: add team (owner), assess, train, retake, results.
  function OrgJourney({ org, ov, role, setView, go }) {
    const [st, setSt] = useState(null);
    useEffect(() => { rpc('org_programme_state', { p_org: org.id }).then(setSt); }, [org.id]);
    const lead = role === 'owner' || role === 'admin';
    const done = (st && st.ok && st.completed_lessons) || [];
    const assessed = !!ov.my_assessment_completed;
    const trained = done.length >= 5;
    const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };
    const steps = [];
    if (lead) steps.push({ k: 'team', title: 'Add your team', text: ov.seats.used > 1 ? (ov.seats.used - 1) + ' teammate(s) joined so far.' : 'Share your team link below. People sign up and land straight in the assessment.', done: ov.seats.used > 1, open: true, cta: 'COPY TEAM LINK', act: () => scrollTo('nf-team-link') });
    steps.push({ k: 'assess', title: 'Take the assessment', text: assessed ? 'Completed.' : '13 questions, about 4 minutes.', done: assessed, open: true, cta: 'START ASSESSMENT', act: () => startAssessment(org, setView) });
    steps.push({ k: 'train', title: 'Do the training', text: assessed ? (done.length + ' of 5 lessons finished.') : 'Opens when you finish the assessment.', done: trained, open: assessed, cta: done.length ? 'CONTINUE TRAINING' : 'START TRAINING', act: () => { if (go) go('programme'); else scrollTo('nf-train'); } });
    steps.push({ k: 'retake', title: 'Retake the assessment', text: trained ? 'Measure again to see your change.' : 'Opens when you finish the five lessons.', done: false, open: trained, cta: 'RETAKE THE CFI', act: () => setView('cfi') });
    steps.push({ k: 'results', title: lead ? 'See team results' : 'See your results', text: lead ? (ov.completed >= ov.report_threshold ? 'Team results are ready.' : 'Team results appear once ' + ov.report_threshold + ' people have completed the assessment. ' + ov.completed + ' so far.') : 'Your own profile and change over time.', done: false, open: assessed, cta: lead ? 'OPEN TEAM RESULTS' : 'VIEW MY RESULT', act: () => { if (lead && go) go('results'); else setView('analytics'); } });
    const current = steps.findIndex((x) => !x.done && x.open);
    return h('div', { style: card({ marginBottom: 20 }) },
      h('div', { style: label }, 'Your path'),
      steps.map((x, i) => h('div', { key: x.k, style: { display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 0', borderTop: i ? '1px solid ' + C.border : 'none', opacity: x.open ? 1 : 0.5 } },
        h('div', { 'aria-hidden': true, style: { fontFamily: AC.font, fontWeight: 700, flex: '0 0 36px', height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          background: x.done ? AC.success : (i === current ? AC.goldDark : '#FFFFFF'), color: (x.done || i === current) ? '#FFFFFF' : AC.muted,
          border: '2px solid ' + (x.done ? AC.success : (i === current ? AC.goldDark : AC.border)) } }, x.done ? '✓' : String(i + 1)),
        h('div', { style: { flex: 1, minWidth: 0 } },
          h('div', { style: { ...syne, fontSize: 17, fontWeight: 800, marginBottom: 2 } }, x.title),
          h('div', { style: { fontSize: 15, color: C.muted, lineHeight: 1.6 } }, x.text),
          x.open && !(x.done && x.k !== 'train') ? h('div', { style: { marginTop: 10 } }, h(Btn, { onClick: x.act, variant: i === current ? undefined : 'ghost', style: { padding: '10px 18px', fontSize: 14 } }, x.cta)) : null))));
  }

  // ====================================================================
  // PRACTICE LOOP: Weekly Thinking Challenge, Decision Room entry, Recommended Practice
  // Server contract: migration_team_practice_loop.sql (org_current_challenge,
  // submit_challenge_response, org_challenge_summary, org_recent_decisions).
  // Recommended Practice reads the existing org_team_results(p_org) and invents no scores.
  // ====================================================================
  const textareaStyle = Object.assign({}, inputStyle, { minHeight: 76, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 });
  const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(); } catch (_) { return ''; } };
  const MODE_NAME = { analytical: 'Analytical', intuitive: 'Intuitive', associative: 'Associative', reflective: 'Reflective' };
  const CHALLENGE_MODES = [
    ['analytical', 'ans_analytical', 'prompt_analytical', 'Analytical'],
    ['intuitive', 'ans_intuitive', 'prompt_intuitive', 'Intuitive'],
    ['associative', 'ans_associative', 'prompt_associative', 'Associative'],
    ['reflective', 'ans_reflective', 'prompt_reflective', 'Reflective'],
  ];

  // ---- Team decision context: set when a person starts a decision from the Team Portal ----
  // The Save panel shows an explicit "save to team" checkbox; nothing is shared without it.
  function startTeamDecision(org, setView) {
    try { sessionStorage.setItem('nf_decision_org', JSON.stringify({ org: org.id, name: org.name || '', t: Date.now() })); } catch (_) {}
    track('team_decision_started', { organisation_id: org.id });
    setView('decisions');
  }
  function getDecisionContext() {
    try {
      const c = JSON.parse(sessionStorage.getItem('nf_decision_org') || 'null');
      if (!c || !c.org || Date.now() - c.t > 2 * 3600 * 1000) { sessionStorage.removeItem('nf_decision_org'); return null; }
      return c;
    } catch (_) { return null; }
  }
  function clearDecisionContext() { try { sessionStorage.removeItem('nf_decision_org'); } catch (_) {} }

  // ---- Recommended Practice: transparent rules over the existing team results ----
  // Same band cut points the app already uses for CFI-1.0 (13 to 65): <=17, <=28, <=40, above.
  // The four modes are compared with each other only (the single "pressure" item is not comparable).
  const PRACTICES = {
    analytical: { mode: 'Analytical', title: 'Separate facts from assumptions', minutes: 7,
      steps: ['Pick one problem your team is facing right now.', 'Write two lists: what we know for certain, and what we are assuming.', 'Circle the one missing fact that would change the decision most, and decide who finds it out.'], lesson: 'Lesson 2: Mode Activation & Mental Control' },
    intuitive: { mode: 'Intuitive', title: 'Name the signals', minutes: 7,
      steps: ['Pick one problem your team is facing right now.', 'Each person writes three concerns, hunches or patterns they have noticed. No need to justify them yet.', 'Ask: which of these would we most regret ignoring?'], lesson: 'Lesson 2: Mode Activation & Mental Control' },
    associative: { mode: 'Associative', title: 'Find three alternatives', minutes: 7,
      steps: ['Pick one problem your team is facing right now.', 'Identify three alternative solutions. Make at least one of them unconventional.', 'For each, write one sentence on what would have to be true for it to work.'], lesson: 'Lesson 2: Mode Activation & Mental Control' },
    reflective: { mode: 'Reflective', title: 'Run a failure check', minutes: 7,
      steps: ['Pick one decision your team is about to make.', 'Imagine it has failed in three months. Write the three most likely reasons.', 'For each reason, write one thing you could do now to reduce the risk.'], lesson: 'Lesson 2: Mode Activation & Mental Control' },
    integrated: { mode: 'Integrated', title: 'Run one decision through all four modes', minutes: 10,
      steps: ['Pick one real decision. Write what you know and what is missing (Analytical).', 'Write the signals and concerns you may be overlooking (Intuitive).', 'List at least three options (Associative), then the main risks and assumptions behind each (Reflective).', 'Finish with one sentence: what will we do, and who owns it?'], lesson: 'Lesson 3: Synthesis & Decision Mastery', decision: true },
  };
  function teamBand(total) { return total <= 17 ? 'Integrated' : total <= 28 ? 'Moderate fragmentation' : total <= 40 ? 'High fragmentation' : 'Critical fragmentation'; }
  function recommendPractice(r) {
    if (!r || !r.ok) return { state: 'unavailable' };
    if (!r.unlocked) return { state: 'insufficient', completed: r.completed || 0, threshold: r.threshold };
    const total = Number(r.avg_total), d = r.avg_dimensions || {};
    const modes = ['analytical', 'intuitive', 'associative', 'reflective'];
    const vals = modes.map((k) => Number(d[k]));
    if (!isFinite(total) || vals.some((v) => !isFinite(v))) return { state: 'general', kind: 'integrated', practice: PRACTICES.integrated, reason: 'Team results do not yet include enough detail to point to one thinking mode, so this is a general practice.' };
    const band = teamBand(total);
    if (band === 'High fragmentation' || band === 'Critical fragmentation')
      return { state: 'ready', kind: 'integrated', practice: PRACTICES.integrated, reason: 'Your team average falls in the "' + plainBand(band) + '" range on the CFI, so the priority is getting the four ways of thinking to work together.' };
    const round1 = (v) => Math.round(v * 10) / 10;
    const top = Math.max.apply(null, vals.map(round1));
    const leaders = modes.filter((k, i) => round1(vals[i]) === top);
    if (leaders.length !== 1) return { state: 'general', kind: 'integrated', practice: PRACTICES.integrated, reason: 'No single way of thinking stands out in your team results, so this is a general practice.' };
    return { state: 'ready', kind: leaders[0], practice: PRACTICES[leaders[0]], reason: 'Of the four ways of thinking, ' + MODE_NAME[leaders[0]] + ' has the highest team average fragmentation score (higher means more scattered).' };
  }

  function PracticeCard({ org, go, setView, compact }) {
    const [r, setR] = useState(null);
    const [open, setOpen] = useState(false);
    useEffect(() => { let live = true; setR(null); rpc('org_team_results', { p_org: org.id }).then((x) => { if (live) setR(x); }); return () => { live = false; }; }, [org.id]);
    const wrap = (kids) => h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Your team\u2019s recommended practice'), kids);
    if (!r) return wrap(h('div', { style: { color: C.muted, fontSize: 16 }, role: 'status' }, 'Loading...'));
    const rec = recommendPractice(r);
    const general = PRACTICES.integrated;
    let intro;
    if (rec.state === 'insufficient') intro = 'Team-specific recommendations appear once ' + rec.threshold + ' people have completed the assessment (' + rec.completed + ' so far). Until then, here is a general practice.';
    else if (rec.state === 'unavailable') intro = 'Team results are not available to your role right now, so here is a general practice.';
    else if (rec.state === 'general') intro = rec.reason;
    else intro = 'Your team\u2019s current development priority is ' + (rec.kind === 'integrated' ? 'Integrated Thinking' : MODE_NAME[rec.kind] + ' Thinking') + '. ' + rec.reason;
    const p = rec.practice || general;
    return wrap(h('div', null,
      h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 12 } }, intro),
      h('div', { style: { ...syne, fontSize: 20, fontWeight: 800, marginBottom: 4 } }, p.title),
      h('div', { style: { fontSize: 15, color: C.muted, marginBottom: 14 } }, 'Time required: ' + p.minutes + ' minutes'),
      compact && !open ? h(Btn, { onClick: () => go('practice'), style: { padding: '10px 18px', fontSize: 14 } }, 'START PRACTICE') : null,
      !compact && !open ? h(Btn, { onClick: () => { setOpen(true); track('practice_started', { organisation_id: org.id, kind: rec.kind || 'general' }); }, style: { padding: '10px 18px', fontSize: 14 } }, 'START PRACTICE') : null,
      open ? h('div', null,
        h('ol', { style: { paddingLeft: 20, margin: '0 0 14px', fontSize: 16, lineHeight: 1.8 } }, p.steps.map((s, i) => h('li', { key: i }, s))),
        h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
          h(Btn, { variant: 'ghost', onClick: () => go('programme'), style: { padding: '10px 18px', fontSize: 14 } }, 'OPEN RELATED LESSON'),
          p.decision ? h(Btn, { onClick: () => startTeamDecision(org, setView), style: { padding: '10px 18px', fontSize: 14 } }, 'START A TEAM DECISION') : null),
        h('div', { style: { fontSize: 14, color: C.muted, marginTop: 10 } }, 'Related lesson: ' + p.lesson + '. Practice completion is not tracked; lesson progress is tracked in Training.')) : null));
  }

  function ChallengeCard({ org, role, go, compact }) {
    const [d, setD] = useState(null);
    const [f, setF] = useState({ ans_analytical: '', ans_intuitive: '', ans_associative: '', ans_reflective: '', option: null, reasoning: '' });
    const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null);
    const lead = role === 'owner' || role === 'admin';
    const load = () => rpc('org_current_challenge', { p_org: org.id }).then(setD);
    useEffect(() => { let live = true; setD(null); rpc('org_current_challenge', { p_org: org.id }).then((x) => { if (live) setD(x); }); return () => { live = false; }; }, [org.id]);
    const wrap = (kids) => h('div', { id: 'nf-challenge', style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'This week\u2019s thinking challenge'), kids);
    if (!d) return wrap(h('div', { style: { color: C.muted, fontSize: 16 }, role: 'status' }, 'Loading...'));
    if (!d.ok) return wrap(h('div', { role: 'alert' },
      h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 12 } }, lead && d.error === 'request_failed' ? 'The weekly challenge is not enabled on the database yet. Run migration_team_practice_loop.sql in the Supabase SQL editor, then reload.' : 'The weekly challenge is not available right now.'),
      h(Btn, { variant: 'ghost', onClick: () => { setD(null); load(); }, style: { padding: '10px 18px', fontSize: 14 } }, 'TRY AGAIN')));
    const c = d.challenge;
    if (!c) return wrap(h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7 } }, 'There is no challenge this week. A new one appears here as soon as it is published.'));
    const mine = d.my_response;
    const title = h('div', { style: { ...syne, fontSize: 20, fontWeight: 800, marginBottom: 8 } }, c.title);
    if (compact) return wrap(h('div', null, title,
      h('div', { style: { fontSize: 16, color: mine ? AC.success : C.muted, marginBottom: 14 } }, mine ? 'You submitted on ' + fmtDate(mine.submitted_at) + '.' : 'About ' + c.time_minutes + ' minutes. You have not submitted yet.'),
      h(Btn, { onClick: () => go('practice'), variant: mine ? 'ghost' : undefined, style: { padding: '10px 18px', fontSize: 14 } }, mine ? 'VIEW YOUR RESPONSE' : 'OPEN CHALLENGE')));
    const scenario = h('div', null, title, h('div', { style: { fontSize: 17, lineHeight: 1.8, marginBottom: 6 } }, c.scenario), h('div', { style: { fontSize: 14, color: C.muted, marginBottom: 18 } }, 'About ' + c.time_minutes + ' minutes. Open until ' + fmtDate(c.ends_on) + '.'));
    const opts = Array.isArray(c.options) ? c.options : [];
    if (mine) return wrap(h('div', null, scenario,
      h(Msg, { m: msg }),
      h('div', { style: { fontSize: 16, color: AC.success, marginBottom: 12 } }, 'Submitted on ' + fmtDate(mine.submitted_at) + '. Only you can see your answers.'),
      CHALLENGE_MODES.filter((m) => mine[m[1]]).map((m) => h('div', { key: m[0], style: { marginBottom: 12 } }, h('div', { style: label }, m[3]), h('div', { style: { fontSize: 16, lineHeight: 1.7 } }, mine[m[1]]))),
      h('div', { style: label }, 'Your recommendation'), h('div', { style: { fontSize: 16, fontWeight: 700, marginBottom: 6 } }, opts[mine.chosen_option] != null ? String(opts[mine.chosen_option]) : ''),
      h('div', { style: { fontSize: 16, lineHeight: 1.7 } }, mine.reasoning)));
    const set = (k, v) => setF((x) => Object.assign({}, x, { [k]: v }));
    const submit = async () => {
      if (f.option == null) { setMsg({ type: 'error', text: 'Choose the action you recommend.' }); return; }
      if (!f.reasoning.trim()) { setMsg({ type: 'error', text: 'Explain your reasoning in a sentence or two.' }); return; }
      setBusy(true); setMsg(null);
      const r = await rpc('submit_challenge_response', { p_org: org.id, p_challenge: c.id, p_analytical: f.ans_analytical, p_intuitive: f.ans_intuitive, p_associative: f.ans_associative, p_reflective: f.ans_reflective, p_option: f.option, p_reasoning: f.reasoning });
      setBusy(false);
      if (r && r.ok) { track('challenge_submitted', { organisation_id: org.id }); setMsg({ type: 'ok', text: 'Saved. Thank you.' }); load(); }
      else if (r && r.error === 'already_submitted') { setMsg({ type: 'ok', text: 'You have already submitted this challenge.' }); load(); }
      else setMsg({ type: 'error', text: ERR[r && r.error] || 'Something went wrong. Please try again.' });
    };
    return wrap(h('div', null, scenario,
      CHALLENGE_MODES.map((m) => h('div', { key: m[0], style: { marginBottom: 14 } },
        h('label', { htmlFor: 'nfc-' + m[0], style: label }, m[3] + ' (optional)'),
        h('div', { style: { fontSize: 16, marginBottom: 6, lineHeight: 1.6 } }, c[m[2]]),
        h('textarea', { id: 'nfc-' + m[0], value: f[m[1]], maxLength: 2000, onChange: (e) => set(m[1], e.target.value), style: textareaStyle }))),
      h('div', { style: label }, 'Decision'),
      h('div', { style: { fontSize: 16, marginBottom: 8, lineHeight: 1.6 } }, c.decision_prompt),
      h('div', { role: 'radiogroup', style: { marginBottom: 12 } }, opts.map((o, i) => h('label', { key: i, style: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', marginBottom: 6, borderRadius: 12, cursor: 'pointer', fontSize: 16, lineHeight: 1.6, background: f.option === i ? AC.goldTint : '#FFFFFF', border: '2px solid ' + (f.option === i ? AC.goldDark : AC.border) } },
        h('input', { type: 'radio', name: 'nfc-option', checked: f.option === i, onChange: () => set('option', i), style: { marginTop: 3, width: 20, height: 20, accentColor: AC.goldDark, flex: '0 0 auto' } }), h('span', null, String(o))))),
      h('label', { htmlFor: 'nfc-reasoning', style: label }, 'Your reasoning'),
      h('textarea', { id: 'nfc-reasoning', value: f.reasoning, maxLength: 2000, onChange: (e) => set('reasoning', e.target.value), style: Object.assign({}, textareaStyle, { marginBottom: 12 }) }),
      h(Msg, { m: msg }),
      h(Btn, { onClick: submit, disabled: busy }, busy ? 'SAVING...' : 'SAVE MY RESPONSE'),
      h('div', { style: { fontSize: 14, color: C.muted, marginTop: 10 } }, 'You can submit once. Your answers are private to you; your team owner sees participation and the overall split of recommendations only.')));
  }

  function ChallengeSummary({ org }) {
    const [s, setS] = useState(null);
    const [tick, setTick] = useState(0);
    useEffect(() => { let live = true; setS(null); rpc('org_challenge_summary', { p_org: org.id }).then((x) => { if (live) setS(x); }); return () => { live = false; }; }, [org.id, tick]);
    const shell = (kids) => h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Team participation (owners and admins)'), kids);
    if (!s) return shell(h('div', { style: { color: C.muted, fontSize: 16 }, role: 'status' }, 'Loading...'));
    if (!s.ok) return shell(h('div', { role: 'alert' }, h('div', { style: { fontSize: 16, color: C.muted, marginBottom: 12 } }, 'Participation is not available right now.'), h(Btn, { variant: 'ghost', onClick: () => setTick((t) => t + 1), style: { padding: '10px 18px', fontSize: 14 } }, 'TRY AGAIN')));
    if (!s.challenge) return null;
    const dist = s.distribution || [];
    const used = dist.filter((x) => x.count > 0).length;
    return shell(h('div', null,
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(140px,100%),1fr))', gap: 14, marginBottom: 16 } },
        Stat('Eligible', s.eligible), Stat('Submitted', s.submitted), Stat('Participation', s.participation_pct + '%')),
      !s.unlocked ? h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7 } }, 'The split of recommendations appears once ' + s.threshold + ' people have submitted, which protects individuals. ' + s.submitted + ' so far.') :
      h('div', null, h('div', { style: label }, 'What the team recommended'),
        dist.map((x) => h('div', { key: x.option, style: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid ' + C.border, fontSize: 16 } }, h('span', null, x.label), h('span', { style: mono }, String(x.count)))),
        h('div', { style: { fontSize: 16, lineHeight: 1.7, marginTop: 12 } }, used > 1 ? 'The team is split across ' + used + ' options. Use the discussion to find out why people chose differently.' : 'Everyone who submitted chose the same option. Ask what could make that choice wrong.')),
      h('div', { style: { fontSize: 14, color: C.muted, marginTop: 12, lineHeight: 1.7 } }, 'Individual answers and written reasoning are never shown to you. Written answers are not analysed automatically: ask people to share their reasoning when you discuss the challenge as a team.')));
  }

  function DecisionEntry({ org, setView, compact }) {
    const [d, setD] = useState(null); const [open, setOpen] = useState(null);
    useEffect(() => { let live = true; setD(null); rpc('org_recent_decisions', { p_org: org.id, p_limit: compact ? 1 : 5 }).then((x) => { if (live) setD(x); }); return () => { live = false; }; }, [org.id, compact]);
    const list = d && d.ok ? (d.decisions || []) : [];
    return h('div', { style: card({ marginBottom: 20 }) },
      h('div', { style: label }, 'Decision room'),
      h('div', { style: { ...syne, fontSize: 20, fontWeight: 800, marginBottom: 6 } }, 'Have a real decision to make?'),
      h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 14 } }, 'Work through the decision with your team using NeuralFusion\u2019s structured thinking process: facts, signals, alternatives, reflection, then a decision.'),
      h(Btn, { onClick: () => startTeamDecision(org, setView) }, 'START A TEAM DECISION'),
      h('div', { style: { marginTop: 18 } },
        h('div', { style: label }, compact ? 'Most recent team decision' : 'Recent team decisions'),
        !d ? h('div', { style: { color: C.muted, fontSize: 16 }, role: 'status' }, 'Loading...') :
        !d.ok ? h('div', { style: { color: C.muted, fontSize: 15, lineHeight: 1.7 }, role: 'alert' }, 'Team decisions are not available right now.') :
        list.length === 0 ? h('div', { style: { color: C.muted, fontSize: 16, lineHeight: 1.7 } }, 'No team decisions saved yet. When you save one to the team it appears here.') :
        list.map((x) => h('div', { key: x.id, style: { padding: '10px 0', borderTop: '1px solid ' + C.border } },
          h('button', { onClick: () => setOpen(open === x.id ? null : x.id), 'aria-expanded': open === x.id, style: { all: 'unset', cursor: 'pointer', display: 'block', width: '100%', fontSize: 16, fontWeight: 700, lineHeight: 1.5, color: C.text } }, x.title || x.decision || 'Decision'),
          h('div', { style: { fontFamily: AC.font, fontSize: 15, color: C.muted, marginTop: 4 } }, cap(x.status || 'open') + ' \u00b7 ' + fmtDate(x.created_at) + (x.review_date ? ' \u00b7 review ' + fmtDate(x.review_date) : '')),
          open === x.id ? h('div', { style: { fontSize: 16, lineHeight: 1.7, marginTop: 8 } },
            x.next_action ? h('div', null, h('strong', null, 'Agreed action: '), x.next_action) : null,
            x.responsible ? h('div', null, h('strong', null, 'Responsible: '), x.responsible) : null,
            x.mine ? h('div', { style: { marginTop: 8 } }, h(Btn, { variant: 'ghost', onClick: () => setView('decisions'), style: { padding: '8px 14px', fontSize: 14 } }, 'OPEN IN MY DECISIONS')) : null) : null))));
  }

  function PracticeTab({ org, role, setView, go }) {
    const lead = role === 'owner' || role === 'admin';
    return h('div', null,
      h(ChallengeCard, { org, role, go }),
      lead ? h(ChallengeSummary, { org }) : null,
      h(PracticeCard, { org, go, setView }),
      h(DecisionEntry, { org, setView }));
  }
  function HomeCards({ org, role, go, setView }) {
    return h('div', null,
      h(ChallengeCard, { org, role, go, compact: true }),
      h(PracticeCard, { org, go, setView, compact: true }),
      h(DecisionEntry, { org, setView, compact: true }));
  }
  function TabBar({ tabs, tab, setTab }) {
    return h('div', { role: 'tablist', 'aria-label': 'Team sections', style: { display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' } }, tabs.map(([k, l]) => h('button', { key: k, type: 'button', role: 'tab', 'aria-selected': tab === k, className: 'nf-tab', onClick: () => setTab(k),
      style: { fontFamily: AC.font, fontSize: 16, fontWeight: 700, minHeight: 48, padding: '0 20px', cursor: 'pointer', borderRadius: 999, background: tab === k ? AC.goldTint : '#FFFFFF', color: tab === k ? AC.goldDark : AC.text, border: '1px solid ' + (tab === k ? AC.goldDark : AC.border) } }, l)));
  }

  function TeamHome({ org, ov, setView, go, role }) {
    return h('div', null,
      h(TeamLinkCard, { org, ov }),
      h(OrgJourney, { org, ov, role, setView, go }),
      h(HomeCards, { org, role, go, setView }),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 } },
        Stat('Seats', ov.seats.used + ' / ' + ov.seats.limit), Stat('Completed', ov.completed), Stat('Awaiting assessment', ov.awaiting_assessment), Stat('Completion rate', ov.completion_rate + '%')));
  }

  function Dashboard({ org, user, session, reload, setView }) {
    const [tab, setTab] = useState('home');
    const [ov, setOv] = useState(null);
    const refresh = async () => setOv(await rpc('org_overview', { p_org: org.id }));
    useEffect(() => { refresh(); }, [org.id]);
    const tabs = [['home', 'Home'], ['practice', 'Practice'], ['programme', 'Training'], ['results', 'Insights'], ['team', 'People'], ['billing', 'Plan and Seats']];
    if (!ov) return h('div', { style: { color: C.muted } }, 'Loading...');
    if (!ov.ok) return h(Msg, { m: { type: 'error', text: errText(ov) } });
    return h('div', null,
      h(TabBar, { tabs, tab, setTab }),
      tab === 'home' ? h(TeamHome, { org, ov, setView, go: setTab, role: ov.role }) : null,
      tab === 'practice' ? h(PracticeTab, { org, role: ov.role, setView, go: setTab }) : null,
      tab === 'results' ? h(ResultsTab, { org }) : null,
      tab === 'programme' ? h(ProgrammePanel, { key: org.id, org, role: ov.role, setView, onStart: () => startAssessment(org, setView) }) : null,
      tab === 'team' ? h(TeamTab, { org, role: ov.role, refresh }) : null,
      tab === 'billing' ? h(BillingTab, { org, ov }) : null);
  }

  const DIM_LABELS = { analytical: 'Analytical', intuitive: 'Intuitive', associative: 'Associative', reflective: 'Reflective', integration: 'Pressure and overload (single item)' };
  function ResultsTab({ org }) {
    const [r, setR] = useState(null);
    useEffect(() => { rpc('org_team_results', { p_org: org.id }).then((x) => { setR(x); if (x && x.unlocked) track('team_report_unlocked', { organisation_id: org.id }); }); }, [org.id]);
    if (!r) return h('div', { style: { color: C.muted } }, 'Loading...');
    if (!r.ok) return h(Msg, { m: { type: 'error', text: errText(r) } });
    if (!r.unlocked) return h('div', { style: card() }, h('div', { style: { ...syne, fontSize: 20, fontWeight: 800, marginBottom: 10 } }, 'Team results are not available yet'),
      h('div', { style: { color: C.muted, lineHeight: 1.7, fontSize: 16 } }, 'To protect individual privacy, aggregate insight appears once ' + r.threshold + ' people have completed the CFI. ' + r.completed + ' of ' + r.members + ' members have completed it so far.'));
    const dims = r.avg_dimensions || {};
    return h('div', null,
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 20 } },
        Stat('Team average CFI', r.avg_total, 'Scale 13 to 65. Higher means more scattered thinking.'), Stat('Completed', r.completed + ' of ' + r.members), Stat('Instrument', r.assessment_version)),
      h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Average fragmentation by way of thinking'),
        Object.keys(DIM_LABELS).map((k) => h('div', { key: k, style: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid ' + C.border, fontSize: 16 } }, h('span', null, DIM_LABELS[k]), h('span', { style: { ...mono, color: C.cyanBright } }, dims[k] == null ? 'n/a' : dims[k]))),
        h('div', { style: { fontSize: 14, color: C.muted, marginTop: 12, lineHeight: 1.6 } }, 'Values are average stored dimension scores from CFI-1.0. Higher means more scattered thinking in that area. These describe thinking patterns reported on the CFI, not personality, health or clinical status.')),
      h('div', { style: card() }, h('div', { style: label }, 'Band distribution'),
        Object.keys(r.bands || {}).length === 0 ? 'No data' : Object.keys(r.bands).map((b) => h('div', { key: b, style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 16 } }, h('span', null, plainBand(b)), h('span', { style: mono }, String(r.bands[b])))),
        h('div', { style: { fontSize: 14, color: C.muted, marginTop: 8 } }, 'Counts below 2 are hidden to protect individuals.')),
      h(TeamDevelopment, { org }));
  }

  // ── Team development over time (pre/post). Server contract: org_team_progress(p_org) ──
  // See ORG_TEAM_PROGRESS_SPEC.md. Until that function exists, rpc() returns { ok:false } and this card says
  // "not available right now" (it never invents numbers). All figures are aggregates over people who retook the CFI.
  // change = baseline - latest, the same sign convention as change: positive = LOWER fragmentation.
  const teamNum = (v) => (v === null || v === undefined || isNaN(Number(v))) ? '\u2013' : String(Math.round(Number(v) * 10) / 10);
  function TeamDevelopmentView({ r, onRetry }) {
    const shell = (kids) => h('div', { style: card({ marginTop: 20 }) }, h('div', { style: label }, 'Team development over time'), kids);
    if (!r) return shell(h('div', { style: { color: C.muted, fontSize: 16 }, role: 'status' }, 'Loading...'));
    if (!r.ok) return shell(h('div', { role: 'alert' },
      h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 12 } }, "The before-and-after comparison isn't available right now."),
      h(Btn, { variant: 'ghost', onClick: onRetry }, 'TRY AGAIN')));
    if (!r.unlocked) return shell(h('div', { style: { fontSize: 16, color: C.muted, lineHeight: 1.7 } },
      'To protect individual privacy, the comparison appears once ' + r.threshold + ' people have shared a retest. ' + (r.members_with_retest || 0) + ' so far. Members choose whether to share when they retake the CFI.'));
    const ch = Number(r.change);
    const meaning = ch > 0 ? 'Team change +' + teamNum(ch) + ': the team average is ' + teamNum(ch) + ' points lower than at the starting assessment, which indicates less fragmentation.'
      : ch < 0 ? 'Team change ' + teamNum(ch) + ': the team average is ' + teamNum(-ch) + ' points higher than at the starting assessment, which indicates more fragmentation on this measure.'
      : 'Team change 0: no change in the team average from the starting assessment.';
    const b = r.avg_dimensions_baseline || {}, l = r.avg_dimensions_latest || {};
    return shell([
      h('div', { key: 's', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: 14, marginBottom: 16 } },
        Stat('Starting average CFI', teamNum(r.avg_baseline_total), 'Scale 13 to 65'), Stat('Retest average CFI', teamNum(r.avg_latest_total), 'Scale 13 to 65'), Stat('People included', r.members_with_retest, 'Retook the CFI')),
      h('div', { key: 'm', style: { fontSize: 16, color: C.text, lineHeight: 1.8, marginBottom: 16 } }, meaning),
      h('div', { key: 'd', style: { marginBottom: 12 } }, Object.keys(DIM_LABELS).map((k) => h('div', { key: k, style: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid ' + C.border, fontSize: 16 } },
        h('span', null, DIM_LABELS[k]), h('span', { style: mono }, teamNum(b[k]) + ' \u2192 ' + teamNum(l[k]))))),
      h('div', { key: 'c', style: { fontSize: 15, color: C.muted, lineHeight: 1.7 } }, 'Only people who chose to share a retest are included, so this can differ from the whole team. It uses each person\u2019s first shared retest and updates only when a whole group of ' + (r.batch_size || r.threshold || 5) + ' more people has shared, which protects individuals. These are self-reported answers at two points in time: they show what changed, not what caused it. Mode scores are out of 100, and lower means better coordinated.'),
    ]);
  }
  function TeamDevelopment({ org }) {
    const [r, setR] = useState(null);
    const [tick, setTick] = useState(0);
    useEffect(() => { let live = true; setR(null); rpc('org_team_progress', { p_org: org.id }).then((x) => { if (live) setR(x); }); return () => { live = false; }; }, [org.id, tick]);
    return h(TeamDevelopmentView, { r, onRetry: () => setTick((t) => t + 1) });
  }

  function TeamTab({ org, role, refresh }) {
    const [data, setData] = useState(null); const [msg, setMsg] = useState(null);
    const load = async () => setData(await rpc('list_org_members', { p_org: org.id }));
    useEffect(() => { load(); }, [org.id]);
    const act = async (fn, args) => { const r = await rpc(fn, args); setMsg(r && r.ok ? { type: 'ok', text: 'Updated.' } : { type: 'error', text: errText(r) }); load(); refresh(); };
    return h('div', null, h(Msg, { m: msg }),
      h('div', { style: card() }, h('div', { style: label }, 'People'),
        !data || !data.members ? 'Loading...' : data.members.map((m) => h('div', { key: m.user_id, style: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '10px 0', borderBottom: '1px solid ' + C.border, flexWrap: 'wrap', alignItems: 'center', fontSize: 16 } },
          h('div', { style: { overflowWrap: 'anywhere', minWidth: 0 } }, m.email || 'Unknown email'),
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h('span', { style: pill(m.completed ? AC.success : AC.muted, m.completed ? AC.successTint : AC.surfaceAlt) }, m.completed ? 'Completed' : 'Not yet completed'),
            m.role === 'owner' ? h('span', { style: pill(AC.goldDark, AC.goldTint) }, 'Owner') :
            [role === 'owner' ? h('select', { key: 's', 'aria-label': 'Role for ' + (m.email || 'member'), value: m.role, onChange: (e) => act('set_member_role', { p_org: org.id, p_user: m.user_id, p_role: e.target.value }), style: Object.assign({}, inputStyle, { width: 'auto', padding: '6px 10px' }) }, ['participant', 'admin'].map((x) => h('option', { key: x, value: x }, cap(x)))) : h('span', { key: 'r', style: pill(AC.muted, AC.surfaceAlt) }, cap(m.role || 'participant')),
             (role === 'owner' || m.role === 'participant') ? h('button', { key: 'x', onClick: () => { if (window.confirm('Remove this member? Their seat is freed.')) act('remove_org_member', { p_org: org.id, p_user: m.user_id }); }, style: { fontFamily: AC.font, fontSize: 15, fontWeight: 700, background: '#FFFFFF', border: '1px solid #FCA5A5', color: AC.error, padding: '0 16px', minHeight: 44, borderRadius: 12, cursor: 'pointer' } }, 'Remove') : null]))),
        h('div', { style: { fontSize: 14, color: C.muted, marginTop: 12 } }, 'You see completion status only. Individual scores are never shown to team owners. To add people, share your team link from the Home tab.')));
  }

  function BillingTab({ org, ov }) {
    const row = (l, v) => h('div', { key: l, style: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid ' + C.border, fontSize: 16 } }, h('span', { style: { color: C.muted } }, l), h('span', null, v));
    const seatMail = 'mailto:' + FOUNDER_EMAIL + '?subject=' + encodeURIComponent('Seat request: ' + org.name) + '&body=' + encodeURIComponent('Organisation: ' + org.name + '\nSeats needed:\n');
    return h('div', null,
      h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Your plan'),
        row('Organisation', org.name), row('Plan', (ov.plan && ov.plan.name) || 'Team'), row('Seats', ov.seats.limit), row('Used seats', ov.seats.used), row('Remaining seats', ov.seats.remaining),
        row('Created', ov.purchase_date ? new Date(ov.purchase_date).toLocaleDateString() : 'n/a')),
      h(TeamPackages, { teamName: org.name }),
      h('div', { style: { fontSize: 15, color: C.muted, lineHeight: 1.7 } }, 'Already paid or need a different number of seats? ', h('a', { href: seatMail, style: { color: C.cyan } }, 'Email us'), ' with your team name and we will update your seat limit.'));
  }

  function ProgrammePanel({ org, role, setView, onStart }) {
    const useStyles = (window.NF_TRAINING && window.NF_TRAINING.useTeamStyles) || function () {};
    useStyles();
    const [st, setSt] = useState(null); const [sum, setSum] = useState(null); const [msg, setMsg] = useState(null);
    const [seatLimit, setSeatLimit] = useState(null);
    const lead = role === 'owner' || role === 'admin';
    const loadSum = () => rpc('org_programme_summary', { p_org: org.id }).then(setSum);
    useEffect(() => { rpc('org_programme_state', { p_org: org.id }).then(setSt); if (lead) loadSum(); rpc('org_overview', { p_org: org.id }).then((o) => { if (o && o.ok && o.seats && o.seats.limit != null) setSeatLimit(Number(o.seats.limit)); }); }, [org.id]);
    const ENT = window.NF_TRAINING;
    const wrap = (kids) => h('div', { style: { marginTop: 8 } }, h('div', { style: Object.assign({}, eyebrow, { marginBottom: 12 }) }, 'TRAINING PROGRAMME'), kids);
    if (!ENT) return null;
    if (!st) return wrap(h('div', { style: { color: C.muted } }, 'Loading...'));
    if (!st.ok) return wrap(h(Msg, { m: { type: 'error', text: st.error === 'request_failed' ? 'Training is not enabled on the database yet. Run migration_unified_programme.sql.' : errText(st) } }));
    if (!st.unlocked) return wrap(h('div', { style: card({ maxWidth: 640 }) }, h('div', { style: { fontSize: 17, lineHeight: 1.8, marginBottom: 16 } }, 'The five-lesson training programme opens as soon as you complete the team assessment.'), onStart ? h(Btn, { onClick: onStart }, 'START ASSESSMENT') : null));
    const done = st.completed_lessons || [];
    const openCount = ENT.teamOpenLessons ? ENT.teamOpenLessons(seatLimit) : 5;
    const mark = async (n) => {
      setMsg(null);
      if (n > openCount) return;
      const r = await rpc('org_mark_lesson', { p_org: org.id, p_lesson: n });
      if (r && r.ok) { setSt((x) => Object.assign({}, x, { completed_lessons: Array.from(new Set((x.completed_lessons || []).concat([n]))).sort((a, b) => a - b) })); if (lead) loadSum(); }
      else setMsg({ type: 'error', text: errText(r) });
    };
    const sumBox = lead && sum ? h('div', { style: card({ marginBottom: 20 }) }, h('div', { style: label }, 'Team training progress'),
      sum.ok && sum.unlocked
        ? h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12 } }, (sum.lessons || []).map((l) => h('div', { key: l.num, style: { fontSize: 14, color: C.muted } }, h('div', { style: { ...syne, fontSize: 24, fontWeight: 800, color: C.cyanBright } }, l.completed == null ? 'under ' + sum.threshold : l.completed), 'Lesson ' + l.num + ' completed')))
        : h('div', { style: { fontSize: 15, color: C.muted, lineHeight: 1.7 } }, sum.ok ? (sum.started || 0) + ' people have started. Progress counts appear once ' + sum.threshold + ' have started, which protects individuals.' : 'Team progress is not available yet.')) : null;
    const retake = setView && done.length >= openCount ? h('div', { style: card({ marginTop: 20 }) }, h('div', { style: label }, 'Measure again'),
      h('div', { style: { fontSize: 16, lineHeight: 1.8, marginBottom: 14 } }, 'You have finished the programme. Take the test again to see your own change. After your result you can choose to share it, and your organisation only ever sees team averages.'),
      h(Btn, { onClick: () => setView('cfi') }, 'RETAKE THE CFI')) : null;
    return wrap(h('div', null,
      h('div', { style: { fontSize: 15, color: C.muted, marginBottom: 14 } }, done.length + ' of ' + openCount + ' open lessons completed' + (lead ? '. You can run these sessions with your team.' : '.')),
      sumBox, h(Msg, { m: msg }),
      h('div', { className: 'nf-team', style: { minHeight: 0, borderRadius: 16, overflow: 'hidden' } }, h(ENT.TeamProgrammeView, { session: { org: org.id }, done, onDone: mark, openCount, seatLimit })),
      retake));
  }

  function ParticipantPanel({ org, setView }) {
    const [ov, setOv] = useState(null);
    const [tab, setTab] = useState('home');
    useEffect(() => { rpc('org_overview', { p_org: org.id }).then(setOv); }, [org.id]);
    if (!ov) return h('div', { style: { color: C.muted } }, 'Loading...');
    if (!ov.ok) return h(Msg, { m: { type: 'error', text: errText(ov) } });
    return h('div', null,
      h(TabBar, { tabs: [['home', 'Home'], ['practice', 'Practice'], ['programme', 'Training']], tab, setTab }),
      tab === 'home' ? h('div', null, h(OrgJourney, { org, ov, role: org.role, setView, go: setTab }), h(HomeCards, { org, role: org.role, go: setTab, setView })) : null,
      tab === 'practice' ? h(PracticeTab, { org, role: org.role, setView, go: setTab }) : null,
      tab === 'programme' ? h('div', { id: 'nf-train' }, h(ProgrammePanel, { org, role: org.role, setView, onStart: () => startAssessment(org, setView) })) : null,
      h('div', { style: { fontSize: 14, color: C.muted, marginTop: 16, lineHeight: 1.7 } }, org.name + ' sees aggregate team results and whether you have completed each step. Your individual answers and score are not shown to your organisation.'));
  }

  // ====================================================================
  // JOIN PAGE: the team link (auto-join, straight to assessment)
  // ====================================================================
  function JoinPage({ user, session, setShowAuth, openAuth, setView, onOrgsChanged }) {
    const [token] = useState(() => { try { return localStorage.getItem('nf_team_token'); } catch (_) { return null; } });
    const [pv, setPv] = useState(null); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
    const started = React.useRef(false);
    const dropToken = () => { try { localStorage.removeItem('nf_team_token'); } catch (_) {} };
    useEffect(() => {
      if (!token) { setPv({ ok: false, error: 'invalid_team_link' }); return; }
      rpc('get_team_join_preview', { p_token: token }).then((x) => { if (!x || !x.ok) { dropToken(); setPv({ ok: false, error: 'invalid_team_link' }); } else setPv(x); });
    }, [token]);
    const joinTeam = async () => {
      setBusy(true); setMsg(null);
      const r = await rpc('join_team_by_link', { p_token: token });
      setBusy(false);
      if (!r || !r.ok) { started.current = false; setMsg({ type: 'error', text: errText(r) }); return; }
      track('team_joined', { organisation_id: r.organisation_id });
      dropToken();
      try { sessionStorage.setItem('nf_active_org', r.organisation_id); } catch (_) {}
      if (onOrgsChanged) loadMyOrgs().then(onOrgsChanged);
      if (!r.already_member) startAssessment({ id: r.organisation_id }, setView); else setView('org');
    };
    useEffect(() => {
      if (!user || !session || !pv || !pv.ok || started.current) return;
      started.current = true; joinTeam();
    }, [user && user.id, session && session.access_token, pv]);
    if (!pv) return Shell(h('div', { style: { color: C.muted } }, 'Loading...'));
    if (!pv.ok) return Shell(h('div', { style: card({ maxWidth: 600, margin: '0 auto' }) }, h(Msg, { m: { type: 'error', text: errText(pv) } }), h(Btn, { variant: 'ghost', onClick: () => setView('home') }, 'GO HOME')));
    const orgName = pv.org_name;
    return Shell(h('div', { style: card({ maxWidth: 600, margin: '0 auto' }) },
      h('div', { style: Object.assign({}, eyebrow, { marginBottom: 12 }) }, 'JOIN YOUR TEAM'),
      h('div', { style: { ...syne, fontSize: 26, fontWeight: 800, marginBottom: 12 } }, orgName),
      h('div', { style: { fontSize: 17, lineHeight: 1.8, marginBottom: 16 } }, 'Take a 4 minute thinking assessment, then follow a short training programme with your team.'),
      h('div', { style: { fontSize: 15, color: C.muted, marginBottom: 20, lineHeight: 1.7 } }, orgName + ' sees aggregate team results and whether you completed each step. It does not see your individual answers or score.'),
      h(Msg, { m: msg }),
      user ? h(Btn, { onClick: joinTeam, disabled: busy }, busy ? 'JOINING...' : (msg ? 'TRY AGAIN' : 'JOIN NOW'))
           : h('div', { style: { display: 'flex', gap: 10, flexWrap: 'wrap' } },
               h(Btn, { onClick: () => (openAuth ? openAuth('signup') : setShowAuth(true)) }, 'CREATE FREE ACCOUNT TO JOIN'),
               h(Btn, { variant: 'ghost', onClick: () => (openAuth ? openAuth('login') : setShowAuth(true)) }, 'I HAVE AN ACCOUNT'))));
  }

  // ====================================================================
  // ADMIN > TEAMS: seats, on/off and report threshold (platform admin only;
  // enforced by RLS and each RPC's own is_admin check)
  // ====================================================================
  function AdminTeamsPanel({ onChanged }) {
    const [orgs, setOrgs] = useState(null); const [msg, setMsg] = useState(null); const [thr, setThr] = useState('5');
    const load = async () => {
      const r = await rpc('admin_list_organisations');
      if (r && r.ok && Array.isArray(r.organisations)) setOrgs(r.organisations);
      else { const { data } = await sb.from('organisations').select('*').order('created_at', { ascending: false }); setOrgs(data || []); }
      const t = await getPlatformSetting('org_min_report_threshold'); setThr(String(parseInt(t) || 5));
    };
    useEffect(() => { load(); }, []);
    const editSeats = async (o) => {
      const v = window.prompt('Seat limit for ' + o.name, String(o.seat_limit));
      if (v === null) return;
      const st = parseInt(v, 10);
      if (!(st >= 1 && st <= 100000)) { setMsg({ type: 'error', text: ERR.invalid_seats }); return; }
      const { data, error } = await sb.rpc('admin_set_org_seats', { p_org: o.id, p_seats: st });
      if (error) { console.error('[admin_set_org_seats]', error); setMsg({ type: 'error', text: ERR.server_error }); return; }
      if (!data || !data.ok) { setMsg({ type: 'error', text: errText(data) }); return; }
      setMsg({ type: 'ok', text: 'Seat limit updated.' }); load();
    };
    // Permanently deletes a team, its members/join link and every CFI result linked to the team.
    // Server-side: admin_delete_organisation (platform admin only). Requires typing the team name.
    const deleteTeam = async (o) => {
      const typed = window.prompt('This permanently deletes the team "' + o.name + '", its members and join link, and ALL CFI results linked to this team. This cannot be undone.\n\nType the team name to confirm:');
      if (typed === null) return;
      if (typed.trim() !== String(o.name).trim()) { setMsg({ type: 'error', text: 'Team name did not match. Nothing was deleted.' }); return; }
      const { data, error } = await sb.rpc('admin_delete_organisation', { p_org: o.id, p_delete_results: true });
      if (error) { console.error('[admin_delete_organisation]', error); setMsg({ type: 'error', text: ERR.server_error }); return; }
      if (!data || !data.ok) { setMsg({ type: 'error', text: errText(data) }); return; }
      const n = data.deleted_results != null ? data.deleted_results : 0;
      setMsg({ type: 'ok', text: 'Team deleted, with ' + n + ' CFI result' + (n === 1 ? '' : 's') + '.' });
      load(); if (typeof onChanged === 'function') onChanged();
    };
    const saveThreshold = async () => {
      const { error } = await sb.from('platform_settings').upsert({ key: 'org_min_report_threshold', value: Math.max(2, parseInt(thr) || 5) }, { onConflict: 'key' });
      setMsg(error ? { type: 'error', text: ERR.server_error } : { type: 'ok', text: 'Saved.' });
    };
    const cell = { padding: '8px 6px', fontSize: 14, borderBottom: '1px solid ' + C.border };
    const list = orgs || [];
    return h('div', { style: { marginBottom: 24 } }, h(Msg, { m: msg }),
      h('div', { style: card({ marginBottom: 20, overflowX: 'auto' }) }, h('div', { style: label }, 'Teams (' + list.length + ')'),
        orgs === null ? h('div', { style: { color: C.muted, fontSize: 15 } }, 'Loading...') :
        list.length === 0 ? h('div', { style: { color: C.muted, fontSize: 15 } }, 'No teams yet. Teams appear here as people create them.') :
        h('table', { style: { width: '100%', borderCollapse: 'collapse', color: C.text } }, h('thead', null, h('tr', null, ['Team', 'Owner', 'Seats used', 'Completed', 'Created', 'Seat limit', 'Active', 'Delete'].map((x) => h('th', { key: x, style: Object.assign({}, cell, { fontWeight: 700, color: C.muted, textAlign: 'left' }) }, x)))),
          h('tbody', null, list.map((o) => h('tr', { key: o.id },
            [o.name, o.owner_email || 'n/a', (o.active_members != null ? o.active_members : 'n/a') + ' / ' + o.seat_limit, o.completed != null ? o.completed : 'n/a', o.created_at ? new Date(o.created_at).toLocaleDateString() : 'n/a'].map((v, i) => h('td', { key: i, style: cell }, String(v))),
            h('td', { style: cell }, h('button', { onClick: () => editSeats(o), style: { fontFamily: AC.font, fontSize: 14, fontWeight: 700, background: '#FFFFFF', border: '1px solid ' + C.border, color: C.cyan, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' } }, 'Edit')),
            h('td', { style: cell }, h('button', { onClick: async () => { await rpc('admin_set_org_active', { p_org: o.id, p_active: !o.is_active }); load(); }, style: { fontFamily: AC.font, fontSize: 14, fontWeight: 700, background: '#FFFFFF', border: '1px solid ' + C.border, color: o.is_active ? AC.success : AC.error, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' } }, o.is_active ? 'On' : 'Off')),
            h('td', { style: cell }, h('button', { onClick: () => deleteTeam(o), style: { fontFamily: AC.font, fontSize: 14, fontWeight: 700, background: AC.errorTint, border: '1px solid #FCA5A5', color: AC.error, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' } }, 'Delete team'))))))),
      h('div', { style: card() }, h('div', { style: label }, 'Minimum completions before aggregate team results are shown'),
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } }, h('input', { type: 'number', min: 2, value: thr, onChange: (e) => setThr(e.target.value), style: Object.assign({}, inputStyle, { width: 120 }) }), h(Btn, { onClick: saveThreshold, style: { padding: '8px 16px' } }, 'SAVE'))));
  }

  // A render error in the portal must never blank the whole site: catch it and offer a reload.
  class PortalBoundary extends React.Component {
    constructor(p) { super(p); this.state = { failed: false }; }
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(e) { console.error('[NF_ORG render error]', e); }
    render() {
      if (!this.state.failed) return this.props.children;
      return Shell(h('div', { role: 'alert', style: card({ maxWidth: 600, margin: '0 auto', textAlign: 'center' }) },
        h('div', { style: Object.assign({}, eyebrow, { marginBottom: 12 }) }, 'Something went wrong'),
        h('p', { style: { fontSize: 18, lineHeight: 1.7, marginBottom: 20 } }, 'This page hit a problem. Your data is safe. Please reload and try again.'),
        h(Btn, { onClick: () => window.location.reload() }, 'Reload page')));
    }
  }
  const guard = (Comp) => function Guarded(props) { return h(PortalBoundary, null, h(Comp, props)); };
  // The admin screen shares the light CFI look; the teams panel renders directly on it.
  function AdminTeamsFrame(props) {
    useEffect(ensurePortalStyles, []);
    return h('div', { className: 'nf-portal', style: { background: 'transparent', color: AC.text, padding: 0, fontFamily: AC.font, minHeight: 0 } }, h(AdminTeamsPanel, { onChanged: props && props.onChanged }));
  }

  window.NF_ORG = { TeamsLanding: guard(TeamsLanding), OrgPortal: guard(OrgPortal), JoinPage: guard(JoinPage), AdminTeamsPanel: guard(AdminTeamsFrame), initialView, loadMyOrgs, afterCfiSaved, track, getDecisionContext, clearDecisionContext, recommendPractice };
})();

    // ═══ NEURALFUSION_ORG_MODULE_END ═══

    // Mount
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));

    // Hide splash
    window.addEventListener('load', ()=>{
      setTimeout(()=>{
        const s = document.getElementById('splash');
        if (s) { s.classList.add('hidden'); setTimeout(()=>s.remove(), 500); }
      }, 600);
    });

    // Service worker disabled for performance
