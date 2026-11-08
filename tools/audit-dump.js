#!/usr/bin/env node
// Dump every expression for a review pass, split into N chunk files.
//   node tools/audit-dump.js N OUTDIR
// Each entry: expression, type, level, pos, meaning, and up to 2 exchanges with the answer marked [[...]] plus options.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const data = JSON.parse(src.slice(src.indexOf('['), src.lastIndexOf(']') + 1));
const n = +process.argv[2], dir = process.argv[3];
fs.mkdirSync(dir, { recursive: true });
const mark = (line, ans) => { const p = line.toLowerCase().indexOf(ans.toLowerCase()); return p < 0 ? line : line.slice(0, p) + '[[' + line.substr(p, ans.length) + ']]' + line.slice(p + ans.length); };
const rows = data.map(d => ({ expression: d.expression, type: d.type, level: d.level, pos: d.pos, meaning: d.meaning,
  exchanges: d.exchanges.slice(0, 2).map(x => ({ uid: x.uid, cue: x.cue ? `${x.cueSpeaker}: ${x.cue}`.slice(0, 160) : null, line: `${x.speaker}: ${mark(x.line, x.answer)}`.slice(0, 260), options: x.options })) }));
const size = Math.ceil(rows.length / n);
for (let k = 0; k < n; k++) fs.writeFileSync(path.join(dir, `audit-${String(k + 1).padStart(2, '0')}.json`), JSON.stringify(rows.slice(k * size, (k + 1) * size), null, 1));
console.log(`${rows.length} expressions in ${n} files of ~${size}`);
