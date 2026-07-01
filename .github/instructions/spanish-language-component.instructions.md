---
description: "Use when creating or editing Spanish language modules, vocabulary, lessons, or sentence drills under src/content/languages/spanish/**."
applyTo: "src/content/languages/spanish/**"
---
# Spanish Language Component Rules

Use this guidance for Spanish language content only.

## Primary references

- [CLAUDE.md](../../CLAUDE.md)
- [.claude/skills/spanish-content/SKILL.md](../../.claude/skills/spanish-content/SKILL.md)
- [.claude/skills/spanish-content/references/content-rules.md](../../.claude/skills/spanish-content/references/content-rules.md)

## Authoring requirements

- Keep modules practical and conversation-first.
- Reuse known vocabulary heavily.
- Introduce only the minimum new language needed.
- Prefer chunks and sentence patterns over isolated words when useful.
- Keep translation units aligned: if Spanish is a fixed multi-word expression, English must be the full natural chunk.
- Do not map multi-word Spanish chunks to single-word English labels when the meaning is a full clause/state.
- Keep `lesson.explanation` focused on one main idea.
- Keep the first teaching block honest and avoid pre-teaching future words.

## Strict chunk-mapping rules

- `en` and `es` must represent the same usable unit (word-to-word, chunk-to-chunk, or sentence-to-sentence).
- If Spanish uses a fixed expression, store the full natural English meaning in `en`.
- Never create entries where the prompt asks for a full expression but the expected English answer is only one word.
- Prefer natural English over literal glosses in `en`; put literal notes in `note`.

Examples:

- Correct: `{ "en": "I am hungry", "es": "tengo hambre" }`
- Wrong: `{ "en": "hungry", "es": "tengo hambre" }`
- Correct: `{ "en": "I am thirsty", "es": "tengo sed" }`
- Wrong: `{ "en": "thirsty", "es": "tengo sed" }`

## Data and formatting rules

- Valid JSON only.
- UTF-8 without BOM.
- ASCII punctuation only.
- Spanish entries should stay accentless for consistency in this repository.
- Keep vocabulary ordered in cohesive groups of 3 where possible.

## Module quality checklist

- `module.json` slug matches folder name.
- `vocabulary.json` categories are meaningful for distractor quality.
- Notes explain reusable patterns or useful nuance.
- Fixed expressions are mapped as full chunks (no collapsed one-word English for multi-word Spanish chunks).
- `sentences.json` distractors are meaningful contrasts, not random noise.
- Sentences sound like real things a learner would say.

## Before finalizing

1. Run: `node .claude/skills/spanish-content/scripts/validate-content.mjs`
2. Update version and changelog.
3. Update `docs/content.md` and `words-taught.md` when applicable.
