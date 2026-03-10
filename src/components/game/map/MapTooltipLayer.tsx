import React from 'react';
import { useGame } from '@/context/GameContext';
import { useMapContext } from './MapContext';
import { getProvincesForCountry } from '@/data/provinces';
import { CountryTooltipContent, ProvinceTooltipContent } from '@/components/game/tooltips/GameTooltipContents';
import { StrategyTooltipSurface } from '@/components/game/tooltips/StrategyTooltip';

const MapTooltipLayer: React.FC<{ isPanning: boolean }> = ({ isPanning }) => {
  const { state } = useGame();
  const { hoveredCountry, hoveredProvince, isZooming, moveMode, moveTargets, mousePos, containerRef } = useMapContext();

  const hoveredProvData = hoveredProvince ? state.provinces[hoveredProvince] : null;
  const hoveredData = hoveredCountry && !hoveredProvData ? state.countries[hoveredCountry] : null;

  if (isPanning || isZooming) return null;

  const left = mousePos.x - (containerRef.current?.getBoundingClientRect().left ?? 0) + 16;
  const top = mousePos.y - (containerRef.current?.getBoundingClientRect().top ?? 0) - 10;

  if (hoveredProvData) {
    const armiesHere = Object.values(state.armies).filter(army => army.provinceId === hoveredProvData.id).length;

    return (
      <StrategyTooltipSurface className="map-tooltip absolute z-20 animate-fade-up" style={{ left: `${left}px`, top: `${top}px` }}>
        <ProvinceTooltipContent
          province={hoveredProvData}
          country={state.countries[hoveredProvData.countryId]}
          armyCount={armiesHere}
          moveTarget={moveMode && moveTargets.has(hoveredProvData.id)}
        />
      </StrategyTooltipSurface>
    );
  }

  if (hoveredData) {
    const armyCount = Object.values(state.armies).filter(army => army.countryId === hoveredData.id).length;
    const tradeCount = state.tradeAgreements.filter(trade => trade.countries.includes(hoveredData.id)).length;
    const allianceCount = state.alliances.filter(alliance => alliance.members.includes(hoveredData.id)).length;
    const warCount = state.wars.filter(war => war.active && (war.attackers.includes(hoveredData.id) || war.defenders.includes(hoveredData.id))).length;

    return (
      <StrategyTooltipSurface className="map-tooltip absolute z-20 animate-fade-up" style={{ left: `${left}px`, top: `${top}px` }}>
        <CountryTooltipContent
          country={hoveredData}
          provinceCount={getProvincesForCountry(state.provinces, hoveredData.id).length}
          armyCount={armyCount}
          allianceCount={allianceCount}
          tradeCount={tradeCount}
          warCount={warCount}
        />
      </StrategyTooltipSurface>
    );
  }

  return null;
};

export default React.memo(MapTooltipLayer);
