import { describe, expect, it } from 'vitest';
import { processAction } from './GameEngine';
import { decideAIDiplomacy } from './aiDiplomacy';
import { Army, Country, GameState, Province, ProvinceId } from '@/types/game';

function makeCountry(id: string, relations: Record<string, number>, stability = 80): Country {
  return {
    id,
    name: id.toUpperCase(),
    code: id.toUpperCase(),
    continent: 'test',
    isPlayerControlled: false,
    resources: { food: 1000, steel: 1000, oil: 1000, rareMetals: 1000, manpower: 1000 },
    resourceIncome: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
    population: 1000000,
    stability,
    approval: 75,
    color: '#999',
    diplomacy: { relations, embargoes: [] },
    government: { type: 'democracy', corruption: 5, bureaucracyEfficiency: 80, policies: [] },
    technology: { researched: ['armor_1', 'armor_2'], activeResearch: [] },
    researchSlots: 1,
    militaryMorale: 80,
  };
}

function makeProvince(id: ProvinceId, countryId: string, adjacentProvinces: ProvinceId[]): Province {
  return {
    id,
    countryId,
    originalCountryId: countryId,
    name: id,
    population: 100000,
    morale: 100,
    stability: 100,
    corruption: 0,
    resourceProduction: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
    buildings: [],
    terrain: 'plains',
    isCoastal: false,
    development: 20,
    adjacentProvinces,
    geometry: '',
  };
}

function makeArmy(id: string, countryId: string, provinceId: string, count: number): Army {
  return {
    id,
    countryId,
    provinceId,
    targetProvinceId: null,
    path: [],
    movementProgress: 0,
    units: [{ type: 'infantry', count, health: 100, level: 1 }],
    name: id,
    morale: 80,
  };
}

function createAIState(): GameState {
  return {
    turn: 3,
    year: 2026,
    month: 1,
    rngSeed: 1,
    nextEntityId: 1,
    countries: {
      player: { ...makeCountry('player', { alpha: 0, beta: 0, gamma: 0 }), isPlayerControlled: true },
      alpha: makeCountry('alpha', { beta: 80, gamma: -70, player: 0 }),
      beta: makeCountry('beta', { alpha: 80, gamma: 10, player: 0 }),
      gamma: makeCountry('gamma', { alpha: -70, beta: 10, player: 0 }, 85),
    },
    provinces: {
      a1: makeProvince('a1', 'alpha', ['g1', 'b1']),
      b1: makeProvince('b1', 'beta', ['a1']),
      g1: makeProvince('g1', 'gamma', ['a1']),
      p1: makeProvince('p1', 'player', []),
    },
    armies: {
      aa: makeArmy('aa', 'alpha', 'a1', 30),
      ab: makeArmy('ab', 'alpha', 'a1', 30),
      bb: makeArmy('bb', 'beta', 'b1', 18),
      gg: makeArmy('gg', 'gamma', 'g1', 12),
    },
    wars: [],
    alliances: [],
    tradeAgreements: [],
    playerCountryId: 'player',
    events: [],
    speed: 'normal',
    paused: true,
    constructionQueue: [],
    productionQueue: [],
    activeBattles: [],
  };
}

describe('AI diplomacy decisions', () => {
  it('deterministically improves relations or forms alliances for friendly countries', () => {
    const state = createAIState();
    const nextA = processAction(state, { type: 'NEXT_TURN' });
    const nextB = processAction(createAIState(), { type: 'NEXT_TURN' });

    expect(nextA).toEqual(nextB);
    expect(nextA.alliances.length).toBeGreaterThanOrEqual(1);
    expect(nextA.countries.alpha.diplomacy.relations.beta).toBeGreaterThanOrEqual(state.countries.alpha.diplomacy.relations.beta);
  });

  it('can declare war against a weak hostile neighbor deterministically', () => {
    const state = createAIState();
    const decision = decideAIDiplomacy(state, 'alpha');
    expect(decision.actions).toContainEqual({ type: 'DECLARE_WAR', attackerId: 'alpha', defenderId: 'gamma' });

    const next = decision.actions.reduce((currentState, action) => processAction(currentState, action), decision.state);

    expect(next.wars.some(war => war.active && war.attackers.includes('alpha') && war.defenders.includes('gamma'))).toBe(true);
    expect(next.countries.alpha.diplomacy.relations.gamma).toBeLessThanOrEqual(-100);
  });
});
