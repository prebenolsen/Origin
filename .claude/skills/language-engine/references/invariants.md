# Engine invariants (the long version)

These encode the product rules. Each lists *what* must hold and *why*, so a refactor keeps
the behaviour even if the implementation changes.

## Identity

- **`vocabId(es)`** = `lowercase → NFD → strip combining marks → strip non-`[a-z0-9 ]` →
  collapse spaces`. It is the primary key everywhere (localStorage map key, distractor
  de-dup, review lookup, mastered-set in `VocabTest`).
- Consequence: `cafe` and `café` are the **same** word. This is intentional (the content set
  is accent-free). Changing this normalization is a data migration, not a tweak.

## Scoring (`recordReview(lang, id, correct, level)`)

- `level` is the difficulty of the *question that was answered* (1..4), supplied by
  `VocabTest` via `onResult(target, correct, level)`. Always pass it.
- Correct:
  - `streak++`, `correct++`, `maxCorrectLevel = max(maxCorrectLevel, level)`.
  - `ease += (level>=3 ? +0.1 : level===2 ? +0.02 : -0.02)` clamped to [1.3, 2.8].
    (A recognition guess slightly *lowers* ease.)
  - first correct interval (days): L4→3, L3→1.5, L2→0.75, L1→0.35; later
    `interval = max(0.35, interval * ease * levelFactor)` with `levelFactor` ramping L1→L4.
  - `nextReview = now + interval*DAY`.
- Wrong: `incorrect++`, `streak=0`, `interval=0`, `ease -= 0.2` (min 1.3),
  `nextReview = now + SOON` (~2 min) so it comes straight back.
- **Invariant:** a correct L1 answer must never advance a word as far as a correct L4 answer,
  and N correct L1 answers in a row must not by themselves make a word `strong`.

## Mastery (`masteryOf`)

- `new`  : `attempts === 0`.
- `strong`: `streak >= 3 && maxCorrectLevel >= 3`.
- `learning`: everything else.
- **Invariant:** `strong` requires recall at context/production difficulty, not just a streak.

## Difficulty ramp (`levelFor`)

- new/`attempts===0` → 1 (recognise: Spanish → meaning).
- `strong` → 4 (produce: type the Spanish).
- otherwise by `maxCorrectLevel`: `<=1` → 2 (recall), else → 3 (context fill-blank if a
  `template` exists).
- **Invariant:** monotonic 1→2→3→4 with demonstrated competence; never jump a learner to
  production before they've recalled in context.

## Adaptive review order (`orderAdaptive(states, max, days, seed)`)

- Bands, each `seededShuffle`d: `failed` (isWeak) → `recent` (introduced < `days`) →
  `other` → and a reserved ~20% tail of `strong` (not recent) for retention.
- Result is capped at `max`; failed/recent get the budget first, mastered fill the retention
  tail.
- **Invariant:** output is never the authored/introduction order; failed words are
  prioritized; some mastered words are included for retention.

## Distractors (`testGen.pickDistractors`)

- Score candidates by `sameCategory*2 + spellingSimilarity`, take the top slice, shuffle.
- **Invariant:** options are plausible (same category / confusable spelling), never random
  unrelated words. The answer is always present exactly once.

## Lesson flow (`LessonExperience`)

- Phases: `personalize?` → `context` → repeated (`teach` batch → mastery-gated `practice`
  batch) → `final` full review → `done`.
- `BLOCK_SIZE = 3`. Words are `introduce`d + `markSeen` when their batch is taught.
- Practice batches run `VocabTest` with `requeueWrong` so a missed word returns before the
  batch ends (capped at `MAX_REQUEUE`).
- Teach examples are gated to introduced words (whole-word match) - **no pre-teaching**.
- The component is keyed by scenario (`<LessonRunner key={scenario}/>`) so switching lessons
  fully remounts; don't reintroduce shared state across scenarios.

## Persistence

- Keys: `origin:lang:<lang>:vocab:v1`, `origin:lang:<lang>:profile:v1`.
- Every write dispatches `window` event `origin:lang`; `useLanguage` hooks listen to it.
- `introduce` is idempotent and never overwrites existing memory.
- Field parity with `docs/language-supabase-schema.md` (`origin_language_spanish_*`).
