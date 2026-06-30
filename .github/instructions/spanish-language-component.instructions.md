---
description: "Use when creating or editing Spanish language scenarios, vocabulary, lessons, or sentence drills under src/content/languages/spanish/**."
applyTo: "src/content/languages/spanish/**"
---
# Spanish Language Component Rules

Use this guidance for Spanish language content only.

## Primary references

- [CLAUDE.md](../../CLAUDE.md)
- [.claude/skills/spanish-content/SKILL.md](../../.claude/skills/spanish-content/SKILL.md)
- [.claude/skills/spanish-content/references/content-rules.md](../../.claude/skills/spanish-content/references/content-rules.md)

## Authoring requirements

- Keep scenarios practical and conversation-first.
- Reuse known vocabulary heavily.
- Introduce only the minimum new language needed.
- Prefer chunks and sentence patterns over isolated words when useful.
- Keep `lesson.explanation` focused on one main idea.
- Keep the first teaching block honest and avoid pre-teaching future words.

## Data and formatting rules

- Valid JSON only.
- UTF-8 without BOM.
- ASCII punctuation only.
- Spanish entries should stay accentless for consistency in this repository.
- Keep vocabulary ordered in cohesive groups of 3 where possible.

## Scenario quality checklist

- `scenario.json` slug matches folder name.
- `vocabulary.json` categories are meaningful for distractor quality.
- Notes explain reusable patterns or useful nuance.
- `sentences.json` distractors are meaningful contrasts, not random noise.
- Sentences sound like real things a learner would say.

## Before finalizing

1. Run: `node .claude/skills/spanish-content/scripts/validate-content.mjs`
2. Update version and changelog.
3. Update `docs/content.md` and `words-taught.md` when applicable.
