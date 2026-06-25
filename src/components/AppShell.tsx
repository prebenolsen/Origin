import type { ReactNode } from 'react';

/**
 * Centers the app in a phone-sized frame on large screens and fills the
 * viewport on mobile. The frame is a fixed-height flex column so individual
 * screens can own their internal scrolling (e.g. the story feed).
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-aurora flex items-center justify-center sm:p-6">
      <div
        className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-ink
                   sm:h-[min(900px,94dvh)] sm:rounded-[2.4rem] sm:border sm:border-line
                   sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
      >
        <main className="relative flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
