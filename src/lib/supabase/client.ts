/**
 * Supabase client (optional backend).
 *
 * Origin is offline-first and fully usable as a guest. Supabase is only wired in
 * when the two public env vars are present; otherwise `supabase` is null and the
 * whole app runs on localStorage alone with no network calls.
 *
 * Both keys are *public* client keys — the data is protected by Row Level
 * Security (see supabase/migrations), not by hiding the anon key.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when both env vars are set, i.e. login/sync is available. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * The shared client, or `null` when unconfigured. Callers must treat `null` as
 * "guest / local-only mode" and skip all backend work.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
