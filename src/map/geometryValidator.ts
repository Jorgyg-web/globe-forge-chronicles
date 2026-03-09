import { GeoJSONGeometry, GeoJSONMultiPolygon, GeoJSONPolygon } from './geoTypes';

export type GeoPoint = [number, number];
export type GeoRing = GeoPoint[];

export interface NormalizedPolygon {
  outer: GeoRing;
  holes: GeoRing[];
}

export interface NormalizedGeometry {
  type: 'Polygon' | 'MultiPolygon';
  polygons: NormalizedPolygon[];
}

function isFinitePoint(point: unknown): point is GeoPoint {
  return Array.isArray(point)
    && point.length >= 2
    && Number.isFinite(point[0])
    && Number.isFinite(point[1]);
}

function pointsEqual(a: GeoPoint, b: GeoPoint): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

export function signedRingArea(ring: GeoRing): number {
  if (ring.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

export function normalizeRing(ring: unknown): GeoRing | null {
  if (!Array.isArray(ring)) return null;

  const cleaned: GeoRing = [];
  for (const point of ring) {
    if (!isFinitePoint(point)) continue;
    const normalizedPoint: GeoPoint = [point[0], point[1]];
    if (cleaned.length === 0 || !pointsEqual(cleaned[cleaned.length - 1], normalizedPoint)) {
      cleaned.push(normalizedPoint);
    }
  }

  if (cleaned.length < 3) return null;

  if (!pointsEqual(cleaned[0], cleaned[cleaned.length - 1])) {
    cleaned.push([cleaned[0][0], cleaned[0][1]]);
  }

  if (cleaned.length < 4) return null;
  return cleaned;
}

export function ensureRingWinding(ring: GeoRing, clockwise: boolean): GeoRing {
  const isClockwise = signedRingArea(ring) < 0;
  if (isClockwise === clockwise) return ring;
  const reversed = [...ring].reverse();
  if (!pointsEqual(reversed[0], reversed[reversed.length - 1])) {
    reversed.push([reversed[0][0], reversed[0][1]]);
  }
  return reversed;
}

export function normalizePolygonCoordinates(coordinates: unknown): NormalizedPolygon | null {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return null;

  const rings = coordinates
    .map(normalizeRing)
    .filter((ring): ring is GeoRing => !!ring);

  if (rings.length === 0) return null;

  const outer = ensureRingWinding(rings[0], false);
  const holes = rings.slice(1).map(ring => ensureRingWinding(ring, true));

  return { outer, holes };
}

export function normalizeGeometry(geometry: GeoJSONGeometry | null | undefined): NormalizedGeometry | null {
  if (!geometry) return null;

  if (geometry.type === 'Polygon') {
    const polygon = normalizePolygonCoordinates((geometry as GeoJSONPolygon).coordinates);
    if (!polygon) return null;
    return { type: 'Polygon', polygons: [polygon] };
  }

  if (geometry.type === 'MultiPolygon') {
    const polygons = (geometry as GeoJSONMultiPolygon).coordinates
      .map(normalizePolygonCoordinates)
      .filter((polygon): polygon is NormalizedPolygon => !!polygon)
      .sort((a, b) => Math.abs(signedRingArea(b.outer)) - Math.abs(signedRingArea(a.outer)));

    if (polygons.length === 0) return null;
    return { type: 'MultiPolygon', polygons };
  }

  return null;
}

/**
 * Proper polygon centroid using the signed-area formula.
 */
export function ringCentroid(ring: GeoRing): { lng: number; lat: number } | null {
  const n = ring.length - 1; // exclude closing vertex
  if (n < 3) return null;

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < n; i++) {
    const x0 = ring[i][0];
    const y0 = ring[i][1];
    const x1 = ring[(i + 1) % n][0];
    const y1 = ring[(i + 1) % n][1];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }

  area /= 2;
  if (Math.abs(area) < 1e-10) return null;

  cx /= 6 * area;
  cy /= 6 * area;
  return { lng: cx, lat: cy };
}

export function geometryCentroid(geometry: NormalizedGeometry): { lng: number; lat: number } {
  let weightedLng = 0;
  let weightedLat = 0;
  let totalWeight = 0;

  for (const polygon of geometry.polygons) {
    const area = Math.max(1e-6, Math.abs(signedRingArea(polygon.outer)));
    const c = ringCentroid(polygon.outer);
    if (c) {
      weightedLng += c.lng * area;
      weightedLat += c.lat * area;
    } else {
      let lngSum = 0;
      let latSum = 0;
      for (const point of polygon.outer) {
        lngSum += point[0];
        latSum += point[1];
      }
      const count = polygon.outer.length;
      weightedLng += (lngSum / count) * area;
      weightedLat += (latSum / count) * area;
    }
    totalWeight += area;
  }

  if (totalWeight === 0) return { lng: 0, lat: 0 };
  return {
    lng: weightedLng / totalWeight,
    lat: weightedLat / totalWeight,
  };
}

/**
 * Centroid of the largest polygon fragment.
 * For multipolygon countries this gives the mainland centroid,
 * avoiding skew from distant overseas territories.
 */
export function largestPolygonCentroid(geometry: NormalizedGeometry): { lng: number; lat: number } {
  // normalizeGeometry sorts polygons by area (largest first)
  const largest = geometry.polygons[0];
  if (!largest) return { lng: 0, lat: 0 };

  const c = ringCentroid(largest.outer);
  if (c) return c;

  // Vertex-average fallback
  const count = largest.outer.length - 1;
  let lngSum = 0;
  let latSum = 0;
  for (let i = 0; i < count; i++) {
    lngSum += largest.outer[i][0];
    latSum += largest.outer[i][1];
  }
  return { lng: lngSum / count, lat: latSum / count };
}

// ─── Geometry validation and stability ────────────────────────────────

/**
 * Return true if two segments (a1→a2) and (b1→b2) cross each other
 * (proper intersection, not just touching at endpoints).
 */
function segmentsCross(a1: GeoPoint, a2: GeoPoint, b1: GeoPoint, b2: GeoPoint): boolean {
  const d = (b2[0] - b1[0]) * (a2[1] - a1[1]) - (b2[1] - b1[1]) * (a2[0] - a1[0]);
  if (Math.abs(d) < 1e-12) return false;
  const ua = ((b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0])) / d;
  const ub = ((a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0])) / d;
  return ua > 0 && ua < 1 && ub > 0 && ub < 1;
}

/**
 * Check if a ring has any self-intersections.
 * Uses brute-force pairwise check (fast enough for typical GeoJSON rings < 500 pts).
 */
export function ringSelfIntersects(ring: GeoRing): boolean {
  const n = ring.length - 1; // exclude closing vertex
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // adjacent segments share a vertex
      if (segmentsCross(ring[i], ring[i + 1], ring[j], ring[j + 1])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Remove consecutive duplicate vertices and near-degenerate spikes from a ring.
 * Returns a cleaned copy.
 */
export function cleanRing(ring: GeoRing, epsilon = 1e-8): GeoRing {
  if (ring.length < 4) return ring;
  const cleaned: GeoRing = [ring[0]];
  for (let i = 1; i < ring.length - 1; i++) {
    const prev = cleaned[cleaned.length - 1];
    const curr = ring[i];
    const dx = curr[0] - prev[0];
    const dy = curr[1] - prev[1];
    if (Math.abs(dx) > epsilon || Math.abs(dy) > epsilon) {
      cleaned.push(curr);
    }
  }
  // Re-close
  if (cleaned.length >= 3) {
    cleaned.push([cleaned[0][0], cleaned[0][1]]);
  }
  return cleaned.length >= 4 ? cleaned : ring;
}

export interface GeometryValidation {
  valid: boolean;
  polygonCount: number;
  totalVertices: number;
  selfIntersections: number;
  degenerateRings: number;
}

/**
 * Validate a NormalizedGeometry and return diagnostics.
 */
export function validateGeometry(geometry: NormalizedGeometry): GeometryValidation {
  let totalVertices = 0;
  let selfIntersections = 0;
  let degenerateRings = 0;

  for (const polygon of geometry.polygons) {
    totalVertices += polygon.outer.length;
    if (polygon.outer.length < 4) degenerateRings++;
    if (Math.abs(signedRingArea(polygon.outer)) < 1e-10) degenerateRings++;
    if (ringSelfIntersects(polygon.outer)) selfIntersections++;

    for (const hole of polygon.holes) {
      totalVertices += hole.length;
      if (hole.length < 4) degenerateRings++;
      if (ringSelfIntersects(hole)) selfIntersections++;
    }
  }

  return {
    valid: selfIntersections === 0 && degenerateRings === 0 && geometry.polygons.length > 0,
    polygonCount: geometry.polygons.length,
    totalVertices,
    selfIntersections,
    degenerateRings,
  };
}

/**
 * Full geometry processing pipeline:
 * 1. Normalize raw GeoJSON geometry
 * 2. Validate and clean rings
 * 3. Return stable NormalizedGeometry or null
 */
export function processGeometry(raw: GeoJSONGeometry | null | undefined): NormalizedGeometry | null {
  const normalized = normalizeGeometry(raw);
  if (!normalized) return null;

  // Clean each polygon's rings
  const cleanedPolygons: NormalizedPolygon[] = [];
  for (const polygon of normalized.polygons) {
    const outer = cleanRing(polygon.outer);
    if (outer.length < 4) continue;
    if (Math.abs(signedRingArea(outer)) < 1e-10) continue;

    const holes = polygon.holes
      .map(h => cleanRing(h))
      .filter(h => h.length >= 4 && Math.abs(signedRingArea(h)) > 1e-10);

    cleanedPolygons.push({
      outer: ensureRingWinding(outer, false),
      holes: holes.map(h => ensureRingWinding(h, true)),
    });
  }

  if (cleanedPolygons.length === 0) return null;

  return {
    type: cleanedPolygons.length > 1 ? 'MultiPolygon' : 'Polygon',
    polygons: cleanedPolygons.sort((a, b) => Math.abs(signedRingArea(b.outer)) - Math.abs(signedRingArea(a.outer))),
  };
}
