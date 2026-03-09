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

export interface PanOffset {
  x: number;
  y: number;
}

export interface BoundsLike {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const MAP_WORLD_WIDTH = 800;
export const MAP_WORLD_HEIGHT = 450;

export function getBaseMapTransform(size: ScreenSize): { scale: number; offsetX: number; offsetY: number } {
  const safeWidth = Math.max(1, size.width);
  const safeHeight = Math.max(1, size.height);
  const scale = Math.min(safeWidth / MAP_WORLD_WIDTH, safeHeight / MAP_WORLD_HEIGHT);
  const offsetX = (safeWidth - MAP_WORLD_WIDTH * scale) / 2;
  const offsetY = (safeHeight - MAP_WORLD_HEIGHT * scale) / 2;

  return { scale, offsetX, offsetY };
}

export function clampZoom(zoom: number): number {
  return Math.min(6, Math.max(0.6, zoom));
}

export function computeViewportWorldBounds(
  zoom: number,
  pan: PanOffset,
  size: ScreenSize,
  padding = 24,
): WorldViewport {
  const safeWidth = Math.max(1, size.width);
  const safeHeight = Math.max(1, size.height);
  const paddedLeft = -padding;
  const paddedTop = -padding;
  const paddedRight = safeWidth + padding;
  const paddedBottom = safeHeight + padding;

  const topLeft = screenToWorld({ x: paddedLeft, y: paddedTop }, zoom, pan, size);
  const bottomRight = screenToWorld({ x: paddedRight, y: paddedBottom }, zoom, pan, size);

  const minX = Math.min(topLeft.x, bottomRight.x);
  const minY = Math.min(topLeft.y, bottomRight.y);
  const maxX = Math.max(topLeft.x, bottomRight.x);
  const maxY = Math.max(topLeft.y, bottomRight.y);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
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

export function computeZoomPanAroundPoint(
  currentZoom: number,
  nextZoomInput: number,
  pan: PanOffset,
  size: ScreenSize,
  anchor: ScreenPoint,
): { zoom: number; pan: PanOffset } {
  const zoom = clampZoom(nextZoomInput);
  if (size.width <= 0 || size.height <= 0) {
    return { zoom, pan };
  }

  const worldPoint = screenToWorld(anchor, currentZoom, pan, size);
  const screenPoint = worldToScreen(worldPoint, zoom, pan, size);

  return {
    zoom,
    pan: {
      x: pan.x + (anchor.x - screenPoint.x),
      y: pan.y + (anchor.y - screenPoint.y),
    },
  };
}

export function screenToWorld(
  point: ScreenPoint,
  zoom: number,
  pan: PanOffset,
  size: ScreenSize,
): ScreenPoint {
  const { scale, offsetX, offsetY } = getBaseMapTransform(size);
  return {
    x: ((point.x - pan.x) / zoom - offsetX) / scale,
    y: ((point.y - pan.y) / zoom - offsetY) / scale,
  };
}

export function worldToScreen(
  point: ScreenPoint,
  zoom: number,
  pan: PanOffset,
  size: ScreenSize,
): ScreenPoint {
  const { scale, offsetX, offsetY } = getBaseMapTransform(size);
  return {
    x: pan.x + (offsetX + point.x * scale) * zoom,
    y: pan.y + (offsetY + point.y * scale) * zoom,
  };
}
