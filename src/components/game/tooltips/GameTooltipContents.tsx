import { UNIT_STATS } from '@/data/unitStats';
import {
  Army,
  BUILDING_INFO,
  Building,
  BuildingType,
  Country,
  Province,
  RESOURCE_KEYS,
  TERRAIN_DEFENSE_BONUS,
  TERRAIN_MOVEMENT_COST,
  TERRAIN_SUPPLY_EFFICIENCY,
  UnitType,
} from '@/types/game';

import { TooltipHeader, TooltipMetric, TooltipMetricGrid, TooltipPanel, TooltipRow, TooltipSection, TooltipTag, TooltipTagList } from './TooltipLayout';

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatModifier(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(value % 1 === 0 ? 0 : 2)}`;
}

function getArmyTotals(army: Army) {
  let totalUnits = 0;
  let supply = 0;
  let attack = 0;
  let defense = 0;

  for (const unit of army.units) {
    const stats = UNIT_STATS[unit.type];
    totalUnits += unit.count;
    supply += stats.supplyUsage * unit.count;
    attack += stats.attack * unit.count;
    defense += stats.defense * unit.count;
  }

  return { totalUnits, supply, attack, defense };
}

function getBuildingMaintenance(type: BuildingType, level: number): number {
  const cost = BUILDING_INFO[type].baseCost;
  return Math.max(1, Math.round((cost.steel + cost.oil + cost.rareMetals) / 55) * Math.max(1, level));
}

export const ProvinceTooltipContent = ({
  province,
  country,
  armyCount = 0,
  moveTarget = false,
}: {
  province: Province;
  country?: Country | null;
  armyCount?: number;
  moveTarget?: boolean;
}) => (
  <TooltipPanel>
    <TooltipHeader
      title={province.name}
      subtitle={`${province.terrain} terrain · ${province.isCoastal ? 'Coastal province' : 'Interior province'}`}
      value={`${province.development}/100`}
      accent={<div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: country?.color ?? 'hsl(var(--primary))' }} />}
    />

    <TooltipMetricGrid>
      <TooltipMetric label="Population" value={formatCompact(province.population)} />
      <TooltipMetric label="Morale" value={formatPercent(province.morale)} tone={province.morale >= 60 ? 'positive' : province.morale <= 35 ? 'negative' : 'neutral'} />
      <TooltipMetric label="Stability" value={formatPercent(province.stability)} tone={province.stability >= 60 ? 'positive' : province.stability <= 40 ? 'negative' : 'neutral'} />
      <TooltipMetric label="Corruption" value={formatPercent(province.corruption)} tone={province.corruption >= 40 ? 'negative' : 'neutral'} />
    </TooltipMetricGrid>

    <TooltipSection title="Terrain effects">
      <TooltipRow label="Defense bonus" value={`${Math.round(TERRAIN_DEFENSE_BONUS[province.terrain] * 100)}%`} valueClassName="text-emerald-400" />
      <TooltipRow label="Movement cost" value={`${TERRAIN_MOVEMENT_COST[province.terrain].toFixed(1)}x`} />
      <TooltipRow label="Supply efficiency" value={`${Math.round(TERRAIN_SUPPLY_EFFICIENCY[province.terrain] * 100)}%`} valueClassName={TERRAIN_SUPPLY_EFFICIENCY[province.terrain] >= 1 ? 'text-emerald-400' : 'text-amber-300'} />
    </TooltipSection>

    <TooltipSection title="Production">
      {RESOURCE_KEYS.map(resource => (
        <TooltipRow
          key={resource}
          label={resource}
          value={formatModifier(province.resourceProduction[resource])}
          valueClassName={province.resourceProduction[resource] > 0 ? 'text-emerald-400' : undefined}
        />
      ))}
    </TooltipSection>

    <TooltipSection title="Province status">
      <TooltipRow label="Owner" value={country?.code ?? '??'} />
      <TooltipRow label="Buildings" value={province.buildings.length} />
      <TooltipRow label="Armies present" value={armyCount} />
      <TooltipRow label="Adjacent provinces" value={province.adjacentProvinces.length} />
    </TooltipSection>

    {province.buildings.length > 0 ? (
      <TooltipSection title="Installed buildings">
        <TooltipTagList>
          {province.buildings.map(building => (
            <TooltipTag key={`${building.type}-${building.level}`}>{BUILDING_INFO[building.type].name} Lv.{building.level}</TooltipTag>
          ))}
        </TooltipTagList>
      </TooltipSection>
    ) : null}

    {moveTarget ? (
      <div className="border-t border-border/40 pt-2 text-xs font-semibold text-emerald-400">✓ Click to move selected army here</div>
    ) : null}
  </TooltipPanel>
);

export const CountryTooltipContent = ({
  country,
  provinceCount,
  armyCount,
  allianceCount,
  tradeCount,
  warCount,
}: {
  country: Country;
  provinceCount: number;
  armyCount: number;
  allianceCount: number;
  tradeCount: number;
  warCount: number;
}) => (
  <TooltipPanel>
    <TooltipHeader
      title={country.name}
      subtitle={`${country.continent} · ${country.government.type}`}
      value={country.code}
      accent={<div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: country.color }} />}
    />

    <TooltipMetricGrid>
      <TooltipMetric label="Population" value={formatCompact(country.population)} />
      <TooltipMetric label="Stability" value={formatPercent(country.stability)} tone={country.stability >= 60 ? 'positive' : country.stability <= 40 ? 'negative' : 'neutral'} />
      <TooltipMetric label="Approval" value={formatPercent(country.approval)} tone={country.approval >= 60 ? 'positive' : country.approval <= 40 ? 'negative' : 'neutral'} />
      <TooltipMetric label="Military morale" value={formatPercent(country.militaryMorale)} tone={country.militaryMorale >= 60 ? 'positive' : country.militaryMorale <= 40 ? 'negative' : 'neutral'} />
    </TooltipMetricGrid>

    <TooltipSection title="National overview">
      <TooltipRow label="Controlled provinces" value={provinceCount} />
      <TooltipRow label="Fielded armies" value={armyCount} />
      <TooltipRow label="Active alliances" value={allianceCount} />
      <TooltipRow label="Trade agreements" value={tradeCount} />
      <TooltipRow label="Active wars" value={warCount} valueClassName={warCount > 0 ? 'text-rose-400' : 'text-emerald-400'} />
    </TooltipSection>

    <TooltipSection title="Resource income">
      {RESOURCE_KEYS.map(resource => (
        <TooltipRow
          key={resource}
          label={resource}
          value={formatModifier(country.resourceIncome[resource])}
          valueClassName={country.resourceIncome[resource] >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
      ))}
    </TooltipSection>
  </TooltipPanel>
);

export const BuildingTooltipContent = ({
  buildingType,
  level = 0,
  nextLevel,
}: {
  buildingType: BuildingType;
  level?: number;
  nextLevel?: number;
}) => {
  const info = BUILDING_INFO[buildingType];
  const previewLevel = nextLevel ?? Math.max(1, level);
  const costMultiplier = Math.max(1, previewLevel);

  return (
    <TooltipPanel>
      <TooltipHeader
        title={info.name}
        subtitle={info.description}
        value={level > 0 ? `Lv.${level}` : `Lv.${previewLevel}`}
      />

      <TooltipMetricGrid>
        <TooltipMetric label="Build time" value={`${info.buildTime + Math.max(0, previewLevel - 1)}t`} />
        <TooltipMetric label="Maintenance" value={`${getBuildingMaintenance(buildingType, previewLevel)}/t`} tone="negative" />
        <TooltipMetric label="Max level" value={info.maxLevel} />
        <TooltipMetric label="Category" value={info.category.replace('_', ' ')} />
      </TooltipMetricGrid>

      <TooltipSection title="Construction cost">
        {RESOURCE_KEYS.map(resource => {
          const value = info.baseCost[resource] * costMultiplier;
          return value > 0 ? <TooltipRow key={resource} label={resource} value={value} /> : null;
        })}
      </TooltipSection>

      <TooltipSection title="Effects">
        {info.bonuses.production ? <TooltipRow label="Production" value={`+${info.bonuses.production * previewLevel}%`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.movementSpeed ? <TooltipRow label="Movement speed" value={`+${info.bonuses.movementSpeed * previewLevel}%`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.resourceYield ? <TooltipRow label="Resource yield" value={`+${info.bonuses.resourceYield * previewLevel}%`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.defenseBonus ? <TooltipRow label="Defense bonus" value={`+${info.bonuses.defenseBonus * previewLevel}%`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.radarRange ? <TooltipRow label="Detection range" value={`+${info.bonuses.radarRange * previewLevel}`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.antiAirEfficiency ? <TooltipRow label="AA efficiency" value={`+${info.bonuses.antiAirEfficiency * previewLevel}%`} valueClassName="text-emerald-400" /> : null}
        {info.bonuses.unitTraining ? <TooltipRow label="Capability" value="Ground unit training" /> : null}
        {info.bonuses.aircraftProduction ? <TooltipRow label="Capability" value="Aircraft production" /> : null}
        {info.bonuses.navalProduction ? <TooltipRow label="Capability" value="Naval production" /> : null}
      </TooltipSection>
    </TooltipPanel>
  );
};

export const ArmyTooltipContent = ({
  army,
  province,
  country,
}: {
  army: Army;
  province?: Province | null;
  country?: Country | null;
}) => {
  const totals = getArmyTotals(army);

  return (
    <TooltipPanel>
      <TooltipHeader
        title={army.name}
        subtitle={`${country?.name ?? 'Unknown country'} · ${province?.name ?? 'Unknown province'}`}
        value={`${totals.totalUnits} units`}
      />

      <TooltipMetricGrid>
        <TooltipMetric label="Morale" value={formatPercent(army.morale)} tone={army.morale >= 60 ? 'positive' : army.morale <= 40 ? 'negative' : 'neutral'} />
        <TooltipMetric label="Supply use" value={`${totals.supply}/t`} tone="negative" />
        <TooltipMetric label="Attack power" value={totals.attack} />
        <TooltipMetric label="Defense power" value={totals.defense} />
      </TooltipMetricGrid>

      <TooltipSection title="Deployment">
        <TooltipRow label="Current province" value={province?.name ?? 'Unknown'} />
        <TooltipRow label="Destination" value={army.targetProvinceId ? 'In transit' : 'Holding position'} valueClassName={army.targetProvinceId ? 'text-amber-300' : 'text-emerald-400'} />
        <TooltipRow label="Path length" value={army.path.length} />
      </TooltipSection>

      <TooltipSection title="Unit composition">
        <TooltipTagList>
          {army.units.map(unit => (
            <TooltipTag key={unit.type}>{UNIT_STATS[unit.type].name} ×{unit.count}</TooltipTag>
          ))}
        </TooltipTagList>
      </TooltipSection>
    </TooltipPanel>
  );
};

export const UnitTooltipContent = ({
  unitType,
  count,
}: {
  unitType: UnitType;
  count?: number;
}) => {
  const stats = UNIT_STATS[unitType];

  return (
    <TooltipPanel>
      <TooltipHeader
        title={stats.name}
        subtitle={`${stats.armorClass} unit${stats.requiredResearch ? ` · requires ${stats.requiredResearch}` : ''}`}
        value={count ? `×${count}` : `${stats.buildTime}t`}
      />

      <TooltipMetricGrid>
        <TooltipMetric label="Attack" value={stats.attack} />
        <TooltipMetric label="Defense" value={stats.defense} />
        <TooltipMetric label="Health" value={stats.health} />
        <TooltipMetric label="Speed" value={stats.speed} />
      </TooltipMetricGrid>

      <TooltipSection title="Combat profile">
        <TooltipRow label="Range" value={stats.range} />
        <TooltipRow label="Supply usage" value={`${stats.supplyUsage}/unit`} valueClassName="text-rose-400" />
        <TooltipRow label="Training building" value={BUILDING_INFO[stats.requiredBuilding].name} />
      </TooltipSection>

      <TooltipSection title="Production cost">
        {RESOURCE_KEYS.map(resource => {
          const value = stats.cost[resource];
          return value > 0 ? <TooltipRow key={resource} label={resource} value={value} /> : null;
        })}
      </TooltipSection>

      <TooltipSection title="Matchups">
        <TooltipRow label="Strong vs" value={stats.strongVs.length > 0 ? stats.strongVs.join(', ') : '—'} valueClassName="text-emerald-400" />
        <TooltipRow label="Weak vs" value={stats.weakVs.length > 0 ? stats.weakVs.join(', ') : '—'} valueClassName={stats.weakVs.length > 0 ? 'text-rose-400' : undefined} />
      </TooltipSection>
    </TooltipPanel>
  );
};

export const BuildingInstanceTooltipContent = ({ building }: { building: Building }) => (
  <BuildingTooltipContent buildingType={building.type} level={building.level} />
);