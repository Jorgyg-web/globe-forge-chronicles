import {
  GameState, GameAction, Country, CountryId, Province, ProvinceId, ArmyId,
  Army, ArmyUnit, War, BattleReport, GameEvent, ConstructionItem, ProductionItem,
  UnitType, BuildingType, BUILDING_INFO, TERRAIN_DEFENSE_BONUS, TERRAIN_MOVEMENT_COST, TERRAIN_SUPPLY_EFFICIENCY, TERRAIN_RESOURCES, Resources, RESOURCE_KEYS,
} from '@/types/game';
import { UNIT_STATS } from '@/data/unitStats';
import { TECHNOLOGIES } from '../data/technologies';
import { getProvincesForCountry } from '@/data/provinces';
import { nextRandom } from '@/lib/deterministicRandom';
import { findProvincePath } from './pathfinding';

// ─── Pure function game engine ───

export function processAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEXT_TURN': return processTurn(state);
    case 'UPDATE_ARMY_MOVEMENT': return processArmyMovement(state, action.deltaTurns);
    case 'SET_SPEED': return { ...state, speed: action.speed };
    case 'TOGGLE_PAUSE': return { ...state, paused: !state.paused };

    case 'BUILD_IN_PROVINCE': return handleBuild(state, action.provinceId, action.buildingType);
    case 'UPGRADE_BUILDING': return handleBuild(state, action.provinceId, action.buildingType);
    case 'CANCEL_CONSTRUCTION': return { ...state, constructionQueue: state.constructionQueue.filter(i => i.id !== action.itemId) };

    case 'PRODUCE_UNITS': return handleProduceUnits(state, action.provinceId, action.unitType, action.quantity);
    case 'CANCEL_PRODUCTION': return { ...state, productionQueue: state.productionQueue.filter(i => i.id !== action.itemId) };

    case 'CREATE_ARMY': return handleCreateArmy(state, action.provinceId, action.units, action.name);
    case 'MOVE_ARMY': return handleMoveArmy(state, action.armyId, action.targetProvinceId);
    case 'MERGE_ARMIES': return handleMergeArmies(state, action.armyIds);
    case 'SPLIT_ARMY': return handleSplitArmy(state, action.armyId, action.units);

    case 'START_RESEARCH': return handleStartResearch(state, action.countryId, action.techId);
    case 'CANCEL_RESEARCH': return handleCancelResearch(state, action.countryId, action.techId);

    case 'DECLARE_WAR': return handleDeclareWar(state, action.attackerId, action.defenderId);
    case 'PROPOSE_ALLIANCE': return handleAlliance(state, action.fromId, action.toId, action.allianceType);
    case 'PROPOSE_TRADE': return handleTrade(state, action.fromId, action.toId, action.value);
    case 'SET_EMBARGO': return handleEmbargo(state, action.countryId, action.targetId, true);
    case 'REMOVE_EMBARGO': return handleEmbargo(state, action.countryId, action.targetId, false);
    case 'OFFER_PEACE': return handlePeace(state, action.fromId, action.toId);

    default: return state;
  }
}

// ─── Helpers ───
function updateCountry(state: GameState, id: CountryId, fn: (c: Country) => Country): GameState {
  return { ...state, countries: { ...state.countries, [id]: fn(state.countries[id]) } };
}
function updateProvince(state: GameState, id: ProvinceId, fn: (p: Province) => Province): GameState {
  return { ...state, provinces: { ...state.provinces, [id]: fn(state.provinces[id]) } };
}
function addResources(a: Resources, b: Resources): Resources {
  return { food: a.food + b.food, steel: a.steel + b.steel, oil: a.oil + b.oil, rareMetals: a.rareMetals + b.rareMetals, manpower: a.manpower + b.manpower };
}
function subtractResources(a: Resources, b: Resources): Resources {
  return { food: a.food - b.food, steel: a.steel - b.steel, oil: a.oil - b.oil, rareMetals: a.rareMetals - b.rareMetals, manpower: a.manpower - b.manpower };
}
function scaleResources(r: Resources, s: number): Resources {
  return { food: Math.floor(r.food * s), steel: Math.floor(r.steel * s), oil: Math.floor(r.oil * s), rareMetals: Math.floor(r.rareMetals * s), manpower: Math.floor(r.manpower * s) };
}
function canAfford(have: Resources, cost: Resources): boolean {
  return RESOURCE_KEYS.every(k => have[k] >= cost[k]);
}

function allocateEntityId<T extends GameState>(state: T, prefix: string): [string, T] {
  return [
    `${prefix}_${state.nextEntityId.toString(36)}`,
    { ...state, nextEntityId: state.nextEntityId + 1 } as T,
  ];
}

function takeRandom<T extends GameState>(state: T): [number, T] {
  const { value, seed } = nextRandom(state.rngSeed);
  return [value, { ...state, rngSeed: seed } as T];
}

function takeRandomRange<T extends GameState>(state: T, min: number, max: number): [number, T] {
  const [roll, nextState] = takeRandom(state);
  return [min + roll * (max - min), nextState];
}

type CountryTechEffects = {
  infantryAttack: number;
  armorAttack: number;
  airAttack: number;
  navalAttack: number;
  tankSpeed: number;
  industryOutput: number;
  logisticsSpeed: number;
  unitProductionSpeed: number;
};

function getCountryTechEffects(country: Country): CountryTechEffects {
  const effects: CountryTechEffects = {
    infantryAttack: 0,
    armorAttack: 0,
    airAttack: 0,
    navalAttack: 0,
    tankSpeed: 0,
    industryOutput: 0,
    logisticsSpeed: 0,
    unitProductionSpeed: 0,
  };

  for (const techId of country.technology.researched) {
    const tech = TECHNOLOGIES.find(t => t.id === techId);
    if (!tech) continue;
    for (const effect of tech.effects) {
      switch (effect.target) {
        case 'infantry_attack':
          effects.infantryAttack += effect.modifier;
          break;
        case 'armor_attack':
          effects.armorAttack += effect.modifier;
          break;
        case 'air_attack':
          effects.airAttack += effect.modifier;
          break;
        case 'naval_attack':
          effects.navalAttack += effect.modifier;
          break;
        case 'tank_speed':
          effects.tankSpeed += effect.modifier;
          break;
        case 'industry_output':
          effects.industryOutput += effect.modifier;
          break;
        case 'logistics_speed':
          effects.logisticsSpeed += effect.modifier;
          break;
        case 'unit_production_speed':
          effects.unitProductionSpeed += effect.modifier;
          break;
      }
    }
  }

  return effects;
}

// TERRAIN_MOVEMENT_COST and TERRAIN_SUPPLY_EFFICIENCY are now imported from types/game

// ─── Building ───
function handleBuild(state: GameState, provId: ProvinceId, buildingType: BuildingType): GameState {
  const prov = state.provinces[provId];
  if (!prov) return state;
  const country = state.countries[prov.countryId];
  if (!country) return state;

  const info = BUILDING_INFO[buildingType];
  const existing = prov.buildings.find(b => b.type === buildingType);
  const currentLevel = existing?.level ?? 0;
  if (currentLevel >= info.maxLevel) return state;

  const cost = scaleResources(info.baseCost, currentLevel + 1);
  if (!canAfford(country.resources, cost)) return state;

  let s = state;
  let itemId: string;
  [itemId, s] = allocateEntityId(s, 'build');

  const item: ConstructionItem = {
    id: itemId,
    countryId: prov.countryId,
    provinceId: provId,
    category: 'building',
    buildingType,
    targetLevel: currentLevel + 1,
    label: `${info.name} Lv.${currentLevel + 1}`,
    cost,
    turnsRequired: info.buildTime + currentLevel,
    turnsRemaining: info.buildTime + currentLevel,
    startedTurn: state.turn,
  };

  return {
    ...updateCountry(s, prov.countryId, c => ({ ...c, resources: subtractResources(c.resources, cost) })),
    constructionQueue: [...s.constructionQueue, item],
  };
}

// ─── Unit Production ───
function handleProduceUnits(state: GameState, provId: ProvinceId, unitType: UnitType, quantity: number): GameState {
  const prov = state.provinces[provId];
  if (!prov) return state;
  const country = state.countries[prov.countryId];
  if (!country) return state;

  const stats = UNIT_STATS[unitType];
  if (!prov.buildings.some(b => b.type === stats.requiredBuilding)) return state;
  if (stats.requiredResearch && !country.technology.researched.includes(stats.requiredResearch)) return state;

  const techEffects = getCountryTechEffects(country);
  const productionSpeedMultiplier = Math.max(0.5, 1 + techEffects.unitProductionSpeed);
  const effectiveBuildTime = Math.max(1, Math.ceil(stats.buildTime / productionSpeedMultiplier));

  const cost = scaleResources(stats.cost, quantity);
  if (!canAfford(country.resources, cost)) return state;

  let s = state;
  let itemId: string;
  [itemId, s] = allocateEntityId(s, 'prod');

  const item: ProductionItem = {
    id: itemId,
    countryId: prov.countryId,
    provinceId: provId,
    unitType,
    quantity,
    turnsRequired: effectiveBuildTime,
    turnsRemaining: effectiveBuildTime,
    cost,
  };

  return {
    ...updateCountry(s, prov.countryId, c => ({ ...c, resources: subtractResources(c.resources, cost) })),
    productionQueue: [...s.productionQueue, item],
  };
}

// ─── Army ───
function handleCreateArmy(state: GameState, provId: ProvinceId, unitDefs: { type: UnitType; count: number }[], name: string): GameState {
  const prov = state.provinces[provId];
  if (!prov) return state;

  let s = state;
  let armyId: string;
  [armyId, s] = allocateEntityId(s, 'army');
  const units: ArmyUnit[] = unitDefs.map(u => ({
    type: u.type, count: u.count, health: 100,
    level: getUnitLevel(state.countries[prov.countryId], u.type),
  }));

  const army: Army = {
    id: armyId, countryId: prov.countryId, provinceId: provId,
    targetProvinceId: null, path: [], movementProgress: 0, units, name,
    morale: 75, // Start with moderate morale
  };

  return { ...s, armies: { ...s.armies, [armyId]: army } };
}

function handleMoveArmy(state: GameState, armyId: ArmyId, targetId: ProvinceId): GameState {
  const army = state.armies[armyId];
  if (!army || army.targetProvinceId) return state; // can't redirect mid-move

  const path = findProvincePath(state.provinces, army.provinceId, targetId);
  if (!path || path.length === 0) return state;
  const nextTarget = path[0] ?? null;
  if (!nextTarget) return state;

  return {
    ...state,
    armies: {
      ...state.armies,
      [armyId]: { ...army, path, targetProvinceId: nextTarget, movementProgress: 0 },
    },
  };
}

function handleMergeArmies(state: GameState, armyIds: ArmyId[]): GameState {
  if (armyIds.length < 2) return state;
  const armies = armyIds.map(id => state.armies[id]).filter(Boolean);
  if (armies.length < 2) return state;
  if (!armies.every(a => a.provinceId === armies[0].provinceId && !a.targetProvinceId)) return state;

  const merged: ArmyUnit[] = [];
  for (const army of armies) {
    for (const unit of army.units) {
      const existing = merged.find(m => m.type === unit.type);
      if (existing) {
        existing.health = (existing.health * existing.count + unit.health * unit.count) / (existing.count + unit.count);
        existing.count += unit.count;
      } else {
        merged.push({ ...unit });
      }
    }
  }

  // Average morale from all merged armies
  const avgMorale = armies.reduce((sum, a) => sum + a.morale, 0) / armies.length;

  let s = state;
  const newArmies = { ...s.armies };
  armyIds.forEach(id => delete newArmies[id]);
  let newId: string;
  [newId, s] = allocateEntityId(s, 'army');
  newArmies[newId] = {
    id: newId, countryId: armies[0].countryId, provinceId: armies[0].provinceId,
    targetProvinceId: null, path: [], movementProgress: 0, units: merged, name: armies[0].name,
    morale: avgMorale,
  };

  return { ...s, armies: newArmies };
}

function handleSplitArmy(state: GameState, armyId: ArmyId, splitUnits: { type: UnitType; count: number }[]): GameState {
  const army = state.armies[armyId];
  if (!army || army.targetProvinceId) return state;

  // Validate counts
  for (const su of splitUnits) {
    const existing = army.units.find(u => u.type === su.type);
    if (!existing || existing.count < su.count) return state;
  }

  // Remove from original
  const remainingUnits = army.units.map(u => {
    const split = splitUnits.find(s => s.type === u.type);
    return split ? { ...u, count: u.count - split.count } : { ...u };
  }).filter(u => u.count > 0);

  let s = state;
  let newId: string;
  [newId, s] = allocateEntityId(s, 'army');
  const newUnits: ArmyUnit[] = splitUnits.map(su => {
    const orig = army.units.find(u => u.type === su.type)!;
    return { type: su.type, count: su.count, health: orig.health, level: orig.level };
  });

  const newArmies = { ...s.armies };
  newArmies[armyId] = { ...army, units: remainingUnits };
  newArmies[newId] = {
    id: newId, countryId: army.countryId, provinceId: army.provinceId,
    targetProvinceId: null, path: [], movementProgress: 0, units: newUnits, name: `${army.name} (Split)`,
    morale: army.morale, // Preserve morale in split
  };

  return { ...s, armies: newArmies };
}

function getUnitLevel(country: Country, _unitType: UnitType): number {
  return Math.min(5, Math.floor(country.technology.researched.length / 3) + 1);
}

// ─── Research ───
function handleStartResearch(state: GameState, countryId: CountryId, techId: string): GameState {
  const country = state.countries[countryId];
  const tech = TECHNOLOGIES.find(t => t.id === techId);
  if (!tech || !country) return state;
  if (country.technology.researched.includes(techId)) return state;
  if (!tech.prerequisites.every(p => country.technology.researched.includes(p))) return state;
  if (country.technology.activeResearch.length >= country.researchSlots) return state;
  if (country.technology.activeResearch.some(r => r.techId === techId)) return state;

  return updateCountry(state, countryId, c => ({
    ...c,
    technology: {
      ...c.technology,
      activeResearch: [...c.technology.activeResearch, { techId, progress: 0, turnsSpent: 0 }],
    },
  }));
}

function handleCancelResearch(state: GameState, countryId: CountryId, techId: string): GameState {
  return updateCountry(state, countryId, c => ({
    ...c,
    technology: {
      ...c.technology,
      activeResearch: c.technology.activeResearch.filter(r => r.techId !== techId),
    },
  }));
}

// ─── Diplomacy ───
function handleDeclareWar(state: GameState, attackerId: CountryId, defenderId: CountryId): GameState {
  let s = state;
  let warId: string;
  let eventId: string;
  [warId, s] = allocateEntityId(s, 'war');
  [eventId, s] = allocateEntityId(s, 'evt');
  const war: War = {
    id: warId, attackers: [attackerId], defenders: [defenderId],
    startTurn: state.turn, battles: [], active: true,
  };
  const event: GameEvent = {
    id: eventId, turn: state.turn, type: 'war',
    title: `${state.countries[attackerId].name} declares war!`,
    description: `${state.countries[attackerId].name} has declared war on ${state.countries[defenderId].name}`,
    countryId: attackerId,
  };
  s = { ...s, wars: [...s.wars, war], events: [...s.events, event] };
  s = updateCountry(s, attackerId, c => ({ ...c, diplomacy: { ...c.diplomacy, relations: { ...c.diplomacy.relations, [defenderId]: -100 } } }));
  s = updateCountry(s, defenderId, c => ({ ...c, diplomacy: { ...c.diplomacy, relations: { ...c.diplomacy.relations, [attackerId]: -100 } } }));
  return s;
}

function handleAlliance(state: GameState, fromId: CountryId, toId: CountryId, allianceType: 'military' | 'economic' | 'both'): GameState {
  const rel = state.countries[toId]?.diplomacy.relations[fromId] ?? 0;
  if (rel < 30) return state;
  let s = state;
  let allianceId: string;
  [allianceId, s] = allocateEntityId(s, 'alliance');
  const alliance = {
    id: allianceId,
    name: `${state.countries[fromId].name}-${state.countries[toId].name}`,
    members: [fromId, toId], type: allianceType,
  };
  return { ...s, alliances: [...s.alliances, alliance] };
}

function handleTrade(state: GameState, fromId: CountryId, toId: CountryId, value: number): GameState {
  const rel = state.countries[toId]?.diplomacy.relations[fromId] ?? 0;
  if (rel < 0) return state;
  let s = state;
  let tradeId: string;
  [tradeId, s] = allocateEntityId(s, 'trade');
  return { ...s, tradeAgreements: [...s.tradeAgreements, { id: tradeId, countries: [fromId, toId], value, type: 'bilateral' }] };
}

function handleEmbargo(state: GameState, countryId: CountryId, targetId: CountryId, add: boolean): GameState {
  return updateCountry(state, countryId, c => ({
    ...c,
    diplomacy: {
      ...c.diplomacy,
      embargoes: add ? [...c.diplomacy.embargoes, targetId] : c.diplomacy.embargoes.filter(e => e !== targetId),
      relations: add ? { ...c.diplomacy.relations, [targetId]: Math.max(-100, (c.diplomacy.relations[targetId] ?? 0) - 30) } : c.diplomacy.relations,
    },
  }));
}

function handlePeace(state: GameState, fromId: CountryId, toId: CountryId): GameState {
  const wars = state.wars.map(w => {
    if (!w.active) return w;
    const involves = (w.attackers.includes(fromId) && w.defenders.includes(toId)) ||
                     (w.defenders.includes(fromId) && w.attackers.includes(toId));
    return involves ? { ...w, active: false } : w;
  });
  let s = state;
  let eventId: string;
  [eventId, s] = allocateEntityId(s, 'evt');
  const event: GameEvent = {
    id: eventId, turn: state.turn, type: 'diplomacy',
    title: 'Peace Treaty',
    description: `${state.countries[fromId].name} and ${state.countries[toId].name} signed a peace treaty`,
  };
  return { ...s, wars, events: [...s.events, event] };
}

// ─── Turn Processing ───
function processTurn(state: GameState): GameState {
  let s = { ...state };
  const events: GameEvent[] = [];

  s.turn += 1;
  s.month += 1;
  if (s.month > 12) { s.month = 1; s.year += 1; }

  // 1. Resources
  s = processResourceIncome(s);
  // 2. Construction
  s = processConstructionQueue(s, events);
  // 3. Production
  s = processProductionQueue(s, events);
  // 4. Research
  s = processAllResearch(s, events);
  // 5. Ranged attacks (artillery/missiles attack adjacent provinces)
  s = processRangedCombat(s, events);
  // 6. Combat (armies in same province)
  s = processCombat(s, events);
  // 7. Province morale & rebellion
  s = processProvinceMorale(s);
  // 8. AI
  for (const id of Object.keys(s.countries)) {
    if (id !== s.playerCountryId) {
      s = processAI(s, id, events);
    }
  }

  // Track active battles for UI
  s.activeBattles = findActiveBattles(s);

  s.events = [...s.events, ...events];
  return s;
}

// Find provinces where opposing armies are stationed (for visual indicators)
function findActiveBattles(state: GameState): { provinceId: ProvinceId; attackerCountryId: CountryId; defenderCountryId: CountryId; startedTurn: number; turnsElapsed: number; attackerMorale: number; defenderMorale: number; totalAttackerStrength: number; totalDefenderStrength: number }[] {
  const battles: { provinceId: ProvinceId; attackerCountryId: CountryId; defenderCountryId: CountryId; startedTurn: number; turnsElapsed: number; attackerMorale: number; defenderMorale: number; totalAttackerStrength: number; totalDefenderStrength: number }[] = [];
  const armyByProvince: Record<ProvinceId, Army[]> = {};
  for (const army of Object.values(state.armies)) {
    if (!army.targetProvinceId) {
      if (!armyByProvince[army.provinceId]) armyByProvince[army.provinceId] = [];
      armyByProvince[army.provinceId].push(army);
    }
  }
  for (const [provId, armies] of Object.entries(armyByProvince)) {
    const countries = [...new Set(armies.map(a => a.countryId))];
    if (countries.length < 2) continue;
    for (let i = 0; i < countries.length; i++) {
      for (let j = i + 1; j < countries.length; j++) {
        const atWar = state.wars.some(w => w.active && (
          (w.attackers.includes(countries[i]) && w.defenders.includes(countries[j])) ||
          (w.attackers.includes(countries[j]) && w.defenders.includes(countries[i]))
        ));
        if (atWar) {
          const attackerArmies = armies.filter(a => a.countryId === countries[i]);
          const defenderArmies = armies.filter(a => a.countryId === countries[j]);
          const attackerMorale = attackerArmies.length > 0 ? attackerArmies.reduce((sum, a) => sum + a.morale, 0) / attackerArmies.length : 50;
          const defenderMorale = defenderArmies.length > 0 ? defenderArmies.reduce((sum, a) => sum + a.morale, 0) / defenderArmies.length : 50;
          const totalAttackerStrength = attackerArmies.reduce((sum, a) => sum + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
          const totalDefenderStrength = defenderArmies.reduce((sum, a) => sum + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
          battles.push({
            provinceId: provId,
            attackerCountryId: countries[i],
            defenderCountryId: countries[j],
            startedTurn: state.turn,
            turnsElapsed: 0,
            attackerMorale,
            defenderMorale,
            totalAttackerStrength,
            totalDefenderStrength,
          });
        }
      }
    }
  }
  return battles;
}

function processResourceIncome(state: GameState): GameState {
  let s = state;
  for (const countryId of Object.keys(s.countries)) {
    const provs = getProvincesForCountry(s.provinces, countryId);
    const income: Resources = { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 };
    const techEffects = getCountryTechEffects(s.countries[countryId]);
    const industryTechMultiplier = 1 + techEffects.industryOutput;

    for (const prov of provs) {
      const moraleMultiplier = prov.morale / 100;
      const corruptionPenalty = 1 - prov.corruption / 200;
      const extractorBonus = 1 + (prov.buildings.find(b => b.type === 'resourceExtractor')?.level ?? 0) * 0.18;
      const industryBonus = 1 + (prov.buildings.find(b => b.type === 'industrialComplex')?.level ?? 0) * 0.15;

      // Terrain-based resource production
      const terrainProduction = TERRAIN_RESOURCES[prov.terrain];
      for (const key of RESOURCE_KEYS) {
        const baseProduction = terrainProduction[key] ?? 0;
        income[key] += Math.floor(baseProduction * moraleMultiplier * corruptionPenalty * extractorBonus * industryBonus * industryTechMultiplier);
      }
    }

    // Army supply cost: manpower for personnel, food for rations, oil for fuel
    const armies = Object.values(s.armies).filter(a => a.countryId === countryId);
    let totalSupplyCost = 0; // General supply units needed
    let manpowerCost = 0;
    let foodCost = 0;
    let oilCost = 0;
    
    for (const army of armies) {
      const prov = s.provinces[army.provinceId];
      const supplyEff = prov ? (TERRAIN_SUPPLY_EFFICIENCY[prov.terrain] ?? 1) : 1;
      for (const u of army.units) {
        const unitSupply = UNIT_STATS[u.type].supplyUsage * u.count / supplyEff;
        totalSupplyCost += unitSupply;
        manpowerCost += Math.floor(unitSupply * 0.3); // 30% manpower cost
        foodCost += Math.floor(unitSupply * 0.4);     // 40% food cost
        oilCost += Math.floor(unitSupply * 0.3);      // 30% oil cost
      }
    }
    
    income.manpower = Math.max(income.manpower - manpowerCost, -income.manpower); // Can go negative (debt)
    income.food = Math.max(income.food - foodCost, -income.food);
    income.oil = Math.max(income.oil - oilCost, -income.oil);

    s = updateCountry(s, countryId, c => ({
      ...c,
      resources: addResources(c.resources, income),
      resourceIncome: income,
    }));
  }
  return s;
}

function processConstructionQueue(state: GameState, events: GameEvent[]): GameState {
  let s = { ...state };
  const remaining: ConstructionItem[] = [];

  for (const item of s.constructionQueue) {
    const updated = { ...item, turnsRemaining: item.turnsRemaining - 1 };
    if (updated.turnsRemaining <= 0) {
      s = updateProvince(s, item.provinceId, p => {
        const buildings = [...p.buildings];
        const existing = buildings.find(b => b.type === item.buildingType);
        if (existing) {
          existing.level = item.targetLevel;
        } else {
          buildings.push({ type: item.buildingType, level: item.targetLevel });
        }
        return { ...p, buildings, development: Math.min(100, p.development + 2) };
      });
      let eventId: string;
      [eventId, s] = allocateEntityId(s, 'evt');
      events.push({
        id: eventId, turn: s.turn, type: 'construction',
        title: 'Construction Complete',
        description: `${item.label} in ${s.provinces[item.provinceId]?.name}`,
        countryId: item.countryId,
      });
    } else {
      remaining.push(updated);
    }
  }

  s.constructionQueue = remaining;
  return s;
}

function processProductionQueue(state: GameState, events: GameEvent[]): GameState {
  let s = { ...state };
  const remaining: ProductionItem[] = [];

  for (const item of s.productionQueue) {
    const updated = { ...item, turnsRemaining: item.turnsRemaining - 1 };
    if (updated.turnsRemaining <= 0) {
      const country = s.countries[item.countryId];
      const newUnit: ArmyUnit = {
        type: item.unitType, count: item.quantity, health: 100,
        level: getUnitLevel(country, item.unitType),
      };
      const existingArmy = Object.values(s.armies).find(
        a => a.countryId === item.countryId && a.provinceId === item.provinceId && !a.targetProvinceId
      );
      if (existingArmy) {
        const existingUnit = existingArmy.units.find(u => u.type === item.unitType);
        if (existingUnit) {
          existingUnit.count += item.quantity;
        } else {
          existingArmy.units.push(newUnit);
        }
        s = { ...s, armies: { ...s.armies, [existingArmy.id]: { ...existingArmy } } };
      } else {
        let armyId: string;
        [armyId, s] = allocateEntityId(s, 'army');
        const army: Army = {
          id: armyId, countryId: item.countryId, provinceId: item.provinceId,
          targetProvinceId: null, path: [], movementProgress: 0, units: [newUnit],
          name: `Garrison ${s.provinces[item.provinceId]?.name}`,
          morale: 75,
        };
        s = { ...s, armies: { ...s.armies, [armyId]: army } };
      }
      let eventId: string;
      [eventId, s] = allocateEntityId(s, 'evt');
      events.push({
        id: eventId, turn: s.turn, type: 'production',
        title: 'Units Ready',
        description: `${item.quantity}x ${UNIT_STATS[item.unitType].name} in ${s.provinces[item.provinceId]?.name}`,
        countryId: item.countryId,
      });
    } else {
      remaining.push(updated);
    }
  }

  s.productionQueue = remaining;
  return s;
}

function processAllResearch(state: GameState, events: GameEvent[]): GameState {
  let s = state;
  for (const countryId of Object.keys(s.countries)) {
    const provs = getProvincesForCountry(s.provinces, countryId);
    let rpPerTurn = 5;
    for (const p of provs) {
      rpPerTurn += (p.buildings.find(b => b.type === 'industrialComplex')?.level ?? 0) * 2;
    }
    const country = s.countries[countryId];
    if (country.technology.activeResearch.length === 0) continue;

    const rpEach = Math.floor(rpPerTurn / country.technology.activeResearch.length);
    const newActive = [];
    const newResearched = [...country.technology.researched];

    for (const ar of country.technology.activeResearch) {
      const tech = TECHNOLOGIES.find(t => t.id === ar.techId);
      if (!tech) continue;
      const newProgress = ar.progress + rpEach;
      const newTurnsSpent = (ar.turnsSpent ?? 0) + 1;
      if (newProgress >= tech.cost && newTurnsSpent >= tech.researchTime) {
        newResearched.push(ar.techId);
        let eventId: string;
        [eventId, s] = allocateEntityId(s, 'evt');
        events.push({
          id: eventId, turn: s.turn, type: 'technology',
          title: 'Research Complete',
          description: `${tech.name} researched by ${country.name}`,
          countryId,
        });
      } else {
        newActive.push({ techId: ar.techId, progress: newProgress, turnsSpent: newTurnsSpent });
      }
    }

    s = updateCountry(s, countryId, c => ({
      ...c,
      technology: { researched: newResearched, activeResearch: newActive },
    }));
  }
  return s;
}

// ─── Ranged Combat (artillery, missiles, bombers attack adjacent provinces) ───
function processRangedCombat(state: GameState, events: GameEvent[]): GameState {
  let s = { ...state };

  for (const army of Object.values(s.armies)) {
    if (army.targetProvinceId) continue; // moving armies don't fire

    const rangedUnits = army.units.filter(u => UNIT_STATS[u.type].range >= 2);
    if (rangedUnits.length === 0) continue;

    const currentProv = s.provinces[army.provinceId];
    if (!currentProv) continue;

    // Find enemy armies in adjacent provinces
    for (const adjId of currentProv.adjacentProvinces) {
      const adjProv = s.provinces[adjId];
      if (!adjProv) continue;

      const enemyArmies = Object.values(s.armies).filter(
        a => a.provinceId === adjId && !a.targetProvinceId && a.countryId !== army.countryId
      );
      if (enemyArmies.length === 0) continue;

      // Check at war
      const atWar = s.wars.some(w => w.active && (
        (w.attackers.includes(army.countryId) && w.defenders.some(d => enemyArmies.some(e => e.countryId === d))) ||
        (w.defenders.includes(army.countryId) && w.attackers.some(a2 => enemyArmies.some(e => e.countryId === a2)))
      ));
      if (!atWar) continue;

      // Calculate ranged damage (reduced compared to direct combat)
      let totalRangedDamage = 0;
      for (const u of rangedUnits) {
        const stats = UNIT_STATS[u.type];
        totalRangedDamage += stats.attack * u.count * (u.health / 100) * 0.3; // 30% of full attack for bombardment
      }

      // Apply damage to enemy armies (spread across units)
      for (const enemy of enemyArmies) {
        const totalEnemyUnits = enemy.units.reduce((s2, u) => s2 + u.count, 0);
        if (totalEnemyUnits === 0) continue;

        const damagePerUnit = totalRangedDamage / totalEnemyUnits;
        const lossRate = Math.min(0.1, damagePerUnit / 100); // Cap at 10% losses per bombardment

        const updatedUnits = enemy.units.map(u => {
          const lost = Math.max(0, Math.floor(u.count * lossRate));
          return { ...u, count: u.count - lost, health: Math.max(20, u.health - 3) };
        }).filter(u => u.count > 0);

        s = { ...s, armies: { ...s.armies, [enemy.id]: { ...enemy, units: updatedUnits } } };
      }

      let eventId: string;
      [eventId, s] = allocateEntityId(s, 'evt');
      events.push({
        id: eventId, turn: s.turn, type: 'military',
        title: 'Bombardment',
        description: `${s.countries[army.countryId]?.name} bombards forces in ${adjProv.name}`,
        countryId: army.countryId,
      });
      break; // One bombardment target per army per turn
    }
  }

  // Clean empty armies
  const cleanArmies: Record<ArmyId, Army> = {};
  for (const [id, army] of Object.entries(s.armies)) {
    if (army.units.reduce((sum, u) => sum + u.count, 0) > 0) cleanArmies[id] = army;
  }
  s.armies = cleanArmies;

  return s;
}

function processArmyMovement(state: GameState, deltaTurns: number): GameState {
  if (deltaTurns <= 0) return state;
  const hasMovingArmies = Object.values(state.armies).some(a => !!a.targetProvinceId);
  if (!hasMovingArmies) return state;

  let s = { ...state };
  const newArmies = { ...s.armies };
  const movementEvents: GameEvent[] = [];
  let changed = false;

  for (const army of Object.values(newArmies)) {
    if (!army.targetProvinceId) continue;

    const originProv = s.provinces[army.provinceId];
    const targetProv = s.provinces[army.targetProvinceId];
    if (!targetProv || army.units.length === 0) {
      newArmies[army.id] = { ...army, targetProvinceId: null, path: [], movementProgress: 0 };
      changed = true;
      continue;
    }

    const countryTechEffects = getCountryTechEffects(s.countries[army.countryId]);
    // Speed = slowest effective unit speed in stack
    const minSpeed = Math.min(...army.units.map(u => {
      let speed = UNIT_STATS[u.type].speed;
      if (u.type === 'tank') speed *= 1 + countryTechEffects.tankSpeed;
      speed *= 1 + countryTechEffects.logisticsSpeed;
      return speed;
    }));
    const infraLevel = originProv?.buildings.find(b => b.type === 'infrastructure')?.level ?? 0;
    const infraBonus = 1 + infraLevel * 0.15;
    const terrainCost = targetProv ? (TERRAIN_MOVEMENT_COST[targetProv.terrain] ?? 1) : 1;

    const movePerTurn = ((minSpeed * infraBonus) / terrainCost) * 0.4;
    const currentProgress = army.movementProgress ?? 0;
    const progress = Math.max(0, Math.min(1, currentProgress + movePerTurn * deltaTurns));

    if (progress >= 1) {
      // Arrive at destination
      const arrivedProvinceId = army.targetProvinceId;
      const remainingPath = army.path[0] === arrivedProvinceId ? army.path.slice(1) : army.path.filter(id => id !== arrivedProvinceId);
      const nextTarget = remainingPath[0] ?? null;
      newArmies[army.id] = {
        ...army,
        provinceId: arrivedProvinceId,
        path: remainingPath,
        targetProvinceId: nextTarget,
        movementProgress: 0,
      };
      changed = true;

      // If entering enemy province, auto-declare combat context
      const destProv = s.provinces[arrivedProvinceId];
      if (destProv && destProv.countryId !== army.countryId) {
        // Check if at war with province owner
        const atWar = s.wars.some(w => w.active && (
          (w.attackers.includes(army.countryId) && w.defenders.includes(destProv.countryId)) ||
          (w.defenders.includes(army.countryId) && w.attackers.includes(destProv.countryId))
        ));
        if (atWar) {
          let eventId: string;
          [eventId, s] = allocateEntityId(s, 'evt');
          movementEvents.push({
            id: eventId, turn: s.turn, type: 'military',
            title: 'Army Invasion',
            description: `${s.countries[army.countryId]?.name} forces entered ${destProv.name}`,
            countryId: army.countryId,
          });
        }
      }
    } else {
      if (progress !== currentProgress) {
        newArmies[army.id] = { ...army, movementProgress: progress };
        changed = true;
      }
    }
  }

  if (!changed && movementEvents.length === 0) return state;

  return {
    ...s,
    armies: newArmies,
    events: movementEvents.length > 0 ? [...s.events, ...movementEvents] : s.events,
  };
}

function processCombat(state: GameState, events: GameEvent[]): GameState {
  let s = { ...state };

  const armyByProvince: Record<ProvinceId, Army[]> = {};
  for (const army of Object.values(s.armies)) {
    if (!army.targetProvinceId) {
      if (!armyByProvince[army.provinceId]) armyByProvince[army.provinceId] = [];
      armyByProvince[army.provinceId].push(army);
    }
  }

  for (const [provId, armies] of Object.entries(armyByProvince)) {
    if (armies.length < 2) continue;

    const byCountry: Record<CountryId, Army[]> = {};
    for (const a of armies) {
      if (!byCountry[a.countryId]) byCountry[a.countryId] = [];
      byCountry[a.countryId].push(a);
    }
    const countryIds = Object.keys(byCountry);
    if (countryIds.length < 2) continue;

    for (let i = 0; i < countryIds.length; i++) {
      for (let j = i + 1; j < countryIds.length; j++) {
        const c1 = countryIds[i], c2 = countryIds[j];
        const atWar = s.wars.some(w => w.active && (
          (w.attackers.includes(c1) && w.defenders.includes(c2)) ||
          (w.attackers.includes(c2) && w.defenders.includes(c1))
        ));
        if (!atWar) continue;

        const prov = s.provinces[provId];
        const attackerCountry = prov.countryId === c1 ? c2 : c1;
        const defenderCountry = prov.countryId === c1 ? c1 : c2;

        // Process one battle round
        const result = resolveBattleRound(s, provId, attackerCountry, defenderCountry, byCountry[attackerCountry], byCountry[defenderCountry], events);
        s = result.state;
        
        // If battle concludes, record it
        if (result.battleConcluded) {
          const report = result.battleReport!;
          s = {
            ...s,
            wars: s.wars.map(w => {
              if (!w.active) return w;
              const involves = (w.attackers.includes(attackerCountry) && w.defenders.includes(defenderCountry)) ||
                               (w.defenders.includes(attackerCountry) && w.attackers.includes(defenderCountry));
              return involves ? { ...w, battles: [...w.battles, report] } : w;
            }),
          };
        }
      }
    }
  }

  // Remove empty armies and those that should have retreated
  const cleanArmies: Record<ArmyId, Army> = {};
  for (const [id, army] of Object.entries(s.armies)) {
    // Remove if no units or if morale too low
    const hasUnits = army.units.reduce((sum, u) => sum + u.count, 0) > 0;
    const shouldRetreat = army.morale < 20;
    
    if (hasUnits && !shouldRetreat) {
      cleanArmies[id] = army;
    }
  }
  s.armies = cleanArmies;

  return s;
}

interface BattleRoundResult {
  state: GameState;
  battleConcluded: boolean;
  battleReport?: BattleReport;
}

function resolveBattleRound(
  state: GameState, provId: ProvinceId,
  attackerCountry: CountryId, defenderCountry: CountryId,
  attackerArmies: Army[], defenderArmies: Army[],
  events: GameEvent[],
): BattleRoundResult {
  let s = { ...state };
  
  if (attackerArmies.length === 0 || defenderArmies.length === 0) {
    return { state: s, battleConcluded: false };
  }

  const prov = s.provinces[provId];
  const terrain = prov.terrain;
  const terrainAttackModifier = terrain === 'desert' ? 0.9 : 1; // -10% attack in desert
  const terrainDefenseBonus = TERRAIN_DEFENSE_BONUS[terrain]; // +40% defense in mountain, +20% in forest, etc
  const fortLevel = prov.buildings.find(b => b.type === 'fortification')?.level ?? 0;
  const radarLevel = prov.buildings.find(b => b.type === 'radar')?.level ?? 0;
  const aaLevel = prov.buildings.find(b => b.type === 'antiAirDefense')?.level ?? 0;

  const allAttackUnits: ArmyUnit[] = attackerArmies.flatMap(a => a.units);
  const allDefendUnits: ArmyUnit[] = defenderArmies.flatMap(a => a.units);

  if (allAttackUnits.length === 0 || allDefendUnits.length === 0) {
    return { state: s, battleConcluded: false };
  }

  const attackerCountryMorale = s.countries[attackerCountry]?.militaryMorale ?? 50;
  const defenderCountryMorale = s.countries[defenderCountry]?.militaryMorale ?? 50;
  const avgAttackerArmyMorale = attackerArmies.reduce((sum, a) => sum + a.morale, 0) / attackerArmies.length;
  const avgDefenderArmyMorale = defenderArmies.reduce((sum, a) => sum + a.morale, 0) / defenderArmies.length;

  // Calculate combat power per round (much lower per round for multi-turn battles)
  let attackPower = calculateCombatPower(
    allAttackUnits, allDefendUnits, terrain, false,
    (0.5 + attackerCountryMorale / 200) * (0.5 + avgAttackerArmyMorale / 200),
    radarLevel, aaLevel, 1.0, s.countries[attackerCountry] // attackers get no terrain bonus
  ) * terrainAttackModifier;
  
  let defendPower = calculateCombatPower(
    allDefendUnits, allAttackUnits, terrain, true,
    (0.5 + defenderCountryMorale / 200) * (0.5 + avgDefenderArmyMorale / 200),
    radarLevel, aaLevel, 1 + terrainDefenseBonus + fortLevel * 0.12, s.countries[defenderCountry]
  );

  const total = Math.max(1, attackPower + defendPower);
  
  // Per-round casualties: 0.5-1.5% per turn for ~50-100 turn battles
  const attackerLossRate = (defendPower / total) * 0.015;
  const defenderLossRate = (attackPower / total) * 0.015;
  
  // Apply losses and health degradation
  const attackerLosses: Partial<Record<UnitType, number>> = {};
  for (const u of allAttackUnits) {
    let casualtyVariance: number;
    [casualtyVariance, s] = takeRandomRange(s, 0.7, 1.3);
    const lost = Math.floor(u.count * attackerLossRate * casualtyVariance);
    if (lost > 0) attackerLosses[u.type] = (attackerLosses[u.type] ?? 0) + lost;
  }
  
  const defenderLosses: Partial<Record<UnitType, number>> = {};
  for (const u of allDefendUnits) {
    let casualtyVariance: number;
    [casualtyVariance, s] = takeRandomRange(s, 0.7, 1.3);
    const lost = Math.floor(u.count * defenderLossRate * casualtyVariance);
    if (lost > 0) defenderLosses[u.type] = (defenderLosses[u.type] ?? 0) + lost;
  }

  // Apply battle effects to armies
  s = applyBattleRoundDamage(s, attackerArmies, attackerLosses, attackPower, defendPower);
  s = applyBattleRoundDamage(s, defenderArmies, defenderLosses, defendPower, attackPower);

  // Check if battle is concluded (one side defeated or morale collapse)
  const newAttackUnits = attackerArmies.flatMap(a => s.armies[a.id]?.units ?? []).reduce((sum, u) => sum + u.count, 0);
  const newDefendUnits = defenderArmies.flatMap(a => s.armies[a.id]?.units ?? []).reduce((sum, u) => sum + u.count, 0);
  const avgNewAttackerMorale = attackerArmies.filter(a => s.armies[a.id]).reduce((sum, a) => sum + (s.armies[a.id]?.morale ?? 0), 0) / Math.max(1, attackerArmies.filter(a => s.armies[a.id]).length);
  const avgNewDefenderMorale = defenderArmies.filter(a => s.armies[a.id]).reduce((sum, a) => sum + (s.armies[a.id]?.morale ?? 0), 0) / Math.max(1, defenderArmies.filter(a => s.armies[a.id]).length);

  const attackerDefeated = newAttackUnits === 0 || avgNewAttackerMorale < 5;
  const defenderDefeated = newDefendUnits === 0 || avgNewDefenderMorale < 5;
  const battleConcluded = attackerDefeated || defenderDefeated;

  if (battleConcluded) {
    let winner: 'attacker' | 'defender' | 'draw' = 
      attackerDefeated && defenderDefeated ? 'draw' :
      attackerDefeated ? 'defender' : 'attacker';

    const provinceCaptured = winner === 'attacker';
    
    if (provinceCaptured) {
      s = updateProvince(s, provId, p => ({
        ...p,
        countryId: attackerCountry,
        morale: Math.max(10, p.morale - 40),
        stability: Math.max(10, p.stability - 30),
      }));
      s = updateCountry(s, defenderCountry, c => ({
        ...c,
        stability: Math.max(5, c.stability - 3),
        militaryMorale: Math.max(5, c.militaryMorale - 5),
      }));
      
      let eventId: string;
      [eventId, s] = allocateEntityId(s, 'evt');
      events.push({
        id: eventId, turn: s.turn, type: 'conquest',
        title: `${prov.name} Captured!`,
        description: `${s.countries[attackerCountry]?.name} seized ${prov.name} from ${s.countries[defenderCountry]?.name}`,
        countryId: attackerCountry,
      });
    }

    const atkName = s.countries[attackerCountry].name;
    const defName = s.countries[defenderCountry].name;
    const description = provinceCaptured
      ? `${atkName} captured ${prov.name} from ${defName}!`
      : `Battle in ${prov.name}: ${winner === 'draw' ? 'Draw' : `${winner === 'defender' ? defName : atkName} prevailed`}`;

    const report: BattleReport = {
      turn: s.turn, provinceId: provId,
      attackerCountryId: attackerCountry, defenderCountryId: defenderCountry,
      attackerLosses, defenderLosses, winner, description, provinceCaptured,
    };

    return { state: s, battleConcluded: true, battleReport: report };
  }

  return { state: s, battleConcluded: false };
}

function calculateCombatPower(
  unitSide: ArmyUnit[], enemySide: ArmyUnit[], terrain: string, isDefensive: boolean,
  moraleFactor: number, radarLevel: number, aaLevel: number, terrainMultiplier: number, country: Country,
): number {
  let power = 0;
  const techEffects = getCountryTechEffects(country);
  const byType: Record<string, number> = {};
  for (const u of unitSide) {
    byType[u.type] = (byType[u.type] ?? 0) + u.count;
  }

  for (const u of unitSide) {
    const stats = UNIT_STATS[u.type];
    const totalOfType = byType[u.type];
    const effectiveCount = totalOfType <= 20 ? u.count : u.count * (20 + Math.log2(totalOfType - 19) * 5) / totalOfType;
    let effectiveness = isDefensive ? (stats.defense + stats.attack * 0.5) : stats.attack;
    if (!isDefensive) {
      if (u.type === 'infantry' || u.type === 'motorizedInfantry') {
        effectiveness *= 1 + techEffects.infantryAttack;
      }
      if (u.type === 'armoredCar' || u.type === 'tank') {
        effectiveness *= 1 + techEffects.armorAttack;
      }
      if (u.type === 'fighter' || u.type === 'bomber' || u.type === 'drone') {
        effectiveness *= 1 + techEffects.airAttack;
      }
    }
    effectiveness *= effectiveCount * (u.health / 100) * (u.level * 0.1 + 0.9);

    // Unit matchups
    for (const eu of enemySide) {
      if (stats.strongVs.includes(UNIT_STATS[eu.type].armorClass)) {
        effectiveness *= 1.3;
        break;
      }
      if (stats.weakVs.includes(UNIT_STATS[eu.type].armorClass)) {
        effectiveness *= 0.75;
        break;
      }
    }

    power += effectiveness;
  }

  // Anti-air reduces attacker air power
  if (aaLevel > 0) {
    for (const u of unitSide) {
      if (UNIT_STATS[u.type].armorClass === 'aircraft') {
        power -= UNIT_STATS[u.type].attack * u.count * 0.08 * aaLevel;
      }
    }
  }

  power *= moraleFactor * terrainMultiplier;
  return Math.max(0, power);
}

function applyBattleRoundDamage(
  state: GameState, armies: Army[],
  unitLosses: Partial<Record<UnitType, number>>,
  friendlyPower: number, enemyPower: number,
): GameState {
  let s = { ...state };
  const newArmies = { ...s.armies };
  const total = Math.max(1, friendlyPower + enemyPower);
  const moraleLossFactor = (enemyPower / total) * 8; // Up to 8% morale loss per round based on power ratio

  for (const army of armies) {
    if (!newArmies[army.id]) continue;
    
    const updatedUnits = newArmies[army.id].units.map(u => {
      const lost = unitLosses[u.type] ?? 0;
      const healthLoss = 1 + (enemyPower > friendlyPower ? 2 : 0); // Extra damage if losing
      return {
        ...u,
        count: Math.max(0, u.count - lost),
        health: Math.max(15, u.health - healthLoss),
      };
    }).filter(u => u.count > 0);

    let moraleVariance: number;
    [moraleVariance, s] = takeRandomRange(s, 0.5, 1);
    const moraleLoss = moraleLossFactor * moraleVariance;
    const newMorale = Math.max(0, newArmies[army.id].morale - moraleLoss);

    newArmies[army.id] = {
      ...newArmies[army.id],
      units: updatedUnits,
      morale: newMorale,
    };
  }

  s.armies = newArmies;
  return s;
}

function processProvinceMorale(state: GameState): GameState {
  let s = state;
  for (const provId of Object.keys(s.provinces)) {
    const province = s.provinces[provId];
    let morale = province.morale;

    if (province.countryId !== province.originalCountryId) {
      const garrison = Object.values(s.armies).filter(a => a.countryId === province.countryId && a.provinceId === provId && !a.targetProvinceId);
      const garrisonSize = garrison.reduce((sum, a) => sum + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
      const garrisonBonus = Math.min(0.5, garrisonSize * 0.02);
      morale = morale + garrisonBonus - 0.3;

      if (morale < 20) {
        let rebellionRoll: number;
        [rebellionRoll, s] = takeRandom(s);
        if (rebellionRoll < 0.02) {
          morale = Math.max(5, morale - 10);
        }
      }
    } else {
      morale = Math.min(100, morale + 0.5);
    }

    if (province.corruption > 30) morale = Math.max(5, morale - 0.2);

    s = updateProvince(s, provId, p => ({ ...p, morale: Math.max(0, Math.min(100, morale)) }));
  }
  return s;
}

// ─── AI ───
function processAI(state: GameState, countryId: CountryId, events: GameEvent[]): GameState {
  let s = state;
  const country = s.countries[countryId];
  const provs = getProvincesForCountry(s.provinces, countryId);
  
  if (provs.length === 0) return s;

  // Identify capital (most populous province as proxy)
  const capital = provs.reduce((max, p) => p.population > max.population ? p : max, provs[0]);
  
  // Analyze threat level
  const activeWars = s.wars.filter(w => w.active && (w.attackers.includes(countryId) || w.defenders.includes(countryId)));
  const enemyIds = new Set<CountryId>();
  for (const w of activeWars) {
    (w.attackers.includes(countryId) ? w.defenders : w.attackers).forEach(id => enemyIds.add(id));
  }
  const atWar = enemyIds.size > 0;

  // Count military strength
  const myArmies = Object.values(s.armies).filter(a => a.countryId === countryId);
  const totalUnits = myArmies.reduce((sum, a) => sum + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
  
  // 1. Research (high priority)
  if (country.technology.activeResearch.length < country.researchSlots) {
    const available = TECHNOLOGIES.filter(t =>
      !country.technology.researched.includes(t.id) &&
      t.prerequisites.every(p => country.technology.researched.includes(p)) &&
      !country.technology.activeResearch.some(r => r.techId === t.id)
    );
    if (available.length > 0) {
      // Prioritize military tech during war, economic otherwise
      const preferred = atWar 
        ? available.filter(t => ['infantry', 'armor', 'air', 'logistics'].includes(t.category))
        : available.filter(t => ['industry', 'logistics'].includes(t.category));
      const tech = (preferred.length > 0 ? preferred : available)[0];
      s = processAction(s, { type: 'START_RESEARCH', countryId, techId: tech.id });
    }
  }

  // 2. Infrastructure & Military buildings (every 3 turns)
  if (s.turn % 3 === 0) {
    // Prioritize capital development
    if (!capital.buildings.some(b => b.type === 'militaryBase')) {
      if (canAfford(s.countries[countryId].resources, BUILDING_INFO.militaryBase.baseCost)) {
        s = processAction(s, { type: 'BUILD_IN_PROVINCE', provinceId: capital.id, buildingType: 'militaryBase' });
      }
    } else {
      // Build in other strategic provinces
      const borderProvs = provs.filter(p => 
        p.adjacentProvinces.some(adjId => {
          const adj = s.provinces[adjId];
          return adj && adj.countryId !== countryId;
        })
      );
      for (const prov of borderProvs) {
        if (!prov.buildings.some(b => b.type === 'militaryBase')) {
          if (canAfford(s.countries[countryId].resources, BUILDING_INFO.militaryBase.baseCost)) {
            s = processAction(s, { type: 'BUILD_IN_PROVINCE', provinceId: prov.id, buildingType: 'militaryBase' });
            break;
          }
        }
      }
    }
    
    // Build fortifications in capital if at war
    if (atWar && !capital.buildings.some(b => b.type === 'fortification')) {
      if (canAfford(s.countries[countryId].resources, BUILDING_INFO.fortification.baseCost)) {
        s = processAction(s, { type: 'BUILD_IN_PROVINCE', provinceId: capital.id, buildingType: 'fortification' });
      }
    }
  }

  // 3. Unit recruitment (every 2 turns, aggressive if weak)
  const shouldRecruit = (s.turn % 2 === 0) || (atWar && totalUnits < 50);
  if (shouldRecruit) {
    const productionProvs = provs.filter(p => p.buildings.some(b => b.type === 'militaryBase'));
    
    for (const prov of productionProvs) {
      let unitType: UnitType = 'infantry';
      let quantity = 8;

      const borderPressure = prov.adjacentProvinces.some(adjId => enemyIds.has(s.provinces[adjId]?.countryId ?? ''));
      const canFieldTanks = country.technology.researched.includes('armor_2') && s.countries[countryId].resources.oil >= 120;
      const canFieldArmoredCars = country.technology.researched.includes('armor_1') && s.countries[countryId].resources.oil >= 60;

      if ((atWar || borderPressure) && canFieldTanks) {
        unitType = 'tank';
        quantity = 3;
      } else if ((atWar || totalUnits < 25) && canFieldArmoredCars) {
        unitType = 'armoredCar';
        quantity = 4;
      }
      
      const cost = scaleResources(UNIT_STATS[unitType].cost, quantity);
      if (canAfford(s.countries[countryId].resources, cost)) {
        s = processAction(s, { type: 'PRODUCE_UNITS', provinceId: prov.id, unitType, quantity });
        break; // One production per turn
      }
    }
  }

  // 4. Capital defense priority
  const capitalGarrison = myArmies.filter(a => a.provinceId === capital.id && !a.targetProvinceId);
  const capitalStrength = capitalGarrison.reduce((sum, a) => sum + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
  const minCapitalDefense = atWar ? 30 : 15;
  
  if (capitalStrength < minCapitalDefense) {
    // Redirect nearby armies to capital
    const nearbyArmy = myArmies.find(a => 
      a.provinceId !== capital.id && 
      !a.targetProvinceId &&
      a.units.reduce((sum, u) => sum + u.count, 0) > 5
    );
    if (nearbyArmy) {
      s = processAction(s, { type: 'MOVE_ARMY', armyId: nearbyArmy.id, targetProvinceId: capital.id });
    }
  }

  // 5. Defend important border provinces
  const threatenedProvs = provs.filter(prov => {
    const hasEnemyNearby = prov.adjacentProvinces.some(adjId => {
      const adj = s.provinces[adjId];
      return adj && enemyIds.has(adj.countryId);
    });
    const garrison = myArmies.filter(a => a.provinceId === prov.id && !a.targetProvinceId);
    const strength = garrison.reduce((sum, a) => sum + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
    return hasEnemyNearby && strength < 10;
  });
  
  if (threatenedProvs.length > 0 && s.turn % 2 === 0) {
    const target = threatenedProvs[0];
    const reinforcement = myArmies.find(a => 
      a.provinceId !== target.id &&
      !a.targetProvinceId &&
      a.units.reduce((sum, u) => sum + u.count, 0) > 8 &&
      a.provinceId !== capital.id // Don't leave capital
    );
    if (reinforcement) {
      s = processAction(s, { type: 'MOVE_ARMY', armyId: reinforcement.id, targetProvinceId: target.id });
    }
  }

  // 6. Offensive operations: attack weak neighbors or expand
  if (s.turn % 3 === 0) {
    const idleArmies = myArmies.filter(a => 
      !a.targetProvinceId &&
      a.units.reduce((sum, u) => sum + u.count, 0) >= 15 &&
      a.provinceId !== capital.id // Keep capital garrison
    );

    for (const army of idleArmies.slice(0, 2)) {
      const currentProv = s.provinces[army.provinceId];
      if (!currentProv) continue;

      // Find weak enemy targets
      const enemyTargets = currentProv.adjacentProvinces
        .map(adjId => s.provinces[adjId])
        .filter(adj => {
          if (!adj) return false;
          
          // War target
          if (atWar && enemyIds.has(adj.countryId)) {
            const enemyGarrison = Object.values(s.armies)
              .filter(a => a.countryId === adj.countryId && a.provinceId === adj.id && !a.targetProvinceId)
              .reduce((sum, a) => sum + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
            return enemyGarrison < 20; // Only attack if outnumbered
          }
          
          // Expansion: undefended neutral provinces
          if (!atWar && adj.countryId !== countryId && !enemyIds.has(adj.countryId)) {
            const enemyGarrison = Object.values(s.armies)
              .filter(a => a.countryId === adj.countryId && a.provinceId === adj.id && !a.targetProvinceId)
              .reduce((sum, a) => sum + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
            return enemyGarrison < 10;
          }
          
          return false;
        })
        .map(target => {
          const enemyGarrison = Object.values(s.armies)
            .filter(a => a.countryId === target!.countryId && a.provinceId === target!.id && !a.targetProvinceId)
            .reduce((sum, a) => sum + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
          const fortLevel = target!.buildings.find(b => b.type === 'fortification')?.level ?? 0;
          const terrainPenalty = TERRAIN_MOVEMENT_COST[target!.terrain] + TERRAIN_DEFENSE_BONUS[target!.terrain] * 5 + fortLevel * 2;
          const valueScore = Math.min(25, target!.development / 3 + target!.population / 5_000_000);
          return {
            target: target!,
            score: valueScore - enemyGarrison - terrainPenalty,
          };
        })
        .sort((a, b) => b.score - a.score);

      if (enemyTargets.length > 0) {
        const target = enemyTargets[0].target;
        
        // Declare war if not already at war
        if (!atWar && !enemyIds.has(target.countryId)) {
          const myStrength = totalUnits;
          const enemyStrength = Object.values(s.armies)
            .filter(a => a.countryId === target.countryId)
            .reduce((sum, a) => sum + a.units.reduce((s2, u) => s2 + u.count, 0), 0);
          
          if (myStrength > enemyStrength * 1.75 && country.stability > 35) {
            s = processAction(s, { type: 'DECLARE_WAR', attackerId: countryId, defenderId: target.countryId });
          }
        }
        
        s = processAction(s, { type: 'MOVE_ARMY', armyId: army.id, targetProvinceId: target.id });
      }
    }
  }

  return s;
}
