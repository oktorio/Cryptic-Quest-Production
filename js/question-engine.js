export function questionFingerprint(question){
  return String(question?.prompt||'')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[“”‘’]/g,"'")
    .replace(/[^\p{L}\p{N}\s{}()=+\-×÷⊕≡⁻^.,:?]/gu,'')
    .replace(/\s+/g,' ')
    .trim();
}

export function uniqueQuestions(questions){
  const seen=new Set();
  const result=[];
  for(const q of questions||[]){
    const key=questionFingerprint(q);
    if(!key || seen.has(key)) continue;
    seen.add(key);
    result.push(q);
  }
  return result;
}

export function hashSeed(value){
  const text=String(value ?? '');
  let h=2166136261 >>> 0;
  for(let i=0;i<text.length;i++){
    h ^= text.charCodeAt(i);
    h = Math.imul(h,16777619) >>> 0;
  }
  return h || 1;
}

export function createSeededRandom(seed){
  let x=hashSeed(seed) >>> 0;
  return ()=>{
    x=(Math.imul(x,1664525)+1013904223)>>>0;
    return x/4294967296;
  };
}

export function seededShuffle(array,rng){
  const copy=[...array];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(rng()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}

export function withSeededMathRandom(seed,fn){
  const original=Math.random;
  Math.random=createSeededRandom(seed);
  try{return fn();}finally{Math.random=original;}
}

export function selectUniqueStaticQuestions(pool,desired,shuffleFn,excludedKeys=new Set()){
  const uniquePool=uniqueQuestions(pool);
  const fresh=uniquePool.filter(q=>!excludedKeys.has(questionFingerprint(q)));
  const old=uniquePool.filter(q=>excludedKeys.has(questionFingerprint(q)));
  const ordered=[...shuffleFn([...fresh]),...shuffleFn([...old])];
  return ordered.slice(0,Math.min(desired,ordered.length)).map(q=>structuredClone(q));
}

export function generateUniqueQuestions(generator,desired,shuffleFn,maxAttempts=Math.max(350,desired*120),excludedKeys=new Set()){
  const fresh=[];
  const fallback=[];
  const seen=new Set();
  for(let attempt=0;attempt<maxAttempts && fresh.length<desired;attempt++){
    const q=generator();
    const key=questionFingerprint(q);
    if(!key || seen.has(key)) continue;
    seen.add(key);
    if(excludedKeys.has(key)) fallback.push(q); else fresh.push(q);
  }
  if(fresh.length<desired){
    for(const q of fallback){
      if(fresh.length>=desired) break;
      fresh.push(q);
    }
  }
  return shuffleFn(fresh.slice(0,desired));
}

export function normalizeSeedCode(value){
  return String(value||'').trim().toUpperCase().replace(/\s+/g,'');
}
