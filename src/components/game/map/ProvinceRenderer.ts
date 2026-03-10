import { Province } from '@/types/game';

import {
  MapLayerMode,
  TERRAIN_COLORS,
  TERRAIN_RENDER_STYLES,
  getEconomicFill,
  getResourceFill,
} from './mapConstants';
import {
  computeViewportWorldBounds,
  ScreenSize,
  WorldViewport,
  boundsIntersectViewport,
  cameraToViewBox,
  getBaseMapTransform,
  type CameraState,
} from './mapViewport';

export interface ProvinceRenderData {
  id: string;
  countryId: string;
  geometry: string;
  terrain: Province['terrain'];
  ownerColor: string;
  isConquered: boolean;
  development: number;
  morale: number;
  buildingCount: number;
  resourceProduction: Province['resourceProduction'];
  centroidX: number;
  centroidY: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  boundsW: number;
  boundsH: number;
}

export interface ProvinceRendererParams {
  provinces: ProvinceRenderData[];
  troopCounts: Record<string, number>;
  mapLayer: MapLayerMode;
  camera: CameraState;
  containerSize: ScreenSize;
  showProvinceBorders: boolean;
  showDetails: boolean;
  selectedProvinceId: string | null;
  selectedCountryId: string | null;
  hoveredProvinceId: string | null;
  moveTargets: Set<string>;
}

interface ProvinceVisualStyle {
  baseFill: string;
  baseAlpha: number;
  borderColor: string;
  borderAlpha: number;
  borderWidth: number;
  ownerOverlayColor: string | null;
  ownerOverlayAlpha: number;
  militaryOverlayColor: string | null;
  militaryOverlayAlpha: number;
}

function setCanvasWorldTransform(
  ctx: CanvasRenderingContext2D,
  camera: CameraState,
  containerSize: ScreenSize,
  dpr: number,
): void {
  const { scale, offsetX, offsetY } = getBaseMapTransform(containerSize);
  const viewBox = cameraToViewBox(camera);
  const scaleFactor = scale * camera.zoom;

  ctx.setTransform(
    dpr * scaleFactor,
    0,
    0,
    dpr * scaleFactor,
    dpr * (offsetX - viewBox.x * scaleFactor),
    dpr * (offsetY - viewBox.y * scaleFactor),
  );
}

function screenPixelsToWorldUnits(
  pixels: number,
  camera: CameraState,
  containerSize: ScreenSize,
): number {
  const { scale } = getBaseMapTransform(containerSize);
  return pixels / Math.max(0.0001, scale * camera.zoom);
}

function getProvinceBorderPixels(mapLayer: MapLayerMode, zoom: number): number {
  switch (mapLayer) {
    case 'military':
      return Math.max(0.28, 0.9 - Math.log2(zoom + 1) * 0.18);
    case 'economic':
    case 'resource':
      return Math.max(0.24, 0.72 - Math.log2(zoom + 1) * 0.15);
    case 'political':
      return Math.max(0.22, 0.82 - Math.log2(zoom + 1) * 0.16);
    case 'terrain':
    default:
      return Math.max(0.2, 0.68 - Math.log2(zoom + 1) * 0.14);
  }
}

function getOverlayStrokePixels(kind: 'hover' | 'country' | 'move' | 'selected', zoom: number): number {
  switch (kind) {
    case 'hover':
      return Math.max(0.45, 1.35 - Math.log2(zoom + 1) * 0.22);
    case 'country':
      return Math.max(0.24, 0.8 - Math.log2(zoom + 1) * 0.18);
    case 'move':
      return Math.max(0.28, 0.95 - Math.log2(zoom + 1) * 0.18);
    case 'selected':
    default:
      return Math.max(0.34, 1.1 - Math.log2(zoom + 1) * 0.2);
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getProvinceVisualStyle(
  province: ProvinceRenderData,
  troopCount: number,
  mapLayer: MapLayerMode,
  showProvinceBorders: boolean,
): ProvinceVisualStyle {
  const terrainColor = TERRAIN_COLORS[province.terrain];
  const renderStyle = TERRAIN_RENDER_STYLES[province.terrain];
  const economicFill = getEconomicFill({
    development: province.development,
    buildings: { length: province.buildingCount },
  });
  const resourceFill = getResourceFill({ resourceProduction: province.resourceProduction });
  const militaryOverlayAlpha = clamp01(0.08 + Math.log10(troopCount + 1) * 0.16);

  switch (mapLayer) {
    case 'political':
      return {
        baseFill: province.ownerColor,
        baseAlpha: 0.88,
        borderColor: 'rgba(12, 18, 30, 0.88)',
        borderAlpha: showProvinceBorders ? 0.8 : 0,
        borderWidth: showProvinceBorders ? 0.34 : 0,
        ownerOverlayColor: province.isConquered ? province.ownerColor : null,
        ownerOverlayAlpha: province.isConquered ? 0.14 : 0,
        militaryOverlayColor: null,
        militaryOverlayAlpha: 0,
      };
    case 'economic':
      return {
        baseFill: economicFill,
        baseAlpha: 0.92,
        borderColor: 'rgba(8, 32, 42, 0.84)',
        borderAlpha: showProvinceBorders ? 0.62 : 0,
        borderWidth: showProvinceBorders ? 0.3 : 0,
        ownerOverlayColor: province.ownerColor,
        ownerOverlayAlpha: province.isConquered ? 0.12 : 0.06,
        militaryOverlayColor: null,
        militaryOverlayAlpha: 0,
      };
    case 'resource':
      return {
        baseFill: resourceFill,
        baseAlpha: 0.92,
        borderColor: 'rgba(18, 16, 28, 0.88)',
        borderAlpha: showProvinceBorders ? 0.64 : 0,
        borderWidth: showProvinceBorders ? 0.3 : 0,
        ownerOverlayColor: province.ownerColor,
        ownerOverlayAlpha: province.isConquered ? 0.12 : 0.05,
        militaryOverlayColor: null,
        militaryOverlayAlpha: 0,
      };
    case 'military':
      return {
        baseFill: province.ownerColor,
        baseAlpha: 0.42,
        borderColor: troopCount > 0 ? 'rgba(255, 107, 107, 0.96)' : 'rgba(20, 25, 36, 0.9)',
        borderAlpha: showProvinceBorders ? 0.82 : 0.4,
        borderWidth: troopCount > 0 ? 0.5 : 0.34,
        ownerOverlayColor: province.isConquered ? province.ownerColor : null,
        ownerOverlayAlpha: province.isConquered ? 0.15 : 0.08,
        militaryOverlayColor: troopCount > 0 ? 'rgba(255, 122, 69, 1)' : null,
        militaryOverlayAlpha,
      };
    case 'terrain':
    default:
      return {
        baseFill: renderStyle.baseFill ?? terrainColor,
        baseAlpha: 0.92,
        borderColor: 'rgba(16, 22, 34, 0.84)',
        borderAlpha: showProvinceBorders ? 0.68 : 0,
        borderWidth: showProvinceBorders ? 0.28 : 0,
        ownerOverlayColor: province.ownerColor,
        ownerOverlayAlpha: province.isConquered ? 0.12 : 0.08,
        militaryOverlayColor: null,
        militaryOverlayAlpha: 0,
      };
  }
}

function styleToSnapshot(style: ProvinceVisualStyle): string {
  return [
    style.baseFill,
    style.baseAlpha,
    style.borderColor,
    style.borderAlpha,
    style.borderWidth,
    style.ownerOverlayColor ?? '',
    style.ownerOverlayAlpha,
    style.militaryOverlayColor ?? '',
    style.militaryOverlayAlpha,
  ].join('|');
}

export class ProvinceRenderer {
  private readonly baseCanvas: HTMLCanvasElement;
  private readonly overlayCanvas: HTMLCanvasElement;
  private readonly baseCtx: CanvasRenderingContext2D;
  private readonly overlayCtx: CanvasRenderingContext2D;
  private readonly pathCache = new Map<string, Path2D>();
  private readonly provinceCache = new Map<string, ProvinceRenderData>();
  private readonly provinceStyles = new Map<string, ProvinceVisualStyle>();
  private readonly provinceSnapshots = new Map<string, string>();
  private currentDpr = 1;

  constructor(baseCanvas: HTMLCanvasElement, overlayCanvas: HTMLCanvasElement) {
    this.baseCanvas = baseCanvas;
    this.overlayCanvas = overlayCanvas;

    const baseCtx = baseCanvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!baseCtx || !overlayCtx) {
      throw new Error('Failed to create province renderer canvas contexts');
    }

    this.baseCtx = baseCtx;
    this.overlayCtx = overlayCtx;
  }

  resize(containerSize: ScreenSize, dpr: number): void {
    this.currentDpr = dpr;
    const width = Math.max(1, Math.round(containerSize.width * dpr));
    const height = Math.max(1, Math.round(containerSize.height * dpr));

    if (this.baseCanvas.width !== width || this.baseCanvas.height !== height) {
      this.baseCanvas.width = width;
      this.baseCanvas.height = height;
    }

    if (this.overlayCanvas.width !== width || this.overlayCanvas.height !== height) {
      this.overlayCanvas.width = width;
      this.overlayCanvas.height = height;
    }
  }

  render(params: ProvinceRendererParams): void {
    this.syncProvinceData(params.provinces);
    this.updateProvinceStyles(params.provinces, params.troopCounts, params.mapLayer, params.showProvinceBorders);
    this.renderBase(params);
    this.renderOverlay(params);
  }

  private syncProvinceData(provinces: ProvinceRenderData[]): void {
    const activeIds = new Set<string>();

    for (const province of provinces) {
      activeIds.add(province.id);
      this.provinceCache.set(province.id, province);
      if (!this.pathCache.has(province.id)) {
        this.pathCache.set(province.id, new Path2D(province.geometry));
      }
    }

    for (const id of Array.from(this.provinceCache.keys())) {
      if (!activeIds.has(id)) {
        this.provinceCache.delete(id);
        this.pathCache.delete(id);
        this.provinceStyles.delete(id);
        this.provinceSnapshots.delete(id);
      }
    }
  }

  private updateProvinceStyles(
    provinces: ProvinceRenderData[],
    troopCounts: Record<string, number>,
    mapLayer: MapLayerMode,
    showProvinceBorders: boolean,
  ): void {
    for (const province of provinces) {
      const style = getProvinceVisualStyle(province, troopCounts[province.id] ?? 0, mapLayer, showProvinceBorders);
      const snapshot = styleToSnapshot(style);

      if (this.provinceSnapshots.get(province.id) === snapshot) {
        continue;
      }

      this.provinceStyles.set(province.id, style);
      this.provinceSnapshots.set(province.id, snapshot);
    }
  }

  private renderBase({ provinces, camera, containerSize, mapLayer }: ProvinceRendererParams): void {
    const ctx = this.baseCtx;
    const dpr = this.currentDpr;
    const viewport: WorldViewport = computeViewportWorldBounds(camera, containerSize, 24);
    const visibleProvinces = provinces.filter(province => boundsIntersectViewport(province, viewport));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, containerSize.width, containerSize.height);
    setCanvasWorldTransform(ctx, camera, containerSize, dpr);

    for (const province of visibleProvinces) {
      const path = this.pathCache.get(province.id);
      const style = this.provinceStyles.get(province.id);
      if (!path || !style) continue;

      ctx.save();
      ctx.globalAlpha = style.baseAlpha;
      ctx.fillStyle = style.baseFill;
      ctx.fill(path, 'evenodd');

      if (style.ownerOverlayColor && style.ownerOverlayAlpha > 0) {
        ctx.globalAlpha = style.ownerOverlayAlpha;
        ctx.fillStyle = style.ownerOverlayColor;
        ctx.fill(path, 'evenodd');
      }

      if (style.militaryOverlayColor && style.militaryOverlayAlpha > 0) {
        ctx.globalAlpha = style.militaryOverlayAlpha;
        ctx.fillStyle = style.militaryOverlayColor;
        ctx.fill(path, 'evenodd');
      }

      if (style.borderWidth > 0 && style.borderAlpha > 0) {
        ctx.globalAlpha = style.borderAlpha;
        ctx.strokeStyle = style.borderColor;
        ctx.lineWidth = screenPixelsToWorldUnits(
          getProvinceBorderPixels(mapLayer, camera.zoom),
          camera,
          containerSize,
        );
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke(path);
      }

      ctx.restore();
    }
  }

  private renderOverlay({
    provinces,
    troopCounts,
    mapLayer,
    camera,
    containerSize,
    showDetails,
    selectedProvinceId,
    selectedCountryId,
    hoveredProvinceId,
    moveTargets,
  }: ProvinceRendererParams): void {
    const ctx = this.overlayCtx;
    const dpr = this.currentDpr;
    const viewport: WorldViewport = computeViewportWorldBounds(camera, containerSize, 24);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, containerSize.width, containerSize.height);
    setCanvasWorldTransform(ctx, camera, containerSize, dpr);

    const visibleProvinces = provinces.filter(province => boundsIntersectViewport(province, viewport));

    const hoveredProvince = hoveredProvinceId ? this.provinceCache.get(hoveredProvinceId) : null;
    if (hoveredProvince && hoveredProvince.id !== selectedProvinceId) {
      this.strokeProvince(
        ctx,
        hoveredProvince.id,
        'rgba(250, 204, 21, 0.98)',
        screenPixelsToWorldUnits(getOverlayStrokePixels('hover', camera.zoom), camera, containerSize),
      );
    }

    if (selectedCountryId) {
      for (const province of visibleProvinces) {
        if (province.countryId === selectedCountryId && province.id !== selectedProvinceId) {
          this.strokeProvince(
            ctx,
            province.id,
            'rgba(96, 165, 250, 0.54)',
            screenPixelsToWorldUnits(getOverlayStrokePixels('country', camera.zoom), camera, containerSize),
          );
        }
      }
    }

    for (const targetId of moveTargets) {
      const province = this.provinceCache.get(targetId);
      if (!province || !boundsIntersectViewport(province, viewport)) continue;

      const path = this.pathCache.get(targetId);
      if (!path) continue;

      ctx.save();
      ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.82)';
      ctx.lineWidth = screenPixelsToWorldUnits(getOverlayStrokePixels('move', camera.zoom), camera, containerSize);
      ctx.lineJoin = 'round';
      ctx.fill(path, 'evenodd');
      ctx.stroke(path);
      ctx.restore();
    }

    if (selectedProvinceId) {
      const province = this.provinceCache.get(selectedProvinceId);
      const path = province ? this.pathCache.get(selectedProvinceId) : null;
      const baseStyle = province ? this.provinceStyles.get(selectedProvinceId) : null;
      if (province && path) {
        ctx.save();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.14)';
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.92)';
        ctx.lineWidth = screenPixelsToWorldUnits(getOverlayStrokePixels('selected', camera.zoom), camera, containerSize);
        ctx.lineJoin = 'round';
        ctx.fill(path, 'evenodd');

        if (baseStyle && baseStyle.borderAlpha > 0) {
          ctx.globalAlpha = baseStyle.borderAlpha;
          ctx.strokeStyle = baseStyle.borderColor;
          ctx.lineWidth = screenPixelsToWorldUnits(
            getProvinceBorderPixels(mapLayer, camera.zoom),
            camera,
            containerSize,
          );
          ctx.stroke(path);
        }

        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.92)';
        ctx.lineWidth = screenPixelsToWorldUnits(getOverlayStrokePixels('selected', camera.zoom), camera, containerSize);
        ctx.stroke(path);
        ctx.restore();
      }
    }

    if (!showDetails) {
      return;
    }

    for (const province of visibleProvinces) {
      if (province.boundsW <= 10 || province.boundsH <= 8) continue;
      this.drawProvinceDetails(ctx, province, troopCounts[province.id] ?? 0, camera, containerSize);
    }
  }

  private strokeProvince(
    ctx: CanvasRenderingContext2D,
    provinceId: string,
    strokeStyle: string,
    lineWidth: number,
  ): void {
    const path = this.pathCache.get(provinceId);
    if (!path) return;

    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);
    ctx.restore();
  }

  private drawProvinceDetails(
    ctx: CanvasRenderingContext2D,
    province: ProvinceRenderData,
    troopCount: number,
    camera: CameraState,
    containerSize: ScreenSize,
  ): void {
    const { scale } = getBaseMapTransform(containerSize);
    const pixelsToWorld = 1 / Math.max(0.0001, scale * camera.zoom);
    const moraleBarWidth = Math.max(province.boundsW * 0.5, 18 * pixelsToWorld);
    const moraleBarHeight = Math.max(1.1 * pixelsToWorld, 2.8 * pixelsToWorld);
    const moraleX = province.centroidX;
    const moraleY = province.centroidY + province.boundsH * 0.15;

    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(moraleX - moraleBarWidth / 2, moraleY, moraleBarWidth, moraleBarHeight);

    ctx.fillStyle = province.morale > 60
      ? 'rgba(34, 197, 94, 0.9)'
      : province.morale > 30
        ? 'rgba(250, 204, 21, 0.9)'
        : 'rgba(239, 68, 68, 0.9)';
    ctx.fillRect(moraleX - moraleBarWidth / 2, moraleY, moraleBarWidth * (province.morale / 100), moraleBarHeight);

    ctx.font = `600 ${Math.max(7 * pixelsToWorld, 5.6 * pixelsToWorld)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (troopCount > 0) {
      const troopX = province.centroidX + province.boundsW * 0.25;
      const troopY = province.centroidY - province.boundsH * 0.15;
      ctx.fillStyle = 'rgba(10, 15, 22, 0.84)';
      ctx.beginPath();
      ctx.arc(troopX, troopY, 7 * pixelsToWorld, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(244, 244, 245, 0.96)';
      ctx.fillText(troopCount > 99 ? '99+' : String(troopCount), troopX, troopY);
    }

    if (province.buildingCount > 0) {
      const buildingX = province.centroidX - province.boundsW * 0.25;
      const buildingY = province.centroidY - province.boundsH * 0.15;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(232, 232, 236, 0.88)';
      ctx.fillText(`🏗${province.buildingCount}`, buildingX, buildingY);
    }

    ctx.restore();
  }
}
