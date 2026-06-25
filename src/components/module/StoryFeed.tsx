import { useEffect, useMemo, useRef, useState } from 'react';
import { useModule } from './ModuleExperience';
import { markStage } from '../../lib/progress';
import { yearValue } from '../../lib/text';
import StoryCard from './StoryCard';
import Timeline from './Timeline';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';

export default function StoryFeed() {
  const { bundle, go, exit } = useModule();
  const { story, timeline } = bundle;
  const mapData = bundle.meta.context.map;

  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // Map each story card to a timeline milestone (carry the last one forward
  // when a card declares no year of its own).
  const timelineForCard = useMemo(() => {
    const out: number[] = [];
    let last = -1;
    for (const card of story) {
      let idx = last;
      if (timeline.length && card.timeline) {
        const exact = timeline.findIndex((e) => e.year === card.timeline);
        if (exact >= 0) {
          idx = exact;
        } else {
          const cv = yearValue(card.timeline);
          if (cv != null) {
            let best = last;
            timeline.forEach((e, i) => {
              const ev = yearValue(e.year);
              if (ev != null && ev <= cv) best = i;
            });
            idx = best;
          }
        }
      }
      if (idx < 0 && timeline.length) idx = 0;
      out.push(idx);
      last = idx;
    }
    return out;
  }, [story, timeline]);

  const pages = story.length + 1; // + end card

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = Number((visible.target as HTMLElement).dataset.index);
          if (!Number.isNaN(idx)) setActive(idx);
        }
      },
      { root, threshold: [0.5, 0.75] },
    );
    cardRefs.current.slice(0, pages).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [pages]);

  useEffect(() => {
    if (active >= story.length - 1) markStage(bundle.path, 'story');
  }, [active, story.length, bundle.path]);

  const activeTimeline =
    active < story.length ? timelineForCard[active] ?? -1 : timeline.length - 1;

  const nextStage = bundle.quiz.length > 0 ? 'quiz' : 'flashcards';

  const onSelectMilestone = (mi: number) => {
    const target = timelineForCard.findIndex((t) => t === mi);
    if (target >= 0)
      cardRefs.current[target]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Empty story fallback.
  if (story.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <TopBar label={bundle.meta.title} onClose={exit} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-muted">This module has no story cards yet.</p>
          <Button onClick={() => go(nextStage)}>Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-line-soft bg-ink/70 backdrop-blur">
        <TopBar label={bundle.meta.title} onClose={exit} />
        {timeline.length > 0 && (
          <Timeline
            events={timeline}
            activeIndex={activeTimeline}
            onSelect={onSelectMilestone}
          />
        )}
      </div>

      <div ref={scrollRef} className="snap-feed no-scrollbar min-h-0 flex-1 overflow-y-auto">
        {story.map((card, i) => (
          <StoryCard
            key={card.id ?? i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            card={card}
            index={i}
            total={story.length}
            active={active === i}
            mapData={mapData}
          />
        ))}

        {/* End-of-story call to action */}
        <div
          ref={(el) => {
            cardRefs.current[story.length] = el;
          }}
          data-index={story.length}
          className="snap-page flex h-full flex-col items-center justify-center gap-5 px-8 text-center"
        >
          <div className="font-serif text-5xl text-accent">✦</div>
          <h2 className="font-serif text-2xl leading-tight">You've reached the end</h2>
          <p className="max-w-[28ch] text-sm leading-relaxed text-muted">
            That's the whole story. Now lock it in.
          </p>
          <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
            {bundle.quiz.length > 0 && (
              <Button full onClick={() => go('quiz')}>
                Test yourself
              </Button>
            )}
            {bundle.flashcards.length > 0 && (
              <Button full variant="outline" onClick={() => go('flashcards')}>
                Review flashcards
              </Button>
            )}
            <Button full variant="ghost" onClick={exit}>
              Back to library
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
