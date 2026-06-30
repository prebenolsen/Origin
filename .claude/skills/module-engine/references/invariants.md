# Engine invariants (the long version)

These encode the product rules of the module experience. Each lists *what* must hold and
*why*, so a refactor preserves the behaviour even if the implementation changes.
Authoritative shapes: [`src/types/content.ts`](../../../../src/types/content.ts).

## Identity & discovery (`src/lib/content.ts`)

- A module's identity is its **path** `category/subcategory/module`, derived in
  `parseKey` as the first three segments after `/content/`. Files with fewer than four
  segments (`cat/sub/mod/file.json`) are ignored.
- `buildBundles` runs **once** at module-load and is cached in `REGISTRY`. `getModule`,
  `allModules`, `searchModules`, `getCategoryGroups`, `getCategory`, `moduleCount` all
  read that single map. Don't rebuild it per call/render.
- Each content file type is collected by its own `import.meta.glob` (eager, default
  export) and indexed by path: `module.json` (required), `story.json`, `timeline.json`,
  `quiz.json`, `flashcards.json`, and `book-*.json` (one or more per module). A bundle
  always exposes the optional arrays as `[]` when a file is absent.
- **`isPlaceholder`** hides any module whose `meta.title` (trim-start, upper-case) begins
  with `PLACEHOLDER`. Hidden = not in the registry at all: no listing, no count, no
  search hit, no direct-URL access. This is the publish switch - replacing the title
  publishes the module with no code change.
- `CATEGORY_DISPLAY` overrides the humanized category slug for display; subcategory and
  book names always come from `humanize`. Titles come from the JSON, never the folder.
- **Invariant:** discovery stays zero-config and folder-driven. Adding a module is a
  filesystem operation. If you add a new per-module file, add a glob + index map the same
  way; don't centralize a manifest.

## Search (`searchModules`)

- Empty query returns `[]`. Otherwise every whitespace term must appear in the haystack
  (title + summary + categoryName + subcategoryName + period). Ranking: title `startsWith`
  (+100) > title `includes` (+40) > per-term title hits (+10), then alphabetical.
- **Invariant:** placeholder modules never surface (they aren't in `REGISTRY`).

## Map dispatch (`ContextMap.tsx` -> `GeoMap` / `SchematicMap`)

- Mode is **derived, not declared**: a `GeoMap` renders **iff every marker has both
  `lat` and `lng`**. Any marker missing a coordinate -> `SchematicMap` from `x`/`y`
  (percent of box, 0-100).
- `GeoMap` is **lazy** (`React.lazy` / dynamic import) because it pulls `d3-geo` + the
  land atlas (~55 KB). Schematic-only modules must not load it.
- Both modes share `mapParts.tsx` (dots/arcs/labels/leaders), de-collide labels with
  `mapLayout.ts`, and are wrapped by `MapViewport.tsx` (zoom/pan/fullscreen).
- **Invariant:** never render a world map behind a non-geographic topic, and never add a
  manual mode flag - the data decides.

## Geo projection (`src/lib/geo.ts`)

- Land = `world-atlas` Natural Earth **110m**, decoded once and Mercator-projected,
  fitted to the markers (`fitProjection`).
- **Fit to corner points (`MultiPoint`), never a `Polygon`.** A wrongly-wound spherical
  polygon makes d3-geo treat the interior as the whole globe and zooms all the way out.
- Frame **tightly** to markers; don't re-introduce large padding. `map.focus`
  (`[west, south, east, north]`) overrides the auto-frame when a wider view is needed.
- **Invariant:** the map container is **8:5**, matching the SVG `viewBox`, so HTML labels
  stay aligned with SVG markers. Fullscreen enlarges that box, never stretches it.

## Stage flow (`ModuleExperience.tsx` + stage components)

- `ModuleExperience` resolves the bundle from URL params via `getModule`; an unknown path
  renders a "Module not found" panel (no throw). It provides `useModule()` context:
  `{ bundle, base, go, exit }`. Stage components are rendered by the router as children.
- Stages: **context intro -> story feed (with persistent timeline) -> quiz -> flashcards**,
  plus an optional **book** stage when `book-*.json` exist.
- **Invariant:** every stage tolerates a **missing/empty** section. Don't assume `story`,
  `quiz`, etc. are non-empty - they default to `[]`.

## Progress (`src/lib/progress.ts`)

- Store: `origin:progress:v1` -> `{ [path]: { stages: Stage[], quizScore?, updated } }`.
  `Stage = 'intro' | 'story' | 'quiz' | 'flashcards'`.
- `markStage` only **adds** a stage; `recordQuiz` raises the best score with `Math.max`
  and marks `quiz`. Neither ever removes a stage or lowers a score.
- Every write dispatches the `origin:progress` window event; `useProgress` and Home listen.
  Reads tolerate missing/corrupt localStorage (`try/catch -> {}`); writes swallow quota
  errors.
- **Invariant:** progress is intentionally minimal (Origin avoids dashboard-style stats);
  it's append-only by stage and best-score. Don't add downgrades or per-card tracking
  without a deliberate product decision.

## Data-model rule that bites

- **`period` is history-only.** Only `src/content/history/**/module.json` should carry
  `period`. Non-history modules omit it and use `context.when` for a time cue. The engine
  must not require `period` for non-history categories.
