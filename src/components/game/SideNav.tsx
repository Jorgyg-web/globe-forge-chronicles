import { useGame, PanelType } from '@/context/GameContext';
import { BarChart3, Sword, Globe, FlaskConical, Building2, LayoutDashboard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const panels: { id: PanelType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { id: 'economy', label: 'Economy', icon: <BarChart3 size={16} /> },
  { id: 'military', label: 'Military', icon: <Sword size={16} /> },
  { id: 'diplomacy', label: 'Diplomacy', icon: <Globe size={16} /> },
  { id: 'technology', label: 'Research', icon: <FlaskConical size={16} /> },
  { id: 'infrastructure', label: 'Infra', icon: <Building2 size={16} /> },
];

const SideNav = () => {
  const { activePanel, setActivePanel } = useGame();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-12 bg-panel border-r border-panel flex flex-col items-center py-2 gap-0.5 shrink-0 relative">
        {/* Top accent */}
        <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-transparent to-transparent" />
        
        {panels.map((p, i) => {
          const isActive = activePanel === p.id;
          return (
            <Tooltip key={p.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActivePanel(p.id)}
                  className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r-full" />
                  )}
                  {p.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-mono">
                {p.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default SideNav;
