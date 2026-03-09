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

// Zoom thresholds - adjusted for better readability
const ZOOM_PROVINCE_BORDERS = 1.8
const ZOOM_MAJOR_LABELS = 2.4
const ZOOM_ALL_LABELS = 3
const ZOOM_DETAILS = 3          // close: show stats, morale bars, building counts

interface LabelBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Check if two label bounds overlap
function labelsOverlap(a: LabelBounds, b: LabelBounds, padding: number = 2): boolean {
  return !(a.x + a.width + padding < b.x ||
           b.x + b.width + padding < a.x ||
           a.y + a.height + padding < b.y ||
           b.y + b.height + padding < a.y);
}

// Filter labels to remove overlapping ones (keep larger/more important ones)
function filterOverlappingLabels<T extends { x: number; y: number; width: number; height: number; priority: number }>(
  labels: T[]
): T[] {
  // Sort by priority (higher = more important, should be kept)
  const sorted = [...labels].sort((a, b) => b.priority - a.priority);
  const kept: T[] = [];
  
  for (const label of sorted) {
    const overlaps = kept.some(existing => labelsOverlap(label, existing));
    if (!overlaps) {
      kept.push(label);
    }
  }
  
  return kept;
}

export const ProvinceOverlayLayer: React.FC<ProvinceOverlayLayerProps> = React.memo(({
  provinces, selectedProvinceId, selectedCountryId, moveTargets, zoom, troopCounts,
}) => {
  // Filter province labels to avoid overlaps
  const visibleProvinceLabels = useMemo(() => {
    const showMajorLabels = zoom >= ZOOM_MAJOR_LABELS && zoom < ZOOM_ALL_LABELS;
    const showAllLabels = zoom >= ZOOM_ALL_LABELS;
    
    if (!showMajorLabels && !showAllLabels) return [];
    
    // Calculate which provinces should show labels based on zoom
    const candidates = provinces
      .filter(p => {
        if (showAllLabels) {
          return p.boundsW > 5 && p.boundsH > 3;
        }
        // Major labels only - larger provinces
        return p.boundsW > 15 && p.boundsH > 10;
      })
      .map(p => {
        const fontSize = showAllLabels 
          ? Math.min(3.5, Math.max(2, p.boundsW / 6))
          : Math.min(4, Math.max(2.5, p.boundsW / 5));
        const textWidth = p.name.length * fontSize * 0.5;
        const textHeight = fontSize * 1.2;
        const area = p.boundsW * p.boundsH;
        
        return {
          ...p,
          x: p.centroidX - textWidth / 2,
          y: p.centroidY - textHeight / 2,
          width: textWidth,
          height: textHeight,
          fontSize,
          // Priority: selected > larger area
          priority: p.id === selectedProvinceId ? 10000 : area,
        };
      });
    
    return filterOverlappingLabels(candidates);
  }, [provinces, zoom, selectedProvinceId]);

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

      {/* === ZOOM LEVEL: Province labels (filtered for overlaps) === */}
      {visibleProvinceLabels.map(p => (
        <g key={`lbl_${p.id}`}>
          {/* Text shadow */}
          <text x={p.centroidX} y={p.centroidY + (showDetails ? -2 : 0)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={p.fontSize} fill="hsl(var(--background))"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={p.id === selectedProvinceId ? 700 : 500}
            stroke="hsl(var(--background))" strokeWidth={1.5}
            opacity={0.7}>
            {p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name}
          </text>
          <text x={p.centroidX} y={p.centroidY + (showDetails ? -2 : 0)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={p.fontSize} fill="hsl(var(--foreground))"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight={p.id === selectedProvinceId ? 700 : 500}
            opacity={p.id === selectedProvinceId ? 1 : 0.8}>
            {p.name.length > 12 ? p.name.slice(0, 11) + '…' : p.name}
          </text>
        </g>
      ))}

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
