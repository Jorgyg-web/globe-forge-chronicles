import { useGame } from '@/context/GameContext';
import { Infrastructure } from '@/types/game';

const INFRA_ITEMS: { key: keyof Infrastructure; label: string; icon: string }[] = [
  { key: 'roads', label: 'Roads & Highways', icon: '🛣️' },
  { key: 'railways', label: 'Railways', icon: '🚄' },
  { key: 'ports', label: 'Ports', icon: '⚓' },
  { key: 'airports', label: 'Airports', icon: '✈️' },
  { key: 'powerPlants', label: 'Power Plants', icon: '⚡' },
  { key: 'communications', label: 'Communications', icon: '📡' },
];

const InfrastructurePanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const infra = country.infrastructure;
  const totalLevel = Object.values(infra).reduce((s, v) => s + v, 0);
  const maxTotal = INFRA_ITEMS.length * 10;

  return (
    <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin h-full">
      <h2 className="text-sm font-bold text-foreground">Infrastructure</h2>

      {/* Overall */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Development Index</h3>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Overall</span>
            <span className="text-xs font-mono text-foreground">{totalLevel}/{maxTotal}</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(totalLevel / maxTotal) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Infrastructure boosts economic growth, logistics, and military mobility.
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Facilities</h3>
        </div>
        <div className="divide-y divide-border/50">
          {INFRA_ITEMS.map(item => {
            const level = infra[item.key];
            const cost = level * 150;
            return (
              <div key={item.key} className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Lv.{level}/10</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${level * 10}%` }} />
                </div>
                <button
                  onClick={() => dispatch({ type: 'UPGRADE_INFRASTRUCTURE', countryId: state.playerCountryId, infra: item.key })}
                  disabled={level >= 10}
                  className="px-3 py-1 bg-muted hover:bg-accent text-foreground text-[10px] font-mono rounded border border-border transition-colors disabled:opacity-50"
                >
                  {level >= 10 ? 'Max Level' : `Upgrade ($${cost})`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InfrastructurePanel;
