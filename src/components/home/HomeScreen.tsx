import { useMemo, useState } from 'react';
import {
  getCategoryGroups,
  moduleCount,
  searchModules,
} from '../../lib/content';
import { VERSION } from '../../../version.js';
import CategoryCard from './CategoryCard';
import ModuleCard from './ModuleCard';

export default function HomeScreen() {
  const groups = getCategoryGroups();
  const count = moduleCount();

  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;
  const results = useMemo(() => searchModules(query), [query]);

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

      <div className="px-5 pb-10">
        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules…"
            aria-label="Search modules"
            className="w-full rounded-full border border-line bg-surface py-3 pl-11 pr-10 text-sm text-text
                       placeholder:text-faint outline-none transition focus:border-accent/60 focus:bg-surface-2"
          />
          {searching && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full
                         text-muted transition hover:bg-surface-3 hover:text-text"
            >
              ✕
            </button>
          )}
        </div>

        {searching ? (
          /* Search results */
          <section>
            <div className="mb-4 flex items-baseline justify-between px-1">
              <h2 className="text-xl">Results</h2>
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-faint">
                {results.length} match{results.length === 1 ? '' : 'es'}
              </span>
            </div>

            {results.length === 0 ? (
              <p className="px-1 text-sm text-muted">
                No modules match “{query.trim()}”. Try a different word, or{' '}
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-accent underline-offset-2 hover:underline"
                >
                  browse by category
                </button>
                .
              </p>
            ) : (
              <div className="grid gap-3">
                {results.map((bundle) => (
                  <ModuleCard key={bundle.path} bundle={bundle} />
                ))}
              </div>
            )}
          </section>
        ) : (
          /* Category picker */
          <>
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
          </>
        )}

        <footer className="pt-8 text-center text-[0.7rem] text-faint">
          Origin · v{VERSION}
        </footer>
      </div>
    </div>
  );
}
