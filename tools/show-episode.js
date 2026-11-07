#!/usr/bin/env node
// Print one Friends episode as readable dialogue with utterance IDs.
// Usage: node tools/show-episode.js s01e01   (or S01E01, 1x01, "1 1")
// Source files: source/friends_season_NN.json (Emory NLP character-mining, not committed)

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const arg = (process.argv.slice(2).join(' ') || '').toLowerCase();
const m = arg.match(/s?(\d{1,2})\s*[ex]\s*(\d{1,2})/);
if (!m) {
  console.error('Usage: node tools/show-episode.js s01e01');
  process.exit(2);
}
const season = parseInt(m[1], 10), episode = parseInt(m[2], 10);
const ss = String(season).padStart(2, '0'), ee = String(episode).padStart(2, '0');
const file = path.join(root, 'source', `friends_season_${ss}.json`);
if (!fs.existsSync(file)) {
  console.error(`Missing ${file}. Download from https://github.com/emorynlp/character-mining (json/).`);
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const ep = data.episodes.find(e => e.episode_id === `s${ss}_e${ee}`);
if (!ep) {
  console.error(`Episode s${ss}_e${ee} not found. Season ${ss} has ${data.episodes.length} episodes.`);
  process.exit(2);
}

const firstName = s => (s || 'Unknown').split(' ')[0];
let lines = 0;
console.log(`===== S${ss}E${ee} =====`);
ep.scenes.forEach(sc => {
  const cNum = sc.scene_id.split('_').pop();
  console.log(`\n--- Scene ${cNum} ---`);
  sc.utterances.forEach(u => {
    const text = (u.transcript || '').trim();
    if (!text) return;
    const uid = u.utterance_id.split('_').pop(); // uNNN
    const who = (u.speakers || []).map(firstName).join('+') || '#NOTE';
    console.log(`[${uid}] ${who}: ${text}`);
    lines++;
  });
});
console.log(`\n(${ep.scenes.length} scenes, ${lines} lines)`);
