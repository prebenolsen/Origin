import { useMemo, useState } from 'react';
import type {
  MatchingQuestion,
  MultipleChoiceQuestion,
  OrderingQuestion,
  QuizQuestion,
  TrueFalseQuestion,
} from '../../types/content';
import { seededShuffle } from '../../lib/text';
import TopBar from '../ui/TopBar';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';

interface Props {
  questions: QuizQuestion[];
  title: string;
  onExit: () => void;
  onReview?: () => void;
  onRecord: (correct: number, total: number) => void;
}

const arraysEqual = (a: (number | string)[], b: (number | string)[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export default function Quiz({ questions, title, onExit, onReview, onRecord }: Props) {
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'quiz' | 'result'>('quiz');

  const total = questions.length;
  const q = questions[index];

  const commit = (correct: boolean) => {
    if (locked) return;
    setLocked(true);
    setLastCorrect(correct);
    if (correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= total) {
      setPhase('result');
      onRecord(score, total);
    } else {
      setIndex((i) => i + 1);
      setLocked(false);
    }
  };

  const restart = () => {
    setIndex(0);
    setLocked(false);
    setScore(0);
    setPhase('quiz');
  };

  if (phase === 'result') {
    return (
      <QuizResult
        score={score}
        total={total}
        onReview={onReview}
        onRetry={restart}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar label="Recall" onClose={onExit} />

      <div className="px-5">
        <div className="mb-2 flex items-center justify-between text-[0.7rem] text-faint">
          <span>{title}</span>
          <span>
            {index + 1} / {total}
          </span>
        </div>
        <ProgressBar value={(index + (locked ? 1 : 0)) / total} />
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-6">
        <div key={index} className="animate-rise">
          <h2 className="font-serif text-[1.5rem] leading-snug">{q.question}</h2>

          <div className="mt-6">
            {q.type === 'multiple-choice' && (
              <MultipleChoice question={q} locked={locked} onCommit={commit} />
            )}
            {q.type === 'true-false' && (
              <TrueFalse question={q} locked={locked} onCommit={commit} />
            )}
            {q.type === 'ordering' && (
              <Ordering question={q} locked={locked} seed={index + 1} onCommit={commit} />
            )}
            {q.type === 'matching' && (
              <Matching question={q} locked={locked} seed={index + 1} onCommit={commit} />
            )}
          </div>

          {locked && (
            <div
              className={`mt-6 animate-rise rounded-2xl border p-4 ${
                lastCorrect
                  ? 'border-correct/40 bg-correct/10'
                  : 'border-wrong/40 bg-wrong/10'
              }`}
            >
              <div
                className={`text-sm font-semibold ${
                  lastCorrect ? 'text-correct' : 'text-wrong'
                }`}
              >
                {lastCorrect ? 'Correct' : 'Not quite'}
              </div>
              {q.explanation && (
                <p className="mt-1.5 text-sm leading-relaxed text-text/80">
                  {q.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {locked && (
        <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
          <Button full onClick={next}>
            {index + 1 >= total ? 'See results' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- *
 * Per-type renderers
 * --------------------------------------------------------------------- */

interface RendererProps<Q> {
  question: Q;
  locked: boolean;
  onCommit: (correct: boolean) => void;
}

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

function MultipleChoice({ question, locked, onCommit }: RendererProps<MultipleChoiceQuestion>) {
  const [selected, setSelected] = useState<number | null>(null);

  const click = (i: number) => {
    if (locked) return;
    setSelected(i);
    onCommit(i === question.answer);
  };

  return (
    <div className="flex flex-col gap-3">
      {question.options.map((opt, i) => {
        let state: 'idle' | 'correct' | 'wrong' | 'muted' = 'idle';
        if (locked) {
          if (i === question.answer) state = 'correct';
          else if (i === selected) state = 'wrong';
          else state = 'muted';
        }
        return (
          <button
            key={i}
            disabled={locked}
            onClick={() => click(i)}
            className={`rounded-2xl border px-4 py-3.5 text-left text-[0.98rem] transition active:scale-[0.99] ${optionClass(state)}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function TrueFalse({ question, locked, onCommit }: RendererProps<TrueFalseQuestion>) {
  const [selected, setSelected] = useState<boolean | null>(null);

  const click = (val: boolean) => {
    if (locked) return;
    setSelected(val);
    onCommit(val === question.answer);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {[true, false].map((val) => {
        let state: 'idle' | 'correct' | 'wrong' | 'muted' = 'idle';
        if (locked) {
          if (val === question.answer) state = 'correct';
          else if (val === selected) state = 'wrong';
          else state = 'muted';
        }
        return (
          <button
            key={String(val)}
            disabled={locked}
            onClick={() => click(val)}
            className={`rounded-2xl border px-4 py-5 text-center text-lg font-semibold transition active:scale-[0.99] ${optionClass(state)}`}
          >
            {val ? 'True' : 'False'}
          </button>
        );
      })}
    </div>
  );
}

function Ordering({
  question,
  locked,
  seed,
  onCommit,
}: RendererProps<OrderingQuestion> & { seed: number }) {
  const initial = useMemo(
    () => seededShuffle(question.items.map((_, i) => i), seed * 7 + 3),
    [question, seed],
  );
  const [order, setOrder] = useState<number[]>(initial);
  const correct = question.correctOrder ?? question.items.map((_, i) => i);

  const move = (pos: number, dir: -1 | 1) => {
    if (locked) return;
    const target = pos + dir;
    if (target < 0 || target >= order.length) return;
    const copy = [...order];
    [copy[pos], copy[target]] = [copy[target], copy[pos]];
    setOrder(copy);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="-mt-2 text-xs text-faint">Arrange in the correct order.</p>
      {order.map((itemIdx, pos) => {
        const isRight = locked && order[pos] === correct[pos];
        return (
          <div
            key={itemIdx}
            className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${
              locked
                ? isRight
                  ? 'border-correct/60 bg-correct/10'
                  : 'border-wrong/60 bg-wrong/10'
                : 'border-line bg-surface'
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs text-muted">
              {pos + 1}
            </span>
            <span className="flex-1 text-[0.95rem]">{question.items[itemIdx]}</span>
            {!locked && (
              <span className="flex flex-col">
                <button
                  onClick={() => move(pos, -1)}
                  disabled={pos === 0}
                  aria-label="Move up"
                  className="px-2 text-muted disabled:opacity-25"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(pos, 1)}
                  disabled={pos === order.length - 1}
                  aria-label="Move down"
                  className="px-2 text-muted disabled:opacity-25"
                >
                  ▼
                </button>
              </span>
            )}
          </div>
        );
      })}
      {!locked && (
        <Button variant="outline" onClick={() => onCommit(arraysEqual(order, correct))}>
          Check order
        </Button>
      )}
    </div>
  );
}

function Matching({
  question,
  locked,
  seed,
  onCommit,
}: RendererProps<MatchingQuestion> & { seed: number }) {
  const rights = useMemo(
    () => seededShuffle(question.pairs.map((p) => p.right), seed * 13 + 5),
    [question, seed],
  );
  const [picks, setPicks] = useState<(string | null)[]>(
    () => question.pairs.map(() => null),
  );

  const allChosen = picks.every((p) => p !== null);

  const set = (i: number, value: string) => {
    if (locked) return;
    const copy = [...picks];
    copy[i] = value || null;
    setPicks(copy);
  };

  const check = () =>
    onCommit(question.pairs.every((p, i) => picks[i] === p.right));

  return (
    <div className="flex flex-col gap-3">
      <p className="-mt-2 text-xs text-faint">Match each item to its pair.</p>
      {question.pairs.map((pair, i) => {
        const isRight = locked && picks[i] === pair.right;
        return (
          <div
            key={i}
            className={`rounded-2xl border px-4 py-3 ${
              locked
                ? isRight
                  ? 'border-correct/60 bg-correct/10'
                  : 'border-wrong/60 bg-wrong/10'
                : 'border-line bg-surface'
            }`}
          >
            <div className="text-[0.95rem]">{pair.left}</div>
            <select
              disabled={locked}
              value={picks[i] ?? ''}
              onChange={(e) => set(i, e.target.value)}
              className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-2.5 text-sm text-text outline-none focus:border-accent/60 disabled:opacity-80"
            >
              <option value="">Choose…</option>
              {rights.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {locked && !isRight && (
              <div className="mt-2 text-xs text-correct">Answer: {pair.right}</div>
            )}
          </div>
        );
      })}
      {!locked && (
        <Button variant="outline" disabled={!allChosen} onClick={check}>
          Check matches
        </Button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- *
 * Result
 * --------------------------------------------------------------------- */

function QuizResult({
  score,
  total,
  onReview,
  onRetry,
  onExit,
}: {
  score: number;
  total: number;
  onReview?: () => void;
  onRetry: () => void;
  onExit: () => void;
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const message =
    pct >= 80 ? 'Excellent recall.' : pct >= 50 ? 'Good — keep reviewing.' : 'Worth another pass.';

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="animate-pop">
        <div className="relative flex h-36 w-36 items-center justify-center">
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
              {score}/{total}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-serif text-2xl">{message}</h2>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {onReview && (
          <Button full onClick={onReview}>
            Review with flashcards
          </Button>
        )}
        <Button full variant="outline" onClick={onRetry}>
          Try again
        </Button>
        <Button full variant="ghost" onClick={onExit}>
          Back to library
        </Button>
      </div>
    </div>
  );
}
