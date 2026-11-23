#!/usr/bin/env node
// Compacts data/history by moving snapshots that only differ by review state
// (mastered / updatedAt) into data/history-archive/. Nothing is deleted.
//
//   node scripts/compact-history.mjs          只报告，不改动
//   node scripts/compact-history.mjs --apply  执行压缩
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = process.env.ZHIXU_DATA_DIR || path.join(root, 'data');
const history = path.join(dataDirectory, 'history');
const archive = path.join(dataDirectory, 'history-archive');
const apply = process.argv.includes('--apply');

const STATE_FIELDS = ['mastered', 'updatedAt'];
const contentKey = questions => JSON.stringify(questions.map(q => {
  const copy = {...q};
  for (const field of STATE_FIELDS) delete copy[field];
  return copy;
}));
const stateOnly = (a, b) => a.length === b.length && contentKey(a) === contentKey(b);

const files = (await fs.readdir(history).catch(() => [])).filter(f => f.endsWith('.json')).sort();
if (!files.length) {
  console.log('data/history 中没有快照。');
  process.exit(0);
}

const load = async file => JSON.parse(await fs.readFile(path.join(history, file), 'utf8'));
const keep = [];
const redundant = [];
let before = 0;

for (const file of files) {
  before += (await fs.stat(path.join(history, file))).size;
  const current = await load(file);
  if (keep.length) {
    const previous = await load(keep[keep.length - 1]);
    if (stateOnly(previous.questions, current.questions)) {
      redundant.push(file);
      continue;
    }
  }
  keep.push(file);
}

let keptBytes = 0;
for (const file of keep) keptBytes += (await fs.stat(path.join(history, file))).size;

console.log(`快照 ${files.length} 个`);
console.log(`其中 ${redundant.length} 个与前一快照仅掌握状态不同，可归档`);
console.log(`保留 ${keep.length} 个，体积 ${(before / 1024).toFixed(0)} KB → ${(keptBytes / 1024).toFixed(0)} KB`);

if (!apply) {
  console.log('\n这是预览。确认后加 --apply 执行（文件移入 data/history-archive/，不会删除）。');
  process.exit(0);
}
if (!redundant.length) {
  console.log('没有需要归档的快照。');
  process.exit(0);
}

await fs.mkdir(archive, {recursive: true});
let moved = 0;
for (const file of redundant) {
  let target = path.join(archive, file);
  let suffix = 1;
  while (await fs.stat(target).then(() => true).catch(() => false)) {
    target = path.join(archive, file.replace(/\.json$/, `-${suffix++}.json`));
  }
  await fs.rename(path.join(history, file), target);
  moved++;
}
console.log(`\n已把 ${moved} 个冗余快照移入 data/history-archive/。需要找回时移回 data/history/ 即可。`);
