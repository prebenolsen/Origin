import { useEffect, useRef } from 'react';
import type { Region } from '../../lib/geography';

/**
 * The "name this region" control. The learner types a name (accepted at ~80%
 * similarity), or asks for a hint: the starting letter, or four options (the
 * correct answer plus its three nearest neighbours). Rendered both inline below
 * the map and — while the map is fullscreen — as a floating bar over it.
 */
export default function AnswerPanel({
  region,
  kind,
  solved,
  input,
  status,
  hint,
  options,
  variant,
  onInput,
  onSubmit,
  onHintLetter,
  onHintOptions,
  onPickOption,
  onClose,
}: {
  region: Region;
  kind: 'country' | 'sea';
  solved: boolean;
  input: string;
  status: 'idle' | 'wrong';
  hint: string | null;
  options: string[] | null;
  variant: 'inline' | 'overlay';
  onInput: (v: string) => void;
  onSubmit: () => void;
  onHintLetter: () => void;
  onHintOptions: () => void;
  onPickOption: (name: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!solved) inputRef.current?.focus();
  }, [region.id, solved]);

  const noun = kind === 'country' ? 'country' : 'body of water';

  const shell =
    variant === 'overlay'
      ? 'absolute inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-line bg-ink/90 p-4 backdrop-blur-md'
      : 'rounded-card border border-line bg-surface p-4';

  if (solved) {
    return (
      <div className={shell}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-accent">✓</span>
            <div>
              <div className="text-[0.7rem] uppercase tracking-[0.16em] text-faint">Already found</div>
              <div className="font-serif text-lg leading-tight text-accent-soft">{region.name}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-4 py-2 text-sm text-muted transition hover:border-accent/40 hover:text-text"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-accent">
          Name this {noun}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel"
          className="text-faint transition hover:text-text"
        >
          ✕
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex gap-2"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => onInput(e.target.value)}
          placeholder="Type the name…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={`min-w-0 flex-1 rounded-xl border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-faint ${
            status === 'wrong'
              ? 'border-wrong/70 animate-shake focus:border-wrong'
              : 'border-line focus:border-accent/60'
          }`}
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-ink transition active:scale-95"
        >
          Check
        </button>
      </form>

      {status === 'wrong' && (
        <p className="mt-2 text-xs text-wrong">Not quite — try again, or use a hint.</p>
      )}

      {hint && (
        <p className="mt-2 text-sm text-muted">
          Starts with <span className="font-semibold tracking-widest text-accent-soft">{hint}</span>
        </p>
      )}

      {options && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onPickOption(opt)}
              className="rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-text transition hover:border-accent/50 hover:bg-surface-3 active:scale-[0.98]"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {!options && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onHintLetter}
            className="flex-1 rounded-xl border border-line px-3 py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-text"
          >
            Hint: first letter
          </button>
          <button
            type="button"
            onClick={onHintOptions}
            className="flex-1 rounded-xl border border-line px-3 py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-text"
          >
            Show 4 options
          </button>
        </div>
      )}
    </div>
  );
}
