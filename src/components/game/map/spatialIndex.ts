import { BoundsLike, WorldViewport, boundsIntersectViewport } from './mapViewport';

interface QuadtreeNode<T extends BoundsLike> {
  bounds: BoundsLike;
  items: T[];
  children: QuadtreeNode<T>[] | null;
  depth: number;
}

const DEFAULT_MAX_ITEMS = 32;
const DEFAULT_MAX_DEPTH = 8;

function containsBounds(container: BoundsLike, item: BoundsLike): boolean {
  return (
    item.minX >= container.minX &&
    item.maxX <= container.maxX &&
    item.minY >= container.minY &&
    item.maxY <= container.maxY
  );
}

function createChildBounds(bounds: BoundsLike): BoundsLike[] {
  const midX = (bounds.minX + bounds.maxX) / 2;
  const midY = (bounds.minY + bounds.maxY) / 2;

  return [
    { minX: bounds.minX, minY: bounds.minY, maxX: midX, maxY: midY },
    { minX: midX, minY: bounds.minY, maxX: bounds.maxX, maxY: midY },
    { minX: bounds.minX, minY: midY, maxX: midX, maxY: bounds.maxY },
    { minX: midX, minY: midY, maxX: bounds.maxX, maxY: bounds.maxY },
  ];
}

function computeRootBounds<T extends BoundsLike>(items: T[]): BoundsLike {
  if (items.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 450 };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const item of items) {
    minX = Math.min(minX, item.minX);
    minY = Math.min(minY, item.minY);
    maxX = Math.max(maxX, item.maxX);
    maxY = Math.max(maxY, item.maxY);
  }

  return { minX, minY, maxX, maxY };
}

function insertIntoNode<T extends BoundsLike>(
  node: QuadtreeNode<T>,
  item: T,
  maxItems: number,
  maxDepth: number,
): void {
  if (node.children) {
    for (const child of node.children) {
      if (containsBounds(child.bounds, item)) {
        insertIntoNode(child, item, maxItems, maxDepth);
        return;
      }
    }
  }

  node.items.push(item);

  if (!node.children && node.items.length > maxItems && node.depth < maxDepth) {
    node.children = createChildBounds(node.bounds).map(bounds => ({
      bounds,
      items: [],
      children: null,
      depth: node.depth + 1,
    }));

    const retainedItems: T[] = [];
    for (const existingItem of node.items) {
      const child = node.children.find(candidate => containsBounds(candidate.bounds, existingItem));
      if (child) {
        insertIntoNode(child, existingItem, maxItems, maxDepth);
      } else {
        retainedItems.push(existingItem);
      }
    }
    node.items = retainedItems;
  }
}

export interface BoundsQuadtree<T extends BoundsLike> {
  root: QuadtreeNode<T>;
}

export function buildBoundsQuadtree<T extends BoundsLike>(
  items: T[],
  maxItems = DEFAULT_MAX_ITEMS,
  maxDepth = DEFAULT_MAX_DEPTH,
): BoundsQuadtree<T> {
  const root: QuadtreeNode<T> = {
    bounds: computeRootBounds(items),
    items: [],
    children: null,
    depth: 0,
  };

  for (const item of items) {
    insertIntoNode(root, item, maxItems, maxDepth);
  }

  return { root };
}

function queryNode<T extends BoundsLike>(node: QuadtreeNode<T>, viewport: WorldViewport, results: T[]): void {
  if (!boundsIntersectViewport(node.bounds, viewport)) {
    return;
  }

  for (const item of node.items) {
    if (boundsIntersectViewport(item, viewport)) {
      results.push(item);
    }
  }

  if (!node.children) return;

  for (const child of node.children) {
    queryNode(child, viewport, results);
  }
}

export function queryBoundsQuadtree<T extends BoundsLike>(tree: BoundsQuadtree<T>, viewport: WorldViewport): T[] {
  const results: T[] = [];
  queryNode(tree.root, viewport, results);
  return results;
}
