import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { Users, TrendingUp, Shield, Award, Landmark, Briefcase, Swords, FlaskConical, Building2 } from 'lucide-react';

const StatRow = ({ label, value, suffix = '', positive, icon }: { label: string; value: string | number; suffix?: string; positive?: boolean | null; icon?: React.ReactNode }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0 group">
    <div className="flex items-center gap-2">
      {icon && <span className="text-muted-foreground group-hover:text-foreground transition-colors">{icon}</span>}
      <span className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">{label}</span>
    </div>
    <span className={`text-xs font-mono font-medium tabular-nums ${positive === true ? 'text-stat-positive' : positive === false ? 'text-stat-negative' : 'text-foreground'}`}>
      {value}{suffix}
    </span>
  </div>
);

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
  const surplus = country.economy.budget.revenue - country.economy.budget.expenses;
  const totalUnits = Object.values(country.military.units).reduce((s, v) => s + v, 0);

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
            {isPlayer && (
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-semibold">YOU</span>
            )}
            <span className="capitalize">{country.government.type}</span>
          </div>
        </div>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <QuickStat icon={<Users size={12} />} label="Population" value={formatNumber(country.population)} />
        <QuickStat icon={<TrendingUp size={12} />} label="GDP" value={`$${formatNumber(country.economy.gdp)}`} />
        <QuickStat
          icon={<Shield size={12} />}
          label="Stability"
          value={`${country.stability.toFixed(0)}%`}
          color={country.stability > 60 ? 'positive' : country.stability < 35 ? 'negative' : undefined}
        />
        <QuickStat
          icon={<Award size={12} />}
          label="Approval"
          value={`${country.approval.toFixed(0)}%`}
          color={country.approval > 60 ? 'positive' : country.approval < 35 ? 'negative' : undefined}
        />
      </div>

      <Panel title="Economy" icon={<Briefcase size={11} />}>
        <StatRow label="Tax Rate" value={country.economy.taxRate.toFixed(0)} suffix="%" />
        <StatRow label="Budget" value={(surplus >= 0 ? '+' : '') + formatNumber(surplus)} positive={surplus >= 0} />
        <StatRow label="Debt" value={'$' + formatNumber(country.economy.debt)} positive={country.economy.debt < country.economy.gdp * 0.5} />
        <StatRow label="Inflation" value={country.economy.inflation.toFixed(1)} suffix="%" positive={country.economy.inflation < 3 ? true : country.economy.inflation > 6 ? false : null} />
        <StatRow label="Unemployment" value={country.economy.unemployment.toFixed(1)} suffix="%" positive={country.economy.unemployment < 5 ? true : country.economy.unemployment > 10 ? false : null} />
      </Panel>

      <Panel title="Military" icon={<Swords size={11} />}>
        <StatRow label="Units" value={formatNumber(totalUnits)} />
        <StatRow label="Bases" value={country.military.bases} />
        <StatRow label="Factories" value={country.military.factories} />
        <div className="flex gap-2 mt-1.5">
          <MiniBar label="Morale" value={country.military.morale} />
          <MiniBar label="Ready" value={country.military.readiness} />
        </div>
      </Panel>

      <Panel title="Diplomacy" icon={<Landmark size={11} />}>
        {Object.entries(country.diplomacy.relations)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)
          .map(([id, rel]) => (
            <StatRow key={id} label={state.countries[id]?.code || id} value={rel.toFixed(0)} positive={rel > 20 ? true : rel < -20 ? false : null} />
          ))}
      </Panel>

      <Panel title="Technology" icon={<FlaskConical size={11} />}>
        <StatRow label="Researched" value={country.technology.researched.length} />
        <StatRow label="Research/Turn" value={country.technology.researchPerTurn} />
        {country.technology.currentResearch && (
          <div className="mt-1.5">
            <div className="text-[10px] text-muted-foreground mb-1">Researching: {country.technology.currentResearch}</div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full progress-shimmer" style={{ width: `${Math.min(100, (country.technology.currentProgress / 100) * 100)}%` }} />
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Infrastructure" icon={<Building2 size={11} />}>
        {Object.entries(country.infrastructure).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 py-0.5">
            <span className="text-[10px] text-muted-foreground capitalize flex-1">{key}</span>
            <div className="flex gap-px">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`w-1.5 h-3 rounded-sm ${i < val ? 'bg-secondary' : 'bg-muted/50'}`} />
              ))}
            </div>
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
    <p className={`text-sm font-mono font-bold tabular-nums ${
      color === 'positive' ? 'text-stat-positive' : color === 'negative' ? 'text-stat-negative' : 'text-foreground'
    }`}>{value}</p>
  </div>
);

const MiniBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex-1">
    <div className="flex justify-between text-[10px] mb-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${value > 60 ? 'text-stat-positive' : value < 35 ? 'text-stat-negative' : 'text-foreground'}`}>{value.toFixed(0)}%</span>
    </div>
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${value > 60 ? 'bg-success' : value < 35 ? 'bg-danger' : 'bg-primary'}`}
        style={{ width: `${value}%` }}
      />
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
