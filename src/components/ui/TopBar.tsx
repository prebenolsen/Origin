import type { ReactNode } from 'react';

interface Props {
  /** Small uppercase eyebrow shown centered. */
  label?: string;
  /** Called when the left button is pressed. */
  onClose: () => void;
  /** Show a back arrow instead of the close ✕. */
  back?: boolean;
  right?: ReactNode;
}

export default function TopBar({ label, onClose, back, right }: Props) {
  return (
    <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
      <button
        onClick={onClose}
        aria-label={back ? 'Back' : 'Close'}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line
                   text-muted transition hover:text-text active:scale-95"
      >
        {back ? '←' : '✕'}
      </button>
      {label && (
        <span className="truncate text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-faint">
          {label}
        </span>
      )}
      <div className="flex h-9 min-w-9 items-center justify-end">{right}</div>
    </header>
  );
}
