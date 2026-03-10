import { describe, expect, it } from 'vitest';
import { processAction } from './GameEngine';
import { GameState, Province, ProvinceId } from '@/types/game';

function makeProvince(id: ProvinceId, countryId: string): Province {
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
    terrain: 'plains',
    isCoastal: false,
    development: 0,
    adjacentProvinces: [],
    geometry: '',
  };
}

function createDiplomacyState(): GameState {
  return {
    turn: 1,
    year: 2026,
    month: 1,
    rngSeed: 123,
    nextEntityId: 1,
    countries: {
      aaa: {
        id: 'aaa',
        name: 'Alpha',
        code: 'AAA',
        continent: 'test',
        isPlayerControlled: true,
        resources: { food: 1000, steel: 1000, oil: 1000, rareMetals: 1000, manpower: 1000 },
        resourceIncome: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
        population: 1000000,
        stability: 80,
        approval: 75,
        color: '#f00',
        diplomacy: { relations: { bbb: 60, ccc: -20 }, embargoes: [] },
        government: { type: 'democracy', corruption: 10, bureaucracyEfficiency: 80, policies: [] },
        technology: { researched: [], activeResearch: [] },
        researchSlots: 1,
        militaryMorale: 80,
      },
      bbb: {
        id: 'bbb',
        name: 'Beta',
        code: 'BBB',
        continent: 'test',
        isPlayerControlled: false,
        resources: { food: 1000, steel: 1000, oil: 1000, rareMetals: 1000, manpower: 1000 },
        resourceIncome: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
        population: 1000000,
        stability: 80,
        approval: 75,
        color: '#0f0',
        diplomacy: { relations: { aaa: 60, ccc: 0 }, embargoes: [] },
        government: { type: 'democracy', corruption: 10, bureaucracyEfficiency: 80, policies: [] },
        technology: { researched: [], activeResearch: [] },
        researchSlots: 1,
        militaryMorale: 80,
      },
      ccc: {
        id: 'ccc',
        name: 'Gamma',
        code: 'CCC',
        continent: 'test',
        isPlayerControlled: false,
        resources: { food: 1000, steel: 1000, oil: 1000, rareMetals: 1000, manpower: 1000 },
        resourceIncome: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
        population: 1000000,
        stability: 80,
        approval: 75,
        color: '#00f',
        diplomacy: { relations: { aaa: -20, bbb: 0 }, embargoes: [] },
        government: { type: 'authoritarian', corruption: 10, bureaucracyEfficiency: 80, policies: [] },
        technology: { researched: [], activeResearch: [] },
        researchSlots: 1,
        militaryMorale: 80,
      },
    },
    provinces: {
      pa: makeProvince('pa', 'aaa'),
      pb: makeProvince('pb', 'bbb'),
      pc: makeProvince('pc', 'ccc'),
    },
    armies: {},
    wars: [],
    alliances: [],
    tradeAgreements: [],
    playerCountryId: 'aaa',
    events: [],
    speed: 'normal',
    paused: true,
    constructionQueue: [],
    productionQueue: [],
    activeBattles: [],
  };
}

describe('GameEngine diplomacy integration', () => {
  it('changes relations symmetrically and clamps them', () => {
    const state = createDiplomacyState();
    const next = processAction(state, { type: 'CHANGE_RELATIONS', fromId: 'aaa', toId: 'bbb', amount: 100 });

    expect(next.countries.aaa.diplomacy.relations.bbb).toBe(100);
    expect(next.countries.bbb.diplomacy.relations.aaa).toBe(100);
  });

  it('creates alliances and trade agreements through processAction', () => {
    let state = createDiplomacyState();
    state = processAction(state, { type: 'PROPOSE_ALLIANCE', fromId: 'aaa', toId: 'bbb', allianceType: 'military' });
    state = processAction(state, { type: 'PROPOSE_TRADE', fromId: 'aaa', toId: 'bbb', value: 500 });

    expect(state.alliances).toHaveLength(1);
    expect(state.tradeAgreements).toHaveLength(1);
    expect(state.events.some(event => event.type === 'diplomacy')).toBe(true);
  });

  it('applies deterministic diplomacy drift on turn processing', () => {
    let state = createDiplomacyState();
    state = processAction(state, { type: 'PROPOSE_ALLIANCE', fromId: 'aaa', toId: 'bbb', allianceType: 'military' });
    state = processAction(state, { type: 'PROPOSE_TRADE', fromId: 'bbb', toId: 'ccc', value: 400 });

    const next = processAction(state, { type: 'NEXT_TURN' });

    expect(next.countries.aaa.diplomacy.relations.bbb).toBeGreaterThan(state.countries.aaa.diplomacy.relations.bbb);
    expect(next.countries.bbb.diplomacy.relations.ccc).toBeGreaterThan(state.countries.bbb.diplomacy.relations.ccc);
    expect(next).toEqual(processAction(state, { type: 'NEXT_TURN' }));
  });

  it('removes trade agreements when war starts between partners', () => {
    let state = createDiplomacyState();
    state = processAction(state, { type: 'PROPOSE_TRADE', fromId: 'aaa', toId: 'bbb', value: 500 });
    state = processAction(state, { type: 'DECLARE_WAR', attackerId: 'aaa', defenderId: 'bbb' });

    expect(state.tradeAgreements).toHaveLength(0);
    expect(state.countries.aaa.diplomacy.relations.bbb).toBe(-100);
  });
});
