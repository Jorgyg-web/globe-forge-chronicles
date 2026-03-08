import { GameProvider, useGame } from '@/context/GameContext';
import TopBar from '@/components/game/TopBar';
import SideNav from '@/components/game/SideNav';
import WorldMap from '@/components/game/WorldMap';
import OverviewPanel from '@/components/game/OverviewPanel';
import EconomyPanel from '@/components/game/EconomyPanel';
import MilitaryPanel from '@/components/game/MilitaryPanel';
import DiplomacyPanel from '@/components/game/DiplomacyPanel';
import TechnologyPanel from '@/components/game/TechnologyPanel';
import ProvincePanel from '@/components/game/ProvincePanel';
import ConstructionPanel from '@/components/game/ConstructionPanel';
import ProductionPanel from '@/components/game/ProductionPanel';
import EventLog from '@/components/game/EventLog';
import { useMemo } from 'react';

const GameContent = () => {
  const { activePanel } = useGame();

  const panel = useMemo(() => {
    switch (activePanel) {
      case 'overview': return <OverviewPanel />;
      case 'province': return <ProvincePanel />;
      case 'economy': return <EconomyPanel />;
      case 'military': return <MilitaryPanel />;
      case 'diplomacy': return <DiplomacyPanel />;
      case 'technology': return <TechnologyPanel />;
      case 'construction': return <ConstructionPanel />;
      case 'production': return <ProductionPanel />;
    }
  }, [activePanel]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <div className="w-[340px] border-r border-panel overflow-hidden flex flex-col shrink-0 bg-card">
          <div className="flex-1 overflow-hidden" key={activePanel}>
            {panel}
          </div>
        </div>
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

const Index = () => {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
};

export default Index;
