/**
 * World Generator
 * 
 * Fetches Natural Earth GeoJSON, parses all countries,
 * subdivides each into provinces via polygon clipping,
 * and produces game-ready Country[] and Province[] arrays.
 */

import { Country, Province, Building, TerrainType, Resources } from '@/types/game';
import {
  Point,
  polygonArea,
  polygonCentroid,
  polygonBounds,
  subdividePolygon,
} from './polygonUtils';
import {
  projectPoint,
  getDefaultProjectionConfig,
  ringToSvgPath,
} from './projection';
import {
  updateProvinceGeometry,
  invalidateCentroidCache,
} from '@/data/provinceGeometry';

// ─── Existing country overrides (preserve gameplay stats for original 20) ─────
const COUNTRY_OVERRIDES: Record<string, Partial<Country> & { resources: Resources; startTech: string[]; govType: Country['government']['type']; researchSlots: number }> = {
  usa: { name: 'United States', color: '#4A90D9', population: 331_000_000, resources: { food: 2000, oil: 1000, metal: 800, electronics: 600, money: 20000 }, govType: 'democracy', researchSlots: 3, startTech: ['infantry_1', 'armor_1', 'aircraft_1', 'support_1', 'econ_1'] },
  chn: { name: 'China', color: '#DE3533', population: 1_400_000_000, resources: { food: 1500, oil: 600, metal: 1000, electronics: 500, money: 15000 }, govType: 'communist', researchSlots: 3, startTech: ['infantry_1', 'armor_1', 'aircraft_1', 'support_1', 'econ_1'] },
  rus: { name: 'Russia', color: '#5C7A29', population: 144_000_000, resources: { food: 800, oil: 1200, metal: 900, electronics: 200, money: 8000 }, govType: 'authoritarian', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'armor_2', 'support_1'] },
  gbr: { name: 'United Kingdom', color: '#2E5090', population: 67_000_000, resources: { food: 500, oil: 300, metal: 300, electronics: 400, money: 12000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'aircraft_1', 'econ_1'] },
  fra: { name: 'France', color: '#3B5998', population: 67_000_000, resources: { food: 600, oil: 200, metal: 300, electronics: 350, money: 11000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'aircraft_1', 'econ_1'] },
  deu: { name: 'Germany', color: '#555555', population: 83_000_000, resources: { food: 500, oil: 100, metal: 400, electronics: 500, money: 14000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'armor_2', 'econ_1', 'econ_2'] },
  jpn: { name: 'Japan', color: '#BC002D', population: 125_000_000, resources: { food: 300, oil: 50, metal: 200, electronics: 800, money: 16000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'aircraft_1', 'econ_1', 'econ_2'] },
  ind: { name: 'India', color: '#FF9933', population: 1_380_000_000, resources: { food: 1000, oil: 200, metal: 500, electronics: 200, money: 6000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'support_1'] },
  bra: { name: 'Brazil', color: '#009B3A', population: 212_000_000, resources: { food: 1200, oil: 300, metal: 400, electronics: 100, money: 5000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'econ_1'] },
  kor: { name: 'South Korea', color: '#003478', population: 52_000_000, resources: { food: 200, oil: 50, metal: 200, electronics: 600, money: 10000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'aircraft_1', 'econ_1'] },
  tur: { name: 'Turkey', color: '#C8102E', population: 84_000_000, resources: { food: 500, oil: 100, metal: 200, electronics: 80, money: 4000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'armor_1'] },
  sau: { name: 'Saudi Arabia', color: '#006C35', population: 35_000_000, resources: { food: 100, oil: 2000, metal: 100, electronics: 50, money: 15000 }, govType: 'monarchy', researchSlots: 1, startTech: ['infantry_1', 'aircraft_1'] },
  aus: { name: 'Australia', color: '#00843D', population: 25_000_000, resources: { food: 400, oil: 200, metal: 500, electronics: 200, money: 8000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'armor_1', 'econ_1'] },
  can: { name: 'Canada', color: '#FF0000', population: 38_000_000, resources: { food: 600, oil: 600, metal: 300, electronics: 200, money: 9000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'armor_1', 'econ_1'] },
  ita: { name: 'Italy', color: '#008C45', population: 60_000_000, resources: { food: 400, oil: 80, metal: 200, electronics: 250, money: 8000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'armor_1', 'econ_1'] },
  irn: { name: 'Iran', color: '#239F40', population: 85_000_000, resources: { food: 300, oil: 800, metal: 200, electronics: 50, money: 3000 }, govType: 'authoritarian', researchSlots: 1, startTech: ['infantry_1', 'support_1'] },
  egy: { name: 'Egypt', color: '#C09300', population: 104_000_000, resources: { food: 600, oil: 100, metal: 100, electronics: 30, money: 2000 }, govType: 'authoritarian', researchSlots: 1, startTech: ['infantry_1'] },
  isr: { name: 'Israel', color: '#0038B8', population: 9_000_000, resources: { food: 100, oil: 20, metal: 100, electronics: 300, money: 8000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'infantry_2', 'armor_1', 'armor_2', 'aircraft_1', 'support_1', 'support_2'] },
  pol: { name: 'Poland', color: '#DC143C', population: 38_000_000, resources: { food: 400, oil: 50, metal: 200, electronics: 100, money: 4000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'armor_1'] },
  mex: { name: 'Mexico', color: '#006847', population: 130_000_000, resources: { food: 500, oil: 200, metal: 150, electronics: 60, money: 3000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1'] },
};

// ─── Color palette for auto-generated countries ─────
const COLOR_PALETTE = [
  '#5B8C5A', '#8B6C42', '#6A7B8B', '#9B6B6B', '#7B8D6A',
  '#6B7B9B', '#8B7B5B', '#5B7B6B', '#9B7B4B', '#6B6B8B',
  '#7B9B6B', '#8B5B6B', '#5B8B7B', '#9B6B5B', '#6B8B5B',
  '#7B6B8B', '#8B7B6B', '#5B6B8B', '#6B9B7B', '#8B6B7B',
  '#4A7A6A', '#7A5A5A', '#5A6A7A', '#7A7A4A', '#6A4A7A',
  '#4A7A5A', '#7A6A4A', '#5A7A7A', '#7A4A6A', '#6A7A4A',
];

// ─── ISO A3 to game ID mapping ─────
// The GeoJSON uses ISO_A3 codes; some need special mapping
const ISO_REMAP: Record<string, string> = {
  'GBR': 'gbr', 'USA': 'usa', 'FRA': 'fra', 'DEU': 'deu',
  'RUS': 'rus', 'CHN': 'chn', 'JPN': 'jpn', 'IND': 'ind',
  'BRA': 'bra', 'KOR': 'kor', 'TUR': 'tur', 'SAU': 'sau',
  'AUS': 'aus', 'CAN': 'can', 'ITA': 'ita', 'IRN': 'irn',
  'EGY': 'egy', 'ISR': 'isr', 'POL': 'pol', 'MEX': 'mex',
};

function isoToGameId(iso: string): string {
  return ISO_REMAP[iso] ?? iso.toLowerCase();
}

// ─── Terrain inference from geographic coordinates ─────
function inferTerrain(lat: number, lng: number): TerrainType {
  if (lat > 65 || lat < -60) return 'arctic';
  // Desert belts
  if (lat > 15 && lat < 35 && lng > -20 && lng < 75) return 'desert'; // Sahara + Arabia + Iran
  if (lat > 25 && lat < 38 && lng > -120 && lng < -100) return 'desert'; // American SW
  if (lat < -18 && lat > -35 && lng > 115 && lng < 150) return 'desert'; // Australian interior
  // Mountains
  if (lat > 27 && lat < 40 && lng > 70 && lng < 100) return 'mountain'; // Himalayas
  if (lat > 36 && lat < 48 && lng > 5 && lng < 18) return 'mountain'; // Alps
  if (lat > -55 && lat < 10 && lng > -80 && lng < -64) return 'mountain'; // Andes
  // Forest
  if (lat > 50 && lat < 66 && lng > 20 && lng < 180) return 'forest'; // Taiga
  if (lat > -10 && lat < 10 && lng > -80 && lng < -40) return 'forest'; // Amazon
  if (lat > -8 && lat < 10 && lng > 95 && lng < 145) return 'forest'; // SE Asian rainforest
  if (lat > 45 && lat < 60 && lng > -140 && lng < -60) return 'forest'; // Canadian/N US forest
  return 'plains';
}

// ─── Government type inference ─────
function inferGovernment(name: string, continent: string): Country['government']['type'] {
  const authoritarian = ['North Korea', 'Belarus', 'Syria', 'Eritrea', 'Turkmenistan', 'Myanmar', 'Cuba', 'Venezuela', 'Nicaragua', 'Laos', 'Vietnam', 'China'];
  const communist = ['China', 'Cuba', 'Vietnam', 'Laos', 'North Korea'];
  const monarchies = ['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Oman', 'Bahrain', 'Kuwait', 'Jordan', 'Morocco', 'Thailand', 'Brunei', 'Eswatini', 'Lesotho', 'Tonga', 'Bhutan'];
  if (communist.some(n => name.includes(n))) return 'communist';
  if (monarchies.some(n => name.includes(n))) return 'monarchy';
  if (authoritarian.some(n => name.includes(n))) return 'authoritarian';
  return 'democracy';
}

// ─── Province count based on geographic area ─────
function targetProvinceCount(area: number): number {
  if (area < 2) return 1;
  if (area < 10) return 2;
  if (area < 50) return 3;
  if (area < 200) return Math.min(6, Math.max(3, Math.round(Math.sqrt(area) * 0.5)));
  if (area < 1000) return Math.min(15, Math.round(Math.sqrt(area) * 0.5));
  return Math.min(40, Math.round(Math.sqrt(area) * 0.5));
}

// ─── Grid dimensions for target province count ─────
function gridDimensions(target: number, bounds: { minX: number; minY: number; maxX: number; maxY: number }): { rows: number; cols: number } {
  const w = bounds.maxX - bounds.minX;
  const h = bounds.maxY - bounds.minY;
  if (target <= 1) return { rows: 1, cols: 1 };
  const aspect = w / Math.max(h, 0.01);
  let cols = Math.max(1, Math.round(Math.sqrt(target * aspect)));
  let rows = Math.max(1, Math.round(target / cols));
  // Adjust to get closer to target
  while (rows * cols < target && (rows < 20 && cols < 20)) {
    if (rows <= cols) rows++;
    else cols++;
  }
  return { rows, cols };
}

// ─── Extract rings from GeoJSON geometry ─────
function extractRings(geometry: any): Point[][] {
  if (geometry.type === 'Polygon') {
    return [geometry.coordinates[0].map((c: number[]) => [c[0], c[1]] as Point)];
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((poly: number[][][]) =>
      poly[0].map((c: number[]) => [c[0], c[1]] as Point)
    );
  }
  return [];
}

export interface WorldData {
  countries: Country[];
  provinces: Province[];
  countryPaths: Record<string, string>; // countryId → combined SVG path for base map
}

/**
 * Load and generate the full world from a Natural Earth GeoJSON file.
 */
export async function generateWorld(geojsonUrl: string = '/data/world-land.geojson'): Promise<WorldData> {
  const response = await fetch(geojsonUrl);
  const geojson = await response.json();
  const cfg = getDefaultProjectionConfig();

  const countries: Country[] = [];
  const provinces: Province[] = [];
  const countryPaths: Record<string, string> = {};
  let colorIdx = 0;

  for (const feature of geojson.features) {
    const props = feature.properties;
    const isoA3 = props.adm0_a3 || props.iso_a3 || props.sov_a3;
    if (!isoA3 || isoA3 === '-99') continue;

    const countryId = isoToGameId(isoA3);
    const countryName = props.name || props.admin || isoA3;
    const continent = props.continent || 'Unknown';
    const popEst = props.pop_est || 1_000_000;

    // Skip if already processed (duplicates in dataset)
    if (countries.find(c => c.id === countryId)) continue;

    // Extract polygon rings from geometry
    const rings = extractRings(feature.geometry);
    if (rings.length === 0) continue;

    // Generate SVG path for this country (base map layer)
    const svgParts: string[] = [];
    for (const ring of rings) {
      const projected = ring.map(([lng, lat]) => {
        const { x, y } = projectPoint(lng, lat, cfg);
        return [x, y] as Point;
      });
      if (projected.length >= 3) {
        svgParts.push(
          projected.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z'
        );
      }
    }
    countryPaths[countryId] = svgParts.join(' ');

    // Determine country stats
    const override = COUNTRY_OVERRIDES[countryId];
    const country = createCountry(countryId, countryName, isoA3, continent, popEst, override, colorIdx);
    countries.push(country);
    colorIdx++;

    // Calculate total geographic area for province count
    let totalArea = 0;
    for (const ring of rings) {
      totalArea += polygonArea(ring);
    }

    const target = targetProvinceCount(totalArea);

    // Generate provinces for this country
    const countryProvinces = generateProvinces(countryId, countryName, rings, target, popEst, cfg);
    provinces.push(...countryProvinces);
  }

  // Compute cross-country adjacency
  computeAdjacency(provinces);

  // Register all province geometries
  for (const prov of provinces) {
    updateProvinceGeometry(prov.id, prov.geometry);
  }
  invalidateCentroidCache();

  console.log(`[WorldGenerator] Generated ${countries.length} countries, ${provinces.length} provinces`);

  return { countries, provinces, countryPaths };
}

// ─── Create a Country object ─────
function createCountry(
  id: string, name: string, code: string, continent: string,
  population: number, override: typeof COUNTRY_OVERRIDES[string] | undefined,
  colorIdx: number
): Country {
  if (override) {
    return {
      id,
      name: override.name ?? name,
      code,
      continent,
      color: override.color ?? COLOR_PALETTE[colorIdx % COLOR_PALETTE.length],
      isPlayerControlled: false,
      population: override.population ?? population,
      stability: 60 + Math.floor(Math.random() * 30),
      approval: 50 + Math.floor(Math.random() * 30),
      resources: { ...override.resources },
      resourceIncome: { food: 0, oil: 0, metal: 0, electronics: 0, money: 0 },
      diplomacy: { relations: {}, embargoes: [] },
      government: {
        type: override.govType,
        corruption: 10 + Math.floor(Math.random() * 40),
        bureaucracyEfficiency: 40 + Math.floor(Math.random() * 40),
        policies: [],
      },
      technology: {
        researched: override.startTech,
        activeResearch: [],
      },
      researchSlots: override.researchSlots,
      militaryMorale: 60 + Math.floor(Math.random() * 30),
    };
  }

  // Auto-generate stats for non-override countries
  const popFactor = Math.log10(Math.max(population, 100000));
  return {
    id, name, code, continent, color: COLOR_PALETTE[colorIdx % COLOR_PALETTE.length],
    isPlayerControlled: false,
    population,
    stability: 40 + Math.floor(Math.random() * 40),
    approval: 40 + Math.floor(Math.random() * 30),
    resources: {
      food: Math.round(50 * popFactor),
      oil: Math.round(20 * popFactor * Math.random()),
      metal: Math.round(30 * popFactor * Math.random()),
      electronics: Math.round(10 * popFactor * Math.random()),
      money: Math.round(200 * popFactor),
    },
    resourceIncome: { food: 0, oil: 0, metal: 0, electronics: 0, money: 0 },
    diplomacy: { relations: {}, embargoes: [] },
    government: {
      type: inferGovernment(name, continent),
      corruption: 10 + Math.floor(Math.random() * 50),
      bureaucracyEfficiency: 30 + Math.floor(Math.random() * 50),
      policies: [],
    },
    technology: {
      researched: ['infantry_1'],
      activeResearch: [],
    },
    researchSlots: 1,
    militaryMorale: 50 + Math.floor(Math.random() * 30),
  };
}

// ─── Generate provinces for a country via polygon subdivision ─────
function generateProvinces(
  countryId: string,
  countryName: string,
  rings: Point[][],
  target: number,
  totalPop: number,
  cfg: ReturnType<typeof getDefaultProjectionConfig>
): Province[] {
  const provinces: Province[] = [];

  if (target <= 1) {
    // Single province = entire country
    const svgParts: string[] = [];
    for (const ring of rings) {
      svgParts.push(ringToSvgPath(ring.map(p => [p[0], p[1]]), cfg));
    }
    const combinedPath = svgParts.filter(s => s).join(' ');
    const centroid = polygonCentroid(rings[0]);
    const terrain = inferTerrain(centroid[1], centroid[0]);

    provinces.push(makeProvince(
      `${countryId}_1`, countryName, countryId,
      totalPop, terrain, combinedPath, centroid
    ));
    return provinces;
  }

  // Distribute target across rings proportional to area
  const ringAreas = rings.map(r => polygonArea(r));
  const totalArea = ringAreas.reduce((s, a) => s + a, 0);

  let provIdx = 1;
  for (let ri = 0; ri < rings.length; ri++) {
    const ring = rings[ri];
    const fraction = totalArea > 0 ? ringAreas[ri] / totalArea : 1 / rings.length;
    const ringTarget = Math.max(1, Math.round(target * fraction));
    const bounds = polygonBounds(ring);
    const { rows, cols } = gridDimensions(ringTarget, bounds);

    const cells = subdividePolygon(ring, rows, cols, bounds);

    for (const cell of cells) {
      const centroid = polygonCentroid(cell.polygon);
      const terrain = inferTerrain(centroid[1], centroid[0]);
      const provPop = Math.round((totalPop * fraction) / Math.max(cells.length, 1));

      // Project polygon to SVG coordinates
      const projected = cell.polygon.map(([lng, lat]) => {
        const { x, y } = projectPoint(lng, lat, cfg);
        return [x, y] as [number, number];
      });
      const svgPath = projected.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + ' Z';

      const provId = `${countryId}_${provIdx}`;
      const provName = generateProvinceName(countryName, provIdx, cells.length, cell.row, cell.col, rows, cols);

      provinces.push(makeProvince(provId, provName, countryId, provPop, terrain, svgPath, centroid));
      provIdx++;
    }
  }

  // Compute within-country adjacency based on grid position
  // Provinces from subdividePolygon carry row/col info via their index
  computeIntraCountryAdjacency(provinces);

  return provinces;
}

function makeProvince(
  id: string, name: string, countryId: string,
  population: number, terrain: TerrainType, geometry: string,
  geoCenter: Point
): Province {
  const dev = 20 + Math.floor(Math.random() * 60);
  const isCoastal = Math.random() < 0.3; // Simplified heuristic
  const buildings: Building[] = [];
  if (dev >= 30) buildings.push({ type: 'infrastructure', level: Math.min(3, Math.floor(dev / 25)) });
  if (dev >= 50) buildings.push({ type: 'industry', level: Math.min(3, Math.floor(dev / 30)) });

  return {
    id,
    countryId,
    originalCountryId: countryId,
    name,
    population,
    morale: 50 + Math.floor(Math.random() * 40),
    stability: 40 + Math.floor(Math.random() * 40),
    corruption: 5 + Math.floor(Math.random() * 30),
    resourceProduction: {
      food: terrain === 'plains' ? 30 : terrain === 'forest' ? 15 : 5,
      oil: terrain === 'desert' ? 20 : Math.random() > 0.7 ? 10 : 0,
      metal: terrain === 'mountain' ? 25 : Math.random() > 0.6 ? 10 : 0,
      electronics: dev > 60 ? 15 : 0,
      money: Math.floor(population / 100000) + dev * 2,
    },
    buildings,
    terrain,
    isCoastal,
    development: dev,
    adjacentProvinces: [], // Computed later
    geometry,
  };
}

function generateProvinceName(
  countryName: string, idx: number, total: number,
  row: number, col: number, rows: number, cols: number
): string {
  if (total === 1) return countryName;

  // Cardinal direction based on grid position
  const vPos = rows <= 1 ? '' : row < rows / 3 ? 'North' : row >= rows * 2 / 3 ? 'South' : 'Central';
  const hPos = cols <= 1 ? '' : col < cols / 3 ? 'West' : col >= cols * 2 / 3 ? 'East' : '';

  const dir = [vPos, hPos].filter(Boolean).join(' ') || `Region ${idx}`;
  return `${dir} ${countryName}`.trim();
}

// ─── Adjacency computation ─────
function computeIntraCountryAdjacency(provinces: Province[]): void {
  // Simple approach: provinces are adjacent if their centroids are close
  // relative to the average province size
  if (provinces.length <= 1) return;

  for (let i = 0; i < provinces.length; i++) {
    for (let j = i + 1; j < provinces.length; j++) {
      const ci = getApproxCentroid(provinces[i].geometry);
      const cj = getApproxCentroid(provinces[j].geometry);
      const dist = Math.sqrt((ci[0] - cj[0]) ** 2 + (ci[1] - cj[1]) ** 2);

      // Threshold: adjacent if centroids are within reasonable distance
      const si = getApproxSize(provinces[i].geometry);
      const sj = getApproxSize(provinces[j].geometry);
      const threshold = (si + sj) * 0.8;

      if (dist < threshold) {
        provinces[i].adjacentProvinces.push(provinces[j].id);
        provinces[j].adjacentProvinces.push(provinces[i].id);
      }
    }
  }
}

function computeAdjacency(allProvinces: Province[]): void {
  // Cross-country adjacency: check all provinces from different countries
  // Use spatial hashing to avoid O(n²) for large province counts
  const cellSize = 30; // SVG coordinate units
  const grid: Record<string, Province[]> = {};

  for (const prov of allProvinces) {
    const c = getApproxCentroid(prov.geometry);
    const key = `${Math.floor(c[0] / cellSize)},${Math.floor(c[1] / cellSize)}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(prov);
  }

  // For each cell, check against neighbors
  for (const key of Object.keys(grid)) {
    const [gx, gy] = key.split(',').map(Number);
    const provs = grid[key];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborKey = `${gx + dx},${gy + dy}`;
        const neighbors = grid[neighborKey];
        if (!neighbors) continue;

        for (const p1 of provs) {
          for (const p2 of neighbors) {
            if (p1.id === p2.id) continue;
            if (p1.countryId === p2.countryId) continue; // Already handled
            if (p1.adjacentProvinces.includes(p2.id)) continue;

            const c1 = getApproxCentroid(p1.geometry);
            const c2 = getApproxCentroid(p2.geometry);
            const dist = Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2);

            const s1 = getApproxSize(p1.geometry);
            const s2 = getApproxSize(p2.geometry);
            const threshold = (s1 + s2) * 0.6;

            if (dist < threshold) {
              p1.adjacentProvinces.push(p2.id);
              p2.adjacentProvinces.push(p1.id);
            }
          }
        }
      }
    }
  }
}

// Helper to get approximate centroid from SVG path
function getApproxCentroid(svgPath: string): [number, number] {
  const coords: [number, number][] = [];
  const regex = /[ML]\s*([\d.]+)[,\s]+([\d.]+)/gi;
  let match;
  while ((match = regex.exec(svgPath)) !== null) {
    coords.push([parseFloat(match[1]), parseFloat(match[2])]);
  }
  if (coords.length === 0) return [400, 225];
  const x = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const y = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  return [x, y];
}

// Helper to get approximate size (average of width/height)
function getApproxSize(svgPath: string): number {
  const coords: [number, number][] = [];
  const regex = /[ML]\s*([\d.]+)[,\s]+([\d.]+)/gi;
  let match;
  while ((match = regex.exec(svgPath)) !== null) {
    coords.push([parseFloat(match[1]), parseFloat(match[2])]);
  }
  if (coords.length === 0) return 20;
  const xs = coords.map(c => c[0]);
  const ys = coords.map(c => c[1]);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  return (w + h) / 2;
}

// ─── Cached world data for BaseMapLayer ─────
let cachedWorldData: WorldData | null = null;

export function getCachedWorldData(): WorldData | null {
  return cachedWorldData;
}

export function setCachedWorldData(data: WorldData): void {
  cachedWorldData = data;
}
