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

  assert.deepEqual(pageErrors,[],`page errors: ${pageErrors.join('\n')}`);
  assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);
  console.log('✓ browser smoke: onboarding → Campaign → Training → Sandbox + modular clock geometry/click');
} finally {
  if(browser) await browser.close();
  server.kill('SIGTERM');
}
