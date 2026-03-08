import { GameState, GameAction, Country, CountryId, MilitaryUnits, UnitType, War, Battle, GameEvent, ProvinceId, Province, ConstructionItem } from '@/types/game';
import { UNIT_STATS } from '@/data/unitStats';
import { TECHNOLOGIES } from '@/data/technologies';

// Pure function game engine - all state transitions are deterministic
// This makes it easy to sync in multiplayer later

export function processAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_TAX_RATE':
      return updateCountry(state, action.countryId, c => ({
        ...c,
        economy: { ...c.economy, taxRate: Math.max(0, Math.min(100, action.rate)) },
      }));

    case 'SET_BUDGET':
      return updateCountry(state, action.countryId, c => ({
        ...c,
        economy: {
          ...c.economy,
          budget: { ...c.economy.budget, ...action.budget },
        },
      }));

    case 'BUILD_UNITS': {
      const country = state.countries[action.countryId];
      const stats = UNIT_STATS[action.unitType];
      const totalCost = stats.cost * action.quantity;
      if (country.economy.budget.revenue - country.economy.budget.expenses < totalCost) return state;
      if (country.military.factories < 1) return state;

      return updateCountry(state, action.countryId, c => ({
        ...c,
        economy: {
          ...c.economy,
          budget: {
            ...c.economy.budget,
            expenses: c.economy.budget.expenses + totalCost,
            militarySpending: c.economy.budget.militarySpending + totalCost,
          },
        },
        military: {
          ...c.military,
          units: {
            ...c.military.units,
            [action.unitType]: c.military.units[action.unitType] + action.quantity,
          },
        },
      }));
    }

    case 'BUILD_BASE': {
      const cost = 500;
      return updateCountry(state, action.countryId, c => ({
        ...c,
        economy: { ...c.economy, budget: { ...c.economy.budget, expenses: c.economy.budget.expenses + cost } },
        military: { ...c.military, bases: c.military.bases + 1 },
      }));
    }

    case 'BUILD_FACTORY': {
      const cost = 300;
      return updateCountry(state, action.countryId, c => ({
        ...c,
        economy: { ...c.economy, budget: { ...c.economy.budget, expenses: c.economy.budget.expenses + cost } },
        military: { ...c.military, factories: c.military.factories + 1 },
      }));
    }

    case 'UPGRADE_SECTOR':
      return updateCountry(state, action.countryId, c => {
        const sector = c.economy.sectors[action.sector];
        if (sector.level >= 10) return c;
        const cost = sector.level * 200;
        return {
          ...c,
          economy: {
            ...c.economy,
            budget: { ...c.economy.budget, expenses: c.economy.budget.expenses + cost },
            sectors: {
              ...c.economy.sectors,
              [action.sector]: {
                ...sector,
                level: sector.level + 1,
                output: (sector.level + 1) * 100,
                workers: (sector.level + 1) * 50000,
              },
            },
          },
        };
      });

    case 'UPGRADE_INFRASTRUCTURE':
      return updateCountry(state, action.countryId, c => {
        const current = c.infrastructure[action.infra];
        if (current >= 10) return c;
        const cost = current * 150;
        return {
          ...c,
          economy: { ...c.economy, budget: { ...c.economy.budget, expenses: c.economy.budget.expenses + cost } },
          infrastructure: { ...c.infrastructure, [action.infra]: current + 1 },
        };
      });

    case 'DECLARE_WAR': {
      const newWar: War = {
        id: `war_${state.turn}_${action.attackerId}_${action.defenderId}`,
        attackers: [action.attackerId],
        defenders: [action.defenderId],
        startTurn: state.turn,
        battles: [],
        active: true,
      };
      const event: GameEvent = {
        id: `evt_${state.turn}_war`,
        turn: state.turn,
        type: 'war',
        title: `${state.countries[action.attackerId].name} declares war!`,
        description: `${state.countries[action.attackerId].name} has declared war on ${state.countries[action.defenderId].name}`,
        countryId: action.attackerId,
      };
      // Worsen relations
      let newState = { ...state, wars: [...state.wars, newWar], events: [...state.events, event] };
      newState = updateCountry(newState, action.attackerId, c => ({
        ...c,
        diplomacy: {
          ...c.diplomacy,
          relations: { ...c.diplomacy.relations, [action.defenderId]: -100 },
        },
      }));
      newState = updateCountry(newState, action.defenderId, c => ({
        ...c,
        diplomacy: {
          ...c.diplomacy,
          relations: { ...c.diplomacy.relations, [action.attackerId]: -100 },
        },
      }));
      return newState;
    }

    case 'PROPOSE_ALLIANCE': {
      const rel = state.countries[action.toId].diplomacy.relations[action.fromId] || 0;
      if (rel < 30) return state; // Need decent relations
      const alliance = {
        id: `alliance_${state.turn}`,
        name: `${state.countries[action.fromId].name}-${state.countries[action.toId].name} Alliance`,
        members: [action.fromId, action.toId],
        type: action.allianceType,
      };
      return { ...state, alliances: [...state.alliances, alliance] };
    }

    case 'PROPOSE_TRADE': {
      const rel = state.countries[action.toId].diplomacy.relations[action.fromId] || 0;
      if (rel < 0) return state;
      const trade = {
        id: `trade_${state.turn}`,
        countries: [action.fromId, action.toId] as [CountryId, CountryId],
        value: action.value,
        type: 'bilateral' as const,
      };
      return { ...state, tradeAgreements: [...state.tradeAgreements, trade] };
    }

    case 'SET_EMBARGO':
      return updateCountry(state, action.countryId, c => ({
        ...c,
        diplomacy: {
          ...c.diplomacy,
          embargoes: [...c.diplomacy.embargoes, action.targetId],
          relations: {
            ...c.diplomacy.relations,
            [action.targetId]: Math.max(-100, (c.diplomacy.relations[action.targetId] || 0) - 30),
          },
        },
      }));

    case 'REMOVE_EMBARGO':
      return updateCountry(state, action.countryId, c => ({
        ...c,
        diplomacy: {
          ...c.diplomacy,
          embargoes: c.diplomacy.embargoes.filter(e => e !== action.targetId),
        },
      }));

    case 'START_RESEARCH': {
      const tech = TECHNOLOGIES.find(t => t.id === action.techId);
      if (!tech) return state;
      const country = state.countries[action.countryId];
      if (country.technology.researched.includes(action.techId)) return state;
      if (!tech.prerequisites.every(p => country.technology.researched.includes(p))) return state;
      return updateCountry(state, action.countryId, c => ({
        ...c,
        technology: { ...c.technology, currentResearch: action.techId, currentProgress: 0 },
      }));
    }

    case 'SET_CORRUPTION':
      return updateCountry(state, action.countryId, c => ({
        ...c,
        government: { ...c.government, corruption: Math.max(0, Math.min(100, action.level)) },
      }));

    case 'UPGRADE_PROVINCE_INFRA': {
      const prov = state.provinces[action.provinceId];
      if (!prov) return state;
      const current = prov.infrastructure[action.infra];
      if (current >= 10) return state;
      const cost = current * 150;
      const turnsRequired = Math.max(2, current + 1);
      const item: ConstructionItem = {
        id: `build_${state.turn}_${action.provinceId}_${action.infra}_${Date.now()}`,
        countryId: prov.countryId,
        provinceId: action.provinceId,
        category: 'infrastructure',
        type: action.infra,
        label: `${action.infra} → Lv.${current + 1}`,
        cost,
        turnsRequired,
        turnsRemaining: turnsRequired,
        startedTurn: state.turn,
      };
      return { ...state, constructionQueue: [...state.constructionQueue, item] };
    }

    case 'UPGRADE_PROVINCE_INDUSTRY': {
      const prov = state.provinces[action.provinceId];
      if (!prov) return state;
      const current = prov.industry[action.industry];
      if (current >= 10) return state;
      const cost = current * 200;
      const turnsRequired = Math.max(2, current + 1);
      const item: ConstructionItem = {
        id: `build_${state.turn}_${action.provinceId}_${action.industry}_${Date.now()}`,
        countryId: prov.countryId,
        provinceId: action.provinceId,
        category: 'industry',
        type: action.industry,
        label: `${action.industry} → Lv.${current + 1}`,
        cost,
        turnsRequired,
        turnsRemaining: turnsRequired,
        startedTurn: state.turn,
      };
      return { ...state, constructionQueue: [...state.constructionQueue, item] };
    }

    case 'BUILD_PROVINCE_BASE': {
      const prov = state.provinces[action.provinceId];
      if (!prov) return state;
      const cost = 500;
      const turnsRequired = 4;
      const item: ConstructionItem = {
        id: `build_${state.turn}_${action.provinceId}_base_${Date.now()}`,
        countryId: prov.countryId,
        provinceId: action.provinceId,
        category: 'military',
        type: 'base',
        label: `Military Base`,
        cost,
        turnsRequired,
        turnsRemaining: turnsRequired,
        startedTurn: state.turn,
      };
      return { ...state, constructionQueue: [...state.constructionQueue, item] };
    }

    case 'GARRISON_PROVINCE': {
      const prov = state.provinces[action.provinceId];
      if (!prov) return state;
      return updateProvince(state, action.provinceId, p => ({
        ...p,
        military: { ...p.military, garrison: p.military.garrison + action.troops },
      }));
    }

    case 'CANCEL_CONSTRUCTION': {
      return { ...state, constructionQueue: state.constructionQueue.filter(i => i.id !== action.itemId) };
    }

    case 'NEXT_TURN':
      return processTurn(state);

    case 'SET_SPEED':
      return { ...state, speed: action.speed };

    case 'TOGGLE_PAUSE':
      return { ...state, paused: !state.paused };

    default:
      return state;
  }
}

function updateProvince(state: GameState, id: ProvinceId, updater: (p: Province) => Province): GameState {
  return {
    ...state,
    provinces: {
      ...state.provinces,
      [id]: updater(state.provinces[id]),
    },
  };
}

function updateCountry(state: GameState, id: CountryId, updater: (c: Country) => Country): GameState {
  return {
    ...state,
    countries: {
      ...state.countries,
      [id]: updater(state.countries[id]),
    },
  };
}

function processTurn(state: GameState): GameState {
  let newState = { ...state };
  const newEvents: GameEvent[] = [];

  // Advance time
  newState.turn += 1;
  newState.month += 1;
  if (newState.month > 12) {
    newState.month = 1;
    newState.year += 1;
  }

  // Process each country
  for (const id of Object.keys(newState.countries)) {
    newState = updateCountry(newState, id, c => processCountryTurn(c, newState));
  }

  // Process wars
  for (const war of newState.wars.filter(w => w.active)) {
    const result = processBattle(war, newState);
    newState = result.state;
    if (result.battle) {
      war.battles.push(result.battle);
      newEvents.push({
        id: `evt_${newState.turn}_battle_${war.id}`,
        turn: newState.turn,
        type: 'war',
        title: 'Battle Report',
        description: result.battle.description,
      });
    }
  }

  // AI decisions for non-player countries
  for (const id of Object.keys(newState.countries)) {
    if (id !== newState.playerCountryId) {
      newState = processAI(newState, id);
    }
  }

  // Process research
  for (const id of Object.keys(newState.countries)) {
    newState = updateCountry(newState, id, c => processResearch(c));
  }

  newState.events = [...newState.events, ...newEvents];

  return newState;
}

function processCountryTurn(country: Country, _state: GameState): Country {
  const c = { ...country };
  const eco = { ...c.economy };
  const budget = { ...eco.budget };

  // Tax revenue
  budget.revenue = eco.gdp * (eco.taxRate / 100) * (1 - c.government.corruption / 200);

  // GDP growth based on sectors, infrastructure, stability
  const sectorOutput = Object.values(eco.sectors).reduce((sum, s) => sum + s.output, 0);
  const infraBonus = Object.values(c.infrastructure).reduce((sum, v) => sum + v, 0) / 60;
  const stabilityFactor = c.stability / 100;
  const corruptionPenalty = 1 - c.government.corruption / 200;
  const growthRate = 0.005 * stabilityFactor * corruptionPenalty * (1 + infraBonus);

  eco.gdp = eco.gdp * (1 + growthRate) + sectorOutput * 0.01;
  eco.inflation = Math.max(0, eco.inflation + (eco.taxRate > 40 ? 0.1 : -0.05));
  eco.unemployment = Math.max(1, eco.unemployment + (eco.gdp > budget.expenses ? -0.1 : 0.2));

  // Budget
  const surplus = budget.revenue - budget.expenses;
  eco.debt = Math.max(0, eco.debt - surplus);
  eco.tradeBalance = eco.tradeBalance * 0.98; // Slowly normalize

  eco.budget = budget;
  c.economy = eco;

  // Stability effects
  if (eco.taxRate > 50) c.stability = Math.max(0, c.stability - 1);
  if (eco.unemployment > 15) c.stability = Math.max(0, c.stability - 1);
  if (c.government.corruption > 60) c.stability = Math.max(0, c.stability - 0.5);
  if (surplus > 0) c.approval = Math.min(100, c.approval + 0.2);
  if (surplus < 0) c.approval = Math.max(0, c.approval - 0.5);

  // Military morale
  c.military = { ...c.military };
  if (budget.militarySpending > eco.gdp * 0.03) {
    c.military.morale = Math.min(100, c.military.morale + 0.5);
  } else {
    c.military.morale = Math.max(0, c.military.morale - 0.3);
  }

  return c;
}

function processResearch(country: Country): Country {
  if (!country.technology.currentResearch) return country;
  const tech = TECHNOLOGIES.find(t => t.id === country.technology.currentResearch);
  if (!tech) return country;

  const newProgress = country.technology.currentProgress + country.technology.researchPerTurn;
  if (newProgress >= tech.cost) {
    return {
      ...country,
      technology: {
        ...country.technology,
        researched: [...country.technology.researched, tech.id],
        currentResearch: null,
        currentProgress: 0,
        researchPoints: country.technology.researchPoints + 1,
      },
    };
  }

  return {
    ...country,
    technology: { ...country.technology, currentProgress: newProgress },
  };
}

function processBattle(war: War, state: GameState): { state: GameState; battle: Battle | null } {
  const attacker = state.countries[war.attackers[0]];
  const defender = state.countries[war.defenders[0]];

  if (!attacker || !defender) return { state, battle: null };

  const attackPower = calculateMilitaryPower(attacker.military.units, defender.military.units, true);
  const defensePower = calculateMilitaryPower(defender.military.units, attacker.military.units, false);

  const attackerInfraBonus = Object.values(attacker.infrastructure).reduce((s, v) => s + v, 0) / 60;
  const defenderInfraBonus = Object.values(defender.infrastructure).reduce((s, v) => s + v, 0) / 60;

  const totalAttack = attackPower * (attacker.military.morale / 100) * (1 + attackerInfraBonus * 0.2);
  const totalDefense = defensePower * (defender.military.morale / 100) * (1 + defenderInfraBonus * 0.3) * 1.2; // defender advantage

  const attackerLossRate = totalDefense / (totalAttack + totalDefense) * 0.05;
  const defenderLossRate = totalAttack / (totalAttack + totalDefense) * 0.05;

  const attackerLosses = calculateLosses(attacker.military.units, attackerLossRate);
  const defenderLosses = calculateLosses(defender.military.units, defenderLossRate);

  const winner = totalAttack > totalDefense ? 'attacker' : totalDefense > totalAttack ? 'defender' : 'draw';

  let newState = state;
  newState = updateCountry(newState, war.attackers[0], c => ({
    ...c,
    military: {
      ...c.military,
      units: subtractUnits(c.military.units, attackerLosses),
      morale: Math.max(0, c.military.morale - (winner === 'defender' ? 3 : -1)),
    },
  }));
  newState = updateCountry(newState, war.defenders[0], c => ({
    ...c,
    military: {
      ...c.military,
      units: subtractUnits(c.military.units, defenderLosses),
      morale: Math.max(0, c.military.morale - (winner === 'attacker' ? 3 : -1)),
    },
  }));

  const battle: Battle = {
    turn: state.turn,
    attackerLosses,
    defenderLosses,
    winner,
    description: `Battle between ${attacker.name} and ${defender.name}: ${winner === 'draw' ? 'Draw' : `${winner === 'attacker' ? attacker.name : defender.name} prevailed`}`,
  };

  return { state: newState, battle };
}

function calculateMilitaryPower(units: MilitaryUnits, enemyUnits: MilitaryUnits, _isAttacker: boolean): number {
  let power = 0;
  for (const [type, count] of Object.entries(units) as [UnitType, number][]) {
    const stats = UNIT_STATS[type];
    let effectiveness = stats.attack;
    // Bonus against weak targets
    for (const strongTarget of stats.strongAgainst) {
      if (enemyUnits[strongTarget] > 0) {
        effectiveness *= 1.3;
      }
    }
    power += count * effectiveness;
  }
  return power;
}

function calculateLosses(units: MilitaryUnits, lossRate: number): Partial<MilitaryUnits> {
  const losses: Partial<MilitaryUnits> = {};
  for (const [type, count] of Object.entries(units) as [UnitType, number][]) {
    const lost = Math.floor(count * lossRate * (0.5 + Math.random()));
    if (lost > 0) losses[type] = lost;
  }
  return losses;
}

function subtractUnits(units: MilitaryUnits, losses: Partial<MilitaryUnits>): MilitaryUnits {
  const result = { ...units };
  for (const [type, lost] of Object.entries(losses) as [UnitType, number][]) {
    result[type] = Math.max(0, result[type] - lost);
  }
  return result;
}

function processAI(state: GameState, countryId: CountryId): GameState {
  const country = state.countries[countryId];
  let newState = state;

  // Simple AI: adjust taxes if in debt
  if (country.economy.debt > country.economy.gdp * 0.8 && country.economy.taxRate < 40) {
    newState = processAction(newState, { type: 'SET_TAX_RATE', countryId, rate: country.economy.taxRate + 2 });
  }

  // Build military if threatened
  const hasEnemy = Object.entries(country.diplomacy.relations).some(([, rel]) => rel < -60);
  if (hasEnemy && country.military.factories > 0) {
    const surplus = country.economy.budget.revenue - country.economy.budget.expenses;
    if (surplus > 100) {
      newState = processAction(newState, { type: 'BUILD_UNITS', countryId, unitType: 'infantry', quantity: 50 });
    }
  }

  // Research if idle
  if (!country.technology.currentResearch) {
    const available = TECHNOLOGIES.filter(t =>
      !country.technology.researched.includes(t.id) &&
      t.prerequisites.every(p => country.technology.researched.includes(p))
    );
    if (available.length > 0) {
      const tech = available[Math.floor(Math.random() * available.length)];
      newState = processAction(newState, { type: 'START_RESEARCH', countryId, techId: tech.id });
    }
  }

  // Declare war if relations are very bad and military is strong
  if (state.turn % 12 === 0) { // Check yearly
    for (const [otherId, rel] of Object.entries(country.diplomacy.relations)) {
      if (rel < -70 && !state.wars.some(w => w.active &&
        (w.attackers.includes(countryId) || w.defenders.includes(countryId)))) {
        const otherCountry = state.countries[otherId];
        if (otherCountry) {
          const myPower = calculateMilitaryPower(country.military.units, otherCountry.military.units, true);
          const theirPower = calculateMilitaryPower(otherCountry.military.units, country.military.units, false);
          if (myPower > theirPower * 1.5) {
            newState = processAction(newState, { type: 'DECLARE_WAR', attackerId: countryId, defenderId: otherId });
            break;
          }
        }
      }
    }
  }

  return newState;
}
