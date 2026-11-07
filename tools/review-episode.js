#!/usr/bin/env node
// Print an episode file's items compactly for a human/LLM quality pass:
//   node tools/review-episode.js s01e04
// Shows expression, type/level/pos, meaning, and for each exchange the line with the
// answer marked as [[...]] plus the options. Dialogue is read from source/ by uid.
const fs = require('fs'), path = require('path');
const ep = (process.argv[2] || '').toLowerCase();
if (!/^s\d\de\d\d$/.test(ep)) { console.error('usage: node tools/review-episode.js s01e04'); process.exit(1); }
const root = path.join(__dirname, '..');
const items = JSON.parse(fs.readFileSync(path.join(root, 'episodes', ep + '.json'), 'utf8'));
const season = JSON.parse(fs.readFileSync(path.join(root, 'source', `friends_season_${ep.slice(1, 3)}.json`), 'utf8'));
const idx = {};
for (const e of season.episodes) for (const sc of e.scenes) for (const u of sc.utterances) idx[u.utterance_id] = u.transcript;
for (const it of items) {
  console.log(`\n## ${it.expression}  [${it.type} / ${it.level} / ${it.pos}]\n   ${it.meaning}`);
  for (const ex of it.exchanges) {
    const t = idx[ex.uid] || '(uid not found)';
    const p = t.toLowerCase().indexOf(ex.answer.toLowerCase());
    const marked = p < 0 ? t + '  <<ANSWER NOT FOUND>>' : t.slice(0, p) + '[[' + t.substr(p, ex.answer.length) + ']]' + t.slice(p + ex.answer.length);
    console.log(`   ${ex.uid}: ${marked}\n   options: ${ex.options.join(' | ')}`);
  }
}
