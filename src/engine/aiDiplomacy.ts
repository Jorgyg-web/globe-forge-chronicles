import { nextRandom } from '@/lib/deterministicRandom';
import { CountryId, GameAction, GameState, Province } from '@/types/game';
import { countriesAllied, countriesAtWar, getRelation, hasEmbargo } from './diplomacy';

interface AIDiplomacyDecision {
  state: GameState;
  actions: GameAction[];
}

interface CountryTargetScore {
  id: CountryId;
  score: number;
}

function takeRandom<T extends GameState>(state: T): [number, T] {
  const { value, seed } = nextRandom(state.rngSeed);
  return [value, { ...state, rngSeed: seed } as T];
}

function getCountryProvinces(state: GameState, countryId: CountryId): Province[] {
  return Object.values(state.provinces).filter(province => province.countryId === countryId);
}

function getNeighborCountries(state: GameState, countryId: CountryId): CountryId[] {
  const neighbors = new Set<CountryId>();
  for (const province of Object.values(state.provinces)) {
    if (province.countryId !== countryId) continue;
    for (const adjacentId of province.adjacentProvinces) {
      const adjacent = state.provinces[adjacentId];
      if (adjacent && adjacent.countryId !== countryId) {
        neighbors.add(adjacent.countryId);
      }
    }
  }
  return [...neighbors];
}

function getMilitaryStrength(state: GameState, countryId: CountryId): number {
  return Object.values(state.armies)
    .filter(army => army.countryId === countryId)
    .reduce((sum, army) => sum + army.units.reduce((unitSum, unit) => unitSum + unit.count * (unit.level + 1), 0), 0);
}

function averageRelation(state: GameState, countryId: CountryId): number {
  const entries = Object.values(state.countries[countryId]?.diplomacy.relations ?? {});
  if (entries.length === 0) return 0;
  return entries.reduce((sum, value) => sum + value, 0) / entries.length;
}

function scoreWarTarget(state: GameState, countryId: CountryId, targetId: CountryId): number {
  if (!state.countries[targetId]) return Number.NEGATIVE_INFINITY;
  if (countriesAtWar(state, countryId, targetId) || countriesAllied(state, countryId, targetId)) return Number.NEGATIVE_INFINITY;
  if (hasEmbargo(state, targetId, countryId) && getRelation(state, countryId, targetId) > -10) return Number.NEGATIVE_INFINITY;

  const relation = getRelation(state, countryId, targetId);
  const myStrength = getMilitaryStrength(state, countryId);
  const targetStrength = getMilitaryStrength(state, targetId);
  const myProvinces = getCountryProvinces(state, countryId).length;
  const targetProvinces = getCountryProvinces(state, targetId).length;
  const stability = state.countries[countryId].stability;
  const approval = state.countries[countryId].approval;

  if (stability < 40 || approval < 35) return Number.NEGATIVE_INFINITY;
  if (relation > -20) return Number.NEGATIVE_INFINITY;

  const strengthRatio = myStrength / Math.max(1, targetStrength);
  const expansionPressure = Math.max(0, myProvinces - targetProvinces) * 0.35;
  return (Math.abs(relation) * 0.8) + (strengthRatio * 30) + expansionPressure + (stability - 50) * 0.3;
}

function scoreAllianceTarget(state: GameState, countryId: CountryId, targetId: CountryId): number {
  if (!state.countries[targetId]) return Number.NEGATIVE_INFINITY;
  if (countriesAtWar(state, countryId, targetId) || countriesAllied(state, countryId, targetId)) return Number.NEGATIVE_INFINITY;
  if (hasEmbargo(state, countryId, targetId) || hasEmbargo(state, targetId, countryId)) return Number.NEGATIVE_INFINITY;

  const relation = getRelation(state, countryId, targetId);
  if (relation < 45) return Number.NEGATIVE_INFINITY;

  const myStrength = getMilitaryStrength(state, countryId);
  const targetStrength = getMilitaryStrength(state, targetId);
  const sharedEnemies = state.wars.filter(war => war.active && (
    (war.attackers.includes(countryId) || war.defenders.includes(countryId)) &&
    (war.attackers.includes(targetId) || war.defenders.includes(targetId))
  )).length;

  const strengthBalance = 20 - Math.min(20, Math.abs(myStrength - targetStrength) / Math.max(1, Math.max(myStrength, targetStrength)) * 20);
  return relation + sharedEnemies * 20 + strengthBalance;
}

function scoreImproveRelationsTarget(state: GameState, countryId: CountryId, targetId: CountryId): number {
  if (!state.countries[targetId]) return Number.NEGATIVE_INFINITY;
  if (countriesAtWar(state, countryId, targetId)) return Number.NEGATIVE_INFINITY;

  const relation = getRelation(state, countryId, targetId);
  if (relation >= 75) return Number.NEGATIVE_INFINITY;

  const sameContinent = state.countries[countryId].continent === state.countries[targetId].continent ? 10 : 0;
  const neighborBonus = getNeighborCountries(state, countryId).includes(targetId) ? 15 : 0;
  const allianceBonus = countriesAllied(state, countryId, targetId) ? 10 : 0;
  const embargoPenalty = hasEmbargo(state, countryId, targetId) || hasEmbargo(state, targetId, countryId) ? 30 : 0;

  return (60 - Math.abs(relation - 20)) + sameContinent + neighborBonus + allianceBonus - embargoPenalty;
}

function chooseBest(scored: CountryTargetScore[]): CountryTargetScore | null {
  const valid = scored.filter(candidate => Number.isFinite(candidate.score))
    .sort((a, b) => b.score - a.score);
  return valid[0] ?? null;
}

export function decideAIDiplomacy(state: GameState, countryId: CountryId): AIDiplomacyDecision {
  const country = state.countries[countryId];
  if (!country || country.isPlayerControlled) return { state, actions: [] };

  let nextState = state;
  const actions: GameAction[] = [];
  const neighbors = getNeighborCountries(nextState, countryId);
  const allOthers = Object.keys(nextState.countries).filter(id => id !== countryId);
  const atWar = nextState.wars.some(war => war.active && (war.attackers.includes(countryId) || war.defenders.includes(countryId)));

  if (!atWar && neighbors.length > 0 && nextState.turn % 3 === 0) {
    const warTarget = chooseBest(neighbors.map(id => ({ id, score: scoreWarTarget(nextState, countryId, id) })));
    if (warTarget && warTarget.score > 35) {
      let roll: number;
      [roll, nextState] = takeRandom(nextState);
      const warChance = Math.min(0.75, 0.15 + warTarget.score / 160);
      if (roll < warChance) {
        actions.push({ type: 'DECLARE_WAR', attackerId: countryId, defenderId: warTarget.id });
      }
    }
  }

  if (!atWar && nextState.turn % 4 === 0) {
    const allianceTarget = chooseBest(allOthers.map(id => ({ id, score: scoreAllianceTarget(nextState, countryId, id) })));
    if (allianceTarget && allianceTarget.score > 60) {
      let roll: number;
      [roll, nextState] = takeRandom(nextState);
      const allianceChance = Math.min(0.8, 0.2 + allianceTarget.score / 180);
      if (roll < allianceChance) {
        actions.push({ type: 'PROPOSE_ALLIANCE', fromId: countryId, toId: allianceTarget.id, allianceType: atWar ? 'military' : 'both' });
      }
    }
  }

  if (nextState.turn % 2 === 0) {
    const diplomacyPool = neighbors.length > 0 ? neighbors : allOthers;
    const improveTarget = chooseBest(diplomacyPool.map(id => ({ id, score: scoreImproveRelationsTarget(nextState, countryId, id) })));
    if (improveTarget && improveTarget.score > 18) {
      let roll: number;
      [roll, nextState] = takeRandom(nextState);
      const baseAmount = averageRelation(nextState, countryId) < 0 ? 8 : 5;
      const improveChance = Math.min(0.9, 0.35 + improveTarget.score / 140);
      if (roll < improveChance) {
        actions.push({ type: 'CHANGE_RELATIONS', fromId: countryId, toId: improveTarget.id, amount: baseAmount });
      }
    }
  }

  return { state: nextState, actions };
}
