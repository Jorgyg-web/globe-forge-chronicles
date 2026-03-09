import React from 'react';
import CountryLayer from './CountryLayer';
import TerrainLayer from './TerrainLayer';
import ProvinceLayer from './ProvinceLayer';
import ArmyLayer from './ArmyLayer';
import { cameraToViewBoxString, CameraState } from './mapViewport';

interface MapRendererProps {
  camera: CameraState;
  isPanning: boolean;
  moveMode: boolean;
}

/**
 * Main SVG renderer. Uses a dynamic viewBox derived from camera state
 * instead of CSS transforms, giving crisp vector rendering at all zooms.
 */
const MapRenderer: React.FC<MapRendererProps> = ({ camera, isPanning, moveMode }) => {
  const viewBox = cameraToViewBoxString(camera);
  // Scale stroke widths relative to zoom so they stay reasonable
  const baseStroke = 0.3 / camera.zoom;

  return (
    <svg
      viewBox={viewBox}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      style={{
        cursor: moveMode ? 'crosshair' : isPanning ? 'grabbing' : 'grab',
      }}
    >
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="battleGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="terrainNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" />
        </filter>
        <pattern id="gridPattern" width="25" height="25" patternUnits="userSpaceOnUse">
          <line x1="25" y1="0" x2="25" y2="25" stroke="hsl(225, 18%, 16%)" strokeWidth={baseStroke} opacity="0.2" />
          <line x1="0" y1="25" x2="25" y2="25" stroke="hsl(225, 18%, 16%)" strokeWidth={baseStroke} opacity="0.2" />
        </pattern>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="hsl(42, 100%, 58%)" opacity="0.8" />
        </marker>
        <marker id="arrowheadRed" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="hsl(0, 72%, 51%)" opacity="0.8" />
        </marker>
      </defs>
      <rect width="800" height="450" fill="url(#gridPattern)" />

      {/* Ocean / water base */}
      <rect width="800" height="450" fill="hsl(var(--map-water))" opacity="0.15" />

      {/* Terrain / landmass base layer */}
      <TerrainLayer />
      <CountryLayer />

      <ProvinceLayer />
      <ArmyLayer />
    </svg>
  );
};

export default React.memo(MapRenderer);
