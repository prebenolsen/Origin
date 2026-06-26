import { useMemo, type ReactNode } from 'react';
import { geoContains, geoPath } from 'd3-geo';
import { fitProjection, landGeometry, graticule, type LngLat } from '../../lib/geo';
import { countryFeaturesById, type CountryFeature } from '../../lib/countryShapes';
import type { Board, Region } from '../../lib/geography';
import { MAP_W, MAP_H } from '../module/mapParts';
import MapViewport from '../module/MapViewport';

/**
 * The interactive challenge map. It draws either a continent's countries (real
 * Natural Earth polygons) or the world's oceans & seas (markers), themed to
 * match the rest of Origin's maps. Solved regions stay highlighted; tapping a
 * region reports it up to the game via the shared `MapViewport` tap handler
 * (which keeps working through pan / zoom / fullscreen).
 */
export default function GeoQuizMap({
  board,
  solved,
  activeId,
  onSelect,
  renderOverlay,
}: {
  board: Board;
  solved: Set<string>;
  activeId: string | null;
  onSelect: (id: string | null) => void;
  renderOverlay?: (fullscreen: boolean) => ReactNode;
}) {
  const { project, countryShapes, seaPoints, landPath, gratPath } = useMemo(() => {
    const project = fitProjection([] as LngLat[], MAP_W, MAP_H, board.focus);
    const path = geoPath(project);

    const countryShapes: { region: Region; feature: CountryFeature; d: string; cx: number; cy: number }[] = [];
    const seaPoints: { region: Region; x: number; y: number }[] = [];

    if (board.kind === 'countries') {
      const byId = countryFeaturesById();
      for (const region of board.regions) {
        const feature = byId.get(region.id);
        if (!feature) continue;
        const d = path(feature as any) ?? '';
        const c = path.centroid(feature as any);
        countryShapes.push({ region, feature, d, cx: c[0], cy: c[1] });
      }
    } else {
      for (const region of board.regions) {
        const xy = project([region.lng!, region.lat!]);
        if (xy) seaPoints.push({ region, x: xy[0], y: xy[1] });
      }
    }

    return {
      project,
      countryShapes,
      seaPoints,
      landPath: path(landGeometry() as any) ?? '',
      gratPath: path(graticule as any) ?? '',
    };
  }, [board]);

  const handleTap = (u: number, v: number) => {
    const vx = u * MAP_W;
    const vy = v * MAP_H;

    if (board.kind === 'seas') {
      let best: { region: Region } | null = null;
      let bestD = Infinity;
      for (const sp of seaPoints) {
        const d = Math.hypot(sp.x - vx, sp.y - vy);
        if (d < bestD) {
          bestD = d;
          best = sp;
        }
      }
      onSelect(best && bestD < 150 ? best.region.id : null);
      return;
    }

    const ll = project.invert?.([vx, vy]);
    if (!ll) {
      onSelect(null);
      return;
    }
    const hit = countryShapes.find((c) => geoContains(c.feature as any, ll));
    onSelect(hit ? hit.region.id : null);
  };

  return (
    <MapViewport onTap={handleTap} renderOverlay={renderOverlay}>
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="quiz-glow" cx="50%" cy="20%" r="85%">
            <stop offset="0%" stopColor="rgba(232,169,75,0.10)" />
            <stop offset="100%" stopColor="rgba(232,169,75,0)" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#quiz-glow)" />
        <path d={gratPath} fill="none" className="stroke-line" strokeWidth={1} opacity="0.4" />

        {/* Neutral land backdrop so coastlines read even where a country isn't in play. */}
        <path d={landPath} className="fill-surface stroke-line-soft" strokeWidth={0.75} opacity="0.6" />

        {/* Playable countries, styled by state. */}
        {countryShapes.map(({ region, d }) => {
          const isSolved = solved.has(region.id);
          const isActive = activeId === region.id;
          let cls = 'fill-surface-2 stroke-line hover:fill-surface-3';
          if (isSolved) cls = 'fill-accent stroke-accent-soft';
          else if (isActive) cls = 'fill-surface-3 stroke-accent';
          return (
            <path
              key={region.id}
              d={d}
              className={cls}
              fillOpacity={isSolved ? 0.82 : 1}
              strokeWidth={isActive || isSolved ? 1.4 : 0.6}
              style={{ transition: 'fill 0.3s ease' }}
            />
          );
        })}

        {/* Sea markers. */}
        {seaPoints.map(({ region, x, y }) => {
          const isSolved = solved.has(region.id);
          const isActive = activeId === region.id;
          return (
            <g key={region.id}>
              {(isActive || isSolved) && (
                <circle
                  cx={x}
                  cy={y}
                  r={16}
                  className={isSolved ? 'fill-accent' : 'fill-accent-soft'}
                  opacity="0.18"
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isActive || isSolved ? 9 : 7}
                className={isSolved ? 'fill-accent' : isActive ? 'fill-accent-soft' : 'fill-muted'}
                stroke="var(--color-ink)"
                strokeWidth={3}
              />
            </g>
          );
        })}
      </svg>

      {/* Crisp HTML labels for solved regions (and the active sea), positioned at centroids. */}
      {board.kind === 'countries'
        ? countryShapes
            .filter(({ region }) => solved.has(region.id))
            .map(({ region, cx, cy }) => <RegionLabel key={region.id} cx={cx} cy={cy} label={region.name} solved />)
        : seaPoints
            .filter(({ region }) => solved.has(region.id) || activeId === region.id)
            .map(({ region, x, y }) => (
              <RegionLabel key={region.id} cx={x} cy={y - 22} label={region.name} solved={solved.has(region.id)} />
            ))}
    </MapViewport>
  );
}

function RegionLabel({ cx, cy, label, solved }: { cx: number; cy: number; label: string; solved: boolean }) {
  if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${(cx / MAP_W) * 100}%`, top: `${(cy / MAP_H) * 100}%` }}
    >
      <span
        className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold backdrop-blur-sm ${
          solved ? 'border-accent/50 bg-ink/80 text-accent-soft' : 'border-line bg-surface/80 text-muted'
        }`}
      >
        {label}
      </span>
    </div>
  );
}
