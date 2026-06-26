import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Interactive frame shared by every context map. It draws the rounded map
 * "card" and layers pan / zoom on top of whatever map content it wraps (a real
 * `GeoMap` or a `SchematicMap`). Because the whole content layer is moved with a
 * single CSS transform, the SVG and its HTML labels always stay aligned.
 *
 * Gestures:
 *  - one finger / mouse drag  → pan (only when zoomed in)
 *  - two-finger pinch          → zoom around the pinch midpoint
 *  - mouse wheel               → zoom around the cursor
 *  - double click/tap          → toggle a 2.4× zoom at that point
 *
 * A button toggles an immersive fullscreen overlay (with a clear leave button),
 * and the same gestures work there. The view never zooms out past the fitted
 * baseline and pan is clamped so the content can't be dragged off-screen.
 */

interface Transform {
  k: number; // scale (1 = fitted baseline)
  x: number; // translate px
  y: number;
}

const MIN_K = 1;
const MAX_K = 8;

function clampTransform(t: Transform, rect: { width: number; height: number }): Transform {
  const k = Math.min(MAX_K, Math.max(MIN_K, t.k));
  const minX = rect.width * (1 - k);
  const minY = rect.height * (1 - k);
  return {
    k,
    x: Math.min(0, Math.max(minX, t.x)),
    y: Math.min(0, Math.max(minY, t.y)),
  };
}

export default function MapViewport({
  children,
  onTap,
  renderOverlay,
}: {
  children: ReactNode;
  /**
   * Fired on a clean tap/click (press + release without dragging). Coordinates
   * are normalized 0..1 over the *un-zoomed* content box, so a consumer can map
   * them straight onto its own viewBox / projection regardless of pan & zoom.
   */
  onTap?: (u: number, v: number) => void;
  /**
   * Optional non-transformed layer rendered inside the map box (and inside the
   * fullscreen overlay). Receives the current fullscreen state so the consumer
   * can, e.g., only show an answer bar while immersive.
   */
  renderOverlay?: (fullscreen: boolean) => ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>({ k: 1, x: 0, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);

  // Refs mirror the live state so gesture math never reads a stale closure.
  const tRef = useRef(t);
  const apply = useCallback((next: Transform) => {
    const rect = boxRef.current?.getBoundingClientRect();
    const clamped = rect ? clampTransform(next, rect) : next;
    tRef.current = clamped;
    setT(clamped);
  }, []);

  const reset = useCallback(() => apply({ k: 1, x: 0, y: 0 }), [apply]);

  // Active pointers (id → client position) and the pinch seed.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number }; t: Transform } | null>(null);
  // A candidate tap: a single pointer that hasn't moved far enough to be a drag.
  const tap = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const localPoint = (clientX: number, clientY: number) => {
    const rect = boxRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  /** Zoom by `factor` keeping the content point under (fx,fy) fixed. */
  const zoomAround = useCallback(
    (factor: number, fx: number, fy: number) => {
      const cur = tRef.current;
      const k = Math.min(MAX_K, Math.max(MIN_K, cur.k * factor));
      const cx = (fx - cur.x) / cur.k;
      const cy = (fy - cur.y) / cur.k;
      apply({ k, x: fx - cx * k, y: fy - cy * k });
    },
    [apply],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch.current = null; // re-seed on the next two-pointer move
    // A tap is only a candidate while exactly one pointer is down.
    tap.current = pointers.current.size === 1 ? { x: e.clientX, y: e.clientY, moved: false } : null;
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pts = pointers.current;
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId)!;
      const cur = { x: e.clientX, y: e.clientY };
      pts.set(e.pointerId, cur);

      // Past a small threshold this gesture is a drag, not a tap.
      if (tap.current) {
        if (Math.hypot(cur.x - tap.current.x, cur.y - tap.current.y) > 6) tap.current.moved = true;
      }

      if (pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const mid = localPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
        if (!pinch.current || pinch.current.dist === 0) {
          pinch.current = { dist, mid, t: { ...tRef.current } };
          return;
        }
        const start = pinch.current;
        const k = Math.min(MAX_K, Math.max(MIN_K, (start.t.k * dist) / start.dist));
        // Keep the content point that was under the start midpoint pinned to the
        // current midpoint (this also pans as the fingers move together).
        const cx = (start.mid.x - start.t.x) / start.t.k;
        const cy = (start.mid.y - start.t.y) / start.t.k;
        apply({ k, x: mid.x - cx * k, y: mid.y - cy * k });
      } else if (pts.size === 1 && tRef.current.k > 1) {
        apply({
          k: tRef.current.k,
          x: tRef.current.x + (cur.x - prev.x),
          y: tRef.current.y + (cur.y - prev.y),
        });
      }
    },
    [apply],
  );

  const endPointer = useCallback(
    (e: React.PointerEvent) => {
      const wasOnlyPointer = pointers.current.size === 1;
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;

      // A clean tap: the lone pointer lifted without dragging. Report it as a
      // normalized point on the un-zoomed content box so the consumer can hit-test.
      if (onTap && wasOnlyPointer && tap.current && !tap.current.moved) {
        const rect = boxRef.current?.getBoundingClientRect();
        if (rect) {
          const lx = e.clientX - rect.left;
          const ly = e.clientY - rect.top;
          const cur = tRef.current;
          const u = (lx - cur.x) / cur.k / rect.width;
          const v = (ly - cur.y) / cur.k / rect.height;
          if (u >= 0 && u <= 1 && v >= 0 && v <= 1) onTap(u, v);
        }
      }
      tap.current = null;
    },
    [onTap],
  );

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const p = localPoint(e.clientX, e.clientY);
      if (tRef.current.k > 1.05) reset();
      else zoomAround(2.4, p.x, p.y);
    },
    [reset, zoomAround],
  );

  // Non-passive wheel listener (so we can preventDefault the page scroll) plus
  // body-scroll lock and Escape-to-leave while fullscreen.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAround(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAround, fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  const zoomed = t.k > 1.01;

  const box = (
    <div
      ref={boxRef}
      className={`relative aspect-[8/5] w-full select-none overflow-hidden border border-line bg-ink-2 ${
        fullscreen ? 'rounded-xl' : 'rounded-2xl'
      }`}
      style={{ touchAction: 'none', cursor: zoomed ? 'grab' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="absolute inset-0 origin-top-left"
        style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})`, willChange: 'transform' }}
      >
        {children}
      </div>

      {/* controls (not transformed) */}
      <div className="absolute right-2 top-2 z-10 flex gap-1.5">
        {zoomed && (
          <ControlButton label="Reset view" onClick={reset}>
            <path d="M3 12a9 9 0 1 0 2.6-6.3M3 4.5V9h4.5" />
          </ControlButton>
        )}
        <ControlButton
          label={fullscreen ? 'Leave fullscreen' : 'Fullscreen'}
          onClick={() => {
            setFullscreen((f) => !f);
            reset();
          }}
        >
          {fullscreen ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          )}
        </ControlButton>
      </div>

      {/* hint */}
      {!zoomed && (
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-full bg-ink/55 px-2.5 py-1 text-[0.62rem] font-medium tracking-wide text-faint backdrop-blur-sm">
          Pinch / scroll to zoom · drag to pan
        </div>
      )}

      {/* optional consumer overlay (answer bar, etc.) — not transformed */}
      {renderOverlay && renderOverlay(fullscreen)}
    </div>
  );

  if (!fullscreen) return box;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-3 backdrop-blur-sm">
      <div
        className="w-full"
        style={{ maxWidth: 'calc((100vh - 1.5rem) * 1.6)' }}
      >
        {box}
      </div>
    </div>,
    document.body,
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      // Don't let the press start a pan/zoom gesture on the map underneath.
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="grid h-9 w-9 place-items-center rounded-full border border-line bg-ink/70 text-muted backdrop-blur-sm transition hover:border-accent/40 hover:text-accent active:scale-95"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}
