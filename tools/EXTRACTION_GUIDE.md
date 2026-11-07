# Friends Quiz — Extraction Guide

Read this before extracting items from an episode. Every session must apply the same criteria so the data stays consistent across 236 episodes.

## Workflow (one episode = one unit of work)

1. `node tools/show-episode.js s01e05` — prints the episode with `[uNNN] Speaker: line`.
2. Read the whole episode. Pick 15–25 expressions (see criteria). Write `episodes/s01e05.json`.
3. `node tools/build-data.js` — resolves dialogue text from `source/` by uid, validates, regenerates `data.js` and `PROGRESS.md`. Fix every error it reports.
4. `cd friends-app && git add -A && git commit` (source/ is git-ignored).

## Episode file format

```json
[
  {
    "expression": "freak out",
    "type": "phrase",
    "level": "middle",
    "pos": "verb",
    "meaning": "to become very anxious, upset, or excited",
    "exchanges": [
      { "uid": "s01_e01_c01_u014", "answer": "freaking out",
        "options": ["freaking out", "backing off", "calming down", "showing off"] }
    ]
  }
]
```

- `uid`: the utterance that contains the expression. The build pulls `line`, `speaker`, the previous line (`cue`) and the next line (`response`) from the source automatically. Override with `"cueUid"` / `"responseUid"` (a uid or `null`) only when the automatic neighbour is unhelpful, e.g. a one-word reaction. Set `"responseUid": null` when the expression is in the last line of a scene (the cue then provides the context).
- `answer`: the exact surface form in the line (`freaking out`, not `freak out`). Case-insensitive match; the build copies the original casing.
- `options`: 4 entries, `options[0]` = answer, all distinct. Distractors must be the same grammatical shape as the answer (same tense/inflection, same number of words) so the blank cannot be solved by grammar alone.
- `pos`: `noun | verb | adjective | adverb | expression`. Use `expression` for colloquial units that are not a single part of speech (`no biggie`, `you're on`).
- Same expression appearing twice in one episode → one item, two exchanges. Across episodes the build merges by lower-cased expression automatically, so just list it again in the new episode file.

## What to extract

Target 15–25 per episode. Ask: *would a non-native learner at this level stumble on this, and is it worth learning because it recurs in real conversation?*

Include:
- **word** — single words a learner may not know: `gross`, `sarcastic`, `condescending`, `nuptials`, `tuxedo`, compound nouns (`gravy boat`, `laminated`). Middle level and up only; basic words are never items.
- **phrase** — multi-word units of standard English: phrasal verbs (`freak out`, `hang out`, `get over`, `tag along`), collocations (`make a decision`, `take a shot`), fixed phrases (`in the meantime`, `on purpose`). Elementary level **is allowed** here: `hang out`, `pick up`, `run into` are easy words but hard units for non-native speakers.
- **colloquial** — informal spoken English, slang, idioms, conversational formulas, sitcom-style understatement: `no biggie`, `you're on`, `hang in there`, `big deal`, `what's the deal with`, `go commando`, `I'm begging you`. Elementary level allowed.

Exclude:
- Proper nouns, character names, brand names (unless used as a common expression).
- Pure grammar points (tense, articles) — that is grammar-app's job.
- Single-use puns that only work in the scene, unless the underlying expression is reusable.
- Expressions whose blank would be unanswerable without the show's visual context.
- Lines where the answer is also present in the cue or response (gives the answer away). Pick another exchange or override the neighbour uid.

## Type decision rule

1. One word → `word`.
2. Multi-word and acceptable in neutral written English (an essay, an email) → `phrase`.
3. Multi-word and mainly spoken/informal, or an idiom with a non-literal meaning → `colloquial`.
When torn between phrase and colloquial, prefer colloquial if a learner would be surprised to see it in a textbook.

## Level rubric

| Level | Who stumbles here | Examples |
|---|---|---|
| elementary | beginners; **phrase/colloquial only** — easy words, hard unit | hang out, pick up, run into, what's up, no way |
| middle | middle-school learners; everyday vocabulary and very common phrasal verbs / spoken formulas | freak out, gross, big deal, get together, in a while |
| high | high-school / exam learners; less common phrasal verbs, idioms, descriptive vocabulary | get over it, tag along, hit it off, sarcastic, awkward |
| college | university-level vocabulary, nuanced idioms, register-sensitive expressions | ambivalent, condescending, take the high road, bail on someone |
| expert | educated native-adult vocabulary; culture-bound slang, wordplay, rarer idioms | nuptials, passive-aggressive, go commando, shoot the breeze |

Aim for a spread per episode roughly like: elementary 2–4, middle 5–8, high 5–8, college 2–5, expert 1–3. Do not force it; the show's register sets the mix.

## Writing meanings and distractors

- `meaning`: one plain-English sentence, no examples, no "informal:" prefixes (the type badge shows that). Explain the sense **used in this line**, not every sense of the word.
- Distractors: plausible for a learner (same part of speech, similar register, similar length), never synonyms of the answer, never another expression that would also make sense in the line. For phrasal verbs, vary the verb or the particle, not both: `freaking out` → `backing off`, `showing off`, `calming down`.
- Keep options short enough for a phone screen (≤ 4 words each).
