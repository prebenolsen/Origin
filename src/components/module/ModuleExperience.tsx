import { Outlet, useOutletContext, useParams, useNavigate, Link } from 'react-router-dom';
import { getModule } from '../../lib/content';
import type { ModuleBundle } from '../../types/content';

export type StageSlug = '' | 'story' | 'quiz' | 'flashcards';

export interface ModuleContext {
  bundle: ModuleBundle;
  /** Base path: `/m/category/subcategory/module`. */
  base: string;
  /** Navigate to a stage within this module. */
  go: (stage: StageSlug) => void;
  /** Leave the module (back to Home). */
  exit: () => void;
}

/** Hook for stage components to read the loaded module + navigation helpers. */
export function useModule(): ModuleContext {
  return useOutletContext<ModuleContext>();
}

export default function ModuleExperience() {
  const { cat, sub, mod } = useParams();
  const navigate = useNavigate();
  const bundle: ModuleBundle | undefined = getModule(cat!, sub!, mod!);

  if (!bundle) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <h2 className="text-xl">Module not found</h2>
        <p className="text-sm text-muted">
          No content exists at <code className="text-accent">{`${cat}/${sub}/${mod}`}</code>.
        </p>
        <Link
          to="/"
          className="mt-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink"
        >
          Back to Origin
        </Link>
      </div>
    );
  }

  const base = `/m/${bundle.path}`;
  const ctx: ModuleContext = {
    bundle,
    base,
    go: (stage) => navigate(stage ? `${base}/${stage}` : base),
    exit: () => navigate('/'),
  };

  return <Outlet context={ctx} />;
}
