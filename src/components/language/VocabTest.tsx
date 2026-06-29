import { useMemo, useState } from 'react';
import {
  checkProduce,
  type QuestionTarget,
  type VocabQuestion,
} from '../../lib/language/testGen';
import { vocabId } from '../../lib/language/srs';
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

  const isMC = q.kind !== 'produce';
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
        <div key={queue.length + ':' + (q.target.es ?? '')} className="animate-rise">
          <div className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-accent">
            {LEVEL_LABEL[q.level]}
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

          {isMC ? (
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
          ) : (
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

          {locked && (
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

      {locked && (
        <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
          <Button full onClick={next}>
            {queue.length <= 1 && lastCorrect ? 'See results' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}
