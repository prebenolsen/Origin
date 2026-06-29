/**
 * Origin — Languages domain data model.
 *
 * The Languages domain is goal-driven and personalized, so it does NOT reuse
 * the static `module.json` history shape. Instead, a language is described by a
 * small set of JSON files under `src/content/languages/<lang>/`:
 *
 *   languages/spanish/
 *     language.json                      → Language (meta + goals + path)
 *     scenarios/<slug>/scenario.json      → Scenario (meta)
 *     scenarios/<slug>/lesson.json        → Lesson (context/explanation/phrases)
 *     scenarios/<slug>/vocabulary.json    → VocabItem[]   (the word list)
 *     scenarios/<slug>/personalize.json   → Personalize   (optional)
 *
 * These are auto-discovered by `src/lib/language/content.ts` with
 * `import.meta.glob`, exactly like the history content registry — drop a folder
 * in, no code changes needed.
 *
 * The learner's *state* (chosen goal, personalized word picks, and the
 * spaced-repetition memory of every word) lives in localStorage today
 * (mirroring `lib/progress.ts`). The shapes below are intentionally flat so a
 * Supabase backend (tables prefixed `origin_language_spanish`) can persist them
 * later without reshaping. See `docs/language-supabase-schema.md`.
 */

/* ------------------------------- language.json -------------------------- */

export interface Language {
  /** ISO code, e.g. `es`. */
  code: string;
  /** English display name, e.g. `Spanish`. */
  name: string;
  /** Endonym, e.g. `Español`. */
  nativeName: string;
  /** Optional emoji flag. */
  flag?: string;
  /** One-line hook for the landing page. */
  tagline?: string;
  /** Goals the learner can pick from (the first journey is "Visiting Spain"). */
  goals: Goal[];
}

export interface Goal {
  /** Slug, e.g. `visiting-spain`. */
  slug: string;
  title: string;
  summary: string;
  icon?: string;
  /** `false` renders the goal as "coming soon" and disables selection. */
  available: boolean;
  /** Ordered scenario slugs that make up this goal's learning path. */
  scenarios: string[];
}

/* ------------------------------- scenario.json -------------------------- */

export type ScenarioKind =
  /** Fixed, fully authored lesson (e.g. Greetings). */
  | 'standard'
  /** Asks the learner what's relevant to them, then teaches only that. */
  | 'personalized'
  /** Scaffolding only — awaiting an authored word list. Hidden from learners. */
  | 'placeholder';

export interface Scenario {
  slug: string;
  title: string;
  summary: string;
  /** Emoji shown on the path. */
  icon?: string;
  kind: ScenarioKind;
  /** Rough time-to-complete in minutes (display only). */
  estMinutes?: number;
}

/* ------------------------------ vocabulary.json ------------------------- */

/**
 * A single word/translation pair. This is also the unit the review system
 * tracks. To author a category, an editor only needs to fill in `en`/`es`
 * (and optionally `category`) — see the placeholder scenarios for the template.
 */
export interface VocabItem {
  /** English word, e.g. `cucumber`. */
  en: string;
  /** Spanish word, e.g. `pepino`. */
  es: string;
  /** Optional grouping, e.g. `vegetables` (drives smart test distractors). */
  category?: string;
  /** Optional gender/article/usage hint, e.g. `el` / `la` / pronunciation. */
  note?: string;
}

/* -------------------------------- lesson.json --------------------------- */

export interface Phrase {
  en: string;
  es: string;
  /** Optional word-by-word gloss. */
  literal?: string;
  note?: string;
}

export interface LessonExample {
  es: string;
  en: string;
  note?: string;
}

export interface Lesson {
  /** 1. Context — why this matters in the real situation. */
  context: string;
  /** 2. Explanation — the actual teaching. */
  explanation: string;
  /** 3. Examples — worked sentences. */
  examples?: LessonExample[];
  /** Full phrases the learner leaves able to say. */
  phrases?: Phrase[];
}

/* ----------------------------- personalize.json ------------------------- */

export interface VocabOption {
  en: string;
  es: string;
  note?: string;
}

export interface PersonalizeGroup {
  /** Slug, e.g. `vegetables`. */
  category: string;
  /** Display label, e.g. `Vegetables`. */
  label: string;
  options: VocabOption[];
}

export interface Personalize {
  /** The question, e.g. "What do you usually buy?". */
  prompt: string;
  /** Optional explanatory line under the prompt. */
  intro?: string;
  groups: PersonalizeGroup[];
  /**
   * Optional sentence frame the chosen words slot into during practice, e.g.
   * `{ es: "¿Dónde está el/la ___?", en: "Where is the ___?" }`.
   */
  template?: { es: string; en: string };
}

/* --------------------- assembled, in-app representation ----------------- */

export interface ScenarioBundle {
  /** `languages/<lang>/<scenario>` path key. */
  path: string;
  langCode: string;
  scenario: Scenario;
  lesson?: Lesson;
  vocabulary: VocabItem[];
  personalize?: Personalize;
}
