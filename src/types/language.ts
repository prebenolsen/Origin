/**
 * Origin — Languages domain data model.
 *
 * The Languages domain is chapter-driven and personalized, so it does NOT reuse
 * the static `module.json` history shape. Instead, a language is described by a
 * small set of JSON files under `src/content/languages/<lang>/`:
 *
 *   languages/spanish/
 *     language.json                     → Language (meta + chapters)
 *     chapters/<slug>/module.json        → Module (meta)
 *     chapters/<slug>/lesson.json        → Lesson (context/explanation/phrases)
 *     chapters/<slug>/vocabulary.json    → VocabItem[]   (the word list)
 *     chapters/<slug>/personalize.json   → Personalize   (optional)
 *
 * These are auto-discovered by `src/lib/language/content.ts` with
 * `import.meta.glob`, exactly like the history content registry — drop a folder
 * in, no code changes needed.
 *
 * The learner's *state* (chosen chapter, personalized word picks, and the
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
  /** Chapters the learner can pick from (the first is "Visiting Spain"). */
  chapters: Chapter[];
}

export interface Chapter {
  /** Slug, e.g. `visiting-spain`. */
  slug: string;
  title: string;
  summary: string;
  icon?: string;
  /** `false` renders the chapter as "coming soon" and disables selection. */
  available: boolean;
  /** Ordered module slugs that make up this chapter. */
  modules: string[];
}

/* -------------------------------- module.json ---------------------------- */

export type ModuleKind =
  /** Fixed, fully authored lesson (e.g. Greetings). */
  | 'standard'
  /** Asks the learner what's relevant to them, then teaches only that. */
  | 'personalized'
  /** Scaffolding only — awaiting an authored word list. Hidden from learners. */
  | 'placeholder';

export interface Module {
  slug: string;
  title: string;
  summary: string;
  /** Emoji shown on the chapter. */
  icon?: string;
  kind: ModuleKind;
  /** Rough time-to-complete in minutes (display only). */
  estMinutes?: number;
}

/* ------------------------------ vocabulary.json ------------------------- */

/**
 * A single word/translation pair. This is also the unit the review system
 * tracks. To author a category, an editor only needs to fill in `en`/`es`
 * (and optionally `category`) — see the placeholder modules for the template.
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

/* ------------------------------ sentences.json -------------------------- */

/**
 * A full sentence the learner assembles from a word bank (the `build-sentence`
 * exercise). `es` is the correct sentence; its tokens are derived by splitting
 * on spaces. `distractors` are extra wrong tiles (wrong gender, wrong ending)
 * mixed into the bank so the exercise tests understanding, not just unscrambling.
 *
 * Every token in `es` should be a word the learner has already met (or a proper
 * noun); the exercise is for *combining* known words, not teaching new ones.
 */
export interface Sentence {
  /** English prompt shown above the bank, e.g. `I like coffee but not tea`. */
  en: string;
  /** The target Spanish sentence, e.g. `me gusta el cafe pero no me gusta el te`. */
  es: string;
  /** Optional extra wrong tiles added to the bank. */
  distractors?: string[];
  /** Optional alternate accepted answers for production-style scoring. */
  acceptable?: string[];
  /** Optional key concepts this sentence is designed to test. */
  concepts?: string[];
  /** Optional required chunks/words that must appear for full credit. */
  required?: string[];
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
  /** Optional reusable scoring rubric for sentence-production modules. */
  answerEvaluation?: AnswerEvaluationConfig;
}

export interface AnswerEvaluationWeights {
  /** Percentage weight for preserving core message. */
  meaningCoverage: number;
  /** Percentage weight for required chunks/words. */
  requiredVocabulary: number;
  /** Percentage weight for key grammar patterns. */
  grammarPatterns: number;
  /** Percentage weight for spelling tolerance. */
  spellingTypos: number;
}

export interface AnswerEvaluationConfig {
  /** Deterministic means no model inference; pure rule scoring. */
  deterministic: boolean;
  weights: AnswerEvaluationWeights;
  /** Human-readable accepted tolerance notes for authors/UI. */
  allow?: string[];
  /** Human-readable hard-fail criteria for authors/UI. */
  rejectIf?: string[];
  /** Optional authored partial-credit example. */
  partialCreditExample?: {
    answer: string;
    result: 'partial' | 'pass' | 'fail';
    reason: string;
  };
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

export interface ModuleBundle {
  /** `languages/<lang>/<module>` path key. */
  path: string;
  langCode: string;
  module: Module;
  lesson?: Lesson;
  vocabulary: VocabItem[];
  personalize?: Personalize;
  /** Optional sentence-builder drills (the `build-sentence` exercise). */
  sentences?: Sentence[];
}
