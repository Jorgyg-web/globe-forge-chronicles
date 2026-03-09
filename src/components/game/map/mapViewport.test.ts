import { describe, expect, it } from 'vitest';
import {
  boundsIntersectViewport,
  CameraState,
  clampZoom,
  computeViewportWorldBounds,
  computeZoomAroundPoint,
  filterVisibleBounds,
  getBaseMapTransform,
  MAP_WORLD_HEIGHT,
  MAP_WORLD_WIDTH,
  screenToWorld,
  worldToScreen,
  cameraToViewBox,
} from './mapViewport';

/** Helper to create a camera centered on the map at a given zoom. */
function cam(zoom = 1, cx = MAP_WORLD_WIDTH / 2, cy = MAP_WORLD_HEIGHT / 2): CameraState {
  return { centerX: cx, centerY: cy, zoom };
}

describe('mapViewport helpers', () => {
  it('clamps zoom to supported range', () => {
    expect(clampZoom(0.1)).toBe(0.8);
    expect(clampZoom(3)).toBe(3);
    expect(clampZoom(60)).toBe(50);
  });

  it('computes viewBox from camera state', () => {
    const vb = cameraToViewBox(cam(2));
    expect(vb.w).toBe(400);
    expect(vb.h).toBe(225);
    expect(vb.x).toBeCloseTo(200);
    expect(vb.y).toBeCloseTo(112.5);
  });

  it('computes visible world viewport from camera', () => {
    const viewport = computeViewportWorldBounds(cam(2), { width: 800, height: 450 }, 0);
    // At zoom=2 centered on 400,225: viewBox is 200,112.5 → 600,337.5
    expect(viewport.minX).toBeCloseTo(200);
    expect(viewport.minY).toBeCloseTo(112.5);
    expect(viewport.maxX).toBeCloseTo(600);
    expect(viewport.maxY).toBeCloseTo(337.5);
  });

  it('detects intersection against the viewport', () => {
    const viewport = { minX: 100, minY: 100, maxX: 200, maxY: 200, width: 100, height: 100 };

    expect(boundsIntersectViewport({ minX: 120, minY: 120, maxX: 180, maxY: 180 }, viewport)).toBe(true);
    expect(boundsIntersectViewport({ minX: 201, minY: 120, maxX: 260, maxY: 180 }, viewport)).toBe(false);
  });

  it('filters only visible bounds', () => {
    const viewport = { minX: 100, minY: 100, maxX: 200, maxY: 200, width: 100, height: 100 };
    const items = [
      { id: 'inside', minX: 120, minY: 120, maxX: 180, maxY: 180 },
      { id: 'outside', minX: 220, minY: 220, maxX: 260, maxY: 260 },
      { id: 'overlap', minX: 180, minY: 180, maxX: 240, maxY: 240 },
    ];

    expect(filterVisibleBounds(items, viewport).map(item => item.id)).toEqual(['inside', 'overlap']);
  });

  it('keeps the anchor world position stable while zooming', () => {
    // Container matches the map aspect ratio exactly: 800×450.
    const size = { width: 800, height: 450 };
    const camera = cam(1);
    const anchor = { x: 400, y: 225 }; // screen center

    const result = computeZoomAroundPoint(camera, 2, anchor, size);

    expect(result.zoom).toBe(2);
    // Anchor at screen center → center stays the same
    expect(result.centerX).toBeCloseTo(400);
    expect(result.centerY).toBeCloseTo(225);
  });

  it('accounts for aspect-fit offsets when converting coordinates', () => {
    const size = { width: 1000, height: 1000 };
    const base = getBaseMapTransform(size);

    expect(base.scale).toBeCloseTo(1.25);
    expect(base.offsetX).toBeCloseTo(0);
    expect(base.offsetY).toBeCloseTo(218.75);

    const camera = cam(1);
    const world = screenToWorld({ x: 500, y: 500 }, camera, size);
    const screen = worldToScreen(world, camera, size);

    expect(world.x).toBeCloseTo(400);
    expect(world.y).toBeCloseTo(225);
    expect(screen.x).toBeCloseTo(500);
    expect(screen.y).toBeCloseTo(500);
  });

  it('computes viewport bounds correctly with letterboxing', () => {
    const viewport = computeViewportWorldBounds(cam(1), { width: 1000, height: 1000 }, 0);

    expect(viewport.minX).toBeCloseTo(0);
    expect(viewport.maxX).toBeCloseTo(MAP_WORLD_WIDTH);
    // Letterboxing extends the visible world range above and below
    expect(viewport.minY).toBeCloseTo(-175);
    expect(viewport.maxY).toBeCloseTo(625);
  });
});
