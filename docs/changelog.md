# Changelog

All notable changes to **Origin** are documented here.
Versioning follows the rules in [`CLAUDE.md`](CLAUDE.md): `MAJOR.MINOR.PATCH` where
MAJOR = big features, MINOR = content, PATCH = UX/UI.

## [6.0.1] - 2026-06-30

### Changed - Sentence builder retries instead of revealing the answer

UX refinements to the `build-sentence` exercise (`VocabTest.tsx`):

- **Correct just says "Correct"** - the redundant `<spanish> = <english>` line is gone for
  built sentences (the learner just assembled it, so echoing it back added nothing).
- **A wrong build no longer reveals the answer or advances.** The learner stays on the
  sentence with a "Not quite - try again" note and can keep adding/removing tiles until it's
  right. The SRS result is still recorded from the **first** attempt, so retries don't inflate
  the score.
- **New "Help me" button** (appears after the first wrong check): the first press trims the
  answer back to its longest correct prefix (dropping the first wrong tile and everything
  after it); once the placed tiles are a correct prefix, each press auto-places the next
  correct word, shown in **green** to mark that the learner didn't place it themselves.
- **Layout:** the answer row sits under the prompt, the word bank moved down to just above
  the footer, and **Check** is pinned to the bottom with reserved space above it for the Help
  button (so revealing Help doesn't shift the layout).

## [6.0.0] - 2026-06-30

### Added - "Unlock Spanish": a word-bank sentence builder (new exercise type)

A new app capability for the Spanish course - the learner moves from *memorizing* Spanish to
*creating* it. A Duolingo-style **`build-sentence`** exercise lets them assemble full sentences
from words they already know, and a new **Unlock Spanish** section teaches the grammar that
ties the first two sections' vocabulary together.

**Engine + UI**

- **New `build-sentence` question kind** (`src/lib/language/testGen.ts`): a word bank of
  shuffled tiles (the answer's tokens + `distractors`) that the learner taps into order.
  `buildSentenceQuestion` / `buildSentenceQuiz` build the drills; `checkBuildSentence` grades
  the tapped order with the same accent/case-forgiving normalizer as `produce`.
- **Word-bank UI** (`src/components/language/VocabTest.tsx`): large mobile tiles, an answer
  row (tap a placed tile to send it back to the bank) and a bank row, with a Check button -
  no dragging. Reuses the shared correct/wrong result panel and SRS reporting.
- **Lesson flow** (`LessonExperience.tsx`): a new `sentences` phase runs after the full
  review and is fed by `sentences.json`. A scenario can be **sentence-only** (no
  `vocabulary.json`), in which case the lesson skips teaching and goes straight to building.
  A correct build credits every known word in the sentence as in-context (level-3) recall,
  so the grammar drill still feeds the spaced-repetition memory.
- **Content shape**: optional **`sentences.json`** (`{ en, es, distractors? }[]`), a new
  `Sentence` type, and registry discovery in `src/lib/language/content.ts`.

**Content**

- New goal **Unlock Spanish** (`building-sentences`) with 7 scenarios. Scenario 1,
  **From Chunks to Sentences** (`from-chunks-to-sentences`), is fully authored as a
  sentence-only opener (6 build-sentence drills from already-known words). Scenarios 2-7
  (`el-la-gender`, `joining-ideas`, `ser-vs-estar`, `people-and-actions`,
  `describing-things`, `make-a-sentence`) ship as placeholders ("Soon").
- **Business Spanish** and **Living in Spain** stay locked until this section is complete.

**Docs**

- `scenarios/visiting-spain/overview.md` and `scenarios/meeting-people/overview.md` summarize
  the two completed sections plus every word/phrase taught; `plan-going-forward.md` records
  the tutor's reasoning for prioritizing this grammar bridge.

## [5.10.0] - 2026-06-30

### Added - Five new "Meeting People" scenarios (Spanish)

The Meeting People goal grew from 4 to 9 scenarios, completing the social chapter from the
content plan. New scenarios, ordered so each hands the next the words it needs:

- **Where You're From** (`where-youre-from`, standard) - "de donde eres?", "soy de",
  "vivo en"; lesson examples weave in the learner's own country via the `{country_es}` token.
- **Work & Study** (`what-you-do`, personalized) - the frame ("a que te dedicas?", "soy",
  "trabajo en", "estudio") plus a profession picker so the job you drill is your real one.
- **Casual Questions** (`casual-questions`, standard) - the follow-ups and reactions that
  keep a chat alive: "cuantos años tienes?", "de verdad?", "que bien", "cuentame".
- **Making Plans** (`invitations`, standard) - "te apetece...?", "quieres...?", "tomar algo",
  "quedamos?", "vale", "quiza otro dia".
- **Compliments & Small Talk** (`compliments-smalltalk`, standard) - "que bien hablas
  español!", "me gusta tu...", "que guay", "como va todo?".

Existing scenarios were reordered in `language.json` to match the plan's progression
(intro -> origin -> work -> family -> hobbies -> likes -> questions -> plans -> compliments).
The recurring "y tu?" beat is threaded through the lesson examples throughout.

## [5.9.0] - 2026-06-30

### Changed - Removed "Basic Needs", folded its essentials into Cafe (Spanish)

The `basic-needs` scenario duplicated words already taught earlier in the path, so it has
been removed from the Visiting Spain goal and its folder deleted. Its useful pieces now live
where a traveller actually uses them:

- **Cafe** gained a final batch - `necesito` (I need), `el baño` (the toilet) and
  `los servicios` (the restrooms) - plus a lesson note and example, since a bar is the
  easiest place to duck in for the toilet and ask with "Necesito un baño".
- `quiero` (I want) was already taught in Cafe and Restaurant; `agua` (water) in both;
  `el baño` (the toilet) in Directions; and `tengo` (I have) in Introductions and Family -
  so the three request frames "I want / I need / I have" are all still covered.
- `el wifi` and `la contraseña` (wifi / password) were dropped as requested.

## [5.8.1] - 2026-06-30

### Fixed - Personalize picker empty-state label (Spanish)

The "pick something" button on personalized scenarios was hardcoded to "Pick what you buy"
(a leftover from the supermarket scenario), so it read wrong on Shopping ("wear"), Hobbies
("do") and Family. Replaced with the prompt-agnostic "Pick what applies to you"; the
scenario-specific wording already lives in each picker's `intro`.

## [5.8.0] - 2026-06-30

### Added - "Family" scenario in Meeting People (Spanish)

A personalized `family` scenario, placed second in the Meeting People path (right after the
two-way intro). Family is social, not transactional, so it belongs in Phase 2 - taught on
the `tener` verb the chapter already uses.

- **Base frame (6 words):** `mi familia`, `tengo` / `no tengo`, `tienes?`, plus the
  near-universal `mi madre` / `mi padre` (with `mis padres` in the notes).
- **`personalize.json` picker** - "Who's in your family?" with Siblings / Children / Partner
  groups, slotting into the frame `Tengo ___.`. Only the picked members are taught, so the
  words are true for the learner and the partner term matches them (`pareja` / `novio` /
  `novia` / `marido` / `mujer`) - no member is taught that doesn't apply.
- Extended family (`abuelos`, `tios`, `primos`, ...) is intentionally deferred to a later
  phase, per the small-batches rule.

## [5.7.0] - 2026-06-30

### Added - "Meeting People" goal, Phase 2 (Spanish)

The social chapter where the language stops being transactional and becomes a
conversation. New goal `meeting-people`, available now with its first three scenarios.
Goal order corrected to phases: Visiting Spain -> Meeting People -> Business Spanish ->
Living in Spain (Living moved to a later phase per the roadmap).

- **`introductions-social`** (standard, 12 words) - the reciprocal two-way intro:
  ask names and swap pleasantries, with the chapter's golden habit `y tu?` (and you?),
  and the informal `tu` register contrasted with Visiting Spain's `usted`.
- **`likes-dislikes`** (standard, 12 words) - the `gustar` centerpiece: `me gusta` /
  `me gustan` taught as "it pleases me", plus reactions (`a mi tambien`, `te gusta?`).
- **`hobbies-freetime`** (personalized) - frame verbs (`que haces`, `juego`, `toco`,
  `hago`, `me gusta`) plus a `personalize.json` picker so the learner only drills the
  hobbies they actually do (sport / music & arts / at home / outdoors).
- Plan documented in
  `src/content/languages/spanish/scenarios/meeting-people/content-plan.md`; the full ToC
  (where-you're-from, what-you-do, casual-questions, invitations, compliments) ships next.

## [5.6.0] - 2026-06-30

### Changed - Visiting Spain content review pass (Spanish)

Acted on the content evaluation in
`src/content/languages/spanish/scenarios/visiting-spain/content-evaluation.md`. No new
scenarios - this tightens accuracy, consistency and coverage of the existing 13.

- **Correctness: `ñ` restored everywhere.** Previously dropped in `España`, `español`,
  `mañana`, `baño`, `contraseña`, `pequeño` (the same files kept `años`). `ñ` is a distinct
  letter, not an accent - `año` vs `ano`. Acute accents stay stripped as before.
- **Greetings now teaches `por favor`** ("please"), which the summary always promised but
  the word list never contained. Greetings is now 12 words (4 clean batches of 3).
- **Numbers gains 6-9 plus `treinta`/`cuarenta`** and an example of the `treinta y cinco`
  pattern, so real prices and dates are sayable (now 6 batches of 3).
- **One form per meaning for "how much is it":** standardized on `cuanto cuesta`
  (numbers, supermarket updated; `cuanto es` kept as a noted alternative).
- **`basic-needs` moved earlier** (right after `questions`) so its core words
  (`necesito`, `agua`, `baño`, `wifi`) are introduced before the scenarios that reuse them.
- **`supermarket` base trimmed** from 5 duplicative phrases to 3 genuinely-new ones
  (`donde estan`, `cuanto cuesta`, `eso es todo`); the products still come from
  `personalize.json`.
- **Pronunciation hints** added to the sounds beginners can't guess from spelling - `ll`
  (`me llamo`, `bocadillo`), `j` (`jueves`), Castilian `z`/`ce`/`ci` (`cerveza`, `cinco`,
  `estacion`) and `ñ` - carried in each item's `note`.
- **Lessons added** for `cafe`, `restaurant` and `shopping` (previously lesson-less).
- **Gendered self-descriptions fixed to masculine** for this learner: `vegetariano` and
  `estoy perdido` are noted as the male form; no feminine variant is taught.

## [5.5.0] - 2026-06-30

### Added - Learner onboarding that personalizes the lessons (Spanish)

Starting Spanish now opens with a short onboarding step: the learner types their **name,
country, and age**. Those answers are woven straight into the lessons, so the first
sentences they learn to say are actually true about them ("Me llamo Preben. Soy de
Noruega. Tengo 36 años.").

- **Onboarding screen** (`Onboarding.tsx`), shown once on first entry to Spanish and
  re-openable from the home header ("¡Hola, <name>!  edit"). All fields are optional; the
  country field has a datalist of common countries and previews the Spanish name.
- **Learner profile** added to the language profile store (`profile.ts` +
  `learner.ts`): `{ name, city, country, countryEs, age }`, persisted in localStorage and
  mapped onto new `origin_language_spanish_profile` columns.
- **Token substitution in lessons** (`personalizeText`): lesson context/explanation and
  examples support `{name}`, `{city}`, `{country}`, `{country_es}`, `{age}` tokens, applied
  before the "no pre-teaching" example gate so personalized sentences still appear only once
  their words are introduced. A built-in English->Spanish country map renders `{country_es}`.
- **Introductions content** now leads its examples with the learner's own details and gains
  a third batch-of-three covering **age** (`cuantos años tienes`, `tengo`, `años`), taking
  the scenario from 9 to 12 words.

## [5.4.0] - 2026-06-30

### Changed - "Visiting Spain" reshaped as a tourist-survival phase (Spanish)

Phase 1 is now a coherent "I can take care of myself in Spain" path - survival vocabulary,
fixed expressions and real situations, with no grammar or two-way social conversation
(that is reserved for a later "Meeting People" phase). The goal now runs through 13 short,
word-first scenarios in a deliberate order.

- **All placeholders filled - the phase is fully playable.** `numbers`, `directions`, `taxi`
  and `shopping` were scaffolding (`placeholder`, empty Spanish) and are now live.
- **Introductions (was "Small Talk"), kept one-way.** Renamed `small-talk` -> `introductions`.
  Teaches only what you say about yourself - me llamo, soy de, estoy de visita en Espana,
  hablo un poco de espanol, no hablo bien espanol. Dropped the question-asking words
  ("what's your name", "where are you from", "how are you") - those belong to the next phase.
- **Numbers -> "Numbers & Money", refocused on prices.** Now cuanto es / euros / el precio plus
  uno..cien. Dropped dates and clock time from scope (not needed for this phase).
- **Getting around made situational.** `directions` ("Getting Around") teaches the ask-and-
  understand pair (donde esta + aqui/alli/izquierda/derecha/todo recto/cerca/lejos) and the
  most-asked place, el bano. `taxi` covers lleveme a / el hotel / el aeropuerto / la estacion /
  cuanto cuesta / pare aqui.
- **Shopping (clothes) switched on as a personalized scenario** - base phrases (cuanto cuesta,
  puedo probarmelo, el probador, mi talla, mas grande/pequeno) plus a "what do you wear?"
  picker (tops/bottoms/shoes); only the clothes you pick are taught.
- **Three new survival scenarios.** `basic-needs` (necesito/quiero + el bano, agua, el wifi,
  la contrasena), `days-time` ("Days & Simple Time": hoy/manana/ayer, the weekdays, abierto/
  cerrado) and `help` ("Problems & Help": no entiendo, puede repetir, mas despacio, puede
  ayudarme, habla ingles, estoy perdido).
- Goal order is now greetings -> introductions -> numbers -> questions -> cafe -> restaurant ->
  supermarket -> shopping -> directions -> taxi -> basic-needs -> days-time -> help.

## [5.3.0] - 2026-06-30

### Added - Phase folders + Cafe/Restaurant/Questions (Spanish, "Visiting Spain")

- **Phase-based content layout.** Spanish scenarios now live one phase folder deep -
  `scenarios/<phase>/<slug>/` (all current scenarios moved under `visiting-spain/`) - so
  phase-1 content stays separate from later phases. The content registry
  (`src/lib/language/content.ts`) discovers scenarios at this depth; the leaf `<slug>`
  remains the scenario's identity, with a dev-time warning if two phases collide on a slug.
  The content validator was updated to descend phase folders.
- **Cafe** and **Restaurant** are now playable (`placeholder` -> `standard`), deliberately
  kept to small, word-first lists (12 each) for phase 1 - drinks/food/order basics for the
  cafe, menu/food/pay basics for the restaurant. Fuller, sentence-level versions are planned
  for a later phase.
- **New "Questions" scenario** (`visiting-spain/questions`): the core question words and
  short question phrases - que, quien, donde, cuando, por que, como, cuanto, cuantos, cual,
  plus donde esta / a que hora / cuanto cuesta. Added to the "Visiting Spain" goal.

## [5.2.1] - 2026-06-30

### Added - Authoring/engine skills + content validator (dev tooling)

- New project skills under `.claude/skills/`:
  - **spanish-content** - authoring & extending language content (rules, file shapes,
    templates) with a runnable validator
    `node .claude/skills/spanish-content/scripts/validate-content.mjs` that checks JSON
    validity, BOM, typographic dashes, required fields, scenario `kind`, empty `es` in
    non-placeholder scenarios, duplicate words, and goals referencing missing scenarios.
  - **language-engine** - invariants, optimization notes, and a verification recipe for the
    SRS / adaptive-testing / review code, so future refactors preserve behaviour.
- Fixed `scenarios/cafe` which had been duplicated from Restaurant (wrong `slug`/title/word
  list) - now a proper Cafe placeholder. Caught by the new validator.
- PATCH bump (dev tooling + placeholder content fix; no learner-facing module changed).

## [5.2.0] - 2026-06-29

### Changed - Adaptive review & confidence-weighted memory (Spanish)

- **Adaptive review order** (`srs.ts → orderAdaptive`): reviews no longer run in
  introduction order. Words are banded and shuffled - failed/weak words first, then
  recently learned, then other learning words, with a ~20% retention sample of mastered
  words at the end. The full section review and every review session now use this.
- **Difficulty ramps Recognition → Recall → Context → Production**: `levelFor` now ramps a
  word by *demonstrated* competence (`maxCorrectLevel`), not a bare streak - recognise once,
  then recall, then context, then (when strong) production.
- **A correct guess no longer counts like confident recall**: `recordReview(…, level)` is
  level-weighted. A correct recognition (1-of-4) nudges ease down slightly and reschedules
  the word within hours; confident production grows the interval to days. "Strong" mastery
  now *requires* a higher-level correct answer (`maxCorrectLevel >= 3`), so clicking through
  multiple-choice can't fake fluency. Every answer still updates correct/wrong counts,
  mastery, and `next_review_date`, and now also stores the question level in the history.
- **Shorter intros, no pre-teaching**: the Greetings explanation was trimmed to only the
  first batch's words; time-of-day detail moved to per-word notes. Teach-screen example
  sentences are now gated to words already introduced (whole-word match), so a batch never
  shows vocabulary the learner hasn't met yet.
- Added `maxCorrectLevel` to the vocab state and `max_correct_level` to the Supabase schema.
- Bumped version to **5.2.0** (MINOR - learning-system change + content edit).

## [5.1.0] - 2026-06-29

### Changed - Block-based lesson progression & mastery gating (Spanish)

Reworked the lesson flow so a section is no longer a dictionary page that dumps all words
then tests them at the end.

- **Small learning batches**: a lesson now teaches ~3 words at a time
  (`BLOCK_SIZE = 3`) - introduce a batch, practice it immediately, then move to the next.
  Each batch shows the words + (on the first batch) the explanation and example sentences.
- **Mastery before progression**: the per-batch practice runs in mastery mode - a word
  answered wrong is **requeued** (regenerated as a harder recall question) and must be
  recalled before the batch ends. Clicking through is no longer enough. (`VocabTest` is now
  queue-based with `requeueWrong` + `regenerate`.)
- **Mini review per batch + full section review**: every batch ends in active recall, and
  after the last batch a full review tests every word introduced in the section.
- **Category separation fix**: removed Restaurant/Cafe vocabulary that had leaked into
  Greetings (`Un cafe, por favor`, and the standalone `por favor`). Greetings is now exactly
  the brief's set of 11 words, ordered into clean batches (hola/adios/gracias →
  buenos dias/buenas tardes/buenas noches → hasta luego/de nada/perdon → si/no).
- **Memory tracking**: added `seen` (times_seen) to the vocab state, distinct from
  `attempts` (times_tested); `markSeen()` is recorded when a batch is taught. Updated the
  Supabase schema doc to the explicit `Vocabulary` / `UserVocabularyProgress` /
  `ReviewAttempt` model.
- Bumped version to **5.1.0** (MINOR - content + learning-loop change).

## [5.0.0] - 2026-06-29

### Added - Languages domain (Spanish) - a new app capability

A goal-driven, personalized language-learning engine that lives alongside (and reuses)
the existing UI, progress pattern, and design system. Not a Duolingo-style fixed
curriculum: the learner picks a goal and is taught the words and phrases that situation
actually needs.

- **New domain & routes** (`/learn/spanish`, `.../path`, `.../lesson/:scenario`,
  `.../review`, `.../review/:mode`), all lazy-loaded. Entry card added to the Home screen.
- **Goal selection** - "Visiting Spain" generates the learning path (Greetings, Numbers,
  Restaurant, Taxi, Supermarket, Shopping, Directions, Small Talk). "Living in Spain" and
  "Business Spanish" stubbed as coming-soon.
- **Greetings** - one fully authored module (context -> teach -> practice -> review).
- **Supermarket** - personalization example: asks "What do you usually buy?", then teaches
  only the selected words (e.g. cucumber -> pepino) merged with base navigation phrases.
- **Vocabulary memory & spaced repetition** (`lib/language/srs.ts`): every word carries a
  learning state (attempts, streak, review history, SM-2 ease/interval, next-review). Words
  resurface for review at the right time; performance drives frequency.
- **Adaptive testing** (`lib/language/testGen.ts`): difficulty rises with mastery
  (recognise -> recall -> in-context -> produce) and **distractors are intelligent** -
  drawn from the same category and spelling-similar words, never random unrelated ones.
- **Review dashboard** - words learned / strong / to-improve / new, "Review all words",
  "Practice weak words" (a "Words to improve" trainer), "This week's vocabulary", and
  per-scenario testing.
- **New data models** in `src/types/language.ts`; content auto-discovered from
  `src/content/languages/spanish/**` (drop-in scenario folders, no code changes).
- **Placeholder scenarios** for the remaining categories ship as easy-to-fill
  `vocabulary.json` word-list templates (and a `personalize.json` template for Shopping);
  scenarios marked `kind: "placeholder"` stay hidden from learners until authored.
- State persists in localStorage today (same pattern as `lib/progress.ts`); see
  `docs/language-supabase-schema.md` for the matching `origin_language_spanish` tables.
- Bumped version to **5.0.0** (MAJOR - new app capability).

## [4.7.0] - 2026-06-29

### Added - Decline and Collapse of the Ottoman Empire module

- Authored all 5 content files for `history/ottoman-empire/decline-and-collapse-of-the-ottoman-empire` from raw source material (the placeholder JSON was a copy from another section).
- `module.json`: geo map spanning Istanbul, Vienna, Crimea, Greece, and Ankara with period 1650s-1924 CE.
- `story.json`: 31 cards covering 17th-century decay, the 1683 Siege of Vienna, the Tulip Era, the Russo-Turkish wars, the Tanzimat reforms, Balkan nationalism, the Young Turks, World War I, and the founding of the Republic of Turkey.
- `timeline.json`: 12 milestones from the 1600s crises to the abolition of the sultanate and caliphate (1922-1924).
- `quiz.json`: 10 questions (multiple-choice, true-false, ordering) on the causes and turning points of Ottoman decline.
- `flashcards.json`: 15 flashcards covering key reforms, battles, treaties, people, and the empire's end.
- Marked the module DONE in `content.md`.
- Bumped version to **4.7.0** (MINOR - new content module).

## [4.6.0] - 2026-06-29

### Added - The Ottoman Empire at its Height module

- Authored all 5 content files for `history/ottoman-empire/the-ottoman-empire-at-its-height` from raw source material.
- `module.json`: geo map spanning Istanbul, Vienna, Cairo, Chaldiran, and Lepanto with period 1481-1650s CE.
- `story.json`: 25 cards covering Bayezid II's consolidation, Selim I's conquests and the Caliphate, Suleiman the Magnificent's golden age, the Battle of Lepanto, and the Sultanate of Women.
- `timeline.json`: 11 major milestones from Bayezid II (1481) to the Sultanate of Women (1600s).
- `quiz.json`: 10 questions (multiple-choice, true-false, ordering) testing causes, turning points, and the shift from conquest to consolidation.
- `flashcards.json`: 15 flashcards covering key sultans, battles, the Caliphate, and the rise of imperial women.
- Marked the module DONE in `content.md`.
- Bumped version to **4.6.0** (MINOR - new content module).

## [4.5.0] - 2026-06-29

### Added - Rise of the Ottoman Empire module

- Authored all 5 content files for `history/medieval-world/rise-of-the-ottoman-empire` from raw source material.
- `module.json`: geo map covering Anatolia, Constantinople, Adrianople, and Kosovo with period 1299-1453 CE.
- `story.json`: 31 cards covering the full arc from the Kayı tribe's origins through Mehmed II's conquest of Constantinople.
- `timeline.json`: 12 major milestones from the Mongol shockwave (1243) to the fall of Constantinople (1453).
- `quiz.json`: 10 questions (multiple-choice, true-false, matching, ordering) testing understanding of causes and turning points.
- `flashcards.json`: 15 flashcards covering key people, events, systems, and concepts.
- Bumped version to **4.5.0** (MINOR - new content module).

## [4.4.1] - 2026-06-29

### Changed - category card layout redesigned

- Reorganized category cards on the home screen into a responsive 2-column grid layout
- Moved category name to the top of each card
- Repositioned metadata (modules, topics, books count) to the bottom with a divider
- Reduced metadata font size for visual hierarchy
- Added `whitespace-nowrap` to ensure metadata stays on two lines: modules on row 1, topics & books on row 2

## [4.4.0] - 2026-06-28

### Changed - placeholder stage files now use scaffold objects (not empty arrays)

- Replaced bare `[]` placeholder files under `src/content/countries/**` with code-ready scaffold JSON objects matching the placeholder style used in psychology placeholder files.
- Applied this across Norway non-history placeholder modules and all United States placeholder modules for:
  - `story.json`
  - `timeline.json`
  - `quiz.json`
  - `flashcards.json`
- Kept `norway-history` authored content unchanged.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **4.4.0** (MINOR - content scaffold format update).

## [4.3.0] - 2026-06-28

### Changed - countries non-history content reset to placeholders

- Converted Norway non-history country modules to placeholder-only scaffolds (no synthetic authored content):
  - `norway-overview`
  - `norway-politics`
  - `norway-society`
  - `norway-economy`
- Kept Norway history module content in place.
- Added new `src/content/countries/united-states/` scaffolds with placeholder-only files for:
  - `united-states-overview`
  - `united-states-history`
  - `united-states-politics`
  - `united-states-society`
  - `united-states-economy`
  - `united-states-geography-interactive`
- Updated `docs/content.md` statuses accordingly.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **4.3.0** (MINOR - content policy alignment and new country scaffolds).

## [4.2.1] - 2026-06-28

### Changed - Countries now requires country selection first

- Updated category routing to support `/c/:cat/:sub`.
- Changed Countries flow so opening `Countries` now shows a country picker instead of listing all country modules directly.
- Added country-specific listing screen under `Countries` so users must pick a country first (for example Norway) before seeing modules like Overview, History, Politics, Society, and Economy.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **4.2.1** (PATCH - navigation UX behavior).

## [4.2.0] - 2026-06-28

### Changed - category slug renamed to countries

- Renamed content category folder from `src/content/country-history/` to `src/content/countries/`.
- Updated Norway module metadata category fields from `country-history` to `countries`.
- Updated content category display mapping in `src/lib/content.ts` to use `countries` as the canonical slug for **Countries**.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **4.2.0** (MINOR - content architecture rename).

## [4.1.0] - 2026-06-28

### Added - Norway Countries rebuild (first country rollout)

- Rebuilt `src/content/countries/norway` from era-specific history modules into a country-structure set:
  - `norway-overview`
  - `norway-history`
  - `norway-politics`
  - `norway-society`
  - `norway-economy`
- Added a hidden scaffold module `norway-geography-interactive` using a `PLACEHOLDER:` title to reserve the upcoming interactive cities-and-counties country geography experience.
- Updated category display naming so `country-history` is shown as **Countries** in the app.
- Updated `docs/content.md` tracker rows for Norway to the new Countries module model.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **4.1.0** (MINOR - content rebuild).

## [4.0.4] - 2026-06-28

### Changed - strict UTF-8 JSON normalization

- Normalized all `src/**/*.json` files to strict UTF-8 without BOM.
- Added explicit JSON encoding and punctuation rules to `CLAUDE.md` (including guidance for `æ`, `ø`, `å` and dash usage).
- Bumped `version.js`, `package.json`, and `package-lock.json` to **4.0.4** (PATCH - content encoding hygiene).

## [4.0.3] - 2026-06-28

### Fixed - timeline progression mapping across story cards

- Fixed `StoryFeed` timeline mapping so story-card `timeline` labels are matched against both timeline `year` and `title` (with normalized comparisons).
- Added a robust fallback: when no story cards map by label/number, cards are distributed across timeline milestones instead of staying pinned to the first milestone.
- Prevents the bug where nearly all cards display the same timeline stage until the end card.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **4.0.3** (PATCH - timeline UX fix).

## [4.0.2] - 2026-06-28

### Changed - module cards now omit subcategory label

- Removed subcategory text from module-card metadata line on category/search listings.
- Module cards now show only period/when text in that line when available.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **4.0.2** (PATCH - UI cleanup).

## [4.0.1] - 2026-06-28

### Changed - removed intro "When" line from all modules

- Removed rendering of the `When` row from the module introduction screen so it no longer appears before starting a module.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **4.0.1** (PATCH - UX cleanup).

## [4.0.0] - 2026-06-28

### Added - module-attached book content flow

- Added support for discovering `book-*.json` files under `src/content/**` and attaching them to their module path in the content registry.
- Added category-level book counts to home category cards (for example: `8 modules · 4 topics · 1 book`).
- Added a module-card book indicator (`📖`) next to module titles when at least one book is attached.
- Added a new intro CTA for modules with books: `This module has a book associated to it. Click to start it.`
- Added a new `/m/:cat/:sub/:mod/book` stage (`BookStage`) so the CTA opens a readable book walkthrough and then returns learners to the normal module flow.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **4.0.0** (MAJOR - new app capability).

## [3.3.0] - 2026-06-27

### Added - authored Science Life module from source transcript

- Completed `src/content/science/life/the-origin-of-life/` by replacing placeholders in `module.json`, `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json`.
- Built a complete learning flow from `raw.md` focused on spontaneous generation vs modern evidence, definitions of life, prebiotic chemistry, RNA-world hypotheses, protocell compartmentalization, and the chemistry-to-biology transition.
- Updated `docs/content.md` and marked `Science | Life | The origin of life` as `DONE`.
- Updated `docs/architecture.md` with the latest completion note for this module.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.3.0** (MINOR - content).

## [3.2.0] - 2026-06-27

### Added - authored Science Earth and Universe modules from source transcripts

- Completed `src/content/science/universe/stars-galaxies-and-black-holes/` by replacing placeholders in `module.json`, `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json`.
- Completed `src/content/science/earth/how-earth-formed-and-changed/` by replacing placeholders in `module.json`, `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json`.
- Updated `docs/content.md` and marked both tracker rows as `DONE`:
  - `Science | Universe | Stars, galaxies, and black holes`
  - `Science | Earth | How Earth formed and changed`
- Updated `docs/architecture.md` with completion notes for both modules.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.2.0** (MINOR - content).

## [3.1.0] - 2026-06-27

### Changed - `period` field is now history-only

- Audited all `module.json` files under `src/content/**`.
- Removed `period` from every non-history module so only
  `src/content/history/**/module.json` entries retain `period`.
- Documented the rule in `CLAUDE.md` and `docs/architecture.md`:
  non-history modules should omit `period` and use `context.when` when needed.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.1.0**
  (MINOR - content schema usage normalization across modules).

## [3.0.10] - 2026-06-27

### Changed - README pre-content experience section

- Reworked README guidance from a front-page-only description to a broader
  "before content starts" experience that explains orientation, path selection,
  scope checking, and readiness before entering module stages.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.0.10**
  (PATCH - documentation clarity update).

## [3.0.9] - 2026-06-27

### Changed - README front page experience section

- Updated README with a dedicated "Front page experience" section describing
  how learners enter the app, choose paths from the home screen, and navigate
  categories/modules or the Geography Challenge.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.0.9**
  (PATCH - documentation UX clarification).

## [3.0.8] - 2026-06-27

### Changed - Small country assist button persistence and cycling

- Moved the Geography small-country assist control to `MapViewport`'s
  non-transformed overlay layer so the button remains visible and clickable even
  when the map is heavily zoomed or panned.
- Updated assist behavior so repeated clicks iterate to the **next** country in
  the prioritized target list instead of repeatedly selecting the same one.
- Priority order remains:
  1) unsolved countries in `SMALL_COUNTRY_IDS`
  2) unsolved countries in the rest of the board
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.0.8**
  (PATCH - geography control UX fix).

## [3.0.7] - 2026-06-27

### Added - Small country assist zoom

- Increased map max zoom in `MapViewport` so tiny countries (for example
  Andorra/Monaco) can be inspected and tapped at much higher zoom levels.
- Added programmatic map focusing support to `MapViewport` and integrated it in
  `GeoQuizMap`.
- Added a persistent bottom-left **small country assist** button on country
  boards. On click, it auto-focuses so the target country fills roughly 30% of
  the viewport and keeps surrounding context visible.
- Assist priority now follows:
  1) unsolved countries in `SMALL_COUNTRY_IDS`
  2) otherwise any unsolved country
- Added and exported `SMALL_COUNTRY_IDS` in `geography.ts` as the generated list
  of hard-to-tap small countries within the 193-country UN-aligned dataset.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.0.7**
  (PATCH - geography interaction improvement).

## [3.0.6] - 2026-06-27

### Fixed - Geography country coverage aligned with UN members

- Updated the Geography Challenge country dataset to include **all 193 UN member
  states** across continent boards.
- Added previously missing members (notably microstates and island nations across
  Europe, Africa, North America/Caribbean, Asia, and Oceania).
- Removed non-member entries from country boards so the playable set now matches
  the UN list exactly.
- Updated board country counts/blurbs to reflect the new totals.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.0.6**
  (PATCH - geography data completeness).

## [3.0.5] - 2026-06-27

### Fixed - Country label anchor placement

- Updated Geography Challenge country-label placement to use each country's
  dominant polygon (largest projected polygon) instead of mixing all polygons.
  This prevents labels from drifting to remote islands or overseas parts.
- Added an interior-point solver over the polygon bounds to place labels near the
  most central interior location, reducing cross-border spill (e.g. France over
  Spain) and keeping long-country labels on the main landmass.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.0.5**
  (PATCH - geography label placement fix).

## [3.0.4] - 2026-06-27

### Fixed - Geography labels visible across browsers

- Removed hard SVG clip-path dependency for solved-country labels in the
  Geography Challenge. Labels now use in-country anchor placement + fit/tilt
  logic without a clip-only rendering path that could hide all text in some
  browser/GPU combinations.
- Added a browser-safe baseline alignment tweak for in-country SVG text.
- Reduced pan/zoom blur by snapping viewport translate values to half-pixel
  increments during transform updates.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.0.4**
  (PATCH - geography rendering reliability).

## [3.0.3] - 2026-06-27

### Fixed - Geography runtime label visibility and zoom crispness

- Improved solved-country label placement by probing for an anchor point that is
  actually inside each country polygon before rendering text. This prevents labels
  from disappearing when geometric centroids fall outside narrow or irregular
  shapes.
- Enabled geometric precision rendering for geography SVG text and paths so labels
  and boundaries remain cleaner while zooming.
- Removed an aggressive `will-change: transform` hint from `MapViewport` to avoid
  browser compositor rasterization that could make zoomed map layers look blurry.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.0.3**
  (PATCH - geography runtime rendering fix).

## [3.0.2] - 2026-06-27

### Fixed - Geography map labels and zoom fidelity

- Fixed missing solved-country labels in the Geography Challenge by making
  country clip paths explicitly use user-space coordinates. Labels now render
  reliably inside country shapes after a correct answer.
- Improved in-country label readability by adjusting text contrast and scaling
  the text outline with font size, so small-country labels remain visible.
- Upgraded geography map geometry from `world-atlas` 110m to 50m for both
  country polygons and land backdrop coastlines, improving quality while zooming.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.0.2**
  (PATCH - geography map bugfix + visual quality).

## [3.0.1] - 2026-06-27

### Changed - Geography Challenge country labels stay inside countries

- Replaced the floating HTML country-name pills in the interactive map game with
  SVG labels clipped to each country shape, so solved names no longer cover
  nearby countries and now zoom/pan with the map itself.
- Added per-country label fitting in `GeoQuizMap`: font size now scales down for
  small countries, multi-word names can wrap, and long narrow countries can tilt
  their labels to fit the dominant axis of the shape.
- Norway and similar tall/angled countries can now display their name on an
  angle inside the shape instead of forcing a horizontal overlay across the map.
- Bumped `version.js`, `package.json`, and `package-lock.json` to **3.0.1**
  (PATCH - geography UI fix).

## [3.0.0] - 2026-06-26

### Added - Geography Challenge (interactive map game)

A brand-new **type** of interactive learning, separate from the five module
stages: a click-and-name geography game built on the same map theme.

- **Pick a board** at `/geo`: a continent (Europe, Asia, Africa, North America,
  South America, Oceania) where you name **every** country, or **Oceans & Seas**
  (18 of the world's major waters).
- **Play**: tap a country on the real Natural Earth map and type its name. Answers
  are accepted at **ÔëÑ80% similarity** (normalized Levenshtein distance, with a
  one-typo grace), so near-misses and minor misspellings still count. Solved
  regions stay **highlighted and labelled** for the rest of the session.
- **Hints**: reveal the **starting letter** (progressively, one letter per tap), or
  **show 4 options** - the correct answer plus its three geographically nearest
  neighbours.
- **Zoom & fullscreen**: the game reuses `MapViewport`, so pinch / scroll / wheel
  zoom, drag-to-pan, double-tap, and an immersive fullscreen all work - and you can
  answer while fullscreen via a floating answer bar.
- **Progress** is saved per board in `localStorage` (`origin:geo:v1`); a reset
  button clears a board.

#### Implementation
- New data + logic libs: [`geography.ts`](../src/lib/geography.ts) (curated,
  double-checked country lists per continent with answer aliases, seas, scoring,
  and nearest-neighbour alternatives) and [`countryShapes.ts`](../src/lib/countryShapes.ts)
  (decodes `world-atlas` **countries-110m** into per-country polygons + centroids).
- New components under `src/components/geo/`: `GeographyHome`, `GeographyGame`,
  `GeoQuizMap`, `AnswerPanel`; lightweight `geoProgress.ts` store.
- `MapViewport` gained two **backward-compatible** props: `onTap` (reports a clean
  tap as normalized content coordinates, so the game can hit-test which country
  was clicked through any pan/zoom) and `renderOverlay` (a non-transformed layer
  used for the fullscreen answer bar).
- Routes `/geo` and `/geo/:board` are **lazy-loaded** so the country topology and
  d3-geo only load when a learner opens a map - ordinary lessons are unaffected.
- Home screen gains a "Geography Challenge" entry card.
- Bumped `version.js` and synced `package.json` to **3.0.0** (MAJOR - new app
  capability).

## [2.2.0] - 2026-06-26

### Added - Rise of Nazi Germany & World War II modules (history / world-wars)
- Authored two full modules from the shared source transcript, replacing the
  placeholder JSON in `rise-of-nazi-germany/` and `world-war-ii/`. The transcript
  covered both topics with overlap; the lead-up (Versailles ÔåÆ 1939) went to *Rise
  of Nazi Germany* and the conflict itself (1939 ÔåÆ 1945) to *World War II*.
- **Rise of Nazi Germany** - geographic context map (Germany, Rhineland, Austria,
  Czechoslovakia, Poland) tracing the steps of expansion. 28 story cards: a
  defeated Germany & Versailles, the Weimar collapse and hyperinflation, Hitler's
  rise to dictatorship, secret then open rearmament, the impotence of the League
  (Japan, Italy, Spain), appeasement, and the road to war (Anschluss ÔåÆ Munich ÔåÆ
  Czechoslovakia ÔåÆ Nazi-Soviet Pact ÔåÆ Poland). 12 timeline milestones, 8 quiz
  questions, 10 flashcards.
- **World War II** - geographic context map (Germany, Poland, France, Britain,
  Stalingrad). 30 story cards across the war's arc: Blitzkrieg and Poland, the
  Phoney War and Winter War, the fall of France and Dunkirk, the Battle of Britain
  and the Blitz, Operation Barbarossa and Stalingrad, Pearl Harbor and the global
  war, D-Day, the fall of the Reich, the atomic bombs, a brief pointer to the
  Holocaust (its own module), and the reckoning. 11 timeline milestones, 8 quiz
  questions, 10 flashcards.
- Marked both modules **DONE** in [`content.md`](content.md). Scope kept distinct
  from the neighbouring *The Holocaust* and *Post-war world order* modules.
- Bumped `version.js` and synced `package.json` to **2.2.0** (MINOR - content).

## [2.1.0] - 2026-06-26

### Added - World War I module (history / world-wars)
- Authored the full **World War I** module from the source transcript, replacing
  the placeholder JSON in `src/content/history/world-wars/world-war-i/`.
- **module.json** - geographic context map (Germany, Western Front, Eastern Front,
  Sarajevo, Gallipoli) framing the two-front war and the Schlieffen gamble.
- **story.json** - 35 cards across five arcs: the war begins (1914), stalemate &
  the widening global war (1914-15), the year of attrition (1916), the crisis year
  (1917 - US entry, Russian Revolution), and the end & Versailles (1918-19).
- **timeline.json** - 12 milestones; **quiz.json** - 8 understanding-focused
  questions (multiple-choice, true/false, ordering, matching); **flashcards.json** -
  10 key terms, people, and cause/effect cards.
- Marked World War I as **DONE** in [`content.md`](content.md). Scope kept distinct
  from the neighbouring *Causes of World War I* module (the lead-up), which remains.
- Synced `package.json` version back to the `version.js` source of truth.

## [2.0.0] - 2026-06-26

### Files
- Added `src/components/module/mapLayout.ts` (the placement engine). `mapParts.tsx`
  gained `ArcLabel` + `LeaderLine`; `ConnectionArc` now draws only the arc.

### Changed - real cartographic context maps (replaces the abstract "blob" map)
- **Completely revamped the context map.** The old map drew three hardcoded
  ellipse "landmasses" that were identical for every module - Rome, psychology,
  and data-engineering all showed the same fake continents. It is gone.
- The map now has **two honest modes**, chosen automatically per module:
  - **`geo`** - when every marker carries real `lat`/`lng`, the map renders the
    **actual coastlines** (Natural Earth land via `world-atlas` + `d3-geo`),
    projected (Mercator) and auto-framed to the markers. A continent looks like
    a continent and every marker sits at its true location.
  - **`schematic`** - when markers lack coordinates (non-geographic topics like
    psychology or political concepts, and legacy/placeholder data), the map
    renders an intentional node-and-link **concept diagram** on a soft dotted
    field. No fake geography.
- New content schema: markers accept `lat`/`lng` (degrees); `x`/`y` (0-100 %)
  are now the schematic fallback. Optional `map.focus` `[west, south, east,
  north]` overrides the auto-frame. See the **Maps** section in `CLAUDE.md`.
- Migrated the authored geographic modules to real coordinates: Rise of the
  Roman Empire, the three Atlantic-world modules, A Nation Divided, Israel and
  Palestine, and the four Norway modules.
- New deps: `d3-geo`, `topojson-client`, `world-atlas`. The geo renderer is
  lazy-loaded (~32 KB gzipped) so schematic-only modules stay lightweight; the
  land data is bundled, so maps work offline.

### Added - interactive maps: zoom, pan & fullscreen
- **Tighter default framing.** Geo maps now frame *tightly* to their markers so
  the markers spread out and fill the majority of the canvas instead of sitting
  as a small cluster in the middle. A map of locations in Norway now zooms into
  Norway rather than showing half of Europe. (Implemented by fitting the
  projection to the markers' own bounds with label-aware margins, plus a small
  min-span guard for single/clustered markers.)
- **Pinch-to-zoom and drag-to-pan**, by finger or mouse, on **every** map and in
  **both** inline and fullscreen views. Mouse-wheel zoom and double-click/tap to
  toggle zoom are also supported. The view never zooms out past the fitted
  baseline, and panning is clamped so the map can't be dragged off-screen.
- **Fullscreen mode** via a button on each map, with a clear leave button (and
  Escape / body-scroll-lock handling). Opening fullscreen resets the view.
- Marker labels now flip below the dot near the top edge so the tighter framing
  never clips them.

### Fixed - map labels no longer overlap
- Map text used to pile up in dense maps (e.g. Israel/Palestine, Norway). Added a
  greedy **label de-collision** pass (`mapLayout.ts`): every label - both the
  place-name pills and the connection labels - is placed so it doesn't overlap
  other labels or the marker dots.
- When a label can't stay in its natural spot (a pill above its dot, a connection
  label on its arc), it's **moved to the nearest free position and a subtle,
  theme-matched leader line** (thin amber/muted connector) is drawn back to the
  marker / arc it belongs to. Well-spaced maps are unaffected - labels stay put
  with no leaders.
- Marker labels are placed first (they name the places, so they win the prime
  spots); connection labels route around them.

### Files
- Added `src/components/module/MapViewport.tsx` (the shared pan/zoom/fullscreen
  frame). `GeoMap`/`SchematicMap` now render their content inside it.

### Files
- Added `src/lib/geo.ts`, `src/components/module/GeoMap.tsx`,
  `SchematicMap.tsx`, `mapParts.tsx`. `ContextMap.tsx` is now a thin dispatcher.

## [1.26.1] - 2026-06-26

### Fixed
- Hide `period` label on module cards when the value is descriptive text rather than an actual time period (Politics and Psychology modules). Period is now only shown when the value contains a year/digit.

## [1.26.0] - 2026-06-26

### Added - new Technology ÔåÆ Data Engineering category: 8 Databricks modules
- Created a new top-level **Technology** category with a **Data Engineering** subcategory
  (auto-discovered by the content registry; no code changes needed).
- Authored eight complete modules - `module.json`, `story.json`, `timeline.json`, `quiz.json`,
  and `flashcards.json` each - that teach the Databricks / data-engineering story as one
  connected arc:
  - `the-data-problem`
  - `why-traditional-databases-struggled`
  - `the-rise-of-big-data`
  - `apache-spark-appears`
  - `databricks-makes-spark-easier`
  - `the-lakehouse-idea`
  - `delta-lake-solves-reliability-problems`
  - `how-companies-use-databricks-today`
- Built from `docs/databricks-research.md` (compiled from the official Azure Databricks
  documentation). Each module ends on a curiosity hook leading into the next, and uses
  stage-aligned timelines that advance as the learner scrolls.
- Updated `docs/content.md` and marked all eight Technology rows as `DONE`.
- Updated `docs/architecture.md` with a completion note.

## [1.25.0] - 2026-06-25

### Added - authored Politics Global Politics module from source transcript
- Completed `src/content/politics/global-politics/geopolitics-why-geography-matters/` by replacing placeholders in all five content files:
  - `module.json`
  - `story.json`
  - `timeline.json`
  - `quiz.json`
  - `flashcards.json`
- Built a complete learning flow from `raw.md` focused on geopolitical fundamentals, the Great Game, Heartland and Rimland theories, Cold War containment, and modern hotspot competition.
- Updated `docs/content.md` and marked `Politics | Global Politics | Geopolitics: Why Geography Matters` as `DONE`.
- Updated `docs/architecture.md` with the latest completion note for this module.

## [1.24.0] - 2026-06-25

### Added - authored Psychology Learning module from source transcript
- Completed `src/content/psychology/learning/memory-and-learning/` by replacing placeholders in all five content files:
  - `module.json`
  - `story.json`
  - `timeline.json`
  - `quiz.json`
  - `flashcards.json`
- Built a full learning flow from `raw.md` focused on active recall, visual encoding, structured memorization, consumption-vs-digestion balance, and the PACER processing model.
- Updated `docs/content.md` and marked `Psychology | Learning | Memory and Learning` as `DONE`.
- Updated `docs/architecture.md` with the latest completion note for this module.

## [1.23.1] - 2026-06-25

### Added - module search on the Home screen
- Added a search field to the Home screen. Typing filters across all published modules
  by title, summary, category, subcategory, and period; matching modules render as
  cards that deep-link straight into the module (bypassing the category picker).
- Empty query shows the category picker as before; a clear button and a
  "browse by category" fallback reset the search.
- Added `searchModules(query)` to the content registry (src/lib/content.ts), with
  simple ranking (title matches first, then alphabetical).

## [1.23.0] - 2026-06-25

### Added - Ottoman Empire tracker entries
- Updated `docs/content.md` with three new History rows:
  - `Medieval World | Rise of the Ottoman Empire | 1299 CE - 1453 CE`
  - `Ottoman Empire | The Ottoman Empire at its height | 1453 CE - 1700s`
  - `Ottoman Empire | Decline and collapse of the Ottoman Empire | 1700s - 1922 CE`

## [1.22.0] - 2026-06-25

### Added - authored Psychology Communication module from source transcript
- Completed `src/content/psychology/communication/communicate-with-confidence/` by replacing placeholders in all five content files:
  - `module.json`
  - `story.json`
  - `timeline.json`
  - `quiz.json`
  - `flashcards.json`
- Built a complete learning flow from `raw.md` focused on confident speaking under pressure, concise delivery, conflict framing, conversational goals and values, and boundary language.
- Updated `docs/content.md` and marked `Psychology | Communication | Communicate with Confidence` as `DONE`.
- Updated `docs/architecture.md` with the latest completion note for this module.

## [1.21.0] - 2026-06-25

### Added - authored Psychology Communication module from source transcript
- Completed `src/content/psychology/communication/dealing-with-difficult-people/` by replacing placeholders in all five content files:
  - `module.json`
  - `story.json`
  - `timeline.json`
  - `quiz.json`
  - `flashcards.json`
- Built a complete learning flow from `raw.md` focused on stress reactivity in conflict, labeling bias, and the behavioral intelligence model (explain, predict, influence, control).
- Updated `docs/content.md` and marked `Psychology | Communication | Dealing with Difficult People` as `DONE`.
- Updated `docs/architecture.md` with the latest completion note for this module.

## [1.20.0] - 2026-06-25

### Changed - removed duplicate Politics foundations scaffold
- Deleted duplicate folder `src/content/politics/foundations/political-spectrum-left-right-libertarian-and-authoritarian/`.
- Kept the existing authored module in `src/content/politics/foundations/left-vs-right-the-political-spectrum/`, whose title already covers "Political Spectrum: Left, Right, Libertarian, and Authoritarian".

## [1.19.0] - 2026-06-25

### Added - latest content placeholder scaffolding
- Added missing placeholder scaffold for `src/content/psychology/communication/dealing-with-difficult-people/` with:
  - `module.json`
  - `story.json`
  - `timeline.json`
  - `quiz.json`
  - `flashcards.json`
- Added missing placeholder scaffold for `src/content/politics/foundations/political-spectrum-left-right-libertarian-and-authoritarian/` with:
  - `module.json`
  - `story.json`
  - `timeline.json`
  - `quiz.json`
  - `flashcards.json`

## [1.18.0] - 2026-06-25

### Added - authored Psychology Communication module from raw source
- Completed `src/content/psychology/communication/becoming-a-better-conversationalist/` by replacing placeholders in all five content files:
  - `module.json`
  - `story.json`
  - `timeline.json`
  - `quiz.json`
  - `flashcards.json`
- Built a complete learning flow from `raw.md` focused on moving from small talk to deep connection through open-ended questions, emotional cue tracking, story-based dialogue, engaged listening, psychological safety, and shared reality.
- Updated `docs/content.md` and marked `Psychology | Communication | Becoming a Better Conversationalist` as `DONE`.
- Updated `docs/architecture.md` with a latest completion note for this authored module.

## [1.17.0] - 2026-06-25

### Added - authored Psychology Communication module from raw source
- Completed `src/content/psychology/communication/understanding-other-people/` by replacing placeholders in all five content files:
  - `module.json`
  - `story.json`
  - `timeline.json`
  - `quiz.json`
  - `flashcards.json`
- Generated a full understanding-first learning flow from `raw.md`, including context model, multi-card narrative, major milestones, mixed quiz types, and retention-focused flashcards.
- Updated `docs/content.md` and marked `Psychology | Communication | Understanding Other People` as `DONE`.
- Updated `docs/architecture.md` with a module-completion workflow note for setting tracker status after full authoring.

## [1.16.0] - 2026-06-25

### Added - authored source draft for Psychology Communication module
- Replaced `src/content/psychology/communication/understanding-other-people/raw.md` with a complete, structured source draft for module authoring.
- Organized the material around shared human motives, empathy boundaries, attribution bias, practical listening tools, and modern relevance.
- Added a suggested chapter arc and key terms to support follow-up generation of `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json`.

## [1.15.2] - 2026-06-25

### Changed - concise communication tracker context text
- Shortened the `Era/Context` (4th column) text for the six `Psychology | Communication` rows in `docs/content.md`.
- Kept table structure and status values unchanged while making the section more compact and readable.

## [1.15.1] - 2026-06-25

### Changed - content tracker table normalization
- Fixed malformed bottom rows in `docs/content.md` under `Psychology | Communication`.
- Removed keyword-list values from the final table column and restored the tracker's expected `Status` format (`------`) so the section conforms to the 5-column table structure.

## [1.15.0] - 2026-06-25

### Added - Psychology Communication placeholder scaffolding
- Added a new subcategory scaffold under `src/content/psychology/communication/` to match the tracker rows from line 115 downward in `docs/content.md`.
- Created 6 module folders with full placeholder file sets (`module.json`, `story.json`, `timeline.json`, `quiz.json`, `flashcards.json`):
  - `how-human-communication-works`
  - `understanding-other-people`
  - `becoming-a-better-conversationalist`
  - `helping-people-through-difficult-situations`
  - `handling-conflict-and-difficult-conversations`
  - `persuasion-and-influence`
- Preserved existing content modules and only added missing scaffolds.

## [1.14.0] - 2026-06-25

### Added - authored Social Psychology modules from source transcripts
- Completed `src/content/psychology/social-psychology/how-people-influence-each-other/` by replacing remaining placeholders in `timeline.json`, `quiz.json`, and `flashcards.json` to match the already-authored `module.json` and `story.json`.
- Completed `src/content/psychology/social-psychology/human-relationships-and-social-bonds/` by replacing placeholders in all five content files: `module.json`, `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json`.
- Structured both modules around understanding-focused progression, major conceptual milestones, mixed quiz types (multiple-choice, true-false, ordering, matching), and retention-focused flashcards.
- Updated `docs/content.md` to mark both modules as `DONE`.

## [1.13.0] - 2026-06-25

### Added - authored Psychology Emotions module
- Replaced placeholder files in `src/content/psychology/emotions/emotional-regulation/` with complete authored content generated from `raw.md`.
- Added a full `module.json` context model centered on arousal, valence, and interoception-exteroception balance, with development and neurobiology links.
- Wrote a 13-card `story.json` that progresses from emotional-state fundamentals to early attachment, puberty rewiring, bond chemistry, and practical regulation tools.
- Rebuilt `timeline.json` with conceptual milestones and aligned all story-card `timeline` values to those milestones.
- Replaced `quiz.json` with understanding-focused questions across multiple-choice, true-false, ordering, and matching.
- Replaced `flashcards.json` with key concept recall cards on emotional mapping, attachment, hormonal signaling, and regulation tactics.
- Updated `docs/content.md` to mark `Emotional Regulation` as `DONE`.

## [1.12.0] - 2026-06-25

### Changed - Psychology scaffold synced to updated module list
- Synchronized `src/content/psychology/` folders and placeholder files with the revised Psychology rows in `docs/content.md`.
- Added missing module scaffolds to match newly introduced/renamed modules, including:
  - `personality-traits-and-models`
  - `understanding-emotions`
  - `emotional-regulation`
  - `memory-and-learning`
  - `self-control-and-procrastination`
  - `problem-solving-and-creativity`
  - `confidence-identity-and-self-image`
  - `personal-growth-and-change`
  - `stress-and-coping`
  - `anxiety-and-fear`
  - `depression-and-mood`
- Removed obsolete Psychology placeholder module folders that were no longer present in the updated tracker list.
- Final Psychology structure now contains 21 module folders, each with `module.json`, `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json` placeholders.

## [1.11.0] - 2026-06-25

### Added - Psychology placeholder scaffolding
- Added a new category scaffold under `src/content/psychology/` with subcategories:
  - `foundations`
  - `personality`
  - `social-psychology`
  - `emotions`
  - `learning`
  - `motivation`
  - `self-development`
  - `human-behavior`
  - `mental-health`
- Created 17 module folders with full placeholder file sets (`module.json`, `story.json`, `timeline.json`, `quiz.json`, `flashcards.json`) following the existing project schema.
- Added/normalized Psychology rows in `docs/content.md` to include explicit `Status` placeholders (`------`) so all rows match the tracker table format.

## [1.10.2] - 2026-06-25

### Changed - category-first Home navigation
- Restructured the Home screen into a two-step flow: the user now first picks a category,
  then sees that category's modules. Previously every category, subcategory, and module
  was flattened into one long scroll.
- `/` (`HomeScreen`) is now a category picker (`CategoryCard` grid); a new `/c/:cat`
  route (`CategoryScreen`) lists one category's modules grouped by subcategory, with an
  "ÔåÉ All categories" back link.
- Added `getCategory(slug)` to the content registry (`src/lib/content.ts`).
- Leaving a module now returns to its category (`/c/:cat`) instead of the Home picker,
  keeping the browsing context.

## [1.10.1] - 2026-06-25

### Changed - hide unfinished placeholder modules from the user
- The content registry (`src/lib/content.ts`) now skips any module whose `module.json`
  title is prefixed with `PLACEHOLDER:` (the scaffolding marker). Placeholder modules no
  longer appear in the Home listings, the module count, or via a direct URL - only
  authored modules are visible.
- Data-driven and zero-touch: authoring a placeholder (replacing its title with a real
  one) publishes the module automatically, with no code change - consistent with the
  "drop a folder, no code changes" workflow.
- Currently surfaces the 12 authored modules and hides the 79 placeholder scaffolds.

## [1.10.0] - 2026-06-25

### Added - authored The Modern World global-conflicts module
- Replaced placeholder files in `src/content/the-modern-world/global-conflicts/israel-and-palestine/` with complete authored content generated from `raw.md`.
- Added a balanced `module.json` context map and framing that distinguishes historical facts, interpretations, and political claims.
- Wrote a 27-card `story.json` in chaptered progression from late Ottoman background to contemporary war and unresolved final-status issues.
- Rebuilt `timeline.json` with major milestones and aligned story `timeline` values to those milestone labels.
- Replaced `quiz.json` with understanding-focused questions across multiple-choice, true-false, ordering, and matching.
- Replaced `flashcards.json` with neutral key concept cards focused on causation, terminology, and unresolved issues.
- Updated `docs/content.md` to mark `Israel and Palestine` as `DONE`.

## [1.9.0] - 2026-06-25

### Added - The Modern World placeholder scaffolding
- Added a new category scaffold under `src/content/the-modern-world/` with subcategories:
  - `technology`
  - `global-conflicts`
  - `society`
  - `economy`
  - `environment`
  - `international-relations`
- Created 12 module folders with full placeholder file sets (`module.json`, `story.json`, `timeline.json`, `quiz.json`, `flashcards.json`) mirroring the existing project placeholder schema.
- Added/normalized `docs/content.md` rows for the new section to include explicit `Status` placeholders (`------`) so all rows match the tracker table format.

## [1.8.0] - 2026-06-25

### Added - authored Politics Foundations spectrum module
- Replaced placeholder files in `src/content/politics/foundations/left-vs-right-the-political-spectrum/` with complete authored content generated from `raw.md`.
- Added a foundations-first `module.json` context using a schematic map that combines the left-right axis with the authoritarian-libertarian axis.
- Wrote a 12-card `story.json` explaining the origin of left/right labels, modern policy differences, the limits of one-dimensional labeling, and practical policy-based evaluation.
- Rebuilt `timeline.json` with conceptual milestones and aligned all story-card `timeline` values to those milestones.
- Replaced `quiz.json` with understanding-focused questions across multiple-choice, true-false, ordering, and matching.
- Replaced `flashcards.json` with key concept recall cards for spectrum literacy and common misconceptions.
- Updated `docs/content.md` to mark the module as `DONE`.

## [1.7.0] - 2026-06-25

### Added - authored Politics Foundations module
- Replaced placeholder files in `src/content/politics/foundations/political-ideologies-explained/` with complete authored content generated from `raw.md`.
- Added a foundations-first `module.json` context using a schematic map of core ideology tensions (freedom, equality, tradition, state power, and national identity).
- Wrote a 12-card `story.json` focused on conceptual understanding of major ideologies (conservatism, liberalism, socialism, communism, fascism, anarchism, libertarianism, nationalism, populism, feminism, environmentalism) without turning the module into a historical deep dive.
- Rebuilt `timeline.json` as conceptual milestones and aligned all story-card `timeline` values to those milestones.
- Replaced `quiz.json` with understanding-focused questions using multiple-choice, true-false, ordering, and matching formats.
- Replaced `flashcards.json` with key concept recall cards for foundational retention.
- Updated `docs/content.md` to mark `Political Ideologies Explained` as `DONE`.

## [1.6.0] - 2026-06-25

### Added - Politics module scaffolding
- Added new placeholder module scaffolds under `src/content/politics/` to match the new rows in `docs/content.md`.
- Created two subcategories with full module folder structures and placeholder files (`module.json`, `story.json`, `timeline.json`, `quiz.json`, `flashcards.json`):
  - `foundations`: `political-ideologies-explained`, `left-vs-right-the-political-spectrum`, `democracy-and-dictatorship`, `constitutions-and-rule-of-law`, `states-and-governments`
  - `global-politics`: `geopolitics-why-geography-matters`, `the-united-nations-and-world-order`
- Updated `docs/content.md` table rows for Politics to include explicit `Status` values (`------`) so all rows match the tracker schema.

## [1.5.1] - 2026-06-25

### Changed - content tracker readability
- Reformatted `docs/content.md` for easier scanning by normalizing table spacing and adding a clear section title.
- Standardized the Markdown table separator row for cleaner rendering in editors and previews.

## [1.5.0] - 2026-06-25

### Added - Norway country-history modules (authored from source transcript)
- Replaced the Norway placeholder state by creating four complete modules under `src/content/country-history/norway/` authored from `raw.md`.
- Added full learning bundles for each Norway submodule, each with `module.json`, `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json`:
  - `origins-to-viking-age` (14000 BCE - 1066 CE)
  - `christianization-and-medieval-kingdom` (933 CE - 1319 CE)
  - `plague-union-and-danish-rule` (1319 CE - 1814 CE)
  - `modern-norway-independence-to-oil-age` (1814 CE - present)
- Structured content chronologically with clear cause-and-effect progression across environmental origins, Viking expansion, Christian state formation, plague-era decline, Danish subordination, constitutional nationalism, and modern welfare/oil governance.
- Added understanding-focused quiz sets (multiple-choice, true-false, ordering, matching) and retention-oriented flashcards for every submodule.
- Updated `docs/content.md` to mark all Norway submodules as `DONE`.

## [1.4.0] - 2026-06-25

### Added - Colonial Americas module (authored from source transcript)
- Replaced placeholder files in `src/content/history/atlantic-world/colonial-americas/` with full authored content generated from `raw.md`.
- Added a complete context map and module metadata in `module.json`, focused on Iberian origins, Atlantic routes, major colonial zones, and labor-system links.
- Wrote a 13-card `story.json` that covers: trade-route pressures after 1453, Columbus and early settlement, Tordesillas, Portugal in Brazil, Spanish conquests, French and English entry, indigenous experiences, and the shift toward Atlantic forced labor.
- Rebuilt `timeline.json` with major progression anchors (`1453`, `1492`, `1494`, `1500`, `1519-1533`, `1534-1565`, `1585-1600s`) and aligned story-card timeline labels to those values.
- Replaced `quiz.json` with understanding-focused questions across multiple-choice, true-false, ordering, and matching.
- Replaced `flashcards.json` with retention-focused cards on causes, turning points, imperial patterns, and consequences.
- Marked `Colonial Americas` as `DONE` in `docs/content.md`.

## [1.3.0] - 2026-06-25

### Added - full History module placeholder scaffolding
- Ensured every module listed in `docs/content.md` under `History` has a dedicated folder path at:
  `src/content/history/<subcategory-slug>/<module-slug>/`.
- Created scaffold files in each module folder to mirror the `transatlantic-slave-trade` file set (excluding `raw.md`):
  `module.json`, `story.json`, `timeline.json`, `quiz.json`, and `flashcards.json`.
- Filled generated files with explicit placeholder content so AI/content workflows can clearly identify and replace placeholder data.
- Preserved existing authored modules and files by creating missing scaffold files without overwriting existing content.

## [1.2.0] - 2026-06-25

### Added - Slavery in the Americas module (authored from source transcript)
- Replaced placeholder files in `src/content/history/atlantic-world/slavery-in-the-americas/` with full authored content generated from `raw.md`.
- Added a complete context map and metadata in `module.json` focused on regional links between the Deep South, Upper South, North, Atlantic trade, and Canada escape routes.
- Wrote a 12-card `story.json` covering: national economic integration, social structure, proslavery ideology, legal coercion, lived conditions, everyday resistance, escape networks, rebellions, backlash, and emancipation.
- Rebuilt `timeline.json` as major mental anchors (`1619`, `1800s`, `1800-1831`, `1831`, `1837`, `1860`, `1865`) and aligned story-card timeline references to those values.
- Replaced `quiz.json` with understanding-focused questions across multiple-choice, true-false, ordering, and matching.
- Replaced `flashcards.json` with core concept recall cards on system structure, resistance, ideology, and outcomes.
- Marked `Slavery in the Americas` as `DONE` in `docs/content.md`.

## [1.1.1] - 2026-06-25

### Changed - Copilot workspace instructions
- Added `.github/copilot-instructions.md` and pointed it directly to `CLAUDE.md` as the project instruction source for Copilot behavior in this repository.

## [1.1.0] - 2026-06-25

### Added - Transatlantic Slave Trade module (authored content)
- Replaced the placeholder JSON under
  `src/content/history/atlantic-world/transatlantic-slave-trade/` with a full module
  authored from the source transcript (`raw.md`).
- **Story** (11 cards) follows the transcript's core thesis - the trade as an
  *engineered, financed supply chain* - from slavery's ancient/global roots, through the
  religious (not racial) fault line, the American labor shortage, coastal "factories",
  Britain's and Liverpool's dominance, the triangular trade and Middle Passage, the
  syndicate/Lloyd's/Bank of England financing, the Zong massacre, and abolition (1807
  trade ban ÔåÆ 1833 emancipation and its lasting legacy).
- **Timeline** reduced to six matched milestones (Pre-1500, 1526, 1700s, 1781, 1807,
  1833); every story-card `timeline` value matches a timeline `year` exactly.
- **Quiz** rewritten as understanding-focused questions (cause/effect, the Zong's
  significance, chronological ordering, supply-chain role matching) across all four types.
- **Flashcards** (8) cover Middle Passage, triangular trade, demand drivers, factories,
  financing, the Zong, and the 1807-vs-1833 distinction.
- `module.json` (triangle context map) retained - it was already accurate.

## [1.0.1] - 2026-06-25

### Changed - content authoring workflow docs
- Filled in `docs/content-instructions.md` with a technical output contract: it now maps
  the pedagogical steps to the exact JSON files and schema the engine consumes
  (`module.json` map markers/connections with %-based coordinates, story `next`/`timeline`
  rules, the BCE timeline-matching gotcha, quiz type shapes, `raw.md` source convention,
  and the validate + version-bump steps).
- Aligns with the new CLAUDE.md ".txt ÔåÆ module" workflow and `docs/architecture.md`.

## [1.0.0] - 2026-06-25

### Added - initial learning engine
- Project scaffolding: Vite + React 19 + TypeScript + Tailwind CSS v4 + React Router v7.
- Versioning + changelog workflow (`version.js`, `CLAUDE.md`, this file).
- **Content architecture**: `src/content/<category>/<subcategory>/<module>/*.json`,
  auto-discovered by a content registry (`src/lib/content.ts`) via `import.meta.glob` -
  new modules are added by dropping in a folder, no code changes required.
- **Data model** (`src/types/content.ts`) for modules, story cards, timeline events,
  quiz questions (multiple-choice / true-false / ordering / matching) and flashcards.
- **Screens & components**:
  - Mobile phone-frame app shell.
  - Home screen + module selection grouped by category / subcategory.
  - Module introduction with a stylized **context map** (highlighted regions + routes).
  - Vertical **story feed** with scroll-snap and curiosity hooks.
  - **Persistent timeline** that tracks the active story card.
  - **Quiz** engine supporting all four question types, with explanations + scoring.
  - **Flashcards** with 3D flip and a known/review pile.
  - Per-module **progress tracking** in localStorage.
- **Demo content** (placeholder, not authoritative): three modules under *History*
  (Atlantic World, The American Civil War, The Roman Empire) to exercise the engine.

