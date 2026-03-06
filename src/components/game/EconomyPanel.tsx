import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { EconomySectors } from '@/types/game';

const SECTOR_LABELS: Record<keyof EconomySectors, string> = {
  agriculture: '🌾 Agriculture',
  energy: '⚡ Energy',
  manufacturing: '🏭 Manufacturing',
  technology: '💻 Technology',
  militaryIndustry: '🔧 Military Industry',
};

const EconomyPanel = () => {
  const { state, dispatch } = useGame();
  const country = state.countries[state.playerCountryId];
  const eco = country.economy;
  const surplus = eco.budget.revenue - eco.budget.expenses;

  return (
    <div className="p-4 space-y-4 overflow-y-auto scrollbar-thin h-full">
      <h2 className="text-sm font-bold text-foreground">Economy Management</h2>

      {/* Tax Control */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Tax Policy</h3>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Tax Rate</span>
            <span className="text-xs font-mono text-foreground">{eco.taxRate}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={70}
            value={eco.taxRate}
            onChange={e => dispatch({ type: 'SET_TAX_RATE', countryId: state.playerCountryId, rate: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>5%</span>
            <span>70%</span>
          </div>
          {eco.taxRate > 50 && (
            <p className="text-[10px] text-stat-negative mt-2">⚠ High taxes reduce stability</p>
          )}
        </div>
      </div>

      {/* Budget Overview */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Budget</h3>
        </div>
        <div className="p-3 space-y-1.5">
          <Row label="Revenue" value={`$${formatNumber(eco.budget.revenue)}`} positive />
          <Row label="Expenses" value={`$${formatNumber(eco.budget.expenses)}`} positive={false} />
          <div className="border-t border-border pt-1.5">
            <Row label="Balance" value={`${surplus >= 0 ? '+' : ''}$${formatNumber(surplus)}`} positive={surplus >= 0} bold />
          </div>
          <Row label="National Debt" value={`$${formatNumber(eco.debt)}`} />
          <Row label="Debt/GDP" value={`${((eco.debt / eco.gdp) * 100).toFixed(0)}%`} positive={eco.debt / eco.gdp < 0.6} />
        </div>
      </div>

      {/* Key Indicators */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Indicators</h3>
        </div>
        <div className="p-3 space-y-1.5">
          <Row label="GDP" value={`$${formatNumber(eco.gdp)}`} />
          <Row label="Inflation" value={`${eco.inflation.toFixed(1)}%`} positive={eco.inflation < 3} />
          <Row label="Unemployment" value={`${eco.unemployment.toFixed(1)}%`} positive={eco.unemployment < 5} />
          <Row label="Trade Balance" value={`$${formatNumber(eco.tradeBalance)}`} positive={eco.tradeBalance >= 0} />
        </div>
      </div>

      {/* Sectors */}
      <div className="border border-border rounded-md overflow-hidden">
        <div className="bg-panel-header px-3 py-1.5 border-b border-border">
          <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Economic Sectors</h3>
        </div>
        <div className="p-3 space-y-3">
          {(Object.entries(eco.sectors) as [keyof EconomySectors, typeof eco.sectors.agriculture][]).map(([key, sector]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">{SECTOR_LABELS[key]}</span>
                <span className="text-[10px] font-mono text-muted-foreground">Lv.{sector.level}/10</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${sector.level * 10}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Output: {formatNumber(sector.output)}</span>
                <button
                  onClick={() => dispatch({ type: 'UPGRADE_SECTOR', countryId: state.playerCountryId, sector: key })}
                  disabled={sector.level >= 10}
                  className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  Upgrade (${sector.level * 200})
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, positive, bold }: { label: string; value: string; positive?: boolean; bold?: boolean }) => (
  <div className="flex justify-between items-center">
    <span className={`text-xs ${bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{label}</span>
    <span className={`text-xs font-mono ${bold ? 'font-bold' : 'font-medium'} ${positive === true ? 'text-stat-positive' : positive === false ? 'text-stat-negative' : 'text-foreground'}`}>
      {value}
    </span>
  </div>
);

export default EconomyPanel;
