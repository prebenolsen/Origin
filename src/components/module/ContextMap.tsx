import { lazy, Suspense } from 'react';
import type { ContextMapData, ContextMarker } from '../../types/content';
import SchematicMap from './SchematicMap';

// The geo renderer pulls in d3-geo + the land geometry; load it only when a
// module actually has real coordinates so concept maps stay lightweight.
const GeoMap = lazy(() => import('./GeoMap'));

/** A marker is geographic only if it has finite real-world coordinates. */
function isGeoMarker(m: ContextMarker): boolean {
  return (
    typeof m.lat === 'number' &&
    typeof m.lng === 'number' &&
    Number.isFinite(m.lat) &&
    Number.isFinite(m.lng)
  );
}

/**
 * Context map dispatcher.
 *
 * - If every marker carries real `lat`/`lng`, render a true cartographic map
 *   (`GeoMap`) with actual coastlines and correct positions.
 * - Otherwise render an honest abstract concept diagram (`SchematicMap`) —
 *   never a fake-continent world map.
 *
 * See the "Maps" section in CLAUDE.md for authoring guidance.
 */
export default function ContextMap({ data }: { data: ContextMapData }) {
  const isGeo = data.markers.length > 0 && data.markers.every(isGeoMarker);

  if (isGeo) {
    return (
      <Suspense
        fallback={
          <div className="aspect-[8/5] w-full animate-pulse rounded-2xl border border-line bg-ink-2" />
        }
      >
        <GeoMap data={data} />
      </Suspense>
    );
  }

  return <SchematicMap data={data} />;
}
