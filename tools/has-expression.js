#!/usr/bin/env node
// Check whether expressions are already in the quiz (any episode file).
//   node tools/has-expression.js "come on" "kind of" ...
// Prints NEW, or EXISTS with its type/level/pos/meaning, number of scenes and the files it is in.
// Also matches loosely (ignoring a leading "be "/"to " and "someone"/"something"), shown as SIMILAR.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'episodes');
const norm = s => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
const loose = s => norm(s).replace(/^(be|to) /, '').replace(/\b(someone|something|somebody|one|one's|someone's|your|you)\b/g, '').replace(/\s+/g, ' ').trim();
const all = new Map();
for (const f of fs.readdirSync(dir).filter(f => /^s\d\de\d\d\.json$/.test(f)))
  for (const it of JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) {
    const k = norm(it.expression);
    if (!all.has(k)) all.set(k, { it, files: [], scenes: 0 });
    const e = all.get(k); e.files.push(f.slice(0, 6)); e.scenes += it.exchanges.length;
  }
for (const q of process.argv.slice(2)) {
  const e = all.get(norm(q));
  if (e) { console.log(`EXISTS  ${q}  | ${e.it.type} ${e.it.level} ${e.it.pos} | ${e.it.meaning} | scenes ${e.scenes} in ${e.files.join(',')}`); continue; }
  const sim = [...all.values()].filter(v => loose(v.it.expression) === loose(q) || (norm(v.it.expression).includes(norm(q)) || norm(q).includes(norm(v.it.expression))) && Math.min(norm(q).split(' ').length, norm(v.it.expression).split(' ').length) > 1);
  if (sim.length) sim.slice(0, 5).forEach(v => console.log(`SIMILAR ${q}  ~ "${v.it.expression}" | ${v.it.type} ${v.it.level} ${v.it.pos} | ${v.it.meaning}`));
  else console.log(`NEW     ${q}`);
}
