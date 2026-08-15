from pathlib import Path
import json
import re

# --- app integration -------------------------------------------------------
app = Path('js/app.js')
text = app.read_text()
mission_import = "import { createMissionExperienceChallenge,renderMissionExperienceChallenge,bindMissionExperience,getMissionExperienceValue,isMissionExperienceAnswerCorrect,hasMissionExperience,missionExperienceProgressMessage } from './mission-experience.js';"
if mission_import not in text:
    needle = "import { createInteractiveChallenge,renderInteractiveChallenge,bindInteractiveChallenge,getInteractiveValue,isInteractiveAnswerCorrect,hasInteractiveMission } from './interactive-missions.js';"
    text = text.replace(needle, needle + "\n" + mission_import)

text = text.replace("${hasInteractiveMission(m.id)?'interactive-mission-card':''}", "${(hasMissionExperience(m.id)||hasInteractiveMission(m.id))?'interactive-mission-card':''}")
text = text.replace("${hasInteractiveMission(m.id)?'<span class=\"badge interactive-badge\">⚡ INTERACTIVE</span>':''}", "${hasMissionExperience(m.id)?'<span class=\"badge interactive-badge experience-badge\">⚡ MISSION 2.0</span>':hasInteractiveMission(m.id)?'<span class=\"badge interactive-badge\">⚡ INTERACTIVE</span>':''}")
text = text.replace("const interactiveChallenge=createInteractiveChallenge(mission,sessionSeed,state.difficulty);", "const interactiveChallenge=createMissionExperienceChallenge(mission,sessionSeed,state.difficulty)||createInteractiveChallenge(mission,sessionSeed,state.difficulty);")
text = text.replace("${interactiveChallenge?' · INTERACTIVE':''}", "${interactiveChallenge?(interactiveChallenge.experience==='2.0'?' · MISSION 2.0':' · INTERACTIVE'):''}")
text = text.replace("answerUI=renderInteractiveChallenge(q);", "answerUI=renderMissionExperienceChallenge(q)||renderInteractiveChallenge(q);")
text = text.replace("if(q.type==='interactive') bindInteractiveChallenge(q,$('#missionBody'));", "if(q.type==='interactive'){ if(q.experience==='2.0') bindMissionExperience(q,$('#missionBody')); else bindInteractiveChallenge(q,$('#missionBody')); }")
text = text.replace("$('#missionBody .interactive-input, #missionBody .clock-node, #missionBody .order-move')?.focus();", "$('#missionBody .interactive-input, #missionBody .clock-node, #missionBody .order-move, #missionBody .mission-step-verify')?.focus();")
text = text.replace("if(q.type==='interactive') return isInteractiveAnswerCorrect(q,value);", "if(q.type==='interactive') return q.experience==='2.0'?isMissionExperienceAnswerCorrect(q,value):isInteractiveAnswerCorrect(q,value);")
text = text.replace("const value=q.type==='choice'?missionSession.selected:q.type==='interactive'?getInteractiveValue(q,$('#missionBody')):$('#missionAnswer')?.value;", "const value=q.type==='choice'?missionSession.selected:q.type==='interactive'?(q.experience==='2.0'?getMissionExperienceValue(q,$('#missionBody')):getInteractiveValue(q,$('#missionBody'))):$('#missionAnswer')?.value;")
text = text.replace("if(value===null || value===undefined || String(value).trim()===''){ showToast('Answer required','Choose or enter an answer before checking.'); return; }", "if(value===null || value===undefined || String(value).trim()===''){ const detail=q.type==='interactive'&&q.experience==='2.0'?missionExperienceProgressMessage(q,$('#missionBody')):'Choose or enter an answer before checking.'; showToast(q.type==='interactive'?'Step incomplete':'Answer required',detail); return; }")
text = text.replace("$$('#missionBody .interactive-input, #missionBody .clock-node, #missionBody .order-move').forEach(el=>el.disabled=true);", "$$('#missionBody .interactive-input, #missionBody .clock-node, #missionBody .order-move, #missionBody .mission-step-verify').forEach(el=>el.disabled=true);")
text = text.replace("Enter a CQ32 session code shown by Cryptic Quest.", "Enter a CQ40 session code, or a legacy CQ32 code shown by an earlier release.")
app.write_text(text)

# --- package/version -------------------------------------------------------
pkg = Path('package.json')
data = json.loads(pkg.read_text())
data['version'] = '4.1.0'
check = data.get('scripts',{}).get('check','')
if 'node --check js/mission-experience.js' not in check:
    check = check.replace('node --check js/interactive-missions.js', 'node --check js/interactive-missions.js && node --check js/mission-experience.js')
    data['scripts']['check'] = check
pkg.write_text(json.dumps(data,indent=2)+"\n")

# --- version/cache ---------------------------------------------------------
index = Path('index.html')
text = index.read_text().replace('4.0.2-hotfix','4.1.0-mission2').replace('v4.0.2','v4.1')
text = text.replace('Version 4.0 Interactive Missions','Version 4.1 Mission Experience 2.0')
index.write_text(text)

sw = Path('sw.js')
text = sw.read_text()
text = re.sub(r"const CACHE_NAME = '[^']+';", "const CACHE_NAME = 'cryptic-quest-v4-1-0-mission-experience-20260815';", text, count=1)
text = text.replace('4.0.2-hotfix','4.1.0-mission2')
if "'./js/mission-experience.js'" not in text:
    text = text.replace("  './js/interactive-missions.js',", "  './js/interactive-missions.js',\n  './js/mission-experience.js',")
sw.write_text(text)

# --- styles ---------------------------------------------------------------
css = Path('styles.css')
text = css.read_text()
marker = '/* === 4.1 Mission Experience 2.0 === */'
if marker not in text:
    text += r'''

/* === 4.1 Mission Experience 2.0 === */
.experience-badge{border-color:rgba(255,71,224,.42)!important;background:linear-gradient(90deg,rgba(255,71,224,.14),rgba(0,245,255,.09))!important;color:#ffd4f7!important;box-shadow:0 0 18px rgba(255,71,224,.10)}
.mission-experience-panel{padding:18px;overflow:hidden;background:linear-gradient(160deg,rgba(24,8,38,.96),rgba(7,16,30,.92))!important;border-color:rgba(0,245,255,.24)!important}
.mission-experience-panel .interactive-toolbar{margin-bottom:16px}.mission-experience-panel .interactive-toolbar span{color:var(--cyan);letter-spacing:.12em;font-weight:900}.mission-experience-panel .interactive-toolbar small{color:#ddb9eb}
.mission-stage-strip{display:flex;align-items:center;justify-content:center;gap:8px;margin:2px auto 18px;max-width:520px}.mission-stage-strip span{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,71,224,.25);background:#12061d;color:#af86c9;font-size:11px;font-weight:900;transition:.2s}.mission-stage-strip span.active{border-color:rgba(0,245,255,.45);color:var(--cyan);box-shadow:0 0 16px rgba(0,245,255,.12)}.mission-stage-strip span.verified{border-color:rgba(61,255,181,.48);background:rgba(61,255,181,.12);color:var(--green);box-shadow:0 0 18px rgba(61,255,181,.12)}.mission-stage-strip i{height:1px;flex:1;max-width:90px;background:linear-gradient(90deg,rgba(255,71,224,.24),rgba(0,245,255,.26))}
.mission-stage-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.mission-stage-grid.two-column{grid-template-columns:repeat(2,minmax(0,1fr))}.mission-stage-card{position:relative;padding:16px;border:1px solid rgba(255,71,224,.18);border-radius:16px;background:linear-gradient(180deg,rgba(31,10,45,.72),rgba(10,8,24,.80));transition:opacity .2s,border-color .2s,transform .2s,box-shadow .2s}.mission-stage-card.active{border-color:rgba(0,245,255,.25)}.mission-stage-card.locked{opacity:.48;filter:saturate(.55)}.mission-stage-card.verified{border-color:rgba(61,255,181,.38);box-shadow:inset 0 0 0 1px rgba(61,255,181,.05),0 0 24px rgba(61,255,181,.06)}.mission-stage-card.has-error{border-color:rgba(255,95,135,.46);box-shadow:0 0 24px rgba(255,95,135,.07)}.mission-stage-card.span-two{grid-column:1/-1}.mission-stage-card header{display:flex;align-items:center;gap:10px;margin-bottom:12px}.mission-stage-card header>div{min-width:0;flex:1}.mission-stage-card header small{display:block;color:var(--pink);font-size:8px;font-weight:900;letter-spacing:.12em}.mission-stage-card header strong{display:block;margin-top:2px;font-size:12px}.mission-stage-number,.mission-stage-card .actor-icon{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(135deg,rgba(255,71,224,.16),rgba(0,245,255,.10));border:1px solid rgba(0,245,255,.18);color:var(--cyan);font-size:10px;font-weight:900}.mission-stage-formula{min-height:35px;padding:9px 10px;margin:0 0 12px;border:1px solid rgba(0,245,255,.10);border-radius:10px;background:#0c0715;color:#f5eaff;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px}.mission-stage-card label{display:grid;gap:6px;color:#d8bce7;font-size:10px}.mission-stage-card .interactive-input{width:100%;border:1px solid rgba(255,71,224,.22);background:#0c0715;color:#fff;border-radius:11px;padding:10px 11px;outline:none}.mission-stage-card .interactive-input:focus{border-color:rgba(0,245,255,.48);box-shadow:0 0 0 3px rgba(0,245,255,.08)}.mission-stage-card .interactive-input:disabled{opacity:.5;cursor:not-allowed}.mission-stage-actions{display:flex;align-items:center;gap:8px;margin-top:10px}.mission-step-verify{padding:8px 11px!important;font-size:10px}.mission-step-status{flex:0 0 auto;margin-left:auto;padding:5px 7px;border-radius:999px;border:1px solid rgba(0,245,255,.18);background:rgba(0,245,255,.07);color:var(--cyan);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.mission-step-status.locked{border-color:rgba(180,130,205,.14);background:rgba(255,255,255,.025);color:#806993}.mission-step-status.good{border-color:rgba(61,255,181,.32);background:rgba(61,255,181,.10);color:var(--green)}.mission-step-status.bad{border-color:rgba(255,95,135,.36);background:rgba(255,95,135,.10);color:#ff91a8}.mission-step-status.ready{color:var(--cyan)}.mission-stage-why{margin:12px 0 0;color:#b89bc8;font-size:9px;line-height:1.5}.mission-stage-why strong{color:#eeddfa}.mission-experience-ready{margin-top:14px;padding:12px 14px;border:1px solid rgba(61,255,181,.30);border-radius:12px;background:linear-gradient(90deg,rgba(61,255,181,.09),rgba(0,245,255,.06));color:#dffff3;font-size:11px}.mission-experience-panel.experience-ready{box-shadow:0 18px 42px rgba(0,0,0,.30),0 0 32px rgba(61,255,181,.07)!important}
.modexp-trace{margin-top:14px;padding:14px;border:1px solid rgba(124,109,255,.20);border-radius:14px;background:#0b0614}.modexp-trace header{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px}.modexp-trace header strong{font-size:11px;color:#f6eaff}.modexp-trace header small{font-size:9px;color:#a98dbc}.modexp-trace-grid{display:grid;gap:6px}.modexp-trace-row{display:grid;grid-template-columns:55px minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:center;padding:7px 8px;border-radius:9px;background:rgba(255,255,255,.025);font-size:9px}.modexp-trace-row span{color:var(--pink);font-weight:900}.modexp-trace-row code{color:var(--cyan);font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.modexp-trace-row em{color:#806993;font-style:normal}
@media(max-width:1100px){.mission-stage-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.mission-stage-grid,.mission-stage-grid.two-column{grid-template-columns:1fr}.mission-stage-card.span-two{grid-column:auto}.mission-stage-strip{max-width:360px}.modexp-trace-row{grid-template-columns:48px 1fr}.modexp-trace-row>*:last-child{grid-column:2}}
'''
css.write_text(text)

# --- static regression tests ---------------------------------------------
testfile = Path('tests/test.mjs')
text = testfile.read_text()
mission_test_import = "import { createMissionExperienceChallenge,isMissionExperienceAnswerCorrect,missionExperienceIds } from '../js/mission-experience.js';"
if mission_test_import not in text:
    needle = "import { createInteractiveChallenge,isInteractiveAnswerCorrect,interactiveMissionIds } from '../js/interactive-missions.js';"
    text = text.replace(needle, needle + "\n" + mission_test_import)

insert_before = "test('interactive mission questions preserve their replay data in the learning notebook'"
if "Mission Experience 2.0 staged challenges are deterministic" not in text:
    block = r'''test('Mission Experience 2.0 staged challenges are deterministic and gradeable',()=>{
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

'''
    text = text.replace(insert_before, block + insert_before)
text = text.replace("assert.match(html,/v4\\.0/i);", "assert.match(html,/v4\\.1/i);")
text = text.replace("'js/interactive-missions.js','content/questions-v3.2.json'", "'js/interactive-missions.js','js/mission-experience.js','content/questions-v3.2.json'")
testfile.write_text(text)

# --- browser regression ---------------------------------------------------
browser = Path('tests/browser-smoke.mjs')
text = browser.read_text()
if 'Mission Experience 2.0 staged progression' not in text:
    marker = "  assert.deepEqual(pageErrors,[],`page errors: ${pageErrors.join('\\n')}`);"
    block = r'''
  // 4.1 regression: Mission Experience 2.0 must unlock stages progressively.
  const experienceData=await page.evaluate(async()=>{
    document.querySelector('#clockHotfixFixture')?.remove();
    const m=await import('./js/mission-experience.js');
    const make=(id,seed)=>{
      const q=m.createMissionExperienceChallenge({id},seed,'explorer');
      const host=document.createElement('div');host.id=`experience-${id}`;host.style.position='fixed';host.style.inset='0';host.style.zIndex='9999';host.style.overflow='auto';host.style.background='#090312';host.innerHTML=m.renderMissionExperienceChallenge(q);document.body.append(host);m.bindMissionExperience(q,host);return q;
    };
    const modexp=make('numbers-3','CQ40-M-NUMBERS-3-EXP-4A110001');
    return {modexp:{binary:modexp.data.expectedBinary,result:modexp.data.result}};
  });
  const modHost=page.locator('#experience-numbers-3');
  assert.equal(await modHost.locator('[data-field="result"]').isDisabled(),true,'modexp result should start locked');
  await modHost.locator('[data-field="binary"]').fill(experienceData.modexp.binary);
  await modHost.locator('[data-verify="binary"]').click();
  assert.ok(await modHost.locator('[data-step-status="binary"]').evaluate(el=>el.classList.contains('good')),'binary stage should verify');
  assert.equal(await modHost.locator('[data-field="result"]').isEnabled(),true,'verified binary should unlock final residue');
  assert.equal(await modHost.locator('[data-modexp-trace]').isVisible(),true,'verified binary should reveal square-and-multiply trace');
  await modHost.locator('[data-field="result"]').fill(String(experienceData.modexp.result));
  await modHost.locator('[data-verify="result"]').click();
  assert.equal(await modHost.locator('[data-experience-ready]').isVisible(),true,'modexp should become ready after both stages');
  await modHost.evaluate(el=>el.remove());

  const rsaData=await page.evaluate(async()=>{
    const m=await import('./js/mission-experience.js');const q=m.createMissionExperienceChallenge({id:'publickey-2'},'CQ40-M-PUBLICKEY-2-EXP-4A110002','explorer');const host=document.createElement('div');host.id='experience-rsa';host.style.position='fixed';host.style.inset='0';host.style.zIndex='9999';host.style.overflow='auto';host.style.background='#090312';host.innerHTML=m.renderMissionExperienceChallenge(q);document.body.append(host);m.bindMissionExperience(q,host);return {n:q.data.n,phi:q.data.phi,d:q.data.d,c:q.data.c};
  });
  const rsaHost=page.locator('#experience-rsa');assert.equal(await rsaHost.locator('[data-field="phi"]').isDisabled(),true,'RSA phi should start locked');
  for(const key of ['n','phi','d','c']){await rsaHost.locator(`[data-field="${key}"]`).fill(String(rsaData[key]));await rsaHost.locator(`[data-verify="${key}"]`).click();assert.ok(await rsaHost.locator(`[data-step-status="${key}"]`).evaluate(el=>el.classList.contains('good')),`RSA ${key} stage should verify`);}
  assert.equal(await rsaHost.locator('[data-experience-ready]').isVisible(),true,'RSA should become ready after four verified stages');await rsaHost.evaluate(el=>el.remove());

  const dhData=await page.evaluate(async()=>{
    const m=await import('./js/mission-experience.js');const q=m.createMissionExperienceChallenge({id:'exchange-2'},'CQ40-M-EXCHANGE-2-EXP-4A110003','explorer');const host=document.createElement('div');host.id='experience-dh';host.style.position='fixed';host.style.inset='0';host.style.zIndex='9999';host.style.overflow='auto';host.style.background='#090312';host.innerHTML=m.renderMissionExperienceChallenge(q);document.body.append(host);m.bindMissionExperience(q,host);return {A:q.data.A,B:q.data.B,K:q.data.K};
  });
  const dhHost=page.locator('#experience-dh');assert.equal(await dhHost.locator('[data-field="K"]').isDisabled(),true,'DH shared secret should start locked');
  for(const key of ['A','B']){await dhHost.locator(`[data-field="${key}"]`).fill(String(dhData[key]));await dhHost.locator(`[data-verify="${key}"]`).click();}
  assert.equal(await dhHost.locator('[data-field="K"]').isEnabled(),true,'verified public values should unlock DH shared secret');await dhHost.locator('[data-field="K"]').fill(String(dhData.K));await dhHost.locator('[data-verify="K"]').click();assert.equal(await dhHost.locator('[data-experience-ready]').isVisible(),true,'DH should become ready after K verifies');await dhHost.evaluate(el=>el.remove());

'''
    text = text.replace(marker, block + marker)
    text = text.replace("console.log('✓ browser smoke: onboarding → Campaign → Training → Sandbox + modular clock geometry/click');", "console.log('✓ browser smoke: navigation + modular clock + Mission Experience 2.0 staged progression');")
browser.write_text(text)

# --- README / release notes ----------------------------------------------
readme = Path('README.md')
text = readme.read_text()
if '## 4.1 Mission Experience 2.0' not in text:
    text += '''\n\n## 4.1 Mission Experience 2.0\n\nMission Experience 2.0 makes selected campaign missions behave like guided cryptography workbenches instead of all-or-nothing quiz questions.\n\n- **RSA Forge 2.0** verifies `n → φ(n) → d → ciphertext` in sequence and explains why each stage exists.\n- **Shared Secret 2.0** verifies Alice and Bob's public values independently before unlocking the shared secret.\n- **Exponent Reactor 2.0** requires a binary exponent decomposition, then reveals a square-and-multiply trace before the final modular residue is submitted.\n- Existing local progress, anti-repeat history, mistake tracking, spaced repetition, session seeds and XP scoring remain in place.\n'''
readme.write_text(text)

notes = Path('RELEASE_NOTES.md')
current = notes.read_text() if notes.exists() else ''
if not current.startswith('# Cryptic Quest 4.1'):
    header = '''# Cryptic Quest 4.1 — Mission Experience 2.0\n\n- Adds a dedicated Mission Experience layer for deeper staged campaign mechanics.\n- Upgrades RSA Forge to four individually verified stages: n, φ(n), d, then ciphertext.\n- Upgrades Shared Secret to verify Alice/Bob public values before the shared secret unlocks.\n- Adds Exponent Reactor 2.0 with binary decomposition and a visible square-and-multiply trace.\n- Adds stage-specific feedback, lock/unlock progression, and "why this step matters" guidance.\n- Adds Node regression checks and Playwright browser tests for staged progression.\n- Bumps web/PWA cache metadata to 4.1.0.\n\n'''
    notes.write_text(header + current)
