import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { getProvincesForCountry } from '@/data/provinces';
import { Province, BuildingType, BUILDING_INFO, RESOURCE_KEYS, Resources } from '@/types/game';
import {
  MapPin, Users, Shield, Factory, Swords, ChevronUp, ArrowLeft,
  Building2, Hammer, Fuel, Pickaxe, Cpu, Wheat, DollarSign, Mountain,
} from 'lucide-react';

const RESOURCE_ICONS: Record<keyof Resources, React.ReactNode> = {
  food: <Wheat size={10} />, oil: <Fuel size={10} />, metal: <Pickaxe size={10} />,
  electronics: <Cpu size={10} />, money: <DollarSign size={10} />,
};

const TERRAIN_ICONS: Record<string, string> = {
  plains: '🌾', forest: '🌲', mountain: '⛰️', desert: '🏜️', urban: '🏙️', coastal: '🏖️', arctic: '❄️',
};

const BUILDING_ICONS: Record<BuildingType, React.ReactNode> = {
  industry: <Factory size={11} />, infrastructure: <Building2 size={11} />,
  resourceExtractor: <Pickaxe size={11} />, barracks: <Swords size={11} />,
  tankFactory: <Shield size={11} />, aircraftFactory: <Mountain size={11} />,
  navalBase: <MapPin size={11} />, bunker: <Shield size={11} />,
  antiAirDefense: <Shield size={11} />, fortification: <Building2 size={11} />,
};

const ProvincePanel = () => {
  const { state, selectedCountryId, selectedProvinceId, setSelectedProvinceId, dispatch } = useGame();

  const countryProvinces = selectedCountryId ? getProvincesForCountry(state.provinces, selectedCountryId) : [];
  const selectedProvince = selectedProvinceId ? state.provinces[selectedProvinceId] : null;
  const country = selectedCountryId ? state.countries[selectedCountryId] : null;
  const isPlayer = country?.id === state.playerCountryId;

  if (selectedProvince) {
    return <ProvinceDetail province={selectedProvince} isPlayer={isPlayer} dispatch={dispatch} onBack={() => setSelectedProvinceId(null)} state={state} />;
  }

  return (
    <div className="p-3 space-y-2 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <div className="game-panel-header mb-2">
        <MapPin size={12} className="text-primary/70" />
        <h3>{country?.name || 'Provinces'}</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{countryProvinces.length} regions</span>
      </div>

      {countryProvinces.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-8">Select a country to view its provinces</p>
      )}

      {countryProvinces.map(prov => {
        const armiesHere = Object.values(state.armies).filter(a => a.provinceId === prov.id && a.countryId === prov.countryId);
        const totalUnits = armiesHere.reduce((s, a) => s + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
        return (
          <button key={prov.id} onClick={() => setSelectedProvinceId(prov.id)}
            className="w-full game-panel hover:border-primary/30 transition-all cursor-pointer text-left group">
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{TERRAIN_ICONS[prov.terrain] || '🗺️'}</span>
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{prov.name}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">Dev {prov.development}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                <span className="flex items-center gap-0.5 text-muted-foreground"><Users size={9} />{(prov.population / 1e6).toFixed(1)}M</span>
                <span className="flex items-center gap-0.5 text-muted-foreground"><Shield size={9} />{prov.morale.toFixed(0)}%</span>
                <span className="flex items-center gap-0.5 text-muted-foreground"><Building2 size={9} />{prov.buildings.length}</span>
                {totalUnits > 0 && <span className="flex items-center gap-0.5 text-stat-positive"><Swords size={9} />{totalUnits}</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const ProvinceDetail = ({ province, isPlayer, dispatch, onBack, state }: {
  province: Province; isPlayer: boolean;
  dispatch: ReturnType<typeof useGame>['dispatch']; onBack: () => void;
  state: ReturnType<typeof useGame>['state'];
}) => {
  const armiesHere = Object.values(state.armies).filter(a => a.provinceId === province.id);
  const myArmies = armiesHere.filter(a => a.countryId === province.countryId);
  const queueItems = state.constructionQueue.filter(i => i.provinceId === province.id);
  const prodItems = state.productionQueue.filter(i => i.provinceId === province.id);

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={12} /> Back
      </button>

      <div className="flex items-center gap-3 pb-2 border-b border-border/50">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
          {TERRAIN_ICONS[province.terrain] || '🗺️'}
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">{province.name}</h2>
          <span className="text-[10px] text-muted-foreground capitalize">{province.terrain} · Dev {province.development}/100</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Population" value={`${(province.population / 1e6).toFixed(1)}M`} />
        <MiniStat label="Morale" value={`${province.morale.toFixed(0)}%`} color={province.morale > 60 ? 'positive' : province.morale < 35 ? 'negative' : undefined} />
        <MiniStat label="Stability" value={`${province.stability.toFixed(0)}%`} />
        <MiniStat label="Corruption" value={`${province.corruption.toFixed(0)}%`} color={province.corruption > 40 ? 'negative' : undefined} />
      </div>

      {/* Resources */}
      <Section title="Resource Production">
        <div className="grid grid-cols-2 gap-1 px-3 py-2">
          {RESOURCE_KEYS.map(key => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{RESOURCE_ICONS[key]}</span>
              <span className="text-[10px] text-muted-foreground capitalize flex-1">{key}</span>
              <span className="text-[10px] font-mono text-foreground">{province.resourceProduction[key]}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Buildings */}
      <Section title="Buildings">
        <div className="px-3 py-2 space-y-1">
          {province.buildings.length === 0 && <p className="text-[10px] text-muted-foreground">No buildings</p>}
          {province.buildings.map(b => {
            const info = BUILDING_INFO[b.type];
            return (
              <div key={b.type} className="flex items-center gap-2 group py-0.5">
                <span className="text-muted-foreground">{BUILDING_ICONS[b.type]}</span>
                <span className="text-[10px] text-foreground flex-1">{info.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground">Lv.{b.level}/{info.maxLevel}</span>
                {isPlayer && b.level < info.maxLevel && (
                  <button
                    onClick={() => dispatch({ type: 'UPGRADE_BUILDING', provinceId: province.id, buildingType: b.type })}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                  >
                    <ChevronUp size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Build new buildings */}
      {isPlayer && (
        <Section title="Build">
          <div className="px-3 py-2 space-y-1">
            {(Object.entries(BUILDING_INFO) as [BuildingType, typeof BUILDING_INFO[BuildingType]][]).map(([type, info]) => {
              const existing = province.buildings.find(b => b.type === type);
              if (existing && existing.level >= info.maxLevel) return null;
              const level = existing?.level ?? 0;
              return (
                <button key={type}
                  onClick={() => dispatch({ type: 'BUILD_IN_PROVINCE', provinceId: province.id, buildingType: type })}
                  className="w-full flex items-center gap-2 py-1 text-left hover:bg-muted/30 rounded px-1 transition-colors"
                >
                  <span className="text-muted-foreground">{BUILDING_ICONS[type]}</span>
                  <span className="text-[10px] text-foreground flex-1">{info.name} {level > 0 ? `→ Lv.${level + 1}` : 'Lv.1'}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{info.buildTime + level}t</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* Construction Queue */}
      {queueItems.length > 0 && (
        <Section title="Construction">
          <div className="px-3 py-2 space-y-1">
            {queueItems.map(item => (
              <div key={item.id} className="flex items-center justify-between text-[10px]">
                <span className="text-foreground">{item.label}</span>
                <span className="text-muted-foreground font-mono">{item.turnsRemaining}t left</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Production Queue */}
      {prodItems.length > 0 && (
        <Section title="Production">
          <div className="px-3 py-2 space-y-1">
            {prodItems.map(item => (
              <div key={item.id} className="flex items-center justify-between text-[10px]">
                <span className="text-foreground">{item.quantity}x {item.unitType}</span>
                <span className="text-muted-foreground font-mono">{item.turnsRemaining}t left</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Armies */}
      {myArmies.length > 0 && (
        <Section title="Armies">
          <div className="px-3 py-2 space-y-1">
            {myArmies.map(army => (
              <div key={army.id} className="text-[10px]">
                <span className="text-foreground font-medium">{army.name}</span>
                <span className="text-muted-foreground ml-2">
                  {army.units.map(u => `${u.count}x ${u.type}`).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

const MiniStat = ({ label, value, color }: { label: string; value: string; color?: 'positive' | 'negative' }) => (
  <div className="stat-card">
    <span className="text-[9px] text-muted-foreground">{label}</span>
    <p className={`text-sm font-mono font-bold ${color === 'positive' ? 'text-stat-positive' : color === 'negative' ? 'text-stat-negative' : 'text-foreground'}`}>{value}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="game-panel">
    <div className="game-panel-header">
      <Hammer size={11} className="text-primary/70" />
      <h3>{title}</h3>
    </div>
    {children}
  </div>
);

export default ProvincePanel;
