import { getCategoryGroups, moduleCount } from '../../lib/content';
import { VERSION } from '../../../version.js';
import ModuleCard from './ModuleCard';

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
          {count} module{count === 1 ? '' : 's'} ready to explore
        </div>
      </header>

      {/* Library */}
      <div className="space-y-10 px-5 pb-10">
        {groups.length === 0 && (
          <p className="px-1 text-sm text-muted">
            No modules found yet. Add content under{' '}
            <code className="text-accent">src/content/</code>.
          </p>
        )}

        {groups.map((group) => (
          <section key={group.slug}>
            <div className="mb-4 flex items-baseline justify-between px-1">
              <h2 className="text-xl">{group.name}</h2>
              <span className="text-[0.7rem] uppercase tracking-[0.18em] text-faint">
                {group.subcategories.reduce((n, s) => n + s.modules.length, 0)}{' '}
                modules
              </span>
            </div>

            <div className="space-y-7">
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
          </section>
        ))}

        <footer className="pt-2 text-center text-[0.7rem] text-faint">
          Origin · v{VERSION}
        </footer>
      </div>
    </div>
  );
}
