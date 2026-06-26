import { Link } from 'react-router-dom';
import type { ModuleBundle } from '../../types/content';
import { useCompletion } from '../../lib/useProgress';

export default function ModuleCard({ bundle }: { bundle: ModuleBundle }) {
  const done = useCompletion(bundle.path);
  const started = done > 0;
  const complete = done >= 1;
  const accent = bundle.meta.accent;

  return (
    <Link
      to={`/m/${bundle.path}`}
      className="group relative block overflow-hidden rounded-card border border-line bg-surface
                 p-5 transition hover:border-accent/50 hover:bg-surface-2 active:scale-[0.99]"
    >
      {/* accent glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60"
        style={{ background: accent ?? 'var(--color-accent)' }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-faint">
            {bundle.subcategoryName}
            {bundle.meta.period && /\d/.test(bundle.meta.period) ? ` · ${bundle.meta.period}` : ''}
          </div>
          <h3 className="mt-1.5 text-[1.35rem] leading-tight">{bundle.meta.title}</h3>
        </div>
        {complete ? (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-correct/15 text-sm text-correct">
            ✓
          </span>
        ) : (
          <span className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent">
            →
          </span>
        )}
      </div>

      {bundle.meta.summary && (
        <p className="relative mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {bundle.meta.summary}
        </p>
      )}

      {started && !complete && (
        <div className="relative mt-4 h-1 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.round(done * 100)}%` }}
          />
        </div>
      )}
    </Link>
  );
}
