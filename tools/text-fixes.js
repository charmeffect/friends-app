// Display corrections for transcript typos: fixes/text-fixes.json = { "uid": [["from", "to"], ...] }.
// Applied to the source text before anything else reads it (build-data, show-episode), so answers
// are matched against the corrected line. A "from" that is not in the line is reported as an error.
const fs = require('fs'), path = require('path');
const file = path.join(__dirname, '..', 'fixes', 'text-fixes.json');
const fixes = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
function applyFixes(uid, text, onError) {
  const list = fixes[uid];
  if (!list) return text;
  for (const [from, to] of list) {
    if (!text.includes(from)) { if (onError) onError(`text fix for ${uid}: "${from}" not found in "${text}"`); continue; }
    text = text.replace(from, to);
  }
  return text.replace(/\s{2,}/g, ' ').trim();
}
module.exports = { applyFixes, fixes };
