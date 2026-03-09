/**
 * MapEngine — Unified barrel export for the map rendering system.
 *
 * Architecture:
 *
 *   MapEngine
 *   ├─ MapRenderer          (SVG rendering — viewBox-based camera)
 *   ├─ CameraController     (zoom, pan, bounds)
 *   ├─ ProvinceLayer        (province fill / interaction / overlay)
 *   ├─ LabelLayer           (screen-space dynamic labels)
 *   ├─ BorderRenderer       (country borders via CountryLayer)
 *   ├─ GeoDataLoader        (GeoJSON → NormalizedGeometry → SVG)
 *   └─ SpatialIndex         (quadtree frustum culling)
 *
 * Camera Model:
 *
 *   The camera tracks a center point (world coords) and zoom factor.
 *   The SVG viewBox is derived from the camera state — no CSS transform.
 *   This gives crisp vector rendering at every zoom level.
 *
 * Rendering Pipeline:
 *
 *   GeoJSON
 *     ↓
 *   Geometry validation (normalizeGeometry / processGeometry)
 *     ↓
 *   Projection conversion (projectPoint / normalizedGeometryToSvgPath)
 *     ↓
 *   Polygon clipping (subdivideGeometry — Sutherland-Hodgman)
 *     ↓
 *   SVG path strings
 *     ↓
 *   Rendering layers (TerrainLayer → CountryLayer → ProvinceLayer → LabelLayer)
 */

// ── Camera ──
export { CameraController } from './CameraController';
export type { CameraControllerConfig } from './CameraController';
export { DEFAULT_MAP_CAMERA, resetMapCamera, zoomMapCamera, panMapCamera, getMapCameraViewport, getDefaultMapSize } from './MapCamera';
export type { MapCameraState } from './MapCamera';

// ── Viewport / Coordinate transforms ──
export {
  MIN_ZOOM, MAX_ZOOM, clampZoom, clampCenter,
  getBaseMapTransform, screenToWorld, worldToScreen,
  cameraToViewBox, cameraToViewBoxString,
  computeViewportWorldBounds, computeZoomAroundPoint,
  boundsIntersectViewport, filterVisibleBounds,
  MAP_WORLD_WIDTH, MAP_WORLD_HEIGHT,
} from './mapViewport';
export type { WorldViewport, ScreenSize, ScreenPoint, CameraState, ViewBox, BoundsLike } from './mapViewport';

// ── Spatial index ──
export { buildBoundsQuadtree, queryBoundsQuadtree } from './spatialIndex';
export type { BoundsQuadtree } from './spatialIndex';

// ── Map context ──
export { MapProvider, useMapContext } from './MapContext';
