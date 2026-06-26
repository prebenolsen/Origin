import { useMemo } from 'react';
import type { ContextMapData } from '../../types/content';
import { fitProjection, landGeometry, graticule, pathFor, type LngLat } from '../../lib/geo';
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
 * Real cartographic context map. Renders the actual land silhouette from
 * Natural Earth data, projected (Mercator) and auto-framed around the module's
 * markers — so a continent looks like a continent and every marker sits at its
 * true location. Used whenever every marker carries `lat`/`lng`.
 */
export default function GeoMap({ data }: { data: ContextMapData }) {
  const { landPath, gratPath, points, placements } = useMemo(() => {
    const coords: LngLat[] = data.markers.map((m) => ({ lng: m.lng!, lat: m.lat! }));
    const projection = fitProjection(coords, MAP_W, MAP_H, data.focus);
    const path = pathFor(projection);

    const points = new Map<string, Pt>();
    for (const m of data.markers) {
      const xy = projection([m.lng!, m.lat!]);
      if (xy) points.set(m.id, { x: xy[0], y: xy[1] });
    }

    const markerInputs: LabelInput[] = data.markers
      .filter((m) => points.has(m.id))
      .map((m) => ({ id: m.id, ...points.get(m.id)!, label: m.label, primary: m.role !== 'secondary' }));

    const arcInputs: ArcLabelInput[] = [];
    (data.connections ?? []).forEach((c, i) => {
      const a = points.get(c.from);
      const b = points.get(c.to);
      if (a && b && c.label) arcInputs.push({ id: `arc${i}`, apex: arcApex(a, b), label: c.label });
    });

    const placements = layoutLabels(markerInputs, arcInputs);

    return {
      landPath: path(landGeometry()) ?? '',
      gratPath: path(graticule) ?? '',
      points,
      placements,
    };
  }, [data]);

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
          <radialGradient id="geo-glow" cx="50%" cy="22%" r="80%">
            <stop offset="0%" stopColor="rgba(232,169,75,0.10)" />
            <stop offset="100%" stopColor="rgba(232,169,75,0)" />
          </radialGradient>
        </defs>

        {/* ocean glow */}
        <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#geo-glow)" />

        {/* graticule (faint lat/long grid) */}
        <path d={gratPath} fill="none" className="stroke-line" strokeWidth={1} opacity="0.45" />

        {/* real landmasses */}
        <path
          d={landPath}
          className="fill-surface-2 stroke-line-soft"
          strokeWidth={1}
          opacity="0.95"
        />
        {/* subtle coastline highlight */}
        <path d={landPath} fill="none" className="stroke-faint" strokeWidth={0.75} opacity="0.5" />

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

        {/* markers */}
        {data.markers.map((m) => {
          const p = points.get(m.id);
          if (!p) return null;
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
