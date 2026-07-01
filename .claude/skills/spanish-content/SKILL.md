---
name: spanish-content
description: Author, extend, or fix Origin language-learning content (Spanish first) under src/content/languages/**. Use when adding a module, filling a placeholder word list, writing lesson/vocabulary/personalize JSON, wiring chapters, or validating language content. Covers the content rules (small batches, category separation, no pre-teaching, personalization) and ships a validator.
---

# Spanish / language content authoring

Origin's Languages domain is **chapter-driven and personalized**. Content is plain JSON,
auto-discovered at build time (`src/lib/language/content.ts`) - drop a folder in, no code
changes. This skill is for writing that content correctly and keeping it valid.

> Authoritative types: [`src/types/language.ts`](../../../src/types/language.ts).
> Full rule reference: [`references/content-rules.md`](references/content-rules.md).
> Ready-to-copy templates: [`assets/`](assets/).

## Folder layout

```
src/content/languages/<lang>/
  language.json                     # Language meta + chapters (each chapter lists its modules)
  chapters/<chapter>/<slug>/        # chapter folder = chapter slug, e.g. visiting-spain/cafe/
    module.json                     # meta + kind: standard | conversation | personalized | placeholder
    lesson.json                     # context / explanation / examples / phrases   (optional)
    vocabulary.json                 # VocabItem[] - the word list that reviews track
    personalize.json                # "what do you buy/wear?" picker + sentence frame (optional)
```

## The rules that matter (do not violate)

1. **Small batches, not a dictionary.** A module's `vocabulary.json` is taught ~3 words at
   a time (`BLOCK_SIZE = 3`). **Order the array so the first words are the most useful** and
   each group of 3 hangs together (e.g. `hola, adios, gracias` / `buenos dias, buenas tardes,
   buenas noches`). The list length should divide sensibly into 3s.
2. **Category separation.** Only teach words that belong to this module's purpose. Greetings
   must not contain `cafe`/`por favor` (that is Restaurant). When in doubt, leave it out.
3. **Don't pre-teach future vocabulary.** The lesson `explanation` shown on the first batch
   may only reference the **first batch's** words. Put word-specific detail in each item's
   `note`. Example sentences are auto-gated to introduced words, but keep them honest too.
4. **Keep introductions short.** `context` = why this matters (2-3 sentences). `explanation`
   = one short paragraph about the opening batch only.
5. **Encoding.** UTF-8 **without BOM**, valid JSON (no trailing commas/comments). Use plain
   ASCII punctuation - **hyphen-minus `-`, never `—`/`–`**. This content set stores Spanish
   **without accents** (ids are accent-normalized anyway); stay consistent.
6. **Personalization.** For a `personalized` module, `personalize.json` asks a question and
   offers grouped options; only the picked words are taught (merged with the base
   `vocabulary.json`). Never teach an option the learner did not pick (no dresses/skirts
   unless chosen).
7. **Placeholders.** A module with `"kind": "placeholder"` is hidden from learners. Its
   `vocabulary.json` is a template with the English column filled and `"es": ""`. To publish:
   fill every `es`, then set `kind` to `standard` (or `personalized`) - no code change.
8. **Required-on-every-change (repo rule):** bump `version.js` + `package.json` (MINOR for
   content), add a `docs/changelog.md` entry, and mark the row DONE in `docs/content.md`.
9. **Keep the master word list current.** Every English word/phrase taught by any module is
   catalogued in [`src/content/languages/spanish/words-taught.md`](../../../src/content/languages/spanish/words-taught.md).
   Whenever you add or change vocabulary (`vocabulary.json`, or picked `personalize.json`
   options), add the new English entries to that file under the matching chapter section. New
   chapters after the first list both "Words from previous chapters" and "Words introduced in
   this chapter". Add words there in the same order they are taught.

## Add a new module (checklist)

1. `mkdir src/content/languages/spanish/chapters/<chapter>/<slug>/` (chapter = chapter slug,
   e.g. `visiting-spain`). Keep the leaf `<slug>` unique across chapters - it is the identity.
2. Copy `assets/module.standard.json` (or `.personalized.json`) → `module.json`; set
   `slug` (must equal the folder), `title`, `summary`, `icon`, `estMinutes`.
3. Write `vocabulary.json` from `assets/vocabulary.template.json` - ordered into batches.
4. Optional `lesson.json` from `assets/lesson.template.json` (short context + explanation).
5. Add the `<slug>` to the relevant chapter's `modules` array in `language.json`.
6. Add the module's English words to `src/content/languages/spanish/words-taught.md` (rule 9).
7. **Validate:** `node .claude/skills/spanish-content/scripts/validate-content.mjs`
8. Do the repo "required on every change" steps (version, changelog, content.md).

## Fill a placeholder (the "feed me a word list" path)

Open the module's `vocabulary.json`, translate each `en` into `es` (ASCII, no accents),
set `category` sensibly (drives smart distractors), then flip `module.json` `kind` to
`standard`/`personalized`. Add the English words to `words-taught.md` (rule 9). Re-run the
validator.

## Conversation modules (the `conversation` format)

A **Conversation module** is a second module *format* (set `module.json` `"format":
"conversation"`). Instead of teaching a batch of words, it shows a realistic
Messenger/WhatsApp-style chat between two native speakers, one message at a time, then a
short comprehension check. **Its job is to reinforce words the learner already knows in
natural context - it teaches little or no new vocabulary.** There is no SRS teaching flow
and no `vocabulary.json`; the content is one `conversation_<slug>.json` (e.g.
`conversation_sharing-a-table.json`). Tag it in `module.json`
with **both** `"format": "conversation"` and `"kind": "conversation"`.

> **Canonical example (study this first):**
> [`chapters/visiting-spain/sharing-a-table/`](../../../src/content/languages/spanish/chapters/visiting-spain/sharing-a-table/)
> is the first perfected Conversation module - Lucia and Sam share a cafe table.
> It reuses almost the whole chapter's vocabulary, runs 18 messages (the sweet
> spot is **12-24**), glosses only the handful of new-but-useful connector words
> (`y`, `tu`, `de`, `perfecto`, `vale`), and ends with 5 comprehension questions
> covering all four question types. Match its shape and density.

Authoring rules (in addition to the shared encoding rules):

1. **Reuse known words.** Write the chat almost entirely from vocabulary earlier modules
   in the chapter already taught. A little new vocab is fine *if* it's obvious from context
   or covered by a word gloss. Keep grammar at the chapter's level.
2. **Sound authentic, keep it short.** Prefer natural back-and-forth (`Hola! / Que tal? /
   Todo bien`) over textbook lines. Most messages are one sentence; avoid paragraphs. Aim
   for **12-24 messages** - the sweet spot (`sharing-a-table` uses 18). Fewer feels thin;
   more overstays its welcome.
3. **Two speakers**, each with a stable `id`, a `name`, and a `side` (`left`/`right`). Every
   message's `speaker` must match a declared speaker `id`.
4. **Highlight only the new-but-useful words.** For each message, list in `words: [{ es, en }]`
   exactly the words the learner hasn't formally been taught yet but needs here (in
   `sharing-a-table`: `y`, `tu`, `de`, `perfecto`, `vale`). Those become tappable and show
   their meaning above the word. **Do not** gloss words already taught earlier in the chapter,
   and don't gloss a connector that only appears inside a fixed taught phrase (e.g. `con` in
   `cafe con leche`). Matching is accent/case/punctuation-insensitive (`"cafe"` matches
   `Café`). Every message also carries a full `en` translation revealed by "Reveal sentence".
5. **Comprehension, not vocabulary.** End with **3-5** questions that test whether the learner
   followed the *conversation*. Types: `multiple-choice`, `true-false`, `who-said-it`,
   `ordering`. **Never** ask "what does <word> mean?".

Add a conversation module (checklist):

1. `mkdir src/content/languages/<lang>/chapters/<chapter>/<slug>/`.
2. Copy `assets/module.conversation.json` -> `module.json`; set `slug` (= folder), `title`,
   `summary`, `icon`, `estMinutes`. Keep both `"kind": "conversation"` and
   `"format": "conversation"`.
3. Copy `assets/conversation.template.json` -> `conversation_<slug>.json` (the file must be
   named `conversation_` + the module folder slug, e.g. `conversation_catching-a-taxi.json`);
   write `intro`, the two `speakers`, the `messages` (with `words` glosses), and 3-5 `questions`.
4. Add the `<slug>` to the chapter's `modules` array in `language.json`.
5. Validate, then do the repo "required on every change" steps. Conversation modules
   introduce no `vocabulary.json`, so nothing is added to `words-taught.md`.

**Placeholder path:** ship `module.json` with `"kind": "placeholder"` + `"format":
"conversation"` and a skeleton `conversation_<slug>.json` (empty `intro`/`messages`/`questions`,
speakers with blank names). It's hidden from learners until you fill it and flip `kind` to
`conversation`. A live scaffold already exists at
`chapters/meeting-people/making-plans-chat/`.

## Validate

```bash
node .claude/skills/spanish-content/scripts/validate-content.mjs
```

Checks every language file: JSON validity, no BOM, no typographic dashes, required fields,
valid `kind`, non-placeholder modules have no empty `es`, duplicate words within a
module, chapters referencing missing modules, and personalize structure. Exit code is
non-zero on errors (warnings don't fail). Run it before committing content.
