import { useGame, PanelType } from '@/context/GameContext';
import { BarChart3, Sword, Globe, FlaskConical, Building2, LayoutDashboard } from 'lucide-react';

const panels: { id: PanelType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { id: 'economy', label: 'Economy', icon: <BarChart3 size={16} /> },
  { id: 'military', label: 'Military', icon: <Sword size={16} /> },
  { id: 'diplomacy', label: 'Diplomacy', icon: <Globe size={16} /> },
  { id: 'technology', label: 'Research', icon: <FlaskConical size={16} /> },
  { id: 'infrastructure', label: 'Infrastructure', icon: <Building2 size={16} /> },
];

const SideNav = () => {
  const { activePanel, setActivePanel } = useGame();

  return (
    <div className="w-14 bg-panel border-r border-panel flex flex-col items-center py-3 gap-1 shrink-0">
      {panels.map(p => (
        <button
          key={p.id}
          onClick={() => setActivePanel(p.id)}
          className={`w-10 h-10 rounded-md flex items-center justify-center transition-all ${
            activePanel === p.id
              ? 'bg-primary text-primary-foreground glow-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title={p.label}
        >
          {p.icon}
        </button>
      ))}
    </div>
  );
};

export default SideNav;
