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
        timeline.json     # milestones for the persistent timeline
        quiz.json         # recall questions
        flashcards.json   # review cards
        raw.md           # raw, user-generated data to build module upon
```

## Tech stack

- **React 19 + TypeScript**
- **Vite** (dev server + build)
- **Tailwind CSS v4** (CSS-first config via `@theme` in `src/index.css`)
- **React Router v7** (routing between home / module stages)
- Data: **static JSON** under `src/content/` (no backend)

No animation library — motion is done with CSS (scroll-snap, 3D flip, fade-in).

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