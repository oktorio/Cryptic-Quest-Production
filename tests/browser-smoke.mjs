import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port=Number(process.env.PORT||8317);
const base=`http://127.0.0.1:${port}`;
const server=spawn('python3',['-m','http.server',String(port),'-b','127.0.0.1'],{stdio:['ignore','ignore','inherit']});

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitForServer(){
  for(let i=0;i<40;i++){
    try{const response=await fetch(base,{cache:'no-store'});if(response.ok)return;}
    catch{}
    await sleep(250);
  }
  throw new Error(`Local server did not become ready at ${base}`);
}

let browser;
try{
  await waitForServer();
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const pageErrors=[];
  const consoleErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});

  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForSelector('#homeView.active');
  assert.match(await page.title(),/Cryptic Quest/i);
  assert.equal(await page.locator('.brand strong').textContent(),'Cryptic Quest');

  // Fresh browser profiles legitimately open onboarding. Complete the first option
  // so the smoke test validates the app instead of being blocked by its welcome dialog.
  const onboarding=page.locator('#onboardingModal');
  if(await onboarding.isVisible()){
    const firstOption=page.locator('#onboardingOptions button').first();
    await firstOption.waitFor({state:'visible'});
    await firstOption.click();
    await onboarding.waitFor({state:'hidden'});
  }

  await page.locator('button[data-view="campaign"]').click();
  await page.waitForSelector('#campaignView.active');
  assert.ok(await page.locator('#campaignMap').locator(':scope > *').count()>0,'campaign should render world content');

  await page.locator('button[data-view="training"]').click();
  await page.waitForSelector('#trainingView.active');
  assert.ok(await page.locator('#startQuickPractice').isVisible(),'Quick Practice should be available');

  await page.locator('button[data-view="sandbox"]').click();
  await page.waitForSelector('#sandboxView.active');
  await page.waitForFunction(()=>document.querySelector('#sandboxStage')?.textContent?.trim().length>0);

  // 4.0.2 regression: modular-clock buttons must form a real dial and remain clickable.
  await page.evaluate(async()=>{
    const m=await import('./js/interactive-missions.js');
    const q=m.createInteractiveChallenge({id:'numbers-1'},'CQ40-M-NUMBERS-1-EXP-HOTFIX','explorer');
    const host=document.createElement('div');
    host.id='clockHotfixFixture';
    host.style.position='fixed';
    host.style.inset='0';
    host.style.zIndex='9999';
    host.style.background='#090312';
    host.innerHTML=m.renderInteractiveChallenge(q);
    document.body.append(host);
    m.bindInteractiveChallenge(q,host);
  });
  const nodes=page.locator('#clockHotfixFixture .clock-node');
  const nodeCount=await nodes.count();
  assert.ok(nodeCount>=7,`expected modular clock nodes, got ${nodeCount}`);
  const centers=[];
  for(let i=0;i<nodeCount;i++){
    const box=await nodes.nth(i).boundingBox();
    assert.ok(box,`clock node ${i} should have a bounding box`);
    centers.push([Math.round(box.x+box.width/2),Math.round(box.y+box.height/2)]);
  }
  assert.equal(new Set(centers.map(([x,y])=>`${x},${y}`)).size,nodeCount,'modular clock nodes must not overlap');
  const xs=centers.map(([x])=>x),ys=centers.map(([,y])=>y);
  assert.ok(Math.max(...xs)-Math.min(...xs)>=140,'clock nodes should spread horizontally around the dial');
  assert.ok(Math.max(...ys)-Math.min(...ys)>=140,'clock nodes should spread vertically around the dial');
  await nodes.filter({hasText:'1'}).first().click();
  assert.equal((await page.locator('#clockHotfixFixture #clockSelection').textContent())?.trim(),'1','clock node click should register the selected value');


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

  assert.deepEqual(pageErrors,[],`page errors: ${pageErrors.join('\n')}`);
  assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);
  console.log('✓ browser smoke: navigation + modular clock + Mission Experience 2.0 + 4.2 advanced mechanics');
} finally {
  if(browser) await browser.close();
  server.kill('SIGTERM');
}
