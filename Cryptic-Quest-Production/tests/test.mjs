import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  mod,gcd,modInverse,modPow,phi,isPrimitiveRoot,crt,caesar,vigenere,affine,railFence,xorBits,xorHex,textToHex,hexToText,
  aesSubBytes,aesShiftRows,aesMixColumns,hexToBytes16,bytesToHex,playfair
} from '../js/crypto-utils.js';
import { worlds,missions,skills,academyModules,detectiveCases,cryptoDisasters,ctfChallenges,fieldGuide } from '../js/content.js';

const dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(dirname,'..');
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

test('AES teaching primitives match the standard round example',()=>{
  const start=hexToBytes16('00102030405060708090A0B0C0D0E0F0');
  const sub=aesSubBytes(start);assert.equal(bytesToHex(sub),'63CAB7040953D051CD60E0E7BA70E18C');
  const shifted=aesShiftRows(sub);assert.equal(bytesToHex(shifted),'6353E08C0960E104CD70B751BACAD0E7');
  const mixed=aesMixColumns(shifted);assert.equal(bytesToHex(mixed),'5F72641557F5BC92F7BE3B291DB9F91A');
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

test('HTML has unique IDs and general-audience branding',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'duplicate HTML id detected');
  assert.match(html,/Interactive Crypto Adventure/i);
});

test('PWA manifest and app shell assets exist',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
  assert.equal(manifest.display,'standalone');assert.ok(manifest.id);assert.ok(manifest.icons.some(i=>i.sizes==='512x512'));
  for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)),icon.src);
  for(const f of ['index.html','styles.css','sw.js','js/app.js','js/content.js','js/crypto-utils.js'])assert.ok(fs.existsSync(path.join(root,f)),f);
});

test('no remote runtime dependencies are present in HTML',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.doesNotMatch(html,/<script[^>]+src=["']https?:/i);assert.doesNotMatch(html,/<link[^>]+href=["']https?:/i);
});

console.log('\nAll Cryptic Quest regression checks passed.');
