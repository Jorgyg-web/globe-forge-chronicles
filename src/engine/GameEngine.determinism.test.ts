import { describe, expect, it } from 'vitest';
import { processAction } from './GameEngine';
import { GameState, Province, ProvinceId } from '@/types/game';

function makeProvince(id: ProvinceId, countryId: string, terrain: Province['terrain'], adjacentProvinces: ProvinceId[]): Province {
  return {
    id,
    countryId,
    originalCountryId: countryId,
    name: id,
    population: 1000,
    morale: 100,
    stability: 100,
    corruption: 0,
    resourceProduction: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
    buildings: [],
    terrain,
    isCoastal: false,
    development: 0,
    adjacentProvinces,
    geometry: '',
  };
}

function createDeterministicBattleState(): GameState {
  return {
    turn: 1,
    year: 2026,
    month: 1,
    rngSeed: 987654321,
    nextEntityId: 1,
    countries: {
      atk: {
        id: 'atk',
        name: 'Attacker',
        code: 'ATK',
        continent: 'test',
        isPlayerControlled: true,
        resources: { food: 500, steel: 500, oil: 500, rareMetals: 500, manpower: 500 },
        resourceIncome: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
        population: 100000,
        stability: 100,
        approval: 100,
        color: '#f00',
        diplomacy: { relations: { def: -100 }, embargoes: [] },
        government: { type: 'democracy', corruption: 0, bureaucracyEfficiency: 100, policies: [] },
        technology: { researched: [], activeResearch: [] },
        researchSlots: 1,
        militaryMorale: 100,
      },
      def: {
        id: 'def',
        name: 'Defender',
        code: 'DEF',
        continent: 'test',
        isPlayerControlled: false,
        resources: { food: 500, steel: 500, oil: 500, rareMetals: 500, manpower: 500 },
        resourceIncome: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
        population: 100000,
        stability: 100,
        approval: 100,
        color: '#00f',
        diplomacy: { relations: { atk: -100 }, embargoes: [] },
        government: { type: 'democracy', corruption: 0, bureaucracyEfficiency: 100, policies: [] },
        technology: { researched: [], activeResearch: [] },
        researchSlots: 1,
        militaryMorale: 100,
      },
    },
    provinces: {
      front: makeProvince('front', 'def', 'plains', []),
    },
    armies: {
      army_atk: {
        id: 'army_atk',
        countryId: 'atk',
        provinceId: 'front',
        targetProvinceId: null,
        path: [],
        movementProgress: 0,
        units: [{ type: 'infantry', count: 40, health: 100, level: 1 }],
        name: 'Attackers',
        morale: 100,
      },
      army_def: {
        id: 'army_def',
        countryId: 'def',
        provinceId: 'front',
        targetProvinceId: null,
        path: [],
        movementProgress: 0,
        units: [{ type: 'infantry', count: 40, health: 100, level: 1 }],
        name: 'Defenders',
        morale: 100,
      },
    },
    wars: [{ id: 'war_0', attackers: ['atk'], defenders: ['def'], startTurn: 0, battles: [], active: true }],
    alliances: [],
    tradeAgreements: [],
    playerCountryId: 'atk',
    events: [],
    speed: 'normal',
    paused: true,
    constructionQueue: [],
    productionQueue: [],
    activeBattles: [],
  };
}

describe('GameEngine deterministic simulation', () => {
  it('produces identical turn results for identical seeded states', () => {
    const stateA = createDeterministicBattleState();
    const stateB = createDeterministicBattleState();

    const nextA = processAction(stateA, { type: 'NEXT_TURN' });
    const nextB = processAction(stateB, { type: 'NEXT_TURN' });

    expect(nextA).toEqual(nextB);
    expect(nextA.rngSeed).not.toBe(stateA.rngSeed);
  });
});
