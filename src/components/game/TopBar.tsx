import { useGame } from '@/context/GameContext';
import ResourceBar from '@/components/game/resources/ResourceBar';
import { Play, Pause, SkipForward, Shield, Activity, Calendar, Clock } from 'lucide-react';
import { buildTopResourceItems } from '@/components/game/resources/resourceBarData';

const TopBar = () => {
  const { state, dispatch, worldLoading } = useGame();
  const playerCountry = state.countries[state.playerCountryId];
  const activeWars = state.wars.filter(w => w.active).length;

  if (worldLoading || !playerCountry) {
    return (
      <div className="h-12 bg-panel border-b border-panel flex items-center justify-center px-3 shrink-0">
        <span className="text-muted-foreground text-xs font-mono">Loading...</span>
      </div>
    );
  }

  const resourceItems = buildTopResourceItems(state);

  return (
    <div className="relative shrink-0 border-b border-panel bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.12),transparent_35%),linear-gradient(180deg,hsl(var(--panel))_0%,rgba(9,13,22,0.95)_100%)] px-3 py-2">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex shrink-0 items-center gap-3">
          <h1 className="font-display text-primary font-bold text-sm tracking-[0.24em]">GLOBE FORGE</h1>
          <div className="hidden h-7 w-px bg-border/50 lg:block" />
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

        <ResourceBar items={resourceItems} formatValue={formatNumber} formatDelta={formatDelta} />

        <div className="flex shrink-0 items-center gap-2 text-[11px] font-mono">
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
    </div>
  );
};

const TopStat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="hidden items-center gap-1.5 rounded-md border border-border/40 bg-background/20 px-2 py-1 text-xs xl:flex">
    <span className="text-muted-foreground">{icon}</span>
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

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
