import { useGame } from '@/context/GameContext';
import ResourceBar from '@/components/game/resources/ResourceBar';
import { ResourceItemData } from '@/components/game/resources/ResourceItem';
import { Coins, Factory, Play, Pause, SkipForward, Shield, Activity, Calendar, Clock, Users, Wheat } from 'lucide-react';
import { BuildingType, ConstructionItem, GameState, ProductionItem, Province, TradeAgreement } from '@/types/game';

const TopBar = () => {
  const { state, dispatch, worldLoading } = useGame();
  const playerCountry = state.countries[state.playerCountryId];
  const activeWars = state.wars.filter(w => w.active).length;

  if (worldLoading || !playerCountry) {
    return (
      <div className="h-20 bg-panel border-b border-panel flex items-center justify-center px-3 shrink-0">
        <span className="text-muted-foreground text-xs font-mono">Loading...</span>
      </div>
    );
  }

  const resourceItems = buildTopResourceItems(state);

  return (
    <div className="relative shrink-0 border-b border-panel bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.12),transparent_35%),linear-gradient(180deg,hsl(var(--panel))_0%,rgba(9,13,22,0.95)_100%)] px-3 py-2.5">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-primary font-bold text-sm tracking-[0.24em]">GEOSTRATEGY</h1>
          <div className="hidden h-10 w-px bg-border/50 lg:block" />
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar size={12} className="text-primary/70" />
              <span>{String(state.month).padStart(2, '0')}/{state.year}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock size={12} className="text-primary/70" />
              <span>T{state.turn}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <TopStat icon={<Activity size={12} />} label="Stability" value={`${playerCountry.stability.toFixed(0)}%`} />
          <TopStat icon={<Shield size={12} />} label="Approval" value={`${playerCountry.approval.toFixed(0)}%`} />
          {activeWars > 0 && (
            <div className="flex items-center gap-1 rounded-md border border-danger/20 bg-danger/10 px-2 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-danger badge-pulse" />
              <span className="text-[10px] font-semibold text-danger">{activeWars} WAR{activeWars > 1 ? 'S' : ''}</span>
            </div>
          )}

          <div className="ml-1 flex items-center gap-0.5 rounded-md bg-muted/40 p-0.5">
            <button onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
              className={`rounded-md p-1.5 transition-all ${state.paused ? 'text-foreground hover:bg-muted' : 'bg-primary/15 text-primary hover:bg-primary/25'}`}
              title={state.paused ? 'Resume' : 'Pause'}>
              {state.paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            <button onClick={() => dispatch({ type: 'NEXT_TURN' })}
              className="rounded-md p-1.5 text-foreground transition-all hover:bg-muted" title="Next Turn">
              <SkipForward size={14} />
            </button>
            <div className="ml-1 flex items-center gap-px rounded-md bg-background/30 p-0.5">
              {(['slow', 'normal', 'fast'] as const).map(speed => (
                <button key={speed} onClick={() => dispatch({ type: 'SET_SPEED', speed })}
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-all ${state.speed === speed ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                  {speed === 'slow' ? '1×' : speed === 'normal' ? '2×' : '3×'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-stretch gap-3">
        <ResourceBar items={resourceItems} formatValue={formatNumber} formatDelta={formatDelta} />
      </div>
    </div>
  );
};

const TopStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="hidden items-center gap-1.5 rounded-md border border-border/40 bg-background/20 px-2 py-1 text-xs lg:flex">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

function buildTopResourceItems(state: GameState): ResourceItemData[] {
  const country = state.countries[state.playerCountryId];
  const provinces = Object.values(state.provinces).filter(province => province.countryId === country.id);
  const constructionQueue = state.constructionQueue.filter(item => item.countryId === country.id);
  const productionQueue = state.productionQueue.filter(item => item.countryId === country.id);
  const tradeAgreements = state.tradeAgreements.filter(trade => trade.countries.includes(country.id));
  const unitCount = Object.values(state.armies)
    .filter(army => army.countryId === country.id)
    .reduce((sum, army) => sum + army.units.reduce((unitSum, unit) => unitSum + unit.count, 0), 0);
  const activeWars = state.wars.filter(war => war.active && (war.attackers.includes(country.id) || war.defenders.includes(country.id))).length;

  const goldIncomeSources = [
    { label: 'Taxation', value: Math.max(6, Math.round(country.population / 5_000_000)) },
    { label: 'Trade routes', value: tradeAgreements.reduce((sum, trade) => sum + Math.max(2, Math.round(trade.value / 180)), 0) },
    { label: 'Commodity exports', value: Math.max(0, Math.round(country.resourceIncome.steel * 1.2 + country.resourceIncome.oil * 1.6 + country.resourceIncome.rareMetals * 2.2 + country.resourceIncome.food * 0.5)) },
  ].filter(line => line.value > 0);
  const goldExpenses = [
    { label: 'Army upkeep', value: Math.max(0, Math.round(unitCount * 0.28)) },
    { label: 'State administration', value: Math.max(4, Math.round(provinces.length * 0.45 + country.government.corruption * 0.18)) },
    { label: 'Construction subsidies', value: Math.round(sumConstructionLoad(constructionQueue) * 0.04 + sumProductionLoad(productionQueue) * 0.05) },
    { label: 'War spending', value: activeWars * 8 },
  ].filter(line => line.value > 0);
  const goldChange = sumLines(goldIncomeSources) - sumLines(goldExpenses);
  const goldValue = Math.max(0, Math.round(country.resources.food * 0.5 + country.resources.steel * 1.6 + country.resources.oil * 2.2 + country.resources.rareMetals * 3.2 + country.approval * 8));

  const industryIncomeSources = [
    { label: 'Steel throughput', value: Math.max(0, country.resourceIncome.steel) },
    { label: 'Industrial complexes', value: provinces.reduce((sum, province) => sum + getBuildingLevel(province, 'industrialComplex') * 3, 0) },
    { label: 'Infrastructure network', value: provinces.reduce((sum, province) => sum + getBuildingLevel(province, 'infrastructure'), 0) },
  ].filter(line => line.value > 0);
  const industryExpenses = [
    { label: 'Construction demand', value: Math.round(sumConstructionLoad(constructionQueue) * 0.12) },
    { label: 'Military production', value: Math.round(sumProductionLoad(productionQueue) * 0.18) },
  ].filter(line => line.value > 0);
  const industryChange = sumLines(industryIncomeSources) - sumLines(industryExpenses);
  const industryValue = Math.round(country.resources.steel + country.resources.rareMetals * 0.5 + provinces.reduce((sum, province) => sum + province.development, 0));

  const foodIncomeSources = [
    { label: 'Agriculture', value: provinces.reduce((sum, province) => sum + Math.max(0, province.resourceProduction.food), 0) },
    { label: 'Coastal supply', value: provinces.filter(province => province.isCoastal).length * 2 },
    { label: 'Trade imports', value: tradeAgreements.length * 3 },
  ].filter(line => line.value > 0);
  const foodExpenses = [
    { label: 'Civilian consumption', value: Math.max(1, Math.round(country.population / 18_000_000)) },
    { label: 'Army rations', value: Math.max(0, Math.round(unitCount * 0.4)) },
    { label: 'Supply inefficiency', value: Math.max(0, Math.round(Math.max(0, 55 - country.stability) * 0.08)) },
  ].filter(line => line.value > 0);
  const foodChange = sumLines(foodIncomeSources) - sumLines(foodExpenses);

  const populationIncomeSources = [
    { label: 'Natural growth', value: Math.max(0, Math.round(country.population * (0.00016 + country.stability * 0.000002))) },
    { label: 'Migration', value: Math.max(0, Math.round(tradeAgreements.length * 350 + Math.max(0, averageProvinceMorale(provinces) - 60) * 25)) },
  ].filter(line => line.value > 0);
  const populationExpenses = [
    { label: 'War casualties', value: activeWars * 1200 },
    { label: 'Unrest & emigration', value: Math.max(0, Math.round(Math.max(0, 55 - country.stability) * 120 + Math.max(0, 50 - country.approval) * 90)) },
  ].filter(line => line.value > 0);
  const populationChange = sumLines(populationIncomeSources) - sumLines(populationExpenses);

  return [
    {
      key: 'gold',
      label: 'Gold',
      icon: <Coins size={18} />,
      accentClassName: 'text-amber-300',
      currentValue: goldValue,
      changePerTurn: goldChange,
      incomeSources: goldIncomeSources,
      expenses: goldExpenses,
    },
    {
      key: 'industry',
      label: 'Industry',
      icon: <Factory size={18} />,
      accentClassName: 'text-sky-300',
      currentValue: industryValue,
      changePerTurn: industryChange,
      incomeSources: industryIncomeSources,
      expenses: industryExpenses,
    },
    {
      key: 'food',
      label: 'Food',
      icon: <Wheat size={18} />,
      accentClassName: 'text-emerald-300',
      currentValue: country.resources.food,
      changePerTurn: foodChange,
      incomeSources: foodIncomeSources,
      expenses: foodExpenses,
    },
    {
      key: 'population',
      label: 'Population',
      icon: <Users size={18} />,
      accentClassName: 'text-indigo-300',
      currentValue: country.population,
      changePerTurn: populationChange,
      incomeSources: populationIncomeSources,
      expenses: populationExpenses,
    },
  ];
}

function sumLines(lines: { value: number }[]): number {
  return lines.reduce((sum, line) => sum + line.value, 0);
}

function getBuildingLevel(province: Province, buildingType: BuildingType): number {
  return province.buildings.find(building => building.type === buildingType)?.level ?? 0;
}

function sumConstructionLoad(items: ConstructionItem[]): number {
  return items.reduce((sum, item) => sum + item.targetLevel * Math.max(1, item.turnsRemaining), 0);
}

function sumProductionLoad(items: ProductionItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * Math.max(1, item.turnsRemaining), 0);
}

function averageProvinceMorale(provinces: Province[]): number {
  if (provinces.length === 0) return 50;
  return provinces.reduce((sum, province) => sum + province.morale, 0) / provinces.length;
}

export function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(1) + 'T';
  if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toFixed(0);
}

function formatDelta(num: number): string {
  return `${num >= 0 ? '+' : ''}${formatNumber(num)}`;
}

export default TopBar;
