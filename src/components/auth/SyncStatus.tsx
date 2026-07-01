/**
 * Sync status pill + a manual "Save now" button. Only meaningful when signed in;
 * renders nothing for guests / unconfigured builds.
 */
import { useState } from 'react';
import { useSyncStatus, syncNow, type SyncStatus as Status } from '../../lib/sync/syncManager';

function relative(ts: number | null): string {
  if (!ts) return 'not yet';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

const LABEL: Record<Status, string> = {
  idle: 'All changes saved',
  syncing: 'Saving…',
  pending: 'Unsaved changes',
  offline: 'Offline — will save later',
  error: 'Could not save',
};

const DOT: Record<Status, string> = {
  idle: 'bg-correct',
  syncing: 'bg-accent animate-pulse',
  pending: 'bg-accent',
  offline: 'bg-faint',
  error: 'bg-wrong',
};

export default function SyncStatus() {
  const s = useSyncStatus();
  const [busy, setBusy] = useState(false);

  if (!s.configured || !s.signedIn) return null;

  const canSave = (s.pending || s.status === 'error' || s.status === 'offline') && s.online;

  async function save() {
    setBusy(true);
    try {
      await syncNow();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <span className={`inline-block h-2 w-2 rounded-full ${DOT[s.status]}`} />
        <span className="text-muted">{LABEL[s.status]}</span>
        {s.status === 'idle' && s.lastSyncedAt && (
          <span className="text-faint">· {relative(s.lastSyncedAt)}</span>
        )}
      </div>
      <button
        onClick={save}
        disabled={!canSave || busy}
        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-text
                   transition hover:border-accent/60 hover:text-accent disabled:opacity-40"
      >
        {busy ? 'Saving…' : 'Save now'}
      </button>
    </div>
  );
}
