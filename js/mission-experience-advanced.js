import { modInverse,modPow,textToHex,xorHex } from './crypto-utils.js';
import { createSeededRandom } from './question-engine.js';

const ADVANCED_MISSIONS = new Set(['fortress-1','fortress-2','machines-3','publickey-3']);

function esc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
function normalize(value){return String(value??'').trim().replace(/\s+/g,'').toLowerCase();}
function pick(list,rng){return list[Math.floor(rng()*list.length)];}
function int(min,max,rng){return min+Math.floor(rng()*(max-min+1));}
function modN(value,modulus){return ((Number(value)%Number(modulus))+Number(modulus))%Number(modulus);}
function hexByte(value){return Number(value).toString(16).padStart(2,'0').toUpperCase();}

function rsaCrtChallenge(seed,difficulty='explorer'){
  const rng=createSeededRandom(`${seed}|mission2|rsa-crt`);
  const pairs=difficulty==='nightmare'?[[17,23],[19,29],[23,31]]:difficulty==='cryptographer'?[[13,19],[17,23],[19,29]]:[[7,13],[11,17],[13,19]];
  const [p,q]=pick(pairs,rng);
  const n=p*q,phi=(p-1)*(q-1);
  const choices=[3,5,7,11,17].filter(e=>e<phi && Number(modInverse(e,phi))>0);
  const e=pick(choices,rng),d=Number(modInverse(e,phi));
  const message=int(2,Math.min(n-2,difficulty==='explorer'?18:30),rng);
  const ciphertext=Number(modPow(message,e,n));
  const dp=d%(p-1),dq=d%(q-1);
  const m1=Number(modPow(ciphertext,dp,p)),m2=Number(modPow(ciphertext,dq,q));
  const qInv=Number(modInverse(q,p));
  const h=modN(qInv*(m1-m2),p);
  const recovered=m2+h*q;
  return {
    type:'interactive',experience:'2.0',experienceFamily:'advanced',mechanic:'rsa-crt',skill:'rsa',
    prompt:'RSA-CRT recovery: split the private exponent across p and q, decrypt both smaller residues, then recombine them to recover the plaintext.',
    answer:`${dp}|${dq}|${m1}|${m2}|${qInv}|${h}|${recovered}`,
    answerLabel:`dP=${dp}, dQ=${dq}, m₁=${m1}, m₂=${m2}, qInv=${qInv}, h=${h}, M=${recovered}`,
    explanation:`dP=d mod (p−1)=${dp} and dQ=d mod (q−1)=${dq}. The two smaller decryptions give m₁=${m1} and m₂=${m2}. With qInv=${qInv}, h=${h}, recombination gives M=m₂+hq=${recovered}.`,
    hint:'Reduce d modulo p−1 and q−1 first. Then decrypt C separately modulo p and q. The final recombination uses q⁻¹ mod p.',
    newbie:'RSA-CRT does the same private-key job in two smaller modular worlds. Solve the p side and q side separately, then stitch the two answers back together.',
    deep:'CRT acceleration computes m₁=C^(d mod p−1) mod p and m₂=C^(d mod q−1) mod q, then recombines the congruences. Real implementations also require fault and side-channel protections.',
    data:{p,q,n,e,d,message,ciphertext,dp,dq,m1,m2,qInv,h,recovered}
  };
}

function cbcPropagationChallenge(seed){
  const rng=createSeededRandom(`${seed}|mission2|cbc-propagation`);
  const corrupted=int(1,3,rng);
  const affected=[corrupted,corrupted+1];
  return {
    type:'interactive',experience:'2.0',experienceFamily:'advanced',mechanic:'cbc-propagation',skill:'modes',
    prompt:`CBC incident: one bit of ciphertext block C${corrupted} is corrupted before decryption. Identify the affected plaintext blocks and classify what happens to each.`,
    answer:`${affected.join(',')}|garbled|bitflip`,
    answerLabel:`P${corrupted} is garbled; the corresponding bit flips in P${corrupted+1}; later blocks are unaffected`,
    explanation:`CBC decryption uses Pᵢ=Dₖ(Cᵢ)⊕Cᵢ₋₁. Corrupting C${corrupted} therefore makes P${corrupted} unpredictable through Dₖ(C${corrupted}), and the same changed ciphertext bit is XORed directly into P${corrupted+1}. P${corrupted+2<=4?corrupted+2:4} and later blocks are not affected by this single ciphertext-block error.`,
    hint:`A ciphertext block participates twice during CBC decryption: once as the block-cipher input for its own plaintext block, and once as the XOR input for the next plaintext block.`,
    newbie:'A damaged CBC ciphertext block hurts two plaintext blocks: its own block becomes scrambled, and the same bit position flips in the next block. After that, the error stops propagating.',
    deep:'For a one-bit error Δ in Cᵢ, Pᵢ becomes computationally unrelated because Dₖ(Cᵢ⊕Δ) changes nonlinearly, while Pᵢ₊₁ changes by exactly Δ because Cᵢ is XORed after decryption.',
    data:{blocks:4,corrupted,affected,currentImpact:'garbled',nextImpact:'bitflip'}
  };
}

function shiftRowsChallenge(seed){
  const rng=createSeededRandom(`${seed}|mission2|shiftrows`);
  const start=int(0,224,rng);
  const values=Array.from({length:16},(_,i)=>hexByte(start+i));
  const startRows=Array.from({length:4},(_,r)=>values.slice(r*4,r*4+4));
  const expectedRows=startRows.map((row,r)=>row.slice(r).concat(row.slice(0,r)));
  const answer=expectedRows.map(row=>row.join(',')).join('|');
  return {
    type:'interactive',experience:'2.0',experienceFamily:'advanced',mechanic:'aes-shiftrows',skill:'aes',
    prompt:'AES ShiftRows matrix: manipulate the four displayed rows until they match the AES ShiftRows rule, then verify the state.',
    answer,
    answerLabel:`row 0 unchanged; row 1 left 1; row 2 left 2; row 3 left 3`,
    explanation:'ShiftRows leaves row 0 unchanged and cyclically rotates rows 1, 2, and 3 left by 1, 2, and 3 byte positions respectively.',
    hint:'The row number tells you the left rotation: row 0 → 0, row 1 → 1, row 2 → 2, row 3 → 3.',
    newbie:'Imagine four conveyor belts. The first stays still. The next moves left once, the next twice, and the last three times, wrapping bytes around the end.',
    deep:'ShiftRows permutes byte positions across columns, complementing MixColumns so diffusion spreads across the state over subsequent rounds.',
    data:{startRows,expectedRows,shifts:[0,1,2,3]}
  };
}

function xorReuseChallenge(seed,difficulty='explorer'){
  const rng=createSeededRandom(`${seed}|mission2|xor-reuse`);
  const pairs=[['HELLO','WORLD'],['ALPHA','BRAVO'],['NORTH','SOUTH'],['GREEN','BLACK'],['ATTACK','DEFEND']];
  const [p1,p2]=pick(pairs,rng);
  const keyHex=Array.from({length:p1.length},()=>hexByte(int(0,255,rng))).join('');
  const c1=xorHex(textToHex(p1),keyHex);
  const c2=xorHex(textToHex(p2),keyHex);
  return {
    type:'interactive',experience:'2.0',experienceFamily:'advanced',mechanic:'xor-reuse',skill:'xor',
    prompt:'Reused-keystream interception: use the known plaintext P₁ and C₁ to recover K, then use that same K to recover the second plaintext from C₂.',
    answer:`${keyHex}|${p2}`,
    answerLabel:`K=${keyHex}; P₂=${p2}`,
    explanation:`K=P₁⊕C₁=${keyHex}. Because the same keystream was reused, P₂=C₂⊕K=${p2}. This is why keystream/nonce reuse can be catastrophic.`,
    hint:'XOR undoes itself: if C=P⊕K, then K=C⊕P. Once K is known, XOR it with C₂.',
    newbie:'XOR is reversible with the same value. Knowing one plaintext/ciphertext pair reveals the reused mask, and that mask opens the second message.',
    deep:'Reusing a stream-cipher keystream creates algebraic relations C₁⊕C₂=P₁⊕P₂. A known plaintext directly recovers the corresponding keystream segment.',
    data:{p1,p2,keyHex,c1,c2,length:p1.length,difficulty}
  };
}

export function advancedMissionExperienceIds(){return [...ADVANCED_MISSIONS];}
export function hasAdvancedMissionExperience(missionId){return ADVANCED_MISSIONS.has(String(missionId||''));}

export function createAdvancedMissionExperienceChallenge(mission,seed,difficulty='explorer'){
  if(!mission||!hasAdvancedMissionExperience(mission.id))return null;
  if(mission.id==='publickey-3')return rsaCrtChallenge(seed,difficulty);
  if(mission.id==='fortress-2')return cbcPropagationChallenge(seed);
  if(mission.id==='fortress-1')return shiftRowsChallenge(seed);
  if(mission.id==='machines-3')return xorReuseChallenge(seed,difficulty);
  return null;
}

function statusHTML(key,label='Ready'){return `<span class="mission-step-status ${label==='Locked'?'locked':''}" data-step-status="${key}">${label}</span>`;}
function missionSubmit(root){return root.closest('.mission-modal')?.querySelector('#submitMissionBtn')||document.querySelector('#submitMissionBtn');}
function setReady(root,ready){const submit=missionSubmit(root);if(submit)submit.disabled=!ready;root.querySelector('.mission-experience-panel')?.classList.toggle('experience-ready',ready);const box=root.querySelector('[data-experience-ready]');if(box)box.hidden=!ready;}
function setStatus(root,key,state,text){const status=root.querySelector(`[data-step-status="${key}"]`);if(status){status.className=`mission-step-status ${state}`;status.textContent=text;}const card=root.querySelector(`[data-stage="${key}"]`);if(card){card.classList.toggle('verified',state==='good');card.classList.toggle('has-error',state==='bad');if(state!=='locked')card.classList.remove('locked');}}
function enableStage(root,key){const card=root.querySelector(`[data-stage="${key}"]`);if(card){card.classList.remove('locked');card.classList.add('active');}root.querySelectorAll(`[data-stage="${key}"] input,[data-stage="${key}"] select,[data-stage="${key}"] button`).forEach(el=>el.disabled=false);setStatus(root,key,'ready','Ready');}
function lockStage(root,key){const card=root.querySelector(`[data-stage="${key}"]`);if(card){card.classList.add('locked');card.classList.remove('active','verified','has-error');}root.querySelectorAll(`[data-stage="${key}"] input,[data-stage="${key}"] select,[data-stage="${key}"] button`).forEach(el=>el.disabled=true);setStatus(root,key,'locked','Locked');}
function valueFor(root,key){return root.querySelector(`[data-field="${key}"]`)?.value?.trim()||'';}
function isGood(root,key){return root.querySelector(`[data-step-status="${key}"]`)?.classList.contains('good')||false;}

function rsaCrtHTML(q){const d=q.data;return `<div class="interactive-panel mission-experience-panel advanced-experience" data-experience="2.0" data-interactive="rsa-crt"><div class="interactive-toolbar"><span>⚙ RSA-CRT DECRYPTION</span><small>C=${d.ciphertext} · p=${d.p} · q=${d.q} · d=${d.d}</small></div><div class="mission-stage-strip"><span class="active">1</span><i></i><span>2</span><i></i><span>3</span><i></i><span>4</span></div><div class="mission-stage-grid two-column"><section class="mission-stage-card active" data-stage="crtExp"><header><span class="mission-stage-number">01</span><div><small>REDUCE d</small><strong>CRT exponents</strong></div>${statusHTML('crtExp')}</header><p class="mission-stage-formula">dP=d mod (p−1), dQ=d mod (q−1)</p><label>dP <input class="interactive-input" data-field="dp" inputmode="numeric"></label><label>dQ <input class="interactive-input" data-field="dq" inputmode="numeric"></label><div class="mission-stage-actions"><button class="secondary-btn mission-step-verify" data-verify-advanced="crtExp" type="button">Verify exponents</button></div><p class="mission-stage-why"><strong>Why:</strong> Fermat/Euler lets each prime-side exponent be reduced.</p></section><section class="mission-stage-card locked" data-stage="crtResidues"><header><span class="mission-stage-number">02</span><div><small>DECRYPT TWICE</small><strong>Prime residues</strong></div>${statusHTML('crtResidues','Locked')}</header><p class="mission-stage-formula">m₁=C<sup>dP</sup> mod p, m₂=C<sup>dQ</sup> mod q</p><label>m₁ <input class="interactive-input" data-field="m1" inputmode="numeric" disabled></label><label>m₂ <input class="interactive-input" data-field="m2" inputmode="numeric" disabled></label><div class="mission-stage-actions"><button class="secondary-btn mission-step-verify" data-verify-advanced="crtResidues" type="button" disabled>Verify residues</button></div></section><section class="mission-stage-card locked" data-stage="crtBridge"><header><span class="mission-stage-number">03</span><div><small>BRIDGE</small><strong>Build recombination factor</strong></div>${statusHTML('crtBridge','Locked')}</header><p class="mission-stage-formula">qInv=q⁻¹ mod p; h=qInv(m₁−m₂) mod p</p><label>qInv <input class="interactive-input" data-field="qInv" inputmode="numeric" disabled></label><label>h <input class="interactive-input" data-field="h" inputmode="numeric" disabled></label><div class="mission-stage-actions"><button class="secondary-btn mission-step-verify" data-verify-advanced="crtBridge" type="button" disabled>Verify bridge</button></div></section><section class="mission-stage-card locked" data-stage="crtMessage"><header><span class="mission-stage-number">04</span><div><small>RECOMBINE</small><strong>Recover plaintext</strong></div>${statusHTML('crtMessage','Locked')}</header><p class="mission-stage-formula">M=m₂+hq</p><label>M <input class="interactive-input" data-field="recovered" inputmode="numeric" disabled></label><div class="mission-stage-actions"><button class="secondary-btn mission-step-verify" data-verify-advanced="crtMessage" type="button" disabled>Verify plaintext</button></div><p class="mission-stage-why"><strong>Check:</strong> the recovered M should be the same plaintext that ordinary RSA decryption would produce.</p></section></div><div class="mission-experience-ready" data-experience-ready hidden>✓ RSA-CRT reconstruction verified. Press <strong>Check answer</strong>.</div></div>`;}

function cbcHTML(q){const d=q.data;return `<div class="interactive-panel mission-experience-panel advanced-experience" data-experience="2.0" data-interactive="cbc-propagation"><div class="interactive-toolbar"><span>⛓ CBC ERROR PROPAGATION</span><small>single-bit corruption in C${d.corrupted}</small></div><div class="cbc-chain"><span>IV</span>${Array.from({length:d.blocks},(_,i)=>`<span class="cbc-cipher-block ${i+1===d.corrupted?'corrupted':''}">C${i+1}${i+1===d.corrupted?' ⚡':''}</span>`).join('<b>→</b>')}</div><div class="mission-stage-grid two-column"><section class="mission-stage-card active" data-stage="cbcBlocks"><header><span class="mission-stage-number">01</span><div><small>TRACE DAMAGE</small><strong>Which plaintext blocks change?</strong></div>${statusHTML('cbcBlocks')}</header><div class="cbc-plain-options">${Array.from({length:d.blocks},(_,i)=>`<button type="button" class="cbc-block-choice mission-step-verify" data-cbc-block="${i+1}">P${i+1}</button>`).join('')}</div><div class="mission-stage-actions"><button class="secondary-btn mission-step-verify" data-verify-advanced="cbcBlocks" type="button">Verify affected blocks</button></div><p class="mission-stage-why">Select every plaintext block whose output changes because C${d.corrupted} was corrupted.</p></section><section class="mission-stage-card locked" data-stage="cbcImpact"><header><span class="mission-stage-number">02</span><div><small>CLASSIFY</small><strong>How does each block change?</strong></div>${statusHTML('cbcImpact','Locked')}</header><label>P${d.corrupted} impact<select class="interactive-input" data-field="currentImpact" disabled><option value="">Choose…</option><option value="unaffected">Unaffected</option><option value="garbled">Garbled / unpredictable</option><option value="bitflip">Same bit flips</option></select></label><label>P${d.corrupted+1} impact<select class="interactive-input" data-field="nextImpact" disabled><option value="">Choose…</option><option value="unaffected">Unaffected</option><option value="garbled">Garbled / unpredictable</option><option value="bitflip">Same bit flips</option></select></label><div class="mission-stage-actions"><button class="secondary-btn mission-step-verify" data-verify-advanced="cbcImpact" type="button" disabled>Verify impact</button></div></section></div><div class="cbc-rule"><code>Pᵢ = Dₖ(Cᵢ) ⊕ Cᵢ₋₁</code><span>One damaged C block is used in two neighboring plaintext equations.</span></div><div class="mission-experience-ready" data-experience-ready hidden>✓ CBC propagation traced correctly. Press <strong>Check answer</strong>.</div></div>`;}

function aesHTML(q){const d=q.data;return `<div class="interactive-panel mission-experience-panel advanced-experience" data-experience="2.0" data-interactive="aes-shiftrows"><div class="interactive-toolbar"><span>▦ AES SHIFTROWS MATRIX</span><small>rotate row r left by r positions</small></div><section class="mission-stage-card active aes-shift-stage" data-stage="matrix"><header><span class="mission-stage-number">01</span><div><small>STATE PERMUTATION</small><strong>Manipulate the byte rows</strong></div>${statusHTML('matrix')}</header><div class="aes-shift-rules">${d.shifts.map((s,r)=>`<span>row ${r}: ← ${s}</span>`).join('')}</div><div class="aes-shift-matrix">${d.startRows.map((row,r)=>`<div class="aes-shift-row" data-aes-row="${r}"><strong>R${r}</strong><div class="aes-shift-cells">${row.map(v=>`<span>${esc(v)}</span>`).join('')}</div><div class="aes-row-controls"><button type="button" class="mission-step-verify aes-row-shift" data-row="${r}" data-dir="left" aria-label="Shift row ${r} left">←</button><button type="button" class="mission-step-verify aes-row-shift" data-row="${r}" data-dir="right" aria-label="Shift row ${r} right">→</button></div></div>`).join('')}</div><div class="mission-stage-actions"><button class="secondary-btn mission-step-verify" data-aes-reset type="button">Reset matrix</button><button class="primary-btn mission-step-verify" data-verify-advanced="matrix" type="button">Verify ShiftRows</button></div><p class="mission-stage-why"><strong>Why:</strong> moving bytes between columns helps AES diffuse byte influence across later rounds.</p></section><div class="mission-experience-ready" data-experience-ready hidden>✓ ShiftRows state verified. Press <strong>Check answer</strong>.</div></div>`;}

function xorHTML(q){const d=q.data;return `<div class="interactive-panel mission-experience-panel advanced-experience" data-experience="2.0" data-interactive="xor-reuse"><div class="interactive-toolbar"><span>⊕ REUSED KEYSTREAM RECOVERY</span><small>${d.length} byte interception</small></div><div class="xor-intercepts"><article><small>Known plaintext P₁</small><strong>${esc(d.p1)}</strong><code>${textToHex(d.p1)}</code></article><article><small>Ciphertext C₁</small><code>${esc(d.c1)}</code></article><article><small>Ciphertext C₂</small><code>${esc(d.c2)}</code></article></div><div class="mission-stage-grid two-column"><section class="mission-stage-card active" data-stage="xorKey"><header><span class="mission-stage-number">01</span><div><small>KNOWN PLAINTEXT</small><strong>Recover keystream K</strong></div>${statusHTML('xorKey')}</header><p class="mission-stage-formula">K = P₁ ⊕ C₁</p><label>K (hex) <input class="interactive-input" data-field="keyHex" autocomplete="off" spellcheck="false" placeholder="${'00'.repeat(d.length)}"></label><div class="mission-stage-actions"><button class="secondary-btn mission-step-verify" data-verify-advanced="xorKey" type="button">Verify keystream</button></div></section><section class="mission-stage-card locked" data-stage="xorPlain"><header><span class="mission-stage-number">02</span><div><small>SECOND MESSAGE</small><strong>Recover P₂</strong></div>${statusHTML('xorPlain','Locked')}</header><p class="mission-stage-formula">P₂ = C₂ ⊕ K</p><label>P₂ (ASCII) <input class="interactive-input" data-field="p2" autocomplete="off" spellcheck="false" disabled></label><div class="mission-stage-actions"><button class="secondary-btn mission-step-verify" data-verify-advanced="xorPlain" type="button" disabled>Verify plaintext</button></div></section></div><div class="mission-experience-ready" data-experience-ready hidden>✓ Reused keystream exploited successfully. Press <strong>Check answer</strong>.</div></div>`;}

export function renderAdvancedMissionExperienceChallenge(q){if(q?.experienceFamily!=='advanced')return '';if(q.mechanic==='rsa-crt')return rsaCrtHTML(q);if(q.mechanic==='cbc-propagation')return cbcHTML(q);if(q.mechanic==='aes-shiftrows')return aesHTML(q);if(q.mechanic==='xor-reuse')return xorHTML(q);return '';}

function bindSequentialPairs(q,root,stages){setReady(root,false);stages.forEach((s,i)=>i?lockStage(root,s.stage):enableStage(root,s.stage));stages.forEach((s,index)=>{const reset=()=>{setReady(root,false);setStatus(root,s.stage,'ready','Ready');const b=root.querySelector(`[data-verify-advanced="${s.stage}"]`);if(b)b.disabled=false;stages.slice(index+1).forEach(next=>lockStage(root,next.stage));};s.fields.forEach(field=>root.querySelector(`[data-field="${field}"]`)?.addEventListener('input',reset));root.querySelector(`[data-verify-advanced="${s.stage}"]`)?.addEventListener('click',()=>{const good=s.fields.every(field=>normalize(valueFor(root,field))===normalize(String(q.data[field])));if(!good){setStatus(root,s.stage,'bad','Try again');return;}setStatus(root,s.stage,'good','Verified');const b=root.querySelector(`[data-verify-advanced="${s.stage}"]`);if(b)b.disabled=true;if(index<stages.length-1){enableStage(root,stages[index+1].stage);root.querySelector(`[data-field="${stages[index+1].fields[0]}"]`)?.focus();}else setReady(root,true);});});}

function bindRsaCrt(q,root){bindSequentialPairs(q,root,[{stage:'crtExp',fields:['dp','dq']},{stage:'crtResidues',fields:['m1','m2']},{stage:'crtBridge',fields:['qInv','h']},{stage:'crtMessage',fields:['recovered']}]);}

function bindCbc(q,root){setReady(root,false);enableStage(root,'cbcBlocks');lockStage(root,'cbcImpact');root.__cbcSelected=new Set();root.querySelectorAll('[data-cbc-block]').forEach(btn=>btn.addEventListener('click',()=>{const n=Number(btn.dataset.cbcBlock);if(root.__cbcSelected.has(n)){root.__cbcSelected.delete(n);btn.classList.remove('selected');}else{root.__cbcSelected.add(n);btn.classList.add('selected');}setStatus(root,'cbcBlocks','ready','Ready');}));root.querySelector('[data-verify-advanced="cbcBlocks"]')?.addEventListener('click',()=>{const selected=[...root.__cbcSelected].sort((a,b)=>a-b);const expected=q.data.affected;const good=selected.length===expected.length&&selected.every((v,i)=>v===expected[i]);if(!good){setStatus(root,'cbcBlocks','bad','Trace again');return;}setStatus(root,'cbcBlocks','good','Verified');root.querySelectorAll('[data-cbc-block], [data-verify-advanced="cbcBlocks"]').forEach(b=>b.disabled=true);enableStage(root,'cbcImpact');});['currentImpact','nextImpact'].forEach(field=>root.querySelector(`[data-field="${field}"]`)?.addEventListener('change',()=>{setReady(root,false);setStatus(root,'cbcImpact','ready','Ready');const b=root.querySelector('[data-verify-advanced="cbcImpact"]');if(b)b.disabled=false;}));root.querySelector('[data-verify-advanced="cbcImpact"]')?.addEventListener('click',()=>{const good=valueFor(root,'currentImpact')===q.data.currentImpact&&valueFor(root,'nextImpact')===q.data.nextImpact;if(!good){setStatus(root,'cbcImpact','bad','Recheck roles');return;}setStatus(root,'cbcImpact','good','Verified');root.querySelector('[data-verify-advanced="cbcImpact"]').disabled=true;setReady(root,true);});}

function rotate(row,dir){const copy=[...row];if(dir==='left')copy.push(copy.shift());else copy.unshift(copy.pop());return copy;}
function paintAes(root){(root.__aesRows||[]).forEach((row,r)=>{const cells=root.querySelector(`[data-aes-row="${r}"] .aes-shift-cells`);if(cells)cells.innerHTML=row.map(v=>`<span>${esc(v)}</span>`).join('');});}
function bindAes(q,root){setReady(root,false);enableStage(root,'matrix');root.__aesRows=q.data.startRows.map(row=>[...row]);root.querySelectorAll('.aes-row-shift').forEach(btn=>btn.addEventListener('click',()=>{const r=Number(btn.dataset.row);root.__aesRows[r]=rotate(root.__aesRows[r],btn.dataset.dir);paintAes(root);setStatus(root,'matrix','ready','Ready');setReady(root,false);}));root.querySelector('[data-aes-reset]')?.addEventListener('click',()=>{root.__aesRows=q.data.startRows.map(row=>[...row]);paintAes(root);setStatus(root,'matrix','ready','Ready');setReady(root,false);});root.querySelector('[data-verify-advanced="matrix"]')?.addEventListener('click',()=>{const value=root.__aesRows.map(row=>row.join(',')).join('|');if(normalize(value)!==normalize(q.answer)){setStatus(root,'matrix','bad','Shift again');return;}setStatus(root,'matrix','good','Verified');setReady(root,true);});}

function bindXor(q,root){bindSequentialPairs(q,root,[{stage:'xorKey',fields:['keyHex']},{stage:'xorPlain',fields:['p2']}]);}

export function bindAdvancedMissionExperience(q,root=document){if(q?.experienceFamily!=='advanced'||!root)return;if(q.mechanic==='rsa-crt')bindRsaCrt(q,root);if(q.mechanic==='cbc-propagation')bindCbc(q,root);if(q.mechanic==='aes-shiftrows')bindAes(q,root);if(q.mechanic==='xor-reuse')bindXor(q,root);}

export function getAdvancedMissionExperienceValue(q,root=document){if(q?.experienceFamily!=='advanced'||!root)return '';if(q.mechanic==='rsa-crt'){const fields=['dp','dq','m1','m2','qInv','h','recovered'];const vals=fields.map(f=>valueFor(root,f));return vals.every(Boolean)?vals.join('|'):'';}if(q.mechanic==='cbc-propagation'){const selected=[...(root.__cbcSelected||[])].sort((a,b)=>a-b);const impacts=[valueFor(root,'currentImpact'),valueFor(root,'nextImpact')];return selected.length&&impacts.every(Boolean)?`${selected.join(',')}|${impacts.join('|')}`:'';}if(q.mechanic==='aes-shiftrows')return root.__aesRows?.map(row=>row.join(',')).join('|')||'';if(q.mechanic==='xor-reuse'){const vals=[valueFor(root,'keyHex'),valueFor(root,'p2')];return vals.every(Boolean)?vals.join('|'):'';}return '';}

export function isAdvancedMissionExperienceAnswerCorrect(q,value){return q?.experienceFamily==='advanced'&&normalize(value)===normalize(q.answer);}

export function advancedMissionExperienceProgressMessage(q,root=document){if(q?.experienceFamily!=='advanced'||!root)return '';const orders={
  'rsa-crt':['crtExp','crtResidues','crtBridge','crtMessage'],
  'cbc-propagation':['cbcBlocks','cbcImpact'],
  'aes-shiftrows':['matrix'],
  'xor-reuse':['xorKey','xorPlain']
};const labels={crtExp:'CRT exponents dP and dQ',crtResidues:'prime-side decryptions m₁ and m₂',crtBridge:'q inverse and recombination factor h',crtMessage:'recovered plaintext M',cbcBlocks:'affected CBC plaintext blocks',cbcImpact:'CBC error effects',matrix:'ShiftRows matrix',xorKey:'recovered keystream K',xorPlain:'second plaintext P₂'};const order=orders[q.mechanic]||[];const bad=order.find(k=>root.querySelector(`[data-step-status="${k}"]`)?.classList.contains('bad'));if(bad)return `Recheck ${labels[bad]}.`;const pending=order.find(k=>!isGood(root,k));return pending?`Complete and verify ${labels[pending]} before submitting.`:'All stages are verified. You can submit the mission answer.';}
