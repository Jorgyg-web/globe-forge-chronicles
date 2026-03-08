import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { UNIT_STATS, ALL_UNIT_TYPES } from '@/data/unitStats';
import { getProvincesForCountry } from '@/data/provinces';
import { Factory, MapPin, Swords } from 'lucide-react';
import { useState } from 'react';

const ProductionPanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const provs = getProvincesForCountry(state.provinces, state.playerCountryId);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedProv, setSelectedProv] = useState<string | null>(null);
  const [qty, setQty] = useState(5);

  const availableUnits = ALL_UNIT_TYPES.filter(ut => {
    const stats = UNIT_STATS[ut];
    if (stats.requiredResearch && !country.technology.researched.includes(stats.requiredResearch)) return false;
    return true;
  });

  const selectedStats = selectedType ? UNIT_STATS[selectedType as keyof typeof UNIT_STATS] : null;
  const validProvs = selectedStats ? provs.filter(p => p.buildings.some(b => b.type === selectedStats.requiredBuilding)) : [];

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <Factory size={14} className="text-primary" />
        Unit Production
      </h2>

      {/* Unit selection */}
      <div className="game-panel">
        <div className="game-panel-header">
          <Swords size={11} className="text-primary/70" />
          <h3>Select Unit</h3>
        </div>
        <div className="p-2 grid grid-cols-2 gap-1">
          {availableUnits.map(type => {
            const stats = UNIT_STATS[type];
            const isSelected = selectedType === type;
            return (
              <button key={type} onClick={() => { setSelectedType(type); setSelectedProv(null); }}
                className={`flex items-center gap-2 p-2 rounded text-left transition-all ${isSelected ? 'bg-primary/15 border border-primary/30' : 'hover:bg-muted/30 border border-transparent'}`}>
                <span className="text-base">{stats.icon}</span>
                <div>
                  <span className="text-[10px] font-medium text-foreground block">{stats.name}</span>
                  <span className="text-[8px] text-muted-foreground font-mono">ATK:{stats.attack} DEF:{stats.defense}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Production form */}
      {selectedStats && (
        <div className="game-panel">
          <div className="game-panel-header">
            <Factory size={11} className="text-primary/70" />
            <h3>Produce {selectedStats.name}</h3>
          </div>
          <div className="p-3 space-y-2">
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <div>Build time: {selectedStats.buildTime} turns</div>
              <div>Requires: {selectedStats.requiredBuilding}</div>
              <div>Cost per unit: {Object.entries(selectedStats.cost).filter(([, v]) => v > 0).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
            </div>

            {validProvs.length === 0 ? (
              <p className="text-[10px] text-stat-negative">No provinces with {selectedStats.requiredBuilding}. Build one first.</p>
            ) : (
              <>
                <select value={selectedProv ?? ''} onChange={e => setSelectedProv(e.target.value)}
                  className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs text-foreground outline-none">
                  <option value="">Select province...</option>
                  {validProvs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Qty:</span>
                  <input type="number" min={1} max={100} value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)}
                    className="w-16 bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground outline-none" />
                </div>
                <button
                  onClick={() => { if (selectedProv && selectedType) dispatch({ type: 'PRODUCE_UNITS', provinceId: selectedProv, unitType: selectedType as any, quantity: qty }); }}
                  disabled={!selectedProv}
                  className="game-btn-primary w-full disabled:opacity-30">
                  Produce {qty}x {selectedStats.name}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Active production */}
      {state.productionQueue.filter(i => i.countryId === state.playerCountryId).length > 0 && (
        <div className="game-panel">
          <div className="game-panel-header">
            <Factory size={11} className="text-primary/70" />
            <h3>Queue</h3>
          </div>
          <div className="p-3 space-y-1">
            {state.productionQueue.filter(i => i.countryId === state.playerCountryId).map(item => (
              <div key={item.id} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span>{UNIT_STATS[item.unitType].icon}</span>
                  <span className="text-foreground">{item.quantity}x {UNIT_STATS[item.unitType].name}</span>
                </div>
                <span className="text-muted-foreground font-mono flex items-center gap-1">
                  <MapPin size={8} />{state.provinces[item.provinceId]?.name} · {item.turnsRemaining}t
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionPanel;
