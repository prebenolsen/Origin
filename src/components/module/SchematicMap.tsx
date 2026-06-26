import type { ContextMapData } from '../../types/content';
import {
  ArcLabel,
  ConnectionArc,
  LeaderLine,
  MarkerDot,
  MarkerLabel,
  arcApex,
  MAP_W,
  MAP_H,
  type Pt,
} from './mapParts';
import { layoutLabels, type ArcLabelInput, type LabelInput } from './mapLayout';
import MapViewport from './MapViewport';

/**
 * Abstract concept map for NON-geographic modules (psychology, political
 * concepts, technology, …) and as the fallback when markers lack real
 * coordinates. It deliberately avoids any fake geography — instead of pretend
 * continents it shows an honest node-and-link diagram on a soft dotted field,
 * so it reads as a relationship map rather than a broken world map.
 *
 * Marker positions come from `x`/`y` (percentages of the box).
 */
export default function SchematicMap({ data }: { data: ContextMapData }) {
  const points = new Map<string, Pt>();
  data.markers.forEach((m, i) => {
    // Fall back to an even spread if a marker omits x/y entirely.
    const fx = m.x ?? ((i + 1) / (data.markers.length + 1)) * 100;
    const fy = m.y ?? 50;
    points.set(m.id, { x: (fx / 100) * MAP_W, y: (fy / 100) * MAP_H });
  });

  const markerInputs: LabelInput[] = data.markers.map((m) => ({
    id: m.id,
    ...points.get(m.id)!,
    label: m.label,
    primary: m.role !== 'secondary',
  }));

  const arcInputs: ArcLabelInput[] = [];
  (data.connections ?? []).forEach((c, i) => {
    const a = points.get(c.from);
    const b = points.get(c.to);
    if (a && b && c.label) arcInputs.push({ id: `arc${i}`, apex: arcApex(a, b), label: c.label });
  });

  const placements = layoutLabels(markerInputs, arcInputs);
  const markerPlacements = placements.filter((p) => p.kind === 'marker');
  const arcPlacements = placements.filter((p) => p.kind === 'arc');

  return (
    <MapViewport>
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="schem-glow" cx="50%" cy="28%" r="80%">
            <stop offset="0%" stopColor="rgba(232,169,75,0.10)" />
            <stop offset="100%" stopColor="rgba(232,169,75,0)" />
          </radialGradient>
          <pattern id="schem-dots" width="34" height="34" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" className="fill-line" opacity="0.55" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#schem-dots)" />
        <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#schem-glow)" />

        {/* connection arcs */}
        {data.connections?.map((c, i) => {
          const a = points.get(c.from);
          const b = points.get(c.to);
          if (!a || !b) return null;
          return <ConnectionArc key={`c${i}`} a={a} b={b} />;
        })}

        {/* leader lines from displaced labels back to where they belong */}
        {placements.map((pl) =>
          pl.leader ? (
            <LeaderLine
              key={`l${pl.id}`}
              anchor={pl.anchor}
              cx={pl.cx}
              cy={pl.cy}
              w={pl.w}
              h={pl.h}
              primary={pl.primary}
              node={pl.kind === 'marker'}
            />
          ) : null,
        )}

        {/* connection labels (de-collided, crisp SVG text) */}
        {arcPlacements.map((pl) => (
          <ArcLabel key={pl.id} cx={pl.cx} cy={pl.cy} label={pl.label} />
        ))}

        {/* nodes */}
        {data.markers.map((m) => {
          const p = points.get(m.id)!;
          return <MarkerDot key={m.id} p={p} primary={m.role !== 'secondary'} />;
        })}
      </svg>

      {/* crisp HTML marker labels (positions chosen by the de-collision pass) */}
      {markerPlacements.map((pl) => (
        <MarkerLabel key={pl.id} cx={pl.cx} cy={pl.cy} label={pl.label} primary={pl.primary} />
      ))}
    </MapViewport>
  );
}
