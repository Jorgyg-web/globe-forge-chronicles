import { useGame } from '@/context/GameContext';
import { ConstructionItem } from '@/types/game';
import { Hammer, X, Clock, MapPin, Factory } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const ConstructionPanel = () => {
  const { state, dispatch } = useGame();
  const playerQueue = state.constructionQueue.filter(i => i.countryId === state.playerCountryId);
  const playerProd = state.productionQueue.filter(i => i.countryId === state.playerCountryId);

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <div className="game-panel-header mb-2">
        <Hammer size={12} className="text-primary/70" />
        <h3>Construction & Production</h3>
        <span className="text-[10px] text-muted-foreground ml-auto font-mono">
          {playerQueue.length + playerProd.length} active
        </span>
      </div>

      {playerQueue.length === 0 && playerProd.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
            <Hammer size={20} className="text-muted-foreground/50" />
          </div>
          <p className="text-xs text-muted-foreground">No active projects</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Build in provinces or produce units</p>
        </div>
      )}

      {/* Construction */}
      {playerQueue.length > 0 && (
        <>
          <h3 className="text-[10px] font-mono text-primary uppercase tracking-widest">Buildings</h3>
          {playerQueue.map(item => (
            <QueueItem key={item.id} item={item}
              provinceName={state.provinces[item.provinceId]?.name}
              onCancel={() => dispatch({ type: 'CANCEL_CONSTRUCTION', itemId: item.id })} />
          ))}
        </>
      )}

      {/* Production */}
      {playerProd.length > 0 && (
        <>
          <h3 className="text-[10px] font-mono text-primary uppercase tracking-widest">Unit Production</h3>
          {playerProd.map(item => {
            const progress = ((item.turnsRequired - item.turnsRemaining) / item.turnsRequired) * 100;
            return (
              <div key={item.id} className="game-panel group">
                <div className="px-3 py-2.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-md text-primary bg-primary/10"><Factory size={12} /></span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{item.quantity}x {item.unitType}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin size={8} /> {state.provinces[item.provinceId]?.name}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => dispatch({ type: 'CANCEL_PRODUCTION', itemId: item.id })}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                      <X size={12} />
                    </button>
                  </div>
                  <Progress value={progress} className="h-1.5 bg-muted/30" />
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={8} /> {item.turnsRemaining} turns left</span>
                    <span className="font-mono">{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Summary */}
      {(playerQueue.length + playerProd.length) > 0 && (
        <div className="game-panel">
          <div className="px-3 py-2 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Total projects</span>
              <span className="font-mono text-foreground">{playerQueue.length + playerProd.length}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Next completion</span>
              <span className="font-mono text-foreground">
                {Math.min(...[...playerQueue, ...playerProd].map(i => i.turnsRemaining))} turns
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QueueItem = ({ item, provinceName, onCancel }: { item: ConstructionItem; provinceName?: string; onCancel: () => void }) => {
  const progress = ((item.turnsRequired - item.turnsRemaining) / item.turnsRequired) * 100;
  return (
    <div className="game-panel group">
      <div className="px-3 py-2.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md text-secondary bg-secondary/10"><Hammer size={12} /></span>
            <div>
              <p className="text-xs font-semibold text-foreground capitalize truncate">{item.label}</p>
              {provinceName && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin size={8} /> {provinceName}</p>}
            </div>
          </div>
          <button onClick={onCancel}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
            <X size={12} />
          </button>
        </div>
        <Progress value={progress} className="h-1.5 bg-muted/30" />
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1"><Clock size={8} /> {item.turnsRemaining} turns left</span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ConstructionPanel;
