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

function labelsOverlap(a: WorldLabelCandidate, b: WorldLabelCandidate, padding = 6): boolean {
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

const LabelLayer: React.FC<LabelLayerProps> = ({ camera, containerSize }) => {
  const { state, selectedCountryId, selectedProvinceId } = useGame();
  const worldViewport = useMemo(() => {
    return getMapCameraViewport(camera, containerSize);
  }, [camera, containerSize]);

  const countryLabels = useMemo<WorldLabelCandidate[]>(() => {
    if (camera.zoom >= 2.4) return [];

    const worldData = getCachedWorldData();
    if (!worldData) return [];

    const shapes: CountryShape[] = Object.entries(worldData.countryPaths).map(([id, path]) => {
      const bounds = computeBounds(path);
      return {
        id,
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

    return filterVisibleBounds(shapes, worldViewport)
      .filter(shape => shape.width > 10 && shape.height > 8)
      .map(shape => {
        const screen = worldToScreen({ x: shape.cx, y: shape.cy }, camera.zoom, camera.pan, containerSize);
        const text = state.countries[shape.id]?.code?.toUpperCase() ?? shape.id.toUpperCase();
        const fontSize = Math.max(11, Math.min(20, 19 - camera.zoom * 2.5));
        const width = text.length * fontSize * 0.58;
        const height = fontSize * 1.25;

        return {
          id: `country_${shape.id}`,
          text,
          x: screen.x - width / 2,
          y: screen.y - height / 2,
          width,
          height,
          fontSize,
          priority: shape.width * shape.height + (selectedCountryId === shape.id ? 10000 : 0),
          opacity: selectedCountryId === shape.id ? 0.95 : 0.82,
        };
      });
  }, [camera.pan, camera.zoom, containerSize, selectedCountryId, state.countries, worldViewport]);

  const provinceLabels = useMemo<WorldLabelCandidate[]>(() => {
    if (camera.zoom < 2.4) return [];

    const showAllLabels = camera.zoom >= 3;

    const shapes: ProvinceShape[] = Object.values(state.provinces)
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

    return filterVisibleBounds(shapes, worldViewport)
      .filter(shape => showAllLabels ? shape.width > 5 && shape.height > 3 : shape.width > 15 && shape.height > 10)
      .map(shape => {
        const screen = worldToScreen({ x: shape.cx, y: shape.cy }, camera.zoom, camera.pan, containerSize);
        const fontSize = showAllLabels
          ? Math.max(10, Math.min(14, 8 + camera.zoom * 1.2))
          : Math.max(11, Math.min(15, 9 + camera.zoom));
        const text = shape.name.length > 14 ? `${shape.name.slice(0, 13)}…` : shape.name;
        const width = text.length * fontSize * 0.5;
        const height = fontSize * 1.2;

        return {
          id: `province_${shape.id}`,
          text,
          x: screen.x - width / 2,
          y: screen.y - height / 2,
          width,
          height,
          fontSize,
          priority: shape.width * shape.height + (selectedProvinceId === shape.id ? 10000 : 0),
          opacity: selectedProvinceId === shape.id ? 1 : 0.84,
        };
      });
  }, [camera.pan, camera.zoom, containerSize, selectedProvinceId, state.provinces, worldViewport]);

  const visibleLabels = useMemo(
    () => filterOverlappingLabels(camera.zoom >= 2.4 ? provinceLabels : countryLabels),
    [camera.zoom, countryLabels, provinceLabels],
  );

  if (visibleLabels.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {visibleLabels.map(label => (
        <div
          key={label.id}
          className="absolute whitespace-nowrap font-mono font-semibold select-none"
          style={{
            left: `${label.x}px`,
            top: `${label.y}px`,
            fontSize: `${label.fontSize}px`,
            lineHeight: 1,
            opacity: label.opacity,
            color: 'hsl(var(--foreground))',
            textShadow: '0 0 4px hsl(var(--background)), 0 0 10px hsl(var(--background))',
            transform: 'translateZ(0)',
          }}
        >
          {label.text}
        </div>
      ))}
    </div>
  );
};

export default React.memo(LabelLayer);
