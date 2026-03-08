import { TerrainType } from '@/types/game';

export const COUNTRY_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
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

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  plains: 'hsl(90, 20%, 28%)',
  forest: 'hsl(140, 25%, 22%)',
  mountain: 'hsl(30, 15%, 32%)',
  desert: 'hsl(40, 35%, 35%)',
  urban: 'hsl(220, 15%, 30%)',
  coastal: 'hsl(195, 30%, 30%)',
  arctic: 'hsl(200, 15%, 40%)',
};

export const TERRAIN_PATTERNS: Record<TerrainType, string> = {
  plains: '···',
  forest: '🌲',
  mountain: '⛰',
  desert: '🏜',
  urban: '🏙',
  coastal: '🌊',
  arctic: '❄',
};

