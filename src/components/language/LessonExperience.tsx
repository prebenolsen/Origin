import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { VocabItem } from '../../types/language';
import { getChapter, getModuleBundle, isEnterable } from '../../lib/language/content';
import {
  getAll,
  getState,
  introduce,
  markSeen,
  orderAdaptive,
  recordReview,
  vocabId,
} from '../../lib/language/srs';
import {
  getProfile,
  getChapterSlug,
  getLearner,
  getSelections,
  isComplete,
  isCheckpointComplete,
  markCheckpointComplete,
  markComplete,
  setSelections,
} from '../../lib/language/profile';
import { personalizeText } from '../../lib/language/learner';
import {
  buildQuiz,
  buildSentenceQuiz,
  type Level,
  type QuestionTarget,
  type VocabQuestion,
} from '../../lib/language/testGen';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import { LANG } from './SpanishHome';
import PersonalizeStep from './PersonalizeStep';
import VocabTest from './VocabTest';

type Phase = 'personalize' | 'context' | 'block' | 'checkpoint' | 'sentences' | 'done';
type BlockSub = 'teach' | 'practice';

/** Words are taught in small batches, not all at once (no dictionary pages). */
const BLOCK_SIZE = 3;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function LessonExperience() {
  const { module = '' } = useParams();
  // Key by module so switching lessons fully remounts (resets phase/state).
  return <LessonRunner key={module} module={module} />;
}

function LessonRunner({ module }: { module: string }) {
  const navigate = useNavigate();
  const bundle = getModuleBundle(LANG, module);
  const exit = () => navigate('/learn/spanish/chapter');

  // Weave the learner's own details into lesson text ({name}/{country_es}/{age}).
  const learner = getLearner(LANG);
  const pers = (text: string) => personalizeText(text, learner);

  const isPersonalized = bundle?.module.kind === 'personalized';
  const [selected, setSelectedState] = useState<VocabItem[]>(() => {
    if (!bundle || !isPersonalized) return [];
    return getSelections(LANG, module).map((o) => ({
      en: o.en,
      es: o.es,
      note: o.note,
      category: 'personal',
    }));
  });

  const [phase, setPhase] = useState<Phase>(() => {
    if (isPersonalized && getSelections(LANG, module).length === 0) return 'personalize';
    return 'context';
  });
  const [blockIndex, setBlockIndex] = useState(0);
  const [blockSub, setBlockSub] = useState<BlockSub>('teach');
  const [checkpointId, setCheckpointId] = useState<string | null>(null);

  // The words this lesson teaches: authored base vocab + personalized picks.
  const vocab = useMemo<VocabItem[]>(() => {
    if (!bundle) return [];
    const base = bundle.vocabulary.filter((v) => v.es.trim());
    const merged = [...base, ...selected];
    const seen = new Set<string>();
    return merged.filter((v) => {
      const id = vocabId(v.es);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [bundle, selected]);

  const blocks = useMemo(() => chunk(vocab, BLOCK_SIZE), [vocab]);

  // Introduce + count a "seen" for the current block's words when teaching them.
  useEffect(() => {
    if (!bundle || phase !== 'block' || blockSub !== 'teach') return;
    for (const w of blocks[blockIndex] ?? []) {
      introduce(LANG, w, bundle.path);
      markSeen(LANG, vocabId(w.es));
    }
  }, [bundle, phase, blockSub, blockIndex, blocks]);

  if (!bundle || !isEnterable(bundle)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <h2 className="text-xl">Lesson not ready</h2>
        <p className="text-sm text-muted">This module hasn't been authored yet.</p>
        <Button onClick={exit}>Back to chapter</Button>
      </div>
    );
  }

  const { lesson } = bundle;
  const totalBlocks = blocks.length;
  const sentenceDrills = bundle.sentences ?? [];
  const hasVocab = vocab.length > 0;
  const hasSentences = sentenceDrills.length > 0;

  const pool: QuestionTarget[] = [
    ...getAll(LANG).map((s) => ({ es: s.es, en: s.en, category: s.category })),
    ...vocab,
  ];
  const stateMap = Object.fromEntries(getAll(LANG).map((s) => [s.id, s]));

  const onPersonalizeDone = (picks: { en: string; es: string; note?: string }[]) => {
    setSelections(LANG, module, picks);
    setSelectedState(picks.map((o) => ({ ...o, category: 'personal' })));
    setPhase('context');
  };

  const completeModule = () => {
    const wasAlreadyComplete = isComplete(LANG, module);
    markComplete(LANG, module);

    if (wasAlreadyComplete) {
      setCheckpointId(null);
      setPhase('done');
      return;
    }

    const chapterSlug = getChapterSlug(LANG);
    if (!chapterSlug) {
      setCheckpointId(null);
      setPhase('done');
      return;
    }

    const chapter = getChapter(LANG, chapterSlug);
    if (!chapter) {
      setCheckpointId(null);
      setPhase('done');
      return;
    }

    const profile = getProfile(LANG);
    const completedInChapter = chapter.modules.filter((slug) => profile.completed.includes(slug));
    const completedCount = completedInChapter.length;
    const checkpoints = checkpointCounts(chapter.modules.length);
    const candidate = `${chapter.slug}:${completedCount}`;
    const shouldRunCheckpoint =
      checkpoints.includes(completedCount) && !isCheckpointComplete(LANG, candidate);

    if (shouldRunCheckpoint) {
      setCheckpointId(candidate);
      setPhase('checkpoint');
      return;
    }

    setCheckpointId(null);
    setPhase('done');
  };

  /* ----------------------------- personalize ---------------------------- */
  if (phase === 'personalize' && bundle.personalize) {
    return (
      <PersonalizeStep
        data={bundle.personalize}
        initial={getSelections(LANG, module)}
        onDone={onPersonalizeDone}
        onExit={exit}
      />
    );
  }

  /* ------------------------------- context ------------------------------- */
  if (phase === 'context') {
    return (
      <div className="flex h-full flex-col">
        <TopBar label={bundle.module.title} onClose={exit} back />
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-2">
          <div className="animate-rise">
            <div className="text-4xl">{bundle.module.icon}</div>
            <h1 className="mt-3 font-serif text-[2.3rem] leading-[1.08]">{bundle.module.title}</h1>
            {lesson?.context && (
              <p className="mt-4 text-[1.02rem] leading-relaxed text-text/90">{pers(lesson.context)}</p>
            )}
          </div>
          <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
            <div className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-accent">
              How this works
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {hasVocab ? (
                <>
                  You'll learn {vocab.length} word{vocab.length === 1 ? '' : 's'} in {totalBlocks} small
                  {totalBlocks === 1 ? ' batch' : ' batches'} of a few at a time - learn a few, practice
                  them, then move on. Every 4 completed modules you unlock a progress checkpoint review
                  {hasSentences ? ', and you finish by building real sentences.' : '.'}
                </>
              ) : (
                <>
                  No new words here. You'll build {sentenceDrills.length} sentence
                  {sentenceDrills.length === 1 ? '' : 's'} from words you already know - tap the tiles
                  into the right order, and tap a tile again to send it back.
                </>
              )}
            </p>
          </div>
        </div>
        <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
          <Button
            full
            onClick={() => {
              if (hasVocab) {
                setBlockIndex(0);
                setBlockSub('teach');
                setPhase('block');
              } else {
                setPhase('sentences');
              }
            }}
          >
            {hasVocab ? 'Start learning' : 'Start building'}
          </Button>
        </div>
      </div>
    );
  }

  /* -------------------------------- blocks ------------------------------- */
  if (phase === 'block') {
    const blockWords = blocks[blockIndex] ?? [];

    // Examples may only use words already introduced (no pre-teaching future
    // vocab). Whole-word match so e.g. "no" doesn't match inside "noches".
    const introducedEs = new Set(
      blocks.slice(0, blockIndex + 1).flat().map((v) => vocabId(v.es)),
    );
    const usesWord = (es: string, sentence: string) =>
      ` ${sentence.toLowerCase().replace(/[^\p{L} ]/gu, ' ').replace(/\s+/g, ' ').trim()} `.includes(
        ` ${es.toLowerCase()} `,
      );
    const allowedExamples = (lesson?.examples ?? [])
      .map((ex) => ({ ...ex, es: pers(ex.es), en: pers(ex.en) }))
      .filter((ex) => vocab.every((v) => !usesWord(v.es, ex.es) || introducedEs.has(vocabId(v.es))))
      .slice(0, 2);

    if (blockSub === 'teach') {
      return (
        <div className="flex h-full flex-col">
          <TopBar label={`${bundle.module.title} · ${blockIndex + 1}/${totalBlocks}`} onClose={exit} back />
          <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-2">
            <div className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-accent">
              New words · batch {blockIndex + 1} of {totalBlocks}
            </div>

            {blockIndex === 0 && lesson?.explanation && (
              <div className="mt-3 animate-rise">
                <p className="text-[1rem] leading-relaxed text-text/90">{pers(lesson.explanation)}</p>
              </div>
            )}

            <div className="mt-5 grid gap-2.5">
              {blockWords.map((v) => (
                <div key={vocabId(v.es)} className="rounded-2xl border border-line bg-surface px-4 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-serif text-[1.5rem] text-accent">{v.es}</span>
                    <span className="text-sm text-muted">{v.en}</span>
                  </div>
                  {v.note && <div className="mt-1 text-xs text-faint">{v.note}</div>}
                </div>
              ))}
            </div>

            {allowedExamples.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-faint">
                  In use
                </div>
                <div className="space-y-2">
                  {allowedExamples.map((ex, i) => (
                    <div key={i} className="rounded-xl border border-line bg-surface px-4 py-3">
                      <div className="font-serif text-[1.05rem] text-text">{ex.es}</div>
                      <div className="mt-0.5 text-sm text-muted">{ex.en}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
            <Button full onClick={() => setBlockSub('practice')}>
              Practice {blockWords.length === 1 ? 'this word' : `these ${blockWords.length}`}
            </Button>
          </div>
        </div>
      );
    }

    // blockSub === 'practice' — mastery-gated mini practice over just this batch.
    const questions = blockWords.map((w, i) => {
      const lvl: Level = i % 2 === 1 ? 2 : 1; // alternate recognise / recall
      return buildQuiz([w], pool, {
        states: stateMap,
        template: bundle.personalize?.template,
        forceLevel: lvl,
        seed: blockIndex * 101 + i * 17,
      })[0];
    });
    const regenerate = (t: QuestionTarget) =>
      buildQuiz([t], pool, {
        states: stateMap,
        template: bundle.personalize?.template,
        forceLevel: 2,
        seed: Math.floor(Math.random() * 1e5),
      })[0];

    return (
      <VocabTest
        key={`block-${blockIndex}`}
        questions={questions}
        title={`${bundle.module.title} · batch ${blockIndex + 1}`}
        label="Practice"
        requeueWrong
        regenerate={regenerate}
        onResult={(t, correct, level) => recordReview(LANG, vocabId(t.es), correct, level)}
        onComplete={() => {
          if (blockIndex + 1 < totalBlocks) {
            setBlockIndex((b) => b + 1);
            setBlockSub('teach');
          } else {
            if (hasSentences) setPhase('sentences');
            else completeModule();
          }
        }}
        onExit={exit}
        finishLabel={blockIndex + 1 < totalBlocks ? 'Next batch' : hasSentences ? 'Build sentences' : 'Finish'}
      />
    );
  }

  /* ---------------------------- checkpoint review ----------------------- */
  if (phase === 'checkpoint') {
    const chapterSlug = getChapterSlug(LANG);
    const chapter = chapterSlug ? getChapter(LANG, chapterSlug) : undefined;
    const profile = getProfile(LANG);

    const completedInChapter = chapter
      ? chapter.modules.filter((slug) => profile.completed.includes(slug))
      : [];
    const [oldModules, midModules, recentModules] = splitBands(completedInChapter);
    const allStates = getAll(LANG);
    const byBand = (slugs: string[]) => {
      const set = new Set(slugs);
      return allStates.filter((s) => set.has(moduleSlugFromPath(s.module)));
    };

    const oldStates = byBand(oldModules);
    const midStates = byBand(midModules);
    const recentStates = byBand(recentModules);
    const questionCount = Math.min(
      CHECKPOINT_MAX_QUESTIONS,
      Math.max(CHECKPOINT_BASE_QUESTIONS, completedInChapter.length + 4),
      allStates.length,
    );
    const [oldQuota, midQuota, recentQuota] = weightedQuotas(questionCount);

    const pickFromBand = (states: ReturnType<typeof getAll>, quota: number, seed: number) =>
      orderAdaptive(states, Math.min(quota, states.length), 7, seed);

    const selected = [
      ...pickFromBand(oldStates, oldQuota, 101),
      ...pickFromBand(midStates, midQuota, 202),
      ...pickFromBand(recentStates, recentQuota, 303),
    ];
    const selectedIds = new Set(selected.map((s) => s.id));
    const fallback = orderAdaptive(allStates, allStates.length, 7, 404).filter((s) => !selectedIds.has(s.id));
    const combined = [...selected, ...fallback].slice(0, questionCount);
    const targets = combined.map((s) => ({ es: s.es, en: s.en, category: s.category }));
    const questions: VocabQuestion[] = buildQuiz(targets, pool, {
      states: stateMap,
      template: bundle.personalize?.template,
      seed: 909,
    });
    return (
      <VocabTest
        questions={questions}
        title={`${chapter?.title ?? 'Your chapter'} · checkpoint review`}
        label="Checkpoint"
        onResult={(t, correct, level) => recordReview(LANG, vocabId(t.es), correct, level)}
        onComplete={() => {
          if (checkpointId) markCheckpointComplete(LANG, checkpointId);
          setPhase('done');
        }}
        onExit={exit}
        finishLabel="Finish checkpoint"
      />
    );
  }

  /* ---------------------------- sentence builder ------------------------- */
  if (phase === 'sentences' && hasSentences) {
    // Reuse known words to build full sentences. Personalize the text first so
    // tiles reflect the learner's own details, then split into tiles.
    const sentences = sentenceDrills.map((s) => ({
      es: pers(s.es),
      en: pers(s.en),
      distractors: s.distractors,
    }));
    const questions = buildSentenceQuiz(sentences, {
      seed: 7,
      answerEvaluation: bundle.lesson?.answerEvaluation,
    });
    // A correct build demonstrates contextual (level-3) recall of every known
    // word in it - credit each word that's already in the learner's memory.
    const creditSentence = (sentenceEs: string, correct: boolean, level: number) => {
      const ids = new Set(
        sentenceEs.split(/\s+/).map((t) => vocabId(t)).filter(Boolean),
      );
      for (const id of ids) if (getState(LANG, id)) recordReview(LANG, id, correct, level);
    };
    return (
      <VocabTest
        questions={questions}
        title={`${bundle.module.title} · build sentences`}
        label="Build sentences"
        onResult={(t, correct, level) => creditSentence(t.es, correct, level)}
        onComplete={completeModule}
        onExit={exit}
        finishLabel="Finish"
      />
    );
  }

  /* --------------------------------- done -------------------------------- */
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="animate-pop font-serif text-5xl text-accent">✓</div>
      <div>
        <h2 className="font-serif text-2xl">{bundle.module.title} complete</h2>
        <p className="mt-2 text-sm text-muted">
          {vocab.length} word{vocab.length === 1 ? '' : 's'} added to your memory. They'll come back
          for review at the right time - and weak ones sooner.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button full onClick={exit}>
          Back to chapter
        </Button>
        <Button full variant="outline" onClick={() => navigate('/learn/spanish/review')}>
          Review &amp; practice
        </Button>
      </div>
    </div>
  );
}

const CHECKPOINT_BASE_QUESTIONS = 8;
const CHECKPOINT_MAX_QUESTIONS = 14;

function checkpointCounts(totalModules: number): number[] {
  if (totalModules <= 0) return [];
  const counts: number[] = [];
  for (let i = 4; i < totalModules; i += 4) counts.push(i);
  counts.push(totalModules);
  return counts;
}

function moduleSlugFromPath(path: string): string {
  const parts = path.split('/');
  return parts.at(-1) ?? path;
}

function splitBands<T>(arr: T[]): [T[], T[], T[]] {
  const n = arr.length;
  if (n <= 2) return [[], [], arr];
  const oldEnd = Math.max(1, Math.floor(n * 0.25));
  const midEnd = Math.max(oldEnd + 1, Math.floor(n * 0.65));
  return [arr.slice(0, oldEnd), arr.slice(oldEnd, midEnd), arr.slice(midEnd)];
}

function weightedQuotas(total: number): [number, number, number] {
  const weights = [0.25, 0.35, 0.4] as const;
  const quotas = weights.map((w) => Math.floor(total * w)) as [number, number, number];
  let remaining = total - (quotas[0] + quotas[1] + quotas[2]);
  const order = [2, 1, 0] as const;
  let i = 0;
  while (remaining > 0) {
    quotas[order[i % order.length]] += 1;
    remaining -= 1;
    i += 1;
  }
  return quotas;
}
