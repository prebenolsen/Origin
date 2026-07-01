import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type {
  Conversation,
  ConversationMessage,
  ConversationSpeaker,
} from '../../types/language';
import { getModuleBundle, isConversation, isEnterable } from '../../lib/language/content';
import { vocabId } from '../../lib/language/srs';
import { markComplete } from '../../lib/language/profile';
import TopBar from '../ui/TopBar';
import Button from '../ui/Button';
import { LANG } from './SpanishHome';
import ConversationComprehension from './ConversationComprehension';

type Phase = 'intro' | 'chat' | 'comprehension' | 'done';

export default function ConversationExperience() {
  const { module = '' } = useParams();
  // Key by module so switching fully remounts (resets phase/reveal state).
  return <ConversationRunner key={module} module={module} />;
}

function ConversationRunner({ module }: { module: string }) {
  const navigate = useNavigate();
  const bundle = getModuleBundle(LANG, module);
  const exit = () => navigate('/learn/spanish/chapter');

  const [phase, setPhase] = useState<Phase>('intro');

  if (!bundle || !isEnterable(bundle) || !isConversation(bundle) || !bundle.conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <h2 className="text-xl">Conversation not ready</h2>
        <p className="text-sm text-muted">This conversation hasn't been authored yet.</p>
        <Button onClick={exit}>Back to chapter</Button>
      </div>
    );
  }

  const convo = bundle.conversation;
  const title = bundle.module.title;

  const finish = () => {
    markComplete(LANG, module);
    setPhase('done');
  };

  /* -------------------------------- intro -------------------------------- */
  if (phase === 'intro') {
    return (
      <div className="flex h-full flex-col">
        <TopBar label={title} onClose={exit} back />
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4 pt-2">
          <div className="animate-rise">
            <div className="text-4xl">{bundle.module.icon ?? '💬'}</div>
            <div className="mt-3 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-accent">
              Conversation
            </div>
            <h1 className="mt-1 font-serif text-[2.3rem] leading-[1.08]">{title}</h1>
            <p className="mt-4 text-[1.02rem] leading-relaxed text-text/90">{convo.intro}</p>
          </div>
          <div className="mt-6 rounded-2xl border border-line bg-surface p-4">
            <div className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-accent">
              How this works
            </div>
            <p className="mt-1.5 text-sm text-muted">
              Read the chat one message at a time. Tap any highlighted word to see its meaning,
              or reveal the whole sentence in English - it's up to you how much help you use.
              A few comprehension questions follow at the end.
            </p>
          </div>
        </div>
        <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
          <Button full onClick={() => setPhase('chat')}>
            Start
          </Button>
        </div>
      </div>
    );
  }

  /* -------------------------------- chat --------------------------------- */
  if (phase === 'chat') {
    return (
      <ChatView convo={convo} title={title} onExit={exit} onDone={() => setPhase('comprehension')} />
    );
  }

  /* ---------------------------- comprehension ---------------------------- */
  if (phase === 'comprehension') {
    return (
      <div className="flex h-full flex-col">
        <TopBar label={title} onClose={exit} back />
        <ConversationComprehension questions={convo.questions} onComplete={finish} />
      </div>
    );
  }

  /* --------------------------------- done -------------------------------- */
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="animate-pop font-serif text-5xl text-accent">✓</div>
      <div>
        <h2 className="font-serif text-2xl">{title} complete</h2>
        <p className="mt-2 text-sm text-muted">
          Nice reading. Seeing the words you know in a real conversation is what makes them stick.
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

/* ------------------------------- chat view ------------------------------- */

function ChatView({
  convo,
  title,
  onExit,
  onDone,
}: {
  convo: Conversation;
  title: string;
  onExit: () => void;
  onDone: () => void;
}) {
  const speakers = useMemo(
    () => Object.fromEntries(convo.speakers.map((s) => [s.id, s])),
    [convo.speakers],
  );
  const [visible, setVisible] = useState(1);
  const [revealedSentences, setRevealedSentences] = useState<Set<string>>(new Set());

  const shown = convo.messages.slice(0, visible);
  const atEnd = visible >= convo.messages.length;

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [visible, revealedSentences]);

  const toggleSentence = (id: string) =>
    setRevealedSentences((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex h-full flex-col">
      <TopBar label={title} onClose={onExit} back right={<span className="text-xs text-faint">{visible}/{convo.messages.length}</span>} />

      <div ref={scrollRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-2">
        {shown.map((m) => {
          const speaker = speakers[m.speaker];
          return (
            <ChatBubble
              key={m.id}
              message={m}
              speaker={speaker}
              sentenceRevealed={revealedSentences.has(m.id)}
              onToggleSentence={() => toggleSentence(m.id)}
            />
          );
        })}
      </div>

      <div className="border-t border-line-soft bg-ink/80 p-5 backdrop-blur">
        <Button full onClick={() => (atEnd ? onDone() : setVisible((v) => v + 1))}>
          {atEnd ? 'Questions' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  speaker,
  sentenceRevealed,
  onToggleSentence,
}: {
  message: ConversationMessage;
  speaker?: ConversationSpeaker;
  sentenceRevealed: boolean;
  onToggleSentence: () => void;
}) {
  const right = speaker?.side === 'right';
  const [revealedWords, setRevealedWords] = useState<Set<number>>(new Set());

  // Map each glossed word to its English (accent/case-insensitive, punctuation-free).
  const glossary = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of message.words ?? []) {
      const id = vocabId(w.es);
      if (id) map.set(id, w.en);
    }
    return map;
  }, [message.words]);

  const tokens = useMemo(() => message.es.split(/(\s+)/), [message.es]);

  const toggleWord = (i: number) =>
    setRevealedWords((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className={`flex flex-col ${right ? 'items-end' : 'items-start'} animate-rise`}>
      {speaker && (
        <div className="mb-0.5 px-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-faint">
          {speaker.avatar ? `${speaker.avatar} ` : ''}
          {speaker.name}
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
          right
            ? 'rounded-br-sm bg-accent/15 text-text'
            : 'rounded-bl-sm border border-line bg-surface text-text'
        }`}
      >
        <p className="text-[1.05rem] leading-[1.9]">
          {tokens.map((tok, i) => {
            if (/^\s+$/.test(tok)) return tok;
            const gloss = glossary.get(vocabId(tok));
            if (!gloss) return <span key={i}>{tok}</span>;
            const on = revealedWords.has(i);
            return (
              <span key={i} className="relative inline-flex flex-col items-center align-baseline">
                {on && (
                  <span className="pointer-events-none absolute bottom-full mb-0.5 whitespace-nowrap text-[0.62rem] font-medium leading-none text-accent">
                    {gloss}
                  </span>
                )}
                <button
                  onClick={() => toggleWord(i)}
                  className={`cursor-pointer underline decoration-dotted decoration-accent/50 underline-offset-4 transition ${
                    on ? 'text-accent' : 'hover:text-accent'
                  }`}
                >
                  {tok}
                </button>
              </span>
            );
          })}
        </p>

        {sentenceRevealed && (
          <p className="mt-1.5 border-t border-line-soft pt-1.5 text-sm italic text-muted">
            {message.en}
          </p>
        )}
      </div>

      <button
        onClick={onToggleSentence}
        className="mt-1 px-1 text-[0.68rem] text-faint underline decoration-dotted underline-offset-2 transition hover:text-accent"
      >
        {sentenceRevealed ? 'Hide translation' : 'Reveal sentence'}
      </button>
    </div>
  );
}
