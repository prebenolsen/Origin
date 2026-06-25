import { useEffect, useState } from 'react';
import { useModule } from './ModuleExperience';
import { markStage } from '../../lib/progress';
import TopBar from '../ui/TopBar';
import ProgressBar from '../ui/ProgressBar';
import Button from '../ui/Button';

export default function FlashcardStage() {
  const { bundle, go, exit } = useModule();
  const cards = bundle.flashcards;

  const [deck, setDeck] = useState<number[]>(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewPile, setReviewPile] = useState<number[]>([]);
  const [known, setKnown] = useState(0);
  const [phase, setPhase] = useState<'cards' | 'summary'>('cards');

  useEffect(() => {
    markStage(bundle.path, 'flashcards');
  }, [bundle.path]);

  if (cards.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <TopBar label="Flashcards" onClose={exit} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-muted">No flashcards for this module yet.</p>
          <Button onClick={exit}>Back to library</Button>
        </div>
      </div>
    );
  }

  const advance = (toReview: boolean) => {
    const cardIndex = deck[pos];
    const nextReview = toReview ? [...reviewPile, cardIndex] : reviewPile;
    if (!toReview) setKnown((k) => k + 1);
    setReviewPile(nextReview);
    if (pos + 1 >= deck.length) {
      setPhase('summary');
    } else {
      setPos((p) => p + 1);
      setFlipped(false);
    }
  };

  const reviewMissed = () => {
    setDeck(reviewPile);
    setReviewPile([]);
    setKnown(0);
    setPos(0);
    setFlipped(false);
    setPhase('cards');
  };

  const restart = () => {
    setDeck(cards.map((_, i) => i));
    setReviewPile([]);
    setKnown(0);
    setPos(0);
    setFlipped(false);
    setPhase('cards');
  };

  if (phase === 'summary') {
    const missed = reviewPile.length;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="animate-pop font-serif text-5xl text-accent">✦</div>
        <div>
          <h2 className="font-serif text-2xl">Deck complete</h2>
          <p className="mt-2 text-sm text-muted">
            {known} known · {missed} to review
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          {missed > 0 && (
            <Button full onClick={reviewMissed}>
              Review {missed} card{missed === 1 ? '' : 's'} again
            </Button>
          )}
          <Button full variant="outline" onClick={restart}>
            Restart deck
          </Button>
          <Button full variant="ghost" onClick={exit}>
            Back to library
          </Button>
        </div>
      </div>
    );
  }

  const card = cards[deck[pos]];

  return (
    <div className="flex h-full flex-col">
      <TopBar label="Flashcards" onClose={exit} />

      <div className="px-5">
        <div className="mb-2 flex items-center justify-between text-[0.7rem] text-faint">
          <span>{bundle.meta.title}</span>
          <span>
            {pos + 1} / {deck.length}
          </span>
        </div>
        <ProgressBar value={pos / deck.length} />
      </div>

      <div className={`flip min-h-0 flex-1 px-5 py-5 ${flipped ? 'is-flipped' : ''}`}>
        <div
          className="flip-inner relative h-full w-full cursor-pointer"
          onClick={() => setFlipped((f) => !f)}
        >
          {/* Front */}
          <div className="flip-face flex flex-col items-center justify-center rounded-card border border-line bg-surface p-7 text-center">
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-faint">
              Question
            </span>
            <p className="mt-4 font-serif text-[1.6rem] leading-snug">{card.front}</p>
            <span className="absolute bottom-5 text-[0.7rem] text-faint">Tap to flip</span>
          </div>
          {/* Back */}
          <div className="flip-face flip-back flex flex-col items-center justify-center rounded-card border border-accent/40 bg-surface-2 p-7 text-center">
            <span className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-accent">
              Answer
            </span>
            <p className="mt-4 text-[1.15rem] leading-relaxed text-text/90">{card.back}</p>
            <span className="absolute bottom-5 text-[0.7rem] text-faint">Tap to flip back</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
        <Button variant="outline" onClick={() => advance(true)}>
          Review again
        </Button>
        <Button onClick={() => advance(false)}>Got it</Button>
      </div>
    </div>
  );
}
