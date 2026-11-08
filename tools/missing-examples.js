#!/usr/bin/env node
// List expressions that do not yet have a dictionary-style example sentence.
//   node tools/missing-examples.js            -> count
//   node tools/missing-examples.js --split N DIR  -> write N todo files (DIR/todo-01.json ...) as [{expression,pos,meaning}]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const data = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
const missing = data.filter(d => !d.example).map(d => ({ expression: d.expression, pos: d.pos, meaning: d.meaning }));
const i = process.argv.indexOf('--split');
if (i < 0) { console.log(`${missing.length} expressions without an example`); process.exit(0); }
const n = +process.argv[i + 1], dir = process.argv[i + 2];
fs.mkdirSync(dir, { recursive: true });
const size = Math.ceil(missing.length / n);
for (let k = 0; k < n; k++) {
  const part = missing.slice(k * size, (k + 1) * size);
  if (part.length) fs.writeFileSync(path.join(dir, `todo-${String(k + 1).padStart(2, '0')}.json`), JSON.stringify(part, null, 1));
}
console.log(`${missing.length} missing, split into ${n} files of ~${size} in ${dir}`);
