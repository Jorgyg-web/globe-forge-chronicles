/**
 * World Generator — Real Administrative Regions
 * 
 * Loads Natural Earth 50m Admin-1 GeoJSON to create provinces
 * with real names and borders (states, provinces, regions, etc.)
 */

import { Country, Province, Building, TerrainType, Resources } from '@/types/game';
import { Point, polygonArea, polygonCentroid } from './polygonUtils';
import { projectPoint, getDefaultProjectionConfig } from './projection';
import { updateProvinceGeometry, invalidateCentroidCache } from '@/data/provinceGeometry';

// ─── Country overrides (preserve gameplay stats for key countries) ─────
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

const COLOR_PALETTE = [
  '#5B8C5A', '#8B6C42', '#6A7B8B', '#9B6B6B', '#7B8D6A',
  '#6B7B9B', '#8B7B5B', '#5B7B6B', '#9B7B4B', '#6B6B8B',
  '#7B9B6B', '#8B5B6B', '#5B8B7B', '#9B6B5B', '#6B8B5B',
  '#7B6B8B', '#8B7B6B', '#5B6B8B', '#6B9B7B', '#8B6B7B',
  '#4A7A6A', '#7A5A5A', '#5A6A7A', '#7A7A4A', '#6A4A7A',
  '#4A7A5A', '#7A6A4A', '#5A7A7A', '#7A4A6A', '#6A7A4A',
];

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

function inferTerrain(lat: number, lng: number): TerrainType {
  if (lat > 65 || lat < -60) return 'arctic';
  if (lat > 15 && lat < 35 && lng > -20 && lng < 75) return 'desert';
  if (lat > 25 && lat < 38 && lng > -120 && lng < -100) return 'desert';
  if (lat < -18 && lat > -35 && lng > 115 && lng < 150) return 'desert';
  if (lat > 27 && lat < 40 && lng > 70 && lng < 100) return 'mountain';
  if (lat > 36 && lat < 48 && lng > 5 && lng < 18) return 'mountain';
  if (lat > -55 && lat < 10 && lng > -80 && lng < -64) return 'mountain';
  if (lat > 50 && lat < 66 && lng > 20 && lng < 180) return 'forest';
  if (lat > -10 && lat < 10 && lng > -80 && lng < -40) return 'forest';
  if (lat > -8 && lat < 10 && lng > 95 && lng < 145) return 'forest';
  if (lat > 45 && lat < 60 && lng > -140 && lng < -60) return 'forest';
  return 'plains';
}

function inferGovernment(name: string): Country['government']['type'] {
  const authoritarian = ['North Korea', 'Belarus', 'Syria', 'Eritrea', 'Turkmenistan', 'Myanmar', 'Cuba', 'Venezuela', 'Nicaragua', 'Laos', 'Vietnam', 'China'];
  const communist = ['China', 'Cuba', 'Vietnam', 'Laos', 'North Korea'];
  const monarchies = ['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Oman', 'Bahrain', 'Kuwait', 'Jordan', 'Morocco', 'Thailand', 'Brunei', 'Eswatini', 'Lesotho', 'Tonga', 'Bhutan'];
  if (communist.some(n => name.includes(n))) return 'communist';
  if (monarchies.some(n => name.includes(n))) return 'monarchy';
  if (authoritarian.some(n => name.includes(n))) return 'authoritarian';
  return 'democracy';
}

// ─── Extract all coordinate rings from a GeoJSON geometry ─────
function extractRings(geometry: any): number[][][] {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring: number[][]) => ring);
  }
  if (geometry.type === 'MultiPolygon') {
    const rings: number[][][] = [];
    for (const poly of geometry.coordinates) {
      // Only outer ring of each polygon part
      rings.push(poly[0]);
    }
    return rings;
  }
  return [];
}

function ringToSvgPathProjected(ring: number[][], cfg: ReturnType<typeof getDefaultProjectionConfig>): string {
  if (ring.length < 3) return '';
  const parts: string[] = [];
  for (let i = 0; i < ring.length; i++) {
    const { x, y } = projectPoint(ring[i][0], ring[i][1], cfg);
    parts.push(`${i === 0 ? 'M' : 'L'}${x},${y}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

export interface WorldData {
  countries: Country[];
  provinces: Province[];
  countryPaths: Record<string, string>;
}

/**
 * Load the Natural Earth Admin-1 dataset and generate countries + provinces.
 */
export async function generateWorld(): Promise<WorldData> {
  const response = await fetch('/data/ne_110m_admin_1.geojson');
  const geojson = await response.json();
  const cfg = getDefaultProjectionConfig();

  // Group features by country
  const countryFeatures: Record<string, any[]> = {};
  const countryMeta: Record<string, { name: string; continent: string; popEst: number }> = {};

  for (const feature of geojson.features) {
    const props = feature.properties;
    if (!props) continue;
    const isoA3 = props.adm0_a3 || props.sov_a3;
    if (!isoA3 || isoA3 === '-99') continue;

    const countryId = isoToGameId(isoA3);
    if (!countryFeatures[countryId]) {
      countryFeatures[countryId] = [];
      countryMeta[countryId] = {
        name: props.admin || isoA3,
        continent: '',
        popEst: 0,
      };
    }
    countryFeatures[countryId].push(feature);
  }

  // Also load the admin-0 dataset for continent info and base map paths
  let admin0Features: any[] = [];
  try {
    const resp0 = await fetch('/data/world-land.geojson');
    const geo0 = await resp0.json();
    admin0Features = geo0.features || [];
  } catch (e) {
    console.warn('[WorldGenerator] Could not load admin-0 dataset for continents');
  }

  // Build continent/population lookup from admin-0
  const admin0Info: Record<string, { continent: string; popEst: number }> = {};
  for (const f of admin0Features) {
    const props = f.properties;
    if (!props) continue;
    const iso = props.adm0_a3 || props.iso_a3 || props.sov_a3;
    if (!iso || iso === '-99') continue;
    const cid = isoToGameId(iso);
    admin0Info[cid] = {
      continent: props.continent || 'Unknown',
      popEst: props.pop_est || 1_000_000,
    };
  }

  // Merge continent info
  for (const cid of Object.keys(countryMeta)) {
    if (admin0Info[cid]) {
      countryMeta[cid].continent = admin0Info[cid].continent;
      countryMeta[cid].popEst = admin0Info[cid].popEst;
    }
    if (!countryMeta[cid].continent) countryMeta[cid].continent = 'Unknown';
    if (!countryMeta[cid].popEst) countryMeta[cid].popEst = 1_000_000;
  }

  const countries: Country[] = [];
  const provinces: Province[] = [];
  const countryPaths: Record<string, string> = {};
  let colorIdx = 0;

  for (const [countryId, features] of Object.entries(countryFeatures)) {
    const meta = countryMeta[countryId];
    const override = COUNTRY_OVERRIDES[countryId];

    // Create country
    const country = createCountry(countryId, meta.name, countryId.toUpperCase(), meta.continent, meta.popEst, override, colorIdx);
    countries.push(country);
    colorIdx++;

    // Create provinces from admin-1 features
    const allSvgParts: string[] = [];
    let provIdx = 0;

    for (const feature of features) {
      const props = feature.properties;
      const provName = props.name || props.name_en || `Region ${provIdx + 1}`;
      const lat = props.latitude || 0;
      const lng = props.longitude || 0;
      const terrain = inferTerrain(lat, lng);

      // Build SVG path from geometry
      const outerRings = extractRings(feature.geometry);
      if (outerRings.length === 0) continue;

      const svgParts: string[] = [];
      for (const ring of outerRings) {
        const path = ringToSvgPathProjected(ring, cfg);
        if (path) {
          svgParts.push(path);
          allSvgParts.push(path);
        }
      }
      const svgPath = svgParts.join(' ');
      if (!svgPath) continue;

      const provId = `${countryId}_${props.adm1_code || provIdx + 1}`;
      const provPop = Math.max(10000, Math.round(meta.popEst / Math.max(features.length, 1)));
      const isCoastal = props.type_en?.toLowerCase().includes('coast') || Math.random() < 0.3;

      const dev = 20 + Math.floor(Math.random() * 60);
      const buildings: Building[] = [];
      if (dev >= 30) buildings.push({ type: 'infrastructure', level: Math.min(3, Math.floor(dev / 25)) });
      if (dev >= 50) buildings.push({ type: 'industry', level: Math.min(3, Math.floor(dev / 30)) });

      provinces.push({
        id: provId,
        countryId,
        originalCountryId: countryId,
        name: provName,
        population: provPop,
        morale: 50 + Math.floor(Math.random() * 40),
        stability: 40 + Math.floor(Math.random() * 40),
        corruption: 5 + Math.floor(Math.random() * 30),
        resourceProduction: {
          food: terrain === 'plains' ? 30 : terrain === 'forest' ? 15 : 5,
          oil: terrain === 'desert' ? 20 : Math.random() > 0.7 ? 10 : 0,
          metal: terrain === 'mountain' ? 25 : Math.random() > 0.6 ? 10 : 0,
          electronics: dev > 60 ? 15 : 0,
          money: Math.floor(provPop / 100000) + dev * 2,
        },
        buildings,
        terrain,
        isCoastal,
        development: dev,
        adjacentProvinces: [],
        geometry: svgPath,
      });
      provIdx++;
    }

    countryPaths[countryId] = allSvgParts.join(' ');
  }

  // Compute adjacency using spatial hashing
  computeAdjacency(provinces);

  // Register geometries for centroid lookups
  for (const prov of provinces) {
    updateProvinceGeometry(prov.id, prov.geometry);
  }
  invalidateCentroidCache();

  console.log(`[WorldGenerator] Generated ${countries.length} countries, ${provinces.length} provinces (real ADM1 borders)`);

  return { countries, provinces, countryPaths };
}

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
      technology: { researched: override.startTech, activeResearch: [] },
      researchSlots: override.researchSlots,
      militaryMorale: 60 + Math.floor(Math.random() * 30),
    };
  }

  const popFactor = Math.log10(Math.max(population, 100000));
  return {
    id, name, code, continent,
    color: COLOR_PALETTE[colorIdx % COLOR_PALETTE.length],
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
      type: inferGovernment(name),
      corruption: 10 + Math.floor(Math.random() * 50),
      bureaucracyEfficiency: 30 + Math.floor(Math.random() * 50),
      policies: [],
    },
    technology: { researched: ['infantry_1'], activeResearch: [] },
    researchSlots: 1,
    militaryMorale: 50 + Math.floor(Math.random() * 30),
  };
}

// ─── Adjacency via spatial hashing ─────
function computeAdjacency(allProvinces: Province[]): void {
  const cellSize = 30;
  const grid: Record<string, Province[]> = {};

  for (const prov of allProvinces) {
    const c = getApproxCentroid(prov.geometry);
    const key = `${Math.floor(c[0] / cellSize)},${Math.floor(c[1] / cellSize)}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(prov);
  }

  for (const key of Object.keys(grid)) {
    const [gx, gy] = key.split(',').map(Number);
    const provs = grid[key];

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighbors = grid[`${gx + dx},${gy + dy}`];
        if (!neighbors) continue;

        for (const p1 of provs) {
          for (const p2 of neighbors) {
            if (p1.id >= p2.id) continue;
            if (p1.adjacentProvinces.includes(p2.id)) continue;

            const c1 = getApproxCentroid(p1.geometry);
            const c2 = getApproxCentroid(p2.geometry);
            const dist = Math.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2);

            const s1 = getApproxSize(p1.geometry);
            const s2 = getApproxSize(p2.geometry);
            const threshold = (s1 + s2) * 0.7;

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
  return ((Math.max(...xs) - Math.min(...xs)) + (Math.max(...ys) - Math.min(...ys))) / 2;
}

// ─── Cached world data ─────
let cachedWorldData: WorldData | null = null;
export function getCachedWorldData(): WorldData | null { return cachedWorldData; }
export function setCachedWorldData(data: WorldData): void { cachedWorldData = data; }
