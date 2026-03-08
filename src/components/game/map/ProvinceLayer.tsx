import React from 'react';
import { useGame } from '@/context/GameContext';
import { useMapContext } from './MapContext';
import { TERRAIN_COLORS, TERRAIN_PATTERNS, COUNTRY_POSITIONS } from './mapConstants';

const ProvinceLayer: React.FC = () => {
  const { state, selectedCountryId, selectedProvinceId, setSelectedCountryId, setSelectedProvinceId, selectedArmyId, setActivePanel, dispatch } = useGame();
  const { showProvinces, showDetails, moveMode, moveTargets, provinceLayouts, setHoveredCountry, setHoveredProvince } = useMapContext();

  const handleProvinceClick = (provId: string, countryId: string) => {
    if (moveMode && selectedArmyId) {
      dispatch({ type: 'MOVE_ARMY', armyId: selectedArmyId, targetProvinceId: provId });
      return;
    }
    setSelectedCountryId(countryId);
    setSelectedProvinceId(provId);
    setActivePanel('province');
  };

  return (
    <>
      {Object.values(state.countries).map(country => {
        const pos = COUNTRY_POSITIONS[country.id];
        if (!pos) return null;
        const isSelected = selectedCountryId === country.id;
        const isPlayer = country.id === state.playerCountryId;
        const isAtWar = state.wars.some(w => w.active && (w.attackers.includes(country.id) || w.defenders.includes(country.id)));
        const layout = provinceLayouts[country.id];

        return (
          <g key={country.id}>
            {isSelected && <rect x={pos.x - 3} y={pos.y - 3} width={pos.w + 6} height={pos.h + 6} rx={5} fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity={0.3} filter="url(#glow)" />}

            {showProvinces && layout ? (
              <>
                <rect x={pos.x - 1} y={pos.y - 1} width={pos.w + 2} height={pos.h + 2} rx={4} fill="none"
                  stroke={isAtWar ? 'hsl(var(--danger))' : isPlayer ? 'hsl(var(--primary))' : 'hsl(var(--map-border))'}
                  strokeWidth={isPlayer ? 1.5 : isAtWar ? 1.2 : 0.6} strokeDasharray={isAtWar ? '3,2' : 'none'} />

                {layout.map(({ province: prov, x, y, w, h }) => {
                  const isProvSelected = selectedProvinceId === prov.id;
                  const isProvHovered = false; // Handled by interaction layer overlay
                  const isMoveTarget = moveTargets.has(prov.id);
                  const owner = state.countries[prov.countryId];
                  const isConquered = prov.countryId !== prov.originalCountryId;
                  const terrainColor = TERRAIN_COLORS[prov.terrain];
                  const provArmies = Object.values(state.armies).filter(a => a.provinceId === prov.id && !a.targetProvinceId);
                  const totalTroops = provArmies.reduce((s, a) => s + a.units.reduce((s2, u) => s2 + u.count, 0), 0);

                  return (
                    <g key={prov.id}
                      onClick={(e) => { e.stopPropagation(); handleProvinceClick(prov.id, prov.countryId); }}
                      onMouseEnter={() => { setHoveredProvince(prov.id); setHoveredCountry(country.id); }}
                      onMouseLeave={() => { setHoveredProvince(null); setHoveredCountry(null); }}
                      className="cursor-pointer">
                      <rect x={x} y={y} width={w} height={h} rx={1.5}
                        fill={isProvSelected ? 'hsl(var(--primary))' : isMoveTarget ? 'hsl(var(--success))' : terrainColor}
                        opacity={isProvSelected ? 0.7 : isMoveTarget ? 0.6 : 0.5}
                        stroke={isProvSelected ? 'hsl(var(--primary))' : isMoveTarget ? 'hsl(var(--success))' : 'hsl(var(--map-border))'}
                        strokeWidth={isProvSelected ? 1.5 : isMoveTarget ? 1.2 : 0.3}
                        style={{ transition: 'all 0.15s ease' }} />

                      <rect x={x} y={y} width={w} height={h} rx={1.5}
                        fill={owner?.color ?? country.color}
                        opacity={isConquered ? 0.15 : 0.2}
                        style={{ pointerEvents: 'none' }} />

                      {w > 12 && h > 8 && (
                        <text x={x + w / 2} y={y + (showDetails ? h * 0.3 : h / 2)} textAnchor="middle" dominantBaseline="middle"
                          fontSize={Math.min(5.5, w / 5)} fill="hsl(var(--foreground))"
                          fontFamily="'JetBrains Mono', monospace" fontWeight={isProvSelected ? 700 : 400}
                          opacity={isProvSelected ? 1 : 0.7} style={{ pointerEvents: 'none' }}>
                          {prov.name.length > 10 ? prov.name.slice(0, 9) + '…' : prov.name}
                        </text>
                      )}

                      {showDetails && w > 18 && h > 14 && (
                        <g style={{ pointerEvents: 'none' }}>
                          <rect x={x + 2} y={y + h - 4} width={w - 4} height={1.5} rx={0.5} fill="hsl(0,0%,20%)" opacity={0.5} />
                          <rect x={x + 2} y={y + h - 4} width={(w - 4) * (prov.morale / 100)} height={1.5} rx={0.5}
                            fill={prov.morale > 60 ? 'hsl(var(--success))' : prov.morale > 30 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'} opacity={0.8} />

                          {totalTroops > 0 && (
                            <>
                              <circle cx={x + w - 5} cy={y + 5} r={3.5} fill="hsl(var(--background))" opacity={0.8} />
                              <text x={x + w - 5} y={y + 5.5} textAnchor="middle" dominantBaseline="middle"
                                fontSize={3} fill="hsl(var(--foreground))" fontFamily="'JetBrains Mono', monospace" fontWeight={700}>
                                {totalTroops > 99 ? '99+' : totalTroops}
                              </text>
                            </>
                          )}

                          {prov.buildings.length > 0 && (
                            <text x={x + 4} y={y + 5.5} textAnchor="start" dominantBaseline="middle"
                              fontSize={3} fill="hsl(var(--muted-foreground))" fontFamily="'JetBrains Mono', monospace">
                              🏗{prov.buildings.length}
                            </text>
                          )}

                          {w > 25 && (
                            <text x={x + w / 2} y={y + h * 0.55} textAnchor="middle" dominantBaseline="middle"
                              fontSize={4} opacity={0.4} style={{ pointerEvents: 'none' }}>
                              {TERRAIN_PATTERNS[prov.terrain]}
                            </text>
                          )}

                          {isConquered && (
                            <text x={x + 3} y={y + h - 6} fontSize={3} fill="hsl(var(--danger))" opacity={0.7}>⚑</text>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}
              </>
            ) : (
              <g onClick={(e) => { e.stopPropagation(); setSelectedCountryId(country.id); }}
                onMouseEnter={() => setHoveredCountry(country.id)} onMouseLeave={() => setHoveredCountry(null)}
                className="cursor-pointer">
                <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={4}
                  fill={isSelected ? 'hsl(var(--primary))' : country.color}
                  opacity={isSelected ? 0.5 : 0.35}
                  stroke={isSelected ? 'hsl(var(--primary))' : isAtWar ? 'hsl(var(--danger))' : 'hsl(var(--map-border))'}
                  strokeWidth={isSelected ? 2 : isAtWar ? 1.5 : 0.5}
                  style={{ transition: 'all 0.2s ease' }} />
                <text x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize={pos.w < 25 ? 6 : 9} fill={isSelected ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                  fontFamily="'JetBrains Mono', monospace" fontWeight={isSelected ? 700 : 500}
                  style={{ transition: 'fill 0.2s ease', pointerEvents: 'none' }}>{country.code}</text>
              </g>
            )}

            {isPlayer && (
              <>
                <circle cx={pos.x + pos.w - 4} cy={pos.y + 4} r={3.5} fill="hsl(var(--primary))" opacity={0.9} />
                <circle cx={pos.x + pos.w - 4} cy={pos.y + 4} r={1.5} fill="hsl(var(--primary-foreground))" />
              </>
            )}
            {isAtWar && <circle cx={pos.x + 4} cy={pos.y + 4} r={3} fill="hsl(var(--danger))" className="animate-pulse-glow" />}
          </g>
        );
      })}
    </>
  );
};

export default React.memo(ProvinceLayer);
