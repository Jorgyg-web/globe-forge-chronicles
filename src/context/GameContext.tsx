// Game state context and provider
import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { GameState, GameAction, CountryId, ProvinceId, ArmyId, BuildingType } from '@/types/game';
import { processAction } from '@/engine/GameEngine';
import { hashStringToSeed, randomIntFromKey } from '@/lib/deterministicRandom';
import { generateWorld, setCachedWorldData } from '@/map/worldGenerator';
import { ProvinceManager } from '@/map/ProvinceManager';

interface GameContextType {
  state: GameState;
  dispatch: (action: GameAction) => void;
  selectedCountryId: CountryId | null;
  setSelectedCountryId: (id: CountryId | null) => void;
  selectedProvinceId: ProvinceId | null;
  setSelectedProvinceId: (id: ProvinceId | null) => void;
  selectedArmyId: ArmyId | null;
  setSelectedArmyId: (id: ArmyId | null) => void;
  selectedBuilding: SelectedBuildingRef | null;
  setSelectedBuilding: (building: SelectedBuildingRef | null) => void;
  provincePanelTab: ProvincePanelTab;
  setProvincePanelTab: (tab: ProvincePanelTab) => void;
  selectedArmyIds: ArmyId[];
  toggleArmySelection: (id: ArmyId, shiftHeld?: boolean) => void;
  setSelectedArmyIds: (ids: ArmyId[]) => void;
  activePanel: PanelType;
  setActivePanel: (panel: PanelType) => void;
  worldLoading: boolean;
}

export interface SelectedBuildingRef {
  provinceId: ProvinceId;
  buildingType: BuildingType;
}

export type ProvincePanelTab = 'overview' | 'build' | 'recruit';

export type PanelType = 'overview' | 'economy' | 'military' | 'diplomacy' | 'technology' | 'province' | 'construction' | 'production' | 'info';

const GameContext = createContext<GameContextType | null>(null);

function createEmptyState(): GameState {
  return {
    turn: 0, year: 2025, month: 1,
    rngSeed: hashStringToSeed('globe-forge-chronicles:runtime'),
    nextEntityId: 1,
    countries: {}, provinces: {}, armies: {},
    wars: [], alliances: [], tradeAgreements: [],
    playerCountryId: 'usa',
    events: [], speed: 'normal', paused: true,
    constructionQueue: [], productionQueue: [], activeBattles: [],
  };
}

function initializeDiplomacy(countries: Record<CountryId, import('@/types/game').Country>): typeof countries {
  const ids = Object.keys(countries);
  const updated = { ...countries };
  for (const id of ids) {
    const relations: Record<string, number> = {};
    for (const otherId of ids) {
      if (otherId === id) continue;
      let base = randomIntFromKey(`relation:${id}:${otherId}`, -20, 39);
      // Preserve special relations for original 20 countries
      if ((id === 'usa' && otherId === 'gbr') || (id === 'gbr' && otherId === 'usa')) base = 80;
      if ((id === 'usa' && otherId === 'can') || (id === 'can' && otherId === 'usa')) base = 85;
      if ((id === 'usa' && otherId === 'rus') || (id === 'rus' && otherId === 'usa')) base = -30;
      if ((id === 'usa' && otherId === 'chn') || (id === 'chn' && otherId === 'usa')) base = -20;
      if ((id === 'irn' && otherId === 'isr') || (id === 'isr' && otherId === 'irn')) base = -80;
      if ((id === 'usa' && otherId === 'kor') || (id === 'kor' && otherId === 'usa')) base = 70;
      if ((id === 'usa' && otherId === 'jpn') || (id === 'jpn' && otherId === 'usa')) base = 75;
      relations[otherId] = Math.max(-100, Math.min(100, base));
    }
    updated[id] = { ...updated[id], diplomacy: { ...updated[id].diplomacy, relations } };
  }
  return updated;
}

function gameReducer(state: GameState, action: GameAction | { type: 'INIT_WORLD'; payload: GameState }): GameState {
  if (action.type === 'INIT_WORLD') return (action as any).payload;
  return processAction(state, action);
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, null, createEmptyState);
  const [worldLoading, setWorldLoading] = useState(true);
  const [selectedCountryId, setSelectedCountryId] = React.useState<CountryId | null>('usa');
  const [selectedProvinceId, setSelectedProvinceId] = React.useState<ProvinceId | null>(null);
  const [selectedArmyId, setSelectedArmyId] = React.useState<ArmyId | null>(null);
  const [selectedBuilding, setSelectedBuilding] = React.useState<SelectedBuildingRef | null>(null);
  const [provincePanelTab, setProvincePanelTab] = React.useState<ProvincePanelTab>('overview');
  const [selectedArmyIds, setSelectedArmyIds] = React.useState<ArmyId[]>([]);
  const [activePanel, setActivePanel] = React.useState<PanelType>('overview');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const movementFrameRef = useRef<number | null>(null);

  const toggleArmySelection = useCallback((id: ArmyId, shiftHeld = false) => {
    if (!shiftHeld) {
      setSelectedArmyIds([id]);
      setSelectedArmyId(id);
    } else {
      setSelectedArmyIds(prev => 
        prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
      );
      setSelectedArmyId(id);
    }
  }, []);

  // Load world data on mount
  useEffect(() => {
    let cancelled = false;
    generateWorld().then(worldData => {
      if (cancelled) return;
      setCachedWorldData(worldData);

      const countryMap: Record<CountryId, typeof worldData.countries[0]> = {};
      worldData.countries.forEach(c => { countryMap[c.id] = c; });
      if (countryMap['usa']) {
        countryMap['usa'] = { ...countryMap['usa'], isPlayerControlled: true };
      }

      // Initialize diplomacy (only for a manageable subset to avoid perf issues)
      // For 200+ countries, only set relations for neighbors + major powers
      const majorPowers = ['usa', 'chn', 'rus', 'gbr', 'fra', 'deu', 'jpn', 'ind', 'bra'];
      const countryIds = Object.keys(countryMap);
      for (const id of countryIds) {
        const relations: Record<string, number> = {};
        // Set relations with major powers and same-continent neighbors
        for (const otherId of countryIds) {
          if (otherId === id) continue;
          const isMajor = majorPowers.includes(id) || majorPowers.includes(otherId);
          const sameContinent = countryMap[id].continent === countryMap[otherId].continent;
          if (isMajor || sameContinent) {
            let base = randomIntFromKey(`relation:${id}:${otherId}`, -20, 39);
            if ((id === 'usa' && otherId === 'gbr') || (id === 'gbr' && otherId === 'usa')) base = 80;
            if ((id === 'usa' && otherId === 'can') || (id === 'can' && otherId === 'usa')) base = 85;
            if ((id === 'usa' && otherId === 'rus') || (id === 'rus' && otherId === 'usa')) base = -30;
            if ((id === 'usa' && otherId === 'chn') || (id === 'chn' && otherId === 'usa')) base = -20;
            if ((id === 'irn' && otherId === 'isr') || (id === 'isr' && otherId === 'irn')) base = -80;
            if ((id === 'usa' && otherId === 'kor') || (id === 'kor' && otherId === 'usa')) base = 70;
            if ((id === 'usa' && otherId === 'jpn') || (id === 'jpn' && otherId === 'usa')) base = 75;
            relations[otherId] = Math.max(-100, Math.min(100, base));
          }
        }
        countryMap[id] = {
          ...countryMap[id],
          diplomacy: { ...countryMap[id].diplomacy, relations },
        };
      }

      const provinceMap: Record<ProvinceId, typeof worldData.provinces[0]> = {};
      worldData.provinces.forEach(p => { provinceMap[p.id] = p; });

      dispatch({
        type: 'INIT_WORLD',
        payload: {
          turn: 0, year: 2025, month: 1,
          rngSeed: hashStringToSeed('globe-forge-chronicles:runtime'),
          nextEntityId: 1,
          countries: countryMap,
          provinces: provinceMap,
          armies: {},
          wars: [], alliances: [], tradeAgreements: [],
          playerCountryId: 'usa',
          events: [], speed: 'normal', paused: true,
          constructionQueue: [], productionQueue: [], activeBattles: [],
        },
      } as any);
      setWorldLoading(false);

      const buildProvinceMap = () => {
        if (cancelled) return;
        ProvinceManager.getInstance().buildFromProvinces(
          worldData.provinces.map(province => ({
            id: province.id,
            name: province.name,
            countryId: province.countryId,
            geometry: province.geometry,
          })),
        );
      };

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(buildProvinceMap);
      } else {
        window.setTimeout(buildProvinceMap, 0);
      }
    }).catch(err => {
      console.error('[GameProvider] Failed to load world data:', err);
      setWorldLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const speedMs = state.speed === 'slow' ? 3000 : state.speed === 'normal' ? 1500 : 700;

  useEffect(() => {
    if (!state.paused && !worldLoading) {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'NEXT_TURN' });
      }, speedMs);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.paused, speedMs, worldLoading]);

  useEffect(() => {
    if (state.paused || worldLoading) {
      if (movementFrameRef.current != null) {
        cancelAnimationFrame(movementFrameRef.current);
        movementFrameRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();

    const tick = (now: number) => {
      const elapsedMs = Math.max(0, Math.min(250, now - lastTime));
      lastTime = now;
      const deltaTurns = elapsedMs / speedMs;
      if (deltaTurns > 0) {
        dispatch({ type: 'UPDATE_ARMY_MOVEMENT', deltaTurns });
      }
      movementFrameRef.current = requestAnimationFrame(tick);
    };

    movementFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (movementFrameRef.current != null) {
        cancelAnimationFrame(movementFrameRef.current);
        movementFrameRef.current = null;
      }
    };
  }, [state.paused, speedMs, worldLoading]);

  const wrappedDispatch = useCallback((action: GameAction) => { dispatch(action); }, []);

  return (
    <GameContext.Provider value={{
      state, dispatch: wrappedDispatch,
      selectedCountryId, setSelectedCountryId,
      selectedProvinceId, setSelectedProvinceId,
      selectedArmyId, setSelectedArmyId,
      selectedBuilding, setSelectedBuilding,
      provincePanelTab, setProvincePanelTab,
      selectedArmyIds, toggleArmySelection, setSelectedArmyIds,
      activePanel, setActivePanel,
      worldLoading,
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
