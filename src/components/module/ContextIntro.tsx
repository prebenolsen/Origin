import { useEffect } from 'react';
import { useModule, type StageSlug } from './ModuleExperience';
import { markStage } from '../../lib/progress';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import ContextMap from './ContextMap';

export default function ContextIntro() {
  const { bundle, go, exit } = useModule();
  const { meta } = bundle;
  const ctx = meta.context;

  useEffect(() => {
    markStage(bundle.path, 'intro');
  }, [bundle.path]);

  // Where to go when the learner begins.
  const firstStage: StageSlug =
    bundle.story.length > 0 ? 'story' : bundle.quiz.length > 0 ? 'quiz' : 'flashcards';

  const showMap = (ctx.type === 'map' || ctx.type === 'schematic') && ctx.map;

  const stats = [
    bundle.story.length > 0 && `${bundle.story.length} cards`,
    bundle.quiz.length > 0 && `${bundle.quiz.length} questions`,
    bundle.flashcards.length > 0 && `${bundle.flashcards.length} flashcards`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex h-full flex-col">
      <TopBar label="Introduction" onClose={exit} />

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">
        <div className="animate-rise">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
            {bundle.categoryName} · {bundle.subcategoryName}
          </div>
          <h1 className="mt-2 font-serif text-[2.3rem] leading-[1.08]">{meta.title}</h1>
          {meta.period && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {meta.period}
            </div>
          )}
        </div>

        {showMap && (
          <div className="mt-6 animate-rise" style={{ animationDelay: '60ms' }}>
            <ContextMap data={ctx.map!} />
          </div>
        )}

        {ctx.type === 'image' && ctx.image && (
          <div className="mt-6 flex aspect-[8/5] w-full items-center justify-center rounded-2xl border border-line bg-surface text-xs text-faint">
            {ctx.image}
          </div>
        )}

        <div className="mt-6 animate-rise" style={{ animationDelay: '120ms' }}>
          {ctx.headline && (
            <h2 className="text-lg text-accent-soft">{ctx.headline}</h2>
          )}
          <p className="mt-2 text-[1.02rem] leading-relaxed text-text/90">
            {ctx.description}
          </p>
          {ctx.when && (
            <p className="mt-3 text-sm text-muted">
              <span className="text-faint">When · </span>
              {ctx.when}
            </p>
          )}
        </div>

        {(stats.length > 0 || bundle.books.length > 0) && (
          <div className="mt-6">
            {stats.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stats.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-surface px-3 py-1.5 text-xs text-muted"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
            {bundle.books.length > 0 && (
              <Button
                variant="outline"
                className="mt-3 w-full"
                onClick={() => go('book')}
              >
                This module has a book associated to it. Click to start it.
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
        <Button full onClick={() => go(firstStage)}>
          Begin
        </Button>
      </div>
    </div>
  );
}
