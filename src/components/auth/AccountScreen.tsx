/**
 * /account — optional sign-in and account management.
 *
 * Signed out: email/password (sign in or sign up) plus a passwordless magic
 * link. Copy makes clear login is optional and that any guest progress already
 * on this device is merged into the account on first sign-in.
 *
 * Signed in: account email, sync status + "Save now", and sign out.
 */
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import Button from '../ui/Button';
import TopBar from '../ui/TopBar';
import SyncStatus from './SyncStatus';

type Mode = 'signin' | 'signup';

export default function AccountScreen() {
  const navigate = useNavigate();
  const { enabled, loading, user, signInWithPassword, signUp, signInWithMagicLink, signOut } =
    useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const inputCls =
    'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-text placeholder:text-faint ' +
    'outline-none transition focus:border-accent/60';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const res =
      mode === 'signin'
        ? await signInWithPassword(email, password)
        : await signUp(email, password);
    setBusy(false);
    if (res.error) setError(res.error);
    else if (res.checkEmail) setNotice('Check your email to confirm and finish signing in.');
  }

  async function magicLink() {
    if (!email) {
      setError('Enter your email first.');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await signInWithMagicLink(email);
    setBusy(false);
    if (res.error) setError(res.error);
    else setNotice('Magic link sent — check your email.');
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar label="Account" onClose={() => navigate('/')} back />

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-10">
        {!enabled ? (
          <p className="mt-10 text-center text-sm text-muted">
            Accounts aren&apos;t configured for this build. Everything you do is saved
            locally on this device.
          </p>
        ) : loading ? (
          <p className="mt-10 text-center text-sm text-faint">Loading…</p>
        ) : user ? (
          // ---- Signed in ----
          <div className="mt-6 space-y-5">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-faint">Signed in as</div>
              <div className="mt-1 text-lg text-text">{user.email}</div>
            </div>
            <SyncStatus />
            <p className="text-sm text-muted">
              Your progress syncs to your account and follows you across devices.
            </p>
            <Button variant="outline" full onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          // ---- Signed out ----
          <div className="mt-6">
            <h1 className="font-serif text-2xl leading-tight">
              Save your progress across devices
            </h1>
            <p className="mt-2 text-sm text-muted">
              Signing in is optional — Origin works fully without an account. If you
              sign in, the progress already on this device is merged into your account,
              so nothing is lost.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-3">
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                required
              />
              <input
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                minLength={6}
                required
              />

              {error && <p className="text-sm text-wrong">{error}</p>}
              {notice && <p className="text-sm text-correct">{notice}</p>}

              <Button type="submit" full disabled={busy}>
                {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-faint">
              <span className="h-px flex-1 bg-line" />
              or
              <span className="h-px flex-1 bg-line" />
            </div>

            <Button variant="outline" full disabled={busy} onClick={() => void magicLink()}>
              Email me a magic link
            </Button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setNotice(null);
              }}
              className="mt-5 w-full text-center text-sm text-muted transition hover:text-text"
            >
              {mode === 'signin'
                ? "New here? Create an account"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
