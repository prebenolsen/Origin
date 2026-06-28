## Content architecture (how to add a module)

Content is organized strictly as **Category → Subcategory → Module**, one nested folder
each, under `src/content/`:

```
src/content/
  <category>/
    <subcategory>/
      <module>/
        module.json       # required — metadata + context intro
        story.json        # story feed cards
        book-*.json       # optional book-attached card walkthrough(s)
        timeline.json     # milestones for the persistent timeline
        quiz.json         # recall questions
        flashcards.json   # review cards
        raw.md           # raw, user-generated data to build module upon
```

      `module.json` note: `period` is reserved for `history` modules only. Modules in
      other categories should omit `period` and rely on `context.when` if they need a
      lightweight time cue.

## Tech stack

- **React 19 + TypeScript**
- **Vite** (dev server + build)
- **Tailwind CSS v4** (CSS-first config via `@theme` in `src/index.css`)
- **React Router v7** (routing between home / module stages)
- Data: **static JSON** under `src/content/` (no backend)
- **Maps:** `d3-geo` + `topojson-client` + `world-atlas` (Natural Earth land,
  now using 50m geometry for higher zoom fidelity, bundled for offline use)
  render real coastlines for the context map. See the
  **Maps** section in `CLAUDE.md` for the data schema and authoring rules.

No animation library — motion is done with CSS (scroll-snap, 3D flip, fade-in).

## Context map (geo vs. schematic)

The intro map (`src/components/module/ContextMap.tsx`) is a dispatcher:

- Markers with real `lat`/`lng` → **`GeoMap`** (actual coastlines via `d3-geo`,
  auto-framed; lazy-loaded so concept maps don't pull in the geo bundle).
- Markers with only `x`/`y` → **`SchematicMap`** (an honest node-and-link concept
  diagram — used for non-geographic topics and legacy/placeholder data).

Shared markers/arcs/labels live in `mapParts.tsx`; projection + land geometry in
`src/lib/geo.ts`. Both modes are wrapped by `MapViewport.tsx`, which provides
pinch/drag/wheel zoom-and-pan and a fullscreen toggle (inline and fullscreen
alike). Geo maps frame tightly to their markers so they fill the canvas.

## Geography Challenge (interactive map game)

A second, content-free **type** of interactive learning that lives alongside the
five module stages. Routes `/geo` (board picker) and `/geo/:board` (the game) are
**lazy-loaded**, so the country topology + d3-geo only load when entered.

```
src/lib/
  geography.ts      # boards (continents + seas), curated country lists with answer
                    # aliases, answer scoring (normalized Levenshtein, ≥80% accept),
                    # and nearest-neighbour multiple-choice generation
                    # country dataset aligned to all 193 UN member states;
                    # exports SMALL_COUNTRY_IDS for tap-assist prioritization
  countryShapes.ts  # decodes world-atlas countries-110m → per-country polygons +
                    # cached centroids (only imported by the quiz map)
  geoProgress.ts    # per-board solved-set persistence in localStorage
src/components/geo/
  GeographyHome.tsx # board picker
  GeographyGame.tsx # game state (selection, solved set, hints, options)
  GeoQuizMap.tsx    # themed map: continent polygons OR sea markers; tap hit-testing
                    # solved country labels render inside the SVG country shape,
                    # with per-shape font fitting and optional tilt for long,
                    # narrow countries such as Norway
                    # (browser-safe fallback avoids hard clip-path dependence to
                    # prevent hidden labels on some GPU/browser combinations).
                    # Label anchoring prefers the dominant polygon and solves for
                    # a deep interior point to avoid border overlap and remote
                    # island placement (e.g., mainland Norway over Svalbard).
                    # Includes a bottom-left small-country assist button in the
                    # non-transformed overlay layer (always visible while zooming)
                    # that cycles to the next unsolved target: small-country
                    # list first, then remaining unsolved countries.
  AnswerPanel.tsx   # type-the-name input + hints (inline and fullscreen-overlay)
```

How a tap becomes a selection: `GeoQuizMap` reuses `MapViewport`, which now reports
clean taps via an `onTap(u, v)` callback (content-normalized coordinates that are
invariant to pan/zoom). The game converts that to lng/lat through the same
projection and uses `d3.geoContains` (countries) or nearest-marker (seas) to find
the clicked region. `MapViewport` also gained a `renderOverlay(fullscreen)` prop so
the answer bar can float over the map while fullscreen. Both props are optional and
backward-compatible — the context maps are unchanged.

## Module completion workflow note

When a placeholder module is fully authored from raw.md into module.json, story.json,
timeline.json, quiz.json, and flashcards.json, update docs/content.md and set that
module row status to DONE.

## Latest completion note

- 2026-06-25: Completed `psychology/communication/communicate-with-confidence`
  from `raw.md` into all five content JSON files and set tracker status to DONE.
- 2026-06-25: Completed `psychology/communication/dealing-with-difficult-people`
  from `raw.md` into all five content JSON files and set tracker status to DONE.
- 2026-06-25: Completed `psychology/communication/becoming-a-better-conversationalist`
  from `raw.md` into all five content JSON files and set tracker status to DONE.
- 2026-06-25: Completed `psychology/learning/memory-and-learning`
  from `raw.md` into all five content JSON files and set tracker status to DONE.
- 2026-06-25: Completed `politics/global-politics/geopolitics-why-geography-matters`
  from `raw.md` into all five content JSON files and set tracker status to DONE.
- 2026-06-26: Created new **Technology → Data Engineering** category and authored eight
  Databricks modules from `docs/databricks-research.md` into all five content JSON files each,
  set tracker status to DONE: `the-data-problem`, `why-traditional-databases-struggled`,
  `the-rise-of-big-data`, `apache-spark-appears`, `databricks-makes-spark-easier`,
  `the-lakehouse-idea`, `delta-lake-solves-reliability-problems`,
  `how-companies-use-databricks-today`.
- 2026-06-26: **Map revamp (v2.0.0).** Replaced the hardcoded ellipse-"continent" map
  with real cartography (`d3-geo` + `world-atlas`) for modules with `lat`/`lng`, and an
  honest schematic concept diagram for everything else. Migrated the authored geographic
  modules (Roman rise, Atlantic-world ×3, A Nation Divided, Israel/Palestine, Norway ×4)
  to real coordinates. See the Maps section in `CLAUDE.md`.
- 2026-06-26: **Interactive maps (v3.0.0).** Added `MapViewport.tsx` — pinch/drag/wheel
  zoom-and-pan + fullscreen (with leave button) for every map, inline and fullscreen.
  Tightened default geo framing so markers fill the canvas instead of clustering centre.
- 2026-06-27: Completed `science/universe/stars-galaxies-and-black-holes`
  from `raw.md` into all five content JSON files and set tracker status to DONE.
- 2026-06-27: Completed `science/earth/how-earth-formed-and-changed`
  from `raw.md` into all five content JSON files and set tracker status to DONE.
- 2026-06-27: Completed `science/life/the-origin-of-life`
  from `raw.md` into all five content JSON files and set tracker status to DONE.
- 2026-06-28: Added module-attached `book-*.json` support in the content registry.
  Categories now expose book counts in Home cards, modules show a `📖` indicator when
  a book exists, and the module intro can open a dedicated `book` stage before the
  normal story/quiz/flashcard flow.
- 2026-06-28: Removed the `When` row from `ContextIntro` so module starts only show
  headline/description and content stats before learners begin.
- 2026-06-28: Simplified `ModuleCard` metadata line by removing subcategory labels;
  cards now show only `period` text (when present).
- 2026-06-28: Hardened story-to-timeline mapping in `StoryFeed` by matching card
  timeline labels against milestone `year` and `title` (normalized), with an
  index-based spread fallback when no explicit matches are found.
- 2026-06-28: Normalized all `src/**/*.json` files to UTF-8 without BOM and added
  strict JSON encoding/punctuation guidance in `CLAUDE.md` (including safe handling
  of `æ`, `ø`, `å`).
- 2026-06-28: Rebuilt Norway under `countries/norway` into a Countries-style
  module set: `norway-overview`, `norway-history`, `norway-politics`,
  `norway-society`, `norway-economy`, plus a hidden placeholder scaffold for
  `norway-geography-interactive`.