from pathlib import Path
import json,re

# Wire advanced mechanics through Mission Experience 2.0.
p=Path('js/mission-experience.js'); text=p.read_text()
imp="import { advancedMissionExperienceIds,hasAdvancedMissionExperience,createAdvancedMissionExperienceChallenge,renderAdvancedMissionExperienceChallenge,bindAdvancedMissionExperience,getAdvancedMissionExperienceValue,isAdvancedMissionExperienceAnswerCorrect,advancedMissionExperienceProgressMessage } from './mission-experience-advanced.js';"
if imp not in text:
    text=text.replace("import { createInteractiveChallenge } from './interactive-missions.js';", "import { createInteractiveChallenge } from './interactive-missions.js';\n"+imp)
text=text.replace("export function hasMissionExperience(missionId){return EXPERIENCE_MISSIONS.has(String(missionId||''));}","export function hasMissionExperience(missionId){return EXPERIENCE_MISSIONS.has(String(missionId||''))||hasAdvancedMissionExperience(missionId);}")
text=text.replace("export function missionExperienceIds(){return [...EXPERIENCE_MISSIONS];}","export function missionExperienceIds(){return [...EXPERIENCE_MISSIONS,...advancedMissionExperienceIds()];}")
text=text.replace("  if(!mission || !hasMissionExperience(mission.id)) return null;\n  if(mission.id==='numbers-3')", "  if(!mission || !hasMissionExperience(mission.id)) return null;\n  const advanced=createAdvancedMissionExperienceChallenge(mission,seed,difficulty);\n  if(advanced) return advanced;\n  if(mission.id==='numbers-3')")
text=text.replace("  if(q?.experience!=='2.0') return '';\n  if(q.mechanic==='rsa-forge')", "  if(q?.experience!=='2.0') return '';\n  if(q.experienceFamily==='advanced') return renderAdvancedMissionExperienceChallenge(q);\n  if(q.mechanic==='rsa-forge')")
text=text.replace("  if(q?.experience!=='2.0'||!root)return;\n  if(q.mechanic==='rsa-forge')", "  if(q?.experience!=='2.0'||!root)return;\n  if(q.experienceFamily==='advanced'){bindAdvancedMissionExperience(q,root);return;}\n  if(q.mechanic==='rsa-forge')")
text=text.replace("  if(q?.experience!=='2.0'||!root)return '';\n  if(q.mechanic==='rsa-forge')", "  if(q?.experience!=='2.0'||!root)return '';\n  if(q.experienceFamily==='advanced') return getAdvancedMissionExperienceValue(q,root);\n  if(q.mechanic==='rsa-forge')")
text=text.replace("export function isMissionExperienceAnswerCorrect(q,value){return q?.experience==='2.0'&&normalize(value)===normalize(q.answer);}","export function isMissionExperienceAnswerCorrect(q,value){if(q?.experienceFamily==='advanced')return isAdvancedMissionExperienceAnswerCorrect(q,value);return q?.experience==='2.0'&&normalize(value)===normalize(q.answer);}")
text=text.replace("  if(q?.experience!=='2.0'||!root)return '';\n  const order=", "  if(q?.experience!=='2.0'||!root)return '';\n  if(q.experienceFamily==='advanced') return advancedMissionExperienceProgressMessage(q,root);\n  const order=")
p.write_text(text)

# Package/version.
p=Path('package.json'); data=json.loads(p.read_text()); data['version']='4.2.0'; check=data['scripts']['check']
if 'mission-experience-advanced.js' not in check:
    check=check.replace('node --check js/mission-experience.js','node --check js/mission-experience.js && node --check js/mission-experience-advanced.js')
data['scripts']['check']=check;p.write_text(json.dumps(data,indent=2)+'\n')

p=Path('index.html'); text=p.read_text().replace('4.1.0-mission2','4.2.0-expansion').replace('v4.1</span>','v4.2</span>').replace('Version 4.1 Mission Experience 2.0','Version 4.2 Mission Experience Expansion');p.write_text(text)
p=Path('sw.js'); text=p.read_text();text=re.sub(r"const CACHE_NAME = '[^']+';","const CACHE_NAME = 'cryptic-quest-v4-2-0-mission-expansion-20260815';",text,count=1).replace('4.1.0-mission2','4.2.0-expansion')
if "'./js/mission-experience-advanced.js'" not in text:text=text.replace("  './js/mission-experience.js',","  './js/mission-experience.js',\n  './js/mission-experience-advanced.js',")
p.write_text(text)

# Advanced UI styling.
p=Path('styles.css'); text=p.read_text(); marker='/* === 4.2 Advanced Mission Experience === */'
if marker not in text:
    text += r'''

/* === 4.2 Advanced Mission Experience === */
.advanced-experience{border-color:rgba(0,245,255,.28)!important;background:linear-gradient(155deg,rgba(28,7,40,.97),rgba(5,18,29,.95))!important}.advanced-experience .mission-stage-card label+label{margin-top:9px}
.cbc-chain{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:8px 0 18px}.cbc-chain>span{padding:9px 12px;border:1px solid rgba(0,245,255,.16);border-radius:10px;background:#0b0816;font:800 10px ui-monospace,SFMono-Regular,Consolas,monospace;color:#d9faff}.cbc-chain>b{color:#805f95}.cbc-chain .corrupted{border-color:rgba(255,95,135,.55);background:rgba(255,95,135,.10);color:#ffb0c2;box-shadow:0 0 22px rgba(255,95,135,.12)}
.cbc-plain-options{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.cbc-block-choice{border:1px solid rgba(255,71,224,.20);border-radius:12px;background:#0d0716;color:#dac3e8;padding:12px 8px;font-weight:900}.cbc-block-choice.selected{border-color:rgba(0,245,255,.5);background:rgba(0,245,255,.11);color:var(--cyan);box-shadow:0 0 18px rgba(0,245,255,.10)}.cbc-rule{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:14px;padding:12px 14px;border:1px solid rgba(124,109,255,.20);border-radius:12px;background:#0b0614;color:#bba4c9;font-size:10px}.cbc-rule code{color:var(--cyan);font-size:12px}
.aes-shift-stage{max-width:850px;margin:auto}.aes-shift-rules{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0 14px}.aes-shift-rules span{padding:7px;border:1px solid rgba(255,71,224,.14);border-radius:9px;background:rgba(255,255,255,.025);text-align:center;color:#ddbce9;font:800 9px ui-monospace,SFMono-Regular,Consolas,monospace}.aes-shift-matrix{display:grid;gap:8px}.aes-shift-row{display:grid;grid-template-columns:38px minmax(0,1fr) 82px;gap:9px;align-items:center}.aes-shift-row>strong{color:var(--pink);font-size:10px}.aes-shift-cells{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.aes-shift-cells span{display:grid;place-items:center;min-height:46px;border:1px solid rgba(0,245,255,.18);border-radius:10px;background:linear-gradient(180deg,rgba(0,245,255,.06),rgba(124,109,255,.06));color:#e8fcff;font:900 12px ui-monospace,SFMono-Regular,Consolas,monospace;transition:.18s}.aes-row-controls{display:grid;grid-template-columns:1fr 1fr;gap:5px}.aes-row-shift{min-width:0!important;padding:9px!important;font-size:14px!important}
.xor-intercepts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:10px 0 17px}.xor-intercepts article{padding:13px;border:1px solid rgba(0,245,255,.14);border-radius:12px;background:#0b0714;min-width:0}.xor-intercepts small{display:block;color:#ad8fc0;font-size:8px;text-transform:uppercase;letter-spacing:.1em}.xor-intercepts strong{display:block;margin:5px 0;color:#fff}.xor-intercepts code{display:block;overflow-wrap:anywhere;color:var(--cyan);font-size:10px}
@media(max-width:700px){.cbc-plain-options,.aes-shift-rules{grid-template-columns:repeat(2,1fr)}.cbc-rule{align-items:flex-start;flex-direction:column}.aes-shift-row{grid-template-columns:30px minmax(0,1fr)}.aes-row-controls{grid-column:2}.xor-intercepts{grid-template-columns:1fr}}
'''
p.write_text(text)

# Node regression suite.
p=Path('tests/test.mjs'); text=p.read_text()
text=text.replace("assert.deepEqual(ids.sort(),['exchange-2','numbers-3','publickey-2'].sort());","assert.deepEqual(ids.sort(),['exchange-2','numbers-3','publickey-2','fortress-1','fortress-2','machines-3','publickey-3'].sort());")
if "4.2 advanced Mission Experience mechanics preserve cryptographic invariants" not in text:
    needle="test('interactive mission questions preserve their replay data in the learning notebook'"
    block=r'''test('4.2 advanced Mission Experience mechanics preserve cryptographic invariants',()=>{
  const rsa=createMissionExperienceChallenge(missions.find(m=>m.id==='publickey-3'),'CQ40-M-PUBLICKEY-3-EXP-42000001','explorer');
  assert.equal(rsa.mechanic,'rsa-crt');assert.equal(rsa.data.recovered,rsa.data.message);assert.equal(Number(modPow(rsa.data.ciphertext,rsa.data.dp,rsa.data.p)),rsa.data.m1);assert.equal(Number(modPow(rsa.data.ciphertext,rsa.data.dq,rsa.data.q)),rsa.data.m2);
  const cbc=createMissionExperienceChallenge(missions.find(m=>m.id==='fortress-2'),'CQ40-M-FORTRESS-2-EXP-42000002','explorer');
  assert.equal(cbc.mechanic,'cbc-propagation');assert.deepEqual(cbc.data.affected,[cbc.data.corrupted,cbc.data.corrupted+1]);
  const aes=createMissionExperienceChallenge(missions.find(m=>m.id==='fortress-1'),'CQ40-M-FORTRESS-1-EXP-42000003','explorer');
  assert.equal(aes.mechanic,'aes-shiftrows');aes.data.expectedRows.forEach((row,r)=>assert.deepEqual(row,aes.data.startRows[r].slice(r).concat(aes.data.startRows[r].slice(0,r))));
  const xor=createMissionExperienceChallenge(missions.find(m=>m.id==='machines-3'),'CQ40-M-MACHINES-3-EXP-42000004','explorer');
  assert.equal(xor.mechanic,'xor-reuse');assert.equal(xorHex(textToHex(xor.data.p1),xor.data.c1),xor.data.keyHex);assert.equal(xorHex(xor.data.c2,xor.data.keyHex),textToHex(xor.data.p2));
  for(const q of [rsa,cbc,aes,xor]){assert.equal(isMissionExperienceAnswerCorrect(q,q.answer),true);assert.equal(isMissionExperienceAnswerCorrect(q,`${q.answer}x`),false);}
});

'''
    text=text.replace(needle,block+needle)
text=text.replace("assert.match(html,/v4\\.1/i);","assert.match(html,/v4\\.2/i);")
text=text.replace("'js/mission-experience.js','content/questions-v3.2.json'","'js/mission-experience.js','js/mission-experience-advanced.js','content/questions-v3.2.json'")
p.write_text(text)

# Browser interaction regressions.
p=Path('tests/browser-smoke.mjs'); text=p.read_text()
if '4.2 regression: advanced Mission Experience mechanics' not in text:
    marker="  assert.deepEqual(pageErrors,[],`page errors: ${pageErrors.join('\\n')}`);"
    block=r'''
  // 4.2 regression: advanced Mission Experience mechanics must be operable in a real browser.
  const advanced=await page.evaluate(async()=>{
    const m=await import('./js/mission-experience.js');
    const make=(id,seed,hostId)=>{const q=m.createMissionExperienceChallenge({id},seed,'explorer');const host=document.createElement('div');host.id=hostId;host.style.position='fixed';host.style.inset='0';host.style.zIndex='9999';host.style.overflow='auto';host.style.background='#090312';host.innerHTML=m.renderMissionExperienceChallenge(q);document.body.append(host);m.bindMissionExperience(q,host);return q;};
    const rsa=make('publickey-3','CQ40-M-PUBLICKEY-3-EXP-42000001','experience-rsa-crt');
    return {rsa:{dp:rsa.data.dp,dq:rsa.data.dq,m1:rsa.data.m1,m2:rsa.data.m2,qInv:rsa.data.qInv,h:rsa.data.h,recovered:rsa.data.recovered}};
  });
  const crt=page.locator('#experience-rsa-crt');
  for(const [stage,fields] of [['crtExp',['dp','dq']],['crtResidues',['m1','m2']],['crtBridge',['qInv','h']],['crtMessage',['recovered']]]){for(const f of fields)await crt.locator(`[data-field="${f}"]`).fill(String(advanced.rsa[f]));await crt.locator(`[data-verify-advanced="${stage}"]`).click();assert.ok(await crt.locator(`[data-step-status="${stage}"]`).evaluate(el=>el.classList.contains('good')),`RSA-CRT ${stage} should verify`);}assert.equal(await crt.locator('[data-experience-ready]').isVisible(),true);await crt.evaluate(el=>el.remove());

  const cbcData=await page.evaluate(async()=>{const m=await import('./js/mission-experience.js');const q=m.createMissionExperienceChallenge({id:'fortress-2'},'CQ40-M-FORTRESS-2-EXP-42000002','explorer');const host=document.createElement('div');host.id='experience-cbc';host.style.position='fixed';host.style.inset='0';host.style.zIndex='9999';host.style.overflow='auto';host.style.background='#090312';host.innerHTML=m.renderMissionExperienceChallenge(q);document.body.append(host);m.bindMissionExperience(q,host);return {affected:q.data.affected,current:q.data.currentImpact,next:q.data.nextImpact};});
  const cbc=page.locator('#experience-cbc');for(const n of cbcData.affected)await cbc.locator(`[data-cbc-block="${n}"]`).click();await cbc.locator('[data-verify-advanced="cbcBlocks"]').click();assert.equal(await cbc.locator('[data-field="currentImpact"]').isEnabled(),true);await cbc.locator('[data-field="currentImpact"]').selectOption(cbcData.current);await cbc.locator('[data-field="nextImpact"]').selectOption(cbcData.next);await cbc.locator('[data-verify-advanced="cbcImpact"]').click();assert.equal(await cbc.locator('[data-experience-ready]').isVisible(),true);await cbc.evaluate(el=>el.remove());

  await page.evaluate(async()=>{const m=await import('./js/mission-experience.js');const q=m.createMissionExperienceChallenge({id:'fortress-1'},'CQ40-M-FORTRESS-1-EXP-42000003','explorer');const host=document.createElement('div');host.id='experience-aes-shift';host.style.position='fixed';host.style.inset='0';host.style.zIndex='9999';host.style.overflow='auto';host.style.background='#090312';host.innerHTML=m.renderMissionExperienceChallenge(q);document.body.append(host);m.bindMissionExperience(q,host);});
  const aes=page.locator('#experience-aes-shift');for(let row=1;row<4;row++)for(let i=0;i<row;i++)await aes.locator(`[data-row="${row}"][data-dir="left"]`).click();await aes.locator('[data-verify-advanced="matrix"]').click();assert.equal(await aes.locator('[data-experience-ready]').isVisible(),true);await aes.evaluate(el=>el.remove());

  const xorData=await page.evaluate(async()=>{const m=await import('./js/mission-experience.js');const q=m.createMissionExperienceChallenge({id:'machines-3'},'CQ40-M-MACHINES-3-EXP-42000004','explorer');const host=document.createElement('div');host.id='experience-xor';host.style.position='fixed';host.style.inset='0';host.style.zIndex='9999';host.style.overflow='auto';host.style.background='#090312';host.innerHTML=m.renderMissionExperienceChallenge(q);document.body.append(host);m.bindMissionExperience(q,host);return {key:q.data.keyHex,p2:q.data.p2};});
  const xor=page.locator('#experience-xor');await xor.locator('[data-field="keyHex"]').fill(xorData.key);await xor.locator('[data-verify-advanced="xorKey"]').click();assert.equal(await xor.locator('[data-field="p2"]').isEnabled(),true);await xor.locator('[data-field="p2"]').fill(xorData.p2);await xor.locator('[data-verify-advanced="xorPlain"]').click();assert.equal(await xor.locator('[data-experience-ready]').isVisible(),true);await xor.evaluate(el=>el.remove());

'''
    text=text.replace(marker,block+marker)
text=text.replace("Mission Experience 2.0 staged progression","Mission Experience 2.0 + 4.2 advanced mechanics")
p.write_text(text)

# Docs.
p=Path('README.md'); text=p.read_text();
if '## 4.2 Mission Experience expansion' not in text:text += '''\n\n## 4.2 Mission Experience expansion\n\nFour more campaign operations are hands-on: RSA-CRT decryption/recombination, CBC error propagation, AES ShiftRows matrix manipulation, and reused-XOR keystream recovery. They use staged verification and remain reproducible from CQ40 session codes.\n'''
p.write_text(text)
p=Path('RELEASE_NOTES.md'); text=p.read_text();
if '# Cryptic Quest 4.2.0' not in text:text = '''# Cryptic Quest 4.2.0 — Advanced Mission Experience\n\n- RSA-CRT staged private-key decryption and CRT recombination in The RSA Vault.\n- CBC single-bit ciphertext-error propagation tracing in Mode Control.\n- Direct AES ShiftRows 4×4 state manipulation in Inside AES.\n- Known-plaintext reused-keystream recovery in The Reused Pad.\n- Deterministic generation, Node regression coverage, Chromium interaction coverage, and refreshed PWA cache metadata.\n\n''' + text
p.write_text(text)
