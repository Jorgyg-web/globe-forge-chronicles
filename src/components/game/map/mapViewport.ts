/**
 * Map Viewport — ViewBox-based camera system
 *
 * Camera model: center-point + zoom factor.
 * The camera center is in SVG world coordinates (0–800 x, 0–450 y).
 * Zoom 1 = see the full 800×450 map. Zoom 10 = see an 80×45 region.
 *
 * Rendering: the SVG `viewBox` is computed from the camera state.
 * No CSS transform is needed — the browser maps the viewBox to the
 * container element, producing crisp vector output at any zoom level.
 */

// ─── Public interfaces ─────────────────────────────────────────────

export interface WorldViewport {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface ScreenSize {
  width: number;
  height: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface BoundsLike {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// ─── Constants ─────────────────────────────────────────────────────

export const MAP_WORLD_WIDTH = 800;
export const MAP_WORLD_HEIGHT = 450;
export const MIN_ZOOM = 0.55;
export const MAX_ZOOM = 80;

// ─── Camera state ──────────────────────────────────────────────────

export interface CameraState {
  /** X coordinate of view center in world space (0–800) */
  centerX: number;
  /** Y coordinate of view center in world space (0–450) */
  centerY: number;
  /** Magnification factor. 1 = show full map, 50 = 50× magnification */
  zoom: number;
}

// ─── ViewBox computation ───────────────────────────────────────────

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Convert camera state to SVG viewBox parameters. */
export function cameraToViewBox(camera: CameraState): ViewBox {
  const w = MAP_WORLD_WIDTH / camera.zoom;
  const h = MAP_WORLD_HEIGHT / camera.zoom;
  return {
    x: camera.centerX - w / 2,
    y: camera.centerY - h / 2,
    w,
    h,
  };
}

/** Return the viewBox as a string for the SVG element. */
export function cameraToViewBoxString(camera: CameraState): string {
  const vb = cameraToViewBox(camera);
  return `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
}

// ─── Base map transform (container fitting) ────────────────────────

/**
 * Compute how the 800×450 world fits into the container.
 * Returns the uniform scale and letterbox offsets in screen pixels.
 * These values depend ONLY on container size — not on zoom.
 */
export function getBaseMapTransform(size: ScreenSize): { scale: number; offsetX: number; offsetY: number } {
  const safeWidth = Math.max(1, size.width);
  const safeHeight = Math.max(1, size.height);
  const scale = Math.min(safeWidth / MAP_WORLD_WIDTH, safeHeight / MAP_WORLD_HEIGHT);
  const offsetX = (safeWidth - MAP_WORLD_WIDTH * scale) / 2;
  const offsetY = (safeHeight - MAP_WORLD_HEIGHT * scale) / 2;
  return { scale, offsetX, offsetY };
}

// ─── Zoom / center clamping ────────────────────────────────────────

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Clamp the camera center so that at least 25% of the viewport overlaps
 * the map area (0–800 × 0–450).
 */
export function clampCenter(
  centerX: number,
  centerY: number,
  zoom: number,
): { centerX: number; centerY: number } {
  const halfW = MAP_WORLD_WIDTH / (2 * zoom);
  const halfH = MAP_WORLD_HEIGHT / (2 * zoom);
  // Allow 75% of the viewport to extend beyond the map edges.
  const marginX = halfW * 1.5;
  const marginY = halfH * 1.5;
  return {
    centerX: Math.max(-marginX + halfW, Math.min(MAP_WORLD_WIDTH + marginX - halfW, centerX)),
    centerY: Math.max(-marginY + halfH, Math.min(MAP_WORLD_HEIGHT + marginY - halfH, centerY)),
  };
}

// ─── Coordinate transforms ─────────────────────────────────────────

/**
 * Convert a world coordinate to a screen (pixel) coordinate.
 */
export function worldToScreen(
  point: ScreenPoint,
  camera: CameraState,
  containerSize: ScreenSize,
): ScreenPoint {
  const { scale, offsetX, offsetY } = getBaseMapTransform(containerSize);
  const vb = cameraToViewBox(camera);
  return {
    x: offsetX + (point.x - vb.x) * scale * camera.zoom,
    y: offsetY + (point.y - vb.y) * scale * camera.zoom,
  };
}

/**
 * Convert a screen (pixel) coordinate to a world coordinate.
 */
export function screenToWorld(
  point: ScreenPoint,
  camera: CameraState,
  containerSize: ScreenSize,
): ScreenPoint {
  const { scale, offsetX, offsetY } = getBaseMapTransform(containerSize);
  const vb = cameraToViewBox(camera);
  return {
    x: (point.x - offsetX) / (scale * camera.zoom) + vb.x,
    y: (point.y - offsetY) / (scale * camera.zoom) + vb.y,
  };
}

// ─── Camera operations ─────────────────────────────────────────────

/**
 * Compute the new camera state after zooming while keeping the world
 * point under `anchor` (screen position) fixed.
 */
export function computeZoomAroundPoint(
  camera: CameraState,
  newZoomRaw: number,
  anchor: ScreenPoint,
  containerSize: ScreenSize,
): CameraState {
  const newZoom = clampZoom(newZoomRaw);
  if (newZoom === camera.zoom) return camera;
  const anchorWorld = screenToWorld(anchor, camera, containerSize);
  const r = camera.zoom / newZoom;
  const rawCenterX = anchorWorld.x * (1 - r) + camera.centerX * r;
  const rawCenterY = anchorWorld.y * (1 - r) + camera.centerY * r;
  const clamped = clampCenter(rawCenterX, rawCenterY, newZoom);
  return { ...clamped, zoom: newZoom };
}

// ─── Viewport / frustum queries ────────────────────────────────────

/**
 * Compute the visible world-space bounding box for the current camera,
 * expanded by `padding` screen pixels on each side.
 */
export function computeViewportWorldBounds(
  camera: CameraState,
  containerSize: ScreenSize,
  padding = 24,
): WorldViewport {
  const topLeft = screenToWorld({ x: -padding, y: -padding }, camera, containerSize);
  const bottomRight = screenToWorld(
    { x: containerSize.width + padding, y: containerSize.height + padding },
    camera,
    containerSize,
  );
  return {
    minX: topLeft.x,
    minY: topLeft.y,
    maxX: bottomRight.x,
    maxY: bottomRight.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

export function boundsIntersectViewport(
  bounds: BoundsLike,
  viewport: WorldViewport,
): boolean {
  return !(
    bounds.maxX < viewport.minX ||
    bounds.minX > viewport.maxX ||
    bounds.maxY < viewport.minY ||
    bounds.minY > viewport.maxY
  );
}

export function filterVisibleBounds<T extends BoundsLike>(items: T[], viewport: WorldViewport): T[] {
  return items.filter(item => boundsIntersectViewport(item, viewport));
}
