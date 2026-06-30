import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seededShuffle } from '../../lib/text';
import { getAll } from '../../lib/language/srs';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import { LANG } from './SpanishHome';

type Side = 'en' | 'es';

type Pair = {
  id: string;
  en: string;
  es: string;
};

const BATCH_SIZE = 6;

export default function WordMatchingReview() {
  const navigate = useNavigate();

  // Freeze the full randomized list once for this session.
  const [session] = useState(() => {
    const seed = Date.now() % 100000;
    const pairs: Pair[] = seededShuffle(
      getAll(LANG).map((s) => ({ id: s.id, en: s.en, es: s.es })),
      seed,
    );
    const rightIds = seededShuffle(
      pairs.map((p) => p.id),
      seed + 17,
    );
    return { pairs, rightIds };
  });

  const [batchStart, setBatchStart] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<{ side: Side; id: string } | null>(null);
  const [wrongFlash, setWrongFlash] = useState<string[] | null>(null);

  const pairById = useMemo(() => new Map(session.pairs.map((p) => [p.id, p])), [session.pairs]);
  const totalPairs = session.pairs.length;

  const batchIds = useMemo(
    () => session.pairs.slice(batchStart, batchStart + BATCH_SIZE).map((p) => p.id),
    [batchStart, session.pairs],
  );
  const batchSet = useMemo(() => new Set(batchIds), [batchIds]);

  const leftColumn = useMemo(
    () => batchIds.map((id) => pairById.get(id)).filter((p): p is Pair => !!p),
    [batchIds, pairById],
  );
  const rightColumn = useMemo(
    () => session.rightIds.filter((id) => batchSet.has(id)).map((id) => pairById.get(id)).filter((p): p is Pair => !!p),
    [batchSet, pairById, session.rightIds],
  );

  const wordsDone = completed.size * 2;
  const wordsTotal = totalPairs * 2;
  const finished = totalPairs > 0 && completed.size >= totalPairs;

  useEffect(() => {
    if (!wrongFlash) return;
    const t = window.setTimeout(() => setWrongFlash(null), 550);
    return () => window.clearTimeout(t);
  }, [wrongFlash]);

  useEffect(() => {
    if (!batchIds.length) return;
    const batchComplete = batchIds.every((id) => completed.has(id));
    if (!batchComplete) return;
    if (batchStart + BATCH_SIZE >= totalPairs) return;

    const t = window.setTimeout(() => {
      setBatchStart((prev) => prev + BATCH_SIZE);
      setSelected(null);
      setWrongFlash(null);
    }, 280);

    return () => window.clearTimeout(t);
  }, [batchIds, batchStart, completed, totalPairs]);

  const pickWord = (side: Side, id: string) => {
    if (completed.has(id)) return;

    if (!selected) {
      setSelected({ side, id });
      return;
    }

    if (selected.side === side) {
      setSelected({ side, id });
      return;
    }

    if (selected.id === id) {
      setCompleted((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setSelected(null);
      setWrongFlash(null);
      return;
    }

    setWrongFlash([selected.id, id]);
    setSelected(null);
  };

  if (totalPairs === 0) {
    return (
      <div className="flex h-full flex-col">
        <TopBar label="Word-Matching Test" onClose={() => navigate('/learn/spanish/review')} back />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <h2 className="font-serif text-xl">No words available yet</h2>
          <p className="text-sm text-muted">Finish a lesson first, then come back to test matching.</p>
          <Button variant="outline" onClick={() => navigate('/learn/spanish/review')}>
            Back to review
          </Button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex h-full flex-col">
        <TopBar label="Word-Matching Test" onClose={() => navigate('/learn/spanish/review')} back />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="text-4xl">✅</div>
          <h2 className="font-serif text-2xl">Great matching</h2>
          <p className="text-sm text-muted">You matched {wordsDone} / {wordsTotal} words.</p>
          <Button variant="outline" onClick={() => navigate('/learn/spanish/review')}>
            Back to review modes
          </Button>
        </div>
      </div>
    );
  }

  const WordButton = ({ side, pair }: { side: Side; pair: Pair }) => {
    const isDone = completed.has(pair.id);
    const isSelected = !!selected && selected.side === side && selected.id === pair.id;
    const isWrong = !!wrongFlash && wrongFlash.includes(pair.id);

    return (
      <button
        onClick={() => pickWord(side, pair.id)}
        disabled={isDone}
        className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
          isDone
            ? 'pointer-events-none scale-95 border-correct/40 bg-correct/10 text-correct opacity-0'
            : isWrong
              ? 'border-wrong bg-wrong/10 text-wrong'
              : isSelected
                ? 'border-accent bg-accent/15 text-text'
                : 'border-line bg-surface hover:border-accent/50 hover:bg-surface-2'
        }`}
      >
        {side === 'en' ? pair.en : pair.es}
      </button>
    );
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <TopBar label="Word-Matching Test" onClose={() => navigate('/learn/spanish/review')} back />

      <header className="bg-aurora px-6 pb-5 pt-4">
        <h1 className="font-serif text-[2rem] leading-[1.05]">Match the pairs</h1>
        <p className="mt-1.5 text-sm text-muted">Tap one word on either side, then its translation.</p>
        <div className="mt-3 text-xs text-faint">
          {wordsDone} / {wordsTotal} words completed
        </div>
      </header>

      <div className="px-5 pb-10 pt-3">
        <div className="mb-2 flex items-center justify-between text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-faint">
          <span>English</span>
          <span>Spanish</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2.5">
            {leftColumn.map((pair) => (
              <WordButton key={`en-${pair.id}`} side="en" pair={pair} />
            ))}
          </div>

          <div className="space-y-2.5">
            {rightColumn.map((pair) => (
              <WordButton key={`es-${pair.id}`} side="es" pair={pair} />
            ))}
          </div>
        </div>

        {wrongFlash && (
          <div className="mt-3 rounded-xl border border-wrong/40 bg-wrong/10 px-3 py-2 text-xs text-wrong">
            Not a match - try again.
          </div>
        )}
      </div>
    </div>
  );
}
