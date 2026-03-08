import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { UNIT_STATS, ALL_UNIT_TYPES } from '@/data/unitStats';
import { UnitType, BuildingType } from '@/types/game';
import { getProvincesForCountry } from '@/data/provinces';
import { useState } from 'react';
import { Swords, Shield, Factory, Users, Target, ChevronDown, ChevronUp, AlertTriangle, MapPin, ArrowRight, Move, Combine, Scissors } from 'lucide-react';

const MilitaryPanel = () => {
  const { state, dispatch, selectedArmyId, setSelectedArmyId } = useGame();
  const country = state.countries[state.playerCountryId];
  const provs = getProvincesForCountry(state.provinces, state.playerCountryId);
  const myArmies = Object.values(state.armies).filter(a => a.countryId === state.playerCountryId);
  const totalUnits = myArmies.reduce((s, a) => s + a.units.reduce((s2, u) => s2 + u.count, 0), 0);

  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [prodProvince, setProdProvince] = useState<string | null>(null);
  const [prodQty, setProdQty] = useState(5);
  const [expandedArmy, setExpandedArmy] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<string>('');

  const availableUnits = ALL_UNIT_TYPES.filter(ut => {
    const stats = UNIT_STATS[ut];
    if (stats.requiredResearch && !country.technology.researched.includes(stats.requiredResearch)) return false;
    return true;
  });

  const provsWithBuilding = (buildingType: BuildingType) =>
    provs.filter(p => p.buildings.some(b => b.type === buildingType));

  // Active battles involving player
  const activeBattles = (state.activeBattles ?? []).filter(
    b => b.attackerCountryId === state.playerCountryId || b.defenderCountryId === state.playerCountryId
  );

  // Supply cost
  const supplyCost = myArmies.reduce((s, a) => s + a.units.reduce((s2, u) => s2 + UNIT_STATS[u.type].supplyUsage * u.count, 0), 0);

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Swords size={14} className="text-primary" />
        Military Command
      </h2>

      <div className="grid grid-cols-4 gap-2">
        <MiniStat icon={<Users size={11} />} label="Units" value={formatNumber(totalUnits)} />
        <MiniStat icon={<Shield size={11} />} label="Armies" value={String(myArmies.length)} />
        <MiniStat icon={<Target size={11} />} label="Morale" value={`${country.militaryMorale.toFixed(0)}%`} />
        <MiniStat icon={<Factory size={11} />} label="Supply" value={`${supplyCost}/t`} />
      </div>

      {/* Active Battles */}
      {activeBattles.length > 0 && (
        <div className="game-panel border-danger/30">
          <div className="game-panel-header" style={{ background: 'linear-gradient(180deg, hsl(0 72% 51% / 0.1) 0%, transparent 100%)' }}>
            <AlertTriangle size={11} className="text-danger" />
            <h3 className="!text-danger">Active Battles ({activeBattles.length})</h3>
          </div>
          <div className="p-2 space-y-1">
            {activeBattles.map((b, i) => (
              <div key={i} className="flex items-center justify-between text-[10px] px-1.5 py-1 rounded bg-danger/5">
                <span className="text-foreground">⚔ {state.provinces[b.provinceId]?.name}</span>
                <span className="text-muted-foreground font-mono">
                  {state.countries[b.attackerCountryId]?.code} vs {state.countries[b.defenderCountryId]?.code}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Armies */}
      <div className="game-panel">
        <div className="game-panel-header">
          <Shield size={11} className="text-primary/70" />
          <h3>Armies</h3>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">{myArmies.length}</span>
        </div>
        <div className="divide-y divide-border/20">
          {myArmies.length === 0 && <p className="p-3 text-[10px] text-muted-foreground">No armies. Produce units first.</p>}
          {myArmies.map(army => {
            const isExpanded = expandedArmy === army.id;
            const isSelected = selectedArmyId === army.id;
            const currentProv = state.provinces[army.provinceId];
            const adjacentProvs = currentProv?.adjacentProvinces.map(id => state.provinces[id]).filter(Boolean) ?? [];
            const totalHP = army.units.reduce((s, u) => s + u.health * u.count, 0);
            const totalCount = army.units.reduce((s, u) => s + u.count, 0);
            const avgHP = totalCount > 0 ? totalHP / totalCount : 0;

            return (
              <div key={army.id} className={`p-2.5 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                <div className="flex items-center justify-between mb-1 cursor-pointer"
                  onClick={() => { setExpandedArmy(isExpanded ? null : army.id); setSelectedArmyId(army.id); }}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${army.targetProvinceId ? 'bg-warning animate-pulse' : 'bg-success'}`} />
                    <span className="text-xs font-medium text-foreground">{army.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin size={9} /> {currentProv?.name}
                    </span>
                    {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </div>
                </div>

                <div className="flex gap-1 flex-wrap text-[9px]">
                  {army.units.map(u => (
                    <span key={u.type} className="px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                      {UNIT_STATS[u.type].icon} {u.count}
                    </span>
                  ))}
                </div>

                {/* Health bar */}
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${avgHP}%`, background: avgHP > 60 ? 'hsl(var(--success))' : avgHP > 30 ? 'hsl(var(--warning))' : 'hsl(var(--danger))' }} />
                  </div>
                  <span className="text-[8px] font-mono text-muted-foreground">{avgHP.toFixed(0)}%</span>
                </div>

                {army.targetProvinceId && (
                  <div className="text-[9px] text-primary mt-1 flex items-center gap-1">
                    <ArrowRight size={8} /> Moving to {state.provinces[army.targetProvinceId]?.name} ({(army.movementProgress * 100).toFixed(0)}%)
                  </div>
                )}

                {isExpanded && !army.targetProvinceId && (
                  <div className="mt-2 pt-2 border-t border-border/30 space-y-2 animate-fade-up">
                    {/* Move */}
                    <div className="flex items-center gap-1">
                      <Move size={10} className="text-muted-foreground" />
                      <select value={moveTarget} onChange={e => setMoveTarget(e.target.value)}
                        className="flex-1 bg-muted border border-border rounded px-2 py-1 text-[10px] text-foreground outline-none">
                        <option value="">Move to...</option>
                        {adjacentProvs.map(p => (
                          <option key={p!.id} value={p!.id}>
                            {p!.name} ({p!.terrain}) - {state.countries[p!.countryId]?.code}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => { if (moveTarget) dispatch({ type: 'MOVE_ARMY', armyId: army.id, targetProvinceId: moveTarget }); setMoveTarget(''); }}
                        disabled={!moveTarget} className="game-btn-primary text-[9px] py-1 disabled:opacity-30">Go</button>
                    </div>

                    {/* Merge with other armies in same province */}
                    {myArmies.filter(a => a.id !== army.id && a.provinceId === army.provinceId && !a.targetProvinceId).length > 0 && (
                      <button onClick={() => {
                        const others = myArmies.filter(a => a.id !== army.id && a.provinceId === army.provinceId && !a.targetProvinceId);
                        dispatch({ type: 'MERGE_ARMIES', armyIds: [army.id, ...others.map(a => a.id)] });
                      }} className="game-btn-secondary w-full text-[9px] py-1 flex items-center justify-center gap-1">
                        <Combine size={9} /> Merge with nearby armies
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Unit Roster */}
      <div className="game-panel">
        <div className="game-panel-header">
          <Swords size={11} className="text-primary/70" />
          <h3>Recruit Units</h3>
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
                        {stats.range > 0 && <span className="text-info">RNG:{stats.range}</span>}
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
                      Supply: {stats.supplyUsage}/unit · HP: {stats.health}
                      {stats.range >= 2 && <span className="text-info ml-1">· Ranged bombardment</span>}
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
