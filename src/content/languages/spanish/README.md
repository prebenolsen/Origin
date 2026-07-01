# Spanish Component README

This file summarizes the current Spanish learning component in Origin.

## What this component contains

- Language config and chapter definitions in `language.json`
- Module content under `chapters/<chapter>/<module>/`
- Progress-word inventory notes in `words-taught.md`
- Planning notes in `plan-going-forward.md`

## Current learning path (chapters/modules)

The Spanish track currently has 6 chapters (all available) and 43 authored modules total.

1. Visiting Spain (12 modules)
2. Meeting People (9 modules)
3. Visiting Spain II (5 modules)
4. Unlock Spanish (7 modules)
5. Everyday Life (8 modules)
6. Real conversations (2 modules)

Together, these chapters cover travel survival Spanish, social conversation, sentence construction, daily-life conversation, reinforcement/level-up modules, and more natural real-world planning and everyday talk.

## Categories and sections coverage

The content is organized by:

- Chapters: the 6 chapters listed above
- Modules: 43 module folders (each with `module.json` and `lesson.json`, plus vocabulary and optional sentence/personalization files)
- Vocabulary categories: 69 authored category labels in `vocabulary.json` files (examples include question, phrase, numbers, routine, place, time, greetings, family, food, navigation, colors, connectors, and verb-focused groups)

Authoring coverage currently includes:

- 41 `vocabulary.json` files
- 22 `sentences.json` files
- 5 `personalize.json` files

## Total words learned (component total)

Based on all authored module vocabulary files:

- 449 total vocabulary entries
- 400 unique Spanish vocabulary items

The practical headline number for component scope is 400 unique taught Spanish items so far.

## How users are tested inside modules

During lesson progression, users are tested in a staged way:

1. Batch practice during the lesson (small word groups)
2. Sentence-building drills where available
3. Checkpoint review after progress milestones (every 4 modules, plus chapter-end)

Question/testing types used by the module engine:

1. Choose meaning (Spanish to English recognition)
2. Choose word (English to Spanish recall)
3. Fill blank (context sentence with options)
4. Produce (type the Spanish answer)
5. Build sentence (word-bank tile ordering)

The system is adaptive: weaker/new words are surfaced earlier and strong words are pushed toward harder recall/production.

Checkpoint review behavior:

1. No immediate full-section test at the end of each lesson
2. Checkpoints trigger after every 4 completed modules and at the end of each chapter
3. Questions are sampled from all completed modules in the active chapter
4. Sampling is weighted toward recent modules while still reinforcing older content

## Review modes currently available

Review is split into two modes:

1. Classic Review
2. Word-Matching Test

Classic Review supports multiple review scopes:

1. Review all learned words
2. Practice weak words
3. Review recent words (this week)
4. Test by specific module vocabulary

Word-Matching Test behavior:

1. Duolingo-style bilingual pair matching
2. Session-randomized pairs
3. Batches of 6 pairs at a time

## Summary status

The Spanish component is now a multi-chapter, multi-module path with:

- broad travel-to-conversation coverage
- adaptive module testing (recognition to production)
- sentence-construction practice in supported modules
- two complementary review modes for retention and recall speed

This README is intentionally concise and should be updated as chapters, module counts, or test/review mechanics change.

## Maintenance checklist (keep this file current)

When adding or changing Spanish chapters/modules, update this README in the same change with:

1. Chapter count and chapter list in "Current learning path"
2. Total module count
3. File coverage counts (`vocabulary.json`, `sentences.json`, `personalize.json`)
4. Total and unique vocabulary totals
5. Summary wording if new capability or review behavior was added
6. Run `npm run sync:spanish-readme` after content edits to refresh counts automatically
