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
5. The readme.md [`readme.md`](docs\readme.md) should be kept up to date, in the first sections, if the user-experience changes

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

## Backend (Supabase) — optional, offline-first

Origin is **guest-first and offline-first**. All learner state lives in `localStorage`
and the app is fully usable with **no account and no backend** — never lock content behind
login. Supabase is an *optional* sync layer that only activates when the env vars are set
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; copy `.env.example` -> `.env`). When absent,
`src/lib/supabase/client.ts` exports `supabase = null` and the app makes no network calls.

- **localStorage stays the source of truth.** The stores (`lib/progress.ts`,
  `lib/geoProgress.ts`, `lib/language/srs.ts`, `lib/language/profile.ts`) each dispatch a
  change event on write (`origin:progress`, `origin:geo`, `origin:lang`). The sync engine
  `src/lib/sync/syncManager.ts` listens and — only when signed in + online — debounces an
  idempotent upsert to Supabase; on sign-in it pulls, **union-merges** with local (so guest
  progress is never lost), writes back, and pushes. Auth lives in `src/lib/auth.tsx`
  (`useAuth`), UI in `src/components/auth/**`, and the SQL in `supabase/migrations/**`.
- **Table rule:** every table is prefixed `origin_` and has owner-only Row Level Security
  (`user_id = auth.uid()`). Language tables are per-language (`origin_language_spanish_*`).
- **When you add a new persisted store:** (1) add an `origin_`-prefixed table + RLS as a new
  numbered migration in `supabase/migrations/`; (2) add a mapper + merge in `src/lib/sync/`
  and register it in `syncManager.ts`; (3) make the store `write()` dispatch a change event.
  This is a **MAJOR/feature-level** change — bump accordingly and update `docs/architecture.md`.

See `supabase/README.md` (setup) and `docs/architecture.md` (design) for details.

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

- **module.json** — `title`, `category`, `subcategory`, `summary`, and a `context`
  block (the intro map/overview). `period` is **history-only**: only modules under
  `src/content/history/**/module.json` should include `period`. Non-history
  categories should omit `period` and use `context.when` when a time cue helps.
  Context supports labeled `map.markers` and `map.connections` so the intro can
  answer *where / who / when / what*.
- **story.json** — array of cards: `{ id, timeline, title, content, next, visual? }`.
  One idea per card, ~10–30s to read, ending in a curiosity hook (`next`).
- **timeline.json** — array of `{ year, title }` milestones (only important ones).
- **quiz.json** — array of questions. Types: `multiple-choice`, `true-false`,
  `ordering`, `matching`.
- **flashcards.json** — array of `{ id, front, back }`.

All non-`module.json` files are optional; the UI adapts when a section is missing.

### JSON encoding and character rules (strict)

All JSON content files under `src/content/**` must follow these rules:

- Encoding must be **UTF-8 without BOM**.
- Files must be valid JSON (no trailing commas, comments, or non-JSON wrappers).
- Norwegian letters (`æ`, `ø`, `å`, and uppercase variants) are allowed and should be
  stored directly as UTF-8 characters, not lossy replacements.
- Prefer plain ASCII punctuation for generated text in JSON, especially hyphen-minus
  (`-`) instead of typographic dashes (`—` / `–`) unless there is a clear editorial
  reason.

When adding or editing content, preserve these rules to avoid parser/encoding
regressions across environments.

---

## Maps (context map authoring & integration)

The context-intro map answers *where / who / what* at a glance. There are **two
modes**, picked **automatically** from the marker data — you choose the mode by
how you write the markers, not with a flag.

| Mode | When it renders | Looks like |
|------|-----------------|-----------|
| **`geo`** | **Every** marker has real `lat` **and** `lng` | Real coastlines (Natural Earth), Mercator-projected and auto-framed to the markers |
| **`schematic`** | Any marker is missing coordinates | An honest node-and-link concept diagram on a dotted field — **never** fake continents |

> Rule of thumb: **geographic topic → give real coordinates. Conceptual topic
> (psychology, abstract politics, technology) → use `x`/`y` and let it be a
> schematic.** Do **not** put a world map behind a non-geographic lesson.

### Authoring a real (`geo`) map

Give **every** marker `lat`/`lng` in decimal degrees (North/East positive,
South/West negative). The map frames itself around the markers automatically.

```jsonc
"map": {
  "markers": [
    { "id": "rome",     "label": "Rome",        "lat": 41.9,  "lng": 12.5,  "role": "primary" },
    { "id": "carthage", "label": "Carthage",    "lat": 36.85, "lng": 10.32, "role": "secondary" },
    { "id": "greece",   "label": "Greek world", "lat": 38.0,  "lng": 23.7,  "role": "secondary" }
  ],
  "connections": [
    { "from": "rome", "to": "carthage", "label": "Punic Wars" }
  ],
  // OPTIONAL: override the auto-frame with [west, south, east, north] in degrees.
  "focus": [-10, 30, 40, 48]
}
```

- `role: "primary"` markers are emphasized (amber + pulse); `"secondary"` are muted.
- `connections` reference marker `id`s and draw a labeled arc between them.
- Omit `focus` unless the auto-frame is wrong — it usually isn't.

### Authoring a schematic (concept) map

Omit `lat`/`lng`. Position each marker with `x`/`y` as **percentages of the box
(0–100)**. It renders as a relationship diagram, not a map.

```jsonc
"map": {
  "markers": [
    { "id": "heartland", "label": "Eurasian Heartland", "x": 50, "y": 38, "role": "primary" },
    { "id": "rimland",   "label": "Rimland Arc",        "x": 62, "y": 52, "role": "primary" }
  ],
  "connections": [ { "from": "heartland", "to": "rimland", "label": "containment" } ]
}
```

### Density & labels

Labels are auto-placed by a de-collision pass (`mapLayout.ts`): each label takes
its natural spot (a pill above its dot; a connection label on its arc) unless
that's taken, in which case it's moved to the nearest free spot and a subtle
leader line is drawn back to the marker/arc. So **labels never overlap** — but
heavy clusters still produce many leader lines, which gets busy. To keep maps
clean:

- Keep markers to **~3–6** and prefer **short** labels (“Greek world”, not a
  sentence). Long labels are placed farther out (longer leaders).
- Even though overlaps are handled, **very tightly clustered markers** (e.g.
  Jerusalem + West Bank, ~20 km apart) still read as a knot of leader lines —
  drop the secondary ones or widen the topic's scope when you can.

### Interaction (zoom / pan / fullscreen)

Every map is wrapped in **`MapViewport.tsx`**, which adds pinch-to-zoom,
drag-to-pan (finger or mouse), wheel zoom, double-tap zoom, and a **fullscreen**
toggle with a leave button. You get this for free — `GeoMap` and `SchematicMap`
just render their `<svg>` + labels as `MapViewport`'s children; the whole content
layer is moved with one CSS transform so the SVG and HTML labels stay aligned.
The default (un-zoomed) view is the fitted baseline; zoom is clamped to that
baseline and pan is clamped so the map can't leave the frame.

### Framing

Geo maps frame **tightly to the markers** (`lib/geo.ts → fitProjection`) so the
markers spread out and fill most of the canvas — *don't* re-introduce large
padding. If a specific map needs a wider view, set `map.focus`.

### How it works (for code changes)

- `ContextMap.tsx` is a **dispatcher**: it checks the markers and renders either
  `GeoMap` or `SchematicMap`. Both share `mapParts.tsx` (arcs, marker dots,
  labels, leaders), de-collide their labels with `mapLayout.ts`, and are wrapped
  by `MapViewport.tsx`, so the two modes look and feel like one family.
- Real geometry: `lib/geo.ts` decodes `world-atlas` land (Natural Earth **110m**,
  ~55 KB, bundled → works offline) and builds a Mercator projection fitted to the
  markers. To use finer coastlines, swap the import to `land-50m.json`.
- `GeoMap` is **lazy-loaded** (it pulls in `d3-geo` + the land data), so
  schematic-only modules don't pay for it.
- ⚠️ When fitting a projection to a bounding box, fit to the **corner points
  (a `MultiPoint`)**, never a `Polygon` — a wrongly-wound spherical polygon makes
  d3-geo treat the *interior as the whole planet* and zooms all the way out.
- ⚠️ Keep the map container at the **8:5 aspect** (it matches the SVG `viewBox`)
  so the HTML labels line up with the SVG markers. Fullscreen enlarges that 8:5
  box rather than stretching it.

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
    geo.ts                 # land geometry + fitted projection (d3-geo)
  components/
    AppShell.tsx           # mobile phone-frame layout
    ui/                    # small reusable bits (Button, ProgressBar, …)
    home/                  # Home + module selection
    module/               # ModuleExperience + the 5 learning stages
      ContextIntro.tsx     # 1. context introduction
      ContextMap.tsx       # map dispatcher → GeoMap or SchematicMap
      GeoMap.tsx           #   real cartographic map (lazy-loaded)
      SchematicMap.tsx     #   abstract concept diagram (non-geographic)
      MapViewport.tsx      #   shared zoom / pan / fullscreen frame
      mapParts.tsx         #   shared markers / arcs / labels / leaders
      mapLayout.ts         #   label de-collision (placement + leader lines)
      StoryFeed.tsx        # 2. vertical story scroll
      Timeline.tsx         # 3. persistent timeline
      Quiz.tsx             # 4. recall
      Flashcards.tsx       # 5. review
```
