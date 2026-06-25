import { useModule } from './ModuleExperience';
import { recordQuiz } from '../../lib/progress';
import Quiz from './Quiz';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';

export default function QuizStage() {
  const { bundle, go, exit } = useModule();

  if (bundle.quiz.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <TopBar label="Recall" onClose={exit} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <p className="text-muted">No quiz for this module yet.</p>
          {bundle.flashcards.length > 0 && (
            <Button onClick={() => go('flashcards')}>Go to flashcards</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Quiz
      questions={bundle.quiz}
      title={bundle.meta.title}
      onExit={exit}
      onReview={bundle.flashcards.length > 0 ? () => go('flashcards') : undefined}
      onRecord={(correct, total) => recordQuiz(bundle.path, correct, total)}
    />
  );
}
