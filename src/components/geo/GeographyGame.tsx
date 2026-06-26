import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  buildAlternatives,
  getBoard,
  normalize,
  scoreAnswer,
  type Region,
} from '../../lib/geography';
import { countryCentroid } from '../../lib/countryShapes';
import { getSolved, saveSolved } from '../../lib/geoProgress';
import GeoQuizMap from './GeoQuizMap';
import AnswerPanel from './AnswerPanel';

export default function GeographyGame() {
  const { board: boardKey } = useParams();
  const board = boardKey ? getBoard(boardKey) : undefined;

  const [solved, setSolved] = useState<Set<string>>(() => (boardKey ? getSolved(boardKey) : new Set()));
  const [active, setActive] = useState<Region | null>(null);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'wrong'>('idle');
  const [hintCount, setHintCount] = useState(0);
  const [options, setOptions] = useState<string[] | null>(null);

  const total = board?.regions.length ?? 0;
  const done = solved.size;
  const allDone = total > 0 && done >= total;

  const centroidOf = useMemo(
    () =>
      (r: Region): [number, number] | null =>
        board?.kind === 'seas' ? [r.lng!, r.lat!] : countryCentroid(r.id),
    [board],
  );

  if (!board) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <h2 className="text-xl">Board not found</h2>
        <Link to="/geo" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink">
          Pick a map
        </Link>
      </div>
    );
  }

  function resetSelection() {
    setActive(null);
    setInput('');
    setStatus('idle');
    setHintCount(0);
    setOptions(null);
  }

  function select(id: string | null) {
    if (!id) {
      resetSelection();
      return;
    }
    const region = board!.regions.find((r) => r.id === id) ?? null;
    setActive(region);
    setInput('');
    setStatus('idle');
    setHintCount(0);
    setOptions(null);
  }

  function solve(region: Region) {
    const next = new Set(solved);
    next.add(region.id);
    setSolved(next);
    saveSolved(board!.key, next);
    resetSelection();
  }

  function resetBoardProgress() {
    const empty = new Set<string>();
    setSolved(empty);
    saveSolved(board!.key, empty);
    resetSelection();
  }

  function submit() {
    if (!active) return;
    if (scoreAnswer(input, active).correct) solve(active);
    else setStatus('wrong');
  }

  function pickOption(name: string) {
    if (!active) return;
    if (normalize(name) === normalize(active.name)) solve(active);
    else setStatus('wrong');
  }

  const hint = active && hintCount > 0 ? active.name.slice(0, hintCount).toUpperCase().split('').join(' ') : null;

  function panelProps(variant: 'inline' | 'overlay') {
    if (!active) return null;
    return {
      region: active,
      kind: (board!.kind === 'seas' ? 'sea' : 'country') as 'sea' | 'country',
      solved: solved.has(active.id),
      input,
      status,
      hint,
      options,
      variant,
      onInput: (v: string) => {
        setInput(v);
        if (status === 'wrong') setStatus('idle');
      },
      onSubmit: submit,
      onHintLetter: () => setHintCount((c) => Math.min((active?.name.length ?? 1) - 1, c + 1)),
      onHintOptions: () => setOptions(buildAlternatives(board!, active!, centroidOf)),
      onPickOption: pickOption,
      onClose: resetSelection,
    };
  }

  const inlineProps = panelProps('inline');

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 bg-aurora px-5 pb-4 pt-9">
        <div className="flex items-center justify-between">
          <Link
            to="/geo"
            className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-accent"
          >
            ← Maps
          </Link>
        </div>
        <h1 className="mt-2 font-serif text-[1.9rem] leading-tight">{board.name}</h1>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${total ? (done / total) * 100 : 0}%` }}
            />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-faint">
            {done} / {total}
          </span>
        </div>
      </header>

      {/* Map */}
      <div className="shrink-0 px-4 pt-3">
        <GeoQuizMap
          board={board}
          solved={solved}
          activeId={active?.id ?? null}
          onSelect={select}
          onReset={resetBoardProgress}
          canReset={done > 0}
          renderOverlay={(fullscreen) => {
            const op = panelProps('overlay');
            return fullscreen && op ? <AnswerPanel {...op} /> : null;
          }}
        />
      </div>

      {/* Control area */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-3">
        {inlineProps ? (
          <AnswerPanel {...inlineProps} />
        ) : allDone ? (
          <div className="rounded-card border border-accent/30 bg-surface p-5 text-center">
            <div className="text-2xl">🎉</div>
            <h2 className="mt-1 font-serif text-xl text-accent-soft">Map complete</h2>
            <p className="mt-1 text-sm text-muted">
              You named all {total} {board.kind === 'seas' ? 'waters' : 'countries'}. Reset to play again.
            </p>
          </div>
        ) : (
          <div className="rounded-card border border-line bg-surface p-5 text-center">
            <p className="text-sm text-muted">
              Tap {board.kind === 'seas' ? 'a sea or ocean' : 'a country'} on the map to name it.
            </p>
            <p className="mt-1.5 text-xs text-faint">
              Pinch or scroll to zoom in · double-tap for fullscreen · stuck? ask for a hint.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
