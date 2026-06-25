import type { ContextMapData } from '../../types/content';

const W = 1000;
const H = 620;

/**
 * A stylized, abstract context map: a graticule backdrop with soft landmass
 * blobs, labeled location markers, and animated connection arcs. It is not a
 * real cartographic map — it answers "where / who" at a glance without needing
 * accurate geography or image assets.
 */
export default function ContextMap({ data }: { data: ContextMapData }) {
  const byId = new Map(data.markers.map((m) => [m.id, m]));
  const px = (x: number) => (x / 100) * W;
  const py = (y: number) => (y / 100) * H;

  const verticals = Array.from({ length: 9 }, (_, i) => (i * W) / 8);
  const horizontals = Array.from({ length: 6 }, (_, i) => (i * H) / 5);

  return (
    <div className="relative aspect-[8/5] w-full overflow-hidden rounded-2xl border border-line bg-ink-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="ctx-glow" cx="50%" cy="30%" r="75%">
            <stop offset="0%" stopColor="rgba(232,169,75,0.10)" />
            <stop offset="100%" stopColor="rgba(232,169,75,0)" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width={W} height={H} fill="url(#ctx-glow)" />

        {/* soft landmass blobs */}
        <g className="fill-surface-2" opacity="0.55">
          <ellipse cx={W * 0.2} cy={H * 0.4} rx={150} ry={95} />
          <ellipse cx={W * 0.5} cy={H * 0.62} rx={185} ry={120} />
          <ellipse cx={W * 0.82} cy={H * 0.35} rx={140} ry={110} />
        </g>

        {/* graticule */}
        <g className="stroke-line" strokeWidth={1} opacity="0.5">
          {verticals.map((x) => (
            <line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} />
          ))}
          {horizontals.map((y) => (
            <line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} />
          ))}
        </g>

        {/* connections */}
        {data.connections?.map((c, i) => {
          const a = byId.get(c.from);
          const b = byId.get(c.to);
          if (!a || !b) return null;
          const ax = px(a.x);
          const ay = py(a.y);
          const bx = px(b.x);
          const by = py(b.y);
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;
          const lift = Math.min(Math.hypot(bx - ax, by - ay) * 0.28, 150);
          const cy = my - lift;
          const d = `M ${ax} ${ay} Q ${mx} ${cy} ${bx} ${by}`;
          return (
            <g key={`c${i}`}>
              <path d={d} fill="none" className="stroke-accent" strokeWidth={2} opacity="0.18" />
              <path
                d={d}
                fill="none"
                className="stroke-accent animate-dash"
                strokeWidth={2}
                strokeLinecap="round"
                opacity="0.85"
              />
              {c.label && (
                <text
                  x={mx}
                  y={cy + 2}
                  textAnchor="middle"
                  className="fill-accent-soft"
                  style={{ fontSize: 22, fontWeight: 600, letterSpacing: 1 }}
                >
                  {c.label}
                </text>
              )}
            </g>
          );
        })}

        {/* marker dots */}
        {data.markers.map((m) => {
          const cx = px(m.x);
          const cy = py(m.y);
          const primary = m.role !== 'secondary';
          return (
            <g key={m.id}>
              {primary && (
                <circle cx={cx} cy={cy} r={10} className="fill-accent" opacity="0.35">
                  <animate
                    attributeName="r"
                    values="10;26;10"
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.35;0;0.35"
                    dur="2.6s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={cx}
                cy={cy}
                r={primary ? 9 : 6}
                className={primary ? 'fill-accent' : 'fill-muted'}
                stroke="var(--color-ink)"
                strokeWidth={3}
              />
            </g>
          );
        })}
      </svg>

      {/* HTML labels (crisp text) */}
      {data.markers.map((m) => (
        <div
          key={m.id}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-[150%]"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        >
          <span
            className={`rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold backdrop-blur-sm ${
              m.role === 'secondary'
                ? 'border-line bg-surface/80 text-muted'
                : 'border-accent/40 bg-ink/80 text-accent-soft'
            }`}
          >
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}
