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

export function geometryCentroid(geometry: NormalizedGeometry): { lng: number; lat: number } {
  let weightedLng = 0;
  let weightedLat = 0;
  let totalWeight = 0;

  for (const polygon of geometry.polygons) {
    const area = Math.max(1e-6, Math.abs(signedRingArea(polygon.outer)));
    let lngSum = 0;
    let latSum = 0;
    for (const point of polygon.outer) {
      lngSum += point[0];
      latSum += point[1];
    }
    const count = polygon.outer.length;
    weightedLng += (lngSum / count) * area;
    weightedLat += (latSum / count) * area;
    totalWeight += area;
  }

  if (totalWeight === 0) return { lng: 0, lat: 0 };
  return {
    lng: weightedLng / totalWeight,
    lat: weightedLat / totalWeight,
  };
}
