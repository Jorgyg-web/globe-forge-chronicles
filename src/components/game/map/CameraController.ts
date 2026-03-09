/**
 * CameraController — Imperative camera abstraction for the map engine.
 *
 * Provides:
 * - Camera center (world coordinates) + zoom level
 * - World-bounds clamping
 * - Smooth zooming via easing helpers
 * - Configurable zoom limits
 * - Viewport computation
 * - Screen ↔ World coordinate transforms
 *
 * Designed for use outside React (e.g. in tests, scripting, or an
 * imperative rendering loop). Inside React, prefer the functional
 * helpers in MapCamera.ts with useState.
 */

import {
  MapCameraState,
  DEFAULT_MAP_CAMERA,
  zoomMapCamera,
  panMapCamera,
  getMapCameraViewport,
} from './MapCamera';
import {
  ScreenPoint,
  ScreenSize,
  WorldViewport,
  MIN_ZOOM,
  MAX_ZOOM,
  screenToWorld,
  worldToScreen,
} from './mapViewport';

export interface CameraControllerConfig {
  /** Minimum zoom level (default: MIN_ZOOM) */
  minZoom: number;
  /** Maximum zoom level (default: MAX_ZOOM) */
  maxZoom: number;
  /** Zoom factor per wheel tick */
  wheelZoomFactor: number;
  /** Zoom factor per button click */
  stepZoomFactor: number;
}

const DEFAULT_CONFIG: CameraControllerConfig = {
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  wheelZoomFactor: 1.15,
  stepZoomFactor: 1.2,
};

export class CameraController {
  private _state: MapCameraState;
  private _size: ScreenSize;
  private _config: CameraControllerConfig;

  constructor(
    size: ScreenSize,
    initialState: MapCameraState = DEFAULT_MAP_CAMERA,
    config: Partial<CameraControllerConfig> = {},
  ) {
    this._state = { ...initialState };
    this._size = size;
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  // ── Accessors ──

  get state(): MapCameraState {
    return this._state;
  }

  get zoom(): number {
    return this._state.zoom;
  }

  get centerX(): number {
    return this._state.centerX;
  }

  get centerY(): number {
    return this._state.centerY;
  }

  get size(): ScreenSize {
    return this._size;
  }

  get config(): Readonly<CameraControllerConfig> {
    return this._config;
  }

  // ── Mutations ──

  setSize(size: ScreenSize): MapCameraState {
    this._size = size;
    return this._state;
  }

  zoomTo(nextZoom: number, anchor: ScreenPoint): MapCameraState {
    this._state = zoomMapCamera(this._state, nextZoom, anchor, this._size);
    return this._state;
  }

  zoomByStep(factor: number): MapCameraState {
    const center: ScreenPoint = {
      x: this._size.width / 2,
      y: this._size.height / 2,
    };
    return this.zoomTo(this._state.zoom * factor, center);
  }

  zoomIn(): MapCameraState {
    return this.zoomByStep(this._config.stepZoomFactor);
  }

  zoomOut(): MapCameraState {
    return this.zoomByStep(1 / this._config.stepZoomFactor);
  }

  handleWheelZoom(deltaY: number, anchor: ScreenPoint): MapCameraState {
    const factor = deltaY < 0 ? this._config.wheelZoomFactor : 1 / this._config.wheelZoomFactor;
    return this.zoomTo(this._state.zoom * factor, anchor);
  }

  /**
   * Pan by a screen-pixel delta.
   */
  panBy(dx: number, dy: number): MapCameraState {
    this._state = panMapCamera(this._state, { x: dx, y: dy }, this._size);
    return this._state;
  }

  reset(): MapCameraState {
    this._state = { ...DEFAULT_MAP_CAMERA };
    return this._state;
  }

  setState(state: MapCameraState): void {
    this._state = { ...state };
  }

  // ── Read-only computations ──

  getViewport(): WorldViewport {
    return getMapCameraViewport(this._state, this._size);
  }

  screenToWorld(point: ScreenPoint): ScreenPoint {
    return screenToWorld(point, this._state, this._size);
  }

  worldToScreen(point: ScreenPoint): ScreenPoint {
    return worldToScreen(point, this._state, this._size);
  }

  get showProvinces(): boolean {
    return this._state.zoom >= 1.8;
  }

  get showDetails(): boolean {
    return this._state.zoom > 3;
  }

  get showProvinceBorders(): boolean {
    return this._state.zoom >= 1.5;
  }
}
