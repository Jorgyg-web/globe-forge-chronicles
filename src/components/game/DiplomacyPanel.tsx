import { useGame } from '@/context/GameContext';
import { CountryId } from '@/types/game';
import { Globe, Handshake, ShieldAlert, Ban, ArrowRightLeft, Swords, Flag } from 'lucide-react';

const DiplomacyPanel = () => {
  const { state, dispatch, setSelectedCountryId } = useGame();
  const country = state.countries[state.playerCountryId];
  const relations = Object.entries(country.diplomacy.relations).sort(([, a], [, b]) => b - a);

  const isAtWar = (otherId: CountryId) =>
    state.wars.some(w => w.active && (
      (w.attackers.includes(state.playerCountryId) && w.defenders.includes(otherId)) ||
      (w.defenders.includes(state.playerCountryId) && w.attackers.includes(otherId))
    ));

  const hasEmbargo = (otherId: CountryId) => country.diplomacy.embargoes.includes(otherId);

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Globe size={14} className="text-primary" />
        Diplomacy
      </h2>

      {state.alliances.filter(a => a.members.includes(state.playerCountryId)).length > 0 && (
        <div className="game-panel">
          <div className="game-panel-header">
            <Handshake size={11} className="text-primary/70" />
            <h3>Alliances</h3>
          </div>
          <div className="p-3 space-y-1.5">
            {state.alliances.filter(a => a.members.includes(state.playerCountryId)).map(a => (
              <div key={a.id} className="flex items-center justify-between">
                <span className="text-xs text-foreground">{a.name}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${a.type === 'military' ? 'bg-danger/10 text-danger' : a.type === 'economic' ? 'bg-success/10 text-success' : 'bg-info/10 text-info'}`}>
                  {a.type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="game-panel">
        <div className="game-panel-header">
          <Globe size={11} className="text-primary/70" />
          <h3>Relations</h3>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">{relations.length} nations</span>
        </div>
        <div className="divide-y divide-border/20">
          {relations.map(([otherId, rel]) => {
            const other = state.countries[otherId];
            if (!other) return null;
            const atWar = isAtWar(otherId);
            const embargo = hasEmbargo(otherId);

            return (
              <div key={otherId} className="p-2.5 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setSelectedCountryId(otherId)}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-mono font-bold"
                      style={{ backgroundColor: other.color + '30', color: other.color }}>{other.code}</div>
                    <span className="text-xs font-medium text-foreground">{other.name}</span>
                    {atWar && <span className="text-[9px] px-1.5 py-0.5 bg-danger/15 text-danger rounded font-mono font-semibold border border-danger/20">WAR</span>}
                    {embargo && <span className="text-[9px] px-1.5 py-0.5 bg-warning/15 text-warning rounded font-mono font-semibold border border-warning/20">EMBARGO</span>}
                  </div>
                  <span className={`text-xs font-mono font-bold tabular-nums ${rel > 50 ? 'text-stat-positive' : rel < -50 ? 'text-stat-negative' : 'text-foreground'}`}>
                    {rel > 0 ? '+' : ''}{rel.toFixed(0)}
                  </span>
                </div>

                <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-2 relative">
                  <div className="absolute left-1/2 top-0 w-px h-full bg-border/50" />
                  <div className={`h-full rounded-full transition-all ${rel > 0 ? 'bg-success' : 'bg-danger'}`}
                    style={{ width: `${Math.abs(rel) / 2}%`, marginLeft: rel > 0 ? '50%' : `${50 - Math.abs(rel) / 2}%` }} />
                </div>

                <div className="flex gap-1 flex-wrap">
                  {!atWar && rel < -20 && (
                    <ActionBtn icon={<Swords size={9} />} label="War" danger onClick={() => dispatch({ type: 'DECLARE_WAR', attackerId: state.playerCountryId, defenderId: otherId })} />
                  )}
                  {atWar && (
                    <ActionBtn icon={<Flag size={9} />} label="Peace" onClick={() => dispatch({ type: 'OFFER_PEACE', fromId: state.playerCountryId, toId: otherId })} />
                  )}
                  {!atWar && rel > 30 && (
                    <ActionBtn icon={<Handshake size={9} />} label="Alliance" onClick={() => dispatch({ type: 'PROPOSE_ALLIANCE', fromId: state.playerCountryId, toId: otherId, allianceType: 'military' })} />
                  )}
                  {!atWar && rel >= 0 && (
                    <ActionBtn icon={<ArrowRightLeft size={9} />} label="Trade" onClick={() => dispatch({ type: 'PROPOSE_TRADE', fromId: state.playerCountryId, toId: otherId, value: 1000 })} />
                  )}
                  {!embargo ? (
                    <ActionBtn icon={<Ban size={9} />} label="Embargo" danger onClick={() => dispatch({ type: 'SET_EMBARGO', countryId: state.playerCountryId, targetId: otherId })} />
                  ) : (
                    <ActionBtn icon={<ShieldAlert size={9} />} label="Lift" onClick={() => dispatch({ type: 'REMOVE_EMBARGO', countryId: state.playerCountryId, targetId: otherId })} />
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

const ActionBtn = ({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={danger ? 'game-btn-danger flex items-center gap-1' : 'game-btn-secondary flex items-center gap-1'}>
    {icon}{label}
  </button>
);

export default DiplomacyPanel;
