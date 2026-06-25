# Changelog

All notable changes to **Origin** are documented here.
Versioning follows the rules in [`CLAUDE.md`](CLAUDE.md): `MAJOR.MINOR.PATCH` where
MAJOR = big features, MINOR = content, PATCH = UX/UI.

## [1.12.0] - 2026-06-25

### Changed - Psychology scaffold synced to updated module list
- Synchronized `src/content/psychology/` folders and placeholder files with the revised Psychology rows in `docs/content.md`.
- Added missing module scaffolds to match newly introduced/renamed modules, including:
  - `personality-traits-and-models`
  - `understanding-emotions`
  - `emotional-regulation`
  - `memory-and-learning`
  - `self-control-and-procrastination`
  - `problem-solving-and-creativity`
  - `confidence-identity-and-self-image`
  - `personal-growth-and-change`
  - `stress-and-coping`
  - `anxiety-and-fear`
  - `depression-and-mood`
- Removed obsolete Psychology placeholder module folders that were no longer present in the updated tracker list.
- Final Psychology structure now contains 21 module folders, each with `module.json`, `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json` placeholders.

## [1.11.0] - 2026-06-25

### Added - Psychology placeholder scaffolding
- Added a new category scaffold under `src/content/psychology/` with subcategories:
  - `foundations`
  - `personality`
  - `social-psychology`
  - `emotions`
  - `learning`
  - `motivation`
  - `self-development`
  - `human-behavior`
  - `mental-health`
- Created 17 module folders with full placeholder file sets (`module.json`, `story.json`, `timeline.json`, `quiz.json`, `flashcards.json`) following the existing project schema.
- Added/normalized Psychology rows in `docs/content.md` to include explicit `Status` placeholders (`------`) so all rows match the tracker table format.

## [1.10.2] - 2026-06-25

### Changed - category-first Home navigation
- Restructured the Home screen into a two-step flow: the user now first picks a category,
  then sees that category's modules. Previously every category, subcategory, and module
  was flattened into one long scroll.
- `/` (`HomeScreen`) is now a category picker (`CategoryCard` grid); a new `/c/:cat`
  route (`CategoryScreen`) lists one category's modules grouped by subcategory, with an
  "← All categories" back link.
- Added `getCategory(slug)` to the content registry (`src/lib/content.ts`).
- Leaving a module now returns to its category (`/c/:cat`) instead of the Home picker,
  keeping the browsing context.

## [1.10.1] - 2026-06-25

### Changed - hide unfinished placeholder modules from the user
- The content registry (`src/lib/content.ts`) now skips any module whose `module.json`
  title is prefixed with `PLACEHOLDER:` (the scaffolding marker). Placeholder modules no
  longer appear in the Home listings, the module count, or via a direct URL — only
  authored modules are visible.
- Data-driven and zero-touch: authoring a placeholder (replacing its title with a real
  one) publishes the module automatically, with no code change — consistent with the
  "drop a folder, no code changes" workflow.
- Currently surfaces the 12 authored modules and hides the 79 placeholder scaffolds.

## [1.10.0] - 2026-06-25

### Added - authored The Modern World global-conflicts module
- Replaced placeholder files in `src/content/the-modern-world/global-conflicts/israel-and-palestine/` with complete authored content generated from `raw.md`.
- Added a balanced `module.json` context map and framing that distinguishes historical facts, interpretations, and political claims.
- Wrote a 27-card `story.json` in chaptered progression from late Ottoman background to contemporary war and unresolved final-status issues.
- Rebuilt `timeline.json` with major milestones and aligned story `timeline` values to those milestone labels.
- Replaced `quiz.json` with understanding-focused questions across multiple-choice, true-false, ordering, and matching.
- Replaced `flashcards.json` with neutral key concept cards focused on causation, terminology, and unresolved issues.
- Updated `docs/content.md` to mark `Israel and Palestine` as `DONE`.

## [1.9.0] - 2026-06-25

### Added - The Modern World placeholder scaffolding
- Added a new category scaffold under `src/content/the-modern-world/` with subcategories:
  - `technology`
  - `global-conflicts`
  - `society`
  - `economy`
  - `environment`
  - `international-relations`
- Created 12 module folders with full placeholder file sets (`module.json`, `story.json`, `timeline.json`, `quiz.json`, `flashcards.json`) mirroring the existing project placeholder schema.
- Added/normalized `docs/content.md` rows for the new section to include explicit `Status` placeholders (`------`) so all rows match the tracker table format.

## [1.8.0] - 2026-06-25

### Added - authored Politics Foundations spectrum module
- Replaced placeholder files in `src/content/politics/foundations/left-vs-right-the-political-spectrum/` with complete authored content generated from `raw.md`.
- Added a foundations-first `module.json` context using a schematic map that combines the left-right axis with the authoritarian-libertarian axis.
- Wrote a 12-card `story.json` explaining the origin of left/right labels, modern policy differences, the limits of one-dimensional labeling, and practical policy-based evaluation.
- Rebuilt `timeline.json` with conceptual milestones and aligned all story-card `timeline` values to those milestones.
- Replaced `quiz.json` with understanding-focused questions across multiple-choice, true-false, ordering, and matching.
- Replaced `flashcards.json` with key concept recall cards for spectrum literacy and common misconceptions.
- Updated `docs/content.md` to mark the module as `DONE`.

## [1.7.0] - 2026-06-25

### Added - authored Politics Foundations module
- Replaced placeholder files in `src/content/politics/foundations/political-ideologies-explained/` with complete authored content generated from `raw.md`.
- Added a foundations-first `module.json` context using a schematic map of core ideology tensions (freedom, equality, tradition, state power, and national identity).
- Wrote a 12-card `story.json` focused on conceptual understanding of major ideologies (conservatism, liberalism, socialism, communism, fascism, anarchism, libertarianism, nationalism, populism, feminism, environmentalism) without turning the module into a historical deep dive.
- Rebuilt `timeline.json` as conceptual milestones and aligned all story-card `timeline` values to those milestones.
- Replaced `quiz.json` with understanding-focused questions using multiple-choice, true-false, ordering, and matching formats.
- Replaced `flashcards.json` with key concept recall cards for foundational retention.
- Updated `docs/content.md` to mark `Political Ideologies Explained` as `DONE`.

## [1.6.0] - 2026-06-25

### Added - Politics module scaffolding
- Added new placeholder module scaffolds under `src/content/politics/` to match the new rows in `docs/content.md`.
- Created two subcategories with full module folder structures and placeholder files (`module.json`, `story.json`, `timeline.json`, `quiz.json`, `flashcards.json`):
  - `foundations`: `political-ideologies-explained`, `left-vs-right-the-political-spectrum`, `democracy-and-dictatorship`, `constitutions-and-rule-of-law`, `states-and-governments`
  - `global-politics`: `geopolitics-why-geography-matters`, `the-united-nations-and-world-order`
- Updated `docs/content.md` table rows for Politics to include explicit `Status` values (`------`) so all rows match the tracker schema.

## [1.5.1] - 2026-06-25

### Changed - content tracker readability
- Reformatted `docs/content.md` for easier scanning by normalizing table spacing and adding a clear section title.
- Standardized the Markdown table separator row for cleaner rendering in editors and previews.

## [1.5.0] - 2026-06-25

### Added - Norway country-history modules (authored from source transcript)
- Replaced the Norway placeholder state by creating four complete modules under `src/content/country-history/norway/` authored from `raw.md`.
- Added full learning bundles for each Norway submodule, each with `module.json`, `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json`:
  - `origins-to-viking-age` (14000 BCE - 1066 CE)
  - `christianization-and-medieval-kingdom` (933 CE - 1319 CE)
  - `plague-union-and-danish-rule` (1319 CE - 1814 CE)
  - `modern-norway-independence-to-oil-age` (1814 CE - present)
- Structured content chronologically with clear cause-and-effect progression across environmental origins, Viking expansion, Christian state formation, plague-era decline, Danish subordination, constitutional nationalism, and modern welfare/oil governance.
- Added understanding-focused quiz sets (multiple-choice, true-false, ordering, matching) and retention-oriented flashcards for every submodule.
- Updated `docs/content.md` to mark all Norway submodules as `DONE`.

## [1.4.0] - 2026-06-25

### Added - Colonial Americas module (authored from source transcript)
- Replaced placeholder files in `src/content/history/atlantic-world/colonial-americas/` with full authored content generated from `raw.md`.
- Added a complete context map and module metadata in `module.json`, focused on Iberian origins, Atlantic routes, major colonial zones, and labor-system links.
- Wrote a 13-card `story.json` that covers: trade-route pressures after 1453, Columbus and early settlement, Tordesillas, Portugal in Brazil, Spanish conquests, French and English entry, indigenous experiences, and the shift toward Atlantic forced labor.
- Rebuilt `timeline.json` with major progression anchors (`1453`, `1492`, `1494`, `1500`, `1519-1533`, `1534-1565`, `1585-1600s`) and aligned story-card timeline labels to those values.
- Replaced `quiz.json` with understanding-focused questions across multiple-choice, true-false, ordering, and matching.
- Replaced `flashcards.json` with retention-focused cards on causes, turning points, imperial patterns, and consequences.
- Marked `Colonial Americas` as `DONE` in `docs/content.md`.

## [1.3.0] — 2026-06-25

### Added — full History module placeholder scaffolding
- Ensured every module listed in `docs/content.md` under `History` has a dedicated folder path at:
  `src/content/history/<subcategory-slug>/<module-slug>/`.
- Created scaffold files in each module folder to mirror the `transatlantic-slave-trade` file set (excluding `raw.md`):
  `module.json`, `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json`.
- Filled generated files with explicit placeholder content so AI/content workflows can clearly identify and replace placeholder data.
- Preserved existing authored modules and files by creating missing scaffold files without overwriting existing content.

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
