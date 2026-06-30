/**
 * Learner profile for a language: the chosen goal, the personalized word picks
 * per scenario, and which scenarios are complete. localStorage today; maps onto
 * `origin_language_spanish_profile` later.
 */
import type { VocabOption } from '../../types/language';
import type { Learner } from './learner';

export interface LanguageProfile {
  /** Chosen goal slug, e.g. `visiting-spain`. */
  goal?: string;
  /** The learner's own details (name/country/age), woven into lesson examples.
   * Present (even if its fields are blank) once onboarding has been done. */
  learner?: Learner;
  /** scenario slug -> the vocab options the learner selected (personalization). */
  selections: Record<string, VocabOption[]>;
  /** scenario slugs the learner has completed at least once. */
  completed: string[];
}

const EMPTY: LanguageProfile = { selections: {}, completed: [] };

function keyFor(langSlug: string): string {
  return `origin:lang:${langSlug}:profile:v1`;
}

function read(langSlug: string): LanguageProfile {
  if (typeof localStorage === 'undefined') return { ...EMPTY };
  try {
    const raw = JSON.parse(localStorage.getItem(keyFor(langSlug)) ?? '{}');
    return { ...EMPTY, ...raw, selections: raw.selections ?? {}, completed: raw.completed ?? [] };
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

export function getGoalSlug(langSlug: string): string | undefined {
  return read(langSlug).goal;
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

export function setGoal(langSlug: string, goalSlug: string): void {
  const p = read(langSlug);
  p.goal = goalSlug;
  write(langSlug, p);
}

export function getSelections(langSlug: string, scenario: string): VocabOption[] {
  return read(langSlug).selections[scenario] ?? [];
}

export function setSelections(
  langSlug: string,
  scenario: string,
  options: VocabOption[],
): void {
  const p = read(langSlug);
  p.selections[scenario] = options;
  write(langSlug, p);
}

export function isComplete(langSlug: string, scenario: string): boolean {
  return read(langSlug).completed.includes(scenario);
}

export function markComplete(langSlug: string, scenario: string): void {
  const p = read(langSlug);
  if (!p.completed.includes(scenario)) p.completed.push(scenario);
  write(langSlug, p);
}
