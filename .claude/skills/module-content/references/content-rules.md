# Module content rules (reference)

Distilled from `CLAUDE.md`, `docs/content-instructions.md`, `docs/book-instructions.md`,
and `docs/architecture.md`. Authoritative shapes live in
[`src/types/content.ts`](../../../../src/types/content.ts).

## File shapes (quick reference)

### module.json  (REQUIRED)
```jsonc
{
  "title": "Rise of the Roman Empire",     // real title; "PLACEHOLDER: ..." hides the module
  "period": "509 BCE - 27 BCE",            // HISTORY ONLY - omit for other categories
  "category": "history",                   // informational; folder is the source of truth
  "subcategory": "the-roman-empire",
  "summary": "One-sentence hook shown on the card and intro.",
  "accent": "#d98a5a",                     // optional theme accent (hex)
  "context": {
    "type": "map",                         // "map" | "schematic" | "image"
    "headline": "A city that swallowed a sea",
    "description": "Short why-this-matters paragraph (2-3 sentences).",
    "when": "509 BCE - 27 BCE",            // time cue (use this when there's no period)
    "map": { /* see below */ }             // for "map"/"schematic"; use "image" for an image
  }
}
```

### context.map - geographic (renders a real map)
Give **every** marker real `lat`/`lng` (decimal degrees, N/E positive). The map frames
itself to the markers.
```jsonc
"map": {
  "backdrop": "region",                    // "world" | "region" (cosmetic)
  "markers": [
    { "id": "rome",     "label": "Rome",        "lat": 41.9,  "lng": 12.5,  "role": "primary" },
    { "id": "carthage", "label": "Carthage",    "lat": 36.85, "lng": 10.32, "role": "secondary" }
  ],
  "connections": [ { "from": "rome", "to": "carthage", "label": "Punic Wars" } ]
  // optional: "focus": [west, south, east, north] to override the auto-frame
}
```

### context.map - schematic (renders a concept diagram)
Omit `lat`/`lng`; position with `x`/`y` as percentages of the box (0-100).
```jsonc
"map": {
  "markers": [
    { "id": "ego",   "label": "Ego",   "x": 50, "y": 35, "role": "primary" },
    { "id": "id",    "label": "Id",    "x": 30, "y": 65, "role": "secondary" },
    { "id": "super", "label": "Superego", "x": 70, "y": 65, "role": "secondary" }
  ],
  "connections": [ { "from": "ego", "to": "id", "label": "mediates" } ]
}
```

### story.json  (StoryCard[])
```jsonc
[
  { "id": 1, "timeline": "509 BCE", "title": "A republic is born",
    "content": "2-7 sentences explaining ONE idea, simple language.",
    "next": "Curiosity hook into the next card.",
    "visual": "map" }                      // optional: illustration key or image filename
]
```

### timeline.json  (TimelineEvent[])
```jsonc
[ { "year": "509 BCE", "title": "Republic founded" } ]   // major milestones only
```

### quiz.json  (QuizQuestion[]) - four types, each needs an "explanation"
```jsonc
[
  { "id": 1, "type": "multiple-choice",
    "question": "...?", "options": ["A","B","C","D"], "answer": 2,   // index of correct option
    "explanation": "Shown after answering." },
  { "type": "true-false", "question": "...", "answer": true, "explanation": "..." },
  { "type": "ordering", "question": "Put these in order",
    "items": ["First","Second","Third"], "correctOrder": [0,1,2],    // omit if items already in order
    "explanation": "..." },
  { "type": "matching", "question": "Match each to its role",
    "pairs": [ { "left": "Rome", "right": "Rising city" } ], "explanation": "..." }
]
```

### flashcards.json  (Flashcard[])
```jsonc
[ { "id": 1, "front": "Question or term", "back": "Answer / definition." } ]
```

### book-<slug>.json  (BookCard[])
```jsonc
[ { "id": 1, "timeline": "Ch.1", "title": "The core idea",
    "content": "...", "concept": "Optional one-word concept tag", "next": "hook" } ]
```

## Hard rules

- **Encoding:** UTF-8 without BOM. Valid JSON (no trailing commas/comments).
- **Punctuation:** prefer ASCII; use `-` (hyphen-minus), not `—`/`–`/smart quotes -
  unless there's a clear editorial reason such as a `period` date range. `æ ø å` and caps
  are fine, stored directly.
- **`period` is history-only.** Non-history modules omit `period`; use `context.when`.
- **Map mode follows the data.** All-markers-have-`lat`+`lng` -> real map; otherwise
  schematic from `x`/`y`. Never both schemes in one marker set; never a world map behind a
  non-geographic topic. Keep ~3-6 short-labelled markers; cluster carefully (close markers
  -> tangled leader lines). `connections` must reference real marker `id`s.
- **Quiz:** randomize the multiple-choice `answer` index across the module; `answer` must
  be in `options` range; `ordering.correctOrder` must be a permutation of the item indices;
  matching `pairs` need `left` + `right`. Test understanding, not trivia.
- **Story cards:** one idea each, 2-7 sentences, end with a `next` hook. Don't pre-state
  the whole module in card one; let it unfold.

## How the engine consumes this content

- `src/lib/content.ts` auto-discovers each file by glob and assembles a `ModuleBundle`.
  Missing optional files become empty arrays; the UI adapts.
- A `module.json` whose `title` starts with `PLACEHOLDER` is **excluded** from the registry
  entirely - it's invisible until you give it a real title. That's the publish switch.
- `ContextMap` dispatches to a real `GeoMap` or a `SchematicMap` purely from the markers.
- Progress tracks completed stages + best quiz score in localStorage; there's no
  per-card analytics. See the `module-engine` skill before changing any of this.

## Publishing flow (placeholder or new module)

1. Author `module.json` (real title), then `story`/`timeline`/`quiz`/`flashcards`.
2. Run the validator; fix errors (warnings are advisory).
3. Bump version (**MINOR**), add a `docs/changelog.md` entry, mark **DONE** in
   `docs/content.md`, update `docs/readme.md` if the UX changed.
