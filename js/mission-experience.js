import { squareMultiplySteps } from './crypto-utils.js';
import { createSeededRandom } from './question-engine.js';
import { createInteractiveChallenge } from './interactive-missions.js';

const EXPERIENCE_MISSIONS = new Set(['numbers-3','exchange-2','publickey-2']);

function esc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
function normalize(value){return String(value??'').trim().replace(/\s+/g,'').toLowerCase();}
function pick(list,rng){return list[Math.floor(rng()*list.length)];}
function int(min,max,rng){return min+Math.floor(rng()*(max-min+1));}

function modexpWorkbench(seed,difficulty='explorer'){
  const rng=createSeededRandom(`${seed}|mission2|modexp`);
  const scale=difficulty==='nightmare'?4:difficulty==='cryptographer'?3:difficulty==='analyst'?2:1;
  const moduli=scale>=3?[17,19,23,29,31,37]:[7,11,13,17,19];
  const modulus=pick(moduli,rng);
  const base=int(2,modulus-2,rng);
  const exponent=int(scale>=3?13:5,scale>=4?63:scale>=3?39:scale>=2?25:15,rng);
  const trace=squareMultiplySteps(base,exponent,modulus);
  const expectedBinary=trace.bits;
  const result=String(trace.result);
  const traceRows=trace.steps.map((step,index)=>({
    index:index+1,
    bit:String(step.bit),
    square:String(step.squareResult),
    multiply:step.multiplyResult===null?null:String(step.multiplyResult)
  }));
  return {
    type:'interactive',experience:'2.0',mechanic:'modexp-workbench',skill:'modexp',
    prompt:`Power reactor: compute ${base}^${exponent} mod ${modulus} with square-and-multiply. Verify the exponent's binary form first, then finish the modular result.`,
    answer:`${expectedBinary}|${result}`,
    answerLabel:`${exponent} in binary = ${expectedBinary}; ${base}^${exponent} mod ${modulus} = ${result}`,
    explanation:`${exponent} = (${expectedBinary})₂. Square-and-multiply reduces after every operation and gives ${base}^${exponent} mod ${modulus} = ${result}.`,
    hint:`Convert ${exponent} to binary first. Read the bits left to right: square the running result for every bit, and multiply by ${base} when the bit is 1. Reduce modulo ${modulus} every time.`,
    newbie:'Large powers become manageable when you break the exponent into binary. Instead of calculating the huge power directly, repeatedly square, sometimes multiply, and keep only the remainder.',
    deep:'Binary exponentiation evaluates the exponent using O(log e) modular multiplications. Reducing modulo n after each multiplication preserves the final residue while preventing intermediate values from exploding.',
    data:{base,exponent,modulus,expectedBinary,result,traceRows}
  };
}

export function hasMissionExperience(missionId){return EXPERIENCE_MISSIONS.has(String(missionId||''));}
export function missionExperienceIds(){return [...EXPERIENCE_MISSIONS];}

export function createMissionExperienceChallenge(mission,seed,difficulty='explorer'){
  if(!mission || !hasMissionExperience(mission.id)) return null;
  if(mission.id==='numbers-3') return modexpWorkbench(seed,difficulty);
  const base=createInteractiveChallenge(mission,seed,difficulty);
  if(!base) return null;
  if(mission.id==='publickey-2'){
    return {...base,experience:'2.0',prompt:'RSA Forge 2.0: build the key in order. Verify n, then φ(n), then d, then encrypt the plaintext. Each correct stage unlocks the next.'};
  }
  if(mission.id==='exchange-2'){
    return {...base,experience:'2.0',prompt:'Shared Secret 2.0: derive Alice and Bob’s public values separately. When both are verified, derive and verify the shared secret.'};
  }
  return null;
}

function statusHTML(key,label='Ready'){
  return `<span class="mission-step-status ${label==='Locked'?'locked':''}" data-step-status="${key}">${label}</span>`;
}

function rsaHTML(q){
  const d=q.data;
  return `<div class="interactive-panel mission-experience-panel" data-experience="2.0" data-interactive="rsa-forge">
    <div class="interactive-toolbar"><span>🔑 RSA FORGE 2.0</span><small>Verify each stage to unlock the next</small></div>
    <div class="mission-stage-strip" aria-label="RSA stage progress"><span data-stage-dot="n" class="active">1</span><i></i><span data-stage-dot="phi">2</span><i></i><span data-stage-dot="d">3</span><i></i><span data-stage-dot="c">4</span></div>
    <div class="forge-givens"><span>p <strong>${d.p}</strong></span><span>q <strong>${d.q}</strong></span><span>public e <strong>${d.e}</strong></span><span>plaintext M <strong>${d.m}</strong></span></div>
    <div class="mission-stage-grid">
      <section class="mission-stage-card active" data-stage="n"><header><span class="mission-stage-number">01</span><div><small>MODULUS</small><strong>Build n</strong></div>${statusHTML('n')}</header><p class="mission-stage-formula">n = p × q</p><label>n <input class="interactive-input" data-field="n" inputmode="numeric" autocomplete="off"></label><div class="mission-stage-actions"><button type="button" class="secondary-btn mission-step-verify" data-verify="n">Verify n</button></div><p class="mission-stage-why"><strong>Why:</strong> n becomes the public modulus used by both encryption and decryption.</p></section>
      <section class="mission-stage-card locked" data-stage="phi"><header><span class="mission-stage-number">02</span><div><small>TOTIENT</small><strong>Count invertible residues</strong></div>${statusHTML('phi','Locked')}</header><p class="mission-stage-formula">φ(n) = (p−1)(q−1)</p><label>φ(n) <input class="interactive-input" data-field="phi" inputmode="numeric" autocomplete="off" disabled></label><div class="mission-stage-actions"><button type="button" class="secondary-btn mission-step-verify" data-verify="phi" disabled>Verify φ(n)</button></div><p class="mission-stage-why"><strong>Why:</strong> e and d are inverses in this totient modulus.</p></section>
      <section class="mission-stage-card locked" data-stage="d"><header><span class="mission-stage-number">03</span><div><small>PRIVATE EXPONENT</small><strong>Undo e</strong></div>${statusHTML('d','Locked')}</header><p class="mission-stage-formula">e × d ≡ 1 (mod φ(n))</p><label>d <input class="interactive-input" data-field="d" inputmode="numeric" autocomplete="off" disabled></label><div class="mission-stage-actions"><button type="button" class="secondary-btn mission-step-verify" data-verify="d" disabled>Verify d</button></div><p class="mission-stage-why"><strong>Why:</strong> d is the modular inverse that reverses the public exponent in the RSA arithmetic.</p></section>
      <section class="mission-stage-card locked" data-stage="c"><header><span class="mission-stage-number">04</span><div><small>ENCRYPT</small><strong>Seal the plaintext</strong></div>${statusHTML('c','Locked')}</header><p class="mission-stage-formula">C = M<sup>e</sup> mod n</p><label>C <input class="interactive-input" data-field="c" inputmode="numeric" autocomplete="off" disabled></label><div class="mission-stage-actions"><button type="button" class="secondary-btn mission-step-verify" data-verify="c" disabled>Verify ciphertext</button></div><p class="mission-stage-why"><strong>Why:</strong> modular exponentiation maps the plaintext into the ciphertext space under the public key.</p></section>
    </div>
    <div class="mission-experience-ready" data-experience-ready hidden>✓ All RSA stages verified. Press <strong>Check answer</strong> to complete this layer.</div>
  </div>`;
}

function dhHTML(q){
  const d=q.data;
  return `<div class="interactive-panel mission-experience-panel" data-experience="2.0" data-interactive="dh-exchange">
    <div class="interactive-toolbar"><span>⇄ SHARED SECRET 2.0</span><small>p=${d.p} · g=${d.g}</small></div>
    <div class="mission-stage-strip" aria-label="Diffie-Hellman stage progress"><span data-stage-dot="public" class="active">1</span><i></i><span data-stage-dot="shared">2</span></div>
    <div class="mission-stage-grid two-column">
      <section class="mission-stage-card active" data-stage="A"><header><span class="actor-icon">A</span><div><small>ALICE</small><strong>Publish A</strong></div>${statusHTML('A')}</header><p class="mission-stage-formula">A = g<sup>a</sup> mod p</p><p>private a = <strong>${d.a}</strong></p><label>A <input class="interactive-input" data-field="A" inputmode="numeric" autocomplete="off"></label><div class="mission-stage-actions"><button type="button" class="secondary-btn mission-step-verify" data-verify="A">Verify A</button></div><p class="mission-stage-why"><strong>Why:</strong> Alice can publish A while keeping a private.</p></section>
      <section class="mission-stage-card active" data-stage="B"><header><span class="actor-icon">B</span><div><small>BOB</small><strong>Publish B</strong></div>${statusHTML('B')}</header><p class="mission-stage-formula">B = g<sup>b</sup> mod p</p><p>private b = <strong>${d.b}</strong></p><label>B <input class="interactive-input" data-field="B" inputmode="numeric" autocomplete="off"></label><div class="mission-stage-actions"><button type="button" class="secondary-btn mission-step-verify" data-verify="B">Verify B</button></div><p class="mission-stage-why"><strong>Why:</strong> Bob publishes a one-way modular-exponentiation result rather than b itself.</p></section>
      <section class="mission-stage-card locked span-two" data-stage="K"><header><span class="mission-stage-number">02</span><div><small>SHARED SECRET</small><strong>Converge on K</strong></div>${statusHTML('K','Locked')}</header><p class="mission-stage-formula">K = B<sup>a</sup> mod p = A<sup>b</sup> mod p</p><label>K <input class="interactive-input" data-field="K" inputmode="numeric" autocomplete="off" disabled></label><div class="mission-stage-actions"><button type="button" class="secondary-btn mission-step-verify" data-verify="K" disabled>Verify shared secret</button></div><p class="mission-stage-why"><strong>Why:</strong> both sides reach g<sup>ab</sup> without sending the shared secret itself.</p></section>
    </div>
    <div class="mission-experience-ready" data-experience-ready hidden>✓ Both public values and the shared secret are verified. Press <strong>Check answer</strong>.</div>
  </div>`;
}

function modexpHTML(q){
  const d=q.data;
  return `<div class="interactive-panel mission-experience-panel" data-experience="2.0" data-interactive="modexp-workbench">
    <div class="interactive-toolbar"><span>⚡ EXPONENT REACTOR 2.0</span><small>${d.base}<sup>${d.exponent}</sup> mod ${d.modulus}</small></div>
    <div class="mission-stage-strip" aria-label="Modular exponentiation stage progress"><span data-stage-dot="binary" class="active">1</span><i></i><span data-stage-dot="result">2</span></div>
    <div class="mission-stage-grid two-column">
      <section class="mission-stage-card active" data-stage="binary"><header><span class="mission-stage-number">01</span><div><small>DECOMPOSE</small><strong>Convert the exponent</strong></div>${statusHTML('binary')}</header><p class="mission-stage-formula">${d.exponent}<sub>10</sub> = ?<sub>2</sub></p><label>Binary exponent <input class="interactive-input binary-input" data-field="binary" inputmode="numeric" autocomplete="off" placeholder="Example: 1101"></label><div class="mission-stage-actions"><button type="button" class="secondary-btn mission-step-verify" data-verify="binary">Verify binary form</button></div><p class="mission-stage-why"><strong>Why:</strong> the bits tell square-and-multiply exactly when a multiplication by the base is needed.</p></section>
      <section class="mission-stage-card locked" data-stage="result"><header><span class="mission-stage-number">02</span><div><small>REACTOR OUTPUT</small><strong>Finish the residue</strong></div>${statusHTML('result','Locked')}</header><p class="mission-stage-formula">${d.base}<sup>${d.exponent}</sup> mod ${d.modulus}</p><label>Final residue <input class="interactive-input" data-field="result" inputmode="numeric" autocomplete="off" disabled></label><div class="mission-stage-actions"><button type="button" class="secondary-btn mission-step-verify" data-verify="result" disabled>Verify final residue</button></div><p class="mission-stage-why"><strong>Why:</strong> reducing after every square/multiply keeps the numbers small without changing the final modular result.</p></section>
    </div>
    <div class="modexp-trace" data-modexp-trace hidden><header><strong>Square-and-multiply trace</strong><small>Read the verified binary exponent left → right</small></header><div class="modexp-trace-grid">${d.traceRows.map(row=>`<div class="modexp-trace-row"><span>bit ${esc(row.bit)}</span><code>square → ${esc(row.square)}</code>${row.multiply===null?'<em>no multiply</em>':`<code>× ${d.base} → ${esc(row.multiply)}</code>`}</div>`).join('')}</div></div>
    <div class="mission-experience-ready" data-experience-ready hidden>✓ Binary decomposition and final modular residue verified. Press <strong>Check answer</strong>.</div>
  </div>`;
}

export function renderMissionExperienceChallenge(q){
  if(q?.experience!=='2.0') return '';
  if(q.mechanic==='rsa-forge') return rsaHTML(q);
  if(q.mechanic==='dh-exchange') return dhHTML(q);
  if(q.mechanic==='modexp-workbench') return modexpHTML(q);
  return '';
}

function setStatus(root,key,state,text){
  const status=root.querySelector(`[data-step-status="${key}"]`);
  if(status){status.className=`mission-step-status ${state}`;status.textContent=text;}
  const card=root.querySelector(`[data-stage="${key}"]`);
  if(card){card.classList.toggle('verified',state==='good');card.classList.toggle('has-error',state==='bad');if(state!=='locked')card.classList.remove('locked');}
  const dotKey=(key==='A'||key==='B')?'public':key;
  const dot=root.querySelector(`[data-stage-dot="${dotKey}"]`);
  if(dot && state==='good') dot.classList.add('verified');
}

function enableStage(root,key){
  const card=root.querySelector(`[data-stage="${key}"]`);if(card){card.classList.remove('locked');card.classList.add('active');}
  const input=root.querySelector(`[data-field="${key}"]`);if(input) input.disabled=false;
  const button=root.querySelector(`[data-verify="${key}"]`);if(button) button.disabled=false;
  setStatus(root,key,'ready','Ready');
}

function lockStage(root,key){
  const card=root.querySelector(`[data-stage="${key}"]`);if(card){card.classList.add('locked');card.classList.remove('active','verified','has-error');}
  const input=root.querySelector(`[data-field="${key}"]`);if(input) input.disabled=true;
  const button=root.querySelector(`[data-verify="${key}"]`);if(button) button.disabled=true;
  setStatus(root,key,'locked','Locked');
}

function missionSubmit(root){return root?.matches?.('#missionBody')?document.querySelector('#submitMissionBtn'):null;}
function setReady(root,ready){
  const banner=root.querySelector('[data-experience-ready]');if(banner) banner.hidden=!ready;
  const submit=missionSubmit(root);if(submit) submit.disabled=!ready;
  root.querySelector('.mission-experience-panel')?.classList.toggle('experience-ready',ready);
}
function valueFor(root,key){return root.querySelector(`[data-field="${key}"]`)?.value?.trim()||'';}
function expected(q,key){return String(q.data?.[key]??'');}
function isGood(root,key){return root.querySelector(`[data-step-status="${key}"]`)?.classList.contains('good')||false;}

function bindRsa(q,root){
  const keys=['n','phi','d','c'];
  const resetFrom=index=>{
    setReady(root,false);
    keys.forEach((key,i)=>{
      if(i<index && isGood(root,key)) return;
      if(i===index){enableStage(root,key);setStatus(root,key,'ready','Ready');}
      if(i>index) lockStage(root,key);
    });
  };
  setReady(root,false);lockStage(root,'phi');lockStage(root,'d');lockStage(root,'c');enableStage(root,'n');
  keys.forEach((key,index)=>{
    const input=root.querySelector(`[data-field="${key}"]`);
    input?.addEventListener('input',()=>resetFrom(index));
    root.querySelector(`[data-verify="${key}"]`)?.addEventListener('click',()=>{
      if(normalize(valueFor(root,key))!==normalize(expected(q,key))){setStatus(root,key,'bad','Try again');return;}
      setStatus(root,key,'good','Verified');
      const button=root.querySelector(`[data-verify="${key}"]`);if(button)button.disabled=true;
      if(index<keys.length-1){enableStage(root,keys[index+1]);root.querySelector(`[data-field="${keys[index+1]}"]`)?.focus();}
      else setReady(root,true);
    });
  });
}

function bindDh(q,root){
  setReady(root,false);enableStage(root,'A');enableStage(root,'B');lockStage(root,'K');
  const resetPublic=key=>{setReady(root,false);setStatus(root,key,'ready','Ready');const btn=root.querySelector(`[data-verify="${key}"]`);if(btn)btn.disabled=false;lockStage(root,'K');};
  ['A','B'].forEach(key=>{
    root.querySelector(`[data-field="${key}"]`)?.addEventListener('input',()=>resetPublic(key));
    root.querySelector(`[data-verify="${key}"]`)?.addEventListener('click',()=>{
      if(normalize(valueFor(root,key))!==normalize(expected(q,key))){setStatus(root,key,'bad','Try again');return;}
      setStatus(root,key,'good','Verified');const btn=root.querySelector(`[data-verify="${key}"]`);if(btn)btn.disabled=true;
      if(isGood(root,'A')&&isGood(root,'B')){const dot=root.querySelector('[data-stage-dot="public"]');dot?.classList.add('verified');enableStage(root,'K');root.querySelector('[data-field="K"]')?.focus();}
    });
  });
  root.querySelector('[data-field="K"]')?.addEventListener('input',()=>{setReady(root,false);setStatus(root,'K','ready','Ready');const btn=root.querySelector('[data-verify="K"]');if(btn)btn.disabled=false;});
  root.querySelector('[data-verify="K"]')?.addEventListener('click',()=>{
    if(normalize(valueFor(root,'K'))!==normalize(expected(q,'K'))){setStatus(root,'K','bad','Try again');return;}
    setStatus(root,'K','good','Verified');const btn=root.querySelector('[data-verify="K"]');if(btn)btn.disabled=true;setReady(root,true);
  });
}

function bindModexp(q,root){
  setReady(root,false);enableStage(root,'binary');lockStage(root,'result');
  const trace=root.querySelector('[data-modexp-trace]');
  root.querySelector('[data-field="binary"]')?.addEventListener('input',()=>{setReady(root,false);setStatus(root,'binary','ready','Ready');const b=root.querySelector('[data-verify="binary"]');if(b)b.disabled=false;lockStage(root,'result');if(trace)trace.hidden=true;});
  root.querySelector('[data-verify="binary"]')?.addEventListener('click',()=>{
    if(normalize(valueFor(root,'binary'))!==normalize(q.data.expectedBinary)){setStatus(root,'binary','bad','Check the bits');return;}
    setStatus(root,'binary','good','Verified');const b=root.querySelector('[data-verify="binary"]');if(b)b.disabled=true;if(trace)trace.hidden=false;enableStage(root,'result');root.querySelector('[data-field="result"]')?.focus();
  });
  root.querySelector('[data-field="result"]')?.addEventListener('input',()=>{setReady(root,false);setStatus(root,'result','ready','Ready');const b=root.querySelector('[data-verify="result"]');if(b)b.disabled=false;});
  root.querySelector('[data-verify="result"]')?.addEventListener('click',()=>{
    if(normalize(valueFor(root,'result'))!==normalize(q.data.result)){setStatus(root,'result','bad','Recheck the trace');return;}
    setStatus(root,'result','good','Verified');const b=root.querySelector('[data-verify="result"]');if(b)b.disabled=true;setReady(root,true);
  });
}

export function bindMissionExperience(q,root=document){
  if(q?.experience!=='2.0'||!root)return;
  if(q.mechanic==='rsa-forge') bindRsa(q,root);
  if(q.mechanic==='dh-exchange') bindDh(q,root);
  if(q.mechanic==='modexp-workbench') bindModexp(q,root);
}

export function getMissionExperienceValue(q,root=document){
  if(q?.experience!=='2.0'||!root)return '';
  if(q.mechanic==='rsa-forge'){
    const vals=['n','phi','d','c'].map(k=>valueFor(root,k));return vals.every(Boolean)?vals.join('|'):'';
  }
  if(q.mechanic==='dh-exchange'){
    const vals=['A','B','K'].map(k=>valueFor(root,k));return vals.every(Boolean)?vals.join('|'):'';
  }
  if(q.mechanic==='modexp-workbench'){
    const vals=['binary','result'].map(k=>valueFor(root,k));return vals.every(Boolean)?vals.join('|'):'';
  }
  return '';
}

export function isMissionExperienceAnswerCorrect(q,value){return q?.experience==='2.0'&&normalize(value)===normalize(q.answer);}

export function missionExperienceProgressMessage(q,root=document){
  if(q?.experience!=='2.0'||!root)return '';
  const order=q.mechanic==='rsa-forge'?['n','phi','d','c']:q.mechanic==='dh-exchange'?['A','B','K']:['binary','result'];
  const labels={n:'modulus n',phi:'Euler totient φ(n)',d:'private exponent d',c:'ciphertext C',A:'Alice public value A',B:'Bob public value B',K:'shared secret K',binary:'binary exponent',result:'final modular residue'};
  const bad=order.find(k=>root.querySelector(`[data-step-status="${k}"]`)?.classList.contains('bad'));
  if(bad)return `Recheck the highlighted ${labels[bad]} stage.`;
  const pending=order.find(k=>!isGood(root,k));
  return pending?`Complete and verify ${labels[pending]} before submitting.`:'All stages are verified. You can submit the mission answer.';
}
