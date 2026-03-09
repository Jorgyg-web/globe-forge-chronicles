import React from 'react';
import { CachedProvinceData } from './ProvincePathCache';

interface ProvinceOverlayLayerProps {
  provinces: CachedProvinceData[];
  selectedProvinceId: string | null;
  selectedCountryId: string | null;
  moveTargets: Set<string>;
  zoom: number;
  troopCounts: Record<string, number>;
}

const ZOOM_PROVINCE_BORDERS = 1.8
const ZOOM_DETAILS = 3          // close: show stats, morale bars, building counts

export const ProvinceOverlayLayer: React.FC<ProvinceOverlayLayerProps> = React.memo(({
  provinces, selectedProvinceId, selectedCountryId, moveTargets, zoom, troopCounts,
}) => {
  const showProvinceBorders = zoom >= ZOOM_PROVINCE_BORDERS;
  const showDetails = zoom >= ZOOM_DETAILS;

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

      {/* === ZOOM LEVEL: Detail indicators (close zoom) === */}
      {showDetails && provinces.filter(p => p.boundsW > 10 && p.boundsH > 8).map(p => {
        const troops = troopCounts[p.id] ?? 0;
        return (
          <g key={`det_${p.id}`}>
            {/* Morale bar */}
            <rect x={p.centroidX - (p.boundsW * 0.25)} y={p.centroidY + p.boundsH * 0.15}
              width={p.boundsW * 0.5} height={1.2} rx={0.5} fill="hsl(0,0%,20%)" opacity={0.5} />
            <rect x={p.centroidX - (p.boundsW * 0.25)} y={p.centroidY + p.boundsH * 0.15}
              width={p.boundsW * 0.5 * (p.morale / 100)} height={1.2} rx={0.5}
              fill={p.morale > 60 ? 'hsl(var(--success))' : p.morale > 30 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'}
              opacity={0.8} />
            {/* Troop count */}
            {troops > 0 && (
              <>
                <circle cx={p.centroidX + p.boundsW * 0.25} cy={p.centroidY - p.boundsH * 0.15} r={3}
                  fill="hsl(var(--background))" opacity={0.8} />
                <text x={p.centroidX + p.boundsW * 0.25} y={p.centroidY - p.boundsH * 0.15 + 0.5}
                  textAnchor="middle" dominantBaseline="middle" fontSize={2.5}
                  fill="hsl(var(--foreground))" fontFamily="'JetBrains Mono', monospace" fontWeight={700}>
                  {troops > 99 ? '99+' : troops}
                </text>
              </>
            )}
            {/* Building count */}
            {p.buildingCount > 0 && (
              <text x={p.centroidX - p.boundsW * 0.25} y={p.centroidY - p.boundsH * 0.15 + 0.5}
                textAnchor="start" dominantBaseline="middle" fontSize={2.5}
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
