import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useMapContext } from './MapContext';
import { UNIT_STATS } from '@/data/unitStats';
import { MAP_LAYER_OPTIONS } from './mapConstants';

interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ zoom, onZoomIn, onZoomOut, onResetView }) => {
  const { state, selectedArmyId } = useGame();
  const { mapLayer, setMapLayer, moveMode, setMoveMode } = useMapContext();

  const selectedArmy = selectedArmyId ? state.armies[selectedArmyId] : null;

  return (
    <>
      {moveMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg bg-primary/90 text-primary-foreground text-xs font-mono font-semibold flex items-center gap-2 animate-pulse">
          🎯 SELECT TARGET PROVINCE
          <button onClick={() => setMoveMode(false)} className="ml-2 px-2 py-0.5 bg-primary-foreground/20 rounded text-[10px]">Cancel</button>
        </div>
      )}

      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1">
        <button onClick={onZoomIn} className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all"><ZoomIn size={14} /></button>
        <button onClick={onZoomOut} className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all"><ZoomOut size={14} /></button>
        <button onClick={onResetView} className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all"><Maximize2 size={14} /></button>
      </div>

      {selectedArmy && !moveMode && (
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

      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
        <span className="text-[10px] font-mono text-muted-foreground bg-card/60 backdrop-blur-sm px-2 py-1 rounded-md border border-border/50">{(zoom * 100).toFixed(0)}%</span>
      </div>

      <div className="absolute top-3 left-3 z-20 rounded-lg border border-border/60 bg-card/85 p-1.5 backdrop-blur-sm">
        <div className="mb-1 px-1 text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Map Layer</div>
        <div className="flex flex-wrap gap-1">
          {MAP_LAYER_OPTIONS.map(layer => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setMapLayer(layer.id)}
              className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                mapLayer === layer.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default React.memo(MapControls);
