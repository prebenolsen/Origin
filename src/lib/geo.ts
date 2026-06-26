/**
 * Geographic helpers for the context map.
 *
 * Real coastlines come from `world-atlas` (Natural Earth, 50m resolution) as
 * TopoJSON, decoded once into a GeoJSON land silhouette. We project with
 * `d3-geo` so markers given as real `lat`/`lng` land in the correct place — no
 * fake blobs. The land file ships with the bundle, so the
 * map works offline.
 *
 * To reduce bundle size, swap the import back to `land-110m.json` — the rest of
 * the pipeline is resolution-agnostic.
 */
import {
  geoMercator,
  geoPath,
  geoGraticule10,
  type GeoProjection,
  type GeoGeometryObjects,
} from 'd3-geo';
import { feature } from 'topojson-client';
import landTopo from 'world-atlas/land-50m.json';

export interface LngLat {
  lng: number;
  lat: number;
}

/** Decoded once: the whole-world land silhouette as a GeoJSON geometry. */
let _land: GeoGeometryObjects | null = null;
export function landGeometry(): GeoGeometryObjects {
  if (!_land) {
    // topojson-client's types are intentionally loose about object keys.
    const topo = landTopo as unknown as Parameters<typeof feature>[0];
    _land = feature(topo, (topo as any).objects.land) as unknown as GeoGeometryObjects;
  }
  return _land;
}

/** A 10° graticule (lat/long grid) for the subtle "atlas" backdrop. */
export const graticule: GeoGeometryObjects = geoGraticule10();

/**
 * Build a Mercator projection framed *tightly* around the given markers (or an
 * explicit `focus` bounding box) so they spread out and fill the majority of the
 * canvas instead of clustering in the centre. We fit the markers' own bounding
 * box — not a heavily padded one — into an inner rectangle whose margins leave
 * room for the marker labels (which sit above/beside the dots).
 *
 * @param focus optional `[west, south, east, north]` in degrees.
 */
export function fitProjection(
  points: LngLat[],
  width: number,
  height: number,
  focus?: [number, number, number, number],
): GeoProjection {
  let west: number;
  let south: number;
  let east: number;
  let north: number;

  if (focus) {
    [west, south, east, north] = focus;
  } else if (points.length > 0) {
    const lons = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    west = Math.min(...lons);
    east = Math.max(...lons);
    south = Math.min(...lats);
    north = Math.max(...lats);
  } else {
    west = -160;
    east = 160;
    south = -55;
    north = 75;
  }

  // Guard against a degenerate span (a single marker, or markers sharing a
  // latitude/longitude): expand to a minimum so the fit doesn't zoom to street
  // level or divide by zero.
  const MIN_SPAN = 0.6;
  if (east - west < MIN_SPAN) {
    const c = (east + west) / 2;
    west = c - MIN_SPAN / 2;
    east = c + MIN_SPAN / 2;
  }
  if (north - south < MIN_SPAN) {
    const c = (north + south) / 2;
    south = c - MIN_SPAN / 2;
    north = c + MIN_SPAN / 2;
  }

  // A small relative breathing margin so the outermost dots aren't pinned right
  // on the frame edge — but small enough that the markers still dominate.
  const padX = (east - west) * 0.06;
  const padY = (north - south) * 0.06;
  west -= padX;
  east += padX;
  south -= padY;
  north += padY;

  // Clamp to projectable bounds (Mercator explodes near the poles).
  west = Math.max(west, -179);
  east = Math.min(east, 179);
  south = Math.max(south, -78);
  north = Math.min(north, 82);

  // Fit to the frame's CORNER POINTS (a MultiPoint), not a Polygon. A spherical
  // polygon's winding order decides which side is "inside"; an accidentally
  // clockwise ring makes d3-geo treat the interior as the entire rest of the
  // planet and zooms all the way out. Point bounds have no such ambiguity.
  const frame: GeoGeometryObjects = {
    type: 'MultiPoint',
    coordinates: [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
    ],
  };

  // Inner extent margins (in viewBox units). Top is larger because primary
  // markers carry a label above the dot; sides leave room for label width.
  const mX = 74;
  const mTop = 58;
  const mBottom = 46;
  const projection = geoMercator();
  projection.fitExtent(
    [
      [mX, mTop],
      [width - mX, height - mBottom],
    ],
    frame,
  );
  return projection;
}

/** Convenience: a path generator bound to a projection. */
export function pathFor(projection: GeoProjection) {
  return geoPath(projection);
}
