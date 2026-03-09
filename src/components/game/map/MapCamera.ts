import { clampZoom, computeViewportWorldBounds, computeZoomPanAroundPoint, MAP_WORLD_HEIGHT, MAP_WORLD_WIDTH, PanOffset, ScreenPoint, ScreenSize, WorldViewport } from './mapViewport';

export interface MapCameraState {
  zoom: number;
  pan: PanOffset;
}

export const DEFAULT_MAP_CAMERA: MapCameraState = {
  zoom: 1,
  pan: { x: 0, y: 0 },
};

export function resetMapCamera(): MapCameraState {
  return DEFAULT_MAP_CAMERA;
}

export function zoomMapCamera(
  camera: MapCameraState,
  nextZoom: number,
  anchor: ScreenPoint,
  size: ScreenSize,
): MapCameraState {
  const nextView = computeZoomPanAroundPoint(camera.zoom, clampZoom(nextZoom), camera.pan, size, anchor);
  return {
    zoom: nextView.zoom,
    pan: nextView.pan,
  };
}

export function panMapCamera(camera: MapCameraState, nextPan: PanOffset): MapCameraState {
  return {
    zoom: camera.zoom,
    pan: nextPan,
  };
}

export function getMapCameraViewport(camera: MapCameraState, size: ScreenSize): WorldViewport {
  return computeViewportWorldBounds(camera.zoom, camera.pan, size);
}

export function getDefaultMapSize(): ScreenSize {
  return { width: MAP_WORLD_WIDTH, height: MAP_WORLD_HEIGHT };
}
