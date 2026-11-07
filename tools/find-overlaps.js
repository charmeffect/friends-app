#!/usr/bin/env node
// List expressions that are contained in another expression (e.g. "the hell" vs "what the hell"),
// so a reviewer can decide whether to merge/rename. Reads data.js.
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8');
const data = JSON.parse(src.slice(src.indexOf('[')).replace(/;\s*$/, ''));
const norm = s => s.toLowerCase().replace(/\b(someone|something|one's|your|my|his|her)\b/g, '').replace(/\s+/g, ' ').trim();
const ex = data.map(d => ({ e: d.expression, n: norm(d.expression), src: [...new Set(d.exchanges.map(x => x.ep))].join(',') }));
for (const a of ex) for (const b of ex) {
  if (a === b || a.n.length < 4) continue;
  if ((' ' + b.n + ' ').includes(' ' + a.n + ' ')) console.log(`"${a.e}" (${a.src})  ⊂  "${b.e}" (${b.src})`);
}
