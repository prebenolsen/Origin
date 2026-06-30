---
name: module-content
description: Author, extend, or fix Origin's non-language learning modules (history, science, politics, psychology, countries, philosophy, arts) under src/content/<category>/<subcategory>/<module>/. Use when turning a source transcript into a module, writing or fixing module/story/timeline/quiz/flashcards JSON, authoring a context map (geo or schematic), publishing a PLACEHOLDER scaffold, adding book-insight decks (book-*.json), or validating content. Covers the learning-design rules and ships a validator.
---

# Module content authoring (history / science / politics / psychology / ...)

Origin is a **learning engine, not a textbook**. Educational content is plain JSON,
auto-discovered at build time (`src/lib/content.ts`) - **drop a folder in, no code
changes**. This skill is for writing that content well and keeping it valid. (The engine
that renders it is the `module-engine` skill.)

> Authoritative types: [`src/types/content.ts`](../../../src/types/content.ts).
> Learning-design brief: [`docs/content-instructions.md`](../../../docs/content-instructions.md)
> (books: [`docs/book-instructions.md`](../../../docs/book-instructions.md)).
> Distilled rules: [`references/content-rules.md`](references/content-rules.md).
> Ready-to-copy templates: [`assets/`](assets/).

## Folder layout

```
src/content/<category>/<subcategory>/<module>/
  module.json        # REQUIRED: title, summary, context (intro + map/image). period = history only.
  story.json         # vertical story cards (the main experience)        (optional)
  timeline.json      # major milestones for the persistent rail          (optional)
  quiz.json          # recall questions (4 types)                        (optional)
  flashcards.json    # front/back review cards                           (optional)
  book-<slug>.json   # one or more optional book-insight decks           (optional)
```

Folder names are slugs (`rise-of-the-roman-empire`). The display title comes from
`module.json.title`; category/subcategory names are humanized from the slug (override a
category's pretty name in `CATEGORY_DISPLAY` in `src/lib/content.ts`). The path
`category/subcategory/module` is the module's identity - keep it stable.

## The rules that matter (do not violate)

1. **Transform, don't summarize.** The source transcript is raw material, not the lesson.
   Rebuild it into the clearest learning journey: *what happened, when, where, who, why,
   what changed, why it matters today*. Cause-and-effect over fact lists. (Full brief:
   `docs/content-instructions.md`.)
2. **Story cards = one idea each.** ~10-30s to read, 2-7 sentences, simple language, each
   ending in a `next` curiosity hook. "One idea" can hold several facts that explain one
   concept; it must not mix unrelated facts. Card count follows complexity (small 5-10,
   medium 10-20, large 20-40+) - never pad or truncate to a number.
3. **Map mode is chosen by the data, not a flag.** Geographic topic -> give **every**
   marker real `lat`/`lng` (renders a real map). Conceptual topic (psychology, abstract
   politics, ideas, tech) -> use `x`/`y` percentages (renders a schematic). **Never put a
   world map behind a non-geographic lesson.** Keep to ~3-6 short-labelled markers; add
   `connections` only for story-driving relationships. See `references/content-rules.md`.
4. **`period` is history-only.** Only modules under `src/content/history/**` get a
   `period`. Other categories omit it and use `context.when` for a time cue.
5. **Quiz answers must vary - randomize the correct index.** For multiple-choice, the
   `answer` index must be genuinely mixed across a module (don't make them all `0`). Every
   question needs an `explanation`. Test understanding (why/cause/effect/connection), not
   trivia. Ordering/matching are great for sequence and relationship questions.
6. **Timeline = major milestones only.** It exists so the learner keeps their place during
   the story, not to list every event.
7. **Encoding.** UTF-8 **without BOM**, valid JSON (no trailing commas/comments). Prefer
   ASCII punctuation - **hyphen-minus `-`, not `—`/`–`** - unless there's a clear editorial
   reason (e.g. a `period` date range). Norwegian letters `æ ø å` (and caps) are allowed,
   stored directly as UTF-8.
8. **Historical accuracy.** Don't flatten debated history into false certainty or pin
   complex events on one cause. Show multiple perspectives and social/economic/political
   factors when relevant. Engaging but not misleading.
9. **Required-on-every-change (repo rule):** bump `version.js` + `package.json` (**MINOR**
   for content), add a `docs/changelog.md` entry, and mark the row **DONE** in
   `docs/content.md`. Keep `docs/readme.md` current if the UX changes.

## Publishing a PLACEHOLDER scaffold (the common path)

Unfinished modules ship as scaffolds whose `module.json.title` starts with `PLACEHOLDER:`.
The engine **hides** any such module (no listing, count, search, or direct URL) - so
authoring *is* publishing. To publish one:

1. Replace the `PLACEHOLDER:` title with the real title; rewrite `summary` and the whole
   `context` block (headline, description, real map markers).
2. Write `story.json`, `timeline.json`, `quiz.json`, `flashcards.json` from `assets/`.
3. **Validate:** `node .claude/skills/module-content/scripts/validate-content.mjs`
4. Do the repo "required on every change" steps (version, changelog, content.md DONE).

No code change is needed - removing the `PLACEHOLDER` title is the publish switch.

## Add a brand-new module (checklist)

1. `mkdir src/content/<category>/<subcategory>/<module-slug>/`.
2. Copy `assets/module.template.json` (geo) or `assets/module.schematic.template.json`
   (concept) -> `module.json`; set `title`, `summary`, `context`. Add `period` **only**
   for history.
3. Add `story.json`, `timeline.json`, `quiz.json`, `flashcards.json` from `assets/`
   (all optional, but a real module wants story + quiz at least).
4. Validate, then do the repo "required on every change" steps.

## Add a book-insight deck

Drop `book-<slug>.json` into a module folder (array of `{ id, title, content, concept?,
next? }`). The filename's `<slug>` becomes the humanized book title. Follow
`docs/book-instructions.md`: extract the strongest mental models, not a chapter summary.

## Validate

```bash
node .claude/skills/module-content/scripts/validate-content.mjs            # all non-language content
node .claude/skills/module-content/scripts/validate-content.mjs history    # one category
```

Checks JSON validity, BOM, typographic dashes (warn), required `module.json` fields, map
consistency (all-geo vs schematic; connection ids resolve), `period` only on history,
per-type quiz correctness (answer index in range, ordering permutations, matching pairs),
an all-same multiple-choice answer index (warn), story/flashcard/book shapes, and flags
`PLACEHOLDER` modules as hidden. Exit code is non-zero on errors (warnings don't fail).
Run it before committing content.
