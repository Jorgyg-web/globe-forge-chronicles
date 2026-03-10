import React, { useMemo } from 'react';
import { getCachedWorldData } from '@/map/worldGenerator';
import { useMapContext } from './MapContext';

const TerrainLayer: React.FC = () => {
  const { mapLayer, showProvinces } = useMapContext();

  const combinedPath = useMemo(() => {
    const worldData = getCachedWorldData();
    if (!worldData) return '';
    return Object.values(worldData.countryPaths).join(' ');
  }, []);

  if (!combinedPath) return null;

  const terrainFocused = mapLayer === 'terrain';
  const landOpacity = terrainFocused ? (showProvinces ? 0.36 : 0.46) : mapLayer === 'political' ? (showProvinces ? 0.18 : 0.2) : 0.12;
  const noiseOpacity = terrainFocused ? (showProvinces ? 0.12 : 0.14) : showProvinces ? 0.04 : 0.06;

  return (
    <>
      <path
        d={combinedPath}
        fill="hsl(var(--map-land))"
        fillRule="evenodd"
        stroke="hsl(var(--map-border))"
        strokeWidth={terrainFocused ? (showProvinces ? 0.28 : 0.45) : showProvinces ? 0.2 : 0.35}
        opacity={landOpacity}
        style={{ pointerEvents: 'none' }}
      />
      <rect
        width="800"
        height="450"
        fill="url(#terrainNoise)"
        opacity={noiseOpacity}
      />
    </>
  );
};

export default React.memo(TerrainLayer);
