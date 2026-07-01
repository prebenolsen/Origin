import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getModuleBundle } from '../../lib/language/content';
import {
  getAll,
  getByModule,
  getRecent,
  getWeak,
  orderAdaptive,
  recordReview,
  vocabId,
  type VocabState,
} from '../../lib/language/srs';
import { buildQuiz, type QuestionTarget } from '../../lib/language/testGen';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import { LANG } from './SpanishHome';
import VocabTest from './VocabTest';

const MAX = 12;

function titleFor(mode: string): string {
  if (mode === 'all') return 'All words';
  if (mode === 'weak') return 'Weak words';
  if (mode === 'recent') return "This week";
  if (mode.startsWith('m-')) {
    const slug = mode.slice(2);
    return getModuleBundle(LANG, slug)?.module.title ?? slug;
  }
  return 'Review';
}

function selectTargets(mode: string): VocabState[] {
  if (mode === 'weak') return getWeak(LANG);
  if (mode === 'recent') return getRecent(LANG, 7);
  if (mode.startsWith('m-')) return getByModule(LANG, `${LANG}/${mode.slice(2)}`);
  return getAll(LANG);
}

export default function ReviewSession() {
  const { mode = 'all' } = useParams();
  const navigate = useNavigate();
  const back = () => navigate('/learn/spanish/review');

  const title = titleFor(mode);

  const questions = useMemo(() => {
    // Adaptive order: failed first, recent next, a sample of mastered last -
    // never introduction order. Difficulty ramps via per-word mastery.
    const ordered = orderAdaptive(selectTargets(mode), MAX);
    const targets: QuestionTarget[] = ordered.map((s) => ({
      es: s.es,
      en: s.en,
      category: s.category,
    }));
    const pool: QuestionTarget[] = getAll(LANG).map((s) => ({
      es: s.es,
      en: s.en,
      category: s.category,
    }));
    const stateMap = Object.fromEntries(getAll(LANG).map((s) => [s.id, s]));
    return buildQuiz(targets, pool, { states: stateMap });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  if (questions.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <TopBar label="Review" onClose={back} back />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <h2 className="font-serif text-xl">Nothing here yet</h2>
          <p className="text-sm text-muted">No words match this review.</p>
          <Button onClick={back}>Back to review</Button>
        </div>
      </div>
    );
  }

  return (
    <VocabTest
      questions={questions}
      title={title}
      onResult={(t, correct, level) => recordReview(LANG, vocabId(t.es), correct, level)}
      onComplete={back}
      onExit={back}
      finishLabel="Back to review"
    />
  );
}
