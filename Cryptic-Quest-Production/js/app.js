import {
  mod,gcd,modInverse,modPow,squareMultiplySteps,isPrime,phi,isPrimitiveRoot,crt,caesar,vigenere,vigenereSteps,affine,railFence,playfair,playfairSquare,
  xorBits,xorHex,textToHex,hexToText,randomInt,sample,shuffle,normalizeAnswer,bitDifference,seededRandom,
  aesSubBytes,aesShiftRows,aesMixColumns,aesAddRoundKey,hexToBytes16,bytesToHex
} from './crypto-utils.js';
import {
  worlds,missions,ranks,difficulties,skills,achievements,academyModules,detectiveCases,cryptoDisasters,ctfChallenges,fieldGuide,onboardingProfiles
} from './content.js';

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = 'crypticQuestV2State';
const APP_VERSION = 2;

const defaultState = () => ({
  version:APP_VERSION,
  xp:0,
  completed:[],
  missionScores:{},
  achievements:[],
  skills:{},
  difficulty:'explorer',
  explanationDepth:'newbie',
  onboardingComplete:false,
  sound:true,
  sandboxUsed:[],
  ctfSolved:[],
  detectives:[],
  disasters:[],
  daily:{lastSolved:null,streak:0,bestStreak:0,solvedDates:[]},
  createdAt:new Date().toISOString(),
  lastPlayed:new Date().toISOString()
});

let state = loadState();
let currentView = 'home';
let currentMission = null;
let missionSession = null;
let academyDepth = state.explanationDepth || 'newbie';
let activeSandbox = 'caesar';
let activeAttack = 'ecb';
let activeChallenge = 'daily';
let deferredInstallPrompt = null;
let audioContext = null;
let aesLabState = null;
let mitmStep = 0;

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      return {...defaultState(),...parsed,daily:{...defaultState().daily,...(parsed.daily||{})},skills:parsed.skills||{}};
    }
    // Light migration from the first prototype if it exists.
    const legacy = JSON.parse(localStorage.getItem('crypticQuestState') || 'null');
    if(legacy && Number.isFinite(legacy.xp)){
      const fresh = defaultState();
      fresh.xp = Math.max(0,Math.floor(legacy.xp));
      return fresh;
    }
  }catch(error){ console.warn('Progress could not be loaded:',error); }
  return defaultState();
}

function saveState(){
  state.lastPlayed = new Date().toISOString();
  try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }catch(error){ console.warn('Progress could not be saved:',error); }
}

function escapeHTML(value){
  return String(value ?? '').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function getRank(xp=state.xp){
  let rank=ranks[0];
  for(const r of ranks) if(xp>=r.xp) rank=r;
  return rank;
}

function getNextRank(){ return ranks.find(r=>r.xp>state.xp) || null; }
function completedCount(){ return state.completed.length; }
function campaignPercent(){ return Math.round((completedCount()/missions.length)*100); }
function skillRecord(id){ return state.skills[id] || {attempts:0,correct:0}; }
function skillRate(id){ const r=skillRecord(id); return r.attempts ? r.correct/r.attempts : 0; }
function masteryPercent(){
  const records=Object.values(state.skills).filter(v=>v.attempts>0);
  if(!records.length) return 0;
  return Math.round(records.reduce((sum,r)=>sum+r.correct/r.attempts,0)/records.length*100);
}
function worldProgress(worldId){
  const list=missions.filter(m=>m.world===worldId);
  const done=list.filter(m=>state.completed.includes(m.id)).length;
  return {done,total:list.length,percent:Math.round(done/list.length*100)};
}
function isWorldUnlocked(worldId){
  const index=worlds.findIndex(w=>w.id===worldId);
  if(index<=0) return true;
  const prev=worlds[index-1];
  return state.completed.includes(`${prev.id}-3`);
}
function isMissionUnlocked(mission){
  if(!isWorldUnlocked(mission.world)) return false;
  if(mission.order===1) return true;
  return state.completed.includes(`${mission.world}-${mission.order-1}`);
}
function findRecommendedMission(){ return missions.find(m=>isMissionUnlocked(m) && !state.completed.includes(m.id)) || missions[0]; }
function weakestSkill(){
  const practiced=skills.map(s=>({id:s.id,name:s.name,...skillRecord(s.id)})).filter(s=>s.attempts>0).sort((a,b)=>(a.correct/a.attempts)-(b.correct/b.attempts));
  if(practiced.length) return practiced[0];
  return {id:'caesar',name:'Caesar cipher',attempts:0,correct:0};
}
function findMissionForSkill(skillId){
  const candidate=missions.find(m=>isMissionUnlocked(m) && (m.topic.includes(skillId) || worlds.find(w=>w.id===m.world)?.skills.includes(skillId)));
  return candidate || findRecommendedMission();
}
function updateSkill(skill,correct){
  if(!skill) return;
  const record=state.skills[skill] || {attempts:0,correct:0};
  record.attempts += 1;
  if(correct) record.correct += 1;
  state.skills[skill]=record;
}

function updateAchievements(show=true){
  const unlocked=[];
  for(const achievement of achievements){
    if(!state.achievements.includes(achievement.id) && achievement.condition(state)){
      state.achievements.push(achievement.id);
      unlocked.push(achievement);
    }
  }
  if(unlocked.length){
    saveState();
    if(show) unlocked.forEach(a=>showToast(`${a.icon} Achievement unlocked`,a.title));
  }
  return unlocked;
}

function setView(name,{focus=true}={}){
  if(!document.getElementById(`${name}View`)) name='home';
  currentView=name;
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===`${name}View`));
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  history.replaceState(null,'',`#${name}`);
  if(name==='home') renderHome();
  if(name==='campaign') renderCampaign();
  if(name==='academy') renderAcademy();
  if(name==='sandbox') renderSandbox(activeSandbox);
  if(name==='attack') renderAttack(activeAttack);
  if(name==='challenges') renderChallenges(activeChallenge);
  if(name==='guide') renderGuide();
  if(focus){ window.scrollTo({top:0,behavior:'smooth'}); setTimeout(()=>$('#app')?.focus({preventScroll:true}),10); }
}

function updateGlobalStats(){
  const rank=getRank(); const next=getNextRank();
  $('#rankName').textContent=rank.name;
  $('#xpTop').textContent=state.xp.toLocaleString();
  $('#xpMetric').textContent=state.xp.toLocaleString();
  $('#completedMetric').textContent=`${completedCount()}/${missions.length}`;
  $('#completionText').textContent=completedCount()?`${campaignPercent()}% of campaign cleared`:'Start your first operation';
  $('#masteryMetric').textContent=`${masteryPercent()}%`;
  $('#dailyStreakMetric').textContent=String(state.daily.streak||0);
  const today=localDateKey(new Date());
  $('#dailyStatusText').textContent=state.daily.solvedDates?.includes(today)?'Challenge completed today':"Today's challenge awaits";
  if(next){
    $('#rankProgressText').textContent=`${state.xp.toLocaleString()} / ${next.xp.toLocaleString()} to ${next.name}`;
  }else $('#rankProgressText').textContent='Maximum rank achieved';
  $('#campaignMastery').textContent=`${campaignPercent()}%`;
  $('#campaignBar').style.width=`${campaignPercent()}%`;
  $('#campaignDifficulty').value=state.difficulty;
}

function renderHome(){
  updateGlobalStats();
  $('#worldPreview').innerHTML=worlds.map(w=>{
    const p=worldProgress(w.id); const unlocked=isWorldUnlocked(w.id);
    return `<article class="world-preview ${unlocked?'':'locked'}" title="${unlocked?'':'Clear the previous world boss to unlock'}">
      <div class="world-icon">${w.icon}</div><strong>${escapeHTML(w.title)}</strong><small>${escapeHTML(w.subtitle)}</small>
      <div class="mini-progress"><span style="width:${p.percent}%"></span></div>
    </article>`;
  }).join('');
  const mission=findRecommendedMission();
  const world=worlds.find(w=>w.id===mission.world);
  $('#recommendedMission').innerHTML=`<article class="recommend-card"><header><span class="badge">WORLD ${world.number}</span><span class="badge">${mission.label}</span></header><h3>${escapeHTML(mission.title)}</h3><p>${escapeHTML(mission.story)}</p><button class="primary-btn home-launch" data-id="${mission.id}" type="button">${state.completed.includes(mission.id)?'Replay':'Launch'} mission →</button></article>`;
  $('.home-launch')?.addEventListener('click',e=>startMission(e.currentTarget.dataset.id));

  const daily=getDailyChallenge();
  const solved=state.daily.solvedDates?.includes(daily.dateKey);
  $('#dailyPreview').innerHTML=`<article class="daily-card"><header><span class="badge">${escapeHTML(daily.type)}</span><span class="badge">${solved?'CLEARED':'TODAY'}</span></header><h3>${escapeHTML(daily.title)}</h3><p>${escapeHTML(daily.preview)}</p><button class="secondary-btn" id="openDaily" type="button">${solved?'Review':'Attempt'} challenge →</button></article>`;
  $('#openDaily')?.addEventListener('click',()=>{activeChallenge='daily';setView('challenges');});

  const preview=[...achievements].sort((a,b)=>Number(state.achievements.includes(b.id))-Number(state.achievements.includes(a.id))).slice(0,4);
  $('#achievementPreview').innerHTML=preview.map(a=>achievementCard(a)).join('');
  $('#continueBtn').textContent=completedCount()?'Continue Journey →':'Begin Journey →';
}

function achievementCard(a){
  const unlocked=state.achievements.includes(a.id);
  return `<article class="achievement-card ${unlocked?'':'locked'}"><span class="achievement-icon">${unlocked?a.icon:'?'}</span><div><strong>${escapeHTML(a.title)}</strong><small>${escapeHTML(a.description)}</small></div></article>`;
}

function renderCampaign(){
  updateGlobalStats();
  const filter=$('#worldFilter');
  if(filter.options.length===1){
    worlds.forEach(w=>filter.insertAdjacentHTML('beforeend',`<option value="${w.id}">${w.number}. ${escapeHTML(w.title)}</option>`));
  }
  const selected=filter.value || 'all';
  const visible=selected==='all'?worlds:worlds.filter(w=>w.id===selected);
  $('#campaignMap').innerHTML=visible.map(w=>{
    const p=worldProgress(w.id),unlocked=isWorldUnlocked(w.id);
    const missionCards=missions.filter(m=>m.world===w.id).map(m=>missionCard(m)).join('');
    return `<section class="world-section ${unlocked?'':'locked'}">
      <header class="world-header"><div class="world-title-wrap"><span class="world-big-icon">${w.icon}</span><div><span class="eyebrow">World ${w.number} · ${escapeHTML(w.subtitle)}</span><h2>${escapeHTML(w.title)}</h2><p>${escapeHTML(w.description)}</p></div></div><div class="world-progress"><strong>${p.done}/${p.total}</strong><small>${unlocked?`${p.percent}% cleared`:'Locked'}</small></div></header>
      <div class="mission-row">${missionCards}</div>
    </section>`;
  }).join('');
  $$('.launch-mission').forEach(btn=>btn.addEventListener('click',()=>startMission(btn.dataset.id)));
}

function missionCard(m){
  const unlocked=isMissionUnlocked(m); const complete=state.completed.includes(m.id); const best=state.missionScores[m.id]||0;
  return `<article class="mission-card ${m.kind==='boss'?'boss':''} ${complete?'complete':''} ${unlocked?'':'locked'}">
    <header><span class="badge">${m.kind==='boss'?'⚠ BOSS':escapeHTML(m.label.toUpperCase())}</span><span class="badge">${complete?'✓ CLEAR':`+${m.baseXp} XP`}</span></header>
    <h3>${escapeHTML(m.title)}</h3><p>${escapeHTML(m.story)}</p>
    <div class="mission-footer"><small>${best?`Best: ${best} XP`:escapeHTML(m.objective)}</small><button class="${complete?'secondary-btn':'primary-btn'} launch-mission" type="button" data-id="${m.id}" ${unlocked?'':'disabled'}>${complete?'Replay':unlocked?'Launch':'Locked'}</button></div>
  </article>`;
}

function renderAcademy(search=$('#academySearch')?.value||''){
  const term=search.trim().toLowerCase();
  $$('.toggle-btn[data-academy-depth]').forEach(b=>b.classList.toggle('active',b.dataset.academyDepth===academyDepth));
  const modules=academyModules.filter(m=>!term || `${m.title} ${m.summary} ${m.newbie} ${m.deep} ${m.skills.join(' ')}`.toLowerCase().includes(term));
  $('#academyGrid').innerHTML=modules.length?modules.map(m=>{
    const explanation=academyDepth==='newbie'?m.newbie:m.deep;
    const rate=Math.round(Math.max(...m.skills.map(skillRate),0)*100);
    return `<article class="academy-card"><header><span class="academy-icon">${m.icon}</span><span class="badge">${escapeHTML(m.level)} · ${rate}% mastery</span></header><h3>${escapeHTML(m.title)}</h3><p class="summary">${escapeHTML(m.summary)}</p><div class="academy-explanation">${escapeHTML(explanation)}</div><div class="academy-actions"><button class="secondary-btn academy-practice" data-skill="${m.skills[0]}" type="button">Practice</button><button class="secondary-btn academy-lab" data-module="${m.id}" type="button">Open lab</button></div></article>`;
  }).join(''):`<article class="academy-card"><h3>No matching academy module</h3><p class="summary">Try a broader search term.</p></article>`;
  $$('.academy-practice').forEach(b=>b.addEventListener('click',()=>startMission(findMissionForSkill(b.dataset.skill).id)));
  $$('.academy-lab').forEach(b=>b.addEventListener('click',()=>openLabForModule(b.dataset.module)));
}

function openLabForModule(moduleId){
  const map={caesar:'caesar',vigenere:'caesar','xor-stream':'xor',aes:'aes',modular:'number','number-theory':'number',dh:'dh',rsa:'rsa',hash:'hash'};
  activeSandbox=map[moduleId]||'caesar'; setView('sandbox');
}

function renderGuide(search=$('#guideSearch')?.value||''){
  const term=search.trim().toLowerCase();
  const rows=fieldGuide.filter(g=>!term || `${g.title} ${g.body} ${g.note}`.toLowerCase().includes(term));
  $('#guideGrid').innerHTML=rows.length?rows.map(g=>`<article class="guide-card"><h3>${escapeHTML(g.title)}</h3><p>${escapeHTML(g.body)}</p><div class="guide-note">${escapeHTML(g.note)}</div></article>`).join(''):`<article class="guide-card"><h3>No results</h3><p>Try “AES”, “inverse”, “certificate”, “replay”, or “quantum”.</p></article>`;
}

const questionBank={
  classical:[
    qChoice('A monoalphabetic substitution is vulnerable mainly because…',['it uses no arithmetic','letter-frequency patterns survive the substitution','it always uses RSA','the ciphertext is shorter'],1,'classical','Natural-language statistics remain visible through a fixed substitution.','Look for a property preserved by a one-to-one letter replacement.','A fixed substitution changes symbols, not the statistical structure of the language.'),
    qChoice('Which statement best describes a transposition cipher?',['It changes symbol identities','It rearranges symbol positions','It hashes each word','It generates a public key'],1,'classical','Transposition preserves the symbols but changes their positions.','Ask whether the characters themselves are replaced or only moved.','Transposition is a permutation of positions rather than a substitution of values.'),
    qChoice('Why is a Caesar cipher easy to brute-force?',['Only 26 shifts exist','It requires prime factorization','It uses 256-bit keys','It needs a certificate'],0,'caesar','The entire keyspace can be tried almost instantly.','Count the possible rotations of a 26-letter alphabet.','A tiny keyspace makes exhaustive search trivial.')
  ],
  stream:[
    qChoice('In a stream cipher, the plaintext is typically combined with…',['a pseudorandom keystream','a certificate chain','a prime factorization','a database index'],0,'stream','A stream cipher generates a keystream that is combined with plaintext, commonly by XOR.','Think about what is applied bit-by-bit or byte-by-byte.','The key usually seeds a generator; the resulting keystream is what combines with data.'),
    qChoice('Which condition is critical for many nonce-based stream/AEAD constructions?',['Nonce uniqueness under a key','The nonce must be secret','The plaintext must be prime','The hash must be 32 bits'],0,'stream','Nonce reuse can repeat internal keystream material or break authentication.','A nonce often does not need secrecy; focus on reuse.','Nonce requirements are construction-specific, but uniqueness is a common critical rule.')
  ],
  'otp-reuse':[
    qChoice('If C₁=P₁⊕K and C₂=P₂⊕K, what is C₁⊕C₂?',['K','P₁⊕P₂','P₁⊕K','0'],1,'xor','The repeated keystream cancels because K⊕K=0.','Group the two K terms together.','C₁⊕C₂=P₁⊕K⊕P₂⊕K=P₁⊕P₂.'),
    qChoice('What makes a true one-time pad “one-time”?',['The key is reused once per user','The pad is never reused for another message','The ciphertext expires after one minute','The algorithm only runs one round'],1,'stream','Reusing the same random pad destroys the information-theoretic secrecy guarantee.','The name refers to the pad/key material, not a timer.','The pad must be random, as long as the message, secret, and used only once.')
  ],
  aes:[
    qChoice('Which AES transformation applies a nonlinear byte substitution?',['SubBytes','ShiftRows','MixColumns','AddRoundKey'],0,'aes','SubBytes uses the AES S-box to replace every byte nonlinearly.','The name literally says bytes are substituted.','The S-box is central to AES nonlinearity and confusion.'),
    qChoice('Which AES operation mixes bytes within each column?',['SubBytes','ShiftRows','MixColumns','Key expansion'],2,'aes','MixColumns multiplies each state column by a fixed matrix over GF(2^8).','Look for the operation whose name mentions columns.','MixColumns spreads byte influence across a column.'),
    qChoice('AES-128 uses how many encryption rounds?',['8','10','12','14'],1,'aes','AES-128 uses 10 rounds.','AES round count increases with key size.','AES-128: 10, AES-192: 12, AES-256: 14.'),
    qChoice('Which standard AES round operation is omitted in the final round?',['SubBytes','ShiftRows','MixColumns','AddRoundKey'],2,'aes','The final AES round omits MixColumns.','Three transformations remain in the final round.','The final round is SubBytes → ShiftRows → AddRoundKey.')
  ],
  modes:[
    qChoice('Which mode most obviously leaks repeated plaintext block patterns?',['ECB','CBC','CTR','GCM'],0,'modes','ECB encrypts equal blocks independently to equal ciphertext blocks under the same key.','Think of the famous encrypted-image example.','ECB lacks chaining or nonce-based variation between equal blocks.'),
    qChoice('CTR mode conceptually turns a block cipher into…',['a hash function','a stream-like cipher','a public-key system','a signature scheme'],1,'modes','CTR encrypts counter blocks to make a keystream that is XORed with plaintext.','Counters produce something combined with plaintext.','CTR is stream-like and requires counter/nonce uniqueness.'),
    qChoice('Why prefer an AEAD mode for new application designs?',['It compresses data','It combines confidentiality with integrity/authentication','It eliminates keys','It hides message length completely'],1,'modes','AEAD protects encrypted content against undetected modification while also providing confidentiality.','Encryption alone does not always detect tampering.','AEAD constructions bind ciphertext and optional associated data to an authentication tag.')
  ],
  ecb:[
    qChoice('An encrypted bitmap still shows the outline of the original logo. The strongest clue is…',['the key was typed in lowercase','identical blocks encrypt independently and repeat','the IV was too random','SHA-256 is slow'],1,'modes','Visible structure is a classic symptom of deterministic independent block encryption such as ECB.','Focus on repeated regions in the plaintext.','Equal plaintext blocks map to equal ciphertext blocks under ECB.'),
    qChoice('The best redesign for a new system is generally to…',['keep ECB and rotate the key hourly','use a standardized authenticated-encryption construction with correct nonce handling','Base64-encode before ECB','compress twice'],1,'modes','Use a modern standardized AEAD mode/construction and follow its nonce requirements.','A stronger mode solves more than simply changing the key more often.','Security should include both confidentiality and integrity.')
  ],
  asymmetric:[
    qChoice('Which key is normally distributed openly in public-key cryptography?',['Private key','Public key','Session secret','Password hash'],1,'asymmetric','The public key is designed for distribution; the private key must remain secret.','The names are a clue.','Security depends on the private key remaining under the owner’s control.'),
    qChoice('For confidentiality to Bob using ordinary public-key encryption, Alice encrypts with…',["Alice's private key","Bob's public key","Bob's private key","Alice's password"],1,'asymmetric','Bob’s public key is used so only the matching private key can decrypt.','Ask who should be able to decrypt.','Confidentiality targets the recipient’s public/private keypair.'),
    qChoice('Why do real systems often use hybrid encryption?',['Public-key crypto is typically slower for bulk data','Symmetric keys cannot encrypt','Hash functions require certificates','RSA only works on images'],0,'asymmetric','Public-key techniques establish or wrap a symmetric session key; fast symmetric cryptography handles bulk data.','Compare performance roles.','Hybrid design combines the distribution advantages of public-key methods with symmetric efficiency.')
  ],
  hash:[
    qChoice('Collision resistance asks that it be hard to…',['recover a given input from its digest','find any two distinct inputs with the same digest','compute the digest','encrypt the digest'],1,'hash','A collision is any distinct pair x,y with H(x)=H(y).','A collision does not start from a specified message.','Preimage and collision resistance are different properties.'),
    qChoice('A cryptographic hash output is usually…',['fixed length for a given algorithm','the same length as input','secret by definition','reversible with the key'],0,'hash','Hash functions map arbitrary-size input to a fixed-size digest.','Think of SHA-256: the name hints at digest size.','A hash is not encryption and has no decryption key.'),
    qChoice('The avalanche effect means…',['the digest grows with the file','small input changes cause widespread output changes','the hash can be decrypted','identical inputs produce different hashes'],1,'hash','Strong diffusion makes tiny input changes alter many digest bits.','Compare two nearly identical messages.','Identical input still deterministically produces identical output for a normal hash.')
  ],
  passwords:[
    qChoice('For password databases, why is a unique salt useful?',['It prevents users from choosing short passwords','It makes identical passwords produce different stored values','It encrypts the database','It replaces access control'],1,'hash','Unique salts defeat precomputed tables and hide equality of identical passwords.','Think about two users choosing the same password.','The salt is stored alongside the derived password value and need not be secret.'),
    qChoice('Which is the safer password-storage design?',['Raw SHA-256(password)','MD5(password)','A salted, intentionally expensive password hashing/KDF construction','Base64(password)'],2,'hash','Password hashing should slow offline guessing and use unique salts.','Fast general-purpose hashes are ideal for files, not password guessing resistance.','Purpose-built password hashing/KDF algorithms increase attacker cost.')
  ],
  ibe:[
    qChoice('In identity-based encryption, a user identity can act as…',['a public identifier/key input','the symmetric plaintext','a random nonce only','the private key itself'],0,'ibe','An identity string can be used as the public identifier; a trusted authority derives/issues the private key.','Think of an email address being used before obtaining a certificate.','The private-key generator remains a powerful trust point.'),
    qChoice('A central concern in many IBE designs is…',['there are no public identifiers','key escrow/trust in the private-key generator','AES has no S-box','hashes become reversible'],1,'ibe','The authority capable of generating private keys creates significant trust and escrow implications.','Who can generate everyone’s private keys?','Authority compromise can affect many users at once.')
  ],
  abe:[
    qChoice('Attribute-based encryption is most useful when access should depend on…',['a set of descriptive attributes or a policy','one Caesar shift','a single IP address only','the message hash length'],0,'abe','ABE expresses cryptographic access around attributes such as role, department, clearance, or project.','Think policy rather than one named recipient.','ABE is about cryptographic authorization conditions.'),
    qChoice('Which operational issue becomes important in ABE deployments?',['Attribute revocation and lifecycle','Choosing a Caesar alphabet','Avoiding all random numbers','Making ciphertext human-readable'],0,'abe','Attributes change; revocation and key/policy lifecycle need deliberate design.','What happens when a user changes role?','Fine-grained cryptographic policy has lifecycle complexity.')
  ],
  access:[
    qChoice('Authentication answers primarily…',['What is the ciphertext length?','Who are you / can you prove identity?','Which hash is fastest?','How many AES rounds exist?'],1,'access','Authentication establishes an identity or peer. Authorization decides what that identity may do.','Separate identity from permission.','Encryption policy is not a complete identity system.'),
    qChoice('Authorization answers primarily…',['What is this identity allowed to access or do?','What is the RSA modulus?','Who generated a random nonce?','What is the network latency?'],0,'access','Authorization applies policy after or alongside identity establishment.','Think permissions.','Identity and access decisions are related but distinct.')
  ],
  attacks:[
    qChoice('A replay attack sends…',['a mathematically weaker key','a previously valid message again','two primes with the same size','a longer certificate chain'],1,'attacks','Replay exploits insufficient freshness checking.','The attacker may not need to modify the original message.','Nonces, sequence numbers, timestamps, and protocol state can provide freshness.'),
    qChoice('A side-channel attack primarily exploits…',['mathematical factorization only','implementation leakage such as timing or cache behavior','the use of HTTPS','certificate names'],1,'attacks','Physical or microarchitectural behavior can leak secrets despite strong algorithms.','Look outside the mathematical input/output model.','Constant-time implementations and hardened platforms mitigate classes of side channels.'),
    qChoice('A downgrade attack tries to…',['force weaker protocol options','increase the key size','improve entropy','rotate certificates'],0,'attacks','The attacker manipulates negotiation so endpoints use weaker supported parameters.','The clue is “down” in security strength.','Protocols should authenticate negotiation and remove obsolete options.')
  ],
  protocols:[
    qChoice('A cryptographic protocol uses strong algorithms but disables certificate validation. What is the primary problem?',['The cipher is too slow','The peer is not authenticated','The hash output is too long','The plaintext cannot be encoded'],1,'protocols','Confidentiality to an unauthenticated endpoint can still be intercepted by an active attacker.','Strong encryption does not tell you who is on the other end.','Authentication must bind the session to the intended peer.'),
    qChoice('What is “crypto agility”?',['Changing ciphers every packet','The ability to inventory and replace cryptographic algorithms/protocols without redesigning the whole system','Using only one algorithm forever','Encoding keys as text'],1,'protocols','Crypto agility makes migrations and deprecations operationally feasible.','Think future replacement and inventory.','Agility is governance and architecture, not algorithm roulette.')
  ],
  signatures:[
    qChoice('A digital signature primarily provides…',['confidentiality','authenticity/integrity evidence','compression','anonymity'],1,'signatures','Signatures let verifiers detect changes and verify possession of the signing private key.','A signature usually leaves the message readable.','Encryption and signatures solve different goals.'),
    qChoice('Who normally verifies a signature?',['Anyone with the signer’s public key and required trust context','Only the signer with the private key','Only a certificate authority','Only the symmetric-key holder'],0,'signatures','Verification uses the public verification key.','Signing uses private; verifying uses public.','Trust in the key-to-identity binding remains important.')
  ],
  pki:[
    qChoice('A certificate chain ultimately relies on…',['a locally trusted root/trust anchor','the server password','a Caesar key','a reused nonce'],0,'pki','Clients begin from configured trust anchors and validate signatures down to the leaf certificate.','Where does trust start?','A valid signature chain is necessary but hostname/time/usage validation also matters.'),
    qChoice('A TLS certificate is cryptographically valid but issued for a different hostname. A correct client should…',['accept it because it is signed','reject the identity mismatch','ignore the hostname for speed','hash the URL again'],1,'pki','The certificate must be valid for the name the client intended to reach.','Identity binding includes the requested hostname.','Chain validity alone does not prove the certificate belongs to the requested site.')
  ],
  tls:[
    qChoice('Why does TLS use symmetric cryptography after key establishment?',['It is efficient for bulk data','Public keys cannot be stored','Hashes cannot run on networks','Certificates are symmetric keys'],0,'tls','Public-key/key-exchange mechanisms establish trust and secrets; symmetric AEAD protects the data efficiently.','Think hybrid encryption.','Modern TLS combines multiple cryptographic roles.'),
    qChoice('Forward secrecy aims to limit damage if…',['a long-term authentication key is compromised later','the plaintext is compressed','a user changes browser theme','a hash is displayed'],0,'tls','Past session traffic should remain protected when ephemeral session secrets are no longer derivable from a later long-term key compromise.','Think about recordings of old traffic.','Ephemeral authenticated key exchange is central to this property.')
  ],
  pqc:[
    qChoice('Shor’s algorithm most directly threatens widely used systems based on…',['integer factorization and discrete logarithms','AES substitution tables only','password salts','file compression'],0,'pqc','RSA and traditional DH/ECC rely on factorization or discrete-log problems threatened by sufficiently capable quantum computers.','Think public-key number theory.','Symmetric cryptography is affected differently, mainly through search speedups such as Grover’s.'),
    qChoice('Does post-quantum cryptography require a quantum computer to run?',['Yes','No, PQC algorithms run on ordinary computers','Only for hashing','Only for certificates'],1,'pqc','PQC is designed to resist quantum attackers but executes on conventional hardware.','The adjective describes the threat model, not the device required.','Migration can happen before large quantum computers exist.')
  ],
  kem:[
    qChoice('A KEM is designed primarily to…',['encapsulate/establish shared key material','compress files','draw random images','replace all hashing'],0,'kem','Key Encapsulation Mechanisms establish a shared secret that can feed symmetric cryptography.','The K stands for Key.','KEMs are common building blocks in post-quantum key establishment.'),
    qChoice('A hybrid classical + PQ key establishment is useful because…',['it can combine security assumptions during migration','it makes keys public','it eliminates certificates automatically','it prevents all software bugs'],0,'kem','Hybrid deployment can preserve classical assurance while adding a post-quantum component during transition.','Think migration risk rather than magic security.','Composition must follow a sound standardized design.')
  ],
  migration:[
    qChoice('“Harvest now, decrypt later” is most relevant when…',['encrypted data must remain confidential for many years','data is already public','the system uses no cryptography','the file is temporary and non-sensitive'],0,'migration','Attackers can capture ciphertext now and wait for future cryptanalytic capability.','Consider data lifetime.','Long-lived secrets may need earlier PQ migration priority.'),
    qChoice('A sensible first step in cryptographic migration is…',['inventory where algorithms, keys and protocols are used','randomly replace libraries','disable TLS','double all passwords'],0,'migration','You cannot prioritize or replace cryptography you have not inventoried.','Start with visibility.','Inventory and data-lifetime analysis support a risk-based migration plan.')
  ],
  mitm:[
    qChoice('Plain Diffie–Hellman does not inherently provide…',['a shared secret','modular exponentiation','peer authentication','public values'],2,'mitm','Without authentication, an active attacker can establish separate secrets with each endpoint.','The math can be right while the identity is wrong.','Secure protocols authenticate key-exchange transcripts or keys.'),
    qChoice('The most direct defense against key-substitution MITM is to…',['authenticate the exchanged keys/handshake','make g secret','reuse the same exponent forever','send the private exponent too'],0,'mitm','The public exchange must be bound to the intended peer identity.','Do not try to make public parameters secret.','Certificates, signatures or other authenticated mechanisms can provide the binding.')
  ]
};

function qChoice(prompt,options,answer,skill,explanation,hint,newbie,deep=explanation){ return {type:'choice',prompt,options,answer,skill,explanation,hint,newbie,deep}; }
function qInput(prompt,answer,skill,explanation,hint,newbie,deep=explanation,accepted=[]){ return {type:'input',prompt,answer:String(answer),accepted:accepted.map(String),skill,explanation,hint,newbie,deep}; }

function buildMissionQuestions(mission){
  const difficulty=state.difficulty;
  const desired=mission.questions;
  const generated=[];
  for(let i=0;i<desired+3;i++) generated.push(generateQuestionForTopic(mission.topic,difficulty));
  return shuffle(generated).slice(0,desired);
}

function generateQuestionForTopic(topic,difficulty){
  const numericGenerators={
    caesar:makeCaesarQuestion,vigenere:makeVigenereQuestion,xor:makeXorQuestion,modular:makeModularQuestion,inverse:makeInverseQuestion,modexp:makeModPowQuestion,
    phi:makePhiQuestion,primitive:makePrimitiveQuestion,crt:makeCrtQuestion,dh:makeDhQuestion,'dh-shared':makeDhSharedQuestion,rsa:makeRsaQuestion,'rsa-boss':makeRsaBossQuestion
  };
  if(topic==='battle-boss') return sample([...(questionBank.attacks||[]),...(questionBank.protocols||[]),...(questionBank.modes||[])]);
  if(topic==='avalanche') return sample(questionBank.hash);
  if(numericGenerators[topic]) return numericGenerators[topic](difficulty);
  const bank=questionBank[topic] || questionBank[worlds.find(w=>w.skills.includes(topic))?.skills?.[0]] || questionBank.attacks;
  return structuredClone(sample(bank));
}

function difficultyScale(difficulty){ return ({explorer:1,analyst:2,cryptographer:3,nightmare:4})[difficulty]||1; }

function makeCaesarQuestion(difficulty){
  const words=['ORBIT','CIPHER','SECURE','NETWORK','PRIVACY','DEFEND','SIGNAL','VECTOR','PUZZLE','QUANTUM'];
  const word=sample(words), scale=difficultyScale(difficulty), shift=randomInt(1,scale===1?8:25);
  if(Math.random()<.5){
    const ans=caesar(word,shift);
    return qInput(`Encrypt ${word} with a Caesar shift of ${shift}.`,ans,'caesar',`${word} → ${ans}. Each letter value uses c=(p+${shift}) mod 26.`,`Move each letter forward ${shift} positions, wrapping after Z.`,`Treat A=0,…,Z=25. Add ${shift}, then reduce modulo 26.`);
  }
  const cipher=caesar(word,shift);
  return qInput(`Decrypt ${cipher} with Caesar key ${shift}.`,word,'caesar',`${cipher} → ${word}. Decryption subtracts the key modulo 26.`,`Move every letter backward ${shift} positions.`,`Use p=(c−${shift}) mod 26.`);
}

function makeVigenereQuestion(difficulty){
  const cases=[['ATTACK','KEY'],['DEFEND','LOCK'],['CIPHER','CODE'],['ORBITAL','STAR'],['NETWORK','NODE'],['QUANTUM','LATTICE']];
  const [plain,key]=sample(cases); const answer=vigenere(plain,key);
  return qInput(`Encrypt ${plain} with Vigenère key ${key}.`,answer,'vigenere',`${plain} with repeating key ${key.repeat(Math.ceil(plain.length/key.length)).slice(0,plain.length)} becomes ${answer}.`,'Repeat the keyword to match the message, convert letters to 0–25, then add modulo 26.','Vigenère is a sequence of Caesar shifts controlled by the key letters.');
}

function makeXorQuestion(difficulty){
  const len=difficultyScale(difficulty)>=3?12:8;
  const a=Array.from({length:len},()=>randomInt(0,1)).join(''); const b=Array.from({length:len},()=>randomInt(0,1)).join(''); const ans=xorBits(a,b);
  return qInput(`Compute ${a} ⊕ ${b}.`,ans,'xor',`${a} ⊕ ${b} = ${ans}.`,`Equal bits give 0; different bits give 1.`,'XOR each position independently. 0⊕0=0, 0⊕1=1, 1⊕0=1, 1⊕1=0.');
}

function makeModularQuestion(difficulty){
  const scale=difficultyScale(difficulty); const n=sample(scale>=3?[17,23,29,31]:[5,7,11,12,13]); const a=randomInt(n,scale>=3?n*12:n*5); const b=randomInt(2,scale>=3?80:30);
  const ans=mod(a+b,n);
  return qInput(`Compute (${a}+${b}) mod ${n}.`,ans,'modular',`${a}+${b}=${a+b}; the remainder after division by ${n} is ${ans}.`,`Add first, then reduce by multiples of ${n}.`,`Modulo keeps only the position on a ${n}-point clock.`);
}

function makeInverseQuestion(difficulty){
  const moduli=difficultyScale(difficulty)>=3?[17,19,23,26,29,31]:[7,8,10,11,13,14]; const n=sample(moduli); let a=randomInt(2,n-1);
  const inv=modInverse(a,n);
  if(inv===null) return qInput(`Does ${a} have a multiplicative inverse modulo ${n}? Enter YES or NO.`,'NO','inverse',`gcd(${a},${n})=${gcd(a,n)}, so no inverse exists.`,'An inverse exists exactly when gcd(a,n)=1.','A multiplicative inverse is an “undo multiplier”: ax≡1 mod n. If a shares a factor with n, that x cannot exist.');
  return qInput(`Find ${a}⁻¹ mod ${n}.`,inv,'inverse',`${a}×${inv}=${BigInt(a)*inv} ≡ 1 (mod ${n}).`,`Find x such that ${a}x leaves remainder 1 modulo ${n}.`,'The inverse is the number that “undoes” multiplication by a on the modular clock.');
}

function makeModPowQuestion(difficulty){
  const scale=difficultyScale(difficulty); const m=sample(scale>=3?[23,29,31,37,41]:[7,11,13,17,19]); const a=randomInt(2,m-2); const e=randomInt(scale>=3?11:3,scale>=4?80:scale>=3?32:12); const ans=modPow(a,e,m);
  return qInput(`Compute ${a}^${e} mod ${m}.`,ans,'modexp',`Square-and-multiply gives ${a}^${e} mod ${m} = ${ans}.`,`Write ${e} in binary and repeatedly square modulo ${m}.`,'Do not build the huge power. Keep reducing intermediate values modulo the modulus.');
}

function makePhiQuestion(difficulty){
  const values=difficultyScale(difficulty)>=3?[33,35,39,55,65,77,91]:[7,9,10,15,21,26,35]; const n=sample(values); const ans=phi(n);
  return qInput(`Compute Euler’s totient φ(${n}).`,ans,'phi',`φ(${n})=${ans}. It counts residues up to ${n} that are coprime to ${n}.`,`Factor ${n} first, then apply φ(n)=n∏(1−1/p).`,'Count numbers that share no common factor with the modulus except 1.');
}

function makePrimitiveQuestion(difficulty){
  const p=sample(difficultyScale(difficulty)>=3?[17,19,23,29]:[5,7,11,13]); const candidates=Array.from({length:p-2},(_,i)=>i+2); const g=sample(candidates); const ans=isPrimitiveRoot(g,p)?'YES':'NO';
  return qInput(`Is ${g} a primitive root modulo ${p}? Enter YES or NO.`,ans,'primitive',`${g} ${ans==='YES'?'generates':'does not generate'} all non-zero residues modulo ${p} through its powers.`,`Compute ${g}^1, ${g}^2, … modulo ${p} and check whether all ${p-1} non-zero residues appear.`,'A primitive root is a generator: its powers visit every non-zero position in the multiplicative modular system.');
}

function makeCrtQuestion(difficulty){
  const sets=difficultyScale(difficulty)>=3?[
    {r:[2,3,2],m:[3,5,7]},{r:[1,4,6],m:[5,7,11]},{r:[3,2],m:[7,11]}
  ]:[{r:[2,3],m:[3,5]},{r:[1,2],m:[4,5]},{r:[2,1],m:[3,5]}];
  const c=sample(sets),result=crt(c.r,c.m); const prompt=c.r.map((r,i)=>`x≡${r} (mod ${c.m[i]})`).join(', ');
  return qInput(`Find the smallest nonnegative x satisfying ${prompt}.`,result.result,'crt',`CRT gives x=${result.result} modulo ${result.modulus}.`,`Start with numbers matching the first congruence and test the others, or use the constructive CRT formula.`,'Several remainder clues can point to one repeating solution modulo the product of pairwise-coprime moduli.');
}

function dhParams(difficulty){
  const sets=difficultyScale(difficulty)>=3?[[29,2],[31,3],[37,2],[41,6]]:[[23,5],[17,3],[19,2]]; const [p,g]=sample(sets); const a=randomInt(2,Math.min(p-2,difficultyScale(difficulty)>=3?18:9)); const b=randomInt(2,Math.min(p-2,difficultyScale(difficulty)>=3?18:9)); const A=Number(modPow(g,a,p)),B=Number(modPow(g,b,p)),shared=Number(modPow(B,a,p));
  return {p,g,a,b,A,B,shared};
}
function makeDhQuestion(difficulty){ const x=dhParams(difficulty); return qInput(`Diffie–Hellman uses p=${x.p}, g=${x.g}. Alice’s private exponent is a=${x.a}. Compute A=g^a mod p.`,x.A,'dh',`A=${x.g}^${x.a} mod ${x.p}=${x.A}.`,`Use modular exponentiation.`,'Alice can publish A because reversing g^a mod p to recover a is intended to be hard in properly chosen large groups.'); }
function makeDhSharedQuestion(difficulty){ const x=dhParams(difficulty); return qInput(`DH uses p=${x.p}. Alice has private a=${x.a}; Bob publishes B=${x.B}. Compute the shared secret.`,x.shared,'dh',`K=B^a mod p=${x.B}^${x.a} mod ${x.p}=${x.shared}.`,`Compute B^a mod p.`,'Bob independently computes A^b mod p and obtains the same value.'); }

function rsaParams(difficulty){
  const pairs=difficultyScale(difficulty)>=3?[[11,17],[13,19],[17,23],[19,29]]:[[3,11],[5,11],[7,13],[11,13]]; const [p,q]=sample(pairs); const n=p*q,ph=(p-1)*(q-1); const choices=[3,5,7,11,17].filter(e=>e<ph&&gcd(e,ph)===1); const e=sample(choices); const d=Number(modInverse(e,ph)); const m=randomInt(2,Math.min(n-2,20)); const c=Number(modPow(m,e,n)); return {p,q,n,ph,e,d,m,c};
}
function makeRsaQuestion(difficulty){
  const x=rsaParams(difficulty); const type=randomInt(1,3);
  if(type===1) return qInput(`RSA uses p=${x.p} and q=${x.q}. Enter n,φ(n) as two comma-separated numbers.`,`${x.n},${x.ph}`,'rsa',`n=${x.p}×${x.q}=${x.n}; φ(n)=(${x.p}−1)(${x.q}−1)=${x.ph}.`,'Multiply p and q for n, then multiply p−1 by q−1 for φ(n).','The modulus is public. The totient is easy to compute when the prime factors are known.',`n and φ(n) define the modular structure used to relate e and d.` , [`${x.n}, ${x.ph}`,`${x.n} ${x.ph}`]);
  if(type===2) return qInput(`For RSA with φ(n)=${x.ph} and public exponent e=${x.e}, compute the private exponent d.`,x.d,'rsa',`d=${x.d} because ${x.e}×${x.d}≡1 (mod ${x.ph}).`,`Find the modular inverse of ${x.e} modulo ${x.ph}.`,'d is the multiplicative inverse of e in the totient modulus.');
  return qInput(`Toy RSA public key: (e=${x.e}, n=${x.n}). Encrypt M=${x.m}.`,x.c,'rsa',`C=M^e mod n=${x.m}^${x.e} mod ${x.n}=${x.c}.`,`Compute modular exponentiation, reducing often.`,'Toy RSA demonstrates the arithmetic only. Real RSA encryption requires standardized padding such as OAEP.');
}
function makeRsaBossQuestion(difficulty){
  const x=rsaParams(difficulty); const types=[
    ()=>qInput(`RSA boss: p=${x.p}, q=${x.q}. Compute φ(n).`,x.ph,'rsa',`φ(n)=(${x.p}−1)(${x.q}−1)=${x.ph}.`,`Use the formula for two distinct primes.`,'Knowing p and q makes the totient straightforward.'),
    ()=>qInput(`RSA boss: φ(n)=${x.ph}, e=${x.e}. Find d.`,x.d,'rsa',`d=${x.d}; ${x.e}d≡1 mod ${x.ph}.`,`Compute e⁻¹ mod φ(n).`,'The private exponent undoes the public exponent in the relevant modular structure.'),
    ()=>qInput(`RSA boss: n=${x.n}, e=${x.e}, plaintext M=${x.m}. Find ciphertext C.`,x.c,'rsa',`C=${x.c}.`,`Compute M^e mod n.`,'Use fast modular exponentiation rather than the full power.'),
    ()=>qInput(`RSA boss: n=${x.n}, d=${x.d}, ciphertext C=${x.c}. Recover M.`,x.m,'rsa',`M=C^d mod n=${x.c}^${x.d} mod ${x.n}=${x.m}.`,`Compute C^d mod n.`,'The private exponent reverses the toy RSA transformation for valid messages.')
  ]; return sample(types)();
}

function startMission(id){
  const mission=missions.find(m=>m.id===id); if(!mission || !isMissionUnlocked(mission)){ showToast('Mission locked','Clear the previous operation first.'); return; }
  currentMission=mission;
  missionSession={questions:buildMissionQuestions(mission),index:0,earned:0,correct:0,answered:false,selected:null,hintUsed:false,explainUsed:false,wasComplete:state.completed.includes(id)};
  $('#missionKicker').textContent=`World ${mission.worldNumber} · ${mission.label}${mission.kind==='boss'?' · BOSS':''}`;
  $('#missionModalTitle').textContent=mission.title;
  $('#missionModal').hidden=false; document.body.style.overflow='hidden';
  renderMissionQuestion();
  setTimeout(()=>$('.close-mission')?.focus(),30);
}

function renderMissionQuestion(){
  if(!missionSession || !currentMission) return;
  const {questions,index}=missionSession;
  if(index>=questions.length){ finishMission(); return; }
  const q=questions[index]; missionSession.answered=false; missionSession.selected=null; missionSession.hintUsed=false; missionSession.explainUsed=false;
  $('#questionCounter').textContent=`Question ${index+1} of ${questions.length}`;
  $('#missionScore').textContent=`${missionSession.earned} XP`;
  $('#missionProgressBar').style.width=`${Math.round(index/questions.length*100)}%`;
  $('#hintBtn').disabled=false; $('#explainBtn').disabled=false;
  $('#submitMissionBtn').disabled=false; $('#submitMissionBtn').textContent='Check answer';
  let answerUI='';
  if(q.type==='choice'){
    answerUI=`<div class="answer-options">${q.options.map((o,i)=>`<button class="answer-option" type="button" data-choice="${i}">${escapeHTML(o)}</button>`).join('')}</div>`;
  }else{
    answerUI=`<label class="sr-only" for="missionAnswer">Your answer</label><input class="mission-input" id="missionAnswer" autocomplete="off" spellcheck="false" placeholder="Enter your answer">`;
  }
  const bossHud=currentMission.kind==='boss'?`<div class="boss-hud"><div><span>${currentMission.topic==='rsa-boss'?'RSA VAULT LAYERS':'BOSS INTEGRITY'}</span><strong>${questions.length-index} layers remaining</strong></div><div class="boss-track"><span style="width:${Math.round((questions.length-index)/questions.length*100)}%"></span></div></div>`:'';
  $('#missionBody').innerHTML=`<div class="mission-story"><strong>Situation:</strong> ${escapeHTML(currentMission.story)}</div>${bossHud}<div class="badge">${escapeHTML(difficulties[state.difficulty].name)} · ${escapeHTML(skills.find(s=>s.id===q.skill)?.name||q.skill)}</div><h3 class="question-prompt">${escapeHTML(q.prompt)}</h3>${answerUI}<div id="missionSupport"></div><div id="missionFeedback"></div>`;
  $$('.answer-option','#missionBody').forEach(btn=>btn.addEventListener('click',()=>{
    if(missionSession.answered) return;
    missionSession.selected=Number(btn.dataset.choice); $$('.answer-option','#missionBody').forEach(b=>b.classList.toggle('selected',b===btn));
  }));
  $('#missionAnswer')?.addEventListener('keydown',e=>{if(e.key==='Enter') submitMissionAnswer();});
  setTimeout(()=>$('#missionAnswer')?.focus(),20);
}

function isQuestionCorrect(q,value){
  if(q.type==='choice') return Number(value)===Number(q.answer);
  const normalized=normalizeAnswer(value).replace(/\s*,\s*/g,',');
  const answers=[q.answer,...(q.accepted||[])].map(a=>normalizeAnswer(a).replace(/\s*,\s*/g,','));
  return answers.includes(normalized);
}

function submitMissionAnswer(){
  if(!missionSession || !currentMission) return;
  const q=missionSession.questions[missionSession.index];
  if(missionSession.answered){ missionSession.index++; renderMissionQuestion(); return; }
  const value=q.type==='choice'?missionSession.selected:$('#missionAnswer')?.value;
  if(value===null || value===undefined || String(value).trim()===''){ showToast('Answer required','Choose or enter an answer before checking.'); return; }
  const correct=isQuestionCorrect(q,value); missionSession.answered=true;
  updateSkill(q.skill,correct);
  if(correct){
    const perQuestion=currentMission.baseXp/currentMission.questions;
    const multiplier=difficulties[state.difficulty].multiplier;
    const supportPenalty=(missionSession.hintUsed?.12:0)+(missionSession.explainUsed?.08:0);
    const points=Math.max(5,Math.round(perQuestion*multiplier*(1-supportPenalty)));
    missionSession.earned+=points; missionSession.correct++;
    playTone('success');
  }else playTone('error');
  saveState(); updateAchievements(false);

  if(q.type==='choice'){
    $$('.answer-option','#missionBody').forEach(btn=>{
      const idx=Number(btn.dataset.choice); btn.disabled=true;
      if(idx===Number(q.answer)) btn.classList.add('correct');
      else if(idx===Number(value)) btn.classList.add('incorrect');
    });
  }else $('#missionAnswer').disabled=true;
  const feedback=$('#missionFeedback');
  feedback.innerHTML=`<div class="feedback ${correct?'correct':'incorrect'}"><strong>${correct?'✓ Correct':'✕ Not quite'}</strong><br>${escapeHTML(q.explanation)}</div>`;
  $('#submitMissionBtn').textContent=missionSession.index===missionSession.questions.length-1?'Complete mission':'Next question →';
  $('#missionScore').textContent=`${missionSession.earned} XP`;
}

function showMissionHint(){
  if(!missionSession || missionSession.answered) return;
  const q=missionSession.questions[missionSession.index]; missionSession.hintUsed=true; $('#hintBtn').disabled=true;
  const support=$('#missionSupport'); support.insertAdjacentHTML('beforeend',`<div class="concept-explain warning"><strong>💡 Hint</strong><br>${escapeHTML(q.hint||'Break the problem into smaller steps and identify the security property first.')}</div>`);
}
function showMissionExplanation(){
  if(!missionSession || missionSession.answered) return;
  const q=missionSession.questions[missionSession.index]; missionSession.explainUsed=true; $('#explainBtn').disabled=true;
  const text=state.explanationDepth==='deep'?(q.deep||q.explanation):(q.newbie||q.explanation);
  $('#missionSupport').insertAdjacentHTML('beforeend',`<div class="concept-explain"><strong>📖 ${state.explanationDepth==='deep'?'Technical explanation':'Explain like I’m new'}</strong><br>${escapeHTML(text)}</div>`);
}

function finishMission(){
  const s=missionSession,m=currentMission; if(!s||!m) return;
  const accuracy=Math.round(s.correct/s.questions.length*100); const firstClear=!s.wasComplete;
  const award=firstClear?s.earned:Math.round(s.earned*.25);
  state.xp+=award;
  if(!state.completed.includes(m.id)) state.completed.push(m.id);
  state.missionScores[m.id]=Math.max(state.missionScores[m.id]||0,s.earned);
  saveState(); const newAchievements=updateAchievements(true); updateGlobalStats();
  if(firstClear) celebrate();
  const next=missions.find(x=>isMissionUnlocked(x)&&!state.completed.includes(x.id));
  $('#missionProgressBar').style.width='100%';
  $('#questionCounter').textContent='Mission complete'; $('#missionScore').textContent=`+${award} XP`;
  $('#missionBody').innerHTML=`<div class="mission-complete"><div class="complete-icon">${accuracy>=80?'◇':'✓'}</div><span class="eyebrow">Operation complete</span><h3>${escapeHTML(m.title)}</h3><p>You answered ${s.correct}/${s.questions.length} correctly (${accuracy}%). ${firstClear?`You earned ${award} XP.`:`Replay award: ${award} XP. Your best mission score remains ${state.missionScores[m.id]} XP.`}</p><div class="metrics-grid"><article class="metric-card"><span class="metric-icon">✦</span><div><small>Accuracy</small><strong>${accuracy}%</strong><span>${s.correct} correct answers</span></div></article><article class="metric-card"><span class="metric-icon">◎</span><div><small>Rank</small><strong>${escapeHTML(getRank().name)}</strong><span>${state.xp.toLocaleString()} total XP</span></div></article></div>${newAchievements.length?`<div class="callout success">${newAchievements.map(a=>`${a.icon} ${escapeHTML(a.title)}`).join(' · ')}</div>`:''}</div>`;
  $('#hintBtn').hidden=true; $('#explainBtn').hidden=true;
  $('#submitMissionBtn').textContent=next?'Continue journey →':'Return to campaign';
  $('#submitMissionBtn').onclick=()=>{closeMission(); if(next) startMission(next.id); else setView('campaign');};
  missionSession=null; currentMission=null;
  renderHome(); renderCampaign();
}

function closeMission(){
  $('#missionModal').hidden=true; document.body.style.overflow='';
  $('#hintBtn').hidden=false; $('#explainBtn').hidden=false; $('#submitMissionBtn').onclick=null;
  missionSession=null; currentMission=null;
  renderHome(); if(currentView==='campaign') renderCampaign();
}

function markSandboxUsed(name){
  if(!state.sandboxUsed.includes(name)){ state.sandboxUsed.push(name); state.xp+=10; saveState(); showToast('Lab discovery',`+10 XP for exploring ${name}.`); updateGlobalStats(); }
}
function labHeader(icon,title,desc,badge='Interactive'){ return `<header class="lab-heading"><div><span class="eyebrow">${icon} ${escapeHTML(badge)}</span><h2>${escapeHTML(title)}</h2><p>${escapeHTML(desc)}</p></div></header>`; }

function renderSandbox(name=activeSandbox){
  activeSandbox=name; $$('.lab-tab[data-sandbox]').forEach(b=>b.classList.toggle('active',b.dataset.sandbox===name)); markSandboxUsed(name);
  const renderers={caesar:renderCipherPlayground,xor:renderXorSandbox,number:renderNumberSandbox,dh:renderDhSandbox,rsa:renderRsaSandbox,hash:renderHashSandbox,aes:renderAesSandbox};
  (renderers[name]||renderers.caesar)();
}

function renderCipherPlayground(){
  $('#sandboxStage').innerHTML=`${labHeader('↻','Cipher Playground','Experiment with historical ciphers. These are useful for learning transformations, not for protecting modern data.')}
  <div class="lab-grid"><div class="sandbox-form">
    <label>Algorithm<select id="cipherAlgorithm"><option value="caesar">Caesar</option><option value="vigenere">Vigenère</option><option value="affine">Affine</option><option value="playfair">Playfair</option><option value="rail">Rail Fence</option></select></label>
    <label>Direction<select id="cipherMode"><option value="encrypt">Encrypt</option><option value="decrypt">Decrypt</option></select></label>
    <label>Message<textarea id="cipherText">ATTACK AT DAWN</textarea></label>
    <div id="cipherParams"></div>
  </div><div class="output-panel"><h3>Transformed output</h3><div class="output-value" id="cipherOutput"></div><div class="step-list" id="cipherSteps"></div><div class="callout warning">Historical ciphers have tiny or structurally weak key spaces. Use this lab to learn—not to protect real secrets.</div></div></div>`;
  const alg=$('#cipherAlgorithm'),mode=$('#cipherMode'),text=$('#cipherText');
  const renderParams=()=>{
    const a=alg.value;
    $('#cipherParams').innerHTML=a==='caesar'?`<label>Shift<div class="range-row"><input id="caesarShift" type="range" min="0" max="25" value="3"><output id="shiftValue">3</output></div></label>`:
      a==='vigenere'?`<label>Keyword<input id="vigenereKey" value="KEY" autocomplete="off"></label>`:
      a==='affine'?`<label>Multiplier a (must be coprime to 26)<input id="affineA" type="number" value="5"></label><label>Offset b<input id="affineB" type="number" value="8"></label>`:
      a==='playfair'?`<label>Keyword<input id="playfairKey" value="MONARCHY" autocomplete="off"></label>`:
      `<label>Rails<input id="railCount" type="number" min="2" max="10" value="3"></label>`;
    $$('#cipherParams input').forEach(i=>i.addEventListener('input',update)); update();
  };
  const update=()=>{
    const decrypt=mode.value==='decrypt',a=alg.value,t=text.value; let out='',steps='';
    if(a==='caesar'){
      const shift=Number($('#caesarShift')?.value||3); if($('#shiftValue')) $('#shiftValue').textContent=shift;
      out=caesar(t,shift,decrypt); const chars=[...t.toUpperCase()].filter(ch=>/[A-Z]/.test(ch)).slice(0,12);
      steps=chars.map(ch=>{const p=ch.charCodeAt(0)-65,v=mod(p+(decrypt?-shift:shift),26);return `<div class="step">${ch}(${p}) ${decrypt?'−':'+'} ${shift} mod 26 = ${v} → ${String.fromCharCode(65+v)}</div>`;}).join('');
    }else if(a==='vigenere'){
      const key=$('#vigenereKey')?.value||'KEY'; out=vigenere(t,key,decrypt); steps=vigenereSteps(t,key,decrypt).slice(0,12).map(s=>`<div class="step">${s.letter}(${s.p}) ${decrypt?'−':'+'} ${s.keyLetter}(${s.k}) mod 26 = ${s.output}</div>`).join('');
    }else if(a==='affine'){
      const av=Number($('#affineA')?.value||5),bv=Number($('#affineB')?.value||8); out=affine(t,av,bv,decrypt);
      if(out===null){out='Invalid a: gcd(a,26) must equal 1.';steps=`<div class="step">gcd(${av},26)=${gcd(av,26)} → no multiplicative inverse.</div>`;} else steps=`<div class="step">${decrypt?'p = a⁻¹(c−b) mod 26':'c = (a·p+b) mod 26'} with a=${av}, b=${bv}</div>`;
    }else if(a==='playfair'){
      const key=$('#playfairKey')?.value||'MONARCHY'; out=playfair(t,key,decrypt)||'Use an even number of ciphertext letters for decryption.'; const sq=playfairSquare(key); steps=`<div class="step">5×5 key square (I/J combined): ${sq.join('')}</div><div class="step">Encrypt digraphs: same row → right, same column → down, rectangle → opposite corners. Decryption reverses the row/column shifts.</div>`;
    }else{
      const rails=Number($('#railCount')?.value||3); out=railFence(t,rails,decrypt); steps=`<div class="step">${decrypt?'Reconstruct':'Write'} the zig-zag path across ${rails} rails, then ${decrypt?'read positions in original order':'read each rail left to right'}.</div>`;
    }
    $('#cipherOutput').textContent=out; $('#cipherSteps').innerHTML=steps;
  };
  alg.addEventListener('change',renderParams); mode.addEventListener('change',update); text.addEventListener('input',update); renderParams();
}

function repeatHexKey(keyHex,length){ if(!keyHex) return ''; let out=''; while(out.length<length) out+=keyHex; return out.slice(0,length); }
function renderXorSandbox(){
  $('#sandboxStage').innerHTML=`${labHeader('⊕','XOR Studio','Operate on raw bits and inspect exactly how a reused keystream cancels out.')}
  <div class="lab-grid"><div class="sandbox-form">
    <label>Bit string A<input id="xorA" value="10110100" inputmode="numeric"></label><label>Bit string B<input id="xorB" value="01101110" inputmode="numeric"></label>
    <div class="output-panel"><h3>A XOR B</h3><div class="output-value" id="xorBitsOut"></div></div>
    <label>Hex A<input id="xorHexA" value="AABBCCDD"></label><label>Hex B<input id="xorHexB" value="12345678"></label>
    <div class="output-panel"><h3>Hex XOR</h3><div class="output-value" id="xorHexOut"></div></div>
  </div><div><div class="callout danger"><strong>Reused-keystream simulator</strong><br>Encrypt two equal-length messages with the same repeated demonstration key. Then XOR the ciphertexts and watch the key disappear.</div>
    <div class="sandbox-form" style="margin-top:14px"><label>Plaintext 1<input id="reuseP1" value="ATTACK AT DAWN"></label><label>Plaintext 2<input id="reuseP2" value="DEFEND AT NOON"></label><label>Demonstration key<input id="reuseKey" value="K3Y"></label></div>
    <div class="step-list" id="reuseSteps"></div>
  </div></div>`;
  const update=()=>{
    const a=$('#xorA').value.trim(),b=$('#xorB').value.trim(); $('#xorBitsOut').textContent=xorBits(a,b)||'Use equal-length bit strings.';
    $('#xorHexOut').textContent=xorHex($('#xorHexA').value,$('#xorHexB').value)||'Use equal-length hexadecimal strings.';
    const p1=$('#reuseP1').value,p2=$('#reuseP2').value,key=$('#reuseKey').value; const h1=textToHex(p1),h2=textToHex(p2),kh=textToHex(key);
    if(!kh || h1.length!==h2.length){ $('#reuseSteps').innerHTML='<div class="step">Use two messages with the same byte length and a non-empty key.</div>'; return; }
    const stream=repeatHexKey(kh,h1.length),c1=xorHex(h1,stream),c2=xorHex(h2,stream),cx=xorHex(c1,c2),px=xorHex(h1,h2);
    $('#reuseSteps').innerHTML=`<div class="step">P1 hex = ${h1}</div><div class="step">P2 hex = ${h2}</div><div class="step">K repeated = ${stream}</div><div class="step">C1 = P1⊕K = ${c1}</div><div class="step">C2 = P2⊕K = ${c2}</div><div class="step">C1⊕C2 = ${cx}</div><div class="step">P1⊕P2 = ${px} ✓ same value</div>`;
  };
  $$('#sandboxStage input').forEach(i=>i.addEventListener('input',update)); update();
}

function renderNumberSandbox(){
  $('#sandboxStage').innerHTML=`${labHeader('≡','Interactive Number Visualizer','Make modular arithmetic visible on a clock, then switch to GCD, inverses, totients, roots, CRT and square-and-multiply.')}
  <div class="lab-grid"><div class="sandbox-form">
    <label>Operation<select id="numberOp"><option value="add">(a+b) mod n</option><option value="gcd">gcd(a,n)</option><option value="inverse">a⁻¹ mod n</option><option value="pow">a^b mod n</option><option value="phi">φ(n)</option><option value="root">primitive root test</option><option value="crt">CRT</option></select></label>
    <label>a<input id="numA" type="number" value="10"></label><label>b / exponent<input id="numB" type="number" value="5"></label><label>modulus n<input id="numN" type="number" min="2" max="97" value="12"></label>
    <div id="crtInputs" hidden><label>Remainders, comma-separated<input id="crtR" value="2,3,2"></label><label>Moduli, comma-separated<input id="crtM" value="3,5,7"></label></div>
    <div class="output-panel"><h3>Result</h3><div class="output-value" id="numberResult"></div><div class="step-list" id="numberSteps"></div></div>
  </div><div class="clock-wrap"><div class="mod-clock" id="modClock"><div class="clock-hand" id="clockHand"></div></div></div></div>`;
  const updateClock=(n,result)=>{
    const clock=$('#modClock'); if(!clock) return; const safeN=Math.max(2,Math.min(24,n));
    clock.querySelectorAll('.clock-number').forEach(x=>x.remove());
    for(let i=0;i<safeN;i++){ const angle=360*i/safeN; const node=document.createElement('span'); node.className=`clock-number ${i===mod(result,safeN)?'active':''}`; node.textContent=i; node.style.transform=`rotate(${angle}deg) translateY(-145px) rotate(${-angle}deg)`; clock.appendChild(node); }
    $('#clockHand').style.transform=`rotate(${360*mod(result,safeN)/safeN}deg)`;
  };
  const update=()=>{
    const op=$('#numberOp').value,a=Number($('#numA').value),b=Number($('#numB').value),n=Math.max(2,Number($('#numN').value)||2); $('#crtInputs').hidden=op!=='crt'; let result='',steps='';
    try{
      if(op==='add'){result=mod(a+b,n);steps=`<div class="step">${a}+${b}=${a+b}</div><div class="step">${a+b} mod ${n} = ${result}</div>`;updateClock(n,result);}
      if(op==='gcd'){result=gcd(a,n);steps=`<div class="step">Use Euclid: repeatedly replace (x,y) with (y,x mod y) until the remainder becomes 0.</div>`;updateClock(n,a);}
      if(op==='inverse'){const inv=modInverse(a,n);result=inv===null?'No inverse':inv.toString();steps=`<div class="step">gcd(${a},${n})=${gcd(a,n)}${inv===null?' ≠ 1 → no inverse':` = 1 → ${a}×${inv} ≡ 1 mod ${n}`}</div>`;updateClock(n,inv===null?a:Number(inv));}
      if(op==='pow'){const details=squareMultiplySteps(a,Math.max(0,b),n);result=details.result.toString();steps=`<div class="step">${b} in binary = ${details.bits}</div>`+details.steps.slice(0,10).map(s=>`<div class="step">bit ${s.bit}: square → ${s.squareResult}${s.multiplyResult!==null?`; multiply by ${a} → ${s.multiplyResult}`:''}</div>`).join('');updateClock(n,Number(details.result));}
      if(op==='phi'){result=phi(n);steps=`<div class="step">φ(${n}) counts numbers from 1 to ${n} that are coprime to ${n}.</div>`;updateClock(n,result);}
      if(op==='root'){result=isPrimitiveRoot(a,n)?'YES — generator':'NO — not a generator';steps=`<div class="step">${isPrime(n)?`${n} is prime. Test powers ${a}^1…${a}^${n-1} mod ${n}.`:`This teaching test expects a prime modulus; ${n} is not prime.`}</div>`;updateClock(n,a);}
      if(op==='crt'){const rs=$('#crtR').value.split(',').map(Number),ms=$('#crtM').value.split(',').map(Number),x=crt(rs,ms);result=x?`${x.result} mod ${x.modulus}`:'Need equal-length, pairwise-coprime moduli';steps=x?x.terms.map(t=>`<div class="step">a=${t.ai}, n=${t.ni}, Mᵢ=${t.Mi}, inverse=${t.yi}</div>`).join(''):'';updateClock(ms[0]||12,x?Number(x.result):0);}
    }catch(error){result='Invalid input';steps=`<div class="step">${escapeHTML(error.message)}</div>`;}
    $('#numberResult').textContent=result; $('#numberSteps').innerHTML=steps;
  };
  $$('#sandboxStage input,#sandboxStage select').forEach(el=>el.addEventListener('input',update)); update();
}

function renderDhSandbox(){
  $('#sandboxStage').innerHTML=`${labHeader('⇄','Diffie–Hellman Simulator','Change public parameters and private exponents, then verify that both parties independently derive the same shared secret.')}
  <div class="sandbox-form"><div class="equation-flow"><div class="flow-node"><small>public prime p</small><strong id="dhPDisplay">23</strong></div><div class="flow-node"><small>public generator g</small><strong id="dhGDisplay">5</strong></div></div>
  <div class="lab-grid"><div><label>Prime p<input id="dhP" type="number" value="23"></label><label>Generator/base g<input id="dhG" type="number" value="5"></label><label>Alice private a<input id="dhA" type="number" value="6"></label><label>Bob private b<input id="dhB" type="number" value="15"></label></div><div class="output-panel"><div class="equation-flow" id="dhFlow"></div><div class="callout warning"><strong>Important:</strong> this arithmetic alone does not authenticate Alice or Bob. Real protocols must protect the exchange against key substitution and man-in-the-middle attacks.</div></div></div></div>`;
  const update=()=>{const p=Number($('#dhP').value),g=Number($('#dhG').value),a=Number($('#dhA').value),b=Number($('#dhB').value);if(!isPrime(p)||p<5){$('#dhFlow').innerHTML='<div class="callout danger">Choose a small prime p ≥ 5 for this teaching simulator.</div>';return;}const A=modPow(g,a,p),B=modPow(g,b,p),s1=modPow(B,a,p),s2=modPow(A,b,p);$('#dhPDisplay').textContent=p;$('#dhGDisplay').textContent=g;$('#dhFlow').innerHTML=`<div class="flow-node"><small>Alice publishes</small><strong>A=${A}</strong></div><span class="flow-arrow">⇄</span><div class="flow-node"><small>Bob publishes</small><strong>B=${B}</strong></div><span class="flow-arrow">→</span><div class="flow-node"><small>Shared</small><strong>K=${s1}</strong></div>`+(s1===s2?`<div class="callout success">Alice computes B^a mod p = ${s1}; Bob computes A^b mod p = ${s2}. They match.</div>`:`<div class="callout danger">Inputs did not produce matching values.</div>`);};
  $$('#sandboxStage input').forEach(i=>i.addEventListener('input',update));update();
}

function renderRsaSandbox(){
  $('#sandboxStage').innerHTML=`${labHeader('φ','RSA Forge','Build a tiny RSA example from primes through encryption and decryption. Toy sizes are intentionally insecure and exist only to make the arithmetic visible.')}
  <div class="lab-grid"><div class="sandbox-form"><label>Prime p<input id="rsaP" type="number" value="11"></label><label>Prime q<input id="rsaQ" type="number" value="17"></label><label>Public exponent e<input id="rsaE" type="number" value="7"></label><label>Message M<input id="rsaM" type="number" value="8"></label></div><div class="output-panel"><div class="step-list" id="rsaSteps"></div></div></div>`;
  const update=()=>{const p=Number($('#rsaP').value),q=Number($('#rsaQ').value),e=Number($('#rsaE').value),m=Number($('#rsaM').value);if(!isPrime(p)||!isPrime(q)||p===q){$('#rsaSteps').innerHTML='<div class="callout danger">p and q must be distinct primes.</div>';return;}const n=p*q,ph=(p-1)*(q-1),d=modInverse(e,ph);if(d===null){$('#rsaSteps').innerHTML=`<div class="step">n=${n}</div><div class="step">φ(n)=${ph}</div><div class="callout danger">e=${e} is invalid because gcd(e,φ(n))=${gcd(e,ph)}. Choose an e coprime to φ(n).</div>`;return;}if(m<0||m>=n){$('#rsaSteps').innerHTML=`<div class="callout danger">For this toy example choose 0 ≤ M &lt; n=${n}.</div>`;return;}const c=modPow(m,e,n),plain=modPow(c,d,n);$('#rsaSteps').innerHTML=`<div class="step">1. n=pq=${p}×${q}=${n}</div><div class="step">2. φ(n)=(${p}−1)(${q}−1)=${ph}</div><div class="step">3. gcd(${e},${ph})=1 → valid public exponent</div><div class="step">4. d=e⁻¹ mod φ(n)=${d}</div><div class="step">5. Public key = (${e}, ${n})</div><div class="step">6. Private teaching exponent d=${d}</div><div class="step">7. C=M^e mod n=${m}^${e} mod ${n}=${c}</div><div class="step">8. M=C^d mod n=${c}^${d} mod ${n}=${plain}</div><div class="callout warning">Textbook RSA is deterministic and insecure for production. Real RSA encryption uses standardized padding such as OAEP and appropriate modern key sizes.</div>`;};
  $$('#sandboxStage input').forEach(i=>i.addEventListener('input',update));update();
}

async function sha256(text){
  if(!globalThis.crypto?.subtle) return null;
  const bytes=new TextEncoder().encode(String(text)); const digest=await crypto.subtle.digest('SHA-256',bytes); return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
}

function renderHashSandbox(){
  $('#sandboxStage').innerHTML=`${labHeader('#','Hash Observatory','Hash two nearly identical messages and measure how many SHA-256 output bits change.')}
  <div class="sandbox-form"><label>Message A<input id="hashA" value="Cryptic Quest"></label><label>Message B<input id="hashB" value="Cryptic quest"></label></div><div class="hash-compare"><div class="hash-box"><h3>SHA-256(A)</h3><code id="hashOutA">Calculating…</code></div><div class="hash-box"><h3>SHA-256(B)</h3><code id="hashOutB">Calculating…</code></div></div><div class="output-panel" style="margin-top:14px"><h3>Avalanche difference</h3><div class="output-value" id="hashDifference">—</div><div class="bit-meter"><span id="hashMeter"></span></div><div class="callout">A one-character change should alter many output bits. This visualizes diffusion; it is not a formal statistical test of the hash function.</div></div>`;
  let ticket=0; const update=async()=>{const id=++ticket,a=await sha256($('#hashA').value),b=await sha256($('#hashB').value);if(id!==ticket)return;if(!a||!b){$('#hashOutA').textContent=$('#hashOutB').textContent='Web Crypto unavailable in this context.';return;}$('#hashOutA').textContent=a;$('#hashOutB').textContent=b;const diff=bitDifference(a,b),pct=diff/256*100;$('#hashDifference').textContent=`${diff} / 256 bits (${pct.toFixed(1)}%)`;$('#hashMeter').style.width=`${pct}%`;};
  $('#hashA').addEventListener('input',update);$('#hashB').addEventListener('input',update);update();
}

function aesMatrixHTML(bytes){
  // Render rows even though storage is column-major.
  return `<div class="matrix-grid">${Array.from({length:16},(_,displayIndex)=>{const row=Math.floor(displayIndex/4),col=displayIndex%4,index=row+4*col;return `<div class="matrix-byte" title="row ${row}, column ${col}">${bytes[index].toString(16).padStart(2,'0').toUpperCase()}</div>`;}).join('')}</div>`;
}
function renderAesSandbox(){
  const initial=hexToBytes16('00112233445566778899AABBCCDDEEFF'); const key=hexToBytes16('000102030405060708090A0B0C0D0E0F');
  aesLabState={state:initial,key,stage:'Initial state',history:[]};
  $('#sandboxStage').innerHTML=`${labHeader('▦','AES State Visualizer','Apply real AES byte transformations to a 4×4 state. This lab focuses on the round mechanics; it is not a complete key-schedule implementation.')}
  <div class="lab-grid"><div><div class="sandbox-form"><label>128-bit state (32 hex digits)<input id="aesStateInput" value="00112233445566778899AABBCCDDEEFF"></label><label>128-bit teaching round key<input id="aesKeyInput" value="000102030405060708090A0B0C0D0E0F"></label></div><div class="aes-controls"><button class="secondary-btn aes-step" data-step="sub" type="button">SubBytes</button><button class="secondary-btn aes-step" data-step="shift" type="button">ShiftRows</button><button class="secondary-btn aes-step" data-step="mix" type="button">MixColumns</button><button class="secondary-btn aes-step" data-step="key" type="button">AddRoundKey</button><button class="secondary-btn" id="aesRound" type="button">Run standard round</button><button class="secondary-btn" id="aesReset" type="button">Reset</button></div><div class="callout"><strong>Standard middle round:</strong> SubBytes → ShiftRows → MixColumns → AddRoundKey. The final AES round omits MixColumns.</div></div><div class="output-panel"><h3 id="aesStageLabel">Initial state</h3><div id="aesMatrix"></div><div class="step-list" id="aesHistory"></div></div></div>`;
  const paint=()=>{$('#aesStageLabel').textContent=aesLabState.stage;$('#aesMatrix').innerHTML=aesMatrixHTML(aesLabState.state);$('#aesHistory').innerHTML=aesLabState.history.slice(-6).map(x=>`<div class="step">${escapeHTML(x)}</div>`).join('');};
  const syncInputs=()=>{const s=hexToBytes16($('#aesStateInput').value),k=hexToBytes16($('#aesKeyInput').value);if(s)aesLabState.state=s;if(k)aesLabState.key=k;aesLabState.stage='Input state';aesLabState.history=[];paint();};
  const step=name=>{if(name==='sub'){aesLabState.state=aesSubBytes(aesLabState.state);aesLabState.stage='After SubBytes';aesLabState.history.push('SubBytes: each byte replaced through the nonlinear AES S-box.');}if(name==='shift'){aesLabState.state=aesShiftRows(aesLabState.state);aesLabState.stage='After ShiftRows';aesLabState.history.push('ShiftRows: row r rotated left by r bytes.');}if(name==='mix'){aesLabState.state=aesMixColumns(aesLabState.state);aesLabState.stage='After MixColumns';aesLabState.history.push('MixColumns: each column multiplied by the fixed AES matrix in GF(2^8).');}if(name==='key'){aesLabState.state=aesAddRoundKey(aesLabState.state,aesLabState.key);aesLabState.stage='After AddRoundKey';aesLabState.history.push('AddRoundKey: state XOR teaching round-key bytes.');}paint();};
  $$('.aes-step').forEach(b=>b.addEventListener('click',()=>step(b.dataset.step)));$('#aesRound').addEventListener('click',()=>{['sub','shift','mix','key'].forEach(step);aesLabState.stage='After one standard middle round';paint();});$('#aesReset').addEventListener('click',()=>{aesLabState.state=hexToBytes16($('#aesStateInput').value)||initial;aesLabState.key=hexToBytes16($('#aesKeyInput').value)||key;aesLabState.stage='Initial state';aesLabState.history=[];paint();});$('#aesStateInput').addEventListener('change',syncInputs);$('#aesKeyInput').addEventListener('change',syncInputs);paint();
}

function renderAttack(name=activeAttack){
  activeAttack=name; $$('.filter-btn[data-attack]').forEach(b=>b.classList.toggle('active',b.dataset.attack===name));
  const renderers={ecb:renderEcbAttack,otp:renderOtpAttack,mitm:renderMitmAttack,avalanche:renderAvalancheAttack}; (renderers[name]||renderers.ecb)();
}
function patternCells(values,encrypted=false,cbcSeed=0){
  return values.map((v,i)=>{
    let cls=v?'on':'';
    if(encrypted==='ecb') cls=v?'enc-b':'enc-a';
    if(encrypted==='cbc') cls=`enc-${['a','b','c','d'][(v*3+i*5+cbcSeed+(i?values[i-1]:0))%4]}`;
    return `<span class="pattern-cell ${cls}" title="block ${i+1}"></span>`;
  }).join('');
}
function demoPattern(){
  const rows=['00011000','00111100','01111110','11011011','11111111','01100110','00111100','00011000'];
  return rows.join('').split('').map(Number);
}
function renderEcbAttack(){
  const values=demoPattern(),seed=randomInt(0,99);
  $('#attackStage').innerHTML=`<span class="eyebrow">Visual mode analysis</span><h2>Why ECB leaks structure</h2><p>This is a conceptual block-pattern simulation: equal source blocks remain equal under ECB, so repeated regions are visible. A chained/nonce-based mode changes the context of each block.</p>
  <div class="pattern-compare"><article class="pattern-panel"><h3>Original block pattern</h3><div class="pattern-grid">${patternCells(values)}</div></article><article class="pattern-panel"><h3>ECB-style equality pattern</h3><div class="pattern-grid">${patternCells(values,'ecb')}</div></article><article class="pattern-panel"><h3>Chained-style visualization</h3><div class="pattern-grid" id="cbcPattern">${patternCells(values,'cbc',seed)}</div></article></div>
  <div class="callout danger" style="margin-top:16px"><strong>Diagnosis:</strong> ECB is deterministic per block. Equal plaintext blocks under one key produce equal ciphertext blocks. Use a standardized authenticated-encryption construction for new systems and follow its nonce requirements.</div><button class="secondary-btn" id="newIvVisual" type="button" style="margin-top:12px">Change conceptual IV / context</button>`;
  $('#newIvVisual').addEventListener('click',()=>{$('#cbcPattern').innerHTML=patternCells(values,'cbc',randomInt(0,99));});
}
function renderOtpAttack(){
  $('#attackStage').innerHTML=`<span class="eyebrow">Algebraic attack</span><h2>Reused keystream cancellation</h2><p>Enter two equal-byte-length messages. The simulation encrypts both with the same repeated demonstration key, then proves that XORing the ciphertexts removes that key.</p>
  <div class="lab-grid"><div class="sandbox-form"><label>Plaintext 1<input id="atkP1" value="MEET AT THE GATE"></label><label>Plaintext 2<input id="atkP2" value="SEND IN THE TEAM"></label><label>Reused demonstration key<input id="atkKey" value="ORBIT"></label></div><div class="output-panel"><div class="step-list" id="atkOtpSteps"></div></div></div>`;
  const update=()=>{const p1=$('#atkP1').value,p2=$('#atkP2').value,key=$('#atkKey').value,h1=textToHex(p1),h2=textToHex(p2),kh=textToHex(key);if(!kh||h1.length!==h2.length){$('#atkOtpSteps').innerHTML='<div class="callout warning">Use equal-length messages and a non-empty key.</div>';return;}const k=repeatHexKey(kh,h1.length),c1=xorHex(h1,k),c2=xorHex(h2,k),attack=xorHex(c1,c2),plainRelation=xorHex(h1,h2);$('#atkOtpSteps').innerHTML=`<div class="step">C1=P1⊕K = ${c1}</div><div class="step">C2=P2⊕K = ${c2}</div><div class="step">Attacker: C1⊕C2 = ${attack}</div><div class="step">Truth: P1⊕P2 = ${plainRelation}</div><div class="callout danger">The values match. The key disappeared because K⊕K=0. This leaks a relationship between plaintexts and can enable deeper recovery when language structure is known.</div>`;};
  $$('#attackStage input').forEach(i=>i.addEventListener('input',update));update();
}
function renderMitmAttack(){
  mitmStep=0;
  $('#attackStage').innerHTML=`<span class="eyebrow">Protocol attack</span><h2>Mallory in the Middle</h2><p>Step through an unauthenticated Diffie–Hellman exchange. The modular arithmetic is correct; the missing security property is identity authentication.</p><div class="relay-diagram"><div class="relay-person"><strong>Alice</strong><small>private a</small><div id="aliceStatus">Wants Bob's key</div></div><div class="relay-arrow">⇄</div><div class="relay-person attacker"><strong>Mallory</strong><small>active attacker</small><div id="malloryStatus">Waiting</div></div><div class="relay-arrow">⇄</div><div class="relay-person"><strong>Bob</strong><small>private b</small><div id="bobStatus">Wants Alice's key</div></div></div><div id="mitmExplanation" class="callout">Press “Next attack step” to start.</div><button class="primary-btn" id="mitmNext" type="button" style="margin-top:12px">Next attack step →</button>`;
  const steps=[
    ['Alice sends A=g^a mod p toward Bob.','Mallory intercepts A.','Bob receives nothing yet.','The public value is not secret, but Alice has no authenticated channel binding it to Bob.'],
    ['Alice receives Mallory’s public value M₁.','Mallory substitutes M₁ for Bob’s value.','Bob still waits.','Alice computes a valid shared secret—but it is shared with Mallory, not Bob.'],
    ['Alice now shares K_AM with Mallory.','Mallory intercepts Bob’s B and sends M₂.','Bob receives M₂ as “Alice’s” value.','Bob also computes a mathematically valid secret, K_BM, with Mallory.'],
    ['Alice encrypts traffic under K_AM.','Mallory decrypts, reads/changes, then re-encrypts under K_BM.','Bob decrypts under K_BM.','Both endpoints see encrypted traffic, yet Mallory can relay it because the key exchange was never authenticated.'],
    ['Alice verifies an authenticated handshake.','Mallory cannot forge the required identity binding.','Bob verifies the same transcript/identity binding.','Defense: authenticate the exchanged key material using a sound protocol—such as certificate/signature-based authentication or another established authenticated mechanism.']
  ];
  $('#mitmNext').addEventListener('click',()=>{const s=steps[Math.min(mitmStep,steps.length-1)];$('#aliceStatus').textContent=s[0];$('#malloryStatus').textContent=s[1];$('#bobStatus').textContent=s[2];$('#mitmExplanation').textContent=s[3];mitmStep++;if(mitmStep>=steps.length){$('#mitmNext').textContent='Restart simulation';mitmStep=0;}});
}
function renderAvalancheAttack(){
  $('#attackStage').innerHTML=`<span class="eyebrow">Diffusion experiment</span><h2>SHA-256 avalanche effect</h2><p>Change a single symbol and inspect how widely the digest changes. A cryptographic hash should not preserve obvious local similarity in its output.</p><div class="sandbox-form"><label>Input A<input id="atkHashA" value="mission=approved"></label><label>Input B<input id="atkHashB" value="mission=ApproveD"></label></div><div class="hash-compare" style="margin-top:15px"><div class="hash-box"><h3>Digest A</h3><code id="atkHashOutA"></code></div><div class="hash-box"><h3>Digest B</h3><code id="atkHashOutB"></code></div></div><div class="output-panel" style="margin-top:15px"><h3>Changed digest bits</h3><div class="output-value" id="atkHashDiff"></div><div class="bit-meter"><span id="atkHashMeter"></span></div></div>`;
  let ticket=0;const update=async()=>{const id=++ticket,a=await sha256($('#atkHashA').value),b=await sha256($('#atkHashB').value);if(id!==ticket||!a||!b)return;$('#atkHashOutA').textContent=a;$('#atkHashOutB').textContent=b;const diff=bitDifference(a,b),pct=diff/256*100;$('#atkHashDiff').textContent=`${diff} of 256 (${pct.toFixed(1)}%)`;$('#atkHashMeter').style.width=`${pct}%`;};$('#atkHashA').addEventListener('input',update);$('#atkHashB').addEventListener('input',update);update();
}

function localDateKey(date){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function dayNumber(date){ return Math.floor(new Date(date.getFullYear(),date.getMonth(),date.getDate()).getTime()/86400000); }
function getDailyChallenge(){
  const now=new Date(),key=localDateKey(now),seed=Number(key.replaceAll('-','')); const rand=seededRandom(seed); const typeIndex=Math.floor(rand()*5); let challenge;
  if(typeIndex===0){const shift=1+Math.floor(rand()*24),words=['SIGNAL','CIPHER','ORBIT','VECTOR','SECURE'],plain=words[Math.floor(rand()*words.length)],cipher=caesar(plain,shift);challenge={type:'Caesar',title:'Rotating Intercept',preview:`Decrypt a Caesar message with key ${shift}.`,prompt:`Decrypt ${cipher} using Caesar key ${shift}.`,answer:plain,hint:`Shift every letter backward by ${shift}.`};}
  else if(typeIndex===1){const n=[11,13,17,19][Math.floor(rand()*4)],a=2+Math.floor(rand()*(n-3)),b=2+Math.floor(rand()*20),answer=mod(a+b,n);challenge={type:'Modulo',title:'Clock Signal',preview:'Reduce a modular arithmetic expression.',prompt:`Compute (${a}+${b}) mod ${n}.`,answer:String(answer),hint:`Add first, then keep the remainder after division by ${n}.`};}
  else if(typeIndex===2){const cases=[[3,11],[5,12],[7,13],[11,17]],c=cases[Math.floor(rand()*cases.length)],inv=modInverse(c[0],c[1]);challenge={type:'Inverse',title:'Undo Key',preview:'Find a multiplicative inverse.',prompt:`Find ${c[0]}⁻¹ mod ${c[1]}.`,answer:String(inv),hint:`Find x such that ${c[0]}x≡1 mod ${c[1]}.`};}
  else if(typeIndex===3){const a=Math.floor(rand()*256),b=Math.floor(rand()*256),ha=a.toString(16).padStart(2,'0').toUpperCase(),hb=b.toString(16).padStart(2,'0').toUpperCase();challenge={type:'XOR',title:'Byte Gate',preview:'XOR two hexadecimal bytes.',prompt:`Compute ${ha} ⊕ ${hb} in hexadecimal.`,answer:(a^b).toString(16).padStart(2,'0').toUpperCase(),hint:'Convert each hex byte to bits or XOR nibble by nibble.'};}
  else{const p=11,q=13,n=p*q,ph=(p-1)*(q-1),e=7,d=Number(modInverse(e,ph)),m=2+Math.floor(rand()*15),c=modPow(m,e,n);challenge={type:'RSA',title:'Mini Public-Key Vault',preview:'Decrypt a tiny RSA teaching ciphertext.',prompt:`Toy RSA: n=${n}, d=${d}, ciphertext C=${c}. Recover M.`,answer:String(m),hint:`Compute C^d mod n.`};}
  return {...challenge,dateKey:key,seed};
}

function renderChallenges(mode=activeChallenge){
  activeChallenge=mode; $$('.challenge-tab').forEach(b=>b.classList.toggle('active',b.dataset.challenge===mode));
  if(mode==='daily') renderDailyChallenge(); if(mode==='ctf') renderCtf(); if(mode==='detective') renderDetectives(); if(mode==='disasters') renderDisasters();
}
function renderDailyChallenge(){
  const d=getDailyChallenge(),solved=state.daily.solvedDates.includes(d.dateKey);
  $('#challengeStage').innerHTML=`<section class="daily-hero"><div><span class="eyebrow">${escapeHTML(d.dateKey)} · ${escapeHTML(d.type)}</span><h2>${escapeHTML(d.title)}</h2><p>${escapeHTML(d.preview)}</p><div class="daily-code">${escapeHTML(d.prompt)}</div><div class="challenge-input"><input id="dailyAnswer" aria-label="Daily challenge answer" autocomplete="off" ${solved?'disabled':''} placeholder="Your answer"><button class="primary-btn" id="dailySubmit" type="button" ${solved?'disabled':''}>${solved?'Completed':'Submit'}</button></div><button class="text-btn" id="dailyHint" type="button">Show hint</button><div id="dailyFeedback"></div></div><div class="streak-visual"><span class="big">🔥</span><strong>${state.daily.streak||0}</strong><small>day current streak</small><div class="badge" style="margin-top:10px">Best ${state.daily.bestStreak||0}</div></div></section>`;
  $('#dailyHint').addEventListener('click',()=>{$('#dailyFeedback').innerHTML=`<div class="callout warning">💡 ${escapeHTML(d.hint)}</div>`;});
  if(solved){$('#dailyFeedback').innerHTML='<div class="callout success">✓ You already cleared today’s signal. Return tomorrow for a new deterministic challenge.</div>';return;}
  const submit=()=>{const correct=normalizeAnswer($('#dailyAnswer').value)===normalizeAnswer(d.answer);if(!correct){$('#dailyFeedback').innerHTML=`<div class="callout danger">Not yet. ${escapeHTML(d.hint)}</div>`;playTone('error');return;}completeDaily(d);};
  $('#dailySubmit').addEventListener('click',submit);$('#dailyAnswer').addEventListener('keydown',e=>{if(e.key==='Enter')submit();});
}
function completeDaily(d){
  const todayDay=dayNumber(new Date()),last=state.daily.lastSolved?dayNumber(new Date(`${state.daily.lastSolved}T12:00:00`)):null;
  state.daily.streak=last===todayDay-1?(state.daily.streak||0)+1:1; state.daily.bestStreak=Math.max(state.daily.bestStreak||0,state.daily.streak); state.daily.lastSolved=d.dateKey;
  if(!state.daily.solvedDates.includes(d.dateKey)) state.daily.solvedDates.push(d.dateKey); state.xp+=120; saveState(); updateAchievements(true); celebrate(); playTone('success'); renderDailyChallenge(); renderHome(); showToast('Daily signal cleared','+120 XP');
}

function renderCtf(){
  $('#challengeStage').innerHTML=`<div class="ctf-grid">${ctfChallenges.map(c=>{const solved=state.ctfSolved.includes(c.id);return `<article class="ctf-card ${solved?'solved':''}"><span class="badge">LEVEL ${c.level}${solved?' · ✓':''}</span><h3>${escapeHTML(c.title)}</h3><code>${escapeHTML(c.prompt)}</code><input aria-label="Flag for ${escapeHTML(c.title)}" data-ctf-input="${c.id}" placeholder="CRYPTO{...}" ${solved?'disabled':''}><div><button class="secondary-btn ctf-hint" data-id="${c.id}" type="button">Hint</button> <button class="primary-btn ctf-submit" data-id="${c.id}" type="button" ${solved?'disabled':''}>Capture</button></div><div id="ctf-feedback-${c.id}"></div></article>`;}).join('')}</div>`;
  $$('.ctf-hint').forEach(b=>b.addEventListener('click',()=>{const c=ctfChallenges.find(x=>x.id===b.dataset.id);$(`#ctf-feedback-${c.id}`).innerHTML=`<div class="callout warning" style="margin-top:9px">${escapeHTML(c.hint)}</div>`;}));
  $$('.ctf-submit').forEach(b=>b.addEventListener('click',()=>submitCtf(b.dataset.id)));
}
function submitCtf(id){
  const c=ctfChallenges.find(x=>x.id===id),input=$(`[data-ctf-input="${id}"]`); if(!c||!input)return; const correct=normalizeAnswer(input.value)===normalizeAnswer(c.answer);
  if(!correct){$(`#ctf-feedback-${id}`).innerHTML='<div class="callout danger" style="margin-top:9px">Flag rejected. Use the hint and inspect the transformation.</div>';playTone('error');return;}
  if(!state.ctfSolved.includes(id)){state.ctfSolved.push(id);state.xp+=80+c.level*20;saveState();updateAchievements(true);celebrate();}
  showToast('Flag captured',`${c.answer} · ${c.explanation}`);playTone('success');renderCtf();renderHome();
}

function renderDetectives(){
  $('#challengeStage').innerHTML=`<div class="case-list">${detectiveCases.map(c=>{const solved=state.detectives.includes(c.id);return `<article class="case-card"><span class="badge">${escapeHTML(c.difficulty)}${solved?' · ✓ SOLVED':''}</span><h3>${escapeHTML(c.title)}</h3><div class="evidence-list">${c.evidence.map(e=>`<div class="evidence">${escapeHTML(e)}</div>`).join('')}</div><p><strong>${escapeHTML(c.question)}</strong></p><div class="case-options">${c.options.map((o,i)=>`<button class="case-option" data-case="${c.id}" data-option="${i}" type="button">${escapeHTML(o)}</button>`).join('')}</div><div id="case-feedback-${c.id}"></div></article>`;}).join('')}</div>`;
  $$('.case-option').forEach(b=>b.addEventListener('click',()=>submitDetective(b.dataset.case,Number(b.dataset.option))));
}
function submitDetective(id,option){
  const c=detectiveCases.find(x=>x.id===id);if(!c)return;const correct=option===c.answer;const box=$(`#case-feedback-${id}`);box.innerHTML=`<div class="callout ${correct?'success':'danger'}" style="margin-top:10px"><strong>${correct?'✓ Diagnosis confirmed':'✕ Re-check the evidence'}</strong><br>${escapeHTML(correct?c.explanation:'Identify the broken security assumption rather than the strongest algorithm mentioned.')}</div>`;
  if(correct&&!state.detectives.includes(id)){state.detectives.push(id);state.xp+=100;saveState();updateAchievements(true);playTone('success');showToast('Case solved','+100 XP');renderHome();}else if(!correct)playTone('error');
}
function renderDisasters(){
  $('#challengeStage').innerHTML=`<div class="disaster-grid">${cryptoDisasters.map(c=>{const done=state.disasters.includes(c.id);return `<article class="disaster-card"><span class="year">${escapeHTML(c.year)}</span><h3>${escapeHTML(c.title)}</h3><p>${escapeHTML(c.summary)}</p><p class="lesson"><strong>Lesson:</strong> ${escapeHTML(c.lesson)}</p><button class="${done?'secondary-btn':'primary-btn'} disaster-learn" data-id="${c.id}" type="button" ${done?'disabled':''}>${done?'✓ Studied':'Mark case studied'}</button></article>`;}).join('')}</div>`;
  $$('.disaster-learn').forEach(b=>b.addEventListener('click',()=>{if(!state.disasters.includes(b.dataset.id)){state.disasters.push(b.dataset.id);state.xp+=40;saveState();updateAchievements(true);showToast('Case archived','+40 XP');renderDisasters();renderHome();}}));
}

function showProfile(){
  const practiced=skills.map(s=>({name:s.name,id:s.id,...skillRecord(s.id)})).filter(s=>s.attempts>0).sort((a,b)=>(b.correct/b.attempts)-(a.correct/a.attempts));
  $('#profileContent').innerHTML=`<div class="profile-grid"><article class="profile-card"><span class="eyebrow">Rank</span><h3>${escapeHTML(getRank().name)}</h3><p>${state.xp.toLocaleString()} XP · ${completedCount()}/${missions.length} missions · ${masteryPercent()}% measured mastery.</p></article><article class="profile-card"><span class="eyebrow">Difficulty</span><h3>Training mode</h3><select id="profileDifficulty">${Object.entries(difficulties).map(([id,d])=>`<option value="${id}" ${id===state.difficulty?'selected':''}>${escapeHTML(d.name)}</option>`).join('')}</select><p id="difficultyDesc">${escapeHTML(difficulties[state.difficulty].description)}</p></article></div>
  <article class="profile-card" style="margin-top:12px"><span class="eyebrow">Explanation style</span><h3>Teaching depth</h3><select id="profileDepth"><option value="newbie" ${state.explanationDepth==='newbie'?'selected':''}>Explain like I'm new</option><option value="deep" ${state.explanationDepth==='deep'?'selected':''}>Technical depth</option></select></article>
  <article class="profile-card" style="margin-top:12px"><span class="eyebrow">Measured skill profile</span><h3>Mastery by practiced topic</h3><div class="skill-bars">${practiced.length?practiced.map(s=>{const pct=Math.round(s.correct/s.attempts*100);return `<div class="skill-row"><span>${escapeHTML(s.name)}</span><div class="skill-track"><span style="width:${pct}%"></span></div><strong>${pct}%</strong></div>`;}).join(''):'<p>Complete missions to build your skill profile.</p>'}</div></article>
  <article class="profile-card" style="margin-top:12px"><span class="eyebrow">Achievements</span><h3>${state.achievements.length}/${achievements.length} unlocked</h3><div class="achievement-grid">${achievements.map(achievementCard).join('')}</div></article>
  <div class="profile-actions"><button class="secondary-btn" id="exportProgress" type="button">Export progress</button><label class="secondary-btn" for="importProgress" style="cursor:pointer">Import progress</label><input class="sr-only" id="importProgress" type="file" accept="application/json"><button class="secondary-btn" id="resetProgress" type="button">Reset local progress</button></div>`;
  $('#profileModal').hidden=false;document.body.style.overflow='hidden';
  $('#profileDifficulty').addEventListener('change',e=>{state.difficulty=e.target.value;saveState();$('#difficultyDesc').textContent=difficulties[state.difficulty].description;$('#campaignDifficulty').value=state.difficulty;showToast('Difficulty updated',difficulties[state.difficulty].name);});
  $('#profileDepth').addEventListener('change',e=>{state.explanationDepth=e.target.value;academyDepth=e.target.value;saveState();});
  $('#exportProgress').addEventListener('click',exportProgress);$('#importProgress').addEventListener('change',importProgress);$('#resetProgress').addEventListener('click',resetProgress);
}
function closeProfile(){ $('#profileModal').hidden=true;document.body.style.overflow='';$('#profileButton').focus(); }
function sanitizeImportedState(data){
  const fresh=defaultState(); if(!data||typeof data!=='object')throw new Error('Invalid progress file');
  fresh.xp=Math.max(0,Math.floor(Number(data.xp)||0)); fresh.completed=Array.isArray(data.completed)?data.completed.filter(id=>missions.some(m=>m.id===id)):[]; fresh.missionScores=typeof data.missionScores==='object'&&data.missionScores?data.missionScores:{};
  fresh.achievements=Array.isArray(data.achievements)?data.achievements.filter(id=>achievements.some(a=>a.id===id)):[]; fresh.skills=typeof data.skills==='object'&&data.skills?data.skills:{};
  fresh.difficulty=difficulties[data.difficulty]?data.difficulty:'explorer'; fresh.explanationDepth=['newbie','deep'].includes(data.explanationDepth)?data.explanationDepth:'newbie'; fresh.onboardingComplete=true; fresh.sound=data.sound!==false;
  fresh.sandboxUsed=Array.isArray(data.sandboxUsed)?data.sandboxUsed:[];fresh.ctfSolved=Array.isArray(data.ctfSolved)?data.ctfSolved.filter(id=>ctfChallenges.some(c=>c.id===id)):[];fresh.detectives=Array.isArray(data.detectives)?data.detectives.filter(id=>detectiveCases.some(c=>c.id===id)):[];fresh.disasters=Array.isArray(data.disasters)?data.disasters.filter(id=>cryptoDisasters.some(c=>c.id===id)):[];
  if(data.daily&&typeof data.daily==='object')fresh.daily={...fresh.daily,...data.daily,solvedDates:Array.isArray(data.daily.solvedDates)?data.daily.solvedDates:[]}; return fresh;
}
function exportProgress(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`cryptic-quest-progress-${localDateKey(new Date())}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('Progress exported','Save this JSON to move your local profile to another browser.');
}
function importProgress(event){
  const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{state=sanitizeImportedState(JSON.parse(reader.result));saveState();closeProfile();renderAll();showToast('Progress imported','Your local profile has been restored.');}catch(error){showToast('Import failed',error.message);}};reader.readAsText(file);
}
function resetProgress(){
  if(!confirm('Reset all Cryptic Quest progress stored in this browser? This cannot be undone unless you exported it first.'))return;localStorage.removeItem(STORAGE_KEY);state=defaultState();academyDepth=state.explanationDepth;saveState();closeProfile();renderAll();showOnboarding();showToast('Progress reset','A fresh local profile has been created.');
}

function showOnboarding(){
  $('#onboardingOptions').innerHTML=onboardingProfiles.map(p=>`<button class="onboarding-option" type="button" data-profile="${p.id}"><strong>${escapeHTML(p.title)}</strong><small>${escapeHTML(p.description)}</small></button>`).join('');
  $('#onboardingModal').hidden=false;document.body.style.overflow='hidden';
  $$('.onboarding-option').forEach(b=>b.addEventListener('click',()=>{const p=onboardingProfiles.find(x=>x.id===b.dataset.profile);state.difficulty=p.difficulty;state.explanationDepth=p.id==='new'||p.id==='basics'?'newbie':'deep';academyDepth=state.explanationDepth;state.onboardingComplete=true;saveState();$('#onboardingModal').hidden=true;document.body.style.overflow='';renderAll();showToast('Profile calibrated',`${p.title} · ${difficulties[state.difficulty].name} mode`);}));
}

function showToast(title,message){
  const node=document.createElement('div');node.className='toast';node.innerHTML=`<strong>${escapeHTML(title)}</strong><span>${escapeHTML(message)}</span>`;$('#toastStack').appendChild(node);setTimeout(()=>node.remove(),4200);
}
function celebrate(){
  const layer=$('#confettiLayer');for(let i=0;i<42;i++){const piece=document.createElement('i');piece.className='confetti';piece.style.left=`${Math.random()*100}%`;piece.style.animationDelay=`${Math.random()*.45}s`;piece.style.opacity=String(.45+Math.random()*.5);piece.style.background=["var(--cyan)","var(--violet)","var(--green)","var(--amber)"][i%4];layer.appendChild(piece);setTimeout(()=>piece.remove(),2400);}
}
function playTone(type='success'){
  if(!state.sound)return;try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=type==='success'?660:190;g.gain.setValueAtTime(.035,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.14);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+.15);}catch{}
}
function toggleSound(){state.sound=!state.sound;saveState();$('#soundToggle').textContent=state.sound?'🔊':'🔇';$('#soundToggle').setAttribute('aria-label',state.sound?'Mute sound':'Enable sound');if(state.sound)playTone('success');}

function initStarfield(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const canvas=$('#starfield'),ctx=canvas.getContext('2d');let stars=[];const resize=()=>{const dpr=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;canvas.style.width=`${innerWidth}px`;canvas.style.height=`${innerHeight}px`;ctx.setTransform(dpr,0,0,dpr,0,0);stars=Array.from({length:Math.min(180,Math.floor(innerWidth*innerHeight/9000))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.2+.2,s:Math.random()*.08+.02}));};const draw=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);ctx.fillStyle='rgba(160,215,255,.65)';for(const s of stars){ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();s.y+=s.s;if(s.y>innerHeight+2)s.y=-2;}requestAnimationFrame(draw);};resize();addEventListener('resize',resize,{passive:true});draw();
}

function renderAll(){updateGlobalStats();renderHome();renderCampaign();renderAcademy();renderGuide();if(currentView==='sandbox')renderSandbox(activeSandbox);if(currentView==='attack')renderAttack(activeAttack);if(currentView==='challenges')renderChallenges(activeChallenge);$('#soundToggle').textContent=state.sound?'🔊':'🔇';}

function bindEvents(){
  $$('.nav-btn').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));$$('[data-go]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.go)));$$('[data-view-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();setView(a.dataset.viewLink);}));
  $('#continueBtn').addEventListener('click',()=>startMission(findRecommendedMission().id));$('#smartPracticeBtn').addEventListener('click',()=>{const weak=weakestSkill(),m=findMissionForSkill(weak.id);showToast('Adaptive practice',`Targeting ${weak.name}.`);startMission(m.id);});$('#adaptiveMissionBtn').addEventListener('click',()=>{const weak=weakestSkill();startMission(findMissionForSkill(weak.id).id);});
  $('#worldFilter').addEventListener('change',renderCampaign);$('#campaignDifficulty').addEventListener('change',e=>{state.difficulty=e.target.value;saveState();showToast('Difficulty updated',difficulties[state.difficulty].name);});
  $('#academySearch').addEventListener('input',()=>renderAcademy());$$('.toggle-btn[data-academy-depth]').forEach(b=>b.addEventListener('click',()=>{academyDepth=b.dataset.academyDepth;state.explanationDepth=academyDepth;saveState();renderAcademy();}));$('#guideSearch').addEventListener('input',()=>renderGuide());
  $('#sandboxTabs').addEventListener('click',e=>{const b=e.target.closest('[data-sandbox]');if(b)renderSandbox(b.dataset.sandbox);});$$('.filter-btn[data-attack]').forEach(b=>b.addEventListener('click',()=>renderAttack(b.dataset.attack)));$$('.challenge-tab').forEach(b=>b.addEventListener('click',()=>renderChallenges(b.dataset.challenge)));
  $('#profileButton').addEventListener('click',showProfile);$('.close-profile').addEventListener('click',closeProfile);$('.close-mission').addEventListener('click',closeMission);$('#missionModal').addEventListener('click',e=>{if(e.target===$('#missionModal'))closeMission();});$('#profileModal').addEventListener('click',e=>{if(e.target===$('#profileModal'))closeProfile();});
  $('#hintBtn').addEventListener('click',showMissionHint);$('#explainBtn').addEventListener('click',showMissionExplanation);$('#submitMissionBtn').addEventListener('click',submitMissionAnswer);$('#soundToggle').addEventListener('click',toggleSound);
  addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#missionModal').hidden)closeMission();else if(!$('#profileModal').hidden)closeProfile();}});
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('#installBtn').hidden=false;});$('#installBtn').addEventListener('click',async()=>{if(!deferredInstallPrompt){showToast('Install','Use your browser menu and choose Install app / Add to Home Screen.');return;}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('#installBtn').hidden=true;});addEventListener('appinstalled',()=>{deferredInstallPrompt=null;$('#installBtn').hidden=true;showToast('Installed','Cryptic Quest is ready as an app.');});
  addEventListener('hashchange',()=>{const name=location.hash.slice(1);if(document.getElementById(`${name}View`))setView(name,{focus:false});});
}

async function registerServiceWorker(){
  if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1')){
    try{await navigator.serviceWorker.register('./sw.js',{scope:'./'});}catch(error){console.warn('Offline mode could not be registered:',error);}
  }
}

function init(){
  bindEvents();updateAchievements(false);const initial=location.hash.slice(1);if(initial&&document.getElementById(`${initial}View`))currentView=initial;setView(currentView,{focus:false});renderAll();initStarfield();registerServiceWorker();if(!state.onboardingComplete)setTimeout(showOnboarding,120);
}

document.addEventListener('DOMContentLoaded',init);
