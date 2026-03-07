import { useGame } from '@/context/GameContext';
import { ScrollText, Swords, Globe, TrendingUp, FlaskConical, AlertTriangle, Landmark, Zap } from 'lucide-react';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  war: <Swords size={10} className="text-danger" />,
  diplomacy: <Globe size={10} className="text-info" />,
  economy: <TrendingUp size={10} className="text-primary" />,
  military: <Swords size={10} className="text-warning" />,
  technology: <FlaskConical size={10} className="text-secondary" />,
  disaster: <AlertTriangle size={10} className="text-danger" />,
  political: <Landmark size={10} className="text-info" />,
};

const EVENT_BG: Record<string, string> = {
  war: 'bg-danger/10 border-danger/20',
  diplomacy: 'bg-info/10 border-info/20',
  economy: 'bg-primary/10 border-primary/20',
  military: 'bg-warning/10 border-warning/20',
  technology: 'bg-secondary/10 border-secondary/20',
  disaster: 'bg-danger/10 border-danger/20',
  political: 'bg-info/10 border-info/20',
};

const EventLog = () => {
  const { state } = useGame();
  const recentEvents = [...state.events].reverse().slice(0, 30);

  return (
    <div className="h-full border-t border-panel flex flex-col bg-panel relative">
      {/* Top fade gradient */}
      <div className="absolute top-8 left-0 right-0 h-4 bg-gradient-to-b from-[hsl(var(--panel))] to-transparent z-10 pointer-events-none" />
      
      <div className="bg-panel-header px-3 py-1.5 border-b border-border shrink-0 flex items-center gap-2">
        <ScrollText size={11} className="text-primary/70" />
        <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-widest">Event Log</h3>
        <span className="text-[9px] font-mono text-muted-foreground ml-auto">{state.events.length} events</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {recentEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-1">
              <Zap size={16} className="mx-auto text-muted-foreground/30" />
              <p className="text-[10px] text-muted-foreground">No events yet. Advance turns to begin.</p>
            </div>
          </div>
        ) : (
          recentEvents.map((evt, i) => (
            <div
              key={evt.id}
              className={`flex items-start gap-2 px-2 py-1.5 rounded-md border transition-all hover:brightness-110 ${EVENT_BG[evt.type] || 'bg-muted/30 border-border/30'}`}
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <div className="mt-0.5 shrink-0">{EVENT_ICONS[evt.type] || <Zap size={10} />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-muted-foreground shrink-0">T{evt.turn}</span>
                  <span className="text-[10px] font-medium text-foreground truncate">{evt.title}</span>
                </div>
                {evt.description && evt.description !== evt.title && (
                  <p className="text-[9px] text-muted-foreground truncate mt-0.5">{evt.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventLog;
