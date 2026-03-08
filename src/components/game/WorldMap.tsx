import { useGame } from '@/context/GameContext';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getProvincesForCountry } from '@/data/provinces';
import { COUNTRY_POSITIONS } from './map/mapConstants';
import { getProvinceLayout } from './map/mapLayout';
import { MapProvider } from './map/MapContext';
import MapRenderer from './map/MapRenderer';
import MapTooltipLayer from './map/MapTooltipLayer';
import MapControls from './map/MapControls';

const WorldMap = () => {
  const { state, selectedArmyId } = useGame();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [moveMode, setMoveMode] = useState(false);

  const showProvinces = zoom >= 1.4;
  const showDetails = zoom >= 2.2;

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.min(5, Math.max(0.5, prev + (e.deltaY > 0 ? -0.15 : 0.15))));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) { el.addEventListener('wheel', handleWheel, { passive: false }); return () => el.removeEventListener('wheel', handleWheel); }
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => { if (e.button === 0 && !moveMode) { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); } };
  const handleMouseMove = (e: React.MouseEvent) => { setMousePos({ x: e.clientX, y: e.clientY }); if (isPanning) setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); };
  const handleMouseUp = () => setIsPanning(false);
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const provinceLayouts = useMemo(() => {
    const layouts: Record<string, ReturnType<typeof getProvinceLayout>> = {};
    for (const cId of Object.keys(state.countries)) {
      const pos = COUNTRY_POSITIONS[cId];
      if (!pos) continue;
      const provs = getProvincesForCountry(state.provinces, cId);
      if (provs.length > 0) layouts[cId] = getProvinceLayout(provs, pos);
    }
    return layouts;
  }, [state.countries, state.provinces]);

  const moveTargets = useMemo(() => {
    if (!moveMode || !selectedArmyId) return new Set<string>();
    const army = state.armies[selectedArmyId];
    if (!army) return new Set<string>();
    const prov = state.provinces[army.provinceId];
    return new Set(prov?.adjacentProvinces ?? []);
  }, [moveMode, selectedArmyId, state.armies, state.provinces]);

  const mapContextValue = useMemo(() => ({
    zoom,
    showProvinces,
    showDetails,
    moveMode,
    setMoveMode,
    moveTargets,
    provinceLayouts,
    hoveredCountry,
    setHoveredCountry,
    hoveredProvince,
    setHoveredProvince,
    mousePos,
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
  }), [zoom, showProvinces, showDetails, moveMode, moveTargets, provinceLayouts, hoveredCountry, hoveredProvince, mousePos]);

  return (
    <MapProvider value={mapContextValue}>
      <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none"
        style={{ background: 'hsl(var(--map-water))' }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.4) 100%)' }} />

        <MapRenderer zoom={zoom} pan={pan} isPanning={isPanning} moveMode={moveMode} />
        <MapTooltipLayer isPanning={isPanning} />
        <MapControls zoom={zoom} onZoomIn={() => setZoom(p => Math.min(5, p + 0.4))} onZoomOut={() => setZoom(p => Math.max(0.5, p - 0.4))} onResetView={resetView} />
      </div>
    </MapProvider>
  );
};

export default WorldMap;
