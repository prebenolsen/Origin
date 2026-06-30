---
name: spanish-content-authoring
description: "Create or remake Spanish language scenario content in Origin using the established format (scenario, lesson, vocabulary, sentences) and repository rules. Use when asked to add or improve Spanish learning modules under src/content/languages/spanish/**."
---

# Spanish Content Authoring Skill

This skill is for Origin Spanish content work only.

## Goal

Produce high-quality scenario content that improves practical conversational ability while preserving the existing Origin structure.

## Required references

Read these before writing content:

- [CLAUDE.md](../../../CLAUDE.md)
- [.claude/skills/spanish-content/SKILL.md](../../../.claude/skills/spanish-content/SKILL.md)
- [.claude/skills/spanish-content/references/content-rules.md](../../../.claude/skills/spanish-content/references/content-rules.md)
- A high-quality existing scenario for style matching, for example:
  - [src/content/languages/spanish/scenarios/everyday-life/my-week/lesson.json](../../../src/content/languages/spanish/scenarios/everyday-life/my-week/lesson.json)

## Output structure

Each scenario folder should contain:

- `scenario.json`
- `lesson.json`
- `vocabulary.json`
- `sentences.json`

## Quality standards

- Teach useful everyday language, not list-style vocabulary dumps.
- Reuse previously taught language whenever possible.
- Introduce only necessary new vocabulary.
- Keep lessons concise and pattern-focused.
- Use meaningful distractors that test contrasts.
- Keep tone practical and conversational.

## Hard constraints

- JSON must be valid.
- Keep punctuation ASCII.
- Keep Spanish entries accentless for this repository.
- Keep vocabulary grouped in logical triplets where possible.

## Completion checklist

1. Validate content:
   - `node .claude/skills/spanish-content/scripts/validate-content.mjs`
2. Sync version and changelog:
   - [version.js](../../../version.js)
   - [package.json](../../../package.json)
   - [docs/changelog.md](../../../docs/changelog.md)
3. Update trackers when needed:
   - [docs/content.md](../../../docs/content.md)
   - [src/content/languages/spanish/words-taught.md](../../../src/content/languages/spanish/words-taught.md)
