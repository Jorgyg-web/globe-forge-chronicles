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
  showBorder: boolean;
}

const ProvincePath: React.FC<ProvincePathProps> = React.memo(({ geometry, terrain, ownerColor, isConquered, showBorder }) => {
  const terrainColor = TERRAIN_COLORS[terrain];
  return (
    <>
      <path d={geometry} fill={terrainColor} fillRule="evenodd" opacity={0.5} stroke={showBorder ? 'hsl(var(--map-border))' : 'none'} strokeWidth={0.3} vectorEffect="non-scaling-stroke" />
      <path d={geometry} fill={ownerColor} fillRule="evenodd" opacity={isConquered ? 0.15 : 0.2} style={{ pointerEvents: 'none' }} />
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
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  boundsW: number;
  boundsH: number;
}

/**
 * Static geography layer — renders all province fill paths.
 * Only re-renders when province ownership or geometry changes.
 */
interface StaticGeometryLayerProps {
  provinces: CachedProvinceData[];
  showProvinceBorders: boolean;
}

export const StaticGeometryLayer: React.FC<StaticGeometryLayerProps> = React.memo(({ provinces, showProvinceBorders }) => {
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
          showBorder={showProvinceBorders}
        />
      ))}
    </g>
  );
});
StaticGeometryLayer.displayName = 'StaticGeometryLayer';

export default ProvincePath;
