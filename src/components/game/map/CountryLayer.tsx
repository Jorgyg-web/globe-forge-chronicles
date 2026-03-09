import React, { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { computeBounds, getProvinceBounds, getProvinceCentroid } from '@/data/provinceGeometry';
import { getCachedWorldData } from '@/map/worldGenerator';
import { useMapContext } from './MapContext';
import { filterVisibleBounds } from './mapViewport';

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

interface CountryLabelCandidate {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  priority: number;
}

function labelsOverlap(a: CountryLabelCandidate, b: CountryLabelCandidate, padding = 4): boolean {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  );
}

function filterOverlappingLabels(labels: CountryLabelCandidate[]): CountryLabelCandidate[] {
  const kept: CountryLabelCandidate[] = [];
  const sorted = [...labels].sort((a, b) => b.priority - a.priority);

  for (const label of sorted) {
    if (!kept.some(existing => labelsOverlap(label, existing))) {
      kept.push(label);
    }
  }

  return kept;
}

const CountryLayer: React.FC = () => {
  const { state, selectedCountryId } = useGame();
  const { viewport, zoom, showDetails, showProvinces } = useMapContext();

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

  const visibleCountries = useMemo(
    () => filterVisibleBounds(countries, viewport),
    [countries, viewport],
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

  const visibleLabels = useMemo(() => {
    if (showDetails) return [];

    const candidates = countryRenderShapes
      .filter(country => country.width > 10 && country.height > 8)
      .map(country => {
        const owner = state.countries[country.id];
        const text = owner?.code?.toUpperCase() ?? country.id.toUpperCase();
        const fontSize = showProvinces ? Math.max(3, Math.min(5.5, country.width / 8)) : Math.max(4, Math.min(8, 10 / zoom));
        const width = text.length * fontSize * 0.58;
        const height = fontSize * 1.3;

        return {
          id: country.id,
          text,
          x: country.cx - width / 2,
          y: country.cy - height / 2,
          width,
          height,
          fontSize,
          priority: country.width * country.height + (selectedCountryId === country.id ? 10_000 : 0),
        };
      });

    return filterOverlappingLabels(candidates);
  }, [countryRenderShapes, state.countries, selectedCountryId, showDetails, showProvinces, zoom]);

  return (
    <g>
      {countryRenderShapes.map(country => {
        const owner = state.countries[country.id];
        const isSelected = selectedCountryId === country.id;

        return (
          <path
            key={country.id}
            d={country.path}
            fill={showProvinces ? 'none' : owner?.color ?? 'hsl(var(--map-land))'}
            opacity={showProvinces ? 1 : isSelected ? 0.38 : 0.26}
            stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--map-border))'}
            strokeWidth={showProvinces ? (isSelected ? 1.2 : 0.8) : isSelected ? 1.4 : 0.6}
            vectorEffect="non-scaling-stroke"
            style={{ pointerEvents: 'none' }}
          />
        );
      })}

      {visibleLabels.map(label => (
        <g key={`country_label_${label.id}`} style={{ pointerEvents: 'none' }}>
          <text
            x={label.x + label.width / 2}
            y={label.y + label.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={label.fontSize}
            fill="hsl(var(--background))"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={700}
            stroke="hsl(var(--background))"
            strokeWidth={1.8}
            opacity={0.8}
            letterSpacing={0.8}
          >
            {label.text}
          </text>
          <text
            x={label.x + label.width / 2}
            y={label.y + label.height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={label.fontSize}
            fill="hsl(var(--foreground))"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={700}
            opacity={showProvinces ? 0.7 : 0.88}
            letterSpacing={0.8}
          >
            {label.text}
          </text>
        </g>
      ))}
    </g>
  );
};

export default React.memo(CountryLayer);
