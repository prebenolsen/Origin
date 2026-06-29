import { useState } from 'react';
import type { Personalize, VocabOption } from '../../types/language';
import { vocabId } from '../../lib/language/srs';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';

interface Props {
  data: Personalize;
  /** Pre-selected words (so returning learners see their picks). */
  initial?: VocabOption[];
  onDone: (selected: VocabOption[]) => void;
  onExit: () => void;
}

export default function PersonalizeStep({ data, initial = [], onDone, onExit }: Props) {
  const [picked, setPicked] = useState<Record<string, VocabOption>>(() => {
    const map: Record<string, VocabOption> = {};
    for (const o of initial) map[vocabId(o.es)] = o;
    return map;
  });

  const toggle = (opt: VocabOption) => {
    const id = vocabId(opt.es);
    setPicked((prev) => {
      const copy = { ...prev };
      if (copy[id]) delete copy[id];
      else copy[id] = opt;
      return copy;
    });
  };

  const selected = Object.values(picked);
  const count = selected.length;

  return (
    <div className="flex h-full flex-col">
      <TopBar label="Personalize" onClose={onExit} back />

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-2">
        <h1 className="font-serif text-[2rem] leading-[1.1]">{data.prompt}</h1>
        {data.intro && <p className="mt-2 text-sm leading-relaxed text-muted">{data.intro}</p>}

        <div className="mt-6 space-y-6">
          {data.groups.map((group) => (
            <div key={group.category}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-faint">
                  {group.label}
                </span>
                <span className="h-px flex-1 bg-line-soft" />
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const on = !!picked[vocabId(opt.es)];
                  return (
                    <button
                      key={opt.en}
                      onClick={() => toggle(opt)}
                      className={`rounded-full border px-3.5 py-2 text-sm transition active:scale-95 ${
                        on
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-line bg-surface text-text hover:border-accent/50'
                      }`}
                    >
                      {on && <span className="mr-1">✓</span>}
                      {opt.en}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
        <Button full disabled={count === 0} onClick={() => onDone(selected)}>
          {count === 0
            ? 'Pick what you buy'
            : `Build my lesson · ${count} word${count === 1 ? '' : 's'}`}
        </Button>
      </div>
    </div>
  );
}
