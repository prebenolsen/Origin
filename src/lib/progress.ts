/**
 * Lightweight per-module progress tracking in localStorage.
 * Deliberately minimal — Origin avoids dashboard-style stat tracking.
 */

export type Stage = 'intro' | 'story' | 'quiz' | 'flashcards';

export interface ModuleProgress {
  stages: Stage[];
  /** Best quiz score as a fraction 0..1. */
  quizScore?: number;
  updated: number;
}

const KEY = 'origin:progress:v1';
const STAGE_ORDER: Stage[] = ['intro', 'story', 'quiz', 'flashcards'];

type Store = Record<string, ModuleProgress>;

function read(): Store {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Store;
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    // Let other parts of the app (e.g. Home) react to updates.
    window.dispatchEvent(new CustomEvent('origin:progress'));
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function getProgress(path: string): ModuleProgress | undefined {
  return read()[path];
}

export function markStage(path: string, stage: Stage): void {
  const store = read();
  const entry = store[path] ?? { stages: [], updated: 0 };
  if (!entry.stages.includes(stage)) entry.stages.push(stage);
  entry.updated = Date.now();
  store[path] = entry;
  write(store);
}

export function recordQuiz(path: string, correct: number, total: number): void {
  const store = read();
  const entry = store[path] ?? { stages: [], updated: 0 };
  const score = total > 0 ? correct / total : 0;
  entry.quizScore = Math.max(entry.quizScore ?? 0, score);
  if (!entry.stages.includes('quiz')) entry.stages.push('quiz');
  entry.updated = Date.now();
  store[path] = entry;
  write(store);
}

/** Completion fraction (0..1) across the four stages. */
export function completion(path: string): number {
  const entry = read()[path];
  if (!entry) return 0;
  const done = STAGE_ORDER.filter((s) => entry.stages.includes(s)).length;
  return done / STAGE_ORDER.length;
}

export function isStarted(path: string): boolean {
  return !!read()[path];
}
