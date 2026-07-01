/**
 * Optional authentication.
 *
 * Origin is fully usable as a guest. This provider only becomes meaningful when
 * Supabase is configured (env vars present). It exposes the current session and
 * the email/password + magic-link actions, and keeps the sync layer informed of
 * who is signed in so it can mirror learner state to the backend.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { setSyncUser } from './sync/syncManager';

export interface AuthResult {
  error: string | null;
  /** True when the action needs the user to check their email (magic link / confirm). */
  checkEmail?: boolean;
}

interface AuthContextValue {
  /** Whether login is even available (Supabase configured). */
  enabled: boolean;
  /** True until the initial session has been resolved. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  signInWithPassword: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithMagicLink: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const msg = (e: unknown): string =>
  (e as { message?: string })?.message ?? String(e);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setSyncUser(data.session?.user.id ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSyncUser(next?.user.id ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    // Include the Vite base path so magic-link / confirmation emails return to
    // the app even when it is served from a sub-path (e.g. GitHub Pages project
    // page: https://<user>.github.io/Origin/). BASE_URL is '/' otherwise.
    const redirectTo =
      typeof window !== 'undefined'
        ? window.location.origin + import.meta.env.BASE_URL
        : undefined;

    return {
      enabled: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,

      async signInWithPassword(email, password) {
        if (!supabase) return { error: 'Login is not configured.' };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? msg(error) : null };
      },

      async signUp(email, password) {
        if (!supabase) return { error: 'Login is not configured.' };
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) return { error: msg(error) };
        // When email confirmation is on, there is no active session yet.
        return { error: null, checkEmail: !data.session };
      },

      async signInWithMagicLink(email) {
        if (!supabase) return { error: 'Login is not configured.' };
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        return { error: error ? msg(error) : null, checkEmail: !error };
      },

      async signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
    };
  }, [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
