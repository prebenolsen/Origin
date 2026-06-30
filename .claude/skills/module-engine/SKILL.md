---
name: module-engine
description: Work safely on Origin's module learning engine - the content registry, the five-stage module experience (context intro -> story feed -> timeline -> quiz -> flashcards), the context map (geo/schematic), book insights, and per-module progress (src/lib/content.ts, src/lib/progress.ts, src/lib/geo.ts and src/components/module/**). Use when changing how modules are discovered/assembled, the stage flow, map rendering, quiz scoring, or progress persistence for history/science/politics/psychology/countries content. Documents the invariants that must not break.
---

# Module learning engine

This is the **non-language** half of Origin: the short-form, vertically scrolling
lesson built from authored JSON (context -> story -> timeline -> quiz -> flashcards,
plus optional book insights). The engine is a thin, content-driven runtime - **the
content is the product, the engine just renders it**. Most changes here are about not
breaking the auto-discovery contract or the map dispatch.

Before changing discovery, the map, or progress, read
[`references/invariants.md`](references/invariants.md) - these rules are easy to break
silently and there are no unit tests guarding them. For the stage-by-stage flow and the
map authoring/rendering split, see [`references/stages.md`](references/stages.md).

> Authoring the JSON itself? That's the **`module-content`** skill, not this one.

## Module map

| File | Responsibility |
|------|----------------|
| `src/lib/content.ts` | **The registry.** Auto-discovers every module with `import.meta.glob`, assembles `ModuleBundle`s, hides `PLACEHOLDER` modules, powers search + Home grouping. Read-only at runtime. |
| `src/lib/progress.ts` | Per-module progress in localStorage (`origin:progress:v1`): stages completed + best quiz score. Dispatches `origin:progress`. |
| `src/lib/useProgress.ts` | Reactive hook over the `origin:progress` event. |
| `src/lib/geo.ts` | Land geometry (Natural Earth 110m) + Mercator projection fitted to markers. Used by `GeoMap`. |
| `src/lib/text.ts` | `humanize` (slug -> display name) for category/subcategory/book titles. |
| `src/types/content.ts` | **Authoritative data model** for every content JSON file. |
| `src/components/module/ModuleExperience.tsx` | Loads a bundle by URL params, provides the `useModule` context (bundle + `go`/`exit`). The stage components render under it via the router. |
| `src/components/module/ContextIntro.tsx` | Stage 1: the context overview + map/image. |
| `src/components/module/ContextMap.tsx` | **Dispatcher** -> `GeoMap` (lazy) or `SchematicMap`, chosen from marker data. Shares `mapParts.tsx` / `mapLayout.ts` / `MapViewport.tsx`. |
| `src/components/module/StoryFeed.tsx` + `StoryCard.tsx` + `StoryVisual.tsx` | Stage 2: vertical story scroll with the persistent timeline. |
| `src/components/module/Timeline.tsx` | Stage 3: the always-visible milestone rail. |
| `src/components/module/QuizStage.tsx` + `Quiz.tsx` | Stage 4: recall; scores via `recordQuiz`. |
| `src/components/module/FlashcardStage.tsx` | Stage 5: review. |
| `src/components/module/BookStage.tsx` | Optional book-insight cards (`book-*.json`). |

## The invariants (do not break)

1. **A module is identified by its `category/subcategory/module` path.** That path is
   derived purely from the folder layout in `parseKey` (everything after `/content/`,
   first three segments). Every registry lookup, progress key, and URL uses it. Don't
   introduce a second identity scheme or read titles to identify modules.
2. **Discovery is folder-driven and zero-config.** Dropping a folder with the right JSON
   files publishes a module - no code change. Keep the `import.meta.glob` patterns
   (`../content/**/module.json`, `story.json`, `timeline.json`, `quiz.json`,
   `flashcards.json`, `book-*.json`) and the "needs >= 4 path segments" guard intact. If
   you add a new per-module file type, add its glob the same way.
3. **`PLACEHOLDER:`-titled modules are hidden, everywhere.** `isPlaceholder` (title
   starts with `PLACEHOLDER`, case-insensitive) excludes a module from the registry, so
   it never appears in listings, counts, search, or via a direct URL. Authoring (giving
   it a real title) publishes it. Keep this gate - it's how unfinished scaffolds ship
   safely.
4. **All non-`module.json` files are optional; the UI adapts.** A bundle always has
   `story`/`timeline`/`quiz`/`flashcards`/`books` arrays (defaulting to `[]`). Stage
   components must tolerate empty sections, not assume they exist.
5. **The map mode is chosen from the data, never a flag.** `ContextMap` renders a real
   `GeoMap` **iff every marker has both `lat` and `lng`**; otherwise a `SchematicMap`
   from `x`/`y`. Don't add a mode switch or render a world map behind a non-geographic
   marker set. See [`references/stages.md`](references/stages.md).
6. **`GeoMap` stays lazy-loaded.** It pulls in `d3-geo` + the land atlas; schematic-only
   modules must not pay for it. Keep the dynamic import in `ContextMap`.
7. **Fit projections to corner points, never a polygon.** In `geo.ts`, fit to a
   `MultiPoint` of the bounding-box corners. A wrongly-wound spherical `Polygon` makes
   d3-geo treat the interior as the whole planet and zooms all the way out.
8. **Keep the map box at 8:5.** The container aspect must match the SVG `viewBox` so the
   HTML labels line up with the SVG markers. Fullscreen enlarges the 8:5 box, never
   stretches it.
9. **Progress is minimal and append-only by stage.** `markStage`/`recordQuiz` only ever
   add stages and raise the best score (`Math.max`); they never downgrade. Every write
   dispatches `origin:progress` so `useProgress`/Home refresh. `period` is **history-only**
   in the data model - don't make the engine depend on it for non-history categories.

## Where to optimize (and the traps)

- The registry is built **once** at module load (`const REGISTRY = buildBundles()`) and
  reused. Keep it that way - don't rebuild per render or per route. `getCategoryGroups`
  re-derives grouping on each call; if a hot screen calls it repeatedly, memoize the
  result, not the registry.
- Module routes are lazy in `App.tsx`. Don't import `content.ts` eagerly from the Home
  bundle's hot path beyond what the registry already needs.
- Label de-collision (`mapLayout.ts`) runs per map render; it's fine for ~3-6 markers.
  Don't feed it large marker sets - that's an authoring problem, fix the content.
- `humanize` is called for display names; category overrides live in `CATEGORY_DISPLAY`
  in `content.ts`. Add a pretty name there rather than special-casing in components.

## Before you finish

- `npm run typecheck` (and `npm run build`).
- If you touched content shapes or discovery, run the content validator so authored
  modules still parse: `node .claude/skills/module-content/scripts/validate-content.mjs`.
- Spot-check in the dev server: a geo module (real coastlines), a schematic module
  (concept diagram, no continents), and a module missing a stage (UI adapts).
- Repo rule (always): bump `version.js` + `package.json` and add a `docs/changelog.md`
  entry. An engine/behaviour change is usually **PATCH** (UX/UI) unless it's a new app
  capability (**MAJOR**); pure content is **MINOR** and belongs to `module-content`.
