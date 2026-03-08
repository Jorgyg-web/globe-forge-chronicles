import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { UNIT_STATS, ALL_UNIT_TYPES } from '@/data/unitStats';
import { UnitType, BuildingType } from '@/types/game';
import { getProvincesForCountry } from '@/data/provinces';
import { useState } from 'react';
import { Swords, Shield, Factory, Users, Target, ChevronDown, ChevronUp, AlertTriangle, MapPin, ArrowRight } from 'lucide-react';

const MilitaryPanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const provs = getProvincesForCountry(state.provinces, state.playerCountryId);
  const myArmies = Object.values(state.armies).filter(a => a.countryId === state.playerCountryId);
  const totalUnits = myArmies.reduce((s, a) => s + a.units.reduce((s2, u) => s2 + u.count, 0), 0);

  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [prodProvince, setProdProvince] = useState<string | null>(null);
  const [prodQty, setProdQty] = useState(5);

  // Check which units are available
  const availableUnits = ALL_UNIT_TYPES.filter(ut => {
    const stats = UNIT_STATS[ut];
    if (stats.requiredResearch && !country.technology.researched.includes(stats.requiredResearch)) return false;
    return true;
  });

  // Find provinces with production buildings
  const provsWithBuilding = (buildingType: BuildingType) =>
    provs.filter(p => p.buildings.some(b => b.type === buildingType));

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Swords size={14} className="text-primary" />
        Military Command
      </h2>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat icon={<Users size={11} />} label="Units" value={formatNumber(totalUnits)} />
        <MiniStat icon={<Shield size={11} />} label="Armies" value={String(myArmies.length)} />
        <MiniStat icon={<Target size={11} />} label="Morale" value={`${country.militaryMorale.toFixed(0)}%`} />
      </div>

      {/* Unit roster */}
      <div className="game-panel">
        <div className="game-panel-header">
          <Swords size={11} className="text-primary/70" />
          <h3>Available Units</h3>
        </div>
        <div className="divide-y divide-border/30">
          {availableUnits.map(type => {
            const stats = UNIT_STATS[type];
            const isExpanded = expandedUnit === type;
            const provsForUnit = provsWithBuilding(stats.requiredBuilding);
            const inArmyCount = myArmies.reduce((s, a) => {
              const u = a.units.find(u => u.type === type);
              return s + (u?.count ?? 0);
            }, 0);

            return (
              <div key={type} className="p-2.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => { setExpandedUnit(isExpanded ? null : type); setProdProvince(null); }}>
                  <div className="flex items-center gap-2">
                    <span className="text-base w-6 text-center">{stats.icon}</span>
                    <div>
                      <span className="text-xs font-medium text-foreground">{stats.name}</span>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono">
                        <span>ATK:{stats.attack}</span>
                        <span>DEF:{stats.defense}</span>
                        <span>SPD:{stats.speed}</span>
                        <span>HP:{stats.health}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-foreground tabular-nums">{inArmyCount}</span>
                    {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-border/30 space-y-2 animate-fade-up">
                    <div className="flex gap-2 flex-wrap text-[9px]">
                      <span className="text-stat-positive">Strong vs: {stats.strongVs.join(', ')}</span>
                      {stats.weakVs.length > 0 && <span className="text-stat-negative">Weak vs: {stats.weakVs.join(', ')}</span>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Requires: {stats.requiredBuilding}
                      {stats.requiredResearch && ` · Research: ${stats.requiredResearch}`}
                    </div>

                    {provsForUnit.length === 0 ? (
                      <p className="text-[10px] text-stat-negative flex items-center gap-1">
                        <AlertTriangle size={9} /> No provinces with {stats.requiredBuilding}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <select value={prodProvince ?? ''} onChange={e => setProdProvince(e.target.value)}
                            className="flex-1 bg-muted border border-border rounded px-2 py-1 text-[10px] text-foreground outline-none">
                            <option value="">Select province...</option>
                            {provsForUnit.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input type="number" min={1} max={100} value={prodQty} onChange={e => setProdQty(parseInt(e.target.value) || 1)}
                            className="w-14 bg-muted border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground outline-none" />
                        </div>
                        <button
                          onClick={() => { if (prodProvince) dispatch({ type: 'PRODUCE_UNITS', provinceId: prodProvince, unitType: type, quantity: prodQty }); }}
                          disabled={!prodProvince}
                          className="game-btn-primary w-full disabled:opacity-30"
                        >
                          <Factory size={10} className="inline mr-1" />
                          Produce {prodQty}x ({stats.buildTime}t)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Armies */}
      <div className="game-panel">
        <div className="game-panel-header">
          <Shield size={11} className="text-primary/70" />
          <h3>Armies</h3>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">{myArmies.length}</span>
        </div>
        <div className="divide-y divide-border/20">
          {myArmies.length === 0 && <p className="p-3 text-[10px] text-muted-foreground">No armies. Produce units first.</p>}
          {myArmies.map(army => (
            <div key={army.id} className="p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground">{army.name}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MapPin size={9} /> {state.provinces[army.provinceId]?.name}
                </span>
              </div>
              <div className="flex gap-1 flex-wrap text-[9px]">
                {army.units.map(u => (
                  <span key={u.type} className="px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                    {UNIT_STATS[u.type].icon} {u.count}
                  </span>
                ))}
              </div>
              {army.targetProvinceId && (
                <div className="text-[9px] text-primary mt-1 flex items-center gap-1">
                  <ArrowRight size={8} /> Moving to {state.provinces[army.targetProvinceId]?.name} ({(army.movementProgress * 100).toFixed(0)}%)
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Wars */}
      {state.wars.filter(w => w.active).length > 0 && (
        <div className="game-panel border-danger/30">
          <div className="game-panel-header" style={{ background: 'linear-gradient(180deg, hsl(0 72% 51% / 0.1) 0%, transparent 100%)' }}>
            <AlertTriangle size={11} className="text-danger" />
            <h3 className="!text-danger">Active Wars</h3>
          </div>
          <div className="p-3 space-y-2">
            {state.wars.filter(w => w.active).map(war => (
              <div key={war.id} className="flex items-center justify-between text-xs">
                <span className="text-foreground">
                  {war.attackers.map(id => state.countries[id]?.code).join(', ')} vs {war.defenders.map(id => state.countries[id]?.code).join(', ')}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">{war.battles.length} battles</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Production Queue */}
      {state.productionQueue.filter(i => i.countryId === state.playerCountryId).length > 0 && (
        <div className="game-panel">
          <div className="game-panel-header">
            <Factory size={11} className="text-primary/70" />
            <h3>Production Queue</h3>
          </div>
          <div className="p-3 space-y-1">
            {state.productionQueue.filter(i => i.countryId === state.playerCountryId).map(item => (
              <div key={item.id} className="flex items-center justify-between text-[10px]">
                <span className="text-foreground">{item.quantity}x {UNIT_STATS[item.unitType].name}</span>
                <span className="text-muted-foreground font-mono">{item.turnsRemaining}t · {state.provinces[item.provinceId]?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MiniStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="stat-card">
    <div className="flex items-center gap-1 mb-0.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[9px] text-muted-foreground">{label}</span>
    </div>
    <p className="text-sm font-mono font-bold text-foreground tabular-nums">{value}</p>
  </div>
);

export default MilitaryPanel;
