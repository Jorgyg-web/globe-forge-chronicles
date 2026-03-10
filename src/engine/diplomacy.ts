import {
  Alliance,
  CountryId,
  GameEvent,
  GameState,
  TradeAgreement,
  War,
} from '@/types/game';

const RELATION_MIN = -100;
const RELATION_MAX = 100;
const ALLIANCE_MIN_RELATION: Record<Alliance['type'], number> = {
  military: 40,
  economic: 25,
  both: 55,
};

function clampRelation(value: number): number {
  return Math.max(RELATION_MIN, Math.min(RELATION_MAX, Math.round(value)));
}

function allocateEntityId<T extends GameState>(state: T, prefix: string): [string, T] {
  return [
    `${prefix}_${state.nextEntityId.toString(36)}`,
    { ...state, nextEntityId: state.nextEntityId + 1 } as T,
  ];
}

function updateCountryRelationMap(state: GameState, countryId: CountryId, otherId: CountryId, value: number): GameState {
  const country = state.countries[countryId];
  if (!country) return state;

  return {
    ...state,
    countries: {
      ...state.countries,
      [countryId]: {
        ...country,
        diplomacy: {
          ...country.diplomacy,
          relations: {
            ...country.diplomacy.relations,
            [otherId]: clampRelation(value),
          },
        },
      },
    },
  };
}

export function getRelation(state: GameState, fromId: CountryId, toId: CountryId): number {
  return state.countries[fromId]?.diplomacy.relations[toId] ?? 0;
}

export function setRelationPair(state: GameState, a: CountryId, b: CountryId, value: number): GameState {
  const clamped = clampRelation(value);
  let nextState = updateCountryRelationMap(state, a, b, clamped);
  nextState = updateCountryRelationMap(nextState, b, a, clamped);
  return nextState;
}

export function changeRelationPair(state: GameState, a: CountryId, b: CountryId, delta: number): GameState {
  const nextValue = getRelation(state, a, b) + delta;
  return setRelationPair(state, a, b, nextValue);
}

export function countriesAtWar(state: GameState, a: CountryId, b: CountryId): boolean {
  return state.wars.some(war => war.active && (
    (war.attackers.includes(a) && war.defenders.includes(b)) ||
    (war.attackers.includes(b) && war.defenders.includes(a))
  ));
}

export function countriesAllied(state: GameState, a: CountryId, b: CountryId): boolean {
  return state.alliances.some(alliance => alliance.members.includes(a) && alliance.members.includes(b));
}

export function countriesTrading(state: GameState, a: CountryId, b: CountryId): boolean {
  return state.tradeAgreements.some(trade => trade.countries.includes(a) && trade.countries.includes(b));
}

export function hasEmbargo(state: GameState, countryId: CountryId, targetId: CountryId): boolean {
  return state.countries[countryId]?.diplomacy.embargoes.includes(targetId) ?? false;
}

function appendEvent(state: GameState, event: Omit<GameEvent, 'id'>): GameState {
  let nextState = state;
  let eventId: string;
  [eventId, nextState] = allocateEntityId(nextState, 'evt');
  return {
    ...nextState,
    events: [...nextState.events, { ...event, id: eventId }],
  };
}

function normalizeAllianceMembers(fromId: CountryId, toId: CountryId): [CountryId, CountryId] {
  return fromId < toId ? [fromId, toId] : [toId, fromId];
}

function normalizeTradeCountries(fromId: CountryId, toId: CountryId): [CountryId, CountryId] {
  return fromId < toId ? [fromId, toId] : [toId, fromId];
}

export function proposeAlliance(state: GameState, fromId: CountryId, toId: CountryId, allianceType: Alliance['type']): GameState {
  if (!state.countries[fromId] || !state.countries[toId] || fromId === toId) return state;
  if (countriesAtWar(state, fromId, toId) || countriesAllied(state, fromId, toId)) return state;
  if (getRelation(state, fromId, toId) < ALLIANCE_MIN_RELATION[allianceType]) return state;

  let nextState = state;
  let allianceId: string;
  [allianceId, nextState] = allocateEntityId(nextState, 'alliance');

  const [memberA, memberB] = normalizeAllianceMembers(fromId, toId);
  const alliance: Alliance = {
    id: allianceId,
    name: `${state.countries[memberA].name}-${state.countries[memberB].name}`,
    members: [memberA, memberB],
    type: allianceType,
  };

  nextState = {
    ...nextState,
    alliances: [...nextState.alliances, alliance],
  };
  nextState = changeRelationPair(nextState, fromId, toId, allianceType === 'both' ? 12 : 8);

  return appendEvent(nextState, {
    turn: state.turn,
    type: 'diplomacy',
    title: 'Alliance Formed',
    description: `${state.countries[fromId].name} and ${state.countries[toId].name} formed a ${allianceType} alliance`,
    countryId: fromId,
  });
}

export function proposeTrade(state: GameState, fromId: CountryId, toId: CountryId, value: number): GameState {
  if (!state.countries[fromId] || !state.countries[toId] || fromId === toId) return state;
  if (countriesAtWar(state, fromId, toId) || countriesTrading(state, fromId, toId)) return state;
  if (hasEmbargo(state, fromId, toId) || hasEmbargo(state, toId, fromId)) return state;
  if (getRelation(state, fromId, toId) < -10) return state;

  let nextState = state;
  let tradeId: string;
  [tradeId, nextState] = allocateEntityId(nextState, 'trade');
  const countries = normalizeTradeCountries(fromId, toId);
  const trade: TradeAgreement = {
    id: tradeId,
    countries,
    value: Math.max(100, Math.round(value)),
    type: 'bilateral',
  };

  nextState = {
    ...nextState,
    tradeAgreements: [...nextState.tradeAgreements, trade],
  };
  nextState = changeRelationPair(nextState, fromId, toId, 6);

  return appendEvent(nextState, {
    turn: state.turn,
    type: 'diplomacy',
    title: 'Trade Agreement Signed',
    description: `${state.countries[fromId].name} and ${state.countries[toId].name} signed a trade agreement`,
    countryId: fromId,
  });
}

export function setEmbargoState(state: GameState, countryId: CountryId, targetId: CountryId, add: boolean): GameState {
  const country = state.countries[countryId];
  const target = state.countries[targetId];
  if (!country || !target || countryId === targetId) return state;

  const embargoes = add
    ? Array.from(new Set([...country.diplomacy.embargoes, targetId]))
    : country.diplomacy.embargoes.filter(id => id !== targetId);

  let nextState: GameState = {
    ...state,
    countries: {
      ...state.countries,
      [countryId]: {
        ...country,
        diplomacy: {
          ...country.diplomacy,
          embargoes,
        },
      },
    },
  };

  nextState = changeRelationPair(nextState, countryId, targetId, add ? -25 : 10);

  return appendEvent(nextState, {
    turn: state.turn,
    type: 'diplomacy',
    title: add ? 'Embargo Imposed' : 'Embargo Lifted',
    description: add
      ? `${country.name} imposed an embargo on ${target.name}`
      : `${country.name} lifted its embargo on ${target.name}`,
    countryId,
  });
}

export function offerPeace(state: GameState, fromId: CountryId, toId: CountryId): GameState {
  if (!countriesAtWar(state, fromId, toId)) return state;

  const wars: War[] = state.wars.map(war => {
    if (!war.active) return war;
    const involves = (war.attackers.includes(fromId) && war.defenders.includes(toId))
      || (war.attackers.includes(toId) && war.defenders.includes(fromId));
    return involves ? { ...war, active: false } : war;
  });

  let nextState: GameState = {
    ...state,
    wars,
  };
  nextState = setRelationPair(nextState, fromId, toId, Math.max(-10, getRelation(nextState, fromId, toId)));

  return appendEvent(nextState, {
    turn: state.turn,
    type: 'diplomacy',
    title: 'Peace Treaty',
    description: `${state.countries[fromId].name} and ${state.countries[toId].name} signed a peace treaty`,
    countryId: fromId,
  });
}

function adjustRelationToward(state: GameState, a: CountryId, b: CountryId, target: number, step: number): GameState {
  const current = getRelation(state, a, b);
  if (current === target) return state;
  const delta = Math.min(Math.abs(target - current), step) * Math.sign(target - current);
  return changeRelationPair(state, a, b, delta);
}

function pairKey(a: CountryId, b: CountryId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function processDiplomacyTurn(state: GameState): GameState {
  let nextState = state;
  const processedPairs = new Set<string>();

  for (const war of nextState.wars) {
    if (!war.active) continue;
    for (const attacker of war.attackers) {
      for (const defender of war.defenders) {
        const key = pairKey(attacker, defender);
        if (processedPairs.has(key)) continue;
        processedPairs.add(key);
        nextState = adjustRelationToward(nextState, attacker, defender, -100, 2);
      }
    }
  }

  for (const alliance of nextState.alliances) {
    for (let i = 0; i < alliance.members.length; i++) {
      for (let j = i + 1; j < alliance.members.length; j++) {
        const a = alliance.members[i];
        const b = alliance.members[j];
        const key = pairKey(a, b);
        if (processedPairs.has(key)) continue;
        processedPairs.add(key);
        const target = alliance.type === 'both' ? 90 : alliance.type === 'military' ? 75 : 70;
        nextState = adjustRelationToward(nextState, a, b, target, 1);
      }
    }
  }

  for (const trade of nextState.tradeAgreements) {
    const [a, b] = trade.countries;
    const key = pairKey(a, b);
    if (!processedPairs.has(key)) {
      processedPairs.add(key);
      nextState = adjustRelationToward(nextState, a, b, 55, 1);
    }
  }

  for (const country of Object.values(nextState.countries)) {
    for (const targetId of country.diplomacy.embargoes) {
      const key = pairKey(country.id, targetId);
      if (processedPairs.has(key)) continue;
      processedPairs.add(key);
      nextState = adjustRelationToward(nextState, country.id, targetId, -55, 2);
    }
  }

  const remainingTrades = nextState.tradeAgreements.filter(trade => {
    const [a, b] = trade.countries;
    return !countriesAtWar(nextState, a, b) && !hasEmbargo(nextState, a, b) && !hasEmbargo(nextState, b, a);
  });

  if (remainingTrades.length !== nextState.tradeAgreements.length) {
    nextState = { ...nextState, tradeAgreements: remainingTrades };
  }

  return nextState;
}
