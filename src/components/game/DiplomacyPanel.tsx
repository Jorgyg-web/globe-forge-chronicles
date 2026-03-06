import { useGame } from '@/context/GameContext';
import { CountryId } from '@/types/game';

const DiplomacyPanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const relations = Object.entries(country.diplomacy.relations)
    .sort(([, a], [, b]) => b - a);

  const isAtWar = (otherId: CountryId) =>
    state.wars.some(w => w.active && (
      (w.attackers.includes(state.playerCountryId) && w.defenders.includes(otherId)) ||
      (w.defenders.includes(state.playerCountryId) && w.attackers.includes(otherId))
    ));

  const hasEmbargo = (otherId: CountryId) => country.diplomacy.embargoes.includes(otherId);

  const getRelColor = (rel: number) => {
    if (rel > 50) return 'text-stat-positive';
    if (rel > 0) return 'text-foreground';
    if (rel > -50) return 'text-stat-neutral';
    return 'text-stat-negative';
  };

  const getRelBar = (rel: number) => {
    const pct = ((rel + 100) / 200) * 100;
    return pct;
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin h-full">
      <h2 className="text-sm font-bold text-foreground">Diplomacy</h2>

      {/* Alliances */}
      {state.alliances.filter(a => a.members.includes(state.playerCountryId)).length > 0 && (
        <div className="border border-border rounded-md overflow-hidden">
          <div className="bg-panel-header px-3 py-1.5 border-b border-border">
            <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Alliances</h3>
          </div>
          <div className="p-3 space-y-1">
            {state.alliances.filter(a => a.members.includes(state.playerCountryId)).map(a => (
              <div key={a.id} className="text-xs text-foreground">
                {a.name} <span className="text-muted-foreground">({a.type})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relations */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Relations</h3>
        </div>
        <div className="divide-y divide-border/50">
          {relations.map(([otherId, rel]) => {
            const other = state.countries[otherId];
            if (!other) return null;
            const atWar = isAtWar(otherId);
            const embargo = hasEmbargo(otherId);

            return (
              <div key={otherId} className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{other.name}</span>
                    {atWar && <span className="text-[10px] px-1.5 py-0.5 bg-danger/20 text-danger rounded font-mono">WAR</span>}
                    {embargo && <span className="text-[10px] px-1.5 py-0.5 bg-warning/20 text-warning rounded font-mono">EMBARGO</span>}
                  </div>
                  <span className={`text-xs font-mono font-bold ${getRelColor(rel)}`}>
                    {rel > 0 ? '+' : ''}{rel.toFixed(0)}
                  </span>
                </div>

                {/* Relation bar */}
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${rel > 0 ? 'bg-success' : 'bg-danger'}`}
                    style={{ width: `${getRelBar(rel)}%` }}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-wrap">
                  {!atWar && rel < -20 && (
                    <ActionBtn label="Declare War" danger onClick={() => dispatch({ type: 'DECLARE_WAR', attackerId: state.playerCountryId, defenderId: otherId })} />
                  )}
                  {!atWar && rel > 30 && (
                    <ActionBtn label="Propose Alliance" onClick={() => dispatch({ type: 'PROPOSE_ALLIANCE', fromId: state.playerCountryId, toId: otherId, allianceType: 'military' })} />
                  )}
                  {!atWar && rel >= 0 && (
                    <ActionBtn label="Trade Agreement" onClick={() => dispatch({ type: 'PROPOSE_TRADE', fromId: state.playerCountryId, toId: otherId, value: 1000 })} />
                  )}
                  {!embargo ? (
                    <ActionBtn label="Set Embargo" danger onClick={() => dispatch({ type: 'SET_EMBARGO', countryId: state.playerCountryId, targetId: otherId })} />
                  ) : (
                    <ActionBtn label="Remove Embargo" onClick={() => dispatch({ type: 'REMOVE_EMBARGO', countryId: state.playerCountryId, targetId: otherId })} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ActionBtn = ({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
      danger
        ? 'border-danger/50 text-danger hover:bg-danger/10'
        : 'border-border text-foreground hover:bg-muted'
    }`}
  >
    {label}
  </button>
);

export default DiplomacyPanel;
