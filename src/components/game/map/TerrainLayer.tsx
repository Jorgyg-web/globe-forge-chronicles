import React, { useMemo } from 'react';
import { getCachedWorldData } from '@/map/worldGenerator';
import { useMapContext } from './MapContext';

const TerrainLayer: React.FC = () => {
  const { showProvinces } = useMapContext();

  const combinedPath = useMemo(() => {
    const worldData = getCachedWorldData();
    if (!worldData) return '';
    return Object.values(worldData.countryPaths).join(' ');
  }, []);

  if (!combinedPath) return null;

  return (
    <>
      <path
        d={combinedPath}
        fill="hsl(var(--map-land))"
        stroke="hsl(var(--map-border))"
        strokeWidth={showProvinces ? 0.2 : 0.35}
        opacity={showProvinces ? 0.12 : 0.2}
        style={{ pointerEvents: 'none' }}
      />
      <rect
        width="800"
        height="450"
        fill="url(#terrainNoise)"
        opacity={showProvinces ? 0.04 : 0.06}
      />
    </>
  );
};

export default React.memo(TerrainLayer);
