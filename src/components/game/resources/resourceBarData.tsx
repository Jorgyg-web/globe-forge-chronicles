import React from 'react';
import { Fuel, Pickaxe, Users, Wheat } from 'lucide-react';
import { Gem } from 'lucide-react';
import { BuildingType, ConstructionItem, GameState, ProductionItem, Province, RESOURCE_KEYS, Resources, TradeAgreement } from '@/types/game';
import { UNIT_STATS } from '@/data/unitStats';

import { ResourceItemData } from './ResourceItem';

const RESOURCE_META: Record<keyof Resources, { label: string; icon: React.ReactNode; accentClassName: string }> = {
  food: { label: 'Food', icon: <Wheat size={14} />, accentClassName: 'text-emerald-300' },
  steel: { label: 'Steel', icon: <Pickaxe size={14} />, accentClassName: 'text-slate-300' },
  oil: { label: 'Oil', icon: <Fuel size={14} />, accentClassName: 'text-amber-300' },
  rareMetals: { label: 'Rare Metals', icon: <Gem size={14} />, accentClassName: 'text-violet-300' },
  manpower: { label: 'Manpower', icon: <Users size={14} />, accentClassName: 'text-sky-300' },
};

type BreakdownLine = { label: string; value: number };

function sumLines(lines: BreakdownLine[]): number {
  return lines.reduce((sum, line) => sum + line.value, 0);
}

function getBuildingLevel(province: Province, buildingType: BuildingType): number {
  return province.buildings.find(building => building.type === buildingType)?.level ?? 0;
}

function sumConstructionLoad(items: ConstructionItem[]): number {
  return items.reduce((sum, item) => sum + item.targetLevel * Math.max(1, item.turnsRemaining), 0);
}

function sumProductionLoad(items: ProductionItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * Math.max(1, item.turnsRemaining), 0);
}

function buildResourceBreakdown(
  resource: keyof Resources,
  state: GameState,
): Pick<ResourceItemData, 'currentValue' | 'changePerTurn' | 'incomeSources' | 'expenses'> {
  const country = state.countries[state.playerCountryId];
  const provinces = Object.values(state.provinces).filter(province => province.countryId === country.id);
  const constructionQueue = state.constructionQueue.filter(item => item.countryId === country.id);
  const productionQueue = state.productionQueue.filter(item => item.countryId === country.id);
  const tradeAgreements = state.tradeAgreements.filter(trade => trade.countries.includes(country.id));
  const armies = Object.values(state.armies).filter(army => army.countryId === country.id);
  const activeWars = state.wars.filter(war => war.active && (war.attackers.includes(country.id) || war.defenders.includes(country.id))).length;

  const unitCount = armies.reduce((sum, army) => sum + army.units.reduce((unitSum, unit) => unitSum + unit.count, 0), 0);
  const extractorLevels = provinces.reduce((sum, province) => sum + getBuildingLevel(province, 'resourceExtractor'), 0);
  const industrialLevels = provinces.reduce((sum, province) => sum + getBuildingLevel(province, 'industrialComplex'), 0);
  const infrastructureLevels = provinces.reduce((sum, province) => sum + getBuildingLevel(province, 'infrastructure'), 0);
  const tradeValue = tradeAgreements.reduce((sum, trade) => sum + Math.max(1, Math.round(trade.value / 240)), 0);
  const resourceBase = provinces.reduce((sum, province) => sum + Math.max(0, province.resourceProduction[resource]), 0);

  const tradeResourceBonus = (agreements: TradeAgreement[]) => Math.round(agreements.length * (resource === 'food' ? 3 : resource === 'oil' ? 2 : 1));
  const unitSupply = armies.reduce((sum, army) => sum + army.units.reduce((armySum, unit) => armySum + UNIT_STATS[unit.type].supplyUsage * unit.count, 0), 0);

  const incomeSources: Record<keyof Resources, BreakdownLine[]> = {
    food: [
      { label: 'Provincial harvests', value: resourceBase },
      { label: 'Coastal imports', value: provinces.filter(province => province.isCoastal).length * 2 },
      { label: 'Trade routes', value: tradeResourceBonus(tradeAgreements) },
    ],
    steel: [
      { label: 'Industrial output', value: resourceBase },
      { label: 'Industrial complexes', value: industrialLevels * 2 },
      { label: 'Trade deliveries', value: Math.round(tradeValue * 0.6) },
    ],
    oil: [
      { label: 'Domestic extraction', value: resourceBase },
      { label: 'Strategic imports', value: tradeResourceBonus(tradeAgreements) },
      { label: 'Refining network', value: Math.round(infrastructureLevels * 0.8) },
    ],
    rareMetals: [
      { label: 'Mining output', value: resourceBase },
      { label: 'Extractor facilities', value: extractorLevels * 2 },
      { label: 'Foreign contracts', value: Math.round(tradeValue * 0.35) },
    ],
    manpower: [
      { label: 'Population growth', value: Math.max(1, Math.round(country.population / 1_000_000)) },
      { label: 'Provincial levy', value: resourceBase },
      { label: 'Administrative mobilization', value: Math.round(Math.max(0, country.stability - 45) * 0.12) },
    ],
  };

  const expenses: Record<keyof Resources, BreakdownLine[]> = {
    food: [
      { label: 'Civilian consumption', value: Math.max(1, Math.round(country.population / 18_000_000)) },
      { label: 'Army rations', value: Math.round(unitSupply * 0.4) },
      { label: 'War losses', value: activeWars * 3 },
    ],
    steel: [
      { label: 'Construction', value: Math.round(sumConstructionLoad(constructionQueue) * 0.18) },
      { label: 'Military production', value: Math.round(sumProductionLoad(productionQueue) * 0.12) },
      { label: 'Maintenance', value: Math.round(industrialLevels * 0.8) },
    ],
    oil: [
      { label: 'Fuel consumption', value: Math.round(unitSupply * 0.3) },
      { label: 'Mechanized logistics', value: Math.round(unitCount * 0.04) },
      { label: 'Production burn', value: Math.round(sumProductionLoad(productionQueue) * 0.06) },
    ],
    rareMetals: [
      { label: 'Weapons programs', value: Math.round(sumProductionLoad(productionQueue) * 0.04) },
      { label: 'Advanced industry', value: Math.round(industrialLevels * 0.6) },
      { label: 'Research demand', value: Math.max(0, country.technology.activeResearch.length * 2) },
    ],
    manpower: [
      { label: 'Army replacement pool', value: Math.round(unitSupply * 0.3) },
      { label: 'Industrial labor', value: Math.round(industrialLevels * 0.8) },
      { label: 'War casualties', value: activeWars * 5 },
    ],
  };

  const positiveIncome = incomeSources[resource].filter(line => line.value > 0);
  const positiveExpenses = expenses[resource].filter(line => line.value > 0);

  return {
    currentValue: country.resources[resource],
    changePerTurn: country.resourceIncome[resource],
    incomeSources: positiveIncome,
    expenses: positiveExpenses,
  };
}

export function buildTopResourceItems(state: GameState): ResourceItemData[] {
  return RESOURCE_KEYS.map(resource => {
    const meta = RESOURCE_META[resource];
    const breakdown = buildResourceBreakdown(resource, state);

    return {
      key: resource,
      label: meta.label,
      icon: meta.icon,
      accentClassName: meta.accentClassName,
      ...breakdown,
    };
  });
}
