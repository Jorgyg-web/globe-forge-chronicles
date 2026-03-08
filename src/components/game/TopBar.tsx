import { useGame } from '@/context/GameContext';
import { Play, Pause, SkipForward, Shield, Activity, Calendar, Clock, Fuel, Pickaxe, Cpu, Wheat, DollarSign } from 'lucide-react';
import { RESOURCE_KEYS, Resources } from '@/types/game';

const RESOURCE_ICONS: Record<keyof Resources, React.ReactNode> = {
  food: <Wheat size={10} />, oil: <Fuel size={10} />, metal: <Pickaxe size={10} />,
  electronics: <Cpu size={10} />, money: <DollarSign size={10} />,
};

const TopBar = () => {
  const { state, dispatch } = useGame();
  const playerCountry = state.countries[state.playerCountryId];
  const activeWars = state.wars.filter(w => w.active).length;

  return (
    <div className="h-11 bg-panel border-b border-panel flex items-center justify-between px-3 shrink-0 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="flex items-center gap-4">
        <h1 className="font-display text-primary font-bold text-sm tracking-[0.2em]">GEOSTRATEGY</h1>
        <div className="h-5 w-px bg-border/60" />
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar size={11} className="text-primary/60" />
            <span>{String(state.month).padStart(2, '0')}/{state.year}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock size={11} className="text-primary/60" />
            <span>T{state.turn}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Key resources */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {RESOURCE_KEYS.map(key => (
            <div key={key} className="flex items-center gap-1 text-muted-foreground">
              {RESOURCE_ICONS[key]}
              <span className="text-foreground">{formatNumber(playerCountry.resources[key])}</span>
            </div>
          ))}
        </div>

        <div className="h-4 w-px bg-border/40" />

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <TopStat icon={<Activity size={10} />} label="" value={`${playerCountry.stability.toFixed(0)}%`} />
          <TopStat icon={<Shield size={10} />} label="" value={`${playerCountry.approval.toFixed(0)}%`} />
          {activeWars > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-danger/10 border border-danger/20">
              <div className="w-1.5 h-1.5 rounded-full bg-danger badge-pulse" />
              <span className="text-danger text-[10px] font-mono font-semibold">{activeWars} WAR{activeWars > 1 ? 'S' : ''}</span>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border/40" />

        {/* Game controls */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
            className={`p-1.5 rounded-md transition-all ${state.paused ? 'text-foreground hover:bg-muted' : 'text-primary bg-primary/10 hover:bg-primary/20'}`}
            title={state.paused ? 'Resume' : 'Pause'}>
            {state.paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button onClick={() => dispatch({ type: 'NEXT_TURN' })}
            className="p-1.5 rounded-md hover:bg-muted transition-all text-foreground" title="Next Turn">
            <SkipForward size={13} />
          </button>
          <div className="flex items-center gap-px ml-1 bg-muted/50 rounded-md p-0.5">
            {(['slow', 'normal', 'fast'] as const).map(speed => (
              <button key={speed} onClick={() => dispatch({ type: 'SET_SPEED', speed })}
                className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded transition-all ${state.speed === speed ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {speed === 'slow' ? '1×' : speed === 'normal' ? '2×' : '3×'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TopStat = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) => (
  <div className="flex items-center gap-1">
    <span className="text-muted-foreground">{icon}</span>
    {label && <span className="text-muted-foreground hidden xl:inline">{label}</span>}
    <span className={`font-semibold ${color || 'text-foreground'}`}>{value}</span>
  </div>
);

export function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(1) + 'T';
  if (Math.abs(num) >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toFixed(0);
}

export default TopBar;
