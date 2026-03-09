/**
 * Polygon subdivision via Sutherland-Hodgman clipping.
 *
 * Subdivides a NormalizedGeometry into grid cells by clipping each polygon
 * ring to rectangular geographic regions. Used to generate synthetic provinces
 * for countries that lack admin-1 subdivision data.
 */

import {
  NormalizedGeometry,
  NormalizedPolygon,
  GeoRing,
  GeoPoint,
  geometryCentroid,
  signedRingArea,
} from './geometryValidator';

// ─── Sutherland-Hodgman polygon clipping ─────────────────────────────

type Pt = [number, number];

/**
 * Clip a closed polygon (vertex list WITHOUT duplicate closing vertex)
 * against one half-plane edge.
 */
function clipAgainstEdge(
  polygon: Pt[],
  isInside: (p: Pt) => boolean,
  intersect: (from: Pt, to: Pt) => Pt,
): Pt[] {
  const output: Pt[] = [];
  const n = polygon.length;
  if (n === 0) return output;

  for (let i = 0; i < n; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % n];
    const currIn = isInside(current);
    const nextIn = isInside(next);

    if (currIn && nextIn) {
      output.push(next);
    } else if (currIn && !nextIn) {
      output.push(intersect(current, next));
    } else if (!currIn && nextIn) {
      output.push(intersect(current, next));
      output.push(next);
    }
    // both outside → nothing
  }

  return output;
}

function intersectX(from: Pt, to: Pt, x: number): Pt {
  if (Math.abs(to[0] - from[0]) < 1e-12) return [x, from[1]];
  const t = (x - from[0]) / (to[0] - from[0]);
  return [x, from[1] + t * (to[1] - from[1])];
}

function intersectY(from: Pt, to: Pt, y: number): Pt {
  if (Math.abs(to[1] - from[1]) < 1e-12) return [from[0], y];
  const t = (y - from[1]) / (to[1] - from[1]);
  return [from[0] + t * (to[0] - from[0]), y];
}

/**
 * Clip an open polygon ring to a geographic rectangle via Sutherland-Hodgman.
 *
 * @param ring  Array of [lng, lat] WITHOUT closing-vertex duplicate.
 * @returns     Clipped open polygon, or empty if nothing remains.
 */
export function clipRingToRect(
  ring: Pt[],
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Pt[] {
  let r = ring;
  r = clipAgainstEdge(r, p => p[0] >= minX, (a, b) => intersectX(a, b, minX));
  if (r.length < 3) return [];
  r = clipAgainstEdge(r, p => p[0] <= maxX, (a, b) => intersectX(a, b, maxX));
  if (r.length < 3) return [];
  r = clipAgainstEdge(r, p => p[1] >= minY, (a, b) => intersectY(a, b, minY));
  if (r.length < 3) return [];
  r = clipAgainstEdge(r, p => p[1] <= maxY, (a, b) => intersectY(a, b, maxY));
  if (r.length < 3) return [];
  return r;
}

// ─── Geometry subdivision ────────────────────────────────────────────

function geoBounds(geometry: NormalizedGeometry) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const polygon of geometry.polygons) {
    for (const pt of polygon.outer) {
      minLng = Math.min(minLng, pt[0]);
      maxLng = Math.max(maxLng, pt[0]);
      minLat = Math.min(minLat, pt[1]);
      maxLat = Math.max(maxLat, pt[1]);
    }
  }
  return { minLng, minLat, maxLng, maxLat };
}

function polygonBounds(polygon: NormalizedPolygon) {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const pt of polygon.outer) {
    minLng = Math.min(minLng, pt[0]);
    maxLng = Math.max(maxLng, pt[0]);
    minLat = Math.min(minLat, pt[1]);
    maxLat = Math.max(maxLat, pt[1]);
  }
  return { minLng, minLat, maxLng, maxLat };
}

/**
 * Determine how many provinces a country should have based on the area
 * of its **largest** polygon (mainland). This avoids inflated counts from
 * distant overseas territories.
 */
export function computeTargetProvinces(geometry: NormalizedGeometry): number {
  // normalizeGeometry sorts polygons by area (largest first)
  const largest = geometry.polygons[0];
  if (!largest) return 1;
  const b = polygonBounds(largest);
  const w = b.maxLng - b.minLng;
  const h = b.maxLat - b.minLat;
  const area = w * h;
  if (area < 4) return 1; // very small — keep single province
  return Math.max(2, Math.min(12, Math.ceil(Math.sqrt(area))));
}

export interface SubdivisionCell {
  geometry: NormalizedGeometry;
  row: number;
  col: number;
  centroid: { lng: number; lat: number };
}

/**
 * Subdivide a normalized geometry into provinces.
 *
 * Strategy for MultiPolygon countries (e.g. France, Indonesia, USA):
 *   1. The **largest** polygon (mainland) is subdivided via a grid fitted
 *      to its own bounding box.
 *   2. Each remaining polygon (overseas territory / island) becomes its
 *      own province cell.
 *
 * This avoids the problem where distant overseas territories inflate the
 * bounding box and cause most grid cells to be empty ocean.
 */
export function subdivideGeometry(
  geometry: NormalizedGeometry,
  targetCount: number,
): SubdivisionCell[] {
  if (targetCount <= 1 || geometry.polygons.length === 0) {
    return [{ geometry, row: 0, col: 0, centroid: geometryCentroid(geometry) }];
  }

  // normalizeGeometry sorts polygons by area (largest first)
  const largest = geometry.polygons[0];
  const remaining = geometry.polygons.slice(1);

  // Only count "significant" overseas territories against the mainland budget.
  // Tiny islands (< 1.0 sq degree) are grouped together or skipped.
  // The mainland always gets at least half the target count.
  const significantRemaining = remaining.filter(p => Math.abs(signedRingArea(p.outer)) > 1.0);
  const mainlandTarget = Math.max(
    Math.ceil(targetCount / 2),
    targetCount - significantRemaining.length,
  );

  // ── Subdivide the largest polygon via grid clipping ──
  const mainlandCells = subdividePolygon(largest, mainlandTarget);

  // ── Each remaining polygon becomes its own cell (skip very tiny ones) ──
  const results: SubdivisionCell[] = [...mainlandCells];
  let nextRow = mainlandCells.length > 0
    ? Math.max(...mainlandCells.map(c => c.row)) + 1
    : 0;

  for (const polygon of remaining) {
    const area = Math.abs(signedRingArea(polygon.outer));
    if (area < 0.05) continue; // skip tiny island slivers
    const geo: NormalizedGeometry = { type: 'Polygon', polygons: [polygon] };
    results.push({
      geometry: geo,
      row: nextRow,
      col: 0,
      centroid: geometryCentroid(geo),
    });
    nextRow++;
  }

  // Fallback
  if (results.length === 0) {
    return [{ geometry, row: 0, col: 0, centroid: geometryCentroid(geometry) }];
  }

  return results;
}

/**
 * Subdivide a single polygon into grid cells via Sutherland-Hodgman clipping.
 */
function subdividePolygon(
  polygon: NormalizedPolygon,
  targetCount: number,
): SubdivisionCell[] {
  const bounds = polygonBounds(polygon);
  const w = bounds.maxLng - bounds.minLng;
  const h = bounds.maxLat - bounds.minLat;

  if (w < 0.5 || h < 0.5 || targetCount <= 1) {
    const geo: NormalizedGeometry = { type: 'Polygon', polygons: [polygon] };
    return [{ geometry: geo, row: 0, col: 0, centroid: geometryCentroid(geo) }];
  }

  // Grid dimensions preserving aspect ratio
  const aspect = Math.max(0.1, w / h);
  const cols = Math.max(1, Math.round(Math.sqrt(targetCount * aspect)));
  const rows = Math.max(1, Math.round(targetCount / cols));

  const cellW = w / cols;
  const cellH = h / rows;
  const results: SubdivisionCell[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cMinLng = bounds.minLng + col * cellW;
      const cMaxLng = bounds.minLng + (col + 1) * cellW;
      const cMinLat = bounds.minLat + row * cellH;
      const cMaxLat = bounds.minLat + (row + 1) * cellH;

      // Strip closing vertex for Sutherland-Hodgman
      const openOuter = polygon.outer.slice(0, -1) as Pt[];
      const clipped = clipRingToRect(openOuter, cMinLng, cMinLat, cMaxLng, cMaxLat);

      if (clipped.length >= 3) {
        // Re-close ring
        const ring: GeoRing = [
          ...clipped.map(p => [p[0], p[1]] as GeoPoint),
          [clipped[0][0], clipped[0][1]] as GeoPoint,
        ];

        // Skip degenerate slivers
        if (Math.abs(signedRingArea(ring)) < 0.01) continue;

        // Clip holes too
        const holes: GeoRing[] = [];
        for (const hole of polygon.holes) {
          const openHole = hole.slice(0, -1) as Pt[];
          const clippedHole = clipRingToRect(openHole, cMinLng, cMinLat, cMaxLng, cMaxLat);
          if (clippedHole.length >= 3) {
            holes.push([
              ...clippedHole.map(p => [p[0], p[1]] as GeoPoint),
              [clippedHole[0][0], clippedHole[0][1]] as GeoPoint,
            ]);
          }
        }

        const clippedPolygons: NormalizedPolygon[] = [{ outer: ring, holes }];
        const geo: NormalizedGeometry = { type: 'Polygon', polygons: clippedPolygons };
        results.push({ geometry: geo, row, col, centroid: geometryCentroid(geo) });
      }
    }
  }

  if (results.length === 0) {
    const geo: NormalizedGeometry = { type: 'Polygon', polygons: [polygon] };
    return [{ geometry: geo, row: 0, col: 0, centroid: geometryCentroid(geo) }];
  }

  return results;
}

// ─── Province naming ─────────────────────────────────────────────────

const ROMAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
];

/**
 * Generate a human-readable name for a synthetic province cell.
 */
export function getRegionName(index: number, total: number, countryName: string): string {
  if (total <= 1) return countryName;
  const numeral = index < ROMAN.length ? ROMAN[index] : `${index + 1}`;
  return `${countryName} ${numeral}`;
}
