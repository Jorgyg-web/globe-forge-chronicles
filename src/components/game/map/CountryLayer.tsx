import React, { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { computeBounds, getProvinceBounds, getProvinceCentroid } from '@/data/provinceGeometry';
import { getCachedWorldData } from '@/map/worldGenerator';
import { useMapContext } from './MapContext';
import { filterVisibleBounds } from './mapViewport';
import { buildBoundsQuadtree, queryBoundsQuadtree } from './spatialIndex';
import { getEconomicFill, getResourceFill } from './mapConstants';

interface CachedCountryShape {
  id: string;
  path: string;
  cx: number;
  cy: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

interface VisibleProvinceFragment {
  id: string;
  countryId: string;
  geometry: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  cx: number;
  cy: number;
  width: number;
  height: number;
}

const CountryLayer: React.FC = () => {
  const { state, selectedCountryId } = useGame();
  const { mapLayer, viewport, showProvinces } = useMapContext();

  const countries = useMemo<CachedCountryShape[]>(() => {
    const worldData = getCachedWorldData();
    if (!worldData) return [];

    return Object.entries(worldData.countryPaths).map(([id, path]) => {
      const bounds = computeBounds(path);
      return {
        id,
        path,
        cx: (bounds.minX + bounds.maxX) / 2,
        cy: (bounds.minY + bounds.maxY) / 2,
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY,
        width: bounds.w,
        height: bounds.h,
      };
    });
  }, []);

  const countrySpatialIndex = useMemo(
    () => buildBoundsQuadtree(countries),
    [countries],
  );

  const visibleCountries = useMemo(
    () => queryBoundsQuadtree(countrySpatialIndex, viewport),
    [countrySpatialIndex, viewport],
  );

  const visibleProvinceFragments = useMemo<VisibleProvinceFragment[]>(() => {
    if (!showProvinces) return [];

    const fragments = Object.values(state.provinces).map(province => {
      const bounds = getProvinceBounds(province.id);
      const centroid = getProvinceCentroid(province.id);
      return {
        id: province.id,
        countryId: province.countryId,
        geometry: province.geometry,
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY,
        cx: centroid.x,
        cy: centroid.y,
        width: bounds.w,
        height: bounds.h,
      };
    });

    return filterVisibleBounds(fragments, viewport);
  }, [showProvinces, state.provinces, viewport]);

  const countryRenderShapes = useMemo(() => {
    if (!showProvinces) {
      return visibleCountries.map(country => ({
        id: country.id,
        path: country.path,
        cx: country.cx,
        cy: country.cy,
        width: country.width,
        height: country.height,
      }));
    }

    const byCountry = new Map<string, VisibleProvinceFragment[]>();
    for (const fragment of visibleProvinceFragments) {
      if (!byCountry.has(fragment.countryId)) {
        byCountry.set(fragment.countryId, []);
      }
      byCountry.get(fragment.countryId)!.push(fragment);
    }

    return Array.from(byCountry.entries()).map(([countryId, fragments]) => {
      const totalWeight = fragments.reduce((sum, fragment) => sum + Math.max(1, fragment.width * fragment.height), 0);
      const cx = fragments.reduce((sum, fragment) => sum + fragment.cx * Math.max(1, fragment.width * fragment.height), 0) / totalWeight;
      const cy = fragments.reduce((sum, fragment) => sum + fragment.cy * Math.max(1, fragment.width * fragment.height), 0) / totalWeight;
      const minX = Math.min(...fragments.map(fragment => fragment.minX));
      const minY = Math.min(...fragments.map(fragment => fragment.minY));
      const maxX = Math.max(...fragments.map(fragment => fragment.maxX));
      const maxY = Math.max(...fragments.map(fragment => fragment.maxY));

      return {
        id: countryId,
        path: fragments.map(fragment => fragment.geometry).join(' '),
        cx,
        cy,
        width: maxX - minX,
        height: maxY - minY,
      };
    });
  }, [showProvinces, visibleCountries, visibleProvinceFragments]);

  const countryMetrics = useMemo(() => {
    const metrics = new Map<string, {
      provinceCount: number;
      developmentTotal: number;
      buildingTotal: number;
      militaryStrength: number;
      resourceProduction: {
        food: number;
        steel: number;
        oil: number;
        rareMetals: number;
        manpower: number;
      };
    }>();

    for (const province of Object.values(state.provinces)) {
      const entry = metrics.get(province.countryId) ?? {
        provinceCount: 0,
        developmentTotal: 0,
        buildingTotal: 0,
        militaryStrength: 0,
        resourceProduction: {
          food: 0,
          steel: 0,
          oil: 0,
          rareMetals: 0,
          manpower: 0,
        },
      };

      entry.provinceCount += 1;
      entry.developmentTotal += province.development;
      entry.buildingTotal += province.buildings.length;
      entry.resourceProduction.food += province.resourceProduction.food;
      entry.resourceProduction.steel += province.resourceProduction.steel;
      entry.resourceProduction.oil += province.resourceProduction.oil;
      entry.resourceProduction.rareMetals += province.resourceProduction.rareMetals;
      entry.resourceProduction.manpower += province.resourceProduction.manpower;

      metrics.set(province.countryId, entry);
    }

    for (const army of Object.values(state.armies)) {
      const strength = army.units.reduce((sum, unit) => sum + unit.count, 0);
      const province = state.provinces[army.provinceId];
      if (!province) continue;

      const entry = metrics.get(province.countryId);
      if (entry) {
        entry.militaryStrength += strength;
      }
    }

    return metrics;
  }, [state.armies, state.provinces]);

  const maxMilitaryStrength = useMemo(
    () => Math.max(1, ...Array.from(countryMetrics.values(), metric => metric.militaryStrength)),
    [countryMetrics],
  );

  return (
    <g>
      {countryRenderShapes.map(country => {
        const owner = state.countries[country.id];
        const isSelected = selectedCountryId === country.id;
        const metrics = countryMetrics.get(country.id);
        const averageDevelopment = metrics ? metrics.developmentTotal / Math.max(1, metrics.provinceCount) : 0;
        const averageBuildings = metrics ? metrics.buildingTotal / Math.max(1, metrics.provinceCount) : 0;
        const militaryRatio = metrics ? metrics.militaryStrength / maxMilitaryStrength : 0;

        let fill = owner?.color ?? 'hsl(var(--map-land))';
        let opacity = showProvinces ? 1 : isSelected ? 0.38 : 0.26;
        let stroke = isSelected ? 'hsl(var(--primary))' : 'hsl(var(--map-border))';
        let strokeWidth = showProvinces ? (isSelected ? 1.2 : 0.8) : isSelected ? 1.4 : 0.6;

        if (!showProvinces) {
          switch (mapLayer) {
            case 'terrain':
              fill = 'hsl(var(--map-land))';
              opacity = isSelected ? 0.22 : 0.12;
              break;
            case 'military':
              fill = owner?.color ?? 'hsl(var(--map-land))';
              opacity = 0.18 + militaryRatio * 0.34 + (isSelected ? 0.1 : 0);
              strokeWidth = isSelected ? 1.6 : 0.8;
              break;
            case 'economic':
              fill = getEconomicFill({
                development: averageDevelopment,
                buildings: { length: averageBuildings },
              });
              opacity = isSelected ? 0.5 : 0.38;
              break;
            case 'resource':
              fill = getResourceFill({
                resourceProduction: metrics?.resourceProduction ?? {
                  food: 0,
                  steel: 0,
                  oil: 0,
                  rareMetals: 0,
                  manpower: 0,
                },
              });
              opacity = isSelected ? 0.5 : 0.38;
              break;
            case 'political':
            default:
              break;
          }
        } else if (mapLayer === 'military') {
          stroke = militaryRatio > 0.45 ? 'hsl(var(--danger))' : stroke;
          strokeWidth = isSelected ? 1.4 : 1;
        }

        return (
          <path
            key={country.id}
            d={country.path}
            fill={showProvinces ? 'none' : fill}
            fillRule="evenodd"
            opacity={opacity}
            stroke={stroke}
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
            style={{ pointerEvents: 'none' }}
          />
        );
      })}
    </g>
  );
};

export default React.memo(CountryLayer);
