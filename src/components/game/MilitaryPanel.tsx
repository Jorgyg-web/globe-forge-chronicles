import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { UNIT_STATS } from '@/data/unitStats';
import { UnitType } from '@/types/game';
import { useState } from 'react';

const MilitaryPanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const mil = country.military;
  const [buildQty, setBuildQty] = useState<Record<string, number>>({});

  const totalUnits = Object.values(mil.units).reduce((s, v) => s + v, 0);

  return (
    <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin h-full">
      <h2 className="text-sm font-bold text-foreground">Military Command</h2>

      {/* Overview */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Status</h3>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          <MiniStat label="Total Units" value={formatNumber(totalUnits)} />
          <MiniStat label="Bases" value={mil.bases.toString()} />
          <MiniStat label="Factories" value={mil.factories.toString()} />
          <MiniStat label="Manpower" value={formatNumber(mil.manpower)} />
          <MiniStat label="Morale" value={`${mil.morale.toFixed(0)}%`} />
          <MiniStat label="Readiness" value={`${mil.readiness.toFixed(0)}%`} />
        </div>
      </div>

      {/* Build Infrastructure */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Military Infrastructure</h3>
        </div>
        <div className="p-3 flex gap-2">
          <button
            onClick={() => dispatch({ type: 'BUILD_BASE', countryId: state.playerCountryId })}
            className="flex-1 px-3 py-2 bg-muted hover:bg-accent text-foreground text-xs rounded-md transition-colors border border-border"
          >
            Build Base ($500)
          </button>
          <button
            onClick={() => dispatch({ type: 'BUILD_FACTORY', countryId: state.playerCountryId })}
            className="flex-1 px-3 py-2 bg-muted hover:bg-accent text-foreground text-xs rounded-md transition-colors border border-border"
          >
            Build Factory ($300)
          </button>
        </div>
      </div>

      {/* Units */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Units</h3>
        </div>
        <div className="divide-y divide-border/50">
          {(Object.entries(mil.units) as [UnitType, number][]).map(([type, count]) => {
            const stats = UNIT_STATS[type];
            const qty = buildQty[type] || 10;
            return (
              <div key={type} className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{stats.icon}</span>
                    <span className="text-xs font-medium text-foreground">{stats.name}</span>
                  </div>
                  <span className="text-xs font-mono text-foreground">{formatNumber(count)}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                  <span>ATK:{stats.attack}</span>
                  <span>DEF:{stats.defense}</span>
                  <span>Cost:${stats.cost}</span>
                </div>
                {stats.strongAgainst.length > 0 && (
                  <p className="text-[10px] text-stat-positive mb-1">
                    Strong vs: {stats.strongAgainst.map(t => UNIT_STATS[t].name).join(', ')}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={qty}
                    onChange={e => setBuildQty(p => ({ ...p, [type]: parseInt(e.target.value) || 1 }))}
                    className="w-16 bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground"
                  />
                  <button
                    onClick={() => dispatch({ type: 'BUILD_UNITS', countryId: state.playerCountryId, unitType: type, quantity: qty })}
                    disabled={mil.factories < 1}
                    className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-mono rounded hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Build (${formatNumber(stats.cost * qty)})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Wars */}
      {state.wars.filter(w => w.active).length > 0 && (
        <div className="border border-danger/50 rounded-md overflow-hidden">
          <div className="bg-danger/10 px-3 py-1.5 border-b border-danger/30">
            <h3 className="text-[10px] font-mono font-semibold text-danger uppercase tracking-wider">Active Wars</h3>
          </div>
          <div className="p-3 space-y-2">
            {state.wars.filter(w => w.active).map(war => (
              <div key={war.id} className="text-xs">
                <span className="text-foreground">
                  {war.attackers.map(id => state.countries[id]?.name).join(', ')} vs {war.defenders.map(id => state.countries[id]?.name).join(', ')}
                </span>
                <span className="text-muted-foreground ml-2">({war.battles.length} battles)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-muted rounded-md p-2">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-sm font-mono font-bold text-foreground">{value}</p>
  </div>
);

export default MilitaryPanel;
