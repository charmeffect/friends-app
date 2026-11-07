# Friends English — Design Spec (2026-11-07)

Status: approved by the user in conversation (schema approved explicitly; remaining sections were built directly at the user's request, following the existing app pattern).

## Goal

A sixth quiz app in the English Apps suite. Learners fill a blank in a real line of *Friends* dialogue, shown together with the neighbouring line(s) for context. Items are words, multi-word phrases and colloquial expressions extracted from all 236 episodes by Claude reading the transcripts in Claude Code sessions, a few episodes at a time.

## Decisions

| Question | Decision |
|---|---|
| How is extraction run? | In Claude Code sessions (no API key, quality reviewed in-session). One episode is the unit of work. |
| Items per episode | 15–25 (≈4,000–5,000 total). Pilot episodes may run slightly higher. |
| Duplicate expressions across episodes | One item per expression; exchanges accumulate, capped at 4, spread across seasons. |
| Filters | All · By Type (word / phrase / colloquial) · By Level · By Season (S01–S10) · Weak Words. No per-episode filter; the episode code is shown on the card. |
| Levels | elementary · middle · high · college · expert. **elementary is allowed only for phrase/colloquial** (easy words, hard unit for non-native speakers); single words start at middle. |
| Source transcripts | Emory NLP `character-mining` JSON (Apache-2.0 repo; transcript text is the show's copyright). Kept in `source/`, git-ignored, never committed. |
| Publishing | Same pattern as the other apps (own GitHub repo, GitHub Pages) — the user decides when to create the remote. |

## Architecture

```
friends-app/
├── index.html                 # the app (vanilla HTML/CSS/JS, mobile-first)
├── data.js                    # GENERATED: const FRIENDS = [...]
├── PROGRESS.md                # GENERATED: episodes done, counts, next up
├── episodes/sXXeYY.json       # hand/LLM-written items per episode (the real source of truth)
├── source/friends_season_NN.json   # transcripts, git-ignored
└── tools/
    ├── show-episode.js        # print an episode as "[uNNN] Speaker: line"
    ├── build-data.js          # episodes/*.json + source → data.js, PROGRESS.md (validates; --check = no write)
    ├── smoke-test.html        # headless-Chrome harness that drives the app end to end
    └── EXTRACTION_GUIDE.md    # selection criteria, type/level rubric, distractor rules
```

Data flow: `show-episode` → Claude reads → writes `episodes/sXXeYY.json` (uid + answer + options only) → `build-data` resolves line/cue/response/speakers from `source/` by uid, validates, merges, writes `data.js`.

Keeping dialogue text out of the episode files means the repo's hand-written data never quotes the script, the build catches misquotes mechanically (answer must occur in the referenced line), and the per-item authoring cost is about 6 short fields.

## Data schema (`data.js`)

```javascript
{
  expression: "freak out",          // canonical form; merge key (lower-cased, whitespace-normalised)
  type: "phrase",                   // word | phrase | colloquial
  level: "middle",                  // elementary | middle | high | college | expert
  pos: "verb",                      // noun | verb | adjective | adverb | expression
  meaning: "to become very anxious, upset, or panicked",
  exchanges: [{
    ep: "S01E01", uid: "s01_e01_c01_u056",
    cueSpeaker: "Monica", cue: "…",                 // previous line, or null
    speaker: "Rachel", line: "… I got really freaked out …",
    answer: "freaked out",                          // surface form as it appears in line
    responseSpeaker: "Monica", response: "…",       // next line, or null (at least one of cue/response is set)
    options: ["freaked out", "backed off", "showed off", "calmed down"]   // options[0] = answer
  }]
}
```

Options live on the exchange, not the item, because the surface form differs per scene (freaked / freaking). The app blanks the first case-insensitive occurrence of `answer` in `line`.

## App behaviour

Same skeleton as grammar-app: header stats (Expressions / Scenes / Weak), score bar, progress bar, mother tabs, generated chips with counts, quiz size 10/15/20/30/50, feedback with meaning + another scene for the same expression, results card with review and all-time weak list. Scores in `localStorage` under `friends_phrase_scores`, keyed by expression; wrong −1, correct +1 only when negative.

Differences: the question shows up to three dialogue turns (cue, target with blank, response) as left-aligned speaker-labelled bubbles; one question per expression per quiz; By Season filters on the exchange's episode; option buttons are full-width on phones (≤480px) with 44px touch targets; `viewport-fit=cover` and safe-area padding for iPhone/iPad home-screen use.

## Validation & testing

- `node tools/build-data.js` fails on: unknown uid, uid outside the file's episode, answer not in line, options ≠ 4 or not distinct, options[0] ≠ answer, bad type/level/pos, elementary word, expression duplicated within a file, exchange with neither cue nor response. Type/level conflicts across episodes warn and keep the first.
- Root `node validate-data.js` runs the build in `--check` mode alongside the other five apps.
- `tools/smoke-test.html` + headless Chrome drives a full session (answer right, answer wrong, every filter tab, 10-question run to results) and prints a JSON report.

## Out of scope (for now)

Per-episode filter, audio, spaced repetition, translation to Korean, automatic distractor generation.
