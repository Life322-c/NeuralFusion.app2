/* ============================================================
   NeuralFusion™ — app.js
   © 2026 Life Edet. All rights reserved.
   Supabase + Paystack integrated | React via CDN + Babel
   ============================================================ */

// ── Supabase Config ──────────────────────────────────────────
const SUPABASE_URL  = "https://civwcmteqidppscbpqni.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdndjbXRlcWlkcHBzY2JwcW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mjc3MDYsImV4cCI6MjA4OTUwMzcwNn0.kRaEGNQw-vsXE9NaSExO3RC4KyHzV3kl9JpnKzDN2Sk";

// ── Paystack Config ──────────────────────────────────────────
const PAYSTACK_PUBLIC_KEY = "pk_live_dfa71eca29f942cadc337cb8e41834857e2b129b";

// ── Supabase Client ──────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── React Hooks ──────────────────────────────────────────────
const { useState, useEffect, useCallback, useRef } = React;

// ============================================================
//  THEME + DATA CONSTANTS
// ============================================================
const T = {
  navy: "#070F1E", navy2: "#0C1A30", navy3: "#112240", navy4: "#1A3158",
  gold: "#C9A84C", goldLight: "#E8D08A",
  goldDim: "rgba(201,168,76,0.12)", goldBorder: "rgba(201,168,76,0.25)",
  text: "#F0EDE4", muted: "#6B7FA0", muted2: "#A0B0C8",
  modes: {
    analytical:  { color: "#4A9EFF",  bg: "rgba(74,158,255,0.1)",  label: "Analytical",  desc: "Logic · Structure · Facts" },
    intuitive:   { color: "#A78BFA",  bg: "rgba(167,139,250,0.1)", label: "Intuitive",   desc: "Insight · Pattern · Gut" },
    associative: { color: "#34D399",  bg: "rgba(52,211,153,0.1)",  label: "Associative", desc: "Creativity · Connection · Ideas" },
    reflective:  { color: "#FBBF24",  bg: "rgba(251,191,36,0.1)",  label: "Reflective",  desc: "Awareness · Evaluation · Meaning" },
  },
};
const serif = { fontFamily: "'Cormorant Garamond', serif" };
const sans  = { fontFamily: "'DM Sans', sans-serif" };
const card  = (ex={}) => ({ background: T.navy2, border: `1px solid ${T.goldBorder}`, borderRadius: 16, ...ex });
const goldBtn = (ex={}) => ({ background: T.gold, color: T.navy, fontWeight: 700, borderRadius: 10, cursor: "pointer", border: "none", fontFamily: "'DM Sans',sans-serif", ...ex });
const outlineBtn = (ex={}) => ({ background: "transparent", color: T.gold, border: `1px solid ${T.goldBorder}`, borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", ...ex });
const inp = (ex={}) => ({ background: T.navy3, border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 10, color: T.text, fontFamily: "'DM Sans',sans-serif", width: "100%", padding: "12px 14px", fontSize: 14, resize: "none", outline: "none", ...ex });
const scoreColor = (s) => s >= 80 ? "#34D399" : s >= 60 ? T.gold : "#F87171";

const LESSONS_DATA = [
  { id:1, title:"Foundation of Integrated Thinking",       sub:"Understand the Core Loop. Begin control.",           level:"Beginner",     free:true,  duration:"12 min" },
  { id:2, title:"Mode Activation & Mental Control",        sub:"Enter and exit thinking modes on command.",          level:"Intermediate", free:false, duration:"15 min" },
  { id:3, title:"Synthesis & Decision Mastery",            sub:"Convert confusion into clear, stable decisions.",    level:"Intermediate", free:false, duration:"18 min" },
  { id:4, title:"Stabilization Under Pressure",            sub:"Maintain clarity when urgency strikes.",             level:"Advanced",     free:false, duration:"20 min" },
  { id:5, title:"Automatic Integration & Cognitive Fluency",sub:"From conscious effort to instinctive mastery.",    level:"Advanced",     free:false, duration:"16 min" },
];

const LESSON_CONTENT = {
  1: { pages: [
    { title:"What is NeuralFusion™?", body:"NeuralFusion™ is a structured mental skill that trains the brain to combine multiple thinking modes intentionally instead of relying on only one. Most people think in fragments: logic without intuition, creativity without structure, emotion without reflection. NeuralFusion™ teaches you how to fuse these modes into a coordinated thinking loop.\n\nIt is not intelligence — it is control over intelligence." },
    { title:"The Four Core Thinking Modes", body:"Analytical Mode: Logic, structure & facts — the foundation of precision decisions.\n\nIntuitive Mode: Gut feeling, insight & pattern recognition — your fastest signal processor.\n\nAssociative Mode: Creativity, connection & ideas — your lateral expansion engine.\n\nReflective Mode: Self-awareness, evaluation & meaning — your quality control system.\n\nEvery human has these four modes. Very few know how to coordinate them." },
    { title:"The NeuralFusion™ Core Loop", body:"The Core Loop runs in four stages:\n\n1. Decomposition — Break the problem into distinct parts.\n2. Mode Switching — Activate the right thinking mode intentionally.\n3. Synthesis — Combine outputs into a unified insight.\n4. Stabilization — Lock clarity and reduce mental noise.\n\nThis loop can be completed in under one minute with training." },
    { title:"First Guided Practice", body:"Sit comfortably. Choose a real issue you face.\n\nApply Decomposition: Write the issue in one sentence.\nApply Analytical Mode: List facts only — no emotion.\nApply Intuitive Mode: Pause and write your gut response.\nApply Associative Mode: Write 3 ideas or unexpected connections.\nApply Reflective Mode: Ask, 'What does this teach me?'\n\nObserve how clarity increases after running the full cycle." },
  ]},
  2: { pages: [
    { title:"The Core Truth of Mental Control", body:"Most people do not think — they react. Thoughts appear automatically because the brain defaults to habit, emotion, and urgency.\n\nNeuralFusion™ replaces reaction with activation. Control begins the moment you choose how to think." },
    { title:"Mode Activation Signals", body:"Each thinking mode has a mental entry signal:\n\nAnalytical: Ask — 'What are the facts?'\nIntuitive: Pause — ask 'What feels correct?'\nAssociative: Ask — 'What else is this connected to?'\nReflective: Ask — 'What does this mean for me?'\n\nQuestions are switches. Use them deliberately." },
    { title:"The Switching Drill", body:"Exercise: Conscious Mode Shifting (7 minutes)\n\n1. Sit upright and breathe slowly.\n2. Choose a neutral topic (e.g. your day).\n3. Spend 60 seconds in each mode:\n   · Facts only (Analytical)\n   · Gut response (Intuitive)\n   · Ideas/connection (Associative)\n   · Meaning/Lesson (Reflective)\n\nNotice the mental texture of each mode. This builds mode awareness." },
    { title:"Emergency Reset", body:"When thoughts feel overwhelming:\n\n1. Pause\n2. Name the mode you are stuck in\n3. Switch deliberately to Reflective Mode\n4. Ask: 'What is one thing I can control right now?'\n\nThis collapses noise into clarity.\n\nKey Insight: Mental freedom is the ability to switch — not escape — your thoughts." },
  ]},
  3: { pages: [
    { title:"Why Most Decisions Fail", body:"Decisions fail not from lack of intelligence — but from fragmentation:\n\n· Logic argues with emotion\n· Intuition contradicts facts\n· Creativity overwhelms focus\n\nNeuralFusion™ ends internal conflict by unifying outputs. A fused mind does not hesitate." },
    { title:"The Synthesis Framework", body:"After activating all four modes, synthesis follows a strict order:\n\n1. Extract — Identify the strongest output from each mode.\n2. Align — Check for overlaps and contradictions.\n3. Compress — Reduce into one core insight.\n4. Decide — Commit mentally to a single direction.\n\nClarity is compression." },
    { title:"The Commitment Lock", body:"Most people think clearly but fail to commit.\n\nNeuralFusion™ introduces the Commitment Lock:\n· Once synthesis is complete\n· Re-analysis stops\n· Action begins\n\nThis trains decisiveness. Revisiting a decision without new data breaks fusion." },
    { title:"Handling Doubt After Decision", body:"Doubt means a mode is reactivating unnecessarily.\n\nResponse protocol:\n1. Identify the reactivated mode.\n2. Acknowledge it.\n3. Return to the fused conclusion.\n\nThis preserves stability. Clarity is not finding the right answer — it is unifying the mind." },
  ]},
  4: { pages: [
    { title:"Why Clarity Collapses Under Pressure", body:"Pressure triggers:\n1. Emotional hijacking\n2. Narrow attention\n3. Mode dominance (usually emotion or analysis)\n\nThe brain enters survival prioritization — not reasoning.\n\nNeuralFusion™ does not fight pressure. It absorbs and stabilizes it. Pressure is not the enemy. Instability is." },
    { title:"The Three Stabilizers", body:"1. Cognitive Anchor\nA short internal statement that locks synthesis.\nExamples: 'This is my decision.' / 'I have fused this already.'\n\n2. Temporal Compression\nPressure distorts time. Ask: 'What matters in the next 10 minutes?'\n\n3. Mode Containment\nWhen one mode flares: Identify it → Reduce its influence → Return authority to synthesis.\nNo mode is eliminated. Only regulated." },
    { title:"Pressure Simulation", body:"Exercise: Stabilized Thinking Drill (8 minutes)\n\n1. Recall a recent stressful moment.\n2. Identify the dominant mode at the time.\n3. Re-run the situation mentally using:\n   · One Cognitive Anchor\n   · One compressed time frame\n4. Observe how tension reduces.\n\nThis trains resilience of clarity." },
    { title:"Preventing Mental Relapse", body:"Relapse happens when:\n1. Decisions are revisited emotionally.\n2. Old habits regain control.\n\nRelapse Prevention Protocol:\n1. Recognize the triggers.\n2. Re-state the fused conclusion.\n3. Take one aligned action.\n\nAction stabilizes thought. Mental mastery is not calm thinking — it is stable thinking." },
  ]},
  5: { pages: [
    { title:"What is Cognitive Fluency?", body:"Cognitive Fluency is the ability to think clearly without deliberate effort. It is fast, stable, and adaptive.\n\nElite performers do not think harder — they think integrated.\n\nNeuralFusion™ trains this integration deliberately, then releases it into instinct.\n\nMastery is when effort disappears." },
    { title:"From Skill to Instinct", body:"All skills pass through three stages:\n\n1. Conscious Control — Slow, effortful\n2. Structured Practice — Consistent, deliberate\n3. Automatic Execution — Fast, natural\n\nLesson Five initiates Stage 3." },
    { title:"The Automatic Fusion Trigger", body:"NeuralFusion™ automation begins with one internal cue: 'Fuse'\n\nThis word signals the brain to:\n1. Decompose automatically\n2. Activate relevant modes\n3. Synthesize rapidly\n4. Stabilize instantly\n\nWith repetition, this becomes reflexive." },
    { title:"Fluency Installation", body:"Exercise: One-Word Fusion (6 minutes)\n\n1. Sit calmly.\n2. Think of a current situation.\n3. Say internally: 'Fuse'\n4. Allow the mind to organize itself.\n5. Notice the clarity — without forcing.\n\nRepeat daily for reinforcement.\n\nYou have completed NeuralFusion™ Core Training (Level One). What follows is not more lessons — but deeper application." },
  ]},
};

const CFI_ITEMS = [
  { id:1,  dim:"A", dimLabel:"Analytical Coherence",  text:"I struggle to organize my thoughts into a clear logical sequence when facing complex problems." },
  { id:2,  dim:"A", dimLabel:"Analytical Coherence",  text:"I find it difficult to identify the key facts in a situation before making a decision." },
  { id:3,  dim:"A", dimLabel:"Analytical Coherence",  text:"My structured planning breaks down under time pressure or ambiguity." },
  { id:4,  dim:"B", dimLabel:"Intuitive Alignment",   text:"I frequently override my gut instinct with logic, only to regret the decision later." },
  { id:5,  dim:"B", dimLabel:"Intuitive Alignment",   text:"I have difficulty trusting my pattern recognition in fast-moving situations." },
  { id:6,  dim:"B", dimLabel:"Intuitive Alignment",   text:"My intuitive responses often conflict with my conscious reasoning." },
  { id:7,  dim:"C", dimLabel:"Associative Flexibility",text:"I struggle to generate creative alternatives when my initial approach fails." },
  { id:8,  dim:"C", dimLabel:"Associative Flexibility",text:"I find it hard to connect ideas across different domains of my life or work." },
  { id:9,  dim:"D", dimLabel:"Reflective Depth",      text:"I rarely take time to evaluate my thinking process after completing an important task." },
  { id:10, dim:"D", dimLabel:"Reflective Depth",      text:"I have difficulty identifying which thinking pattern caused a poor outcome." },
  { id:11, dim:"D", dimLabel:"Reflective Depth",      text:"Deep self-reflection leads me toward rumination rather than clarity." },
  { id:12, dim:"E", dimLabel:"Integration Stability", text:"Under pressure, my thinking modes feel scattered and hard to coordinate." },
  { id:13, dim:"E", dimLabel:"Integration Stability", text:"I experience frequent mental fatigue or confusion when managing multiple priorities." },
];

const FAC_STEPS = [
  { mode:"analytical", label:"DECOMPOSE", color:T.modes.analytical.color, q:"What exactly is the problem or situation?", sub:"State it factually. No emotion yet. Just the structure.", placeholder:"Describe it clearly in 1–3 sentences..." },
  { mode:"intuitive",  label:"SENSE",     color:T.modes.intuitive.color,  q:"What does your gut signal about this?",     sub:"Trust the pattern before analyzing it.", placeholder:"What feels true, even before you can explain it?" },
  { mode:"associative",label:"EXPAND",    color:T.modes.associative.color,q:"What connections or alternatives haven't you explored?", sub:"Think laterally. Break your own frame.", placeholder:"What else could this be? What pattern do you see?" },
  { mode:"reflective", label:"REFLECT",   color:T.modes.reflective.color, q:"What does this reveal about your thinking?", sub:"Honest self-evaluation creates permanent clarity.", placeholder:"What belief or pattern am I operating from?" },
  { mode:"synthesis",  label:"ARCHITECTURAL DECLARATION", color:T.gold, q:"What is your one fused decision?", sub:"Commitment Lock activated. No more re-analysis after this.", placeholder:"Write the one action that ends the confusion..." },
];

const ONBOARD_SLIDES = [
  { icon:"🧠", title:"The Problem With Your Mind",        body:"You don't have a lack of intelligence. You have fragmented thinking. Your analytical mode fights your intuition. Your creativity overwhelms your focus. NeuralFusion™ ends that conflict — permanently." },
  { icon:"⚡", title:"The Three-Step Protocol",           body:"Every session runs through the same precision loop: Dump the noise. Decompose the fragments. Rebuild into one clear decision. The average NeuralFusion™ session takes 5 minutes. The clarity lasts for days." },
  { icon:"🎯", title:"Your Cognitive Operating System",   body:"NeuralFusion™ is not a motivational tool. It is a trainable cognitive skill — invented by Life Edet — that installs structured thinking as a permanent mental operating system. You are about to take control of your mind." },
];

const FAQ_DATA = [
  { q:"What is NeuralFusion™?",                    a:"NeuralFusion™ is a structured cognitive skill framework invented by Life Edet. It trains the brain to coordinate four thinking modes — Analytical, Intuitive, Associative, and Reflective — into a single, controlled decision process. It is not a personality test, meditation app, or therapy tool. It is a trainable mental operating system." },
  { q:"How is it different from therapy or mindfulness?", a:"Therapy addresses psychological history. Mindfulness addresses present-moment awareness. NeuralFusion™ addresses cognitive architecture — the structure of how you think. It is a skill system, not a wellness practice. Results are measurable and repeatable." },
  { q:"What is the Cognitive Fragmentation Index (CFI™)?", a:"The CFI™ is a diagnostic instrument developed by Life Edet that measures the degree of fragmentation across your five cognitive dimensions. It produces a score and a band — from Integrated to Critical Fragmentation — and generates a personalized intervention recommendation." },
  { q:"How long before I see results?",             a:"Most users report increased decision clarity within 1–3 sessions. The Core Loop can be completed in under 5 minutes once trained. Cognitive Fluency — the stage where NeuralFusion™ operates automatically — typically installs within 21–30 days of daily practice." },
  { q:"What is the Commitment Lock?",               a:"The Commitment Lock is a NeuralFusion™ proprietary mechanism that stops re-analysis after synthesis is complete. Once you have run all four modes and produced a fused conclusion, the Commitment Lock prevents destructive doubt from fragmenting the decision. Action begins. Re-analysis stops." },
  { q:"What does the Pro plan include?",            a:"Pro unlocks all 5 NeuralFusion™ lessons, unlimited thinking sessions, full CFI™ assessment with detailed dimensional analysis, session history, and advanced thinking protocols including the Decision Pressure Index and Executive Compression tools." },
  { q:"What is the NF Facilitator Program?",        a:"The NF Facilitator Certification Program trains professionals to deliver NeuralFusion™ in organizational, coaching, or educational settings. It includes the Enterprise Facilitator Guide, cohort delivery tools, and licensed facilitation rights. Facilitator access is available by application." },
];

// ============================================================
//  SUPABASE HELPERS
// ============================================================
async function getProfile(userId) {
  const { data } = await sb.from("profiles").select("*").eq("id", userId).single();
  return data;
}
async function upsertProfile(userId, updates) {
  await sb.from("profiles").upsert({ id: userId, ...updates }, { onConflict: "id" });
}
async function saveSBSession(userId, session) {
  const { data } = await sb.from("nf_sessions").insert({
    user_id: userId,
    title: session.title,
    dump_text: session.dump,
    decompose_text: session.decompose,
    rebuild_text: session.rebuild,
    clarity_score: session.score,
    path: session.path || null,
    fac_answers: session.facAnswers || null,
  }).select().single();
  return data;
}
async function loadSBSessions(userId) {
  const { data } = await sb.from("nf_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  return data || [];
}
async function saveCFIResult(userId, result, answers) {
  await sb.from("cfi_results").insert({ user_id: userId, total_score: result.total, band: result.band, dim_scores: result.dimScores, answers });
}
async function upsertLessonProgress(userId, lessonId, progress) {
  await sb.from("lesson_progress").upsert({ user_id: userId, lesson_id: lessonId, progress, completed: progress === 100 }, { onConflict: "user_id,lesson_id" });
}
async function loadLessonProgress(userId) {
  const { data } = await sb.from("lesson_progress").select("*").eq("user_id", userId);
  const map = {};
  (data || []).forEach(r => { map[r.lesson_id] = r.progress; });
  return map;
}
async function getAppSettings() {
  const { data } = await sb.from("app_settings").select("*");
  const s = {};
  (data || []).forEach(r => { s[r.key] = r.value; });
  return s;
}
async function setAppSetting(key, value) {
  await sb.from("app_settings").upsert({ key, value }, { onConflict: "key" });
}

// ============================================================
//  PAYSTACK HELPERS
// ============================================================
function paystackPay({ email, amount, ref, onSuccess, onClose, meta = {} }) {
  if (typeof PaystackPop === "undefined") {
    alert("Paystack could not be loaded. Please check your connection.");
    return;
  }
  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount: amount * 100,   // Paystack uses kobo
    currency: "NGN",
    ref: ref || `NF-${Date.now()}`,
    metadata: { custom_fields: [{ display_name: "Product", variable_name: "product", value: meta.product || "NeuralFusion Pro" }] },
    callback: function(response) { onSuccess(response); },
    onClose: function() { if (onClose) onClose(); },
  });
  handler.openIframe();
}

// ============================================================
//  AUTH MODAL
// ============================================================
function AuthModal({ onClose, onAuthSuccess }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const handleLogin = async () => {
    if (!email || !password) { setMsg({ text: "Email and password required.", type: "error" }); return; }
    setLoading(true); setMsg({ text: "", type: "" });
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMsg({ text: error.message, type: "error" });
    else { onAuthSuccess(); onClose(); }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) { setMsg({ text: "All fields required.", type: "error" }); return; }
    if (password.length < 6) { setMsg({ text: "Password must be at least 6 characters.", type: "error" }); return; }
    setLoading(true); setMsg({ text: "", type: "" });
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: "https://life322-c.github.io/NeuralFusion.app2/"
      }
    });
    setLoading(false);
    if (error) setMsg({ text: error.message, type: "error" });
    else setMsg({ text: "Account created! Check your email and click the confirmation button to activate your account.", type: "success" });
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(7,15,30,0.96)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ ...card(), maxWidth:420, width:"100%", padding:"36px 28px", animation:"fadeIn 0.35s ease" }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <div style={{ ...serif, fontSize:22, color:T.text, fontWeight:700 }}>NeuralFusion™</div>
            <div style={{ color:T.muted, fontSize:12, ...sans }}>Sign in to sync your sessions</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.muted, fontSize:22, cursor:"pointer" }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${T.goldBorder}`, marginBottom:24 }}>
          {["login","signup"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:"10px", background:"none", border:"none",
              color: tab===t ? T.gold : T.muted,
              fontSize:14, fontWeight:600, ...sans,
              borderBottom: tab===t ? `2px solid ${T.gold}` : "2px solid transparent",
              transition:"all 0.2s"
            }}>
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Fields */}
        {tab === "signup" && (
          <div style={{ marginBottom:14 }}>
            <label style={{ color:T.muted2, fontSize:12, fontWeight:600, display:"block", marginBottom:6, ...sans }}>FULL NAME</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{ ...inp() }} />
          </div>
        )}
        <div style={{ marginBottom:14 }}>
          <label style={{ color:T.muted2, fontSize:12, fontWeight:600, display:"block", marginBottom:6, ...sans }}>EMAIL</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" style={{ ...inp() }}
            onKeyDown={e=>e.key==="Enter" && (tab==="login"?handleLogin():handleSignup())} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ color:T.muted2, fontSize:12, fontWeight:600, display:"block", marginBottom:6, ...sans }}>PASSWORD</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={{ ...inp() }}
            onKeyDown={e=>e.key==="Enter" && (tab==="login"?handleLogin():handleSignup())} />
        </div>

        {msg.text && (
          <div style={{ marginBottom:16, color: msg.type==="error" ? "#F87171" : "#34D399", fontSize:13, ...sans }}>
            {msg.text}
          </div>
        )}

        <button onClick={tab==="login"?handleLogin:handleSignup}
          style={{ ...goldBtn(), width:"100%", padding:"14px", fontSize:15, opacity: loading?0.6:1 }}
          disabled={loading}>
          {loading ? "Please wait..." : tab==="login" ? "Sign In →" : "Create Account →"}
        </button>

        <p style={{ color:T.muted, fontSize:11, textAlign:"center", marginTop:16, lineHeight:1.6, ...sans }}>
          Your data is stored securely via Supabase.<br/>No spam. No sharing.
        </p>
      </div>
    </div>
  );
}

// ============================================================
//  ONBOARDING MODAL
// ============================================================
function OnboardingModal({ onDone }) {
  const [step, setStep] = useState(0);
  const slide = ONBOARD_SLIDES[step];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(7,15,30,0.95)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ ...card(), maxWidth:480, width:"100%", padding:"40px 32px", textAlign:"center", animation:"fadeIn 0.4s ease" }}>
        <div style={{ fontSize:48, marginBottom:16 }}>{slide.icon}</div>
        <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:12, ...sans }}>NEURALFUSION™ · {step+1} OF 3</div>
        <h2 style={{ ...serif, fontSize:28, color:T.text, marginBottom:16, lineHeight:1.2 }}>{slide.title}</h2>
        <p style={{ color:T.muted2, fontSize:15, lineHeight:1.7, marginBottom:32, ...sans }}>{slide.body}</p>
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:28 }}>
          {ONBOARD_SLIDES.map((_,i) => (
            <div key={i} style={{ width:i===step?24:8, height:8, borderRadius:4, background:i===step?T.gold:T.navy4, transition:"all 0.3s" }} />
          ))}
        </div>
        {step < 2
          ? <button style={{ ...goldBtn(), padding:"14px 36px", fontSize:15 }} onClick={()=>setStep(s=>s+1)}>Continue →</button>
          : <button style={{ ...goldBtn(), padding:"14px 36px", fontSize:15 }} onClick={onDone}>Enter NeuralFusion™ →</button>
        }
        {step > 0 && (
          <div style={{ marginTop:16 }}>
            <button style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:13, ...sans }} onClick={()=>setStep(s=>s-1)}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  NAVBAR
// ============================================================
function Navbar({ view, setView, isPro, onAdmin, user, setShowAuth, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [menuOpen]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navLinks = [["home","Home"],["lessons","Lessons"],["cfi","CFI™"],["history","Sessions"],["upgrade","Upgrade"]];

  const handleNav = (v) => { setView(v); setMenuOpen(false); };

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className={`nf-nav-overlay${menuOpen ? " nf-nav-overlay--open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <nav className="nf-nav">
        <div className="nf-nav__inner">

          {/* Logo */}
          <div className="nf-nav__logo" onClick={() => handleNav("home")}>
            <div className="nf-nav__logo-icon">⚡</div>
            <span style={{ ...serif, fontSize:18, color:T.text, fontWeight:700 }}>NeuralFusion™</span>
            {isPro && <span className="nf-pro-badge">PRO</span>}
          </div>

          {/* Desktop links */}
          <div className="nf-nav__desktop">
            {navLinks.map(([v,l]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ background:view===v?T.goldDim:"none", color:view===v?T.gold:T.muted2 }}
                className="nf-nav__link">
                {l}
              </button>
            ))}
            {user
              ? <button onClick={onSignOut} className="nf-nav__signout">Sign Out</button>
              : <button onClick={() => setShowAuth(true)} className="nf-nav__signin">Sign In</button>
            }
            <button onClick={onAdmin} className="nf-nav__admin">⚙️</button>
          </div>

          {/* Hamburger */}
          <button
            className={`nf-hamburger${menuOpen ? " nf-hamburger--open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className="nf-hamburger__bar" />
            <span className="nf-hamburger__bar" />
            <span className="nf-hamburger__bar" />
          </button>

        </div>

        {/* Mobile drawer */}
        <div
          ref={drawerRef}
          className={`nf-drawer${menuOpen ? " nf-drawer--open" : ""}`}
          aria-hidden={!menuOpen}
        >
          {/* User status */}
          <div className="nf-drawer__user">
            {user
              ? <span className="nf-drawer__email">⚡ {user.email}</span>
              : <span className="nf-drawer__email nf-drawer__email--guest">Not signed in</span>
            }
            {isPro && <span className="nf-pro-badge">PRO</span>}
          </div>

          {/* Nav links */}
          <div className="nf-drawer__links">
            {navLinks.map(([v,l]) => (
              <button key={v} onClick={() => handleNav(v)}
                className={`nf-drawer__link${view===v ? " nf-drawer__link--active" : ""}`}
                style={{ color: view===v ? T.gold : T.muted2, background: view===v ? T.goldDim : "transparent" }}>
                {l}
              </button>
            ))}
          </div>

          {/* Footer actions */}
          <div className="nf-drawer__footer">
            {user
              ? <button onClick={() => { onSignOut(); setMenuOpen(false); }} className="nf-drawer__signout">Sign Out</button>
              : <button onClick={() => { setShowAuth(true); setMenuOpen(false); }} className="nf-drawer__cta">Sign In →</button>
            }
            <button onClick={() => { onAdmin(); setMenuOpen(false); }} className="nf-drawer__admin-btn">⚙️ Admin</button>
          </div>
        </div>
      </nav>
    </>
  );
}

// ============================================================
//  HOME VIEW
// ============================================================
function HomeView({ setView, setInitialThought, initialThought, streak, sessions, isPro, user, setShowAuth }) {
  return (
    <div style={{ paddingTop:32, animation:"fadeIn 0.5s ease" }}>
      {/* Streak + session count */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:T.navy3, border:`1px solid rgba(251,191,36,0.2)`, borderRadius:10, padding:"8px 16px" }}>
          <span style={{ fontSize:18 }}>🔥</span>
          <span style={{ color:T.gold, fontWeight:700, fontSize:15, ...sans }}>{streak} Day Streak</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {!user && <button onClick={()=>setShowAuth(true)} style={{ ...goldBtn(), padding:"8px 16px", fontSize:12 }}>Sign In to Sync</button>}
          <div style={{ background:T.goldDim, border:`1px solid ${T.goldBorder}`, borderRadius:10, padding:"6px 14px" }}>
            <span style={{ color:T.muted2, fontSize:12, ...sans }}>Sessions: </span>
            <span style={{ color:T.gold, fontWeight:700, fontSize:13, ...sans }}>{sessions.length}</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign:"center", marginBottom:48 }}>
        <div style={{ fontSize:11, color:T.gold, letterSpacing:4, fontWeight:700, marginBottom:16, ...sans }}>COGNITIVE OPERATING SYSTEM</div>
        <h1 style={{ ...serif, fontSize:"clamp(32px,6vw,56px)", color:T.text, lineHeight:1.1, marginBottom:20 }}>
          Turn Mental Chaos Into<br/><span style={{ color:T.gold }}>Clear Decisions</span> in 5 Minutes
        </h1>
        <p style={{ color:T.muted2, fontSize:16, maxWidth:520, margin:"0 auto 36px", lineHeight:1.7, ...sans }}>
          NeuralFusion™ is not a journaling app. It is a structured cognitive protocol that coordinates your four thinking modes into one fused, decisive output.
        </p>
        {/* Input */}
        <div style={{ maxWidth:560, margin:"0 auto" }}>
          <div style={{ background:T.navy2, border:`1px solid ${T.goldBorder}`, borderRadius:14, padding:"4px 4px 4px 20px", display:"flex", alignItems:"center", gap:8, boxShadow:`0 8px 32px rgba(201,168,76,0.08)` }}>
            <input value={initialThought} onChange={e=>setInitialThought(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&setView("path")}
              placeholder="What's consuming your mind right now?"
              style={{ flex:1, background:"none", border:"none", color:T.text, fontSize:15, outline:"none", fontFamily:"'DM Sans',sans-serif", padding:"10px 0" }} />
            <button onClick={()=>setView("path")} style={{ ...goldBtn(), padding:"12px 24px", fontSize:14, borderRadius:10, whiteSpace:"nowrap" }}>
              Start Thinking →
            </button>
          </div>
          <p style={{ color:T.muted, fontSize:12, marginTop:8, ...sans }}>Press Enter or click to begin. No account required for first session.</p>
        </div>
      </div>

      {/* Mode cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:40 }}>
        {Object.entries(T.modes).map(([key,m]) => (
          <div key={key} style={{ background:m.bg, border:`1px solid ${m.color}30`, borderRadius:12, padding:"16px 18px" }}>
            <div style={{ color:m.color, fontWeight:700, fontSize:13, marginBottom:4, ...sans }}>{m.label}</div>
            <div style={{ color:T.muted2, fontSize:12, ...sans }}>{m.desc}</div>
          </div>
        ))}
      </div>

      {/* Story section */}
      <div style={{ ...card(), padding:"32px 28px", marginBottom:24, textAlign:"center" }}>
        <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:16, ...sans }}>THE ORIGIN</div>
        <h2 style={{ ...serif, fontSize:28, color:T.text, marginBottom:20, lineHeight:1.3 }}>
          "Your Mind Is Not Broken.<br/>It Is Unstructured."
        </h2>
        <p style={{ color:T.muted2, fontSize:15, lineHeight:1.8, maxWidth:620, margin:"0 auto 20px", ...sans }}>
          Life Edet noticed something that decades of psychology had missed: intelligent people were not failing because of low IQ or poor information. They were failing because their thinking modes — logic, intuition, creativity, and self-awareness — were <em style={{ color:T.gold }}>competing</em> instead of cooperating.
        </p>
        <p style={{ color:T.muted2, fontSize:15, lineHeight:1.8, maxWidth:620, margin:"0 auto 20px", ...sans }}>
          A high-achieving executive freezes before a critical decision. A sharp entrepreneur spirals in overthinking. A creative professional loses focus under pressure. These are not personality flaws. They are symptoms of <strong style={{ color:T.text }}>Cognitive Fragmentation</strong>.
        </p>
        <p style={{ color:T.muted2, fontSize:15, lineHeight:1.8, maxWidth:620, margin:"0 auto 20px", ...sans }}>
          NeuralFusion™ was invented as the antidote — a trainable, repeatable protocol that installs cognitive coordination as a permanent operating system.
        </p>
        <div style={{ marginTop:24, padding:"20px 24px", background:T.navy3, borderRadius:12, display:"inline-block" }}>
          <p style={{ ...serif, fontSize:20, color:T.gold, margin:0, fontStyle:"italic" }}>"You don't control the mind by force. You train it by structure."</p>
          <p style={{ color:T.muted2, fontSize:13, marginTop:8, ...sans }}>— Life Edet, Inventor of NeuralFusion™</p>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {[
          { icon:"📊", label:"Take CFI™",  sub:"Assess fragmentation", v:"cfi" },
          { icon:"📚", label:"Lessons",    sub:"5 core modules",       v:"lessons" },
          { icon:"📂", label:"Sessions",   sub:`${sessions.length} saved`, v:"history" },
        ].map(item => (
          <button key={item.v} onClick={()=>setView(item.v)} style={{ background:T.navy2, border:`1px solid ${T.goldBorder}`, borderRadius:14, padding:"20px 12px", cursor:"pointer", textAlign:"center" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{item.icon}</div>
            <div style={{ color:T.text, fontWeight:600, fontSize:13, marginBottom:2, ...sans }}>{item.label}</div>
            <div style={{ color:T.muted, fontSize:11, ...sans }}>{item.sub}</div>
          </button>
        ))}
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div style={{ ...card(), padding:"20px 24px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <h3 style={{ ...serif, fontSize:18, color:T.text, margin:0 }}>Recent Sessions</h3>
            <button onClick={()=>setView("history")} style={{ background:"none", border:"none", color:T.gold, fontSize:12, cursor:"pointer", ...sans }}>View all →</button>
          </div>
          {sessions.slice(0,3).map(s => (
            <div key={s.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:`1px solid ${T.goldDim}` }}>
              <div>
                <div style={{ color:T.text, fontSize:14, fontWeight:500, ...sans }}>{s.title}</div>
                <div style={{ color:T.muted, fontSize:12, ...sans }}>{s.date}</div>
              </div>
              <div style={{ background:`${scoreColor(s.score)}20`, border:`1px solid ${scoreColor(s.score)}40`, borderRadius:8, padding:"4px 10px" }}>
                <span style={{ color:scoreColor(s.score), fontWeight:700, fontSize:13, ...sans }}>{s.score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  PATH SELECTOR
// ============================================================
function PathSelector({ setView, initialThought, selectedPath, setSelectedPath }) {
  const paths = [
    { id:"overthinking", icon:"🌀", label:"Stop Overthinking",     desc:"Your mind won't stop looping. You need to collapse the noise into one clear signal.", mode:"reflective" },
    { id:"decisions",    icon:"⚖️", label:"Make Better Decisions", desc:"You have the information but can't commit. The Commitment Lock will end the paralysis.", mode:"analytical" },
    { id:"direction",    icon:"🧭", label:"Find Direction",         desc:"You feel unclear about the path forward. The Core Loop will rebuild your orientation.", mode:"associative" },
  ];
  return (
    <div style={{ paddingTop:40, maxWidth:600, margin:"0 auto", animation:"fadeIn 0.4s ease" }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:12, ...sans }}>PERSONALIZATION PROTOCOL</div>
        <h2 style={{ ...serif, fontSize:32, color:T.text, marginBottom:12 }}>What are you solving right now?</h2>
        {initialThought && (
          <div style={{ background:T.navy3, border:`1px solid ${T.goldBorder}`, borderRadius:10, padding:"10px 18px", display:"inline-block", maxWidth:400 }}>
            <span style={{ color:T.muted, fontSize:12, ...sans }}>Your input: </span>
            <span style={{ color:T.muted2, fontSize:13, ...sans }}>"{initialThought.slice(0,60)}{initialThought.length>60?"…":""}"</span>
          </div>
        )}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {paths.map(p => {
          const m = T.modes[p.mode];
          return (
            <button key={p.id} onClick={()=>setSelectedPath(p.id)} style={{
              background:selectedPath===p.id?m.bg:T.navy2, border:`1px solid ${selectedPath===p.id?m.color+"60":T.goldBorder}`,
              borderRadius:14, padding:"22px 24px", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:16, transition:"all 0.2s"
            }}>
              <span style={{ fontSize:32 }}>{p.icon}</span>
              <div>
                <div style={{ color:selectedPath===p.id?m.color:T.text, fontWeight:700, fontSize:16, marginBottom:4, ...sans }}>{p.label}</div>
                <div style={{ color:T.muted2, fontSize:13, lineHeight:1.5, ...sans }}>{p.desc}</div>
              </div>
              {selectedPath===p.id && <div style={{ marginLeft:"auto", color:m.color, fontSize:20 }}>✓</div>}
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:12, marginTop:32 }}>
        <button onClick={()=>setView("home")} style={{ ...outlineBtn(), padding:"14px 24px", fontSize:14, flex:1 }}>← Back</button>
        <button onClick={()=>setView("facilitator")} style={{ ...goldBtn(), padding:"14px 24px", fontSize:14, flex:2 }}>Begin Facilitated Session →</button>
      </div>
      <p style={{ textAlign:"center", color:T.muted, fontSize:12, marginTop:12, ...sans }}>
        Or <button onClick={()=>setView("engine")} style={{ background:"none", border:"none", color:T.gold, cursor:"pointer", fontSize:12, ...sans }}>skip to the Thinking Engine</button>
      </p>
    </div>
  );
}

// ============================================================
//  FACILITATOR
// ============================================================
function FacilitatorView({ setView, facStep, setFacStep, facAnswers, setFacAnswers }) {
  const step = FAC_STEPS[facStep];
  const progress = (facStep / FAC_STEPS.length) * 100;
  const updateAnswer = (val) => { const u=[...facAnswers]; u[facStep]=val; setFacAnswers(u); };
  const handleNext = () => { if (facStep<FAC_STEPS.length-1) setFacStep(f=>f+1); else setView("engine"); };

  return (
    <div style={{ paddingTop:32, maxWidth:640, margin:"0 auto", animation:"fadeIn 0.4s ease" }}>
      <div style={{ marginBottom:32 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ color:T.muted, fontSize:12, ...sans }}>Facilitated Session · Step {facStep+1} of {FAC_STEPS.length}</span>
          <span style={{ color:T.gold, fontSize:12, fontWeight:600, ...sans }}>{Math.round(progress+20)}% complete</span>
        </div>
        <div style={{ background:T.navy3, borderRadius:4, height:4, overflow:"hidden" }}>
          <div style={{ height:"100%", background:`linear-gradient(90deg,${T.gold},${T.goldLight})`, width:`${progress+20}%`, borderRadius:4, transition:"width 0.5s ease" }} />
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:step.color }} />
        <span style={{ color:step.color, fontSize:11, fontWeight:700, letterSpacing:2, ...sans }}>{step.label} MODE</span>
      </div>
      <div style={{ ...card(), padding:"32px 28px", marginBottom:24 }}>
        <h2 style={{ ...serif, fontSize:26, color:T.text, lineHeight:1.3, marginBottom:10 }}>{step.q}</h2>
        <p style={{ color:T.muted2, fontSize:14, marginBottom:24, ...sans }}>{step.sub}</p>
        <textarea rows={5} value={facAnswers[facStep]} onChange={e=>updateAnswer(e.target.value)} placeholder={step.placeholder}
          style={{ ...inp(), padding:"14px 16px", lineHeight:1.6 }} />
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:28 }}>
        {FAC_STEPS.map((s,i) => (
          <div key={i} style={{ flex:1, height:4, borderRadius:3, background:i<=facStep?s.color:T.navy4, transition:"all 0.3s" }} />
        ))}
      </div>
      <div style={{ display:"flex", gap:12 }}>
        {facStep>0 && <button onClick={()=>setFacStep(f=>f-1)} style={{ ...outlineBtn(), padding:"14px 20px", fontSize:14 }}>←</button>}
        <button onClick={handleNext} style={{ ...goldBtn({ opacity:facAnswers[facStep]?.trim()?1:0.4 }), padding:"14px 24px", fontSize:14, flex:1 }} disabled={!facAnswers[facStep]?.trim()}>
          {facStep<FAC_STEPS.length-1 ? `Next: ${FAC_STEPS[facStep+1].label} Mode →` : "Proceed to Thinking Engine →"}
        </button>
      </div>
      {facStep===FAC_STEPS.length-1 && facAnswers[facStep]?.trim() && (
        <div style={{ marginTop:16, padding:"14px 18px", background:"rgba(201,168,76,0.08)", border:`1px solid ${T.goldBorder}`, borderRadius:10 }}>
          <p style={{ color:T.gold, fontSize:13, ...sans, margin:0 }}>🔒 <strong>Commitment Lock activating.</strong> You are about to declare your fused decision.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  THINKING ENGINE
// ============================================================
function ThinkingEngine({ setView, engineData, setEngineData, onComplete }) {
  const cols = [
    { key:"dump",       label:"DUMP",       icon:"🌪", color:T.modes.intuitive.color,  desc:"Empty everything. No filter. Raw thought." },
    { key:"decompose",  label:"DECOMPOSE",  icon:"🔬", color:T.modes.analytical.color, desc:"Break it down. Structure. Label each fragment." },
    { key:"rebuild",    label:"REBUILD",    icon:"⚡", color:T.gold,                   desc:"One fused insight. Your Clarity Delta." },
  ];
  const canComplete = engineData.dump?.trim() && engineData.decompose?.trim() && engineData.rebuild?.trim();
  return (
    <div style={{ paddingTop:32, animation:"fadeIn 0.4s ease" }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:8, ...sans }}>NEURALFUSION™ CORE LOOP</div>
        <h2 style={{ ...serif, fontSize:30, color:T.text, margin:0 }}>The Thinking Engine</h2>
        <p style={{ color:T.muted2, fontSize:14, marginTop:8, ...sans }}>Three-column protocol. Work left to right. Complete all three.</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:28 }} className="engine-cols">
        {cols.map(col => (
          <div key={col.key} style={{ background:T.navy2, border:`1px solid ${col.color}30`, borderRadius:14, padding:"20px 16px", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontSize:20 }}>{col.icon}</span>
              <span style={{ color:col.color, fontWeight:700, fontSize:12, letterSpacing:1.5, ...sans }}>{col.label}</span>
            </div>
            <p style={{ color:T.muted, fontSize:11, marginBottom:14, ...sans }}>{col.desc}</p>
            <textarea rows={8} value={engineData[col.key]} onChange={e=>setEngineData(prev=>({...prev,[col.key]:e.target.value}))}
              placeholder={col.key==="dump"?"Let it all out here...":col.key==="decompose"?"What are the parts? Label them...":"Your one clear insight is..."}
              style={{ ...inp(), flex:1, border:`1px solid ${col.color}25`, fontSize:13, lineHeight:1.6 }} />
            {engineData[col.key]?.trim() && (
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:col.color }} />
                <span style={{ color:col.color, fontSize:11, ...sans }}>Active</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:16, marginBottom:28, color:T.muted, fontSize:12, ...sans }}>
        <span>Raw Input</span><span style={{ color:T.goldBorder }}>────→</span>
        <span>Structured Analysis</span><span style={{ color:T.goldBorder }}>────→</span>
        <span style={{ color:T.gold }}>NF-COS™ Pattern Convergence</span>
      </div>
      <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
        <button onClick={()=>setView("facilitator")} style={{ ...outlineBtn(), padding:"14px 24px", fontSize:14 }}>← Revisit Facilitator</button>
        <button onClick={onComplete} style={{ ...goldBtn({ opacity:canComplete?1:0.4 }), padding:"14px 36px", fontSize:15 }} disabled={!canComplete}>
          Complete Session & Score →
        </button>
      </div>
      {!canComplete && <p style={{ textAlign:"center", color:T.muted, fontSize:12, marginTop:8, ...sans }}>Complete all three columns to unlock your Clarity Score</p>}
    </div>
  );
}

// ============================================================
//  CLARITY SCORE
// ============================================================
function ClarityScoreView({ score, engineData, onReset, setView }) {
  const msg = score>=85?{ label:"Fused",         desc:"Peak cognitive integration achieved. Your Commitment Lock is active.",                           color:"#34D399" }
            : score>=70?{ label:"Integrated",     desc:"Strong clarity achieved. Minor fragmentation may remain in execution.",                          color:T.gold   }
            : score>=50?{ label:"Partial Clarity", desc:"Core structure emerging. Revisit the Decompose column for precision.",                          color:"#FBBF24" }
            :           { label:"Fragmented",      desc:"Fragmentation remains. Run the CFI™ Assessment to identify the root dimension.",                color:"#F87171" };

  const dims = [
    { label:"Dump Depth",     val:Math.min(100,Math.floor((engineData.dump?.length||0)/1.5)),    color:T.modes.intuitive.color  },
    { label:"Decomposition",  val:Math.min(100,Math.floor((engineData.decompose?.length||0)/2)), color:T.modes.analytical.color },
    { label:"Rebuild Clarity",val:Math.min(100,Math.floor((engineData.rebuild?.length||0)/1.2)), color:T.gold                   },
  ];
  const circ = 2*Math.PI*68;
  return (
    <div style={{ paddingTop:40, maxWidth:600, margin:"0 auto", textAlign:"center", animation:"fadeIn 0.5s ease" }}>
      <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:24, ...sans }}>SESSION COMPLETE</div>
      <div style={{ position:"relative", width:160, height:160, margin:"0 auto 28px" }}>
        <svg viewBox="0 0 160 160" style={{ transform:"rotate(-90deg)", width:"100%", height:"100%" }}>
          <circle cx="80" cy="80" r="68" fill="none" stroke={T.navy3} strokeWidth="10" />
          <circle cx="80" cy="80" r="68" fill="none" stroke={msg.color} strokeWidth="10"
            strokeDasharray={`${circ*score/100} ${circ*(1-score/100)}`} strokeLinecap="round" style={{ transition:"stroke-dasharray 1.2s ease" }} />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ ...serif, fontSize:42, color:msg.color, fontWeight:700, lineHeight:1 }}>{score}</span>
          <span style={{ color:T.muted, fontSize:12, ...sans }}>Clarity Score</span>
        </div>
      </div>
      <div style={{ marginBottom:8 }}>
        <span style={{ background:`${msg.color}20`, border:`1px solid ${msg.color}40`, color:msg.color, borderRadius:8, padding:"4px 14px", fontSize:14, fontWeight:700, ...sans }}>{msg.label}</span>
      </div>
      <p style={{ color:T.muted2, fontSize:15, lineHeight:1.7, maxWidth:440, margin:"0 auto 28px", ...sans }}>{msg.desc}</p>
      {engineData.rebuild && (
        <div style={{ ...card(), padding:"24px 28px", marginBottom:24, textAlign:"left" }}>
          <div style={{ fontSize:11, color:T.gold, letterSpacing:2, fontWeight:700, marginBottom:12, ...sans }}>YOUR CLARITY DELTA</div>
          <p style={{ ...serif, fontSize:18, color:T.text, lineHeight:1.6, fontStyle:"italic", margin:0 }}>"{engineData.rebuild}"</p>
          <div style={{ marginTop:12, padding:"10px 14px", background:T.navy3, borderRadius:8 }}>
            <span style={{ color:T.muted, fontSize:11, ...sans }}>🔒 Commitment Lock Active — re-analysis suspended</span>
          </div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:28 }}>
        {dims.map(d => (
          <div key={d.label} style={{ background:T.navy2, border:`1px solid ${T.goldBorder}`, borderRadius:10, padding:"14px 12px" }}>
            <div style={{ color:T.muted, fontSize:10, marginBottom:6, ...sans }}>{d.label}</div>
            <div style={{ background:T.navy3, borderRadius:4, height:4, marginBottom:6 }}>
              <div style={{ height:"100%", background:d.color, borderRadius:4, width:`${d.val}%` }} />
            </div>
            <div style={{ color:d.color, fontWeight:700, fontSize:13, ...sans }}>{d.val}%</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
        <button onClick={onReset} style={{ ...goldBtn(), padding:"14px 28px", fontSize:14 }}>New Session →</button>
        <button onClick={()=>setView("cfi")} style={{ ...outlineBtn(), padding:"14px 22px", fontSize:14 }}>Take CFI™ Assessment</button>
        <button onClick={()=>setView("lessons")} style={{ ...outlineBtn(), padding:"14px 22px", fontSize:14 }}>View Lessons</button>
      </div>
    </div>
  );
}

// ============================================================
//  CFI ASSESSMENT
// ============================================================
function CFIView({ setView, items, cfiAnswers, setCfiAnswers, cfiStep, setCfiStep, cfiResult, setCfiResult, calculateCFI, isPro }) {
  const LABELS = ["Never","Rarely","Sometimes","Often","Always"];
  const currentItem = items[cfiStep];
  const progress = (cfiStep/items.length)*100;
  const dimColors = { A:T.modes.analytical.color, B:T.modes.intuitive.color, C:T.modes.associative.color, D:T.modes.reflective.color, E:T.gold };

  if (cfiResult) {
    return (
      <div style={{ paddingTop:32, maxWidth:640, margin:"0 auto", animation:"fadeIn 0.5s ease" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:12, ...sans }}>CFI™ DIAGNOSTIC REPORT</div>
          <h2 style={{ ...serif, fontSize:32, color:T.text }}>Cognitive Fragmentation Index</h2>
          <p style={{ color:T.muted2, fontSize:13, ...sans }}>Edition 2.0 · Invented by Life Edet</p>
        </div>
        <div style={{ ...card(), padding:"28px", textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:48, fontWeight:800, color:cfiResult.band==="Integrated"?"#34D399":cfiResult.band==="Moderate Fragmentation"?T.gold:"#F87171", ...sans, marginBottom:8 }}>{cfiResult.total}</div>
          <div style={{ fontSize:18, color:T.text, fontWeight:600, marginBottom:8, ...sans }}>{cfiResult.band}</div>
          <p style={{ color:T.muted2, fontSize:14, lineHeight:1.6, marginBottom:16, ...sans }}>{cfiResult.desc}</p>
          <div style={{ background:T.navy3, borderRadius:10, padding:"14px 18px" }}>
            <div style={{ color:T.gold, fontSize:11, letterSpacing:1, fontWeight:700, marginBottom:6, ...sans }}>INTERVENTION PROTOCOL</div>
            <p style={{ color:T.muted2, fontSize:13, ...sans, margin:0 }}>{cfiResult.recommendation}</p>
          </div>
        </div>
        <div style={{ ...card(), padding:"24px 28px", marginBottom:20 }}>
          <h3 style={{ ...serif, fontSize:20, color:T.text, marginBottom:20 }}>Dimensional Analysis</h3>
          {[{dim:"A",label:"Analytical Coherence"},{dim:"B",label:"Intuitive Alignment"},{dim:"C",label:"Associative Flexibility"},{dim:"D",label:"Reflective Depth"},{dim:"E",label:"Integration Stability"}].map(d => {
            const score = cfiResult.dimScores[d.dim]||0;
            const hi = score>60;
            return (
              <div key={d.dim} style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ color:T.text, fontSize:13, fontWeight:500, ...sans }}>{d.label}</span>
                  <span style={{ color:dimColors[d.dim], fontWeight:700, fontSize:13, ...sans }}>{hi?"⚠ High":"✓ Low"}</span>
                </div>
                <div style={{ background:T.navy3, borderRadius:4, height:6 }}>
                  <div style={{ height:"100%", background:hi?"#F87171":"#34D399", borderRadius:4, width:`${score}%`, transition:"width 1s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <button onClick={()=>{setCfiResult(null);setCfiStep(0);setCfiAnswers({});}} style={{ ...outlineBtn(), padding:"14px 22px", fontSize:14 }}>Retake Assessment</button>
          <button onClick={()=>setView("lessons")} style={{ ...goldBtn(), padding:"14px 28px", fontSize:14, flex:1 }}>Begin Training Protocol →</button>
        </div>
      </div>
    );
  }

  const showIntro = cfiStep===0 && !cfiAnswers[1];
  return (
    <div style={{ paddingTop:32, maxWidth:640, margin:"0 auto", animation:"fadeIn 0.4s ease" }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:12, ...sans }}>DIAGNOSTIC INSTRUMENT</div>
        <h2 style={{ ...serif, fontSize:32, color:T.text, marginBottom:8 }}>Cognitive Fragmentation Index™</h2>
        <p style={{ color:T.muted2, fontSize:14, ...sans }}>CFI™ Edition 2.0 · 13 Items · 5 Dimensions · Invented by Life Edet</p>
      </div>
      {showIntro ? (
        <div>
          <div style={{ ...card(), padding:"28px", marginBottom:24 }}>
            <h3 style={{ ...serif, fontSize:22, color:T.text, marginBottom:14 }}>What This Measures</h3>
            <p style={{ color:T.muted2, fontSize:14, lineHeight:1.7, marginBottom:20, ...sans }}>The CFI™ diagnostic maps the fragmentation across your five cognitive dimensions. Your result produces a score, a fragmentation band, and a targeted intervention recommendation.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
              {["13 diagnostic items","5 cognitive dimensions","4 fragmentation bands","Personalized intervention plan"].map(f=>(
                <div key={f} style={{ background:T.navy3, borderRadius:8, padding:"10px 14px", color:T.muted2, fontSize:13, ...sans }}><span style={{ color:T.gold }}>✓ </span>{f}</div>
              ))}
            </div>
          </div>
          <button onClick={()=>setCfiAnswers({})} style={{ ...goldBtn(), padding:"16px 32px", fontSize:15, width:"100%" }} onClickCapture={()=>setCfiStep(0)}>
            Begin CFI™ Assessment →
          </button>
        </div>
      ) : (
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ color:T.muted, fontSize:12, ...sans }}>Item {cfiStep+1} of {items.length}</span>
            <span style={{ color:dimColors[currentItem?.dim], fontSize:11, fontWeight:700, ...sans }}>Dimension {currentItem?.dim}: {currentItem?.dimLabel}</span>
          </div>
          <div style={{ background:T.navy3, borderRadius:4, height:4, marginBottom:24 }}>
            <div style={{ height:"100%", background:`linear-gradient(90deg,${T.gold},${T.goldLight})`, borderRadius:4, width:`${progress}%`, transition:"width 0.3s" }} />
          </div>
          {currentItem && (
            <div style={{ ...card(), padding:"28px", marginBottom:20 }}>
              <p style={{ ...serif, fontSize:20, color:T.text, lineHeight:1.5, marginBottom:24 }}>{currentItem.text}</p>
              <div style={{ display:"flex", gap:8 }}>
                {LABELS.map((lbl,i)=>{
                  const val=i+1; const sel=cfiAnswers[currentItem.id]===val;
                  return (
                    <button key={val} onClick={()=>setCfiAnswers(prev=>({...prev,[currentItem.id]:val}))} style={{
                      flex:1, padding:"12px 4px", borderRadius:10, cursor:"pointer",
                      background:sel?`${dimColors[currentItem.dim]}20`:T.navy3,
                      border:`1px solid ${sel?dimColors[currentItem.dim]:T.navy4}`,
                      color:sel?dimColors[currentItem.dim]:T.muted, fontSize:11, fontWeight:sel?700:400, transition:"all 0.15s", ...sans
                    }}>
                      <div style={{ fontSize:15, marginBottom:3 }}>{val}</div><div>{lbl}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ display:"flex", gap:12 }}>
            {cfiStep>0 && <button onClick={()=>setCfiStep(s=>s-1)} style={{ ...outlineBtn(), padding:"14px 20px", fontSize:14 }}>←</button>}
            <button onClick={()=>{ if(cfiStep<items.length-1) setCfiStep(s=>s+1); else { const r=calculateCFI(); setCfiResult(r); }}}
              style={{ ...goldBtn({ opacity:cfiAnswers[currentItem?.id]?1:0.4 }), padding:"14px 24px", fontSize:14, flex:1 }}
              disabled={!cfiAnswers[currentItem?.id]}>
              {cfiStep<items.length-1?"Next Item →":"Generate CFI™ Report →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  LESSONS
// ============================================================
function LessonsView({ setView, lessons, lessonProgress, setLessonProgress, isPro, user, onSaveLessonProgress }) {
  const [activeLesson, setActiveLesson] = useState(null);
  const [lessonPage, setLessonPage] = useState(0);

  if (activeLesson) {
    const lesson = lessons.find(l=>l.id===activeLesson);
    const content = LESSON_CONTENT[activeLesson];
    const pages = content?.pages||[];
    const currentPage = pages[lessonPage];
    return (
      <div style={{ paddingTop:32, maxWidth:640, margin:"0 auto", animation:"fadeIn 0.4s ease" }}>
        <button onClick={()=>{setActiveLesson(null);setLessonPage(0);}} style={{ background:"none", border:"none", color:T.gold, cursor:"pointer", fontSize:14, marginBottom:24, ...sans }}>← All Lessons</button>
        <div style={{ marginBottom:8 }}>
          <span style={{ fontSize:11, color:T.gold, letterSpacing:2, fontWeight:700, ...sans }}>LESSON {activeLesson} · {lesson.level.toUpperCase()}</span>
        </div>
        <h2 style={{ ...serif, fontSize:28, color:T.text, marginBottom:24 }}>{lesson.title}</h2>
        <div style={{ display:"flex", gap:6, marginBottom:28 }}>
          {pages.map((_,i)=>(
            <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=lessonPage?T.gold:T.navy4 }} />
          ))}
        </div>
        <div style={{ ...card(), padding:"28px", marginBottom:24 }}>
          <h3 style={{ ...serif, fontSize:22, color:T.gold, marginBottom:16 }}>{currentPage?.title}</h3>
          <p style={{ color:T.muted2, fontSize:15, lineHeight:1.8, whiteSpace:"pre-line", ...sans }}>{currentPage?.body}</p>
        </div>
        <div style={{ display:"flex", gap:12 }}>
          {lessonPage>0 && <button onClick={()=>setLessonPage(p=>p-1)} style={{ ...outlineBtn(), padding:"14px 20px" }}>←</button>}
          <button onClick={()=>{
            if(lessonPage<pages.length-1) setLessonPage(p=>p+1);
            else { const updated={...lessonProgress,[activeLesson]:100}; setLessonProgress(updated); if(user) onSaveLessonProgress(activeLesson,100); setActiveLesson(null); }
          }} style={{ ...goldBtn(), padding:"14px 24px", flex:1, fontSize:14 }}>
            {lessonPage<pages.length-1?"Next →":"Complete Lesson ✓"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop:32, animation:"fadeIn 0.4s ease" }}>
      <div style={{ textAlign:"center", marginBottom:32 }}>
        <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:12, ...sans }}>NEURALFUSION™ TRAINING SYSTEM</div>
        <h2 style={{ ...serif, fontSize:32, color:T.text, marginBottom:8 }}>The Five Core Lessons</h2>
        <p style={{ color:T.muted2, fontSize:14, ...sans }}>Sequential cognitive architecture. Each lesson builds the next.</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {lessons.map(lesson=>{
          const prog=lessonProgress[lesson.id]||0;
          const locked=!lesson.free&&!isPro;
          const levelColors={Beginner:T.modes.associative.color,Intermediate:T.gold,Advanced:T.modes.analytical.color};
          const lc=levelColors[lesson.level.split("–")[0]]||T.gold;
          return (
            <div key={lesson.id} style={{ background:T.navy2, border:`1px solid ${prog>0?T.goldBorder:T.navy4}`, borderRadius:14, padding:"22px 24px", opacity:locked?0.7:1, cursor:locked?"default":"pointer" }}
              onClick={()=>{ if(!locked){setActiveLesson(lesson.id);setLessonPage(0);} else setView("upgrade"); }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:locked?T.navy3:`${lc}20`, border:`1px solid ${locked?T.navy4:lc+"40"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  {prog===100?"✓":locked?"🔒":`0${lesson.id}`}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ color:T.text, fontWeight:600, fontSize:15, ...sans }}>{lesson.title}</span>
                    {lesson.free && <span style={{ background:"rgba(52,211,153,0.15)", color:"#34D399", fontSize:10, padding:"2px 7px", borderRadius:4, fontWeight:700, ...sans }}>FREE</span>}
                  </div>
                  <p style={{ color:T.muted, fontSize:13, marginBottom:12, ...sans }}>{lesson.sub}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ color:lc, fontSize:11, fontWeight:600, ...sans }}>{lesson.level}</span>
                    <span style={{ color:T.muted, fontSize:11, ...sans }}>· {lesson.duration}</span>
                    {prog>0&&prog<100&&<span style={{ color:T.gold, fontSize:11, ...sans }}>· {prog}% complete</span>}
                    {prog===100&&<span style={{ color:"#34D399", fontSize:11, ...sans }}>· ✓ Complete</span>}
                  </div>
                  {prog>0&&(
                    <div style={{ background:T.navy3, borderRadius:3, height:3, marginTop:10 }}>
                      <div style={{ height:"100%", background:prog===100?"#34D399":T.gold, borderRadius:3, width:`${prog}%`, transition:"width 0.5s" }} />
                    </div>
                  )}
                </div>
                {!locked&&<div style={{ color:T.muted, fontSize:16, paddingTop:4 }}>›</div>}
              </div>
            </div>
          );
        })}
      </div>
      {!isPro&&(
        <div style={{ marginTop:24, ...card(), padding:"24px", textAlign:"center", background:"linear-gradient(135deg,rgba(201,168,76,0.08),rgba(12,26,48,1))" }}>
          <p style={{ color:T.text, fontSize:15, marginBottom:16, ...sans }}>Unlock all 5 lessons + full training system</p>
          <button onClick={()=>setView("upgrade")} style={{ ...goldBtn(), padding:"14px 32px", fontSize:14 }}>Unlock Pro Access →</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  HISTORY
// ============================================================
function HistoryView({ sessions, setView }) {
  return (
    <div style={{ paddingTop:32, animation:"fadeIn 0.4s ease" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <h2 style={{ ...serif, fontSize:28, color:T.text }}>Session History</h2>
        <button onClick={()=>setView("path")} style={{ ...goldBtn(), padding:"10px 20px", fontSize:13 }}>+ New Session</button>
      </div>
      {sessions.length===0?(
        <div style={{ ...card(), padding:"48px", textAlign:"center" }}>
          <p style={{ color:T.muted2, fontSize:15, ...sans }}>No sessions yet. Run your first thinking session to build your history.</p>
          <button onClick={()=>setView("path")} style={{ ...goldBtn(), padding:"14px 28px", fontSize:14, marginTop:16 }}>Start First Session →</button>
        </div>
      ):(
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {sessions.map(session=>(
            <div key={session.id} style={{ ...card(), padding:"20px 24px", display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:`${scoreColor(session.score)}15`, border:`1px solid ${scoreColor(session.score)}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ color:scoreColor(session.score), fontWeight:800, fontSize:14, ...sans }}>{session.score}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ color:T.text, fontWeight:600, fontSize:14, marginBottom:2, ...sans }}>{session.title}</div>
                <div style={{ color:T.muted, fontSize:12, ...sans }}>{session.date}</div>
              </div>
              <div style={{ background:`${scoreColor(session.score)}15`, border:`1px solid ${scoreColor(session.score)}30`, borderRadius:8, padding:"4px 12px" }}>
                <span style={{ color:scoreColor(session.score), fontSize:12, fontWeight:700, ...sans }}>
                  {session.score>=80?"Fused":session.score>=65?"Integrated":"Partial"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  UPGRADE + PAYSTACK
// ============================================================
function UpgradeView({ prices, isPro, setIsPro, setView, user, setShowAuth }) {
  const [selected, setSelected] = useState("pro");
  const [paying, setPaying] = useState(false);

  const plans = [
    { id:"pro", name:"NeuralFusion™ Pro", price:prices.pro, period:"one-time", tag:"MOST POPULAR", color:T.gold,
      features:["All 5 NeuralFusion™ Core Lessons","Unlimited Thinking Sessions","Full CFI™ Assessment with Dimensional Report","Session History & Progress Tracking","Decision Pressure Index tool","Executive Compression protocol","NF-COS™ Pattern Convergence system","Lifetime access · No subscription"] },
    { id:"facilitator", name:"NF Facilitator Certification", price:prices.facilitator, period:"one-time", tag:"ENTERPRISE", color:T.modes.intuitive.color,
      features:["Everything in Pro","Licensed facilitation rights","Enterprise Facilitator Guide (full edition)","CFI™ cohort administration tools","Organizational delivery framework","Branded materials license","Direct inventor support","Certificate of Facilitation"] },
  ];

  const handlePay = () => {
    if (!user) { setShowAuth(true); return; }
    if (selected==="facilitator") { alert("Facilitator applications are reviewed individually. Please email edetlife94@gmail.com"); return; }
    setPaying(true);
    paystackPay({
      email: user.email,
      amount: prices.pro,
      ref: `NF-PRO-${user.id.slice(0,8)}-${Date.now()}`,
      meta: { product:"NeuralFusion Pro" },
      onSuccess: async (response) => {
        await upsertProfile(user.id, { is_pro: true });
        setIsPro(true);
        setPaying(false);
        setView("lessons");
      },
      onClose: () => setPaying(false),
    });
  };

  if (isPro) return (
    <div style={{ paddingTop:60, textAlign:"center", animation:"fadeIn 0.4s ease" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>⚡</div>
      <h2 style={{ ...serif, fontSize:32, color:T.gold, marginBottom:12 }}>NeuralFusion™ Pro Active</h2>
      <p style={{ color:T.muted2, fontSize:15, ...sans }}>You have full access to the complete NeuralFusion™ training system.</p>
      <button onClick={()=>setView("lessons")} style={{ ...goldBtn(), padding:"14px 32px", fontSize:14, marginTop:24 }}>Continue Training →</button>
    </div>
  );

  return (
    <div style={{ paddingTop:32, animation:"fadeIn 0.4s ease" }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:12, ...sans }}>UNLOCK THE FULL SYSTEM</div>
        <h2 style={{ ...serif, fontSize:36, color:T.text, marginBottom:14, lineHeight:1.1 }}>One Investment.<br/><span style={{ color:T.gold }}>Permanent Mental Architecture.</span></h2>
        <p style={{ color:T.muted2, fontSize:15, maxWidth:480, margin:"0 auto", lineHeight:1.7, ...sans }}>
          NeuralFusion™ is not a subscription you maintain. It is a skill you install. One payment activates your complete cognitive operating system — for life.
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, maxWidth:740, margin:"0 auto 28px" }} className="upgrade-cols">
        {plans.map(plan=>(
          <div key={plan.id} onClick={()=>setSelected(plan.id)} style={{
            background:selected===plan.id?`linear-gradient(135deg,${plan.color}12,${T.navy2})`:T.navy2,
            border:`1px solid ${selected===plan.id?plan.color+"60":T.goldBorder}`,
            borderRadius:16, padding:"28px 24px", cursor:"pointer", transition:"all 0.2s",
            boxShadow:selected===plan.id?`0 0 32px ${plan.color}18`:"none"
          }}>
            <div style={{ background:`${plan.color}20`, color:plan.color, fontSize:10, fontWeight:700, letterSpacing:2, padding:"3px 10px", borderRadius:4, display:"inline-block", marginBottom:14, ...sans }}>{plan.tag}</div>
            <h3 style={{ ...serif, fontSize:20, color:T.text, marginBottom:8, lineHeight:1.2 }}>{plan.name}</h3>
            <div style={{ marginBottom:20 }}>
              <span style={{ ...serif, fontSize:36, color:plan.color, fontWeight:700 }}>₦{plan.price.toLocaleString()}</span>
              <span style={{ color:T.muted, fontSize:13, marginLeft:6, ...sans }}>{plan.period}</span>
            </div>
            {plan.features.map(f=>(
              <div key={f} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
                <span style={{ color:plan.color, fontSize:12, marginTop:2 }}>✓</span>
                <span style={{ color:T.muted2, fontSize:13, lineHeight:1.4, ...sans }}>{f}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ maxWidth:740, margin:"0 auto" }}>
        <button onClick={handlePay} disabled={paying}
          style={{ ...goldBtn({ opacity:paying?0.6:1 }), padding:"16px 32px", fontSize:15, width:"100%", marginBottom:12 }}>
          {paying?"Processing..."
            :!user?"Sign In to Continue →"
            :selected==="pro"?`Activate Pro — ₦${plans[0].price.toLocaleString()} →`
            :"Apply for Facilitator Certification →"}
        </button>
        <p style={{ textAlign:"center", color:T.muted, fontSize:12, ...sans }}>
          {selected==="pro"?"One-time payment via Paystack. Instant access. Secure checkout.":"Facilitator applications reviewed within 48 hours. Email: life@neuralfusion.app"}
        </p>
      </div>
      <div style={{ ...card(), padding:"32px 28px", marginTop:32, textAlign:"center" }}>
        <p style={{ ...serif, fontSize:22, color:T.text, lineHeight:1.5, marginBottom:16, fontStyle:"italic" }}>
          "The moment you install structure into how you think, every decision, every conversation, every challenge becomes workable. That is what NeuralFusion™ does."
        </p>
        <p style={{ color:T.muted, fontSize:13, ...sans }}>— Life Edet, Inventor of NeuralFusion™</p>
      </div>
    </div>
  );
}

// ============================================================
//  FAQ
// ============================================================
function FAQView({ openFaq, setOpenFaq, setView }) {
  return (
    <div style={{ paddingTop:32, maxWidth:700, margin:"0 auto", animation:"fadeIn 0.4s ease" }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:12, ...sans }}>KNOWLEDGE BASE</div>
        <h2 style={{ ...serif, fontSize:32, color:T.text }}>Frequently Asked Questions</h2>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {FAQ_DATA.map((item,i)=>(
          <div key={i} style={{ background:T.navy2, border:`1px solid ${openFaq===i?T.goldBorder:T.navy4}`, borderRadius:12, overflow:"hidden", transition:"all 0.2s" }}>
            <button onClick={()=>setOpenFaq(openFaq===i?null:i)}
              style={{ width:"100%", background:"none", border:"none", color:T.text, padding:"18px 22px", textAlign:"left", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", ...sans, fontSize:14, fontWeight:600 }}>
              {item.q}
              <span style={{ color:T.gold, fontSize:18, transform:openFaq===i?"rotate(45deg)":"none", transition:"transform 0.2s", display:"inline-block" }}>+</span>
            </button>
            {openFaq===i&&(
              <div style={{ padding:"0 22px 20px" }}>
                <p style={{ color:T.muted2, fontSize:14, lineHeight:1.7, ...sans, margin:0 }}>{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop:32, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ ...card(), padding:"22px" }}>
          <h4 style={{ ...serif, fontSize:18, color:T.text, marginBottom:8 }}>Contact</h4>
          <p style={{ color:T.muted2, fontSize:13, lineHeight:1.6, ...sans }}>Questions about NeuralFusion™, CFI™, or enterprise deployment:</p>
          <p style={{ color:T.gold, fontSize:13, marginTop:8, ...sans }}>life@neuralfusion.app</p>
        </div>
        <div style={{ ...card(), padding:"22px" }}>
          <h4 style={{ ...serif, fontSize:18, color:T.text, marginBottom:8 }}>Feedback</h4>
          <p style={{ color:T.muted2, fontSize:13, lineHeight:1.6, ...sans }}>Help improve NeuralFusion™. Your insight becomes part of the next edition.</p>
          <button onClick={()=>setView("upgrade")} style={{ background:"none", border:"none", color:T.gold, cursor:"pointer", fontSize:13, padding:0, marginTop:8, ...sans }}>Send feedback →</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  ADMIN PORTAL
// ============================================================
function AdminPortal({ onClose, adminPrices, setAdminPrices, user }) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [tempPrices, setTempPrices] = useState({...adminPrices});
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ users:"—", proUsers:"—", sessions:"—" });
  const CORRECT_PIN = "NF2026";

  const tryPin = () => {
    if (pin===CORRECT_PIN) { setUnlocked(true); setError(""); loadStats(); }
    else setError("Incorrect PIN. Access denied.");
  };

  const loadStats = async () => {
    try {
      const [u,p,s] = await Promise.all([
        sb.from("profiles").select("*",{count:"exact",head:true}),
        sb.from("profiles").select("*",{count:"exact",head:true}).eq("is_pro",true),
        sb.from("nf_sessions").select("*",{count:"exact",head:true}),
      ]);
      setStats({ users:u.count||0, proUsers:p.count||0, sessions:s.count||0 });
    } catch(e) {}
  };

  const saveSettings = async () => {
    await Promise.all([
      setAppSetting("pro_price", String(tempPrices.pro)),
      setAppSetting("facilitator_price", String(tempPrices.facilitator)),
    ]);
    setAdminPrices({...tempPrices});
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:T.navy, zIndex:500, overflowY:"auto", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ maxWidth:700, margin:"0 auto", padding:"32px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, background:T.goldDim, border:`1px solid ${T.goldBorder}`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>⚙️</div>
            <span style={{ ...serif, fontSize:22, color:T.text }}>NeuralFusion™ Admin</span>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:22 }}>×</button>
        </div>

        {!unlocked?(
          <div style={{ maxWidth:400, margin:"60px auto", textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:16 }}>🔒</div>
            <h3 style={{ ...serif, fontSize:24, color:T.text, marginBottom:8 }}>Admin Access</h3>
            <p style={{ color:T.muted2, fontSize:14, marginBottom:24, ...sans }}>Enter your admin PIN to continue</p>
            <input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryPin()} placeholder="Enter PIN"
              style={{ ...inp(), textAlign:"center", fontSize:18, letterSpacing:4, marginBottom:14 }} />
            {error && <p style={{ color:"#F87171", fontSize:13, marginBottom:12, ...sans }}>{error}</p>}
            <button onClick={tryPin} style={{ ...goldBtn(), padding:"14px 36px", fontSize:14, width:"100%" }}>Unlock →</button>
          </div>
        ):(
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:28, padding:"10px 16px", background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:10 }}>
              <span style={{ color:"#34D399" }}>✓</span>
              <span style={{ color:"#34D399", fontSize:13, ...sans }}>Admin access granted</span>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
              {[{label:"Total Users",value:stats.users},{label:"Pro Subscribers",value:stats.proUsers},{label:"Total Sessions",value:stats.sessions}].map(s=>(
                <div key={s.label} style={{ ...card(), padding:"18px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:22, color:T.gold, fontWeight:700, marginBottom:4, ...sans }}>{s.value}</div>
                  <div style={{ color:T.muted, fontSize:11, ...sans }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div style={{ ...card(), padding:"24px 28px", marginBottom:20 }}>
              <h3 style={{ ...serif, fontSize:22, color:T.text, marginBottom:20 }}>Pricing Settings</h3>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div>
                  <label style={{ color:T.muted2, fontSize:12, fontWeight:600, letterSpacing:1, display:"block", marginBottom:8, ...sans }}>PRO PLAN (₦)</label>
                  <input type="number" value={tempPrices.pro} onChange={e=>setTempPrices(p=>({...p,pro:parseInt(e.target.value)||0}))} style={{ ...inp(), fontSize:16 }} />
                  <p style={{ color:T.muted, fontSize:11, marginTop:4, ...sans }}>Live: ₦{adminPrices.pro.toLocaleString()}</p>
                </div>
                <div>
                  <label style={{ color:T.muted2, fontSize:12, fontWeight:600, letterSpacing:1, display:"block", marginBottom:8, ...sans }}>FACILITATOR (₦)</label>
                  <input type="number" value={tempPrices.facilitator} onChange={e=>setTempPrices(p=>({...p,facilitator:parseInt(e.target.value)||0}))} style={{ ...inp(), fontSize:16 }} />
                  <p style={{ color:T.muted, fontSize:11, marginTop:4, ...sans }}>Live: ₦{adminPrices.facilitator.toLocaleString()}</p>
                </div>
              </div>
              <button onClick={saveSettings} style={{ ...goldBtn(), padding:"12px 28px", fontSize:14, marginTop:20 }}>
                {saved?"✓ Saved to Supabase!":"Save Pricing →"}
              </button>
            </div>

            {/* System info */}
            <div style={{ ...card(), padding:"20px 24px" }}>
              <h4 style={{ ...serif, fontSize:18, color:T.text, marginBottom:12 }}>System Info</h4>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[["Platform","NeuralFusion™ Web App"],["Inventor","Life Edet"],["CFI Edition","2.0 (13 items, 5 dimensions)"],["Lessons","5 core modules"],["Supabase","Connected"],["Paystack","Live Integration"],["Pro Price",`₦${adminPrices.pro.toLocaleString()}`],["Facilitator Price",`₦${adminPrices.facilitator.toLocaleString()}`]].map(([k,v])=>(
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", borderBottom:`1px solid ${T.goldDim}`, paddingBottom:8 }}>
                    <span style={{ color:T.muted, fontSize:13, ...sans }}>{k}</span>
                    <span style={{ color:T.muted2, fontSize:13, fontWeight:500, ...sans }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  FOOTER
// ============================================================
function Footer({ setView }) {
  return (
    <footer style={{ background:"rgba(7,15,30,0.98)", borderTop:`1px solid ${T.goldBorder}`, padding:"48px 20px 32px", marginTop:60 }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48, padding:"32px 28px", background:T.navy2, borderRadius:16, border:`1px solid ${T.goldBorder}` }}>
          <div style={{ fontSize:11, color:T.gold, letterSpacing:3, fontWeight:700, marginBottom:16, ...sans }}>THE MISSION</div>
          <p style={{ ...serif, fontSize:"clamp(18px,3vw,26px)", color:T.text, lineHeight:1.5, maxWidth:680, margin:"0 auto 16px", fontStyle:"italic" }}>
            "The greatest cognitive problem of the modern era is not lack of information. It is the failure to integrate it. NeuralFusion™ exists to solve this — permanently, structurally, and trainably — for every human mind that chooses clarity over chaos."
          </p>
          <p style={{ color:T.muted, fontSize:13, ...sans }}>— Life Edet, Inventor of NeuralFusion™</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:32, marginBottom:40 }} className="footer-cols">
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
              <div style={{ width:28, height:28, borderRadius:6, background:`linear-gradient(135deg,${T.gold},${T.goldLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⚡</div>
              <span style={{ ...serif, fontSize:16, color:T.text, fontWeight:700 }}>NeuralFusion™</span>
            </div>
            <p style={{ color:T.muted, fontSize:13, lineHeight:1.6, ...sans }}>A Structural Cognitive Skill Framework for Integrated Reasoning. Invented by Life Edet, 2026.</p>
          </div>
          <div>
            <h4 style={{ color:T.gold, fontSize:11, letterSpacing:2, fontWeight:700, marginBottom:14, ...sans }}>SYSTEM</h4>
            {[["Home","home"],["Lessons","lessons"],["CFI™ Assessment","cfi"],["Session History","history"],["Upgrade to Pro","upgrade"]].map(([l,v])=>(
              <button key={v} onClick={()=>setView(v)} style={{ display:"block", background:"none", border:"none", color:T.muted, fontSize:13, cursor:"pointer", marginBottom:8, padding:0, textAlign:"left", ...sans }}>{l}</button>
            ))}
          </div>
          <div>
            <h4 style={{ color:T.gold, fontSize:11, letterSpacing:2, fontWeight:700, marginBottom:14, ...sans }}>RESOURCES</h4>
            {[["FAQ","faq"],["Contact","faq"],["Feedback","faq"]].map(([l,v])=>(
              <button key={l} onClick={()=>setView(v)} style={{ display:"block", background:"none", border:"none", color:T.muted, fontSize:13, cursor:"pointer", marginBottom:8, padding:0, textAlign:"left", ...sans }}>{l}</button>
            ))}
            <p style={{ color:T.muted, fontSize:12, marginTop:12, ...sans }}>edetlife94@gmail.com</p>
          </div>
        </div>
        <div style={{ borderTop:`1px solid ${T.goldBorder}`, paddingTop:24, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <p style={{ color:T.muted, fontSize:12, ...sans, margin:0 }}>© 2026 Life Edet. NeuralFusion™ is a registered trademark. All rights reserved.</p>
          <p style={{ color:T.muted, fontSize:12, ...sans, margin:0 }}>
            <span style={{ color:T.gold, fontStyle:"italic" }}>Master Your Mind. Transform Your Life.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
//  BOTTOM NAV
// ============================================================
function BottomNav({ view, setView }) {
  const items=[{v:"home",icon:"⚡",label:"Home"},{v:"lessons",icon:"📚",label:"Lessons"},{v:"cfi",icon:"📊",label:"CFI™"},{v:"history",icon:"📂",label:"Sessions"},{v:"upgrade",icon:"⭐",label:"Pro"}];
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(7,15,30,0.97)", borderTop:`1px solid ${T.goldBorder}`, display:"flex", backdropFilter:"blur(12px)", zIndex:90 }}>
      {items.map(item=>(
        <button key={item.v} onClick={()=>setView(item.v)} style={{ flex:1, padding:"10px 4px 12px", background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <span style={{ fontSize:20 }}>{item.icon}</span>
          <span style={{ fontSize:10, color:view===item.v?T.gold:T.muted, fontWeight:view===item.v?700:400, ...sans }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================
//  MAIN APP
// ============================================================
function App() {
  const [view, setView]                   = useState("home");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAdmin, setShowAdmin]         = useState(false);
  const [showAuth, setShowAuth]           = useState(false);

  // Auth
  const [user, setUser]   = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Flow state
  const [initialThought, setInitialThought] = useState("");
  const [selectedPath, setSelectedPath]     = useState(null);
  const [facStep, setFacStep]               = useState(0);
  const [facAnswers, setFacAnswers]         = useState(Array(5).fill(""));
  const [engineData, setEngineData]         = useState({ dump:"", decompose:"", rebuild:"" });
  const [clarityScore, setClarityScore]     = useState(null);

  // CFI
  const [cfiAnswers, setCfiAnswers] = useState({});
  const [cfiResult, setCfiResult]   = useState(null);
  const [cfiStep, setCfiStep]       = useState(0);

  // User data
  const [isPro, setIsPro]           = useState(false);
  const [streak, setStreak]         = useState(0);
  const [sessions, setSessions]     = useState([]);
  const [lessonProgress, setLessonProgress] = useState({});

  // Admin
  const [adminPrices, setAdminPrices] = useState({ pro:5600, facilitator:500000 });
  const [openFaq, setOpenFaq]         = useState(null);

  // ── Load app settings ───────────────────────────────────────
  useEffect(() => {
    getAppSettings().then(s => {
      if (s.pro_price)          setAdminPrices(p => ({...p, pro: parseInt(s.pro_price)||5600}));
      if (s.facilitator_price)  setAdminPrices(p => ({...p, facilitator: parseInt(s.facilitator_price)||500000}));
    }).catch(()=>{});
  }, []);

  // ── Auth listener ───────────────────────────────────────────
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      const u = data?.session?.user || null;
      setUser(u);
      if (u) loadUserData(u);
      else setAuthLoading(false);
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        loadUserData(u);
        // Auto-close auth modal when user lands back after clicking verification link
        if (event === "SIGNED_IN" || event === "EMAIL_CONFIRMED") setShowAuth(false);
      } else { setIsPro(false); setStreak(0); setSessions([]); setLessonProgress({}); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (u) => {
    setAuthLoading(true);
    try {
      const [prof, sess, lp] = await Promise.all([getProfile(u.id), loadSBSessions(u.id), loadLessonProgress(u.id)]);
      if (prof) { setProfile(prof); setIsPro(!!prof.is_pro); setStreak(prof.streak||0); }
      setSessions(sess.map(s => ({ id:s.id, title:s.title||"Thinking session", score:s.clarity_score||0, date:new Date(s.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"}), dump:s.dump_text, decompose:s.decompose_text, rebuild:s.rebuild_text })));
      setLessonProgress(lp);
    } catch(e) {}
    setAuthLoading(false);
  };

  // ── Sign out ─────────────────────────────────────────────────
  const handleSignOut = async () => {
    await sb.auth.signOut();
    setUser(null); setProfile(null); setIsPro(false); setStreak(0); setSessions([]); setLessonProgress({});
  };

  // ── Scores ───────────────────────────────────────────────────
  const calculateClarityScore = () => {
    const d = engineData;
    let s = 0;
    s += d.dump.length>40?30:Math.floor((d.dump.length/40)*30);
    s += d.decompose.length>60?35:Math.floor((d.decompose.length/60)*35);
    s += d.rebuild.length>30?35:Math.floor((d.rebuild.length/30)*35);
    return Math.min(Math.max(s,10),100);
  };

  const calculateCFI = () => {
    const vals = Object.values(cfiAnswers);
    if (vals.length<13) return null;
    const total = vals.reduce((a,b)=>a+b,0);
    let band,desc,recommendation;
    if      (total<=20) { band="Integrated";            desc="Low Cognitive Fragmentation. Your thinking modes are well-coordinated.";           recommendation="Maintain NeuralFusion™ daily protocol. Advance to Lessons 4–5 for fluency installation."; }
    else if (total<=33) { band="Moderate Fragmentation";desc="Some fragmentation detected. Specific modes need attention and targeted training."; recommendation="Focus on Mode Activation training (Lesson 2). Daily mode-switching drills for 14 days."; }
    else if (total<=46) { band="High Fragmentation";    desc="Significant cognitive fragmentation. Integration is inconsistent under pressure.";  recommendation="Begin full NeuralFusion™ Core Loop training from Lesson 1. Run Engine protocol daily."; }
    else                { band="Critical Fragmentation";desc="Severe fragmentation. Decision-making and clarity are significantly compromised.";  recommendation="Intensive NeuralFusion™ intervention required. Pro plan + Facilitator guidance strongly recommended."; }
    const dims={A:[],B:[],C:[],D:[],E:[]};
    CFI_ITEMS.forEach(item=>{ if(cfiAnswers[item.id]) dims[item.dim].push(cfiAnswers[item.id]); });
    const dimScores={};
    Object.keys(dims).forEach(d=>{ dimScores[d]=dims[d].length?Math.round(dims[d].reduce((a,b)=>a+b,0)/dims[d].length*20):0; });
    return { total, band, desc, recommendation, dimScores };
  };

  // ── Session complete ─────────────────────────────────────────
  const handleSessionComplete = async () => {
    const score = calculateClarityScore();
    setClarityScore(score);
    const newSession = { id:Date.now(), title:engineData.rebuild.slice(0,50)||"Thinking session", score, date:"Just now", dump:engineData.dump, decompose:engineData.decompose, rebuild:engineData.rebuild };
    setSessions(prev=>[newSession,...prev]);
    if (user) {
      await saveSBSession(user.id, { ...engineData, score, title:newSession.title, path:selectedPath, facAnswers });
    }
    setView("score");
  };

  const onSaveLessonProgress = async (lessonId, progress) => {
    if (user) await upsertLessonProgress(user.id, lessonId, progress);
  };

  const resetFlow = () => {
    setInitialThought(""); setSelectedPath(null); setFacStep(0);
    setFacAnswers(Array(5).fill("")); setEngineData({dump:"",decompose:"",rebuild:""});
    setClarityScore(null); setView("home");
  };

  // ── Font injection ────────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}} button:hover:not(:disabled){opacity:0.88} button:active:not(:disabled){transform:scale(0.98)}`;
    document.head.appendChild(s);
    return ()=>document.head.removeChild(s);
  }, []);

  if (authLoading) return (
    <div style={{ background:T.navy, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:16 }}>⚡</div>
        <div style={{ color:T.gold, fontSize:14, ...sans }}>Loading NeuralFusion™...</div>
      </div>
    </div>
  );

  if (showAdmin) return (
    <AdminPortal onClose={()=>setShowAdmin(false)} adminPrices={adminPrices} setAdminPrices={setAdminPrices} user={user} />
  );

  return (
    <div style={{ background:T.navy, minHeight:"100vh", color:T.text, fontFamily:"'DM Sans',sans-serif" }}>
      {showOnboarding && <OnboardingModal onDone={()=>setShowOnboarding(false)} />}
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onAuthSuccess={()=>setShowAuth(false)} />}

      <Navbar view={view} setView={setView} isPro={isPro} onAdmin={()=>setShowAdmin(true)} user={user} setShowAuth={setShowAuth} onSignOut={handleSignOut} />

      <div style={{ maxWidth:900, margin:"0 auto", padding:"0 16px 120px" }}>
        {view==="home"        && <HomeView setView={setView} setInitialThought={setInitialThought} initialThought={initialThought} streak={streak} sessions={sessions} isPro={isPro} user={user} setShowAuth={setShowAuth} />}
        {view==="path"        && <PathSelector setView={setView} initialThought={initialThought} selectedPath={selectedPath} setSelectedPath={setSelectedPath} />}
        {view==="facilitator" && <FacilitatorView setView={setView} facStep={facStep} setFacStep={setFacStep} facAnswers={facAnswers} setFacAnswers={setFacAnswers} />}
        {view==="engine"      && <ThinkingEngine setView={setView} engineData={engineData} setEngineData={setEngineData} onComplete={handleSessionComplete} />}
        {view==="score"       && <ClarityScoreView score={clarityScore} engineData={engineData} onReset={resetFlow} setView={setView} />}
        {view==="history"     && <HistoryView sessions={sessions} setView={setView} />}
        {view==="lessons"     && <LessonsView setView={setView} lessons={LESSONS_DATA} lessonProgress={lessonProgress} setLessonProgress={setLessonProgress} isPro={isPro} user={user} onSaveLessonProgress={onSaveLessonProgress} />}
        {view==="cfi"         && <CFIView setView={setView} items={CFI_ITEMS} cfiAnswers={cfiAnswers} setCfiAnswers={setCfiAnswers} cfiStep={cfiStep} setCfiStep={setCfiStep} cfiResult={cfiResult} setCfiResult={setCfiResult} calculateCFI={calculateCFI} isPro={isPro} />}
        {view==="upgrade"     && <UpgradeView prices={adminPrices} isPro={isPro} setIsPro={setIsPro} setView={setView} user={user} setShowAuth={setShowAuth} />}
        {view==="faq"         && <FAQView openFaq={openFaq} setOpenFaq={setOpenFaq} setView={setView} />}
      </div>

      <BottomNav view={view} setView={setView} />
      <Footer setView={setView} />
    </div>
  );
}

// ── Mount ────────────────────────────────────────────────────
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
