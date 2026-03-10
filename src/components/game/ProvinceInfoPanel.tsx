import { Building2, Castle, Hammer, Shield, Swords, Users, Wheat } from 'lucide-react';

import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { BUILDING_INFO, RESOURCE_KEYS, TERRAIN_DEFENSE_BONUS, TERRAIN_MOVEMENT_COST, TERRAIN_SUPPLY_EFFICIENCY, type BuildingType, type ProvinceId } from '@/types/game';

import { EmptyState, InfoBadge, InfoListButton, InfoMetric, InfoMetricGrid, InfoPanelFrame, InfoRow, InfoSection } from './infoPanelLayout';

const TERRAIN_ICONS: Record<string, string> = {
  plains: '🌾', forest: '🌲', mountain: '⛰️', desert: '🏜️', jungle: '🌿', urban: '🏙️', coastal: '🏖️', arctic: '❄️',
};

const BUILDING_ICONS: Record<BuildingType, string> = {
  industrialComplex: '🏭',
  infrastructure: '🛣️',
  resourceExtractor: '⛏️',
  militaryBase: '🪖',
  airbase: '✈️',
  navalBase: '⚓',
  fortification: '🏰',
  radar: '📡',
  antiAirDefense: '🎯',
};

interface ProvinceInfoPanelProps {
  provinceId: ProvinceId;
  onBack: () => void;
  onClose: () => void;
}

const ProvinceInfoPanel = ({ provinceId, onBack, onClose }: ProvinceInfoPanelProps) => {
  const {
    state,
    setSelectedArmyId,
    setSelectedArmyIds,
    setSelectedBuilding,
    setSelectedCountryId,
    setSelectedProvinceId,
    setProvincePanelTab,
    setActivePanel,
  } = useGame();
  const province = state.provinces[provinceId];

  if (!province) {
    return (
      <InfoPanelFrame title="Province unavailable" onBack={onBack} onClose={onClose}>
        <EmptyState>This province no longer exists.</EmptyState>
      </InfoPanelFrame>
    );
  }

  const owner = state.countries[province.countryId];
  const originalOwner = state.countries[province.originalCountryId];
  const armies = Object.values(state.armies).filter(army => army.provinceId === province.id);

  const openProvinceTab = (tab: 'overview' | 'build' | 'recruit') => {
    setSelectedCountryId(province.countryId);
    setSelectedProvinceId(province.id);
    setSelectedArmyId(null);
    setSelectedArmyIds([]);
    setSelectedBuilding(null);
    setProvincePanelTab(tab);
    setActivePanel('province');
  };

  return (
    <InfoPanelFrame
      title={province.name}
      subtitle={`${province.terrain} terrain · development ${province.development}/100`}
      icon={<span className="text-lg">{TERRAIN_ICONS[province.terrain] ?? '🗺️'}</span>}
      onBack={onBack}
      onClose={onClose}
    >
      <InfoSection title="Actions">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => openProvinceTab('build')}
            className="flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <Hammer size={14} className="text-primary" />
            Build
          </button>
          <button
            type="button"
            onClick={() => openProvinceTab('recruit')}
            className="flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <Swords size={14} className="text-primary" />
            Recruit
          </button>
        </div>
      </InfoSection>

      <InfoSection title="Stats">
        <InfoMetricGrid>
          <InfoMetric label="Population" value={formatNumber(province.population)} />
          <InfoMetric label="Morale" value={`${province.morale.toFixed(0)}%`} tone={province.morale >= 60 ? 'positive' : province.morale <= 35 ? 'negative' : 'neutral'} />
          <InfoMetric label="Stability" value={`${province.stability.toFixed(0)}%`} tone={province.stability >= 60 ? 'positive' : province.stability <= 40 ? 'negative' : 'neutral'} />
          <InfoMetric label="Corruption" value={`${province.corruption.toFixed(0)}%`} tone={province.corruption >= 40 ? 'negative' : 'neutral'} />
        </InfoMetricGrid>
      </InfoSection>

      <InfoSection title="Production">
        {RESOURCE_KEYS.map(resource => (
          <InfoRow key={resource} label={resource} value={`+${province.resourceProduction[resource]}`} valueClassName={province.resourceProduction[resource] > 0 ? 'text-emerald-400' : undefined} />
        ))}
      </InfoSection>

      <InfoSection title="Ownership">
        <InfoRow label="Current owner" value={owner?.name ?? province.countryId} />
        <InfoRow label="Original owner" value={originalOwner?.name ?? province.originalCountryId} />
        <InfoRow label="Coastal access" value={province.isCoastal ? 'Yes' : 'No'} valueClassName={province.isCoastal ? 'text-emerald-400' : undefined} />
        <InfoRow label="Adjacent provinces" value={province.adjacentProvinces.length} />
      </InfoSection>

      <InfoSection title="Effects">
        <InfoRow label="Terrain defense" value={`${Math.round(TERRAIN_DEFENSE_BONUS[province.terrain] * 100)}%`} valueClassName="text-emerald-400" />
        <InfoRow label="Movement cost" value={`${TERRAIN_MOVEMENT_COST[province.terrain].toFixed(1)}x`} />
        <InfoRow label="Supply efficiency" value={`${Math.round(TERRAIN_SUPPLY_EFFICIENCY[province.terrain] * 100)}%`} valueClassName={TERRAIN_SUPPLY_EFFICIENCY[province.terrain] >= 1 ? 'text-emerald-400' : 'text-amber-300'} />
      </InfoSection>

      <InfoSection title="Units">
        {armies.length > 0 ? armies.map(army => {
          const unitCount = army.units.reduce((sum, unit) => sum + unit.count, 0);
          return (
            <InfoListButton
              key={army.id}
              title={army.name}
              subtitle={army.units.map(unit => `${unit.count}× ${unit.type}`).join(', ')}
              meta={`${unitCount} units`}
              accent={<Swords size={14} />}
              onClick={() => {
                setSelectedCountryId(army.countryId);
                setSelectedArmyId(army.id);
                setSelectedArmyIds([army.id]);
                setSelectedBuilding(null);
              }}
            />
          );
        }) : <EmptyState>No armies are stationed in this province.</EmptyState>}
      </InfoSection>

      <InfoSection title="Buildings">
        {province.buildings.length > 0 ? province.buildings.map(building => (
          <InfoListButton
            key={`${building.type}-${building.level}`}
            title={BUILDING_INFO[building.type].name}
            subtitle={BUILDING_INFO[building.type].description}
            meta={`Lv.${building.level}/${BUILDING_INFO[building.type].maxLevel}`}
            accent={<span>{BUILDING_ICONS[building.type]}</span>}
            onClick={() => setSelectedBuilding({ provinceId: province.id, buildingType: building.type })}
          />
        )) : <EmptyState>No buildings are constructed in this province.</EmptyState>}
      </InfoSection>
    </InfoPanelFrame>
  );
};

export default ProvinceInfoPanel;
