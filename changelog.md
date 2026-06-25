# Changelog

All notable changes to **Origin** are documented here.
Versioning follows the rules in [`CLAUDE.md`](CLAUDE.md): `MAJOR.MINOR.PATCH` where
MAJOR = big features, MINOR = content, PATCH = UX/UI.

## [1.0.0] — 2026-06-25

### Added — initial learning engine
- Project scaffolding: Vite + React 19 + TypeScript + Tailwind CSS v4 + React Router v7.
- Versioning + changelog workflow (`version.js`, `CLAUDE.md`, this file).
- **Content architecture**: `src/content/<category>/<subcategory>/<module>/*.json`,
  auto-discovered by a content registry (`src/lib/content.ts`) via `import.meta.glob` —
  new modules are added by dropping in a folder, no code changes required.
- **Data model** (`src/types/content.ts`) for modules, story cards, timeline events,
  quiz questions (multiple-choice / true-false / ordering / matching) and flashcards.
- **Screens & components**:
  - Mobile phone-frame app shell.
  - Home screen + module selection grouped by category / subcategory.
  - Module introduction with a stylized **context map** (highlighted regions + routes).
  - Vertical **story feed** with scroll-snap and curiosity hooks.
  - **Persistent timeline** that tracks the active story card.
  - **Quiz** engine supporting all four question types, with explanations + scoring.
  - **Flashcards** with 3D flip and a known/review pile.
  - Per-module **progress tracking** in localStorage.
- **Demo content** (placeholder, not authoritative): three modules under *History*
  (Atlantic World, The American Civil War, The Roman Empire) to exercise the engine.
