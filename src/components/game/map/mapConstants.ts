import { TerrainType } from '@/types/game';

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

