import { useGame } from '@/context/GameContext';
import { getProvincesForCountry } from '@/data/provinces';
import { Province, ProvinceInfrastructure, ProvinceIndustry } from '@/types/game';
import {
  MapPin, Users, TrendingUp, Shield, Factory, Swords, Pickaxe, Zap,
  FlaskConical, Building2, ChevronUp, Fuel, Wheat, Gem, ArrowLeft,
  Route, TrainFront, Ship, Plane, Radio,
} from 'lucide-react';

const INFRA_ICONS: Record<keyof ProvinceInfrastructure, React.ReactNode> = {
  roads: <Route size={11} />, railways: <TrainFront size={11} />,
  ports: <Ship size={11} />, airports: <Plane size={11} />,
  powerPlants: <Zap size={11} />, communications: <Radio size={11} />,
};

const INDUSTRY_ICONS: Record<keyof ProvinceIndustry, React.ReactNode> = {
  civilian: <Factory size={11} />, military: <Swords size={11} />,
  energy: <Zap size={11} />, research: <FlaskConical size={11} />,
};

const RESOURCE_ICONS = {
  oil: <Fuel size={10} />, minerals: <Pickaxe size={10} />,
  agriculture: <Wheat size={10} />, rareEarth: <Gem size={10} />,
};

const LevelBar = ({ value, max = 10, color = 'bg-primary' }: { value: number; max?: number; color?: string }) => (
  <div className="flex gap-px">
    {Array.from({ length: max }).map((_, i) => (
      <div key={i} className={`w-1.5 h-3 rounded-sm transition-colors ${i < value ? color : 'bg-muted/40'}`} />
    ))}
  </div>
);

const ProvincePanel = () => {
  const { state, selectedCountryId, selectedProvinceId, setSelectedProvinceId, dispatch } = useGame();

  const countryProvinces = selectedCountryId
    ? getProvincesForCountry(state.provinces, selectedCountryId)
    : [];

  const selectedProvince = selectedProvinceId ? state.provinces[selectedProvinceId] : null;
  const country = selectedCountryId ? state.countries[selectedCountryId] : null;
  const isPlayer = country?.id === state.playerCountryId;

  if (selectedProvince) {
    return <ProvinceDetail province={selectedProvince} isPlayer={isPlayer} dispatch={dispatch} onBack={() => setSelectedProvinceId(null)} />;
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

      {countryProvinces.map(prov => (
        <button
          key={prov.id}
          onClick={() => setSelectedProvinceId(prov.id)}
          className="w-full game-panel hover:border-primary/30 transition-all cursor-pointer text-left group"
        >
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{prov.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">Dev {prov.development}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users size={9} /> {(prov.population / 1e6).toFixed(1)}M
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp size={9} /> ${(prov.gdpContribution / 1e3).toFixed(0)}B
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Shield size={9} /> {prov.stability.toFixed(0)}%
              </div>
            </div>
            {/* Resources badges */}
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {Object.entries(prov.resources).map(([key, val]) => val > 0 && (
                <span key={key} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/60 text-[9px] text-muted-foreground">
                  {RESOURCE_ICONS[key as keyof typeof RESOURCE_ICONS]} {val}
                </span>
              ))}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

const ProvinceDetail = ({
  province, isPlayer, dispatch, onBack,
}: {
  province: Province; isPlayer: boolean;
  dispatch: ReturnType<typeof useGame>['dispatch']; onBack: () => void;
}) => (
  <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
    <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
      <ArrowLeft size={12} /> Back to provinces
    </button>

    <div className="flex items-center gap-3 pb-2 border-b border-border/50">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <MapPin size={16} className="text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-foreground">{province.name}</h2>
        <span className="text-[10px] text-muted-foreground">Development: {province.development}/100</span>
      </div>
    </div>

    {/* Quick stats */}
    <div className="grid grid-cols-2 gap-2">
      <QuickStat icon={<Users size={12} />} label="Population" value={`${(province.population / 1e6).toFixed(1)}M`} />
      <QuickStat icon={<TrendingUp size={12} />} label="GDP" value={`$${(province.gdpContribution / 1e3).toFixed(0)}B`} />
      <QuickStat icon={<Shield size={12} />} label="Stability" value={`${province.stability.toFixed(0)}%`} color={province.stability > 60 ? 'positive' : province.stability < 35 ? 'negative' : undefined} />
      <QuickStat icon={<Swords size={12} />} label="Garrison" value={province.military.garrison.toLocaleString()} />
    </div>

    {/* Resources */}
    <Section title="Resources" icon={<Pickaxe size={11} />}>
      <div className="grid grid-cols-2 gap-2 px-3 py-2">
        {Object.entries(province.resources).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-muted-foreground">{RESOURCE_ICONS[key as keyof typeof RESOURCE_ICONS]}</span>
            <span className="text-[10px] text-muted-foreground capitalize flex-1">{key === 'rareEarth' ? 'Rare Earth' : key}</span>
            <LevelBar value={val} color={val > 5 ? 'bg-success' : 'bg-secondary'} />
          </div>
        ))}
      </div>
    </Section>

    {/* Infrastructure */}
    <Section title="Infrastructure" icon={<Building2 size={11} />}>
      <div className="px-3 py-2 space-y-1">
        {(Object.entries(province.infrastructure) as [keyof ProvinceInfrastructure, number][]).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 group">
            <span className="text-muted-foreground">{INFRA_ICONS[key]}</span>
            <span className="text-[10px] text-muted-foreground capitalize flex-1">{key}</span>
            <LevelBar value={val} />
            {isPlayer && val < 10 && (
              <button
                onClick={() => dispatch({ type: 'UPGRADE_PROVINCE_INFRA', provinceId: province.id, infra: key })}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              >
                <ChevronUp size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Section>

    {/* Industry */}
    <Section title="Industry" icon={<Factory size={11} />}>
      <div className="px-3 py-2 space-y-1">
        {(Object.entries(province.industry) as [keyof ProvinceIndustry, number][]).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 group">
            <span className="text-muted-foreground">{INDUSTRY_ICONS[key]}</span>
            <span className="text-[10px] text-muted-foreground capitalize flex-1">{key}</span>
            <LevelBar value={val} color="bg-secondary" />
            {isPlayer && val < 10 && (
              <button
                onClick={() => dispatch({ type: 'UPGRADE_PROVINCE_INDUSTRY', provinceId: province.id, industry: key })}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-secondary/20 text-secondary hover:bg-secondary/30 transition-all"
              >
                <ChevronUp size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Section>

    {/* Military */}
    <Section title="Military" icon={<Swords size={11} />}>
      <div className="px-3 py-2 space-y-1.5">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Bases</span>
          <span className="font-mono text-foreground">{province.military.bases}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Garrison</span>
          <span className="font-mono text-foreground">{province.military.garrison.toLocaleString()}</span>
        </div>
        {isPlayer && (
          <button
            onClick={() => dispatch({ type: 'BUILD_PROVINCE_BASE', provinceId: province.id })}
            className="w-full mt-1 py-1.5 text-[10px] font-mono bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
          >
            + Build Base
          </button>
        )}
      </div>
    </Section>

    {/* Extra info */}
    <div className="game-panel">
      <div className="px-3 py-2 space-y-1">
        <Row label="Corruption" value={`${province.corruption.toFixed(0)}%`} negative={province.corruption > 40} />
        <Row label="Unemployment" value={`${province.unemployment.toFixed(1)}%`} negative={province.unemployment > 10} />
      </div>
    </div>
  </div>
);

const QuickStat = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: 'positive' | 'negative' }) => (
  <div className="stat-card">
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
    <p className={`text-sm font-mono font-bold tabular-nums ${
      color === 'positive' ? 'text-stat-positive' : color === 'negative' ? 'text-stat-negative' : 'text-foreground'
    }`}>{value}</p>
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div className="game-panel">
    <div className="game-panel-header">
      {icon && <span className="text-primary/70">{icon}</span>}
      <h3>{title}</h3>
    </div>
    {children}
  </div>
);

const Row = ({ label, value, negative }: { label: string; value: string; negative?: boolean }) => (
  <div className="flex justify-between text-[10px]">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-mono ${negative ? 'text-stat-negative' : 'text-foreground'}`}>{value}</span>
  </div>
);

export default ProvincePanel;
