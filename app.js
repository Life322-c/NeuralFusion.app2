const { useState, useEffect, useCallback, useRef, useMemo } = React;

    // ── Supabase ──────────────────────────────────────────────────────
    const SUPABASE_URL  = "https://ckrxgbosyohcmjtemrvu.supabase.co";
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcnhnYm9zeW9oY21qdGVtcnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzYwNjgsImV4cCI6MjA5NDYxMjA2OH0.imuN5Z-nq_RE7uGckOnqUQgaNtDWT6eq_k2ibkEfq9c";
    const { createClient } = supabase;
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

    // ── Design Tokens: Gold × Navy ───────────────────────────────────
    const C = {
      void: '#050C1A', deep: '#071020', surface: '#0C1A30', panel: '#112240',
      border: 'rgba(196,160,80,0.15)', borderBright: 'rgba(196,160,80,0.35)',
      cyan: '#C4A050', cyanBright: '#E2BE78', cyanDim: 'rgba(196,160,80,0.08)',
      text: '#F5EDD8', muted: '#9A8A6A', dim: '#4A5A78',
      brains: {
        analytical: { color: '#C4A050', dim: 'rgba(196,160,80,0.12)',  label: 'Analytical Brain', code: 'A', symbol: '◰' },
        intuitive:  { color: '#E2BE78', dim: 'rgba(226,190,120,0.12)', label: 'Intuitive Brain',  code: 'I', symbol: '◱' },
        associative:{ color: '#7AAFCF', dim: 'rgba(122,175,207,0.12)', label: 'Associative Brain',code: 'S', symbol: '◲' },
        reflective: { color: '#D4AF6A', dim: 'rgba(212,175,106,0.12)', label: 'Reflective Brain', code: 'R', symbol: '◳' },
      }
    };

    // ── Admin Config ──────────────────────────────────────────────────
    // Admin access is enforced server-side via profiles.is_admin (Supabase RLS).
    // No credentials are stored in the client bundle.

    // ── Enterprise Config ─────────────────────────────────────────────
    const ENTERPRISE_PRICE_KOBO    = 5000000; // ₦50,000
    const ENTERPRISE_PRICE_DISPLAY = '50,000';

    const syne = { fontFamily: "'Syne', sans-serif" };
    const mono = { fontFamily: "'Space Mono', monospace" };
    const inter = { fontFamily: "'DM Sans', sans-serif" };

    // ── Four Brains Data ──────────────────────────────────────────────
    const FOUR_BRAINS = {
      analytical: {
        label: 'Analytical Brain', code: 'A', symbol: '◰', color: '#C4A050',
        tagline: 'Logic · Structure · Precision',
        description: 'The Analytical Brain processes information through systematic decomposition. It thrives on data, evidence, and logical frameworks, transforming complexity into structured certainty.',
        strengths: ['Logical deduction', 'Pattern verification', 'Data synthesis', 'Risk assessment', 'Systematic planning'],
        weaknesses: ['Analysis paralysis', 'Emotional disconnect', 'Rigidity under ambiguity', 'Overcomplication'],
        thinkingStyle: 'Sequential, evidence-based, framework-driven',
        decisionPattern: 'Evaluates all variables before committing. Seeks certainty. Can delay under incomplete information.',
        trainingFocus: 'Structured reasoning drills, logical sequencing, deductive exercises',
        profile: 'You are a builder of mental architecture. You need information organized before action. Your superpower is precision; your blind spot is forgetting that not everything can be quantified.',
      },
      intuitive: {
        label: 'Intuitive Brain', code: 'I', symbol: '◱', color: '#E2BE78',
        tagline: 'Pattern · Signal · Insight',
        description: 'The Intuitive Brain operates through rapid subconscious pattern recognition. It integrates vast experiential data into instantaneous knowing, bypassing conscious reasoning.',
        strengths: ['Rapid situational reads', 'Emotional intelligence', 'Implicit pattern detection', 'Holistic understanding'],
        weaknesses: ['Confirmation bias', 'Difficulty articulating reasoning', 'Inconsistency under logic pressure', 'Overthinking that kills the signal'],
        thinkingStyle: 'Holistic, non-linear, feeling-based, experience-driven',
        decisionPattern: 'Knows the answer before the analysis arrives. Commits quickly. Struggles to defend the why.',
        trainingFocus: 'Pattern recognition acceleration, signal vs noise calibration, intuitive accuracy logging',
        profile: 'You process reality faster than you can explain it. Your instincts carry compressed intelligence. The training challenge: learning to trust, verify, and communicate what your gut already knows.',
      },
      associative: {
        label: 'Associative Brain', code: 'S', symbol: '◲', color: '#7AAFCF',
        tagline: 'Connection · Synthesis · Creation',
        description: 'The Associative Brain generates meaning through cross-domain connection. It sees relationships invisible to linear thinkers, producing creative synthesis and breakthrough ideas.',
        strengths: ['Creative problem solving', 'Metaphorical thinking', 'Cross-domain insight', 'Innovation', 'Reframing'],
        weaknesses: ['Scattered focus', 'Over-ideation', 'Execution gaps', 'Difficulty with repetitive precision'],
        thinkingStyle: 'Lateral, divergent, metaphor-driven, connection-seeking',
        decisionPattern: 'Generates multiple solutions rapidly. Struggles to commit to one path. Needs structure to execute.',
        trainingFocus: 'Creative constraint exercises, idea compression, systematic divergence protocols',
        profile: 'Your mind is a connective tissue between ideas. You see things others miss entirely. The training challenge: transforming brilliant connections into executable precision.',
      },
      reflective: {
        label: 'Reflective Brain', code: 'R', symbol: '◳', color: '#D4AF6A',
        tagline: 'Awareness · Meaning · Integration',
        description: 'The Reflective Brain generates meta-cognitive awareness. It observes the thinking process itself, evaluating quality, extracting lessons, and integrating experience into wisdom.',
        strengths: ['Self-awareness', 'Learning acceleration', 'Emotional regulation', 'Long-term strategic thinking', 'Value alignment'],
        weaknesses: ['Rumination', 'Action delay', 'Excessive self-evaluation', 'Getting stuck in meaning-making'],
        thinkingStyle: 'Meta-cognitive, evaluative, meaning-seeking, integrative',
        decisionPattern: 'Processes decisions through the lens of values and long-term consequence. Wise but sometimes slow.',
        trainingFocus: 'Structured reflection protocols, rumination interruption, clarity journaling, pattern review',
        profile: 'You are the observer of your own mind. You see not just what happened, but why, and what it means. The training challenge: using reflection as a weapon, not a prison.',
      },
    };

    // ── CFI Assessment Items ──────────────────────────────────────────
    const CFI_ITEMS = [
      { id:1, dim:'A', brain:'analytical', text:'I struggle to organize thoughts into clear logical sequences under pressure.' },
      { id:2, dim:'A', brain:'analytical', text:'I find it difficult to isolate key facts before making complex decisions.' },
      { id:3, dim:'A', brain:'analytical', text:'My structured planning breaks down in ambiguous or high-stakes situations.' },
      { id:4, dim:'I', brain:'intuitive', text:'I frequently override gut instinct with logic, only to regret it later.' },
      { id:5, dim:'I', brain:'intuitive', text:'I distrust my pattern recognition in fast-moving, high-uncertainty situations.' },
      { id:6, dim:'I', brain:'intuitive', text:'My intuitive responses conflict with my conscious reasoning more often than not.' },
      { id:7, dim:'S', brain:'associative', text:'I struggle to generate creative alternatives when my primary approach fails.' },
      { id:8, dim:'S', brain:'associative', text:'I find it difficult to connect ideas across different domains of my life.' },
      { id:9, dim:'S', brain:'associative', text:'My creative thinking shuts down under time pressure or external judgment.' },
      { id:10, dim:'R', brain:'reflective', text:'I rarely evaluate my own thinking process after completing important tasks.' },
      { id:11, dim:'R', brain:'reflective', text:'Deep self-reflection tends to lead me into rumination rather than clarity.' },
      { id:12, dim:'R', brain:'reflective', text:'I find it hard to identify which thinking pattern caused a poor outcome.' },
      { id:13, dim:'E', brain:'analytical', text:'Under pressure, my thinking modes feel fragmented and hard to coordinate.' },
      { id:14, dim:'E', brain:'intuitive', text:'I experience cognitive fatigue when managing multiple competing priorities.' },
      { id:15, dim:'E', brain:'reflective', text:'I know what I should think, but rarely how to deliberately shift thinking modes.' },
    ];

    // ── Lesson Data ───────────────────────────────────────────────────
    const LESSONS = [
      { id:1, title:'Foundation of Integrated Cognition', sub:'Understand the Four Brains. Begin control.', level:'Foundation', free:true, duration:'12 min', brain:'all' },
      { id:2, title:'Brain Mode Activation & Switching', sub:'Enter and exit thinking modes deliberately.', level:'Intermediate', free:false, duration:'15 min', brain:'analytical' },
      { id:3, title:'Synthesis & Decision Architecture', sub:'Convert cognitive fragmentation into unified decisions.', level:'Intermediate', free:false, duration:'18 min', brain:'associative' },
      { id:4, title:'Cognitive Stabilization Under Pressure', sub:'Maintain mental clarity when urgency strikes.', level:'Advanced', free:false, duration:'20 min', brain:'reflective' },
      { id:5, title:'Cognitive Fluency Installation', sub:'From deliberate effort to automatic integration.', level:'Mastery', free:false, duration:'16 min', brain:'intuitive' },
    ];

    const LESSON_CONTENT = {
      1: { pages: [
        { title: 'What is NeuralFusion™?', body: 'NeuralFusion™ is a cognitive performance operating system: not a productivity tool, not a wellness app, not a personality framework.\n\nIt is a structured system for training how you think.\n\nMost people have never been taught the mechanics of thinking itself. They have been taught what to think. They have been taught facts, beliefs, and behaviors. But not the cognitive architecture that produces them.\n\nNeuralFusion™ changes that.' },
        { title: 'The Four Brains Framework', body: 'Every human being operates through four fundamental thinking modes. These are not personality types; they are cognitive instruments:\n\n◰ ANALYTICAL BRAIN: Logic, structure, evidence, precision\n◱ INTUITIVE BRAIN: Pattern recognition, signal, gut intelligence\n◲ ASSOCIATIVE BRAIN: Creative connection, synthesis, lateral expansion\n◳ REFLECTIVE BRAIN: Meta-cognition, meaning, self-awareness\n\nMost people are dominated by one or two modes and barely activate the others. This is cognitive fragmentation, and it is the source of most poor thinking.' },
        { title: 'The Integration Protocol', body: 'NeuralFusion™ trains you to deliberately activate all four brains in sequence:\n\n1. DECOMPOSE: Analytical Brain activates. Break the problem into precise parts.\n2. SENSE: Intuitive Brain activates. Read the signal beneath the data.\n3. EXPAND: Associative Brain activates. Generate connections and alternatives.\n4. REFLECT: Reflective Brain activates. Evaluate and synthesize.\n5. FUSE: All four outputs integrate into a unified cognitive position.\n\nThis is the Core Loop. With training, it completes in under 90 seconds.' },
        { title: 'First Activation Exercise', body: 'Select a real situation you are currently navigating.\n\nActivate each brain deliberately:\n\n◰ ANALYTICAL: State the situation as pure fact. No interpretation. No emotion. Just structure.\n◱ INTUITIVE: Pause. What does your gut signal? What feels true before analysis arrives?\n◲ ASSOCIATIVE: What else is this connected to? What pattern have you seen before? What alternative frame exists?\n◳ REFLECTIVE: What does this reveal about your thinking? What assumption is operating below the surface?\n\nWrite one sentence for each brain. Observe what emerges when all four speak.' },
      ]},
      2: { pages: [
        { title: 'The Architecture of Mental Control', body: 'Mental control is not suppression. It is not forced calm. It is not discipline over thought.\n\nMental control is the ability to choose which brain is operating at any given moment.\n\nMost people have no access to this choice. Their brains switch automatically, driven by emotion, habit, urgency, and fear. NeuralFusion™ installs the switch.\n\nYou do not control what happens. You control which cognitive mode processes it.' },
        { title: 'Brain Mode Entry Signals', body: 'Each brain has a deliberate activation protocol:\n\n◰ ANALYTICAL ENTRY: Ask, "What are the verifiable facts here?"\nThis collapses emotion and engages structural processing.\n\n◱ INTUITIVE ENTRY: Pause for 3 seconds. Ask, "What does my body signal?"\nThis quiets logic noise and allows pattern data to surface.\n\n◲ ASSOCIATIVE ENTRY: Ask, "What does this remind me of? What else is this?"\nThis triggers lateral thinking and cross-domain connection.\n\n◳ REFLECTIVE ENTRY: Ask, "What does this reveal about my thinking?"\nThis activates meta-cognition and recursive self-evaluation.' },
        { title: 'The Mode Switching Drill', body: 'Exercise: Deliberate Mode Cycling (8 minutes)\n\nChoose a current challenge.\n\nSet a 90-second timer for each brain:\n◰ 90 sec → List only facts. No judgment.\n◱ 90 sec → Write your gut signal. No editing.\n◲ 90 sec → Write 3 unexpected connections or alternatives.\n◳ 90 sec → Write one honest observation about your own thinking.\n\nThen synthesize: write one sentence that integrates all four outputs.\n\nThis is cognitive mode training. Repeat daily for 14 days.' },
        { title: 'Emergency Cognitive Reset', body: 'When mental state becomes overwhelmed:\n\n1. IDENTIFY: Which brain is currently dominating? (Usually Intuitive under fear, or Analytical under stress)\n2. NAME IT: "I am in Analytical overdrive."\n3. SWITCH: Deliberately activate Reflective Brain: "What is one thing I can observe about this moment?"\n4. RETURN: From Reflective, you can consciously choose the next mode.\n\nThe reset protocol takes under 60 seconds.\n\nKey insight: The goal is not to eliminate any brain mode. Every mode has intelligence. The goal is to choose, not react.' },
      ]},
      3: { pages: [
        { title: 'Why Decisions Fragment', body: 'Most people make poor decisions not because they lack intelligence, but because their four brains are arguing.\n\nAnalytical says: "The data is unclear. Wait."\nIntuitive says: "Something feels wrong. Do not commit."\nAssociative says: "There is another option. Keep exploring."\nReflective says: "This does not align with your values."\n\nFour brains. Zero synthesis. No decision.\n\nNeuralFusion™ does not ask you to silence any brain. It trains you to integrate them into a single, unified cognitive position.' },
        { title: 'The Synthesis Framework', body: 'After running all four brain modes, synthesis follows a precise sequence:\n\n1. EXTRACT: Identify the primary output from each brain. One sentence per mode.\n2. IDENTIFY CONFLICT: Where do the outputs contradict? Name it explicitly.\n3. RESOLVE CONFLICT: Which brain has the most relevant information for THIS decision? Grant it temporary authority.\n4. COMPRESS: Reduce all four outputs into one unified position. This is your synthesis.\n5. LOCK: Commit mentally to the synthesis. Stop reprocessing.\n\nThis is the Commitment Lock. Once activated, re-analysis requires new data, not old doubt.' },
        { title: 'Recognizing Cognitive Loops', body: 'A cognitive loop occurs when you revisit a decision repeatedly without new information.\n\nSymptoms:\n· Returning to the same question multiple times\n· Feeling "something is off" without identifying what\n· Inability to commit despite having sufficient data\n· Mental exhaustion from circular thinking\n\nLoop Interruption Protocol:\n1. Name the loop: "I am in a decision loop about X"\n2. Identify the dominant brain: Which mode is generating the re-analysis?\n3. Perform a Reflective check: Is there actually new information? If no, lock the synthesis.\n4. Take one concrete action in the direction of the decision.' },
        { title: 'The Unified Decision Protocol', body: 'Practice:\n\nChoose one decision you have been circling.\n\nRun each brain:\n◰ Facts only: what do I know for certain?\n◱ Gut signal: what does my instinct say, independent of logic?\n◲ Connections: what alternative frame or option have I not fully considered?\n◳ Reflection: what does my hesitation reveal about my values or assumptions?\n\nWrite one synthesis sentence: "Based on the integration of all four cognitive inputs, my position is: ____"\n\nActivate the Commitment Lock. Take one action within 10 minutes. Clarity becomes real through action, not more thinking.' },
      ]},
      4: { pages: [
        { title: 'Why Cognition Collapses Under Pressure', body: 'Pressure activates the threat-detection system of the brain, which prioritizes speed over accuracy, emotion over analysis, and habit over deliberation.\n\nThe cognitive result:\n· One brain dominates completely (usually Intuitive under fear)\n· All other modes go offline\n· Fragmented output masquerades as decision-making\n· Regret follows\n\nNeuralFusion™ does not remove pressure. It trains the nervous system to maintain multi-brain integration while under it. Pressure is not the enemy. Fragmentation is.' },
        { title: 'The Three Cognitive Stabilizers', body: '1. COGNITIVE ANCHOR\nA short internal declaration that grounds the synthesis.\nExamples: "I have already processed this." / "My analysis is complete."\nThis prevents the Analytical Brain from reopening resolved questions.\n\n2. TEMPORAL COMPRESSION\nPressure distorts time perception. Reduce the frame: "What matters in the next 10 minutes?"\nThis collapses decision space to what is actionable and immediate.\n\n3. DOMINANT MODE REGULATION\nIdentify which brain has hijacked the process. Name it. Consciously reduce its influence. This is not suppression; it is recalibration.\n\nAll three can be deployed in under 30 seconds.' },
        { title: 'High-Pressure Stabilization Drill', body: 'Exercise: Pressure Integration Training (10 minutes)\n\n1. Recall a recent high-pressure moment where your thinking fragmented\n2. Identify the dominant brain at the time\n3. Replay the situation, this time deploying all four brains:\n   · What were the verifiable facts? (Analytical)\n   · What was your gut signaling that you may have overridden? (Intuitive)\n   · What alternative response existed? (Associative)\n   · What did the moment reveal about your default patterns? (Reflective)\n4. Write a one-sentence stabilized synthesis\n5. Notice: the pressure does not change; only the integration quality does\n\nRepeat this drill with increasing pressure scenarios weekly.' },
        { title: 'Long-Term Pressure Immunity', body: 'Cognitive pressure immunity is not built through motivation. It is built through repetition.\n\nThe stabilization protocol must become reflexive, deployed automatically before conscious choice is required.\n\nSigns of developing immunity:\n· Noticing brain fragmentation as it begins rather than after it happens\n· Deploying anchors automatically in conflict\n· Feeling the pressure but maintaining integrated cognition\n· Recovering to synthesis 40-60% faster than baseline\n\nThis is the training objective of Lesson Four. It is not a mindset shift; it is a neurological upgrade through structured practice.\n\nYou cannot think your way to pressure immunity. You must practice your way there.' },
      ]},
      5: { pages: [
        { title: 'The Definition of Cognitive Fluency', body: 'Cognitive Fluency is the state in which integrated four-brain thinking becomes automatic.\n\nIt is not about thinking harder. It is not about thinking faster. It is about thinking without friction, where the Core Loop activates below conscious awareness, where synthesis happens before deliberate effort begins.\n\nElite performers in every domain share one cognitive signature: they do not appear to think. They appear to know. This is not magic. It is fluency: the end state of structured cognitive training.\n\nNeuralFusion™ Lesson Five initiates the installation of this state.' },
        { title: 'From Deliberate to Automatic', body: 'All cognitive skills pass through the same developmental arc:\n\nSTAGE 1: CONSCIOUS INCOMPETENCE\nYou do not know that your thinking is fragmented.\n\nSTAGE 2: CONSCIOUS COMPETENCE\nYou deliberately apply the four-brain protocol.\n\nSTAGE 3: AUTOMATIC COMPETENCE\nThe integration happens without deliberate activation.\n\nSTAGE 4: COGNITIVE FLUENCY\nThe system runs so smoothly you forget it was ever trained.\n\nLessons 1–4 built Stage 2. This lesson initiates Stage 3–4.' },
        { title: 'The One-Word Activation Protocol', body: 'Cognitive fluency is anchored by a single internal trigger word: FUSE\n\nThis word, when used consistently, becomes a neural shortcut that activates:\n· Automatic decomposition\n· Relevant brain mode activation\n· Rapid synthesis\n· Instant stabilization\n\nInstallation process:\n1. Use the word internally before every decision, conversation, or challenge, regardless of size\n2. The first 21 days are deliberate (Stage 2)\n3. By day 28–35, activation begins to precede the conscious choice\n4. By day 42–60, fluency installs\n\nOne word. Consistent application. Permanent upgrade.' },
        { title: 'Cognitive Fluency Maintenance', body: 'You have completed NeuralFusion™ Core Training.\n\nWhat you now have:\n· Conceptual knowledge of the Four Brains Framework\n· Deliberate activation ability for all four cognitive modes\n· Integration and synthesis protocols\n· Pressure stabilization tools\n· The FUSE trigger for automatic deployment\n\nWhat maintenance looks like:\n· Daily FUSE activation on at least three real situations\n· Weekly CFI self-assessment to monitor fragmentation levels\n· Monthly reflection on cognitive growth patterns\n· Ongoing engagement with Cognitive Labs for advanced training\n\nThe platform continues to evolve. So should you.' },
      ]},
    };

    // ── Supabase Helpers ──────────────────────────────────────────────
    const getProfile = async (id) => { try { const {data} = await sb.from('profiles').select('*').eq('id',id).maybeSingle(); return data; } catch(_){ return null; } };
    const upsertProfile = async (id, u) => { try { await sb.from('profiles').upsert({id,...u},{onConflict:'id'}); } catch(_){} };
    const saveCFIResult = async (id, r, a) => await sb.from('cfi_results').insert({user_id:id, total_score:r.total, band:r.band, dim_scores:r.dimScores, answers:a});
    const upsertLessonProgress = async (id, lid, p) => await sb.from('lesson_progress').upsert({user_id:id, lesson_id:lid, progress:p, completed:p===100},{onConflict:'user_id,lesson_id'});
    const loadLessonProgress = async (id) => {
      const {data} = await sb.from('lesson_progress').select('*').eq('user_id',id);
      const map = {}; (data||[]).forEach(r=>{map[r.lesson_id]=r.progress;}); return map;
    };
    // Platform settings helpers
    const getPlatformSetting = async (key) => {
      try { const {data} = await sb.from('platform_settings').select('value,text_value').eq('key',key).maybeSingle(); return data?.text_value ?? data?.value ?? null; } catch(_){ return null; }
    };
    const setPlatformSetting = async (key, value) => {
      try { await sb.from('platform_settings').upsert({key, value},{onConflict:'key'}); } catch(_){}
    };
    const setTextSetting = async (key, text_value) => {
      try { await sb.from('platform_settings').upsert({key, text_value},{onConflict:'key'}); } catch(_){}
    };
    // Enterprise results helpers
    const saveEnterpriseResult = async (result) => {
      try {
        await sb.from('enterprise_results').upsert({
          pid: result.pid,
          cohort: result.cohort,
          phase: result.phase,
          group_label: result.group || null,
          composite: result.composite,
          dims: result.dims,
          responses: result.responses,
          entered_by: result.enteredBy || 'participant',
          recorded_at: new Date(result.ts).toISOString(),
        }, { onConflict: 'pid,cohort,phase' });
      } catch(_){}
    };
    const loadEnterpriseResults = async (cohort) => {
      try {
        const {data} = await sb.from('enterprise_results').select('*').eq('cohort', cohort);
        return (data||[]).map(r=>({
          pid: r.pid, cohort: r.cohort, phase: r.phase, group: r.group_label,
          composite: r.composite, dims: r.dims, responses: r.responses,
          enteredBy: r.entered_by, ts: new Date(r.recorded_at).getTime(),
        }));
      } catch(_){ return []; }
    };

    // ── NEURAL VISUAL ─────────────────────────────────────────────────
    function NeuralOrb({ size=120, color='#C4A050', animated=true }) {
      return (
        React.createElement("div", {style: { width:size, height:size, position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}, React.createElement("div", {style: {
            position:'absolute', inset:0, borderRadius:'50%',
            border:`1px solid ${color}22`,
            animation: animated ? 'rotate 12s linear infinite' : 'none',
          }}), React.createElement("div", {style: {
            position:'absolute', inset:8, borderRadius:'50%',
            border:`1px dashed ${color}33`,
            animation: animated ? 'counterRotate 8s linear infinite' : 'none',
          }}), React.createElement("div", {style: {
            width:size*0.4, height:size*0.4, borderRadius:'50%',
            background:`radial-gradient(circle, ${color}20 0%, transparent 70%)`,
            border:`1px solid ${color}44`,
            display:'flex', alignItems:'center', justifyContent:'center',
            animation: animated ? 'neuralPulse 3s ease-in-out infinite' : 'none',
            boxShadow:`0 0 ${size/3}px ${color}20`,
          }}, React.createElement("div", {style: { fontFamily:"'Space Mono'", fontSize:size/8, color, opacity:0.9 }}, '◈')), [0,90,180,270].map((deg,i)=>(
            React.createElement("div", {key: i, style: {
              position:'absolute', width:6, height:6, borderRadius:'50%',
              background:color, opacity:0.6,
              top: '50%', left: '50%',
              transformOrigin:'0 0',
              transform:`rotate(${deg}deg) translateX(${size/2-3}px)`,
              animation: animated ? `rotate ${8+i}s linear infinite` : 'none',
              boxShadow:`0 0 8px ${color}`,
            }})
          )))
      );
    }

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
    function BrainCard({ brainKey, compact=false, onClick, active=false }) {
      const brain = FOUR_BRAINS[brainKey];
      const b = C.brains[brainKey];
      return (
        React.createElement("div", {onClick: onClick, style: {
          background: active ? `${b.color}12` : C.surface,
          border: `1px solid ${active ? b.color+'44' : C.border}`,
          borderRadius:4, padding: compact ? '16px' : '24px',
          cursor: onClick ? 'pointer' : 'default',
          transition:'all 0.25s ease',
          position:'relative', overflow:'hidden',
        }, onMouseEnter: e=>{if(onClick){e.currentTarget.style.borderColor=b.color+'66'; e.currentTarget.style.background=b.color+'10';}}, onMouseLeave: e=>{if(onClick && !active){e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.surface;}}}, React.createElement("div", {style: { display:'flex', alignItems:compact?'center':'flex-start', gap:16 }}, React.createElement("div", {style: {
              width:compact?36:48, height:compact?36:48, borderRadius:'50%',
              background:`radial-gradient(circle, ${b.color}20, transparent)`,
              border:`1px solid ${b.color}33`,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
              fontSize:compact?16:20, color:b.color,
              fontFamily:"'Space Mono'",
            }}, b.symbol), React.createElement("div", {style: {flex:1}}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:b.color, marginBottom:4 }}, 'BRAIN:', b.code), React.createElement("div", {style: { ...syne, fontSize:compact?15:18, fontWeight:700, color:C.text, marginBottom:compact?0:8, overflowWrap:'break-word', minWidth:0}}, brain.label), !compact && React.createElement("div", {style: { fontSize:12, color:C.muted, lineHeight:1.5 }}, brain.tagline))), !compact && (
            React.createElement("div", {style: { marginTop:16, fontSize:13, color:C.muted, lineHeight:1.7 }}, brain.description.slice(0,140), '...')
          ), active && React.createElement("div", {style: { position:'absolute', top:0, left:0, width:2, height:'100%', background:b.color }}))
      );
    }

    // ── PROGRESS RING ─────────────────────────────────────────────────
    function ProgressRing({ value=70, size=80, color='#C4A050', label='' }) {
      const r = (size-8)/2;
      const circ = 2*Math.PI*r;
      const dash = (value/100)*circ;
      return (
        React.createElement("div", {style: { position:'relative', width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center' }}, React.createElement("svg", {width: size, height: size, style: {position:'absolute', transform:'rotate(-90deg)'}}, React.createElement("circle", {cx: size/2, cy: size/2, r: r, fill: "none", stroke: `${color}15`, strokeWidth: 2}), React.createElement("circle", {cx: size/2, cy: size/2, r: r, fill: "none", stroke: color, strokeWidth: 2, strokeDasharray: `${dash} ${circ}`, strokeLinecap: "round", style: { transition:'stroke-dasharray 1s ease' }})), React.createElement("div", {style: { textAlign:'center' }}, React.createElement("div", {style: { ...syne, fontSize:size/5, fontWeight:800, color, overflowWrap:'break-word', minWidth:0}}, value, '%'), label && React.createElement("div", {style: { ...mono, fontSize:7, letterSpacing:1, color:C.muted, marginTop:2 }}, label)))
      );
    }

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
              .upsert({ id: uid, full_name: name.trim(), is_pro: false }, { onConflict: 'id' });
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
        signup:          { title:'Create account',       sub:'Start your cognitive training.' },
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
                }}, 'Forgot password?')))), tab==='signup' && (React.createElement(React.Fragment, null, React.createElement("div", {style: { marginBottom:14 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Full name'), React.createElement("input", {value: name, onChange: e=>setName(e.target.value), placeholder: "Your name"})), React.createElement("div", {style: { marginBottom:14 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Email'), React.createElement("input", {type: "email", value: email, onChange: e=>setEmail(e.target.value), placeholder: "you@example.com"})), React.createElement("div", {style: { marginBottom:24 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Password'), React.createElement("input", {type: "password", value: password, onChange: e=>setPassword(e.target.value), placeholder: "••••••••", onKeyDown: e=>e.key==='Enter'&&handleSignup()})))), tab==='forgot-password' && (React.createElement(React.Fragment, null, React.createElement("div", {style: { marginBottom:24 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Email'), React.createElement("input", {type: "email", value: email, onChange: e=>setEmail(e.target.value), placeholder: "you@example.com", onKeyDown: e=>e.key==='Enter'&&handleForgotPassword()})))), tab==='update-password' && (React.createElement(React.Fragment, null, React.createElement("div", {style: { marginBottom:14 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'New password'), React.createElement("input", {type: "password", value: password, onChange: e=>setPassword(e.target.value), placeholder: "••••••••"})), React.createElement("div", {style: { marginBottom:24 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Confirm password'), React.createElement("input", {type: "password", value: confirmPassword, onChange: e=>setConfirmPassword(e.target.value), placeholder: "••••••••", onKeyDown: e=>e.key==='Enter'&&handleUpdatePassword()})))), msg.text && (
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
    function Navbar({ view, setView, user, profile, setShowAuth, onSignOut, authLoading }) {
      const [menuOpen, setMenuOpen] = useState(false);
      const navItems = [
        { v:'four-brains', label:'Architecture' },
        { v:'lessons', label:'Academy' },
        { v:'training', label:'Protocols' },
        { v:'cfi', label:'Assess' },
        { v:'analytics', label:'Analytics' },
        { v:'enterprise', label:'Enterprise' },
        { v:'about', label:'About' },
        ...(profile?.is_admin === true ? [{ v:'admin', label:'⚙ Admin' }] : []),
      ];
      const blogHref = 'blog/index.html';

      return (
        React.createElement(React.Fragment, null, React.createElement("nav", {style: {
            position:'fixed', top:0, left:0, right:0, zIndex:100,
            background:'rgba(5,12,26,0.85)', backdropFilter:'blur(20px)',
            borderBottom:`1px solid ${C.border}`,
          }}, React.createElement("div", {style: { maxWidth:1280, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}, React.createElement("button", {onClick: ()=>setView('home'), style: { background:'none', border:'none', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}, React.createElement("div", {style: {
                  width:32, height:32, borderRadius:'50%', border:`1px solid ${C.cyan}44`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:`radial-gradient(circle, ${C.cyan}15, transparent)`,
                  ...mono, fontSize:14, color:C.cyan,
                }}, '◈'), React.createElement("div", null, React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:C.text, letterSpacing:1, overflowWrap:'break-word', minWidth:0}}, 'NeuralFusion™'), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, 'Cognitive OS'))), React.createElement("div", {className: "desktop-nav"}, navItems.map(item => (
                  React.createElement("button", {key: item.v, onClick: ()=>setView(item.v), style: {
                    background:'none', border:'none', padding:'8px 12px',
                    color: view===item.v ? C.cyan : C.muted,
                    ...inter, fontSize:12, fontWeight:view===item.v?600:400,
                    cursor:'pointer', transition:'color 0.2s',
                    borderBottom: view===item.v ? `1px solid ${C.cyan}` : '1px solid transparent',
                  }}, item.label)
                )), React.createElement("a", {href: blogHref, target: "_blank", rel: "noopener noreferrer", style: {
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
                  React.createElement("button", {className: "btn-primary desktop-only", style: { fontSize:10, padding:'10px 20px' }, onClick: ()=>setShowAuth(true)}, 'Sign in →')
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
                )), React.createElement("a", {href: blogHref, target: "_blank", rel: "noopener noreferrer", style: {
                  display:'flex', alignItems:'center', width:'100%', textAlign:'left',
                  borderBottom:`1px solid ${C.border}`,
                  padding:'18px 0', cursor:'pointer', textDecoration:'none',
                  animation:`fadeUp 0.3s ease ${navItems.length*0.05}s both`,
                }}, React.createElement("div", {style: { flex:1, ...syne, fontSize:14, fontWeight:700, color:C.text, overflowWrap:'break-word', minWidth:0}}, 'Blog'), React.createElement("div", {style: { ...mono, fontSize:10, color:C.muted }}, '↗'))), React.createElement("div", {style: {
                padding:'24px', borderTop:`1px solid ${C.border}`,
                animation:'fadeUp 0.35s ease 0.35s both',
              }}, user ? (
                  React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:12 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, 'Signed in as', user.email?.toUpperCase()), React.createElement("button", {className: "btn-outline", style: { width:'100%', fontSize:11, textAlign:'center' }, onClick: ()=>{ onSignOut(); setMenuOpen(false); }}, 'Sign out'))
                ) : (
                  React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:10 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:4 }}, 'Cognitive performance OS'), React.createElement("button", {className: "btn-primary", style: { width:'100%', fontSize:12, textAlign:'center' }, onClick: ()=>{ setShowAuth(true); setMenuOpen(false); }}, 'Sign in →'))
                )))
          ))
      );
    }

    // ── BOTTOM NAV ────────────────────────────────────────────────────
    function BottomNav({ view, setView }) {
      const items = [
        { v:'home', symbol:'⌂', label:'Home' },
        { v:'four-brains', symbol:'◈', label:'Brains' },
        { v:'cfi', symbol:'◎', label:'CFI' },
        { v:'training', symbol:'▲', label:'Protocols' },
        { v:'enterprise', symbol:'⬡', label:'Enterprise' },
      ];
      return (
        React.createElement("div", {className: "bottom-nav", style: {
          position:'fixed', bottom:0, left:0, right:0, zIndex:90,
          background:'rgba(5,12,26,0.95)', backdropFilter:'blur(20px)',
          borderTop:`1px solid ${C.border}`,
        }}, items.map(item => (
            React.createElement("button", {key: item.v, onClick: ()=>setView(item.v), style: {
              flex:1, padding:'10px 4px 14px', background:'none', border:'none',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer',
            }}, React.createElement("div", {style: { ...mono, fontSize:14, color:view===item.v?C.cyan:C.dim, transition:'color 0.2s' }}, item.symbol), React.createElement("div", {style: { ...inter, fontSize:9, letterSpacing:1, color:view===item.v?C.cyan:C.dim, fontWeight:view===item.v?600:400, transition:'color 0.2s' }}, item.label))
          )))
      );
    }


// ─────────────────────────────────────────────────────────────
//  BENTO HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Animated neural orb: shown in hero card */
function BentoNeuralOrb({ size = 120, color = '#C4A050', pulseColor }) {
  const pc = pulseColor || color;
  return (
    React.createElement("div", {style: { position:'relative', width:size, height:size, flexShrink:0 }}, [1,2,3].map(i => (
        React.createElement("div", {key: i, style: {
          position:'absolute', inset:0, borderRadius:'50%',
          border:`1px solid ${pc}`,
          opacity: 0,
          animation:`pulseRing ${1.6 + i*0.4}s ease-out ${i*0.4}s infinite`,
        }})
      )), React.createElement("div", {style: {
        position:'absolute', inset:0, borderRadius:'50%',
        border:`1px solid ${color}33`,
        boxShadow:`0 0 40px ${color}14`,
      }}), React.createElement("div", {style: {
        position:'absolute', inset:12, borderRadius:'50%',
        border:`1px solid ${color}22`,
        background:`radial-gradient(circle, ${color}08, transparent 70%)`,
      }}), React.createElement("div", {style: {
        position:'absolute', inset:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'Space Mono', monospace", fontSize:size/3,
        color,
        animation:'neuralPulse 3s ease-in-out infinite',
        textShadow:`0 0 20px ${color}`,
      }}, '◈'))
  );
}

/** Mini live-looking waveform strip */
function BentoWaveform({ color = '#C4A050', bars = 16, height = 32 }) {
  const heights = [0.3,0.7,0.5,0.9,0.4,0.8,0.6,1.0,0.5,0.7,0.3,0.85,0.6,0.4,0.75,0.5];
  return (
    React.createElement("div", {style: {
      display:'flex', alignItems:'flex-end', gap:3, height,
    }}, heights.slice(0, bars).map((h, i) => (
        React.createElement("div", {key: i, style: {
          flex:1, height:`${h*100}%`,
          background:`linear-gradient(180deg, ${color}, ${color}44)`,
          borderRadius:2,
          opacity: 0.6 + h * 0.4,
          animation:`neuralPulse ${1.2 + (i%4)*0.3}s ease-in-out ${(i%5)*0.1}s infinite`,
        }})
      )))
  );
}

/** A single stat chip for the metrics row */
function BentoStat({ label, value, color, icon }) {
  return (
    React.createElement("div", {style: {
      display:'flex', flexDirection:'column', gap:6,
      padding:'16px 20px',
      background:'rgba(10,22,40,0.5)',
      borderRadius:12,
      border:`1px solid rgba(255,255,255,0.05)`,
      backdropFilter:'blur(8px)',
      transition:'border-color 0.2s',
    }, onMouseEnter: e => e.currentTarget.style.borderColor=`${color}33`, onMouseLeave: e => e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'}, icon && (
        React.createElement("div", {style: {
          fontFamily:"'Space Mono', monospace",
          fontSize:15, color, marginBottom:2,
          textShadow:`0 0 12px ${color}88`,
        }}, icon)
      ), React.createElement("div", {style: {
        fontFamily:"'Space Mono', monospace",
        fontSize:11, letterSpacing:1, color:'#8A7A5A',
      }}, label), React.createElement("div", {style: {
        fontFamily:"'Syne', sans-serif",
        fontSize:15, fontWeight:800, color,
        lineHeight:1.2, letterSpacing:'-0.02em', overflowWrap:'break-word', minWidth:0}}, value))
  );
}

/** CFI Progress bars card content */
function BentoCFIBars({ data }) {
  return (
    React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:14 }}, data.map(({ label, pct, color }, i) => (
        React.createElement("div", {key: i}, React.createElement("div", {style: {
            display:'flex', justifyContent:'space-between', marginBottom:6,
          }}, React.createElement("div", {style: {
              fontFamily:"'DM Sans', sans-serif",
              fontSize:11, color:'#8A7A5A', letterSpacing:'0.01em',
            }}, label), React.createElement("div", {style: {
              fontFamily:"'Space Mono', monospace",
              fontSize:10, color,
            }}, pct)), React.createElement("div", {className: "bento-progress-track"}, React.createElement("div", {className: "bento-progress-fill", style: {
              width:`${pct}%`,
              background:`linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow:`0 0 8px ${color}44`,
              transitionDelay:`${i*0.08}s`,
            }})))
      )))
  );
}

/** Brain mode quad card: 2x2 grid */
function BentoBrainQuad({ setView }) {
  const brains = [
    { key:'analytical', symbol:'◰', label:'Analytical', color:'#C4A050', tagline:'Logic · Structure' },
    { key:'intuitive',  symbol:'◱', label:'Intuitive',  color:'#E2BE78', tagline:'Pattern · Signal' },
    { key:'associative',symbol:'◲', label:'Associative',color:'#7AAFCF', tagline:'Connection · Synthesis' },
    { key:'reflective', symbol:'◳', label:'Reflective', color:'#D4AF6A', tagline:'Awareness · Meaning' },
  ];
  return (
    React.createElement("div", {style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, height:'100%' }}, brains.map(b => (
        React.createElement("div", {key: b.key, onClick: () => setView('four-brains'), style: {
            padding:'16px 14px',
            borderRadius:12,
            background:`linear-gradient(135deg, ${b.color}10, rgba(10,22,40,0.6))`,
            border:`1px solid ${b.color}22`,
            cursor:'pointer',
            transition:'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            display:'flex', flexDirection:'column', gap:6,
          }, onMouseEnter: e => {
            e.currentTarget.style.borderColor = `${b.color}50`;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 8px 24px ${b.color}18`;
          }, onMouseLeave: e => {
            e.currentTarget.style.borderColor = `${b.color}22`;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}, React.createElement("div", {style: {
            fontFamily:"'Space Mono', monospace", fontSize:17, color:b.color,
            textShadow:`0 0 10px ${b.color}88`, lineHeight:1,
          }}, b.symbol), React.createElement("div", {style: {
            fontFamily:"'Syne', sans-serif",
            fontSize:12, fontWeight:700, color:'#F0E8D0', overflowWrap:'break-word', minWidth:0}}, b.label), React.createElement("div", {style: {
            fontFamily:"'DM Sans', sans-serif",
            fontSize:10, color:'#8A7A5A', lineHeight:1.4,
          }}, b.tagline))
      )))
  );
}

/** Step timeline for "How it works" card */
function BentoStepList({ steps, setView }) {
  return (
    React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:0 }}, steps.map((step, i) => (
        React.createElement("div", {key: i, onClick: () => setView(step.view), style: {
            display:'flex', gap:16, alignItems:'flex-start',
            padding:'14px 0',
            borderBottom: i < steps.length - 1 ? '1px solid rgba(196,160,80,0.06)' : 'none',
            cursor:'pointer',
            transition:'opacity 0.2s',
          }, onMouseEnter: e => e.currentTarget.style.opacity='0.75', onMouseLeave: e => e.currentTarget.style.opacity='1'}, React.createElement("div", {style: {
            flexShrink:0, width:28, height:28,
            borderRadius:8,
            background:'rgba(196,160,80,0.06)',
            border:'1px solid rgba(196,160,80,0.16)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'Space Mono', monospace",
            fontSize:9, color:'#C4A050', letterSpacing:1,
          }}, step.step), React.createElement("div", {style: { flex:1, minWidth:0 }}, React.createElement("div", {style: {
              fontFamily:"'Syne', sans-serif",
              fontSize:13, fontWeight:700, color:'#F0E8D0', marginBottom:3, overflowWrap:'break-word', minWidth:0}}, step.title), React.createElement("div", {style: {
              fontFamily:"'DM Sans', sans-serif",
              fontSize:11, color:'#8A7A5A', lineHeight:1.5,
            }}, step.desc)), React.createElement("div", {style: {
            flexShrink:0, fontSize:12, color:'rgba(196,160,80,0.3)',
            marginTop:6,
          }}, '→'))
      )))
  );
}

// ─────────────────────────────────────────────────────────────
//  HOME VIEW: BENTO GRID LAYOUT
// ─────────────────────────────────────────────────────────────
function HomeView({ setView, user, setShowAuth, cfiResult, lessonProgress, sessions }) {
  const completedLessons = Object.values(lessonProgress).filter(v => v === 100).length;
  const cogScore = cfiResult ? Math.max(0, 100 - cfiResult.total * 2) : null;

  const cfiSampleData = [
    { label:'Analytical Coherence',   pct:72, color:'#C4A050' },
    { label:'Intuitive Alignment',    pct:45, color:'#E2BE78' },
    { label:'Associative Flexibility',pct:88, color:'#7AAFCF' },
    { label:'Reflective Depth',       pct:61, color:'#D4AF6A' },
    { label:'Integration Stability',  pct:53, color:'#C4A050' },
  ];

  const steps = [
    { step:'01', title:'CFI assessment',      desc:'Map your cognitive fragmentation across five dimensions.', view:'cfi' },
    { step:'02', title:'Four Brains profile', desc:'Understand your dominant mode and blind spots.', view:'four-brains' },
    { step:'03', title:'Cognitive training',  desc:'Structured exercises for all four brain modes.', view:'training' },
    { step:'04', title:'Lesson manuals',      desc:'Structured training documents from foundation to mastery.', view:'lessons' },
    { step:'05', title:'Analytics',           desc:'Track reasoning consistency and brain mode balance.', view:'analytics' },
  ];

  /* ── Dashboard live metrics ───── */
  const dashMetrics = [
    { label:'Cognitive balance', value: cogScore ? `${cogScore}%` : '84%', sub:'Integrated score' },
    { label:'Decision pressure', value:'62%', sub:'Current load' },
    { label:'Reflection Depth',  value:'91%', sub:'Meta-awareness' },
    { label:'Focus Stability',   value:'77%', sub:'Sustained clarity' },
  ];

  /* ── Protocols list ───────────── */
  const protocols = [
    { icon:'◰', label:'ANALYTICAL', title:'Structure protocol', desc:'Decompose any situation into verifiable facts. Eliminate interpretation.', points:['Logical deduction drills','Pattern verification','Systematic planning'], color:'#C4A050' },
    { icon:'◱', label:'INTUITIVE',  title:'Signal protocol',    desc:'Accelerate pattern recognition. Separate genuine signal from fear-driven noise.', points:['Rapid situational reads','Signal calibration','Accuracy logging'], color:'#E2BE78' },
    { icon:'◲', label:'ASSOCIATIVE',title:'Synthesis protocol', desc:'Generate cross-domain connections. Transform divergence into executable precision.', points:['Creative constraint exercises','Idea compression','Divergence protocols'], color:'#7AAFCF' },
    { icon:'◳', label:'REFLECTIVE', title:'Awareness protocol', desc:'Activate meta-cognitive observation. Extract lessons from experience.', points:['Structured reflection','Rumination interruption','Clarity journaling'], color:'#D4AF6A' },
    { icon:'◈', label:'Integrated', title:'FUSE protocol',      desc:'Run all four brains in sequence. Complete the Core Loop in under 90 seconds.', points:['Full four-brain activation','Commitment lock','Fluency installation'], color:'#C4A050' },
    { icon:'◎', label:'PRESSURE',   title:'Stabilization protocol',      desc:'Maintain integrated cognition under pressure. Fragmentation is the enemy, not pressure.', points:['Cognitive anchoring','Temporal compression','Mode regulation'], color:'#E2BE78' },
  ];

  /* ── Evolution timeline ───────── */
  const timeline = [
    { step:'01', title:'Diagnose',   desc:'Take the CFI™. Identify your fragmentation band, dominant mode, and training priority.', view:'cfi' },
    { step:'02', title:'Understand', desc:'Study the Four Brains framework, the cognitive architecture you were never taught.', view:'four-brains' },
    { step:'03', title:'Train',      desc:'Run structured protocols. Activate modes deliberately. Build the Core Loop into reflex.', view:'training' },
    { step:'04', title:'Deepen',     desc:'Work through the lesson manuals. Each document is a transformation, not just information.', view:'lessons' },
    { step:'05', title:'Integrate',  desc:'FUSE becomes automatic. Four brains, one unified intelligence system.', view:'analytics' },
  ];

  return (
    React.createElement("div", {style: { paddingTop:80, paddingBottom:80, background:'var(--void)' }}, React.createElement("div", {style: {
        position:'fixed', top:0, left:'50%', transform:'translateX(-50%)',
        width:800, height:400,
        background:'radial-gradient(ellipse, rgba(196,160,80,0.05) 0%, transparent 70%)',
        pointerEvents:'none', zIndex:0,
      }}), React.createElement("div", {className: "bento-section", style: { position:'relative', zIndex:1 }}, React.createElement("div", {className: "bento-grid", style: { marginBottom:'var(--bento-gap-lg)' }}, React.createElement("div", {className: "bento-card bento-card-bright bento-p-xl bento-card-hero bento-col-7 bento-tab-2 bento-shimmer", style: { display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("div", {className: "bento-grid-lines"}), React.createElement("div", {className: "bento-noise"}), React.createElement("div", null, React.createElement("div", {style: { display:'flex', alignItems:'center', gap:10, marginBottom:16 }}, React.createElement("span", {className: "bento-tag"}, React.createElement("span", {className: "bento-tag-dot"}), 'Cognitive Architecture Platform')), React.createElement("h1", {style: {
                fontFamily:"'Syne', sans-serif",
                fontSize:'clamp(17px,1.6vw,22px)',
                fontWeight:800, lineHeight:1.0,
                color:'#F0E8D0',
                letterSpacing:'-0.02em',
                marginBottom:20,
                maxWidth:'16ch', overflowWrap:'break-word', minWidth:0}}, 'Turn Mental Fragmentation Into ', React.createElement("span", {style: {
                  color:'transparent',
                  backgroundClip:'text',
                  WebkitBackgroundClip:'text',
                  backgroundImage:'linear-gradient(135deg, #C4A050, #E2BE78)',
                }}, 'Structured Clarity.')), React.createElement("p", {style: {
                fontFamily:"'DM Sans', sans-serif",
                fontSize:14, color:'#8A7A5A', lineHeight:1.7,
                maxWidth:'52ch', marginBottom:24,
              }}, 'NeuralFusion™ is the operating system for structured human cognition: a premium mental performance environment for', ' ', React.createElement("strong", {style: { color:'#F0E8D0', fontWeight:600 }}, 'integrated thinking, decision mastery, synthesis training,'), ' ', 'and cognitive stabilization.'), React.createElement("div", {style: { display:'flex', gap:12, flexWrap:'wrap' }}, React.createElement("button", {className: "btn-primary", onClick: () => user ? setView('training') : setShowAuth(true)}, 'Initialize Cognitive OS →'), React.createElement("button", {className: "btn-outline", onClick: () => setView('four-brains')}, 'View Architecture'))), React.createElement("div", {style: { marginTop:32, opacity:0.5 }}, React.createElement(BentoWaveform, {color: "#C4A050", bars: 20, height: 28}))), React.createElement("div", {className: "bento-card bento-card-deep bento-p-md bento-card-hero bento-col-5 bento-tab-2", style: {
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              gap:24, textAlign:'center',
            }}, React.createElement("div", {className: "bento-dots"}), React.createElement("div", {style: { position:'relative', width:180, height:180 }}, React.createElement("div", {style: {
                position:'absolute', inset:0, borderRadius:'50%',
                border:'1px dashed rgba(196,160,80,0.15)',
                animation:'rotate 14s linear infinite',
              }}), React.createElement("div", {style: {
                position:'absolute', inset:20, borderRadius:'50%',
                border:'1px solid rgba(196,160,80,0.08)',
                animation:'counterRotate 9s linear infinite',
              }}), [
                { symbol:'◰', color:'#C4A050', angle:0,   label:'Logic' },
                { symbol:'◱', color:'#E2BE78', angle:90,  label:'Signal' },
                { symbol:'◲', color:'#7AAFCF', angle:180, label:'Synthesis' },
                { symbol:'◳', color:'#D4AF6A', angle:270, label:'Meaning' },
              ].map(({ symbol, color, angle, label }) => {
                const rad = angle * Math.PI / 180;
                const r = 78;
                const x = 90 + r * Math.cos(rad) - 14;
                const y = 90 + r * Math.sin(rad) - 14;
                return (
                  React.createElement("div", {key: angle, style: {
                    position:'absolute', left:x, top:y,
                    width:28, height:28, borderRadius:'50%',
                    background:`${color}18`, border:`1px solid ${color}44`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:"'Space Mono', monospace", fontSize:12, color,
                    textShadow:`0 0 8px ${color}`,
                  }}, symbol)
                );
              }), React.createElement("div", {style: {
                position:'absolute', inset:0,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:2,
              }}, React.createElement("div", {style: {
                  fontFamily:"'Syne', sans-serif",
                  fontSize:17, fontWeight:800, color:'#C4A050',
                  textShadow:'0 0 24px rgba(196,160,80,0.6)',
                  animation:'neuralPulse 2.5s ease-in-out infinite', overflowWrap:'break-word', minWidth:0}}, '◈'), React.createElement("div", {style: {
                  fontFamily:"'Space Mono', monospace",
                  fontSize:11, letterSpacing:1, color:'rgba(196,160,80,0.6)',
                }}, 'FUSE'))), React.createElement("div", null, React.createElement("div", {style: {
                fontFamily:"'Space Mono', monospace",
                fontSize:11, letterSpacing:1, color:'#8A7A5A', marginBottom:6,
              }}, 'Neural core'), React.createElement("div", {style: {
                fontFamily:"'Syne', sans-serif",
                fontSize:14, fontWeight:800, color:'#F0E8D0',
                marginBottom:6, letterSpacing:'-0.01em', overflowWrap:'break-word', minWidth:0}}, 'The core loop'), React.createElement("div", {style: {
                fontFamily:"'DM Sans', sans-serif",
                fontSize:11, color:'#8A7A5A', lineHeight:1.6,
                maxWidth:'26ch', margin:'0 auto 16px',
              }}, 'Decompose → Sense → Expand → Reflect → Fuse. Under 90 seconds with training.'), React.createElement("button", {className: "btn-outline", style: { fontSize:10 }, onClick: () => user ? setView('training') : setShowAuth(true)}, user ? 'Enter training →' : 'Create account →')))), user && cfiResult ? (
          React.createElement("div", {className: "bento-grid", style: { marginBottom:'var(--bento-gap-lg)' }}, [
              { label:'CFI band', value:cfiResult.band, color:cfiResult.band==='Integrated'?'#7AAFCF':'#C4A050', icon:'◎' },
              { label:'Lessons', value:`${completedLessons}/${5}`, color:'#C4A050', icon:'▦' },
              { label:'Sessions', value:sessions.length.toString()||'0', color:'#E2BE78', icon:'◱' },
              { label:'Dominant mode', value:cfiResult.dominantBrain?.slice(0,3).toUpperCase()||'N/A',
                color:({analytical:'#C4A050',intuitive:'#E2BE78',associative:'#7AAFCF',reflective:'#D4AF6A'})[cfiResult.dominantBrain]||'#C4A050',
                icon:({analytical:'◰',intuitive:'◱',associative:'◲',reflective:'◳'})[cfiResult.dominantBrain]||'◰',
              },
            ].map((stat, i) => (
              React.createElement("div", {key: i, className: "bento-card bento-p-md bento-col-3 bento-tab-1 bento-card-small bento-shimmer", style: { display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}, React.createElement("div", {style: {
                    fontFamily:"'Space Mono', monospace",
                    fontSize:11, letterSpacing:1, color:'#8A7A5A',
                  }}, stat.label), React.createElement("div", {style: {
                    fontFamily:"'Space Mono', monospace",
                    fontSize:14, color:stat.color, textShadow:`0 0 12px ${stat.color}66`,
                  }}, stat.icon)), React.createElement("div", {style: {
                  fontFamily:"'Syne', sans-serif",
                  fontSize:17, fontWeight:800, color:stat.color, lineHeight:1.2,
                  letterSpacing:'-0.02em', textShadow:`0 0 20px ${stat.color}44`,
                }}, stat.value))
            )))
        ) : (
          React.createElement("div", {className: "bento-grid", style: { marginBottom:'var(--bento-gap-lg)' }}, [
              { num:'94%', label:'of people have never been taught how to think deliberately', color:'#C4A050' },
              { num:'4',   label:'distinct brain modes every human uses; most activate only 1–2', color:'#E2BE78' },
              { num:'<90s',label:'to run the complete Core Loop with NeuralFusion™ training', color:'#7AAFCF' },
              { num:'5×',  label:'increase in decision quality after full four-brain integration', color:'#D4AF6A' },
            ].map((s, i) => (
              React.createElement("div", {key: i, className: "bento-card bento-p-md bento-col-3 bento-tab-1 bento-card-small bento-shimmer", style: { display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("div", {style: {
                  fontFamily:"'Syne', sans-serif", fontSize:40, fontWeight:800,
                  color:s.color, lineHeight:1.2, letterSpacing:'-0.02em',
                  textShadow:`0 0 30px ${s.color}44`, marginBottom:12,
                }}, s.num), React.createElement("div", {style: {
                  fontFamily:"'DM Sans', sans-serif", fontSize:12, color:'#8A7A5A', lineHeight:1.5,
                }}, s.label))
            )))
        ), React.createElement("div", {style: { marginBottom:'var(--bento-gap-lg)' }}, React.createElement("div", {className: "bento-section-header"}, React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:11, letterSpacing:1, color:'#C4A050', marginBottom:12 }}, 'Cognitive command center'), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:'clamp(14px,1.3vw,17px)', fontWeight:800, color:'#F0E8D0', letterSpacing:'-0.02em', lineHeight:1.1, marginBottom:12, overflowWrap:'break-word', minWidth:0}}, 'Your live cognition dashboard'), React.createElement("p", {style: { fontFamily:"'DM Sans', sans-serif", fontSize:14, color:'#8A7A5A', lineHeight:1.8, maxWidth:'60ch' }}, 'Track fragmentation, synthesis, pressure stability, and integrated thinking performance in real time.')), React.createElement("div", {className: "bento-grid"}, React.createElement("div", {className: "bento-card bento-card-bright bento-p-lg bento-card-large bento-col-8 bento-tab-2", style: { display:'flex', flexDirection:'column' }}, React.createElement("div", {className: "bento-grid-lines"}), React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}, React.createElement("div", null, React.createElement("span", {className: "bento-label"}, 'Cognitive balance'), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:15, fontWeight:800, color:'#C4A050', lineHeight:1.2, letterSpacing:'-0.02em', overflowWrap:'break-word', minWidth:0}}, cogScore ? `${cogScore}%` : '84%')), React.createElement("div", {style: {
                  width:48, height:48, borderRadius:'50%',
                  background:'rgba(196,160,80,0.1)', border:'1px solid rgba(196,160,80,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:"'Space Mono', monospace", fontSize:15, color:'#C4A050',
                  animation:'neuralPulse 3s ease-in-out infinite',
                }}, '◈')), React.createElement("div", {style: { flex:1, minHeight:140, position:'relative' }}, React.createElement("svg", {viewBox: "0 0 800 140", fill: "none", style: { width:'100%', height:'100%' }}, React.createElement("defs", null, React.createElement("linearGradient", {id: "graphGrad", x1: "0", y1: "0", x2: "1", y2: "0"}, React.createElement("stop", {offset: "0%", stopColor: "#C4A050"}), React.createElement("stop", {offset: "100%", stopColor: "#E2BE78"})), React.createElement("linearGradient", {id: "areaGrad", x1: "0", y1: "0", x2: "0", y2: "1"}, React.createElement("stop", {offset: "0%", stopColor: "#C4A050", stopOpacity: "0.12"}), React.createElement("stop", {offset: "100%", stopColor: "#C4A050", stopOpacity: "0"}))), React.createElement("path", {d: "M0 110 C80 95 130 28 200 55 C270 80 320 125 400 75 C475 28 550 65 640 20 C710 0 760 28 800 18", fill: "none", stroke: "url(#graphGrad)", strokeWidth: "3", strokeLinecap: "round"}), React.createElement("path", {d: "M0 110 C80 95 130 28 200 55 C270 80 320 125 400 75 C475 28 550 65 640 20 C710 0 760 28 800 18 L800 140 L0 140 Z", fill: "url(#areaGrad)"}))), React.createElement("div", {style: { marginTop:16, opacity:0.4 }}, React.createElement(BentoWaveform, {color: "#C4A050", bars: 24, height: 24}))), React.createElement("div", {className: "bento-card bento-p-md bento-card-large bento-col-4 bento-tab-2", style: { display:'flex', flexDirection:'column', gap:16 }}, dashMetrics.map((m, i) => (
                React.createElement("div", {key: i}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}, React.createElement("div", {style: { fontFamily:"'DM Sans', sans-serif", fontSize:12, color:'#8A7A5A' }}, m.label), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:14, fontWeight:700, color:'#F0E8D0', overflowWrap:'break-word', minWidth:0}}, m.value)), React.createElement("div", {className: "bento-progress-track"}, React.createElement("div", {className: "bento-progress-fill", style: { width:m.value, transitionDelay:`${i*0.1}s` }})))
              ))), React.createElement("div", {className: "bento-card bento-card-deep bento-p-md bento-card-small bento-col-3 bento-tab-1", style: { display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("div", {className: "bento-dots"}), React.createElement("span", {className: "bento-label"}, 'Fragmentation'), React.createElement("div", {style: {
                flex:1, display:'flex', alignItems:'center', justifyContent:'center',
                minHeight:80,
              }}, React.createElement("div", {style: {
                  width:48, height:48, borderRadius:'50%',
                  background:'radial-gradient(circle, rgba(122,175,207,0.2), transparent)',
                  border:'1px solid rgba(122,175,207,0.3)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 0 30px rgba(122,175,207,0.3)',
                  animation:'neuralPulse 3s ease-in-out infinite',
                }}, React.createElement("div", {style: { width:10, height:10, borderRadius:'50%', background:'#7AAFCF', boxShadow:'0 0 12px #7AAFCF' }}))), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:15, fontWeight:800, color:'#7AAFCF', overflowWrap:'break-word', minWidth:0}}, 'Low')), React.createElement("div", {className: "bento-card bento-p-md bento-card-small bento-col-3 bento-tab-1", style: { display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("span", {className: "bento-label"}, 'Synthesis'), React.createElement("div", {style: { display:'flex', alignItems:'center', justifyContent:'center', flex:1, minHeight:80 }}, React.createElement("div", {style: { position:'relative', width:72, height:72 }}, React.createElement("svg", {width: "72", height: "72", style: { position:'absolute', transform:'rotate(-90deg)' }}, React.createElement("circle", {cx: "36", cy: "36", r: "30", fill: "none", stroke: "rgba(196,160,80,0.1)", strokeWidth: "5"}), React.createElement("circle", {cx: "36", cy: "36", r: "30", fill: "none", stroke: "#E2BE78", strokeWidth: "5", strokeLinecap: "round", strokeDasharray: "178", strokeDashoffset: "11", style: { filter:'drop-shadow(0 0 6px #E2BE7866)' }})), React.createElement("div", {style: {
                    position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:"'Syne', sans-serif", fontSize:14, fontWeight:800, color:'#E2BE78', overflowWrap:'break-word', minWidth:0}}, '94%'))), React.createElement("div", {style: { fontFamily:"'DM Sans', sans-serif", fontSize:11, color:'#8A7A5A' }}, 'Completion rate')), React.createElement("div", {className: "bento-card bento-p-md bento-card-small bento-col-3 bento-tab-1", style: { display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("span", {className: "bento-label"}, 'Active mode'), React.createElement("div", {style: {
                flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:80,
                fontFamily:"'Space Mono', monospace", fontSize:40, color:'#D4AF6A',
                textShadow:'0 0 20px rgba(212,175,106,0.5)',
                animation:'neuralPulse 3s ease-in-out infinite',
              }}, '◳'), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:14, fontWeight:700, color:'#F0E8D0', overflowWrap:'break-word', minWidth:0}}, 'Reflective')), React.createElement("div", {className: "bento-card bento-p-md bento-card-small bento-col-3 bento-tab-1", style: { display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("span", {className: "bento-label"}, 'Cognitive load'), React.createElement("div", {style: {
                flex:1, display:'flex', alignItems:'flex-end', justifyContent:'center', gap:4, minHeight:80, paddingTop:12,
              }}, [0.4,0.7,0.5,0.9,0.6,0.8,0.45,0.75].map((h,i) => (
                  React.createElement("div", {key: i, style: {
                    width:8, height:`${h*64}px`,
                    background:`linear-gradient(180deg, #C4A050, rgba(196,160,80,0.3))`,
                    borderRadius:3,
                    animation:`neuralPulse ${1.2+i*0.15}s ease-in-out ${i*0.08}s infinite`,
                  }})
                ))), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:14, fontWeight:700, color:'#F0E8D0', overflowWrap:'break-word', minWidth:0}}, 'Moderate')))), React.createElement("div", {className: "bento-grid", style: { marginBottom:'var(--bento-gap-lg)' }}, React.createElement("div", {className: "bento-card bento-p-md bento-card-medium bento-col-4 bento-tab-2"}, React.createElement("div", {className: "bento-noise"}), React.createElement("span", {className: "bento-label"}, 'Four Brains framework'), React.createElement("div", {style: {
              fontFamily:"'Syne', sans-serif", fontSize:14, fontWeight:700, color:'#F0E8D0',
              marginBottom:16, lineHeight:1.2, overflowWrap:'break-word', minWidth:0}}, 'Every mind has four', React.createElement("br", null), 'cognitive instruments.'), React.createElement(BentoBrainQuad, {setView: setView})), React.createElement("div", {className: "bento-card bento-card-gold bento-p-md bento-card-medium bento-col-5 bento-tab-2", style: { display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("div", {style: {
              position:'absolute', top:0, left:0, right:0, height:1,
              background:'linear-gradient(90deg, transparent, rgba(196,160,80,0.4), transparent)',
              animation:'scanH 4s ease-in-out 1s infinite',
            }}), React.createElement("div", null, React.createElement("span", {className: "bento-label"}, 'CFI assessment system'), React.createElement("div", {style: {
                fontFamily:"'Syne', sans-serif", fontSize:15, fontWeight:800, color:'#F0E8D0',
                marginBottom:6, lineHeight:1.2, overflowWrap:'break-word', minWidth:0}}, 'Cognitive Fragmentation Index™'), React.createElement("div", {style: {
                fontFamily:"'DM Sans', sans-serif", fontSize:12, color:'#8A7A5A',
                marginBottom:18, lineHeight:1.5,
              }}, 'Precision diagnostic across five cognitive dimensions.'), React.createElement(BentoCFIBars, {data: cfiSampleData})), React.createElement("div", {style: { marginTop:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}, React.createElement("div", null, React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:11, letterSpacing:1, color:'#8A7A5A', marginBottom:4 }}, 'Sample · CFI band'), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:14, fontWeight:800, color:'#C4A050', overflowWrap:'break-word', minWidth:0}}, 'Moderate fragmentation')), React.createElement("button", {className: "btn-primary", style: { fontSize:10, padding:'10px 18px' }, onClick: () => setView('cfi')}, 'Begin CFI →'))), React.createElement("div", {className: "bento-card bento-card-deep bento-p-md bento-col-3 bento-tab-2 bento-card-medium", style: { display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("div", {className: "bento-dots"}), React.createElement("div", null, React.createElement("span", {className: "bento-label", style: { color:'#F87171' }}, 'The core problem'), React.createElement("div", {style: {
                fontFamily:"'Syne', sans-serif", fontSize:17, fontWeight:800,
                lineHeight:1.1, color:'#F0E8D0', letterSpacing:'-0.015em', marginBottom:12, overflowWrap:'break-word', minWidth:0}}, 'Fragmented', React.createElement("br", null), 'thinking is', ' ', React.createElement("span", {style: { color:'#F87171' }}, 'invisible.')), React.createElement("p", {style: {
                fontFamily:"'DM Sans', sans-serif", fontSize:12, color:'#8A7A5A',
                lineHeight:1.6, maxWidth:'none', marginBottom:0,
              }}, 'Most people rely on one or two brain modes and have never been trained to activate the others.')), React.createElement("button", {className: "btn-outline", style: { fontSize:10, marginTop:16, width:'100%', textAlign:'center' }, onClick: () => setView('four-brains')}, 'Discover your profile'))), React.createElement("div", {style: { marginBottom:'var(--bento-gap-lg)' }}, React.createElement("div", {className: "bento-section-header"}, React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:11, letterSpacing:1, color:'#C4A050', marginBottom:12 }}, 'Cognitive protocols'), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:'clamp(14px,1.3vw,17px)', fontWeight:800, color:'#F0E8D0', letterSpacing:'-0.02em', lineHeight:1.1, marginBottom:12, overflowWrap:'break-word', minWidth:0}}, 'Six protocols. One integrated system.'), React.createElement("p", {style: { fontFamily:"'DM Sans', sans-serif", fontSize:14, color:'#8A7A5A', lineHeight:1.8, maxWidth:'60ch' }}, 'Each protocol trains a distinct cognitive dimension. Together they build integrated thinking.')), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(280px,100%), 1fr))', gap:16 }}, protocols.map((p, i) => (
              React.createElement("div", {key: i, className: "bento-card bento-p-md", style: { position:'relative', overflow:'hidden', cursor:'pointer' }, onClick: () => setView(i < 4 ? 'four-brains' : i === 4 ? 'training' : 'cfi'), onMouseEnter: e => { e.currentTarget.style.borderColor=`${p.color}40`; e.currentTarget.style.transform='translateY(-3px)'; }, onMouseLeave: e => { e.currentTarget.style.borderColor='var(--glass-border)'; e.currentTarget.style.transform='translateY(0)'; }}, React.createElement("div", {style: {
                  position:'absolute', bottom:'-20%', right:'-10%',
                  width:120, height:120, borderRadius:'50%',
                  background:`radial-gradient(circle, ${p.color}12, transparent 70%)`,
                  pointerEvents:'none',
                }}), React.createElement("div", {style: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}, React.createElement("div", {style: {
                    fontFamily:"'Space Mono', monospace", fontSize:15, color:p.color,
                    textShadow:`0 0 16px ${p.color}66`,
                  }}, p.icon), React.createElement("div", {style: {
                    fontFamily:"'Space Mono', monospace", fontSize:11, letterSpacing:1,
                    color:p.color, padding:'4px 10px',
                    border:`1px solid ${p.color}22`,
                    borderRadius:100, background:`${p.color}08`,
                  }}, p.label)), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:17, fontWeight:700, color:'#F0E8D0', marginBottom:10, overflowWrap:'break-word', minWidth:0}}, p.title), React.createElement("div", {style: { fontFamily:"'DM Sans', sans-serif", fontSize:12, color:'#8A7A5A', lineHeight:1.7, marginBottom:16 }}, p.desc), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:6 }}, p.points.map((pt, j) => (
                    React.createElement("div", {key: j, style: { display:'flex', alignItems:'center', gap:10 }}, React.createElement("div", {style: { width:5, height:5, borderRadius:'50%', background:p.color, flexShrink:0, boxShadow:`0 0 6px ${p.color}` }}), React.createElement("div", {style: { fontFamily:"'DM Sans', sans-serif", fontSize:12, color:'#8A7A5A' }}, pt))
                  ))))
            )))), React.createElement("div", {style: { marginBottom:'var(--bento-gap-lg)' }}, React.createElement("div", {className: "bento-section-header"}, React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:11, letterSpacing:1, color:'#C4A050', marginBottom:12 }}, 'Cognitive evolution'), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:'clamp(14px,1.3vw,17px)', fontWeight:800, color:'#F0E8D0', letterSpacing:'-0.02em', lineHeight:1.1, overflowWrap:'break-word', minWidth:0}}, 'Your path to integrated thinking')), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(200px,100%), 1fr))', gap:14 }}, timeline.map((t, i) => (
              React.createElement("div", {key: i, className: "bento-card bento-p-md bento-card-large", style: { cursor:'pointer', position:'relative' }, onClick: () => setView(t.view), onMouseEnter: e => { e.currentTarget.style.borderColor='rgba(196,160,80,0.3)'; e.currentTarget.style.transform='translateY(-4px)'; }, onMouseLeave: e => { e.currentTarget.style.borderColor='var(--glass-border)'; e.currentTarget.style.transform='translateY(0)'; }}, React.createElement("div", {style: { marginBottom:16 }}, React.createElement("div", {style: { width:14, height:14, borderRadius:'50%', background:'#C4A050', boxShadow:'0 0 20px rgba(196,160,80,0.6)', marginBottom:12 }}), React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:11, letterSpacing:1, color:'rgba(196,160,80,0.5)', marginBottom:8 }}, 'Phase ', t.step)), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:14, fontWeight:800, color:'#F0E8D0', marginBottom:12, letterSpacing:'-0.01em', overflowWrap:'break-word', minWidth:0}}, t.title), React.createElement("div", {style: { fontFamily:"'DM Sans', sans-serif", fontSize:12, color:'#8A7A5A', lineHeight:1.7 }}, t.desc), React.createElement("div", {style: {
                  marginTop:20,
                  fontFamily:"'Space Mono', monospace", fontSize:9, color:'rgba(196,160,80,0.4)',
                }}, '→'))
            )))), React.createElement("div", {className: "bento-grid", style: { marginBottom:'var(--bento-gap-lg)' }}, React.createElement("div", {className: "bento-card bento-p-md bento-card-large bento-col-5 bento-tab-2"}, React.createElement("span", {className: "bento-label"}, 'The core protocol'), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:15, fontWeight:800, color:'#F0E8D0', marginBottom:4, lineHeight:1.2, overflowWrap:'break-word', minWidth:0}}, 'How the system trains you'), React.createElement("div", {style: { height:1, background:'rgba(196,160,80,0.08)', margin:'16px 0' }}), React.createElement(BentoStepList, {steps: steps, setView: setView})), React.createElement("div", {className: "bento-card bento-card-deep bento-p-lg bento-card-large bento-col-4 bento-tab-2", style: { display:'flex', flexDirection:'column', justifyContent:'center' }}, React.createElement("div", {style: {
              fontFamily:"'Space Mono', monospace", fontSize:15, color:'rgba(196,160,80,0.15)',
              lineHeight:1, marginBottom:16, letterSpacing:'-0.02em',
            }}, '"'), React.createElement("blockquote", {style: {
              fontFamily:"'Syne', sans-serif", fontSize:15, fontWeight:700, color:'#F0E8D0',
              lineHeight:1.45, letterSpacing:'-0.01em', marginBottom:20, fontStyle:'normal',
              maxWidth:'38ch', overflowWrap:'break-word', minWidth:0}}, 'You cannot think your way to performance. You must', ' ', React.createElement("span", {style: { color:'#C4A050' }}, 'train your way there.')), React.createElement("div", {style: { display:'flex', alignItems:'center', gap:12 }}, React.createElement("div", {style: {
                width:32, height:32, borderRadius:'50%',
                background:'linear-gradient(135deg, rgba(196,160,80,0.3), rgba(196,160,80,0.1))',
                border:'1px solid rgba(196,160,80,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:"'Space Mono', monospace", fontSize:14, color:'#C4A050',
              }}, '◈'), React.createElement("div", null, React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:12, fontWeight:700, color:'#F0E8D0', overflowWrap:'break-word', minWidth:0}}, 'Life Edet'), React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:9, letterSpacing:1, color:'#8A7A5A' }}, 'Creator · NeuralFusion™')))), React.createElement("div", {className: "bento-card bento-card-gold bento-p-md bento-card-large bento-col-3 bento-tab-2", style: { display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("div", {className: "bento-grid-lines"}), React.createElement("div", null, React.createElement("span", {className: "bento-label"}, 'The objective'), React.createElement("div", {style: {
                fontFamily:"'Syne', sans-serif", fontSize:14, fontWeight:800, color:'#F0E8D0',
                lineHeight:1.15, marginBottom:14, letterSpacing:'-0.015em', overflowWrap:'break-word', minWidth:0}}, 'This platform upgrades', ' ', React.createElement("span", {style: { color:'#C4A050' }}, 'human thinking.')), React.createElement("p", {style: {
                fontFamily:"'DM Sans', sans-serif",
                fontSize:12, color:'#8A7A5A', lineHeight:1.7, maxWidth:'none',
              }}, 'Not your attitude. Not your motivation. Not your mindset.', React.createElement("br", null), 'The actual', React.createElement("strong", {style: { color:'#F0E8D0' }}, 'cognitive architecture'), ' ', 'through which you process reality.')), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:10, marginTop:20 }}, user ? (
                React.createElement("button", {className: "btn-primary", style: { width:'100%', textAlign:'center' }, onClick: () => setView('training')}, 'Enter training system →')
              ) : (
                React.createElement(React.Fragment, null, React.createElement("button", {className: "btn-primary", style: { width:'100%', textAlign:'center' }, onClick: () => setShowAuth(true)}, 'Create account →'), React.createElement("button", {className: "btn-outline", style: { width:'100%', textAlign:'center' }, onClick: () => setView('cfi')}, 'Start CFI assessment'))
              )))), React.createElement("div", {className: "bento-grid"}, React.createElement("div", {className: "bento-card bento-card-gold bento-p-md bento-card-medium bento-col-6 bento-tab-2"}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}, React.createElement("div", null, React.createElement("span", {className: "bento-label"}, 'Lesson manuals'), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:14, fontWeight:800, color:'#F0E8D0', lineHeight:1.2, overflowWrap:'break-word', minWidth:0}}, '5 cognitive', React.createElement("br", null), 'training documents')), React.createElement("button", {className: "btn-outline", style: { fontSize:9, padding:'8px 14px', flexShrink:0 }, onClick: () => setView('lessons')}, 'View all →')), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:8 }}, [
                { num:'01', title:'Foundation of Integrated Cognition', level:'Foundation', free:true },
                { num:'02', title:'Brain Mode Activation & Switching',  level:'Intermediate', free:false },
                { num:'03', title:'Synthesis & Decision Architecture',   level:'Intermediate', free:false },
              ].map((l, i) => (
                React.createElement("div", {key: i, onClick: () => setView('lessons'), style: {
                  display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                  borderRadius:10, background:'rgba(10,22,40,0.4)', border:'1px solid rgba(196,160,80,0.08)',
                  cursor:'pointer', transition:'all 0.2s',
                }, onMouseEnter: e => { e.currentTarget.style.borderColor='rgba(196,160,80,0.22)'; e.currentTarget.style.background='rgba(196,160,80,0.05)'; }, onMouseLeave: e => { e.currentTarget.style.borderColor='rgba(196,160,80,0.08)'; e.currentTarget.style.background='rgba(10,22,40,0.4)'; }}, React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:9, color:'rgba(196,160,80,0.5)', flexShrink:0, width:20 }}, l.num), React.createElement("div", {style: { flex:1, minWidth:0 }}, React.createElement("div", {style: { fontFamily:"'DM Sans', sans-serif", fontSize:12, fontWeight:500, color:'#F0E8D0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}, l.title), React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:8, letterSpacing:1.5, color:'#8A7A5A' }}, l.level)), l.free ? (
                    React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:8, letterSpacing:1.5, color:'#7AAFCF', background:'rgba(122,175,207,0.1)', border:'1px solid rgba(122,175,207,0.2)', padding:'3px 8px', borderRadius:100 }}, 'Free')
                  ) : (
                    React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:8, letterSpacing:1.5, color:'rgba(196,160,80,0.5)', background:'rgba(196,160,80,0.06)', border:'1px solid rgba(196,160,80,0.12)', padding:'3px 8px', borderRadius:100 }}, 'Pro')
                  ))
              )))), React.createElement("div", {className: "bento-card bento-card-bright bento-p-xl bento-card-medium bento-col-6 bento-tab-2", style: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', position:'relative' }}, React.createElement("div", {className: "bento-grid-lines"}), React.createElement("div", {className: "bento-noise"}), React.createElement("div", {style: { position:'relative', zIndex:1 }}, React.createElement("div", {style: { fontFamily:"'Space Mono', monospace", fontSize:11, letterSpacing:1, color:'rgba(196,160,80,0.7)', marginBottom:16 }}, 'Begin your evolution'), React.createElement("div", {style: { fontFamily:"'Syne', sans-serif", fontSize:'clamp(14px,1.3vw,17px)', fontWeight:800, color:'#F0E8D0', letterSpacing:'-0.015em', lineHeight:1.05, marginBottom:16, overflowWrap:'break-word', minWidth:0}}, 'Your thinking is about to', ' ', React.createElement("span", {style: { color:'#C4A050' }}, 'change permanently.')), React.createElement("p", {style: { fontFamily:"'DM Sans', sans-serif", fontSize:13, color:'#8A7A5A', lineHeight:1.8, maxWidth:'44ch', margin:'0 auto 28px' }}, 'Start with the CFI to measure where your cognition stands, then begin the training system.'), React.createElement("div", {style: { display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}, React.createElement("button", {className: "btn-primary", onClick: () => setView('cfi')}, 'Begin CFI →'), React.createElement("button", {className: "btn-outline", onClick: () => setView('four-brains')}, 'Explore architecture')))))))
  );
}


    // ═══════════════════════════════════════════════════════════════════
    //  FOUR BRAINS VIEW
    // ═══════════════════════════════════════════════════════════════════
    function FourBrainsView({ setView, cfiResult }) {
      const [active, setActive] = useState('analytical');
      const brain = FOUR_BRAINS[active];
      const b = C.brains[active];

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:100 }}, React.createElement("div", {style: { maxWidth:1200, margin:'0 auto', padding:'40px 24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1.5, color:C.cyan, marginBottom:16 }}, 'Four Brains framework'), React.createElement("h1", {style: { ...syne, fontSize:14, fontWeight:800, color:C.text, marginBottom:16, lineHeight:1.05, overflowWrap:'break-word', minWidth:0}}, 'The architecture', React.createElement("br", null), 'of human thinking'), React.createElement("p", {style: { fontSize:15, color:C.muted, maxWidth:600, lineHeight:1.8, marginBottom:48 }}, 'Every mind operates through four cognitive modes. Most people have never been taught to identify them, let alone coordinate them.'), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap:12, marginBottom:48 }}, Object.keys(FOUR_BRAINS).map(key=>(
                React.createElement(BrainCard, {key: key, brainKey: key, compact: true, active: active===key, onClick: ()=>setActive(key)})
              ))), React.createElement("div", {key: active, style: { animation:'fadeUp 0.4s ease both' }}, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap:32, marginBottom:32 }}, React.createElement("div", {className: "card", style: { padding:'32px', position:'relative', overflow:'hidden', borderColor:`${b.color}22` }}, React.createElement("div", {style: { position:'absolute', top:0, left:0, width:2, height:'100%', background:b.color }}), React.createElement("div", {style: { display:'flex', alignItems:'center', gap:20, marginBottom:28 }}, React.createElement("div", {style: {
                      width:72, height:72, borderRadius:'50%',
                      background:`radial-gradient(circle, ${b.color}20, transparent)`,
                      border:`1px solid ${b.color}33`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      ...mono, fontSize:17, color:b.color,
                    }}, b.symbol), React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:b.color, marginBottom:6 }}, 'Brain mode:', b.code), React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:800, color:C.text, overflowWrap:'break-word', minWidth:0}}, brain.label), React.createElement("div", {style: { fontSize:12, color:C.muted, marginTop:4 }}, brain.tagline))), React.createElement("p", {style: { fontSize:14, color:C.muted, lineHeight:1.8, marginBottom:24 }}, brain.description), React.createElement("div", {style: { padding:'16px', background:C.deep, borderRadius:2, border:`1px solid ${C.border}`, fontStyle:'italic' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Profile insight'), React.createElement("div", {style: { fontSize:13, color:C.text, lineHeight:1.7 }}, brain.profile))), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:16 }}, React.createElement("div", {className: "card", style: { padding:'24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#7AAFCF', marginBottom:16 }}, 'Strengths'), brain.strengths.map((s,i)=>(
                      React.createElement("div", {key: i, style: { display:'flex', alignItems:'center', gap:12, marginBottom:10 }}, React.createElement("div", {style: { width:6, height:6, borderRadius:'50%', background:'#7AAFCF', flexShrink:0 }}), React.createElement("div", {style: { fontSize:13, color:C.muted }}, s))
                    ))), React.createElement("div", {className: "card", style: { padding:'24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#F87171', marginBottom:16 }}, 'Blind spots'), brain.weaknesses.map((w,i)=>(
                      React.createElement("div", {key: i, style: { display:'flex', alignItems:'center', gap:12, marginBottom:10 }}, React.createElement("div", {style: { width:6, height:6, borderRadius:'50%', background:'#F87171', flexShrink:0 }}), React.createElement("div", {style: { fontSize:13, color:C.muted }}, w))
                    ))))), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap:16 }}, [
                  { label:'Thinking style', value:brain.thinkingStyle, icon:'◰' },
                  { label:'Decision pattern', value:brain.decisionPattern, icon:'◱' },
                  { label:'Training focus', value:brain.trainingFocus, icon:'◲' },
                ].map((item,i)=>(
                  React.createElement("div", {key: i, className: "card", style: { padding:'24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:12 }}, item.label), React.createElement("div", {style: { ...mono, fontSize:14, color:b.color, marginBottom:10 }}, item.icon), React.createElement("div", {style: { fontSize:13, color:C.text, lineHeight:1.7 }}, item.value))
                )), React.createElement("div", {className: "card", style: { padding:'24px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:12 }}, 'Begin training'), React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:700, color:C.text, marginBottom:16, lineHeight:1.3, overflowWrap:'break-word', minWidth:0}}, 'Train your', brain.label.split(' ')[0], 'mode today'), React.createElement("button", {className: "btn-primary", onClick: ()=>setView('training')}, 'Enter training →')))), React.createElement("div", {style: { marginTop:64, padding:'48px 0', borderTop:`1px solid ${C.border}` }}, React.createElement("div", {style: { textAlign:'center', marginBottom:48 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:16 }}, 'The integration principle'), React.createElement("h2", {style: { ...syne, fontSize:17, fontWeight:800, color:C.text, overflowWrap:'break-word', minWidth:0}}, 'No brain is superior. All four must integrate.')), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap:24 }}, [
                  { title:'Single-brain dominance', desc:'When one mode controls all processing: precision without creativity, or intuition without structure.', color:'#F87171', label:'Fragmented' },
                  { title:'Two-brain balance', desc:'Partial integration. Functional, but blind spots remain. Under pressure, one mode takes over.', color:'#C4A050', label:'Partial' },
                  { title:'Four-brain integration', desc:'All four modes active and coordinated. Each informs the others. Precision at every level.', color:'#7AAFCF', label:'Integrated' },
                ].map((item,i)=>(
                  React.createElement("div", {key: i, className: "card", style: { padding:'24px', borderColor:`${item.color}22` }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:item.color, marginBottom:12 }}, item.label), React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:700, color:C.text, marginBottom:12, overflowWrap:'break-word', minWidth:0}}, item.title), React.createElement("div", {style: { fontSize:13, color:C.muted, lineHeight:1.7 }}, item.desc))
                ))))))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  CFI ASSESSMENT VIEW
    // ═══════════════════════════════════════════════════════════════════
    function CFIView({ setView, user, setShowAuth, cfiResult, setCfiResult }) {
      const [started, setStarted] = useState(false);
      const [step, setStep] = useState(0);
      const [answers, setAnswers] = useState({});
      const [showResult, setShowResult] = useState(!!cfiResult);

      const labels = ['Never','Rarely','Sometimes','Often','Always'];
      const progress = started ? (step/CFI_ITEMS.length)*100 : 0;

      const calculateCFI = () => {
        const vals = Object.values(answers);
        if (vals.length < CFI_ITEMS.length) return null;
        const total = vals.reduce((a,b)=>a+b,0);
        let band, desc, recommendation;
        if (total<=20) {
          band='Integrated'; desc='Low fragmentation. Your thinking modes are well-coordinated.';
          recommendation='Maintain your daily integration protocol. Advance to Lessons 4–5 for fluency installation.';
        } else if (total<=33) {
          band='Moderate fragmentation'; desc='Some fragmentation detected. Specific modes need targeted training.';
          recommendation='Focus on mode activation (Lesson 2). Daily mode-switching drills for 14 days.';
        } else if (total<=46) {
          band='High fragmentation'; desc='Significant fragmentation. Integration is inconsistent under pressure.';
          recommendation='Begin from Lesson 1. Run the Core Loop daily.';
        } else {
          band='Critical fragmentation'; desc='Severe fragmentation. Decision-making and clarity are compromised.';
          recommendation='Start Lesson 1 immediately and track your CFI weekly.';
        }
        const dims={A:[],I:[],S:[],R:[],E:[]};
        CFI_ITEMS.forEach(item=>{ if(answers[item.id]) dims[item.dim].push(answers[item.id]); });
        const dimScores={};
        Object.keys(dims).forEach(d=>{ dimScores[d]=dims[d].length ? Math.round(dims[d].reduce((a,b)=>a+b,0)/dims[d].length*20) : 0; });

        // Determine dominant brain from highest dim score (meaning highest fragmentation)
        const brainMap = { A:'analytical', I:'intuitive', S:'associative', R:'reflective', E:'analytical' };
        const sortedDims = Object.entries(dimScores).sort((a,b)=>b[1]-a[1]);
        const dominantBrain = brainMap[sortedDims[0][0]] || 'analytical';

        return { total, band, desc, recommendation, dimScores, dominantBrain };
      };

      const handleAnswer = (val) => {
        const newAnswers = {...answers, [CFI_ITEMS[step].id]: val};
        setAnswers(newAnswers);
        if (step < CFI_ITEMS.length-1) {
          setStep(s=>s+1);
        } else {
          // Calculate result
          const tempAnswers = newAnswers;
          const vals = Object.values(tempAnswers);
          const total = vals.reduce((a,b)=>a+b,0);
          let band, desc, recommendation;
          if (total<=20) { band='Integrated'; desc='Low fragmentation. Your thinking modes are well-coordinated.'; recommendation='Maintain your daily integration protocol. Advance to Lessons 4–5 for fluency installation.'; }
          else if (total<=33) { band='Moderate fragmentation'; desc='Some fragmentation detected. Specific modes need targeted training.'; recommendation='Focus on mode activation (Lesson 2). Daily mode-switching drills for 14 days.'; }
          else if (total<=46) { band='High fragmentation'; desc='Significant fragmentation. Integration is inconsistent under pressure.'; recommendation='Begin from Lesson 1. Run the Core Loop daily.'; }
          else { band='Critical fragmentation'; desc='Severe fragmentation. Decision-making and clarity are compromised.'; recommendation='Start Lesson 1 immediately and track your CFI weekly.'; }
          const dims={A:[],I:[],S:[],R:[],E:[]};
          CFI_ITEMS.forEach(item=>{ if(tempAnswers[item.id]) dims[item.dim].push(tempAnswers[item.id]); });
          const dimScores={};
          Object.keys(dims).forEach(d=>{ dimScores[d]=dims[d].length ? Math.round(dims[d].reduce((a,b)=>a+b,0)/dims[d].length*20) : 0; });
          const brainMap = { A:'analytical', I:'intuitive', S:'associative', R:'reflective', E:'analytical' };
          const sortedDims = Object.entries(dimScores).sort((a,b)=>b[1]-a[1]);
          const dominantBrain = brainMap[sortedDims[0][0]] || 'analytical';
          const result = { total, band, desc, recommendation, dimScores, dominantBrain };
          setCfiResult(result);
          setShowResult(true);
          if (user) saveCFIResult(user.id, result, tempAnswers);
        }
      };

      if (showResult && cfiResult) {
        const bandColors = {
          'Integrated':'#7AAFCF',
          'Moderate fragmentation':'#C4A050',
          'High fragmentation':'#FB8C00',
          'Critical fragmentation':'#F87171',
        };
        const bandColor = bandColors[cfiResult.band] || C.cyan;
        const dimLabels = {A:'Analytical coherence',I:'Intuitive alignment',S:'Associative flexibility',R:'Reflective depth',E:'Integration stability'};

        return (
          React.createElement("div", {style: { paddingTop:80, paddingBottom:40 }}, React.createElement("div", {style: { maxWidth:900, margin:'0 auto', padding:'24px 24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1.5, color:C.cyan, marginBottom:16 }}, 'CFI · Results'), React.createElement("div", {className: "card", style: { padding:'40px', marginBottom:32, position:'relative', overflow:'hidden', borderColor:`${bandColor}22` }}, React.createElement(ScanLine, null), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap:32, alignItems:'center' }}, React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:12 }}, 'Cognitive Fragmentation Index'), React.createElement("div", {style: { ...syne, fontSize:17, fontWeight:800, color:bandColor, lineHeight:1.2, overflowWrap:'break-word', minWidth:0}}, cfiResult.total), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginTop:8, marginBottom:16 }}, 'Total fragmentation score'), React.createElement("div", {style: { display:'inline-block', padding:'8px 16px', background:`${bandColor}15`, border:`1px solid ${bandColor}33`, borderRadius:2 }}, React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:bandColor, overflowWrap:'break-word', minWidth:0}}, cfiResult.band))), React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:16 }}, 'Dominant cognitive pattern'), React.createElement(BrainCard, {brainKey: cfiResult.dominantBrain, compact: true}))), React.createElement("div", {style: { marginTop:32, padding:'20px', background:C.deep, borderRadius:2, border:`1px solid ${C.border}` }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Diagnostic summary'), React.createElement("div", {style: { fontSize:14, color:C.text, lineHeight:1.7, marginBottom:12 }}, cfiResult.desc), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:8 }}, 'Training recommendation'), React.createElement("div", {style: { fontSize:13, color:C.muted, lineHeight:1.7 }}, cfiResult.recommendation))), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:20 }}, 'Dimensional analysis'), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap:16, marginBottom:32 }}, Object.entries(cfiResult.dimScores).map(([dim,score])=>{
                  const col = score>=70?'#F87171':score>=50?'#C4A050':'#7AAFCF';
                  return (
                    React.createElement("div", {key: dim, className: "card", style: { padding:'24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:12 }}, dimLabels[dim]), React.createElement("div", {style: { display:'flex', alignItems:'center', gap:16, marginBottom:12 }}, React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:col, overflowWrap:'break-word', minWidth:0}}, score), React.createElement("div", {style: { fontSize:11, color:C.muted }}, 'fragmentation', React.createElement("br", null), 'score')), React.createElement("div", {style: { height:3, background:C.panel, borderRadius:2 }}, React.createElement("div", {style: { width:`${score}%`, height:'100%', background:col, borderRadius:2 }})))
                  );
                })), React.createElement("div", {style: { display:'flex', gap:16, flexWrap:'wrap' }}, React.createElement("button", {className: "btn-primary", onClick: ()=>setView('training')}, 'Begin training →'), React.createElement("button", {className: "btn-outline", onClick: ()=>setView('lessons')}, 'Open lesson manuals'), React.createElement("button", {className: "btn-ghost", onClick: ()=>{ setStarted(false); setStep(0); setAnswers({}); setShowResult(false); }}, 'Retake assessment'))))
        );
      }

      if (!started) {
        return (
          React.createElement("div", {style: { paddingTop:80, paddingBottom:40 }}, React.createElement("div", {style: { maxWidth:800, margin:'0 auto', padding:'32px 24px', textAlign:'center' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1.5, color:C.cyan, marginBottom:20 }}, 'Cognitive Fragmentation Index™'), React.createElement("h1", {style: { ...syne, fontSize:17, fontWeight:800, color:C.text, marginBottom:20, lineHeight:1.05, overflowWrap:'break-word', minWidth:0}}, 'Measure your cognitive', React.createElement("br", null), React.createElement("span", {style: {color:C.cyan}}, 'fragmentation level')), React.createElement("p", {style: { fontSize:15, color:C.muted, lineHeight:1.8, marginBottom:40, maxWidth:520, margin:'0 auto 40px' }}, 'The CFI™ is a precision diagnostic instrument that measures fragmentation across five cognitive dimensions. The assessment consists of 15 statements. Respond honestly; the accuracy of your profile depends on it.'), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap:16, marginBottom:20, textAlign:'left' }}, ['Five cognitive dimensions measured','Dominant brain mode identified','Fragmentation band assigned','Personalised training recommendation'].map((item,i)=>(
                  React.createElement("div", {key: i, className: "card", style: { padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}, React.createElement("div", {style: { ...mono, fontSize:14, color:C.cyan }}, '◈'), React.createElement("div", {style: { fontSize:13, color:C.muted }}, item))
                ))), React.createElement("button", {className: "btn-primary", style: { fontSize:14 }, onClick: ()=>setStarted(true)}, 'Begin CFI →')))
        );
      }

      const item = CFI_ITEMS[step];
      const brainInfo = C.brains[item.brain] || C.brains.analytical;

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:40 }}, React.createElement("div", {style: { maxWidth:700, margin:'0 auto', padding:'40px 24px', width:'100%' }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, 'CFI ·', step+1, '/', CFI_ITEMS.length), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan }}, Math.round(progress), '%')), React.createElement("div", {style: { height:2, background:C.panel, borderRadius:2, marginBottom:20, overflow:'hidden' }}, React.createElement("div", {style: { width:`${progress}%`, height:'100%', background:C.cyan, borderRadius:2, transition:'width 0.4s ease' }})), React.createElement("div", {key: step, style: { animation:'fadeUp 0.4s ease both' }}, React.createElement("div", {style: { display:'flex', alignItems:'center', gap:12, marginBottom:24 }}, React.createElement("div", {style: { ...mono, fontSize:15, color:brainInfo.color }}, brainInfo.symbol), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:brainInfo.color }}, FOUR_BRAINS[item.brain]?.label || 'COGNITIVE')), React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:700, color:C.text, lineHeight:1.3, marginBottom:48, overflowWrap:'break-word', minWidth:0}}, '"', item.text, '"'), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8 }}, labels.map((label,i)=>{
                  const val = i+1;
                  const isSelected = answers[item.id]===val;
                  return (
                    React.createElement("button", {key: i, onClick: ()=>handleAnswer(val), style: {
                      padding:'16px 8px', borderRadius:2, border:`1px solid ${isSelected?C.cyan:C.border}`,
                      background: isSelected ? `${C.cyan}20` : C.surface,
                      display:'flex', flexDirection:'column', alignItems:'center', gap:8,
                      transition:'all 0.2s', cursor:'pointer',
                    }}, React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:isSelected?C.cyan:C.dim, overflowWrap:'break-word', minWidth:0}}, val), React.createElement("div", {style: { ...mono, fontSize:8, letterSpacing:1, color:isSelected?C.cyan:C.dim, textAlign:'center' }}, label))
                  );
                })), React.createElement("div", {style: { display:'flex', justifyContent:'space-between', marginTop:12 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.dim }}, 'NEVER'), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.dim }}, 'ALWAYS'))), step > 0 && (
              React.createElement("button", {className: "btn-ghost", style: { marginTop:32 }, onClick: ()=>setStep(s=>s-1)}, '← Previous')
            )))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  TRAINING VIEW
    // ═══════════════════════════════════════════════════════════════════
    function TrainingView({ setView, user, setShowAuth, sessions, setSessions }) {
      const [activeModule, setActiveModule] = useState(null);
      const [trainingStep, setTrainingStep] = useState(0);
      const [inputs, setInputs] = useState({});

      const modules = [
        {
          id:'core-loop', title:'Core integration loop', duration:'8 min', difficulty:'Foundation',
          color:C.cyan, brain:'all', icon:'◈',
          desc:'Run all four brains in sequence on a real situation.',
          steps:[
            { brain:'analytical', label:'◰ Decompose', prompt:'State the situation as pure fact.', detail:'No interpretation, no emotion, no judgment. Just the verifiable structure of what is happening.', placeholder:'What are the concrete facts here? List them.' },
            { brain:'intuitive', label:'◱ Sense', prompt:'What does your gut signal?', detail:'Before logic arrives, what does your body and instinct know? Trust the first signal; do not edit it.', placeholder:'My gut is telling me...' },
            { brain:'associative', label:'◲ Expand', prompt:'What connections have you not explored?', detail:'Think laterally. What does this remind you of? What alternative frame exists? What have you not considered?', placeholder:'This connects to... / An alternative view is...' },
            { brain:'reflective', label:'◳ Reflect', prompt:'What does your thinking reveal?', detail:'What assumption is operating beneath the surface? What pattern are you repeating? What does your hesitation tell you?', placeholder:'My thinking reveals...' },
            { brain:'synthesis', label:'◈ Fuse', prompt:'Write your integrated position.', detail:'One sentence that synthesizes all four brain outputs into a unified cognitive stance. Activate the Commitment Lock.', placeholder:'My fused position is: ...' },
          ]
        },
        {
          id:'pressure-drill', title:'Pressure stabilization drill', duration:'10 min', difficulty:'Advanced',
          color:'#E2BE78', brain:'reflective', icon:'◱',
          desc:'Train cognitive stability under pressure.',
          steps:[
            { brain:'reflective', label:'◳ Identify pressure', prompt:'Name the pressure source precisely.', detail:'What exactly is creating the pressure? Be specific; vague pressure is more destabilizing than named pressure.', placeholder:'The specific pressure is...' },
            { brain:'analytical', label:'◰ Facts only', prompt:'List only verifiable facts.', detail:'Strip all interpretation. What can you prove? What is objectively true regardless of how it feels?', placeholder:'Facts only:' },
            { brain:'intuitive', label:'◱ Signal check', prompt:'What is your intuition saying beneath the pressure?', detail:'Separate the fear signal from the intelligence signal. What does your pattern recognition tell you, absent the adrenaline?', placeholder:'My signal, separate from the fear, is...' },
            { brain:'associative', label:'◲ Alternative response', prompt:'What response have you not yet considered?', detail:'Under pressure, the mind narrows to one option. Force it to generate at least two others.', placeholder:'Alternative responses: 1) ... 2) ... 3)...' },
            { brain:'synthesis', label:'◈ Stabilize', prompt:'Your stabilized position.', detail:'After running all four brains under simulated pressure, what is your clear, stable position? Name it. Lock it.', placeholder:'Stabilized position:' },
          ]
        },
        {
          id:'decision-architecture', title:'Decision architecture protocol', duration:'12 min', difficulty:'Intermediate',
          color:'#7AAFCF', brain:'analytical', icon:'◰',
          desc:'Build a complete cognitive architecture for any complex decision.',
          steps:[
            { brain:'analytical', label:'◰ Define', prompt:'Define the decision precisely.', detail:'What exactly is being decided? What are the specific options? What is the timeline? What resources are involved?', placeholder:'The decision I am making is...' },
            { brain:'reflective', label:'◳ Values check', prompt:'What do your values say?', detail:'Which option is most aligned with who you are and who you want to become? Values-misaligned decisions fail over time.', placeholder:'My values indicate...' },
            { brain:'intuitive', label:'◱ Pattern read', prompt:'What does your experience reveal?', detail:'Have you been here before? What happened? What does your accumulated experience (not hope) tell you?', placeholder:'My experience pattern says...' },
            { brain:'associative', label:'◲ Second-order effects', prompt:'What are the downstream consequences?', detail:'Think two moves ahead. What does each option create? What does it close off? What unexpected connections exist?', placeholder:'Second-order effects:' },
            { brain:'synthesis', label:'◈ Architectural decision', prompt:'Your structured decision.', detail:'Integrate all inputs. Name the decision. State why. Activate the Commitment Lock.', placeholder:'My decision is: ... because...' },
          ]
        },
      ];

      if (activeModule) {
        const mod = modules.find(m=>m.id===activeModule);
        const stepData = mod.steps[trainingStep];
        const brainInfo = C.brains[stepData.brain] || { color:C.cyan, symbol:'◈' };
        const isLast = trainingStep === mod.steps.length-1;
        const canAdvance = inputs[`${activeModule}-${trainingStep}`]?.trim().length > 10;

        const handleComplete = () => {
          const session = {
            id: Date.now(),
            title: mod.title,
            date: 'Just now',
            score: Math.min(100, Object.values(inputs).join('').length/5 + 50),
            module: mod.id,
          };
          setSessions(prev=>[session,...prev]);
          setActiveModule(null);
          setTrainingStep(0);
          setInputs({});
        };

        return (
          React.createElement("div", {style: { paddingTop:80, paddingBottom:60, minHeight:'100vh' }}, React.createElement("div", {style: { maxWidth:760, margin:'0 auto', padding:'40px 24px' }}, React.createElement("div", {style: { display:'flex', alignItems:'center', gap:16, marginBottom:32 }}, React.createElement("button", {className: "btn-ghost", onClick: ()=>{ setActiveModule(null); setTrainingStep(0); setInputs({}); }}, '← Exit'), React.createElement("div", {style: { flex:1, height:1, background:C.border }}), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, trainingStep+1, '/', mod.steps.length)), React.createElement("div", {style: { height:2, background:C.panel, borderRadius:2, marginBottom:20, overflow:'hidden' }}, React.createElement("div", {style: { width:`${((trainingStep+1)/mod.steps.length)*100}%`, height:'100%', background:mod.color, borderRadius:2, transition:'width 0.4s ease' }})), React.createElement("div", {key: trainingStep, style: { animation:'fadeUp 0.4s ease both' }}, React.createElement("div", {style: { display:'flex', alignItems:'center', gap:12, marginBottom:20 }}, React.createElement("div", {style: { ...mono, fontSize:14, color:brainInfo.color }}, brainInfo.symbol || '◈'), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:brainInfo.color }}, stepData.label)), React.createElement("h2", {style: { ...syne, fontSize:14, fontWeight:800, color:C.text, marginBottom:12, lineHeight:1.2, overflowWrap:'break-word', minWidth:0}}, stepData.prompt), React.createElement("p", {style: { fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:32 }}, stepData.detail), React.createElement("textarea", {rows: 8, value: inputs[`${activeModule}-${trainingStep}`]||'', onChange: e=>setInputs(p=>({...p, [`${activeModule}-${trainingStep}`]:e.target.value})), placeholder: stepData.placeholder, style: { width:'100%', minHeight:160, padding:'20px', fontSize:14, lineHeight:1.7, borderColor:`${brainInfo.color}33` }}), React.createElement("div", {style: { display:'flex', justifyContent:'space-between', marginTop:24, alignItems:'center' }}, React.createElement("button", {className: "btn-ghost", disabled: trainingStep===0, onClick: ()=>setTrainingStep(s=>s-1), style: { opacity:trainingStep===0?0.3:1 }}, '← Back'), isLast ? (
                    React.createElement("button", {className: "btn-primary", onClick: handleComplete, disabled: !canAdvance, style: { opacity:canAdvance?1:0.5 }}, 'Complete session ✓')
                  ) : (
                    React.createElement("button", {className: "btn-primary", onClick: ()=>setTrainingStep(s=>s+1), disabled: !canAdvance, style: { opacity:canAdvance?1:0.5 }}, 'Next →')
                  )))))
        );
      }

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:100 }}, React.createElement("div", {style: { maxWidth:1200, margin:'0 auto', padding:'40px 24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1.5, color:C.cyan, marginBottom:16 }}, 'Training system'), React.createElement("h1", {style: { ...syne, fontSize:17, fontWeight:800, color:C.text, marginBottom:16, lineHeight:1.05, overflowWrap:'break-word', minWidth:0}}, 'Precision training', React.createElement("br", null), 'Protocols'), React.createElement("p", {style: { fontSize:15, color:C.muted, maxWidth:560, lineHeight:1.8, marginBottom:48 }}, 'Each module is a structured cognitive exercise that activates, challenges, and integrates your four brain modes. Sessions are 8–15 minutes.'), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap:24, marginBottom:64 }}, modules.map((mod,i)=>(
                React.createElement("div", {key: mod.id, className: "card", style: { padding:'32px', cursor:'pointer', position:'relative', overflow:'hidden' }, onClick: ()=>setActiveModule(mod.id), onMouseEnter: e=>{ e.currentTarget.style.borderColor=mod.color+'44'; }, onMouseLeave: e=>{ e.currentTarget.style.borderColor=C.border; }}, React.createElement("div", {style: { position:'absolute', top:0, left:0, width:2, height:'100%', background:mod.color }}), React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}, React.createElement("div", {style: { ...mono, fontSize:14, color:mod.color }}, mod.icon), React.createElement("div", {style: { display:'flex', gap:8 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, padding:'4px 8px', border:`1px solid ${C.border}`, borderRadius:2 }}, mod.duration), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:mod.color, padding:'4px 8px', border:`1px solid ${mod.color}33`, borderRadius:2 }}, mod.difficulty))), React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:700, color:C.text, marginBottom:12, overflowWrap:'break-word', minWidth:0}}, mod.title), React.createElement("div", {style: { fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:24 }}, mod.desc), React.createElement("button", {className: "btn-primary", style: { fontSize:11, padding:'10px 20px', background:mod.color }}, 'Begin →'))
              ))), sessions.length > 0 && (
              React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:20 }}, 'Recent sessions'), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:8 }}, sessions.slice(0,5).map((s,i)=>(
                    React.createElement("div", {key: s.id, className: "card", style: { padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}, React.createElement("div", null, React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:700, color:C.text, overflowWrap:'break-word', minWidth:0}}, s.title), React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginTop:4 }}, s.date)), React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.dim }}, 'Done ✓'))
                  ))))
            )))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  ANALYTICS VIEW
    // ═══════════════════════════════════════════════════════════════════
    function AnalyticsView({ cfiResult, sessions, lessonProgress }) {
      const completedLessons = Object.values(lessonProgress).filter(v=>v===100).length;

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:100 }}, React.createElement("div", {style: { maxWidth:1200, margin:'0 auto', padding:'40px 24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1.5, color:C.cyan, marginBottom:16 }}, 'Analytics'), React.createElement("h1", {style: { ...syne, fontSize:17, fontWeight:800, color:C.text, marginBottom:16, overflowWrap:'break-word', minWidth:0}}, 'Your cognitive', React.createElement("br", null), 'performance map'), React.createElement("p", {style: { fontSize:15, color:C.muted, maxWidth:560, lineHeight:1.8, marginBottom:48 }}, 'Track your thinking evolution, mode balance, and training effectiveness.'), !cfiResult ? (
              React.createElement("div", {className: "card", style: { padding:'60px', textAlign:'center' }}, React.createElement("div", {style: { ...mono, fontSize:14, color:C.dim, marginBottom:24 }}, '◎'), React.createElement("div", {style: { ...syne, fontSize:17, fontWeight:700, color:C.text, marginBottom:12, overflowWrap:'break-word', minWidth:0}}, 'No data yet'), React.createElement("div", {style: { fontSize:14, color:C.muted, marginBottom:32, maxWidth:400, margin:'0 auto 32px' }}, 'Complete the CFI assessment to generate your profile and unlock analytics.'), React.createElement("button", {className: "btn-primary", onClick: ()=>{}}, 'Take CFI assessment →'))
            ) : (
              React.createElement(React.Fragment, null, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap:16, marginBottom:40 }}, [
                    { label:'CFI score', value:cfiResult.total, unit:'/75', color:cfiResult.total<=20?'#7AAFCF':cfiResult.total<=33?'#C4A050':'#F87171' },
                    { label:'Sessions', value:sessions.length, unit:'', color:C.cyan },
                    { label:'Lessons', value:completedLessons, unit:`/${LESSONS.length}`, color:'#E2BE78' },
                    { label:'Band', value:cfiResult.band.split(' ')[0], unit:'', color:'#C4A050', small:true },
                  ].map((s,i)=>(
                    React.createElement("div", {key: i, className: "card", style: { padding:'24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:12 }}, s.label), React.createElement("div", {style: { display:'flex', alignItems:'baseline', gap:4 }}, React.createElement("div", {style: { ...syne, fontSize:s.small?18:32, fontWeight:800, color:s.color, overflowWrap:'break-word', minWidth:0}}, s.value), s.unit && React.createElement("div", {style: { ...mono, fontSize:10, color:C.muted }}, s.unit)))
                  ))), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap:24, marginBottom:40 }}, React.createElement("div", {className: "card", style: { padding:'32px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:24 }}, 'Mode fragmentation'), Object.entries(cfiResult.dimScores).map(([dim,score])=>{
                      const dimNames = {A:'Analytical',I:'Intuitive',S:'Associative',R:'Reflective',E:'Integration'};
                      const brainKey = {A:'analytical',I:'intuitive',S:'associative',R:'reflective',E:'analytical'}[dim];
                      const col = C.brains[brainKey]?.color || C.cyan;
                      const fragPct = score;
                      return (
                        React.createElement("div", {key: dim, style: { marginBottom:20 }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', marginBottom:8 }}, React.createElement("div", {style: { display:'flex', alignItems:'center', gap:8 }}, React.createElement("div", {style: { ...mono, fontSize:10, color:col }}, C.brains[brainKey]?.symbol || '◈'), React.createElement("div", {style: { fontSize:13, color:C.muted }}, dimNames[dim])), React.createElement("div", {style: { ...mono, fontSize:9, color:col }}, fragPct, '%')), React.createElement("div", {style: { height:4, background:C.panel, borderRadius:2, overflow:'hidden' }}, React.createElement("div", {style: { width:`${fragPct}%`, height:'100%', background:col, borderRadius:2 }})))
                      );
                    })), React.createElement("div", {className: "card", style: { padding:'32px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:24 }}, 'Cognitive profile'), React.createElement("div", {style: { display:'flex', justifyContent:'center', flexWrap:'wrap', gap:24 }}, Object.entries(C.brains).map(([key,b])=>{
                        const dimKey = {analytical:'A',intuitive:'I',associative:'S',reflective:'R'}[key];
                        const score = cfiResult.dimScores[dimKey] || 0;
                        const strength = Math.max(0, 100-score);
                        return (
                          React.createElement("div", {key: key, style: { textAlign:'center' }}, React.createElement(ProgressRing, {value: strength, size: 72, color: b.color}), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginTop:8 }}, b.label.split(' ')[0].toUpperCase()))
                        );
                      })), React.createElement("div", {style: { marginTop:24, padding:'16px', background:C.deep, borderRadius:2, border:`1px solid ${C.border}` }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Dominant mode'), React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:C.brains[cfiResult.dominantBrain]?.color||C.cyan, overflowWrap:'break-word', minWidth:0}}, FOUR_BRAINS[cfiResult.dominantBrain]?.label || 'N/A')))), React.createElement("div", {className: "card", style: { padding:'32px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:24 }}, 'Lesson progress'), LESSONS.map((lesson,i)=>{
                    const prog = lessonProgress[lesson.id] || 0;
                    const col = lesson.level==='Foundation'?C.cyan:lesson.level==='Intermediate'?'#E2BE78':lesson.level==='Advanced'?'#C4A050':'#7AAFCF';
                    return (
                      React.createElement("div", {key: lesson.id, style: { marginBottom:20 }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}, React.createElement("div", null, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500 }}, 'Lesson', lesson.id, ':', lesson.title), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginTop:4 }}, lesson.level)), React.createElement("div", {style: { ...mono, fontSize:9, color:prog===100?'#7AAFCF':C.muted }}, prog===100?'Complete':prog>0?`${prog}%`:'--')), React.createElement("div", {style: { height:3, background:C.panel, borderRadius:2, overflow:'hidden' }}, React.createElement("div", {style: { width:`${prog}%`, height:'100%', background:col, borderRadius:2, transition:'width 0.8s ease' }})))
                    );
                  })))
            )))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  LESSONS VIEW
    // ═══════════════════════════════════════════════════════════════════
    function LessonsView({ setView, user, session, paystackKey, setShowAuth, isPro, setIsPro, isEnterprise, lessonProgress, setLessonProgress, proPrice = 600000 }) {
      const [activeLesson, setActiveLesson] = useState(null);
      const [page, setPage] = useState(0);
      const [paystackLoading, setPaystackLoading] = useState(false);
      const paystackHandlerRef = React.useRef(null);

      // Open Paystack popup synchronously on click (Pro)
      // NOTE: openIframe() must be called in the same synchronous call stack as the
      // user gesture — any await before it causes browsers to block the popup.
      const handleProPayment = () => {
        if (!user) { setShowAuth(true); return; }
        if (typeof PaystackPop === 'undefined') { alert('Payment system failed to load. Please refresh and try again.'); return; }
        if (!paystackKey) { alert('Payment system is not configured. Please try again shortly.'); return; }
        setPaystackLoading(true);
        const resetTimer = setTimeout(() => setPaystackLoading(false), 15000);
        try {
          const handler = PaystackPop.setup({
            key: paystackKey,
            email: user.email,
            amount: proPrice,
            currency: 'NGN',
            ref: 'nf_pro_' + Date.now() + '_' + user.id.slice(0, 8),
            metadata: { user_id: user.id, plan: 'pro' },
            onSuccess: async (transaction) => {
              clearTimeout(resetTimer);
              setPaystackLoading(false);
              try {
                const res = await fetch(SUPABASE_URL + '/functions/v1/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
                  body: JSON.stringify({ reference: transaction.reference, plan: 'pro' }),
                });
                const data = await res.json();
                if (res.ok && data.success) { setIsPro(true); }
                else { alert('Payment received but verification failed. Contact support with ref: ' + transaction.reference); }
              } catch(e) { alert('Network error during verification. Contact support with ref: ' + transaction.reference); }
            },
            onCancel: () => { clearTimeout(resetTimer); setPaystackLoading(false); },
          });
          handler.openIframe();
        } catch(e) { clearTimeout(resetTimer); setPaystackLoading(false); alert('Could not open payment window. Please refresh and try again.'); }
      };

      const levelColors = { Foundation:C.cyan, Intermediate:'#E2BE78', Advanced:'#C4A050', Mastery:'#7AAFCF' };

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
                    }}, para)
                  ))), React.createElement("div", {style: { display:'flex', justifyContent:'space-between', marginTop:32, alignItems:'center' }}, React.createElement("button", {className: "btn-ghost", disabled: page===0, onClick: ()=>setPage(p=>p-1), style: { opacity:page===0?0.3:1 }}, '← Previous'), isLast ? (
                    React.createElement("button", {className: "btn-primary", style: { background:col }, onClick: handleComplete}, 'Complete ✓')
                  ) : (
                    React.createElement("button", {className: "btn-primary", style: { background:col }, onClick: ()=>setPage(p=>p+1)}, 'Continue →')
                  )))))
        );
      }

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:100 }}, React.createElement("div", {style: { maxWidth:1200, margin:'0 auto', padding:'40px 24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1.5, color:C.cyan, marginBottom:16 }}, 'Lesson manuals'), React.createElement("h1", {style: { ...syne, fontSize:17, fontWeight:800, color:C.text, marginBottom:16, lineHeight:1.05, overflowWrap:'break-word', minWidth:0}}, 'Cognitive', React.createElement("br", null), 'training documents'), React.createElement("p", {style: { fontSize:15, color:C.muted, maxWidth:560, lineHeight:1.8, marginBottom:48 }}, 'Five structured manuals that form the complete NeuralFusion™ curriculum. Each is a cognitive transformation, not just information.'), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:16 }}, LESSONS.map((lesson,i)=>{
                const col = levelColors[lesson.level] || C.cyan;
                const prog = lessonProgress[lesson.id] || 0;
                const isLocked = !lesson.free && !isPro;
                const brainKey = lesson.brain === 'all' ? null : lesson.brain;
                return (
                  React.createElement("div", {key: lesson.id, className: "card", style: {
                    padding:'28px 32px', position:'relative', overflow:'hidden',
                    opacity: isLocked ? 0.6 : 1, cursor: isLocked ? 'default' : 'pointer',
                  }, onClick: ()=>{ if(!isLocked){ setActiveLesson(lesson.id); setPage(0); } }, onMouseEnter: e=>{ if(!isLocked){ e.currentTarget.style.borderColor=col+'44'; } }, onMouseLeave: e=>{ e.currentTarget.style.borderColor=C.border; }}, React.createElement("div", {style: { position:'absolute', top:0, left:0, width:2, height:'100%', background:prog===100?'#7AAFCF':prog>0?col:C.border }}), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'auto 1fr auto', gap:24, alignItems:'center' }}, React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:col+'33', lineHeight:1.2, overflowWrap:'break-word', minWidth:0}}, String(i+1).padStart(2,'0')), React.createElement("div", null, React.createElement("div", {style: { display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:col, padding:'3px 8px', border:`1px solid ${col}33`, borderRadius:2 }}, lesson.level.toUpperCase()), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, padding:'3px 8px', border:`1px solid ${C.border}`, borderRadius:2 }}, lesson.duration.toUpperCase()), lesson.free && React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#7AAFCF', padding:'3px 8px', border:`1px solid #7AAFCF33`, borderRadius:2 }}, 'Free'), isLocked && React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#F87171', padding:'3px 8px', border:`1px solid #F8717133`, borderRadius:2 }}, 'Pro required'), prog===100 && React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#7AAFCF', padding:'3px 8px', border:`1px solid #7AAFCF33`, borderRadius:2 }}, '✓ Complete')), React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:700, color:C.text, marginBottom:6, overflowWrap:'break-word', minWidth:0}}, lesson.title), React.createElement("div", {style: { fontSize:13, color:C.muted }}, lesson.sub)), React.createElement("div", {style: { ...mono, fontSize:15, color:col+'44' }}, isLocked ? '⊘' : prog===100 ? '✓' : '→')), prog>0 && prog<100 && (
                      React.createElement("div", {style: { marginTop:16, height:2, background:C.panel, borderRadius:2, overflow:'hidden' }}, React.createElement("div", {style: { width:`${prog}%`, height:'100%', background:col, borderRadius:2 }}))
                    ))
                );
              })), !isPro && (
              React.createElement("div", {className: "card", style: { marginTop:40, padding:'40px', textAlign:'center', borderColor:`${C.cyan}22` }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:16 }}, 'Unlock all lessons'), React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:800, color:C.text, marginBottom:8, overflowWrap:'break-word', minWidth:0}}, 'Pro access'), React.createElement("div", {style: { ...mono, fontSize:14, fontWeight:800, color:C.cyan, marginBottom:16, overflowWrap:'break-word', minWidth:0}}, `₦${(proPrice/100).toLocaleString()}`), React.createElement("div", {style: { fontSize:14, color:C.muted, marginBottom:32, maxWidth:400, margin:'0 auto 32px' }}, 'One-time payment. Unlocks Lessons 2–5 and the full training system.'), React.createElement("button", {className: "btn-primary", disabled: paystackLoading, onClick: handleProPayment}, paystackLoading ? 'Opening...' : `Upgrade to Pro: ₦${(proPrice/100).toLocaleString()} →`))
            ), !isEnterprise && (
              React.createElement("div", {className: "card", style: { marginTop:20, padding:'40px', textAlign:'center', borderColor:'rgba(76,247,192,0.25)', background:'rgba(5,20,38,0.8)' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#4CF7C0', marginBottom:16 }}, 'NeuralFusion™ Enterprise'), React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:800, color:C.text, marginBottom:8, overflowWrap:'break-word', minWidth:0}}, 'Deploy it across your organisation'), React.createElement("div", {style: { ...mono, fontSize:14, fontWeight:800, color:'#4CF7C0', marginBottom:16, overflowWrap:'break-word', minWidth:0}}, '₦', ENTERPRISE_PRICE_DISPLAY), React.createElement("div", {style: { fontSize:14, color:C.muted, marginBottom:32, maxWidth:480, margin:'0 auto 32px', lineHeight:1.8 }}, 'Cohort management · CFI data entry · Facilitator dashboard · 5-lesson programme · Clarity Delta™ reporting'), React.createElement("button", {style: { ...syne, fontSize:13, fontWeight:700, padding:'14px 36px', background:'#4CF7C0', color:'#050C1A', border:'none', cursor:'pointer', borderRadius:2, overflowWrap:'break-word', minWidth:0}, onClick: ()=>setView('enterprise')}, 'Explore enterprise →'))
            )))
      );
    }
    // ═══════════════════════════════════════════════════════════════════
    function AboutView({ setView }) {
      const faqs = [
        { q:'What is NeuralFusion™?', a:'NeuralFusion™ is a structured system for training how you think, built around the Four Brains framework. Not a productivity tool, not a wellness app. A trainable cognitive skill system, built by Life Edet.' },
        { q:'What is the Four Brains framework?', a:'The Four Brains framework identifies four cognitive modes: Analytical, Intuitive, Associative, Reflective. and trains deliberate activation of all four. Most people rely on one or two. NeuralFusion™ teaches you to coordinate all four.' },
        { q:'What is the CFI assessment?', a:'The CFI™ is a precision diagnostic instrument that measures fragmentation across five cognitive dimensions. It produces a score, a band rating, and a personalised training recommendation.' },
        { q:'How long before I see results?', a:'Most users report increased clarity within 1–3 sessions. The Core Integration Loop runs in under 90 seconds once trained. Full cognitive fluency typically installs within 21–42 days of daily practice.' },
        { q:'How is this different from therapy or mindfulness?', a:'Therapy addresses psychological history. Mindfulness addresses present-moment awareness. NeuralFusion™ addresses cognitive architecture: the structure of how you think. A skill system, not a wellness practice.' },
      ];
      const [openFaq, setOpenFaq] = useState(null);

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:100 }}, React.createElement("div", {style: { maxWidth:1200, margin:'0 auto', padding:'60px 24px' }}, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap:64, alignItems:'center', marginBottom:80 }}, React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1.5, color:C.cyan, marginBottom:20 }}, 'About NeuralFusion™'), React.createElement("h1", {style: { ...syne, fontSize:17, fontWeight:800, color:C.text, marginBottom:24, lineHeight:1.05, overflowWrap:'break-word', minWidth:0}}, 'Teaching humanity', React.createElement("br", null), React.createElement("span", {style: {color:C.cyan}}, 'how to think.')), React.createElement("p", {style: { fontSize:15, color:C.muted, lineHeight:1.9, marginBottom:20 }}, 'NeuralFusion™ was built by', React.createElement("strong", {style: {color:C.text}}, 'Life Edet'), ', a cognitive systems designer who spent years studying why intelligent people consistently make fragmented decisions.'), React.createElement("p", {style: { fontSize:15, color:C.muted, lineHeight:1.9, marginBottom:32 }}, 'The core insight: most people have never been taught the mechanics of thinking. They have enormous cognitive capacity that stays fragmented, because no structured system existed to integrate it.'), React.createElement("p", {style: { fontSize:15, color:C.muted, lineHeight:1.9 }}, 'NeuralFusion™ is that system.')), React.createElement("div", {className: "card", style: { padding:'40px', position:'relative', overflow:'hidden' }}, React.createElement(ScanLine, null), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:24 }}, 'Mission'), React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:C.text, lineHeight:1.2, marginBottom:24, overflowWrap:'break-word', minWidth:0}}, '"Teach people how to think using structured cognitive systems."'), React.createElement("div", {style: { ...mono, fontSize:10, letterSpacing:1, color:C.muted }}, 'Life Edet, creator of NeuralFusion™'), React.createElement("div", {style: { marginTop:40 }}, [
                    { label:'Cognitive modes', value:'4' },
                    { label:'CFI dimensions', value:'5' },
                    { label:'Training protocols', value:'6+' },
                    { label:'Lesson manuals', value:'5' },
                  ].map((s,i)=>(
                    React.createElement("div", {key: i, style: { display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${C.border}` }}, React.createElement("div", {style: { fontSize:13, color:C.muted }}, s.label), React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:800, color:C.cyan, overflowWrap:'break-word', minWidth:0}}, s.value))
                  ))))), React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:32 }}, 'Frequently asked'), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:4 }}, faqs.map((faq,i)=>(
                  React.createElement("div", {key: i, className: "card", style: { overflow:'hidden' }}, React.createElement("button", {onClick: ()=>setOpenFaq(openFaq===i?null:i), style: {
                      width:'100%', padding:'20px 24px', background:'none', border:'none',
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      cursor:'pointer', textAlign:'left', gap:16,
                    }}, React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:600, color:C.text }}, faq.q), React.createElement("div", {style: { ...mono, fontSize:14, color:C.cyan, flexShrink:0, transition:'transform 0.2s', transform:openFaq===i?'rotate(45deg)':'none' }}, '+')), openFaq===i && (
                      React.createElement("div", {style: { padding:'0 24px 24px', fontSize:14, color:C.muted, lineHeight:1.8, animation:'fadeIn 0.3s ease' }}, faq.a)
                    ))
                )))), React.createElement("div", {style: { marginTop:80, padding:'60px', textAlign:'center', background:C.deep, border:`1px solid ${C.border}`, borderRadius:4, position:'relative', overflow:'hidden' }}, React.createElement("div", {className: "grid-bg", style: { position:'absolute', inset:0 }}), React.createElement("div", {style: { position:'relative', zIndex:1 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1.5, color:C.cyan, marginBottom:20 }}, 'Begin your evolution'), React.createElement("h2", {style: { ...syne, fontSize:14, fontWeight:800, color:C.text, marginBottom:16, lineHeight:1.1, overflowWrap:'break-word', minWidth:0}}, 'Your thinking is about to', React.createElement("br", null), React.createElement("span", {style: {color:C.cyan}}, 'change permanently.')), React.createElement("p", {style: { fontSize:14, color:C.muted, marginBottom:40, maxWidth:480, margin:'0 auto 40px' }}, 'Start with the CFI to measure where your cognition stands, then begin the training system.'), React.createElement("div", {style: { display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}, React.createElement("button", {className: "btn-primary", onClick: ()=>setView('cfi')}, 'Begin CFI →'), React.createElement("button", {className: "btn-outline", onClick: ()=>setView('four-brains')}, 'Explore the Four Brains'))))))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  LEGAL VIEW: Privacy, Terms & Data Protection
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
        React.createElement("div", null, React.createElement(Section, {num: "01", title: "Who we are"}, React.createElement(P, null, 'NeuralFusion™ is a cognitive performance platform developed and operated by', React.createElement("strong", {style: {color:C.text}}, 'Life Edet'), ', accessible at tryneuralFusion.com. The platform delivers a structured cognitive training programme teaching participants to work across four thinking modes through a curriculum delivered to individual users and organisational cohorts.'), React.createElement(P, null, '"We," "us," and "our" refer to NeuralFusion™ and its operator. "You" refers to any individual who accesses or uses the platform, including individual subscribers, enterprise participants, and facilitators.')), React.createElement(Section, {num: "02", title: "Information we collect"}, React.createElement(P, null, 'We collect the following categories of personal information:'), React.createElement(UL, {items: [
              'Account Information: Name, email address, and password when you register.',
              'Assessment Data: CFI responses, scoring results across five cognitive dimensions (Decision Latency, Mode Rigidity, Emotional Reactivity, Thought Interruption, Cognitive Overload), and composite scores.',
              'Learning Progress: Lesson completion records, module progress, and programme milestone data.',
              'Enterprise Data: Cohort codes, participant IDs, facilitator activity, pre- and post-assessment records.',
              'Payment Information: Transaction records processed through Paystack. Full card details are not stored on our systems.',
              'Usage Data: IP address, browser type, device type, pages visited, and session data collected automatically.',
            ]})), React.createElement(Section, {num: "03", title: "How we use your information"}, React.createElement(UL, {items: [
              'To create and manage your account and provide access to the platform.',
              'To deliver the NeuralFusion™ cognitive training programme and track your progress.',
              'To generate your cognitive profile and provide personalised insights from CFI assessments.',
              'To facilitate enterprise cohort management, enabling facilitators to view cohort-level data.',
              'To process payments and manage subscription or enterprise access.',
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
              'Enterprise Facilitators: If you participate in an organisational cohort, your assessment results may be accessible to designated facilitator(s) of that cohort.',
              'Legal Requirements: Where required by law, court order, or government authority.',
              'Business Transfers: In the event of a merger or acquisition, subject to equivalent privacy protections.',
            ]}), React.createElement(HB, {title: "Enterprise Participants"}, 'Your cohort facilitator has access to your assessment results and progress data for the duration of the programme. If you have concerns, please contact your organisation before completing assessments.')), React.createElement(Section, {num: "06", title: "Data storage & security"}, React.createElement(P, null, 'Your data is stored on Supabase infrastructure. We implement appropriate technical and organisational measures including TLS/HTTPS encryption in transit, row-level security and access control policies, and secure session management via Supabase Auth.'), React.createElement(P, null, 'We retain your personal data for as long as your account is active or as necessary to fulfil the purposes described here, and thereafter as required by applicable law.')), React.createElement(Section, {num: "07", title: "Your rights"}, React.createElement(P, null, 'Under the Nigeria Data Protection Act 2023, you have the right of access, rectification, erasure, restriction, data portability, and the right to object to certain processing. To exercise any right, contact us at the details below. We will respond within 30 days.')), React.createElement(Section, {num: "08", title: "Children's privacy"}, React.createElement(P, null, 'NeuralFusion™ is designed for professional and organisational use and is not directed at children under 13. We do not knowingly collect personal information from children.')), React.createElement(Section, {num: "09", title: "Changes & contact"}, React.createElement(P, null, 'We may update this policy from time to time. Continued use after changes constitutes acceptance. For privacy queries, contact us:'), React.createElement(ContactCard, {items: [
              { label: 'Platform', value: 'NeuralFusion™' },
              { label: 'Operator', value: 'Life Edet' },
              { label: 'Website', value: 'tryneuralFusion.com' },
              { label: 'Subject Line', value: 'Privacy Request: NeuralFusion' },
            ]})))
      );

      const TermsContent = () => (
        React.createElement("div", null, React.createElement(Section, {num: "01", title: "Acceptance of terms"}, React.createElement(P, null, 'By accessing or using the NeuralFusion™ platform at tryneuralFusion.com, you agree to be bound by these Terms and Conditions. If you do not agree, you must not access or use the platform.'), React.createElement(P, null, 'These Terms constitute a legally binding agreement between you and', React.createElement("strong", {style: {color:C.text}}, 'Life Edet'), ', the developer and operator of NeuralFusion™. If using the platform on behalf of an organisation, you represent that you have authority to bind that organisation.')), React.createElement(Section, {num: "02", title: "Description of service"}, React.createElement(P, null, 'NeuralFusion™ is a cognitive performance platform delivering:'), React.createElement(UL, {items: [
              'A structured 5-lesson, 7-week cognitive curriculum.',
              'The Cognitive Fragmentation Index (CFI) Edition 2.0 assessment.',
              'Individual cognitive profiling across five dimensions.',
              'An Enterprise Portal for organisational cohort management, facilitator dashboards, and pre/post assessment tracking.',
            ]})), React.createElement(Section, {num: "03", title: "Account Registration"}, React.createElement(P, null, 'You agree to provide accurate information, maintain the security of your credentials, notify us promptly of any unauthorised access, and accept responsibility for all activity under your account.')), React.createElement(Section, {num: "04", title: "Subscription & Payments"}, React.createElement(P, null, React.createElement("strong", {style: {color:C.text}}, 'Pro Access:'), 'Full access requires payment of the current Pro fee, as displayed on the platform. Payments are processed via Paystack. Pricing may be updated by the platform administrator with reasonable notice.'), React.createElement(P, null, React.createElement("strong", {style: {color:C.text}}, 'Refunds:'), 'Due to the digital nature of platform content, all sales are generally final. Refund requests are considered on a case-by-case basis within 7 days of purchase where the platform has not been substantially accessed.')), React.createElement(Section, {num: "05", title: "Enterprise Access"}, React.createElement(P, null, 'Enterprise facilitators agree to use the platform for legitimate organisational training purposes, manage cohort codes responsibly, protect the facilitator PIN, and comply with all applicable employment, data protection, and privacy laws when administering assessments.'), React.createElement(HB, {title: "Participant Consent"}, 'Facilitators are responsible for obtaining appropriate consent from participants before administering CFI assessments and for complying with any applicable workplace data collection obligations in their jurisdiction.')), React.createElement(Section, {num: "06", title: "Permitted Use & Restrictions"}, React.createElement(P, null, 'You must not:'), React.createElement(UL, {items: [
              'Reproduce, distribute, or create derivative works of the platform content without written permission.',
              'Reverse engineer, decompile, or extract the source code of the platform.',
              'Use the platform to train competing AI or machine learning systems.',
              'Share, resell, or sublicense your account access to third parties.',
              'Use automated tools, bots, or scripts to access or interact with the platform.',
              'Use the platform for any unlawful purpose.',
            ]})), React.createElement(Section, {num: "07", title: "Intellectual property"}, React.createElement(P, null, 'All content on the NeuralFusion™ platform, including the curriculum, CFI assessment, cognitive framework, scoring methodologies, interface design, and software, is the intellectual property of', React.createElement("strong", {style: {color:C.text}}, 'Life Edet'), 'and is protected by Nigerian and international copyright law.'), React.createElement(P, null, 'The NeuralFusion™ name and logo are trademarks of Life Edet. You may not use these marks without prior written consent.')), React.createElement(Section, {num: "08", title: "Assessment Content & Accuracy"}, React.createElement("div", {style: { background: 'rgba(200,60,60,0.06)', border: '1px solid rgba(200,60,60,0.2)', borderLeft: '3px solid rgba(200,80,80,0.6)', padding: '18px 22px', margin: '0 0 16px', fontSize: 14, color: C.muted, lineHeight: 1.8 }}, React.createElement("div", {style: { ...syne, fontSize: 12, fontWeight: 700, color: 'rgba(240,160,160,0.85)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}, 'Not Clinical or Diagnostic'), 'NeuralFusion™ assessments are not clinical, psychological, or diagnostic tools. Results should not be used as a basis for medical or clinical evaluation. If you have concerns about your cognitive health, consult a qualified healthcare professional.'), React.createElement(P, null, 'We make no warranty that assessment results are accurate, complete, or suitable for any specific purpose beyond the developmental and training context for which they are designed.')), React.createElement(Section, {num: "09", title: "Disclaimers & Limitation of Liability"}, React.createElement(P, null, 'The platform is provided on an "as is" and "as available" basis. We disclaim all warranties, express or implied. To the maximum extent permitted by Nigerian law, our total aggregate liability shall not exceed the amount paid by you in the 12 months preceding any claim.')), React.createElement(Section, {num: "10", title: "Governing Law, Changes & Contact"}, React.createElement(P, null, 'These Terms are governed by the laws of the', React.createElement("strong", {style: {color:C.text}}, 'Federal Republic of Nigeria'), '. We may modify these Terms from time to time; continued use after changes constitutes acceptance.'), React.createElement(ContactCard, {items: [
              { label: 'Platform', value: 'NeuralFusion™' },
              { label: 'Operator', value: 'Life Edet' },
              { label: 'Website', value: 'tryneuralFusion.com' },
              { label: 'Subject Line', value: 'Terms Query: NeuralFusion' },
            ]})))
      );

      const DataContent = () => (
        React.createElement("div", null, React.createElement(Section, {num: "01", title: "Our Commitment"}, React.createElement(P, null, 'NeuralFusion™ is committed to protecting the personal data of every individual who interacts with the platform. We process personal data lawfully, fairly, and transparently in accordance with the', React.createElement("strong", {style: {color:C.text}}, 'Nigeria Data Protection Act 2023 (NDPA)'), 'and regulations issued by the Nigeria Data Protection Commission (NDPC).'), React.createElement(HB, {title: "Regulatory Framework"}, 'This policy is written in compliance with the NDPA 2023. Where enterprise clients operate across jurisdictions subject to additional frameworks (such as GDPR), this policy is designed to be compatible with those requirements.')), React.createElement(Section, {num: "02", title: "Data controller"}, React.createElement(ContactCard, {items: [
              { label: 'Controller', value: 'Life Edet' },
              { label: 'Trading As', value: 'NeuralFusion™' },
              { label: 'Platform', value: 'tryneuralFusion.com' },
              { label: 'Jurisdiction', value: 'Federal Republic of Nigeria' },
            ]})), React.createElement(Section, {num: "03", title: "Data we process"}, React.createElement(DataTable, {rows: [
              ['Name & Email', 'Account creation, authentication, communications', 'Contract performance'],
              ['CFI Assessment Responses', 'Cognitive profiling and personalised insights', 'Contract performance / Consent'],
              ['Lesson Progress', 'Curriculum delivery and completion tracking', 'Contract performance'],
              ['Enterprise Cohort Data', 'Cohort management and reporting', 'Contract performance / Legitimate interests'],
              ['Payment Records', 'Transaction processing and fraud prevention', 'Contract performance / Legal obligation'],
              ['Usage & Device Data', 'Platform security, analytics, improvements', 'Legitimate interests'],
            ]})), React.createElement(Section, {num: "04", title: "Data Retention"}, React.createElement(UL, {items: [
              'Active account data: Retained for the lifetime of your account until you request deletion.',
              'CFI assessment results: Retained for the duration of your account. Enterprise cohort results retained for 12 months after cohort end unless otherwise agreed.',
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
              'Access control: Row-level security policies in Supabase ensure users can only access their own data. Enterprise data is segmented by cohort code.',
              'Authentication: Secure session-based authentication via Supabase Auth with password hashing and token management.',
              'Administrative access: Restricted and subject to strong credential requirements.',
            ]})), React.createElement(Section, {num: "07", title: "Your data rights"}, React.createElement(P, null, 'Under the NDPA 2023, you have the right to be informed, the right of access, rectification, erasure, restriction of processing, data portability, and the right to object to certain processing. To exercise any right, contact us at the details below. We will respond within', React.createElement("strong", {style: {color:C.text}}, '30 days'), '.')), React.createElement(Section, {num: "08", title: "Data Breach Response"}, React.createElement(P, null, 'In the event of a personal data breach, we will assess the breach without undue delay, notify the NDPC within 72 hours where required, notify affected individuals where there is high risk to their rights, and take appropriate remedial action.')), React.createElement(Section, {num: "09", title: "Contact & Complaints"}, React.createElement(P, null, 'For all data protection enquiries or to report a security concern:'), React.createElement(ContactCard, {items: [
              { label: 'Data Controller', value: 'Life Edet / NeuralFusion™' },
              { label: 'Website', value: 'tryneuralFusion.com' },
              { label: 'Subject Line', value: 'Data Protection: NeuralFusion' },
              { label: 'Response Time', value: 'Within 30 days' },
            ]}), React.createElement(P, null, 'If unsatisfied with our response, you may lodge a complaint with the', React.createElement("strong", {style: {color:C.text}}, 'Nigeria Data Protection Commission (NDPC)'), 'at ndpc.gov.ng.')))
      );

      return (
        React.createElement("div", {style: { paddingTop: 80, paddingBottom: 120, minHeight: '100vh' }}, React.createElement("div", {style: { maxWidth: 900, margin: '0 auto', padding: '60px 24px 0' }}, React.createElement("div", {style: { marginBottom: 48 }}, React.createElement("div", {style: { ...mono, fontSize: 9, letterSpacing: 4, color: C.cyan, marginBottom: 16, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 12 }}, React.createElement("span", {style: { width: 28, height: 1, background: C.cyan, opacity: 0.5, display: 'inline-block' }}), 'Legal Documentation'), React.createElement("h1", {style: { ...syne, fontSize: 'clamp(16px,1.5vw,20px)', fontWeight: 800, color: C.text, letterSpacing: '-0.04em', lineHeight: 0.96, marginBottom: 16 }}, 'Legal &amp;', React.createElement("span", {style: { color: C.cyan }}, 'Compliance')), React.createElement("p", {style: { fontSize: 14, color: C.muted, maxWidth: 520, lineHeight: 1.8 }}, 'Our commitments to your privacy, the terms governing your use of NeuralFusion™, and our data protection practices under the Nigeria Data Protection Act 2023.'), React.createElement("div", {style: { display: 'flex', gap: 32, marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' }}, [{ label: 'Effective', value: '4 June 2026' }, { label: 'Governing Law', value: 'Nigeria (NDPA 2023)' }, { label: 'Controller', value: 'Life Edet' }].map((m,i) => (
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
        { label:'Home', v:'home' },{ label:'Architecture', v:'four-brains' },
        { label:'Assess', v:'cfi' },{ label:'Protocols', v:'training' },
        { label:'Analytics', v:'analytics' },{ label:'Academy', v:'lessons' },
        { label:'About', v:'about' },
      ];
      const legalLinks = [
        { label:'Privacy policy', v:'legal', tab:'privacy' },
        { label:'Terms & conditions', v:'legal', tab:'terms' },
        { label:'Data Protection', v:'legal', tab:'data' },
      ];
      return (
        React.createElement("footer", {style: { borderTop:`1px solid ${C.border}`, padding:'48px 24px 32px', textAlign:'center' }}, React.createElement("div", {style: { maxWidth:1200, margin:'0 auto' }}, React.createElement("div", {style: { display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:32 }}, React.createElement("div", {style: { ...mono, fontSize:15, color:C.cyan }}, '◈'), React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:C.text, letterSpacing:2, overflowWrap:'break-word', minWidth:0}}, 'NeuralFusion™')), React.createElement("div", {style: { display:'flex', justifyContent:'center', flexWrap:'wrap', gap:24, marginBottom:20 }}, links.map(l=>(
                React.createElement("button", {key: l.v, onClick: ()=>setView(l.v), style: { background:'none', border:'none', color:C.muted, fontSize:12, cursor:'pointer' }}, l.label)
              ))), React.createElement("div", {style: { display:'flex', justifyContent:'center', flexWrap:'wrap', gap:20, marginBottom:32, paddingTop:16, borderTop:`1px solid ${C.border}` }}, legalLinks.map(l=>(
                React.createElement("button", {key: l.label, onClick: ()=>setView(l.v), style: { background:'none', border:'none', color:C.dim, fontSize:10, cursor:'pointer', fontFamily:"'Space Mono', monospace", letterSpacing:1 }}, l.label)
              ))), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.dim }}, '© 2026 LIFE EDET · NEURALFUSION™ COGNITIVE PERFORMANCE OS · ALL RIGHTS RESERVED')))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  ADMIN PORTAL: Full Platform Management
    // ═══════════════════════════════════════════════════════════════════
    function AdminView({ user, setView, onPriceChange }) {
      const [tab, setTab]           = useState('overview');

      // Data
      const [users,      setUsers]      = useState([]);
      const [cfiData,    setCfiData]    = useState([]);
      const [entResults, setEntResults] = useState([]);
      const [cohorts,    setCohorts]    = useState([]);
      const [loading,    setLoading]    = useState(false);
      const [actionMsg,  setActionMsg]  = useState('');
      const [actionType, setActionType] = useState('info'); // info | success | error

      // Pricing
      const [proPrice,    setProPrice]    = useState(() => parseInt(localStorage.getItem('nf_pro_price') || '600000'));
      const [priceInput,  setPriceInput]  = useState(() => String(parseInt(localStorage.getItem('nf_pro_price') || '600000') / 100));
      const [priceSaved,  setPriceSaved]  = useState(false);
      const [entPrice,    setEntPrice]    = useState(() => parseInt(localStorage.getItem('nf_ent_price') || '5000000'));
      const [entPriceInput, setEntPriceInput] = useState(() => String(parseInt(localStorage.getItem('nf_ent_price') || '5000000') / 100));
      const [paystackKeyInput, setPaystackKeyInput] = useState(() => localStorage.getItem('nf_paystack_key') || '');
      const [keySaved, setKeySaved] = useState(false);

      // Users search / filter
      const [userSearch, setUserSearch] = useState('');
      const [proFilter,  setProFilter]  = useState('all');

      // CFI filter
      const [cfiFilter, setCfiFilter] = useState('all');

      // Settings toggles
      const [maintenanceMode, setMaintenanceMode] = useState(false);
      const [registrationOpen, setRegistrationOpen] = useState(true);

      // Lessons editor
      const [editingLesson, setEditingLesson] = useState(null);
      const [lessonDraft, setLessonDraft] = useState({});

      // CFI Items editor
      const [editingCFI, setEditingCFI] = useState(null);
      const [cfiDraft, setCfiDraft] = useState({});
      const [localCFIItems, setLocalCFIItems] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nf_cfi_items') || 'null') || CFI_ITEMS; } catch(_) { return CFI_ITEMS; }
      });

      // Cohort manager
      const [newCohort, setNewCohort] = useState({ name:'', org:'', facilitator:'', startDate:'', maxParticipants:'' });
      const [localCohorts, setLocalCohorts] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nf_cohorts') || '[]'); } catch(_) { return []; }
      });

      // Broadcast
      const [broadcastMsg, setBroadcastMsg] = useState('');
      const [broadcastTarget, setBroadcastTarget] = useState('all');
      const [broadcasts, setBroadcasts] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nf_broadcasts') || '[]'); } catch(_) { return []; }
      });

      // Branding
      const [brandSettings, setBrandSettings] = useState(() => {
        try { return JSON.parse(localStorage.getItem('nf_brand') || 'null') || { tagline:'The World\'s First Cognitive Performance Operating System', ctaText:'Begin Your Assessment', heroTitle:'Most people were never taught HOW to think.', announcementBar:'', announcementActive:false }; } catch(_) { return { tagline:'The World\'s First Cognitive Performance Operating System', ctaText:'Begin Your Assessment', heroTitle:'Most people were never taught HOW to think.', announcementBar:'', announcementActive:false }; }
      });

      // Enterprise results filter
      const [entCohortFilter, setEntCohortFilter] = useState('all');

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
          setUsers(usersRes.data || []);
          setCfiData(cfiRes.data || []);
          try {
            const { data: s } = await sb.from('platform_settings').select('*').eq('key','pro_price').maybeSingle();
            if (s?.value) { setProPrice(s.value); setPriceInput(String(s.value/100)); }
          } catch(_) {}
          try {
            const { data: pk } = await sb.from('platform_settings').select('text_value').eq('key','paystack_public_key').maybeSingle();
            if (pk?.text_value) { setPaystackKeyInput(pk.text_value); localStorage.setItem('nf_paystack_key', pk.text_value); }
          } catch(_) {}
        } catch(e) { showMsg('Error loading data: ' + e.message, 'error'); }
        setLoading(false);
      };

      const togglePro = async (uid, current) => {
        const { error } = await sb.from('profiles').update({ is_pro: !current }).eq('id', uid);
        if (!error) {
          setUsers(u => u.map(x => x.id === uid ? {...x, is_pro: !current} : x));
          showMsg(`Pro status ${!current ? 'granted' : 'revoked'}.`, 'success');
        }
      };

      const toggleEnterprise = async (uid, current) => {
        const { error } = await sb.from('profiles').update({ is_enterprise: !current }).eq('id', uid);
        if (!error) {
          setUsers(u => u.map(x => x.id === uid ? {...x, is_enterprise: !current} : x));
          showMsg(`Enterprise access ${!current ? 'granted' : 'revoked'}.`, 'success');
        }
      };

      const deleteUser = async (uid) => {
        if (!window.confirm('Delete this user profile? This cannot be undone.')) return;
        const { error } = await sb.from('profiles').delete().eq('id', uid);
        if (!error) { setUsers(u => u.filter(x => x.id !== uid)); showMsg('User deleted.', 'success'); }
      };

      const savePrice = async () => {
        const raw = parseFloat(priceInput);
        if (isNaN(raw) || raw < 100) { showMsg('Enter a valid price (minimum ₦100).', 'error'); return; }
        const kobo = Math.round(raw * 100);
        localStorage.setItem('nf_pro_price', kobo.toString());
        setProPrice(kobo);
        if (onPriceChange) onPriceChange(kobo);
        try { await sb.from('platform_settings').upsert({ key:'pro_price', value:kobo }, { onConflict:'key' }); } catch(_) {}
        setPriceSaved(true);
        setTimeout(() => setPriceSaved(false), 3000);
        showMsg('Pro price saved.', 'success');
      };

      const saveEntPrice = () => {
        const raw = parseFloat(entPriceInput);
        if (isNaN(raw) || raw < 100) { showMsg('Invalid enterprise price.', 'error'); return; }
        const kobo = Math.round(raw * 100);
        localStorage.setItem('nf_ent_price', kobo.toString());
        setEntPrice(kobo);
        showMsg('Enterprise price saved.', 'success');
      };

      const savePaystackKey = async () => {
        const key = paystackKeyInput.trim();
        if (!key.startsWith('pk_')) { showMsg('Invalid Paystack public key. Must start with pk_', 'error'); return; }
        localStorage.setItem('nf_paystack_key', key);
        try { await setTextSetting('paystack_public_key', key); } catch(_) {}
        setKeySaved(true);
        setTimeout(() => setKeySaved(false), 3000);
        showMsg('Paystack key saved.', 'success');
      };

      const deleteCFIResult = async (id) => {
        const { error } = await sb.from('cfi_results').delete().eq('id', id);
        if (!error) { setCfiData(d => d.filter(x => x.id !== id)); showMsg('CFI result deleted.', 'success'); }
      };

      // Lessons editor
      const startEditLesson = (lesson) => {
        setEditingLesson(lesson.id);
        setLessonDraft({ ...lesson });
      };
      const saveLesson = () => {
        const saved = JSON.parse(localStorage.getItem('nf_lessons_overrides') || '{}');
        saved[lessonDraft.id] = lessonDraft;
        localStorage.setItem('nf_lessons_overrides', JSON.stringify(saved));
        setEditingLesson(null);
        showMsg('Lesson saved. Reload app to see changes.', 'success');
      };

      // CFI Items editor
      const saveCFIItem = () => {
        const updated = localCFIItems.map(i => i.id === cfiDraft.id ? { ...i, ...cfiDraft } : i);
        setLocalCFIItems(updated);
        localStorage.setItem('nf_cfi_items', JSON.stringify(updated));
        setEditingCFI(null);
        showMsg('CFI item saved.', 'success');
      };
      const addCFIItem = () => {
        const newItem = { id: Math.max(...localCFIItems.map(i=>i.id)) + 1, dim:'A', brain:'analytical', text:'New assessment item.' };
        const updated = [...localCFIItems, newItem];
        setLocalCFIItems(updated);
        localStorage.setItem('nf_cfi_items', JSON.stringify(updated));
        showMsg('New CFI item added.', 'success');
      };
      const deleteCFIItem = (id) => {
        const updated = localCFIItems.filter(i => i.id !== id);
        setLocalCFIItems(updated);
        localStorage.setItem('nf_cfi_items', JSON.stringify(updated));
        showMsg('CFI item deleted.', 'success');
      };

      // Cohorts
      const createCohort = () => {
        if (!newCohort.name || !newCohort.org) { showMsg('Name and org required.', 'error'); return; }
        const c = { ...newCohort, id: Date.now(), code: `${newCohort.org.toUpperCase().slice(0,4)}-${Date.now().toString().slice(-4)}`, created: new Date().toISOString(), status:'active', participants:[] };
        const updated = [c, ...localCohorts];
        setLocalCohorts(updated);
        localStorage.setItem('nf_cohorts', JSON.stringify(updated));
        setNewCohort({ name:'', org:'', facilitator:'', startDate:'', maxParticipants:'' });
        showMsg(`Cohort "${c.name}" created. Code: ${c.code}`, 'success');
      };
      const archiveCohort = (id) => {
        const updated = localCohorts.map(c => c.id === id ? { ...c, status: c.status==='active' ? 'archived' : 'active' } : c);
        setLocalCohorts(updated);
        localStorage.setItem('nf_cohorts', JSON.stringify(updated));
        showMsg('Cohort status updated.', 'success');
      };
      const deleteCohort = (id) => {
        if (!window.confirm('Delete this cohort?')) return;
        const updated = localCohorts.filter(c => c.id !== id);
        setLocalCohorts(updated);
        localStorage.setItem('nf_cohorts', JSON.stringify(updated));
        showMsg('Cohort deleted.', 'success');
      };

      // Broadcast
      const sendBroadcast = () => {
        if (!broadcastMsg.trim()) { showMsg('Message cannot be empty.', 'error'); return; }
        const b = { id: Date.now(), message: broadcastMsg, target: broadcastTarget, sent: new Date().toISOString(), sentBy: user?.email };
        const updated = [b, ...broadcasts];
        setBroadcasts(updated);
        localStorage.setItem('nf_broadcasts', JSON.stringify(updated));
        setBroadcastMsg('');
        showMsg(`Broadcast sent to ${broadcastTarget === 'all' ? 'all users' : broadcastTarget + ' users'}.`, 'success');
      };
      const deleteBroadcast = (id) => {
        const updated = broadcasts.filter(b => b.id !== id);
        setBroadcasts(updated);
        localStorage.setItem('nf_broadcasts', JSON.stringify(updated));
      };

      // Branding
      const saveBranding = () => {
        localStorage.setItem('nf_brand', JSON.stringify(brandSettings));
        showMsg('Branding saved. Reload app to see changes.', 'success');
      };

      /* ── LOADING ── */
      if (loading && users.length === 0) return (
        React.createElement("div", {style: { paddingTop:80, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}, React.createElement("div", {style: { textAlign:'center' }}, React.createElement("div", {style: { ...mono, fontSize:15, color:C.cyan, animation:'neuralPulse 2s ease-in-out infinite' }}, '◈'), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginTop:16 }}, 'LOADING ADMIN DATA...')))
      );

      /* ── TABS ── */
      const tabs = [
        { id:'overview',   label:'Overview',    icon:'◈' },
        { id:'users',      label:'Users',        icon:'◱' },
        { id:'cfi',        label:'CFI Results',  icon:'◎' },
        { id:'pro',        label:'Pro Subs',     icon:'★' },
        { id:'cohorts',    label:'Cohorts',      icon:'⊞' },
        { id:'ent-results',label:'Ent Results',  icon:'◇' },
        { id:'lessons',    label:'Lessons',      icon:'▤' },
        { id:'cfi-items',  label:'CFI Items',    icon:'≡' },
        { id:'broadcast',  label:'Broadcast',    icon:'◉' },
        { id:'branding',   label:'Branding',     icon:'◐' },
        { id:'pricing',    label:'Pricing',      icon:'₦' },
        { id:'settings',   label:'Settings',     icon:'⚙' },
      ];

      const proUsers     = users.filter(u => u.is_pro);
      const entUsers     = users.filter(u => u.is_enterprise);
      const filteredUsers = users.filter(u => {
        const matchSearch = !userSearch || (u.full_name||'').toLowerCase().includes(userSearch.toLowerCase()) || (u.email||'').toLowerCase().includes(userSearch.toLowerCase());
        const matchPro = proFilter === 'all' || (proFilter === 'pro' ? u.is_pro : proFilter === 'enterprise' ? u.is_enterprise : !u.is_pro);
        return matchSearch && matchPro;
      });
      const filteredCFI = cfiData.filter(r => cfiFilter === 'all' || r.band === cfiFilter);
      const bandCounts  = cfiData.reduce((a,r) => { a[r.band] = (a[r.band]||0)+1; return a; }, {});
      const bandColors  = { 'Integrated':'#7AAFCF','Moderate fragmentation':'#C4A050','High fragmentation':'#FB8C00','Critical fragmentation':'#F87171' };
      const msgColor = actionType === 'success' ? '#7AAFCF' : actionType === 'error' ? '#F87171' : '#C4A050';

      return (
        React.createElement("div", {style: { paddingTop:80, paddingBottom:60, minHeight:'100vh' }}, React.createElement("div", {style: { maxWidth:1280, margin:'0 auto', padding:'32px 24px' }}, React.createElement("div", {style: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:32 }}, React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:8 }}, 'ADMIN PORTAL · NEURALFUSION™'), React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:C.text, marginBottom:4, overflowWrap:'break-word', minWidth:0}}, 'Control Dashboard'), React.createElement("div", {style: { fontSize:13, color:C.muted }}, 'Signed in as', React.createElement("span", {style: { color:C.cyan }}, user?.email))), React.createElement("div", {style: { display:'flex', gap:10, alignItems:'center' }}, actionMsg && (
                  React.createElement("div", {style: { padding:'8px 16px', background:`rgba(${actionType==='error'?'248,113,113':actionType==='success'?'122,175,207':'196,160,80'},0.1)`, border:`1px solid rgba(${actionType==='error'?'248,113,113':actionType==='success'?'122,175,207':'196,160,80'},0.3)`, borderRadius:2, ...mono, fontSize:10, color:msgColor }}, actionMsg)
                ), React.createElement("button", {className: "btn-outline", style: { fontSize:10 }, onClick: loadAdminData}, '↺ Refresh'), React.createElement("button", {className: "btn-ghost", style: { fontSize:10 }, onClick: () => setView('home')}, '← Exit Admin'))), React.createElement("div", {style: { display:'flex', gap:4, marginBottom:32, background:C.deep, padding:4, borderRadius:4, flexWrap:'wrap' }}, tabs.map(t => (
                React.createElement("button", {key: t.id, onClick: () => setTab(t.id), style: {
                  flex:'1 1 auto', padding:'10px 16px',
                  background: tab===t.id ? C.surface : 'transparent',
                  border: tab===t.id ? `1px solid ${C.borderBright}` : '1px solid transparent',
                  color: tab===t.id ? C.cyan : C.muted,
                  ...mono, fontSize:9, letterSpacing:1, cursor:'pointer', borderRadius:3,
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  transition:'all 0.2s',
                }}, React.createElement("span", null, t.icon), React.createElement("span", null, t.label.toUpperCase()))
              ))), loading && (
              React.createElement("div", {style: { textAlign:'center', padding:'60px', color:C.muted }}, React.createElement("div", {style: { ...mono, fontSize:17, color:C.cyan, animation:'neuralPulse 2s ease-in-out infinite' }}, '◈'), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, marginTop:16 }}, 'LOADING DATA...'))
            ), !loading && (
              React.createElement(React.Fragment, null, tab === 'overview' && (
                  React.createElement("div", null, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(180px,100%),1fr))', gap:16, marginBottom:32 }}, [
                        { label:'Total users',       value:users.length,         color:'#C4A050', icon:'◱' },
                        { label:'PRO subscribers',   value:proUsers.length,       color:'#E2BE78', icon:'★' },
                        { label:'Enterprise users',  value:entUsers.length,       color:'#7AAFCF', icon:'⊞' },
                        { label:'CFI assessments',   value:cfiData.length,        color:'#D4AF6A', icon:'◎' },
                        { label:'Active cohorts',    value:localCohorts.filter(c=>c.status==='active').length, color:'#4CF7C0', icon:'◇' },
                        { label:'FREE users',        value:users.filter(u=>!u.is_pro).length, color:'#9A8A6A', icon:'◰' },
                      ].map((s,i) => (
                        React.createElement("div", {key: i, className: "card bento-shimmer", style: { padding:'24px 20px' }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#8A7A5A' }}, s.label), React.createElement("div", {style: { ...mono, fontSize:14, color:s.color, textShadow:`0 0 12px ${s.color}66` }}, s.icon)), React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:800, color:s.color, lineHeight:1.2, letterSpacing:'-0.02em', overflowWrap:'break-word', minWidth:0}}, s.value))
                      ))), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(min(320px,100%),1fr))', gap:24, marginBottom:24 }}, React.createElement("div", {className: "card", style: { padding:'28px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:20 }}, 'CFI band distribution'), Object.keys(bandColors).map(band => {
                          const count = bandCounts[band] || 0;
                          const pct   = cfiData.length ? Math.round(count/cfiData.length*100) : 0;
                          return (
                            React.createElement("div", {key: band, style: { marginBottom:16 }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', marginBottom:6 }}, React.createElement("div", {style: { fontSize:12, color:C.muted }}, band), React.createElement("div", {style: { ...mono, fontSize:10, color:bandColors[band] }}, count, '(', pct, '%)')), React.createElement("div", {style: { height:4, background:C.panel, borderRadius:2 }}, React.createElement("div", {style: { width:`${pct}%`, height:'100%', background:bandColors[band], borderRadius:2, transition:'width 0.8s ease' }})))
                          );
                        }), cfiData.length === 0 && React.createElement("div", {style: { color:C.dim, fontSize:13 }}, 'No CFI data yet.')), React.createElement("div", {className: "card", style: { padding:'28px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:20 }}, 'Recent signups'), users.slice(0,8).map((u,i) => (
                          React.createElement("div", {key: u.id, style: { display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:`1px solid ${C.border}` }}, React.createElement("div", {style: {
                              width:32, height:32, borderRadius:'50%',
                              background:`radial-gradient(circle, ${C.cyan}20, transparent)`,
                              border:`1px solid ${C.border}`,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              ...mono, fontSize:11, color:C.cyan, flexShrink:0,
                            }}, (u.full_name||u.email||'?')[0].toUpperCase()), React.createElement("div", {style: { flex:1, minWidth:0 }}, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, u.full_name || 'Unnamed'), React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted, letterSpacing:1 }}, u.email || u.id?.slice(0,12))), u.is_pro && React.createElement("div", {style: { ...mono, fontSize:8, color:'#E2BE78', background:'rgba(226,190,120,0.1)', border:'1px solid rgba(226,190,120,0.25)', padding:'3px 8px', borderRadius:100 }}, 'Pro'), u.is_enterprise && React.createElement("div", {style: { ...mono, fontSize:8, color:'#7AAFCF', background:'rgba(122,175,207,0.1)', border:'1px solid rgba(122,175,207,0.25)', padding:'3px 8px', borderRadius:100 }}, 'ENT'))
                        )), users.length === 0 && React.createElement("div", {style: { color:C.dim, fontSize:13 }}, 'No users yet.')), React.createElement("div", {className: "card", style: { padding:'28px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:20 }}, 'Quick actions'), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:10 }}, [
                            { label:'Manage Users', desc:'Grant/revoke pro & enterprise', tab:'users', icon:'◱' },
                            { label:'View CFI Results', desc:'Filter and delete assessments', tab:'cfi', icon:'◎' },
                            { label:'Create Cohort', desc:'Launch enterprise cohort', tab:'cohorts', icon:'⊞' },
                            { label:'Send Broadcast', desc:'Message to all users', tab:'broadcast', icon:'◉' },
                            { label:'Edit Pricing', desc:'Pro & enterprise prices', tab:'pricing', icon:'₦' },
                            { label:'Edit Branding', desc:'CTA text, hero content', tab:'branding', icon:'◐' },
                          ].map((a,i) => (
                            React.createElement("button", {key: i, onClick: () => setTab(a.tab), style: {
                              display:'flex', alignItems:'center', gap:12,
                              padding:'12px 14px', background:C.deep,
                              border:`1px solid ${C.border}`, borderRadius:4,
                              cursor:'pointer', textAlign:'left', transition:'border-color 0.2s',
                            }, onMouseEnter: e => e.currentTarget.style.borderColor=C.borderBright, onMouseLeave: e => e.currentTarget.style.borderColor=C.border}, React.createElement("span", {style: { ...mono, fontSize:14, color:C.cyan }}, a.icon), React.createElement("div", null, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500 }}, a.label), React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted, letterSpacing:1 }}, a.desc)))
                          )))), React.createElement("div", {className: "card", style: { padding:'28px', borderColor:'rgba(196,160,80,0.25)' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:20 }}, 'Revenue snapshot'), [
                          { label:'Pro Price', value:`₦${(proPrice/100).toLocaleString()}`, color:C.cyan },
                          { label:'Est. Pro Revenue', value:`₦${((proUsers.length * proPrice)/100).toLocaleString()}`, color:'#E2BE78' },
                          { label:'Enterprise Price', value:`₦${(entPrice/100).toLocaleString()}`, color:'#7AAFCF' },
                          { label:'Est. Ent Revenue', value:`₦${((entUsers.length * entPrice)/100).toLocaleString()}`, color:'#4CF7C0' },
                          { label:'Pro Conversion', value:`${users.length ? Math.round(proUsers.length/users.length*100) : 0}%`, color:'#D4AF6A' },
                        ].map((r,i) => (
                          React.createElement("div", {key: i, style: { display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}, React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted, letterSpacing:1.5 }}, r.label.toUpperCase()), React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:700, color:r.color, overflowWrap:'break-word', minWidth:0}}, r.value))
                        )), React.createElement("button", {className: "btn-outline", style: { fontSize:10, marginTop:16 }, onClick: () => setTab('pricing')}, 'Edit Pricing →'))))
                ), tab === 'users' && (
                  React.createElement("div", null, React.createElement("div", {style: { display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}, React.createElement("input", {value: userSearch, onChange: e => setUserSearch(e.target.value), placeholder: "Search by name or email...", style: { flex:1, minWidth:200, fontSize:13 }}), React.createElement("div", {style: { display:'flex', gap:4, background:C.deep, padding:4, borderRadius:3 }}, ['all','pro','enterprise','free'].map(f => (
                          React.createElement("button", {key: f, onClick: () => setProFilter(f), style: {
                            padding:'8px 14px', background:proFilter===f?C.surface:'transparent',
                            border:proFilter===f?`1px solid ${C.borderBright}`:'1px solid transparent',
                            color:proFilter===f?C.cyan:C.muted,
                            ...mono, fontSize:9, letterSpacing:1, cursor:'pointer', borderRadius:2,
                          }}, f)
                        ))), React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted, letterSpacing:2 }}, filteredUsers.length, 'USERS')), React.createElement("div", {className: "card", style: { overflow:'hidden' }}, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'1fr 1.5fr 70px 70px 80px 150px', gap:12, padding:'14px 20px', borderBottom:`1px solid ${C.border}`, background:C.deep }}, ['NAME','EMAIL','Pro','ENT','JOINED','ACTIONS'].map(h => (
                          React.createElement("div", {key: h, style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, h)
                        ))), React.createElement("div", {style: { maxHeight:560, overflowY:'auto' }}, filteredUsers.length === 0 && (
                          React.createElement("div", {style: { padding:'40px', textAlign:'center', color:C.dim, fontSize:13 }}, 'No users match filter.')
                        ), filteredUsers.map((u,i) => (
                          React.createElement("div", {key: u.id, style: {
                            display:'grid', gridTemplateColumns:'1fr 1.5fr 70px 70px 80px 150px', gap:12,
                            padding:'12px 20px', borderBottom:`1px solid ${C.border}`,
                            transition:'background 0.15s',
                          }, onMouseEnter: e => e.currentTarget.style.background=C.deep, onMouseLeave: e => e.currentTarget.style.background='transparent'}, React.createElement("div", {style: { fontSize:12, color:C.text, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, u.full_name || 'N/A'), React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, u.email || u.id?.slice(0,16)+'...'), React.createElement("div", null, u.is_pro
                                ? React.createElement("span", {style: { ...mono, fontSize:8, color:'#E2BE78', background:'rgba(226,190,120,0.1)', border:'1px solid rgba(226,190,120,0.25)', padding:'3px 8px', borderRadius:100 }}, 'Pro')
                                : React.createElement("span", {style: { ...mono, fontSize:8, color:C.dim, background:C.deep, border:`1px solid ${C.border}`, padding:'3px 8px', borderRadius:100 }}, '--')
                              ), React.createElement("div", null, u.is_enterprise
                                ? React.createElement("span", {style: { ...mono, fontSize:8, color:'#7AAFCF', background:'rgba(122,175,207,0.1)', border:'1px solid rgba(122,175,207,0.25)', padding:'3px 8px', borderRadius:100 }}, 'ENT')
                                : React.createElement("span", {style: { ...mono, fontSize:8, color:C.dim, background:C.deep, border:`1px solid ${C.border}`, padding:'3px 8px', borderRadius:100 }}, '--')
                              ), React.createElement("div", {style: { ...mono, fontSize:9, color:C.dim }}, u.created_at ? new Date(u.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}) : '--'), React.createElement("div", {style: { display:'flex', gap:6, flexWrap:'wrap' }}, React.createElement("button", {onClick: () => togglePro(u.id, u.is_pro), style: {
                                ...mono, fontSize:8, padding:'4px 10px', borderRadius:2, cursor:'pointer',
                                background: u.is_pro ? 'rgba(248,113,113,0.1)' : 'rgba(226,190,120,0.1)',
                                border: u.is_pro ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(226,190,120,0.3)',
                                color: u.is_pro ? '#F87171' : '#E2BE78',
                              }}, u.is_pro ? 'Revoke Pro' : 'Pro +'), React.createElement("button", {onClick: () => toggleEnterprise(u.id, u.is_enterprise), style: {
                                ...mono, fontSize:8, padding:'4px 10px', borderRadius:2, cursor:'pointer',
                                background: u.is_enterprise ? 'rgba(248,113,113,0.1)' : 'rgba(122,175,207,0.1)',
                                border: u.is_enterprise ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(122,175,207,0.3)',
                                color: u.is_enterprise ? '#F87171' : '#7AAFCF',
                              }}, u.is_enterprise ? 'Revoke Ent' : 'Ent +'), React.createElement("button", {onClick: () => deleteUser(u.id), style: {
                                ...mono, fontSize:8, padding:'4px 10px', borderRadius:2, cursor:'pointer',
                                background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.2)', color:'#F87171',
                              }}, '✕')))
                        )))))
                ), tab === 'cfi' && (
                  React.createElement("div", null, React.createElement("div", {style: { display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}, React.createElement("div", {style: { display:'flex', gap:4, background:C.deep, padding:4, borderRadius:3, flexWrap:'wrap' }}, ['all','Integrated','Moderate fragmentation','High Fragmentation','Critical Fragmentation'].map(f => (
                          React.createElement("button", {key: f, onClick: () => setCfiFilter(f), style: {
                            padding:'7px 12px', background:cfiFilter===f?C.surface:'transparent',
                            border:cfiFilter===f?`1px solid ${C.borderBright}`:'1px solid transparent',
                            color:cfiFilter===f?C.cyan:C.muted,
                            ...mono, fontSize:8, letterSpacing:1.5, cursor:'pointer', borderRadius:2,
                          }}, f === 'all' ? 'ALL' : f.toUpperCase().split(' ')[0])
                        ))), React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted, letterSpacing:2 }}, filteredCFI.length, 'RESULTS')), React.createElement("div", {className: "card", style: { overflow:'hidden' }}, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'1.5fr 80px 160px 120px 100px 80px', gap:12, padding:'14px 20px', borderBottom:`1px solid ${C.border}`, background:C.deep }}, ['USER ID','SCORE','BAND','DOMINANT','DATE','ACTION'].map(h => (
                          React.createElement("div", {key: h, style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, h)
                        ))), React.createElement("div", {style: { maxHeight:520, overflowY:'auto' }}, filteredCFI.length === 0 && (
                          React.createElement("div", {style: { padding:'40px', textAlign:'center', color:C.dim, fontSize:13 }}, 'No CFI results', cfiFilter !== 'all' ? ' for this band' : '', '.')
                        ), filteredCFI.map((r,i) => {
                          const bColor = bandColors[r.band] || C.cyan;
                          return (
                            React.createElement("div", {key: r.id, style: {
                              display:'grid', gridTemplateColumns:'1.5fr 80px 160px 120px 100px 80px', gap:12,
                              padding:'14px 20px', borderBottom:`1px solid ${C.border}`,
                              transition:'background 0.15s',
                            }, onMouseEnter: e => e.currentTarget.style.background=C.deep, onMouseLeave: e => e.currentTarget.style.background='transparent'}, React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, r.user_id?.slice(0,18), '...'), React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:800, color:bColor, overflowWrap:'break-word', minWidth:0}}, r.total_score), React.createElement("div", null, React.createElement("span", {style: { ...mono, fontSize:8, color:bColor, background:`${bColor}12`, border:`1px solid ${bColor}30`, padding:'3px 8px', borderRadius:100 }}, r.band?.split(' ')[0])), React.createElement("div", {style: { fontSize:12, color:C.muted, textTransform:'capitalize' }}, r.dominant_brain || r.dominantBrain || 'N/A'), React.createElement("div", {style: { ...mono, fontSize:9, color:C.dim }}, r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}) : '--'), React.createElement("div", null, React.createElement("button", {onClick: () => deleteCFIResult(r.id), style: {
                                  ...mono, fontSize:8, padding:'4px 10px', cursor:'pointer',
                                  background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)',
                                  color:'#F87171', borderRadius:2,
                                }}, 'Delete')))
                          );
                        }))))
                ), tab === 'pro' && (
                  React.createElement("div", null, React.createElement("div", {style: { display:'flex', gap:16, marginBottom:24, flexWrap:'wrap' }}, React.createElement("div", {className: "card", style: { padding:'24px 28px', flex:'none' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#8A7A5A', marginBottom:10 }}, 'PRO subscribers'), React.createElement("div", {style: { ...syne, fontSize:40, fontWeight:800, color:'#E2BE78', overflowWrap:'break-word', minWidth:0}}, proUsers.length)), React.createElement("div", {className: "card", style: { padding:'24px 28px', flex:'none' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#8A7A5A', marginBottom:10 }}, 'Conversion rate'), React.createElement("div", {style: { ...syne, fontSize:40, fontWeight:800, color:C.cyan, overflowWrap:'break-word', minWidth:0}}, users.length ? Math.round(proUsers.length/users.length*100) : 0, '%')), React.createElement("div", {className: "card", style: { padding:'24px 28px', flex:'none' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#8A7A5A', marginBottom:10 }}, 'EST. REVENUE'), React.createElement("div", {style: { ...syne, fontSize:40, fontWeight:800, color:'#7AAFCF', overflowWrap:'break-word', minWidth:0}}, `₦${((proUsers.length * proPrice / 100)).toLocaleString()}`))), React.createElement("div", {className: "card", style: { overflow:'hidden' }}, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'1fr 1.5fr 100px 120px', gap:16, padding:'14px 20px', borderBottom:`1px solid ${C.border}`, background:C.deep }}, ['NAME','EMAIL','STATUS','ACTION'].map(h => (
                          React.createElement("div", {key: h, style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, h)
                        ))), React.createElement("div", {style: { maxHeight:480, overflowY:'auto' }}, proUsers.length === 0 && (
                          React.createElement("div", {style: { padding:'40px', textAlign:'center', color:C.dim, fontSize:13 }}, 'No Pro subscribers yet.')
                        ), proUsers.map((u,i) => (
                          React.createElement("div", {key: u.id, style: {
                            display:'grid', gridTemplateColumns:'1fr 1.5fr 100px 120px', gap:16,
                            padding:'14px 20px', borderBottom:`1px solid ${C.border}`,
                            transition:'background 0.15s',
                          }, onMouseEnter: e => e.currentTarget.style.background=C.deep, onMouseLeave: e => e.currentTarget.style.background='transparent'}, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500 }}, u.full_name || 'N/A'), React.createElement("div", {style: { ...mono, fontSize:10, color:C.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}, u.email || u.id?.slice(0,16)), React.createElement("div", null, React.createElement("span", {style: { ...mono, fontSize:8, color:'#E2BE78', background:'rgba(226,190,120,0.1)', border:'1px solid rgba(226,190,120,0.25)', padding:'3px 8px', borderRadius:100 }}, 'Active PRO')), React.createElement("div", null, React.createElement("button", {onClick: () => togglePro(u.id, true), style: {
                                ...mono, fontSize:8, padding:'5px 12px', cursor:'pointer',
                                background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)',
                                color:'#F87171', borderRadius:2,
                              }}, 'Revoke')))
                        )))))
                ), tab === 'cohorts' && (
                  React.createElement("div", null, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24, marginBottom:32 }}, React.createElement("div", {className: "card", style: { padding:'28px', borderColor:'rgba(76,247,192,0.2)' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#4CF7C0', marginBottom:16 }}, 'Create new cohort'), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:12 }}, [
                            { key:'name', label:'Cohort Name', placeholder:'e.g. Leadership Cohort A' },
                            { key:'org', label:'Organisation', placeholder:'e.g. Acme Corp' },
                            { key:'facilitator', label:'Facilitator Name', placeholder:'e.g. Jane Smith' },
                            { key:'startDate', label:'Start Date', placeholder:'', type:'date' },
                            { key:'maxParticipants', label:'Max Participants', placeholder:'e.g. 20', type:'number' },
                          ].map(f => (
                            React.createElement("div", {key: f.key}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:5 }}, f.label.toUpperCase()), React.createElement("input", {type: f.type || 'text', value: newCohort[f.key], onChange: e => setNewCohort(p => ({...p, [f.key]: e.target.value})), placeholder: f.placeholder, style: { fontSize:13, width:'100%' }}))
                          )), React.createElement("button", {className: "btn-primary", onClick: createCohort, style: { marginTop:8 }}, 'Create Cohort →'))), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:16 }}, [
                          { label:'Total cohorts', value:localCohorts.length, color:'#C4A050' },
                          { label:'ACTIVE', value:localCohorts.filter(c=>c.status==='active').length, color:'#4CF7C0' },
                          { label:'ARCHIVED', value:localCohorts.filter(c=>c.status==='archived').length, color:C.muted },
                        ].map((s,i) => (
                          React.createElement("div", {key: i, className: "card", style: { padding:'20px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted }}, s.label), React.createElement("div", {style: { ...syne, fontSize:17, fontWeight:800, color:s.color, overflowWrap:'break-word', minWidth:0}}, s.value))
                        )))), React.createElement("div", {className: "card", style: { overflow:'hidden' }}, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 100px 80px 150px', gap:12, padding:'14px 20px', borderBottom:`1px solid ${C.border}`, background:C.deep }}, ['NAME','ORG','CODE','STARTED','STATUS','ACTIONS'].map(h => (
                          React.createElement("div", {key: h, style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, h)
                        ))), React.createElement("div", {style: { maxHeight:480, overflowY:'auto' }}, localCohorts.length === 0 && (
                          React.createElement("div", {style: { padding:'40px', textAlign:'center', color:C.dim, fontSize:13 }}, 'No cohorts yet. Create one above.')
                        ), localCohorts.map((c,i) => (
                          React.createElement("div", {key: c.id, style: {
                            display:'grid', gridTemplateColumns:'1.5fr 1fr 1fr 100px 80px 150px', gap:12,
                            padding:'14px 20px', borderBottom:`1px solid ${C.border}`, transition:'background 0.15s',
                          }, onMouseEnter: e => e.currentTarget.style.background=C.deep, onMouseLeave: e => e.currentTarget.style.background='transparent'}, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500 }}, c.name), React.createElement("div", {style: { fontSize:12, color:C.muted }}, c.org), React.createElement("div", {style: { ...mono, fontSize:10, color:'#4CF7C0' }}, c.code), React.createElement("div", {style: { ...mono, fontSize:9, color:C.dim }}, c.startDate || '--'), React.createElement("div", null, React.createElement("span", {style: { ...mono, fontSize:8, padding:'3px 8px', borderRadius:100,
                                color: c.status==='active' ? '#4CF7C0' : C.dim,
                                background: c.status==='active' ? 'rgba(76,247,192,0.1)' : C.cyanDim,
                                border: `1px solid ${c.status==='active' ? 'rgba(76,247,192,0.3)' : C.border}`,
                              }}, c.status?.toUpperCase())), React.createElement("div", {style: { display:'flex', gap:6 }}, React.createElement("button", {onClick: () => archiveCohort(c.id), style: { ...mono, fontSize:8, padding:'4px 10px', borderRadius:2, cursor:'pointer', background:'rgba(196,160,80,0.08)', border:`1px solid rgba(196,160,80,0.2)`, color:C.cyan }}, c.status==='active' ? 'Archive' : 'Restore'), React.createElement("button", {onClick: () => deleteCohort(c.id), style: { ...mono, fontSize:8, padding:'4px 10px', borderRadius:2, cursor:'pointer', background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.2)', color:'#F87171' }}, '✕')))
                        )))))
                ), tab === 'ent-results' && (
                  React.createElement("div", null, React.createElement("div", {style: { display:'flex', gap:16, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}, React.createElement("div", {style: { display:'flex', gap:4, background:C.deep, padding:4, borderRadius:3, flexWrap:'wrap' }}, ['all', ...localCohorts.map(c=>c.code)].map(f => (
                          React.createElement("button", {key: f, onClick: () => setEntCohortFilter(f), style: {
                            padding:'7px 12px', background:entCohortFilter===f?C.surface:'transparent',
                            border:entCohortFilter===f?`1px solid ${C.borderBright}`:'1px solid transparent',
                            color:entCohortFilter===f?C.cyan:C.muted,
                            ...mono, fontSize:8, letterSpacing:1.5, cursor:'pointer', borderRadius:2,
                          }}, f === 'all' ? 'All cohorts' : f)
                        )))), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:24 }}, [
                        { label:'Enterprise users', value:entUsers.length, color:'#7AAFCF' },
                        { label:'Active cohorts', value:localCohorts.filter(c=>c.status==='active').length, color:'#4CF7C0' },
                        { label:'Avg CFI score', value: cfiData.length ? Math.round(cfiData.reduce((a,r)=>a+(r.total_score||0),0)/cfiData.length) : 'N/A', color:'#C4A050' },
                      ].map((s,i) => (
                        React.createElement("div", {key: i, className: "card", style: { padding:'20px 24px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:8 }}, s.label), React.createElement("div", {style: { ...syne, fontSize:17, fontWeight:800, color:s.color, overflowWrap:'break-word', minWidth:0}}, s.value))
                      ))), React.createElement("div", {className: "card", style: { padding:'28px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:20 }}, 'Enterprise users by cohort'), entUsers.length === 0 && (
                        React.createElement("div", {style: { color:C.dim, fontSize:13, textAlign:'center', padding:'40px 0' }}, 'No enterprise users found. Grant enterprise access in the Users tab.')
                      ), entUsers.map((u,i) => {
                        const userCFI = cfiData.find(r => r.user_id === u.id);
                        const bColor = userCFI ? (bandColors[userCFI.band] || C.cyan) : C.dim;
                        return (
                          React.createElement("div", {key: u.id, style: { display:'flex', alignItems:'center', gap:16, padding:'14px 0', borderBottom:`1px solid ${C.border}` }}, React.createElement("div", {style: { width:36, height:36, borderRadius:'50%', background:'rgba(76,247,192,0.08)', border:'1px solid rgba(76,247,192,0.2)', display:'flex', alignItems:'center', justifyContent:'center', ...mono, fontSize:12, color:'#4CF7C0', flexShrink:0 }}, (u.full_name||u.email||'?')[0].toUpperCase()), React.createElement("div", {style: { flex:1, minWidth:0 }}, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500 }}, u.full_name || 'Unnamed'), React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted }}, u.email || u.id?.slice(0,16))), userCFI ? (
                              React.createElement("div", {style: { textAlign:'right', flexShrink:0 }}, React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:bColor, overflowWrap:'break-word', minWidth:0}}, userCFI.total_score), React.createElement("div", {style: { ...mono, fontSize:8, color:bColor }}, userCFI.band?.split(' ')[0]))
                            ) : (
                              React.createElement("div", {style: { ...mono, fontSize:8, color:C.dim }}, 'No CFI data')
                            ), React.createElement("button", {onClick: () => toggleEnterprise(u.id, true), style: { ...mono, fontSize:8, padding:'4px 10px', borderRadius:2, cursor:'pointer', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'#F87171', flexShrink:0 }}, 'Revoke'))
                        );
                      })))
                ), tab === 'lessons' && (
                  React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:20 }}, 'Edits are saved to localStorage. Changes take effect on next app reload. The core lesson data in code is not modified.'), editingLesson !== null ? (
                      React.createElement("div", {className: "card", style: { padding:'32px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:16 }}, 'EDITING: LESSON', lessonDraft.id), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:16 }}, [
                            { key:'title', label:'Title' },
                            { key:'sub', label:'Subtitle' },
                            { key:'level', label:'Level' },
                            { key:'duration', label:'Duration' },
                          ].map(f => (
                            React.createElement("div", {key: f.key}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:5 }}, f.label.toUpperCase()), React.createElement("input", {value: lessonDraft[f.key] || '', onChange: e => setLessonDraft(p => ({...p, [f.key]: e.target.value})), style: { fontSize:13, width:'100%' }}))
                          )), React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:5 }}, 'Free'), React.createElement("div", {style: { display:'flex', gap:10 }}, [true, false].map(v => (
                                React.createElement("button", {key: String(v), onClick: () => setLessonDraft(p => ({...p, free: v})), style: {
                                  ...mono, fontSize:9, padding:'6px 16px', borderRadius:2, cursor:'pointer',
                                  background: lessonDraft.free === v ? (v ? 'rgba(76,247,192,0.15)' : 'rgba(248,113,113,0.1)') : 'transparent',
                                  border: lessonDraft.free === v ? `1px solid ${v ? '#4CF7C0' : '#F87171'}` : `1px solid ${C.border}`,
                                  color: lessonDraft.free === v ? (v ? '#4CF7C0' : '#F87171') : C.muted,
                                }}, v ? 'Free' : 'Pro Only')
                              )))), React.createElement("div", {style: { display:'flex', gap:12, marginTop:8 }}, React.createElement("button", {className: "btn-primary", onClick: saveLesson}, 'Save Lesson'), React.createElement("button", {className: "btn-ghost", onClick: () => setEditingLesson(null)}, 'Cancel'))))
                    ) : (
                      React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:12 }}, LESSONS.map(lesson => (
                          React.createElement("div", {key: lesson.id, className: "card", style: { padding:'20px 24px', display:'flex', alignItems:'center', gap:16 }}, React.createElement("div", {style: { ...mono, fontSize:11, color:C.cyan, flexShrink:0 }}, '#', lesson.id), React.createElement("div", {style: { flex:1, minWidth:0 }}, React.createElement("div", {style: { fontSize:14, color:C.text, fontWeight:600 }}, lesson.title), React.createElement("div", {style: { fontSize:12, color:C.muted, marginTop:2 }}, lesson.sub), React.createElement("div", {style: { display:'flex', gap:10, marginTop:6 }}, React.createElement("span", {style: { ...mono, fontSize:8, color:C.muted }}, lesson.level), React.createElement("span", {style: { ...mono, fontSize:8, color:C.muted }}, '·'), React.createElement("span", {style: { ...mono, fontSize:8, color:C.muted }}, lesson.duration), React.createElement("span", {style: { ...mono, fontSize:8, color:lesson.free ? '#4CF7C0' : '#E2BE78', background: lesson.free ? 'rgba(76,247,192,0.1)' : 'rgba(226,190,120,0.1)', border: `1px solid ${lesson.free ? 'rgba(76,247,192,0.3)' : 'rgba(226,190,120,0.3)'}`, padding:'1px 6px', borderRadius:100 }}, lesson.free ? 'Free' : 'Pro'))), React.createElement("button", {onClick: () => startEditLesson(lesson), style: { ...mono, fontSize:9, padding:'6px 16px', borderRadius:2, cursor:'pointer', background:C.cyanDim, border:`1px solid ${C.borderBright}`, color:C.cyan, flexShrink:0 }}, 'Edit'))
                        )))
                    ))
                ), tab === 'cfi-items' && (
                  React.createElement("div", null, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, localCFIItems.length, 'ITEMS · Changes saved to localStorage'), React.createElement("button", {className: "btn-outline", style: { fontSize:10 }, onClick: addCFIItem}, '+ Add Item')), editingCFI !== null ? (
                      React.createElement("div", {className: "card", style: { padding:'32px', marginBottom:16 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:16 }}, 'EDITING ITEM #', cfiDraft.id), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:14 }}, React.createElement("div", null, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:5 }}, 'Question text'), React.createElement("textarea", {value: cfiDraft.text || '', onChange: e => setCfiDraft(p => ({...p, text: e.target.value})), rows: 3, style: { fontSize:13, width:'100%', resize:'vertical', background:C.deep, border:`1px solid ${C.border}`, color:C.text, padding:'10px', borderRadius:4, fontFamily:'inherit' }})), React.createElement("div", {style: { display:'flex', gap:16, flexWrap:'wrap' }}, React.createElement("div", {style: { flex:1 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:5 }}, 'DIMENSION (A/I/S/R/E)'), React.createElement("input", {value: cfiDraft.dim || '', onChange: e => setCfiDraft(p => ({...p, dim: e.target.value.toUpperCase().slice(0,1)})), maxLength: 1, style: { fontSize:14, width:'100%', textAlign:'center', ...mono }})), React.createElement("div", {style: { flex:2 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:5 }}, 'Brain type'), React.createElement("select", {value: cfiDraft.brain || 'analytical', onChange: e => setCfiDraft(p => ({...p, brain: e.target.value})), style: { fontSize:13, width:'100%', background:C.deep, border:`1px solid ${C.border}`, color:C.text, padding:'10px', borderRadius:4 }}, ['analytical','intuitive','associative','reflective'].map(b => React.createElement("option", {key: b, value: b}, b))))), React.createElement("div", {style: { display:'flex', gap:12 }}, React.createElement("button", {className: "btn-primary", onClick: saveCFIItem}, 'Save Item'), React.createElement("button", {className: "btn-ghost", onClick: () => setEditingCFI(null)}, 'Cancel'))))
                    ) : null, React.createElement("div", {className: "card", style: { overflow:'hidden' }}, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'40px 40px 1fr 120px 100px', gap:12, padding:'12px 20px', borderBottom:`1px solid ${C.border}`, background:C.deep }}, ['#','DIM','TEXT','BRAIN','ACTIONS'].map(h => (
                          React.createElement("div", {key: h, style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted }}, h)
                        ))), React.createElement("div", {style: { maxHeight:560, overflowY:'auto' }}, localCFIItems.map(item => {
                          const brainColor = C.brains[item.brain]?.color || C.cyan;
                          return (
                            React.createElement("div", {key: item.id, style: {
                              display:'grid', gridTemplateColumns:'40px 40px 1fr 120px 100px', gap:12,
                              padding:'12px 20px', borderBottom:`1px solid ${C.border}`, transition:'background 0.15s',
                            }, onMouseEnter: e => e.currentTarget.style.background=C.deep, onMouseLeave: e => e.currentTarget.style.background='transparent'}, React.createElement("div", {style: { ...mono, fontSize:10, color:C.dim }}, item.id), React.createElement("div", {style: { ...mono, fontSize:12, fontWeight:700, color:brainColor, overflowWrap:'break-word', minWidth:0}}, item.dim), React.createElement("div", {style: { fontSize:12, color:C.muted, lineHeight:1.5 }}, item.text), React.createElement("div", {style: { ...mono, fontSize:9, color:brainColor, textTransform:'capitalize' }}, item.brain), React.createElement("div", {style: { display:'flex', gap:6 }}, React.createElement("button", {onClick: () => { setEditingCFI(item.id); setCfiDraft({...item}); }, style: { ...mono, fontSize:8, padding:'4px 10px', borderRadius:2, cursor:'pointer', background:C.cyanDim, border:`1px solid ${C.borderBright}`, color:C.cyan }}, 'Edit'), React.createElement("button", {onClick: () => deleteCFIItem(item.id), style: { ...mono, fontSize:8, padding:'4px 10px', borderRadius:2, cursor:'pointer', background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.2)', color:'#F87171' }}, '✕')))
                          );
                        }))))
                ), tab === 'broadcast' && (
                  React.createElement("div", {style: { maxWidth:800 }}, React.createElement("div", {className: "card", style: { padding:'32px', marginBottom:20, borderColor:'rgba(196,160,80,0.25)' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:16 }}, 'Send platform announcement'), React.createElement("div", {style: { marginBottom:16 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Target audience'), React.createElement("div", {style: { display:'flex', gap:8, flexWrap:'wrap' }}, [['all','All users'],['pro','Pro Users'],['free','Free Users'],['enterprise','Enterprise Users']].map(([val,label]) => (
                            React.createElement("button", {key: val, onClick: () => setBroadcastTarget(val), style: {
                              ...mono, fontSize:9, padding:'6px 14px', borderRadius:2, cursor:'pointer',
                              background: broadcastTarget===val ? C.cyanDim : 'transparent',
                              border: broadcastTarget===val ? `1px solid ${C.borderBright}` : `1px solid ${C.border}`,
                              color: broadcastTarget===val ? C.cyan : C.muted,
                            }}, label)
                          )))), React.createElement("div", {style: { marginBottom:16 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'MESSAGE'), React.createElement("textarea", {value: broadcastMsg, onChange: e => setBroadcastMsg(e.target.value), placeholder: "Enter your announcement or message...", rows: 4, style: { fontSize:13, width:'100%', resize:'vertical', background:C.deep, border:`1px solid ${C.border}`, color:C.text, padding:'12px 14px', borderRadius:4, fontFamily:'inherit', lineHeight:1.6 }})), React.createElement("div", {style: { display:'flex', gap:12, alignItems:'center' }}, React.createElement("button", {className: "btn-primary", onClick: sendBroadcast, disabled: !broadcastMsg.trim()}, 'Send Broadcast →'), React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted }}, 'Will reach:', broadcastTarget==='all' ? users.length : broadcastTarget==='pro' ? proUsers.length : broadcastTarget==='enterprise' ? entUsers.length : users.filter(u=>!u.is_pro).length, 'users'))), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:12 }}, 'BROADCAST HISTORY (', broadcasts.length, ')'), broadcasts.length === 0 && (
                      React.createElement("div", {className: "card", style: { padding:'32px', textAlign:'center', color:C.dim, fontSize:13 }}, 'No broadcasts sent yet.')
                    ), broadcasts.map(b => (
                      React.createElement("div", {key: b.id, className: "card", style: { padding:'20px 24px', marginBottom:10 }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}, React.createElement("div", {style: { display:'flex', gap:10, alignItems:'center' }}, React.createElement("span", {style: { ...mono, fontSize:8, color:'#4CF7C0', background:'rgba(76,247,192,0.1)', border:'1px solid rgba(76,247,192,0.2)', padding:'2px 8px', borderRadius:100 }}, b.target?.toUpperCase()), React.createElement("span", {style: { ...mono, fontSize:9, color:C.dim }}, new Date(b.sent).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'2-digit',hour:'2-digit',minute:'2-digit'}))), React.createElement("button", {onClick: () => deleteBroadcast(b.id), style: { ...mono, fontSize:9, color:'#F87171', background:'none', border:'none', cursor:'pointer' }}, '✕')), React.createElement("div", {style: { fontSize:13, color:C.text, lineHeight:1.6 }}, b.message))
                    )))
                ), tab === 'branding' && (
                  React.createElement("div", {style: { maxWidth:720 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:20 }}, 'Edit platform copy and messaging. Changes saved to localStorage and apply on reload.'), React.createElement("div", {className: "card", style: { padding:'32px', marginBottom:16 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:20 }}, 'Platform copy'), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:16 }}, [
                          { key:'heroTitle', label:'Hero Title', placeholder:'e.g. Most people were never taught HOW to think.' },
                          { key:'tagline', label:'Tagline / Subheadline', placeholder:'e.g. The World\'s First Cognitive Performance Operating System' },
                          { key:'ctaText', label:'Primary CTA Button Text', placeholder:'e.g. Begin Your Assessment' },
                        ].map(f => (
                          React.createElement("div", {key: f.key}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:6 }}, f.label.toUpperCase()), React.createElement("input", {value: brandSettings[f.key] || '', onChange: e => setBrandSettings(p => ({...p, [f.key]: e.target.value})), placeholder: f.placeholder, style: { fontSize:13, width:'100%' }}))
                        )))), React.createElement("div", {className: "card", style: { padding:'32px', marginBottom:16 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:20 }}, 'Announcement bar'), React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}, React.createElement("div", null, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500 }}, 'Show Announcement Bar'), React.createElement("div", {style: { fontSize:12, color:C.muted }}, 'Displays a banner at the top of the platform')), React.createElement("button", {onClick: () => setBrandSettings(p => ({...p, announcementActive: !p.announcementActive})), style: {
                          ...mono, fontSize:9, padding:'8px 16px', borderRadius:2, cursor:'pointer',
                          background: brandSettings.announcementActive ? 'rgba(76,247,192,0.1)' : 'rgba(122,175,207,0.1)',
                          border: brandSettings.announcementActive ? '1px solid rgba(76,247,192,0.3)' : `1px solid ${C.border}`,
                          color: brandSettings.announcementActive ? '#4CF7C0' : C.muted,
                        }}, brandSettings.announcementActive ? 'ON: Disable' : 'OFF: Enable')), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:6 }}, 'Announcement text'), React.createElement("input", {value: brandSettings.announcementBar || '', onChange: e => setBrandSettings(p => ({...p, announcementBar: e.target.value})), placeholder: "e.g. New enterprise cohorts now available. Contact us to enrol your team.", style: { fontSize:13, width:'100%' }})), React.createElement("button", {className: "btn-primary", onClick: saveBranding}, 'Save Branding Changes →'))
                ), tab === 'pricing' && (
                  React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(400px,100%),1fr))', gap:20 }}, React.createElement("div", {className: "card", style: { padding:'40px', position:'relative', overflow:'hidden', borderColor:'rgba(196,160,80,0.3)' }}, React.createElement(ScanLine, null), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:16 }}, 'PRO plan pricing'), React.createElement("div", {style: { ...syne, fontSize:17, fontWeight:800, color:C.text, marginBottom:8, overflowWrap:'break-word', minWidth:0}}, 'Edit Pro Price'), React.createElement("div", {style: { fontSize:13, color:C.muted, marginBottom:28, lineHeight:1.7 }}, 'Updates the price shown on the platform and passed to Paystack for payment processing.'), React.createElement("div", {style: { marginBottom:20 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'CURRENT PRICE (NAIRA)'), React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:C.cyan, lineHeight:1.2, marginBottom:4, overflowWrap:'break-word', minWidth:0}}, `₦${(proPrice/100).toLocaleString()}`), React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted }}, '=', proPrice.toLocaleString(), 'kobo')), React.createElement("div", {style: { marginBottom:20 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'NEW PRICE (₦)'), React.createElement("div", {style: { display:'flex', gap:12, alignItems:'center' }}, React.createElement("div", {style: { position:'relative', flex:1 }}, React.createElement("div", {style: { position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', ...syne, fontSize:14, fontWeight:700, color:C.muted, overflowWrap:'break-word', minWidth:0}}, '₦'), React.createElement("input", {type: "number", value: priceInput, onChange: e => setPriceInput(e.target.value), style: { paddingLeft:36, fontSize:14, ...syne, fontWeight:700, overflowWrap:'break-word', minWidth:0}, min: "100", step: "100"})), React.createElement("button", {className: "btn-primary", onClick: savePrice, style: { whiteSpace:'nowrap' }}, priceSaved ? '✓ Saved!' : 'Save Price'))), React.createElement("div", {style: { padding:'20px', background:C.deep, borderRadius:2, border:`1px solid ${C.border}` }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'Paystack integration'), React.createElement("div", {style: { fontSize:13, color:C.muted, lineHeight:1.7 }}, 'Live key:', React.createElement("span", {style: { color:C.cyan, fontFamily:'monospace' }}, 'loaded from platform_settings at runtime'), React.createElement("br", null), 'Currency: NGN · Gateway: Paystack inline · Verified server-side'))), React.createElement("div", {className: "card", style: { padding:'40px', position:'relative', overflow:'hidden', borderColor:'rgba(76,247,192,0.2)' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#4CF7C0', marginBottom:16 }}, 'Enterprise plan pricing'), React.createElement("div", {style: { ...syne, fontSize:17, fontWeight:800, color:C.text, marginBottom:8, overflowWrap:'break-word', minWidth:0}}, 'Edit Enterprise Price'), React.createElement("div", {style: { fontSize:13, color:C.muted, marginBottom:28, lineHeight:1.7 }}, 'Sets the displayed price for enterprise cohort enrolment on the platform.'), React.createElement("div", {style: { marginBottom:20 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'CURRENT PRICE (NAIRA)'), React.createElement("div", {style: { ...syne, fontSize:14, fontWeight:800, color:'#4CF7C0', lineHeight:1.2, marginBottom:4, overflowWrap:'break-word', minWidth:0}}, `₦${(entPrice/100).toLocaleString()}`), React.createElement("div", {style: { ...mono, fontSize:9, color:C.muted }}, '=', entPrice.toLocaleString(), 'kobo')), React.createElement("div", {style: { marginBottom:20 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, marginBottom:8 }}, 'NEW PRICE (₦)'), React.createElement("div", {style: { display:'flex', gap:12, alignItems:'center' }}, React.createElement("div", {style: { position:'relative', flex:1 }}, React.createElement("div", {style: { position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', ...syne, fontSize:14, fontWeight:700, color:C.muted, overflowWrap:'break-word', minWidth:0}}, '₦'), React.createElement("input", {type: "number", value: entPriceInput, onChange: e => setEntPriceInput(e.target.value), style: { paddingLeft:36, fontSize:14, ...syne, fontWeight:700, overflowWrap:'break-word', minWidth:0}, min: "100", step: "1000"})), React.createElement("button", {className: "btn-primary", onClick: saveEntPrice, style: { whiteSpace:'nowrap' }}, 'Save Price'))), React.createElement("div", {style: { padding:'16px 20px', background:C.deep, borderRadius:2, border:`1px solid ${C.border}`, ...mono, fontSize:10, color:C.muted }}, 'Grant enterprise access manually in the', React.createElement("button", {onClick: () => setTab('users'), style: { background:'none', border:'none', color:C.cyan, cursor:'pointer', ...mono, fontSize:10, padding:0 }}, 'Users tab →'))),
                  React.createElement("div", {className: "card", style: { padding:'40px', position:'relative', overflow:'hidden', borderColor:'rgba(196,160,80,0.2)', gridColumn:'1 / -1' }}, React.createElement(ScanLine, null), React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:'#E2BE78', marginBottom:16 }}, 'Payment gateway'), React.createElement("div", {style: { ...syne, fontSize:17, fontWeight:800, color:C.text, marginBottom:8, overflowWrap:'break-word', minWidth:0}}, 'Paystack Public Key'), React.createElement("div", {style: { fontSize:13, color:C.muted, marginBottom:28, lineHeight:1.7 }}, 'Your Paystack public key (pk_live_... or pk_test_...). Stored in platform_settings and loaded at runtime — no redeploy needed.'), React.createElement("div", {style: { display:'flex', gap:12, alignItems:'center' }}, React.createElement("input", {type: "text", value: paystackKeyInput, onChange: e => setPaystackKeyInput(e.target.value), placeholder: 'pk_live_...', style: { flex:1, fontSize:13, fontFamily:'monospace', letterSpacing:'0.02em', overflowWrap:'break-word', minWidth:0 }}), React.createElement("button", {className: "btn-primary", onClick: savePaystackKey, style: { whiteSpace:'nowrap' }}, keySaved ? '✓ Saved!' : 'Save Key')), paystackKeyInput && React.createElement("div", {style: { marginTop:16, padding:'12px 16px', background:C.deep, borderRadius:2, border:`1px solid ${C.border}`, ...mono, fontSize:10, color:C.muted }}, 'Active: ', React.createElement("span", {style: { color:'#E2BE78' }}, paystackKeyInput.slice(0,12), '...', paystackKeyInput.slice(-6)))))
                ), tab === 'settings' && (
                  React.createElement("div", {style: { maxWidth:680 }}, React.createElement("div", {className: "card", style: { padding:'36px', marginBottom:16 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:16 }}, 'Platform info'), [
                        { label:'Platform',      value:'NeuralFusion™ Cognitive OS' },
                        { label:'Admin Access',   value:'Supabase RLS · profiles.is_admin' },
                        { label:'Supabase URL',   value:'ckrxgbosyohcmjtemrvu.supabase.co' },
                        { label:'Supabase Ref',   value:'civwcmteqidppscbpqni' },
                        { label:'Live App',       value:'life322-c.github.io/NeuralFusion.app2/' },
                      ].map((r,i) => (
                        React.createElement("div", {key: i, style: { display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:`1px solid ${C.border}`, gap:16 }}, React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.muted, flexShrink:0 }}, r.label.toUpperCase()), React.createElement("div", {style: { fontSize:12, color:C.text, fontFamily:'monospace', textAlign:'right', wordBreak:'break-all' }}, r.value))
                      ))), React.createElement("div", {className: "card", style: { padding:'36px', marginBottom:16 }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:16 }}, 'Platform controls'), React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:0 }}, [
                          {
                            label:'Maintenance Mode',
                            desc:'Shows maintenance message to users (session only)',
                            value:maintenanceMode,
                            onToggle:()=>setMaintenanceMode(m=>!m),
                            onColor:'#F87171', offColor:'#7AAFCF',
                          },
                          {
                            label:'Open Registration',
                            desc:'Allow new users to sign up (session only)',
                            value:registrationOpen,
                            onToggle:()=>setRegistrationOpen(r=>!r),
                            onColor:'#4CF7C0', offColor:'#F87171',
                          },
                        ].map((ctrl,i) => (
                          React.createElement("div", {key: i, style: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:`1px solid ${C.border}` }}, React.createElement("div", null, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500 }}, ctrl.label), React.createElement("div", {style: { fontSize:12, color:C.muted }}, ctrl.desc)), React.createElement("button", {onClick: ctrl.onToggle, style: {
                              ...mono, fontSize:9, padding:'8px 16px', cursor:'pointer', borderRadius:2, flexShrink:0,
                              background: ctrl.value ? `rgba(${ctrl.onColor==='#F87171'?'248,113,113':'76,247,192'},0.1)` : `rgba(${ctrl.offColor==='#F87171'?'248,113,113':'122,175,207'},0.1)`,
                              border: `1px solid ${ctrl.value ? ctrl.onColor : ctrl.offColor}44`,
                              color: ctrl.value ? ctrl.onColor : ctrl.offColor,
                            }}, ctrl.value ? 'ON: Disable' : 'OFF: Enable'))
                        )), React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:`1px solid ${C.border}` }}, React.createElement("div", null, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500 }}, 'Refresh All Data'), React.createElement("div", {style: { fontSize:12, color:C.muted }}, 'Pull latest from Supabase')), React.createElement("button", {className: "btn-outline", style: { fontSize:10 }, onClick: loadAdminData}, '↺ Refresh')), React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:`1px solid ${C.border}` }}, React.createElement("div", null, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500 }}, 'Reset localStorage Overrides'), React.createElement("div", {style: { fontSize:12, color:C.muted }}, 'Clear all admin edits (lessons, CFI items, branding)')), React.createElement("button", {onClick: () => {
                            ['nf_lessons_overrides','nf_cfi_items','nf_brand','nf_cohorts','nf_broadcasts'].forEach(k => localStorage.removeItem(k));
                            showMsg('localStorage overrides cleared. Reload to see effect.', 'success');
                          }, style: { ...mono, fontSize:9, padding:'8px 16px', cursor:'pointer', borderRadius:2, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'#F87171' }}, 'Clear Overrides')), React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0' }}, React.createElement("div", null, React.createElement("div", {style: { fontSize:13, color:C.text, fontWeight:500 }}, 'Lock Admin Portal'), React.createElement("div", {style: { fontSize:12, color:C.muted }}, 'Re-lock this session')), React.createElement("button", {onClick: () => { setView('home'); }, style: { ...mono, fontSize:9, padding:'8px 16px', cursor:'pointer', borderRadius:2, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', color:'#F87171' }}, 'Exit Admin')))), React.createElement("div", {className: "card", style: { padding:'28px' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1, color:C.cyan, marginBottom:12 }}, 'Supabase tables'), ['profiles','cfi_results','lesson_progress','platform_settings'].map((t,i) => (
                        React.createElement("div", {key: i, style: { display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:`1px solid ${C.border}` }}, React.createElement("div", {style: { width:6, height:6, borderRadius:'50%', background:'#7AAFCF', flexShrink:0 }}), React.createElement("div", {style: { fontFamily:'monospace', fontSize:13, color:C.text }}, t))
                      ))))
                ))
            )))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  ENTERPRISE SYSTEM: Components, Data & Views
    // ═══════════════════════════════════════════════════════════════════

    // ── Enterprise Colors ──────────────────────────────────────────────
    const EC = {
      bg: '#050C1A', bg2: '#0A1428', bg3: '#0F1E38',
      accent: '#4CF7C0', accent2: '#1AEFFF', gold: '#F5C842',
      red: '#FF5252', muted: 'rgba(255,255,255,0.45)', text: 'rgba(255,255,255,0.88)',
      border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.13)',
    };

    // ── Enterprise CFI Items ───────────────────────────────────────────
    const ENT_CFI_ITEMS = [
      { id:1, dim:'A', label:'Decision Latency', text:'I delay making decisions even when I have sufficient information.', reversed:false },
      { id:2, dim:'A', label:'Decision Latency', text:'I reconsider decisions I have already made even when no new information is available.', reversed:false },
      { id:3, dim:'A', label:'Decision Latency', text:'When facing a decision under time pressure, my thinking becomes unclear.', reversed:false },
      { id:4, dim:'B', label:'Mode Rigidity', text:'I rely on facts and logic alone, even when something tells me to think differently.', reversed:false },
      { id:5, dim:'B', label:'Mode Rigidity', text:'I act on gut feelings without pausing to examine the evidence behind them.', reversed:false },
      { id:6, dim:'B', label:'Mode Rigidity', text:'I find it difficult to shift my thinking approach once I have started working on a problem.', reversed:false },
      { id:7, dim:'C', label:'Emotional Reactivity', text:'Strong emotions make my thinking less clear.', reversed:false },
      { id:8, dim:'C', label:'Emotional Reactivity', text:'I make decisions I later regret when I am under emotional pressure.', reversed:false },
      { id:9, dim:'C', label:'Emotional Reactivity', text:'I am able to remain mentally focused even when the situation feels stressful.', reversed:true },
      { id:10, dim:'D', label:'Thought Interruption', text:'My thinking gets interrupted by unrelated thoughts when I am trying to focus.', reversed:false },
      { id:11, dim:'D', label:'Thought Interruption', text:'I experience competing thoughts when trying to reach a clear conclusion.', reversed:false },
      { id:12, dim:'D', label:'Thought Interruption', text:'After completing a task, my thoughts feel organised and settled.', reversed:true },
      { id:13, dim:'E', label:'Cognitive Overload', text:'When I am presented with too much information at once, my thinking becomes disorganised.', reversed:false, isNew:true },
    ];
    const ENT_SCALE  = [{val:1,label:'Never'},{val:2,label:'Rarely'},{val:3,label:'Sometimes'},{val:4,label:'Often'},{val:5,label:'Very often'}];
    const ENT_BANDS  = [
      {min:57,max:65,label:'Severe Fragmentation',color:'#FF5252'},
      {min:44,max:56,label:'High Fragmentation',color:'#FF8C42'},
      {min:30,max:43,label:'Moderate fragmentation',color:'#F5C842'},
      {min:16,max:29,label:'Low Fragmentation',color:'#4CF7C0'},
      {min:0, max:15,label:'Minimal Fragmentation',color:'#1AEFFF'},
    ];
    const ENT_LESSONS = [
      { num:1, week:2, title:'Foundation of Integrated Thinking', skill:'Cognitive Mode Awareness', level:'Beginner', duration:90,
        framing:'Lesson One creates the cognitive baseline from which everything else builds. Your job is not to convince participants NeuralFusion™ works; give them their first conscious experience of a NeuralFusion™ cycle and let the experience do the convincing. By the end, every participant should have completed the Core Loop at least once with a real problem.',
        plan:[
          {t:'0–10 min',act:'Welcome & Programme Context',detail:'Explain 7-week structure, what the CFI measures, and what participants will be able to do by Week 5. Do NOT reveal CFI pre-scores.'},
          {t:'10–20 min',act:'Read Lesson One aloud',detail:'Cover: What is NeuralFusion™, the Problem it Solves, the Four Modes, the Core Loop. Speak slowly and clearly.'},
          {t:'20–30 min',act:'Pair Discussion',detail:'"Which thinking mode do you default to most? When does that cause problems?" (8 min pairs + 2 min group feedback).'},
          {t:'30–55 min',act:'Guided Practice (Group Format)',detail:'Walk the whole cohort through the First Guided Practice simultaneously. 25 minutes.'},
          {t:'55–70 min',act:'Group Debrief',detail:'Use the debrief prompts. Capture key responses on the whiteboard.'},
          {t:'70–80 min',act:'Key Insight Delivery',detail:'Read the Key Insight of Lesson One. Ask each participant to write it in their own words.'},
          {t:'80–90 min',act:'Assignment Brief',detail:'Issue the 24-hour assignment. Set expectation for Lesson Two.'},
        ],
        practice:["'Sit comfortably, feet flat, pen in hand. We are going to run NeuralFusion™ together for the first time.'","'Think of a simple challenge you are currently facing at work, in your studies, or in a decision. Write it in one sentence. You have 90 seconds.'","'Now write only the FACTS about this challenge. No opinions, no feelings; only what is provably true.' [Pause 2 min]","'Put your pen down. Close your eyes for 30 seconds. What does your gut tell you about this situation?' [After 30 sec] 'Open your eyes and write that down in one sentence.'","'Write three ideas or connections this situation brings to mind, even unusual or unrelated ones.' [Pause 2 min]","'Finally, what does this challenge mean for you? What lesson is it offering? Write one sentence.' [Pause 2 min]","'Look at your page. You have just completed one NeuralFusion™ cycle. You activated all four modes in sequence. Notice how your relationship with the challenge has shifted.'"],
        debrief:['What was the most uncomfortable mode to enter? Why?','Which mode felt most natural to you? What does that tell you about your default?','Did the challenge feel different after completing the cycle? How?','What surprised you about the exercise?','Where in your daily work do you skip one of these modes entirely?'],
        watchpoints:["Participants who say they 'don't have gut feelings'; redirect: gut feeling is any immediate non-analytical response. It does not have to feel dramatic.","Those who overthink the Associative mode step; reassure them: unusual connections are the point.","Participants writing nothing during Reflective mode are stuck in Analysis. Prompt: 'What is one word that describes what this experience means for you?'","If someone shares something very personal, acknowledge briefly and redirect to cognitive mechanics: 'That is exactly what Lesson Four addresses.'"],
        assignment:'24-hour assignment: Observe which thinking mode you default to in at least three situations today. Record the situation, the mode, and what happened as a result.',
        keyInsight:'Cognitive clarity is not an absence of complexity; it is the ability to move through complexity using all four modes in sequence.',
      },
      { num:2, week:2, title:'Mode Activation & Mental Control', skill:'Deliberate Mode Switching', level:'Beginner–Intermediate', duration:90,
        framing:"Lesson Two moves from awareness to control. The key shift is: from 'I notice what mode I am in' to 'I choose what mode I enter.' Many participants will arrive with the 24-hour assignment incomplete; that is acceptable. Any observation is usable in today's session.",
        plan:[
          {t:'0–10 min',act:'Assignment Review',detail:'Ask 3–4 participants to share one observation from the 24-hour assignment. Record the dominant modes identified on the whiteboard.'},
          {t:'10–20 min',act:'Read Lesson Two content',detail:'Core Truth of Mental Control, the Four Modes revisited with risks, Mode Activation Signals. Emphasise: "Questions are switches."'},
          {t:'20–40 min',act:'The Switching Drill: Group Format',detail:'Run the full 7-minute drill as a group, facilitator-led, then repeat once independently.'},
          {t:'40–55 min',act:'Pair Exercise: Emergency Reset Practice',detail:'Each pair walks through a recalled stressful moment and applies the Emergency Reset protocol together.'},
          {t:'55–70 min',act:'Group Debrief',detail:'Use prompts below.'},
          {t:'70–80 min',act:'Key Insight Delivery',detail:"Ask participants: 'What does mental freedom mean to you now, vs what it meant before this lesson?'"},
          {t:'80–90 min',act:'Assignment Brief',detail:'48-hour assignment. Explain that Lesson Three requires participants to arrive with at least one real decision they are currently facing.'},
        ],
        practice:["'Sit upright. We are going to move through all four thinking modes in sequence. I will time each one. Your topic is your day so far: what has happened since you woke up.'","ANALYTICAL: 60 sec: 'Facts only. What happened today? No feelings, no interpretations.' [60 sec silence] 'Stop.'","INTUITIVE: 60 sec: 'Gut only. What does today feel like overall? One word or one sentence.' [60 sec] 'Stop.'","ASSOCIATIVE: 60 sec: 'Connections. What does today remind you of? What ideas or images come to mind?' [60 sec] 'Stop.'","REFLECTIVE: 60 sec: 'Meaning. What is today teaching you?' [60 sec] 'Stop.'","'Notice what that felt like. Each mode has a different mental texture. Now repeat the drill silently and independently. Same topic. 7 minutes total.'","After the independent drill, ask: 'Was the second time faster? Did any mode feel different the second time?'"],
        debrief:['Which mode is hardest for you to enter deliberately? Which is hardest to exit?','What happened in your body when you shifted from Analytical to Intuitive?','Can you identify one situation this week where the Emergency Reset would have helped?','What is the difference between "thinking" and "reacting" now that you have experienced it?','Where in your professional role do you need the most mode control?'],
        watchpoints:['Participants from highly analytical environments (engineering, finance, law) may resist the Intuitive step. Let the discomfort stand as data; it is Mode Rigidity (Dim B on the CFI).','If group energy drops during the independent drill, that is not failure; it is concentration. Silence is productive.','The Emergency Reset pair exercise may surface real distress. Monitor the room. If visibly distressed, acknowledge privately after the session.','Some will try to combine all four modes simultaneously; sequential activation is the point. Fusion comes later. Control comes first.'],
        assignment:'48-hour assignment: Practice the Switching Drill once daily. Identify one moment where you used the Emergency Reset protocol. Arrive to Lesson Three with a real decision you are currently facing.',
        keyInsight:'Mental freedom is not doing whatever you feel; it is choosing which faculty of your mind to lead with in any given moment.',
      },
      { num:3, week:3, title:'Synthesis & Decision Mastery', skill:'Multi-mode Integration', level:'Intermediate', duration:90,
        framing:"Lesson Three is the technical core of NeuralFusion™. This is where the framework moves from interesting to practical, and where visible behaviour change is most likely to emerge. Ask at the start: 'Did you bring a real decision?' If not, invite them to identify one in the first 5 minutes.",
        plan:[
          {t:'0–10 min',act:'Assignment Review',detail:'Ask who practiced mode-switching. Ask for one example of a mode shift that changed an outcome. Validate and reinforce.'},
          {t:'10–25 min',act:'Read Lesson Three content',detail:'Why Decisions Fail, What Synthesis Means, The Synthesis Framework (Extract → Align → Compress → Decide). Slow and clear.'},
          {t:'25–55 min',act:'Full Synthesis Drill',detail:'30 minutes with a real decision. Facilitator-led.'},
          {t:'55–65 min',act:'Commitment Lock Discussion',detail:'"When do you revisit decisions that don\'t need revisiting? What triggers that?" Map on whiteboard.'},
          {t:'65–75 min',act:'Group Debrief',detail:'Use prompts below.'},
          {t:'75–85 min',act:'Key Insight',detail:'"Write and discuss: \'Clarity is not finding the right answer; it is unifying the mind.\'"'},
          {t:'85–90 min',act:'Assignment Brief',detail:'72-hour assignment: apply full synthesis to one real decision and act on it.'},
        ],
        practice:['Phase 1: Individual Extraction (12 min): Each participant writes their decision at the top of a page.','ANALYTICAL (2.5 min): "List the facts and constraints of this decision only."','INTUITIVE (2.5 min): "What is your strongest gut signal about this? One sentence."','ASSOCIATIVE (2.5 min): "What is the most useful idea or angle you have not yet considered?"','REFLECTIVE (2.5 min): "What does your deepest value or lesson tell you here?"','Phase 2: Synthesis (10 min): "Underline the single most powerful output from each mode. What is the common direction they are pointing to? Write one sentence beginning with: My decision is..."','Phase 3: Commitment Lock (8 min): Ask 3–4 volunteers to read their decision sentence to the group. After each one, ask the group: "Is that a clear, committed decision or is it still a question?"'],
        debrief:['What did your four modes agree on? Where did they conflict?','Was the decision you wrote at the end different from what you expected at the start?','What happened when you read the decision sentence aloud?','Has anyone experienced the opposite: making a decision and then endlessly revisiting it? What mode was driving that?','How would your team or department operate differently if this process was normal?'],
        watchpoints:['Decision sentences that are still questions ("I think I might need to..."); push: "Rephrase that as a committed statement."','If someone cannot produce a one-sentence decision: "Your mind is still negotiating. What mode is blocking synthesis?"','The Commitment Lock discussion can provoke strong reactions in corporate environments where decisions are frequently revisited.','Watch for "decisions" about someone else\'s behaviour. Redirect: "NeuralFusion™ synthesises YOUR thinking. What is YOUR decision here?"'],
        assignment:'72-hour assignment: Apply the full Synthesis Framework to one real decision you are currently facing. Make the decision. Notice what happens.',
        keyInsight:'Clarity is not finding the right answer; it is unifying the mind.',
      },
      { num:4, week:4, title:'Stabilization Under Pressure', skill:'Cognitive Stability', level:'Intermediate–Advanced', duration:90,
        framing:'Lesson Four is the pressure test. Participants have learned to think clearly in calm conditions; this session trains the same clarity to survive stress, urgency, and emotional activation. It is arguably the most practically valuable lesson for corporate, leadership, and government cohorts. Deliver this lesson with a calmer, more grounded energy than previous sessions.',
        plan:[
          {t:'0–10 min',act:'Assignment Review',detail:'Who applied full synthesis to a real decision? Invite 2–3 brief accounts. Focus on what changed emotionally or mentally, not just the decision outcome.'},
          {t:'10–25 min',act:'Read Lesson Four content',detail:'Why Clarity Collapses, Stabilization Principle, Three Stabilizers: Cognitive Anchor, Temporal Compression, Mode Containment.'},
          {t:'25–45 min',act:'Pressure Simulation: Group Format',detail:'20 minutes.'},
          {t:'45–60 min',act:'Relapse Prevention Discussion',detail:'"What are your personal relapse triggers? When do you abandon a fused decision?" Map on whiteboard.'},
          {t:'60–72 min',act:'Group Debrief',detail:'Use prompts below.'},
          {t:'72–82 min',act:'Key Insight',detail:'"Mental mastery is not calm thinking; it is stable thinking." Ask: What is the difference?'},
          {t:'82–90 min',act:'Assignment Brief',detail:'72-hour assignment: apply stabilization during one real stressful event.'},
        ],
        practice:['Part A: Individual Recall (8 min): "Think of a recent stressful situation where your thinking became unclear or you acted in a way you later questioned."','"Write: (1) What was the situation. (2) Which mode dominated your thinking at the time. (3) What did you do or decide as a result." [6 min silent writing]','Part B: Retroactive Stabilization (8 min): "Now re-run that situation through NeuralFusion™ stabilization."','"Apply ONE cognitive anchor; write a short internal statement that would have locked your clarity."','"Apply temporal compression; what mattered most in the next 10 minutes of that situation?"','"Apply mode containment; name the mode that was flaring and write: I acknowledge [mode] and return authority to synthesis."','Part C: Forward Application (4 min): "Write one upcoming situation where you predict you will need stabilization. Write your cognitive anchor for it now, in advance."'],
        debrief:['What mode most commonly dominates your thinking under pressure?','Has anyone been in a situation where one person\'s emotional reactivity destabilized an entire team? What mode were they in?','What does a cognitive anchor feel like compared to positive thinking or affirmations?','Where in your role does temporal compression have the most practical value?','What are your top two personal relapse triggers? What do you now know to do?'],
        watchpoints:['This session can surface genuine workplace trauma. Stay alert. If anyone becomes visibly distressed, offer a private break. Do not allow the session to become a group debriefing of workplace grievances.','Some conflate stabilization with emotional suppression. Be clear: "Stabilization does not mean you stop feeling. It means the feeling does not take over your cognitive process."','Participants wanting to apply this to others; redirect: "Your assignment is your own stability first. Leading others with NeuralFusion™ is a Level Two competency."','Cognitive anchors should be short, personal, and grounded. If someone writes a long statement, help them compress: "What is the one sentence that locks clarity for you?"'],
        assignment:'72-hour assignment: Apply at least one stabilizer (Cognitive Anchor, Temporal Compression, or Mode Containment) during one real stressful event this week. Record what happened.',
        keyInsight:'Mental mastery is not calm thinking; it is stable thinking.',
      },
      { num:5, week:5, title:'Automatic Integration & Cognitive Fluency', skill:'Cognitive Automation', level:'Advanced', duration:90,
        framing:'Lesson Five completes the programme. The tone shifts from training to installation; you are not teaching new content, you are consolidating a cognitive habit. Many participants will arrive differently from how they arrived to Lesson One. Acknowledge that shift without dramatising it.',
        plan:[
          {t:'0–15 min',act:'Assignment Review & Reflection',detail:'Ask who applied stabilization in a stressful event. Invite 3–4 to share briefly. Then ask the whole group: "How has your thinking changed across the five weeks?"'},
          {t:'15–30 min',act:'Read Lesson Five content',detail:'Cognitive Fluency, From Skill to Instinct (three stages), The Automatic Fusion Trigger, Living NeuralFusion™.'},
          {t:'30–50 min',act:'Fluency Installation: Group Format',detail:'20 minutes.'},
          {t:'50–65 min',act:'Signs of Completion Discussion',detail:'Read the five signs of completion aloud one by one. Ask the group to mark which they recognise in themselves.'},
          {t:'65–75 min',act:'Group Debrief',detail:'Use prompts below.'},
          {t:'75–82 min',act:'Final Insight Delivery',detail:'Read the Final Insight slowly and allow silence after.'},
          {t:'82–90 min',act:'Programme Closing',detail:'Announce CFI post-assessment (Week 6), Clarity Delta report and certification (Week 7). Thank the cohort.'},
        ],
        practice:['Part A: One Word Fusion (6 min): "Sit calmly and comfortably. Eyes open or closed, your choice."','"Think of any current situation: work, a relationship, a project, a decision, whatever is live in your mind right now."','"Internally, say the word: Fuse."','"Do not force anything. Just allow the mind to begin organising itself. Trust the four lessons you have completed. Observe what happens." [2 min silence]','"Write down one sentence, whatever arrived. It might be a clarity, a decision, a feeling, an insight." [90 seconds]','Part B: Group Fluency Round (8 min): Ask each table group to share their one sentence. 4 min. Then invite 2–3 from the room to share with the full group.','Part C: Lifetime Protocol Installation (6 min): "Write three personal commitments: (1) Use NeuralFusion™ daily; in what context specifically? (2) Teach it through behaviour; what behaviour will change first? (3) Return to structure when clarity fades; what is your first early warning signal?"'],
        debrief:['What does "thinking with structure" feel like differently from how you thought before this programme?','Which of the five Signs of Completion resonates most strongly for you right now?','What is the most important thing you are taking out of this programme?','Where in your professional or personal life will NeuralFusion™ have the most immediate impact?','What would you say to someone beginning this programme tomorrow?'],
        watchpoints:['Do not allow Lesson Five to become a celebration. The completion is real but the programme is a beginning; Level Two exists.','If participants say they "don\'t feel different", do not force it. The CFI will show the data.','Some participants will want to continue the conversation after the session. Invite them to the Week 7 certification session and encourage peer practice groups.','Remind clearly: Week 6 is the CFI post-assessment. Same format as Week 1. Same conditions.'],
        assignment:'Lifetime Protocol: three personal commitments for how you will use NeuralFusion™ going forward.',
        keyInsight:'You do not control the mind by force. You train it by structure.',
      },
    ];

    // ── Enterprise Helper Functions ────────────────────────────────────
    function entScoreItem(id, raw) {
      const item = ENT_CFI_ITEMS.find(i => i.id === id);
      return item && item.reversed ? 6 - raw : raw;
    }
    function entCalcComposite(responses) {
      return ENT_CFI_ITEMS.reduce((sum, item) => {
        const raw = responses[item.id];
        if (!raw) return sum;
        return sum + entScoreItem(item.id, raw);
      }, 0);
    }
    function entCalcDimScores(responses) {
      const dims = { A:0, B:0, C:0, D:0, E:0 };
      ENT_CFI_ITEMS.forEach(item => {
        const raw = responses[item.id];
        if (raw) dims[item.dim] += entScoreItem(item.id, raw);
      });
      return dims;
    }
    function entGetBand(score) {
      return ENT_BANDS.find(b => score >= b.min && score <= b.max) || ENT_BANDS[ENT_BANDS.length-1];
    }

    // ── Enterprise Styles ──────────────────────────────────────────────
    const ES = {
      tag: { fontSize:'0.6rem', letterSpacing:'0.2em', color:EC.muted, marginBottom:'0.75rem' },
      h1: { fontFamily:"'DM Serif Display', serif", fontSize:'clamp(1.1rem,1.6vw,1.5rem)', lineHeight:1.05, letterSpacing:'-0.02em', marginBottom:'1.5rem', color:EC.text },
      h2: { fontFamily:"'DM Serif Display', serif", fontSize:'clamp(0.95rem,1.3vw,1.25rem)', lineHeight:1.1, marginBottom:'1rem', color:EC.text },
      h3: { fontFamily:"'DM Serif Display', serif", fontSize:'1.2rem', lineHeight:1.2, marginBottom:'0.75rem', color:EC.text },
      mono: (extra={}) => ({ fontFamily:"'Space Mono', monospace", fontSize:'0.72rem', lineHeight:1.8, color:EC.muted, ...extra }),
      card: (extra={}) => ({ background:EC.bg2, border:`1px solid ${EC.border}`, padding:'2rem', ...extra }),
      accentCard: (extra={}) => ({ background:EC.bg3, borderLeft:`2px solid ${EC.accent}`, padding:'1.5rem 2rem', ...extra }),
      btnPrimary: { fontFamily:"'Space Mono', monospace", fontSize:'0.68rem', letterSpacing:'0.15em', color:EC.bg, background:EC.accent, border:'none', padding:'0.9rem 1.75rem', cursor:'pointer' },
      btnGhost:   { fontFamily:"'Space Mono', monospace", fontSize:'0.68rem', letterSpacing:'0.15em', color:EC.accent, background:'transparent', border:`1px solid rgba(76,247,192,0.4)`, padding:'0.9rem 1.75rem', cursor:'pointer' },
      btnGold:    { fontFamily:"'Space Mono', monospace", fontSize:'0.68rem', letterSpacing:'0.15em', color:EC.bg, background:EC.gold, border:'none', padding:'0.9rem 1.75rem', cursor:'pointer' },
      input:      { fontFamily:"'Space Mono', monospace", fontSize:'0.72rem', background:EC.bg3, border:`1px solid ${EC.border2}`, color:EC.text, padding:'0.75rem 1rem', outline:'none', width:'100%' },
      label:      { fontSize:'0.6rem', letterSpacing:'0.15em', color:EC.muted, display:'block', marginBottom:'0.4rem' },
      navTab: (active) => ({ fontSize:'0.62rem', letterSpacing:'0.12em', padding:'0.5rem 1rem', border:`1px solid ${active?EC.accent:EC.border}`, background:active?'rgba(76,247,192,0.1)':'transparent', color:active?EC.accent:EC.muted, cursor:'pointer', transition:'all 0.2s' }),
    };

    // ── Enterprise BandPill ────────────────────────────────────────────
    function EntBandPill({ score }) {
      const band = entGetBand(score);
      return React.createElement("span", {style: { fontSize:'0.6rem', letterSpacing:'0.1em', color:band.color, border:`1px solid ${band.color}50`, padding:'0.2rem 0.6rem' }}, band.label);
    }

    // ── Enterprise ProgressBar ─────────────────────────────────────────
    function EntProgressBar({ value, max=65 }) {
      const pct = Math.min(100,(value/max)*100);
      return (
        React.createElement("div", {style: { background:EC.border, height:4, borderRadius:2, overflow:'hidden' }}, React.createElement("div", {style: { height:'100%', width:`${pct}%`, background:EC.accent, transition:'width 0.5s ease' }}))
      );
    }

    // ── Enterprise NavBar ──────────────────────────────────────────────
    function EntNavBar({ view, setView, role, onExit }) {
      const tabs = role==='facilitator'
        ? [['dashboard','Dashboard'],['lessons','Lessons'],['cfi','CFI Data'],['results','Results']]
        : [['assessment','Assessment'],['programme','Programme']];
      return (
        React.createElement("nav", {style: { position:'fixed', top:0, left:0, right:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 2rem', background:'rgba(5,12,26,0.95)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${EC.border}` }}, React.createElement("div", {style: { ...ES.mono({ color:EC.accent }), letterSpacing:'0.2em' }}, '◈ NeuralFusion™', React.createElement("span", {style: { color:EC.muted }}, '/ Enterprise')), React.createElement("div", {style: { display:'flex', gap:'0.25rem' }}, tabs.map(([id,label]) => (
              React.createElement("button", {key: id, style: ES.navTab(view===id), onClick: ()=>setView(id)}, label)
            ))), React.createElement("button", {style: { ...ES.mono({ color:EC.muted }), background:'none', border:`1px solid ${EC.border}`, padding:'0.4rem 0.9rem', cursor:'pointer' }, onClick: onExit}, '← Exit'))
      );
    }

    // ── Enterprise RoleGate ────────────────────────────────────────────
    function EntRoleGate({ onSelect, onExit }) {
      const [cohort, setCohort] = useState('');
      const [pid, setPid] = useState('');
      const [facPin, setFacPin] = useState('');
      const [facPinError, setFacPinError] = useState('');
      const FACILITATOR_PIN = 'NF-FAC-2026';

      function handleFacilitatorEnter() {
        if (!cohort) { setFacPinError('Please enter a cohort code.'); return; }
        if (facPin !== FACILITATOR_PIN) { setFacPinError('Incorrect facilitator PIN.'); return; }
        setFacPinError('');
        onSelect('facilitator', { cohort });
      }
      return (
        React.createElement("div", {style: { minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem', paddingTop:'5rem', background:EC.bg }}, React.createElement("div", {style: { position:'fixed', inset:0, backgroundImage:`linear-gradient(${EC.accent}08 1px,transparent 1px),linear-gradient(90deg,${EC.accent}08 1px,transparent 1px)`, backgroundSize:'60px 60px', pointerEvents:'none' }}), React.createElement("div", {style: { position:'relative', zIndex:1, width:'100%', maxWidth:700, display:'flex', flexDirection:'column', alignItems:'center' }}, React.createElement("div", {style: { ...ES.tag, textAlign:'center' }}, '◈ Enterprise Cohort System · Active'), React.createElement("h1", {style: { ...ES.h1, textAlign:'center', maxWidth:600, marginBottom:'0.75rem' }}, 'NeuralFusion™', React.createElement("br", null), React.createElement("em", {style: { color:EC.accent }}, 'Enterprise Portal')), React.createElement("p", {style: { ...ES.mono(), textAlign:'center', maxWidth:480, marginBottom:'3rem' }}, 'Select your role to enter the programme. Facilitators access session controls, CFI data entry, and live cohort results. Participants complete assessments and access lesson materials.'), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', width:'100%', marginBottom:'2rem' }}, React.createElement("div", {style: { ...ES.card(), borderTop:`2px solid ${EC.gold}`, display:'flex', flexDirection:'column', gap:'1rem' }}, React.createElement("div", {style: { fontSize:'0.6rem', letterSpacing:'0.15em', color:EC.gold }}, 'Facilitator'), React.createElement("div", {style: ES.h3}, 'Run the programme'), React.createElement("p", {style: ES.mono()}, 'Deliver sessions, manage CFI data entry, view live cohort scores and Clarity Delta reports.'), React.createElement("input", {style: ES.input, placeholder: "Cohort code (e.g. ORG2026-A)", value: cohort, onChange: e=>setCohort(e.target.value)}), React.createElement("input", {style: ES.input, type: "password", placeholder: "Facilitator PIN", value: facPin, onChange: e=>{ setFacPin(e.target.value); setFacPinError(''); }}), facPinError && React.createElement("div", {style: { fontSize:'0.65rem', color:EC.red, fontFamily:"'Space Mono', monospace" }}, facPinError), React.createElement("button", {style: ES.btnGold, onClick: handleFacilitatorEnter}, 'Enter as Facilitator →')), React.createElement("div", {style: { ...ES.card(), borderTop:`2px solid ${EC.accent}`, display:'flex', flexDirection:'column', gap:'1rem' }}, React.createElement("div", {style: { fontSize:'0.6rem', letterSpacing:'0.15em', color:EC.accent }}, 'Participant'), React.createElement("div", {style: ES.h3}, 'Complete the programme'), React.createElement("p", {style: ES.mono()}, 'Take the CFI assessment, access lesson materials, and track your cognitive progress.'), React.createElement("input", {style: ES.input, placeholder: "Participant ID (e.g. NF-AB12)", value: pid, onChange: e=>setPid(e.target.value.toUpperCase())}), React.createElement("input", {style: ES.input, placeholder: "Cohort code", value: cohort, onChange: e=>setCohort(e.target.value)}), React.createElement("button", {style: ES.btnPrimary, onClick: ()=>pid&&cohort&&onSelect('participant',{pid,cohort})}, 'Enter Programme →'))), React.createElement("button", {style: { ...ES.mono({ color:EC.muted, cursor:'pointer' }), background:'none', border:'none', marginTop:'1rem' }, onClick: onExit}, '← Return to Platform')))
      );
    }

    // ── Enterprise CFI Assessment ──────────────────────────────────────
    function EntCFIAssessment({ session, onComplete }) {
      const [step, setStep] = useState('intro');
      const [responses, setResponses] = useState({});
      const [phase, setPhase] = useState(session?.phase||'pre');
      const current = Object.keys(responses).length;
      const total = ENT_CFI_ITEMS.length;
      const allDone = current === total;

      function handleSubmit() {
        const composite = entCalcComposite(responses);
        const dims = entCalcDimScores(responses);
        const result = { pid:session.pid, cohort:session.cohort, phase, responses, composite, dims, ts:Date.now() };
        onComplete(result);
        saveEnterpriseResult(result);
        setStep('done');
      }

      if (step==='intro') return (
        React.createElement("div", {style: { maxWidth:700, margin:'0 auto', padding:'5rem 2rem 2rem' }}, React.createElement("div", {style: ES.tag}, 'Cognitive Fusion Index · Edition 2.0'), React.createElement("h1", {style: ES.h1}, 'CFI', React.createElement("em", {style: { color:EC.accent }}, 'Assessment')), React.createElement("div", {style: ES.accentCard({ marginBottom:'2rem' })}, React.createElement("div", {style: { ...ES.mono({ color:EC.text }), marginBottom:'1rem' }}, 'Instructions to Participant'), React.createElement("p", {style: ES.mono()}, 'Read each statement below and select the number that best describes how often you experience this, based on the', React.createElement("strong", {style: { color:EC.text }}, 'past two weeks'), '.'), React.createElement("div", {style: { display:'flex', gap:'1rem', flexWrap:'wrap', marginTop:'1.25rem' }}, ENT_SCALE.map(s=>React.createElement("span", {key: s.val, style: { fontSize:'0.65rem', color:EC.text, background:EC.bg3, padding:'0.3rem 0.75rem', border:`1px solid ${EC.border2}` }}, s.val, '=', s.label)))), React.createElement("div", {style: { display:'flex', gap:'1rem', marginBottom:'1.5rem' }}, ['pre','post'].map(p=>React.createElement("button", {key: p, style: p===phase?ES.btnPrimary:ES.btnGhost, onClick: ()=>setPhase(p)}, p==='pre'?'Pre-Assessment (Week 1)':'Post-Assessment (Week 6)'))), React.createElement("div", {style: ES.mono({ marginBottom:'2rem' })}, 'Participant ID:', React.createElement("strong", {style: { color:EC.accent }}, session.pid), '· Cohort:', React.createElement("strong", {style: { color:EC.accent }}, session.cohort)), React.createElement("button", {style: ES.btnPrimary, onClick: ()=>setStep('items')}, 'Begin Assessment →'))
      );

      if (step==='done') return (
        React.createElement("div", {style: { maxWidth:600, margin:'0 auto', padding:'5rem 2rem 2rem', textAlign:'center' }}, React.createElement("div", {style: { fontSize:'3rem', marginBottom:'1rem' }}, '◈'), React.createElement("div", {style: ES.tag}, 'Assessment Complete'), React.createElement("h2", {style: ES.h2}, 'Your responses have', React.createElement("br", null), React.createElement("em", {style: { color:EC.accent }}, 'been recorded.')), React.createElement("p", {style: ES.mono()}, 'Your facilitator will share cohort-level results at Week 7. Individual scores are not disclosed during the programme.'))
      );

      const dimGroups = ['A','B','C','D','E'];
      const dimNames = { A:'Decision Latency', B:'Mode Rigidity', C:'Emotional Reactivity', D:'Thought Interruption', E:'Cognitive Overload' };

      return (
        React.createElement("div", {style: { maxWidth:760, margin:'0 auto', padding:'5rem 2rem 4rem' }}, React.createElement("div", {style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}, React.createElement("div", {style: ES.mono()}, 'CFI Edition 2.0 ·', phase==='pre'?'Pre-Assessment':'Post-Assessment'), React.createElement("div", {style: ES.mono()}, React.createElement("span", {style: { color:EC.accent }}, current), '/', total, 'items')), React.createElement(EntProgressBar, {value: current, max: total}), React.createElement("div", {style: { height:'2rem' }}), dimGroups.map(dim=>{
            const items = ENT_CFI_ITEMS.filter(i=>i.dim===dim);
            return (
              React.createElement("div", {key: dim, style: { marginBottom:'3rem' }}, React.createElement("div", {style: { ...ES.tag, color:EC.accent, marginBottom:'1.5rem' }}, 'Dimension', dim, ':', dimNames[dim], dim==='E'?' ★ New in Edition 2.0':''), items.map(item=>(
                  React.createElement("div", {key: item.id, style: { ...ES.card({ marginBottom:'1rem', padding:'1.5rem' }), borderLeft:responses[item.id]?`2px solid ${EC.accent}`:`2px solid transparent` }}, React.createElement("div", {style: { display:'flex', gap:'1rem', marginBottom:'1.25rem', alignItems:'flex-start' }}, React.createElement("span", {style: { ...ES.mono({ color:EC.muted, flexShrink:0 }) }}, String(item.id).padStart(2,'0'), item.reversed?' ★':''), React.createElement("span", {style: ES.mono({ color:EC.text, lineHeight:1.7 })}, item.text)), React.createElement("div", {style: { display:'flex', gap:'0.5rem', flexWrap:'wrap' }}, ENT_SCALE.map(s=>{
                        const sel = responses[item.id]===s.val;
                        return (
                          React.createElement("button", {key: s.val, onClick: ()=>setResponses(r=>({...r,[item.id]:s.val})), style: { fontFamily:"'Space Mono', monospace", fontSize:'0.6rem', letterSpacing:'0.1em', padding:'0.5rem 0.75rem', border:`1px solid ${sel?EC.accent:EC.border2}`, background:sel?'rgba(76,247,192,0.12)':'transparent', color:sel?EC.accent:EC.muted, cursor:'pointer', transition:'all 0.15s' }}, s.val, React.createElement("br", null), React.createElement("span", {style: { fontSize:'0.5rem' }}, s.label))
                        );
                      })))
                )))
            );
          }), React.createElement("div", {style: { marginTop:'2rem', paddingTop:'2rem', borderTop:`1px solid ${EC.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}, React.createElement("span", {style: ES.mono()}, allDone?'All items complete. Ready to submit.':`${total-current} items remaining.`), React.createElement("button", {style: allDone?ES.btnPrimary:{...ES.btnPrimary,opacity:0.4,cursor:'not-allowed'}, disabled: !allDone, onClick: handleSubmit}, 'Submit Assessment →')))
      );
    }

    // ── Enterprise Programme View ──────────────────────────────────────
    function EntProgrammeView({ session }) {
      const [activeLesson, setActiveLesson] = useState(null);
      const [lessonTab, setLessonTab] = useState('plan');

      if (activeLesson!==null) {
        const L = ENT_LESSONS[activeLesson];
        const tabs = [['plan','Session Plan'],['practice','Practice Script'],['debrief','Debrief Prompts'],['watchpoints','Watch-Points']];
        return (
          React.createElement("div", {style: { maxWidth:880, margin:'0 auto', padding:'5rem 2rem 4rem' }}, React.createElement("button", {style: { ...ES.mono({ color:EC.accent }), background:'none', border:'none', cursor:'pointer', marginBottom:'2rem' }, onClick: ()=>setActiveLesson(null)}, '← Back to Programme'), React.createElement("div", {style: ES.tag}, 'Lesson', L.num, '· Week', L.week, '·', L.level), React.createElement("h1", {style: ES.h1}, L.title), React.createElement("div", {style: ES.accentCard({ marginBottom:'2rem' })}, React.createElement("div", {style: { ...ES.mono({ color:EC.accent, marginBottom:'0.5rem' }) }}, 'Facilitator Framing'), React.createElement("p", {style: ES.mono({ color:EC.text, lineHeight:1.9 })}, L.framing)), React.createElement("div", {style: { display:'flex', gap:'0.5rem', marginBottom:'2rem', flexWrap:'wrap' }}, tabs.map(([id,label])=>React.createElement("button", {key: id, style: ES.navTab(lessonTab===id), onClick: ()=>setLessonTab(id)}, label))), lessonTab==='plan'&&(
              React.createElement("div", null, L.plan.map((row,i)=>(
                  React.createElement("div", {key: i, style: { display:'grid', gridTemplateColumns:'100px 1fr', gap:'1.5rem', padding:'1.25rem 0', borderBottom:`1px solid ${EC.border}` }}, React.createElement("span", {style: ES.mono({ color:EC.accent })}, row.t), React.createElement("div", null, React.createElement("div", {style: { ...ES.mono({ color:EC.text, marginBottom:'0.3rem' }) }}, row.act), React.createElement("div", {style: ES.mono()}, row.detail)))
                )), React.createElement("div", {style: { marginTop:'2rem', ...ES.card({ borderLeft:`2px solid ${EC.gold}` }) }}, React.createElement("div", {style: { fontSize:'0.6rem', letterSpacing:'0.15em', color:EC.gold, marginBottom:'0.5rem' }}, 'Assignment'), React.createElement("p", {style: ES.mono({ color:EC.text })}, L.assignment)))
            ), lessonTab==='practice'&&(
              React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:'1rem' }}, L.practice.map((step,i)=>(
                  React.createElement("div", {key: i, style: { ...ES.card({ padding:'1.25rem 1.5rem' }), borderLeft:`2px solid ${EC.accent2}`, display:'flex', gap:'1.25rem' }}, React.createElement("span", {style: { ...ES.mono({ color:EC.accent, flexShrink:0 }) }}, String(i+1).padStart(2,'0')), React.createElement("span", {style: ES.mono({ color:EC.text, fontStyle:step.startsWith("'")?'italic':'normal', lineHeight:1.9 })}, step))
                )))
            ), lessonTab==='debrief'&&(
              React.createElement("div", {style: { display:'flex', flexDirection:'column', gap:'0.75rem' }}, L.debrief.map((q,i)=>(
                  React.createElement("div", {key: i, style: { ...ES.card({ padding:'1.25rem 1.5rem' }), display:'flex', gap:'1.25rem' }}, React.createElement("span", {style: { ...ES.mono({ color:EC.accent }) }}, '→'), React.createElement("span", {style: ES.mono({ color:EC.text })}, q))
                )))
            ), lessonTab==='watchpoints'&&(
              React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap:'1rem' }}, L.watchpoints.map((w,i)=>(
                  React.createElement("div", {key: i, style: { ...ES.card({ padding:'1.25rem' }), display:'flex', gap:'1rem' }}, React.createElement("span", {style: { width:6, height:6, borderRadius:'50%', background:EC.gold, flexShrink:0, marginTop:6 }}), React.createElement("span", {style: ES.mono({ color:EC.muted, lineHeight:1.8 })}, w))
                )))
            ), React.createElement("div", {style: { ...ES.card({ marginTop:'2.5rem', background:EC.bg3, textAlign:'center', padding:'2rem' }) }}, React.createElement("div", {style: { fontSize:'0.6rem', letterSpacing:'0.15em', color:EC.accent, marginBottom:'0.75rem' }}, 'Key Insight: Lesson', L.num), React.createElement("div", {style: { fontFamily:"'DM Serif Display', serif", fontSize:'1.3rem', fontStyle:'italic', color:EC.text, lineHeight:1.6 }}, L.keyInsight)))
        );
      }

      return (
        React.createElement("div", {style: { maxWidth:880, margin:'0 auto', padding:'5rem 2rem 4rem' }}, React.createElement("div", {style: ES.tag}, '5-Lesson Programme · 7 Weeks'), React.createElement("h1", {style: ES.h1}, 'Your', React.createElement("em", {style: { color:EC.accent }}, 'Programme')), React.createElement("div", {style: { display:'flex', flexDirection:'column', borderTop:`1px solid ${EC.border}` }}, ENT_LESSONS.map((L,i)=>(
              React.createElement("button", {key: i, onClick: ()=>setActiveLesson(i), style: { display:'grid', gridTemplateColumns:'3rem 1fr auto', gap:'2rem', alignItems:'center', padding:'1.75rem 0', borderBottom:`1px solid ${EC.border}`, background:'none', border:'none', borderTop:'none', textAlign:'left', cursor:'pointer', color:EC.text, width:'100%', transition:'padding-left 0.2s' }, onMouseEnter: e=>e.currentTarget.style.paddingLeft='1rem', onMouseLeave: e=>e.currentTarget.style.paddingLeft='0'}, React.createElement("span", {style: ES.mono({ color:EC.muted })}, String(L.num).padStart(2,'0')), React.createElement("div", null, React.createElement("div", {style: { fontFamily:"'DM Serif Display', serif", fontSize:'1.3rem', marginBottom:'0.3rem', color:EC.text }}, L.title), React.createElement("div", {style: ES.mono({ fontSize:'0.62rem' })}, L.skill, '· Week', L.week, '·', L.duration, 'min')), React.createElement("span", {style: ES.mono({ color:EC.accent })}, L.level, '→'))
            ))))
      );
    }

    // ── Enterprise Facilitator Dashboard ───────────────────────────────
    function EntFacilitatorDashboard({ session, allResults }) {
      const cohortResults = allResults.filter(r=>r.cohort===session.cohort);
      const preResults  = cohortResults.filter(r=>r.phase==='pre');
      const postResults = cohortResults.filter(r=>r.phase==='post');
      const meanScore = arr => arr.length ? Math.round(arr.reduce((s,r)=>s+r.composite,0)/arr.length) : null;
      const preMean = meanScore(preResults);
      const postMean = meanScore(postResults);
      const delta = preMean!==null&&postMean!==null ? postMean-preMean : null;
      const threshold = delta!==null && delta<=-15;
      const dimNames = { A:'Decision Latency', B:'Mode Rigidity', C:'Emotional Reactivity', D:'Thought Interruption', E:'Cognitive Overload' };
      const dimMax   = { A:15, B:15, C:15, D:15, E:5 };

      return (
        React.createElement("div", {style: { maxWidth:1100, margin:'0 auto', padding:'5rem 2rem 4rem' }}, React.createElement("div", {style: ES.tag}, 'Cohort:', session.cohort), React.createElement("h1", {style: ES.h1}, 'Facilitator', React.createElement("em", {style: { color:EC.accent }}, 'Dashboard')), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap:'1rem', marginBottom:'2.5rem' }}, [
              { label:'Pre-assessments', val:preResults.length },
              { label:'Post-assessments', val:postResults.length },
              { label:'Mean Pre CFI', val:preMean!==null?preMean:'N/A' },
              { label:'Clarity Delta', val:delta!==null?(delta>0?'+':'')+delta:'N/A', color:threshold?EC.accent:delta!==null?EC.red:EC.muted },
            ].map((s,i)=>(
              React.createElement("div", {key: i, style: ES.card({ padding:'1.5rem' })}, React.createElement("div", {style: ES.mono({ fontSize:'0.6rem', marginBottom:'0.4rem' })}, s.label), React.createElement("div", {style: { fontFamily:"'DM Serif Display', serif", fontSize:'2rem', color:s.color||EC.text }}, s.val))
            ))), threshold&&(
            React.createElement("div", {style: { ...ES.accentCard({ marginBottom:'2rem', borderLeft:`2px solid ${EC.accent}` }) }}, React.createElement("div", {style: { ...ES.mono({ color:EC.accent }) }}, '◈ Clarity Delta threshold met (≤–15). The NeuralFusion™ programme has demonstrated measurable cognitive improvement.'))
          ), preResults.length>0&&(
            React.createElement("div", {style: ES.card({ padding:'2rem' })}, React.createElement("div", {style: { ...ES.tag, marginBottom:'1.5rem' }}, 'Dimension Breakdown: Pre-Assessment Means'), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'1rem' }}, ['A','B','C','D','E'].map(dim=>{
                  const dimItems = ENT_CFI_ITEMS.filter(i=>i.dim===dim);
                  const mean = preResults.length ? Math.round(preResults.reduce((s,r)=>s+(r.dims?.[dim]||0),0)/preResults.length) : 0;
                  return (
                    React.createElement("div", {key: dim, style: { textAlign:'center', padding:'1rem', border:`1px solid ${EC.border}` }}, React.createElement("div", {style: { fontFamily:"'DM Serif Display', serif", fontSize:'2rem', color:EC.accent, marginBottom:'0.25rem' }}, mean), React.createElement("div", {style: ES.mono({ fontSize:'0.55rem' })}, '/', dimMax[dim]), React.createElement("div", {style: { ...ES.mono({ fontSize:'0.58rem', color:EC.text, marginTop:'0.3rem' }) }}, 'Dim', dim), React.createElement("div", {style: ES.mono({ fontSize:'0.55rem' })}, dimNames[dim]))
                  );
                })))
          ), preResults.length===0&&(
            React.createElement("div", {style: ES.accentCard({ textAlign:'center', padding:'3rem' })}, React.createElement("div", {style: ES.mono()}, 'No assessment data yet for cohort', React.createElement("strong", {style: { color:EC.accent }}, session.cohort), '.', React.createElement("br", null), 'Participants must complete the CFI assessment to populate this dashboard.'))
          ))
      );
    }

    // ── Enterprise CFI Data Entry ──────────────────────────────────────
    function EntCFIDataEntry({ session, onSave }) {
      const [pid, setPid]     = useState('');
      const [group, setGroup] = useState('T');
      const [phaseEntry, setPhaseEntry] = useState('pre');
      const [responses, setResponses] = useState({});
      const [submitted, setSubmitted] = useState(false);
      const allFilled = ENT_CFI_ITEMS.every(i=>responses[i.id]>=1&&responses[i.id]<=5);

      function handleSubmit() {
        const composite = entCalcComposite(responses);
        const dims = entCalcDimScores(responses);
        const result = { pid, cohort:session.cohort, group, phase:phaseEntry, responses, composite, dims, ts:Date.now(), enteredBy:'facilitator' };
        onSave(result);
        saveEnterpriseResult(result);
        setSubmitted(true);
        setTimeout(()=>{ setSubmitted(false); setPid(''); setResponses({}); }, 2000);
      }

      const dimNames = { A:'Decision Latency', B:'Mode Rigidity', C:'Emotional Reactivity', D:'Thought Interruption', E:'Cognitive Overload' };
      return (
        React.createElement("div", {style: { maxWidth:900, margin:'0 auto', padding:'5rem 2rem 4rem' }}, React.createElement("div", {style: ES.tag}, 'Manual CFI Data Entry · Cohort', session.cohort), React.createElement("h1", {style: ES.h1}, 'Enter', React.createElement("em", {style: { color:EC.accent }}, 'CFI Responses')), React.createElement("p", {style: ES.mono({ marginBottom:'2rem' })}, 'Enter raw responses (1–5) exactly as given by the participant. Reversal for reversed items is applied automatically.'), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'2rem' }}, React.createElement("div", null, React.createElement("label", {style: ES.label}, 'Participant ID'), React.createElement("input", {style: ES.input, value: pid, onChange: e=>setPid(e.target.value.toUpperCase()), placeholder: "NF-XXXX"})), React.createElement("div", null, React.createElement("label", {style: ES.label}, 'Group'), React.createElement("div", {style: { display:'flex', gap:'0.5rem' }}, ['T','C'].map(g=>React.createElement("button", {key: g, style: g===group?ES.btnPrimary:ES.btnGhost, onClick: ()=>setGroup(g)}, g==='T'?'Treatment (T)':'Control (C)')))), React.createElement("div", null, React.createElement("label", {style: ES.label}, 'Phase'), React.createElement("div", {style: { display:'flex', gap:'0.5rem' }}, ['pre','post'].map(p=>React.createElement("button", {key: p, style: p===phaseEntry?ES.btnPrimary:ES.btnGhost, onClick: ()=>setPhaseEntry(p)}, p==='pre'?'Pre (Wk 1)':'Post (Wk 6)'))))), ['A','B','C','D','E'].map(dim=>{
            const items = ENT_CFI_ITEMS.filter(i=>i.dim===dim);
            return (
              React.createElement("div", {key: dim, style: { marginBottom:'2rem' }}, React.createElement("div", {style: { ...ES.tag, color:EC.accent, marginBottom:'1rem' }}, 'Dimension', dim, ':', dimNames[dim]), items.map(item=>(
                  React.createElement("div", {key: item.id, style: { display:'grid', gridTemplateColumns:'2rem 1fr auto', gap:'1.25rem', alignItems:'center', padding:'0.75rem 0', borderBottom:`1px solid ${EC.border}` }}, React.createElement("span", {style: ES.mono({ color:EC.muted, fontSize:'0.65rem' })}, 'Q', item.id, item.reversed?'*':'', item.isNew?' ★':''), React.createElement("span", {style: ES.mono({ color:EC.text, lineHeight:1.6 })}, item.text), React.createElement("div", {style: { display:'flex', gap:'0.35rem' }}, [1,2,3,4,5].map(v=>(
                        React.createElement("button", {key: v, onClick: ()=>setResponses(r=>({...r,[item.id]:v})), style: { width:32, height:32, fontFamily:"'Space Mono', monospace", fontSize:'0.65rem', border:`1px solid ${responses[item.id]===v?EC.accent:EC.border2}`, background:responses[item.id]===v?'rgba(76,247,192,0.15)':'transparent', color:responses[item.id]===v?EC.accent:EC.muted, cursor:'pointer' }}, v)
                      ))))
                )))
            );
          }), allFilled&&(
            React.createElement("div", {style: { ...ES.card({ marginBottom:'1.5rem' }), display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}, React.createElement("div", null, React.createElement("div", {style: ES.mono({ color:EC.text })}, 'Composite Score:', React.createElement("strong", {style: { color:EC.accent }}, entCalcComposite(responses)), '/ 65'), React.createElement(EntBandPill, {score: entCalcComposite(responses)})), React.createElement("div", {style: { display:'flex', gap:'1.5rem', flexWrap:'wrap' }}, ['A','B','C','D','E'].map(d=>{
                  const ds = entCalcDimScores(responses);
                  return React.createElement("span", {key: d, style: ES.mono({ fontSize:'0.65rem' })}, 'Dim', d, ':', React.createElement("strong", {style: { color:EC.accent }}, ds[d]));
                })))
          ), React.createElement("button", {style: allFilled&&pid?ES.btnPrimary:{...ES.btnPrimary,opacity:0.4,cursor:'not-allowed'}, disabled: !allFilled||!pid, onClick: handleSubmit}, submitted?'✓ Saved':'Save Participant Record →'))
      );
    }

    // ── Enterprise Results View ────────────────────────────────────────
    function EntResultsView({ session, allResults }) {
      const cohortResults = allResults.filter(r=>r.cohort===session.cohort);
      const [filterPhase, setFilterPhase] = useState('all');
      const filtered = filterPhase==='all' ? cohortResults : cohortResults.filter(r=>r.phase===filterPhase);
      return (
        React.createElement("div", {style: { maxWidth:1100, margin:'0 auto', padding:'5rem 2rem 4rem' }}, React.createElement("div", {style: ES.tag}, 'Cohort Results ·', session.cohort), React.createElement("h1", {style: ES.h1}, 'CFI', React.createElement("em", {style: { color:EC.accent }}, 'Records')), React.createElement("div", {style: { display:'flex', gap:'0.5rem', marginBottom:'2rem', flexWrap:'wrap' }}, [['all','All Records'],['pre','Pre-Assessment'],['post','Post-Assessment']].map(([id,label])=>(
              React.createElement("button", {key: id, style: ES.navTab(filterPhase===id), onClick: ()=>setFilterPhase(id)}, label)
            ))), filtered.length===0 ? (
            React.createElement("div", {style: ES.accentCard({ textAlign:'center', padding:'3rem' })}, React.createElement("p", {style: ES.mono()}, 'No records found for this filter.'))
          ) : (
            React.createElement("div", null, React.createElement("div", {style: { display:'grid', gridTemplateColumns:'120px 60px 60px 60px 60px 60px 60px 60px 60px 1fr', gap:'0.75rem', padding:'0.75rem 0', borderBottom:`1px solid ${EC.border}`, overflowX:'auto' }}, ['Participant','Group','Phase','Date','Dim A','Dim B','Dim C','Dim D','Dim E','Composite'].map(h=>(
                  React.createElement("span", {key: h, style: { fontSize:'0.55rem', letterSpacing:'0.12em', color:EC.muted }}, h)
                ))), filtered.map((r,i)=>{
                const band = entGetBand(r.composite);
                return (
                  React.createElement("div", {key: i, style: { display:'grid', gridTemplateColumns:'120px 60px 60px 60px 60px 60px 60px 60px 60px 1fr', gap:'0.75rem', padding:'1rem 0', borderBottom:`1px solid ${EC.border}`, alignItems:'center' }}, React.createElement("span", {style: ES.mono({ color:EC.accent, fontSize:'0.65rem' })}, r.pid), React.createElement("span", {style: ES.mono({ fontSize:'0.65rem' })}, r.group||'N/A'), React.createElement("span", {style: { ...ES.mono({ fontSize:'0.65rem' }), color:r.phase==='pre'?EC.gold:EC.accent2 }}, r.phase), React.createElement("span", {style: ES.mono({ fontSize:'0.6rem' })}, new Date(r.ts).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})), ['A','B','C','D','E'].map(d=>React.createElement("span", {key: d, style: ES.mono({ fontSize:'0.65rem' })}, r.dims?.[d]||'--')), React.createElement("div", {style: { display:'flex', alignItems:'center', gap:'0.75rem' }}, React.createElement("span", {style: { fontFamily:"'DM Serif Display', serif", fontSize:'1.3rem', color:band.color }}, r.composite), React.createElement(EntBandPill, {score: r.composite})))
                );
              }))
          ))
      );
    }

    // ── Enterprise Main View (wraps entire Enterprise system) ──────────
    function EnterpriseView({ user, session, paystackKey, setShowAuth, isEnterprise, setIsEnterprise, proPrice, setView }) {
      const [entRole, setEntRole]       = useState(null);
      const [entSession, setEntSession] = useState(null);
      const [entView, setEntView]       = useState(null);
      const [entResults, setEntResults] = useState([]);
      const [paystackLoading, setPaystackLoading] = useState(false);
      const paystackHandlerRef = React.useRef(null);

      // (pre-warm removed — initiate-payment is called on click)

      // Load persisted results from Supabase when a session is established
      useEffect(()=>{
        if (entSession?.cohort) {
          loadEnterpriseResults(entSession.cohort).then(results=>{
            if (results.length > 0) setEntResults(results);
          });
        }
      },[entSession?.cohort]);

      // Open Paystack popup synchronously on click (Enterprise)
      // NOTE: openIframe() must be called in the same synchronous call stack as the
      // user gesture — any await before it causes browsers to block the popup.
      const handleUnlock = () => {
        if (!user) { setShowAuth(true); return; }
        if (typeof PaystackPop === 'undefined') { alert('Payment system failed to load. Please check your connection and refresh the page.'); return; }
        if (!paystackKey) { alert('Payment system is not configured. Please try again shortly.'); return; }
        setPaystackLoading(true);
        const resetTimer = setTimeout(() => setPaystackLoading(false), 15000);
        try {
          const handler = PaystackPop.setup({
            key: paystackKey,
            email: user.email,
            amount: ENTERPRISE_PRICE_KOBO,
            currency: 'NGN',
            ref: 'nf_ent_' + Date.now() + '_' + user.id.slice(0, 8),
            metadata: { user_id: user.id, plan: 'enterprise' },
            onSuccess: async (transaction) => {
              clearTimeout(resetTimer);
              setPaystackLoading(false);
              try {
                const res = await fetch(SUPABASE_URL + '/functions/v1/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
                  body: JSON.stringify({ reference: transaction.reference, plan: 'enterprise' }),
                });
                const data = await res.json();
                if (res.ok && data.success) { setIsEnterprise(true); }
                else { alert('Payment received but verification failed. Contact support with ref: ' + transaction.reference); }
              } catch(e) { alert('Network error during verification. Contact support with ref: ' + transaction.reference); }
            },
            onCancel: ()=>{ clearTimeout(resetTimer); setPaystackLoading(false); },
          });
          handler.openIframe();
        } catch(e) {
          clearTimeout(resetTimer);
          setPaystackLoading(false);
          alert('Could not open payment window. Please refresh and try again.');
        }
      };

      // If not enterprise, show paywall
      if (!isEnterprise) {
        return (
          React.createElement("div", {style: { paddingTop:80, paddingBottom:80, background:C.void, minHeight:'100vh' }}, React.createElement("div", {style: { maxWidth:800, margin:'0 auto', padding:'60px 24px', textAlign:'center' }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1.5, color:C.cyan, marginBottom:20 }}, 'NEURALFUSION™ · ENTERPRISE SYSTEM'), React.createElement("div", {style: {
                width:100, height:100, borderRadius:'50%',
                background:`radial-gradient(circle, rgba(76,247,192,0.15), transparent)`,
                border:'1px solid rgba(76,247,192,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                ...mono, fontSize:26, color:'#4CF7C0',
                margin:'0 auto 32px',
                boxShadow:'0 0 60px rgba(76,247,192,0.15)',
                animation:'neuralPulse 3s ease-in-out infinite',
              }}, '◈'), React.createElement("h1", {style: { ...syne, fontSize:'clamp(14px,1.3vw,17px)', fontWeight:900, color:C.text, marginBottom:16, lineHeight:1.05 }}, 'NeuralFusion™', React.createElement("br", null), React.createElement("span", {style: { color:'#4CF7C0' }}, 'Enterprise')), React.createElement("p", {style: { ...inter, fontSize:14, color:C.muted, maxWidth:520, margin:'0 auto 48px', lineHeight:1.8 }}, 'The complete organisational delivery system. Run NeuralFusion™ with your teams, cohorts, and clients. Includes facilitator tools, CFI data management, Clarity Delta reporting, and the full 5-lesson programme.'), React.createElement("div", {style: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap:20, marginBottom:56, textAlign:'left' }}, [
                  { icon:'◈', title:'Cohort Management', desc:'Run multiple cohorts simultaneously. Full participant tracking.' },
                  { icon:'◰', title:'CFI Data Entry', desc:'Manual and participant-led CFI assessments. Edition 2.0 with Dim E.' },
                  { icon:'◱', title:'Facilitator Dashboard', desc:'Live cohort scores, dimension breakdown, Clarity Delta reports.' },
                  { icon:'◲', title:'5-Lesson Programme', desc:'Complete session plans, practice scripts, debrief prompts, watchpoints.' },
                  { icon:'◳', title:'Results Archive', desc:'Full participant records with pre/post comparison.' },
                  { icon:'★', title:'Certification Track', desc:'7-week programme with Week 7 certification session.' },
                ].map((f,i)=>(
                  React.createElement("div", {key: i, style: {
                    padding:'24px', borderRadius:2,
                    background:'rgba(10,22,40,0.6)',
                    border:'1px solid rgba(76,247,192,0.12)',
                    backdropFilter:'blur(8px)',
                  }}, React.createElement("div", {style: { ...mono, fontSize:17, color:'#4CF7C0', marginBottom:12 }}, f.icon), React.createElement("div", {style: { ...syne, fontSize:15, fontWeight:700, color:C.text, marginBottom:8, overflowWrap:'break-word', minWidth:0}}, f.title), React.createElement("div", {style: { ...inter, fontSize:13, color:C.muted, lineHeight:1.6 }}, f.desc))
                ))), React.createElement("div", {style: {
                padding:'48px', borderRadius:4,
                background:'rgba(10,22,40,0.8)',
                border:'1px solid rgba(76,247,192,0.25)',
                backdropFilter:'blur(20px)',
                marginBottom:32,
              }}, React.createElement("div", {style: { ...mono, fontSize:11, letterSpacing:1.5, color:'#4CF7C0', marginBottom:16 }}, 'ENTERPRISE ACCESS · ONE-TIME'), React.createElement("div", {style: { ...syne, fontSize:52, fontWeight:900, color:'#4CF7C0', marginBottom:8, letterSpacing:'-0.02em' }}, '₦', ENTERPRISE_PRICE_DISPLAY), React.createElement("div", {style: { ...inter, fontSize:14, color:C.muted, marginBottom:40 }}, 'One-time payment · Permanent access · All cohorts · All features'), React.createElement("button", {onClick: handleUnlock, disabled: paystackLoading, style: {
                    ...syne, fontSize:14, fontWeight:700, letterSpacing:'0.05em',
                    padding:'18px 48px', background:'#4CF7C0', color:'#050C1A',
                    border:'none', cursor: paystackLoading ? 'default' : 'pointer', borderRadius:2,
                    transition:'all 0.2s', boxShadow:'0 0 40px rgba(76,247,192,0.3)', overflowWrap:'break-word', minWidth:0, opacity: paystackLoading ? 0.7 : 1}, onMouseEnter: e=>{ if(!paystackLoading){ e.currentTarget.style.background='#6FFAD0'; e.currentTarget.style.transform='translateY(-2px)'; } }, onMouseLeave: e=>{ e.currentTarget.style.background='#4CF7C0'; e.currentTarget.style.transform='translateY(0)'; }}, paystackLoading ? 'Opening...' : (user ? `Unlock Enterprise: ₦${ENTERPRISE_PRICE_DISPLAY} →` : 'Sign In to Unlock Enterprise →')), !user&&React.createElement("div", {style: { ...mono, fontSize:10, color:C.muted, marginTop:16 }}, 'Create a free account to proceed with payment.')), React.createElement("div", {style: { ...mono, fontSize:9, letterSpacing:1, color:C.dim }}, 'NeuralFusion™ Enterprise · Edition 2.0 · Life Edet · 2026 · Confidential')))
        );
      }

      // If enterprise, show the app
      if (!entRole) return (
        React.createElement(EntRoleGate, {onSelect: (role,info)=>{ setEntRole(role); setEntSession({...info}); setEntView(role==='facilitator'?'dashboard':'programme'); }, onExit: ()=>{ setView('home'); }})
      );

      return (
        React.createElement("div", {style: { background:EC.bg, minHeight:'100vh', fontFamily:"'Space Mono', monospace", color:EC.text }}, React.createElement("div", {style: { position:'fixed', inset:0, backgroundImage:`linear-gradient(${EC.accent}08 1px,transparent 1px),linear-gradient(90deg,${EC.accent}08 1px,transparent 1px)`, backgroundSize:'60px 60px', pointerEvents:'none', zIndex:0 }}), React.createElement("div", {style: { position:'relative', zIndex:1 }}, React.createElement(EntNavBar, {view: entView, setView: setEntView, role: entRole, onExit: ()=>setEntRole(null)}), entRole==='participant'&&(
              React.createElement(React.Fragment, null, entView==='assessment'&&React.createElement(EntCFIAssessment, {session: entSession, onComplete: r=>{setEntResults(p=>[...p,r]);}}), entView==='programme'&&React.createElement(EntProgrammeView, {session: entSession}))
            ), entRole==='facilitator'&&(
              React.createElement(React.Fragment, null, entView==='dashboard'&&React.createElement(EntFacilitatorDashboard, {session: entSession, allResults: entResults}), entView==='lessons'&&React.createElement(EntProgrammeView, {session: entSession}), entView==='cfi'&&React.createElement(EntCFIDataEntry, {session: entSession, onSave: r=>{setEntResults(p=>{const idx=p.findIndex(x=>x.pid===r.pid&&x.cohort===r.cohort&&x.phase===r.phase);if(idx>=0){const u=[...p];u[idx]=r;return u;}return [...p,r];});}}), entView==='results'&&React.createElement(EntResultsView, {session: entSession, allResults: entResults}))
            )))
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    //  MAIN APP
    // ═══════════════════════════════════════════════════════════════════
    function App() {
      const [view, setView] = useState('home');
      const [showAuth, setShowAuth] = useState(false);
      const [authInitialTab, setAuthInitialTab] = useState('login');

      const [user, setUser] = useState(null);
      const [profile, setProfile] = useState(null);
      const [authLoading, setAuthLoading] = useState(false);
      const [session, setSession] = useState(null);       // JWT session for Edge Function calls

      const [isPro, setIsPro] = useState(false);
      const [isEnterprise, setIsEnterprise] = useState(false);
      const [cfiResult, setCfiResult] = useState(null);
      const [lessonProgress, setLessonProgress] = useState({});
      const [sessions, setSessions] = useState([]);
      const [proPrice, setProPrice] = useState(() => parseInt(localStorage.getItem('nf_pro_price') || '600000'));
      const [paystackKey, setPaystackKey] = useState(() => localStorage.getItem('nf_paystack_key') || 'pk_live_dfa71eca29f942cadc337cb8e41834857e2b129b');

      // Load platform settings from Supabase on mount
      useEffect(()=>{
        getPlatformSetting('pro_price').then(val=>{
          if (val) {
            const p = parseInt(val);
            if (!isNaN(p)) { setProPrice(p); localStorage.setItem('nf_pro_price', p); }
          }
        });
        getPlatformSetting('paystack_public_key').then(val=>{
          if (val) { setPaystackKey(val); localStorage.setItem('nf_paystack_key', val); }
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
          else { setIsPro(false); setLessonProgress({}); setSessions([]); setAuthLoading(false); }
        });
        return ()=>subscription.unsubscribe();
      },[]);

      const loadUser = async (u) => {
        setAuthLoading(true);
        try {
          const [prof, lp] = await Promise.all([getProfile(u.id), loadLessonProgress(u.id)]);
          if (prof) { setProfile(prof); setIsPro(!!prof.is_pro); setIsEnterprise(!!prof.is_enterprise); }
          setLessonProgress(lp);
        } catch(e){}
        setAuthLoading(false);
      };

      const handleSignOut = async () => {
        await sb.auth.signOut();
        setUser(null); setProfile(null); setIsPro(false); setIsEnterprise(false); setLessonProgress({}); setSessions([]);
      };


      const viewProps = { setView, user, session, paystackKey, setShowAuth, isPro, setIsPro, isEnterprise, setIsEnterprise, cfiResult, setCfiResult, lessonProgress, setLessonProgress, sessions, setSessions, proPrice };

      return (
        React.createElement("div", {style: { background:C.void, minHeight:'100vh', color:C.text }}, showAuth && React.createElement(AuthModal, {initialTab: authInitialTab, onClose: ()=>{ setShowAuth(false); setAuthInitialTab('login'); }, onSuccess: ()=>{ setShowAuth(false); setAuthInitialTab('login'); }}), React.createElement(Navbar, {view: view, setView: setView, user: user, profile: profile, setShowAuth: setShowAuth, onSignOut: handleSignOut, authLoading: authLoading}), React.createElement("main", null, view==='home'        && React.createElement(HomeView, viewProps), view==='four-brains' && React.createElement(FourBrainsView, viewProps), view==='cfi'         && React.createElement(CFIView, viewProps), view==='training'    && React.createElement(TrainingView, viewProps), view==='analytics'   && React.createElement(AnalyticsView, viewProps), view==='lessons'     && React.createElement(LessonsView, viewProps), view==='about'       && React.createElement(AboutView, viewProps), view==='legal'       && React.createElement(LegalView, {setView: setView}), view==='enterprise'  && React.createElement(EnterpriseView, {user: user, session: session, paystackKey: paystackKey, setShowAuth: setShowAuth, isEnterprise: isEnterprise, setIsEnterprise: setIsEnterprise, proPrice: proPrice, setView: setView}), view==='admin'       && profile?.is_admin === true && React.createElement(AdminView, {user: user, setView: setView, onPriceChange: setProPrice})), React.createElement(Footer, {setView: setView}), view !== 'enterprise' && React.createElement(BottomNav, {view: view, setView: setView}))
      );
    }

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
