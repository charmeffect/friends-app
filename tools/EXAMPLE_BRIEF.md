# Brief: write dictionary-style example sentences

The quiz shows one example sentence per expression after the learner answers, like the first example in a learner's dictionary entry. You are given a todo file: a JSON array of `{expression, pos, meaning}`.

For EVERY entry, write ONE original example sentence and save them all as one JSON object to the output file named in your prompt:

```json
{
  "freak out": "She [[freaked out]] when she saw the spider in the bathtub.",
  "gross": "Eating food off the floor is so [[gross]]!"
}
```

Rules
- Key = the `expression` string exactly as given (same spelling and case).
- Use the sense described by `meaning` — not another sense of the word.
- Mark the expression (in whatever inflected form you use) with `[[...]]`, exactly once. Placeholders like "someone"/"one's" become real words: "drive someone crazy" → "My little brother [[drives me crazy]].". Split phrasal verbs may be marked as one span: "[[pick it up]]".
- Write your own sentence. Do NOT copy or closely paraphrase Oxford, Cambridge, Longman, Merriam-Webster or any other dictionary, and do NOT quote Friends.
- 6–16 words, natural everyday English, clear enough that the sentence alone shows the meaning. Neutral topics (school, work, family, food, travel, friends). No names of Friends characters.
- Match the register: colloquial items in casual speech (can use "I'm", "gonna" is fine), formal words in a neutral sentence.
- Crude items: keep the example mild and non-sexual.
- Output must be valid JSON (use straight double quotes; escape inner quotes).

When done, run `node tools/build-data.js --check` from the friends-app folder and fix any error that mentions your output file. Do not edit any other file and do not run git. Report: how many entries you wrote, and any you were unsure about.
