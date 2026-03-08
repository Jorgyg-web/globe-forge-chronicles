import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useMapContext } from './MapContext';
import { UNIT_STATS } from '@/data/unitStats';

interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ zoom, onZoomIn, onZoomOut, onResetView }) => {
  const { state, selectedArmyId } = useGame();
  const { showProvinces, moveMode, setMoveMode } = useMapContext();

  const selectedArmy = selectedArmyId ? state.armies[selectedArmyId] : null;

  return (
    <>
      {/* Move mode indicator */}
      {moveMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-primary/90 text-primary-foreground text-xs font-mono font-semibold flex items-center gap-2 animate-pulse">
          🎯 SELECT TARGET PROVINCE
          <button onClick={() => setMoveMode(false)} className="ml-2 px-2 py-0.5 bg-primary-foreground/20 rounded text-[10px]">Cancel</button>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1">
        <button onClick={onZoomIn} className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all"><ZoomIn size={14} /></button>
        <button onClick={onZoomOut} className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all"><ZoomOut size={14} /></button>
        <button onClick={onResetView} className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all"><Maximize2 size={14} /></button>
      </div>

      {/* Selected army actions */}
      {selectedArmy && !moveMode && showProvinces && (
        <div className="absolute top-3 right-3 z-20 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2 space-y-1">
          <div className="text-[10px] font-mono font-semibold text-foreground">{selectedArmy.name}</div>
          <div className="flex gap-1 flex-wrap text-[9px]">
            {selectedArmy.units.map(u => (
              <span key={u.type} className="px-1 py-0.5 rounded bg-muted/60 text-muted-foreground">
                {UNIT_STATS[u.type].icon}{u.count}
              </span>
            ))}
          </div>
          {!selectedArmy.targetProvinceId && selectedArmy.countryId === state.playerCountryId && (
            <button onClick={() => setMoveMode(true)} className="game-btn-primary w-full text-[9px] py-1">
              🎯 Move Army
            </button>
          )}
        </div>
      )}

      {/* Zoom info */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
        <span className="text-[10px] font-mono text-muted-foreground bg-card/60 backdrop-blur-sm px-2 py-1 rounded-md border border-border/50">{(zoom * 100).toFixed(0)}%</span>
        {!showProvinces && <span className="text-[9px] text-muted-foreground/60 bg-card/40 backdrop-blur-sm px-2 py-1 rounded-md border border-border/30">Zoom in to see provinces</span>}
      </div>
    </>
  );
};

export default React.memo(MapControls);
