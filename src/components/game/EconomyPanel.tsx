import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { EconomySectors } from '@/types/game';
import { TrendingUp, TrendingDown, DollarSign, Percent, Factory, ArrowUpRight } from 'lucide-react';

const SECTOR_CONFIG: Record<keyof EconomySectors, { label: string; icon: string; color: string }> = {
  agriculture: { label: 'Agriculture', icon: '🌾', color: 'hsl(120, 40%, 45%)' },
  energy: { label: 'Energy', icon: '⚡', color: 'hsl(45, 90%, 55%)' },
  manufacturing: { label: 'Manufacturing', icon: '🏭', color: 'hsl(210, 60%, 50%)' },
  technology: { label: 'Technology', icon: '💻', color: 'hsl(270, 60%, 55%)' },
  militaryIndustry: { label: 'Military Industry', icon: '🔧', color: 'hsl(0, 60%, 50%)' },
};

const EconomyPanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const eco = country.economy;
  const surplus = eco.budget.revenue - eco.budget.expenses;

  return (
    <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin h-full animate-panel-in">
      <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
        <DollarSign size={14} className="text-primary" />
        Economy
      </h2>

      {/* Key indicators grid */}
      <div className="grid grid-cols-2 gap-2">
        <IndicatorCard label="GDP" value={`$${formatNumber(eco.gdp)}`} icon={<TrendingUp size={12} />} />
        <IndicatorCard
          label="Balance"
          value={`${surplus >= 0 ? '+' : ''}$${formatNumber(Math.abs(surplus))}`}
          icon={surplus >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          color={surplus >= 0 ? 'positive' : 'negative'}
        />
        <IndicatorCard
          label="Inflation"
          value={`${eco.inflation.toFixed(1)}%`}
          icon={<Percent size={12} />}
          color={eco.inflation < 3 ? 'positive' : eco.inflation > 6 ? 'negative' : undefined}
        />
        <IndicatorCard
          label="Unemployment"
          value={`${eco.unemployment.toFixed(1)}%`}
          icon={<Factory size={12} />}
          color={eco.unemployment < 5 ? 'positive' : eco.unemployment > 10 ? 'negative' : undefined}
        />
      </div>

      {/* Tax Control */}
      <div className="game-panel">
        <div className="game-panel-header">
          <Percent size={11} className="text-primary/70" />
          <h3>Tax Policy</h3>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Tax Rate</span>
            <span className={`text-sm font-mono font-bold tabular-nums ${
              eco.taxRate > 50 ? 'text-stat-negative' : eco.taxRate < 20 ? 'text-stat-positive' : 'text-foreground'
            }`}>{eco.taxRate}%</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={5}
              max={70}
              value={eco.taxRate}
              onChange={e => dispatch({ type: 'SET_TAX_RATE', countryId: state.playerCountryId, rate: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
              <span>5%</span>
              <span>70%</span>
            </div>
          </div>
          {eco.taxRate > 50 && (
            <p className="text-[10px] text-stat-negative mt-2 flex items-center gap-1">
              <TrendingDown size={10} />
              High taxes reduce stability & approval
            </p>
          )}
          {eco.taxRate < 15 && (
            <p className="text-[10px] text-stat-neutral mt-2 flex items-center gap-1">
              <TrendingUp size={10} />
              Low taxes boost growth but reduce revenue
            </p>
          )}
        </div>
      </div>

      {/* Budget Breakdown */}
      <div className="game-panel">
        <div className="game-panel-header">
          <DollarSign size={11} className="text-primary/70" />
          <h3>Budget</h3>
        </div>
        <div className="p-3 space-y-1.5">
          <BudgetRow label="Revenue" value={eco.budget.revenue} positive />
          <BudgetRow label="Military" value={eco.budget.militarySpending} />
          <BudgetRow label="Infrastructure" value={eco.budget.infrastructureSpending} />
          <BudgetRow label="Education" value={eco.budget.educationSpending} />
          <BudgetRow label="Health" value={eco.budget.healthSpending} />
          <BudgetRow label="Research" value={eco.budget.researchSpending} />
          <div className="border-t border-border pt-1.5 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-foreground">Net Balance</span>
              <span className={`text-xs font-mono font-bold tabular-nums ${surplus >= 0 ? 'text-stat-positive' : 'text-stat-negative'}`}>
                {surplus >= 0 ? '+' : ''}${formatNumber(surplus)}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] text-muted-foreground">National Debt</span>
            <span className="text-[10px] font-mono text-foreground">${formatNumber(eco.debt)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Debt/GDP Ratio</span>
            <span className={`text-[10px] font-mono ${eco.debt / eco.gdp < 0.6 ? 'text-stat-positive' : 'text-stat-negative'}`}>
              {((eco.debt / eco.gdp) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Economic Sectors */}
      <div className="game-panel">
        <div className="game-panel-header">
          <Factory size={11} className="text-primary/70" />
          <h3>Sectors</h3>
        </div>
        <div className="p-3 space-y-3">
          {(Object.entries(eco.sectors) as [keyof EconomySectors, typeof eco.sectors.agriculture][]).map(([key, sector]) => {
            const config = SECTOR_CONFIG[key];
            return (
              <div key={key} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{config.icon}</span>
                    <span className="text-xs font-medium text-foreground">{config.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Lv.{sector.level}/10</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${sector.level * 10}%`, backgroundColor: config.color }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground">
                    Output: <span className="text-foreground font-mono">{formatNumber(sector.output)}</span>
                    {sector.growth > 0 && (
                      <span className="text-stat-positive ml-1 inline-flex items-center">
                        <ArrowUpRight size={8} />+{sector.growth.toFixed(1)}%
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => dispatch({ type: 'UPGRADE_SECTOR', countryId: state.playerCountryId, sector: key })}
                    disabled={sector.level >= 10}
                    className="game-btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {sector.level >= 10 ? 'MAX' : `Upgrade $${sector.level * 200}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const IndicatorCard = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color?: 'positive' | 'negative' }) => (
  <div className="stat-card">
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className={color === 'positive' ? 'text-stat-positive' : color === 'negative' ? 'text-stat-negative' : 'text-muted-foreground'}>
        {icon}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
    <p className={`text-sm font-mono font-bold tabular-nums ${
      color === 'positive' ? 'text-stat-positive' : color === 'negative' ? 'text-stat-negative' : 'text-foreground'
    }`}>{value}</p>
  </div>
);

const BudgetRow = ({ label, value, positive }: { label: string; value: number; positive?: boolean }) => (
  <div className="flex justify-between items-center">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className={`text-[11px] font-mono tabular-nums ${positive ? 'text-stat-positive' : 'text-foreground'}`}>
      {positive ? '+' : '-'}${formatNumber(Math.abs(value))}
    </span>
  </div>
);

export default EconomyPanel;
