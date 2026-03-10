import React, { useMemo, useRef, useState } from 'react';
import { useGame } from '@/context/GameContext';
import { getCachedWorldData } from '@/map/worldGenerator';

import { CameraState, MAP_WORLD_HEIGHT, MAP_WORLD_WIDTH, cameraToViewBox, clampCenter } from './mapViewport';

interface MiniMapProps {
  camera: CameraState;
  onNavigate: (nextCenter: { x: number; y: number }) => void;
}

const MINI_MAP_WIDTH = 220;
const MINI_MAP_HEIGHT = 124;

const MiniMap: React.FC<MiniMapProps> = ({ camera, onNavigate }) => {
  const { state } = useGame();
  const worldData = getCachedWorldData();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const countryPaths = useMemo(() => {
    if (!worldData) return [];

    return Object.entries(worldData.countryPaths).map(([id, path]) => ({
      id,
      path,
      color: state.countries[id]?.color ?? 'hsl(var(--map-land))',
    }));
  }, [state.countries, worldData]);

  const viewBox = cameraToViewBox(camera);

  const viewportRect = useMemo(() => {
    const x = Math.max(0, viewBox.x);
    const y = Math.max(0, viewBox.y);
    const maxX = Math.min(MAP_WORLD_WIDTH, viewBox.x + viewBox.w);
    const maxY = Math.min(MAP_WORLD_HEIGHT, viewBox.y + viewBox.h);

    return {
      x,
      y,
      width: Math.max(0, maxX - x),
      height: Math.max(0, maxY - y),
    };
  }, [viewBox.h, viewBox.w, viewBox.x, viewBox.y]);

  const navigateFromPointer = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;
    const worldX = relativeX * MAP_WORLD_WIDTH;
    const worldY = relativeY * MAP_WORLD_HEIGHT;
    const nextCenter = clampCenter(worldX, worldY, camera.zoom);

    onNavigate({ x: nextCenter.centerX, y: nextCenter.centerY });
  };

  if (!worldData) return null;

  return (
    <div className="absolute right-14 bottom-3 z-20 select-none">
      <div className="rounded-lg border border-border/70 bg-card/85 p-2 shadow-lg backdrop-blur-sm">
        <div className="mb-1 px-1 text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Mini Map
        </div>
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-md border border-border/60 bg-background/70 cursor-pointer"
          style={{ width: MINI_MAP_WIDTH, height: MINI_MAP_HEIGHT }}
          onMouseDown={event => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(true);
            navigateFromPointer(event.clientX, event.clientY);
          }}
          onMouseMove={event => {
            if (!isDragging) return;
            event.preventDefault();
            event.stopPropagation();
            navigateFromPointer(event.clientX, event.clientY);
          }}
          onMouseUp={event => {
            event.preventDefault();
            event.stopPropagation();
            setIsDragging(false);
          }}
          onMouseLeave={() => setIsDragging(false)}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            navigateFromPointer(event.clientX, event.clientY);
          }}
        >
          <svg
            viewBox={`0 0 ${MAP_WORLD_WIDTH} ${MAP_WORLD_HEIGHT}`}
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: 'none' }}
          >
            <rect width={MAP_WORLD_WIDTH} height={MAP_WORLD_HEIGHT} fill="hsl(var(--map-water))" opacity={0.9} />
            {countryPaths.map(country => (
              <path
                key={country.id}
                d={country.path}
                fill={country.color}
                fillRule="evenodd"
                opacity={0.9}
                stroke="rgba(15, 23, 42, 0.85)"
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <rect
              x={viewportRect.x}
              y={viewportRect.y}
              width={viewportRect.width}
              height={viewportRect.height}
              fill="rgba(59, 130, 246, 0.12)"
              stroke="rgba(250, 204, 21, 0.96)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MiniMap);