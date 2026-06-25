import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'outline' | 'ghost';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
}

const styles: Record<Variant, string> = {
  primary:
    'bg-accent text-ink font-semibold hover:bg-accent-soft active:scale-[0.98] shadow-[0_10px_30px_-12px_rgba(232,169,75,0.7)]',
  outline:
    'border border-line text-text hover:border-accent/60 hover:text-accent active:scale-[0.98]',
  ghost: 'text-muted hover:text-text active:scale-[0.98]',
};

export default function Button({
  variant = 'primary',
  full,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5
                  text-[0.95rem] transition disabled:cursor-not-allowed disabled:opacity-40
                  ${styles[variant]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
