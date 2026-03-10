import React, { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { useMapContext } from './MapContext';
import { Army } from '@/types/game';
import { getProvinceCentroid } from '@/data/provinceGeometry';
import { UNIT_STATS } from '@/data/unitStats';
import { boundsIntersectViewport } from './mapViewport';

const TERRAIN_MOVEMENT_COST: Record<string, number> = {
  plains: 1, coastal: 1, urban: 0.8, forest: 1.4, desert: 1.3, mountain: 2, arctic: 1.8,
};

function estimateETA(army: Army, state: { provinces: Record<string, any> }): string {
  if (!army.targetProvinceId) return '';
  const minSpeed = Math.min(...army.units.map(u => UNIT_STATS[u.type].speed));
  const infraLevel = state.provinces[army.provinceId]?.buildings?.find((b: any) => b.type === 'infrastructure')?.level ?? 0;
  const infraBonus = 1 + infraLevel * 0.15;
  const targetProv = state.provinces[army.targetProvinceId];
  const terrainCost = targetProv ? (TERRAIN_MOVEMENT_COST[targetProv.terrain] ?? 1) : 1;
  const movePerTurn = (minSpeed * infraBonus) / terrainCost * 0.4;
  const progress = army.movementProgress ?? 0;
  const remaining = 1 - progress;
  const turns = Math.ceil(remaining / movePerTurn);
  return `${turns}t`;
}

function getDominantUnitIcon(army: Army): string {
  let max = 0, icon = '🎖';
  for (const u of army.units) {
    if (u.count > max) { max = u.count; icon = UNIT_STATS[u.type].icon; }
  }
  return icon;
}

const ArmyLayer: React.FC = () => {
  const { state, selectedArmyId, selectedArmyIds, toggleArmySelection, setActivePanel } = useGame();
  const { mapLayer, zoom, isZooming, viewport } = useMapContext();
  const militaryLayer = mapLayer === 'military';
  const showArmies = militaryLayer ? zoom > 1.8 : zoom > 3;
  const showMovement = militaryLayer ? zoom > 1.8 : zoom > 3;
  const badgeScale = militaryLayer ? 1.18 : 1;

  const armyPositions = useMemo(() => {
    const positions: { army: Army; x: number; y: number; targetX?: number; targetY?: number }[] = [];
    for (const army of Object.values(state.armies)) {
      const centroid = getProvinceCentroid(army.provinceId);
      if (!boundsIntersectViewport({ minX: centroid.x, minY: centroid.y, maxX: centroid.x, maxY: centroid.y }, viewport)) {
        continue;
      }

      let targetX: number | undefined, targetY: number | undefined;
      if (army.targetProvinceId) {
        const tc = getProvinceCentroid(army.targetProvinceId);
        targetX = tc.x;
        targetY = tc.y;
      }
      positions.push({ army, x: centroid.x, y: centroid.y, targetX, targetY });
    }
    return positions;
  }, [state.armies, viewport]);

  const battlePositions = useMemo(() => {
    return (state.activeBattles ?? []).map(b => {
      const c = getProvinceCentroid(b.provinceId);
      return { ...b, x: c.x, y: c.y };
    }).filter(b => boundsIntersectViewport({ minX: b.x, minY: b.y, maxX: b.x, maxY: b.y }, viewport));
  }, [state.activeBattles, viewport]);

  const handleArmyClick = (armyId: string, e?: React.MouseEvent) => {
    toggleArmySelection(armyId, e?.shiftKey ?? false);
    setActivePanel('military');
  };

  return (
    <>
      {/* Movement arrows with ETA */}
      {!isZooming && showMovement && armyPositions.filter(a => a.targetX != null).map(({ army, x, y, targetX, targetY }) => {
        if (!targetX || !targetY) return null;
        const isPlayer = army.countryId === state.playerCountryId;
        const progress = army.movementProgress ?? 0;
        const cx = x + (targetX - x) * progress;
        const cy = y + (targetY - y) * progress;
        const eta = estimateETA(army, state);
        const midX = (x + targetX) / 2;
        const midY = (y + targetY) / 2;
        const isSelected = selectedArmyIds.includes(army.id);
        const totalUnits = army.units.reduce((s, u) => s + u.count, 0);
        const icon = getDominantUnitIcon(army);

        return (
          <g key={`move_${army.id}`} onClick={(e) => { e.stopPropagation(); handleArmyClick(army.id, e); }} className="cursor-pointer">
            {/* Path line with animation */}
            <line x1={x} y1={y} x2={targetX} y2={targetY}
              stroke={isPlayer ? 'hsl(42, 100%, 58%)' : 'hsl(0, 72%, 51%)'}
              strokeWidth={militaryLayer ? (isSelected ? 2.4 : 1.8) : isSelected ? 2 : 1.3} 
              strokeDasharray="5,3" 
              opacity={militaryLayer ? 0.9 : 0.7}
              markerEnd={isPlayer ? 'url(#arrowhead)' : 'url(#arrowheadRed)'}>
              <animate
                attributeName="strokeDashoffset"
                from="0"
                to="-8"
                dur="0.6s"
                repeatCount="indefinite"
              />
            </line>
            {/* ETA label at midpoint */}
            <rect x={midX - 5} y={midY - 4} width={10} height={5} rx={1.5}
              fill="hsl(var(--background))" opacity={0.85} stroke={isPlayer ? 'hsl(42, 100%, 58%)' : 'hsl(0, 72%, 51%)'} strokeWidth={0.3} />
            <text x={midX} y={midY - 1} textAnchor="middle" dominantBaseline="middle" fontSize={2.8}
              fill="hsl(var(--foreground))" fontFamily="'JetBrains Mono', monospace" fontWeight={600}
              style={{ pointerEvents: 'none' }}>
              {eta}
            </text>

            {/* Moving army marker */}
            {isSelected && <circle cx={cx} cy={cy} r={militaryLayer ? 8.5 : 7} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.6} opacity={0.4} filter="url(#glow)" />}
            <rect x={cx - 6 * badgeScale} y={cy - 5 * badgeScale} width={12 * badgeScale} height={8 * badgeScale} rx={2}
              fill={isPlayer ? 'hsl(var(--primary))' : state.countries[army.countryId]?.color ?? '#888'}
              stroke="hsl(var(--foreground))" strokeWidth={0.4} opacity={0.95}>
              <animate attributeName="opacity" values="0.95;0.75;0.95" dur="1.5s" repeatCount="indefinite" />
            </rect>
            <text x={cx - 2.2 * badgeScale} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={militaryLayer ? 4.8 : 4}
              style={{ pointerEvents: 'none' }}>
              {icon}
            </text>
            <text x={cx + 3.1 * badgeScale} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={militaryLayer ? 3.4 : 3}
              fill={isPlayer ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'} fontFamily="'JetBrains Mono', monospace" fontWeight={700}
              style={{ pointerEvents: 'none' }}>
              {totalUnits > 99 ? '99+' : totalUnits}
            </text>
          </g>
        );
      })}

      {/* Stationary armies */}
      {!isZooming && showArmies && armyPositions.filter(a => !a.army.targetProvinceId).map(({ army, x, y }) => {
        const totalUnits = army.units.reduce((s, u) => s + u.count, 0);
        const isPlayer = army.countryId === state.playerCountryId;
        const isSelected = selectedArmyIds.includes(army.id);
        const countryColor = state.countries[army.countryId]?.color ?? '#888';
        const icon = getDominantUnitIcon(army);
        const avgHealth = army.units.reduce((s, u) => s + u.health * u.count, 0) / Math.max(1, totalUnits);

        return (
          <g key={army.id} onClick={(e) => { e.stopPropagation(); handleArmyClick(army.id, e); }} className="cursor-pointer">
            {/* Selection glow */}
            {isSelected && (
              <>
                <circle cx={x} cy={y - 3} r={militaryLayer ? 10 : 8} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.8} opacity={0.5} filter="url(#glow)">
                  <animate attributeName="r" values={militaryLayer ? '10;12;10' : '8;9.5;8'} dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={y - 3} r={militaryLayer ? 12 : 10} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.3} opacity={0.2} />
              </>
            )}

            {/* Army badge */}
            {isPlayer && (
              <circle
                cx={x}
                cy={y - 3}
                r={militaryLayer ? 11 : 9}
                fill="hsl(var(--primary))"
                opacity={0.15}
                filter="url(#glow)"
              />
            )}
            <rect x={x - 7 * badgeScale} y={y - 8 * badgeScale} width={14 * badgeScale} height={9 * badgeScale} rx={2}
              fill={isPlayer ? 'hsl(var(--primary))' : countryColor}
              stroke={isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--background))'} strokeWidth={isSelected ? 1 : 0.4} opacity={0.95} />

            {/* Icon + count */}
            <text x={x - 2.7 * badgeScale} y={y - 3} textAnchor="middle" dominantBaseline="middle" fontSize={militaryLayer ? 5.2 : 4.5}
              style={{ pointerEvents: 'none' }}>
              {icon}
            </text>
            <text x={x + 3.7 * badgeScale} y={y - 3} textAnchor="middle" dominantBaseline="middle" fontSize={militaryLayer ? 4 : 3.5}
              fill={isPlayer ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'} fontFamily="'JetBrains Mono', monospace" fontWeight={700}
              style={{ pointerEvents: 'none' }}>
              {totalUnits > 99 ? '99+' : totalUnits}
            </text>

            {/* Health bar under the badge */}
            <rect x={x - 6 * badgeScale} y={y + 1.5 * badgeScale} width={12 * badgeScale} height={1.2 * badgeScale} rx={0.6}
              fill="hsl(0, 0%, 15%)" opacity={0.6} />
            <rect x={x - 6 * badgeScale} y={y + 1.5 * badgeScale} width={12 * badgeScale * (avgHealth / 100)} height={1.2 * badgeScale} rx={0.6}
              fill={avgHealth > 60 ? 'hsl(var(--success))' : avgHealth > 30 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'}
              opacity={0.9} />
          </g>
        );
      })}

      {/* Battle indicators */}
      {!isZooming && battlePositions.map((b, i) => (
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

export { estimateETA, getDominantUnitIcon };

export default React.memo(ArmyLayer);
