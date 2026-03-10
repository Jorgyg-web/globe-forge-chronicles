import { AlertCircle } from 'lucide-react';

import { useGame } from '@/context/GameContext';

import ArmyInfoPanel from './ArmyInfoPanel';
import BuildingInfoPanel from './BuildingInfoPanel';
import CountryInfoPanel from './CountryInfoPanel';
import ProvinceInfoPanel from './ProvinceInfoPanel';
import { EmptyState, InfoPanelFrame } from './infoPanelLayout';

const InfoPanel = () => {
  const {
    state,
    activePanel,
    setActivePanel,
    selectedCountryId,
    setSelectedCountryId,
    selectedProvinceId,
    setSelectedProvinceId,
    selectedArmyId,
    setSelectedArmyId,
    selectedBuilding,
    setSelectedBuilding,
    setSelectedArmyIds,
  } = useGame();

  const handleClose = () => {
    setSelectedBuilding(null);
    setSelectedArmyId(null);
    setSelectedArmyIds([]);
    setSelectedProvinceId(null);
    setActivePanel('overview');
  };

  const handleBack = () => {
    if (selectedBuilding) {
      setSelectedBuilding(null);
      return;
    }

    if (selectedArmyId) {
      setSelectedArmyId(null);
      setSelectedArmyIds([]);
      return;
    }

    if (selectedProvinceId) {
      setSelectedProvinceId(null);
      return;
    }

    setActivePanel('overview');
  };

  if (selectedBuilding) {
    return <BuildingInfoPanel selectedBuilding={selectedBuilding} onBack={handleBack} onClose={handleClose} />;
  }

  if (selectedArmyId && state.armies[selectedArmyId]) {
    return <ArmyInfoPanel armyId={selectedArmyId} onBack={handleBack} onClose={handleClose} />;
  }

  if (selectedProvinceId && state.provinces[selectedProvinceId]) {
    return <ProvinceInfoPanel provinceId={selectedProvinceId} onBack={handleBack} onClose={handleClose} />;
  }

  if (selectedCountryId && state.countries[selectedCountryId]) {
    return <CountryInfoPanel countryId={selectedCountryId} onBack={handleBack} onClose={handleClose} />;
  }

  return (
    <InfoPanelFrame title="No entity selected" subtitle="Click a province, country, army, or building to inspect it." icon={<AlertCircle size={18} />} onClose={handleClose}>
      <EmptyState>Select an entity on the map or in a management panel to open its information card.</EmptyState>
    </InfoPanelFrame>
  );
};

export default InfoPanel;