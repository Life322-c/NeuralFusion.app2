// CONFIG
const SURL='https://civwcmteqidppscbpqni.supabase.co';
const SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdndjbXRlcWlkcHBzY2JwcW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5Mjc3MDYsImV4cCI6MjA4OTUwMzcwNn0.kRaEGNQw-vsXE9NaSExO3RC4KyHzV3kl9JpnKzDN2Sk';
const PKEY='pk_live_dfa71eca29f942cadc337cb8e41834857e2b129b';
const AMT=250000;
let sb=null;

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
    ?[{i:'📊',l:'Dashboard',s:'dashboard'}]
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
  if(mode==='signup'){S.role='participant';const rP=document.getElementById('rP'),rF=document.getElementById('rF');if(rP&&rF){rP.classList.add('active');rF.classList.remove('active');}}
  document.getElementById('authSwT').textContent=mode==='login'?"Don't have an account?":'Have an account?';
  document.getElementById('authSwB').textContent=mode==='login'?'Sign up':'Sign in';
  document.getElementById('authErr').style.display='none';
  show('auth');
}
function switchAuth(){goAuth(S.authMode==='login'?'signup':'login');}
function setRole(r){
  S.role=r;
  document.getElementById('rP').classList.toggle('active',r==='participant');
  document.getElementById('rF').classList.toggle('active',r==='facilitator');
}
async function signOut(){if(sb)await sb.auth.signOut();Object.assign(S,{user:null,profile:null,cohort:null,certs:[],done:new Set(),preCFI:null,postCFI:null,preA:null,postA:null,premium:false});show('landing');}
function startFree(){startCFI('pre');}

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
      if(!data.session){
        btn.textContent='Create Account';btn.disabled=false;
        const errEl=document.getElementById('authErr');
        errEl.style.display='block';errEl.style.color='#10B981';
        errEl.style.background='#D1FAE5';errEl.style.borderRadius='8px';errEl.style.padding='12px';
        errEl.textContent='✅ Account created! Check your email and click the confirmation link before signing in.';
        return;
      }
    }else{
      const{error:e}=await sb.auth.signInWithPassword({email,password:pass});
      if(e)throw e;
    }
    await initUser();

    // Flush pending CFI score if user completed CFI as a guest
    if(sb&&S.user&&S._pendingCFI){
      try{
        const{score,ans,type}=S._pendingCFI;
        const dims={
          dim_a:dSc(ans,'A'),dim_b:dSc(ans,'B'),dim_c:dSc(ans,'C'),
          dim_d:dSc(ans,'D'),dim_e:dSc(ans,'E')
        };
        await sb.from('cfi_assessments').insert({
          participant_id:S.user.id,
          cohort_id:S.cohort?.id||null,
          type,answers:ans,total_score:score,...dims
        });
        S._pendingCFI=null;
      }catch(e){console.error('Pending CFI flush failed:',e);}
    }

  }catch(e){err('authErr',e.message);btn.textContent=S.authMode==='signup'?'Create Account':'Sign In';btn.disabled=false;}
}
        

// INIT
async function initUser(){
  if(!sb){show('landing');return;}
  const{data:{session}}=await sb.auth.getSession();
  if(!session){show('landing');return;}
  S.user=session.user;
  let{data:p}=await sb.from('profiles').select('*').eq('id',S.user.id).single();
  if(!p){const m=S.user.user_metadata||{};p={id:S.user.id,full_name:m.full_name||'User',role:m.role||'participant',organisation:m.organisation||'',is_premium:false};await sb.from('profiles').upsert(p);}
  S.profile=p;S.premium=!!p.is_premium;
  if(p.role==='admin'){renderDash();show('dashboard');return;}
  if(p.role==='facilitator'){
    if(p.is_premium){renderDash();show('dashboard');}
    else{await renderFacilitatorPaywall();}
    return;
  }
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
  await checkPaymentReturn();
  if(!S.preCFI){startCFI('pre');}else{renderLessons();show('lessons');}
}

// CFI
function startCFI(type){
  S.cfiType=type;
  S.cfiA=new Array(13).fill(null);
  S.cfiI=0;
  renderCFI();
  show('cfi');
}

function renderCFI(){
  const i=S.cfiI,q=CFI[i],total=CFI.length;
  document.getElementById('cfiLbl').textContent=S.cfiType==='pre'?'Pre-Training Assessment':'Post-Training Assessment';
  document.getElementById('cfiCnt').textContent=`${i+1} of ${total}`;
  document.getElementById('cfiBar').style.width=`${((i+1)/total)*100}%`;
  document.getElementById('cfiDim').innerHTML=`<span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:${DC[q.d]};background:${DC[q.d]}18;padding:3px 10px;border-radius:50px;">${DL[q.d]}</span>`;
  document.getElementById('cfiQ').textContent=q.t;
  const cur=S.cfiA[i];
  document.getElementById('cfiOpts').innerHTML=LABS.map((l,v)=>`<button onclick="cfiSel(${v})" style="display:block;width:100%;text-align:left;padding:12px 16px;margin-bottom:8px;border-radius:12px;border:2px solid ${cur===v?'var(--accent)':'var(--line)'};background:${cur===v?'var(--accent)10':'var(--bg)'};font-size:14px;color:${cur===v?'var(--accent)':'var(--ink2)'};font-weight:${cur===v?'600':'400'};cursor:pointer;">${l}</button>`).join('');
  const nx=document.getElementById('cfiNx');
  nx.textContent=i<total-1?'Next →':'See Results →';
  nx.disabled=cur===null;
  document.getElementById('cfiBk').style.visibility=i===0?'hidden':'visible';
}

function cfiSel(v){
  S.cfiA[S.cfiI]=v;
  renderCFI();
}

function cfiBack(){
  if(S.cfiI>0){S.cfiI--;renderCFI();}
}

async function cfiNext(){
  if(S.cfiA[S.cfiI]===null)return;
  if(S.cfiI<12){S.cfiI++;renderCFI();}
  else{
    const score=calcCFI(S.cfiA),ans=[...S.cfiA];
    if(S.cfiType==='pre'){S.preCFI=score;S.preA=ans;}else{S.postCFI=score;S.postA=ans;}

    // Save to Supabase if user is signed in
    if(sb&&S.user){
      try{
        const dims={
          dim_a:dSc(ans,'A'),dim_b:dSc(ans,'B'),dim_c:dSc(ans,'C'),
          dim_d:dSc(ans,'D'),dim_e:dSc(ans,'E')
        };
        const{error}=await sb.from('cfi_assessments').insert({
          participant_id:S.user.id,
          cohort_id:S.cohort?.id||null,
          type:S.cfiType,
          answers:ans,
          total_score:score,
          ...dims
        });
        if(error)console.error('CFI save error:',error.message);
      }catch(e){
        console.error('CFI save failed:',e);
      }
    } else {
      // Guest: store pending CFI so it can be saved after signup
      S._pendingCFI={score,ans,type:S.cfiType};
    }

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

// FACILITATOR PAYWALL
async function renderFacilitatorPaywall(){
  // Fetch fee from settings
  let fee=2500000,feeDisplay='₦25,000';
  try{
    const{data}=await sb.from('settings').select('value').eq('key','facilitator_fee').single();
    if(data?.value){fee=parseInt(data.value);feeDisplay='₦'+(fee/100).toLocaleString();}
  }catch(e){}
  const el=document.getElementById('dashContent');
  document.getElementById('dashRole').textContent='Facilitator Access';
  el.innerHTML=`
    <div style="text-align:center;padding:30px 0 10px;">
      <div style="font-size:40px;margin-bottom:12px;">🔐</div>
      <h2 style="font-family:'Fraunces',serif;font-size:22px;font-weight:600;margin-bottom:8px;">Facilitator Access</h2>
      <p style="font-size:14px;color:var(--ink3);margin-bottom:24px;line-height:1.6;">Unlock full facilitator tools — cohort management, participant tracking, CFI analytics, and certificate issuance.</p>
    </div>
    <div class="card" style="margin-bottom:16px;">
      ${['Create & manage unlimited cohorts','Track participant CFI scores','Issue NeuralFusion™ certificates','Access cohort analytics dashboard'].map(f=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);"><span style="color:#C4952A;font-size:16px;">✓</span><span style="font-size:14px;color:var(--ink2);">${f}</span></div>`).join('')}
    </div>
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-family:'Fraunces',serif;font-size:42px;font-weight:700;color:var(--ink);line-height:1;">${feeDisplay}</div>
      <div style="font-size:13px;color:var(--ink3);margin-top:4px;">One-time · Lifetime access</div>
    </div>
    <div id="facPayErr" style="display:none;font-size:12px;color:#991B1B;background:#FEE2E2;border-radius:8px;padding:10px 12px;margin-bottom:12px;"></div>
    <button class="btn btn-gold" id="facPayBtn" onclick="paystackFacilitator(${fee})">Unlock Facilitator Access — ${feeDisplay}</button>
    <button class="btn-ghost" onclick="signOut()" style="display:block;width:100%;text-align:center;margin-top:14px;font-size:12px;color:var(--ink3);">Sign out</button>`;
  show('dashboard');
}

async function paystackFacilitator(fee){
  const btn=document.getElementById('facPayBtn');
  const errEl=document.getElementById('facPayErr');
  if(errEl)errEl.style.display='none';
  btn.textContent='Please wait…';btn.disabled=true;
  try{
    const res=await fetch(`${SURL}/functions/v1/initiate-payment`,{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':SKEY,'Authorization':'Bearer '+SKEY},
      body:JSON.stringify({user_id:S.user.id,email:S.user.email,amount:fee,type:'facilitator'})
    });
    const data=await res.json();
    if(data.authorization_url){
      window.location.href=data.authorization_url;
    }else{
      throw new Error(data.error||'Could not start payment');
    }
  }catch(e){
    btn.textContent='Unlock Facilitator Access';btn.disabled=false;
    if(errEl){errEl.textContent='Error: '+e.message;errEl.style.display='block';}
  }
}

// PAYSTACK — redirect approach (reliable on all mobile browsers)
async function paystack(){
  if(!S.user){goAuth('login');return;}
  const btn=document.querySelector('.btn-gold');
  if(btn){btn.textContent='Please wait…';btn.disabled=true;}
  try{
    // Call Supabase Edge Function to initialise payment
    const res=await fetch(`${SURL}/functions/v1/initiate-payment`,{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':SKEY,'Authorization':'Bearer '+SKEY},
      body:JSON.stringify({user_id:S.user.id,email:S.user.email})
    });
    const data=await res.json();
    if(data.authorization_url){
      // Redirect to Paystack hosted payment page
      window.location.href=data.authorization_url;
    }else{
      alert('Could not start payment: '+(data.error||'Unknown error'));
      if(btn){btn.textContent='Unlock Now — ₦2,500';btn.disabled=false;}
    }
  }catch(e){
    alert('Network error. Check your connection and try again.');
    if(btn){btn.textContent='Unlock Now — ₦2,500';btn.disabled=false;}
  }
}

// Called on app load — checks if returning from Paystack payment
async function checkPaymentReturn(){
  const params=new URLSearchParams(window.location.search);
  const payment=params.get('payment');
  const ref=params.get('trxref')||params.get('reference');
  if(payment==='success'&&ref&&S.user){
    // Verify with Supabase Edge Function
    const res=await fetch(`${SURL}/functions/v1/hyper-endpoint?reference=${ref}`,{
      headers:{'apikey':SKEY,'Authorization':'Bearer '+SKEY}
    });
    const data=await res.json();
    if(data.success){
      S.premium=true;
      if(S.profile)S.profile.is_premium=true;
      // Clean URL
      window.history.replaceState({},'',window.location.pathname);
      // Route by role
      if(S.profile?.role==='facilitator'){renderDash();show('dashboard');}
      else{renderLessons();show('lessons');}
    }
  }
}

// LESSONS
function preloadPaystack(){
  if(!window.PaystackPop){
    var s=document.createElement('script');
    s.src='https://js.paystack.co/v1/inline.js';
    document.head.appendChild(s);
  }
}
function renderLessons(){
  preloadPaystack();
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
    <div style="margin-bottom:18px;">${['Mode Activation & Mental Control','Synthesis & Decision Mastery','Stabilisation Under Pressure','Automatic Integration & Fluency'].map(t=>`<div class="feature-row"><span style="color:var(--gold2);">✓</span>${t}</div>`).join('')}</div>
    ${S.user?`<button class="btn btn-gold" onclick="paystack()">Unlock Now — ₦2,500</button>`:`<button class="btn btn-gold" onclick="goAuth('signup')">Sign Up to Subscribe</button>`}
  </div>`:'';
  document.getElementById('lessonList').innerHTML=LESSONS.map((l,i)=>{
    const isDone=done.has(l.id),locked=i>0&&!done.has(LESSONS[i-1].id),needPay=!l.free&&!prem;
    return`<div class="lesson-row" style="opacity:${locked||needPay?'.5':'1'};cursor:${locked||needPay?'default':'pointer'};" onclick="${locked||needPay?'':'openLesson('+l.id+')'}">
      <div class="lesson-dot" style="background:${isDone?'#D1FAE5':l.color+'15'};color:${isDone?'#065F46':l.color};">${isDone?'✓':needPay?'🔒':l.tag}</div>
      <div class="lesson-info">
        <div class="lesson-title">Lesson ${l.id} — ${l.title}</div>
        <div class="lesson-sub">${needPay?'Premium · ₦2,500 to unlock':`Week ${l.week} · ${l.dur}${l.free?' · Free':''}`}</div>
      </div>
      ${!locked&&!needPay?'<span style="color:var(--ink3);font-size:18px;">›</span>':''}
    </div>`;
  }).join('');
  const ex=document.getElementById('extraBtns');
  const btns=[];
  if(done.size>=3&&prem)btns.push(`<button class="btn btn-outline" onclick="renderSynth();show('synthesis')" style="border-radius:12px;justify-content:space-between;padding:14px 18px;"><span>⚡ Synthesis Workspace</span><span style="color:var(--ink3);">›</span></button>`);
  if(done.size===5&&!S.postCFI)btns.push(`<button class="btn btn-outline" onclick="startCFI('post')" style="border-radius:12px;justify-content:space-between;padding:14px 18px;"><span>📊 Post-Training CFI</span><span style="color:var(--ink3);">›</span></button>`);
  ex.innerHTML=btns.join('');
  const ta=document.getElementById('topAction');
  ta.innerHTML=S.user?`<button class="btn-ghost" onclick="signOut()" style="font-size:12px;color:var(--ink3);text-decoration:none;">Sign out</button>`:`<button class="btn btn-sm btn-dark" onclick="goAuth('login')" style="border-radius:50px;padding:8px 16px;font-size:12px;">Sign in</button>`;
}

function openLesson(id){
  S.lesson=LESSONS.find(l=>l.id===id);if(!S.lesson)return;const l=S.lesson;
  document.getElementById('lTag').innerHTML=`<span style="color:${l.color};font-weight:600;">${l.tag}</span> · Week ${l.week} · ${l.dur}`;
  document.getElementById('lTitle').textContent=l.title;
  document.getElementById('lObj').textContent=l.obj;
  document.getElementById('lContent').innerHTML=l.content.map(c=>`<div class="card" style="margin-bottom:10px;"><div style="font-size:13px;font-weight:500;color:${l.color};margin-bottom:8px;">${c.h}</div><p style="font-size:14px;color:var(--ink2);line-height:1.8;white-space:pre-line;">${c.b}</p></div>`).join('')+`<button class="btn btn-dark" onclick="lTab(1,document.getElementById('lT1'))" style="margin-top:6px;">Go to Exercise →</button>`;
  document.getElementById('exTitle').textContent=l.ex.title;
  document.getElementById('exPrompt').textContent=l.ex.prompt;
  document.getElementById('exText').value='';
  document.getElementById('exText').oninput=function(){const v=this.value.trim(),b=document.getElementById('lDoneBtn');b.disabled=v.length<20;b.textContent=v.length<20?'Write a response to complete':'Mark Lesson Complete →';};
  document.getElementById('lDoneBtn').disabled=true;document.getElementById('lDoneBtn').textContent='Write a response to complete';
  lTab(0,document.getElementById('lT0'));show('lesson');
}

function lTab(i,btn){
  [document.getElementById('lT0'),document.getElementById('lT1')].forEach((b,j)=>b.classList.toggle('active',j===i));
  document.getElementById('lContent').style.display=i===0?'block':'none';
  document.getElementById('lEx').style.display=i===1?'block':'none';
}

async function completeLesson(){
  const l=S.lesson,text=document.getElementById('exText').value.trim();
  if(text.length<20||!l)return;
  const b=document.getElementById('lDoneBtn');b.textContent='Saving…';b.disabled=true;
  if(sb&&S.user)await sb.from('lesson_completions').upsert({participant_id:S.user.id,cohort_id:S.cohort?.id||null,lesson_id:l.id,exercise_response:text});
  S.done.add(l.id);b.textContent='✓ Complete!';b.style.background='#10B981';
  setTimeout(()=>{renderLessons();show('lessons');},800);
}

// SYNTHESIS
function renderSynth(){
  const modes=[['a','Analytical','What does the data show?','#6366F1'],['i','Intuitive','What is your gut read?','#10B981'],['as','Associative','What connections surface?','#F59E0B'],['r','Reflective','If wrong, what are you missing?','#EC4899']];
  document.getElementById('sModes').innerHTML=modes.map(([k,lbl,q,col])=>`<div class="card" style="margin-bottom:10px;border-left:3px solid ${col};border-radius:12px;"><div style="font-size:12px;font-weight:500;color:${col};margin-bottom:4px;">${lbl}</div><p style="font-size:12px;color:var(--ink3);margin-bottom:8px;">${q}</p><textarea class="inp sm-inp" data-k="${k}" style="min-height:65px;font-size:13px;" placeholder="Your response..." oninput="checkSynth()"></textarea></div>`).join('');
  document.getElementById('sOut').style.display='none';document.getElementById('sHint').style.display='block';
  document.getElementById('sSave').textContent='Save Session';document.getElementById('sSave').disabled=false;
  document.getElementById('sProb').value='';if(document.getElementById('sDec'))document.getElementById('sDec').value='';
}
function checkSynth(){const all=[...document.querySelectorAll('.sm-inp')].every(e=>e.value.trim().length>5);document.getElementById('sOut').style.display=all?'block':'none';document.getElementById('sHint').style.display=all?'none':'block';}
async function saveSynth(){
  const b=document.getElementById('sSave'),dec=document.getElementById('sDec').value.trim();if(!dec)return;
  b.textContent='Saving…';b.disabled=true;
  if(sb&&S.user){const inp={};document.querySelectorAll('.sm-inp').forEach(e=>inp[e.dataset.k]=e.value);await sb.from('synthesis_sessions').insert({participant_id:S.user.id,problem:document.getElementById('sProb').value,analytical:inp.a,intuitive:inp.i,associative:inp.as,reflective:inp.r,decision:dec});}
  b.textContent='✓ Saved';b.style.background='#10B981';b.style.color='#fff';
}

// PROGRESS
function renderProgress(){
  const delta=S.postCFI!==null&&S.preCFI!==null?S.preCFI-S.postCFI:null;
  document.getElementById('pContent').innerHTML=`
    <h2 style="font-family:'Fraunces',serif;font-size:22px;font-weight:600;margin-bottom:4px;">Clarity Delta</h2>
    <p style="font-size:13px;color:var(--ink3);margin-bottom:20px;">Your cognitive improvement over the programme.</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
      ${[['Pre',S.preCFI,'#6366F1'],['Post',S.postCFI,'#10B981'],['Delta',delta===null?'–':delta>0?`-${delta}`:`+${Math.abs(delta)}`,delta===null?'var(--ink3)':delta>0?'#065F46':'#991B1B']].map(([l,v,c])=>`<div class="card" style="text-align:center;padding:16px 10px;"><div style="font-family:'Fraunces',serif;font-size:32px;font-weight:700;color:${c};">${v??'—'}</div><div style="font-size:10px;color:var(--ink3);margin-top:3px;text-transform:uppercase;letter-spacing:.05em;">${l}</div></div>`).join('')}
    </div>
    <div class="card" style="margin-bottom:12px;">
      <div style="font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Lessons</div>
      ${LESSONS.map(l=>{const d=S.done.has(l.id);return`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);"><div style="width:26px;height:26px;border-radius:8px;background:${d?l.color+'20':'var(--bg3)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:11px;font-weight:600;color:${d?l.color:'var(--ink3)'};">${d?'✓':l.id}</span></div><span style="font-size:13px;color:${d?'var(--ink)':'var(--ink3)'};">${l.title}</span>${d?`<span style="margin-left:auto;font-size:10px;color:var(--ink3);">Wk ${l.week}</span>`:''}</div>`;}).join('')}
    </div>
    ${S.postA&&S.preA?`<div class="card" style="margin-bottom:12px;">
      <div style="font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Dimension Improvement</div>
      ${['A','B','C','D','E'].map(d=>{const pre=dSc(S.preA,d),post=dSc(S.postA,d),imp=pre-post;return`<div style="margin-bottom:11px;"><div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span style="font-size:12px;color:var(--ink2);">${DL[d]}</span><span style="font-size:12px;color:${imp>0?'#065F46':imp<0?'#991B1B':'var(--ink3)'};font-weight:500;">${imp>0?`-${imp}`:imp<0?`+${Math.abs(imp)}`:'-'}</span></div><div class="pbar"><div class="pbar-fill" style="width:${pre}%;background:${DC[d]}60;"></div></div><div class="pbar" style="margin-top:2px;"><div class="pbar-fill" style="width:${post}%;background:${DC[d]};"></div></div></div>`;}).join('')}
    </div>`:''}
    ${!S.user?`<div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:12px;padding:14px;margin-bottom:12px;font-size:13px;color:#92400E;">Sign in to save your progress permanently and access enterprise features.</div>`:''}
    ${delta===null&&S.done.size===5?`<button class="btn btn-dark" onclick="startCFI('post')">Re-take CFI →</button>`:''}
    ${S.certs&&S.certs.length?`<button class="btn btn-gold" onclick="openCert()" style="margin-top:8px;">🏅 View My Certificate →</button>`:''}
    ${S.user?`<button class="btn btn-outline" onclick="signOut()" style="margin-top:8px;border-radius:12px;">Sign Out</button>`:''}
  `;
}

// FACILITATOR / ADMIN DASHBOARD
// ADMIN / FACILITATOR DASHBOARD
// Stores all fetched data so tab switches don't re-query
let _dash={users:[],payments:[],cohorts:[],cfis:[],completions:[],certs:[],tab:'overview'};

async function renderDash(){
  const role=S.profile?.role;
  document.getElementById('dashRole').textContent=role==='admin'?'Admin Console':'Facilitator';
  const el=document.getElementById('dashContent');
  el.innerHTML='<div class="dots" style="padding:40px 0;"><span></span><span></span><span></span></div>';
  if(role==='admin'){
    // Fetch all tables in parallel
    const[{data:users},{data:payments},{data:cohorts},{data:cfis},{data:completions},{data:certs},{data:enrollments}]=await Promise.all([
      sb.from('profiles').select('*').order('created_at',{ascending:false}),
      sb.from('payments').select('*').order('created_at',{ascending:false}),
      sb.from('cohorts').select('*').order('created_at',{ascending:false}),
      sb.from('cfi_assessments').select('*').order('taken_at',{ascending:false}),
      sb.from('lesson_completions').select('*').order('completed_at',{ascending:false}),
      sb.from('certificates').select('*').order('issued_at',{ascending:false}),
      sb.from('enrollments').select('*')
    ]);
    _dash={users:users||[],payments:payments||[],cohorts:cohorts||[],cfis:cfis||[],completions:completions||[],certs:certs||[],enrollments:enrollments||[],tab:_dash.tab||'overview'};
    _renderAdminShell(el);
    _renderAdminTab(_dash.tab);
  }else{
    const{data:cohorts}=await sb.from('cohorts').select('*').eq('facilitator_id',S.user.id).order('created_at',{ascending:false});
    el.innerHTML=`
      <h2 style="font-family:'Fraunces',serif;font-size:22px;font-weight:600;margin-bottom:16px;">My Cohorts</h2>
      <div class="card" style="margin-bottom:14px;">
        <div style="font-size:13px;font-weight:500;margin-bottom:12px;">Create New Cohort</div>
        <div class="field"><label class="lbl">Name</label><input id="cName" class="inp" style="font-size:14px;" placeholder="e.g. UNILAG Cohort 1"/></div>
        <div class="field"><label class="lbl">Organisation</label><input id="cOrg" class="inp" style="font-size:14px;" placeholder="University / Company"/></div>
        <div id="cErr" style="display:none;font-size:12px;color:#991B1B;background:#FEE2E2;border-radius:8px;padding:10px 12px;margin-bottom:10px;"></div>
        <button class="btn btn-dark btn-sm" onclick="createCohort()" id="cBtn" style="width:auto;">Create →</button>
      </div>
      <div id="cohList">${!(cohorts||[]).length?'<p style="font-size:13px;color:var(--ink3);padding:12px 0;">No cohorts yet.</p>':cohorts.map(c=>`<div class="card" style="margin-bottom:8px;display:flex;align-items:center;gap:12px;"><div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:500;color:var(--ink);margin-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</div><div style="font-size:11px;color:var(--ink3);">${c.organisation||'—'} · ${new Date(c.created_at).toLocaleDateString()}</div></div><button class="btn btn-outline btn-sm" style="width:auto;flex-shrink:0;" onclick='openCohort(${JSON.stringify(JSON.stringify(c))})'>View</button></div>`).join('')}</div>`;
  }
}

function _renderAdminShell(el){
  const tabs=[['overview','Overview'],['users','Users'],['cohorts','Cohorts'],['cfi','CFI Assessments'],['payments','Payments'],['settings','Settings']];
  el.innerHTML=`
    <div style="display:flex;gap:0;overflow-x:auto;margin-bottom:18px;border-bottom:1px solid var(--line);padding-bottom:0;">
      ${tabs.map(([k,l])=>`<button id="dtab-${k}" onclick="dashTab('${k}')" style="flex-shrink:0;background:none;border:none;border-bottom:2px solid ${_dash.tab===k?'var(--accent)':'transparent'};padding:10px 14px;font-size:13px;font-weight:${_dash.tab===k?'600':'400'};color:${_dash.tab===k?'var(--accent)':'var(--ink3)'};cursor:pointer;">${l}</button>`).join('')}
    </div>
    <div id="dashTabContent"></div>`;
}

function dashTab(t){
  _dash.tab=t;
  // Update tab styles
  ['overview','users','cohorts','cfi','payments','settings'].forEach(k=>{
    const b=document.getElementById('dtab-'+k);
    if(!b)return;
    b.style.borderBottomColor=k===t?'var(--accent)':'transparent';
    b.style.color=k===t?'var(--accent)':'var(--ink3)';
    b.style.fontWeight=k===t?'600':'400';
  });
  _renderAdminTab(t);
}

function _renderAdminTab(t){
  const el=document.getElementById('dashTabContent');
  if(!el)return;
  const{users,payments,cohorts,cfis,completions,certs,enrollments=[]}=_dash;
  const rev=payments.filter(x=>x.status==='success').reduce((s,x)=>s+x.amount,0)/100;
  const prem=users.filter(x=>x.is_premium).length;
  const participants=users.filter(x=>x.role==='participant');
  const avgCFI=cfis.filter(x=>x.type==='pre').length?Math.round(cfis.filter(x=>x.type==='pre').reduce((s,x)=>s+x.total_score,0)/cfis.filter(x=>x.type==='pre').length):null;

  if(t==='overview'){
    const stats=[
      ['Total Users',users.length,'#6366F1'],
      ['Premium',prem,'#10B981'],
      ['Revenue','₦'+rev.toLocaleString(),'#C4952A'],
      ['Cohorts',cohorts.length,'#8B5CF6'],
      ['CFI Taken',cfis.filter(x=>x.type==='pre').length,'#0EA5E9'],
      ['Certificates',certs.length,'#F59E0B']
    ];
    el.innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;">
        ${stats.map(([l,v,c])=>`<div class="card" style="text-align:center;padding:18px 8px;"><div style="font-family:'Fraunces',serif;font-size:30px;font-weight:700;color:${c};line-height:1;">${v}</div><div style="font-size:10px;color:var(--ink3);margin-top:5px;text-transform:uppercase;letter-spacing:.07em;">${l}</div></div>`).join('')}
      </div>
      <div class="card" style="margin-bottom:12px;">
        <div style="font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Recent Users</div>
        ${!users.length?'<p style="font-size:13px;color:var(--ink3);">No users yet.</p>':users.slice(0,5).map(u=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);"><div style="width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff;flex-shrink:0;">${(u.full_name||'?')[0].toUpperCase()}</div><div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:500;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.full_name||'—'}</div><div style="font-size:11px;color:var(--ink3);">${u.role} · ${u.organisation||'No org'}</div></div>${u.is_premium?'<span style="font-size:10px;background:#D1FAE5;color:#065F46;padding:2px 7px;border-radius:50px;font-weight:600;">Premium</span>':'<span style="font-size:10px;background:var(--bg3);color:var(--ink3);padding:2px 7px;border-radius:50px;">Free</span>'}</div>`).join('')}
      </div>
      <div class="card">
        <div style="font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Recent Payments</div>
        ${!payments.length?'<p style="font-size:13px;color:var(--ink3);">No payments yet.</p>':payments.slice(0,5).map(p=>{const u=users.find(x=>x.id===p.user_id);return`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);"><div style="font-size:22px;">💳</div><div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:500;color:var(--ink);">${u?.full_name||'Unknown'}</div><div style="font-size:11px;color:var(--ink3);font-family:monospace;">${p.reference?.slice(0,20)||'—'}</div></div><div style="text-align:right;"><div style="font-size:13px;font-weight:700;color:#065F46;">₦${(p.amount/100).toLocaleString()}</div><div style="font-size:10px;color:var(--ink3);">${new Date(p.created_at).toLocaleDateString()}</div></div></div>`;}).join('')}
      </div>`;

  }else if(t==='users'){
    el.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-size:13px;color:var(--ink3);">${users.length} total · ${prem} premium · ${users.length-prem} free</div>
      </div>
      <div class="card" style="overflow:hidden;">
        ${!users.length?'<p style="font-size:13px;color:var(--ink3);">No users yet.</p>':users.map(u=>`
          <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);">
            <div style="width:34px;height:34px;border-radius:50%;background:${u.role==='admin'?'#FEE2E2':u.role==='facilitator'?'#FEF3C7':'var(--accent)20'};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${u.role==='admin'?'#991B1B':u.role==='facilitator'?'#92400E':'var(--accent)'};flex-shrink:0;">${(u.full_name||'?')[0].toUpperCase()}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:500;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.full_name||'—'}</div>
              <div style="font-size:11px;color:var(--ink3);">${u.organisation||'No org'} · ${new Date(u.created_at).toLocaleDateString()}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
              <span class="tag ${u.role==='admin'?'tag-red':u.role==='facilitator'?'tag-gold':'tag-blue'}" style="font-size:10px;">${u.role}</span>
              <button onclick="togglePrem('${u.id}',${u.is_premium})" style="background:${u.is_premium?'#D1FAE5':'var(--bg3)'};color:${u.is_premium?'#065F46':'var(--ink2)'};border:none;border-radius:6px;padding:3px 8px;font-size:10px;cursor:pointer;">${u.is_premium?'✓ Premium':'Free'}</button>
            </div>
            <button onclick="delUsr('${u.id}')" style="background:#FEE2E2;color:#991B1B;border:none;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;">✕</button>
          </div>`).join('')}
      </div>`;

  }else if(t==='cohorts'){
    el.innerHTML=`
      <div style="font-size:13px;color:var(--ink3);margin-bottom:12px;">${cohorts.length} cohort${cohorts.length!==1?'s':''} total</div>
      ${!cohorts.length?'<div class="card"><p style="font-size:13px;color:var(--ink3);">No cohorts yet.</p></div>':cohorts.map(c=>{
        const facilitator=users.find(x=>x.id===c.facilitator_id);
        const enrolled=(enrollments).filter(x=>x.cohort_id===c.id);
        const cohortCerts=certs.filter(x=>x.cohort_id===c.id);
        return`<div class="card" style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--ink);">${c.name}</div>
              <div style="font-size:11px;color:var(--ink3);margin-top:2px;">${c.organisation||'No org'} · ${new Date(c.created_at).toLocaleDateString()}</div>
            </div>
            <button class="btn btn-outline btn-sm" style="width:auto;font-size:11px;" onclick='openCohort(${JSON.stringify(JSON.stringify(c))})'>View →</button>
          </div>
          <div style="display:flex;gap:12px;font-size:11px;color:var(--ink3);">
            <span>👤 Facilitator: <strong style="color:var(--ink);">${facilitator?.full_name||'Unknown'}</strong></span>
            <span>👥 Enrolled: <strong style="color:var(--ink);">${enrolled.length}</strong></span>
            <span>🎓 Certs: <strong style="color:var(--ink);">${cohortCerts.length}</strong></span>
          </div>
        </div>`;
      }).join('')}`;

  }else if(t==='cfi'){
    const preCFIs=cfis.filter(x=>x.type==='pre');
    const postCFIs=cfis.filter(x=>x.type==='post');
    const avgPre=preCFIs.length?Math.round(preCFIs.reduce((s,x)=>s+x.total_score,0)/preCFIs.length):null;
    const avgPost=postCFIs.length?Math.round(postCFIs.reduce((s,x)=>s+x.total_score,0)/postCFIs.length):null;
    el.innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
        ${[['Pre CFI',preCFIs.length,'#6366F1'],['Post CFI',postCFIs.length,'#10B981'],['Avg Pre Score',avgPre??'—','#C4952A']].map(([l,v,c])=>`<div class="card" style="text-align:center;padding:14px 6px;"><div style="font-family:'Fraunces',serif;font-size:24px;font-weight:700;color:${c};line-height:1;">${v}</div><div style="font-size:9px;color:var(--ink3);margin-top:4px;text-transform:uppercase;letter-spacing:.06em;">${l}</div></div>`).join('')}
      </div>
      <div class="card" style="overflow:hidden;">
        <div style="font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">All Assessments</div>
        ${!cfis.length?'<p style="font-size:13px;color:var(--ink3);">No assessments yet.</p>':cfis.map(c=>{
          const u=users.find(x=>x.id===c.participant_id);
          const lv=c.total_score>=70?{l:'High',col:'#991B1B',bg:'#FEE2E2'}:c.total_score>=40?{l:'Mod',col:'#92400E',bg:'#FEF3C7'}:{l:'Low',col:'#065F46',bg:'#D1FAE5'};
          return`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line);">
            <div style="width:36px;height:36px;border-radius:10px;background:${c.type==='pre'?'#EEF2FF':'#D1FAE5'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${c.type==='pre'?'#6366F1':'#065F46'};flex-shrink:0;">${c.type.toUpperCase()}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:500;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u?.full_name||'Unknown'}</div>
              <div style="font-size:11px;color:var(--ink3);">${new Date(c.taken_at).toLocaleDateString()}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-family:'Fraunces',serif;font-size:20px;font-weight:700;color:${lv.col};line-height:1;">${c.total_score}</div>
              <span style="font-size:9px;background:${lv.bg};color:${lv.col};padding:1px 6px;border-radius:50px;">${lv.l}</span>
            </div>
          </div>`;
        }).join('')}
      </div>`;

  }else if(t==='payments'){
    const total=payments.filter(x=>x.status==='success').reduce((s,x)=>s+x.amount,0)/100;
    el.innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
        <div class="card" style="text-align:center;padding:18px 8px;"><div style="font-family:'Fraunces',serif;font-size:28px;font-weight:700;color:#C4952A;">₦${total.toLocaleString()}</div><div style="font-size:10px;color:var(--ink3);margin-top:4px;text-transform:uppercase;letter-spacing:.07em;">Total Revenue</div></div>
        <div class="card" style="text-align:center;padding:18px 8px;"><div style="font-family:'Fraunces',serif;font-size:28px;font-weight:700;color:#10B981;">${payments.filter(x=>x.status==='success').length}</div><div style="font-size:10px;color:var(--ink3);margin-top:4px;text-transform:uppercase;letter-spacing:.07em;">Transactions</div></div>
      </div>
      <div class="card" style="overflow:hidden;">
        <div style="font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">All Payments</div>
        ${!payments.length?'<p style="font-size:13px;color:var(--ink3);">No payments yet.</p>':payments.map(p=>{
          const u=users.find(x=>x.id===p.user_id);
          return`<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line);">
            <div style="width:36px;height:36px;border-radius:10px;background:#D1FAE5;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">💳</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:500;color:var(--ink);">${u?.full_name||'Unknown'}</div>
              <div style="font-size:10px;color:var(--ink3);font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.reference||'—'}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:14px;font-weight:700;color:#065F46;">₦${(p.amount/100).toLocaleString()}</div>
              <div style="font-size:10px;color:var(--ink3);">${new Date(p.created_at).toLocaleDateString()}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`;

  }else if(t==='settings'){
    // Fetch current fee
    let currentFee='25,000';
    try{
      const{data}=await sb.from('settings').select('value').eq('key','facilitator_fee').single();
      if(data?.value)currentFee=(parseInt(data.value)/100).toLocaleString();
    }catch(e){}
    el.innerHTML=`
      <h3 style="font-size:15px;font-weight:600;margin-bottom:16px;">Platform Settings</h3>
      <div class="card" style="margin-bottom:14px;">
        <div style="font-size:13px;font-weight:500;margin-bottom:4px;">Facilitator Access Fee</div>
        <div style="font-size:12px;color:var(--ink3);margin-bottom:14px;">One-time fee facilitators pay to unlock the dashboard. Currently ₦${currentFee}.</div>
        <div class="field">
          <label class="lbl">New Fee (₦)</label>
          <input id="feeInput" class="inp" type="number" placeholder="e.g. 25000" style="font-size:14px;"/>
        </div>
        <div id="feeErr" style="display:none;font-size:12px;color:#991B1B;background:#FEE2E2;border-radius:8px;padding:10px 12px;margin-bottom:10px;"></div>
        <button class="btn btn-dark btn-sm" onclick="saveFacilitatorFee()" id="feeBtn" style="width:auto;">Save Fee →</button>
      </div>`;
  }
}

async function saveFacilitatorFee(){
  const inp=document.getElementById('feeInput');
  const btn=document.getElementById('feeBtn');
  const errEl=document.getElementById('feeErr');
  if(!inp||!btn)return;
  const val=parseInt(inp.value);
  if(!val||val<100){if(errEl){errEl.textContent='Enter a valid amount (minimum ₦100).';errEl.style.display='block';}return;}
  if(errEl)errEl.style.display='none';
  btn.textContent='Saving…';btn.disabled=true;
  try{
    const{error}=await sb.from('settings').update({value:String(val*100),updated_at:new Date().toISOString()}).eq('key','facilitator_fee');
    if(error)throw error;
    btn.textContent='✓ Saved!';btn.style.background='#10B981';
    inp.value='';
    setTimeout(()=>{btn.textContent='Save Fee →';btn.style.background='';btn.disabled=false;dashTab('settings');},1500);
  }catch(e){
    btn.textContent='Save Fee →';btn.disabled=false;
    if(errEl){errEl.textContent='Error: '+(e.message||'Could not save.');errEl.style.display='block';}
  }
}

async function togglePrem(uid,cur){await sb.from('profiles').update({is_premium:!cur}).eq('id',uid);renderDash();}
async function delUsr(uid){if(!confirm('Delete?'))return;await sb.from('profiles').delete().eq('id',uid);renderDash();}

async function createCohort(){
  const nEl=document.getElementById('cName'),oEl=document.getElementById('cOrg');
  const bEl=document.getElementById('cBtn'),eEl=document.getElementById('cErr');
  if(!nEl||!bEl)return;
  const n=nEl.value.trim(),o=oEl?oEl.value.trim():'';
  if(!n){if(eEl){eEl.textContent='Please enter a cohort name.';eEl.style.display='block';}return;}
  if(eEl)eEl.style.display='none';
  bEl.textContent='Creating…';bEl.disabled=true;
  try{
    const{data,error}=await sb.from('cohorts').insert({name:n,organisation:o,facilitator_id:S.user.id}).select().single();
    if(error)throw error;
    // Clear inputs
    nEl.value='';if(oEl)oEl.value='';
    bEl.textContent='✓ Created!';bEl.style.background='#10B981';
    // Append new cohort to list directly — no full re-render
    const list=document.getElementById('cohList');
    if(list){
      const empty=list.querySelector('p');if(empty)empty.remove();
      const card=document.createElement('div');
      card.className='card';
      card.style.cssText='margin-bottom:8px;display:flex;align-items:center;gap:12px;';
      card.innerHTML=`<div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:500;color:var(--ink);margin-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n}</div><div style="font-size:11px;color:var(--ink3);">${o||'—'} · ${new Date().toLocaleDateString()}</div></div><button class="btn btn-outline btn-sm" style="width:auto;flex-shrink:0;" onclick='openCohort(${JSON.stringify(JSON.stringify(data))})'>View</button>`;
      list.prepend(card);
    }
    setTimeout(()=>{bEl.textContent='Create →';bEl.style.background='';bEl.disabled=false;},1500);
  }catch(e){
    bEl.textContent='Create →';bEl.style.background='';bEl.disabled=false;
    if(eEl){eEl.textContent='Error: '+(e.message||'Could not create cohort. Check your connection.');eEl.style.display='block';}
  }
}

async function openCohort(raw){
  const c=typeof raw==='string'?JSON.parse(raw):raw;
  const el=document.getElementById('dashContent');
  el.innerHTML='<div class="dots" style="padding:40px 0;"><span></span><span></span><span></span></div>';
  const{data:en}=await sb.from('enrollments').select('participant_id').eq('cohort_id',c.id);
  let parts=[];
  if(en?.length){
    const ids=en.map(e=>e.participant_id);
    const[{data:pr},{data:cf},{data:lc},{data:ce}]=await Promise.all([
      sb.from('profiles').select('*').in('id',ids),
      sb.from('cfi_assessments').select('*').in('participant_id',ids).eq('cohort_id',c.id),
      sb.from('lesson_completions').select('*').in('participant_id',ids),
      sb.from('certificates').select('*').in('participant_id',ids).eq('cohort_id',c.id)
    ]);
    parts=(pr||[]).map(p=>({...p,pre:(cf||[]).find(x=>x.participant_id===p.id&&x.type==='pre'),post:(cf||[]).find(x=>x.participant_id===p.id&&x.type==='post'),lc:(lc||[]).filter(l=>l.participant_id===p.id).length,cert:!!(ce||[]).find(x=>x.participant_id===p.id)}));
  }
  const wb=parts.filter(p=>p.pre&&p.post),avg=wb.length?Math.round(wb.reduce((s,p)=>s+(p.pre.total_score-p.post.total_score),0)/wb.length):null;
  el.innerHTML=`
    <button onclick="renderDash()" style="background:none;border:none;font-size:13px;color:var(--ink3);cursor:pointer;margin-bottom:14px;display:flex;align-items:center;gap:4px;">← All Cohorts</button>
    <h2 style="font-family:'Fraunces',serif;font-size:20px;font-weight:600;margin-bottom:2px;">${c.name}</h2>
    <p style="font-size:12px;color:var(--ink3);margin-bottom:16px;">${c.organisation||''}</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
      ${[['Enrolled',parts.length,'#6366F1'],['Completed',parts.filter(p=>p.lc===5).length,'#10B981'],['Avg Delta',avg!==null?`-${avg}`:'—','#C4952A']].map(([l,v,c2])=>`<div class="card" style="text-align:center;padding:14px 8px;"><div style="font-family:'Fraunces',serif;font-size:26px;font-weight:700;color:${c2};">${v}</div><div style="font-size:10px;color:var(--ink3);margin-top:2px;text-transform:uppercase;letter-spacing:.05em;">${l}</div></div>`).join('')}
    </div>
    <div id="facMsg"></div>
    <div class="card" style="margin-bottom:12px;overflow:hidden;">
      <div style="font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">Participants (${parts.length})</div>
      ${!parts.length?'<p style="font-size:13px;color:var(--ink3);">No participants yet.</p>':`<div class="overflow"><table><thead><tr><th>Name</th><th>Pre</th><th>Post</th><th>L</th><th>Status</th><th></th></tr></thead><tbody>${parts.map(p=>{const d=p.pre&&p.post?p.pre.total_score-p.post.total_score:null;const lvc=s=>s>=70?'#991B1B':s>=40?'#92400E':'#065F46';return`<tr><td style="font-size:12px;color:var(--ink);">${p.full_name}</td><td>${p.pre?`<span style="color:${lvc(p.pre.total_score)};font-weight:500;">${p.pre.total_score}</span>`:'—'}</td><td>${p.post?`<span style="color:${lvc(p.post.total_score)};font-weight:500;">${p.post.total_score}</span>`:'—'}</td><td style="font-size:12px;">${p.lc}/5</td><td>${p.cert?'<span class="tag tag-green" style="font-size:10px;">Certified</span>':p.lc===5&&p.pre&&p.post?'<span class="tag tag-gold" style="font-size:10px;">Ready</span>':'<span class="tag" style="font-size:10px;">Active</span>'}</td><td>${!p.cert&&p.lc===5&&p.pre&&p.post?`<button class="btn btn-dark btn-sm" style="width:auto;padding:5px 10px;font-size:11px;" onclick="issueCert('${p.id}',${p.pre.total_score},${p.post.total_score},'${c.id}')">Certify</button>`:''}</td></tr>`;}).join('')}</tbody></table></div>`}
    </div>
    <div class="card">
      <div style="font-size:11px;font-weight:500;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Enrollment Code</div>
      <div style="font-family:monospace;font-size:12px;background:var(--bg3);border-radius:8px;padding:10px 12px;word-break:break-all;color:var(--ink2);">${c.id}</div>
    </div>`;
}

async function issueCert(pid,pre,post,cid){
  await sb.from('certificates').insert({participant_id:pid,cohort_id:cid,issued_by:S.user.id,pre_cfi:pre,post_cfi:post,clarity_delta:pre-post});
  const m=document.getElementById('facMsg');if(m){m.innerHTML='<div class="alert alert-ok">Certificate issued.</div>';setTimeout(()=>m.innerHTML='',3000);}
  // Refetch full cohort so openCohort has name, organisation, etc.
  const{data:cohort}=await sb.from('cohorts').select('*').eq('id',cid).single();
  if(cohort)openCohort(cohort);
}

// ENROLL
async function joinCohort(){
  const code=document.getElementById('enrollCode').value.trim();
  if(!code||!sb||!S.user)return;
  document.getElementById('enrollErr').style.display='none';
  const{data:c,error}=await sb.from('cohorts').select('*').eq('id',code).single();
  if(error||!c){err('enrollErr','Cohort not found. Check the code.');return;}
  await sb.from('enrollments').upsert({cohort_id:c.id,participant_id:S.user.id});
  S.cohort=c;
  const ok=document.getElementById('enrollOk');ok.textContent=`Enrolled in "${c.name}"`;ok.style.display='block';
  setTimeout(()=>{renderLessons();show('lessons');},1200);
}

// HELPERS
function err(id,msg){const e=document.getElementById(id);if(e){e.textContent=msg;e.style.display='block';}}

// CERTIFICATE
function openCert(){
  const cert=S.certs&&S.certs.length?S.certs[S.certs.length-1]:null;
  const name=S.profile?.full_name||'Participant';
  const cohortName=S.cohort?.name||'NeuralFusion™ Programme';
  const pre=cert?.pre_cfi??S.preCFI??'—';
  const post=cert?.post_cfi??S.postCFI??'—';
  const delta=cert?.clarity_delta??(typeof pre==='number'&&typeof post==='number'?pre-post:'—');
  const issuedAt=cert?.issued_at?new Date(cert.issued_at):new Date();
  const dateStr=issuedAt.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const certId='NF-'+( cert?.id?.slice(0,8).toUpperCase()||Date.now().toString(36).toUpperCase());

  document.getElementById('certNameDisplay').textContent=name;
  document.getElementById('certDescDisplay').innerHTML=`for successfully completing the NeuralFusion™ Cognitive Skills Programme, demonstrating mastery of the four thinking modes, the Synthesis Framework, and the Core Loop in <strong>${cohortName}</strong>.`;
  document.getElementById('certPreDisplay').textContent=pre;
  document.getElementById('certPostDisplay').textContent=post;
  document.getElementById('certDeltaDisplay').textContent=typeof delta==='number'?(delta>=0?'+'+delta:delta):delta;
  document.getElementById('certDateDisplay').textContent=dateStr;
  document.getElementById('certIdDisplay').textContent=certId;
  show('cert');
}

async function certDownloadPNG(){
  const btn=document.getElementById('certPngBtn');
  btn.textContent='Generating…';btn.disabled=true;
  await certLoadLibs();
  try{
    const card=document.getElementById('certCard');
    const canvas=await html2canvas(card,{scale:3,backgroundColor:'#ffffff',useCORS:true,logging:false});
    const link=document.createElement('a');
    const name=(S.profile?.full_name||'Certificate').replace(/\s+/g,'_');
    link.download=name+'_NeuralFusion_Certificate.png';
    link.href=canvas.toDataURL('image/png');
    link.click();
  }catch(e){alert('Could not generate PNG. Please try again.');}
  btn.textContent='🖼 Download PNG';btn.disabled=false;
}

async function certDownloadPDF(){
  const btn=document.getElementById('certPdfBtn');
  btn.textContent='Generating…';btn.disabled=true;
  await certLoadLibs();
  try{
    const card=document.getElementById('certCard');
    const canvas=await html2canvas(card,{scale:3,backgroundColor:'#ffffff',useCORS:true,logging:false});
    const{jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    const pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
    const ratio=canvas.width/canvas.height;
    let iw=pw,ih=iw/ratio;
    if(ih>ph){ih=ph;iw=ih*ratio;}
    pdf.addImage(canvas.toDataURL('image/png'),'PNG',(pw-iw)/2,(ph-ih)/2,iw,ih);
    const name=(S.profile?.full_name||'Certificate').replace(/\s+/g,'_');
    pdf.save(name+'_NeuralFusion_Certificate.pdf');
  }catch(e){alert('Could not generate PDF. Please try again.');}
  btn.textContent='📄 Download PDF';btn.disabled=false;
}

function certLoadLibs(){
  return new Promise(resolve=>{
    if(window.html2canvas&&window.jspdf){resolve();return;}
    let loaded=0;const done=()=>{if(++loaded===2)resolve();};
    if(!window.html2canvas){const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';s.onload=done;document.head.appendChild(s);}else done();
    if(!window.jspdf){const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=done;document.head.appendChild(s);}else done();
  });
}

// BOOT
async function boot(){
  if(!sb){show('landing');return;}
  // Secret admin access via URL hash
  if(window.location.hash==='#nf-admin-2026'){
    try{
      const{data:{session}}=await sb.auth.getSession();
      if(session){await initUser();}else{goAuth('login');sessionStorage.setItem('nf_admin_intent','1');}
    }catch(e){show('landing');}
    return;
  }
  try{
    const{data:{session}}=await sb.auth.getSession();
    if(session)await initUser();else show('landing');
    sb.auth.onAuthStateChange(async(_,session)=>{if(session&&!S.user)await initUser();else if(!session){S.user=null;S.profile=null;}});
  }catch(e){show('landing');}
}

// Show landing immediately — no loader stare while scripts download
// Initialise Supabase once the deferred script has loaded
show('landing');
(function waitForSupabase(){
  if(window.supabase){
    try{sb=supabase.createClient(SURL,SKEY);}catch(e){sb=null;}
    boot();
  }else{
    setTimeout(waitForSupabase,50);
  }
})();
