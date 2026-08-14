from pathlib import Path
import json
import re

css = Path('styles.css')
text = css.read_text()
marker = '/* === 4.0.2 modular clock positioning hotfix === */'
if marker not in text:
    text += """

/* === 4.0.2 modular clock positioning hotfix === */
.interactive-clock{--clock-node-radius:clamp(96px,30vw,136px)}
.clock-node{--radius:var(--clock-node-radius)}
@media(max-width:420px){.interactive-clock{--clock-node-radius:clamp(86px,29vw,102px)}}
"""
css.write_text(text)

pkg = Path('package.json')
data = json.loads(pkg.read_text())
data['version'] = '4.0.2'
pkg.write_text(json.dumps(data, indent=2) + '\n')

index = Path('index.html')
text = index.read_text()
text = text.replace('4.0.0-interactive', '4.0.2-hotfix')
text = text.replace('v4.0 interactive', 'v4.0.2')
index.write_text(text)

sw = Path('sw.js')
text = sw.read_text()
text = re.sub(r"const CACHE_NAME = '[^']+';", "const CACHE_NAME = 'cryptic-quest-v4-0-2-mod-clock-20260814';", text, count=1)
text = text.replace('4.0.0-interactive', '4.0.2-hotfix')
sw.write_text(text)

ci = Path('.github/workflows/ci.yml')
text = ci.read_text()
needle = 'run: node tests/browser-smoke.mjs'
replacement = 'run: |\n          node tests/browser-smoke.mjs\n          node tests/mod-clock-smoke.mjs'
if needle in text:
    text = text.replace(needle, replacement)
ci.write_text(text)

Path('tests/mod-clock-smoke.mjs').write_text("""import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const port=8321;
const server=spawn('python3',['-m','http.server',String(port),'-b','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

try{
  await sleep(900);
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1100,height:800}});
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{
    const m=await import('./js/interactive-missions.js');
    const q=m.createInteractiveChallenge({id:'numbers-1'},'CQ40-M-NUMBERS-1-EXP-HOTFIX','explorer');
    const host=document.createElement('div');
    host.id='clockHotfixFixture';
    host.innerHTML=m.renderInteractiveChallenge(q);
    document.body.append(host);
    m.bindInteractiveChallenge(q,host);
  });
  const nodes=page.locator('#clockHotfixFixture .clock-node');
  const count=await nodes.count();
  if(count<7) throw new Error(`expected modular clock nodes, got ${count}`);
  const centers=[];
  for(let i=0;i<count;i++){
    const b=await nodes.nth(i).boundingBox();
    if(!b) throw new Error(`node ${i} has no bounding box`);
    centers.push([Math.round(b.x+b.width/2),Math.round(b.y+b.height/2)]);
  }
  const unique=new Set(centers.map(([x,y])=>`${x},${y}`));
  if(unique.size!==count) throw new Error(`clock nodes overlap: ${unique.size}/${count} unique positions`);
  const xs=centers.map(x=>x[0]);
  const ys=centers.map(x=>x[1]);
  if(Math.max(...xs)-Math.min(...xs)<140 || Math.max(...ys)-Math.min(...ys)<140) throw new Error('clock nodes are not distributed around the dial');
  await nodes.filter({hasText:'1'}).first().click();
  const selected=await page.locator('#clockHotfixFixture #clockSelection').textContent();
  if(selected?.trim()!=='1') throw new Error(`click did not select 1; got ${selected}`);
  await browser.close();
  console.log('✓ modular clock nodes are distributed and clickable');
} finally {
  server.kill('SIGTERM');
}
""")

notes = Path('RELEASE_NOTES.md')
current = notes.read_text() if notes.exists() else ''
header = """# Cryptic Quest 4.0.2 — Modular Clock Hotfix

- Fixes modular-clock number buttons collapsing near the center of the dial.
- Uses a responsive length-based clock radius instead of a percentage transform radius.
- Adds a Playwright regression test that verifies all clock nodes occupy distinct positions and are clickable.
- Refreshes PWA cache/version metadata so the corrected CSS is fetched cleanly.

"""
if not current.startswith('# Cryptic Quest 4.0.2'):
    notes.write_text(header + current)
