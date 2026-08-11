import { gcd,modInverse,modPow } from './crypto-utils.js';
import { createSeededRandom,seededShuffle } from './question-engine.js';

const INTERACTIVE_MISSIONS = new Set(['fortress-1','numbers-1','exchange-2','publickey-2','trust-2']);

function pick(list,rng){return list[Math.floor(rng()*list.length)];}
function int(min,max,rng){return min+Math.floor(rng()*(max-min+1));}
function esc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}
function normalize(value){return String(value??'').trim().replace(/\s+/g,'').toLowerCase();}

function modularClock(seed,difficulty){
  const rng=createSeededRandom(`${seed}|interactive|mod-clock`);
  const modulus=pick(difficulty==='nightmare'?[11,12,13,17]:difficulty==='cryptographer'?[9,11,12,13]:[7,8,10,12],rng);
  const start=int(0,modulus-1,rng);
  const delta=int(modulus+2,modulus*3,rng)*(rng()>.32?1:-1);
  const target=((start+delta)%modulus+modulus)%modulus;
  return {
    type:'interactive',mechanic:'mod-clock',skill:'modular',
    prompt:`Interactive clock: start at ${start}. Move ${delta>=0?'+':''}${delta} positions modulo ${modulus}. Click the landing position.`,
    answer:String(target),answerLabel:String(target),
    explanation:`${start}${delta>=0?'+':''}${delta}=${start+delta}. Reducing modulo ${modulus} lands on ${target}.`,
    hint:`Treat the positions like a clock numbered 0 through ${modulus-1}. Wrap around whenever you pass the end.`,
    newbie:`Modulo arithmetic keeps only the position after wrapping around a fixed-size clock.`,
    deep:`The result is the canonical residue (${start}+${delta}) mod ${modulus} = ${target}.`,
    data:{modulus,start,delta,target}
  };
}

function aesOrder(seed){
  const rng=createSeededRandom(`${seed}|interactive|aes-order`);
  const correct=['SubBytes','ShiftRows','MixColumns','AddRoundKey'];
  let items=seededShuffle(correct,rng);
  if(items.join('|')===correct.join('|')) items=[items[1],items[0],items[3],items[2]];
  return {
    type:'interactive',mechanic:'order',skill:'aes',
    prompt:'Repair the standard AES round pipeline. Reorder the four transformations into the correct sequence.',
    answer:correct.join('|'),answerLabel:'SubBytes → ShiftRows → MixColumns → AddRoundKey',
    explanation:'A standard non-final AES round applies SubBytes, then ShiftRows, then MixColumns, then AddRoundKey. The final round omits MixColumns.',
    hint:'Substitute bytes first, shift rows second, mix columns third, then combine the state with round-key material.',
    newbie:'AES transforms the state in a fixed sequence. Think: replace → move → mix → add the round key.',
    deep:'For rounds 1–9 in AES-128 the transformation is SubBytes → ShiftRows → MixColumns → AddRoundKey.',
    data:{items,labels:correct,caption:'Drag items or use the arrow buttons.'}
  };
}

function dhExchange(seed,difficulty){
  const rng=createSeededRandom(`${seed}|interactive|dh`);
  const params=difficulty==='nightmare'?[[29,2],[31,3],[37,2],[41,6]]:difficulty==='cryptographer'?[[23,5],[29,2],[31,3]]:[[17,3],[19,2],[23,5]];
  const [p,g]=pick(params,rng);
  const max=Math.min(p-2,difficulty==='explorer'?8:14);
  const a=int(2,max,rng),b=int(2,max,rng);
  const A=Number(modPow(g,a,p)),B=Number(modPow(g,b,p)),K=Number(modPow(B,a,p));
  return {
    type:'interactive',mechanic:'dh-exchange',skill:'dh',
    prompt:'Complete the Diffie–Hellman exchange by calculating both public values and the shared secret.',
    answer:`${A}|${B}|${K}`,answerLabel:`A=${A}, B=${B}, shared secret=${K}`,
    explanation:`A=${g}^${a} mod ${p}=${A}; B=${g}^${b} mod ${p}=${B}; K=B^a mod p=${B}^${a} mod ${p}=${K}. Bob obtains the same value from A^b mod p.`,
    hint:'Compute A=g^a mod p and B=g^b mod p first. Then Alice can compute K=B^a mod p.',
    newbie:'Alice and Bob publish mixed values A and B. Each combines the other person’s public value with their own private exponent and reaches the same secret.',
    deep:'Because (g^b)^a ≡ (g^a)^b ≡ g^(ab) (mod p), both parties derive an identical group element.',
    data:{p,g,a,b,A,B,K}
  };
}

function rsaForge(seed,difficulty){
  const rng=createSeededRandom(`${seed}|interactive|rsa`);
  const pairs=difficulty==='nightmare'?[[11,17],[13,19],[17,23],[19,29]]:difficulty==='cryptographer'?[[7,17],[11,17],[13,19]]:[[5,11],[7,13],[11,13]];
  const [p,q]=pick(pairs,rng);
  const n=p*q,phi=(p-1)*(q-1);
  const es=[3,5,7,11,17].filter(e=>e<phi&&gcd(e,phi)===1);
  const e=pick(es,rng),d=Number(modInverse(e,phi));
  const m=int(2,Math.min(n-2,difficulty==='explorer'?12:20),rng);
  const c=Number(modPow(m,e,n));
  return {
    type:'interactive',mechanic:'rsa-forge',skill:'rsa',
    prompt:'Forge the toy RSA key and encrypt the supplied plaintext. Complete every field to unlock the key console.',
    answer:`${n}|${phi}|${d}|${c}`,answerLabel:`n=${n}, φ(n)=${phi}, d=${d}, C=${c}`,
    explanation:`n=${p}×${q}=${n}; φ(n)=(${p}−1)(${q}−1)=${phi}; d=${e}⁻¹ mod ${phi}=${d}; C=${m}^${e} mod ${n}=${c}.`,
    hint:`First calculate n and φ(n). Then find d so e×d≡1 (mod φ(n)). Finally calculate C=M^e mod n.`,
    newbie:'RSA is a chain: multiply the primes, count the totient, find the exponent that undoes e, then use modular exponentiation to encrypt.',
    deep:'This toy flow demonstrates RSA arithmetic only. Production RSA encryption requires a secure padding scheme such as OAEP.',
    data:{p,q,n,phi,e,d,m,c}
  };
}

function pkiChain(seed){
  const rng=createSeededRandom(`${seed}|interactive|pki`);
  const correct=['Trusted Root CA','Intermediate CA','Server / Leaf Certificate'];
  let items=seededShuffle(correct,rng);
  if(items.join('|')===correct.join('|')) items=[items[2],items[0],items[1]];
  return {
    type:'interactive',mechanic:'order',skill:'pki',
    prompt:'Build the certificate validation path from the trust anchor down to the website certificate.',
    answer:correct.join('|'),answerLabel:'Trusted Root CA → Intermediate CA → Server / Leaf Certificate',
    explanation:'The client begins with a trusted root, validates the intermediate certificate, then validates the server/leaf certificate and its identity constraints.',
    hint:'The root is already trusted by the client. The server certificate is the endpoint at the bottom of the chain.',
    newbie:'Think of a chain of introductions: the trusted root vouches for an intermediate, and the intermediate vouches for the website certificate.',
    deep:'Path validation terminates at a configured trust anchor. Signature validation proceeds along the certification path while enforcing constraints, validity and identity checks.',
    data:{items,labels:correct,caption:'Arrange from trust anchor to leaf.'}
  };
}

export function hasInteractiveMission(missionId){return INTERACTIVE_MISSIONS.has(String(missionId||''));}

export function createInteractiveChallenge(mission,seed,difficulty='explorer'){
  if(!mission || !hasInteractiveMission(mission.id)) return null;
  if(mission.id==='numbers-1') return modularClock(seed,difficulty);
  if(mission.id==='fortress-1') return aesOrder(seed);
  if(mission.id==='exchange-2') return dhExchange(seed,difficulty);
  if(mission.id==='publickey-2') return rsaForge(seed,difficulty);
  if(mission.id==='trust-2') return pkiChain(seed);
  return null;
}

function orderHTML(q){
  return `<div class="interactive-panel order-mechanic" data-interactive="order">
    <div class="interactive-toolbar"><span>↕ ORDERING PUZZLE</span><small>${esc(q.data?.caption||'Reorder the items')}</small></div>
    <ol class="interactive-order-list" id="interactiveOrderList">${(q.data?.items||[]).map((item,i)=>`<li class="order-item" draggable="true" data-item="${esc(item)}"><span class="order-grip" aria-hidden="true">⠿</span><strong>${esc(item)}</strong><span class="order-controls"><button type="button" class="order-move" data-dir="-1" aria-label="Move ${esc(item)} up">↑</button><button type="button" class="order-move" data-dir="1" aria-label="Move ${esc(item)} down">↓</button></span></li>`).join('')}</ol>
  </div>`;
}

function clockHTML(q){
  const m=Number(q.data.modulus);
  return `<div class="interactive-panel mod-clock-mechanic" data-interactive="mod-clock">
    <div class="interactive-toolbar"><span>◉ MODULAR CLOCK</span><small>Start ${q.data.start} · Move ${q.data.delta>=0?'+':''}${q.data.delta}</small></div>
    <div class="interactive-clock" style="--clock-count:${m}">${Array.from({length:m},(_,i)=>{const angle=(360/m)*i-90;return `<button type="button" class="clock-node${i===q.data.start?' start':''}" data-value="${i}" style="--angle:${angle}deg" aria-label="Choose ${i}"><span>${i}</span></button>`;}).join('')}<div class="clock-core"><small>mod</small><strong>${m}</strong></div></div>
    <div class="interactive-readout">Selected landing position: <strong id="clockSelection">—</strong></div>
  </div>`;
}

function dhHTML(q){
  const d=q.data;
  return `<div class="interactive-panel flow-mechanic" data-interactive="dh-exchange">
    <div class="interactive-toolbar"><span>⇄ KEY EXCHANGE CONSOLE</span><small>p=${d.p} · g=${d.g}</small></div>
    <div class="crypto-actors"><section><span class="actor-icon">A</span><h4>Alice</h4><p>private a = <strong>${d.a}</strong></p><label>Public A = g<sup>a</sup> mod p<input class="interactive-input" data-field="A" inputmode="numeric" autocomplete="off"></label></section><div class="exchange-line"><span>public values</span>⇄</div><section><span class="actor-icon">B</span><h4>Bob</h4><p>private b = <strong>${d.b}</strong></p><label>Public B = g<sup>b</sup> mod p<input class="interactive-input" data-field="B" inputmode="numeric" autocomplete="off"></label></section></div>
    <label class="shared-secret-field">Shared secret K <input class="interactive-input" data-field="K" inputmode="numeric" autocomplete="off" placeholder="Both sides must derive this value"></label>
  </div>`;
}

function rsaHTML(q){
  const d=q.data;
  return `<div class="interactive-panel rsa-forge-mechanic" data-interactive="rsa-forge">
    <div class="interactive-toolbar"><span>🔑 RSA KEY FORGE</span><small>Toy parameters for learning only</small></div>
    <div class="forge-givens"><span>p <strong>${d.p}</strong></span><span>q <strong>${d.q}</strong></span><span>public e <strong>${d.e}</strong></span><span>plaintext M <strong>${d.m}</strong></span></div>
    <div class="forge-flow"><label><span>1</span><small>Modulus</small>n = p × q<input class="interactive-input" data-field="n" inputmode="numeric" autocomplete="off"></label><b>→</b><label><span>2</span><small>Totient</small>φ(n)<input class="interactive-input" data-field="phi" inputmode="numeric" autocomplete="off"></label><b>→</b><label><span>3</span><small>Private exponent</small>d = e⁻¹ mod φ(n)<input class="interactive-input" data-field="d" inputmode="numeric" autocomplete="off"></label><b>→</b><label><span>4</span><small>Encrypt</small>C = Mᵉ mod n<input class="interactive-input" data-field="c" inputmode="numeric" autocomplete="off"></label></div>
  </div>`;
}

export function renderInteractiveChallenge(q){
  if(q?.mechanic==='order') return orderHTML(q);
  if(q?.mechanic==='mod-clock') return clockHTML(q);
  if(q?.mechanic==='dh-exchange') return dhHTML(q);
  if(q?.mechanic==='rsa-forge') return rsaHTML(q);
  return '<div class="interactive-panel">Interactive challenge unavailable.</div>';
}

export function bindInteractiveChallenge(q,root=document){
  if(!q || !root) return;
  if(q.mechanic==='mod-clock'){
    root.querySelectorAll('.clock-node').forEach(btn=>btn.addEventListener('click',()=>{
      root.querySelectorAll('.clock-node').forEach(n=>n.classList.remove('selected'));
      btn.classList.add('selected');
      const out=root.querySelector('#clockSelection'); if(out) out.textContent=btn.dataset.value;
    }));
    return;
  }
  if(q.mechanic==='order'){
    const list=root.querySelector('#interactiveOrderList');
    if(!list) return;
    let dragged=null;
    list.querySelectorAll('.order-item').forEach(item=>{
      item.addEventListener('dragstart',()=>{dragged=item;item.classList.add('dragging');});
      item.addEventListener('dragend',()=>{item.classList.remove('dragging');dragged=null;});
      item.addEventListener('dragover',e=>e.preventDefault());
      item.addEventListener('drop',e=>{
        e.preventDefault();
        if(!dragged||dragged===item) return;
        const rect=item.getBoundingClientRect();
        list.insertBefore(dragged,e.clientY>rect.top+rect.height/2?item.nextSibling:item);
      });
    });
    list.querySelectorAll('.order-move').forEach(btn=>btn.addEventListener('click',()=>{
      const item=btn.closest('.order-item'),dir=Number(btn.dataset.dir);
      if(!item) return;
      if(dir<0 && item.previousElementSibling) list.insertBefore(item,item.previousElementSibling);
      if(dir>0 && item.nextElementSibling) list.insertBefore(item.nextElementSibling,item);
      item.focus?.();
    }));
  }
}

export function getInteractiveValue(q,root=document){
  if(!q || !root) return '';
  if(q.mechanic==='mod-clock') return root.querySelector('.clock-node.selected')?.dataset.value||'';
  if(q.mechanic==='order') return [...root.querySelectorAll('.order-item')].map(x=>x.dataset.item).join('|');
  if(q.mechanic==='dh-exchange'){
    const vals=['A','B','K'].map(k=>root.querySelector(`[data-field="${k}"]`)?.value?.trim()||'');
    return vals.every(Boolean)?vals.join('|'):'';
  }
  if(q.mechanic==='rsa-forge'){
    const vals=['n','phi','d','c'].map(k=>root.querySelector(`[data-field="${k}"]`)?.value?.trim()||'');
    return vals.every(Boolean)?vals.join('|'):'';
  }
  return '';
}

export function isInteractiveAnswerCorrect(q,value){
  return q?.type==='interactive' && normalize(value)===normalize(q.answer);
}

export function interactiveMissionIds(){return [...INTERACTIVE_MISSIONS];}
