import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { UNIT_STATS } from '@/data/unitStats';
import { UnitType } from '@/types/game';
import { useState } from 'react';
import { Swords, Shield, Factory, Users, Target, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const MilitaryPanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const mil = country.military;
  const [buildQty, setBuildQty] = useState<Record<string, number>>({});
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  const totalUnits = Object.values(mil.units).reduce((s, v) => s + v, 0);

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Swords size={14} className="text-primary" />
        Military Command
      </h2>

      {/* Status grid */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat icon={<Users size={11} />} label="Units" value={formatNumber(totalUnits)} />
        <MiniStat icon={<Shield size={11} />} label="Bases" value={mil.bases.toString()} />
        <MiniStat icon={<Factory size={11} />} label="Factories" value={mil.factories.toString()} />
      </div>

      {/* Morale & Readiness bars */}
      <div className="game-panel">
        <div className="p-3 space-y-2">
          <StatusBar label="Morale" value={mil.morale} icon={<Target size={10} />} />
          <StatusBar label="Readiness" value={mil.readiness} icon={<Shield size={10} />} />
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Available Manpower</span>
            <span className="font-mono text-foreground">{formatNumber(mil.manpower)}</span>
          </div>
        </div>
      </div>

      {/* Build Infrastructure */}
      <div className="flex gap-2">
        <button
          onClick={() => dispatch({ type: 'BUILD_BASE', countryId: state.playerCountryId })}
          className="flex-1 game-btn-secondary flex items-center justify-center gap-1.5 py-2"
        >
          <Shield size={11} />
          Build Base ($500)
        </button>
        <button
          onClick={() => dispatch({ type: 'BUILD_FACTORY', countryId: state.playerCountryId })}
          className="flex-1 game-btn-secondary flex items-center justify-center gap-1.5 py-2"
        >
          <Factory size={11} />
          Build Factory ($300)
        </button>
      </div>

      {/* Units */}
      <div className="game-panel">
        <div className="game-panel-header">
          <Swords size={11} className="text-primary/70" />
          <h3>Units</h3>
          <span className="text-[10px] font-mono text-muted-foreground ml-auto">{formatNumber(totalUnits)} total</span>
        </div>
        <div className="divide-y divide-border/30">
          {(Object.entries(mil.units) as [UnitType, number][]).map(([type, count]) => {
            const stats = UNIT_STATS[type];
            const qty = buildQty[type] || 10;
            const isExpanded = expandedUnit === type;
            return (
              <div key={type} className="p-2.5 hover:bg-muted/30 transition-colors">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedUnit(isExpanded ? null : type)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base w-6 text-center">{stats.icon}</span>
                    <div>
                      <span className="text-xs font-medium text-foreground">{stats.name}</span>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono">
                        <span>ATK:{stats.attack}</span>
                        <span>DEF:{stats.defense}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-foreground tabular-nums">{formatNumber(count)}</span>
                    {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-border/30 animate-fade-up space-y-2">
                    {stats.strongAgainst.length > 0 && (
                      <p className="text-[10px] text-stat-positive">
                        ✦ Strong vs: {stats.strongAgainst.map(t => UNIT_STATS[t].name).join(', ')}
                      </p>
                    )}
                    {stats.weakAgainst.length > 0 && (
                      <p className="text-[10px] text-stat-negative">
                        ✧ Weak vs: {stats.weakAgainst.map(t => UNIT_STATS[t].name).join(', ')}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={qty}
                        onChange={e => setBuildQty(p => ({ ...p, [type]: parseInt(e.target.value) || 1 }))}
                        className="w-16 bg-muted border border-border rounded-md px-2 py-1 text-xs font-mono text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'BUILD_UNITS', countryId: state.playerCountryId, unitType: type, quantity: qty }); }}
                        disabled={mil.factories < 1}
                        className="game-btn-primary disabled:opacity-30"
                      >
                        Build ${formatNumber(stats.cost * qty)}
                      </button>
                      {mil.factories < 1 && (
                        <span className="text-[9px] text-stat-negative flex items-center gap-0.5">
                          <AlertTriangle size={9} />
                          Need factory
                        </span>
                      )}
                    </div>
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

const StatusBar = ({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) => (
  <div>
    <div className="flex justify-between items-center text-[10px] mb-1">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`font-mono font-semibold ${value > 60 ? 'text-stat-positive' : value < 35 ? 'text-stat-negative' : 'text-foreground'}`}>
        {value.toFixed(0)}%
      </span>
    </div>
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${value > 60 ? 'bg-success' : value < 35 ? 'bg-danger' : 'bg-primary'}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export default MilitaryPanel;
