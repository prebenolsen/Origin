# Language content rules (reference)

Distilled from `CLAUDE.md`, `docs/architecture.md`, and the language design decisions.
Authoritative shapes live in `src/types/language.ts`.

## File shapes (quick reference)

### module.json
```jsonc
{
  "slug": "greetings",           // must equal the folder name
  "title": "Greetings",
  "summary": "One line shown on the chapter.",
  "icon": "👋",                  // emoji
  "kind": "standard",            // standard | personalized | placeholder
  "estMinutes": 6
}
```

### vocabulary.json  (VocabItem[])
```jsonc
[
  { "en": "hello", "es": "hola", "category": "greetings", "note": "optional hint" }
]
```
- `en` always required. `es` required unless `kind === "placeholder"` (then "").
- `category` strongly recommended: distractors are chosen from the same category and from
  spelling-similar words, so good categories make the tests sharper.
- **Order is pedagogy.** The array is sliced into batches of 3 (`BLOCK_SIZE`). Put the most
  useful words first; make each trio cohesive. Aim for a length that is a multiple of 3.

### lesson.json
```jsonc
{
  "context": "Why this matters in the real situation (2-3 sentences).",
  "explanation": "One short paragraph - the FIRST batch's words only.",
  "examples": [ { "es": "Hola. - Adios.", "en": "Hello. - Goodbye.", "note": "..." } ],
  "phrases":  [ { "en": "Hello", "es": "Hola", "literal": "...", "note": "..." } ]
}
```
Examples on the teach screen are auto-gated to words already introduced (whole-word match),
so they will never surface a future word - but still write them honestly per batch.

### personalize.json  (personalized modules)
```jsonc
{
  "prompt": "What do you usually buy?",
  "intro": "Optional sub-line.",
  "template": { "es": "Donde estan los/las ___?", "en": "Where are the ___?" },
  "groups": [
    { "category": "vegetables", "label": "Vegetables",
      "options": [ { "en": "cucumber", "es": "pepino" } ] }
  ]
}
```
Only the learner's picked options are taught, merged with the base `vocabulary.json`. The
`template` enables Stage-3 (context) fill-in-the-blank questions.

## Hard rules

- **Encoding:** UTF-8 without BOM. Valid JSON (no trailing commas/comments).
- **Punctuation:** ASCII only. Use `-` (hyphen-minus), never `—`/`–`. No smart quotes.
- **Accents:** this Spanish set stores words without accents (ids are accent-normalized in
  `srs.vocabId`, so "cafe" and "café" collide). Be consistent - omit accents.
- **Category separation:** never include another module's vocabulary. Greetings is exactly
  hello/goodbye/see-you-later/good-morning/afternoon/evening/thank-you/you're-welcome/
  excuse-me/yes/no. Cafe orders belong to Restaurant.
- **No pre-teaching:** the first-batch `explanation` references only first-batch words.
- **Short intros:** context and explanation are brief; detail goes in per-word `note`s.

## How the engine consumes this content

- Words become `UserVocabularyProgress`-style state in `srs.ts` on first teach
  (`introduce`), then accrue review history.
- Tests ramp Recognition -> Recall -> Context -> Production by demonstrated mastery; a
  recognition guess advances far less than confident production.
- Reviews are adaptive (failed first, recent next, mastered retention last) - never the
  authored order. See the `language-engine` skill for invariants before changing any of this.

## Publishing flow for a placeholder

1. Fill every `es` in `vocabulary.json` (ASCII, no accents), set `category`.
2. Add a short `lesson.json` (optional but recommended).
3. Set `module.json` `"kind"` to `standard` (or `personalized` + add `personalize.json`).
4. Run the validator; fix errors.
5. Bump version (MINOR), update `docs/changelog.md` and mark DONE in `docs/content.md`.
