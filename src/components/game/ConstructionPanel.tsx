import { useGame } from '@/context/GameContext';
import { ConstructionItem } from '@/types/game';
import {
  Hammer, X, Route, TrainFront, Ship, Plane, Zap, Radio,
  Factory, Swords, FlaskConical, Shield, Clock, MapPin,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  roads: <Route size={12} />, railways: <TrainFront size={12} />,
  ports: <Ship size={12} />, airports: <Plane size={12} />,
  powerPlants: <Zap size={12} />, communications: <Radio size={12} />,
  civilian: <Factory size={12} />, military: <Swords size={12} />,
  energy: <Zap size={12} />, research: <FlaskConical size={12} />,
  base: <Shield size={12} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  infrastructure: 'text-primary bg-primary/10',
  industry: 'text-secondary bg-secondary/10',
  military: 'text-stat-negative bg-stat-negative/10',
  unit: 'text-accent bg-accent/10',
};

const ConstructionPanel = () => {
  const { state, dispatch } = useGame();
  const playerQueue = state.constructionQueue.filter(i => i.countryId === state.playerCountryId);

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <div className="game-panel-header mb-2">
        <Hammer size={12} className="text-primary/70" />
        <h3>Construction Queue</h3>
        <span className="text-[10px] text-muted-foreground ml-auto font-mono">
          {playerQueue.length} active
        </span>
      </div>

      {playerQueue.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
            <Hammer size={20} className="text-muted-foreground/50" />
          </div>
          <p className="text-xs text-muted-foreground">No active construction</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Build infrastructure or industry in provinces
          </p>
        </div>
      )}

      {playerQueue.map(item => (
        <QueueItem
          key={item.id}
          item={item}
          provinceName={item.provinceId ? state.provinces[item.provinceId]?.name : undefined}
          onCancel={() => dispatch({ type: 'CANCEL_CONSTRUCTION', itemId: item.id })}
        />
      ))}

      {playerQueue.length > 0 && (
        <div className="game-panel">
          <div className="px-3 py-2 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Total projects</span>
              <span className="font-mono text-foreground">{playerQueue.length}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Next completion</span>
              <span className="font-mono text-foreground">
                {Math.min(...playerQueue.map(i => i.turnsRemaining))} turns
              </span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Total cost</span>
              <span className="font-mono text-foreground">
                ${playerQueue.reduce((s, i) => s + i.cost, 0).toLocaleString()}M
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const QueueItem = ({
  item, provinceName, onCancel,
}: {
  item: ConstructionItem; provinceName?: string; onCancel: () => void;
}) => {
  const progress = ((item.turnsRequired - item.turnsRemaining) / item.turnsRequired) * 100;
  const catColor = CATEGORY_COLORS[item.category] || 'text-muted-foreground bg-muted/20';

  return (
    <div className="game-panel group">
      <div className="px-3 py-2.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`p-1.5 rounded-md ${catColor}`}>
              {TYPE_ICONS[item.type] || <Hammer size={12} />}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground capitalize truncate">
                {item.label}
              </p>
              {provinceName && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MapPin size={8} /> {provinceName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
            title="Cancel"
          >
            <X size={12} />
          </button>
        </div>

        <div className="space-y-1">
          <Progress value={progress} className="h-1.5 bg-muted/30" />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={8} /> {item.turnsRemaining} turns left
            </span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="flex gap-3 text-[9px] text-muted-foreground">
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase ${catColor}`}>
            {item.category}
          </span>
          <span className="font-mono">${item.cost}M</span>
        </div>
      </div>
    </div>
  );
};

export default ConstructionPanel;
