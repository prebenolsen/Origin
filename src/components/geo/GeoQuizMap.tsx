import { useMemo, type ReactNode } from 'react';
import { geoContains, geoPath } from 'd3-geo';
import { fitProjection, landGeometry, graticule, type LngLat } from '../../lib/geo';
import { countryFeaturesById, type CountryFeature } from '../../lib/countryShapes';
import type { Board, Region } from '../../lib/geography';
import { MAP_W, MAP_H } from '../module/mapParts';
import MapViewport from '../module/MapViewport';

interface CountryLabelLayout {
  x: number;
  y: number;
  angle: number;
  fontSize: number;
  lines: string[];
  clipId: string;
}

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

    const countryShapes: {
      region: Region;
      feature: CountryFeature;
      d: string;
      cx: number;
      cy: number;
      labelLayout: CountryLabelLayout | null;
    }[] = [];
    const seaPoints: { region: Region; x: number; y: number }[] = [];

    if (board.kind === 'countries') {
      const byId = countryFeaturesById();
      for (const region of board.regions) {
        const feature = byId.get(region.id);
        if (!feature) continue;
        const d = path(feature as any) ?? '';
        const c = path.centroid(feature as any);
        const clipId = `geo-country-${board.key}-${region.id}`;
        countryShapes.push({
          region,
          feature,
          d,
          cx: c[0],
          cy: c[1],
          labelLayout: d ? buildCountryLabelLayout(feature, region.name, project, c as [number, number], clipId) : null,
        });
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
          {board.kind === 'countries' &&
            countryShapes
              .filter(({ region, d, labelLayout }) => solved.has(region.id) && !!d && !!labelLayout)
              .map(({ region, d, labelLayout }) => (
                <clipPath key={region.id} id={labelLayout!.clipId}>
                  <path d={d} />
                </clipPath>
              ))}
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

        {board.kind === 'countries' &&
          countryShapes
            .filter(({ region, labelLayout }) => solved.has(region.id) && !!labelLayout)
            .map(({ region, labelLayout }) => (
              <CountryShapeLabel key={region.id} label={region.name} layout={labelLayout!} />
            ))}

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

      {/* HTML labels are kept only for sea markers; country labels live inside the SVG so they zoom with the map. */}
      {board.kind === 'countries'
        ? null
        : seaPoints
            .filter(({ region }) => solved.has(region.id) || activeId === region.id)
            .map(({ region, x, y }) => (
              <RegionLabel key={region.id} cx={x} cy={y - 22} label={region.name} solved={solved.has(region.id)} />
            ))}
    </MapViewport>
  );
}

function CountryShapeLabel({ label, layout }: { label: string; layout: CountryLabelLayout }) {
  const lineHeight = layout.fontSize * 0.94;
  const baselineOffset = ((layout.lines.length - 1) * lineHeight) / 2;

  return (
    <g
      clipPath={`url(#${layout.clipId})`}
      transform={`translate(${layout.x} ${layout.y}) rotate(${layout.angle})`}
      className="pointer-events-none"
    >
      <text
        x={0}
        y={0}
        textAnchor="middle"
        fontSize={layout.fontSize}
        fontWeight={700}
        letterSpacing="0.02em"
        fill="var(--color-accent-soft)"
        stroke="rgba(12,11,16,0.92)"
        strokeWidth={Math.max(1.2, layout.fontSize * 0.18)}
        paintOrder="stroke"
      >
        {layout.lines.map((line, index) => (
          <tspan key={`${label}-${index}`} x={0} dy={index === 0 ? -baselineOffset : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
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

function buildCountryLabelLayout(
  feature: CountryFeature,
  label: string,
  project: (point: [number, number]) => [number, number] | null,
  fallbackCenter: [number, number],
  clipId: string,
): CountryLabelLayout | null {
  const points = collectProjectedPoints(feature, project);
  if (points.length < 2) return null;

  const center = Number.isFinite(fallbackCenter[0]) && Number.isFinite(fallbackCenter[1]) ? fallbackCenter : averagePoint(points);
  const principal = principalAxis(points);
  const useTilt = principal.aspect >= 1.7 && label.length <= 16;
  const angle = useTilt ? clamp(principal.angle, -65, 65) : 0;
  const box = rotatedBounds(points, center, angle);
  const width = Math.max(8, box.width * 0.78);
  const height = Math.max(6, box.height * 0.68);
  const lines = splitCountryLabel(label, width, height, useTilt);
  const maxChars = Math.max(...lines.map((line) => line.length), 1);
  const fontFromWidth = width / (maxChars * 0.58);
  const fontFromHeight = height / (lines.length * 1.04);
  const fontSize = clamp(Math.min(fontFromWidth, fontFromHeight), 4.5, 16);

  return {
    x: center[0],
    y: center[1],
    angle,
    fontSize,
    lines,
    clipId,
  };
}

function collectProjectedPoints(
  feature: CountryFeature,
  project: (point: [number, number]) => [number, number] | null,
): [number, number][] {
  const points: [number, number][] = [];
  const geometry = (feature as any)?.geometry ?? feature;

  const visit = (node: unknown) => {
    if (!Array.isArray(node) || node.length === 0) return;
    if (typeof node[0] === 'number' && typeof node[1] === 'number') {
      const xy = project([node[0], node[1]] as [number, number]);
      if (xy) points.push([xy[0], xy[1]]);
      return;
    }
    for (const child of node) visit(child);
  };

  visit((geometry as any)?.coordinates);
  return points;
}

function averagePoint(points: [number, number][]): [number, number] {
  let sx = 0;
  let sy = 0;
  for (const [x, y] of points) {
    sx += x;
    sy += y;
  }
  return [sx / points.length, sy / points.length];
}

function principalAxis(points: [number, number][]) {
  const [mx, my] = averagePoint(points);
  let cxx = 0;
  let cyy = 0;
  let cxy = 0;
  for (const [x, y] of points) {
    const dx = x - mx;
    const dy = y - my;
    cxx += dx * dx;
    cyy += dy * dy;
    cxy += dx * dy;
  }

  const angle = (Math.atan2(2 * cxy, cxx - cyy) * 90) / Math.PI;
  const trace = cxx + cyy;
  const det = cxx * cyy - cxy * cxy;
  const root = Math.sqrt(Math.max(0, trace * trace * 0.25 - det));
  const major = Math.max(1, trace * 0.5 + root);
  const minor = Math.max(1, trace * 0.5 - root);

  return {
    angle,
    aspect: Math.sqrt(major / minor),
  };
}

function rotatedBounds(points: [number, number][], center: [number, number], angle: number) {
  const radians = (-angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    const dx = x - center[0];
    const dy = y - center[1];
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    if (rx < minX) minX = rx;
    if (rx > maxX) maxX = rx;
    if (ry < minY) minY = ry;
    if (ry > maxY) maxY = ry;
  }

  return { width: maxX - minX, height: maxY - minY };
}

function splitCountryLabel(label: string, width: number, height: number, tilted: boolean) {
  const words = label.split(' ');
  if (tilted || words.length === 1) return [label];

  const estimatedSingleLine = label.length * 0.58;
  const needsWrap = estimatedSingleLine > width / Math.max(height / 8, 1) || words.length >= 3;
  if (!needsWrap) return [label];

  let bestIndex = 1;
  let bestScore = Infinity;
  for (let index = 1; index < words.length; index++) {
    const left = words.slice(0, index).join(' ');
    const right = words.slice(index).join(' ');
    const score = Math.abs(left.length - right.length);
    if (score < bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return [words.slice(0, bestIndex).join(' '), words.slice(bestIndex).join(' ')];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
