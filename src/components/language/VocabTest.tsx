import { useMemo, useState } from 'react';
import {
  checkProduce,
  type QuestionTarget,
  type VocabQuestion,
} from '../../lib/language/testGen';
import { vocabId } from '../../lib/language/srs';
import {
  evaluateProductionAnswer,
  type ProductionCheckResult,
} from '../../lib/language/productionEval';
import TopBar from '../ui/TopBar';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';

interface Props {
  questions: VocabQuestion[];
  title: string;
  /** Called once per answered question with the SRS outcome + difficulty level. */
  onResult: (target: QuestionTarget, correct: boolean, level: number) => void;
  /** Called from the result screen's primary button. */
  onComplete: (correct: number, total: number) => void;
  onExit: () => void;
  finishLabel?: string;
  label?: string;
  /**
   * Mastery mode: a word answered wrong is requeued (regenerated, harder) and
   * must be recalled before the round ends - so progression needs recall, not
   * just clicking through.
   */
  requeueWrong?: boolean;
  /** Build a fresh question for a target when requeuing it. */
  regenerate?: (target: QuestionTarget) => VocabQuestion;
}

const MAX_REQUEUE = 2;

function optionClass(state: 'idle' | 'correct' | 'wrong' | 'muted') {
  switch (state) {
    case 'correct':
      return 'border-correct/60 bg-correct/10 text-text';
    case 'wrong':
      return 'border-wrong/60 bg-wrong/10 text-text';
    case 'muted':
      return 'border-line bg-surface text-muted opacity-60';
    default:
      return 'border-line bg-surface text-text hover:border-accent/60 hover:bg-surface-2';
  }
}

const LEVEL_LABEL: Record<number, string> = {
  1: 'Recognise',
  2: 'Recall',
  3: 'In context',
  4: 'Produce',
};

export default function VocabTest({
  questions,
  title,
  onResult,
  onComplete,
  onExit,
  finishLabel = 'Continue',
  label = 'Practice',
  requeueWrong = false,
  regenerate,
}: Props) {
  const [queue, setQueue] = useState<VocabQuestion[]>(questions);
  const [locked, setLocked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  // Build-sentence: ordered bank indices the learner has tapped into the answer.
  const [placed, setPlaced] = useState<number[]>([]);
  // Build-sentence: bank indices auto-filled by "Help me" (rendered in green).
  const [autoPlaced, setAutoPlaced] = useState<number[]>([]);
  // Build-sentence: a wrong Check reveals Help + a retry message (no lock).
  const [triedWrong, setTriedWrong] = useState(false);
  // Build-sentence: the SRS result is recorded once, on the first Check attempt.
  const [resultRecorded, setResultRecorded] = useState(false);
  // Build-sentence: keep weighted score breakdown for retry feedback.
  const [buildEval, setBuildEval] = useState<ProductionCheckResult | null>(null);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [requeues, setRequeues] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<'test' | 'result'>('test');

  const totalUnique = useMemo(
    () => new Set(questions.map((q) => vocabId(q.target.es))).size,
    [questions],
  );
  const total = requeueWrong ? totalUnique : questions.length;

  const q = queue[0];

  const commit = (isCorrect: boolean) => {
    if (locked || !q) return;
    setLocked(true);
    setLastCorrect(isCorrect);
    onResult(q.target, isCorrect, q.level);
    if (isCorrect) {
      setCorrect((c) => c + 1);
      setMastered((m) => new Set(m).add(vocabId(q.target.es)));
    }
  };

  const choose = (i: number) => {
    if (locked) return;
    setSelected(i);
    commit(i === (q as { answer: number }).answer);
  };

  const checkTyped = () => {
    if (locked || q.kind !== 'produce') return;
    commit(checkProduce(q, typed));
  };

  const checkBuilt = () => {
    if (locked || q.kind !== 'build-sentence') return;
    const built = placed.map((i) => q.bank[i]).join(' ');
    const evalResult = evaluateProductionAnswer({
      expected: q.answer.join(' '),
      answer: built,
      acceptable: q.acceptable,
      required: q.required,
      config: q.answerEvaluation,
    });
    setBuildEval(evalResult);
    const isCorrect = evalResult.passed;
    // Record the SRS outcome once, on the FIRST attempt - retries/help don't
    // inflate the score, but the learner still must reach the right sentence.
    if (!resultRecorded) {
      setResultRecorded(true);
      onResult(q.target, isCorrect, q.level);
      if (isCorrect) {
        setCorrect((c) => c + 1);
        setMastered((m) => new Set(m).add(vocabId(q.target.es)));
      }
    }
    if (isCorrect) {
      setLastCorrect(true);
      setLocked(true);
    } else {
      // No reveal, no advance - reveal Help and let them keep trying.
      setTriedWrong(true);
    }
  };

  // "Help me": trim to the longest correct prefix (dropping the first wrong tile
  // and everything after it); if already a correct prefix, auto-place the next
  // correct word (marked green, since the learner didn't place it themselves).
  const helpBuild = () => {
    if (locked || q.kind !== 'build-sentence') return;
    const answer = q.answer.map((a) => vocabId(a));
    let n = 0;
    while (n < placed.length && vocabId(q.bank[placed[n]]) === answer[n]) n += 1;
    if (n < placed.length) {
      const kept = placed.slice(0, n);
      setPlaced(kept);
      setAutoPlaced((prev) => prev.filter((idx) => kept.includes(idx)));
      return;
    }
    if (n < q.answer.length) {
      const want = answer[n];
      const idx = q.bank.findIndex((t, i) => !placed.includes(i) && vocabId(t) === want);
      if (idx >= 0) {
        setPlaced((prev) => [...prev, idx]);
        setAutoPlaced((prev) => [...prev, idx]);
      }
    }
  };

  const next = () => {
    const id = vocabId(q.target.es);
    let rest = queue.slice(1);
    if (!lastCorrect && requeueWrong && (requeues[id] ?? 0) < MAX_REQUEUE) {
      const again = regenerate ? regenerate(q.target) : q;
      rest = [...rest, again];
      setRequeues((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }));
    }
    setAnswered((a) => a + 1);
    if (rest.length === 0) {
      setPhase('result');
      return;
    }
    setQueue(rest);
    setLocked(false);
    setSelected(null);
    setTyped('');
    setPlaced([]);
    setAutoPlaced([]);
    setTriedWrong(false);
    setResultRecorded(false);
    setBuildEval(null);
  };

  if (phase === 'result' || !q) {
    const value = requeueWrong ? mastered.size : correct;
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="animate-pop">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" className="stroke-surface-2" strokeWidth="10" fill="none" />
              <circle
                cx="60"
                cy="60"
                r="52"
                className="stroke-accent"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                strokeDashoffset={2 * Math.PI * 52 * (1 - pct / 100)}
              />
            </svg>
            <div>
              <div className="font-serif text-3xl text-accent">{pct}%</div>
              <div className="text-xs text-muted">
                {value}/{total}
              </div>
            </div>
          </div>
        </div>
        <h2 className="font-serif text-2xl">
          {pct >= 80 ? 'Strong recall.' : pct >= 50 ? 'Getting there.' : 'Worth another pass.'}
        </h2>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Button full onClick={() => onComplete(value, total)}>
            {finishLabel}
          </Button>
        </div>
      </div>
    );
  }

  const isMC =
    q.kind === 'choose-meaning' || q.kind === 'choose-word' || q.kind === 'fill-blank';
  const options = isMC ? (q as { options: string[] }).options : [];
  const answerIndex = isMC ? (q as { answer: number }).answer : -1;

  return (
    <div className="flex h-full flex-col">
      <TopBar label={label} onClose={onExit} />

      <div className="px-5">
        <div className="mb-2 flex items-center justify-between text-[0.7rem] text-faint">
          <span>{title}</span>
          <span>
            {requeueWrong
              ? `${mastered.size} / ${total} mastered`
              : `${Math.min(answered + 1, total)} / ${total}`}
          </span>
        </div>
        <ProgressBar value={total ? (requeueWrong ? mastered.size : answered + (locked ? 1 : 0)) / total : 0} />
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-6">
        <div
          key={queue.length + ':' + (q.target.es ?? '')}
          className={`animate-rise ${q.kind === 'build-sentence' ? 'flex min-h-full flex-col' : ''}`}
        >
          <div className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-accent">
            {q.kind === 'build-sentence' ? 'Build' : LEVEL_LABEL[q.level]}
          </div>

          {q.kind === 'choose-meaning' && (
            <h2 className="mt-2 font-serif text-[1.9rem] leading-snug">
              What does <span className="text-accent">{q.prompt}</span> mean?
            </h2>
          )}
          {q.kind === 'choose-word' && (
            <h2 className="mt-2 font-serif text-[1.6rem] leading-snug">
              How do you say <span className="text-accent">{q.prompt}</span>?
            </h2>
          )}
          {q.kind === 'fill-blank' && (
            <>
              <h2 className="mt-2 font-serif text-[1.5rem] leading-snug">{q.sentenceEs}</h2>
              <p className="mt-1 text-sm text-muted">{q.sentenceEn}</p>
            </>
          )}
          {q.kind === 'produce' && (
            <h2 className="mt-2 font-serif text-[1.6rem] leading-snug">
              Translate: <span className="text-accent">{q.prompt}</span>
            </h2>
          )}
          {q.kind === 'build-sentence' && (
            <>
              <h2 className="mt-2 font-serif text-[1.5rem] leading-snug">Build this sentence</h2>
              <p className="mt-1 text-[1.05rem] text-text/90">{q.promptEn}</p>
            </>
          )}

          {isMC && (
            <div className="mt-6 flex flex-col gap-3">
              {options.map((opt, i) => {
                let state: 'idle' | 'correct' | 'wrong' | 'muted' = 'idle';
                if (locked) {
                  if (i === answerIndex) state = 'correct';
                  else if (i === selected) state = 'wrong';
                  else state = 'muted';
                }
                return (
                  <button
                    key={i}
                    disabled={locked}
                    onClick={() => choose(i)}
                    className={`rounded-2xl border px-4 py-3.5 text-left text-[0.98rem] transition active:scale-[0.99] ${optionClass(state)}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.kind === 'produce' && (
            <div className="mt-6">
              <input
                autoFocus
                value={typed}
                disabled={locked}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') checkTyped();
                }}
                placeholder="Type in Spanish…"
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-[1.05rem] text-text outline-none transition focus:border-accent/60 disabled:opacity-80"
              />
              {!locked && (
                <Button variant="outline" className="mt-3 w-full" disabled={!typed.trim()} onClick={checkTyped}>
                  Check
                </Button>
              )}
            </div>
          )}

          {q.kind === 'build-sentence' && (
            <div className="mt-6 flex flex-1 flex-col">
              {/* Answer row: tap a placed tile to send it back to the bank. */}
              <div
                className={`flex min-h-[3.5rem] flex-wrap content-start gap-2 rounded-2xl border p-3 transition ${
                  locked ? 'border-correct/60 bg-correct/10' : 'border-line bg-surface'
                }`}
              >
                {placed.length === 0 && (
                  <span className="self-center text-sm text-faint">Tap the words in order…</span>
                )}
                {placed.map((bankIdx, pos) => {
                  const auto = autoPlaced.includes(bankIdx);
                  return (
                    <button
                      key={pos}
                      disabled={locked}
                      onClick={() => {
                        setPlaced(placed.filter((_, p) => p !== pos));
                        if (auto) setAutoPlaced(autoPlaced.filter((x) => x !== bankIdx));
                      }}
                      className={`rounded-xl border px-3 py-2 text-[1rem] transition active:scale-95 ${
                        auto
                          ? 'border-correct/60 bg-correct/15 text-correct'
                          : 'border-accent/50 bg-surface-2 text-text'
                      }`}
                    >
                      {q.bank[bankIdx]}
                    </button>
                  );
                })}
              </div>

              {/* Build-sentence never locks on a wrong try - the learner retries. */}
              {locked && lastCorrect && (
                <div className="mt-3 rounded-2xl border border-correct/40 bg-correct/10 p-4 text-sm font-semibold text-correct">
                  Correct
                </div>
              )}
              {triedWrong && !locked && (
                <div className="mt-3 rounded-2xl border border-wrong/40 bg-wrong/10 p-3 text-sm font-semibold text-wrong">
                  Not quite - try again.
                </div>
              )}

              {buildEval && (
                <div className="mt-3 rounded-2xl border border-line bg-surface p-3 text-xs text-muted">
                  <div className="font-semibold text-text">Score: {Math.round(buildEval.score * 100)}%</div>
                  <div className="mt-1">
                    Meaning {Math.round(buildEval.breakdown.meaningCoverage * 100)}% · Required{' '}
                    {Math.round(buildEval.breakdown.requiredVocabulary * 100)}% · Grammar{' '}
                    {Math.round(buildEval.breakdown.grammarPatterns * 100)}% · Spelling{' '}
                    {Math.round(buildEval.breakdown.spellingTypos * 100)}%
                  </div>
                  {buildEval.notes.length > 0 && (
                    <div className="mt-1">{buildEval.notes.join(' · ')}</div>
                  )}
                </div>
              )}

              {/* Spacer pushes the word bank down to just above the Check button. */}
              <div className="min-h-6 flex-1" />

              {/* Word bank: tap an unused tile to append it to the answer. */}
              <div className="flex flex-wrap gap-2">
                {q.bank.map((tile, i) => {
                  const used = placed.includes(i);
                  return (
                    <button
                      key={i}
                      disabled={locked || used}
                      onClick={() => setPlaced([...placed, i])}
                      className={`rounded-xl border px-3 py-2 text-[1rem] transition active:scale-95 ${
                        used
                          ? 'border-line bg-surface text-faint opacity-40'
                          : 'border-line bg-surface text-text hover:border-accent/60 hover:bg-surface-2'
                      }`}
                    >
                      {tile}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {locked && q.kind !== 'build-sentence' && (
            <div
              className={`mt-6 animate-rise rounded-2xl border p-4 ${
                lastCorrect ? 'border-correct/40 bg-correct/10' : 'border-wrong/40 bg-wrong/10'
              }`}
            >
              <div className={`text-sm font-semibold ${lastCorrect ? 'text-correct' : 'text-wrong'}`}>
                {lastCorrect ? 'Correct' : requeueWrong ? "Not quite - we'll come back to this" : 'Not quite'}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-text/80">
                <span className="text-accent">{q.target.es}</span> = {q.target.en}
              </p>
            </div>
          )}
        </div>
      </div>

      {q.kind === 'build-sentence' && !locked ? (
        <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
          {/* Reserved slot so revealing Help doesn't shove the Check button down. */}
          <div className="mb-2 min-h-[3.25rem]">
            {triedWrong && (
              <Button full variant="outline" onClick={helpBuild}>
                Help me
              </Button>
            )}
          </div>
          <Button full disabled={placed.length === 0} onClick={checkBuilt}>
            Check
          </Button>
        </div>
      ) : locked ? (
        <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
          <Button full onClick={next}>
            {queue.length <= 1 && lastCorrect ? 'See results' : 'Next'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
