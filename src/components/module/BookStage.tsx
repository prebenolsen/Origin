import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import { useModule } from './ModuleExperience';

export default function BookStage() {
  const { bundle, go, exit } = useModule();
  const book = bundle.books[0];

  if (!book) {
    return (
      <div className="flex h-full flex-col">
        <TopBar label="Book" onClose={exit} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-muted">No book is attached to this module yet.</p>
          <Button onClick={() => go('story')}>Continue</Button>
        </div>
      </div>
    );
  }

  const nextStage =
    bundle.story.length > 0 ? 'story' : bundle.quiz.length > 0 ? 'quiz' : 'flashcards';

  return (
    <div className="flex h-full flex-col">
      <TopBar label={book.title} onClose={exit} />

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-5 pt-3">
        <div className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
          Book walkthrough
        </div>

        <div className="space-y-3">
          {book.cards.map((card, index) => (
            <article
              key={card.id ?? index}
              className="rounded-2xl border border-line bg-surface px-4 py-4"
            >
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-faint">
                {card.timeline ?? `Card ${index + 1}`}
              </div>
              <h2 className="mt-1.5 text-[1.2rem] leading-tight">{card.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-text/90">{card.content}</p>

              {card.concept && (
                <div className="mt-3 inline-flex rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
                  Concept: {card.concept}
                </div>
              )}

              {card.next && (
                <p className="mt-3 border-t border-line-soft pt-3 text-xs text-accent-soft">
                  Next: {card.next}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
        <Button full onClick={() => go(nextStage)}>
          Continue to module
        </Button>
      </div>
    </div>
  );
}
