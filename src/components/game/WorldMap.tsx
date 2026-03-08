import { useGame } from '@/context/GameContext';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { getProvincesForCountry } from '@/data/provinces';
import { Province } from '@/types/game';

const COUNTRY_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
  usa: { x: 80, y: 140, w: 120, h: 60 },
  can: { x: 90, y: 70, w: 130, h: 60 },
  mex: { x: 100, y: 210, w: 50, h: 40 },
  bra: { x: 220, y: 270, w: 80, h: 80 },
  gbr: { x: 370, y: 110, w: 20, h: 20 },
  fra: { x: 380, y: 145, w: 30, h: 25 },
  deu: { x: 405, y: 125, w: 25, h: 25 },
  ita: { x: 400, y: 155, w: 20, h: 30 },
  pol: { x: 425, y: 120, w: 25, h: 20 },
  tur: { x: 460, y: 155, w: 35, h: 20 },
  rus: { x: 450, y: 50, w: 200, h: 90 },
  chn: { x: 570, y: 140, w: 90, h: 60 },
  jpn: { x: 680, y: 140, w: 20, h: 35 },
  kor: { x: 660, y: 155, w: 15, h: 15 },
  ind: { x: 550, y: 200, w: 50, h: 50 },
  sau: { x: 480, y: 200, w: 40, h: 30 },
  irn: { x: 500, y: 175, w: 35, h: 30 },
  isr: { x: 465, y: 185, w: 8, h: 10 },
  egy: { x: 440, y: 200, w: 30, h: 30 },
  aus: { x: 620, y: 330, w: 90, h: 60 },
};

// Generate province sub-rects within the country bounds
function getProvinceLayout(provinces: Province[], countryPos: { x: number; y: number; w: number; h: number }) {
  const count = provinces.length;
  if (count === 0) return [];
  
  // Arrange in a grid pattern
  const cols = count <= 3 ? count : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const cellW = countryPos.w / cols;
  const cellH = countryPos.h / rows;
  
  return provinces.map((prov, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      province: prov,
      x: countryPos.x + col * cellW + 0.5,
      y: countryPos.y + row * cellH + 0.5,
      w: cellW - 1,
      h: cellH - 1,
    };
  });
}

const WorldMap = () => {
  const { state, selectedCountryId, setSelectedCountryId, selectedProvinceId, setSelectedProvinceId, setActivePanel } = useGame();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const showProvinces = zoom >= 1.8;

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(4, Math.max(0.5, prev + delta)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const handleProvinceClick = (provId: string, countryId: string) => {
    setSelectedCountryId(countryId);
    setSelectedProvinceId(provId);
    setActivePanel('province');
  };

  // Memoize province layouts for all countries
  const provinceLayouts = useMemo(() => {
    const layouts: Record<string, ReturnType<typeof getProvinceLayout>> = {};
    for (const cId of Object.keys(state.countries)) {
      const pos = COUNTRY_POSITIONS[cId];
      if (!pos) continue;
      const provs = getProvincesForCountry(state.provinces, cId);
      if (provs.length > 0) {
        layouts[cId] = getProvinceLayout(provs, pos);
      }
    }
    return layouts;
  }, [state.countries, state.provinces]);

  const hoveredData = hoveredCountry ? state.countries[hoveredCountry] : null;
  const hoveredProvData = hoveredProvince ? state.provinces[hoveredProvince] : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: 'hsl(var(--map-water))' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute inset-0 pointer-events-none z-10" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, hsl(var(--background) / 0.4) 100%)'
      }} />

      <svg
        viewBox="0 0 800 450"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transition: isPanning ? 'none' : 'transform 0.2s ease-out',
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="gridPattern" width="25" height="25" patternUnits="userSpaceOnUse">
            <line x1="25" y1="0" x2="25" y2="25" stroke="hsl(225, 18%, 16%)" strokeWidth="0.3" opacity="0.2" />
            <line x1="0" y1="25" x2="25" y2="25" stroke="hsl(225, 18%, 16%)" strokeWidth="0.3" opacity="0.2" />
          </pattern>
        </defs>

        <rect width="800" height="450" fill="url(#gridPattern)" />

        {/* Continent shapes */}
        <path d="M60,60 L220,50 L230,120 L210,200 L160,230 L120,210 L80,220 L50,180 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.25} />
        <path d="M160,240 L270,230 L290,280 L300,370 L260,400 L210,380 L180,320 L170,270 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.25} />
        <path d="M350,80 L460,70 L470,120 L460,170 L420,180 L380,170 L360,140 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.25} />
        <path d="M370,190 L480,180 L500,250 L490,350 L440,380 L390,350 L380,280 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.25} />
        <path d="M470,40 L720,30 L730,160 L700,200 L620,220 L540,260 L490,230 L470,170 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.25} />
        <path d="M610,310 L720,300 L730,370 L680,400 L620,390 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.25} />

        {/* Country markers */}
        {Object.values(state.countries).map(country => {
          const pos = COUNTRY_POSITIONS[country.id];
          if (!pos) return null;
          const isSelected = selectedCountryId === country.id;
          const isHovered = hoveredCountry === country.id;
          const isPlayer = country.id === state.playerCountryId;
          const isAtWar = state.wars.some(w => w.active && (w.attackers.includes(country.id) || w.defenders.includes(country.id)));
          const layout = provinceLayouts[country.id];

          return (
            <g key={country.id}>
              {/* Country selection glow */}
              {isSelected && (
                <rect x={pos.x - 3} y={pos.y - 3} width={pos.w + 6} height={pos.h + 6} rx={5}
                  fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity={0.3} filter="url(#glow)" />
              )}

              {/* Province sub-rects when zoomed */}
              {showProvinces && layout ? (
                <>
                  {/* Country background */}
                  <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={4}
                    fill={country.color} opacity={0.15}
                    stroke={isSelected ? 'hsl(var(--primary))' : isAtWar ? 'hsl(var(--danger))' : 'hsl(var(--map-border))'}
                    strokeWidth={isSelected ? 1.5 : 0.5} />
                  {layout.map(({ province: prov, x, y, w, h }) => {
                    const isProvSelected = selectedProvinceId === prov.id;
                    const isProvHovered = hoveredProvince === prov.id;
                    const devOpacity = 0.2 + (prov.development / 100) * 0.4;
                    return (
                      <g key={prov.id}
                        onClick={(e) => { e.stopPropagation(); handleProvinceClick(prov.id, country.id); }}
                        onMouseEnter={() => { setHoveredProvince(prov.id); setHoveredCountry(country.id); }}
                        onMouseLeave={() => { setHoveredProvince(null); setHoveredCountry(null); }}
                        className="cursor-pointer"
                      >
                        <rect x={x} y={y} width={w} height={h} rx={2}
                          fill={isProvSelected ? 'hsl(var(--primary))' : country.color}
                          opacity={isProvSelected ? 0.6 : isProvHovered ? 0.5 : devOpacity}
                          stroke={isProvSelected ? 'hsl(var(--primary))' : isProvHovered ? 'hsl(var(--foreground))' : 'hsl(var(--map-border))'}
                          strokeWidth={isProvSelected ? 1.5 : isProvHovered ? 0.8 : 0.3}
                          style={{ transition: 'all 0.15s ease' }} />
                        {w > 15 && h > 10 && (
                          <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="middle"
                            fontSize={Math.min(6, w / 5)} fill="hsl(var(--foreground))"
                            fontFamily="'JetBrains Mono', monospace" fontWeight={isProvSelected ? 700 : 400}
                            opacity={isProvHovered || isProvSelected ? 1 : 0.6}
                            style={{ pointerEvents: 'none' }}>
                            {prov.name.length > 8 ? prov.name.slice(0, 7) + '…' : prov.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </>
              ) : (
                /* Normal country rect when not zoomed enough */
                <g
                  onClick={(e) => { e.stopPropagation(); setSelectedCountryId(country.id); }}
                  onMouseEnter={() => setHoveredCountry(country.id)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  className="cursor-pointer"
                >
                  <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={4}
                    fill={isSelected ? 'hsl(var(--primary))' : isHovered ? 'hsl(var(--map-land-hover))' : country.color}
                    opacity={isSelected ? 0.5 : isHovered ? 0.65 : 0.35}
                    stroke={isSelected ? 'hsl(var(--primary))' : isAtWar ? 'hsl(var(--danger))' : isHovered ? 'hsl(var(--foreground))' : 'hsl(var(--map-border))'}
                    strokeWidth={isSelected ? 2 : isAtWar ? 1.5 : isHovered ? 1 : 0.5}
                    style={{ transition: 'all 0.2s ease' }} />
                  <text x={pos.x + pos.w / 2} y={pos.y + pos.h / 2 + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={pos.w < 25 ? 6 : 9} fill={isSelected || isHovered ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                    fontFamily="'JetBrains Mono', monospace" fontWeight={isSelected ? 700 : 500}
                    style={{ transition: 'fill 0.2s ease', pointerEvents: 'none' }}>
                    {country.code}
                  </text>
                </g>
              )}

              {/* Player indicator */}
              {isPlayer && (
                <>
                  <circle cx={pos.x + pos.w - 4} cy={pos.y + 4} r={3.5} fill="hsl(var(--primary))" opacity={0.9} />
                  <circle cx={pos.x + pos.w - 4} cy={pos.y + 4} r={1.5} fill="hsl(var(--primary-foreground))" />
                </>
              )}
              {isAtWar && (
                <circle cx={pos.x + 4} cy={pos.y + 4} r={3} fill="hsl(var(--danger))" className="animate-pulse-glow" />
              )}
            </g>
          );
        })}
      </svg>

      {/* Province tooltip */}
      {hoveredProvData && !isPanning && (
        <div className="map-tooltip absolute z-20 animate-fade-up"
          style={{
            left: `${mousePos.x - (containerRef.current?.getBoundingClientRect().left ?? 0) + 16}px`,
            top: `${mousePos.y - (containerRef.current?.getBoundingClientRect().top ?? 0) - 10}px`,
          }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-sm bg-primary" />
            <span className="font-semibold text-foreground text-xs">{hoveredProvData.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] font-mono">
            <span className="text-muted-foreground">Pop</span>
            <span className="text-foreground text-right">{(hoveredProvData.population / 1e6).toFixed(1)}M</span>
            <span className="text-muted-foreground">GDP</span>
            <span className="text-foreground text-right">${(hoveredProvData.gdpContribution / 1e3).toFixed(0)}B</span>
            <span className="text-muted-foreground">Dev</span>
            <span className="text-foreground text-right">{hoveredProvData.development}/100</span>
            <span className="text-muted-foreground">Stability</span>
            <span className="text-foreground text-right">{hoveredProvData.stability.toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Country tooltip (only when not showing province tooltip) */}
      {hoveredData && !hoveredProvData && !isPanning && (
        <div className="map-tooltip absolute z-20 animate-fade-up"
          style={{
            left: `${mousePos.x - (containerRef.current?.getBoundingClientRect().left ?? 0) + 16}px`,
            top: `${mousePos.y - (containerRef.current?.getBoundingClientRect().top ?? 0) - 10}px`,
          }}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: hoveredData.color }} />
            <span className="font-semibold text-foreground">{hoveredData.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] font-mono">
            <span className="text-muted-foreground">Pop</span>
            <span className="text-foreground text-right">{(hoveredData.population / 1e6).toFixed(1)}M</span>
            <span className="text-muted-foreground">GDP</span>
            <span className="text-foreground text-right">${(hoveredData.economy.gdp / 1e9).toFixed(0)}B</span>
            <span className="text-muted-foreground">Military</span>
            <span className="text-foreground text-right">{Object.values(hoveredData.military.units).reduce((s, v) => s + v, 0).toLocaleString()}</span>
            <span className="text-muted-foreground">Stability</span>
            <span className="text-foreground text-right">{hoveredData.stability.toFixed(0)}%</span>
          </div>
          {showProvinces && (
            <div className="mt-1 pt-1 border-t border-border/30 text-[9px] text-muted-foreground">
              Click provinces to manage
            </div>
          )}
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1">
        <button onClick={() => setZoom(prev => Math.min(4, prev + 0.3))}
          className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-200">
          <ZoomIn size={14} />
        </button>
        <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.3))}
          className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-200">
          <ZoomOut size={14} />
        </button>
        <button onClick={resetView}
          className="w-8 h-8 rounded-lg bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-200">
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Zoom level & province hint */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
        <span className="text-[10px] font-mono text-muted-foreground bg-card/60 backdrop-blur-sm px-2 py-1 rounded-md border border-border/50">
          {(zoom * 100).toFixed(0)}%
        </span>
        {!showProvinces && (
          <span className="text-[9px] text-muted-foreground/60 bg-card/40 backdrop-blur-sm px-2 py-1 rounded-md border border-border/30">
            Zoom in to see provinces
          </span>
        )}
      </div>
    </div>
  );
};

export default WorldMap;
