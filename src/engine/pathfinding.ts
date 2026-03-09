import { Province, ProvinceId, TERRAIN_MOVEMENT_COST } from '@/types/game';

function getNeighbors(province: Province): ProvinceId[] {
  const legacy = (province as Province & { neighbors?: ProvinceId[] }).neighbors ?? [];
  return province.adjacentProvinces?.length ? province.adjacentProvinces : legacy;
}

function getTerrainCost(province: Province): number {
  return TERRAIN_MOVEMENT_COST[province.terrain] ?? 1;
}

function reconstructPath(cameFrom: Map<ProvinceId, ProvinceId>, current: ProvinceId): ProvinceId[] {
  const totalPath: ProvinceId[] = [current];
  let cursor = current;
  while (cameFrom.has(cursor)) {
    cursor = cameFrom.get(cursor)!;
    totalPath.unshift(cursor);
  }
  return totalPath;
}

export function findProvincePath(
  provinces: Record<ProvinceId, Province>,
  startId: ProvinceId,
  goalId: ProvinceId,
): ProvinceId[] | null {
  if (startId === goalId) return [];
  if (!provinces[startId] || !provinces[goalId]) return null;

  const openSet = new Set<ProvinceId>([startId]);
  const cameFrom = new Map<ProvinceId, ProvinceId>();

  const gScore = new Map<ProvinceId, number>();
  gScore.set(startId, 0);

  const fScore = new Map<ProvinceId, number>();
  fScore.set(startId, 0);

  while (openSet.size > 0) {
    let current: ProvinceId | null = null;
    let best = Number.POSITIVE_INFINITY;

    for (const node of openSet) {
      const score = fScore.get(node) ?? Number.POSITIVE_INFINITY;
      if (score < best) {
        best = score;
        current = node;
      }
    }

    if (!current) break;
    if (current === goalId) {
      const fullPath = reconstructPath(cameFrom, current);
      return fullPath.slice(1);
    }

    openSet.delete(current);

    const currentProvince = provinces[current];
    for (const neighborId of getNeighbors(currentProvince)) {
      const neighborProvince = provinces[neighborId];
      if (!neighborProvince) continue;

      const tentativeG = (gScore.get(current) ?? Number.POSITIVE_INFINITY) + getTerrainCost(neighborProvince);
      if (tentativeG < (gScore.get(neighborId) ?? Number.POSITIVE_INFINITY)) {
        cameFrom.set(neighborId, current);
        gScore.set(neighborId, tentativeG);
        fScore.set(neighborId, tentativeG);
        openSet.add(neighborId);
      }
    }
  }

  return null;
}
