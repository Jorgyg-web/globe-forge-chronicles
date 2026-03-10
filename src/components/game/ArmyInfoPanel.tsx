import { ArrowRight, Building2, MapPin, Shield, Swords, Truck } from 'lucide-react';

import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { UNIT_STATS, type UnitType } from '@/data/unitStats';
import { BUILDING_INFO, TERRAIN_MOVEMENT_COST, TERRAIN_SUPPLY_EFFICIENCY, type ArmyId, type BuildingType } from '@/types/game';

import { EmptyState, InfoListButton, InfoMetric, InfoMetricGrid, InfoPanelFrame, InfoRow, InfoSection } from './infoPanelLayout';

const BUILDING_ICONS: Record<BuildingType, string> = {
  industrialComplex: '🏭', infrastructure: '🛣️', resourceExtractor: '⛏️', militaryBase: '🪖', airbase: '✈️', navalBase: '⚓', fortification: '🏰', radar: '📡', antiAirDefense: '🎯',
};

interface ArmyInfoPanelProps {
  armyId: ArmyId;
  onBack: () => void;
  onClose: () => void;
}

const ArmyInfoPanel = ({ armyId, onBack, onClose }: ArmyInfoPanelProps) => {
  const { state, setSelectedProvinceId, setSelectedCountryId, setSelectedBuilding } = useGame();
  const army = state.armies[armyId];

  if (!army) {
    return (
      <InfoPanelFrame title="Army unavailable" onBack={onBack} onClose={onClose}>
        <EmptyState>This army no longer exists.</EmptyState>
      </InfoPanelFrame>
    );
  }

  const country = state.countries[army.countryId];
  const province = state.provinces[army.provinceId];
  const targetProvince = army.targetProvinceId ? state.provinces[army.targetProvinceId] : null;
  const totalUnits = army.units.reduce((sum, unit) => sum + unit.count, 0);
  const totalAttack = army.units.reduce((sum, unit) => sum + UNIT_STATS[unit.type].attack * unit.count, 0);
  const totalDefense = army.units.reduce((sum, unit) => sum + UNIT_STATS[unit.type].defense * unit.count, 0);
  const totalSupply = army.units.reduce((sum, unit) => sum + UNIT_STATS[unit.type].supplyUsage * unit.count, 0);
  const averageHealth = totalUnits > 0
    ? army.units.reduce((sum, unit) => sum + unit.health * unit.count, 0) / totalUnits
    : 0;

  return (
    <InfoPanelFrame
      title={army.name}
      subtitle={`${country?.name ?? army.countryId} · ${province?.name ?? army.provinceId}`}
      icon={<Swords size={18} />}
      onBack={onBack}
      onClose={onClose}
    >
      <InfoSection title="Stats">
        <InfoMetricGrid>
          <InfoMetric label="Unit count" value={formatNumber(totalUnits)} />
          <InfoMetric label="Morale" value={`${army.morale.toFixed(0)}%`} tone={army.morale >= 60 ? 'positive' : army.morale <= 40 ? 'negative' : 'neutral'} />
          <InfoMetric label="Attack" value={formatNumber(totalAttack)} />
          <InfoMetric label="Defense" value={formatNumber(totalDefense)} />
        </InfoMetricGrid>
      </InfoSection>

      <InfoSection title="Production">
        <InfoRow label="Supply usage" value={`${totalSupply}/turn`} valueClassName="text-rose-400" />
        <InfoRow label="Average health" value={`${averageHealth.toFixed(0)}%`} valueClassName={averageHealth >= 70 ? 'text-emerald-400' : averageHealth <= 40 ? 'text-rose-400' : 'text-amber-300'} />
        <InfoRow label="Replacement value" value={formatNumber(army.units.reduce((sum, unit) => sum + UNIT_STATS[unit.type].buildTime * unit.count, 0))} />
      </InfoSection>

      <InfoSection title="Ownership">
        <InfoRow label="Owner" value={country?.name ?? army.countryId} />
        <InfoRow label="Current province" value={province?.name ?? army.provinceId} />
        <InfoRow label="Destination" value={targetProvince?.name ?? 'Holding position'} valueClassName={targetProvince ? 'text-amber-300' : 'text-emerald-400'} />
        <InfoRow label="Path length" value={army.path.length} />
      </InfoSection>

      <InfoSection title="Effects">
        <InfoRow label="Movement penalty" value={province ? `${TERRAIN_MOVEMENT_COST[province.terrain].toFixed(1)}x` : '—'} />
        <InfoRow label="Supply efficiency" value={province ? `${Math.round(TERRAIN_SUPPLY_EFFICIENCY[province.terrain] * 100)}%` : '—'} valueClassName={province && TERRAIN_SUPPLY_EFFICIENCY[province.terrain] >= 1 ? 'text-emerald-400' : 'text-amber-300'} />
        <InfoRow label="Transit status" value={targetProvince ? `${(army.movementProgress * 100).toFixed(0)}% en route` : 'Ready'} valueClassName={targetProvince ? 'text-amber-300' : 'text-emerald-400'} />
      </InfoSection>

      <InfoSection title="Units">
        {army.units.map(unit => {
          const stats = UNIT_STATS[unit.type];
          return (
            <InfoListButton
              key={unit.type}
              title={`${stats.name} ×${unit.count}`}
              subtitle={`ATK ${stats.attack} · DEF ${stats.defense} · HP ${unit.health.toFixed(0)}% · SUP ${stats.supplyUsage}`}
              meta={stats.armorClass}
              accent={<span>{stats.icon}</span>}
            />
          );
        })}
      </InfoSection>

      <InfoSection title="Buildings">
        {province?.buildings.length ? province.buildings.map(building => (
          <InfoListButton
            key={`${building.type}-${building.level}`}
            title={BUILDING_INFO[building.type].name}
            subtitle={BUILDING_INFO[building.type].description}
            meta={`Lv.${building.level}`}
            accent={<span>{BUILDING_ICONS[building.type]}</span>}
            onClick={() => {
              setSelectedProvinceId(province.id);
              setSelectedCountryId(province.countryId);
              setSelectedBuilding({ provinceId: province.id, buildingType: building.type });
            }}
          />
        )) : <EmptyState>No local military support buildings.</EmptyState>}
      </InfoSection>
    </InfoPanelFrame>
  );
};

export default ArmyInfoPanel;
