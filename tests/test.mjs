import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  mod,gcd,extendedGcd,modInverse,modPow,squareMultiplySteps,isPrime,primeFactors,phi,isPrimitiveRoot,crt,caesar,vigenere,vigenereSteps,affine,railFence,playfairSquare,playfairPrepare,playfair,
  xorBits,xorHex,textToHex,hexToText,randomInt,sample,shuffle,normalizeAnswer,bitDifference,seededRandom,AES_SBOX,
  aesSubBytes,aesShiftRows,aesMixColumns,aesAddRoundKey,hexToBytes16,bytesToHex
} from '../js/crypto-utils.js';
import { worlds,missions,skills,academyModules,detectiveCases,cryptoDisasters,ctfChallenges,fieldGuide } from '../js/content.js';
import { questionFingerprint,uniqueQuestions,selectUniqueStaticQuestions,generateUniqueQuestions,createSeededRandom,withSeededMathRandom,normalizeSeedCode } from '../js/question-engine.js';
import { ensureLearningState,recentQuestionKeySet,recordLearningOutcome,dueMistakes,activeMistakes,skillDependencyInsights,recommendedFoundation,createSessionSeed,parseSessionSeed,recordPracticeRun } from '../js/learning-engine.js';
import { createInteractiveChallenge,isInteractiveAnswerCorrect,interactiveMissionIds } from '../js/interactive-missions.js';
import { createMissionExperienceChallenge,isMissionExperienceAnswerCorrect,missionExperienceIds } from '../js/mission-experience.js';
import vm from 'node:vm';

const dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dirname,'..');
const externalBank=JSON.parse(fs.readFileSync(path.join(root,'content/questions-v3.2.json'),'utf8')).questions;
const test=(name,fn)=>{try{fn();console.log(`✓ ${name}`);}catch(error){console.error(`✗ ${name}`);throw error;}};

test('mod handles positive and negative values',()=>{assert.equal(mod(17,5),2);assert.equal(mod(-1,5),4);});
test('gcd and modular inverse are correct',()=>{assert.equal(gcd(48,18),6);assert.equal(modInverse(7,26),15n);assert.equal(modInverse(2,14),null);});
test('modular exponentiation regression',()=>{assert.equal(modPow(11,10,100),1n);assert.equal(modPow(3,13,11),5n);});
test('Euler totient',()=>{assert.equal(phi(35),24);assert.equal(phi(17),16);});
test('primitive root recognition',()=>{assert.equal(isPrimitiveRoot(3,7),true);assert.equal(isPrimitiveRoot(2,7),false);});
test('CRT classic example',()=>{const r=crt([2,3,2],[3,5,7]);assert.equal(r.result,23n);assert.equal(r.modulus,105n);});
test('classical cipher round trips',()=>{
  assert.equal(caesar('HELLO',3),'KHOOR');assert.equal(caesar('KHOOR',3,true),'HELLO');
  const v=vigenere('ATTACKATDAWN','LEMON');assert.equal(v,'LXFOPVEFRNHR');assert.equal(vigenere(v,'LEMON',true),'ATTACKATDAWN');
  const a=affine('AFFINECIPHER',5,8);assert.equal(a,'IHHWVCSWFRCP');assert.equal(affine(a,5,8,true),'AFFINECIPHER');
  const rf=railFence('CRYPTOGRAPHY',3);assert.equal(railFence(rf,3,true),'CRYPTOGRAPHY');
  assert.equal(playfair('INSTRUMENTS','MONARCHY'),'GATLMZCLRQXA');
});
test('XOR utilities',()=>{assert.equal(xorBits('1010','1100'),'0110');assert.equal(xorHex('AA','0F'),'A5');assert.equal(hexToText(textToHex('CRYPTO')),'CRYPTO');});


test('remaining number-theory helpers and validation paths',()=>{
  const eg=extendedGcd(30,12);assert.equal(eg.gcd,6n);assert.equal(30n*eg.x+12n*eg.y,6n);
  const sm=squareMultiplySteps(3,13,11);assert.equal(sm.bits,'1101');assert.equal(sm.result,5n);assert.equal(sm.steps.length,4);
  assert.equal(isPrime(2),true);assert.equal(isPrime(97),true);assert.equal(isPrime(1),false);assert.equal(isPrime(91),false);
  assert.deepEqual(primeFactors(84),[2,2,3,7]);
});

test('cipher helper details and preparation functions',()=>{
  const steps=vigenereSteps('ABC','KEY');assert.equal(steps.length,3);assert.equal(steps.map(x=>x.output).join(''),'KFA');
  const square=playfairSquare('MONARCHY');assert.equal(square.length,25);assert.equal(new Set(square).size,25);assert.equal(square.includes('J'),false);
  assert.equal(playfairPrepare('BALLOON'),'BALXLOON');
});

test('utility helpers behave within their contracts',()=>{
  for(let i=0;i<250;i++){const n=randomInt(3,7);assert.ok(n>=3&&n<=7);}
  const values=['a','b','c'];for(let i=0;i<50;i++)assert.ok(values.includes(sample(values)));
  const original=[1,2,3,4,5],shuffled=shuffle(original);assert.deepEqual(original,[1,2,3,4,5]);assert.deepEqual([...shuffled].sort(),original);
  assert.equal(normalizeAnswer('  HeLLo   World  '),'hello world');
  assert.equal(bitDifference('00','FF'),8);assert.equal(bitDifference('0F','0F'),0);assert.equal(bitDifference('0','00'),0);
  const r1=seededRandom(42),r2=seededRandom(42);for(let i=0;i<10;i++)assert.equal(r1(),r2());
});

test('AES teaching primitives match the standard round example',()=>{
  const start=hexToBytes16('00102030405060708090A0B0C0D0E0F0');
  const sub=aesSubBytes(start);assert.equal(bytesToHex(sub),'63CAB7040953D051CD60E0E7BA70E18C');
  const shifted=aesShiftRows(sub);assert.equal(bytesToHex(shifted),'6353E08C0960E104CD70B751BACAD0E7');
  const mixed=aesMixColumns(shifted);assert.equal(bytesToHex(mixed),'5F72641557F5BC92F7BE3B291DB9F91A');
  const zero=Array(16).fill(0), key=Array.from({length:16},(_,i)=>i);assert.deepEqual(aesAddRoundKey(zero,key),key);
  assert.equal(AES_SBOX.length,256);assert.equal(hexToBytes16('00112233445566778899AABBCCDDEEFF').length,16);assert.equal(hexToBytes16('0011'),null);
  assert.equal(bytesToHex(hexToBytes16('00112233445566778899AABBCCDDEEFF')),'00112233445566778899AABBCCDDEEFF');
});

test('campaign structure contains 12 worlds and 36 missions',()=>{
  assert.equal(worlds.length,12);assert.equal(missions.length,36);
  for(const world of worlds){const list=missions.filter(m=>m.world===world.id);assert.equal(list.length,3,world.id);assert.deepEqual(list.map(m=>m.order),[1,2,3]);}
  assert.equal(new Set(missions.map(m=>m.id)).size,missions.length);
});
test('learning content is broad and internally linked',()=>{
  assert.ok(skills.length>=30);assert.ok(academyModules.length>=12);assert.ok(fieldGuide.length>=25);assert.ok(detectiveCases.length>=5);assert.ok(cryptoDisasters.length>=5);
  for(const module of academyModules)for(const skill of module.skills)assert.ok(skills.some(s=>s.id===skill),`${module.id} -> ${skill}`);
});

test('CTF published flags are solvable from supplied transformations',()=>{
  assert.equal(caesar('DSZQUP{DBFTBS}',1,true),'CRYPTO{CAESAR}');
  assert.equal(hexToText('43525950544F7B4845587D'),'CRYPTO{HEX}');
  assert.equal(Buffer.from('Q1JZUFRPe0JBU0U2NH0=','base64').toString('utf8'),'CRYPTO{BASE64}');
  const xorFlag='CRYPTO{XOR}', key='2A'.repeat(textToHex(xorFlag).length/2);assert.equal(xorHex(textToHex(xorFlag),key),'6978737A7E655172657857');
  assert.equal(railFence('CTAE}RPORIFNEY{LC',3,true),'CRYPTO{RAILFENCE}');
  assert.equal(modInverse(7,26),15n);assert.equal(modPow(19,6,23),2n);assert.equal(modPow(2,3,33),8n);
  assert.equal(ctfChallenges.length,8);
});


test('external JSON conceptual question bank is valid and substantial',()=>{
  assert.ok(externalBank.length>=100,`expected at least 100 external questions, got ${externalBank.length}`);
  const topics=new Map(),ids=new Set(),prompts=new Set();
  for(const q of externalBank){
    assert.ok(q.id && !ids.has(q.id),`duplicate/missing id ${q.id}`);ids.add(q.id);
    assert.equal(q.options.length,4,`${q.id}: four choices required`);
    assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,`${q.id}: answer index`);
    assert.ok(q.explanation&&q.hint&&q.skill&&q.topic,`${q.id}: required metadata`);
    assert.ok(q.difficulty>=1&&q.difficulty<=4,`${q.id}: difficulty`);
    const fp=questionFingerprint(q);assert.ok(!prompts.has(fp),`duplicate external prompt ${q.prompt}`);prompts.add(fp);
    topics.set(q.topic,(topics.get(q.topic)||0)+1);
  }
  assert.ok(topics.size>=21);for(const [topic,count] of topics)assert.ok(count>=5,`${topic}: ${count}`);
});

test('every conceptual mission has enough unique questions for one full section',()=>{
  const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  const start=app.indexOf('const questionBank=');
  const end=app.indexOf(`\n};\n\nfunction qChoice`,start);
  assert.ok(start>=0 && end>start,'questionBank block not found');
  const literal=app.slice(start+'const questionBank='.length,end+2);
  const context={
    qChoice:(prompt,options,answer,skill,explanation,hint,newbie,deep=explanation)=>({type:'choice',prompt,options,answer,skill,explanation,hint,newbie,deep})
  };
  vm.createContext(context);
  const base=vm.runInContext(`(${literal})`,context);
  const merged={...base};
  for(const spec of externalBank) merged[spec.topic]=[...(merged[spec.topic]||[]),spec];
  const numeric=new Set(['caesar','vigenere','xor','modular','inverse','modexp','phi','primitive','crt','dh','dh-shared','rsa','rsa-boss']);
  for(const mission of missions){
    if(numeric.has(mission.topic)) continue;
    let pool;
    if(mission.topic==='battle-boss') pool=[...(merged.attacks||[]),...(merged.protocols||[]),...(merged.modes||[])];
    else if(mission.topic==='avalanche') pool=merged.hash||[];
    else pool=merged[mission.topic]||[];
    const unique=uniqueQuestions(pool);
    assert.ok(unique.length>=mission.questions,`${mission.id}/${mission.topic}: needs ${mission.questions}, has ${unique.length}`);
  }
});

test('question engine never repeats a prompt within a mission section',()=>{
  const pool=Array.from({length:10},(_,i)=>({prompt:`Question ${i+1}`,answer:i}));
  for(let run=0;run<250;run++){
    const selected=selectUniqueStaticQuestions(pool,6,a=>a.sort(()=>Math.random()-.5));
    assert.equal(selected.length,6);
    assert.equal(new Set(selected.map(questionFingerprint)).size,6);
  }
  let counter=0;
  const generated=generateUniqueQuestions(()=>({prompt:`Generated ${counter++%9}`,answer:0}),6,a=>a,200);
  assert.equal(generated.length,6);
  assert.equal(new Set(generated.map(questionFingerprint)).size,6);
});


test('all parameterized mission generators produce complete duplicate-free sections under stress',()=>{
  const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  const start=app.indexOf('function difficultyScale');
  const end=app.indexOf('function startMission',start);
  assert.ok(start>=0 && end>start,'numeric generator block not found');
  const context={
    qInput:(prompt,answer,skill,explanation,hint,newbie,deep=explanation,accepted=[])=>({type:'input',prompt,answer:String(answer),accepted:accepted.map(String),skill,explanation,hint,newbie,deep}),
    qChoice:(prompt,options,answer,skill,explanation,hint,newbie,deep=explanation)=>({type:'choice',prompt,options,answer,skill,explanation,hint,newbie,deep}),
    caesar,vigenere,xorBits,mod,gcd,modInverse,modPow,phi,isPrimitiveRoot,crt,randomInt,sample,BigInt,Math,Number,String,Array
  };
  vm.createContext(context);vm.runInContext(app.slice(start,end),context);
  const generators={
    caesar:'makeCaesarQuestion',vigenere:'makeVigenereQuestion',xor:'makeXorQuestion',modular:'makeModularQuestion',inverse:'makeInverseQuestion',modexp:'makeModPowQuestion',
    phi:'makePhiQuestion',primitive:'makePrimitiveQuestion',crt:'makeCrtQuestion',dh:'makeDhQuestion','dh-shared':'makeDhSharedQuestion',rsa:'makeRsaQuestion','rsa-boss':'makeRsaBossQuestion'
  };
  for(const difficulty of ['explorer','analyst','cryptographer','nightmare']){
    for(const [topic,name] of Object.entries(generators)){
      const desired=topic==='rsa-boss'?6:5;
      for(let run=0;run<35;run++){
        const questions=generateUniqueQuestions(()=>context[name](difficulty),desired,a=>a,600);
        assert.equal(questions.length,desired,`${topic}/${difficulty} run ${run}`);
        assert.equal(new Set(questions.map(questionFingerprint)).size,desired,`${topic}/${difficulty} duplicate prompt`);
        for(const q of questions){assert.ok(q.prompt && q.skill && q.explanation);assert.notEqual(q.answer,undefined);}
      }
    }
  }
});

test('cross-session anti-repeat prefers unseen questions before recent ones',()=>{
  const pool=Array.from({length:12},(_,i)=>({prompt:`Anti repeat ${i}`,answer:0}));
  const excluded=new Set(pool.slice(0,6).map(questionFingerprint));
  const selected=selectUniqueStaticQuestions(pool,5,a=>a,excluded);
  assert.equal(selected.length,5);
  assert.ok(selected.every(q=>!excluded.has(questionFingerprint(q))));
});

test('session seed utilities are deterministic and parseable',()=>{
  const a=withSeededMathRandom('CQ32-TEST',()=>Array.from({length:10},()=>Math.random()));
  const b=withSeededMathRandom('CQ32-TEST',()=>Array.from({length:10},()=>Math.random()));
  assert.deepEqual(a,b);
  const rng1=createSeededRandom('seed'),rng2=createSeededRandom('seed');for(let i=0;i<8;i++)assert.equal(rng1(),rng2());
  const code=createSessionSeed({type:'M',id:'origins-1',difficulty:'analyst'});const parsed=parseSessionSeed(code);assert.equal(parsed.type,'M');assert.equal(parsed.id,'origins-1');assert.equal(parsed.difficulty,'analyst');assert.equal(normalizeSeedCode(` ${code.toLowerCase()} `),code);
});

test('mistake notebook and spaced repetition schedule learning outcomes',()=>{
  const state=ensureLearningState({skills:{}});const q={type:'choice',prompt:'Why does ECB leak patterns?',options:['Independent equal blocks','Prime factors','Hash salts','Certificates'],answer:0,skill:'modes',explanation:'Equal plaintext blocks encrypt independently to equal ciphertext blocks.',hint:'Repeated blocks.'};
  recordLearningOutcome(state,q,false,{source:'test',seed:'CQ32-TEST'});assert.equal(activeMistakes(state).length,1);assert.equal(dueMistakes(state).length,1);assert.equal(recentQuestionKeySet(state).size,1);
  recordLearningOutcome(state,q,true,{source:'review',seed:'CQ32-TEST'});assert.equal(dueMistakes(state).length,0);const rec=activeMistakes(state)[0];assert.ok(rec.nextReview>Date.now());
  recordPracticeRun(state,'quick',4,5);assert.equal(state.practiceStats.quick.runs,1);assert.equal(state.practiceStats.quick.best,80);
});

test('learning state repair tolerates malformed or partial saved progress',()=>{
  const empty=ensureLearningState(null);assert.deepEqual(empty.questionHistory,[]);assert.deepEqual(empty.mistakes,{});
  const state=ensureLearningState({mistakes:{broken:null,alsoBroken:[],valid:{nextReview:0,resolved:false}},practiceStats:{quick:{runs:'2',best:150},exam:null}});
  assert.deepEqual(Object.keys(state.mistakes),['valid']);assert.equal(dueMistakes(state).length,1);
  assert.equal(state.practiceStats.quick.runs,2);assert.equal(state.practiceStats.quick.best,100);
  assert.deepEqual(state.practiceStats.exam,{runs:0,best:0});assert.deepEqual(state.practiceStats.review,{runs:0,best:0});
  recordPracticeRun(state,'exam',1,2);assert.equal(state.practiceStats.exam.runs,1);assert.equal(state.practiceStats.exam.best,50);
});

test('skill dependency engine identifies weak prerequisites',()=>{
  const state=ensureLearningState({skills:{rsa:{attempts:6,correct:2},inverse:{attempts:5,correct:1},phi:{attempts:4,correct:3},modexp:{attempts:4,correct:3}}});
  const rows=skillDependencyInsights(state,skills);const rsa=rows.find(x=>x.id==='rsa');assert.ok(rsa.weakDependencies.includes('inverse'));const rec=recommendedFoundation(state,skills);assert.ok(rec);assert.ok(rec.target.id==='rsa'||rec.target.id==='inverse');assert.ok(rec.dependency.id);
});


test('interactive mission mechanics are deterministic and gradeable',()=>{
  const ids=interactiveMissionIds();
  assert.deepEqual(ids.sort(),['exchange-2','fortress-1','numbers-1','publickey-2','trust-2'].sort());
  for(const id of ids){
    const mission=missions.find(m=>m.id===id);assert.ok(mission,id);
    const q1=createInteractiveChallenge(mission,'CQ32-M-TEST-EXP-1234ABCD','explorer');
    const q2=createInteractiveChallenge(mission,'CQ32-M-TEST-EXP-1234ABCD','explorer');
    assert.ok(q1);assert.equal(q1.type,'interactive');assert.equal(questionFingerprint(q1),questionFingerprint(q2));
    assert.deepEqual(q1.data,q2.data);assert.equal(q1.answer,q2.answer);
    assert.equal(isInteractiveAnswerCorrect(q1,q1.answer),true);
    assert.equal(isInteractiveAnswerCorrect(q1,`${q1.answer}x`),false);
    assert.ok(q1.explanation);assert.ok(q1.hint);assert.ok(q1.skill);
  }
});

test('Mission Experience 2.0 staged challenges are deterministic and gradeable',()=>{
  const ids=missionExperienceIds();
  assert.deepEqual(ids.sort(),['exchange-2','numbers-3','publickey-2'].sort());
  for(const id of ids){
    const mission=missions.find(m=>m.id===id);assert.ok(mission,id);
    const q1=createMissionExperienceChallenge(mission,'CQ40-M-MISSION2-EXP-1234ABCD','explorer');
    const q2=createMissionExperienceChallenge(mission,'CQ40-M-MISSION2-EXP-1234ABCD','explorer');
    assert.ok(q1);assert.equal(q1.type,'interactive');assert.equal(q1.experience,'2.0');assert.deepEqual(q1.data,q2.data);assert.equal(q1.answer,q2.answer);
    assert.equal(isMissionExperienceAnswerCorrect(q1,q1.answer),true);assert.equal(isMissionExperienceAnswerCorrect(q1,`${q1.answer}x`),false);
  }
  const exp=createMissionExperienceChallenge(missions.find(m=>m.id==='numbers-3'),'CQ40-M-NUMBERS-3-EXP-ABCD1234','explorer');
  assert.equal(exp.mechanic,'modexp-workbench');assert.equal(exp.data.expectedBinary,exp.data.exponent.toString(2));assert.equal(exp.answer,`${exp.data.expectedBinary}|${exp.data.result}`);assert.ok(exp.data.traceRows.length>0);
});

test('interactive mission questions preserve their replay data in the learning notebook',()=>{
  const mission=missions.find(m=>m.id==='publickey-2');
  const q=createInteractiveChallenge(mission,'CQ32-M-RSA-EXP-89ABCDEF','explorer');
  const state=ensureLearningState({skills:{}});
  recordLearningOutcome(state,q,false,{source:'mission',seed:'CQ32-M-RSA-EXP-89ABCDEF'});
  const rec=activeMistakes(state)[0];assert.ok(rec);assert.equal(rec.question.type,'interactive');assert.equal(rec.question.mechanic,'rsa-forge');assert.deepEqual(rec.question.data,q.data);assert.ok(rec.answer.includes('n='));
});

test('3.2 training UI and external question loader are wired',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  for(const id of ['trainingView','startQuickPractice','startExamPractice','startEndlessPractice','startDueReview','mistakeNotebook','skillDependencyPanel','seedReplayInput'])assert.match(html,new RegExp(`id=["']${id}["']`));
  assert.match(html,/v4\.1/i);assert.match(app,/loadExternalQuestionBank/);assert.match(app,/questions-v3\.2\.json/);assert.match(app,/recentQuestionKeySet/);assert.match(app,/recordLearningOutcome/);
});

test('HTML has unique IDs and general-audience branding',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'duplicate HTML id detected');
  assert.match(html,/Interactive Crypto Adventure/i);
});

test('DOM query helper supports selector-string roots for mission answers',()=>{
  const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  assert.match(app,/typeof root === ['"]string['"]/);
  assert.match(app,/document\.querySelector\(root\)/);
  assert.match(app,/\$\$\('\.answer-option','#missionBody'\)/);
});

test('PWA manifest and app shell assets exist',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
  assert.equal(manifest.display,'standalone');assert.ok(manifest.id);assert.ok(manifest.icons.some(i=>i.sizes==='512x512'));
  for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)),icon.src);
  for(const f of ['index.html','styles.css','sw.js','js/app.js','js/content.js','js/crypto-utils.js','js/question-engine.js','js/learning-engine.js','js/interactive-missions.js','js/mission-experience.js','content/questions-v3.2.json'])assert.ok(fs.existsSync(path.join(root,f)),f);
});

test('no remote runtime dependencies are present in HTML',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.doesNotMatch(html,/<script[^>]+src=["']https?:/i);assert.doesNotMatch(html,/<link[^>]+href=["']https?:/i);
});

console.log('\nAll Cryptic Quest regression checks passed.');
