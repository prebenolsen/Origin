# Optimization notes

Concrete, low-risk places to optimize the language engine, and the constraints that keep
behaviour intact. Profile first - the data set is small (hundreds of words), so most of this
only matters at scale.

## localStorage read amplification

`srs.read()` `JSON.parse`s the whole store on every exported call. Screens like
`ReviewDashboard` and `LessonExperience` call `getAll` several times per render, and
`orderAdaptive` + `buildQuiz` iterate it again.

Safe optimization: keep an in-memory parsed cache per `langSlug`, invalidated when:
- this tab writes (clear in `write()` before dispatching), and
- the `origin:lang` event fires (covers other tabs / hooks).

Constraints:
- localStorage stays the **source of truth**; the cache is a read-through copy.
- `write()` must still dispatch `origin:lang` (the reactive hooks depend on it).
- Don't hand out the cached object by reference where callers mutate it - return copies or
  freeze it.

## Reduce redundant `getAll` in components

Prefer computing `getAll(LANG)` once per render and passing the array down, instead of
calling it inside loops/maps. `ReviewSession`/`LessonExperience` already build a `stateMap`
once - mirror that pattern.

## Question generation

- `buildQuiz` is O(targets × pool) for distractor scoring. Fine for a lesson; for a
  "review all" over hundreds of words it is still cheap, but cap session size (`MAX`) rather
  than generating everything.
- `spellingSimilarity` is a cheap prefix/length heuristic - keep it cheap; don't swap in a
  full edit-distance in the render path without measuring.

## Bundle / loading

- All `/learn/spanish/**` routes are lazy-loaded in `App.tsx`. Keep `content.ts` and the
  language components out of the Home/critical bundle.
- `content.ts` uses eager `import.meta.glob`; content JSON is small. If it ever grows large,
  switch the heavy files to lazy glob (`{ eager: false }`) and load per scenario.

## Determinism

- `seededShuffle` must stay pure/deterministic for a seed so React re-renders are stable and
  option order doesn't flicker. Per-session variety comes from choosing a new seed at session
  start, not from `Math.random` inside render.
