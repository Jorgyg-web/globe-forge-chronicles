import { useGame } from '@/context/GameContext';
import { Play, Pause, FastForward, SkipForward, ChevronRight } from 'lucide-react';

const TopBar = () => {
  const { state, dispatch } = useGame();
  const playerCountry = state.countries[state.playerCountryId];
  const surplus = playerCountry.economy.budget.revenue - playerCountry.economy.budget.expenses;

  return (
    <div className="h-12 bg-panel border-b border-panel flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-6">
        <h1 className="text-primary font-bold text-lg tracking-wider font-mono">GEOSTRATEGY</h1>
        <div className="h-6 w-px bg-border" />
        <div className="flex items-center gap-4 text-sm font-mono">
          <span className="text-muted-foreground">
            {String(state.month).padStart(2, '0')}/{state.year}
          </span>
          <span className="text-muted-foreground">Turn {state.turn}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">GDP</span>
            <span className="text-foreground">${formatNumber(playerCountry.economy.gdp)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Budget</span>
            <span className={surplus >= 0 ? 'text-stat-positive' : 'text-stat-negative'}>
              {surplus >= 0 ? '+' : ''}{formatNumber(surplus)}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Stability</span>
            <span className="text-foreground">{playerCountry.stability.toFixed(0)}%</span>
          </div>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            className="p-1.5 rounded hover:bg-muted transition-colors text-foreground"
          >
            {state.paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            onClick={() => dispatch({ type: 'NEXT_TURN' })}
            className="p-1.5 rounded hover:bg-muted transition-colors text-foreground"
          >
            <SkipForward size={14} />
          </button>
          <div className="flex items-center gap-0.5 ml-1">
            {(['slow', 'normal', 'fast'] as const).map(speed => (
              <button
                key={speed}
                onClick={() => dispatch({ type: 'SET_SPEED', speed })}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  state.speed === speed
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {speed === 'slow' ? '1x' : speed === 'normal' ? '2x' : '3x'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toFixed(0);
}

export default TopBar;
