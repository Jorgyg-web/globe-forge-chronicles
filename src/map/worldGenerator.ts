/**
 * World Generator — Hybrid: Admin-0 countries + Admin-1 for USA
 * 
 * Uses world-land.geojson (admin-0) for all countries.
 * Uses ne_110m_admin_1 for US states subdivision.
 * Each non-US country = 1 province (the country itself).
 */

import { Country, Province, Building, TerrainType, Resources, TERRAIN_RESOURCES } from '@/types/game';
import { randomFromKey, randomIntFromKey } from '@/lib/deterministicRandom';
import { geometryCentroid, normalizeGeometry } from './geometryValidator';
import { getDefaultProjectionConfig, normalizedGeometryToSvgPath } from './projection';
import { updateProvinceGeometry, invalidateCentroidCache } from '@/data/provinceGeometry';

// ─── Country overrides (preserve gameplay stats for key countries) ─────
const COUNTRY_OVERRIDES: Record<string, Partial<Country> & { resources: Resources; startTech: string[]; govType: Country['government']['type']; researchSlots: number }> = {
  usa: { name: 'United States', color: '#4A90D9', population: 331_000_000, resources: { food: 2000, steel: 800, oil: 1000, rareMetals: 600, manpower: 20000 }, govType: 'democracy', researchSlots: 3, startTech: ['infantry_1', 'armor_1', 'aircraft_1', 'support_1', 'econ_1'] },
  chn: { name: 'China', color: '#DE3533', population: 1_400_000_000, resources: { food: 1500, steel: 1000, oil: 600, rareMetals: 500, manpower: 15000 }, govType: 'communist', researchSlots: 3, startTech: ['infantry_1', 'armor_1', 'aircraft_1', 'support_1', 'econ_1'] },
  rus: { name: 'Russia', color: '#5C7A29', population: 144_000_000, resources: { food: 800, steel: 900, oil: 1200, rareMetals: 200, manpower: 8000 }, govType: 'authoritarian', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'armor_2', 'support_1'] },
  gbr: { name: 'United Kingdom', color: '#2E5090', population: 67_000_000, resources: { food: 500, steel: 300, oil: 300, rareMetals: 400, manpower: 12000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'aircraft_1', 'econ_1'] },
  fra: { name: 'France', color: '#3B5998', population: 67_000_000, resources: { food: 600, steel: 300, oil: 200, rareMetals: 350, manpower: 11000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'aircraft_1', 'econ_1'] },
  deu: { name: 'Germany', color: '#555555', population: 83_000_000, resources: { food: 500, steel: 400, oil: 100, rareMetals: 500, manpower: 14000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'armor_2', 'econ_1', 'econ_2'] },
  jpn: { name: 'Japan', color: '#BC002D', population: 125_000_000, resources: { food: 300, steel: 200, oil: 50, rareMetals: 800, manpower: 16000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'aircraft_1', 'econ_1', 'econ_2'] },
  ind: { name: 'India', color: '#FF9933', population: 1_380_000_000, resources: { food: 1000, steel: 500, oil: 200, rareMetals: 200, manpower: 6000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'support_1'] },
  bra: { name: 'Brazil', color: '#009B3A', population: 212_000_000, resources: { food: 1200, steel: 400, oil: 300, rareMetals: 100, manpower: 5000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'econ_1'] },
  kor: { name: 'South Korea', color: '#003478', population: 52_000_000, resources: { food: 200, steel: 200, oil: 50, rareMetals: 600, manpower: 10000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'armor_1', 'aircraft_1', 'econ_1'] },
  tur: { name: 'Turkey', color: '#C8102E', population: 84_000_000, resources: { food: 500, steel: 200, oil: 100, rareMetals: 80, manpower: 4000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'armor_1'] },
  sau: { name: 'Saudi Arabia', color: '#006C35', population: 35_000_000, resources: { food: 100, steel: 100, oil: 2000, rareMetals: 50, manpower: 15000 }, govType: 'monarchy', researchSlots: 1, startTech: ['infantry_1', 'aircraft_1'] },
  aus: { name: 'Australia', color: '#00843D', population: 25_000_000, resources: { food: 400, steel: 500, oil: 200, rareMetals: 200, manpower: 8000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'armor_1', 'econ_1'] },
  can: { name: 'Canada', color: '#FF0000', population: 38_000_000, resources: { food: 600, steel: 300, oil: 600, rareMetals: 200, manpower: 9000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'armor_1', 'econ_1'] },
  ita: { name: 'Italy', color: '#008C45', population: 60_000_000, resources: { food: 400, steel: 200, oil: 80, rareMetals: 250, manpower: 8000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'armor_1', 'econ_1'] },
  irn: { name: 'Iran', color: '#239F40', population: 85_000_000, resources: { food: 300, steel: 200, oil: 800, rareMetals: 50, manpower: 3000 }, govType: 'authoritarian', researchSlots: 1, startTech: ['infantry_1', 'support_1'] },
  egy: { name: 'Egypt', color: '#C09300', population: 104_000_000, resources: { food: 600, steel: 100, oil: 100, rareMetals: 30, manpower: 2000 }, govType: 'authoritarian', researchSlots: 1, startTech: ['infantry_1'] },
  isr: { name: 'Israel', color: '#0038B8', population: 9_000_000, resources: { food: 100, steel: 100, oil: 20, rareMetals: 300, manpower: 8000 }, govType: 'democracy', researchSlots: 2, startTech: ['infantry_1', 'infantry_2', 'armor_1', 'armor_2', 'aircraft_1', 'support_1', 'support_2'] },
  pol: { name: 'Poland', color: '#DC143C', population: 38_000_000, resources: { food: 400, steel: 200, oil: 50, rareMetals: 100, manpower: 4000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1', 'armor_1'] },
  mex: { name: 'Mexico', color: '#006847', population: 130_000_000, resources: { food: 500, steel: 150, oil: 200, rareMetals: 60, manpower: 3000 }, govType: 'democracy', researchSlots: 1, startTech: ['infantry_1'] },
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
  'GBR': 'gbr', 'USA': 'usa', 'US1': 'usa', 'FRA': 'fra', 'DEU': 'deu',
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
  // Jungle: equatorial regions
  if (lat > -10 && lat < 10 && lng > -80 && lng < -40) return 'jungle';
  if (lat > -8 && lat < 10 && lng > 95 && lng < 145) return 'jungle';
  if (lat > -5 && lat < 10 && lng > 10 && lng < 40) return 'jungle';
  if (lat > 50 && lat < 66 && lng > 20 && lng < 180) return 'forest';
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

function geometryToSvgPath(geometry: any, cfg: ReturnType<typeof getDefaultProjectionConfig>): string {
  const normalized = normalizeGeometry(geometry);
  if (!normalized) return '';
  return normalizedGeometryToSvgPath(normalized, cfg);
}

function getCentroidFromGeometry(geometry: any): { lat: number; lng: number } {
  const normalized = normalizeGeometry(geometry);
  if (!normalized) return { lat: 0, lng: 0 };
  const centroid = geometryCentroid(normalized);
  return { lat: centroid.lat, lng: centroid.lng };
}

function keyedChance(key: string, chance: number): boolean {
  return randomFromKey(key) < chance;
}

function slugifyProvinceKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'region';
}

function createProvinceBuildings(dev: number): Building[] {
  const buildings: Building[] = [];
  if (dev >= 30) buildings.push({ type: 'infrastructure', level: Math.min(3, Math.floor(dev / 25)) });
  if (dev >= 50) buildings.push({ type: 'industrialComplex', level: Math.min(3, Math.floor(dev / 30)) });
  return buildings;
}

function createProvinceResourceProduction(provinceKey: string, terrain: TerrainType, population: number, development: number): Resources {
  return {
    food: terrain === 'plains' ? 30 : terrain === 'forest' ? 15 : terrain === 'jungle' ? 20 : 5,
    steel: terrain === 'mountain' ? 25 : keyedChance(`${provinceKey}:steel`, 0.4) ? 10 : 0,
    oil: terrain === 'desert' ? 20 : terrain === 'jungle' ? 5 : keyedChance(`${provinceKey}:oil`, 0.3) ? 10 : 0,
    rareMetals: development > 60 ? 15 : terrain === 'mountain' ? 8 : 0,
    manpower: Math.floor(population / 100000) + development * 2,
  };
}

function buildProvinceFromFeature(
  countryId: string,
  provinceKey: string,
  provinceName: string,
  population: number,
  svgPath: string,
  geometry: any,
): Province {
  const centroid = getCentroidFromGeometry(geometry);
  const terrain = inferTerrain(centroid.lat, centroid.lng);
  const development = randomIntFromKey(`${provinceKey}:dev`, 22, 88);

  return {
    id: provinceKey,
    countryId,
    originalCountryId: countryId,
    name: provinceName,
    population,
    morale: randomIntFromKey(`${provinceKey}:morale`, 50, 89),
    stability: randomIntFromKey(`${provinceKey}:stability`, 42, 82),
    corruption: randomIntFromKey(`${provinceKey}:corruption`, 5, 28),
    resourceProduction: createProvinceResourceProduction(provinceKey, terrain, population, development),
    buildings: createProvinceBuildings(development),
    terrain,
    isCoastal: keyedChance(`${provinceKey}:coastal`, 0.5),
    development,
    adjacentProvinces: [],
    geometry: svgPath,
  };
}

export interface WorldData {
  countries: Country[];
  provinces: Province[];
  countryPaths: Record<string, string>;
}

/**
 * Load admin-0 for all countries + admin-1 for US states.
 */
export async function generateWorld(): Promise<WorldData> {
  const cfg = getDefaultProjectionConfig();

  // Load both datasets in parallel
  const [admin0Resp, admin1Resp] = await Promise.all([
    fetch('/data/world-land.geojson'),
    fetch('/data/ne_110m_admin_1.geojson'),
  ]);
  const admin0 = await admin0Resp.json();
  const admin1 = await admin1Resp.json();

  const countries: Country[] = [];
  const provinces: Province[] = [];
  const countryPaths: Record<string, string> = {};
  let colorIdx = 0;

  const admin1ByCountry = new Map<string, any[]>();
  for (const feature of (admin1.features || [])) {
    const props = feature.properties;
    const iso = props?.adm0_a3 || props?.iso_a2 || props?.iso_a3;
    if (!iso || iso === '-99') continue;

    const countryId = isoToGameId(iso);
    if (!admin1ByCountry.has(countryId)) {
      admin1ByCountry.set(countryId, []);
    }
    admin1ByCountry.get(countryId)!.push(feature);
  }

  for (const feature of admin0.features) {
    const props = feature.properties;
    if (!props) continue;
    const iso = props.adm0_a3 || props.iso_a3 || props.sov_a3;
    if (!iso || iso === '-99') continue;

    const countryId = isoToGameId(iso);
    const countryName = props.name || props.admin || iso;
    const continent = props.continent || 'Unknown';
    const popEst = props.pop_est || 1_000_000;
    const override = COUNTRY_OVERRIDES[countryId];

    // Create country
    const country = createCountry(countryId, countryName, iso, continent, popEst, override, colorIdx);
    countries.push(country);
    colorIdx++;

    const svgPath = geometryToSvgPath(feature.geometry, cfg);
    if (!svgPath) continue;

    countryPaths[countryId] = svgPath;

    const subdivisionFeatures = admin1ByCountry.get(countryId) ?? [];
    const validSubdivisions = subdivisionFeatures
      .map((subdivisionFeature, index) => {
        const subdivisionPath = geometryToSvgPath(subdivisionFeature.geometry, cfg);
        if (!subdivisionPath) return null;

        const subdivisionProps = subdivisionFeature.properties ?? {};
        const rawName = subdivisionProps.name || subdivisionProps.name_en || subdivisionProps.shapeName || `${countryName} Province ${index + 1}`;
        const provinceSuffix = slugifyProvinceKey(
          subdivisionProps.postal || subdivisionProps.adm1_code || subdivisionProps.code_hasc || rawName,
        );

        return {
          name: rawName,
          id: `${countryId}_${provinceSuffix}`,
          path: subdivisionPath,
          geometry: subdivisionFeature.geometry,
        };
      })
      .filter(Boolean) as { name: string; id: string; path: string; geometry: any }[];

    if (validSubdivisions.length > 1) {
      const provincePopulation = Math.max(50_000, Math.round(popEst / validSubdivisions.length));
      const usedIds = new Set<string>();

      for (const [index, subdivision] of validSubdivisions.entries()) {
        let provinceId = subdivision.id;
        if (usedIds.has(provinceId)) {
          provinceId = `${provinceId}${index + 1}`;
        }
        usedIds.add(provinceId);

        provinces.push(
          buildProvinceFromFeature(
            countryId,
            provinceId,
            subdivision.name,
            provincePopulation,
            subdivision.path,
            subdivision.geometry,
          ),
        );
      }
    } else {
      provinces.push(
        buildProvinceFromFeature(
          countryId,
          `${countryId}_main`,
          countryName,
          popEst,
          svgPath,
          feature.geometry,
        ),
      );
    }
  }

  // Compute adjacency
  computeAdjacency(provinces);

  // Register geometries
  for (const prov of provinces) {
    updateProvinceGeometry(prov.id, prov.geometry);
  }
  invalidateCentroidCache();

  console.log(`[WorldGenerator] Generated ${countries.length} countries, ${provinces.length} provinces`);

  return { countries, provinces, countryPaths };
}

function createCountry(
  id: string, name: string, code: string, continent: string,
  population: number, override: typeof COUNTRY_OVERRIDES[string] | undefined,
  colorIdx: number
): Country {
  if (override) {
    return {
      id, name: override.name ?? name, code, continent,
      color: override.color ?? COLOR_PALETTE[colorIdx % COLOR_PALETTE.length],
      isPlayerControlled: false,
      population: override.population ?? population,
      stability: randomIntFromKey(`${id}:country:stability`, 60, 89),
      approval: randomIntFromKey(`${id}:country:approval`, 50, 79),
      resources: { ...override.resources },
      resourceIncome: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
      diplomacy: { relations: {}, embargoes: [] },
      government: {
        type: override.govType,
        corruption: randomIntFromKey(`${id}:country:corruption`, 10, 49),
        bureaucracyEfficiency: randomIntFromKey(`${id}:country:bureaucracy`, 40, 79),
        policies: [],
      },
      technology: { researched: override.startTech, activeResearch: [] },
      researchSlots: override.researchSlots,
      militaryMorale: randomIntFromKey(`${id}:country:militaryMorale`, 60, 89),
    };
  }

  const popFactor = Math.log10(Math.max(population, 100000));
  return {
    id, name, code, continent,
    color: COLOR_PALETTE[colorIdx % COLOR_PALETTE.length],
    isPlayerControlled: false, population,
    stability: randomIntFromKey(`${id}:country:stability`, 40, 79),
    approval: randomIntFromKey(`${id}:country:approval`, 40, 69),
    resources: {
      food: Math.round(50 * popFactor),
      steel: Math.round(30 * popFactor * randomFromKey(`${id}:country:steel`)),
      oil: Math.round(20 * popFactor * randomFromKey(`${id}:country:oil`)),
      rareMetals: Math.round(10 * popFactor * randomFromKey(`${id}:country:rareMetals`)),
      manpower: Math.round(200 * popFactor),
    },
    resourceIncome: { food: 0, steel: 0, oil: 0, rareMetals: 0, manpower: 0 },
    diplomacy: { relations: {}, embargoes: [] },
    government: {
      type: inferGovernment(name),
      corruption: randomIntFromKey(`${id}:country:corruption`, 10, 59),
      bureaucracyEfficiency: randomIntFromKey(`${id}:country:bureaucracy`, 30, 79),
      policies: [],
    },
    technology: { researched: ['infantry_1'], activeResearch: [] },
    researchSlots: 1,
    militaryMorale: randomIntFromKey(`${id}:country:militaryMorale`, 50, 79),
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
