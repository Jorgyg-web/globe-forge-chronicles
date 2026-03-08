import React, { useMemo } from 'react';
import { TERRAIN_COLORS } from './mapConstants';

/**
 * A single memoized province path. Only re-renders when its own props change.
 */
interface ProvincePathProps {
  id: string;
  geometry: string;
  terrain: string;
  ownerColor: string;
  isConquered: boolean;
}

const ProvincePath: React.FC<ProvincePathProps> = React.memo(({ geometry, terrain, ownerColor, isConquered }) => {
  const terrainColor = TERRAIN_COLORS[terrain];
  return (
    <>
      <path d={geometry} fill={terrainColor} opacity={0.5} stroke="hsl(var(--map-border))" strokeWidth={0.3} />
      <path d={geometry} fill={ownerColor} opacity={isConquered ? 0.15 : 0.2} style={{ pointerEvents: 'none' }} />
    </>
  );
});
ProvincePath.displayName = 'ProvincePath';

/**
 * Pre-computed province data for rendering. Avoids recomputation each frame.
 */
export interface CachedProvinceData {
  id: string;
  countryId: string;
  geometry: string;
  terrain: string;
  ownerColor: string;
  isConquered: boolean;
  name: string;
  morale: number;
  buildingCount: number;
  centroidX: number;
  centroidY: number;
  boundsW: number;
  boundsH: number;
}

/**
 * Static geography layer — renders all province fill paths.
 * Only re-renders when province ownership or geometry changes.
 */
interface StaticGeometryLayerProps {
  provinces: CachedProvinceData[];
}

export const StaticGeometryLayer: React.FC<StaticGeometryLayerProps> = React.memo(({ provinces }) => {
  return (
    <g>
      {provinces.map(p => (
        <ProvincePath
          key={p.id}
          id={p.id}
          geometry={p.geometry}
          terrain={p.terrain}
          ownerColor={p.ownerColor}
          isConquered={p.isConquered}
        />
      ))}
    </g>
  );
});
StaticGeometryLayer.displayName = 'StaticGeometryLayer';

export default ProvincePath;
