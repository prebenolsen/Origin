import { useMemo, useState } from 'react';
import type { ComprehensionQuestion } from '../../types/language';
import Button from '../ui/Button';

/**
 * The comprehension check shown after a Conversation module. Asks 3-5 questions
 * that test whether the learner followed the exchange (not vocabulary). One
 * question at a time, with immediate feedback, then a short summary.
 */
export default function ConversationComprehension({
  questions,
  onComplete,
}: {
  questions: ComprehensionQuestion[];
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const q = questions[index];
  const last = index === questions.length - 1;

  const advance = () => {
    setLocked(false);
    if (last) onComplete();
    else setIndex((i) => i + 1);
  };

  const onGraded = (correct: boolean) => {
    if (locked) return;
    setLocked(true);
    if (correct) setCorrectCount((c) => c + 1);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-3">
        <div className="flex items-center justify-between text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-accent">
          <span>Comprehension</span>
          <span className="text-faint">
            {index + 1} / {questions.length}
          </span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((index + (locked ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-5">
        <QuestionView key={index} q={q} seed={index * 31 + 7} locked={locked} onGraded={onGraded} />
      </div>

      {locked && (
        <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
          <Button full onClick={advance}>
            {last ? `See result (${correctCount}/${questions.length})` : 'Continue'}
          </Button>
        </div>
      )}
    </div>
  );
}

function QuestionView({
  q,
  seed,
  locked,
  onGraded,
}: {
  q: ComprehensionQuestion;
  seed: number;
  locked: boolean;
  onGraded: (correct: boolean) => void;
}) {
  if (q.type === 'ordering') {
    return <OrderingQuestion q={q} seed={seed} locked={locked} onGraded={onGraded} />;
  }

  // Choice-style questions (multiple-choice, who-said-it, true-false) all render
  // as a prompt + a list of tappable options with the same feedback treatment.
  const prompt = q.type === 'who-said-it' ? 'Who said it?' : q.prompt;
  const quote = q.type === 'who-said-it' ? q.quote : undefined;
  const options = q.type === 'true-false' ? ['True', 'False'] : q.options;
  const answer = q.type === 'true-false' ? (q.answer ? 0 : 1) : q.answer;

  const [picked, setPicked] = useState<number | null>(null);

  const choose = (i: number) => {
    if (locked) return;
    setPicked(i);
    onGraded(i === answer);
  };

  return (
    <div className="animate-rise">
      <h2 className="font-serif text-[1.55rem] leading-tight">{prompt}</h2>
      {quote && (
        <div className="mt-3 rounded-2xl border border-line bg-surface px-4 py-3 font-serif text-[1.1rem] text-accent">
          &ldquo;{quote}&rdquo;
        </div>
      )}
      <div className="mt-5 grid gap-2.5">
        {options.map((opt, i) => {
          const isAnswer = i === answer;
          const isPicked = i === picked;
          const state = !locked
            ? 'idle'
            : isAnswer
              ? 'correct'
              : isPicked
                ? 'wrong'
                : 'muted';
          return (
            <button
              key={i}
              disabled={locked}
              onClick={() => choose(i)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-[1.02rem] transition active:scale-[0.99] ${
                state === 'idle'
                  ? 'border-line bg-surface hover:border-accent/50 hover:bg-surface-2'
                  : state === 'correct'
                    ? 'border-correct/60 bg-correct/10 text-correct'
                    : state === 'wrong'
                      ? 'border-wrong/60 bg-wrong/10 text-wrong'
                      : 'border-line-soft bg-surface/40 text-faint'
              }`}
            >
              <span>{opt}</span>
              {state === 'correct' && <span>✓</span>}
              {state === 'wrong' && <span>✕</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderingQuestion({
  q,
  seed,
  locked,
  onGraded,
}: {
  q: Extract<ComprehensionQuestion, { type: 'ordering' }>;
  seed: number;
  locked: boolean;
  onGraded: (correct: boolean) => void;
}) {
  // The authored `items` are already in the correct order; present them shuffled.
  const shuffled = useMemo(() => shuffle(q.items.map((_, i) => i), seed), [q.items, seed]);
  const [order, setOrder] = useState<number[]>([]);

  const remaining = shuffled.filter((i) => !order.includes(i));

  const submit = () => {
    if (locked) return;
    const correct = order.every((v, i) => v === i);
    onGraded(correct);
  };

  return (
    <div className="animate-rise">
      <h2 className="font-serif text-[1.55rem] leading-tight">{q.prompt}</h2>

      <div className="mt-5 min-h-[3rem] space-y-2">
        {order.map((orig, pos) => {
          const isRight = locked && orig === pos;
          const isWrong = locked && orig !== pos;
          return (
            <button
              key={orig}
              disabled={locked}
              onClick={() => setOrder((o) => o.filter((x) => x !== orig))}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                isRight
                  ? 'border-correct/60 bg-correct/10 text-correct'
                  : isWrong
                    ? 'border-wrong/60 bg-wrong/10 text-wrong'
                    : 'border-accent/50 bg-surface-2'
              }`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-faint">
                {pos + 1}
              </span>
              <span className="text-[0.98rem]">{q.items[orig]}</span>
            </button>
          );
        })}
        {order.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line px-4 py-3 text-sm text-faint">
            Tap the events below in the order they happened.
          </p>
        )}
      </div>

      {remaining.length > 0 && !locked && (
        <div className="mt-5 space-y-2 border-t border-line-soft pt-4">
          {remaining.map((orig) => (
            <button
              key={orig}
              onClick={() => setOrder((o) => [...o, orig])}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left text-[0.98rem] transition hover:border-accent/50 hover:bg-surface-2 active:scale-[0.99]"
            >
              {q.items[orig]}
            </button>
          ))}
        </div>
      )}

      {remaining.length === 0 && !locked && (
        <div className="mt-5">
          <Button full onClick={submit}>
            Check order
          </Button>
        </div>
      )}
    </div>
  );
}

/** Deterministic Fisher-Yates so the shuffle is stable across re-renders. */
function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
