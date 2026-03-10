import { Building2, Flag, Shield, Swords, Users } from 'lucide-react';

import { useGame } from '@/context/GameContext';
import { formatNumber } from '@/components/game/TopBar';
import { getProvincesForCountry } from '@/data/provinces';
import { BUILDING_INFO, RESOURCE_KEYS, type BuildingType, type CountryId } from '@/types/game';

import { EmptyState, InfoListButton, InfoMetric, InfoMetricGrid, InfoPanelFrame, InfoRow, InfoSection } from './infoPanelLayout';

const BUILDING_ICONS: Record<BuildingType, string> = {
  industrialComplex: '🏭', infrastructure: '🛣️', resourceExtractor: '⛏️', militaryBase: '🪖', airbase: '✈️', navalBase: '⚓', fortification: '🏰', radar: '📡', antiAirDefense: '🎯',
};

interface CountryInfoPanelProps {
  countryId: CountryId;
  onBack: () => void;
  onClose: () => void;
}

const CountryInfoPanel = ({ countryId, onBack, onClose }: CountryInfoPanelProps) => {
  const { state, setSelectedProvinceId, setSelectedArmyId, setSelectedArmyIds, setSelectedBuilding } = useGame();
  const country = state.countries[countryId];

  if (!country) {
    return (
      <InfoPanelFrame title="Country unavailable" onBack={onBack} onClose={onClose}>
        <EmptyState>This country no longer exists.</EmptyState>
      </InfoPanelFrame>
    );
  }

  const provinces = getProvincesForCountry(state.provinces, country.id);
  const armies = Object.values(state.armies).filter(army => army.countryId === country.id);
  const wars = state.wars.filter(war => war.active && (war.attackers.includes(country.id) || war.defenders.includes(country.id)));
  const alliances = state.alliances.filter(alliance => alliance.members.includes(country.id));
  const trades = state.tradeAgreements.filter(trade => trade.countries.includes(country.id));
  const buildingCounts = provinces.reduce<Record<BuildingType, { count: number; provinceId: string } | undefined>>((acc, province) => {
    province.buildings.forEach(building => {
      const existing = acc[building.type];
      acc[building.type] = existing
        ? { ...existing, count: existing.count + 1 }
        : { count: 1, provinceId: province.id };
    });
    return acc;
  }, {} as Record<BuildingType, { count: number; provinceId: string } | undefined>);

  return (
    <InfoPanelFrame
      title={country.name}
      subtitle={`${country.continent} · ${country.government.type}`}
      icon={<div className="h-5 w-5 rounded-sm" style={{ backgroundColor: country.color }} />}
      onBack={onBack}
      onClose={onClose}
    >
      <InfoSection title="Stats">
        <InfoMetricGrid>
          <InfoMetric label="Population" value={formatNumber(country.population)} />
          <InfoMetric label="Stability" value={`${country.stability.toFixed(0)}%`} tone={country.stability >= 60 ? 'positive' : country.stability <= 40 ? 'negative' : 'neutral'} />
          <InfoMetric label="Approval" value={`${country.approval.toFixed(0)}%`} tone={country.approval >= 60 ? 'positive' : country.approval <= 40 ? 'negative' : 'neutral'} />
          <InfoMetric label="Military morale" value={`${country.militaryMorale.toFixed(0)}%`} tone={country.militaryMorale >= 60 ? 'positive' : country.militaryMorale <= 40 ? 'negative' : 'neutral'} />
        </InfoMetricGrid>
      </InfoSection>

      <InfoSection title="Production">
        {RESOURCE_KEYS.map(resource => (
          <InfoRow key={resource} label={`${resource} stockpile`} value={formatNumber(country.resources[resource])} />
        ))}
        <div className="border-t border-border/30 pt-2">
          {RESOURCE_KEYS.map(resource => (
            <InfoRow key={`${resource}-income`} label={`${resource} income`} value={`${country.resourceIncome[resource] >= 0 ? '+' : ''}${country.resourceIncome[resource]}`} valueClassName={country.resourceIncome[resource] >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
          ))}
        </div>
      </InfoSection>

      <InfoSection title="Ownership">
        <InfoRow label="Controlled provinces" value={provinces.length} />
        <InfoRow label="Active armies" value={armies.length} />
        <InfoRow label="Player controlled" value={country.isPlayerControlled ? 'Yes' : 'No'} valueClassName={country.isPlayerControlled ? 'text-emerald-400' : undefined} />
        <InfoRow label="National code" value={country.code} />
      </InfoSection>

      <InfoSection title="Effects">
        <InfoRow label="Alliances" value={alliances.length} />
        <InfoRow label="Trade agreements" value={trades.length} />
        <InfoRow label="Active wars" value={wars.length} valueClassName={wars.length > 0 ? 'text-rose-400' : 'text-emerald-400'} />
        <InfoRow label="Research slots" value={country.researchSlots} />
      </InfoSection>

      <InfoSection title="Units">
        {armies.length > 0 ? armies.map(army => {
          const unitCount = army.units.reduce((sum, unit) => sum + unit.count, 0);
          return (
            <InfoListButton
              key={army.id}
              title={army.name}
              subtitle={state.provinces[army.provinceId]?.name ?? army.provinceId}
              meta={`${unitCount} units`}
              accent={<Swords size={14} />}
              onClick={() => {
                setSelectedArmyId(army.id);
                setSelectedArmyIds([army.id]);
                setSelectedBuilding(null);
              }}
            />
          );
        }) : <EmptyState>No armies are deployed by this country.</EmptyState>}
      </InfoSection>

      <InfoSection title="Buildings">
        {Object.entries(buildingCounts).length > 0 ? (Object.entries(buildingCounts) as [BuildingType, { count: number; provinceId: string }][]) .map(([buildingType, info]) => (
          <InfoListButton
            key={buildingType}
            title={BUILDING_INFO[buildingType].name}
            subtitle={BUILDING_INFO[buildingType].description}
            meta={`${info.count} provinces`}
            accent={<span>{BUILDING_ICONS[buildingType]}</span>}
            onClick={() => {
              setSelectedProvinceId(info.provinceId);
              setSelectedBuilding({ provinceId: info.provinceId, buildingType });
            }}
          />
        )) : <EmptyState>No national buildings are available.</EmptyState>}
      </InfoSection>
    </InfoPanelFrame>
  );
};

export default CountryInfoPanel;
