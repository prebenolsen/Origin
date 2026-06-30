---
description: "Use when working anywhere in Origin. Applies CLAUDE.md as the primary source of truth and enforces required repo workflow."
applyTo: "**"
---
# Origin Primary Guidance

Always treat [CLAUDE.md](../CLAUDE.md) as the authoritative project guide.

## Core rules

- Follow existing architecture and do not redesign unless asked.
- Keep changes minimal and consistent with existing patterns.
- For each change, keep versioning and changelog in sync.

## Required workflow

1. Bump [version.js](../../version.js).
2. Keep [package.json](../../package.json) version aligned.
3. Add an entry to [docs/changelog.md](../../docs/changelog.md).
4. If content modules are completed, update [docs/content.md](../../docs/content.md).
5. Keep docs in sync when user experience changes.

## Versioning

- MAJOR: big feature or breaking change.
- MINOR: content added or changed.
- PATCH: UX, UI, tooling, or docs tweaks.

## Important separation

- Language learning content under `src/content/languages/**` follows language rules.
- History, politics, and module content are separate systems and must not be mixed.
