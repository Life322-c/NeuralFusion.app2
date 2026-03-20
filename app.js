// CONFIG
const SURL='https://civwcmteqidppscbpqni.supabase.co';
const SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdndjbXRlcWlkcHBzY2JwcW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mjc3MDYsImV4cCI6MjA4OTUwMzcwNn0.kRaEGNQw-vsXE9NaSExO3RC4KyHzV3kl9JpnKzDN2Sk';
const PKEY='pk_live_dfa71eca29f942cadc337cb8e41834857e2b129b';
const AMT=250000;
let sb;try{sb=supabase.createClient(SURL,SKEY);}catch(e){sb=null;}

// STATE
const S={user:null,profile:null,cohort:null,certs:[],done:new Set(),preCFI:null,postCFI:null,preA:null,postA:null,premium:false,lesson:null,cfiType:'pre',cfiA:[],cfiI:0,authMode:'login',role:'participant'};

// CFI DATA
const CFI=[
  {d:'A',t:"When I have enough information to decide, I still delay committing to a choice."},
  {d:'A',t:"I second-guess and revisit decisions I have already made."},
  {d:'A',t:"Under time pressure, my thinking slows down or freezes."},
  {d:'B',t:"I default to the same type of thinking regardless of the situation."},
  {d:'B',t:"Once I have started analysing a problem one way, I find it hard to shift my approach."},
  {d:'B',t:"When my initial approach fails, I struggle to think about the problem differently."},
  {d:'C',t:"Strong emotions — stress, frustration — disrupt my ability to think clearly."},
  {d:'C',t:"In high-stakes moments, I react emotionally before thinking through the problem."},
  {d:'D',t:"My thinking is frequently interrupted by unrelated thoughts when I need to focus."},
  {d:'D',t:"I find it difficult to hold multiple aspects of a problem in mind simultaneously."},
  {d:'D',t:"I lose my train of thought when dealing with complex multi-layered problems."},
  {d:'E',t:"I struggle to combine logical analysis with intuition when making important decisions."},
  {d:'E',t:"After processing a problem, I find it hard to arrive at a single clear course of action."}
];
const DL={A:'Decision Latency',B:'Mode Rigidity',C:'Emotional Reactivity',D:'Thought Interruption',E:'Cognitive Integration'};
const DC={A:'#6366F1',B:'#8B5CF6',C:'#EC4899',D:'#F59E0B',E:'#10B981'};
const LABS=['Never','Rarely','Sometimes','Often','Always'];
const calcCFI=a=>Math.round((a.reduce((s,v)=>s+(v||0),0)/52)*100);
const dSc=(a,d)=>{const ix=CFI.map((q,i)=>q.d===d?i:-1).filter(i=>i>=0);return Math.round((ix.reduce((s,i)=>s+(a[i]||0),0)/(ix.length*4))*100);};
const lvl=s=>s>=70?{l:'High Fragmentation',bg:'#FEE2E2',c:'#991B1B'}:s>=40?{l:'Moderate Fragmentation',bg:'#FEF3C7',c:'#92400E'}:{l:'Low Fragmentation',bg:'#D1FAE5',c:'#065F46'};

const LESSONS=[
  {id:1,tag:'L1',color:'#6366F1',title:'Foundation of Integrated Thinking',week:2,dur:'90 min',free:true,
   obj:'Understand what NeuralFusion is and how the mind can be trained to think in an integrated, controlled way.',
   content:[{h:'What is NeuralFusion?',b:'NeuralFusion is a structured mental skill that trains the brain to combine multiple thinking modes intentionally.\n\nMost people think in fragments:\n— Logic without intuition\n— Creativity without structure\n— Emotion without reflection\n\nIt is not intelligence. It is control over intelligence.'},{h:'The Four Core Thinking Modes',b:'1. Analytical — Logic, structure and facts\n2. Intuitive — Gut feeling, insight, pattern recognition\n3. Associative — Creativity, connection and ideas\n4. Reflective — Self-awareness, evaluation and meaning\n\nEvery human has these modes. Very few know how to coordinate them.'},{h:'The Core Loop',b:'1. DECOMPOSITION — Break the problem into parts\n2. MODE SWITCHING — Activate the right mode intentionally\n3. SYNTHESIS — Combine outputs into a unified insight\n4. STABILISATION — Lock clarity and reduce mental noise\n\nKey Insight: You are not your thoughts. You are the conductor of them.'}],
   ex:{title:'Conscious Thought Control',prompt:'Apply the Core Loop to a simple issue:\n\n1. Write the issue in one sentence\n2. List facts only, no emotion (Analytical)\n3. Write your gut response (Intuitive)\n4. Write 3 ideas or connections (Associative)\n5. Ask: what does this teach me? (Reflective)\n\nAssignment: For 24 hours, observe when your thinking becomes chaotic. Ask: which mode am I stuck in?'}},
  {id:2,tag:'L2',color:'#8B5CF6',title:'Mode Activation & Mental Control',week:2,dur:'90 min',free:false,
   obj:'Train yourself to intentionally activate, switch, and regulate thinking modes.',
   content:[{h:'The Core Truth of Mental Control',b:'Most people do not think — they react. The brain defaults to habit, emotion, and urgency.\n\nNeuralFusion replaces reaction with activation. Control begins the moment you choose how to think.'},{h:'Mode Activation Signals',b:'Analytical: Ask — What are the facts?\nIntuitive: Pause — What feels correct?\nAssociative: Ask — What is this connected to?\nReflective: Ask — What does this mean for me?\n\nQuestions are switches.'},{h:'Emergency Reset',b:'When overwhelmed:\n1. Pause\n2. Name the mode you are stuck in\n3. Switch to Reflective Mode\n4. Ask: What is one thing I can control right now?\n\nThis collapses noise into clarity.'}],
   ex:{title:'The Switching Drill',prompt:'Choose a neutral topic. Spend 60 seconds in each mode:\n\n— Facts only (Analytical)\n— Gut response (Intuitive)\n— Ideas and connections (Associative)\n— Meaning and lesson (Reflective)\n\nNotice the mental texture of each mode. This builds mode awareness.\n\nAssignment: For 48 hours, identify your default mode and practice switching once per day.'}},
  {id:3,tag:'L3',color:'#0EA5E9',title:'Synthesis & Decision Mastery',week:3,dur:'90 min',free:false,
   obj:'Learn to merge multiple streams of thought into one clear, stable decision.',
   content:[{h:'Why Most Decisions Fail',b:'Decisions fail not because of lack of intelligence but fragmentation:\n\n— Logic argues with emotion\n— Intuition contradicts facts\n— Creativity overwhelms focus\n\nA fused mind does not hesitate.'},{h:'The Synthesis Framework',b:'1. EXTRACT — Strongest output from each mode\n2. ALIGN — Check overlaps and contradictions\n3. COMPRESS — Reduce into one core insight\n4. DECIDE — Commit to a single direction\n\nClarity is compression.'},{h:'The Commitment Lock',b:'Once synthesis is complete, re-analysis stops. Action begins.\n\nHandling Doubt: Doubt means a mode is reactivating unnecessarily. Identify it. Acknowledge it. Return to the fused conclusion.'}],
   ex:{title:'Full NeuralFusion Cycle',prompt:'Choose a real decision you face.\n\nWrite outputs from each mode:\n— Analytical: Facts and constraints\n— Intuitive: Strongest gut signal\n— Associative: Best idea or option\n— Reflective: Lesson or value\n\nUnderline the common theme. Write one sentence decision.\n\nAssignment: Within 72 hours, apply full synthesis to one real decision and act on it.'}},
  {id:4,tag:'L4',color:'#10B981',title:'Stabilisation Under Pressure',week:4,dur:'90 min',free:false,
   obj:'Maintain clarity when pressure attempts to collapse mental control.',
   content:[{h:'Why Clarity Collapses Under Pressure',b:'Pressure triggers emotional hijacking, narrow attention, and mode dominance.\n\nNeuralFusion does not fight pressure. It absorbs and stabilises it.\n\nPressure is not the enemy. Instability is.'},{h:'The Three Stabilisers',b:'1. COGNITIVE ANCHOR — A short internal statement that locks synthesis. Example: This is my decision.\n\n2. TEMPORAL COMPRESSION — Ask: What matters in the next 10 minutes?\n\n3. MODE CONTAINMENT — Identify the flaring mode, reduce its influence, return to synthesis.'},{h:'Preventing Mental Relapse',b:'1. Recognise the triggers\n2. Re-state the fused conclusion\n3. Take one aligned action\n\nAction stabilises thought.\n\nKey Insight: Mental mastery is not calm thinking. It is stable thinking.'}],
   ex:{title:'Pressure Simulation Drill',prompt:'1. Recall a recent stressful moment\n2. Identify the dominant mode at the time\n3. Re-run the situation using:\n   — One Cognitive Anchor\n   — One Temporal Compression\n   — Mode Containment\n4. Observe how tension reduces\n\nAssignment: Within 72 hours, apply stabilisation during one stressful event and record the outcome.'}},
  {id:5,tag:'L5',color:'#F59E0B',title:'Automatic Integration & Cognitive Fluency',week:5,dur:'90 min',free:false,
   obj:'Transition from conscious effort to automatic mastery.',
   content:[{h:'What is Cognitive Fluency?',b:'Cognitive fluency is the ability to think clearly without deliberate effort. Fast. Stable. Adaptive.\n\nElite performers do not think harder. They think integrated.\n\nMastery is when effort disappears.'},{h:'The Automatic Fusion Trigger',b:'NeuralFusion automation begins with a single internal cue: Fuse.\n\nThis word signals the brain to decompose automatically, activate relevant modes, synthesise rapidly, and stabilise instantly.\n\nWith repetition, this becomes reflexive.'},{h:'Signs of Completion',b:'You are integrating NeuralFusion when:\n— You pause naturally before reacting\n— Decisions feel settled\n— Mental noise reduces\n— Confidence feels quiet, not loud\n\nFinal Insight: You do not control the mind by force. You train it by structure.'}],
   ex:{title:'Fluency Installation',prompt:'One Word Fusion:\n\n1. Sit calmly\n2. Think of a current situation\n3. Say internally: Fuse\n4. Allow the mind to organise itself\n5. Notice the clarity without forcing\n\nRepeat daily for reinforcement.\n\nYou have completed NeuralFusion™ Core Training Level One.'}}
];

// NAVIGATION
function show(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const el=document.getElementById('v-'+id);
  if(el)el.classList.add('active');
  const noNav=['loader','landing','auth','cfi','score','lesson'];
  document.getElementById('bnav').style.display=noNav.includes(id)?'none':'block';
  renderBnav(id);
}

function renderBnav(cur){
  const role=S.profile?.role;
  if(role==='admin'){document.getElementById('bnavInner').innerHTML='';return;}
  const items=role==='facilitator'
    ?[{i:'📊',l:'Dashboard',s:'dashboard'},{i:'👤',l:'Account',s:'progress'}]
    :[{i:'📚',l:'Learn',s:'lessons'},{i:'⚡',l:'Synthesis',s:'synthesis'},{i:'📈',l:'Progress',s:'progress'},...(S.user&&!S.cohort?[{i:'🔗',l:'Cohort',s:'enroll'}]:[])];
  document.getElementById('bnavInner').innerHTML=items.map(n=>`<button class="bn${cur===n.s?' active':''}" onclick="navTo('${n.s}')"><div class="bn-icon">${n.i}</div><div class="bn-lbl">${n.l}</div></button>`).join('');
}

function navTo(s){
  if(s==='lessons'){renderLessons();show('lessons');}
  else if(s==='synthesis'){renderSynth();show('synthesis');}
  else if(s==='progress'){renderProgress();show('progress');}
  else if(s==='dashboard'){renderDash();show('dashboard');}
  else show(s);
}

// AUTH
function goAuth(mode){
  S.authMode=mode;
  document.getElementById('authHead').textContent=mode==='signup'?'Create Account':'Sign In';
  document.getElementById('authBtn').textContent=mode==='signup'?'Create Account':'Sign In';
  document.getElementById('authSignupF').style.display=mode==='signup'?'block':'none';
  document.getElementById('authSwT').textContent=mode==='login'?"Don't have an account?":'Have an account?';
  document.getElementById('authSwB').textContent=mode==='login'?'Sign up':'Sign in';
  document.getElementById('authErr').style.display='none';
  show('auth');
}
function switchAuth(){goAuth(S.authMode==='login'?'signup':'login');}
function setRole(r){S.role=r;document.getElementById('rP').classList.toggle('active',r==='participant');document.getElementById('rF').classList.toggle('active',r==='facilitator');}

async function submitAuth(){
  const email=document.getElementById('aEmail').value.trim(),pass=document.getElementById('aPass').value;
  const name=document.getElementById('aName').value.trim(),org=document.getElementById('aOrg').value.trim();
  if(!email||!pass){err('authErr','Please fill all fields.');return;}
  if(S.authMode==='signup'&&!name){err('authErr','Please enter your name.');return;}
  const btn=document.getElementById('authBtn');btn.textContent='Please wait…';btn.disabled=true;
  try{
    if(S.authMode==='signup'){
      const{data,error:e}=await sb.auth.signUp({email,password:pass,options:{data:{full_name:name,role:S.role,organisation:org}}});
      if(e)throw e;
      if(data.user)await sb.from('profiles').upsert({id:data.user.id,full_name:name,role:S.role,organisation:org,is_premium:false});
    }else{
      const{error:e}=await sb.auth.signInWithPassword({email,password:pass});
      if(e)throw e;
    }
    await initUser();
  }catch(e){err('authErr',e.message);btn.textContent=S.authMode==='signup'?'Create Account':'Sign In';btn.disabled=false;}
}
async function signOut(){if(sb)await sb.auth.signOut();Object.assign(S,{user:null,profile:null,cohort:null,certs:[],done:new Set(),preCFI:null,postCFI:null,preA:null,postA:null,premium:false});show('landing');}
function startFree(){startCFI('pre');}

// INIT
async function initUser(){
  if(!sb){show('landing');return;}
  const{data:{session}}=await sb.auth.getSession();
  if(!session){show('landing');return;}
  S.user=session.user;
  let{data:p}=await sb.from('profiles').select('*').eq('id',S.user.id).single();
  if(!p){const m=S.user.user_metadata||{};p={id:S.user.id,full_name:m.full_name||'User',role:m.role||'participant',organisation:m.organisation||'',is_premium:false};await sb.from('profiles').upsert(p);}
  S.profile=p;S.premium=!!p.is_premium;
  if(p.role==='admin'||p.role==='facilitator'){renderDash();show('dashboard');return;}
  const[{data:lc},{data:cfis},{data:certs},{data:en}]=await Promise.all([
    sb.from('lesson_completions').select('lesson_id').eq('participant_id',S.user.id),
    sb.from('cfi_assessments').select('*').eq('participant_id',S.user.id).order('taken_at',{ascending:false}),
    sb.from('certificates').select('*').eq('participant_id',S.user.id),
    sb.from('enrollments').select('cohort_id').eq('participant_id',S.user.id).limit(1).maybeSingle()
  ]);
  if(lc?.length)S.done=new Set(lc.map(l=>l.lesson_id));
  if(cfis?.length){const pre=cfis.find(c=>c.type==='pre'),post=cfis.find(c=>c.type==='post');if(pre){S.preCFI=pre.total_score;S.preA=pre.answers;}if(post){S.postCFI=post.total_score;S.postA=post.answers;}}
  S.certs=certs||[];
  if(en?.cohort_id){const{data:c}=await sb.from('cohorts').select('*').eq('id',en.cohort_id).single();if(c)S.cohort=c;}
  if(!S.preCFI){startCFI('pre');}else{renderLessons();show('lessons');}
}

// CFI
function startCFI(type){S.cfiType=type;S.cfiA=new Array(13).fill(null);S.cfiI=0;show('cfi');renderCFI();}

function renderCFI(){
  const q=CFI[S.cfiI],isP=S.cfiType==='post';
  document.getElementById('cfiLbl').textContent=isP?'Post-Training CFI':'CFI Assessment';
  document.getElementById('cfiCnt').textContent=`${S.cfiI+1}/13`;
  document.getElementById('cfiBar').style.width=`${(S.cfiI/13)*100}%`;
  const n=document.getElementById('cfiNote');if(isP&&S.preCFI){n.style.display='block';n.textContent=`Your pre-score was ${S.preCFI}.`;}else n.style.display='none';
  document.getElementById('cfiBk').style.visibility=S.cfiI>0?'visible':'hidden';
  const nx=document.getElementById('cfiNx');nx.disabled=S.cfiA[S.cfiI]===null;nx.textContent=S.cfiI<12?'Continue →':'Submit';
  document.getElementById('cfiDim').innerHTML=`<span class="tag" style="background:${DC[q.d]}18;color:${DC[q.d]};">${DL[q.d]}</span>`;
  document.getElementById('cfiQ').textContent=q.t;
  document.getElementById('cfiOpts').innerHTML=LABS.map((l,i)=>`<div class="opt${S.cfiA[S.cfiI]===i?' sel':''}" onclick="selCFI(${i})"><div class="opt-dot"><div class="opt-inner"></div></div><span style="font-size:14px;">${l}</span></div>`).join('');
}
function selCFI(i){S.cfiA[S.cfiI]=i;renderCFI();}
function cfiBack(){if(S.cfiI>0){S.cfiI--;renderCFI();}}
async function cfiNext(){
  if(S.cfiA[S.cfiI]===null)return;
  if(S.cfiI<12){S.cfiI++;renderCFI();}
  else{
    const score=calcCFI(S.cfiA),ans=[...S.cfiA];
    if(S.cfiType==='pre'){S.preCFI=score;S.preA=ans;}else{S.postCFI=score;S.postA=ans;}
    if(sb&&S.user){const dims={dim_a:dSc(ans,'A'),dim_b:dSc(ans,'B'),dim_c:dSc(ans,'C'),dim_d:dSc(ans,'D'),dim_e:dSc(ans,'E')};await sb.from('cfi_assessments').insert({participant_id:S.user.id,cohort_id:S.cohort?.id||null,type:S.cfiType,answers:ans,total_score:score,...dims});}
    renderScore(score,ans,S.cfiType);show('score');
  }
}

// SCORE
function renderScore(score,ans,type){
  const lv=lvl(score),isP=type==='post',delta=isP&&S.preCFI!==null?S.preCFI-score:null;
  document.getElementById('scoreTag').textContent=isP?'Post-Training Score':'CFI Score';
  document.getElementById('scoreN').textContent=score;document.getElementById('scoreN').style.color=lv.c;
  const sl=document.getElementById('scoreLbl');sl.textContent=lv.l;sl.style.background=lv.bg;sl.style.color=lv.c;
  document.getElementById('scoreDelta').innerHTML=delta!==null?`<div style="display:inline-flex;align-items:center;gap:10px;background:${delta>0?'#D1FAE5':'#FEE2E2'};border-radius:12px;padding:12px 20px;"><span style="font-family:'Fraunces',serif;font-size:32px;font-weight:700;color:${delta>0?'#065F46':'#991B1B'};">${delta>0?`-${delta}`:`+${Math.abs(delta)}`}</span><div style="text-align:left;"><div style="font-size:12px;font-weight:500;color:${delta>0?'#065F46':'#991B1B'};">Clarity Delta</div><div style="font-size:11px;color:var(--ink3);">${delta>0?'fragmentation reduced':'further practice needed'}</div></div></div>`:'';
  document.getElementById('scoreDims').innerHTML=['A','B','C','D','E'].map(d=>{const s=dSc(ans,d);return`<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span style="font-size:12px;color:var(--ink2);">${DL[d]}</span><span style="font-size:12px;font-weight:500;color:${DC[d]};">${s}</span></div><div class="pbar"><div class="pbar-fill" style="width:${s}%;background:${DC[d]};"></div></div></div>`;}).join('');
  const c=document.getElementById('scoreCont');c.textContent=isP?'View Progress →':'Start Learning →';
  c.onclick=()=>{if(isP){renderProgress();show('progress');}else{renderLessons();show('lessons');}};
}

// PAYSTACK
function paystack(){
  if(!S.user){goAuth('login');return;}
  function launch(){
    const handler=PaystackPop.setup({
      key:PKEY,
      email:S.user.email,
      amount:AMT,
      currency:'NGN',
      ref:'nf_'+Date.now(),
      channels:['card','bank','ussd','mobile_money'],
      callback:async function(r){
        if(sb){
          await sb.from('profiles').update({is_premium:true,paystack_ref:r.reference}).eq('id',S.user.id);
          await sb.from('payments').insert({user_id:S.user.id,reference:r.reference,amount:AMT,currency:'NGN',status:'success'});
        }
        S.premium=true;
        renderLessons();show('lessons');
      },
      onClose:function(){}
    });
    setTimeout(function(){handler.openIframe();},100);
  }
  if(window.PaystackPop){
    launch();
  }else{
    var s=document.createElement('script');
    s.src='https://js.paystack.co/v1/inline.js';
    s.onload=function(){launch();};
    s.onerror=function(){alert('Could not load payment. Check your internet connection and try again.');};
    document.head.appendChild(s);
  }
}

// LESSONS
function renderLessons(){
  const done=S.done,prem=S.premium;
  document.getElementById('lProg').style.width=`${(done.size/5)*100}%`;
  document.getElementById('lCount').textContent=`${done.size} of 5 complete`;
  const pb=document.getElementById('paywallBlock');
  pb.innerHTML=!prem?`<div class="paywall">
    <div style="font-size:11px;color:var(--gold2);letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px;">Premium Access</div>
    <h3>Unlock Full Curriculum</h3>
    <p>Lessons 2–5 — the complete NeuralFusion™ training programme.</p>
    <div class="paywall-price">₦2,500</div>
    <div class="paywall-sub">One-time · Lifetime access</div>
    <div style="margin-bottom:18px;">${['Mode Activation & Mental Control','Synthesis & Decision Mastery','Stabilisation Under Pressure','Automatic Integration & Fluency'].map(t=>`<div class="feature-row"><spa
