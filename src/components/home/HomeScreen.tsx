import { getCategoryGroups, moduleCount } from '../../lib/content';
import { VERSION } from '../../../version.js';
import CategoryCard from './CategoryCard';

export default function HomeScreen() {
  const groups = getCategoryGroups();
  const count = moduleCount();

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      {/* Hero */}
      <header className="bg-aurora px-6 pb-8 pt-12">
        <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-accent">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Origin
        </div>
        <h1 className="mt-4 max-w-[14ch] font-serif text-[2.6rem] leading-[1.05]">
          Learn how things <em className="not-italic text-accent">began</em>.
        </h1>
        <p className="mt-3 max-w-[32ch] text-[0.95rem] leading-relaxed text-muted">
          Short, story-driven lessons. One idea at a time — scroll, see it,
          remember it.
        </p>
        <div className="mt-5 text-xs text-faint">
          {count} module{count === 1 ? '' : 's'} across {groups.length}{' '}
          categor{groups.length === 1 ? 'y' : 'ies'}
        </div>
      </header>

      {/* Category picker */}
      <div className="px-5 pb-10">
        <div className="mb-4 flex items-baseline justify-between px-1">
          <h2 className="text-xl">Choose a category</h2>
        </div>

        {groups.length === 0 ? (
          <p className="px-1 text-sm text-muted">
            No modules found yet. Add content under{' '}
            <code className="text-accent">src/content/</code>.
          </p>
        ) : (
          <div className="grid gap-3">
            {groups.map((group) => (
              <CategoryCard key={group.slug} group={group} />
            ))}
          </div>
        )}

        <footer className="pt-8 text-center text-[0.7rem] text-faint">
          Origin · v{VERSION}
        </footer>
      </div>
    </div>
  );
}
