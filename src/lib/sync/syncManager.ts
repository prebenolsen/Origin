/**
 * Offline-first sync engine.
 *
 * localStorage stays the synchronous source of truth (so the app works offline
 * and as a guest with zero changes). When a user is signed in AND online, this
 * manager mirrors the local stores up to Supabase:
 *
 *   - on sign-in: pull remote -> merge with local -> write back -> push
 *   - on any local change (via the app's existing change events): debounced push
 *   - manual "Save now" via syncNow()
 *
 * When signed out, or when Supabase is unconfigured, it does nothing — guest
 * mode is purely local.
 */
import { useSyncExternalStore } from 'react';
import { supabase } from '../supabase/client';
import {
  KEYS,
  TABLES,
  moduleRow,
  geoRow,
  langProfileRow,
  rowToLangProfile,
  vocabRow,
  rowToVocab,
  reviewEventRows,
  type ModuleProgressRow,
  type GeoProgressRow,
  type LangProfileRow,
  type VocabStateRow,
} from './mappers';
import {
  mergeModuleProgress,
  mergeGeo,
  mergeLangProfile,
  mergeVocab,
} from './merge';
import type { ModuleProgress } from '../progress';
import type { LanguageProfile } from '../language/profile';
import type { VocabState } from '../language/srs';

const EMPTY_PROFILE: LanguageProfile = { selections: {}, completed: [], checkpoints: [] };
const DEBOUNCE_MS = 1500;

export type SyncStatus = 'idle' | 'syncing' | 'pending' | 'offline' | 'error';

export interface SyncSnapshot {
  configured: boolean;
  signedIn: boolean;
  online: boolean;
  status: SyncStatus;
  pending: boolean;
  lastSyncedAt: number | null;
  error: string | null;
}

// ---- internal state --------------------------------------------------------

let userId: string | null = null;
let status: SyncStatus = 'idle';
let pending = false;
let lastSyncedAt: number | null = null;
let error: string | null = null;
let suppress = false; // true while we write merged data back (avoid self-trigger)
let timer: ReturnType<typeof setTimeout> | undefined;

const isOnline = (): boolean =>
  typeof navigator === 'undefined' ? true : navigator.onLine;

// ---- reactive snapshot (for useSyncStatus) ---------------------------------

const listeners = new Set<() => void>();
let snapshot: SyncSnapshot = build();

function build(): SyncSnapshot {
  return {
    configured: !!supabase,
    signedIn: !!userId,
    online: isOnline(),
    status,
    pending,
    lastSyncedAt,
    error,
  };
}

function emit(): void {
  snapshot = build();
  for (const l of listeners) l();
}

function setStatus(s: SyncStatus): void {
  status = s;
  emit();
}

// ---- localStorage helpers --------------------------------------------------

function lsGet<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / privacy errors */
  }
}

/** Write merged data back and notify the UI, without re-triggering a push. */
function applyLocal(key: string, value: unknown, evt: string): void {
  suppress = true;
  lsSet(key, value);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(evt));
  suppress = false;
}

// ---- backend I/O -----------------------------------------------------------

async function upsert(table: string, rows: unknown[], onConflict: string): Promise<void> {
  if (!supabase || rows.length === 0) return;
  const { error: err } = await supabase.from(table).upsert(rows, { onConflict });
  if (err) throw err;
}

/** Push the full local state up (upserts are idempotent). */
async function push(): Promise<void> {
  if (!supabase || !userId) return;
  if (!isOnline()) {
    setStatus('offline');
    return;
  }
  const uid = userId;
  setStatus('syncing');
  try {
    const modules = lsGet<Record<string, ModuleProgress>>(KEYS.module, {});
    await upsert(
      TABLES.moduleProgress,
      Object.entries(modules).map(([path, p]) => moduleRow(uid, path, p)),
      'user_id,path',
    );

    const geo = lsGet<Record<string, string[]>>(KEYS.geo, {});
    await upsert(
      TABLES.geoProgress,
      Object.entries(geo).map(([board, solved]) => geoRow(uid, board, solved)),
      'user_id,board',
    );

    const profile = lsGet<LanguageProfile>(KEYS.langProfile, EMPTY_PROFILE);
    await upsert(TABLES.langProfile, [langProfileRow(uid, profile)], 'user_id');

    const vocab = lsGet<Record<string, VocabState>>(KEYS.langVocab, {});
    await upsert(
      TABLES.langVocab,
      Object.values(vocab).map((s) => vocabRow(uid, s)),
      'user_id,id',
    );

    // Append-only review log (watermark + dedupe index keep it idempotent).
    const since = lsGet<number>(KEYS.reviewWatermark, 0);
    const { rows, maxAt } = reviewEventRows(uid, vocab, since);
    if (rows.length) {
      const { error: err } = await supabase
        .from(TABLES.reviewEvent)
        .upsert(rows, { onConflict: 'user_id,vocab_id,at', ignoreDuplicates: true });
      if (err) throw err;
      lsSet(KEYS.reviewWatermark, maxAt);
    }

    pending = false;
    lastSyncedAt = Date.now();
    error = null;
    setStatus('idle');
  } catch (e) {
    error = (e as Error)?.message ?? String(e);
    setStatus('error');
  }
}

interface PulledState {
  modules: Record<string, ModuleProgress>;
  geo: Record<string, string[]>;
  profile: LanguageProfile;
  vocab: Record<string, VocabState>;
}

async function pull(): Promise<PulledState> {
  const [mods, geos, profs, vocabs] = await Promise.all([
    supabase!.from(TABLES.moduleProgress).select('*'),
    supabase!.from(TABLES.geoProgress).select('*'),
    supabase!.from(TABLES.langProfile).select('*').maybeSingle(),
    supabase!.from(TABLES.langVocab).select('*'),
  ]);
  for (const r of [mods, geos, profs, vocabs]) {
    if (r.error) throw r.error;
  }

  const modules: Record<string, ModuleProgress> = {};
  for (const r of (mods.data ?? []) as ModuleProgressRow[]) {
    modules[r.path] = {
      stages: (r.stages ?? []) as ModuleProgress['stages'],
      quizScore: r.quiz_score ?? undefined,
      updated: r.updated_at ? Date.parse(r.updated_at) : 0,
    };
  }

  const geo: Record<string, string[]> = {};
  for (const r of (geos.data ?? []) as GeoProgressRow[]) {
    geo[r.board] = r.solved ?? [];
  }

  const profile = profs.data
    ? rowToLangProfile(profs.data as LangProfileRow)
    : { ...EMPTY_PROFILE };

  const vocab: Record<string, VocabState> = {};
  for (const r of (vocabs.data ?? []) as VocabStateRow[]) {
    vocab[r.id] = rowToVocab(r);
  }

  return { modules, geo, profile, vocab };
}

/** On sign-in: pull, merge with local (nothing lost), write back, push up. */
async function pullMergePush(): Promise<void> {
  if (!supabase || !userId) return;
  if (!isOnline()) {
    pending = true;
    setStatus('offline');
    return;
  }
  setStatus('syncing');
  try {
    const remote = await pull();

    const mergedModules = mergeModuleProgress(
      lsGet(KEYS.module, {} as Record<string, ModuleProgress>),
      remote.modules,
    );
    applyLocal(KEYS.module, mergedModules, 'origin:progress');

    const mergedGeo = mergeGeo(
      lsGet(KEYS.geo, {} as Record<string, string[]>),
      remote.geo,
    );
    applyLocal(KEYS.geo, mergedGeo, 'origin:geo');

    const mergedProfile = mergeLangProfile(
      lsGet(KEYS.langProfile, { ...EMPTY_PROFILE }),
      remote.profile,
    );
    applyLocal(KEYS.langProfile, mergedProfile, 'origin:lang');

    const mergedVocab = mergeVocab(
      lsGet(KEYS.langVocab, {} as Record<string, VocabState>),
      remote.vocab,
    );
    applyLocal(KEYS.langVocab, mergedVocab, 'origin:lang');

    await push();
  } catch (e) {
    error = (e as Error)?.message ?? String(e);
    setStatus('error');
  }
}

// ---- change scheduling -----------------------------------------------------

function schedule(): void {
  pending = true;
  if (!isOnline()) {
    setStatus('offline');
    return;
  }
  setStatus('pending');
  clearTimeout(timer);
  timer = setTimeout(() => {
    void push();
  }, DEBOUNCE_MS);
}

function onLocalChange(): void {
  if (suppress || !userId || !supabase) return;
  schedule();
}

// ---- public API ------------------------------------------------------------

/** Called by the auth layer whenever the signed-in user changes (null = guest). */
export function setSyncUser(id: string | null): void {
  if (id === userId) return;
  userId = id;
  if (id) {
    void pullMergePush();
  } else {
    pending = false;
    clearTimeout(timer);
    setStatus('idle');
  }
  emit();
}

/** Manual "Save now": flush local state to the backend immediately. */
export async function syncNow(): Promise<void> {
  if (!userId) return;
  clearTimeout(timer);
  await push();
}

export function useSyncStatus(): SyncSnapshot {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot,
    () => snapshot,
  );
}

// ---- wire up global listeners (once) ---------------------------------------

if (typeof window !== 'undefined') {
  window.addEventListener('origin:progress', onLocalChange);
  window.addEventListener('origin:lang', onLocalChange);
  window.addEventListener('origin:geo', onLocalChange);
  window.addEventListener('online', () => {
    emit();
    if (userId && pending) void push();
  });
  window.addEventListener('offline', () => {
    setStatus('offline');
  });
}
