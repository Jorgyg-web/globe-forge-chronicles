import React from 'react';
import BaseMapLayer from './BaseMapLayer';
import ProvinceLayer from './ProvinceLayer';
import ArmyLayer from './ArmyLayer';

interface MapRendererProps {
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  moveMode: boolean;
}

const MapRenderer: React.FC<MapRendererProps> = ({ zoom, pan, isPanning, moveMode }) => {
  return (
    <svg viewBox="0 0 800 450" className="w-full h-full" preserveAspectRatio="xMidYMid meet"
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: "0 0",
        transition: isPanning ? 'none' : 'transform 0.15s ease-out',
        cursor: moveMode ? 'crosshair' : isPanning ? 'grabbing' : 'grab',
      }}>
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="battleGlow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <pattern id="gridPattern" width="25" height="25" patternUnits="userSpaceOnUse">
          <line x1="25" y1="0" x2="25" y2="25" stroke="hsl(225, 18%, 16%)" strokeWidth="0.3" opacity="0.2" />
          <line x1="0" y1="25" x2="25" y2="25" stroke="hsl(225, 18%, 16%)" strokeWidth="0.3" opacity="0.2" />
        </pattern>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="hsl(42, 100%, 58%)" opacity="0.8" />
        </marker>
        <marker id="arrowheadRed" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="hsl(0, 72%, 51%)" opacity="0.8" />
          <filter id="terrainNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" />
        </filter>
        </marker>
      </defs>
      <rect width="800" height="450" fill="url(#gridPattern)" />

      {/* Ocean / water base */}
      <rect width="800" height="450" fill="hsl(var(--map-water))" opacity="0.15" />

      {/* World landmass base layer */}
      <BaseMapLayer />

      <ProvinceLayer />
      <ArmyLayer />
    </svg>
  );
};

export default React.memo(MapRenderer);
