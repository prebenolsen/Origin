import { Link, useParams } from 'react-router-dom';
import { getCategory } from '../../lib/content';
import ModuleCard from './ModuleCard';

export default function CategoryScreen() {
  const { cat } = useParams();
  const group = cat ? getCategory(cat) : undefined;

  if (!group) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <h2 className="text-xl">Category not found</h2>
        <p className="text-sm text-muted">
          No published modules exist under{' '}
          <code className="text-accent">{cat}</code>.
        </p>
        <Link
          to="/"
          className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink"
        >
          All categories
        </Link>
      </div>
    );
  }

  const moduleTotal = group.subcategories.reduce(
    (n, s) => n + s.modules.length,
    0,
  );
  const topicCount = group.subcategories.length;

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      {/* Header */}
      <header className="bg-aurora px-6 pb-8 pt-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted transition hover:text-accent"
        >
          ← All categories
        </Link>
        <h1 className="mt-4 max-w-[16ch] font-serif text-[2.4rem] leading-[1.05]">
          {group.name}
        </h1>
        <div className="mt-3 text-xs text-faint">
          {moduleTotal} module{moduleTotal === 1 ? '' : 's'} · {topicCount} topic
          {topicCount === 1 ? '' : 's'}
        </div>
      </header>

      {/* Modules grouped by subcategory */}
      <div className="space-y-7 px-5 pb-10">
        {group.subcategories.map((sub) => (
          <div key={sub.slug}>
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span className="h-px flex-1 bg-line-soft" />
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted">
                {sub.name}
              </span>
              <span className="h-px flex-1 bg-line-soft" />
            </div>
            <div className="grid gap-3">
              {sub.modules.map((bundle) => (
                <ModuleCard key={bundle.path} bundle={bundle} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
