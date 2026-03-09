import { useGame } from '@/context/GameContext';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MapProvider } from './map/MapContext';
import MapRenderer from './map/MapRenderer';
import MapTooltipLayer from './map/MapTooltipLayer';
import MapControls from './map/MapControls';
import { clampZoom, computeViewportWorldBounds, computeZoomPanAroundPoint, MAP_WORLD_HEIGHT, MAP_WORLD_WIDTH, screenToWorld } from './map/mapViewport';

const WorldMap = () => {
  const { state, selectedArmyIds, setSelectedArmyIds, worldLoading } = useGame();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const zoomEndTimeoutRef = useRef<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: MAP_WORLD_WIDTH, height: MAP_WORLD_HEIGHT });
  const dragThreshold = 5;

  // Auto-activate move mode when a player army is selected and stationary
  const moveMode = useMemo(() => {
    if (selectedArmyIds.length === 0) return false;
    for (const armyId of selectedArmyIds) {
      const army = state.armies[armyId];
      if (!army || army.countryId !== state.playerCountryId || army.targetProvinceId) continue;
      return true;
    }
    return false;
  }, [selectedArmyIds, state.armies, state.playerCountryId]);

  const showProvinces = zoom >= 1.8;
  const showDetails = zoom > 3;

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setContainerSize({
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const applyZoomAtPoint = useCallback((nextZoom: number, anchor: { x: number; y: number }) => {
    setIsZooming(true);
    if (zoomEndTimeoutRef.current != null) {
      window.clearTimeout(zoomEndTimeoutRef.current);
    }

    const nextView = computeZoomPanAroundPoint(
      zoomRef.current,
      clampZoom(nextZoom),
      panRef.current,
      containerSize,
      anchor,
    );

    setZoom(nextView.zoom);
    setPan(nextView.pan);

    zoomEndTimeoutRef.current = window.setTimeout(() => {
      setIsZooming(false);
      zoomEndTimeoutRef.current = null;
    }, 120);
  }, [containerSize]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    applyZoomAtPoint(zoomRef.current * zoomFactor, {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [applyZoomAtPoint]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  useEffect(() => () => {
    if (zoomEndTimeoutRef.current != null) {
      window.clearTimeout(zoomEndTimeoutRef.current);
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    if (e.button === 0 && !moveMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    if (dragStartPos && !isPanning) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const dx = currentX - dragStartPos.x;
      const dy = currentY - dragStartPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > dragThreshold) {
        const x = Math.min(dragStartPos.x, currentX);
        const y = Math.min(dragStartPos.y, currentY);
        const w = Math.abs(dx);
        const h = Math.abs(dy);
        setSelectionBox({ x, y, w, h });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (selectionBox && dragStartPos && !moveMode) {
      if (containerRef.current) {
        const topLeft = screenToWorld({ x: selectionBox.x, y: selectionBox.y }, zoom, pan, containerSize);
        const bottomRight = screenToWorld({ x: selectionBox.x + selectionBox.w, y: selectionBox.y + selectionBox.h }, zoom, pan, containerSize);
        const svgX = Math.min(topLeft.x, bottomRight.x);
        const svgY = Math.min(topLeft.y, bottomRight.y);
        const svgW = Math.abs(bottomRight.x - topLeft.x);
        const svgH = Math.abs(bottomRight.y - topLeft.y);
        const selectedIds = Object.values(state.armies)
          .filter(army => {
            const { getProvinceCentroid } = require('@/data/provinceGeometry');
            const centroid = getProvinceCentroid(army.provinceId);
            return centroid.x >= svgX && centroid.x <= svgX + svgW &&
                   centroid.y >= svgY && centroid.y <= svgY + svgH;
          })
          .map(a => a.id);
        setSelectedArmyIds(selectedIds);
      }
    }
    setSelectionBox(null);
    setDragStartPos(null);
  };
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const zoomByStep = useCallback((factor: number) => {
    applyZoomAtPoint(zoomRef.current * factor, {
      x: containerSize.width / 2,
      y: containerSize.height / 2,
    });
  }, [applyZoomAtPoint, containerSize.height, containerSize.width]);

  const viewport = useMemo(
    () => computeViewportWorldBounds(zoom, pan, containerSize),
    [zoom, pan, containerSize],
  );

  const moveTargets = useMemo(() => {
    if (!moveMode || selectedArmyIds.length === 0) return new Set<string>();
    const targets = new Set<string>();
    for (const armyId of selectedArmyIds) {
      const army = state.armies[armyId];
      if (!army) continue;
      const prov = state.provinces[army.provinceId];
      const provAdj = prov?.adjacentProvinces ?? [];
      provAdj.forEach(id => targets.add(id));
    }
    return targets;
  }, [moveMode, selectedArmyIds, state.armies, state.provinces]);

  const setMoveMode = useCallback((_v: boolean) => {
    // moveMode is now auto-managed via selectedArmyId
  }, []);

  const mapContextValue = useMemo(() => ({
    zoom, isZooming, showProvinces, showDetails, moveMode, setMoveMode, moveTargets,
    hoveredCountry, setHoveredCountry, hoveredProvince, setHoveredProvince,
    mousePos, containerRef: containerRef as React.RefObject<HTMLDivElement>,
    viewport,
  }), [zoom, isZooming, showProvinces, showDetails, moveMode, setMoveMode, moveTargets, hoveredCountry, hoveredProvince, mousePos, viewport]);

  if (worldLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: 'hsl(var(--map-water))' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono text-muted-foreground">Generating world map...</p>
        </div>
      </div>
    );
  }

  return (
    <MapProvider value={mapContextValue}>
      <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none"
        style={{ background: 'hsl(var(--map-water))' }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.4) 100%)' }} />
        <MapRenderer zoom={zoom} pan={pan} isPanning={isPanning} moveMode={moveMode} />
        <MapTooltipLayer isPanning={isPanning} />
        <MapControls zoom={zoom} onZoomIn={() => zoomByStep(1.2)} onZoomOut={() => zoomByStep(1 / 1.2)} onResetView={resetView} />
        {selectionBox && (
          <div
            className="absolute border-2 border-primary bg-primary pointer-events-none"
            style={{
              left: `${selectionBox.x}px`,
              top: `${selectionBox.y}px`,
              width: `${selectionBox.w}px`,
              height: `${selectionBox.h}px`,
              opacity: 0.2,
              borderStyle: 'dashed',
            }}
          />
        )}
        {moveMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-md text-xs font-mono animate-fade-in"
            style={{ background: 'hsl(var(--primary) / 0.9)', color: 'hsl(var(--primary-foreground))' }}>
            ⚔ Select destination province to move {selectedArmyIds.length > 1 ? `${selectedArmyIds.length} armies` : 'army'}
          </div>
        )}
        {!moveMode && selectedArmyIds.length > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-md text-xs font-mono animate-fade-in"
            style={{ background: 'hsl(var(--primary) / 0.9)', color: 'hsl(var(--primary-foreground))' }}>
            📍 {selectedArmyIds.length} army/armies selected (SHIFT+click or drag to multi-select)
          </div>
        )}
      </div>
    </MapProvider>
  );
};

export default WorldMap;
