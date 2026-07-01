/**
 * Conversions between the app's local (localStorage) shapes and Supabase rows.
 *
 * The local stores are the source of truth; these mappers only translate for the
 * backend mirror. Timestamps are milliseconds locally (`Date.now()`) and
 * `timestamptz` (ISO strings) in the database.
 */
import type { ModuleProgress } from '../progress';
import type { LanguageProfile } from '../language/profile';
import type { VocabState, ReviewEvent } from '../language/srs';

/** localStorage keys the sync layer mirrors. Kept in one place. */
export const LANG = 'spanish';
export const KEYS = {
  module: 'origin:progress:v1',
  geo: 'origin:geo:v1',
  langProfile: `origin:lang:${LANG}:profile:v1`,
  langVocab: `origin:lang:${LANG}:vocab:v1`,
  /** Watermark: newest review-event `at` (ms) already pushed to the backend. */
  reviewWatermark: 'origin:sync:review-watermark:v1',
} as const;

/** Supabase table names (all prefixed origin_). */
export const TABLES = {
  moduleProgress: 'origin_module_progress',
  geoProgress: 'origin_geo_progress',
  langProfile: 'origin_language_spanish_profile',
  langVocab: 'origin_language_spanish_vocab_state',
  reviewEvent: 'origin_language_spanish_review_event',
} as const;

const iso = (ms: number): string => new Date(ms).toISOString();
const isoOrNull = (ms?: number): string | null => (ms == null ? null : iso(ms));
const ms = (s: string): number => Date.parse(s);
const msOrUndef = (s: string | null): number | undefined =>
  s == null ? undefined : Date.parse(s);

// ---- Module progress -------------------------------------------------------

export interface ModuleProgressRow {
  user_id: string;
  path: string;
  stages: string[];
  quiz_score: number | null;
  updated_at: string;
}

export function moduleRow(
  userId: string,
  path: string,
  p: ModuleProgress,
): ModuleProgressRow {
  return {
    user_id: userId,
    path,
    stages: p.stages,
    quiz_score: p.quizScore ?? null,
    updated_at: iso(p.updated || Date.now()),
  };
}

export function rowToModule(r: ModuleProgressRow): ModuleProgress {
  return {
    stages: (r.stages ?? []) as ModuleProgress['stages'],
    quizScore: r.quiz_score ?? undefined,
    updated: r.updated_at ? ms(r.updated_at) : 0,
  };
}

// ---- Geo progress ----------------------------------------------------------

export interface GeoProgressRow {
  user_id: string;
  board: string;
  solved: string[];
  updated_at: string;
}

export function geoRow(userId: string, board: string, solved: string[]): GeoProgressRow {
  return { user_id: userId, board, solved, updated_at: iso(Date.now()) };
}

// ---- Language profile ------------------------------------------------------

export interface LangProfileRow {
  user_id: string;
  chapter: string | null;
  learner: LanguageProfile['learner'] | null;
  selections: LanguageProfile['selections'];
  completed: string[];
  checkpoints: string[];
  updated_at: string;
}

export function langProfileRow(userId: string, p: LanguageProfile): LangProfileRow {
  return {
    user_id: userId,
    chapter: p.chapter ?? null,
    learner: p.learner ?? null,
    selections: p.selections ?? {},
    completed: p.completed ?? [],
    checkpoints: p.checkpoints ?? [],
    updated_at: iso(Date.now()),
  };
}

export function rowToLangProfile(r: LangProfileRow): LanguageProfile {
  return {
    chapter: r.chapter ?? undefined,
    learner: r.learner ?? undefined,
    selections: r.selections ?? {},
    completed: r.completed ?? [],
    checkpoints: r.checkpoints ?? [],
  };
}

// ---- Vocab state -----------------------------------------------------------

export interface VocabStateRow {
  user_id: string;
  id: string;
  es: string;
  en: string;
  category: string | null;
  module: string;
  introduced_at: string;
  times_seen: number;
  attempts: number;
  correct: number;
  incorrect: number;
  streak: number;
  max_correct_level: number;
  interval_days: number;
  ease: number;
  last_review: string | null;
  last_correct: string | null;
  next_review: string;
  review_history: ReviewEvent[];
  updated_at: string;
}

export function vocabRow(userId: string, s: VocabState): VocabStateRow {
  return {
    user_id: userId,
    id: s.id,
    es: s.es,
    en: s.en,
    category: s.category ?? null,
    module: s.module,
    introduced_at: iso(s.introducedAt),
    times_seen: s.seen,
    attempts: s.attempts,
    correct: s.correct,
    incorrect: s.incorrect,
    streak: s.streak,
    max_correct_level: s.maxCorrectLevel,
    interval_days: s.interval,
    ease: s.ease,
    last_review: isoOrNull(s.lastReview),
    last_correct: isoOrNull(s.lastCorrect),
    next_review: iso(s.nextReview),
    review_history: s.review_history ?? [],
    updated_at: iso(s.lastReview ?? s.introducedAt ?? Date.now()),
  };
}

export function rowToVocab(r: VocabStateRow): VocabState {
  return {
    id: r.id,
    es: r.es,
    en: r.en,
    category: r.category ?? undefined,
    module: r.module,
    introducedAt: ms(r.introduced_at),
    seen: r.times_seen,
    attempts: r.attempts,
    correct: r.correct,
    incorrect: r.incorrect,
    streak: r.streak,
    maxCorrectLevel: r.max_correct_level,
    review_history: r.review_history ?? [],
    lastReview: msOrUndef(r.last_review),
    lastCorrect: msOrUndef(r.last_correct),
    interval: r.interval_days,
    ease: r.ease,
    nextReview: ms(r.next_review),
  };
}

// ---- Review events (append-only log for skills-over-time) -------------------

export interface ReviewEventRow {
  user_id: string;
  vocab_id: string;
  level: number | null;
  correct: boolean;
  at: string;
}

/**
 * Flatten every word's review_history into append-only event rows, keeping only
 * events newer than `sinceMs` (the last-pushed watermark).
 */
export function reviewEventRows(
  userId: string,
  vocab: Record<string, VocabState>,
  sinceMs: number,
): { rows: ReviewEventRow[]; maxAt: number } {
  const rows: ReviewEventRow[] = [];
  let maxAt = sinceMs;
  for (const s of Object.values(vocab)) {
    for (const ev of s.review_history ?? []) {
      if (ev.at > sinceMs) {
        rows.push({
          user_id: userId,
          vocab_id: s.id,
          level: ev.level ?? null,
          correct: ev.correct,
          at: iso(ev.at),
        });
      }
      if (ev.at > maxAt) maxAt = ev.at;
    }
  }
  return { rows, maxAt };
}
