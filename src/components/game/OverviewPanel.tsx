import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { Country } from '@/types/game';

const StatRow = ({ label, value, suffix = '', positive }: { label: string; value: string | number; suffix?: string; positive?: boolean | null }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className={`text-xs font-mono font-medium ${positive === true ? 'text-stat-positive' : positive === false ? 'text-stat-negative' : 'text-foreground'}`}>
      {value}{suffix}
    </span>
  </div>
);

const OverviewPanel = () => {
  const { state, selectedCountryId } = useGame();
  const country = selectedCountryId ? state.countries[selectedCountryId] : null;

  if (!country) {
    return (
      <div className="p-4 text-muted-foreground text-sm">
        Select a country on the map to view details.
      </div>
    );
  }

  const isPlayer = country.id === state.playerCountryId;
  const surplus = country.economy.budget.revenue - country.economy.budget.expenses;
  const totalUnits = Object.values(country.military.units).reduce((s, v) => s + v, 0);

  return (
    <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin h-full">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md flex items-center justify-center font-mono font-bold text-sm" style={{ backgroundColor: country.color + '40', color: country.color }}>
          {country.code}
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">{country.name}</h2>
          <p className="text-[10px] text-muted-foreground">{country.continent} {isPlayer && '• Your Country'}</p>
        </div>
      </div>

      <Panel title="General">
        <StatRow label="Population" value={formatNumber(country.population)} />
        <StatRow label="Stability" value={country.stability.toFixed(0)} suffix="%" positive={country.stability > 50 ? true : country.stability < 30 ? false : null} />
        <StatRow label="Approval" value={country.approval.toFixed(0)} suffix="%" positive={country.approval > 50 ? true : country.approval < 30 ? false : null} />
        <StatRow label="Government" value={country.government.type} />
        <StatRow label="Corruption" value={country.government.corruption.toFixed(0)} suffix="%" positive={country.government.corruption < 30 ? true : country.government.corruption > 60 ? false : null} />
      </Panel>

      <Panel title="Economy">
        <StatRow label="GDP" value={'$' + formatNumber(country.economy.gdp)} />
        <StatRow label="Tax Rate" value={country.economy.taxRate.toFixed(0)} suffix="%" />
        <StatRow label="Budget Balance" value={(surplus >= 0 ? '+' : '') + formatNumber(surplus)} positive={surplus >= 0} />
        <StatRow label="Debt" value={'$' + formatNumber(country.economy.debt)} positive={country.economy.debt < country.economy.gdp * 0.5} />
        <StatRow label="Inflation" value={country.economy.inflation.toFixed(1)} suffix="%" positive={country.economy.inflation < 3 ? true : country.economy.inflation > 6 ? false : null} />
        <StatRow label="Unemployment" value={country.economy.unemployment.toFixed(1)} suffix="%" positive={country.economy.unemployment < 5 ? true : country.economy.unemployment > 10 ? false : null} />
      </Panel>

      <Panel title="Military">
        <StatRow label="Total Units" value={formatNumber(totalUnits)} />
        <StatRow label="Bases" value={country.military.bases} />
        <StatRow label="Factories" value={country.military.factories} />
        <StatRow label="Morale" value={country.military.morale.toFixed(0)} suffix="%" positive={country.military.morale > 60} />
        <StatRow label="Readiness" value={country.military.readiness.toFixed(0)} suffix="%" positive={country.military.readiness > 60} />
      </Panel>

      <Panel title="Diplomacy">
        {Object.entries(country.diplomacy.relations)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([id, rel]) => (
            <StatRow key={id} label={state.countries[id]?.name || id} value={rel.toFixed(0)} positive={rel > 20 ? true : rel < -20 ? false : null} />
          ))}
      </Panel>

      <Panel title="Technology">
        <StatRow label="Researched" value={country.technology.researched.length} />
        <StatRow label="Research/Turn" value={country.technology.researchPerTurn} />
        {country.technology.currentResearch && (
          <StatRow label="Researching" value={country.technology.currentResearch} />
        )}
      </Panel>
    </div>
  );
};

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border border-border rounded-md overflow-hidden">
    <div className="bg-panel-header px-3 py-1.5 border-b border-border">
      <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">{title}</h3>
    </div>
    <div className="px-3 py-1">{children}</div>
  </div>
);

export default OverviewPanel;
