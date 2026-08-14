import assert from 'node:assert/strict';
import { createSessionSeed,parseSessionSeed } from '../js/learning-engine.js';

const current=createSessionSeed({type:'M',id:'publickey-2',difficulty:'analyst'});
assert.match(current,/^CQ40-M-PUBLICKEY-2-ANA-[A-F0-9]{8}$/);
const parsedCurrent=parseSessionSeed(current);
assert.equal(parsedCurrent.version,'CQ40');
assert.equal(parsedCurrent.type,'M');
assert.equal(parsedCurrent.id,'publickey-2');
assert.equal(parsedCurrent.difficulty,'analyst');

const legacy='CQ32-M-ORIGINS-1-EXP-7F91B2C4';
const parsedLegacy=parseSessionSeed(legacy);
assert.ok(parsedLegacy,'legacy CQ32 seed should remain replayable');
assert.equal(parsedLegacy.version,'CQ32');
assert.equal(parsedLegacy.id,'origins-1');
assert.equal(parsedLegacy.difficulty,'explorer');

assert.equal(parseSessionSeed('CQ31-M-ORIGINS-1-EXP-7F91B2C4'),null);
console.log('✓ CQ40 session seeds generated; CQ32 replay compatibility retained');
