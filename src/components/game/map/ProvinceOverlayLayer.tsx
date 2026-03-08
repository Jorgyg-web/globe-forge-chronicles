import React from 'react';
import { CachedProvinceData } from './ProvincePathCache';

/**
 * Renders selection highlights, move-target indicators, and detail overlays.
 * Only the selected/hovered/move-target provinces cause elements here.
 * This is a thin layer that re-renders on selection changes but touches few DOM nodes.
 */
interface ProvinceOverlayLayerProps {
  provinces: CachedProvinceData[];
  selectedProvinceId: string | null;
  selectedCountryId: string | null;
  moveTargets: Set<string>;
  showDetails: boolean;
  troopCounts: Record<string, number>;
}

export const ProvinceOverlayLayer: React.FC<ProvinceOverlayLayerProps> = React.memo(({
  provinces, selectedProvinceId, selectedCountryId, moveTargets, showDetails, troopCounts,
}) => {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Selected country border highlight */}
      {selectedCountryId && provinces
        .filter(p => p.countryId === selectedCountryId && p.id !== selectedProvinceId)
        .map(p => (
          <path key={`sel_c_${p.id}`} d={p.geometry}
            fill="none" stroke="hsl(var(--primary))" strokeWidth={0.6} opacity={0.5} />
        ))}

      {/* Move targets */}
      {Array.from(moveTargets).map(id => {
        const p = provinces.find(pr => pr.id === id);
        if (!p) return null;
        return <path key={`mt_${id}`} d={p.geometry} fill="hsl(var(--success))" opacity={0.4} stroke="hsl(var(--success))" strokeWidth={1.2} />;
      })}

      {/* Selected province */}
      {selectedProvinceId && (() => {
        const p = provinces.find(pr => pr.id === selectedProvinceId);
        if (!p) return null;
        return <path d={p.geometry} fill="hsl(var(--primary))" opacity={0.5} stroke="hsl(var(--primary))" strokeWidth={1.5} />;
      })()}

      {/* Province labels — only for provinces large enough */}
      {provinces.filter(p => p.boundsW > 10 && p.boundsH > 6).map(p => (
        <text key={`lbl_${p.id}`} x={p.centroidX} y={p.centroidY + (showDetails ? -2 : 0)}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={Math.min(5, p.boundsW / 4)} fill="hsl(var(--foreground))"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={p.id === selectedProvinceId ? 700 : 400}
          opacity={p.id === selectedProvinceId ? 1 : 0.7}>
          {p.name.length > 10 ? p.name.slice(0, 9) + '…' : p.name}
        </text>
      ))}

      {/* Detail indicators when zoomed in */}
      {showDetails && provinces.filter(p => p.boundsW > 14 && p.boundsH > 10).map(p => {
        const troops = troopCounts[p.id] ?? 0;
        return (
          <g key={`det_${p.id}`}>
            {/* Morale bar */}
            <rect x={p.centroidX - (p.boundsW * 0.3)} y={p.centroidY + p.boundsH * 0.25}
              width={p.boundsW * 0.6} height={1.5} rx={0.5} fill="hsl(0,0%,20%)" opacity={0.5} />
            <rect x={p.centroidX - (p.boundsW * 0.3)} y={p.centroidY + p.boundsH * 0.25}
              width={p.boundsW * 0.6 * (p.morale / 100)} height={1.5} rx={0.5}
              fill={p.morale > 60 ? 'hsl(var(--success))' : p.morale > 30 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'}
              opacity={0.8} />
            {/* Troop count */}
            {troops > 0 && (
              <>
                <circle cx={p.centroidX + p.boundsW * 0.3} cy={p.centroidY - p.boundsH * 0.25} r={3.5}
                  fill="hsl(var(--background))" opacity={0.8} />
                <text x={p.centroidX + p.boundsW * 0.3} y={p.centroidY - p.boundsH * 0.25 + 0.5}
                  textAnchor="middle" dominantBaseline="middle" fontSize={3}
                  fill="hsl(var(--foreground))" fontFamily="'JetBrains Mono', monospace" fontWeight={700}>
                  {troops > 99 ? '99+' : troops}
                </text>
              </>
            )}
            {/* Building count */}
            {p.buildingCount > 0 && (
              <text x={p.centroidX - p.boundsW * 0.3} y={p.centroidY - p.boundsH * 0.25 + 0.5}
                textAnchor="start" dominantBaseline="middle" fontSize={3}
                fill="hsl(var(--muted-foreground))" fontFamily="'JetBrains Mono', monospace">
                🏗{p.buildingCount}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
});
ProvinceOverlayLayer.displayName = 'ProvinceOverlayLayer';
