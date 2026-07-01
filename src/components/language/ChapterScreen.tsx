import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChapter, getModuleBundle, isEnterable } from '../../lib/language/content';
import { useLanguageProfile, useLanguageStats } from '../../lib/language/useLanguage';
import TopBar from '../ui/TopBar';
import ProgressBar from '../ui/ProgressBar';
import { LANG } from './SpanishHome';

export default function ChapterScreen() {
  const navigate = useNavigate();
  const profile = useLanguageProfile(LANG);
  const stats = useLanguageStats(LANG);

  useEffect(() => {
    if (!profile.chapter) navigate('/learn/spanish', { replace: true });
  }, [profile.chapter, navigate]);

  const chapter = profile.chapter ? getChapter(LANG, profile.chapter) : undefined;
  if (!chapter) return null;

  const bundles = chapter.modules
    .map((slug) => getModuleBundle(LANG, slug))
    .filter((b): b is NonNullable<typeof b> => !!b);

  const enterable = bundles.filter(isEnterable);
  const doneCount = enterable.filter((b) => profile.completed.includes(b.module.slug)).length;

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <TopBar label={chapter.title} onClose={() => navigate('/learn/spanish')} back />

      <header className="bg-aurora px-6 pb-7 pt-4">
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
          {chapter.icon} {chapter.title}
        </div>
        <h1 className="mt-2 font-serif text-[2.2rem] leading-[1.08]">{chapter.summary}</h1>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs text-faint">
            <span>
              {doneCount} / {enterable.length} modules
            </span>
            <span>{stats.total} words learned</span>
          </div>
          <ProgressBar value={enterable.length ? doneCount / enterable.length : 0} />
        </div>

        <button
          onClick={() => navigate('/learn/spanish/review')}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs text-muted transition hover:border-accent/50 hover:text-text"
        >
          🧠 Review &amp; practice
          {stats.weak > 0 && <span className="text-wrong">· {stats.weak} to improve</span>}
        </button>
      </header>

      <div className="space-y-3 px-5 pb-10 pt-2">
        {bundles.map((b, i) => {
          const locked = !isEnterable(b);
          const complete = profile.completed.includes(b.module.slug);
          return (
            <button
              key={b.module.slug}
              disabled={locked}
              onClick={() => !locked && navigate(`/learn/spanish/lesson/${b.module.slug}`)}
              className={`group relative flex w-full items-start gap-4 overflow-hidden rounded-card border p-4 text-left transition active:scale-[0.99] ${
                locked
                  ? 'cursor-not-allowed border-line-soft bg-surface/40 opacity-60'
                  : 'border-line bg-surface hover:border-accent/50 hover:bg-surface-2'
              } ${complete ? 'border-correct/40' : ''}`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-ink text-xl">
                {b.module.icon ?? i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[1.2rem] leading-tight">{b.module.title}</h3>
                  {b.module.kind === 'personalized' && !locked && (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wider text-accent">
                      For you
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{b.module.summary}</p>
              </div>
              <span className="mt-1 shrink-0 text-sm">
                {complete ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-correct/15 text-correct">
                    ✓
                  </span>
                ) : locked ? (
                  <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[0.58rem] uppercase tracking-wider text-faint">
                    Soon
                  </span>
                ) : (
                  <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-accent">
                    →
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
