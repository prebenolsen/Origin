# Stage flow & the context map

How the five stages render, and the geo/schematic map split. For the hard rules see
[`invariants.md`](invariants.md); for authoring the JSON see the `module-content` skill.

## The five stages (+ books)

A `ModuleBundle` carries everything for one module. The stages consume it in order:

1. **Context intro** (`ContextIntro.tsx`) - `meta.context`: a headline + short
   `description` + a map (`type: 'map' | 'schematic'`) or an `image` (`type: 'image'`).
   Answers *where / who / when / what* before the story starts. `context.when` shows a
   time cue; for history, `meta.period` also displays.
2. **Story feed** (`StoryFeed.tsx`, `StoryCard.tsx`, `StoryVisual.tsx`) - the vertical
   scroll of `story[]` cards. Each card's `timeline` drives the **persistent
   `Timeline.tsx` rail** so the learner keeps their place. `card.visual` selects an
   illustration (`StoryVisual`); `"map"` reuses the context map.
3. **Timeline** (`Timeline.tsx`) - `timeline[]` milestones (`{ year, title }`). It's a
   companion to the story, not a separate quiz of dates.
4. **Quiz** (`QuizStage.tsx` -> `Quiz.tsx`) - `quiz[]`, one of four question types
   (multiple-choice / true-false / ordering / matching). On finish it calls
   `recordQuiz(path, correct, total)`.
5. **Flashcards** (`FlashcardStage.tsx`) - `flashcards[]` `{ front, back }` review.

**Books** (`BookStage.tsx`) - optional `book-*.json` insight decks attached to a module.
Each file becomes a `ModuleBook` (`humanize`d title from the `book-<slug>` filename) of
`BookCard`s. A module with no `book-*.json` simply has no book stage.

Every section is optional; the bundle defaults each to `[]` and the UI hides what's empty.

## The context map: geo vs schematic

`ContextMap.tsx` is a **dispatcher**. It inspects the markers and renders one of two
modes - **you pick the mode by how you write the markers, not with a flag**:

| Mode | Renders when | Looks like |
|------|--------------|-----------|
| **`geo`** | **Every** marker has both `lat` **and** `lng` | Real coastlines (Natural Earth 110m), Mercator-projected, auto-framed to the markers |
| **`schematic`** | Any marker lacks coordinates (uses `x`/`y`) | A node-and-link concept diagram on a dotted field - **never** fake continents |

Rule of thumb: **geographic topic -> real `lat`/`lng`. Conceptual topic (psychology,
abstract politics, ideas, technology) -> `x`/`y` percentages, let it be schematic.** Do
not put a world map behind a non-geographic lesson.

### Shared rendering pieces

- `mapParts.tsx` - marker dots (primary = emphasized/pulse, secondary = muted), arcs for
  `connections`, label pills, leader lines.
- `mapLayout.ts` - label **de-collision**: each label takes its natural spot unless taken,
  then moves to the nearest free spot with a leader line back. Labels never overlap, but
  dense clusters produce many leaders -> keep to ~3-6 short-labelled markers.
- `MapViewport.tsx` - wraps both modes with pinch/drag/wheel/double-tap zoom + a
  fullscreen toggle. The whole content layer moves with one CSS transform so SVG markers
  and HTML labels stay aligned. Default view is the fitted baseline; zoom clamps to it and
  pan clamps inside the frame.

### Code-change cautions

- Keep `GeoMap` **lazy-loaded** (`d3-geo` + land atlas). Schematic-only modules shouldn't
  pay for it.
- Keep the map container at **8:5** to match the SVG `viewBox` (label alignment).
- When fitting a projection, fit to **corner points (`MultiPoint`)**, never a `Polygon`
  (see `invariants.md` - a mis-wound polygon zooms out to the whole planet).

## Verifying stage/map changes in the dev server

The Vite dev server serves the TS modules, so you can drive the registry from the preview
console (or `preview_eval`) without clicking through:

```js
const c = await import('/src/lib/content.ts');
c.moduleCount();                                  // published modules (placeholders excluded)
c.getModule('history', 'the-roman-empire', 'rise-of-the-roman-empire');  // a full bundle
c.searchModules('rome').map(b => b.path);         // ranked search
```

Then open one geo module (real coastlines), one schematic module (concept diagram, no
continents), and a sparse module (a missing stage should just not render). Finish with
`npm run typecheck && npm run build`.
