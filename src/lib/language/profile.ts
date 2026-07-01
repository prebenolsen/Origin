/**
 * Learner profile for a language: the chosen chapter, the personalized word
 * picks per module, and which modules are complete. localStorage today; maps
 * onto `origin_language_spanish_profile` later.
 */
import type { VocabOption } from '../../types/language';
import type { Learner } from './learner';

export interface LanguageProfile {
  /** Chosen chapter slug, e.g. `visiting-spain`. */
  chapter?: string;
  /** The learner's own details (name/country/age), woven into lesson examples.
   * Present (even if its fields are blank) once onboarding has been done. */
  learner?: Learner;
  /** module slug -> the vocab options the learner selected (personalization). */
  selections: Record<string, VocabOption[]>;
  /** module slugs the learner has completed at least once. */
  completed: string[];
  /** Completed checkpoint ids, e.g. `visiting-spain:4`. */
  checkpoints: string[];
}

const EMPTY: LanguageProfile = { selections: {}, completed: [], checkpoints: [] };

function keyFor(langSlug: string): string {
  return `origin:lang:${langSlug}:profile:v1`;
}

function read(langSlug: string): LanguageProfile {
  if (typeof localStorage === 'undefined') return { ...EMPTY };
  try {
    const raw = JSON.parse(localStorage.getItem(keyFor(langSlug)) ?? '{}');
    return {
      ...EMPTY,
      ...raw,
      selections: raw.selections ?? {},
      completed: raw.completed ?? [],
      checkpoints: raw.checkpoints ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

function write(langSlug: string, profile: LanguageProfile): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(keyFor(langSlug), JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('origin:lang'));
  } catch {
    /* ignore */
  }
}

export function getProfile(langSlug: string): LanguageProfile {
  return read(langSlug);
}

export function getChapterSlug(langSlug: string): string | undefined {
  return read(langSlug).chapter;
}

export function getLearner(langSlug: string): Learner | undefined {
  return read(langSlug).learner;
}

/** Whether the learner has been through onboarding (a learner object exists). */
export function hasOnboarded(langSlug: string): boolean {
  return read(langSlug).learner != null;
}

export function setLearner(langSlug: string, learner: Learner): void {
  const p = read(langSlug);
  p.learner = learner;
  write(langSlug, p);
}

export function setChapter(langSlug: string, chapterSlug: string): void {
  const p = read(langSlug);
  p.chapter = chapterSlug;
  write(langSlug, p);
}

export function getSelections(langSlug: string, module: string): VocabOption[] {
  return read(langSlug).selections[module] ?? [];
}

export function setSelections(
  langSlug: string,
  module: string,
  options: VocabOption[],
): void {
  const p = read(langSlug);
  p.selections[module] = options;
  write(langSlug, p);
}

export function isComplete(langSlug: string, module: string): boolean {
  return read(langSlug).completed.includes(module);
}

export function markComplete(langSlug: string, module: string): void {
  const p = read(langSlug);
  if (!p.completed.includes(module)) p.completed.push(module);
  write(langSlug, p);
}

export function isCheckpointComplete(langSlug: string, checkpointId: string): boolean {
  return read(langSlug).checkpoints.includes(checkpointId);
}

export function markCheckpointComplete(langSlug: string, checkpointId: string): void {
  const p = read(langSlug);
  if (!p.checkpoints.includes(checkpointId)) p.checkpoints.push(checkpointId);
  write(langSlug, p);
}
