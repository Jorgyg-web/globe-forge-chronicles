import { useGame } from '@/context/GameContext';
import { Infrastructure } from '@/types/game';
import { Building2, ArrowUp } from 'lucide-react';

const INFRA_ITEMS: { key: keyof Infrastructure; label: string; icon: string; description: string }[] = [
  { key: 'roads', label: 'Roads & Highways', icon: '🛣️', description: 'Improves logistics and trade' },
  { key: 'railways', label: 'Railways', icon: '🚄', description: 'Boosts manufacturing and supply' },
  { key: 'ports', label: 'Ports', icon: '⚓', description: 'Enables overseas trade routes' },
  { key: 'airports', label: 'Airports', icon: '✈️', description: 'Faster military deployment' },
  { key: 'powerPlants', label: 'Power Plants', icon: '⚡', description: 'Powers industry and cities' },
  { key: 'communications', label: 'Communications', icon: '📡', description: 'Improves research and stability' },
];

const InfrastructurePanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const infra = country.infrastructure;
  const totalLevel = Object.values(infra).reduce((s, v) => s + v, 0);
  const maxTotal = INFRA_ITEMS.length * 10;
  const devIndex = (totalLevel / maxTotal) * 100;

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Building2 size={14} className="text-primary" />
        Infrastructure
      </h2>

      {/* Development Index */}
      <div className="game-panel">
        <div className="game-panel-header">
          <Building2 size={11} className="text-primary/70" />
          <h3>Development Index</h3>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Overall Progress</span>
            <span className={`text-sm font-mono font-bold tabular-nums ${
              devIndex > 60 ? 'text-stat-positive' : devIndex < 30 ? 'text-stat-negative' : 'text-foreground'
            }`}>{devIndex.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-700 progress-shimmer"
              style={{ width: `${devIndex}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1.5 font-mono">
            <span>Undeveloped</span>
            <span>{totalLevel}/{maxTotal}</span>
            <span>Advanced</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Items */}
      <div className="space-y-2">
        {INFRA_ITEMS.map(item => {
          const level = infra[item.key];
          const cost = level * 150;
          const isMax = level >= 10;
          return (
            <div key={item.key} className="game-panel group hover:border-border/80 transition-all">
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <div>
                      <span className="text-xs font-medium text-foreground">{item.label}</span>
                      <p className="text-[9px] text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${isMax ? 'text-stat-positive' : 'text-foreground'}`}>
                    {level}/10
                  </span>
                </div>

                {/* Level dots */}
                <div className="flex gap-1 my-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-sm transition-all duration-300 ${
                        i < level ? 'bg-secondary' : 'bg-muted/60'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => dispatch({ type: 'UPGRADE_INFRASTRUCTURE', countryId: state.playerCountryId, infra: item.key })}
                  disabled={isMax}
                  className={`w-full ${isMax ? 'game-btn-secondary opacity-50 cursor-not-allowed' : 'game-btn-primary'} flex items-center justify-center gap-1.5 py-1.5`}
                >
                  {isMax ? (
                    'Maximum Level'
                  ) : (
                    <>
                      <ArrowUp size={10} />
                      Upgrade to Lv.{level + 1} — ${cost}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InfrastructurePanel;
