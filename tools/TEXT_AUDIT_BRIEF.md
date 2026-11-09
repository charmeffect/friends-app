# Brief: typo + learning-suitability review of a chunk of quiz items

You review a *Friends*-based cloze quiz for Korean learners of English. Your input file (path in your prompt) is a
JSON array, one item per line: `{expression, type, level, meaning, exchanges:[{file, uid, cue, line, response, options}]}`.
`cue` / `line` / `response` are the three lines the learner sees, each `{uid, text}` with `"Speaker: text"`.
In `line.text` the tested answer is marked `[[...]]`; `options[0]` is the correct answer. Review EVERY exchange.

Read `tools/EXTRACTION_GUIDE.md` (sections "Type decision rule", "Level rubric", "Writing meanings and distractors").

## 1. Typos in the displayed text (main job)
The lines come from a fan transcript and contain errors a learner would copy. For every cue, line and response,
report real transcription errors:
- misspellings and wrong homophones: your/you're, its/it's, to/too, then/than, there/their, here/hear, diner/dinner,
  relived/relieved, are/our, sew/sow, lose/loose, who ever/whoever …
- missing apostrophes (dont, thats, hes, doesnt), missing spaces ("pictureWow", "lesbianI"), stray leading ". ",
  doubled words that are not a stammer, broken Title Case ("Don'T Care"), stage directions left in the text
  ("Commercial", "(Ross enters)" is fine — parentheses are stripped for speech; leave those).
- an answer written in ALL CAPS or odd capitals while the options are lowercase (it gives the answer away) → lowercase it.
Do NOT "correct" real spoken English: gonna, wanna, gotta, y'know, ya, 'em, ain't, stammers ("I-I", "w-what"),
elongations ("Ohhh", "Nooo"), shouted words in caps that are not the answer, intentional mispronunciations that are
the joke, British spellings, and grammar the character really uses. When unsure, leave it.

Each fix is `{uid, from, to}`: `from` is an exact substring of that uid's text (WITHOUT the "Speaker: " prefix and
WITHOUT the [[ ]] marks), long enough to be unique in the line (only its first occurrence is replaced).
If a fix changes text inside the [[answer]], also give an `exchangeFixes` entry with the new `answer` and full
`options` (options[0] = new answer, same casing as the fixed line).
A line can appear in several exchanges; report each uid once.

## 2. Learning suitability
- A distractor that also fits the line, is a synonym, is sexual slang, or has a different grammatical shape that
  gives the answer away → replace it: `exchangeFixes` entry with the full new `options` (keep options[0]).
  New distractors follow the guide: same shape, plausible, ≤4 words, clearly wrong in this line.
- `meaning` wrong for the sense used in the lines, or wrong type → `changes` entry (only the changed fields).
- Content rule (from the owner): sexual scenes at the level of the show are fine. Only an expression that is itself
  sexual slang, a slur, or an item that is useless for learning (the blank is unanswerable, the line is too garbled
  to repair, the "expression" is a one-off pun or a name) is a problem → `drops` entry with a reason.
  Proposals only; the owner decides. Do not propose drops for anything fixable.
- Do not re-judge levels (that was done already) unless a level is clearly absurd.

## Output
Write ONE JSON file (path in your prompt) and edit nothing else:
```json
{
  "textFixes":     [ {"uid": "s04_e07_c10_u023", "from": "you're work", "to": "your work"} ],
  "exchangeFixes": [ {"file": "s10e06.json", "uid": "s10_e06_c07_u017", "expression": "flip a coin",
                      "options": ["flip a coin", "fold a napkin", "draw a map", "set a table"]},
                     {"file": "s03e10.json", "uid": "s03_e10_c08_u025", "expression": "give in to",
                      "answer": "give in to", "options": ["give in to", "give up on", "get out of", "go back to"]} ],
  "changes":       [ {"expression": "x", "meaning": "corrected meaning", "reason": "..."} ],
  "drops":         [ {"file": "s05e22.json", "uid": "s05_e22_c05_u052", "expression": "y", "reason": "..."} ],
  "flags":         [ {"expression": "z", "uid": "...", "problem": "anything else worth a human look"} ]
}
```
Then report counts for each list (short).
