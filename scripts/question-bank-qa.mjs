import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { questionFingerprint } from '../js/question-engine.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'content/questions-v3.2.json');
const payload=JSON.parse(fs.readFileSync(file,'utf8'));
const rows=payload.questions||[];
const errors=[];
const ids=new Set(),prompts=new Set();
const topics=new Map();
for(const q of rows){
  if(!q.id)errors.push('Question missing id');
  if(ids.has(q.id))errors.push(`Duplicate id: ${q.id}`);ids.add(q.id);
  const fp=questionFingerprint(q);if(!fp)errors.push(`Empty prompt: ${q.id}`);if(prompts.has(fp))errors.push(`Duplicate prompt: ${q.prompt}`);prompts.add(fp);
  if(!q.topic)errors.push(`${q.id}: missing topic`);
  if(!q.skill)errors.push(`${q.id}: missing skill`);
  if(!Array.isArray(q.options)||q.options.length!==4)errors.push(`${q.id}: expected four options`);
  if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length)errors.push(`${q.id}: invalid answer index`);
  if(!q.explanation||String(q.explanation).length<20)errors.push(`${q.id}: explanation too short`);
  if(!q.hint||String(q.hint).length<8)errors.push(`${q.id}: hint too short`);
  if(!Number.isInteger(q.difficulty)||q.difficulty<1||q.difficulty>4)errors.push(`${q.id}: difficulty must be 1..4`);
  topics.set(q.topic,(topics.get(q.topic)||0)+1);
}
for(const [topic,count] of topics)if(count<5)errors.push(`${topic}: only ${count} external questions; expected >=5`);
if(rows.length<100)errors.push(`External bank too small: ${rows.length}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Question bank QA passed: ${rows.length} unique external questions across ${topics.size} topics.`);
for(const [topic,count] of [...topics].sort())console.log(`  ${topic.padEnd(14)} ${count}`);
