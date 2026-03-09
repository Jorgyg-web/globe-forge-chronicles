import { describe, expect, it } from 'vitest';
import { buildBoundsQuadtree, queryBoundsQuadtree } from './spatialIndex';

describe('spatialIndex', () => {
  it('returns only items inside or intersecting the viewport', () => {
    const items = [
      { id: 'a', minX: 0, minY: 0, maxX: 10, maxY: 10 },
      { id: 'b', minX: 50, minY: 50, maxX: 60, maxY: 60 },
      { id: 'c', minX: 90, minY: 90, maxX: 120, maxY: 120 },
    ];

    const tree = buildBoundsQuadtree(items, 1, 4);
    const visible = queryBoundsQuadtree(tree, {
      minX: 40,
      minY: 40,
      maxX: 100,
      maxY: 100,
      width: 60,
      height: 60,
    });

    expect(visible.map(item => item.id).sort()).toEqual(['b', 'c']);
  });
});
