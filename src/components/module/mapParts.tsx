/**
 * Shared presentational pieces for the context maps. Both the real `GeoMap`
 * and the abstract `SchematicMap` compute screen coordinates differently
 * (projection vs. percentage layout) but draw the same themed markers, arcs,
 * and labels through these parts — so the two modes look like one family.
 */

/** Logical drawing surface. The SVG scales to its container via viewBox. */
export const MAP_W = 1000;
export const MAP_H = 620;

/** Screen-space point in the MAP_W × MAP_H coordinate system. */
export interface Pt {
  x: number;
  y: number;
}

/** The apex (control/label point) of the lifted arc between two points. */
export function arcApex(a: Pt, b: Pt): Pt {
  const lift = Math.min(Math.hypot(b.x - a.x, b.y - a.y) * 0.22, 130);
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - lift };
}

/**
 * A gentle quadratic arc between two screen points, lifted toward the top so
 * connections read as routes rather than straight lines.
 */
export function arcPath(a: Pt, b: Pt): string {
  const apex = arcApex(a, b);
  return `M ${a.x} ${a.y} Q ${apex.x} ${apex.y} ${b.x} ${b.y}`;
}

/** Just the arc. Its label is placed separately (de-collided) as an `ArcLabel`. */
export function ConnectionArc({ a, b }: { a: Pt; b: Pt }) {
  const d = arcPath(a, b);
  return (
    <g>
      <path d={d} fill="none" className="stroke-accent" strokeWidth={2} opacity="0.16" />
      <path
        d={d}
        fill="none"
        className="stroke-accent animate-dash"
        strokeWidth={2}
        strokeLinecap="round"
        opacity="0.8"
      />
    </g>
  );
}

/** A connection label, drawn as crisp SVG text centred at a placed position. */
export function ArcLabel({ cx, cy, label }: { cx: number; cy: number; label: string }) {
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-accent-soft"
      style={{ fontSize: 21, fontWeight: 600, letterSpacing: 0.5 }}
    >
      {label}
    </text>
  );
}

/**
 * A subtle connector drawn from a displaced label back to the marker it names.
 * It runs from the dot to the nearest edge of the label box (computed from the
 * label centre + size), with a small node where it meets the pill.
 */
export function LeaderLine({
  anchor,
  cx,
  cy,
  w,
  h,
  primary,
  node = true,
}: {
  anchor: Pt;
  cx: number;
  cy: number;
  w: number;
  h: number;
  primary: boolean;
  /** Draw a small dot where the line meets the label (off for arc labels). */
  node?: boolean;
}) {
  const dx = anchor.x - cx;
  const dy = anchor.y - cy;
  if (dx === 0 && dy === 0) return null;
  // Point where the anchor→centre ray exits the label rectangle.
  const sx = dx !== 0 ? w / 2 / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? h / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  const ex = cx + dx * s;
  const ey = cy + dy * s;
  const color = primary ? 'stroke-accent' : 'stroke-muted';
  const fill = primary ? 'fill-accent' : 'fill-muted';
  return (
    <g opacity="0.5">
      <line x1={ex} y1={ey} x2={anchor.x} y2={anchor.y} className={color} strokeWidth={1.4} strokeLinecap="round" />
      {node && <circle cx={ex} cy={ey} r={2.4} className={fill} />}
    </g>
  );
}

export function MarkerDot({ p, primary }: { p: Pt; primary: boolean }) {
  return (
    <g>
      {primary && (
        <circle cx={p.x} cy={p.y} r={10} className="fill-accent" opacity="0.35">
          <animate attributeName="r" values="10;26;10" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0;0.35" dur="2.6s" repeatCount="indefinite" />
        </circle>
      )}
      <circle
        cx={p.x}
        cy={p.y}
        r={primary ? 8.5 : 5.5}
        className={primary ? 'fill-accent' : 'fill-muted'}
        stroke="var(--color-ink)"
        strokeWidth={3}
      />
    </g>
  );
}

/** Crisp HTML label, centred at a pre-computed position (viewBox units) chosen
 *  by the de-collision pass in `mapLayout.ts`. */
export function MarkerLabel({
  cx,
  cy,
  label,
  primary,
}: {
  cx: number;
  cy: number;
  label: string;
  primary: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${(cx / MAP_W) * 100}%`, top: `${(cy / MAP_H) * 100}%` }}
    >
      <span
        className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold backdrop-blur-sm ${
          primary
            ? 'border-accent/40 bg-ink/80 text-accent-soft'
            : 'border-line bg-surface/80 text-muted'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
