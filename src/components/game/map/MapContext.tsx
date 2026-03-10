import React, { createContext, useContext } from 'react';
import { WorldViewport } from './mapViewport';
import { MapLayerMode } from './mapConstants';

export interface MapContextType {
  mapLayer: MapLayerMode;
  setMapLayer: (layer: MapLayerMode) => void;
  zoom: number;
  isZooming: boolean;
  showProvinces: boolean;
  showDetails: boolean;
  moveMode: boolean;
  setMoveMode: (v: boolean) => void;
  moveTargets: Set<string>;
  hoveredCountry: string | null;
  setHoveredCountry: (id: string | null) => void;
  hoveredProvince: string | null;
  setHoveredProvince: (id: string | null) => void;
  mousePos: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement>;
  viewport: WorldViewport;
}

const MapContext = createContext<MapContextType | null>(null);

export const MapProvider = MapContext.Provider;

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapContext must be used within MapProvider');
  return ctx;
}
