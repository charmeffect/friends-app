# Brief for an extraction agent (one episode per agent)

You are extracting English-learning items from one episode of *Friends* for a cloze quiz app.
Work in this folder (`friends-app/`). The episode id (e.g. `s01e16`) is given in your task prompt.
Output file: `episodes/<episode>.json` (does not exist yet; create it).

1. Read `tools/EXTRACTION_GUIDE.md` fully and follow it exactly (file format, selection criteria,
   type rule, level rubric, distractor rules). Skim `episodes/s01e03.json` as a format example.
2. Run `node tools/show-episode.js <episode>` and read the entire episode. Lines print as
   `[uNNN] Speaker: text` under `--- Scene cNN ---` headers; the uid for a line is
   `sSS_eEE_cNN_uNNN` (season/episode/scene/utterance, zero-padded exactly as printed).
3. Choose 18–25 expressions: a mix of word / phrase / colloquial; levels roughly
   elementary 2–4 (phrase/colloquial only, never for type word), middle 5–8, high 5–8,
   college 2–5, expert 1–3. Prefer expressions that recur in real conversation.
   Never put dialogue text in the file, only uids.
4. For each exchange: `answer` = the exact surface form in that uid's line (case-insensitive);
   `options` = 4 distinct entries, options[0] = answer, distractors of the same grammatical
   shape, ≤4 words, not synonyms, and not something that would also fit the line.
   Avoid lines where the answer also appears in the previous or next line; if a neighbour is a
   useless one-word reaction, use `cueUid` / `responseUid` overrides (or `"responseUid": null`
   for the last line of a scene). `pos` ∈ noun|verb|adjective|adverb|expression.
   `meaning` = one plain sentence for the sense used in this line.
   Do NOT pick expressions that are sexual slang or euphemisms for sex (e.g. "go at it", "third base",
   "get some", "get lucky", "in the sack", "turn someone on") or slurs, and never use such slang as a
   distractor. The scene itself may be sexual at the level of the show (the user accepts that);
   ordinary vocabulary like "seduce" or "intimate" is fine. Mild swearing used for emphasis is fine.
   If an expression already exists in an earlier episode file with the same sense, reuse its
   exact type/level/pos/meaning so the build merges cleanly; if the sense differs, pick a
   different expression instead of mixing senses.
5. Write the file, then run `node tools/build-data.js --check`. Fix every error and every WARN
   line that mentions your episode (ignore other episodes; other agents work concurrently).
   If a warning says your type/level differs from an earlier episode's, change yours to match.
   Re-run until your file is clean.
6. If you save command output to a temp file, put your episode id in the filename (other agents run at the same time).
7. Do NOT run git commands and do NOT edit any other file.

Final report (short): item count, counts by type and by level, and judgement calls you were unsure about.
