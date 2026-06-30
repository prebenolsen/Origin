# Spanish Component README

This file summarizes the current Spanish learning component in Origin.

## What this component contains

- Language config and learning-path definitions in `language.json`
- Scenario content under `scenarios/<goal>/<scenario>/`
- Progress-word inventory notes in `words-taught.md`
- Planning notes in `plan-going-forward.md`

## Current learning path (modules/goals)

The Spanish path currently has 6 goals (all available) and 43 authored scenarios total.

1. Visiting Spain (12 scenarios)
2. Meeting People (9 scenarios)
3. Unlock Spanish (7 scenarios)
4. Everyday Life (8 scenarios)
5. Revisiting Visiting Spain (5 scenarios)
6. Real conversations (2 scenarios)

Together, these goals cover travel survival Spanish, social conversation, sentence construction, daily-life conversation, reinforcement/level-up scenarios, and more natural real-world planning and everyday talk.

## Categories and sections coverage

The content is organized by:

- Modules/goals: the 6 goals listed above
- Sections/scenarios: 43 scenario folders (each with `scenario.json` and `lesson.json`, plus vocabulary and optional sentence/personalization files)
- Vocabulary categories: 69 authored category labels in `vocabulary.json` files (examples include question, phrase, numbers, routine, place, time, greetings, family, food, navigation, colors, connectors, and verb-focused groups)

Authoring coverage currently includes:

- 41 `vocabulary.json` files
- 22 `sentences.json` files
- 5 `personalize.json` files

## Total words learned (component total)

Based on all authored scenario vocabulary files:

- 449 total vocabulary entries
- 400 unique Spanish vocabulary items

The practical headline number for component scope is 400 unique taught Spanish items so far.

## How users are tested inside modules

During lesson progression, users are tested in a staged way:

1. Batch practice during the lesson (small word groups)
2. Sentence-building drills where available
3. Checkpoint review after progress milestones (every 4 scenarios, plus goal-end)

Question/testing types used by the module engine:

1. Choose meaning (Spanish to English recognition)
2. Choose word (English to Spanish recall)
3. Fill blank (context sentence with options)
4. Produce (type the Spanish answer)
5. Build sentence (word-bank tile ordering)

The system is adaptive: weaker/new words are surfaced earlier and strong words are pushed toward harder recall/production.

Checkpoint review behavior:

1. No immediate full-section test at the end of each lesson
2. Checkpoints trigger after every 4 completed scenarios and at the end of each goal
3. Questions are sampled from all completed scenarios in the active goal
4. Sampling is weighted toward recent scenarios while still reinforcing older content

## Review modes currently available

Review is split into two modes:

1. Classic Review
2. Word-Matching Test

Classic Review supports multiple review scopes:

1. Review all learned words
2. Practice weak words
3. Review recent words (this week)
4. Test by specific scenario vocabulary

Word-Matching Test behavior:

1. Duolingo-style bilingual pair matching
2. Session-randomized pairs
3. Batches of 6 pairs at a time

## Summary status

The Spanish component is now a multi-goal, multi-scenario path with:

- broad travel-to-conversation coverage
- adaptive module testing (recognition to production)
- sentence-construction practice in supported scenarios
- two complementary review modes for retention and recall speed

This README is intentionally concise and should be updated as goals, scenario counts, or test/review mechanics change.

## Maintenance checklist (keep this file current)

When adding or changing Spanish goals/scenarios, update this README in the same change with:

1. Goal count and goal list in "Current learning path"
2. Total scenario count
3. File coverage counts (`vocabulary.json`, `sentences.json`, `personalize.json`)
4. Total and unique vocabulary totals
5. Summary wording if new capability or review behavior was added
6. Run `npm run sync:spanish-readme` after content edits to refresh counts automatically