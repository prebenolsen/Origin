// PWA registration + lightweight offline/update notifications.
//
// Origin is installable and fully offline: the service worker (built by
// vite-plugin-pwa / Workbox — see vite.config.ts) precaches the entire app
// shell, all bundled content JSON, and the self-hosted fonts on first visit.
// After that the app loads and runs with no network at all.
//
// We surface two moments to the learner with a small self-contained toast
// (no React dependency, so this can run before/independently of the tree):
//   - "Ready to use offline" once precaching finishes on first (online) visit.
//   - "Update available" when a new version has been fetched in the background;
//     tapping Refresh activates it. Content keeps working offline meanwhile.
import { registerSW } from 'virtual:pwa-register';

/** Skip service workers in dev and where they aren't supported. */
function pwaSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD;
}

export function registerPWA(): void {
  if (!pwaSupported()) return;

  const updateSW = registerSW({
    immediate: true,
    onOfflineReady() {
      showToast('Ready to use offline', 'All lessons are saved on this device.');
    },
    onNeedRefresh() {
      showToast('Update available', 'A new version is ready.', {
        actionLabel: 'Refresh',
        onAction: () => updateSW(true),
      });
    },
  });
}

type ToastOptions = { actionLabel?: string; onAction?: () => void };

function showToast(title: string, body: string, opts: ToastOptions = {}): void {
  const host = document.createElement('div');
  host.setAttribute('role', 'status');
  host.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:calc(1rem + env(safe-area-inset-bottom))',
    'transform:translateX(-50%) translateY(1rem)',
    'z-index:9999',
    'max-width:min(22rem, calc(100vw - 2rem))',
    'display:flex',
    'gap:0.75rem',
    'align-items:flex-start',
    'padding:0.85rem 1rem',
    'border-radius:1rem',
    'background:#17151d',
    'color:#f5f3ef',
    'border:1px solid rgba(245,243,239,0.12)',
    'box-shadow:0 12px 40px rgba(0,0,0,0.5)',
    'font-family:var(--font-sans, system-ui, sans-serif)',
    'font-size:0.875rem',
    'line-height:1.35',
    'opacity:0',
    'transition:opacity .25s ease, transform .25s ease',
  ].join(';');

  const text = document.createElement('div');
  text.style.cssText = 'flex:1;min-width:0';
  const strong = document.createElement('div');
  strong.textContent = title;
  strong.style.cssText = 'font-weight:600;margin-bottom:0.15rem';
  const p = document.createElement('div');
  p.textContent = body;
  p.style.cssText = 'color:rgba(245,243,239,0.7)';
  text.append(strong, p);
  host.append(text);

  const remove = () => {
    host.style.opacity = '0';
    host.style.transform = 'translateX(-50%) translateY(1rem)';
    setTimeout(() => host.remove(), 250);
  };

  if (opts.actionLabel && opts.onAction) {
    const btn = document.createElement('button');
    btn.textContent = opts.actionLabel;
    btn.style.cssText = [
      'flex:none',
      'align-self:center',
      'padding:0.4rem 0.75rem',
      'border-radius:0.6rem',
      'border:none',
      'background:#f5b544',
      'color:#0c0b10',
      'font:inherit',
      'font-weight:600',
      'cursor:pointer',
    ].join(';');
    btn.addEventListener('click', () => {
      opts.onAction?.();
      remove();
    });
    host.append(btn);
  } else {
    // Auto-dismiss the passive "offline ready" toast.
    setTimeout(remove, 5000);
  }

  document.body.append(host);
  // Trigger the enter transition on the next frame.
  requestAnimationFrame(() => {
    host.style.opacity = '1';
    host.style.transform = 'translateX(-50%) translateY(0)';
  });
}
