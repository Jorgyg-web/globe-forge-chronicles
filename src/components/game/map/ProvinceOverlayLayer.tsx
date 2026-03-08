import React, { useMemo } from 'react';
import { CachedProvinceData } from './ProvincePathCache';

interface ProvinceOverlayLayerProps {
  provinces: CachedProvinceData[];
  selectedProvinceId: string | null;
  selectedCountryId: string | null;
  moveTargets: Set<string>;
  zoom: number;
  troopCounts: Record<string, number>;
}

// Zoom thresholds
const ZOOM_COUNTRY_LABELS = 0.5;   // always show country names
const ZOOM_PROVINCE_BORDERS = 1.2; // medium: show province borders
const ZOOM_MAJOR_LABELS = 1.5;     // medium: show major province names (large provinces)
const ZOOM_ALL_LABELS = 2.2;       // close: show all province labels
const ZOOM_DETAILS = 2.5;          // close: show stats, morale bars, building counts

export const ProvinceOverlayLayer: React.FC<ProvinceOverlayLayerProps> = React.memo(({
  provinces, selectedProvinceId, selectedCountryId, moveTargets, zoom, troopCounts,
}) => {
  // Group provinces by country for country-level labels
  const countryLabels = useMemo(() => {
    if (zoom >= ZOOM_ALL_LABELS) return []; // province labels take over
    const byCountry: Record<string, { name: string; cx: number; cy: number; count: number; totalW: number }> = {};
    for (const p of provinces) {
      if (!byCountry[p.countryId]) {
        byCountry[p.countryId] = { name: '', cx: 0, cy: 0, count: 0, totalW: 0 };
      }
      const entry = byCountry[p.countryId];
      // Weight centroid by province area (boundsW * boundsH as proxy)
      const area = p.boundsW * p.boundsH;
      entry.cx += p.centroidX * area;
      entry.cy += p.centroidY * area;
      entry.totalW += area;
      entry.count++;
      if (!entry.name || area > (byCountry[p.countryId] as any)._maxArea) {
        entry.name = p.name; // use largest province name as fallback
        (byCountry[p.countryId] as any)._maxArea = area;
      }
    }
    // Use country name from first province's countryId
    const results: { countryId: string; cx: number; cy: number; name: string; provCount: number }[] = [];
    for (const [countryId, entry] of Object.entries(byCountry)) {
      if (entry.totalW === 0) continue;
      results.push({
        countryId,
        cx: entry.cx / entry.totalW,
        cy: entry.cy / entry.totalW,
        name: countryId.toUpperCase(),
        provCount: entry.count,
      });
    }
    return results;
  }, [provinces, zoom]);

  const showProvinceBorders = zoom >= ZOOM_PROVINCE_BORDERS;
  const showMajorLabels = zoom >= ZOOM_MAJOR_LABELS;
  const showAllLabels = zoom >= ZOOM_ALL_LABELS;
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

      {/* === ZOOM LEVEL: Country labels (zoomed out) === */}
      {zoom < ZOOM_ALL_LABELS && countryLabels
        .filter(c => c.provCount >= 1)
        .map(c => {
          // Scale font: bigger when zoomed out, smaller as we approach province-label zoom
          const fontSize = Math.max(2.5, Math.min(6, 8 / zoom));
          return (
            <text key={`country_${c.countryId}`} x={c.cx} y={c.cy}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={fontSize} fill="hsl(var(--foreground))"
              fontFamily="'JetBrains Mono', monospace" fontWeight={700}
              opacity={0.65} letterSpacing={0.8}>
              {c.name.length > 5 ? c.name.slice(0, 4) : c.name}
            </text>
          );
        })}

      {/* === ZOOM LEVEL: Major province labels (medium zoom) === */}
      {showMajorLabels && !showAllLabels && provinces
        .filter(p => p.boundsW > 18 && p.boundsH > 12)
        .map(p => (
          <text key={`lbl_${p.id}`} x={p.centroidX} y={p.centroidY + 2}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={3} fill="hsl(var(--foreground))"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={p.id === selectedProvinceId ? 700 : 400}
            opacity={p.id === selectedProvinceId ? 1 : 0.55}>
            {p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name}
          </text>
        ))}

      {/* === ZOOM LEVEL: All province labels (close zoom) === */}
      {showAllLabels && provinces
        .filter(p => p.boundsW > 6 && p.boundsH > 4)
        .map(p => (
          <text key={`lbl_${p.id}`} x={p.centroidX} y={p.centroidY + (showDetails ? -2 : 0)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={Math.min(4, p.boundsW / 5)} fill="hsl(var(--foreground))"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={p.id === selectedProvinceId ? 700 : 400}
            opacity={p.id === selectedProvinceId ? 1 : 0.7}>
            {p.name.length > 10 ? p.name.slice(0, 9) + '…' : p.name}
          </text>
        ))}

      {/* === ZOOM LEVEL: Detail indicators (close zoom) === */}
      {showDetails && provinces.filter(p => p.boundsW > 10 && p.boundsH > 8).map(p => {
        const troops = troopCounts[p.id] ?? 0;
        return (
          <g key={`det_${p.id}`}>
            {/* Morale bar */}
            <rect x={p.centroidX - (p.boundsW * 0.25)} y={p.centroidY + p.boundsH * 0.2}
              width={p.boundsW * 0.5} height={1.2} rx={0.5} fill="hsl(0,0%,20%)" opacity={0.5} />
            <rect x={p.centroidX - (p.boundsW * 0.25)} y={p.centroidY + p.boundsH * 0.2}
              width={p.boundsW * 0.5 * (p.morale / 100)} height={1.2} rx={0.5}
              fill={p.morale > 60 ? 'hsl(var(--success))' : p.morale > 30 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'}
              opacity={0.8} />
            {/* Troop count */}
            {troops > 0 && (
              <>
                <circle cx={p.centroidX + p.boundsW * 0.25} cy={p.centroidY - p.boundsH * 0.2} r={3}
                  fill="hsl(var(--background))" opacity={0.8} />
                <text x={p.centroidX + p.boundsW * 0.25} y={p.centroidY - p.boundsH * 0.2 + 0.5}
                  textAnchor="middle" dominantBaseline="middle" fontSize={2.5}
                  fill="hsl(var(--foreground))" fontFamily="'JetBrains Mono', monospace" fontWeight={700}>
                  {troops > 99 ? '99+' : troops}
                </text>
              </>
            )}
            {/* Building count */}
            {p.buildingCount > 0 && (
              <text x={p.centroidX - p.boundsW * 0.25} y={p.centroidY - p.boundsH * 0.2 + 0.5}
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
