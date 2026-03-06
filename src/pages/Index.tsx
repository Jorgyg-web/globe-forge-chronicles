import { GameProvider, useGame } from '@/context/GameContext';
import TopBar from '@/components/game/TopBar';
import SideNav from '@/components/game/SideNav';
import WorldMap from '@/components/game/WorldMap';
import OverviewPanel from '@/components/game/OverviewPanel';
import EconomyPanel from '@/components/game/EconomyPanel';
import MilitaryPanel from '@/components/game/MilitaryPanel';
import DiplomacyPanel from '@/components/game/DiplomacyPanel';
import TechnologyPanel from '@/components/game/TechnologyPanel';
import InfrastructurePanel from '@/components/game/InfrastructurePanel';
import EventLog from '@/components/game/EventLog';

const GameContent = () => {
  const { activePanel } = useGame();

  const renderPanel = () => {
    switch (activePanel) {
      case 'overview': return <OverviewPanel />;
      case 'economy': return <EconomyPanel />;
      case 'military': return <MilitaryPanel />;
      case 'diplomacy': return <DiplomacyPanel />;
      case 'technology': return <TechnologyPanel />;
      case 'infrastructure': return <InfrastructurePanel />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        {/* Left panel */}
        <div className="w-[340px] border-r border-panel overflow-hidden flex flex-col shrink-0">
          <div className="flex-1 overflow-hidden">
            {renderPanel()}
          </div>
        </div>
        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <WorldMap />
          </div>
          <div className="h-[180px] shrink-0">
            <EventLog />
          </div>
        </div>
      </div>
    </div>
  );
};

const Index = () => (
  <GameProvider>
    <GameContent />
  </GameProvider>
);

export default Index;
