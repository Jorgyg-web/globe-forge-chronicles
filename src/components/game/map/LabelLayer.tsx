import React, { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { computeBounds, getProvinceBounds, getProvinceCentroid } from '@/data/provinceGeometry';
import { getCachedWorldData } from '@/map/worldGenerator';
import { getMapCameraViewport, MapCameraState } from './MapCamera';
import { filterVisibleBounds, ScreenSize, worldToScreen } from './mapViewport';

interface LabelLayerProps {
  camera: MapCameraState;
  containerSize: ScreenSize;
}

interface WorldLabelCandidate {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  priority: number;
  opacity: number;
  kind: 'country' | 'province';
}

interface CountryShape {
  id: string;
  cx: number;
  cy: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

interface ProvinceShape {
  id: string;
  name: string;
  cx: number;
  cy: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

function labelsOverlap(a: WorldLabelCandidate, b: WorldLabelCandidate, padding = 4): boolean {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  );
}

function filterOverlappingLabels(labels: WorldLabelCandidate[]): WorldLabelCandidate[] {
  const kept: WorldLabelCandidate[] = [];
  const sorted = [...labels].sort((a, b) => b.priority - a.priority);

  for (const label of sorted) {
    if (!kept.some(existing => labelsOverlap(label, existing))) {
      kept.push(label);
    }
  }

  return kept;
}

/** Estimate text width using average character widths for a sans-serif font. */
function estimateTextWidth(text: string, fontSize: number): number {
  // Average ratio for sans-serif: ~0.55em for mixed case, tighter for uppercase
  const ratio = text === text.toUpperCase() ? 0.62 : 0.52;
  return text.length * fontSize * ratio;
}

const LabelLayer: React.FC<LabelLayerProps> = ({ camera, containerSize }) => {
  const { state, selectedCountryId, selectedProvinceId } = useGame();
  const worldViewport = useMemo(() => {
    return getMapCameraViewport(camera, containerSize);
  }, [camera, containerSize]);

  const countryShapes = useMemo<CountryShape[]>(() => {
    const worldData = getCachedWorldData();
    if (!worldData) return [];

    return Object.entries(worldData.countryPaths).map(([id, path]) => {
      const bounds = computeBounds(path);
      const storedCentroid = worldData.countryCentroids?.[id];
      return {
        id,
        cx: storedCentroid?.x ?? (bounds.minX + bounds.maxX) / 2,
        cy: storedCentroid?.y ?? (bounds.minY + bounds.maxY) / 2,
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY,
        width: bounds.w,
        height: bounds.h,
      };
    });
  }, []);

  const provinceShapes = useMemo<ProvinceShape[]>(() => {
    return Object.values(state.provinces)
      .map(province => {
        const bounds = getProvinceBounds(province.id);
        const centroid = getProvinceCentroid(province.id);
        return {
          id: province.id,
          name: province.name,
          cx: centroid.x,
          cy: centroid.y,
          minX: bounds.minX,
          minY: bounds.minY,
          maxX: bounds.maxX,
          maxY: bounds.maxY,
          width: bounds.w,
          height: bounds.h,
        };
      });
  }, [state.provinces]);

  const countryLabels = useMemo<WorldLabelCandidate[]>(() => {
    if (camera.zoom >= 2.4) return [];

    return filterVisibleBounds(countryShapes, worldViewport)
      .filter(shape => shape.width > 6 && shape.height > 4)
      .map(shape => {
        const screen = worldToScreen({ x: shape.cx, y: shape.cy }, camera, containerSize);
        const text = state.countries[shape.id]?.code?.toUpperCase() ?? shape.id.toUpperCase();
        const fontSize = Math.max(10, Math.min(18, 17 - camera.zoom * 2.2));
        const width = estimateTextWidth(text, fontSize) + 12; // add pill padding
        const height = fontSize + 8;

        return {
          id: `country_${shape.id}`,
          text,
          x: screen.x - width / 2,
          y: screen.y - height / 2,
          width,
          height,
          fontSize,
          priority: shape.width * shape.height + (selectedCountryId === shape.id ? 10000 : 0),
          opacity: selectedCountryId === shape.id ? 1 : 0.9,
          kind: 'country' as const,
        };
      });
  }, [camera.centerX, camera.centerY, camera.zoom, containerSize, countryShapes, selectedCountryId, state.countries, worldViewport]);

  const provinceLabels = useMemo<WorldLabelCandidate[]>(() => {
    if (camera.zoom < 2.4) return [];

    const showAllLabels = camera.zoom >= 3;

    return filterVisibleBounds(provinceShapes, worldViewport)
      .filter(shape => showAllLabels ? shape.width > 5 && shape.height > 3 : shape.width > 15 && shape.height > 10)
      .map(shape => {
        const screen = worldToScreen({ x: shape.cx, y: shape.cy }, camera, containerSize);
        const fontSize = showAllLabels
          ? Math.max(9, Math.min(13, 7 + camera.zoom * 1.1))
          : Math.max(10, Math.min(14, 8 + camera.zoom));
        const text = shape.name.length > 16 ? `${shape.name.slice(0, 15)}…` : shape.name;
        const width = estimateTextWidth(text, fontSize) + 10;
        const height = fontSize + 6;

        return {
          id: `province_${shape.id}`,
          text,
          x: screen.x - width / 2,
          y: screen.y - height / 2,
          width,
          height,
          fontSize,
          priority: shape.width * shape.height + (selectedProvinceId === shape.id ? 10000 : 0),
          opacity: selectedProvinceId === shape.id ? 1 : 0.92,
          kind: 'province' as const,
        };
      });
  }, [camera.centerX, camera.centerY, camera.zoom, containerSize, provinceShapes, selectedProvinceId, worldViewport]);

  const visibleLabels = useMemo(
    () => filterOverlappingLabels(camera.zoom >= 2.4 ? provinceLabels : countryLabels),
    [camera.zoom, countryLabels, provinceLabels],
  );

  if (visibleLabels.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {visibleLabels.map(label => {
        const isCountry = label.kind === 'country';
        return (
          <div
            key={label.id}
            className="absolute flex items-center justify-center select-none"
            style={{
              left: `${label.x}px`,
              top: `${label.y}px`,
              width: `${label.width}px`,
              height: `${label.height}px`,
              fontSize: `${label.fontSize}px`,
              lineHeight: 1,
              opacity: label.opacity,
              fontFamily: isCountry
                ? "'Inter', 'Segoe UI', system-ui, sans-serif"
                : "'Inter', 'Segoe UI', system-ui, sans-serif",
              fontWeight: isCountry ? 700 : 500,
              letterSpacing: isCountry ? '0.08em' : '0.02em',
              color: isCountry
                ? 'hsl(45, 90%, 92%)'
                : 'hsl(40, 15%, 92%)',
              textShadow: isCountry
                ? '0 1px 3px rgba(0,0,0,0.7), 0 0 8px rgba(0,0,0,0.4)'
                : '0 1px 2px rgba(0,0,0,0.6)',
              background: isCountry
                ? 'rgba(15, 20, 30, 0.55)'
                : 'rgba(15, 20, 30, 0.45)',
              borderRadius: `${Math.round(label.height * 0.35)}px`,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              border: isCountry
                ? '1px solid rgba(180, 170, 130, 0.25)'
                : '1px solid rgba(150, 150, 150, 0.15)',
              transform: 'translateZ(0)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              padding: '0 4px',
            }}
          >
            {label.text}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(LabelLayer);
