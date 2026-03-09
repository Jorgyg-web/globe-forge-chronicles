import { describe, expect, it } from 'vitest';
import { findProvincePath } from './pathfinding';
import { processAction } from './GameEngine';
import { GameState, Province, ProvinceId } from '@/types/game';

function makeProvince(id: ProvinceId, terrain: Province['terrain'], adjacentProvinces: ProvinceId[]): Province {
  return {
    id,
    countryId: 'c1',
    originalCountryId: 'c1',
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

function createState(): GameState {
  return {
    turn: 1,
    year: 2026,
    month: 1,
    rngSeed: 12345,
    nextEntityId: 1,
    countries: {
      c1: {
        id: 'c1',
        name: 'Country 1',
        code: 'C1',
        continent: 'test',
        isPlayerControlled: true,
        resources: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
        resourceIncome: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
        population: 100000,
        stability: 100,
        approval: 100,
        color: '#fff',
        diplomacy: { relations: {}, embargoes: [] },
        government: { type: 'democracy', corruption: 0, bureaucracyEfficiency: 100, policies: [] },
        technology: { researched: [], activeResearch: [] },
        researchSlots: 1,
        militaryMorale: 100,
      },
    },
    provinces: {
      A: makeProvince('A', 'plains', ['B', 'C']),
      B: makeProvince('B', 'mountain', ['A', 'D']),
      C: makeProvince('C', 'urban', ['A', 'D']),
      D: makeProvince('D', 'plains', ['B', 'C']),
    },
    armies: {
      army1: {
        id: 'army1',
        countryId: 'c1',
        provinceId: 'A',
        targetProvinceId: null,
        path: [],
        movementProgress: 0,
        units: [{ type: 'infantry', count: 10, health: 100, level: 1 }],
        name: 'Test Army',
        morale: 100,
      },
    },
    wars: [],
    alliances: [],
    tradeAgreements: [],
    playerCountryId: 'c1',
    events: [],
    speed: 'normal',
    paused: true,
    constructionQueue: [],
    productionQueue: [],
    activeBattles: [],
  };
}

describe('province pathfinding', () => {
  it('finds lowest terrain-cost path using adjacency graph', () => {
    const provinces: Record<ProvinceId, Province> = {
      A: makeProvince('A', 'plains', ['B', 'C']),
      B: makeProvince('B', 'mountain', ['A', 'D']),
      C: makeProvince('C', 'urban', ['A', 'D']),
      D: makeProvince('D', 'plains', ['B', 'C']),
    };

    const path = findProvincePath(provinces, 'A', 'D');
    expect(path).toEqual(['C', 'D']);
  });

  it('stores route path and advances target as army reaches each province', () => {
    let state = createState();

    state = processAction(state, { type: 'MOVE_ARMY', armyId: 'army1', targetProvinceId: 'D' });
    expect(state.armies.army1.path).toEqual(['C', 'D']);
    expect(state.armies.army1.targetProvinceId).toBe('C');

    state = processAction(state, { type: 'UPDATE_ARMY_MOVEMENT', deltaTurns: 100 });
    expect(state.armies.army1.provinceId).toBe('C');
    expect(state.armies.army1.path).toEqual(['D']);
    expect(state.armies.army1.targetProvinceId).toBe('D');
    expect(state.armies.army1.movementProgress).toBe(0);

    state = processAction(state, { type: 'UPDATE_ARMY_MOVEMENT', deltaTurns: 100 });
    expect(state.armies.army1.provinceId).toBe('D');
    expect(state.armies.army1.path).toEqual([]);
    expect(state.armies.army1.targetProvinceId).toBeNull();
  });
});
