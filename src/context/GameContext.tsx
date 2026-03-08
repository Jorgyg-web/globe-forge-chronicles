import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { GameState, GameAction, CountryId, ProvinceId } from '@/types/game';
import { processAction } from '@/engine/GameEngine';
import { INITIAL_COUNTRIES, initializeDiplomacy } from '@/data/countries';
import { INITIAL_PROVINCES } from '@/data/provinces';

interface GameContextType {
  state: GameState;
  dispatch: (action: GameAction) => void;
  selectedCountryId: CountryId | null;
  setSelectedCountryId: (id: CountryId | null) => void;
  selectedProvinceId: ProvinceId | null;
  setSelectedProvinceId: (id: ProvinceId | null) => void;
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
}

export type PanelType = 'overview' | 'economy' | 'military' | 'diplomacy' | 'technology' | 'infrastructure' | 'province';

const GameContext = createContext<GameContextType | null>(null);

function createInitialState(): GameState {
  const countries = initializeDiplomacy(INITIAL_COUNTRIES);
  const countryMap: Record<CountryId, typeof countries[0]> = {};
  countries.forEach(c => {
    countryMap[c.id] = c;
  });
  countryMap['usa'] = { ...countryMap['usa'], isPlayerControlled: true };

  const provinceMap: Record<ProvinceId, typeof INITIAL_PROVINCES[0]> = {};
  INITIAL_PROVINCES.forEach(p => {
    provinceMap[p.id] = p;
  });

  return {
    turn: 0,
    year: 2025,
    month: 1,
    countries: countryMap,
    provinces: provinceMap,
    wars: [],
    alliances: [],
    tradeAgreements: [],
    playerCountryId: 'usa',
    events: [],
    speed: 'normal',
    paused: true,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  return processAction(state, action);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const [selectedCountryId, setSelectedCountryId] = React.useState<CountryId | null>('usa');
  const [selectedProvinceId, setSelectedProvinceId] = React.useState<ProvinceId | null>(null);
  const [activePanel, setActivePanel] = React.useState<PanelType>('overview');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const speedMs = state.speed === 'slow' ? 3000 : state.speed === 'normal' ? 1500 : 700;

  useEffect(() => {
    if (!state.paused) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'NEXT_TURN' });
      }, speedMs);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.paused, speedMs]);

  const wrappedDispatch = useCallback((action: GameAction) => {
    dispatch(action);
  }, []);

  return (
    <GameContext.Provider value={{
      state, dispatch: wrappedDispatch,
      selectedCountryId, setSelectedCountryId,
      selectedProvinceId, setSelectedProvinceId,
      activePanel, setActivePanel,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
