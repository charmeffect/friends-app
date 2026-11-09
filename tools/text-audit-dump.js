#!/usr/bin/env node
// Dump every item with ALL its exchanges and the uid of every displayed line (cue / line / response),
// for a typo + suitability review. Text fixes already in fixes/text-fixes.json are applied.
//   node tools/text-audit-dump.js N OUTDIR      -> OUTDIR/text-audit-01.json ...
const fs = require('fs'), path = require('path');
const { applyFixes } = require('./text-fixes');
const root = path.join(__dirname, '..');
const n = +process.argv[2], dir = process.argv[3];
const seasons = {};
function idx(ss) {
  if (seasons[ss]) return seasons[ss];
  const data = JSON.parse(fs.readFileSync(path.join(root, 'source', `friends_season_${ss}.json`), 'utf8'));
  const m = {};
  data.episodes.forEach(ep => ep.scenes.forEach(sc => {
    const us = sc.utterances.filter(u => (u.transcript || '').trim());
    us.forEach((u, i) => { m[u.utterance_id] = { text: applyFixes(u.utterance_id, u.transcript.trim()), who: ((u.speakers || [])[0] || 'Someone').split(' ')[0], prev: i ? us[i - 1].utterance_id : null, next: i < us.length - 1 ? us[i + 1].utterance_id : null }; });
  }));
  return (seasons[ss] = m);
}
const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim();
const byKey = new Map();
for (const f of fs.readdirSync(path.join(root, 'episodes')).filter(f => /^s\d\de\d\d\.json$/.test(f)).sort()) {
  for (const it of JSON.parse(fs.readFileSync(path.join(root, 'episodes', f), 'utf8'))) {
    const k = norm(it.expression);
    if (!byKey.has(k)) byKey.set(k, { expression: it.expression, type: it.type, level: it.level, meaning: it.meaning, exchanges: [] });
    for (const ex of it.exchanges) {
      const s = idx(ex.uid.slice(1, 3)), u = s[ex.uid];
      const cueId = ex.cueUid === undefined ? u.prev : ex.cueUid, resId = ex.responseUid === undefined ? u.next : ex.responseUid;
      const p = u.text.toLowerCase().indexOf(ex.answer.toLowerCase());
      const shown = l => l && s[l] ? { uid: l, text: `${s[l].who}: ${s[l].text}` } : null;
      byKey.get(k).exchanges.push({ file: f, uid: ex.uid, cue: shown(cueId),
        line: { uid: ex.uid, text: `${u.who}: ${u.text.slice(0, p)}[[${u.text.substr(p, ex.answer.length)}]]${u.text.slice(p + ex.answer.length)}` },
        response: shown(resId), options: ex.options });
    }
  }
}
const rows = [...byKey.values()];
fs.mkdirSync(dir, { recursive: true });
// split by number of exchanges so chunks are even; one item per line keeps files small
const total = rows.reduce((a, r) => a + r.exchanges.length, 0), per = Math.ceil(total / n);
const chunks = [[]]; let acc = 0;
for (const r of rows) { if (acc >= per && chunks.length < n) { chunks.push([]); acc = 0; } chunks[chunks.length - 1].push(r); acc += r.exchanges.length; }
chunks.forEach((c, k) => fs.writeFileSync(path.join(dir, `text-audit-${String(k + 1).padStart(2, '0')}.json`), '[\n' + c.map(r => JSON.stringify(r)).join(',\n') + '\n]\n'));
const size = per;
console.log(`${rows.length} expressions in ${chunks.length} files of ~${size} exchanges`);
