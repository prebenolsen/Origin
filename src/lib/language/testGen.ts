/**
 * Intelligent, adaptive test generation.
 *
 * Two principles from the brief:
 *  1. Difficulty rises with mastery. A brand-new word is tested by recognition
 *     (Spanish -> meaning); a strong word is tested by production (type it).
 *  2. Distractors are never random. They are drawn from the same category and
 *     from spelling-similar words, so the question tests *understanding*, not
 *     "which of these four unrelated words looks right".
 */
import { seededShuffle } from '../text';
import { vocabId, masteryOf, type VocabState } from './srs';

/** Minimal shape every question carries so the runner can grade + report. */
export interface QuestionTarget {
  es: string;
  en: string;
  category?: string;
}

export type Level = 1 | 2 | 3 | 4;

export type VocabQuestion =
  | {
      kind: 'choose-meaning'; // Spanish shown -> pick English meaning
      level: 1;
      target: QuestionTarget;
      prompt: string;
      options: string[];
      answer: number;
    }
  | {
      kind: 'choose-word'; // English shown -> pick Spanish word
      level: 2;
      target: QuestionTarget;
      prompt: string;
      options: string[];
      answer: number;
    }
  | {
      kind: 'fill-blank'; // context sentence with a gap -> pick Spanish word
      level: 3;
      target: QuestionTarget;
      sentenceEs: string;
      sentenceEn: string;
      options: string[];
      answer: number;
    }
  | {
      kind: 'produce'; // English shown -> type the Spanish
      level: 4;
      target: QuestionTarget;
      prompt: string;
      answer: string;
    };

/** Normalize a typed answer for forgiving comparison (accents/case/punctuation). */
export function normalizeAnswer(text: string): string {
  return vocabId(text);
}

export function checkProduce(q: Extract<VocabQuestion, { kind: 'produce' }>, typed: string): boolean {
  return normalizeAnswer(typed) === normalizeAnswer(q.answer);
}

/** Cheap spelling closeness 0..1 - rewards shared prefix + similar length. */
function spellingSimilarity(a: string, b: string): number {
  const x = vocabId(a);
  const y = vocabId(b);
  if (!x || !y) return 0;
  let prefix = 0;
  const min = Math.min(x.length, y.length);
  while (prefix < min && x[prefix] === y[prefix]) prefix += 1;
  const lenSim = 1 - Math.abs(x.length - y.length) / Math.max(x.length, y.length);
  return prefix / Math.max(x.length, y.length) + lenSim * 0.3;
}

/**
 * Pick up to `count` distractors for a target. Prefers same-category words,
 * then spelling-similar words (the "pollo / polla" confusion case), then
 * anything else - but never the target itself or a duplicate translation.
 */
function pickDistractors(
  target: QuestionTarget,
  pool: QuestionTarget[],
  count: number,
  seed: number,
): QuestionTarget[] {
  const targetId = vocabId(target.es);
  const seen = new Set([targetId]);
  const candidates = pool.filter((c) => {
    const id = vocabId(c.es);
    if (seen.has(id) || !c.es || !c.en) return false;
    seen.add(id);
    return true;
  });

  const scored = candidates.map((c) => {
    const sameCat = c.category && c.category === target.category ? 1 : 0;
    return { c, score: sameCat * 2 + spellingSimilarity(target.es, c.es) };
  });
  scored.sort((a, b) => b.score - a.score);

  // Take a slightly larger top slice, then shuffle for variety between runs.
  const top = scored.slice(0, Math.max(count + 2, count)).map((s) => s.c);
  return seededShuffle(top, seed).slice(0, count);
}

function levelFor(state?: VocabState): Level {
  if (!state) return 1;
  const m = masteryOf(state);
  if (m === 'new') return 1;
  if (m === 'strong') return 4;
  // learning: alternate recognition-recall to build production gradually.
  return state.streak >= 1 ? 3 : 2;
}

interface BuildOptions {
  /** Per-target learning state, keyed by vocabId, used to pick difficulty. */
  states?: Record<string, VocabState | undefined>;
  /** A sentence frame `{ es, en }` enabling fill-blank questions. */
  template?: { es: string; en: string };
  /** Force every question to a level (used to keep first lessons gentle). */
  forceLevel?: Level;
  seed?: number;
}

function makeQuestion(
  target: QuestionTarget,
  pool: QuestionTarget[],
  level: Level,
  opts: BuildOptions,
  seed: number,
): VocabQuestion {
  if (level === 4) {
    return {
      kind: 'produce',
      level: 4,
      target,
      prompt: target.en,
      answer: target.es,
    };
  }

  const distractors = pickDistractors(target, pool, 3, seed);

  if (level === 3 && opts.template) {
    const options = seededShuffle([target, ...distractors], seed + 1);
    return {
      kind: 'fill-blank',
      level: 3,
      target,
      sentenceEs: opts.template.es.replace('___', '_____'),
      sentenceEn: opts.template.en.replace('___', target.en),
      options: options.map((o) => o.es),
      answer: options.findIndex((o) => vocabId(o.es) === vocabId(target.es)),
    };
  }

  if (level === 2) {
    const options = seededShuffle([target, ...distractors], seed + 2);
    return {
      kind: 'choose-word',
      level: 2,
      target,
      prompt: target.en,
      options: options.map((o) => o.es),
      answer: options.findIndex((o) => vocabId(o.es) === vocabId(target.es)),
    };
  }

  // level 1 - recognition
  const options = seededShuffle([target, ...distractors], seed + 3);
  return {
    kind: 'choose-meaning',
    level: 1,
    target,
    prompt: target.es,
    options: options.map((o) => o.en),
    answer: options.findIndex((o) => o.en === target.en),
  };
}

/**
 * Build an adaptive quiz over `targets`, using `pool` (every word the learner
 * knows, ideally) as the distractor source.
 */
export function buildQuiz(
  targets: QuestionTarget[],
  pool: QuestionTarget[],
  opts: BuildOptions = {},
): VocabQuestion[] {
  const baseSeed = opts.seed ?? Date.now() % 100000;
  const distractorPool = pool.length >= 4 ? pool : targets;
  return targets.map((t, i) => {
    const level = opts.forceLevel ?? levelFor(opts.states?.[vocabId(t.es)]);
    return makeQuestion(t, distractorPool, level, opts, baseSeed + i * 17);
  });
}
