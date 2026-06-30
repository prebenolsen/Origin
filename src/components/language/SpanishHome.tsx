import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLanguage } from '../../lib/language/content';
import { setGoal, setLearner } from '../../lib/language/profile';
import type { Learner } from '../../lib/language/learner';
import { useLanguageProfile, useLanguageStats } from '../../lib/language/useLanguage';
import TopBar from '../ui/TopBar';
import Onboarding from './Onboarding';

export const LANG = 'spanish';

export default function SpanishHome() {
  const navigate = useNavigate();
  const language = getLanguage(LANG);
  const profile = useLanguageProfile(LANG);
  const stats = useLanguageStats(LANG);
  const [editingProfile, setEditingProfile] = useState(false);

  // First visit (or "edit details"): collect who the learner is before anything
  // else, so every lesson can speak to them by name.
  const needsOnboarding = profile.learner == null;
  if (language && (needsOnboarding || editingProfile)) {
    const saveLearner = (learner: Learner) => {
      setLearner(LANG, learner);
      setEditingProfile(false);
    };
    return (
      <Onboarding
        initial={profile.learner}
        editing={editingProfile}
        onDone={saveLearner}
        onExit={() => (editingProfile ? setEditingProfile(false) : navigate('/'))}
      />
    );
  }

  if (!language) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <h2 className="text-xl">Language not found</h2>
        <p className="text-sm text-muted">No content exists for Spanish yet.</p>
      </div>
    );
  }

  const chooseGoal = (slug: string) => {
    setGoal(LANG, slug);
    navigate('/learn/spanish/path');
  };

  return (
    <div className="no-scrollbar h-full overflow-y-auto">
      <TopBar label="Languages" onClose={() => navigate('/')} back />

      <header className="bg-aurora px-6 pb-8 pt-4">
        <div className="text-5xl">{language.flag}</div>
        <h1 className="mt-3 font-serif text-[2.6rem] leading-[1.05]">
          {language.name}
          <span className="ml-2 align-middle text-base text-muted">{language.nativeName}</span>
        </h1>
        <p className="mt-3 max-w-[34ch] text-[0.95rem] leading-relaxed text-muted">
          {language.tagline}
        </p>

        <button
          onClick={() => setEditingProfile(true)}
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-text"
        >
          {profile.learner?.name ? `¡Hola, ${profile.learner.name}!` : 'Add your details'}
          <span className="text-faint underline">edit</span>
        </button>

        {stats.total > 0 && (
          <button
            onClick={() => navigate('/learn/spanish/review')}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs text-muted transition hover:border-accent/50 hover:text-text"
          >
            <span className="font-semibold text-accent">{stats.total}</span> words learned
            {stats.due > 0 && <span className="text-faint">· {stats.due} due</span>}
            <span className="text-faint">· Review →</span>
          </button>
        )}
      </header>

      <div className="px-5 pb-10">
        {profile.goal && (
          <button
            onClick={() => navigate('/learn/spanish/path')}
            className="group mb-6 block w-full overflow-hidden rounded-card border border-accent/40 bg-surface p-5 text-left transition hover:bg-surface-2 active:scale-[0.99]"
          >
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent">
              Continue
            </div>
            <h3 className="mt-1.5 text-[1.4rem] leading-tight">
              {language.goals.find((g) => g.slug === profile.goal)?.title ?? 'Your path'}
            </h3>
            <p className="mt-1 text-sm text-muted">Pick up where you left off →</p>
          </button>
        )}

        <div className="mb-4 flex items-baseline justify-between px-1">
          <h2 className="text-xl">What's your goal?</h2>
        </div>
        <p className="mb-4 px-1 text-sm text-muted">
          Your goal shapes the whole learning path. We start with the words and phrases that
          situation needs first.
        </p>

        <div className="grid gap-3">
          {language.goals.map((goal) => {
            const active = profile.goal === goal.slug;
            return (
              <button
                key={goal.slug}
                disabled={!goal.available}
                onClick={() => goal.available && chooseGoal(goal.slug)}
                className={`group relative block overflow-hidden rounded-card border p-5 text-left transition active:scale-[0.99] ${
                  goal.available
                    ? 'border-line bg-surface hover:border-accent/50 hover:bg-surface-2'
                    : 'cursor-not-allowed border-line-soft bg-surface/50 opacity-60'
                } ${active ? 'border-accent/60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2 text-[1.3rem] leading-tight">
                      <span>{goal.icon}</span>
                      <span>{goal.title}</span>
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{goal.summary}</p>
                  </div>
                  {goal.available ? (
                    <span className="mt-1 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent">
                      →
                    </span>
                  ) : (
                    <span className="mt-1 shrink-0 rounded-full bg-surface-3 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-faint">
                      Soon
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
