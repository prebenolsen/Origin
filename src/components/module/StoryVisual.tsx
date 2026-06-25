import type { ContextMapData } from '../../types/content';
import ContextMap from './ContextMap';

/** Cheap deterministic hash so a visual key always renders the same motif. */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Renders a story card's optional visual.
 * - `visual: "map"` reuses the module's context map (great for geography).
 * - any other key renders a subtle, deterministic abstract "strata" motif so
 *   cards get a touch of imagery without shipping image assets.
 */
export default function StoryVisual({
  visual,
  mapData,
}: {
  visual: string;
  mapData?: ContextMapData;
}) {
  if (visual === 'map' && mapData) {
    return <ContextMap data={mapData} />;
  }

  const h = hash(visual);
  const bands = 3 + (h % 3);
  const skew = ((h >> 3) % 40) - 20;

  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl border border-line bg-ink-2">
      <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${h}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(232,169,75,0.32)" />
            <stop offset="100%" stopColor="rgba(124,92,255,0.18)" />
          </linearGradient>
        </defs>
        {Array.from({ length: bands }).map((_, i) => {
          const y = 30 + (i * 160) / bands;
          const c = 200 + skew * (i % 2 === 0 ? 1 : -1);
          return (
            <path
              key={i}
              d={`M -20 ${y} Q ${c} ${y - 40} 420 ${y}`}
              fill="none"
              stroke={`url(#grad-${h})`}
              strokeWidth={2 + (i % 2)}
              opacity={0.5 + i * 0.12}
            />
          );
        })}
      </svg>
      <span className="absolute bottom-2 right-3 text-[0.62rem] uppercase tracking-[0.2em] text-faint">
        {visual}
      </span>
    </div>
  );
}
