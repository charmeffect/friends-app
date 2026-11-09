# Brief: second pass — add more learnable expressions to episodes that are already done

The quiz already has ~18 items per episode. Many expressions that Korean *Friends* English courses and books
teach were skipped — above all the everyday spoken English the show is famous for. Your job: for each episode
in your task prompt, add **6–10 NEW items** to the existing file `episodes/<episode>.json` (append to the array;
never change or remove the items already there).

1. Read `tools/EXTRACTION_GUIDE.md` fully (format, type rule, level rubric, distractor rules) and
   `tools/AGENT_BRIEF.md` steps 4–7 (exchange rules, content rule, build check, temp files, no git).
2. `node tools/show-episode.js <episode>` and read the whole episode; open the existing episode file to see
   what is already taken.
3. Look first for what *Friends* courses typically teach and the quiz still lacks:
   - spoken discourse markers and fillers: I mean, you know what, come on, I guess, kind of / sort of,
     seriously, whatever, actually, anyway, so, the thing is, it's just that, not really, as if
   - reactions and conversational formulas: no kidding, tell me about it, you bet, sounds good, that's it,
     here we go, there you go, what's going on, how's it going, I'm in / count me in, my bad, no offense,
     don't get me wrong, I'll say, you got it, way to go, good call, fair enough, what if
   - everyday phrasal verbs and verb phrases (hang out with, ask out, make up, end up, figure out, show up,
     pick up on, come up with, get to do, be supposed to, used to, have got to)
   - sarcasm and understatement markers, intensifiers (so, totally, way too, kind of a big deal),
     idioms, and well-known lines from the show that are real reusable English ("We were on a break" → on a break)
   Then any other genuinely useful word/phrase. Single basic words (good, happy) are never items.
4. For each candidate run `node tools/has-expression.js "<expr>" ...` (several at once).
   - NEW → add it.
   - EXISTS with the same sense and fewer than 3 scenes → you may add it with a new scene from your episode,
     copying its exact type/level/pos/meaning (the build merges it). Count it as one of your 6–10.
   - EXISTS with a different sense, or SIMILAR → choose a different expression, or use the existing
     expression's exact name and fields if it is really the same unit.
5. Discourse markers often sit at the start of a line; that is fine. Make sure the blank is still answerable
   from the context and that distractors are clearly wrong there (e.g. "I mean" vs "I bet / I wish / I swear").
6. Run `node tools/build-data.js --check`; fix every error and WARN that mentions your episodes (ignore others —
   other agents work at the same time). Repeat until clean.

Final report (short): per episode, how many items added and by type/level; any judgement calls.
