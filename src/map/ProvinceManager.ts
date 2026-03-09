/**
 * ProvinceManager — Color-indexed province map system.
 *
 * Inspired by Paradox Interactive's province map approach:
 * each province is painted with a unique RGB color on an offscreen canvas.
 * Province detection is done via pixel lookup (screen → world → pixel → color → province ID).
 *
 * The manager:
 *  1. Assigns each province a unique RGB color
 *  2. Paints province polygons onto an offscreen canvas
 *  3. Caches the pixel data for O(1) province lookups
 *  4. Generates a highlight overlay canvas for selected/hovered provinces
 */

import { MAP_WORLD_WIDTH, MAP_WORLD_HEIGHT } from '@/components/game/map/mapViewport';

// ─── Types ──────────────────────────────────────────────────────────

export interface ProvinceColorEntry {
  id: string;
  name: string;
  countryId: string;
  r: number;
  g: number;
  b: number;
}

export interface ProvinceMapData {
  /** Province ID → color entry */
  provinces: Record<string, ProvinceColorEntry>;
  /** Packed RGB key (r<<16 | g<<8 | b) → province ID */
  colorToId: Map<number, string>;
}

export interface ProvinceHighlightConfig {
  selectedId?: string | null;
  hoveredId?: string | null;
  moveTargets?: Set<string>;
  selectedCountryId?: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────

/** Province map resolution. 2× the SVG world coordinate system for good detail. */
export const PROV_MAP_WIDTH = MAP_WORLD_WIDTH * 2;   // 1600
export const PROV_MAP_HEIGHT = MAP_WORLD_HEIGHT * 2;  // 900

/** Scale factor from SVG world coords → province map pixel coords */
export const PROV_SCALE_X = PROV_MAP_WIDTH / MAP_WORLD_WIDTH;
export const PROV_SCALE_Y = PROV_MAP_HEIGHT / MAP_WORLD_HEIGHT;

// ─── Color generation ───────────────────────────────────────────────

/**
 * Generate a unique RGB color for a province index.
 * Uses a deterministic scheme that avoids near-black colors (which
 * represent "no province" / ocean) and near-white.
 *
 * Spreads colors across the RGB cube using golden-ratio hashing.
 */
function indexToColor(index: number): [number, number, number] {
  const i = index + 1;
  const phi = 0.618033988749895;
  const r = Math.floor(((i * phi * 137.508) % 1) * 230) + 20;     // 20..249
  const g = Math.floor(((i * phi * 43.273) % 1) * 230) + 20;      // 20..249
  const b = Math.floor(((i * phi * 97.117) % 1) * 230) + 20;      // 20..249
  return [r, g, b];
}

/**
 * Pack RGB into a single 24-bit integer for fast Map lookups.
 */
export function packRGB(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

// ─── SVG path → Canvas drawing ──────────────────────────────────────

/**
 * Parse an SVG path d-string and draw it onto a CanvasRenderingContext2D.
 * Supports M, L, Z commands (which is all our province paths use).
 */
function drawSvgPathOnCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  pathData: string,
  scaleX: number,
  scaleY: number,
): void {
  const tokens = pathData.match(/[MLZmlz][^MLZmlz]*/g);
  if (!tokens) return;

  ctx.beginPath();
  for (const token of tokens) {
    const cmd = token[0];
    const coords = token.slice(1).trim();

    switch (cmd) {
      case 'M':
      case 'L': {
        const parts = coords.split(/[\s,]+/).map(Number);
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const x = parts[0] * scaleX;
          const y = parts[1] * scaleY;
          if (cmd === 'M') ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        break;
      }
      case 'Z':
      case 'z':
        ctx.closePath();
        break;
    }
  }
}

// ─── ProvinceManager ────────────────────────────────────────────────

let _instance: ProvinceManager | null = null;

export class ProvinceManager {
  private _canvas: OffscreenCanvas | HTMLCanvasElement;
  private _ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  private _pixelData: ImageData | null = null;
  private _data: ProvinceMapData;
  private _highlightCanvas: HTMLCanvasElement | null = null;
  private _highlightDataUrl: string = '';
  private _lastHighlightKey: string = '';

  private constructor() {
    if (typeof OffscreenCanvas !== 'undefined') {
      this._canvas = new OffscreenCanvas(PROV_MAP_WIDTH, PROV_MAP_HEIGHT);
    } else {
      this._canvas = document.createElement('canvas');
      this._canvas.width = PROV_MAP_WIDTH;
      this._canvas.height = PROV_MAP_HEIGHT;
    }
    this._ctx = this._canvas.getContext('2d')!;
    this._data = { provinces: {}, colorToId: new Map() };
  }

  static getInstance(): ProvinceManager {
    if (!_instance) {
      _instance = new ProvinceManager();
    }
    return _instance;
  }

  /** Reset for re-generation (e.g. new game). */
  static reset(): void {
    _instance = null;
  }

  // ─── Province registration ──────────────────────────────────────

  /**
   * Register all provinces and paint them onto the color map.
   * Call this once after world generation is complete.
   */
  buildFromProvinces(
    provinces: Array<{ id: string; name: string; countryId: string; geometry: string }>,
  ): void {
    const ctx = this._ctx;

    // Clear — (0,0,0,0) = transparent = no province
    ctx.clearRect(0, 0, PROV_MAP_WIDTH, PROV_MAP_HEIGHT);

    this._data = { provinces: {}, colorToId: new Map() };

    for (let i = 0; i < provinces.length; i++) {
      const prov = provinces[i];
      const [r, g, b] = indexToColor(i);
      let key = packRGB(r, g, b);

      // Handle color collisions (extremely rare but possible)
      if (this._data.colorToId.has(key)) {
        let gr = g;
        while (this._data.colorToId.has(packRGB(r, gr, b)) && gr < 255) gr++;
        key = packRGB(r, gr, b);
        this._data.colorToId.set(key, prov.id);
        this._data.provinces[prov.id] = { id: prov.id, name: prov.name, countryId: prov.countryId, r, g: gr, b };
      } else {
        this._data.colorToId.set(key, prov.id);
        this._data.provinces[prov.id] = { id: prov.id, name: prov.name, countryId: prov.countryId, r, g, b };
      }

      // Paint the province polygon with its unique color
      const entry = this._data.provinces[prov.id];
      ctx.fillStyle = `rgb(${entry.r},${entry.g},${entry.b})`;
      drawSvgPathOnCanvas(ctx, prov.geometry, PROV_SCALE_X, PROV_SCALE_Y);
      ctx.fill('evenodd');
    }

    // Cache pixel data for fast lookups
    this._pixelData = ctx.getImageData(0, 0, PROV_MAP_WIDTH, PROV_MAP_HEIGHT);
    this._lastHighlightKey = '';
  }

  // ─── Province lookup ────────────────────────────────────────────

  /**
   * Look up a province by world coordinates (SVG coordinate space).
   * Returns the province ID or null if the pixel is ocean/transparent.
   */
  getProvinceAtWorld(worldX: number, worldY: number): string | null {
    if (!this._pixelData) return null;

    const px = Math.floor(worldX * PROV_SCALE_X);
    const py = Math.floor(worldY * PROV_SCALE_Y);

    if (px < 0 || px >= PROV_MAP_WIDTH || py < 0 || py >= PROV_MAP_HEIGHT) return null;

    const idx = (py * PROV_MAP_WIDTH + px) * 4;
    const r = this._pixelData.data[idx];
    const g = this._pixelData.data[idx + 1];
    const b = this._pixelData.data[idx + 2];
    const a = this._pixelData.data[idx + 3];

    if (a < 128) return null;

    const key = packRGB(r, g, b);
    return this._data.colorToId.get(key) ?? null;
  }

  /**
   * Look up a province by screen coordinates.
   */
  getProvinceAtScreen(
    screenX: number,
    screenY: number,
    screenToWorldFn: (point: { x: number; y: number }) => { x: number; y: number },
  ): string | null {
    const world = screenToWorldFn({ x: screenX, y: screenY });
    return this.getProvinceAtWorld(world.x, world.y);
  }

  // ─── Province data access ───────────────────────────────────────

  getProvinceColor(id: string): ProvinceColorEntry | undefined {
    return this._data.provinces[id];
  }

  getAllProvinceIds(): string[] {
    return Object.keys(this._data.provinces);
  }

  getProvinceData(): ProvinceMapData {
    return this._data;
  }

  // ─── Highlight overlay ──────────────────────────────────────────

  /**
   * Generate a highlight overlay data URL for the given selection state.
   * Returns a data URL suitable for use as an SVG <image> href,
   * or empty string if no highlights are needed.
   */
  getHighlightOverlay(config: ProvinceHighlightConfig): string {
    const { selectedId, hoveredId, moveTargets, selectedCountryId } = config;
    const cacheKey = `${selectedId ?? ''}|${hoveredId ?? ''}|${selectedCountryId ?? ''}|${moveTargets ? [...moveTargets].sort().join(',') : ''}`;

    if (cacheKey === this._lastHighlightKey && this._highlightDataUrl) {
      return this._highlightDataUrl;
    }

    if (!selectedId && !hoveredId && (!moveTargets || moveTargets.size === 0) && !selectedCountryId) {
      this._lastHighlightKey = cacheKey;
      this._highlightDataUrl = '';
      return '';
    }

    if (!this._pixelData) return '';

    if (!this._highlightCanvas) {
      this._highlightCanvas = document.createElement('canvas');
      this._highlightCanvas.width = PROV_MAP_WIDTH;
      this._highlightCanvas.height = PROV_MAP_HEIGHT;
    }

    const ctx = this._highlightCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, PROV_MAP_WIDTH, PROV_MAP_HEIGHT);

    // Build color→highlight mapping
    const colorHighlights = new Map<number, string>();

    for (const [id, entry] of Object.entries(this._data.provinces)) {
      const key = packRGB(entry.r, entry.g, entry.b);

      if (id === selectedId) {
        colorHighlights.set(key, 'rgba(59, 130, 246, 0.35)');
      } else if (id === hoveredId) {
        colorHighlights.set(key, 'rgba(255, 255, 255, 0.15)');
      } else if (moveTargets?.has(id)) {
        colorHighlights.set(key, 'rgba(34, 197, 94, 0.25)');
      } else if (selectedCountryId && entry.countryId === selectedCountryId) {
        colorHighlights.set(key, 'rgba(250, 204, 21, 0.1)');
      }
    }

    if (colorHighlights.size === 0) {
      this._lastHighlightKey = cacheKey;
      this._highlightDataUrl = '';
      return '';
    }

    // Paint highlights by scanning the province pixel data
    const srcData = this._pixelData.data;
    const overlay = ctx.createImageData(PROV_MAP_WIDTH, PROV_MAP_HEIGHT);
    const dst = overlay.data;

    // Parse RGBA strings once
    const parsedHighlights = new Map<number, [number, number, number, number]>();
    for (const [key, rgba] of colorHighlights) {
      const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
      if (match) {
        parsedHighlights.set(key, [
          parseInt(match[1]),
          parseInt(match[2]),
          parseInt(match[3]),
          Math.round(parseFloat(match[4] ?? '1') * 255),
        ]);
      }
    }

    const totalPixels = PROV_MAP_WIDTH * PROV_MAP_HEIGHT;
    for (let i = 0; i < totalPixels; i++) {
      const si = i * 4;
      if (srcData[si + 3] < 128) continue;

      const key = packRGB(srcData[si], srcData[si + 1], srcData[si + 2]);
      const hl = parsedHighlights.get(key);
      if (hl) {
        dst[si] = hl[0];
        dst[si + 1] = hl[1];
        dst[si + 2] = hl[2];
        dst[si + 3] = hl[3];
      }
    }

    ctx.putImageData(overlay, 0, 0);
    this._highlightDataUrl = this._highlightCanvas.toDataURL('image/png');
    this._lastHighlightKey = cacheKey;
    return this._highlightDataUrl;
  }

  // ─── Province map image ─────────────────────────────────────────

  /** Get the province color map as a data URL (mostly for debugging). */
  getProvinceMapDataUrl(): string {
    if (this._canvas instanceof HTMLCanvasElement) {
      return this._canvas.toDataURL('image/png');
    }
    return '';
  }

  getPixelData(): ImageData | null {
    return this._pixelData;
  }

  getProvincesForCountry(countryId: string): string[] {
    return Object.values(this._data.provinces)
      .filter(p => p.countryId === countryId)
      .map(p => p.id);
  }
}

export default ProvinceManager;
