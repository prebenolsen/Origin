import { useState } from 'react';
import {
  COUNTRY_SUGGESTIONS,
  spanishCountry,
  type Learner,
} from '../../lib/language/learner';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';

interface Props {
  /** Existing details, so editing pre-fills the form. */
  initial?: Learner;
  onDone: (learner: Learner) => void;
  onExit: () => void;
  /** `true` when re-opened from the home screen rather than first run. */
  editing?: boolean;
}

/**
 * One-time (re-editable) onboarding: the learner types who they are. The
 * answers are woven straight into the lessons - `Me llamo <name>`, `Soy de
 * <country>`, `Tengo <age> anos` - so the very first thing they learn to say is
 * true about them.
 */
export default function Onboarding({ initial, onDone, onExit, editing }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [age, setAge] = useState(initial?.age != null ? String(initial.age) : '');

  const save = () => {
    const trimmedCountry = country.trim();
    const parsedAge = parseInt(age, 10);
    onDone({
      name: name.trim() || undefined,
      city: city.trim() || undefined,
      country: trimmedCountry || undefined,
      countryEs: spanishCountry(trimmedCountry),
      age: Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : undefined,
    });
  };

  const esCountry = spanishCountry(country.trim());
  const previewName = name.trim() || 'Ana';

  const field =
    'mt-1.5 w-full rounded-xl border border-line bg-surface px-4 py-3 text-[1rem] text-text outline-none transition placeholder:text-faint focus:border-accent/60';
  const labelCls =
    'text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-faint';

  return (
    <div className="flex h-full flex-col">
      <TopBar label={editing ? 'Edit your details' : 'Welcome'} onClose={onExit} back />

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-2">
        <h1 className="font-serif text-[2rem] leading-[1.1]">A little about you</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Your lessons will use these so the first things you learn to say are actually
          true - your name, where you're from, your age. You can skip any of them.
        </p>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className={labelCls}>Name</span>
            <input
              className={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Preben"
              autoComplete="given-name"
            />
          </label>

          <label className="block">
            <span className={labelCls}>Country</span>
            <input
              className={field}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Norway"
              list="onboarding-countries"
              autoComplete="country-name"
            />
            <datalist id="onboarding-countries">
              {COUNTRY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            {esCountry && esCountry.toLowerCase() !== country.trim().toLowerCase() && (
              <span className="mt-1 block text-xs text-faint">
                In Spanish: <span className="text-accent">{esCountry}</span>
              </span>
            )}
          </label>

          <label className="block">
            <span className={labelCls}>City (optional)</span>
            <input
              className={field}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bergen"
              autoComplete="address-level2"
            />
          </label>

          <label className="block">
            <span className={labelCls}>Age</span>
            <input
              className={field}
              value={age}
              onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              placeholder="e.g. 36"
              inputMode="numeric"
            />
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
          <div className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-accent">
            You'll learn to say
          </div>
          <p className="mt-1.5 font-serif text-[1.05rem] text-text">
            Me llamo {previewName}.
            {esCountry ? ` Soy de ${esCountry}.` : ''}
            {age.trim() ? ` Tengo ${age.trim()} años.` : ''}
          </p>
        </div>
      </div>

      <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
        <Button full onClick={save}>
          {editing ? 'Save' : 'Start learning'}
        </Button>
      </div>
    </div>
  );
}
