import { questionFingerprint,normalizeSeedCode } from './question-engine.js';

export const RECENT_QUESTION_LIMIT=60;
export const REVIEW_INTERVAL_DAYS=[0,1,3,7,14,30,60];

export const SKILL_DEPENDENCIES={
  caesar:[],
  vigenere:['caesar'],
  classical:['caesar','vigenere'],
  xor:[],
  stream:['xor'],
  aes:['xor'],
  modes:['aes'],
  modular:[],
  gcd:['modular'],
  inverse:['gcd','modular'],
  modexp:['modular'],
  phi:['gcd','modular'],
  primitive:['modexp','modular'],
  crt:['modular','inverse'],
  dh:['modexp','primitive'],
  mitm:['dh'],
  asymmetric:['modular'],
  rsa:['phi','inverse','modexp'],
  hash:[],
  integrity:['hash'],
  ibe:['asymmetric'],
  abe:['asymmetric','access'],
  access:[],
  attacks:['classical','modes','hash'],
  protocols:['attacks','integrity'],
  signatures:['hash','asymmetric'],
  pki:['signatures'],
  tls:['pki','modes','dh'],
  pqc:['asymmetric'],
  kem:['pqc','asymmetric'],
  migration:['pqc','pki','tls']
};

function nowISO(){return new Date().toISOString();}
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}

export function ensureLearningState(state){
  state.questionHistory=Array.isArray(state.questionHistory)?state.questionHistory:[];
  state.mistakes=state.mistakes&&typeof state.mistakes==='object'&&!Array.isArray(state.mistakes)?state.mistakes:{};
  state.sessionSeeds=Array.isArray(state.sessionSeeds)?state.sessionSeeds:[];
  state.practiceStats=state.practiceStats&&typeof state.practiceStats==='object'?state.practiceStats:{quick:{runs:0,best:0},exam:{runs:0,best:0},endless:{runs:0,best:0},review:{runs:0,best:0}};
  return state;
}

export function recentQuestionKeySet(state,limit=RECENT_QUESTION_LIMIT){
  ensureLearningState(state);
  return new Set(state.questionHistory.slice(-limit).map(x=>typeof x==='string'?x:x.key).filter(Boolean));
}

export function rememberQuestion(state,question,{source='mission',seed=''}={}){
  ensureLearningState(state);
  const key=questionFingerprint(question);
  if(!key) return;
  const last=state.questionHistory[state.questionHistory.length-1];
  if(!last || (typeof last==='string'?last:last.key)!==key){
    state.questionHistory.push({key,skill:question.skill||'',source,seed:seed||'',at:nowISO()});
  }
  if(state.questionHistory.length>200) state.questionHistory=state.questionHistory.slice(-200);
}

export function answerLabel(question){
  if(question?.type==='choice') return String(question.options?.[Number(question.answer)]??question.answer??'');
  if(question?.type==='interactive' && question.answerLabel) return String(question.answerLabel);
  return String(question?.answer??'');
}

export function questionSnapshot(question){
  return {
    type:question.type||'choice',
    prompt:String(question.prompt||''),
    options:Array.isArray(question.options)?[...question.options]:undefined,
    answer:question.answer,
    accepted:Array.isArray(question.accepted)?[...question.accepted]:[],
    mechanic:question.mechanic||undefined,
    data:question.data?structuredClone(question.data):undefined,
    answerLabel:question.answerLabel||undefined,
    skill:question.skill||'',
    explanation:question.explanation||'',
    hint:question.hint||'',
    newbie:question.newbie||question.explanation||'',
    deep:question.deep||question.explanation||''
  };
}

export function recordLearningOutcome(state,question,correct,{source='mission',seed=''}={}){
  ensureLearningState(state);
  rememberQuestion(state,question,{source,seed});
  const key=questionFingerprint(question);
  if(!key) return null;
  const existing=state.mistakes[key];
  if(!correct){
    const rec=existing||{
      key,
      question:questionSnapshot(question),
      answer:answerLabel(question),
      wrongCount:0,
      correctCount:0,
      level:0,
      streak:0,
      firstWrong:nowISO(),
      resolved:false
    };
    rec.question=questionSnapshot(question);
    rec.answer=answerLabel(question);
    rec.wrongCount=(rec.wrongCount||0)+1;
    rec.streak=0;
    rec.level=clamp((rec.level||0)-1,0,REVIEW_INTERVAL_DAYS.length-1);
    rec.lastWrong=nowISO();
    rec.lastSeen=nowISO();
    rec.nextReview=Date.now();
    rec.resolved=false;
    rec.source=source;
    rec.seed=seed||rec.seed||'';
    state.mistakes[key]=rec;
    return rec;
  }
  if(existing){
    existing.correctCount=(existing.correctCount||0)+1;
    existing.streak=(existing.streak||0)+1;
    existing.level=clamp((existing.level||0)+1,0,REVIEW_INTERVAL_DAYS.length-1);
    existing.lastCorrect=nowISO();
    existing.lastSeen=nowISO();
    const days=REVIEW_INTERVAL_DAYS[existing.level]??60;
    existing.nextReview=Date.now()+days*86400000;
    existing.resolved=existing.level>=5 && existing.streak>=3;
    state.mistakes[key]=existing;
    return existing;
  }
  return null;
}

export function dueMistakes(state,now=Date.now()){
  ensureLearningState(state);
  return Object.values(state.mistakes)
    .filter(r=>!r.resolved && Number(r.nextReview||0)<=now)
    .sort((a,b)=>(Number(a.nextReview||0)-Number(b.nextReview||0)) || ((b.wrongCount||0)-(a.wrongCount||0)));
}

export function activeMistakes(state){
  ensureLearningState(state);
  return Object.values(state.mistakes)
    .filter(r=>!r.resolved)
    .sort((a,b)=>((b.wrongCount||0)-(a.wrongCount||0)) || String(b.lastWrong||'').localeCompare(String(a.lastWrong||'')));
}

export function nextReviewLabel(record,now=Date.now()){
  if(record.resolved) return 'Mastered';
  const diff=Number(record.nextReview||0)-now;
  if(diff<=0) return 'Due now';
  const hours=Math.ceil(diff/3600000);
  if(hours<24) return `In ${hours}h`;
  const days=Math.ceil(diff/86400000);
  return `In ${days}d`;
}

export function skillRateFromState(state,id){
  const r=state.skills?.[id];
  return r?.attempts?r.correct/r.attempts:0;
}

export function skillDependencyInsights(state,skillDefs){
  const names=Object.fromEntries((skillDefs||[]).map(s=>[s.id,s.name]));
  const rows=[];
  for(const skill of skillDefs||[]){
    const record=state.skills?.[skill.id]||{attempts:0,correct:0};
    const rate=record.attempts?record.correct/record.attempts:0;
    const deps=SKILL_DEPENDENCIES[skill.id]||[];
    const weakDeps=deps.filter(d=>{
      const dr=state.skills?.[d];
      return !dr || dr.attempts<3 || dr.correct/dr.attempts<0.7;
    });
    let status='unmeasured';
    if(record.attempts>=3) status=rate>=0.85?'strong':rate>=0.65?'developing':'needs-work';
    rows.push({id:skill.id,name:skill.name,attempts:record.attempts||0,rate,dependencies:deps,dependencyNames:deps.map(d=>names[d]||d),weakDependencies:weakDeps,weakDependencyNames:weakDeps.map(d=>names[d]||d),status});
  }
  return rows;
}

export function recommendedFoundation(state,skillDefs){
  const insights=skillDependencyInsights(state,skillDefs);
  const target=insights
    .filter(x=>x.attempts>=3 && x.rate<0.65 && x.weakDependencies.length)
    .sort((a,b)=>a.rate-b.rate)[0];
  if(!target) return null;
  const dependency=target.weakDependencies
    .map(id=>insights.find(x=>x.id===id))
    .filter(Boolean)
    .sort((a,b)=>a.rate-b.rate)[0];
  return dependency?{target,dependency}:null;
}

function randomHex(length=8){
  const bytes=new Uint8Array(Math.ceil(length/2));
  if(globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for(let i=0;i<bytes.length;i++) bytes[i]=Math.floor(Math.random()*256);
  return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,length).toUpperCase();
}

export function createSessionSeed({type='M',id='unknown',difficulty='explorer'}={}){
  const safeId=String(id).toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,30)||'UNKNOWN';
  const diff=String(difficulty).toUpperCase().slice(0,3);
  return `CQ32-${type}-${safeId}-${diff}-${randomHex(8)}`;
}

export function registerSessionSeed(state,seed){
  ensureLearningState(state);
  const normalized=normalizeSeedCode(seed);
  if(!normalized) return;
  state.sessionSeeds=state.sessionSeeds.filter(x=>x.code!==normalized);
  state.sessionSeeds.unshift({code:normalized,at:nowISO()});
  state.sessionSeeds=state.sessionSeeds.slice(0,20);
}

export function parseSessionSeed(seed){
  const code=normalizeSeedCode(seed);
  const parts=code.split('-');
  if(parts[0]!=='CQ32' || parts.length<5) return null;
  const type=parts[1];
  const random=parts.pop();
  const diff=parts.pop();
  const id=parts.slice(2).join('-').toLowerCase();
  const difficultyMap={EXP:'explorer',ANA:'analyst',CRY:'cryptographer',NIG:'nightmare'};
  return {code,type,id,difficulty:difficultyMap[diff]||'explorer',random};
}

export function recordPracticeRun(state,type,score,total){
  ensureLearningState(state);
  const row=state.practiceStats[type]||(state.practiceStats[type]={runs:0,best:0});
  row.runs=(row.runs||0)+1;
  const pct=total?Math.round(score/total*100):0;
  row.best=Math.max(row.best||0,pct);
  row.last=pct;
  row.lastAt=nowISO();
}
