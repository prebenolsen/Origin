import type { AnswerEvaluationConfig } from '../../types/language';
import { vocabId } from './srs';

export interface ProductionCheckInput {
  expected: string;
  answer: string;
  acceptable?: string[];
  required?: string[];
  config?: AnswerEvaluationConfig;
}

export interface ProductionCheckBreakdown {
  meaningCoverage: number;
  requiredVocabulary: number;
  grammarPatterns: number;
  spellingTypos: number;
}

export interface ProductionCheckResult {
  score: number;
  passed: boolean;
  breakdown: ProductionCheckBreakdown;
  matchedReference: string;
  notes: string[];
}

const DEFAULT_WEIGHTS = {
  meaningCoverage: 40,
  requiredVocabulary: 30,
  grammarPatterns: 20,
  spellingTypos: 10,
};

const STOP_WORDS = new Set([
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'unos',
  'unas',
  'de',
  'del',
  'a',
  'al',
  'en',
  'y',
  'o',
  'pero',
  'que',
  'mi',
  'mis',
  'tu',
  'tus',
]);

function tokenize(text: string): string[] {
  return vocabId(text)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function contentTokens(text: string): string[] {
  return tokenize(text).filter((t) => !STOP_WORDS.has(t));
}

function overlapRatio(reference: string[], answer: string[]): number {
  if (reference.length === 0) return 1;
  const ans = new Set(answer);
  let hits = 0;
  for (const tok of reference) {
    if (ans.has(tok)) hits += 1;
  }
  return hits / reference.length;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[n];
}

function spellingScore(reference: string, answer: string): number {
  const a = vocabId(reference);
  const b = vocabId(answer);
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const d = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, 1 - d / Math.max(1, maxLen));
}

function grammarScore(reference: string, answer: string): number {
  const ref = tokenize(reference);
  const ans = new Set(tokenize(answer));
  const checks: Array<{ label: string; pass: boolean }> = [];

  const hasSer = ref.some((t) => ['es', 'son', 'soy', 'eres', 'somos'].includes(t));
  if (hasSer) {
    checks.push({
      label: 'copula',
      pass: ['es', 'son', 'soy', 'eres', 'somos'].some((v) => ans.has(v)),
    });
  }

  const hasContrast = ref.includes('pero');
  if (hasContrast) checks.push({ label: 'contrast', pass: ans.has('pero') });

  const hasAnd = ref.includes('y');
  if (hasAnd) checks.push({ label: 'joiner', pass: ans.has('y') });

  const hasPoss = ref.some((t) => ['mi', 'mis', 'tu', 'tus'].includes(t));
  if (hasPoss) {
    checks.push({
      label: 'possessive',
      pass: ['mi', 'mis', 'tu', 'tus'].some((v) => ans.has(v)),
    });
  }

  if (checks.length === 0) return 1;
  const passed = checks.filter((c) => c.pass).length;
  return passed / checks.length;
}

function requiredScore(required: string[] | undefined, answer: string): number {
  if (!required || required.length === 0) return 1;
  const normalized = ` ${vocabId(answer)} `;
  let ok = 0;
  for (const req of required) {
    const options = req
      .split('/')
      .map((o) => vocabId(o))
      .filter(Boolean);
    if (options.some((opt) => normalized.includes(` ${opt} `))) ok += 1;
  }
  return ok / required.length;
}

function bestReference(expected: string, acceptable: string[] | undefined, answer: string): string {
  const refs = [expected, ...(acceptable ?? [])].filter(Boolean);
  if (refs.length === 0) return expected;
  let best = refs[0];
  let bestScore = -1;
  for (const ref of refs) {
    const score = overlapRatio(contentTokens(ref), contentTokens(answer));
    if (score > bestScore) {
      best = ref;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Deterministic reusable scorer for sentence production answers.
 *
 * Pass rule:
 * - Keep core meaning (>= 0.60), and
 * - Weighted total >= 0.70
 */
export function evaluateProductionAnswer(input: ProductionCheckInput): ProductionCheckResult {
  const reference = bestReference(input.expected, input.acceptable, input.answer);
  const weights = input.config?.weights ?? DEFAULT_WEIGHTS;

  const meaning = overlapRatio(contentTokens(reference), contentTokens(input.answer));
  const required = requiredScore(input.required, input.answer);
  const grammar = grammarScore(reference, input.answer);
  const spelling = spellingScore(reference, input.answer);

  const totalWeight =
    weights.meaningCoverage +
    weights.requiredVocabulary +
    weights.grammarPatterns +
    weights.spellingTypos;

  const score =
    (meaning * weights.meaningCoverage +
      required * weights.requiredVocabulary +
      grammar * weights.grammarPatterns +
      spelling * weights.spellingTypos) /
    Math.max(1, totalWeight);

  const notes: string[] = [];
  if (meaning < 0.6) notes.push('main meaning is incomplete');
  if (required < 1) notes.push('required vocabulary is incomplete');
  if (grammar < 1) notes.push('grammar pattern is partially missing');

  return {
    score,
    passed: meaning >= 0.6 && score >= 0.7,
    matchedReference: reference,
    breakdown: {
      meaningCoverage: meaning,
      requiredVocabulary: required,
      grammarPatterns: grammar,
      spellingTypos: spelling,
    },
    notes,
  };
}
