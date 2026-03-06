import { useGame } from '@/context/GameContext';
import { Country } from '@/types/game';

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

const WorldMap = () => {
  const { state, selectedCountryId, setSelectedCountryId } = useGame();

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'hsl(var(--map-water))' }}>
      <svg viewBox="0 0 800 450" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 25} x2={800} y2={i * 25} stroke="hsl(var(--border))" strokeWidth="0.3" opacity={0.3} />
        ))}
        {Array.from({ length: 32 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 25} y1={0} x2={i * 25} y2={450} stroke="hsl(var(--border))" strokeWidth="0.3" opacity={0.3} />
        ))}

        {/* Simplified continent shapes */}
        {/* North America */}
        <path d="M60,60 L220,50 L230,120 L210,200 L160,230 L120,210 L80,220 L50,180 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.3} />
        {/* South America */}
        <path d="M160,240 L270,230 L290,280 L300,370 L260,400 L210,380 L180,320 L170,270 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.3} />
        {/* Europe */}
        <path d="M350,80 L460,70 L470,120 L460,170 L420,180 L380,170 L360,140 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.3} />
        {/* Africa */}
        <path d="M370,190 L480,180 L500,250 L490,350 L440,380 L390,350 L380,280 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.3} />
        {/* Asia */}
        <path d="M470,40 L720,30 L730,160 L700,200 L620,220 L540,260 L490,230 L470,170 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.3} />
        {/* Australia */}
        <path d="M610,310 L720,300 L730,370 L680,400 L620,390 Z" fill="hsl(var(--map-land))" stroke="hsl(var(--map-border))" strokeWidth="0.5" opacity={0.3} />

        {/* Country markers */}
        {Object.values(state.countries).map(country => {
          const pos = COUNTRY_POSITIONS[country.id];
          if (!pos) return null;
          const isSelected = selectedCountryId === country.id;
          const isPlayer = country.id === state.playerCountryId;
          const isAtWar = state.wars.some(w => w.active && (w.attackers.includes(country.id) || w.defenders.includes(country.id)));

          return (
            <g key={country.id} onClick={() => setSelectedCountryId(country.id)} className="cursor-pointer">
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.w}
                height={pos.h}
                rx={3}
                fill={isSelected ? 'hsl(var(--map-land-selected))' : country.color}
                opacity={isSelected ? 0.6 : 0.4}
                stroke={isSelected ? 'hsl(var(--primary))' : isAtWar ? 'hsl(var(--danger))' : 'hsl(var(--map-border))'}
                strokeWidth={isSelected ? 2 : isAtWar ? 1.5 : 0.5}
                className="transition-all duration-200"
              />
              <text
                x={pos.x + pos.w / 2}
                y={pos.y + pos.h / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={pos.w < 25 ? 6 : 8}
                fill={isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight={isSelected ? 700 : 500}
              >
                {country.code}
              </text>
              {isPlayer && (
                <circle cx={pos.x + pos.w - 4} cy={pos.y + 4} r={3} fill="hsl(var(--primary))" />
              )}
              {isAtWar && (
                <circle cx={pos.x + 4} cy={pos.y + 4} r={3} fill="hsl(var(--danger))" className="animate-pulse-glow" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default WorldMap;
