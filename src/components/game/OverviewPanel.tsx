import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { getProvincesForCountry } from '@/data/provinces';
import { Users, TrendingUp, Shield, Award, Landmark, Swords, FlaskConical, Building2, Fuel, Pickaxe, Cpu, Wheat, DollarSign } from 'lucide-react';
import { RESOURCE_KEYS, Resources } from '@/types/game';

const RESOURCE_ICONS: Record<keyof Resources, React.ReactNode> = {
  food: <Wheat size={10} />, oil: <Fuel size={10} />, metal: <Pickaxe size={10} />,
  electronics: <Cpu size={10} />, money: <DollarSign size={10} />,
};

const OverviewPanel = () => {
  const { state, selectedCountryId } = useGame();
  const country = selectedCountryId ? state.countries[selectedCountryId] : null;

  if (!country) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-center">
        <div className="space-y-2">
          <div className="text-2xl opacity-30">🌍</div>
          <p className="text-sm text-muted-foreground">Select a country on the map</p>
        </div>
      </div>
    );
  }

  const isPlayer = country.id === state.playerCountryId;
  const provs = getProvincesForCountry(state.provinces, country.id);
  const totalArmies = Object.values(state.armies).filter(a => a.countryId === country.id);
  const totalUnits = totalArmies.reduce((s, a) => s + a.units.reduce((s2, u) => s2 + u.count, 0), 0);

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      {/* Country header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/50">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm border border-border/50" style={{ backgroundColor: country.color + '25', color: country.color }}>
          {country.code}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground truncate">{country.name}</h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{country.continent}</span>
            {isPlayer && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-semibold">YOU</span>}
            <span className="capitalize">{country.government.type}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <QuickStat icon={<Users size={12} />} label="Population" value={formatNumber(country.population)} />
        <QuickStat icon={<Shield size={12} />} label="Stability" value={`${country.stability.toFixed(0)}%`}
          color={country.stability > 60 ? 'positive' : country.stability < 35 ? 'negative' : undefined} />
        <QuickStat icon={<Swords size={12} />} label="Units" value={formatNumber(totalUnits)} />
        <QuickStat icon={<Landmark size={12} />} label="Provinces" value={String(provs.length)} />
      </div>

      {/* Resources */}
      <Panel title="Resources" icon={<DollarSign size={11} />}>
        {RESOURCE_KEYS.map(key => (
          <div key={key} className="flex justify-between items-center py-1 border-b border-border/20 last:border-0">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{RESOURCE_ICONS[key]}</span>
              <span className="text-xs text-muted-foreground capitalize">{key}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-foreground">{formatNumber(country.resources[key])}</span>
              <span className={`text-[9px] font-mono ${country.resourceIncome[key] > 0 ? 'text-stat-positive' : 'text-muted-foreground'}`}>
                +{formatNumber(country.resourceIncome[key])}/t
              </span>
            </div>
          </div>
        ))}
      </Panel>

      {/* Military */}
      <Panel title="Military" icon={<Swords size={11} />}>
        <StatRow label="Armies" value={String(totalArmies.length)} />
        <StatRow label="Total Units" value={formatNumber(totalUnits)} />
        <MiniBar label="Morale" value={country.militaryMorale} />
      </Panel>

      {/* Diplomacy */}
      <Panel title="Diplomacy" icon={<Landmark size={11} />}>
        {Object.entries(country.diplomacy.relations)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([id, rel]) => (
            <StatRow key={id} label={state.countries[id]?.code || id} value={rel.toFixed(0)} positive={rel > 20 ? true : rel < -20 ? false : null} />
          ))}
      </Panel>

      {/* Technology */}
      <Panel title="Technology" icon={<FlaskConical size={11} />}>
        <StatRow label="Researched" value={String(country.technology.researched.length)} />
        <StatRow label="Research Slots" value={`${country.technology.activeResearch.length}/${country.researchSlots}`} />
        {country.technology.activeResearch.length > 0 && country.technology.activeResearch.map(ar => (
          <div key={ar.techId} className="text-[10px] text-muted-foreground mt-1">
            Researching: {ar.techId} ({ar.progress}%)
          </div>
        ))}
      </Panel>
    </div>
  );
};

const QuickStat = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: 'positive' | 'negative' }) => (
  <div className="stat-card">
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
    <p className={`text-sm font-mono font-bold tabular-nums ${color === 'positive' ? 'text-stat-positive' : color === 'negative' ? 'text-stat-negative' : 'text-foreground'}`}>{value}</p>
  </div>
);

const StatRow = ({ label, value, positive }: { label: string; value: string; positive?: boolean | null }) => (
  <div className="flex justify-between items-center py-1 border-b border-border/20 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-xs font-mono ${positive === true ? 'text-stat-positive' : positive === false ? 'text-stat-negative' : 'text-foreground'}`}>{value}</span>
  </div>
);

const MiniBar = ({ label, value }: { label: string; value: number }) => (
  <div className="mt-1">
    <div className="flex justify-between text-[10px] mb-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${value > 60 ? 'text-stat-positive' : value < 35 ? 'text-stat-negative' : 'text-foreground'}`}>{value.toFixed(0)}%</span>
    </div>
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${value > 60 ? 'bg-success' : value < 35 ? 'bg-danger' : 'bg-primary'}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const Panel = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div className="game-panel">
    <div className="game-panel-header">
      {icon && <span className="text-primary/70">{icon}</span>}
      <h3>{title}</h3>
    </div>
    <div className="px-3 py-1.5">{children}</div>
  </div>
);

export default OverviewPanel;
