import { useNavigate } from 'react-router-dom';
import { getAll } from '../../lib/language/srs';
import { useLanguageStats } from '../../lib/language/useLanguage';
import TopBar from '../ui/TopBar';
import { LANG } from './SpanishHome';

function ModeCard({
  title,
  summary,
  hint,
  onClick,
  disabled,
}: {
  title: string;
  summary: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-card border p-5 text-left transition active:scale-[0.99] ${
        disabled
          ? 'cursor-not-allowed border-line-soft bg-surface/40 opacity-60'
          : 'border-line bg-surface hover:border-accent/50 hover:bg-surface-2'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[1.22rem] leading-tight">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{summary}</p>
          {hint && <p className="mt-2 text-xs text-faint">{hint}</p>}
        </div>
        <span className="text-muted">→</span>
      </div>
    </button>
  );
}

export default function ReviewModePicker() {
  const navigate = useNavigate();
  const stats = useLanguageStats(LANG);
  const totalPairs = getAll(LANG).length;

  if (stats.total === 0) {
    return (
      <div className="flex h-full flex-col">
        <TopBar label="Review" onClose={() => navigate('/learn/spanish')} back />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="text-4xl">🧠</div>
          <h2 className="font-serif text-xl">Nothing to review yet</h2>
          <p className="text-sm text-muted">
            Finish a lesson and your words will show up here for practice.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <TopBar label="Review" onClose={() => navigate('/learn/spanish')} back />

      <header className="bg-aurora px-6 pb-6 pt-4">
        <h1 className="font-serif text-[2.2rem] leading-[1.05]">Choose review mode</h1>
        <p className="mt-2 max-w-[36ch] text-sm text-muted">
          Keep your words fresh with adaptive review, or train fast recall with bilingual matching.
        </p>
      </header>

      <div className="space-y-3 px-5 pb-10 pt-3">
        <ModeCard
          title="Classic Review"
          summary="Adaptive recognition, recall, and production practice based on your memory state."
          hint={`${stats.total} words learned${stats.weak > 0 ? ` · ${stats.weak} to improve` : ''}`}
          onClick={() => navigate('/learn/spanish/review/classic')}
        />

        <ModeCard
          title="Word-Matching Test"
          summary="Duolingo-style bilingual matching: pair English and Spanish quickly in batches of 6."
          hint={`${totalPairs} pairs available`}
          onClick={() => navigate('/learn/spanish/review/matching')}
        />
      </div>
    </div>
  );
}
