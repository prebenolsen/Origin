---
name: language-engine
description: Work safely on Origin's language learning engine - the SRS memory, adaptive test generation, lesson flow, and review screens (src/lib/language/** and src/components/language/**). Use when changing spaced repetition, mastery, question difficulty, distractors, review ordering, the block-based lesson, or progress/Supabase persistence. Documents the invariants that must not break and where to optimize.
---

# Language learning engine

The engine measures **memory, not lesson completion**. Before changing any scoring,
difficulty, or review behaviour, read [`references/invariants.md`](references/invariants.md)
- these rules are easy to break silently and there are no unit tests guarding them yet.

## Module map

| File | Responsibility |
|------|----------------|
| `src/lib/language/content.ts` | Auto-discovers content (`import.meta.glob`); read-only registry. |
| `src/lib/language/srs.ts` | Per-word memory state, level-weighted scoring, mastery, spaced-repetition schedule, `orderAdaptive`. **The heart.** |
| `src/lib/language/testGen.ts` | Builds questions; `levelFor` (difficulty ramp) + intelligent distractors. |
| `src/lib/language/profile.ts` | Chosen goal, personalized picks, completed scenarios. |
| `src/lib/language/useLanguage.ts` | Reactive hooks over the `origin:lang` event. |
| `src/components/language/LessonExperience.tsx` | Block-based lesson: personalize → context → teach/practice batches → full review → done. |
| `src/components/language/VocabTest.tsx` | Queue-based runner; mastery requeue; reports `(target, correct, level)`. |
| `src/components/language/ReviewSession.tsx` / `ReviewDashboard.tsx` | Adaptive review modes + dashboard. |

## The invariants (do not break)

1. **`vocabId` is the single identity of a word.** Every store key, distractor de-dup, and
   review lookup goes through `srs.vocabId` (lowercase, accent/punct-stripped). Never key a
   word by anything else. If you change normalization, you orphan existing localStorage.
2. **A correct guess ≠ confident recall.** `recordReview(lang, id, correct, level)` is
   level-weighted: recognition (L1) nudges ease down and reschedules in hours; production
   (L4) grows the interval to days. **Always pass the real question level** from `VocabTest`.
3. **Mastery is gated on demonstrated recall.** `masteryOf` returns `strong` only when
   `streak >= 3 AND maxCorrectLevel >= 3`. Clicking through multiple-choice must not fake
   fluency. Keep `maxCorrectLevel` updated on every correct answer.
4. **Difficulty ramps 1→2→3→4.** `levelFor` maps new→recognise, then recall, then context,
   then (strong)→produce, driven by `maxCorrectLevel`. Keep the ramp monotonic.
5. **Reviews are adaptive, never introduction order.** Use `orderAdaptive` (failed → recent →
   other → mastered-retention tail). The lesson's final review and every `ReviewSession`
   mode go through it.
6. **Distractors are intelligent, never random.** `testGen` picks same-category and
   spelling-similar words. Don't replace with `Math.random` over the whole pool.
7. **Lessons teach in small batches** (`BLOCK_SIZE = 3`), practice is **mastery-gated**
   (wrong words requeue via `VocabTest` `requeueWrong`/`regenerate`), and the teach screen
   must not pre-teach future vocabulary (examples are gated to introduced words).
8. **Persistence contract.** State is localStorage under `origin:lang:<lang>:vocab:v1` and
   `:profile:v1`; every write dispatches the `origin:lang` event so `useLanguage` hooks
   refresh. The state shape maps 1:1 onto the Supabase tables in
   `docs/language-supabase-schema.md` (prefix `origin_language_spanish`) - keep them aligned
   when you add a field.

## Where to optimize (and the traps)

- `srs.read()` parses the whole store on every call; several screens call `getAll` repeatedly
  per render. If profiling shows cost, add a memoized in-memory cache invalidated on the
  `origin:lang` event - but **keep localStorage the source of truth** and keep writes
  event-dispatching. See [`references/optimization.md`](references/optimization.md).
- Keep the language routes lazy-loaded (they already are in `App.tsx`); don't import
  `content.ts` eagerly from the Home bundle.
- `seededShuffle` must stay deterministic for a given seed (stable re-renders). Don't swap in
  `Math.random` inside render paths.

## Before you finish

- `npm run typecheck` (and `npm run build`).
- Sanity-check engine behaviour in the dev server by importing the module and calling it,
  e.g. `await import('/src/lib/language/srs.ts')` in the preview console - see
  [`references/verifying.md`](references/verifying.md).
- Repo rule: bump `version.js` + `package.json`, add a `docs/changelog.md` entry. An
  engine/behaviour change is usually **MINOR**; a UI-only tweak is **PATCH**.
