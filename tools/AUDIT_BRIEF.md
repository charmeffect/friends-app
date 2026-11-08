# Brief: review a chunk of quiz items (levels + errors)

You review items of a Friends-based English quiz for Korean learners. Your input file is a JSON array of
`{expression, type, level, pos, meaning, exchanges:[{uid, cue, line, options}]}`. In `line` the tested answer is
marked `[[...]]`; `options[0]` is the correct answer.

Read `tools/EXTRACTION_GUIDE.md` (sections "Type decision rule" and "Level rubric") first.

## 1. Levels (main job)
Re-judge every item's level for a Korean learner using the rubric:
- elementary: easy-word phrases / spoken formulas a beginner meets early (phrase or colloquial ONLY).
- middle: everyday vocabulary and very common phrasal verbs / formulas (a middle-school learner).
- high: less common phrasal verbs, idioms, descriptive vocabulary (high-school / exam level).
- college: university-level vocabulary, nuanced idioms, register-sensitive expressions.
- expert: rare, culture-bound, educated-native vocabulary or slang.
A `word` item can never be elementary (lowest is middle).
Calibration from the owner: "fitting" (as in "it is fitting today") had been put at college — that is far too high;
it is a common word → middle. Be similarly strict about inflated levels: common words people know from school
go to middle; only genuinely rare words go to college/expert. Also fix levels that are too LOW.
Only report an item if its level should change.

## 2. Errors
Report real errors you find:
- meaning wrong for the sense used in the line, or type/pos clearly wrong → give the corrected field.
- an option other than options[0] that also fits the line correctly, or a distractor that is a synonym → flag.
- answer marked in the wrong place, line obviously garbled/misspelled in a way the learner sees → flag.
- sexual content or slurs → flag.
Do NOT delete anything and do NOT edit any files except your output file.

## Output
Write ONE JSON file (path given in your prompt):
```json
{
  "changes": [ {"expression": "fitting", "level": "middle", "reason": "common word"} ,
               {"expression": "x", "meaning": "corrected meaning", "reason": "..."} ],
  "flags":   [ {"expression": "y", "uid": "s03_e08_c03_u026", "problem": "distractor 'z' also fits the line"} ]
}
```
`changes` entries may contain any of level / type / pos / meaning (only the fields that change). Use the expression
string exactly as given. Keep reasons short. Then report: how many level changes (up / down), how many other changes, how many flags.
