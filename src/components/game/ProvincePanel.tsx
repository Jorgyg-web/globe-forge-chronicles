import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { getProvincesForCountry } from '@/data/provinces';
import {
  Province, BuildingType, BUILDING_INFO, RESOURCE_KEYS, Resources,
  UnitType,
} from '@/types/game';
import { UNIT_STATS } from '@/data/unitStats';
import {
  MapPin, Users, Shield, Factory, Swords, ChevronUp, ArrowLeft,
  Building2, Hammer, Fuel, Pickaxe, Cpu, Wheat, DollarSign, Mountain,
  Wrench, Crosshair, Plane, Anchor, Castle, Zap, Clock, AlertTriangle,
  Plus, ChevronRight,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { BuildingInstanceTooltipContent, BuildingTooltipContent, ProvinceTooltipContent, UnitTooltipContent } from '@/components/game/tooltips/GameTooltipContents';
import { StrategyTooltip, StrategyTooltipContent, StrategyTooltipProvider, StrategyTooltipTrigger } from '@/components/game/tooltips/StrategyTooltip';

const RESOURCE_ICONS: Record<keyof Resources, React.ReactNode> = {
  food: <Wheat size={10} />, steel: <Pickaxe size={10} />, oil: <Fuel size={10} />,
  rareMetals: <Zap size={10} />, manpower: <Users size={10} />,
};

const TERRAIN_ICONS: Record<string, string> = {
  plains: '🌾', forest: '🌲', mountain: '⛰️', desert: '🏜️', urban: '🏙️', coastal: '🏖️', arctic: '❄️',
};

const BUILDING_ICONS: Record<BuildingType, React.ReactNode> = {
  industrialComplex: <Factory size={13} />,
  infrastructure: <Building2 size={13} />,
  resourceExtractor: <Pickaxe size={13} />,
  militaryBase: <Swords size={13} />,
  airbase: <Plane size={13} />,
  navalBase: <Anchor size={13} />,
  fortification: <Castle size={13} />,
  radar: <Zap size={13} />,
  antiAirDefense: <Crosshair size={13} />,
};

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  economic: { label: 'Economic', icon: <DollarSign size={11} />, color: 'text-emerald-400' },
  military_production: { label: 'Military', icon: <Swords size={11} />, color: 'text-red-400' },
  defensive: { label: 'Defensive', icon: <Shield size={11} />, color: 'text-blue-400' },
};

const BUILDING_EFFECTS: Record<BuildingType, (level: number) => string> = {
  industrialComplex: (l) => `+${l * 15}% production output`,
  infrastructure: (l) => `+${l * 20}% movement speed`,
  resourceExtractor: (l) => `+${l * 18}% resource yield`,
  militaryBase: (l) => l >= 3 ? 'All ground units unlocked' : l >= 2 ? 'Infantry, Vehicles, Artillery' : 'Infantry only',
  airbase: (l) => l >= 2 ? 'Fighters, Bombers, Drones' : 'Fighters, Drones',
  navalBase: (l) => `Naval units (Lv.${l})`,
  fortification: (l) => `+${l * 12}% defense bonus`,
  radar: (l) => `+${l} detection range, +${l * 10}% AA targeting`,
  antiAirDefense: (l) => `Shoots down ${l * 18}% aircraft`,
};

function scaleResources(r: Resources, s: number): Resources {
  return { food: Math.floor(r.food * s), steel: Math.floor(r.steel * s), oil: Math.floor(r.oil * s), rareMetals: Math.floor(r.rareMetals * s), manpower: Math.floor(r.manpower * s) };
}

function canAfford(have: Resources, cost: Resources): boolean {
  return RESOURCE_KEYS.every(k => have[k] >= cost[k]);
}

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
        const queueCount = state.constructionQueue.filter(i => i.provinceId === prov.id).length
          + state.productionQueue.filter(i => i.provinceId === prov.id).length;
        return (
          <StrategyTooltipProvider key={prov.id}>
            <StrategyTooltip>
              <StrategyTooltipTrigger asChild>
                <button onClick={() => setSelectedProvinceId(prov.id)}
                  className="w-full game-panel hover:border-primary/30 transition-all cursor-pointer text-left group">
                  <div className="px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{TERRAIN_ICONS[prov.terrain] || '🗺️'}</span>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[140px]">{prov.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {queueCount > 0 && <span className="text-[9px] font-mono text-primary bg-primary/10 px-1 rounded">{queueCount}⚙</span>}
                        <span className="text-[10px] font-mono text-muted-foreground">Dev {prov.development}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      <span className="flex items-center gap-0.5 text-muted-foreground"><Users size={9} />{(prov.population / 1e6).toFixed(1)}M</span>
                      <span className="flex items-center gap-0.5 text-muted-foreground"><Shield size={9} />{prov.morale.toFixed(0)}%</span>
                      <span className="flex items-center gap-0.5 text-muted-foreground"><Building2 size={9} />{prov.buildings.length}</span>
                      {totalUnits > 0 && <span className="flex items-center gap-0.5 text-stat-positive"><Swords size={9} />{totalUnits}</span>}
                    </div>
                  </div>
                </button>
              </StrategyTooltipTrigger>
              <StrategyTooltipContent side="right" align="start">
                <ProvinceTooltipContent province={prov} country={country} armyCount={armiesHere.length} />
              </StrategyTooltipContent>
            </StrategyTooltip>
          </StrategyTooltipProvider>
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
  const { provincePanelTab, setProvincePanelTab } = useGame();
  const playerCountry = state.countries[state.playerCountryId];
  const queueItems = state.constructionQueue.filter(i => i.provinceId === province.id);
  const prodItems = state.productionQueue.filter(i => i.provinceId === province.id);

  return (
    <div className="flex flex-col h-full animate-panel-in">
      {/* Header */}
      <div className="p-3 pb-0">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft size={12} /> Back
        </button>

        <div className="flex items-center gap-3 pb-3 border-b border-border/50">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">
            {TERRAIN_ICONS[province.terrain] || '🗺️'}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">{province.name}</h2>
            <span className="text-[10px] text-muted-foreground capitalize">{province.terrain} · Dev {province.development}/100</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isPlayer && (
        <div className="flex border-b border-border/40 px-3">
          {(['overview', 'build', 'recruit'] as const).map(t => (
            <button key={t} onClick={() => setProvincePanelTab(t)}
              className={`px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors relative ${
                provincePanelTab === t ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t === 'overview' ? 'Overview' : t === 'build' ? 'Build' : 'Recruit'}
              {provincePanelTab === t && <span className="absolute bottom-0 left-1 right-1 h-[2px] bg-primary rounded-full" />}
              {t === 'build' && queueItems.length > 0 && (
                <span className="ml-1 text-[8px] bg-primary/20 text-primary px-1 rounded">{queueItems.length}</span>
              )}
              {t === 'recruit' && prodItems.length > 0 && (
                <span className="ml-1 text-[8px] bg-primary/20 text-primary px-1 rounded">{prodItems.length}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
        {provincePanelTab === 'overview' && <OverviewTab province={province} state={state} isPlayer={isPlayer} />}
        {provincePanelTab === 'build' && <BuildTab province={province} playerCountry={playerCountry} dispatch={dispatch} queueItems={queueItems} state={state} />}
        {provincePanelTab === 'recruit' && <RecruitTab province={province} playerCountry={playerCountry} dispatch={dispatch} prodItems={prodItems} state={state} />}
      </div>
    </div>
  );
};

/* ─── Overview Tab ─── */
const OverviewTab = ({ province, state, isPlayer }: { province: Province; state: any; isPlayer: boolean }) => {
  const armiesHere = Object.values(state.armies as Record<string, any>).filter((a: any) => a.provinceId === province.id);
  const myArmies = armiesHere.filter((a: any) => a.countryId === province.countryId);

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Population" value={`${(province.population / 1e6).toFixed(1)}M`} />
        <MiniStat label="Morale" value={`${province.morale.toFixed(0)}%`} color={province.morale > 60 ? 'positive' : province.morale < 35 ? 'negative' : undefined} />
        <MiniStat label="Stability" value={`${province.stability.toFixed(0)}%`} />
        <MiniStat label="Corruption" value={`${province.corruption.toFixed(0)}%`} color={province.corruption > 40 ? 'negative' : undefined} />
      </div>

      {/* Resources */}
      <Section title="Resource Production" icon={<Wheat size={11} />}>
        <div className="grid grid-cols-2 gap-1 px-3 py-2">
          {RESOURCE_KEYS.map(key => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{RESOURCE_ICONS[key]}</span>
              <span className="text-[10px] text-muted-foreground capitalize flex-1">{key}</span>
              <span className="text-[10px] font-mono text-foreground">+{province.resourceProduction[key]}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Current Buildings */}
      <Section title={`Buildings (${province.buildings.length})`} icon={<Building2 size={11} />}>
        <div className="px-3 py-2 space-y-1.5">
          {province.buildings.length === 0 && <p className="text-[10px] text-muted-foreground italic">No buildings constructed</p>}
          {province.buildings.map(b => {
            const info = BUILDING_INFO[b.type];
            const catMeta = CATEGORY_META[info.category];

            return (
              <StrategyTooltipProvider key={b.type}>
                <StrategyTooltip>
                  <StrategyTooltipTrigger asChild>
                    <div className="rounded bg-muted/20 overflow-hidden cursor-help">
                      <div className="flex items-center gap-2 py-1 px-2">
                        <span className={catMeta.color}>{BUILDING_ICONS[b.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-foreground">{info.name}</span>
                            <span className="text-[9px] font-mono text-muted-foreground">Lv.{b.level}/{info.maxLevel}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground">{BUILDING_EFFECTS[b.type](b.level)}</span>
                        </div>
                      </div>
                    </div>
                  </StrategyTooltipTrigger>
                  <StrategyTooltipContent side="right" align="start">
                    <BuildingInstanceTooltipContent building={b} />
                  </StrategyTooltipContent>
                </StrategyTooltip>
              </StrategyTooltipProvider>
            );
          })}
        </div>
      </Section>

      {/* Armies */}
      {myArmies.length > 0 && (
        <Section title={`Armies (${myArmies.length})`} icon={<Swords size={11} />}>
          <div className="px-3 py-2 space-y-1">
            {myArmies.map((army: any) => (
              <div key={army.id} className="text-[10px] py-1 px-2 rounded bg-muted/20">
                <span className="text-foreground font-semibold">{army.name}</span>
                <div className="text-muted-foreground mt-0.5">
                  {army.units.map((u: any) => `${u.count}× ${u.type}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  );
};

/* ─── Build Tab ─── */
const BuildTab = ({ province, playerCountry, dispatch, queueItems, state }: {
  province: Province; playerCountry: any; dispatch: any; queueItems: any[]; state: any;
}) => {
  const categories = ['economic', 'military_production', 'defensive'] as const;

  return (
    <>
      {/* Active Construction */}
      {queueItems.length > 0 && (
        <Section title="Under Construction" icon={<Wrench size={11} />}>
          <div className="px-3 py-2 space-y-2">
            {queueItems.map((item: any) => {
              const progress = ((item.turnsRequired - item.turnsRemaining) / item.turnsRequired) * 100;
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-foreground">{item.label}</span>
                    <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-0.5">
                      <Clock size={8} />{item.turnsRemaining}t
                    </span>
                  </div>
                  <Progress value={progress} className="h-1 bg-muted/30" />
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Building Categories */}
      {categories.map(cat => {
        const catMeta = CATEGORY_META[cat];
        const buildings = (Object.entries(BUILDING_INFO) as [BuildingType, typeof BUILDING_INFO[BuildingType]][])
          .filter(([, info]) => info.category === cat);

        return (
          <div key={cat}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={catMeta.color}>{catMeta.icon}</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{catMeta.label}</span>
            </div>
            <div className="space-y-1">
              {buildings.map(([type, info]) => {
                const existing = province.buildings.find(b => b.type === type);
                const currentLevel = existing?.level ?? 0;
                if (currentLevel >= info.maxLevel) return null;

                const nextLevel = currentLevel + 1;
                const cost = scaleResources(info.baseCost, nextLevel);
                const affordable = canAfford(playerCountry.resources, cost);
                const buildTime = info.buildTime + currentLevel;
                const alreadyQueued = queueItems.some((q: any) => q.buildingType === type);

                // Check if naval base is buildable (coastal only)
                if (type === 'navalBase' && !province.isCoastal) return null;

                return (
                  <StrategyTooltipProvider key={type}>
                    <StrategyTooltip>
                      <StrategyTooltipTrigger asChild>
                        <div className="w-full">
                          <button
                            disabled={!affordable || alreadyQueued}
                            onClick={() => dispatch({ type: 'BUILD_IN_PROVINCE', provinceId: province.id, buildingType: type })}
                            className={`w-full text-left rounded-md border transition-all px-3 py-2 ${
                              alreadyQueued
                                ? 'border-primary/20 bg-primary/5 opacity-60 cursor-not-allowed'
                                : affordable
                                  ? 'border-border/50 hover:border-primary/40 bg-card/50 hover:bg-primary/5 cursor-pointer'
                                  : 'border-border/30 bg-card/30 opacity-50 cursor-not-allowed'
                            }`}>
                            <div className="flex items-center gap-2">
                              <span className={`${catMeta.color} shrink-0`}>{BUILDING_ICONS[type]}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-semibold text-foreground">{info.name}</span>
                                  {currentLevel > 0 && (
                                    <span className="text-[9px] font-mono text-muted-foreground">Lv.{currentLevel} → {nextLevel}</span>
                                  )}
                                  {currentLevel === 0 && (
                                    <span className="text-[9px] font-mono text-primary">NEW</span>
                                  )}
                                </div>
                                <p className="text-[9px] text-muted-foreground mt-0.5">{info.description}</p>
                                <p className="text-[8px] text-muted-foreground/70 mt-0.5 italic">
                                  {BUILDING_EFFECTS[type](nextLevel)}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-0.5 justify-end">
                                  <Clock size={8} />{buildTime}t
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {RESOURCE_KEYS.filter(k => cost[k] > 0).map(k => (
                                <span key={k} className={`text-[9px] font-mono flex items-center gap-0.5 ${
                                  playerCountry.resources[k] >= cost[k] ? 'text-muted-foreground' : 'text-destructive'
                                }`}>
                                  {RESOURCE_ICONS[k]}{cost[k]}
                                </span>
                              ))}
                            </div>
                            {alreadyQueued && (
                              <span className="text-[9px] text-primary font-mono mt-1 block">⚙ In queue</span>
                            )}
                          </button>
                        </div>
                      </StrategyTooltipTrigger>
                      <StrategyTooltipContent side="right" align="start">
                        <BuildingTooltipContent buildingType={type} level={currentLevel} nextLevel={nextLevel} />
                      </StrategyTooltipContent>
                    </StrategyTooltip>
                  </StrategyTooltipProvider>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};

/* ─── Recruit Tab ─── */
const RecruitTab = ({ province, playerCountry, dispatch, prodItems, state }: {
  province: Province; playerCountry: any; dispatch: any; prodItems: any[]; state: any;
}) => {
  const availableUnits = (Object.entries(UNIT_STATS) as [UnitType, typeof UNIT_STATS[UnitType]][])
    .filter(([, stats]) => {
      // Must have the required building
      if (!province.buildings.some(b => b.type === stats.requiredBuilding)) return false;
      // Must have required research
      if (stats.requiredResearch && !playerCountry.technology.researched.includes(stats.requiredResearch)) return false;
      return true;
    });

  const missingBuildings = new Set<BuildingType>();
  for (const [, stats] of Object.entries(UNIT_STATS) as [UnitType, typeof UNIT_STATS[UnitType]][]) {
    if (!province.buildings.some(b => b.type === stats.requiredBuilding)) {
      missingBuildings.add(stats.requiredBuilding);
    }
  }

  return (
    <>
      {/* Active Production */}
      {prodItems.length > 0 && (
        <Section title="Training" icon={<Wrench size={11} />}>
          <div className="px-3 py-2 space-y-2">
            {prodItems.map((item: any) => {
              const progress = ((item.turnsRequired - item.turnsRemaining) / item.turnsRequired) * 100;
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-foreground">
                      {item.quantity}× {UNIT_STATS[item.unitType as UnitType]?.name || item.unitType}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-0.5">
                      <Clock size={8} />{item.turnsRemaining}t
                    </span>
                  </div>
                  <Progress value={progress} className="h-1 bg-muted/30" />
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Available Units */}
      {availableUnits.length > 0 ? (
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Available Units</span>
          {availableUnits.map(([unitType, stats]) => {
            const affordable = canAfford(playerCountry.resources, stats.cost);
            return (
              <StrategyTooltipProvider key={unitType}>
                <StrategyTooltip>
                  <StrategyTooltipTrigger asChild>
                    <div className="w-full">
                      <button
                        disabled={!affordable}
                        onClick={() => dispatch({ type: 'PRODUCE_UNITS', provinceId: province.id, unitType, quantity: 1 })}
                        className={`w-full text-left rounded-md border transition-all px-3 py-2 ${
                          affordable
                            ? 'border-border/50 hover:border-primary/40 bg-card/50 hover:bg-primary/5 cursor-pointer'
                            : 'border-border/30 bg-card/30 opacity-50 cursor-not-allowed'
                        }`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg shrink-0">{stats.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold text-foreground">{stats.name}</span>
                              <span className="text-[9px] font-mono text-muted-foreground">{stats.armorClass}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                              <span>⚔{stats.attack}</span>
                              <span>🛡{stats.defense}</span>
                              <span>❤{stats.health}</span>
                              <span>🏃{stats.speed}</span>
                              {stats.range > 0 && <span>📏{stats.range}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-0.5 justify-end">
                              <Clock size={8} />{stats.buildTime}t
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {RESOURCE_KEYS.filter(k => stats.cost[k] > 0).map(k => (
                            <span key={k} className={`text-[9px] font-mono flex items-center gap-0.5 ${
                              playerCountry.resources[k] >= stats.cost[k] ? 'text-muted-foreground' : 'text-destructive'
                            }`}>
                              {RESOURCE_ICONS[k]}{stats.cost[k]}
                            </span>
                          ))}
                        </div>
                      </button>
                    </div>
                  </StrategyTooltipTrigger>
                  <StrategyTooltipContent side="right" align="start">
                    <UnitTooltipContent unitType={unitType} />
                  </StrategyTooltipContent>
                </StrategyTooltip>
              </StrategyTooltipProvider>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <AlertTriangle size={20} className="text-muted-foreground/40 mb-2" />
          <p className="text-[11px] text-muted-foreground">No units available</p>
          <p className="text-[9px] text-muted-foreground/70 mt-1">
            Build military structures first:
          </p>
          <div className="mt-2 space-y-0.5">
            {[...missingBuildings].slice(0, 3).map(bt => (
              <p key={bt} className="text-[9px] text-muted-foreground">
                • {BUILDING_INFO[bt].name} → {getUnitsForBuilding(bt)}
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

function getUnitsForBuilding(bt: BuildingType): string {
  return (Object.entries(UNIT_STATS) as [UnitType, typeof UNIT_STATS[UnitType]][])
    .filter(([, s]) => s.requiredBuilding === bt)
    .map(([, s]) => s.name)
    .slice(0, 3)
    .join(', ');
}

/* ─── Shared Components ─── */
const MiniStat = ({ label, value, color }: { label: string; value: string; color?: 'positive' | 'negative' }) => (
  <div className="stat-card">
    <span className="text-[9px] text-muted-foreground">{label}</span>
    <p className={`text-sm font-mono font-bold ${color === 'positive' ? 'text-stat-positive' : color === 'negative' ? 'text-stat-negative' : 'text-foreground'}`}>{value}</p>
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div className="game-panel">
    <div className="game-panel-header">
      {icon || <Hammer size={11} className="text-primary/70" />}
      <h3>{title}</h3>
    </div>
    {children}
  </div>
);

export default ProvincePanel;
