/**
 * GeoJSON to SVG projection utilities.
 * 
 * Converts geographic coordinates (longitude/latitude) into SVG coordinates
 * on an 800×450 viewBox using Mercator projection.
 * 
 * The projection is configured with padding and clamping to fit a world map
 * comfortably within the SVG canvas.
 */

export interface ProjectionConfig {
  viewWidth: number;
  viewHeight: number;
  paddingX: number;
  paddingY: number;
  // Geographic bounds to map from
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

const DEFAULT_CONFIG: ProjectionConfig = {
  viewWidth: 800,
  viewHeight: 450,
  paddingX: 20,
  paddingY: 20,
  minLng: -180,
  maxLng: 180,
  minLat: -60,
  maxLat: 85,
};

/**
 * Convert latitude to Mercator Y value.
 */
function latToMercatorY(lat: number): number {
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const radLat = (clampedLat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + radLat / 2));
}

/**
 * Project a [longitude, latitude] coordinate to [x, y] SVG pixel coordinates.
 */
export function projectPoint(
  lng: number,
  lat: number,
  config: ProjectionConfig = DEFAULT_CONFIG
): { x: number; y: number } {
  const { viewWidth, viewHeight, paddingX, paddingY, minLng, maxLng, minLat, maxLat } = config;

  const drawW = viewWidth - paddingX * 2;
  const drawH = viewHeight - paddingY * 2;

  // X: simple linear mapping from longitude
  const x = paddingX + ((lng - minLng) / (maxLng - minLng)) * drawW;

  // Y: Mercator projection
  const minMercY = latToMercatorY(minLat);
  const maxMercY = latToMercatorY(maxLat);
  const mercY = latToMercatorY(lat);

  // Invert Y because SVG Y grows downward
  const y = paddingY + (1 - (mercY - minMercY) / (maxMercY - minMercY)) * drawH;

  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

/**
 * Convert a ring of [lng, lat] coordinates into an SVG path `d` string.
 */
export function ringToSvgPath(
  ring: number[][],
  config: ProjectionConfig = DEFAULT_CONFIG
): string {
  if (ring.length === 0) return '';

  const parts: string[] = [];
  for (let i = 0; i < ring.length; i++) {
    const [lng, lat] = ring[i];
    const { x, y } = projectPoint(lng, lat, config);
    parts.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

/**
 * Convert a GeoJSON Polygon (array of rings) into SVG path(s).
 * Only uses the outer ring (index 0). Inner rings (holes) are ignored for simplicity.
 */
export function polygonToSvgPath(
  coordinates: number[][][],
  config: ProjectionConfig = DEFAULT_CONFIG
): string {
  if (coordinates.length === 0 || coordinates[0].length === 0) return '';
  return ringToSvgPath(coordinates[0], config);
}

/**
 * Convert a GeoJSON MultiPolygon into a combined SVG path.
 * Each sub-polygon becomes a separate subpath in the same `d` attribute.
 */
export function multiPolygonToSvgPath(
  coordinates: number[][][][],
  config: ProjectionConfig = DEFAULT_CONFIG
): string {
  return coordinates
    .map(polygon => polygonToSvgPath(polygon, config))
    .filter(p => p.length > 0)
    .join(' ');
}

/**
 * Get the default projection config for the 800×450 world map.
 */
export function getDefaultProjectionConfig(): ProjectionConfig {
  return { ...DEFAULT_CONFIG };
}
