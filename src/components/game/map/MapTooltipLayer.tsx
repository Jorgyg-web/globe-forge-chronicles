import React from 'react';
import { useGame } from '@/context/GameContext';
import { useMapContext } from './MapContext';
import { TERRAIN_COLORS } from './mapConstants';
import { getProvincesForCountry } from '@/data/provinces';

const MapTooltipLayer: React.FC<{ isPanning: boolean }> = ({ isPanning }) => {
  const { state } = useGame();
  const { hoveredCountry, hoveredProvince, isZooming, moveMode, moveTargets, mousePos, containerRef } = useMapContext();

  const hoveredProvData = hoveredProvince ? state.provinces[hoveredProvince] : null;
  const hoveredData = hoveredCountry && !hoveredProvData ? state.countries[hoveredCountry] : null;

  if (isPanning || isZooming) return null;

  const left = mousePos.x - (containerRef.current?.getBoundingClientRect().left ?? 0) + 16;
  const top = mousePos.y - (containerRef.current?.getBoundingClientRect().top ?? 0) - 10;

  if (hoveredProvData) {
    return (
      <div className="map-tooltip absolute z-20 animate-fade-up" style={{ left: `${left}px`, top: `${top}px` }}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-sm" style={{ background: TERRAIN_COLORS[hoveredProvData.terrain] }} />
          <span className="font-semibold text-foreground text-xs">{hoveredProvData.name}</span>
          <span className="text-[9px] text-muted-foreground capitalize">({hoveredProvData.terrain})</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] font-mono">
          <span className="text-muted-foreground">Owner</span><span className="text-foreground text-right">{state.countries[hoveredProvData.countryId]?.code ?? '??'}</span>
          <span className="text-muted-foreground">Pop</span><span className="text-foreground text-right">{(hoveredProvData.population / 1e6).toFixed(1)}M</span>
          <span className="text-muted-foreground">Morale</span>
          <span className={`text-right ${hoveredProvData.morale > 60 ? 'text-stat-positive' : hoveredProvData.morale > 30 ? 'text-stat-neutral' : 'text-stat-negative'}`}>
            {hoveredProvData.morale.toFixed(0)}%
          </span>
          <span className="text-muted-foreground">Dev</span><span className="text-foreground text-right">{hoveredProvData.development}/100</span>
          <span className="text-muted-foreground">Buildings</span><span className="text-foreground text-right">{hoveredProvData.buildings.length}</span>
        </div>
        {hoveredProvData.buildings.length > 0 && (
          <div className="mt-1 pt-1 border-t border-border/30 text-[9px] text-muted-foreground">
            {hoveredProvData.buildings.map(b => `${b.type}(${b.level})`).join(', ')}
          </div>
        )}
        {moveMode && moveTargets.has(hoveredProvData.id) && (
          <div className="mt-1 pt-1 border-t border-border/30 text-[9px] text-stat-positive font-semibold">
            ✓ Click to move army here
          </div>
        )}
      </div>
    );
  }

  if (hoveredData) {
    return (
      <div className="map-tooltip absolute z-20 animate-fade-up" style={{ left: `${left}px`, top: `${top}px` }}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: hoveredData.color }} />
          <span className="font-semibold text-foreground">{hoveredData.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] font-mono">
          <span className="text-muted-foreground">Pop</span><span className="text-foreground text-right">{(hoveredData.population / 1e6).toFixed(1)}M</span>
          <span className="text-muted-foreground">Stability</span><span className="text-foreground text-right">{hoveredData.stability.toFixed(0)}%</span>
          <span className="text-muted-foreground">Provinces</span><span className="text-foreground text-right">{getProvincesForCountry(state.provinces, hoveredData.id).length}</span>
        </div>
      </div>
    );
  }

  return null;
};

export default React.memo(MapTooltipLayer);
