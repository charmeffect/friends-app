#!/usr/bin/env node
// Build data.js and PROGRESS.md from episodes/*.json.
// Usage: node tools/build-data.js
//
// Episode file (episodes/s01e01.json) = array of items written by hand/LLM:
// {
//   "expression": "freak out", "type": "phrase", "level": "middle", "pos": "verb",
//   "meaning": "to become very anxious, upset, or excited",
//   "exchanges": [
//     { "uid": "s01_e01_c01_u014", "answer": "freaking out",
//       "options": ["freaking out", "backing off", "calming down", "showing off"],
//       "cueUid": null, "responseUid": null }          // optional overrides
//   ]
// }
// Dialogue text (line, cue, response, speakers) is resolved from source/*.json by uid,
// so the episode files never need to quote the script. The build fails on any
// inconsistency (answer not in line, duplicate options, unknown uid, bad enum).

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const EP_DIR = path.join(root, 'episodes');
const SRC_DIR = path.join(root, 'source');
const TYPES = ['word', 'phrase', 'colloquial'];
const LEVELS = ['elementary', 'middle', 'high', 'college', 'expert'];
const MAX_EXCHANGES = 4;
const CHECK_ONLY = process.argv.includes('--check'); // validate without writing files

// "Rachel Green" -> "Rachel"; keep titles/articles with the next word ("The Dealer", "Dr. Green", "Mrs. Geller")
function shortName(full) {
  const w = full.trim().split(/\s+/);
  if (w.length > 1 && /^(the|a|an|dr\.?|mr\.?|mrs\.?|ms\.?|miss|aunt|uncle|grandma|grandpa|old|young|little|big)$/i.test(w[0])) return w[0] + ' ' + w[1];
  return w[0];
}
const errors = [];
const err = (f, msg) => errors.push(`${f}: ${msg}`);

// ---------- source ----------
const seasonCache = {};
function loadSeason(ss) {
  if (seasonCache[ss]) return seasonCache[ss];
  const file = path.join(SRC_DIR, `friends_season_${ss}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing source file ${file} (needed to resolve dialogue text).`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const index = {}; // uid -> {text, speaker, prev, next}
  data.episodes.forEach(ep => ep.scenes.forEach(sc => {
    const us = sc.utterances.filter(u => (u.transcript || '').trim());
    us.forEach((u, i) => {
      index[u.utterance_id] = {
        text: u.transcript.trim(),
        speaker: shortName((u.speakers || [])[0] || 'Someone'),
        prev: i > 0 ? us[i - 1].utterance_id : null,
        next: i < us.length - 1 ? us[i + 1].utterance_id : null,
      };
    });
  }));
  seasonCache[ss] = index;
  return index;
}
function epCode(uid) { const m = uid.match(/^s(\d\d)_e(\d\d)_/); return m ? `S${m[1]}E${m[2]}` : null; }

// ---------- read episode files ----------
const files = fs.existsSync(EP_DIR) ? fs.readdirSync(EP_DIR).filter(f => /^s\d\de\d\d\.json$/.test(f)).sort() : [];
const merged = new Map(); // key -> item
const norm = s => s.toLowerCase().replace(/\s+/g, ' ').trim();
const doneEpisodes = [];

for (const f of files) {
  let items;
  try { items = JSON.parse(fs.readFileSync(path.join(EP_DIR, f), 'utf8')); }
  catch (e) { err(f, 'JSON parse error: ' + e.message); continue; }
  if (!Array.isArray(items)) { err(f, 'top level must be an array'); continue; }
  const epFromName = f.replace('.json', '').toUpperCase();
  doneEpisodes.push({ ep: epFromName, count: items.length });
  const seenInFile = new Set();

  items.forEach((it, idx) => {
    const tag = `${f}#${idx} (${it.expression || '?'})`;
    if (!it.expression || typeof it.expression !== 'string') return err(tag, 'missing expression');
    if (!TYPES.includes(it.type)) err(tag, `type must be one of ${TYPES.join('|')}`);
    if (!LEVELS.includes(it.level)) err(tag, `level must be one of ${LEVELS.join('|')}`);
    if (it.level === 'elementary' && it.type === 'word') err(tag, 'elementary level is only for phrase/colloquial');
    if (!it.meaning) err(tag, 'missing meaning');
    if (!it.pos) err(tag, 'missing pos');
    if (!Array.isArray(it.exchanges) || it.exchanges.length === 0) return err(tag, 'exchanges must be a non-empty array');
    const key = norm(it.expression);
    if (seenInFile.has(key)) err(tag, 'expression listed twice in the same file (merge its exchanges)');
    seenInFile.add(key);

    const resolved = [];
    it.exchanges.forEach((ex, j) => {
      const etag = `${tag} ex#${j}`;
      if (!ex.uid || !/^s\d\d_e\d\d_c\d\d_u\d\d\d$/.test(ex.uid)) return err(etag, 'bad uid');
      if (!ex.uid.startsWith(f.slice(0, 3) + '_e' + f.slice(4, 6))) err(etag, `uid ${ex.uid} does not belong to ${epFromName}`);
      let idx;
      try { idx = loadSeason(ex.uid.slice(1, 3)); } catch (e) { return err(etag, e.message); }
      const u = idx[ex.uid];
      if (!u) return err(etag, `uid ${ex.uid} not found in source`);
      if (!ex.answer) return err(etag, 'missing answer');
      const pos = u.text.toLowerCase().indexOf(ex.answer.toLowerCase());
      if (pos < 0) return err(etag, `answer "${ex.answer}" not found in line: "${u.text}"`);
      if (!Array.isArray(ex.options) || ex.options.length !== 4) return err(etag, 'options must have 4 entries');
      if (new Set(ex.options.map(o => o.toLowerCase())).size !== 4) err(etag, 'options must be distinct');
      if (ex.options[0].toLowerCase() !== ex.answer.toLowerCase()) err(etag, 'options[0] must equal answer');
      const cueId = ex.cueUid === undefined ? u.prev : ex.cueUid;
      const resId = ex.responseUid === undefined ? u.next : ex.responseUid;
      const cue = cueId ? idx[cueId] : null, res = resId ? idx[resId] : null;
      if (cueId && !cue) err(etag, `cueUid ${cueId} not found`);
      if (resId && !res) err(etag, `responseUid ${resId} not found`);
      if (!cue && !res) err(etag, 'exchange needs a cue or a response line');
      const ansLc = ex.answer.toLowerCase();
      if (u.text.toLowerCase().indexOf(ansLc, pos + 1) >= 0) console.warn(`WARN ${etag}: answer "${ex.answer}" occurs more than once in the line (only the first is blanked)`);
      if (cue && cue.text.toLowerCase().includes(ansLc)) console.warn(`WARN ${etag}: answer "${ex.answer}" also appears in the cue line (gives it away) - override cueUid or pick another line`);
      if (res && res.text.toLowerCase().includes(ansLc)) console.warn(`WARN ${etag}: answer "${ex.answer}" also appears in the response line (gives it away) - override responseUid or pick another line`);
      ex.options.forEach((o, k) => { if (o.trim().split(/\s+/).length > 4) console.warn(`WARN ${etag}: option[${k}] "${o}" is longer than 4 words`); });
      resolved.push({
        ep: epCode(ex.uid), uid: ex.uid,
        cueSpeaker: cue ? cue.speaker : null, cue: cue ? cue.text : null,
        speaker: u.speaker, line: u.text, answer: u.text.substr(pos, ex.answer.length),
        responseSpeaker: res ? res.speaker : null, response: res ? res.text : null,
        options: [u.text.substr(pos, ex.answer.length), ...ex.options.slice(1)],
      });
    });

    if (!merged.has(key)) {
      merged.set(key, { expression: it.expression, type: it.type, level: it.level, pos: it.pos, meaning: it.meaning, exchanges: [], _src: f });
    } else {
      const m = merged.get(key);
      if (m.type !== it.type) console.warn(`WARN ${tag}: type ${it.type} differs from ${m._src} (${m.type}); keeping ${m.type}`);
      if (m.level !== it.level) console.warn(`WARN ${tag}: level ${it.level} differs from ${m._src} (${m.level}); keeping ${m.level}`);
    }
    merged.get(key).exchanges.push(...resolved);
  });
}

if (errors.length) {
  console.error(`\n${errors.length} error(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}

// ---------- dictionary-style example sentences (examples/*.json: { "expression": "sentence with [[expression]] marked" }) ----------
const EXAMPLES = {};
const exDir = path.join(root, 'examples');
if (fs.existsSync(exDir)) for (const f of fs.readdirSync(exDir).filter(f => f.endsWith('.json')).sort()) {
  let obj; try { obj = JSON.parse(fs.readFileSync(path.join(exDir, f), 'utf8')); } catch (e) { err('examples/' + f, 'JSON parse error: ' + e.message); continue; }
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v !== 'string' || !/\[\[.+?\]\]/.test(v)) { err('examples/' + f, `example for "${k}" must mark the expression with [[...]]`); continue; }
    if (!merged.has(norm(k))) { console.warn(`WARN examples/${f}: "${k}" is not an expression in the data`); continue; }
    EXAMPLES[norm(k)] = v;
  }
}
if (errors.length) { console.error(`\n${errors.length} error(s):\n  ` + errors.join('\n  ')); process.exit(1); }

// ---------- cap exchanges, spread across seasons ----------
const items = [...merged.values()].map(it => {
  let ex = it.exchanges.sort((a, b) => a.uid.localeCompare(b.uid));
  if (ex.length > MAX_EXCHANGES) {
    const picked = [];
    for (let k = 0; k < MAX_EXCHANGES; k++) picked.push(ex[Math.floor(k * (ex.length - 1) / (MAX_EXCHANGES - 1))]);
    ex = picked;
  }
  const { _src, ...rest } = it;
  const example = EXAMPLES[norm(it.expression)];
  return example ? { ...rest, example, exchanges: ex } : { ...rest, exchanges: ex };
}).sort((a, b) => a.expression.localeCompare(b.expression));

// ---------- write data.js ----------
const out = `// Generated by tools/build-data.js from episodes/*.json — do not edit by hand.\n` +
  `// ${items.length} expressions, ${items.reduce((s, i) => s + i.exchanges.length, 0)} exchanges, ${doneEpisodes.length} episodes. Built ${new Date().toISOString().slice(0, 10)}\n` +
  `const FRIENDS = ${JSON.stringify(items, null, 1)};\n`;
if (!CHECK_ONLY) fs.writeFileSync(path.join(root, 'data.js'), out);
console.log(`examples: ${items.filter(i => i.example).length} / ${items.length} expressions have a dictionary-style example`);

// ---------- PROGRESS.md ----------
const bySeason = {};
doneEpisodes.forEach(d => { const s = d.ep.slice(0, 3); (bySeason[s] = bySeason[s] || []).push(d); });
const TOTAL_EPS = { S01: 24, S02: 24, S03: 25, S04: 24, S05: 24, S06: 25, S07: 24, S08: 24, S09: 24, S10: 18 };
const cnt = (arr, f) => arr.reduce((o, x) => (o[f(x)] = (o[f(x)] || 0) + 1, o), {});
const byType = cnt(items, i => i.type), byLevel = cnt(items, i => i.level);
let md = `# Friends Quiz — Extraction Progress\n\nGenerated by \`tools/build-data.js\`. ${doneEpisodes.length} / 236 episodes processed.\n\n`;
md += `**Expressions:** ${items.length}  |  **Exchanges:** ${items.reduce((s, i) => s + i.exchanges.length, 0)}\n\n`;
md += `| Type | Count |\n|---|---|\n` + TYPES.map(t => `| ${t} | ${byType[t] || 0} |`).join('\n') + '\n\n';
md += `| Level | Count |\n|---|---|\n` + LEVELS.map(l => `| ${l} | ${byLevel[l] || 0} |`).join('\n') + '\n\n';
md += `## Episodes done\n\n| Season | Done | Episodes (items) |\n|---|---|---|\n`;
Object.keys(TOTAL_EPS).forEach(s => {
  const d = (bySeason[s] || []).sort((a, b) => a.ep.localeCompare(b.ep));
  md += `| ${s} | ${d.length} / ${TOTAL_EPS[s]} | ${d.map(x => `${x.ep.slice(3)} (${x.count})`).join(', ')} |\n`;
});
const next = Object.keys(TOTAL_EPS).flatMap(s => Array.from({ length: TOTAL_EPS[s] }, (_, i) => `${s}E${String(i + 1).padStart(2, '0')}`))
  .filter(e => !doneEpisodes.some(d => d.ep === e)).slice(0, 5);
md += `\n**Next up:** ${next.join(', ')}\n`;
if (!CHECK_ONLY) fs.writeFileSync(path.join(root, 'PROGRESS.md'), md);

console.log(`${CHECK_ONLY ? 'CHECK OK' : 'OK'}: ${items.length} expressions, ${items.reduce((s, i) => s + i.exchanges.length, 0)} exchanges from ${doneEpisodes.length} episodes -> data.js, PROGRESS.md`);
console.log(`types ${JSON.stringify(byType)}  levels ${JSON.stringify(byLevel)}`);
