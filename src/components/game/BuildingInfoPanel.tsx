import { Building2, Factory, MapPin, Swords, Wrench } from 'lucide-react';

import { useGame, type SelectedBuildingRef } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { UNIT_STATS } from '@/data/unitStats';
import { BUILDING_INFO, RESOURCE_KEYS } from '@/types/game';

import { EmptyState, InfoListButton, InfoMetric, InfoMetricGrid, InfoPanelFrame, InfoRow, InfoSection } from './infoPanelLayout';

interface BuildingInfoPanelProps {
  selectedBuilding: SelectedBuildingRef;
  onBack: () => void;
  onClose: () => void;
}

const BuildingInfoPanel = ({ selectedBuilding, onBack, onClose }: BuildingInfoPanelProps) => {
  const { state, setSelectedArmyId, setSelectedArmyIds, setSelectedBuilding } = useGame();
  const province = state.provinces[selectedBuilding.provinceId];
  const info = BUILDING_INFO[selectedBuilding.buildingType];

  if (!province || !info) {
    return (
      <InfoPanelFrame title="Building unavailable" onBack={onBack} onClose={onClose}>
        <EmptyState>This building reference is no longer valid.</EmptyState>
      </InfoPanelFrame>
    );
  }

  const owner = state.countries[province.countryId];
  const existing = province.buildings.find(building => building.type === selectedBuilding.buildingType);
  const currentLevel = existing?.level ?? 0;
  const previewLevel = Math.min(info.maxLevel, Math.max(1, currentLevel + (existing ? 0 : 1)));
  const constructionCost = Object.fromEntries(RESOURCE_KEYS.map(resource => [resource, info.baseCost[resource] * previewLevel])) as typeof info.baseCost;
  const enabledUnits = Object.entries(UNIT_STATS).filter(([, stats]) => stats.requiredBuilding === selectedBuilding.buildingType);
  const armies = Object.values(state.armies).filter(army => army.provinceId === province.id);

  return (
    <InfoPanelFrame
      title={info.name}
      subtitle={`${province.name} · ${owner?.name ?? province.countryId}`}
      icon={<Building2 size={18} />}
      onBack={onBack}
      onClose={onClose}
    >
      <InfoSection title="Stats">
        <InfoMetricGrid>
          <InfoMetric label="Current level" value={`Lv.${currentLevel}`} />
          <InfoMetric label="Max level" value={info.maxLevel} />
          <InfoMetric label="Build time" value={`${info.buildTime + Math.max(0, currentLevel - 1)} turns`} />
          <InfoMetric label="Category" value={info.category.replace('_', ' ')} />
        </InfoMetricGrid>
      </InfoSection>

      <InfoSection title="Production">
        {RESOURCE_KEYS.map(resource => (
          constructionCost[resource] > 0 ? <InfoRow key={resource} label={resource} value={formatNumber(constructionCost[resource])} /> : null
        ))}
      </InfoSection>

      <InfoSection title="Ownership">
        <InfoRow label="Province" value={province.name} />
        <InfoRow label="Owner" value={owner?.name ?? province.countryId} />
        <InfoRow label="Constructed" value={existing ? 'Yes' : 'No'} valueClassName={existing ? 'text-emerald-400' : 'text-amber-300'} />
        <InfoRow label="Local armies" value={armies.length} />
      </InfoSection>

      <InfoSection title="Effects">
        <InfoRow label="Description" value={info.description} />
        {info.bonuses.production ? <InfoRow label="Production output" value={`+${info.bonuses.production * previewLevel}%`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.movementSpeed ? <InfoRow label="Movement speed" value={`+${info.bonuses.movementSpeed * previewLevel}%`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.resourceYield ? <InfoRow label="Resource yield" value={`+${info.bonuses.resourceYield * previewLevel}%`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.defenseBonus ? <InfoRow label="Defense bonus" value={`+${info.bonuses.defenseBonus * previewLevel}%`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.radarRange ? <InfoRow label="Radar range" value={`+${info.bonuses.radarRange * previewLevel}`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.antiAirEfficiency ? <InfoRow label="Anti-air efficiency" value={`+${info.bonuses.antiAirEfficiency * previewLevel}%`} valueClassName="text-emerald-400" /> : null}
      </InfoSection>

      <InfoSection title="Units">
        {enabledUnits.length > 0 ? enabledUnits.map(([unitType, stats]) => (
          <InfoListButton
            key={unitType}
            title={stats.name}
            subtitle={`ATK ${stats.attack} · DEF ${stats.defense} · Build ${stats.buildTime}t`}
            meta={stats.requiredResearch ?? 'available'}
            accent={<span>{stats.icon}</span>}
          />
        )) : <EmptyState>No units are unlocked by this building.</EmptyState>}
      </InfoSection>

      <InfoSection title="Buildings">
        {province.buildings.length > 0 ? province.buildings.map(building => (
          <InfoListButton
            key={`${building.type}-${building.level}`}
            title={BUILDING_INFO[building.type].name}
            subtitle={BUILDING_INFO[building.type].description}
            meta={`Lv.${building.level}`}
            accent={<Building2 size={14} />}
            onClick={() => setSelectedBuilding({ provinceId: province.id, buildingType: building.type })}
          />
        )) : <EmptyState>No other buildings exist in this province.</EmptyState>}
      </InfoSection>
    </InfoPanelFrame>
  );
};

export default BuildingInfoPanel;
