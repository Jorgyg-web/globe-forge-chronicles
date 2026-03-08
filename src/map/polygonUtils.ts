/**
 * Polygon math utilities for province subdivision.
 * 
 * Provides:
 * - Sutherland-Hodgman polygon clipping against axis-aligned rectangles
 * - Polygon area (shoelace formula)
 * - Polygon centroid
 * - Point-in-polygon test
 * - Bounding box computation
 */

export type Point = [number, number]; // [x, y] or [lng, lat]

/** Compute polygon area using the shoelace formula. Returns absolute area. */
export function polygonArea(ring: Point[]): number {
  if (ring.length < 3) return 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(area / 2);
}

/** Compute polygon centroid using the signed-area weighted formula. */
export function polygonCentroid(ring: Point[]): Point {
  if (ring.length === 0) return [0, 0];
  if (ring.length < 3) {
    const avgX = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const avgY = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    return [avgX, avgY];
  }
  let cx = 0, cy = 0, signedArea = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    cx += (ring[j][0] + ring[i][0]) * cross;
    cy += (ring[j][1] + ring[i][1]) * cross;
    signedArea += cross;
  }
  signedArea /= 2;
  if (Math.abs(signedArea) < 1e-10) {
    const avgX = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const avgY = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    return [avgX, avgY];
  }
  cx /= (6 * signedArea);
  cy /= (6 * signedArea);
  return [cx, cy];
}

/** Ray-casting point-in-polygon test. */
export function pointInPolygon(point: Point, ring: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    if ((ring[i][1] > point[1]) !== (ring[j][1] > point[1]) &&
      point[0] < (ring[j][0] - ring[i][0]) * (point[1] - ring[i][1]) / (ring[j][1] - ring[i][1]) + ring[i][0]) {
      inside = !inside;
    }
  }
  return inside;
}

/** Compute bounding box of a polygon ring. */
export function polygonBounds(ring: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Sutherland-Hodgman polygon clipping against an axis-aligned rectangle.
 * Clips the polygon against all 4 edges of the rectangle.
 */
export function clipPolygonToRect(
  polygon: Point[],
  minX: number, minY: number, maxX: number, maxY: number
): Point[] {
  if (polygon.length < 3) return [];

  let output: Point[] = polygon;

  // Clip against left edge (x >= minX)
  output = clipEdge(output, p => p[0] >= minX, (a, b) => {
    const t = (minX - a[0]) / (b[0] - a[0]);
    return [minX, a[1] + t * (b[1] - a[1])];
  });
  if (output.length < 3) return [];

  // Clip against right edge (x <= maxX)
  output = clipEdge(output, p => p[0] <= maxX, (a, b) => {
    const t = (maxX - a[0]) / (b[0] - a[0]);
    return [maxX, a[1] + t * (b[1] - a[1])];
  });
  if (output.length < 3) return [];

  // Clip against bottom edge (y >= minY)
  output = clipEdge(output, p => p[1] >= minY, (a, b) => {
    const t = (minY - a[1]) / (b[1] - a[1]);
    return [a[0] + t * (b[0] - a[0]), minY];
  });
  if (output.length < 3) return [];

  // Clip against top edge (y <= maxY)
  output = clipEdge(output, p => p[1] <= maxY, (a, b) => {
    const t = (maxY - a[1]) / (b[1] - a[1]);
    return [a[0] + t * (b[0] - a[0]), maxY];
  });

  return output.length >= 3 ? output : [];
}

/** Clip polygon against a single half-plane edge (Sutherland-Hodgman step). */
function clipEdge(
  polygon: Point[],
  isInside: (p: Point) => boolean,
  intersect: (a: Point, b: Point) => Point
): Point[] {
  if (polygon.length === 0) return [];
  const output: Point[] = [];

  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const currIn = isInside(current);
    const nextIn = isInside(next);

    if (currIn) {
      output.push(current);
      if (!nextIn) output.push(intersect(current, next));
    } else if (nextIn) {
      output.push(intersect(current, next));
    }
  }

  return output;
}

/**
 * Subdivide a polygon into grid cells using Sutherland-Hodgman clipping.
 * Returns an array of { row, col, polygon } for each non-empty cell.
 */
export function subdividePolygon(
  ring: Point[],
  rows: number,
  cols: number,
  bounds?: { minX: number; minY: number; maxX: number; maxY: number }
): { row: number; col: number; polygon: Point[] }[] {
  const b = bounds ?? polygonBounds(ring);
  const cellW = (b.maxX - b.minX) / cols;
  const cellH = (b.maxY - b.minY) / rows;
  const results: { row: number; col: number; polygon: Point[] }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cMinX = b.minX + c * cellW;
      const cMinY = b.minY + r * cellH;
      const cMaxX = cMinX + cellW;
      const cMaxY = cMinY + cellH;

      const clipped = clipPolygonToRect(ring, cMinX, cMinY, cMaxX, cMaxY);
      if (clipped.length >= 3 && polygonArea(clipped) > 1e-6) {
        results.push({ row: r, col: c, polygon: clipped });
      }
    }
  }

  return results;
}
