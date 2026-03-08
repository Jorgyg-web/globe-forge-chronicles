import { Province } from '@/types/game';

export interface ProvinceLayoutItem {
  province: Province;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function getProvinceLayout(
  provinces: Province[],
  pos: { x: number; y: number; w: number; h: number }
): ProvinceLayoutItem[] {
  const count = provinces.length;
  if (count === 0) return [];
  const cols = count <= 3 ? count : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const cellW = pos.w / cols;
  const cellH = pos.h / rows;
  return provinces.map((prov, i) => ({
    province: prov,
    x: pos.x + (i % cols) * cellW + 0.5,
    y: pos.y + Math.floor(i / cols) * cellH + 0.5,
    w: cellW - 1,
    h: cellH - 1,
  }));
}
