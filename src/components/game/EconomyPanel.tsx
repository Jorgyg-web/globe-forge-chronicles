import { useGame } from '@/context/GameContext';
import { RESOURCE_KEYS, Resources } from '@/types/game';
import { formatNumber } from '@/components/game/TopBar';
import { DollarSign, Fuel, Pickaxe, Cpu, Wheat, TrendingUp } from 'lucide-react';

const RESOURCE_ICONS: Record<keyof Resources, React.ReactNode> = {
  food: <Wheat size={12} />, oil: <Fuel size={12} />, metal: <Pickaxe size={12} />,
  electronics: <Cpu size={12} />, money: <DollarSign size={12} />,
};

const RESOURCE_COLORS: Record<keyof Resources, string> = {
  food: 'hsl(120, 40%, 45%)', oil: 'hsl(35, 80%, 50%)',
  metal: 'hsl(210, 50%, 55%)', electronics: 'hsl(270, 60%, 55%)',
  money: 'hsl(42, 100%, 58%)',
};

const EconomyPanel = () => {
  const { state } = useGame();
  const country = state.countries[state.playerCountryId];

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <DollarSign size={14} className="text-primary" />
        Economy & Resources
      </h2>

      {/* Resource overview */}
      <div className="space-y-2">
        {RESOURCE_KEYS.map(key => {
          const stockpile = country.resources[key];
          const income = country.resourceIncome[key];
          return (
            <div key={key} className="game-panel">
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span style={{ color: RESOURCE_COLORS[key] }}>{RESOURCE_ICONS[key]}</span>
                    <span className="text-xs font-medium text-foreground capitalize">{key}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-foreground tabular-nums">{formatNumber(stockpile)}</span>
                    <span className={`text-[10px] font-mono flex items-center gap-0.5 ${income > 0 ? 'text-stat-positive' : 'text-muted-foreground'}`}>
                      <TrendingUp size={9} />+{formatNumber(income)}/t
                    </span>
                  </div>
                </div>
                {/* Stockpile bar */}
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (stockpile / Math.max(1, stockpile + 1000)) * 100)}%`, backgroundColor: RESOURCE_COLORS[key] }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Country stats */}
      <div className="game-panel">
        <div className="game-panel-header">
          <TrendingUp size={11} className="text-primary/70" />
          <h3>Country Status</h3>
        </div>
        <div className="px-3 py-2 space-y-1">
          <Row label="Population" value={formatNumber(country.population)} />
          <Row label="Stability" value={`${country.stability.toFixed(0)}%`} good={country.stability > 60} bad={country.stability < 35} />
          <Row label="Approval" value={`${country.approval.toFixed(0)}%`} good={country.approval > 60} bad={country.approval < 35} />
          <Row label="Corruption" value={`${country.government.corruption.toFixed(0)}%`} bad={country.government.corruption > 40} />
          <Row label="Government" value={country.government.type} />
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, good, bad }: { label: string; value: string; good?: boolean; bad?: boolean }) => (
  <div className="flex justify-between items-center py-0.5">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className={`text-[11px] font-mono ${good ? 'text-stat-positive' : bad ? 'text-stat-negative' : 'text-foreground'}`}>{value}</span>
  </div>
);

export default EconomyPanel;
