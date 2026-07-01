/**
 * Pure merge functions used on sign-in to combine local (guest) state with what
 * is already stored in the account. Union-biased: because Origin is single-user,
 * nothing should ever be lost when a guest signs in on a device where they had
 * already made progress.
 */
import type { ModuleProgress } from '../progress';
import type { LanguageProfile } from '../language/profile';
import type { VocabState, ReviewEvent } from '../language/srs';

const union = (a: string[] = [], b: string[] = []): string[] => [
  ...new Set([...a, ...b]),
];

/** Per module path: union stages, keep the best quiz score and newest timestamp. */
export function mergeModuleProgress(
  local: Record<string, ModuleProgress>,
  remote: Record<string, ModuleProgress>,
): Record<string, ModuleProgress> {
  const out: Record<string, ModuleProgress> = {};
  for (const path of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const l = local[path];
    const r = remote[path];
    if (!l) {
      out[path] = r;
      continue;
    }
    if (!r) {
      out[path] = l;
      continue;
    }
    out[path] = {
      stages: union(l.stages, r.stages) as ModuleProgress['stages'],
      quizScore:
        l.quizScore == null && r.quizScore == null
          ? undefined
          : Math.max(l.quizScore ?? 0, r.quizScore ?? 0),
      updated: Math.max(l.updated ?? 0, r.updated ?? 0),
    };
  }
  return out;
}

/** Per board: union the solved-region id lists. */
export function mergeGeo(
  local: Record<string, string[]>,
  remote: Record<string, string[]>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const board of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    out[board] = union(local[board], remote[board]);
  }
  return out;
}

/**
 * Prefer local scalars when present (the device the learner is actively using),
 * union the arrays, and overlay local selections on top of remote.
 */
export function mergeLangProfile(
  local: LanguageProfile,
  remote: LanguageProfile,
): LanguageProfile {
  return {
    chapter: local.chapter ?? remote.chapter,
    learner: local.learner ?? remote.learner,
    selections: { ...remote.selections, ...local.selections },
    completed: union(local.completed, remote.completed),
    checkpoints: union(local.checkpoints, remote.checkpoints),
  };
}

/** Recency of a word's activity (last review, falling back to introduction). */
function activity(s: VocabState): number {
  return s.lastReview ?? s.introducedAt ?? 0;
}

function mergeHistory(a: ReviewEvent[] = [], b: ReviewEvent[] = []): ReviewEvent[] {
  const seen = new Set<number>();
  const out: ReviewEvent[] = [];
  for (const ev of [...a, ...b]) {
    if (seen.has(ev.at)) continue;
    seen.add(ev.at);
    out.push(ev);
  }
  out.sort((x, y) => x.at - y.at);
  return out.slice(-50); // keep the same cap the SRS engine uses
}

/**
 * Per word: take the record with the more recent activity wholesale (avoids
 * double-counting SM-2 counters), but union the review history so no answers are
 * lost.
 */
export function mergeVocab(
  local: Record<string, VocabState>,
  remote: Record<string, VocabState>,
): Record<string, VocabState> {
  const out: Record<string, VocabState> = {};
  for (const id of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const l = local[id];
    const r = remote[id];
    if (!l) {
      out[id] = r;
      continue;
    }
    if (!r) {
      out[id] = l;
      continue;
    }
    const winner = activity(l) >= activity(r) ? l : r;
    out[id] = { ...winner, review_history: mergeHistory(l.review_history, r.review_history) };
  }
  return out;
}
