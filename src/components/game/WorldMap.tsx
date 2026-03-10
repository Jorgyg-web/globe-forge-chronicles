import { useGame } from '@/context/GameContext';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MapProvider } from './map/MapContext';
import { DEFAULT_MAP_CAMERA, getDefaultMapSize, getMapCameraViewport, panMapCamera, resetMapCamera, zoomMapCamera } from './map/MapCamera';
import MapRenderer from './map/MapRenderer';
import LabelLayer from './map/LabelLayer';
import MapTooltipLayer from './map/MapTooltipLayer';
import MapControls from './map/MapControls';
import MiniMap from './map/MiniMap';
import { screenToWorld } from './map/mapViewport';
import { getProvinceCentroid } from '@/data/provinceGeometry';
import { ProvinceManager } from '@/map/ProvinceManager';
import { MapLayerMode } from './map/mapConstants';

const WorldMap = () => {
  const { state, selectedCountryId, selectedProvinceId, selectedArmyIds, setSelectedArmyIds, worldLoading,
    setSelectedCountryId, setSelectedProvinceId, setSelectedArmyId, setSelectedBuilding,
    setActivePanel, dispatch } = useGame();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayerMode>('political');
  const [camera, setCamera] = useState(DEFAULT_MAP_CAMERA);
  const [isZooming, setIsZooming] = useState(false);
  const cameraRef = useRef(camera);
  const zoomEndTimeoutRef = useRef<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  // Track the mouse-down position and camera snapshot for anchor-based panning
  const panAnchorRef = useRef<{ mouseX: number; mouseY: number; cam: typeof camera } | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState(getDefaultMapSize());
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

  const showProvinces = camera.zoom >= 4;
  const showDetails = camera.zoom > 6;

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

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
  }, [worldLoading]);

  const applyZoomAtPoint = useCallback((nextZoom: number, anchor: { x: number; y: number }) => {
    setIsZooming(true);
    if (zoomEndTimeoutRef.current != null) {
      window.clearTimeout(zoomEndTimeoutRef.current);
    }

    setCamera(currentCamera => zoomMapCamera(currentCamera, nextZoom, anchor, containerSize));

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
    applyZoomAtPoint(cameraRef.current.zoom * zoomFactor, {
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
  }, [handleWheel, worldLoading]);

  useEffect(() => () => {
    if (zoomEndTimeoutRef.current != null) {
      window.clearTimeout(zoomEndTimeoutRef.current);
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    setDragStartPos({ x: localX, y: localY });
    if (e.button === 0 && !moveMode) {
      setIsPanning(true);
      // Snapshot mouse position and camera for anchor-based panning
      panAnchorRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        cam: { ...cameraRef.current },
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isPanning && panAnchorRef.current) {
      // Compute screen-pixel delta from the original mouse-down position
      const dx = e.clientX - panAnchorRef.current.mouseX;
      const dy = e.clientY - panAnchorRef.current.mouseY;
      // Apply delta to the snapshot camera (avoids cumulative drift)
      setCamera(panMapCamera(panAnchorRef.current.cam, { x: dx, y: dy }, containerSize));
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

    // Pixel-based province/country hover detection via ProvinceManager
    if (!isPanning) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const world = screenToWorld({ x: localX, y: localY }, cameraRef.current, containerSize);
        const provId = ProvinceManager.getInstance().getProvinceAtWorld(world.x, world.y);
        if (provId !== hoveredProvince) {
          setHoveredProvince(provId);
          if (provId) {
            const prov = state.provinces[provId];
            setHoveredCountry(prov?.countryId ?? null);
          } else {
            setHoveredCountry(null);
          }
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const wasPanning = isPanning;
    setIsPanning(false);
    panAnchorRef.current = null;

    // Box selection for armies
    if (selectionBox && dragStartPos && !moveMode) {
      if (containerRef.current) {
        const currentCam = cameraRef.current;
        const topLeft = screenToWorld({ x: selectionBox.x, y: selectionBox.y }, currentCam, containerSize);
        const bottomRight = screenToWorld({ x: selectionBox.x + selectionBox.w, y: selectionBox.y + selectionBox.h }, currentCam, containerSize);
        const svgX = Math.min(topLeft.x, bottomRight.x);
        const svgY = Math.min(topLeft.y, bottomRight.y);
        const svgW = Math.abs(bottomRight.x - topLeft.x);
        const svgH = Math.abs(bottomRight.y - topLeft.y);
        const selectedIds = Object.values(state.armies)
          .filter(army => {
            const centroid = getProvinceCentroid(army.provinceId);
            return centroid.x >= svgX && centroid.x <= svgX + svgW &&
                   centroid.y >= svgY && centroid.y <= svgY + svgH;
          })
          .map(a => a.id);
        setSelectedArmyIds(selectedIds);
      }
      setSelectionBox(null);
      setDragStartPos(null);
      return;
    }

    // Click (not drag) — pixel-based province/country selection
    if (dragStartPos && !selectionBox) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const dx = localX - dragStartPos.x;
        const dy = localY - dragStartPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= dragThreshold) {
          // This is a click — detect province via pixel lookup
          const world = screenToWorld({ x: localX, y: localY }, cameraRef.current, containerSize);
          const provId = ProvinceManager.getInstance().getProvinceAtWorld(world.x, world.y);
          if (provId) {
            const prov = state.provinces[provId];
            if (prov) {
              if (moveMode && selectedArmyIds.length > 0) {
                // Move armies to clicked province
                for (const armyId of selectedArmyIds) {
                  dispatch({ type: 'MOVE_ARMY', armyId, targetProvinceId: provId });
                }
              } else if (showProvinces) {
                // Zoomed in: select province + country
                setSelectedArmyId(null);
                setSelectedArmyIds([]);
                setSelectedBuilding(null);
                setSelectedCountryId(prov.countryId);
                setSelectedProvinceId(provId);
                setActivePanel('info');
              } else {
                // Zoomed out: select country only
                setSelectedArmyId(null);
                setSelectedArmyIds([]);
                setSelectedBuilding(null);
                setSelectedCountryId(prov.countryId);
                setSelectedProvinceId(null);
                setActivePanel('info');
              }
            }
          }
        }
      }
    }

    setSelectionBox(null);
    setDragStartPos(null);
  };
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    panAnchorRef.current = null;
    setSelectionBox(null);
    setDragStartPos(null);
    setHoveredProvince(null);
    setHoveredCountry(null);
  }, []);

  const resetView = () => { setCamera(resetMapCamera()); };

  const handleMiniMapNavigate = useCallback((nextCenter: { x: number; y: number }) => {
    setCamera(current => ({
      ...current,
      centerX: nextCenter.x,
      centerY: nextCenter.y,
    }));
  }, []);

  const zoomByStep = useCallback((factor: number) => {
    applyZoomAtPoint(cameraRef.current.zoom * factor, {
      x: containerSize.width / 2,
      y: containerSize.height / 2,
    });
  }, [applyZoomAtPoint, containerSize.height, containerSize.width]);

  const viewport = useMemo(
    () => getMapCameraViewport(camera, containerSize),
    [camera, containerSize],
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
    mapLayer,
    setMapLayer,
    zoom: camera.zoom, isZooming, showProvinces, showDetails, moveMode, setMoveMode, moveTargets,
    hoveredCountry, setHoveredCountry, hoveredProvince, setHoveredProvince,
    mousePos, containerRef: containerRef as React.RefObject<HTMLDivElement>,
    viewport,
  }), [mapLayer, camera.zoom, isZooming, showProvinces, showDetails, moveMode, setMoveMode, moveTargets, hoveredCountry, hoveredProvince, mousePos, viewport]);

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
        style={{
          background: 'hsl(var(--map-water))',
          cursor: moveMode ? 'crosshair' : isPanning ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}>
        <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.4) 100%)' }} />
        <MapRenderer
          camera={camera}
          containerSize={containerSize}
          provinces={state.provinces}
          countries={state.countries}
          armies={state.armies}
          activeBattles={state.activeBattles}
          playerCountryId={state.playerCountryId}
          selectedCountryId={selectedCountryId}
          selectedProvinceId={selectedProvinceId}
          selectedArmyIds={selectedArmyIds}
          hoveredProvinceId={hoveredProvince}
          moveTargets={moveTargets}
          mapLayer={mapLayer}
          showProvinceBorders={camera.zoom >= 1.5}
          showDetails={showDetails}
        />
        <LabelLayer camera={camera} containerSize={containerSize} />
        <MapTooltipLayer isPanning={isPanning} />
        <MapControls zoom={camera.zoom} onZoomIn={() => zoomByStep(1.2)} onZoomOut={() => zoomByStep(1 / 1.2)} onResetView={resetView} />
        <MiniMap camera={camera} onNavigate={handleMiniMapNavigate} />
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
