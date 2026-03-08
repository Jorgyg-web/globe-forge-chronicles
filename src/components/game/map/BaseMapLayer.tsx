import React, { useMemo } from 'react';
import { getCachedWorldData } from '@/map/worldGenerator';

/**
 * Renders world landmass polygons as a base layer below provinces.
 * Uses pre-parsed country paths from the world generator cache.
 */
const BaseMapLayer: React.FC = () => {
  const combinedPath = useMemo(() => {
    const worldData = getCachedWorldData();
    if (!worldData) return '';
    return Object.values(worldData.countryPaths).join(' ');
  }, []);

  if (!combinedPath) return null;

  return (
    <path
      d={combinedPath}
      fill="hsl(var(--map-land))"
      stroke="hsl(var(--map-border))"
      strokeWidth={0.3}
      opacity={0.18}
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default React.memo(BaseMapLayer);
