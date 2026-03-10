import React from 'react';
import { Province, TerrainType } from '@/types/game';

import { MapLayerMode, TERRAIN_COLORS, TERRAIN_RENDER_STYLES, getEconomicFill, getResourceFill } from './mapConstants';

/**
 * A single memoized province path. Only re-renders when its own props change.
 */
interface ProvincePathProps {
  id: string;
  geometry: string;
  terrain: TerrainType;
  ownerColor: string;
  isConquered: boolean;
  showBorder: boolean;
  development: number;
  buildingCount: number;
  resourceProduction: Province['resourceProduction'];
  mapLayer: MapLayerMode;
  militaryPresence: number;
}

const ProvincePath: React.FC<ProvincePathProps> = React.memo(({ geometry, terrain, ownerColor, isConquered, showBorder, development, buildingCount, resourceProduction, mapLayer, militaryPresence }) => {
  const terrainColor = TERRAIN_COLORS[terrain];
  const renderStyle = TERRAIN_RENDER_STYLES[terrain];
  const economicFill = getEconomicFill({ development, buildings: { length: buildingCount } });
  const resourceFill = getResourceFill({ resourceProduction });
  const militaryOpacity = Math.min(0.5, 0.08 + Math.log10(militaryPresence + 1) * 0.18);

  let baseFill = renderStyle.baseFill ?? terrainColor;
  let baseOpacity = 0.78;
  let overlayFill = renderStyle.overlayFill;
  let overlayOpacity = renderStyle.overlayOpacity ?? 0.12;
  let patternId = renderStyle.patternId;
  let patternOpacity = renderStyle.patternOpacity ?? 0.14;
  let shadingOpacity = renderStyle.shadingOpacity;
  let ownerOpacity = isConquered ? 0.15 : 0.2;
  let militaryFill: string | null = null;

  switch (mapLayer) {
    case 'political':
      baseFill = ownerColor;
      baseOpacity = 0.76;
      overlayFill = renderStyle.overlayFill;
      overlayOpacity = 0.08;
      patternOpacity = 0.05;
      shadingOpacity = 0.08;
      ownerOpacity = isConquered ? 0.18 : 0;
      break;
    case 'economic':
      baseFill = economicFill;
      baseOpacity = 0.84;
      overlayFill = undefined;
      patternId = undefined;
      shadingOpacity = 0.08;
      ownerOpacity = isConquered ? 0.12 : 0.06;
      break;
    case 'resource':
      baseFill = resourceFill;
      baseOpacity = 0.84;
      overlayFill = undefined;
      patternId = undefined;
      shadingOpacity = 0.06;
      ownerOpacity = isConquered ? 0.12 : 0.05;
      break;
    case 'military':
      baseFill = ownerColor;
      baseOpacity = 0.36;
      overlayFill = undefined;
      patternId = undefined;
      shadingOpacity = 0.04;
      ownerOpacity = isConquered ? 0.14 : 0.08;
      militaryFill = militaryPresence > 0 ? 'hsl(12, 78%, 56%)' : null;
      break;
    case 'terrain':
    default:
      break;
  }

  return (
    <>
      <path
        d={geometry}
        fill={baseFill}
        fillRule="evenodd"
        opacity={baseOpacity}
        stroke={showBorder ? 'hsl(var(--map-border))' : 'none'}
        strokeWidth={mapLayer === 'military' ? 0.45 : 0.3}
        vectorEffect="non-scaling-stroke"
      />
      {overlayFill ? (
        <path d={geometry} fill={overlayFill} fillRule="evenodd" opacity={overlayOpacity} style={{ pointerEvents: 'none' }} />
      ) : null}
      {patternId ? (
        <path d={geometry} fill={`url(#${patternId})`} fillRule="evenodd" opacity={patternOpacity} style={{ pointerEvents: 'none', mixBlendMode: 'screen' }} />
      ) : null}
      <path
        d={geometry}
        fill="url(#terrain-elevation-gradient)"
        fillRule="evenodd"
        opacity={shadingOpacity}
        style={{ pointerEvents: 'none' }}
      />
      <path d={geometry} fill={ownerColor} fillRule="evenodd" opacity={ownerOpacity} style={{ pointerEvents: 'none' }} />
      {militaryFill ? (
        <path d={geometry} fill={militaryFill} fillRule="evenodd" opacity={militaryOpacity} style={{ pointerEvents: 'none' }} />
      ) : null}
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
  terrain: TerrainType;
  ownerColor: string;
  isConquered: boolean;
  name: string;
  development: number;
  morale: number;
  buildingCount: number;
  resourceProduction: Province['resourceProduction'];
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
  mapLayer: MapLayerMode;
  troopCounts: Record<string, number>;
}

export const StaticGeometryLayer: React.FC<StaticGeometryLayerProps> = React.memo(({ provinces, showProvinceBorders, mapLayer, troopCounts }) => {
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
          development={p.development}
          buildingCount={p.buildingCount}
          resourceProduction={p.resourceProduction}
          mapLayer={mapLayer}
          militaryPresence={troopCounts[p.id] ?? 0}
        />
      ))}
    </g>
  );
});
StaticGeometryLayer.displayName = 'StaticGeometryLayer';

export default ProvincePath;
