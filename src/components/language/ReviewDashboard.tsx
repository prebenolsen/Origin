import { useNavigate } from 'react-router-dom';
import { getScenarioBundle } from '../../lib/language/content';
import { getAll, getWeak } from '../../lib/language/srs';
import { useLanguageStats } from '../../lib/language/useLanguage';
import TopBar from '../ui/TopBar';
import { LANG } from './SpanishHome';

function Stat({ value, label, tone }: { value: number; label: string; tone?: 'accent' | 'correct' | 'wrong' }) {
  const color = tone === 'correct' ? 'text-correct' : tone === 'wrong' ? 'text-wrong' : 'text-accent';
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-4 text-center">
      <div className={`font-serif text-2xl ${color}`}>{value}</div>
      <div className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-faint">{label}</div>
    </div>
  );
}

export default function ReviewDashboard() {
  const navigate = useNavigate();
  const stats = useLanguageStats(LANG);
  const weak = getWeak(LANG).slice(0, 6);

  // Scenarios the learner has words from, for category testing.
  const byScenario = new Map<string, number>();
  for (const s of getAll(LANG)) byScenario.set(s.scenario, (byScenario.get(s.scenario) ?? 0) + 1);

  if (stats.total === 0) {
    return (
      <div className="flex h-full flex-col">
        <TopBar label="Classic Review" onClose={() => navigate('/learn/spanish/review')} back />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="text-4xl">🧠</div>
          <h2 className="font-serif text-xl">Nothing to review yet</h2>
          <p className="text-sm text-muted">
            Finish a lesson and your words will start showing up here for spaced practice.
          </p>
        </div>
      </div>
    );
  }

  const Action = ({
    label,
    sub,
    onClick,
    disabled,
    tone,
  }: {
    label: string;
    sub?: string;
    onClick: () => void;
    disabled?: boolean;
    tone?: 'primary' | 'wrong';
  }) => (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
        disabled
          ? 'cursor-not-allowed border-line-soft opacity-50'
          : tone === 'wrong'
            ? 'border-wrong/40 bg-wrong/5 hover:border-wrong/60'
            : 'border-line bg-surface hover:border-accent/50 hover:bg-surface-2'
      }`}
    >
      <div>
        <div className="text-[1.02rem]">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
      </div>
      <span className="text-muted">→</span>
    </button>
  );

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <TopBar label="Classic Review" onClose={() => navigate('/learn/spanish/review')} back />

      <header className="bg-aurora px-6 pb-6 pt-4">
        <h1 className="font-serif text-[2.2rem] leading-[1.05]">Your Spanish</h1>
        <div className="mt-4 grid grid-cols-4 gap-2">
          <Stat value={stats.total} label="Learned" />
          <Stat value={stats.strong} label="Strong" tone="correct" />
          <Stat value={stats.weak} label="Improve" tone="wrong" />
          <Stat value={stats.fresh} label="New" />
        </div>
      </header>

      <div className="space-y-3 px-5 pb-10 pt-2">
        <Action
          label="Review all words"
          sub={`Test me on all ${stats.total} words I know`}
          onClick={() => navigate('/learn/spanish/review/all')}
        />
        <Action
          label="Practice weak words"
          sub={stats.weak > 0 ? `${stats.weak} words need work` : 'Nothing struggling right now'}
          tone="wrong"
          disabled={stats.weak === 0}
          onClick={() => navigate('/learn/spanish/review/weak')}
        />
        <Action
          label="This week's vocabulary"
          sub="Words you learned recently"
          onClick={() => navigate('/learn/spanish/review/recent')}
        />

        {weak.length > 0 && (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-wrong">
              Words to improve
            </div>
            <div className="mt-3 grid gap-2">
              {weak.map((w) => (
                <div key={w.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-serif text-[1.05rem] text-accent">{w.es}</span>
                  <span className="text-muted">{w.en}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/learn/spanish/review/weak')}
              className="mt-3 w-full rounded-full bg-wrong/15 px-4 py-2.5 text-sm font-semibold text-wrong transition hover:bg-wrong/25"
            >
              Train these now
            </button>
          </div>
        )}

        {byScenario.size > 0 && (
          <div>
            <div className="mb-2 mt-4 px-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-faint">
              Test by scenario
            </div>
            <div className="grid gap-2">
              {[...byScenario.entries()].map(([path, n]) => {
                const slug = path.split('/')[1] ?? path;
                const title = getScenarioBundle(LANG, slug)?.scenario.title ?? slug;
                return (
                  <Action
                    key={path}
                    label={`Test my ${title.toLowerCase()} vocabulary`}
                    sub={`${n} word${n === 1 ? '' : 's'}`}
                    onClick={() => navigate(`/learn/spanish/review/s-${slug}`)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
