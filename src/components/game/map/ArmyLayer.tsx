import React, { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { useMapContext } from './MapContext';
import { UNIT_STATS } from '@/data/unitStats';
import { Army } from '@/types/game';
import { COUNTRY_POSITIONS } from './mapConstants';

const ArmyLayer: React.FC = () => {
  const { state, selectedArmyId, setSelectedArmyId, setActivePanel } = useGame();
  const { showProvinces, provinceLayouts } = useMapContext();

  const armyPositions = useMemo(() => {
    const positions: { army: Army; x: number; y: number; targetX?: number; targetY?: number }[] = [];
    for (const army of Object.values(state.armies)) {
      const prov = state.provinces[army.provinceId];
      if (!prov) continue;

      let x = 0, y = 0;
      for (const [, layout] of Object.entries(provinceLayouts)) {
        const pl = layout.find(l => l.province.id === prov.id);
        if (pl) { x = pl.x + pl.w / 2; y = pl.y + pl.h / 2; break; }
      }
      if (x === 0) {
        const countryPos = COUNTRY_POSITIONS[prov.countryId];
        if (countryPos) { x = countryPos.x + countryPos.w / 2; y = countryPos.y + countryPos.h / 2; }
      }

      let targetX: number | undefined, targetY: number | undefined;
      if (army.targetProvinceId) {
        const targetProv = state.provinces[army.targetProvinceId];
        if (targetProv) {
          for (const [, layout] of Object.entries(provinceLayouts)) {
            const tl = layout.find(l => l.province.id === targetProv.id);
            if (tl) { targetX = tl.x + tl.w / 2; targetY = tl.y + tl.h / 2; break; }
          }
          if (!targetX) {
            const tp = COUNTRY_POSITIONS[targetProv.countryId];
            if (tp) { targetX = tp.x + tp.w / 2; targetY = tp.y + tp.h / 2; }
          }
        }
      }

      positions.push({ army, x, y, targetX, targetY });
    }
    return positions;
  }, [state.armies, state.provinces, provinceLayouts]);

  const battlePositions = useMemo(() => {
    return (state.activeBattles ?? []).map(b => {
      let x = 0, y = 0;
      for (const [, layout] of Object.entries(provinceLayouts)) {
        const pl = layout.find(l => l.province.id === b.provinceId);
        if (pl) { x = pl.x + pl.w / 2; y = pl.y + pl.h / 2; break; }
      }
      return { ...b, x, y };
    }).filter(b => b.x > 0);
  }, [state.activeBattles, provinceLayouts]);

  const handleArmyClick = (armyId: string) => {
    setSelectedArmyId(armyId);
    setActivePanel('military');
  };

  if (!showProvinces) return null;

  return (
    <>
      {/* Movement arrows */}
      {armyPositions.filter(a => a.targetX != null).map(({ army, x, y, targetX, targetY }) => {
        if (!targetX || !targetY) return null;
        const isPlayer = army.countryId === state.playerCountryId;
        const cx = x + (targetX - x) * army.movementProgress;
        const cy = y + (targetY - y) * army.movementProgress;
        return (
          <g key={`move_${army.id}`}>
            <line x1={x} y1={y} x2={targetX} y2={targetY}
              stroke={isPlayer ? 'hsl(42, 100%, 58%)' : 'hsl(0, 72%, 51%)'}
              strokeWidth={0.8} strokeDasharray="3,2" opacity={0.5}
              markerEnd={isPlayer ? 'url(#arrowhead)' : 'url(#arrowheadRed)'} />
            <circle cx={cx} cy={cy} r={3.5}
              fill={isPlayer ? 'hsl(var(--primary))' : state.countries[army.countryId]?.color ?? '#888'}
              stroke="hsl(var(--foreground))" strokeWidth={0.5} opacity={0.95}>
              <animate attributeName="r" values="3.5;4;3.5" dur="1s" repeatCount="indefinite" />
            </circle>
            <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={3}
              fill="hsl(var(--foreground))" fontFamily="'JetBrains Mono', monospace" fontWeight={700} style={{ pointerEvents: 'none' }}>
              {army.units.reduce((s, u) => s + u.count, 0)}
            </text>
          </g>
        );
      })}

      {/* Stationary armies */}
      {armyPositions.filter(a => !a.army.targetProvinceId).map(({ army, x, y }) => {
        const totalUnits = army.units.reduce((s, u) => s + u.count, 0);
        const isPlayer = army.countryId === state.playerCountryId;
        const isSelected = selectedArmyId === army.id;
        const countryColor = state.countries[army.countryId]?.color ?? '#888';
        return (
          <g key={army.id} onClick={(e) => { e.stopPropagation(); handleArmyClick(army.id); }} className="cursor-pointer">
            {isSelected && <circle cx={x} cy={y - 4} r={6} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.8} opacity={0.5} filter="url(#glow)" />}
            <rect x={x - 5} y={y - 7.5} width={10} height={7} rx={2}
              fill={isPlayer ? 'hsl(var(--primary))' : countryColor}
              stroke={isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--background))'} strokeWidth={isSelected ? 0.8 : 0.4} opacity={0.95} />
            <text x={x} y={y - 3.8} textAnchor="middle" dominantBaseline="middle" fontSize={3.5}
              fill={isPlayer ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'} fontFamily="'JetBrains Mono', monospace" fontWeight={700}
              style={{ pointerEvents: 'none' }}>
              {totalUnits > 99 ? '99+' : totalUnits}
            </text>
          </g>
        );
      })}

      {/* Battle indicators */}
      {battlePositions.map((b, i) => (
        <g key={`battle_${i}`}>
          <circle cx={b.x} cy={b.y} r={5} fill="hsl(var(--danger))" opacity={0.2} filter="url(#battleGlow)">
            <animate attributeName="r" values="5;8;5" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.1;0.3" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <text x={b.x} y={b.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={6} style={{ pointerEvents: 'none' }}>
            ⚔
          </text>
        </g>
      ))}
    </>
  );
};

export default React.memo(ArmyLayer);
