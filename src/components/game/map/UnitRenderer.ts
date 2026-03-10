import { Army, Country } from '@/types/game';

import {
  ScreenSize,
  WorldViewport,
  boundsIntersectViewport,
  getBaseMapTransform,
  type CameraState,
} from './mapViewport';
import { MapLayerMode } from './mapConstants';

export interface UnitRenderArmy {
  army: Army;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  totalUnits: number;
  averageHealth: number;
  icon: string;
}

export interface UnitRenderBattle {
  provinceId: string;
  x: number;
  y: number;
}

export interface UnitRendererParams {
  armies: UnitRenderArmy[];
  battles: UnitRenderBattle[];
  countries: Record<string, Country>;
  playerCountryId: string;
  selectedArmyIds: string[];
  viewport: WorldViewport;
  camera: CameraState;
  containerSize: ScreenSize;
  mapLayer: MapLayerMode;
}

function setCanvasWorldTransform(
  ctx: CanvasRenderingContext2D,
  camera: CameraState,
  containerSize: ScreenSize,
  dpr: number,
): void {
  const { scale, offsetX, offsetY } = getBaseMapTransform(containerSize);
  const scaleFactor = scale * camera.zoom;
  const viewWidth = 800 / camera.zoom;
  const viewHeight = 450 / camera.zoom;
  const viewX = camera.centerX - viewWidth / 2;
  const viewY = camera.centerY - viewHeight / 2;

  ctx.setTransform(
    dpr * scaleFactor,
    0,
    0,
    dpr * scaleFactor,
    dpr * (offsetX - viewX * scaleFactor),
    dpr * (offsetY - viewY * scaleFactor),
  );
}

export class UnitRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private currentDpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create unit renderer context');
    }
    this.ctx = ctx;
  }

  resize(containerSize: ScreenSize, dpr: number): void {
    this.currentDpr = dpr;
    const width = Math.max(1, Math.round(containerSize.width * dpr));
    const height = Math.max(1, Math.round(containerSize.height * dpr));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  render({ armies, battles, countries, playerCountryId, selectedArmyIds, viewport, camera, containerSize, mapLayer }: UnitRendererParams): void {
    const ctx = this.ctx;
    const dpr = this.currentDpr;
    const militaryLayer = mapLayer === 'military';
    const showArmies = militaryLayer ? camera.zoom > 1.8 : camera.zoom > 3;
    const showMovement = militaryLayer ? camera.zoom > 1.8 : camera.zoom > 3;
    const badgeScale = militaryLayer ? 1.18 : 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, containerSize.width, containerSize.height);

    if (!showArmies && !showMovement && battles.length === 0) {
      return;
    }

    setCanvasWorldTransform(ctx, camera, containerSize, dpr);

    if (showMovement) {
      for (const entry of armies) {
        if (entry.targetX == null || entry.targetY == null) continue;

        const minX = Math.min(entry.x, entry.targetX);
        const minY = Math.min(entry.y, entry.targetY);
        const maxX = Math.max(entry.x, entry.targetX);
        const maxY = Math.max(entry.y, entry.targetY);
        if (!boundsIntersectViewport({ minX, minY, maxX, maxY }, viewport)) continue;

        const isPlayer = entry.army.countryId === playerCountryId;
        const isSelected = selectedArmyIds.includes(entry.army.id);
        const progress = entry.army.movementProgress ?? 0;
        const currentX = entry.x + (entry.targetX - entry.x) * progress;
        const currentY = entry.y + (entry.targetY - entry.y) * progress;
        const strokeColor = isPlayer ? 'rgba(250, 204, 21, 0.95)' : 'rgba(239, 68, 68, 0.92)';

        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = militaryLayer ? (isSelected ? 0.9 : 0.72) : isSelected ? 0.7 : 0.5;
        ctx.setLineDash([3.4, 2.2]);
        ctx.globalAlpha = militaryLayer ? 0.92 : 0.72;
        ctx.beginPath();
        ctx.moveTo(entry.x, entry.y);
        ctx.lineTo(entry.targetX, entry.targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        const angle = Math.atan2(entry.targetY - entry.y, entry.targetX - entry.x);
        ctx.translate(entry.targetX, entry.targetY);
        ctx.rotate(angle);
        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-2.6, 1.2);
        ctx.lineTo(-2.6, -1.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        this.drawArmyBadge(ctx, currentX, currentY, entry, countries, playerCountryId, isSelected, badgeScale, militaryLayer);
      }
    }

    if (showArmies) {
      for (const entry of armies) {
        if (entry.army.targetProvinceId) continue;
        if (!boundsIntersectViewport({ minX: entry.x, minY: entry.y, maxX: entry.x, maxY: entry.y }, viewport)) continue;
        const isSelected = selectedArmyIds.includes(entry.army.id);
        this.drawArmyBadge(ctx, entry.x, entry.y, entry, countries, playerCountryId, isSelected, badgeScale, militaryLayer);
      }
    }

    for (const battle of battles) {
      if (!boundsIntersectViewport({ minX: battle.x, minY: battle.y, maxX: battle.x, maxY: battle.y }, viewport)) continue;
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.beginPath();
      ctx.arc(battle.x, battle.y, militaryLayer ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${militaryLayer ? 8 : 6}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 244, 244, 0.95)';
      ctx.fillText('⚔', battle.x, battle.y + 0.2);
      ctx.restore();
    }
  }

  private drawArmyBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    entry: UnitRenderArmy,
    countries: Record<string, Country>,
    playerCountryId: string,
    isSelected: boolean,
    badgeScale: number,
    militaryLayer: boolean,
  ): void {
    const isPlayer = entry.army.countryId === playerCountryId;
    const countryColor = countries[entry.army.countryId]?.color ?? '#888';
    const width = 14 * badgeScale;
    const height = 9 * badgeScale;

    ctx.save();

    if (isSelected) {
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(x, y - 3, militaryLayer ? 10 : 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (isPlayer) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y - 3, militaryLayer ? 11 : 9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = isPlayer ? 'rgba(59, 130, 246, 0.96)' : countryColor;
    ctx.strokeStyle = isSelected ? 'rgba(244, 244, 245, 0.96)' : 'rgba(9, 12, 18, 0.75)';
    ctx.lineWidth = isSelected ? 0.8 : 0.4;
    this.roundRect(ctx, x - width / 2, y - 8 * badgeScale, width, height, 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = `${militaryLayer ? 5.2 : 4.5}px Segoe UI Emoji, Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    ctx.fillText(entry.icon, x - 2.7 * badgeScale, y - 3);

    ctx.font = `700 ${militaryLayer ? 4 : 3.5}px JetBrains Mono, monospace`;
    ctx.fillStyle = isPlayer ? 'rgba(248, 250, 252, 0.98)' : 'rgba(15, 23, 42, 0.98)';
    ctx.fillText(entry.totalUnits > 99 ? '99+' : String(entry.totalUnits), x + 3.6 * badgeScale, y - 3);

    ctx.fillStyle = 'rgba(12, 18, 28, 0.62)';
    this.roundRect(ctx, x - 6 * badgeScale, y + 1.5 * badgeScale, 12 * badgeScale, 1.4 * badgeScale, 0.7);
    ctx.fill();

    const healthFill = entry.averageHealth > 60 ? 'rgba(34, 197, 94, 0.92)' : entry.averageHealth > 30 ? 'rgba(250, 204, 21, 0.92)' : 'rgba(239, 68, 68, 0.92)';
    ctx.fillStyle = healthFill;
    this.roundRect(ctx, x - 6 * badgeScale, y + 1.5 * badgeScale, 12 * badgeScale * (entry.averageHealth / 100), 1.4 * badgeScale, 0.7);
    ctx.fill();

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}