import { forwardRef } from 'react';
import type { ContextMapData, StoryCard as StoryCardType } from '../../types/content';
import StoryVisual from './StoryVisual';

interface Props {
  card: StoryCardType;
  index: number;
  total: number;
  active: boolean;
  mapData?: ContextMapData;
}

const StoryCard = forwardRef<HTMLDivElement, Props>(function StoryCard(
  { card, index, total, active, mapData },
  ref,
) {
  return (
    <article
      ref={ref}
      data-index={index}
      className="snap-page flex h-full flex-col px-6 py-5"
    >
      <div className="flex items-center justify-between text-[0.7rem] text-faint">
        <span className="font-semibold tracking-[0.18em] text-muted">
          {String(index + 1).padStart(2, '0')}
          <span className="text-faint"> / {String(total).padStart(2, '0')}</span>
        </span>
        {card.timeline && (
          <span className="rounded-full border border-line px-2.5 py-1 text-accent-soft">
            {card.timeline}
          </span>
        )}
      </div>

      <div className={`reveal flex flex-1 flex-col justify-center ${active ? 'is-active' : ''}`}>
        {card.visual && (
          <div className="mb-6">
            <StoryVisual visual={card.visual} mapData={mapData} />
          </div>
        )}
        <h2 className="font-serif text-[1.9rem] leading-[1.12]">{card.title}</h2>
        <p className="mt-4 text-[1.08rem] leading-[1.65] text-text/90">{card.content}</p>
      </div>

      {card.next && (
        <div className="mt-4 border-t border-line-soft pt-4">
          <div className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-faint">
            Next
          </div>
          <div className="mt-1 flex items-center gap-2 text-accent-soft">
            <span className="text-[0.98rem]">{card.next}</span>
          </div>
        </div>
      )}
    </article>
  );
});

export default StoryCard;
