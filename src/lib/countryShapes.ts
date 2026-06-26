/**
 * Country polygons for the Geography Challenge.
 *
 * Decodes the Natural Earth country boundaries (`world-atlas` countries-110m,
 * ~108 KB TopoJSON, bundled so it works offline) into per-country GeoJSON
 * features, indexed by their numeric ISO id — the same id the board data in
 * `geography.ts` references. This file is only imported by the quiz map, so the
 * country topology never loads for ordinary lessons.
 */
import { geoCentroid, type GeoPermissibleObjects } from 'd3-geo';
import { feature } from 'topojson-client';
import countriesTopo from 'world-atlas/countries-110m.json';

export type CountryFeature = GeoPermissibleObjects & {
  id?: string | number;
  properties?: { name?: string };
};

let _byId: Map<string, CountryFeature> | null = null;

/** All country features, indexed by stringified numeric ISO id. Decoded once. */
export function countryFeaturesById(): Map<string, CountryFeature> {
  if (_byId) return _byId;
  const topo = countriesTopo as unknown as Parameters<typeof feature>[0];
  const fc = feature(topo, (topo as any).objects.countries) as unknown as {
    features: CountryFeature[];
  };
  const map = new Map<string, CountryFeature>();
  for (const f of fc.features) {
    if (f.id != null) map.set(String(f.id), f);
  }
  _byId = map;
  return map;
}

const _centroids = new Map<string, [number, number]>();

/** Cached `[lng, lat]` centroid for a country id, or null if we have no shape. */
export function countryCentroid(id: string): [number, number] | null {
  if (_centroids.has(id)) return _centroids.get(id)!;
  const f = countryFeaturesById().get(id);
  if (!f) return null;
  const c = geoCentroid(f) as [number, number];
  _centroids.set(id, c);
  return c;
}
