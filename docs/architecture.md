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