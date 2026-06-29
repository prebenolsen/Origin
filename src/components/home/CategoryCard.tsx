import { Link } from 'react-router-dom';
import type { CategoryGroup } from '../../types/content';

/** A tappable card on the Home picker that leads into one category. */
export default function CategoryCard({ group }: { group: CategoryGroup }) {
  const moduleTotal = group.subcategories.reduce(
    (n, s) => n + s.modules.length,
    0,
  );
  const topicCount = group.subcategories.length;
  const bookCount = group.bookCount;
  const subNames = group.subcategories.map((s) => s.name);

  // Borrow a representative accent from the first module that defines one.
  const accent = group.subcategories
    .flatMap((s) => s.modules)
    .find((m) => m.meta.accent)?.meta.accent;

  return (
    <Link
      to={`/c/${group.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface
                 p-5 transition hover:border-accent/50 hover:bg-surface-2 active:scale-[0.99]
                 min-h-[160px]"
    >
      {/* accent glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60"
        style={{ background: accent ?? 'var(--color-accent)' }}
      />

      {/* Title at top */}
      <div className="relative flex-1">
        <h3 className="text-[1.5rem] leading-tight">{group.name}</h3>
      </div>

      {/* Metadata at bottom */}
      <div className="relative pt-3 border-t border-line/50 space-y-1">
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted whitespace-nowrap">
          {moduleTotal} module{moduleTotal === 1 ? '' : 's'}
        </div>
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted whitespace-nowrap">
          {topicCount} topic{topicCount === 1 ? '' : 's'}
          {bookCount > 0 && (
            <>
              {' '}
              · {bookCount} book{bookCount === 1 ? '' : 's'}
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
