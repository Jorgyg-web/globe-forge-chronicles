import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { ScrollArea } from '@/components/ui/scroll-area';

const EventLog = () => {
  const { state } = useGame();
  const recentEvents = [...state.events].reverse().slice(0, 20);

  return (
    <div className="h-full border-t border-panel flex flex-col bg-panel">
      <div className="bg-panel-header px-3 py-1.5 border-b border-border shrink-0">
        <h3 className="text-[10px] font-mono font-semibold text-primary uppercase tracking-wider">Event Log</h3>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {recentEvents.length === 0 ? (
          <p className="text-[10px] text-muted-foreground p-2">No events yet. Advance turns to start the simulation.</p>
        ) : (
          recentEvents.map(evt => (
            <div key={evt.id} className="flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/50 transition-colors">
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">T{evt.turn}</span>
              <div>
                <span className={`text-[10px] font-mono px-1 py-0.5 rounded mr-1 ${
                  evt.type === 'war' ? 'bg-danger/20 text-danger' :
                  evt.type === 'diplomacy' ? 'bg-info/20 text-info' :
                  evt.type === 'technology' ? 'bg-secondary/20 text-secondary' :
                  'bg-muted text-muted-foreground'
                }`}>{evt.type.toUpperCase()}</span>
                <span className="text-[10px] text-foreground">{evt.title}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventLog;
