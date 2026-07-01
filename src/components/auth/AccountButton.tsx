/**
 * Compact account control for the Home hero. Shows "Sign in" for guests and the
 * signed-in initial + a live sync dot when logged in. Hidden entirely when
 * Supabase is unconfigured (pure local build).
 */
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useSyncStatus } from '../../lib/sync/syncManager';

const DOT: Record<string, string> = {
  idle: 'bg-correct',
  syncing: 'bg-accent animate-pulse',
  pending: 'bg-accent',
  offline: 'bg-faint',
  error: 'bg-wrong',
};

export default function AccountButton() {
  const { enabled, user } = useAuth();
  const sync = useSyncStatus();

  if (!enabled) return null;

  if (!user) {
    return (
      <Link
        to="/account"
        className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold
                   text-text transition hover:border-accent/60 hover:text-accent"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.email ?? '?').charAt(0).toUpperCase();

  return (
    <Link
      to="/account"
      aria-label="Account"
      className="relative flex h-9 w-9 items-center justify-center rounded-full
                 bg-surface-2 text-sm font-semibold text-text transition hover:text-accent"
    >
      {initial}
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-ink
                    ${DOT[sync.status] ?? 'bg-faint'}`}
      />
    </Link>
  );
}
