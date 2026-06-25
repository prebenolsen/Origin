# Changelog

All notable changes to **Origin** are documented here.
Versioning follows the rules in [`CLAUDE.md`](CLAUDE.md): `MAJOR.MINOR.PATCH` where
MAJOR = big features, MINOR = content, PATCH = UX/UI.

## [1.2.0] — 2026-06-25

### Added — Slavery in the Americas module (authored from source transcript)
- Replaced placeholder files in `src/content/history/atlantic-world/slavery-in-the-americas/` with full authored content generated from `raw.md`.
- Added a complete context map and metadata in `module.json` focused on regional links between the Deep South, Upper South, North, Atlantic trade, and Canada escape routes.
- Wrote a 12-card `story.json` covering: national economic integration, social structure, proslavery ideology, legal coercion, lived conditions, everyday resistance, escape networks, rebellions, backlash, and emancipation.
- Rebuilt `timeline.json` as major mental anchors (`1619`, `1800s`, `1800-1831`, `1831`, `1837`, `1860`, `1865`) and aligned story-card timeline references to those values.
- Replaced `quiz.json` with understanding-focused questions across multiple-choice, true-false, ordering, and matching.
- Replaced `flashcards.json` with core concept recall cards on system structure, resistance, ideology, and outcomes.
- Marked `Slavery in the Americas` as `DONE` in `docs/content.md`.

## [1.1.1] — 2026-06-25

### Changed — Copilot workspace instructions
- Added `.github/copilot-instructions.md` and pointed it directly to `CLAUDE.md` as the project instruction source for Copilot behavior in this repository.

## [1.1.0] — 2026-06-25

### Added — Transatlantic Slave Trade module (authored content)
- Replaced the placeholder JSON under
  `src/content/history/atlantic-world/transatlantic-slave-trade/` with a full module
  authored from the source transcript (`raw.md`).
- **Story** (11 cards) follows the transcript's core thesis — the trade as an
  *engineered, financed supply chain* — from slavery's ancient/global roots, through the
  religious (not racial) fault line, the American labor shortage, coastal "factories",
  Britain's and Liverpool's dominance, the triangular trade and Middle Passage, the
  syndicate/Lloyd's/Bank of England financing, the Zong massacre, and abolition (1807
  trade ban → 1833 emancipation and its lasting legacy).
- **Timeline** reduced to six matched milestones (Pre-1500, 1526, 1700s, 1781, 1807,
  1833); every story-card `timeline` value matches a timeline `year` exactly.
- **Quiz** rewritten as understanding-focused questions (cause/effect, the Zong's
  significance, chronological ordering, supply-chain role matching) across all four types.
- **Flashcards** (8) cover Middle Passage, triangular trade, demand drivers, factories,
  financing, the Zong, and the 1807-vs-1833 distinction.
- `module.json` (triangle context map) retained — it was already accurate.

## [1.0.1] — 2026-06-25

### Changed — content authoring workflow docs
- Filled in `docs/content-instructions.md` with a technical output contract: it now maps
  the pedagogical steps to the exact JSON files and schema the engine consumes
  (`module.json` map markers/connections with %-based coordinates, story `next`/`timeline`
  rules, the BCE timeline-matching gotcha, quiz type shapes, `raw.md` source convention,
  and the validate + version-bump steps).
- Aligns with the new CLAUDE.md ".txt → module" workflow and `docs/architecture.md`.

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
