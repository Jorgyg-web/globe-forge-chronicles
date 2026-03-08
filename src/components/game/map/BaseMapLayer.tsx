import React, { useEffect, useState, useMemo } from 'react';
import { polygonToSvgPath, multiPolygonToSvgPath, getDefaultProjectionConfig } from '@/map/projection';

/**
 * Renders world landmass polygons from a simplified GeoJSON file.
 * This layer sits below ProvinceLayer and provides geographic outlines.
 */
const BaseMapLayer: React.FC = () => {
  const [landPaths, setLandPaths] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/world-land.geojson')
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const cfg = getDefaultProjectionConfig();
        const paths: string[] = [];
        for (const feature of data.features) {
          const geo = feature.geometry;
          let path = '';
          if (geo.type === 'Polygon') {
            path = polygonToSvgPath(geo.coordinates, cfg);
          } else if (geo.type === 'MultiPolygon') {
            path = multiPolygonToSvgPath(geo.coordinates, cfg);
          }
          if (path) paths.push(path);
        }
        setLandPaths(paths);
      })
      .catch(() => {/* silently fall back to no base map */});
    return () => { cancelled = true; };
  }, []);

  // Combine all paths into a single <path> for performance
  const combinedPath = useMemo(() => landPaths.join(' '), [landPaths]);

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
