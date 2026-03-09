import { describe, expect, it } from 'vitest';
import {
  boundsIntersectViewport,
  clampZoom,
  computeViewportWorldBounds,
  computeZoomPanAroundPoint,
  filterVisibleBounds,
  getBaseMapTransform,
  MAP_WORLD_HEIGHT,
  MAP_WORLD_WIDTH,
  screenToWorld,
  worldToScreen,
} from './mapViewport';

describe('mapViewport helpers', () => {
  it('clamps zoom to supported range', () => {
    expect(clampZoom(0.1)).toBe(0.6);
    expect(clampZoom(3)).toBe(3);
    expect(clampZoom(9)).toBe(6);
  });

  it('computes visible world viewport from zoom and pan', () => {
    const viewport = computeViewportWorldBounds(2, { x: 0, y: 0 }, { width: 800, height: 450 }, 0);

    expect(viewport.minX).toBeCloseTo(0);
    expect(viewport.minY).toBeCloseTo(0);
    expect(viewport.maxX).toBe(MAP_WORLD_WIDTH / 2);
    expect(viewport.maxY).toBe(MAP_WORLD_HEIGHT / 2);
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
    const result = computeZoomPanAroundPoint(
      1,
      2,
      { x: 0, y: 0 },
      { width: 800, height: 450 },
      { x: 400, y: 225 },
    );

    expect(result.zoom).toBe(2);
    expect(result.pan.x).toBe(-400);
    expect(result.pan.y).toBe(-225);
  });

  it('accounts for aspect-fit offsets when converting coordinates', () => {
    const size = { width: 1000, height: 1000 };
    const base = getBaseMapTransform(size);

    expect(base.scale).toBeCloseTo(1.25);
    expect(base.offsetX).toBeCloseTo(0);
    expect(base.offsetY).toBeCloseTo(218.75);

    const world = screenToWorld({ x: 500, y: 500 }, 1, { x: 0, y: 0 }, size);
    const screen = worldToScreen(world, 1, { x: 0, y: 0 }, size);

    expect(world.x).toBeCloseTo(400);
    expect(world.y).toBeCloseTo(225);
    expect(screen.x).toBeCloseTo(500);
    expect(screen.y).toBeCloseTo(500);
  });

  it('computes viewport bounds correctly with letterboxing', () => {
    const viewport = computeViewportWorldBounds(1, { x: 0, y: 0 }, { width: 1000, height: 1000 }, 0);

    expect(viewport.minX).toBeCloseTo(0);
    expect(viewport.maxX).toBeCloseTo(MAP_WORLD_WIDTH);
    expect(viewport.minY).toBeCloseTo(-175);
    expect(viewport.maxY).toBeCloseTo(625);
  });
});
