# Origin — Project Guide (CLAUDE.md)

Origin is a **mobile-first interactive learning app**. It is a *learning engine*, not a
textbook. Educational content lives as structured JSON, completely separate from the
application code. The app turns that structured content into a short-form, vertically
scrolling learning experience (context → story cards → timeline → recall → flashcards).

> The content is separate from the application. The app is a learning engine.

---

## When the user refers you to a .txt file containing content 
1. Refer to [`content-instructions.md`](docs\content-instructions.md)
2. Distribute the data to src\content\<category>\<subcategory>\<module>\<appropriate .json files>

## ⚠️ Required on every change (do this, always)

1. **Bump the version** in [`version.js`](version.js) (and keep `package.json` `version`
   in sync).
2. **Add an entry to [`changelog.md`](docs\changelog.md)** describing what changed.
3. **Architecture: [`architecture.md`](docs\architecture.md)** 
4. Content: Ensure the list in [`content.md`](docs\content.md) is updated with "DONE" in status-column once a complete entry to the module has been made.

### Versioning rules (Semantic-style: `MAJOR.MINOR.PATCH`, starts at `1.0.0`)

| Part      | Bump when…                                                            
|-----------|----------------
| **MAJOR** | A **big feature** / new app capability or a breaking change
| **MINOR** | **Content** is added or changed
| **PATCH** | **UX / UI** tweaks and fixes

Only bump the highest applicable part (a MAJOR bump resets MINOR/PATCH to 0, etc.).

---

## Commands

```bash
npm install      # install deps
npm run dev      # start dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run typecheck
```
---

The content registry ([`src/lib/content.ts`](src/lib/content.ts)) auto-discovers every
folder at build time with `import.meta.glob`. **To add a module, just drop a new folder
with these JSON files — no code changes are needed.** Then bump the **MINOR** version and
update the changelog.

Folder names are slugs (`rise-of-the-roman-empire`). Display titles come from the JSON
(`module.json.title`); category/subcategory display names are humanized from the slug
unless overridden in `src/lib/content.ts`.

### Data shapes
See [`src/types/content.ts`](src/types/content.ts) for the authoritative TypeScript types.
A short overview:

- **module.json** — `title`, `period`, `category`, `subcategory`, `summary`, and a
  `context` block (the intro map/overview). Context supports labeled `map.markers` and
  `map.connections` so the intro can answer *where / who / when / what*.
- **story.json** — array of cards: `{ id, timeline, title, content, next, visual? }`.
  One idea per card, ~10–30s to read, ending in a curiosity hook (`next`).
- **timeline.json** — array of `{ year, title }` milestones (only important ones).
- **quiz.json** — array of questions. Types: `multiple-choice`, `true-false`,
  `ordering`, `matching`.
- **flashcards.json** — array of `{ id, front, back }`.

All non-`module.json` files are optional; the UI adapts when a section is missing.

---

## App structure

```
src/
  main.tsx                 # entry
  App.tsx                  # router
  index.css                # Tailwind v4 + design tokens (@theme)
  version.js -> ../version.js (re-exported)
  types/content.ts         # content data model
  lib/
    content.ts             # content registry (import.meta.glob)
    progress.ts            # localStorage progress tracking
    text.ts                # slug humanize / helpers
  components/
    AppShell.tsx           # mobile phone-frame layout
    ui/                    # small reusable bits (Button, ProgressBar, …)
    home/                  # Home + module selection
    module/               # ModuleExperience + the 5 learning stages
      ContextIntro.tsx     # 1. context introduction
      ContextMap.tsx       # stylized map with highlighted regions
      StoryFeed.tsx        # 2. vertical story scroll
      Timeline.tsx         # 3. persistent timeline
      Quiz.tsx             # 4. recall
      Flashcards.tsx       # 5. review
```
