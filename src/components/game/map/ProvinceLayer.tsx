import React, { useMemo } from 'react';
import { useGame } from '@/context/GameContext';

import { useMapContext } from './MapContext';
import { getProvinceBounds, getProvinceCentroid } from '@/data/provinceGeometry';
import { StaticGeometryLayer, CachedProvinceData } from './ProvincePathCache';
import { ProvinceOverlayLayer } from './ProvinceOverlayLayer';
import { buildBoundsQuadtree, queryBoundsQuadtree } from './spatialIndex';

// Zoom threshold for showing province borders
const ZOOM_PROVINCE_BORDERS = 1.5;

const ProvinceLayer: React.FC = () => {
  const { state, selectedCountryId, selectedProvinceId } = useGame();
  const { mapLayer, zoom, isZooming, moveTargets, hoveredProvince, showProvinces, viewport } = useMapContext();

  const showProvinceBorders = zoom >= ZOOM_PROVINCE_BORDERS

  // Cache province render data — only recomputes when provinces or countries change
  const cachedProvinces: CachedProvinceData[] = useMemo(() => {
    const result: CachedProvinceData[] = [];
    for (const prov of Object.values(state.provinces)) {
      const owner = state.countries[prov.countryId];
      const centroid = getProvinceCentroid(prov.id);
      const bounds = getProvinceBounds(prov.id);
      result.push({
        id: prov.id,
        countryId: prov.countryId,
        geometry: prov.geometry,
        terrain: prov.terrain,
        ownerColor: owner?.color ?? '#888',
        isConquered: prov.countryId !== prov.originalCountryId,
        name: prov.name,
        development: prov.development,
        morale: prov.morale,
        buildingCount: prov.buildings.length,
        resourceProduction: prov.resourceProduction,
        centroidX: centroid.x,
        centroidY: centroid.y,
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY,
        boundsW: bounds.w,
        boundsH: bounds.h,
      });
    }
    return result;
  }, [state.provinces, state.countries]);

  const provinceSpatialIndex = useMemo(
    () => buildBoundsQuadtree(cachedProvinces),
    [cachedProvinces],
  );

  const visibleProvinces = useMemo(() => {
    if (!showProvinces) return [];
    return queryBoundsQuadtree(provinceSpatialIndex, viewport);
  }, [provinceSpatialIndex, showProvinces, viewport]);

  // Troop counts per province — only recomputes when armies change
  const troopCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const army of Object.values(state.armies)) {
      if (!army.targetProvinceId) {
        const total = army.units.reduce((s, u) => s + u.count, 0);
        counts[army.provinceId] = (counts[army.provinceId] ?? 0) + total;
      }
    }
    return counts;
  }, [state.armies]);

  // Player/war indicators — only for countries with provinces
  const indicators = useMemo(() => {
    const items: React.ReactNode[] = [];
    for (const country of Object.values(state.countries)) {
      const firstProv = visibleProvinces.find(p => p.countryId === country.id);
      if (!firstProv) continue;
      const isPlayer = country.id === state.playerCountryId;
      const isAtWar = state.wars.some(w => w.active && (w.attackers.includes(country.id) || w.defenders.includes(country.id)));
      if (isPlayer) {
        items.push(
          <g key={`player_${country.id}`}>
            <circle cx={firstProv.centroidX + 8} cy={firstProv.centroidY - 8} r={3.5} fill="hsl(var(--primary))" opacity={0.9} />
            <circle cx={firstProv.centroidX + 8} cy={firstProv.centroidY - 8} r={1.5} fill="hsl(var(--primary-foreground))" />
          </g>
        );
      }
      if (isAtWar) {
        items.push(
          <circle key={`war_${country.id}`} cx={firstProv.centroidX - 8} cy={firstProv.centroidY - 8}
            r={3} fill="hsl(var(--danger))" className="animate-pulse-glow" />
        );
      }
    }
    return items;
  }, [state.countries, state.wars, state.playerCountryId, visibleProvinces]);

  if (!showProvinces) return null;

  return (
    <>
      {/* Layer 1: Static province fills — rarely re-renders */}
      <StaticGeometryLayer
        provinces={visibleProvinces}
        showProvinceBorders={showProvinceBorders}
        mapLayer={mapLayer}
        troopCounts={troopCounts}
      />

      {/* Province detection is now pixel-based via ProvinceManager (handled in WorldMap) */}

      {/* While zooming with many provinces visible, keep only the cheapest layer alive */}
      {isZooming ? null : (
        <>
      {/* Layer 2: Dynamic overlays (selection, labels, details) */}
      <ProvinceOverlayLayer
        provinces={visibleProvinces}
        selectedProvinceId={selectedProvinceId}
        selectedCountryId={selectedCountryId}
        hoveredProvinceId={hoveredProvince}
        moveTargets={moveTargets}
        zoom={zoom}
        troopCounts={troopCounts}
      />

      {/* Country indicators */}
      {indicators}
        </>
      )}
    </>
  );
};

export default React.memo(ProvinceLayer);
