import { Province, TerrainType } from '@/types/game';

export type MapLayerMode = 'political' | 'terrain' | 'military' | 'economic' | 'resource';

export const MAP_LAYER_OPTIONS: { id: MapLayerMode; label: string }[] = [
  { id: 'political', label: 'Political' },
  { id: 'terrain', label: 'Terrain' },
  { id: 'military', label: 'Military' },
  { id: 'economic', label: 'Economic' },
  { id: 'resource', label: 'Resource' },
];

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  plains: 'hsl(90, 20%, 28%)',
  forest: 'hsl(140, 25%, 22%)',
  mountain: 'hsl(30, 15%, 32%)',
  desert: 'hsl(40, 35%, 35%)',
  jungle: 'hsl(120, 30%, 18%)',
  urban: 'hsl(220, 15%, 30%)',
  coastal: 'hsl(195, 30%, 30%)',
  arctic: 'hsl(200, 15%, 40%)',
};

export const TERRAIN_PATTERNS: Record<TerrainType, string> = {
  plains: '···',
  forest: '🌲',
  mountain: '⛰',
  desert: '🏜',
  jungle: '🌴',
  urban: '🏙',
  coastal: '🌊',
  arctic: '❄',
};

export interface TerrainRenderStyle {
  baseFill: string;
  shadingOpacity: number;
  overlayFill?: string;
  overlayOpacity?: number;
  patternId?: string;
  patternOpacity?: number;
}

export const TERRAIN_RENDER_STYLES: Record<TerrainType, TerrainRenderStyle> = {
  plains: {
    baseFill: 'hsl(88, 24%, 33%)',
    shadingOpacity: 0.12,
    patternId: 'terrain-plains-pattern',
    patternOpacity: 0.1,
  },
  forest: {
    baseFill: 'hsl(126, 26%, 24%)',
    shadingOpacity: 0.16,
    overlayFill: 'hsl(132, 46%, 34%)',
    overlayOpacity: 0.18,
    patternId: 'terrain-forest-pattern',
    patternOpacity: 0.18,
  },
  mountain: {
    baseFill: 'hsl(28, 10%, 25%)',
    shadingOpacity: 0.3,
    overlayFill: 'hsl(30, 12%, 18%)',
    overlayOpacity: 0.22,
    patternId: 'terrain-mountain-pattern',
    patternOpacity: 0.22,
  },
  desert: {
    baseFill: 'hsl(40, 46%, 40%)',
    shadingOpacity: 0.12,
    overlayFill: 'hsl(41, 62%, 62%)',
    overlayOpacity: 0.16,
    patternId: 'terrain-desert-pattern',
    patternOpacity: 0.28,
  },
  jungle: {
    baseFill: 'hsl(122, 34%, 20%)',
    shadingOpacity: 0.18,
    overlayFill: 'hsl(126, 44%, 28%)',
    overlayOpacity: 0.14,
    patternId: 'terrain-forest-pattern',
    patternOpacity: 0.14,
  },
  urban: {
    baseFill: 'hsl(220, 10%, 31%)',
    shadingOpacity: 0.1,
    patternId: 'terrain-urban-pattern',
    patternOpacity: 0.18,
  },
  coastal: {
    baseFill: 'hsl(193, 28%, 30%)',
    shadingOpacity: 0.12,
    overlayFill: 'hsl(190, 36%, 38%)',
    overlayOpacity: 0.12,
    patternId: 'terrain-coastal-pattern',
    patternOpacity: 0.14,
  },
  arctic: {
    baseFill: 'hsl(200, 20%, 42%)',
    shadingOpacity: 0.08,
    overlayFill: 'hsl(200, 24%, 76%)',
    overlayOpacity: 0.1,
    patternId: 'terrain-arctic-pattern',
    patternOpacity: 0.16,
  },
};

export function getEconomicScore(province: Pick<Province, 'development'> & { buildings: { length: number } }): number {
  return Math.min(1, Math.max(0, (province.development / 100) * 0.7 + province.buildings.length * 0.08));
}

export function getEconomicFill(province: Pick<Province, 'development'> & { buildings: { length: number } }): string {
  const economicScore = getEconomicScore(province);
  const lightness = 24 + economicScore * 28;
  return `hsl(190, 42%, ${lightness}%)`;
}

export function getResourceFill(province: Pick<Province, 'resourceProduction'>): string {
  const entries = Object.entries(province.resourceProduction) as [keyof Province['resourceProduction'], number][];
  const dominant = entries.reduce((best, current) => (current[1] > best[1] ? current : best), entries[0]);

  switch (dominant?.[0]) {
    case 'food':
      return 'hsl(98, 42%, 38%)';
    case 'steel':
      return 'hsl(214, 16%, 42%)';
    case 'oil':
      return 'hsl(24, 18%, 24%)';
    case 'rareMetals':
      return 'hsl(282, 32%, 40%)';
    case 'manpower':
      return 'hsl(12, 34%, 42%)';
    default:
      return 'hsl(90, 20%, 30%)';
  }
}

