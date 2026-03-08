import React, { useMemo } from 'react';
import { useGame } from '@/context/GameContext';
import { useMapContext } from './MapContext';
import { TERRAIN_COLORS, TERRAIN_PATTERNS } from './mapConstants';
import { getProvinceCentroid, computeBounds } from '@/data/provinceGeometry';

const ProvinceLayer: React.FC = () => {
  const { state, selectedCountryId, selectedProvinceId, setSelectedCountryId, setSelectedProvinceId, selectedArmyId, setActivePanel, dispatch } = useGame();
  const { showDetails, moveMode, moveTargets, setHoveredCountry, setHoveredProvince } = useMapContext();

  const handleProvinceClick = (provId: string, countryId: string) => {
    if (moveMode && selectedArmyId) {
      dispatch({ type: 'MOVE_ARMY', armyId: selectedArmyId, targetProvinceId: provId });
      return;
    }
    setSelectedCountryId(countryId);
    setSelectedProvinceId(provId);
    setActivePanel('province');
  };

  // Group provinces by country for rendering
  const countriesWithProvinces = useMemo(() => {
    const map: Record<string, typeof state.provinces[string][]> = {};
    for (const prov of Object.values(state.provinces)) {
      if (!map[prov.countryId]) map[prov.countryId] = [];
      map[prov.countryId].push(prov);
    }
    return map;
  }, [state.provinces]);

  return (
    <>
      {Object.values(state.countries).map(country => {
        const provinces = countriesWithProvinces[country.id];
        if (!provinces || provinces.length === 0) return null;
        const isSelected = selectedCountryId === country.id;
        const isPlayer = country.id === state.playerCountryId;
        const isAtWar = state.wars.some(w => w.active && (w.attackers.includes(country.id) || w.defenders.includes(country.id)));

        return (
          <g key={country.id}>
            {provinces.map(prov => {
              const isProvSelected = selectedProvinceId === prov.id;
              const isMoveTarget = moveTargets.has(prov.id);
              const owner = state.countries[prov.countryId];
              const isConquered = prov.countryId !== prov.originalCountryId;
              const terrainColor = TERRAIN_COLORS[prov.terrain];
              const centroid = getProvinceCentroid(prov.id);
              const bounds = computeBounds(prov.geometry);
              const provArmies = Object.values(state.armies).filter(a => a.provinceId === prov.id && !a.targetProvinceId);
              const totalTroops = provArmies.reduce((s, a) => s + a.units.reduce((s2, u) => s2 + u.count, 0), 0);

              return (
                <g key={prov.id}
                  onClick={(e) => { e.stopPropagation(); handleProvinceClick(prov.id, prov.countryId); }}
                  onMouseEnter={() => { setHoveredProvince(prov.id); setHoveredCountry(country.id); }}
                  onMouseLeave={() => { setHoveredProvince(null); setHoveredCountry(null); }}
                  className="cursor-pointer">
                  {/* Terrain fill */}
                  <path d={prov.geometry}
                    fill={isProvSelected ? 'hsl(var(--primary))' : isMoveTarget ? 'hsl(var(--success))' : terrainColor}
                    opacity={isProvSelected ? 0.7 : isMoveTarget ? 0.6 : 0.5}
                    stroke={isProvSelected ? 'hsl(var(--primary))' : isMoveTarget ? 'hsl(var(--success))' : isSelected ? 'hsl(var(--primary))' : 'hsl(var(--map-border))'}
                    strokeWidth={isProvSelected ? 1.5 : isMoveTarget ? 1.2 : isSelected ? 0.6 : 0.3}
                    style={{ transition: 'all 0.15s ease' }} />

                  {/* Country color overlay */}
                  <path d={prov.geometry}
                    fill={owner?.color ?? country.color}
                    opacity={isConquered ? 0.15 : 0.2}
                    style={{ pointerEvents: 'none' }} />

                  {/* Province name */}
                  {bounds.w > 10 && bounds.h > 6 && (
                    <text x={centroid.x} y={centroid.y + (showDetails ? -2 : 0)} textAnchor="middle" dominantBaseline="middle"
                      fontSize={Math.min(5, bounds.w / 4)} fill="hsl(var(--foreground))"
                      fontFamily="'JetBrains Mono', monospace" fontWeight={isProvSelected ? 700 : 400}
                      opacity={isProvSelected ? 1 : 0.7} style={{ pointerEvents: 'none' }}>
                      {prov.name.length > 10 ? prov.name.slice(0, 9) + '…' : prov.name}
                    </text>
                  )}

                  {/* Detail indicators when zoomed in */}
                  {showDetails && bounds.w > 14 && bounds.h > 10 && (
                    <g style={{ pointerEvents: 'none' }}>
                      {/* Morale bar */}
                      <rect x={centroid.x - (bounds.w * 0.3)} y={centroid.y + bounds.h * 0.25} width={bounds.w * 0.6} height={1.5} rx={0.5} fill="hsl(0,0%,20%)" opacity={0.5} />
                      <rect x={centroid.x - (bounds.w * 0.3)} y={centroid.y + bounds.h * 0.25} width={bounds.w * 0.6 * (prov.morale / 100)} height={1.5} rx={0.5}
                        fill={prov.morale > 60 ? 'hsl(var(--success))' : prov.morale > 30 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'} opacity={0.8} />

                      {/* Troop count */}
                      {totalTroops > 0 && (
                        <>
                          <circle cx={centroid.x + bounds.w * 0.3} cy={centroid.y - bounds.h * 0.25} r={3.5} fill="hsl(var(--background))" opacity={0.8} />
                          <text x={centroid.x + bounds.w * 0.3} y={centroid.y - bounds.h * 0.25 + 0.5} textAnchor="middle" dominantBaseline="middle"
                            fontSize={3} fill="hsl(var(--foreground))" fontFamily="'JetBrains Mono', monospace" fontWeight={700}>
                            {totalTroops > 99 ? '99+' : totalTroops}
                          </text>
                        </>
                      )}

                      {/* Building count */}
                      {prov.buildings.length > 0 && (
                        <text x={centroid.x - bounds.w * 0.3} y={centroid.y - bounds.h * 0.25 + 0.5} textAnchor="start" dominantBaseline="middle"
                          fontSize={3} fill="hsl(var(--muted-foreground))" fontFamily="'JetBrains Mono', monospace">
                          🏗{prov.buildings.length}
                        </text>
                      )}

                      {/* Terrain icon */}
                      {bounds.w > 22 && (
                        <text x={centroid.x} y={centroid.y + 2} textAnchor="middle" dominantBaseline="middle"
                          fontSize={4} opacity={0.4} style={{ pointerEvents: 'none' }}>
                          {TERRAIN_PATTERNS[prov.terrain]}
                        </text>
                      )}

                      {/* Conquered marker */}
                      {isConquered && (
                        <text x={centroid.x - bounds.w * 0.25} y={centroid.y + bounds.h * 0.15} fontSize={3} fill="hsl(var(--danger))" opacity={0.7}>⚑</text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Player indicator on first province centroid */}
            {isPlayer && provinces[0] && (() => {
              const c = getProvinceCentroid(provinces[0].id);
              return (
                <>
                  <circle cx={c.x + 8} cy={c.y - 8} r={3.5} fill="hsl(var(--primary))" opacity={0.9} />
                  <circle cx={c.x + 8} cy={c.y - 8} r={1.5} fill="hsl(var(--primary-foreground))" />
                </>
              );
            })()}
            {isAtWar && provinces[0] && (() => {
              const c = getProvinceCentroid(provinces[0].id);
              return <circle cx={c.x - 8} cy={c.y - 8} r={3} fill="hsl(var(--danger))" className="animate-pulse-glow" />;
            })()}
          </g>
        );
      })}
    </>
  );
};

export default React.memo(ProvinceLayer);
