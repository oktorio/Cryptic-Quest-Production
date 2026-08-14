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

  await page.locator('button[data-view="campaign"]').click();
  await page.waitForSelector('#campaignView.active');
  assert.ok(await page.locator('#campaignMap').locator(':scope > *').count()>0,'campaign should render world content');

  await page.locator('button[data-view="training"]').click();
  await page.waitForSelector('#trainingView.active');
  assert.ok(await page.locator('#startQuickPractice').isVisible(),'Quick Practice should be available');

  await page.locator('button[data-view="sandbox"]').click();
  await page.waitForSelector('#sandboxView.active');
  await page.waitForFunction(()=>document.querySelector('#sandboxStage')?.textContent?.trim().length>0);

  assert.deepEqual(pageErrors,[],`page errors: ${pageErrors.join('\n')}`);
  assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);
  console.log('✓ browser smoke: Home → Campaign → Training → Sandbox');
} finally {
  if(browser) await browser.close();
  server.kill('SIGTERM');
}
