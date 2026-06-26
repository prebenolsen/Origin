import { Link } from 'react-router-dom';
import { BOARDS } from '../../lib/geography';
import { getSolved } from '../../lib/geoProgress';

/**
 * Entry screen for the Geography Challenge: pick a continent (name every
 * country) or the world's oceans & seas.
 */
export default function GeographyHome() {
  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <header className="bg-aurora px-6 pb-8 pt-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted transition hover:text-accent"
        >
          ← Home
        </Link>
        <h1 className="mt-4 max-w-[16ch] font-serif text-[2.4rem] leading-[1.05]">
          Geography <em className="not-italic text-accent">Challenge</em>
        </h1>
        <p className="mt-3 max-w-[34ch] text-[0.95rem] leading-relaxed text-muted">
          Tap a country and name it. Get it ~80% right and it stays lit. Zoom in,
          ask for a hint, fill the whole map.
        </p>
      </header>

      <div className="grid gap-3 px-5 pb-10">
        {BOARDS.map((board) => {
          const done = getSolved(board.key).size;
          const total = board.regions.length;
          return (
            <Link
              key={board.key}
              to={`/geo/${board.key}`}
              className="group relative block overflow-hidden rounded-card border border-line bg-surface p-5 transition hover:border-accent/50 hover:bg-surface-2 active:scale-[0.99]"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent opacity-20 blur-2xl transition group-hover:opacity-40" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-faint">
                    {board.kind === 'seas' ? 'Waters' : 'Countries'}
                    {done > 0 && ` · ${done}/${total} found`}
                  </div>
                  <h3 className="mt-1.5 text-[1.5rem] leading-tight">{board.name}</h3>
                  <p className="mt-1 text-sm text-muted">{board.blurb}</p>
                </div>
                <span className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent">
                  →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
