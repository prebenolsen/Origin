import { useMemo, useState, type ReactNode } from 'react';
import { geoContains, geoPath, type GeoProjection } from 'd3-geo';
import { fitProjection, landGeometry, graticule, type LngLat } from '../../lib/geo';
import { countryFeaturesById, type CountryFeature } from '../../lib/countryShapes';
import { SMALL_COUNTRY_IDS, type Board, type Region } from '../../lib/geography';
import { MAP_W, MAP_H } from '../module/mapParts';
import MapViewport, { type FocusTarget } from '../module/MapViewport';

interface CountryLabelLayout {
  x: number;
  y: number;
  angle: number;
  fontSize: number;
  lines: string[];
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
  const [focusSerial, setFocusSerial] = useState(0);
  const [assistStep, setAssistStep] = useState(0);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

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
      focusU: number;
      focusV: number;
      focusK: number;
      smallPriority: boolean;
    }[] = [];
    const seaPoints: { region: Region; x: number; y: number }[] = [];

    if (board.kind === 'countries') {
      const byId = countryFeaturesById();
      for (const region of board.regions) {
        const feature = byId.get(region.id);
        if (!feature) continue;
        const d = path(feature as any) ?? '';
        const c = path.centroid(feature as any);
        const focus = computeCountryFocus(feature, project, c as [number, number]);
        countryShapes.push({
          region,
          feature,
          d,
          cx: c[0],
          cy: c[1],
          labelLayout: d ? buildCountryLabelLayout(feature, region.name, project, c as [number, number]) : null,
          focusU: focus.u,
          focusV: focus.v,
          focusK: focus.k,
          smallPriority: SMALL_COUNTRY_IDS.has(region.id),
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
  }, [board, solved]);

  const assistRanked = useMemo(() => {
    if (board.kind !== 'countries') return [] as typeof countryShapes;
    const unsolved = countryShapes.filter((c) => !solved.has(c.region.id));
    const small = unsolved.filter((c) => c.smallPriority).sort((a, b) => a.focusK - b.focusK || a.region.name.localeCompare(b.region.name));
    if (small.length > 0) return small;
    return unsolved.sort((a, b) => a.focusK - b.focusK || a.region.name.localeCompare(b.region.name));
  }, [board.kind, countryShapes, solved]);

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
    <MapViewport
      onTap={handleTap}
      focusTarget={focusTarget}
      hideHint={board.kind === 'countries'}
      renderOverlay={(fullscreen) => (
        <>
          {board.kind === 'countries' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!assistRanked.length) return;
                const idx = assistStep % assistRanked.length;
                const target = assistRanked[idx];
                onSelect(target.region.id);
                setFocusSerial((n) => {
                  const serial = n + 1;
                  setFocusTarget({
                    u: target.focusU,
                    v: target.focusV,
                    k: target.focusK,
                    nonce: serial,
                  });
                  return serial;
                });
                setAssistStep((s) => s + 1);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-2 left-2 z-20 grid h-10 w-10 place-items-center rounded-full border border-line bg-ink/75 text-accent-soft backdrop-blur-sm transition enabled:hover:border-accent/50 enabled:hover:text-accent enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Focus a small unsolved country"
              title="Focus small unsolved country"
              disabled={!assistRanked.length}
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
                <circle cx="7" cy="9" r="2" />
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="16.5" cy="11" r="1.2" />
                <path d="M15 15l5 5" />
                <circle cx="13" cy="13" r="5" />
              </svg>
            </button>
          )}
          {renderOverlay ? renderOverlay(fullscreen) : null}
        </>
      )}
    >
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
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

function computeCountryFocus(feature: CountryFeature, project: GeoProjection, fallbackCenter: [number, number]) {
  const dominant = dominantProjectedPolygon(feature, project);
  if (!dominant || dominant.points.length < 3) {
    return {
      u: clamp(fallbackCenter[0] / MAP_W, 0.05, 0.95),
      v: clamp(fallbackCenter[1] / MAP_H, 0.05, 0.95),
      k: 4,
    };
  }

  const center = bestInteriorAnchor(dominant.rings, fallbackCenter);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of dominant.points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const width = Math.max(4, maxX - minX);
  const height = Math.max(4, maxY - minY);
  const targetLinear = Math.sqrt(0.3);
  const kx = targetLinear / (width / MAP_W);
  const ky = targetLinear / (height / MAP_H);
  const k = clamp(Math.min(kx, ky), 2.2, 20);

  return {
    u: clamp(center[0] / MAP_W, 0.03, 0.97),
    v: clamp(center[1] / MAP_H, 0.03, 0.97),
    k,
  };
}

function CountryShapeLabel({ label, layout }: { label: string; layout: CountryLabelLayout }) {
  const lineHeight = layout.fontSize * 0.94;
  const baselineOffset = ((layout.lines.length - 1) * lineHeight) / 2;

  return (
    <g transform={`translate(${layout.x} ${layout.y}) rotate(${layout.angle})`} className="pointer-events-none">
      <text
        x={0}
        y={0}
        textAnchor="middle"
        fontSize={layout.fontSize}
        fontWeight={700}
        letterSpacing="0.02em"
        fill="rgba(12,11,16,0.96)"
        stroke="rgba(243,205,140,0.9)"
        strokeWidth={Math.max(0.35, layout.fontSize * 0.1)}
        paintOrder="stroke"
        dominantBaseline="middle"
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
  project: GeoProjection,
  fallbackCenter: [number, number],
): CountryLabelLayout | null {
  const dominant = dominantProjectedPolygon(feature, project);
  if (!dominant || dominant.points.length < 3) return null;

  const coarseCenter =
    Number.isFinite(fallbackCenter[0]) && Number.isFinite(fallbackCenter[1]) ? fallbackCenter : averagePoint(dominant.points);
  const center = bestInteriorAnchor(dominant.rings, coarseCenter);
  const principal = principalAxis(dominant.points);
  const useTilt = principal.aspect >= 1.7 && label.length <= 16;
  const angle = useTilt ? clamp(principal.angle, -65, 65) : 0;
  const box = rotatedBounds(dominant.points, center, angle);
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
  };
}

function dominantProjectedPolygon(feature: CountryFeature, project: GeoProjection) {
  const polygons = extractPolygons(feature);
  if (polygons.length === 0) return null;

  let best: { rings: [number, number][][]; points: [number, number][]; area: number } | null = null;

  for (const polygon of polygons) {
    const projectedRings = polygon
      .map((ring) => projectRing(ring, project))
      .filter((ring) => ring.length >= 3);
    if (projectedRings.length === 0) continue;

    const outer = projectedRings[0];
    const area = Math.abs(ringArea(outer));
    if (area < 1) continue;

    const points = projectedRings.flat();
    if (!best || area > best.area) best = { rings: projectedRings, points, area };
  }

  return best;
}

function extractPolygons(feature: CountryFeature): [number, number][][][] {
  const geometry = (feature as any)?.geometry;
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates as [number, number][][]];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates as [number, number][][][];
  return [];
}

function projectRing(ring: [number, number][], project: GeoProjection): [number, number][] {
  const out: [number, number][] = [];
  for (const point of ring) {
    const xy = project([point[0], point[1]]);
    if (xy && Number.isFinite(xy[0]) && Number.isFinite(xy[1])) out.push([xy[0], xy[1]]);
  }
  return out;
}

function ringArea(ring: [number, number][]) {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
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

function bestInteriorAnchor(rings: [number, number][][], fallback: [number, number]): [number, number] {
  const outer = rings[0];
  if (!outer || outer.length < 3) return fallback;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of outer) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  let best = pointInPolygonWithHoles(fallback, rings) ? fallback : centroidOfRing(outer);
  let bestScore = pointInPolygonWithHoles(best, rings) ? distanceToPolygonEdges(best, rings) : -1;

  const cols = 18;
  const rows = 18;
  for (let xi = 0; xi <= cols; xi++) {
    const x = minX + ((maxX - minX) * xi) / cols;
    for (let yi = 0; yi <= rows; yi++) {
      const y = minY + ((maxY - minY) * yi) / rows;
      const p: [number, number] = [x, y];
      if (!pointInPolygonWithHoles(p, rings)) continue;
      const score = distanceToPolygonEdges(p, rings);
      if (score > bestScore) {
        best = p;
        bestScore = score;
      }
    }
  }

  return best;
}

function centroidOfRing(ring: [number, number][]): [number, number] {
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    const cross = x1 * y2 - x2 * y1;
    a += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  if (Math.abs(a) < 1e-6) return averagePoint(ring);
  const scale = 1 / (3 * a);
  return [cx * scale, cy * scale];
}

function pointInPolygonWithHoles(point: [number, number], rings: [number, number][][]) {
  if (!pointInRing(point, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(point, rings[i])) return false;
  }
  return true;
}

function pointInRing(point: [number, number], ring: [number, number][]) {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-12) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function distanceToPolygonEdges(point: [number, number], rings: [number, number][][]) {
  let best = Infinity;
  for (const ring of rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      const d = distancePointToSegment(point, a, b);
      if (d < best) best = d;
    }
  }
  return best;
}

function distancePointToSegment(point: [number, number], a: [number, number], b: [number, number]) {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const wx = point[0] - a[0];
  const wy = point[1] - a[1];
  const vv = vx * vx + vy * vy;
  if (vv < 1e-12) return Math.hypot(point[0] - a[0], point[1] - a[1]);
  const t = clamp((wx * vx + wy * vy) / vv, 0, 1);
  const px = a[0] + vx * t;
  const py = a[1] + vy * t;
  return Math.hypot(point[0] - px, point[1] - py);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
