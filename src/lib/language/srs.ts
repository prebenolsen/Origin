/**
 * Vocabulary memory & spaced-repetition engine.
 *
 * Origin tracks not just what a learner has *seen* but what they actually
 * *remember*. Every vocabulary item gets a learning state with a full review
 * history and an SM-2-style schedule. State lives in localStorage today
 * (mirroring `lib/progress.ts`); the shape maps 1:1 onto the
 * `origin_language_spanish_vocab_state` table for a later Supabase backend.
 */

import { seededShuffle } from '../text';

export type Mastery = 'new' | 'learning' | 'strong';

export interface ReviewEvent {
  at: number;
  correct: boolean;
  /** Difficulty level (1=recognise … 4=produce) of the question answered. */
  level?: number;
}

export interface VocabState {
  /** Stable id - the normalized Spanish word. */
  id: string;
  es: string;
  en: string;
  category?: string;
  /** Scenario this word was introduced from, e.g. `spanish/supermarket`. */
  scenario: string;
  introducedAt: number;
  /** Times the word has been shown/introduced (times_seen). */
  seen: number;
  /** Times the word has been tested (times_tested). */
  attempts: number;
  correct: number;
  incorrect: number;
  /** Consecutive correct answers. */
  streak: number;
  /** Highest difficulty level the learner has answered correctly (1..4). */
  maxCorrectLevel: number;
  review_history: ReviewEvent[];
  lastReview?: number;
  lastCorrect?: number;
  /** SM-2 interval in days. */
  interval: number;
  /** SM-2 ease factor. */
  ease: number;
  /** Timestamp the word is next due for review. */
  nextReview: number;
}

const DAY = 24 * 60 * 60 * 1000;
const SOON = 2 * 60 * 1000; // 2 min: a freshly missed word comes back fast.

function keyFor(langSlug: string): string {
  return `origin:lang:${langSlug}:vocab:v1`;
}

type Store = Record<string, VocabState>;

function read(langSlug: string): Store {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(keyFor(langSlug)) ?? '{}') as Store;
  } catch {
    return {};
  }
}

function write(langSlug: string, store: Store): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(keyFor(langSlug), JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('origin:lang'));
  } catch {
    /* ignore quota / privacy errors */
  }
}

/** Normalize a Spanish word into a stable id (lowercase, no accents/spaces). */
export function vocabId(es: string): string {
  return es
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining accents
    .replace(/[^a-z0-9 ]/g, '') // drop punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

export function masteryOf(s: VocabState): Mastery {
  if (s.attempts === 0) return 'new';
  // "Strong" demands more than a lucky streak: the learner must have recalled
  // the word at a higher difficulty (context/production), not just recognised it.
  if (s.streak >= 3 && (s.maxCorrectLevel ?? 0) >= 3) return 'strong';
  return 'learning';
}

/** A word "needs practice": missed last time, or below 60% over >=2 tries. */
export function isWeak(s: VocabState): boolean {
  if (s.attempts === 0) return false;
  const lastWrong = s.review_history.at(-1)?.correct === false;
  const lowRate = s.attempts >= 2 && s.correct / s.attempts < 0.6;
  return lastWrong || lowRate;
}

/** 0..1 difficulty score - higher means the learner struggles more. */
export function difficulty(s: VocabState): number {
  if (s.attempts === 0) return 0.5;
  return 1 - s.correct / s.attempts;
}

/**
 * Introduce a word (idempotent). Creates a state due immediately so the word
 * enters the next practice round; never overwrites existing progress.
 */
export function introduce(
  langSlug: string,
  word: { es: string; en: string; category?: string },
  scenario: string,
): void {
  const id = vocabId(word.es);
  if (!id) return;
  const store = read(langSlug);
  if (store[id]) return; // never overwrite existing memory
  const now = Date.now();
  store[id] = {
    id,
    es: word.es,
    en: word.en,
    category: word.category,
    scenario,
    introducedAt: now,
    seen: 0,
    attempts: 0,
    correct: 0,
    incorrect: 0,
    streak: 0,
    maxCorrectLevel: 0,
    review_history: [],
    interval: 0,
    ease: 2.5,
    nextReview: now,
  };
  write(langSlug, store);
}

/** Record that a word was shown to the learner (times_seen). */
export function markSeen(langSlug: string, id: string): void {
  const store = read(langSlug);
  const s = store[id];
  if (!s) return;
  s.seen = (s.seen ?? 0) + 1;
  store[id] = s;
  write(langSlug, store);
}

const clamp = (min: number, max: number, x: number) => Math.min(max, Math.max(min, x));

/**
 * Record the outcome of a single review and reschedule the word.
 *
 * `level` is the difficulty of the question answered (1=recognise … 4=produce).
 * A correct *guess* (recognition, 1-of-4) must not count the same as confident
 * recall: higher levels grow the interval and ease much more, and only a
 * higher-level correct answer can move a word toward "strong" (see `masteryOf`).
 */
export function recordReview(
  langSlug: string,
  id: string,
  correct: boolean,
  level = 1,
): void {
  const store = read(langSlug);
  const s = store[id];
  if (!s) return;
  const now = Date.now();
  const lvl = clamp(1, 4, level);

  s.attempts += 1;
  s.review_history.push({ at: now, correct, level: lvl });
  if (s.review_history.length > 50) s.review_history.shift();
  s.lastReview = now;

  if (correct) {
    s.correct += 1;
    s.streak += 1;
    s.lastCorrect = now;
    s.maxCorrectLevel = Math.max(s.maxCorrectLevel ?? 0, lvl);
    // Ease barely moves on a recognition guess; confident production boosts it.
    s.ease = clamp(1.3, 2.8, s.ease + (lvl >= 3 ? 0.1 : lvl === 2 ? 0.02 : -0.02));
    if (s.interval === 0) {
      // First correct: a guess comes back within hours; production days out.
      s.interval = lvl >= 4 ? 3 : lvl === 3 ? 1.5 : lvl === 2 ? 0.75 : 0.35;
    } else {
      const levelFactor = clamp(0.5, 1.25, 0.4 + 0.22 * lvl); // L1 .62 … L4 1.25
      s.interval = Math.max(0.35, s.interval * s.ease * levelFactor);
    }
    s.nextReview = now + s.interval * DAY;
  } else {
    s.incorrect += 1;
    s.streak = 0;
    s.interval = 0;
    s.ease = Math.max(1.3, s.ease - 0.2);
    s.nextReview = now + SOON;
  }

  store[id] = s;
  write(langSlug, store);
}

export function getAll(langSlug: string): VocabState[] {
  return Object.values(read(langSlug));
}

export function getState(langSlug: string, id: string): VocabState | undefined {
  return read(langSlug)[id];
}

export function getByScenario(langSlug: string, scenario: string): VocabState[] {
  return getAll(langSlug).filter((s) => s.scenario === scenario);
}

/** Words whose `nextReview` has passed, soonest first. */
export function getDue(langSlug: string): VocabState[] {
  const now = Date.now();
  return getAll(langSlug)
    .filter((s) => s.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview);
}

/** Weak words, hardest first. */
export function getWeak(langSlug: string): VocabState[] {
  return getAll(langSlug)
    .filter(isWeak)
    .sort((a, b) => difficulty(b) - difficulty(a));
}

/** Words introduced within the last `days` days. */
export function getRecent(langSlug: string, days = 7): VocabState[] {
  const cutoff = Date.now() - days * DAY;
  return getAll(langSlug)
    .filter((s) => s.introducedAt >= cutoff)
    .sort((a, b) => b.introducedAt - a.introducedAt);
}

/**
 * Order a set of words for an adaptive review (never introduction order):
 *  - failed/weak words first (highest priority),
 *  - then recently learned words,
 *  - then other learning words,
 *  - then a retention sample of mastered words at the end.
 * Each band is shuffled, and the bands also ramp difficulty (weak/new tested at
 * low levels first, mastered → production last), capping the result at `max`.
 */
export function orderAdaptive(
  states: VocabState[],
  max = states.length,
  days = 7,
  seed = Date.now() % 100000,
): VocabState[] {
  const cutoff = Date.now() - days * DAY;
  const recentP = (s: VocabState) => s.introducedAt >= cutoff;

  const failed = seededShuffle(states.filter(isWeak), seed + 1);
  const rest = states.filter((s) => !isWeak(s));
  const recent = seededShuffle(rest.filter(recentP), seed + 2);
  const strong = seededShuffle(
    rest.filter((s) => masteryOf(s) === 'strong' && !recentP(s)),
    seed + 3,
  );
  const other = seededShuffle(
    rest.filter((s) => masteryOf(s) !== 'strong' && !recentP(s)),
    seed + 4,
  );

  // Reserve ~20% of the budget for mastered-word retention at the end.
  const reserveStrong = Math.min(strong.length, Math.floor(max * 0.2));
  const mainBudget = Math.max(0, max - reserveStrong);
  const main = [...failed, ...recent, ...other].slice(0, mainBudget);
  return [...main, ...strong.slice(0, reserveStrong)];
}

export interface LanguageStats {
  total: number;
  strong: number;
  learning: number;
  /** Introduced but never practiced. */
  fresh: number;
  weak: number;
  due: number;
}

export function getStats(langSlug: string): LanguageStats {
  const all = getAll(langSlug);
  const now = Date.now();
  let strong = 0;
  let learning = 0;
  let fresh = 0;
  let weak = 0;
  let due = 0;
  for (const s of all) {
    const m = masteryOf(s);
    if (m === 'strong') strong += 1;
    else if (m === 'learning') learning += 1;
    else fresh += 1;
    if (isWeak(s)) weak += 1;
    if (s.nextReview <= now) due += 1;
  }
  return { total: all.length, strong, learning, fresh, weak, due };
}
