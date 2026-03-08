import {
  GameState, GameAction, Country, CountryId, Province, ProvinceId, ArmyId,
  Army, ArmyUnit, War, BattleReport, GameEvent, ConstructionItem, ProductionItem,
  UnitType, BuildingType, BUILDING_INFO, TERRAIN_DEFENSE_BONUS, Resources, RESOURCE_KEYS,
} from '@/types/game';
import { UNIT_STATS } from '@/data/unitStats';
import { TECHNOLOGIES } from '@/data/technologies';
import { getProvincesForCountry } from '@/data/provinces';

// ─── Pure function game engine ───

export function processAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEXT_TURN': return processTurn(state);
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
  return { food: a.food + b.food, oil: a.oil + b.oil, metal: a.metal + b.metal, electronics: a.electronics + b.electronics, money: a.money + b.money };
}
function subtractResources(a: Resources, b: Resources): Resources {
  return { food: a.food - b.food, oil: a.oil - b.oil, metal: a.metal - b.metal, electronics: a.electronics - b.electronics, money: a.money - b.money };
}
function scaleResources(r: Resources, s: number): Resources {
  return { food: Math.floor(r.food * s), oil: Math.floor(r.oil * s), metal: Math.floor(r.metal * s), electronics: Math.floor(r.electronics * s), money: Math.floor(r.money * s) };
}
function canAfford(have: Resources, cost: Resources): boolean {
  return RESOURCE_KEYS.every(k => have[k] >= cost[k]);
}
function uid(): string { return Math.random().toString(36).slice(2, 10); }

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

  const item: ConstructionItem = {
    id: `build_${uid()}`,
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
    ...updateCountry(state, prov.countryId, c => ({ ...c, resources: subtractResources(c.resources, cost) })),
    constructionQueue: [...state.constructionQueue, item],
  };
}

// ─── Unit Production ───
function handleProduceUnits(state: GameState, provId: ProvinceId, unitType: UnitType, quantity: number): GameState {
  const prov = state.provinces[provId];
  if (!prov) return state;
  const country = state.countries[prov.countryId];
  if (!country) return state;

  const stats = UNIT_STATS[unitType];
  // Check province has required building
  if (!prov.buildings.some(b => b.type === stats.requiredBuilding)) return state;
  // Check research
  if (stats.requiredResearch && !country.technology.researched.includes(stats.requiredResearch)) return state;

  const cost = scaleResources(stats.cost, quantity);
  if (!canAfford(country.resources, cost)) return state;

  const item: ProductionItem = {
    id: `prod_${uid()}`,
    countryId: prov.countryId,
    provinceId: provId,
    unitType,
    quantity,
    turnsRequired: stats.buildTime,
    turnsRemaining: stats.buildTime,
    cost,
  };

  return {
    ...updateCountry(state, prov.countryId, c => ({ ...c, resources: subtractResources(c.resources, cost) })),
    productionQueue: [...state.productionQueue, item],
  };
}

// ─── Army ───
function handleCreateArmy(state: GameState, provId: ProvinceId, unitDefs: { type: UnitType; count: number }[], name: string): GameState {
  const prov = state.provinces[provId];
  if (!prov) return state;

  // Pull units from garrison/completed production in province
  const armyId = `army_${uid()}`;
  const units: ArmyUnit[] = unitDefs.map(u => ({
    type: u.type, count: u.count, health: 100,
    level: getUnitLevel(state.countries[prov.countryId], u.type),
  }));

  const army: Army = {
    id: armyId, countryId: prov.countryId, provinceId: provId,
    targetProvinceId: null, movementProgress: 0, units, name,
  };

  return { ...state, armies: { ...state.armies, [armyId]: army } };
}

function handleMoveArmy(state: GameState, armyId: ArmyId, targetId: ProvinceId): GameState {
  const army = state.armies[armyId];
  if (!army) return state;
  // Check adjacency
  const currentProv = state.provinces[army.provinceId];
  if (!currentProv?.adjacentProvinces.includes(targetId)) return state;

  return {
    ...state,
    armies: {
      ...state.armies,
      [armyId]: { ...army, targetProvinceId: targetId, movementProgress: 0 },
    },
  };
}

function handleMergeArmies(state: GameState, armyIds: ArmyId[]): GameState {
  if (armyIds.length < 2) return state;
  const armies = armyIds.map(id => state.armies[id]).filter(Boolean);
  if (armies.length < 2) return state;
  if (!armies.every(a => a.provinceId === armies[0].provinceId)) return state;

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

  const newArmies = { ...state.armies };
  armyIds.forEach(id => delete newArmies[id]);
  const newId = `army_${uid()}`;
  newArmies[newId] = {
    id: newId, countryId: armies[0].countryId, provinceId: armies[0].provinceId,
    targetProvinceId: null, movementProgress: 0, units: merged, name: armies[0].name,
  };

  return { ...state, armies: newArmies };
}

function getUnitLevel(country: Country, _unitType: UnitType): number {
  // Level based on number of researched techs
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
      activeResearch: [...c.technology.activeResearch, { techId, progress: 0 }],
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
  const war: War = {
    id: `war_${uid()}`, attackers: [attackerId], defenders: [defenderId],
    startTurn: state.turn, battles: [], active: true,
  };
  const event: GameEvent = {
    id: `evt_${uid()}`, turn: state.turn, type: 'war',
    title: `${state.countries[attackerId].name} declares war!`,
    description: `${state.countries[attackerId].name} has declared war on ${state.countries[defenderId].name}`,
    countryId: attackerId,
  };
  let s = { ...state, wars: [...state.wars, war], events: [...state.events, event] };
  s = updateCountry(s, attackerId, c => ({ ...c, diplomacy: { ...c.diplomacy, relations: { ...c.diplomacy.relations, [defenderId]: -100 } } }));
  s = updateCountry(s, defenderId, c => ({ ...c, diplomacy: { ...c.diplomacy, relations: { ...c.diplomacy.relations, [attackerId]: -100 } } }));
  return s;
}

function handleAlliance(state: GameState, fromId: CountryId, toId: CountryId, allianceType: 'military' | 'economic' | 'both'): GameState {
  const rel = state.countries[toId]?.diplomacy.relations[fromId] ?? 0;
  if (rel < 30) return state;
  const alliance = {
    id: `alliance_${uid()}`,
    name: `${state.countries[fromId].name}-${state.countries[toId].name}`,
    members: [fromId, toId], type: allianceType,
  };
  return { ...state, alliances: [...state.alliances, alliance] };
}

function handleTrade(state: GameState, fromId: CountryId, toId: CountryId, value: number): GameState {
  const rel = state.countries[toId]?.diplomacy.relations[fromId] ?? 0;
  if (rel < 0) return state;
  return { ...state, tradeAgreements: [...state.tradeAgreements, { id: `trade_${uid()}`, countries: [fromId, toId], value, type: 'bilateral' }] };
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
  const event: GameEvent = {
    id: `evt_${uid()}`, turn: state.turn, type: 'diplomacy',
    title: 'Peace Treaty',
    description: `${state.countries[fromId].name} and ${state.countries[toId].name} signed a peace treaty`,
  };
  return { ...state, wars, events: [...state.events, event] };
}

// ─── Turn Processing ───
function processTurn(state: GameState): GameState {
  let s = { ...state };
  const events: GameEvent[] = [];

  // Advance time
  s.turn += 1;
  s.month += 1;
  if (s.month > 12) { s.month = 1; s.year += 1; }

  // 1. Calculate resource income for all countries
  s = processResourceIncome(s);

  // 2. Process construction queue
  s = processConstructionQueue(s, events);

  // 3. Process production queue
  s = processProductionQueue(s, events);

  // 4. Process research for all countries
  s = processAllResearch(s, events);

  // 5. Process army movement
  s = processArmyMovement(s, events);

  // 6. Process combat
  s = processCombat(s, events);

  // 7. Process province morale
  s = processProvinceMorale(s);

  // 8. AI decisions
  for (const id of Object.keys(s.countries)) {
    if (id !== s.playerCountryId) {
      s = processAI(s, id, events);
    }
  }

  s.events = [...s.events, ...events];
  return s;
}

function processResourceIncome(state: GameState): GameState {
  let s = state;
  for (const countryId of Object.keys(s.countries)) {
    const provs = getProvincesForCountry(s.provinces, countryId);
    const income: Resources = { food: 0, oil: 0, metal: 0, electronics: 0, money: 0 };

    for (const prov of provs) {
      const moraleMultiplier = prov.morale / 100;
      const corruptionPenalty = 1 - prov.corruption / 200;
      const extractorBonus = 1 + (prov.buildings.find(b => b.type === 'resourceExtractor')?.level ?? 0) * 0.15;
      const industryBonus = 1 + (prov.buildings.find(b => b.type === 'industry')?.level ?? 0) * 0.1;

      for (const key of RESOURCE_KEYS) {
        income[key] += Math.floor(prov.resourceProduction[key] * moraleMultiplier * corruptionPenalty * extractorBonus * industryBonus);
      }
    }

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
      // Apply building
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
      events.push({
        id: `evt_${uid()}`, turn: s.turn, type: 'construction',
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
      // Spawn units as garrison army in province
      const armyId = `army_${uid()}`;
      const country = s.countries[item.countryId];
      const newUnit: ArmyUnit = {
        type: item.unitType, count: item.quantity, health: 100,
        level: getUnitLevel(country, item.unitType),
      };
      // Try to merge with existing army in province
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
        const army: Army = {
          id: armyId, countryId: item.countryId, provinceId: item.provinceId,
          targetProvinceId: null, movementProgress: 0, units: [newUnit],
          name: `Garrison ${s.provinces[item.provinceId]?.name}`,
        };
        s = { ...s, armies: { ...s.armies, [armyId]: army } };
      }
      events.push({
        id: `evt_${uid()}`, turn: s.turn, type: 'production',
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
      rpPerTurn += (p.buildings.find(b => b.type === 'industry')?.level ?? 0) * 2;
    }
    // Split RP among active research
    const country = s.countries[countryId];
    if (country.technology.activeResearch.length === 0) continue;

    const rpEach = Math.floor(rpPerTurn / country.technology.activeResearch.length);
    const newActive = [];
    const newResearched = [...country.technology.researched];

    for (const ar of country.technology.activeResearch) {
      const tech = TECHNOLOGIES.find(t => t.id === ar.techId);
      if (!tech) continue;
      const newProgress = ar.progress + rpEach;
      if (newProgress >= tech.cost) {
        newResearched.push(ar.techId);
        events.push({
          id: `evt_${uid()}`, turn: s.turn, type: 'technology',
          title: 'Research Complete',
          description: `${tech.name} researched by ${country.name}`,
          countryId,
        });
      } else {
        newActive.push({ techId: ar.techId, progress: newProgress });
      }
    }

    s = updateCountry(s, countryId, c => ({
      ...c,
      technology: { researched: newResearched, activeResearch: newActive },
    }));
  }
  return s;
}

function processArmyMovement(state: GameState, _events: GameEvent[]): GameState {
  let s = { ...state };
  const newArmies = { ...s.armies };

  for (const army of Object.values(newArmies)) {
    if (!army.targetProvinceId) continue;

    // Speed based on fastest unit speed
    const maxSpeed = Math.min(...army.units.map(u => UNIT_STATS[u.type].speed));
    const infraBonus = 1 + (s.provinces[army.provinceId]?.buildings.find(b => b.type === 'infrastructure')?.level ?? 0) * 0.1;
    const progress = army.movementProgress + (maxSpeed * infraBonus * 0.5);

    if (progress >= 1) {
      newArmies[army.id] = { ...army, provinceId: army.targetProvinceId, targetProvinceId: null, movementProgress: 0 };
    } else {
      newArmies[army.id] = { ...army, movementProgress: progress };
    }
  }

  return { ...s, armies: newArmies };
}

function processCombat(state: GameState, events: GameEvent[]): GameState {
  let s = { ...state };

  // Find provinces where enemy armies coexist
  const armyByProvince: Record<ProvinceId, Army[]> = {};
  for (const army of Object.values(s.armies)) {
    if (!army.targetProvinceId) { // only stationary armies fight
      if (!armyByProvince[army.provinceId]) armyByProvince[army.provinceId] = [];
      armyByProvince[army.provinceId].push(army);
    }
  }

  for (const [provId, armies] of Object.entries(armyByProvince)) {
    if (armies.length < 2) continue;

    // Group by country
    const byCountry: Record<CountryId, Army[]> = {};
    for (const a of armies) {
      if (!byCountry[a.countryId]) byCountry[a.countryId] = [];
      byCountry[a.countryId].push(a);
    }
    const countryIds = Object.keys(byCountry);
    if (countryIds.length < 2) continue;

    // Check if any pair is at war
    for (let i = 0; i < countryIds.length; i++) {
      for (let j = i + 1; j < countryIds.length; j++) {
        const c1 = countryIds[i], c2 = countryIds[j];
        const atWar = s.wars.some(w => w.active && (
          (w.attackers.includes(c1) && w.defenders.includes(c2)) ||
          (w.attackers.includes(c2) && w.defenders.includes(c1))
        ));
        if (!atWar) continue;

        // Determine attacker (army that moved into province owned by other)
        const prov = s.provinces[provId];
        const attackerCountry = prov.countryId === c1 ? c2 : c1;
        const defenderCountry = prov.countryId === c1 ? c1 : c2;

        const attackerArmies = byCountry[attackerCountry];
        const defenderArmies = byCountry[defenderCountry];

        const report = resolveBattle(s, provId, attackerCountry, defenderCountry, attackerArmies, defenderArmies);

        // Apply losses
        s = applyBattleLosses(s, attackerArmies, report.attackerLosses);
        s = applyBattleLosses(s, defenderArmies, report.defenderLosses);

        // Province capture
        if (report.winner === 'attacker' && report.provinceCaptured) {
          s = updateProvince(s, provId, p => ({
            ...p,
            countryId: attackerCountry,
            morale: Math.max(10, p.morale - 40),
            stability: Math.max(10, p.stability - 30),
          }));
        }

        // Add to war battles
        s = {
          ...s,
          wars: s.wars.map(w => {
            if (!w.active) return w;
            const involves = (w.attackers.includes(attackerCountry) && w.defenders.includes(defenderCountry)) ||
                             (w.defenders.includes(attackerCountry) && w.attackers.includes(defenderCountry));
            return involves ? { ...w, battles: [...w.battles, report] } : w;
          }),
        };

        events.push({
          id: `evt_${uid()}`, turn: s.turn, type: 'war',
          title: report.provinceCaptured ? `${prov.name} Captured!` : 'Battle Report',
          description: report.description,
        });
      }
    }
  }

  // Remove empty armies
  const cleanArmies: Record<ArmyId, Army> = {};
  for (const [id, army] of Object.entries(s.armies)) {
    const totalUnits = army.units.reduce((sum, u) => sum + u.count, 0);
    if (totalUnits > 0) cleanArmies[id] = army;
  }
  s.armies = cleanArmies;

  return s;
}

function resolveBattle(
  state: GameState, provId: ProvinceId,
  attackerCountry: CountryId, defenderCountry: CountryId,
  attackerArmies: Army[], defenderArmies: Army[],
): BattleReport {
  const prov = state.provinces[provId];
  const terrain = prov.terrain;
  const terrainBonus = TERRAIN_DEFENSE_BONUS[terrain];
  const fortLevel = prov.buildings.find(b => b.type === 'fortification')?.level ?? 0;
  const bunkerLevel = prov.buildings.find(b => b.type === 'bunker')?.level ?? 0;
  const aaLevel = prov.buildings.find(b => b.type === 'antiAirDefense')?.level ?? 0;

  // Calculate total power
  let attackPower = 0, defendPower = 0;
  const allAttackUnits: ArmyUnit[] = attackerArmies.flatMap(a => a.units);
  const allDefendUnits: ArmyUnit[] = defenderArmies.flatMap(a => a.units);

  for (const u of allAttackUnits) {
    const stats = UNIT_STATS[u.type];
    let effectiveness = stats.attack * u.count * (u.health / 100) * (u.level * 0.1 + 0.9);
    // Strong vs bonus
    for (const du of allDefendUnits) {
      if (stats.strongVs.includes(UNIT_STATS[du.type].armorClass)) {
        effectiveness *= 1.3;
        break;
      }
    }
    attackPower += effectiveness;
  }

  for (const u of allDefendUnits) {
    const stats = UNIT_STATS[u.type];
    let effectiveness = (stats.attack + stats.defense) * u.count * (u.health / 100) * (u.level * 0.1 + 0.9);
    // Strong vs bonus
    for (const au of allAttackUnits) {
      if (stats.strongVs.includes(UNIT_STATS[au.type].armorClass)) {
        effectiveness *= 1.3;
        break;
      }
    }
    // Terrain + fortification bonus for defender
    effectiveness *= (1 + terrainBonus + fortLevel * 0.1 + bunkerLevel * 0.08);
    defendPower += effectiveness;
  }

  // Anti-air reduces air unit effectiveness
  if (aaLevel > 0) {
    for (const u of allAttackUnits) {
      if (UNIT_STATS[u.type].armorClass === 'aircraft') {
        attackPower -= UNIT_STATS[u.type].attack * u.count * 0.1 * aaLevel;
      }
    }
  }

  // Diminishing returns for stacking
  const attackerStackPenalty = Math.min(1, 10 / Math.max(1, allAttackUnits.reduce((s, u) => s + u.count, 0) / 50));
  const defenderStackPenalty = Math.min(1, 10 / Math.max(1, allDefendUnits.reduce((s, u) => s + u.count, 0) / 50));
  attackPower *= (0.7 + 0.3 * attackerStackPenalty);
  defendPower *= (0.7 + 0.3 * defenderStackPenalty);

  const total = attackPower + defendPower;
  const attackerLossRate = (defendPower / total) * 0.15;
  const defenderLossRate = (attackPower / total) * 0.15;

  const attackerLosses: Partial<Record<UnitType, number>> = {};
  for (const u of allAttackUnits) {
    const lost = Math.floor(u.count * attackerLossRate * (0.5 + Math.random() * 0.5));
    if (lost > 0) attackerLosses[u.type] = (attackerLosses[u.type] ?? 0) + lost;
  }
  const defenderLosses: Partial<Record<UnitType, number>> = {};
  for (const u of allDefendUnits) {
    const lost = Math.floor(u.count * defenderLossRate * (0.5 + Math.random() * 0.5));
    if (lost > 0) defenderLosses[u.type] = (defenderLosses[u.type] ?? 0) + lost;
  }

  const winner = attackPower > defendPower * 1.1 ? 'attacker' : defendPower > attackPower * 1.1 ? 'defender' : 'draw';

  // Province captured if attacker wins AND defender has very few units left
  const defenderRemaining = allDefendUnits.reduce((s, u) => s + u.count, 0) - Object.values(defenderLosses).reduce((s, v) => s + v, 0);
  const provinceCaptured = winner === 'attacker' && defenderRemaining <= 0;

  const atkName = state.countries[attackerCountry].name;
  const defName = state.countries[defenderCountry].name;
  const description = provinceCaptured
    ? `${atkName} captured ${prov.name} from ${defName}!`
    : `Battle in ${prov.name}: ${winner === 'draw' ? 'Draw' : `${winner === 'attacker' ? atkName : defName} prevailed`}`;

  return {
    turn: state.turn, provinceId: provId,
    attackerCountryId: attackerCountry, defenderCountryId: defenderCountry,
    attackerLosses, defenderLosses, winner, description, provinceCaptured,
  };
}

function applyBattleLosses(state: GameState, armies: Army[], losses: Partial<Record<UnitType, number>>): GameState {
  const s = { ...state };
  const newArmies = { ...s.armies };

  for (const army of armies) {
    const updatedUnits = army.units.map(u => {
      const lost = losses[u.type] ?? 0;
      return { ...u, count: Math.max(0, u.count - lost), health: Math.max(10, u.health - 10) };
    }).filter(u => u.count > 0);
    newArmies[army.id] = { ...army, units: updatedUnits };
  }

  s.armies = newArmies;
  return s;
}

function processProvinceMorale(state: GameState): GameState {
  let s = state;
  for (const provId of Object.keys(s.provinces)) {
    s = updateProvince(s, provId, p => {
      let morale = p.morale;
      // Conquered provinces slowly recover morale
      if (p.countryId !== p.originalCountryId) {
        morale = Math.max(10, morale - 0.5); // resistance
      } else {
        morale = Math.min(100, morale + 0.3); // natural recovery
      }
      // Corruption reduces morale
      if (p.corruption > 30) morale = Math.max(10, morale - 0.2);
      return { ...p, morale: Math.max(0, Math.min(100, morale)) };
    });
  }
  return s;
}

// ─── AI ───
function processAI(state: GameState, countryId: CountryId, events: GameEvent[]): GameState {
  let s = state;
  const country = s.countries[countryId];
  const provs = getProvincesForCountry(s.provinces, countryId);

  // Research if idle
  if (country.technology.activeResearch.length < country.researchSlots) {
    const available = TECHNOLOGIES.filter(t =>
      !country.technology.researched.includes(t.id) &&
      t.prerequisites.every(p => country.technology.researched.includes(p)) &&
      !country.technology.activeResearch.some(r => r.techId === t.id)
    );
    if (available.length > 0) {
      const tech = available[Math.floor(Math.random() * available.length)];
      s = processAction(s, { type: 'START_RESEARCH', countryId, techId: tech.id });
    }
  }

  // Build barracks in provinces that don't have them
  if (s.turn % 3 === 0) {
    for (const prov of provs) {
      if (!prov.buildings.some(b => b.type === 'barracks') && canAfford(country.resources, scaleResources(BUILDING_INFO.barracks.baseCost, 1))) {
        s = processAction(s, { type: 'BUILD_IN_PROVINCE', provinceId: prov.id, buildingType: 'barracks' });
        break;
      }
    }
  }

  // Produce units
  if (s.turn % 4 === 0) {
    for (const prov of provs) {
      if (prov.buildings.some(b => b.type === 'barracks') && canAfford(s.countries[countryId].resources, scaleResources(UNIT_STATS.infantry.cost, 5))) {
        s = processAction(s, { type: 'PRODUCE_UNITS', provinceId: prov.id, unitType: 'infantry', quantity: 5 });
        break;
      }
    }
  }

  return s;
}
