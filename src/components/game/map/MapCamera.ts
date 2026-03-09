/**
 * Map Camera — State management for the center-based camera.
 *
 * The camera tracks a center point (world coordinates) and zoom factor.
 * All operations produce a new immutable camera state.
 */

import {
  CameraState,
  clampCenter,
  clampZoom,
  computeViewportWorldBounds,
  computeZoomAroundPoint,
  getBaseMapTransform,
  MAP_WORLD_HEIGHT,
  MAP_WORLD_WIDTH,
  ScreenPoint,
  ScreenSize,
  WorldViewport,
} from './mapViewport';

export type MapCameraState = CameraState;

export const DEFAULT_MAP_CAMERA: MapCameraState = {
  centerX: MAP_WORLD_WIDTH / 2,
  centerY: MAP_WORLD_HEIGHT / 2,
  zoom: 1,
};

export function resetMapCamera(): MapCameraState {
  return { ...DEFAULT_MAP_CAMERA };
}

/**
 * Zoom the camera toward a screen-space anchor point.
 */
export function zoomMapCamera(
  camera: MapCameraState,
  nextZoom: number,
  anchor: ScreenPoint,
  size: ScreenSize,
): MapCameraState {
  return computeZoomAroundPoint(camera, nextZoom, anchor, size);
}

/**
 * Pan by a screen-pixel delta.
 *
 * A positive delta.x (mouse dragged right) moves content right,
 * which means the camera center moves LEFT (decreasing centerX).
 */
export function panMapCamera(
  camera: MapCameraState,
  screenDelta: ScreenPoint,
  size: ScreenSize,
): MapCameraState {
  const { scale } = getBaseMapTransform(size);
  const worldDx = screenDelta.x / (scale * camera.zoom);
  const worldDy = screenDelta.y / (scale * camera.zoom);
  const clamped = clampCenter(
    camera.centerX - worldDx,
    camera.centerY - worldDy,
    camera.zoom,
  );
  return { ...clamped, zoom: camera.zoom };
}

export function getMapCameraViewport(camera: MapCameraState, size: ScreenSize): WorldViewport {
  return computeViewportWorldBounds(camera, size);
}

export function getDefaultMapSize(): ScreenSize {
  return { width: MAP_WORLD_WIDTH, height: MAP_WORLD_HEIGHT };
}
