import type { TimelineEvent } from '../../types/content';

interface Props {
  events: TimelineEvent[];
  /** Index of the currently-active milestone (-1 = none yet). */
  activeIndex: number;
  onSelect?: (index: number) => void;
}

/**
 * The persistent timeline shown above the story feed. It is always visible
 * while reading so learners keep a mental model of *when* they are. The active
 * story card drives `activeIndex`.
 */
export default function Timeline({ events, activeIndex, onSelect }: Props) {
  if (events.length === 0) return null;

  const active = events[Math.max(0, activeIndex)] ?? events[0];
  const pos = (i: number) =>
    events.length > 1 ? (i / (events.length - 1)) * 100 : 50;
  const fill = activeIndex < 0 ? 0 : pos(activeIndex);

  return (
    <div className="px-5 pb-3 pt-1">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-serif text-2xl leading-none text-accent">
            {active.year}
          </div>
          <div className="mt-1 text-[0.72rem] text-muted">{active.title}</div>
        </div>
        <div className="text-[0.62rem] uppercase tracking-[0.18em] text-faint">
          Timeline
        </div>
      </div>

      <div className="relative mt-3 h-6">
        {/* base line */}
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        {/* progress line */}
        <div
          className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${fill}%` }}
        />
        {/* milestone dots */}
        {events.map((e, i) => {
          const reached = i <= activeIndex;
          const current = i === activeIndex;
          return (
            <button
              key={`${e.year}-${i}`}
              onClick={() => onSelect?.(i)}
              aria-label={`${e.year} — ${e.title}`}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 p-1"
              style={{ left: `${pos(i)}%` }}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  current
                    ? 'h-3.5 w-3.5 bg-accent ring-4 ring-accent/25'
                    : reached
                      ? 'h-2.5 w-2.5 bg-accent'
                      : 'h-2.5 w-2.5 bg-faint'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
