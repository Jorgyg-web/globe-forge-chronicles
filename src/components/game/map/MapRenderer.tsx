import React, { useEffect, useMemo, useRef } from 'react';
import { getProvinceBounds, getProvinceCentroid } from '@/data/provinceGeometry';
import { Province, Country, Army, ActiveBattle } from '@/types/game';
import { UNIT_STATS } from '@/data/unitStats';

import { ProvinceRenderer, ProvinceRenderData } from './ProvinceRenderer';
import { UnitRenderArmy, UnitRenderBattle, UnitRenderer } from './UnitRenderer';
import { CameraState, ScreenSize } from './mapViewport';
import { MapLayerMode } from './mapConstants';

interface MapRendererProps {
  camera: CameraState;
  containerSize: ScreenSize;
  provinces: Record<string, Province>;
  countries: Record<string, Country>;
  armies: Record<string, Army>;
  activeBattles: ActiveBattle[];
  playerCountryId: string;
  selectedCountryId: string | null;
  selectedProvinceId: string | null;
  selectedArmyIds: string[];
  hoveredProvinceId: string | null;
  moveTargets: Set<string>;
  mapLayer: MapLayerMode;
  showProvinceBorders: boolean;
  showDetails: boolean;
}

/**
 * Main map renderer. Uses layered canvases and imperative renderers so React
 * does not rebuild map geometry on every interaction update.
 */
const MapRenderer: React.FC<MapRendererProps> = ({
  camera,
  containerSize,
  provinces,
  countries,
  armies,
  activeBattles,
  playerCountryId,
  selectedCountryId,
  selectedProvinceId,
  selectedArmyIds,
  hoveredProvinceId,
  moveTargets,
  mapLayer,
  showProvinceBorders,
  showDetails,
}) => {
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const unitsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const provinceRendererRef = useRef<ProvinceRenderer | null>(null);
  const unitRendererRef = useRef<UnitRenderer | null>(null);

  const provinceRenderData = useMemo<ProvinceRenderData[]>(() => {
    return Object.values(provinces).map(province => {
      const owner = countries[province.countryId];
      const centroid = getProvinceCentroid(province.id);
      const bounds = getProvinceBounds(province.id);
      return {
        id: province.id,
        countryId: province.countryId,
        geometry: province.geometry,
        terrain: province.terrain,
        ownerColor: owner?.color ?? '#888888',
        isConquered: province.countryId !== province.originalCountryId,
        development: province.development,
        morale: province.morale,
        buildingCount: province.buildings.length,
        resourceProduction: province.resourceProduction,
        centroidX: centroid.x,
        centroidY: centroid.y,
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY,
        boundsW: bounds.w,
        boundsH: bounds.h,
      };
    });
  }, [countries, provinces]);

  const troopCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const army of Object.values(armies)) {
      if (army.targetProvinceId) continue;
      counts[army.provinceId] = (counts[army.provinceId] ?? 0) + army.units.reduce((sum, unit) => sum + unit.count, 0);
    }
    return counts;
  }, [armies]);

  const armyRenderData = useMemo<UnitRenderArmy[]>(() => {
    return Object.values(armies).map(army => {
      const centroid = getProvinceCentroid(army.provinceId);
      const targetCentroid = army.targetProvinceId ? getProvinceCentroid(army.targetProvinceId) : null;
      const totalUnits = army.units.reduce((sum, unit) => sum + unit.count, 0);
      const averageHealth = totalUnits > 0
        ? army.units.reduce((sum, unit) => sum + unit.health * unit.count, 0) / totalUnits
        : 0;

      let icon = '🎖';
      let maxCount = -1;
      for (const unit of army.units) {
        if (unit.count > maxCount) {
          maxCount = unit.count;
          icon = UNIT_STATS[unit.type].icon;
        }
      }

      return {
        army,
        x: centroid.x,
        y: centroid.y,
        targetX: targetCentroid?.x,
        targetY: targetCentroid?.y,
        totalUnits,
        averageHealth,
        icon,
      };
    });
  }, [armies]);

  const battleRenderData = useMemo<UnitRenderBattle[]>(() => {
    return activeBattles.map(battle => {
      const centroid = getProvinceCentroid(battle.provinceId);
      return {
        provinceId: battle.provinceId,
        x: centroid.x,
        y: centroid.y,
      };
    });
  }, [activeBattles]);

  useEffect(() => {
    if (!baseCanvasRef.current || !overlayCanvasRef.current || !unitsCanvasRef.current) {
      return;
    }

    if (!provinceRendererRef.current) {
      provinceRendererRef.current = new ProvinceRenderer(baseCanvasRef.current, overlayCanvasRef.current);
    }

    if (!unitRendererRef.current) {
      unitRendererRef.current = new UnitRenderer(unitsCanvasRef.current);
    }
  }, []);

  useEffect(() => {
    const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;
    provinceRendererRef.current?.resize(containerSize, dpr);
    unitRendererRef.current?.resize(containerSize, dpr);
  }, [containerSize]);

  useEffect(() => {
    provinceRendererRef.current?.render({
      provinces: provinceRenderData,
      troopCounts,
      mapLayer,
      camera,
      containerSize,
      showProvinceBorders,
      showDetails,
      selectedProvinceId,
      selectedCountryId,
      hoveredProvinceId,
      moveTargets,
    });
  }, [
    provinceRenderData,
    troopCounts,
    mapLayer,
    camera,
    containerSize,
    showProvinceBorders,
    showDetails,
    selectedProvinceId,
    selectedCountryId,
    hoveredProvinceId,
    moveTargets,
  ]);

  useEffect(() => {
    unitRendererRef.current?.render({
      armies: armyRenderData,
      battles: battleRenderData,
      countries,
      playerCountryId,
      selectedArmyIds,
      viewport: {
        minX: camera.centerX - 800 / (2 * camera.zoom),
        minY: camera.centerY - 450 / (2 * camera.zoom),
        maxX: camera.centerX + 800 / (2 * camera.zoom),
        maxY: camera.centerY + 450 / (2 * camera.zoom),
        width: 800 / camera.zoom,
        height: 450 / camera.zoom,
      },
      camera,
      containerSize,
      mapLayer,
    });
  }, [armyRenderData, battleRenderData, camera, containerSize, countries, mapLayer, playerCountryId, selectedArmyIds]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas ref={baseCanvasRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={overlayCanvasRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={unitsCanvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};

export default React.memo(MapRenderer);
