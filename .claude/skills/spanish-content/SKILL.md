---
name: spanish-content
description: Author, extend, or fix Origin language-learning content (Spanish first) under src/content/languages/**. Use when adding a scenario, filling a placeholder word list, writing lesson/vocabulary/personalize JSON, wiring goals, or validating language content. Covers the content rules (small batches, category separation, no pre-teaching, personalization) and ships a validator.
---

# Spanish / language content authoring

Origin's Languages domain is **goal-driven and personalized**. Content is plain JSON,
auto-discovered at build time (`src/lib/language/content.ts`) - drop a folder in, no code
changes. This skill is for writing that content correctly and keeping it valid.

> Authoritative types: [`src/types/language.ts`](../../../src/types/language.ts).
> Full rule reference: [`references/content-rules.md`](references/content-rules.md).
> Ready-to-copy templates: [`assets/`](assets/).

## Folder layout

```
src/content/languages/<lang>/
  language.json                     # Language meta + goals (each goal lists its scenarios)
  scenarios/<phase>/<slug>/         # phase folder = goal slug, e.g. visiting-spain/cafe/
    scenario.json                   # meta + kind: standard | personalized | placeholder
    lesson.json                     # context / explanation / examples / phrases   (optional)
    vocabulary.json                 # VocabItem[] - the word list that reviews track
    personalize.json                # "what do you buy/wear?" picker + sentence frame (optional)
```

## The rules that matter (do not violate)

1. **Small batches, not a dictionary.** A scenario's `vocabulary.json` is taught ~3 words at
   a time (`BLOCK_SIZE = 3`). **Order the array so the first words are the most useful** and
   each group of 3 hangs together (e.g. `hola, adios, gracias` / `buenos dias, buenas tardes,
   buenas noches`). The list length should divide sensibly into 3s.
2. **Category separation.** Only teach words that belong to this scenario's purpose. Greetings
   must not contain `cafe`/`por favor` (that is Restaurant). When in doubt, leave it out.
3. **Don't pre-teach future vocabulary.** The lesson `explanation` shown on the first batch
   may only reference the **first batch's** words. Put word-specific detail in each item's
   `note`. Example sentences are auto-gated to introduced words, but keep them honest too.
4. **Keep introductions short.** `context` = why this matters (2-3 sentences). `explanation`
   = one short paragraph about the opening batch only.
5. **Encoding.** UTF-8 **without BOM**, valid JSON (no trailing commas/comments). Use plain
   ASCII punctuation - **hyphen-minus `-`, never `—`/`–`**. This content set stores Spanish
   **without accents** (ids are accent-normalized anyway); stay consistent.
6. **Personalization.** For a `personalized` scenario, `personalize.json` asks a question and
   offers grouped options; only the picked words are taught (merged with the base
   `vocabulary.json`). Never teach an option the learner did not pick (no dresses/skirts
   unless chosen).
7. **Placeholders.** A scenario with `"kind": "placeholder"` is hidden from learners. Its
   `vocabulary.json` is a template with the English column filled and `"es": ""`. To publish:
   fill every `es`, then set `kind` to `standard` (or `personalized`) - no code change.
8. **Required-on-every-change (repo rule):** bump `version.js` + `package.json` (MINOR for
   content), add a `docs/changelog.md` entry, and mark the row DONE in `docs/content.md`.

## Add a new scenario (checklist)

1. `mkdir src/content/languages/spanish/scenarios/<phase>/<slug>/` (phase = goal slug, e.g.
   `visiting-spain`). Keep the leaf `<slug>` unique across phases - it is the identity.
2. Copy `assets/scenario.standard.json` (or `.personalized.json`) → `scenario.json`; set
   `slug` (must equal the folder), `title`, `summary`, `icon`, `estMinutes`.
3. Write `vocabulary.json` from `assets/vocabulary.template.json` - ordered into batches.
4. Optional `lesson.json` from `assets/lesson.template.json` (short context + explanation).
5. Add the `<slug>` to the relevant goal's `scenarios` array in `language.json`.
6. **Validate:** `node .claude/skills/spanish-content/scripts/validate-content.mjs`
7. Do the repo "required on every change" steps (version, changelog, content.md).

## Fill a placeholder (the "feed me a word list" path)

Open the scenario's `vocabulary.json`, translate each `en` into `es` (ASCII, no accents),
set `category` sensibly (drives smart distractors), then flip `scenario.json` `kind` to
`standard`/`personalized`. Re-run the validator.

## Validate

```bash
node .claude/skills/spanish-content/scripts/validate-content.mjs
```

Checks every language file: JSON validity, no BOM, no typographic dashes, required fields,
valid `kind`, non-placeholder scenarios have no empty `es`, duplicate words within a
scenario, goals referencing missing scenarios, and personalize structure. Exit code is
non-zero on errors (warnings don't fail). Run it before committing content.
