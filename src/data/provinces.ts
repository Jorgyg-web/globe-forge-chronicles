import { Province, Building, TerrainType, Resources, ProvinceId } from '@/types/game';
import { PROVINCE_GEOMETRY } from './provinceGeometry';

interface ProvinceDef {
  id: string; countryId: string; name: string;
  pop: number; terrain: TerrainType; isCoastal: boolean;
  dev: number; resources: Partial<Resources>;
  buildings?: Partial<Record<string, number>>;
  adjacent: string[];
}

function makeProvince(d: ProvinceDef): Province {
  const buildings: Building[] = [];
  if (d.dev >= 30) buildings.push({ type: 'infrastructure', level: Math.min(5, Math.floor(d.dev / 20)) });
  if (d.dev >= 40) buildings.push({ type: 'industrialComplex', level: Math.min(5, Math.floor(d.dev / 25)) });
  if (d.dev >= 50) buildings.push({ type: 'militaryBase', level: Math.min(3, Math.floor(d.dev / 35)) });
  if (d.dev >= 60) buildings.push({ type: 'resourceExtractor', level: Math.min(3, Math.floor(d.dev / 30)) });

  if (d.buildings) {
    for (const [type, level] of Object.entries(d.buildings)) {
      if (level && level > 0) {
        const existing = buildings.find(b => b.type === type);
        if (existing) existing.level = Math.max(existing.level, level);
        else buildings.push({ type: type as any, level });
      }
    }
  }

  return {
    id: d.id,
    countryId: d.countryId,
    originalCountryId: d.countryId,
    name: d.name,
    population: d.pop,
    morale: 60 + Math.floor(Math.random() * 30),
    stability: 50 + Math.floor(Math.random() * 40),
    corruption: 5 + Math.floor(Math.random() * 25),
    resourceProduction: {
      food: d.resources.food ?? 0,
      steel: d.resources.steel ?? 0,
      oil: d.resources.oil ?? 0,
      rareMetals: d.resources.rareMetals ?? 0,
      manpower: Math.floor(d.pop / 50000) + (d.dev * 5),
    },
    buildings,
    terrain: d.terrain,
    isCoastal: d.isCoastal,
    development: d.dev,
    adjacentProvinces: d.adjacent,
    geometry: PROVINCE_GEOMETRY[d.id] ?? `M400,225 L410,220 L420,225 L410,230 Z`,
  };
}

const PROVINCE_DEFS: ProvinceDef[] = [
  // ─── USA ───
  { id: 'usa_ne', countryId: 'usa', name: 'Northeast', pop: 56_000_000, terrain: 'urban', isCoastal: true, dev: 85,
    resources: { food: 10, steel: 20, rareMetals: 40 }, buildings: { militaryBase: 2, airbase: 1 },
    adjacent: ['usa_se', 'usa_mw'] },
  { id: 'usa_se', countryId: 'usa', name: 'Southeast', pop: 85_000_000, terrain: 'plains', isCoastal: true, dev: 70,
    resources: { food: 60, oil: 10, steel: 15 }, buildings: { militaryBase: 2 },
    adjacent: ['usa_ne', 'usa_mw', 'usa_sw'] },
  { id: 'usa_mw', countryId: 'usa', name: 'Midwest', pop: 68_000_000, terrain: 'plains', isCoastal: false, dev: 75,
    resources: { food: 80, steel: 30 },
    adjacent: ['usa_ne', 'usa_se', 'usa_sw', 'usa_w'] },
  { id: 'usa_sw', countryId: 'usa', name: 'Southwest', pop: 42_000_000, terrain: 'desert', isCoastal: false, dev: 72,
    resources: { oil: 50, steel: 40, rareMetals: 15 }, buildings: { militaryBase: 1 },
    adjacent: ['usa_se', 'usa_mw', 'usa_w', 'mex_n'] },
  { id: 'usa_w', countryId: 'usa', name: 'West Coast', pop: 53_000_000, terrain: 'coastal', isCoastal: true, dev: 90,
    resources: { food: 20, rareMetals: 60 }, buildings: { airbase: 2, navalBase: 1 },
    adjacent: ['usa_mw', 'usa_sw', 'usa_ak'] },
  { id: 'usa_ak', countryId: 'usa', name: 'Alaska & Pacific', pop: 5_000_000, terrain: 'arctic', isCoastal: true, dev: 45,
    resources: { oil: 70, steel: 20 }, buildings: { navalBase: 1 },
    adjacent: ['usa_w', 'can_bc'] },

  // ─── China ───
  { id: 'chn_e', countryId: 'chn', name: 'East China', pop: 450_000_000, terrain: 'urban', isCoastal: true, dev: 80,
    resources: { food: 30, steel: 25, rareMetals: 50 }, buildings: { militaryBase: 2, airbase: 1 },
    adjacent: ['chn_s', 'chn_n', 'chn_c', 'kor_c'] },
  { id: 'chn_s', countryId: 'chn', name: 'South China', pop: 350_000_000, terrain: 'forest', isCoastal: true, dev: 75,
    resources: { food: 50, rareMetals: 30 }, buildings: { navalBase: 1 },
    adjacent: ['chn_e', 'chn_c'] },
  { id: 'chn_n', countryId: 'chn', name: 'North China', pop: 300_000_000, terrain: 'plains', isCoastal: true, dev: 70,
    resources: { food: 40, oil: 25, steel: 50 }, buildings: { militaryBase: 2 },
    adjacent: ['chn_e', 'chn_w', 'chn_c', 'rus_fe'] },
  { id: 'chn_w', countryId: 'chn', name: 'West China', pop: 200_000_000, terrain: 'mountain', isCoastal: false, dev: 45,
    resources: { steel: 60, oil: 15 },
    adjacent: ['chn_n', 'chn_c', 'ind_n'] },
  { id: 'chn_c', countryId: 'chn', name: 'Central China', pop: 100_000_000, terrain: 'plains', isCoastal: false, dev: 60,
    resources: { food: 70, steel: 20 },
    adjacent: ['chn_e', 'chn_s', 'chn_n', 'chn_w'] },

  // ─── Russia ───
  { id: 'rus_w', countryId: 'rus', name: 'Western Russia', pop: 80_000_000, terrain: 'forest', isCoastal: false, dev: 65,
    resources: { food: 30, oil: 30, steel: 35 }, buildings: { militaryBase: 2 },
    adjacent: ['rus_s', 'rus_u', 'pol_n', 'deu_e'] },
  { id: 'rus_s', countryId: 'rus', name: 'Southern Russia', pop: 25_000_000, terrain: 'plains', isCoastal: true, dev: 50,
    resources: { food: 50, oil: 20 },
    adjacent: ['rus_w', 'rus_u', 'tur_e'] },
  { id: 'rus_u', countryId: 'rus', name: 'Urals', pop: 15_000_000, terrain: 'mountain', isCoastal: false, dev: 55,
    resources: { steel: 80, oil: 40 }, buildings: { militaryBase: 1 },
    adjacent: ['rus_w', 'rus_s', 'rus_si'] },
  { id: 'rus_si', countryId: 'rus', name: 'Siberia', pop: 14_000_000, terrain: 'arctic', isCoastal: true, dev: 35,
    resources: { oil: 70, steel: 50 },
    adjacent: ['rus_u', 'rus_fe'] },
  { id: 'rus_fe', countryId: 'rus', name: 'Far East', pop: 10_000_000, terrain: 'forest', isCoastal: true, dev: 30,
    resources: { oil: 20, steel: 30 }, buildings: { navalBase: 1 },
    adjacent: ['rus_si', 'chn_n'] },

  // ─── UK ───
  { id: 'gbr_en', countryId: 'gbr', name: 'England', pop: 56_000_000, terrain: 'urban', isCoastal: true, dev: 82,
    resources: { food: 15, rareMetals: 30 }, buildings: { airbase: 1, navalBase: 2 },
    adjacent: ['gbr_sc', 'gbr_wa', 'fra_n'] },
  { id: 'gbr_sc', countryId: 'gbr', name: 'Scotland', pop: 5_500_000, terrain: 'mountain', isCoastal: true, dev: 75,
    resources: { oil: 40, food: 10 },
    adjacent: ['gbr_en', 'gbr_ni'] },
  { id: 'gbr_wa', countryId: 'gbr', name: 'Wales', pop: 3_200_000, terrain: 'mountain', isCoastal: true, dev: 65,
    resources: { steel: 30 },
    adjacent: ['gbr_en'] },
  { id: 'gbr_ni', countryId: 'gbr', name: 'N. Ireland', pop: 1_900_000, terrain: 'plains', isCoastal: true, dev: 60,
    resources: { food: 15 },
    adjacent: ['gbr_sc'] },

  // ─── France ───
  { id: 'fra_idf', countryId: 'fra', name: 'Île-de-France', pop: 12_000_000, terrain: 'urban', isCoastal: false, dev: 90,
    resources: { rareMetals: 25 }, buildings: { airbase: 1, militaryBase: 1 },
    adjacent: ['fra_n', 'fra_e', 'fra_s'] },
  { id: 'fra_s', countryId: 'fra', name: 'South France', pop: 20_000_000, terrain: 'coastal', isCoastal: true, dev: 72,
    resources: { food: 50 }, buildings: { navalBase: 1 },
    adjacent: ['fra_idf', 'fra_e', 'ita_n'] },
  { id: 'fra_n', countryId: 'fra', name: 'North France', pop: 18_000_000, terrain: 'plains', isCoastal: true, dev: 70,
    resources: { food: 40 },
    adjacent: ['fra_idf', 'gbr_en', 'deu_w'] },
  { id: 'fra_e', countryId: 'fra', name: 'East France', pop: 17_000_000, terrain: 'forest', isCoastal: false, dev: 68,
    resources: { steel: 25, food: 20 },
    adjacent: ['fra_idf', 'fra_s', 'deu_s'] },

  // ─── Germany ───
  { id: 'deu_n', countryId: 'deu', name: 'North Germany', pop: 25_000_000, terrain: 'plains', isCoastal: true, dev: 82,
    resources: { food: 20, rareMetals: 30 }, buildings: { navalBase: 1 },
    adjacent: ['deu_s', 'deu_e', 'deu_w', 'pol_n'] },
  { id: 'deu_s', countryId: 'deu', name: 'South Germany', pop: 30_000_000, terrain: 'forest', isCoastal: false, dev: 88,
    resources: { steel: 25, rareMetals: 40 }, buildings: { militaryBase: 1 },
    adjacent: ['deu_n', 'deu_e', 'deu_w', 'fra_e', 'ita_n'] },
  { id: 'deu_e', countryId: 'deu', name: 'East Germany', pop: 16_000_000, terrain: 'plains', isCoastal: false, dev: 72,
    resources: { food: 20, steel: 15 },
    adjacent: ['deu_n', 'deu_s', 'pol_c', 'rus_w'] },
  { id: 'deu_w', countryId: 'deu', name: 'West Germany', pop: 12_000_000, terrain: 'urban', isCoastal: false, dev: 80,
    resources: { rareMetals: 20 },
    adjacent: ['deu_n', 'deu_s', 'fra_n'] },

  // ─── Japan ───
  { id: 'jpn_k', countryId: 'jpn', name: 'Kantō', pop: 44_000_000, terrain: 'urban', isCoastal: true, dev: 95,
    resources: { rareMetals: 70 }, buildings: { airbase: 1, navalBase: 1 },
    adjacent: ['jpn_kn', 'jpn_c'] },
  { id: 'jpn_kn', countryId: 'jpn', name: 'Kansai', pop: 22_000_000, terrain: 'urban', isCoastal: true, dev: 88,
    resources: { rareMetals: 40 },
    adjacent: ['jpn_k', 'jpn_c', 'jpn_s'] },
  { id: 'jpn_c', countryId: 'jpn', name: 'Chūbu', pop: 22_000_000, terrain: 'mountain', isCoastal: true, dev: 82,
    resources: { steel: 15, rareMetals: 25 },
    adjacent: ['jpn_k', 'jpn_kn', 'jpn_n'] },
  { id: 'jpn_s', countryId: 'jpn', name: 'Kyūshū', pop: 20_000_000, terrain: 'coastal', isCoastal: true, dev: 75,
    resources: { food: 20 }, buildings: { navalBase: 1 },
    adjacent: ['jpn_kn'] },
  { id: 'jpn_n', countryId: 'jpn', name: 'Hokkaido', pop: 17_000_000, terrain: 'arctic', isCoastal: true, dev: 70,
    resources: { food: 40, steel: 10 },
    adjacent: ['jpn_c'] },

  // ─── India ───
  { id: 'ind_n', countryId: 'ind', name: 'North India', pop: 450_000_000, terrain: 'plains', isCoastal: false, dev: 45,
    resources: { food: 80, steel: 15 }, buildings: { militaryBase: 2 },
    adjacent: ['ind_c', 'ind_w', 'ind_e', 'chn_w'] },
  { id: 'ind_s', countryId: 'ind', name: 'South India', pop: 300_000_000, terrain: 'coastal', isCoastal: true, dev: 55,
    resources: { food: 40, rareMetals: 20 },
    adjacent: ['ind_c', 'ind_w', 'ind_e'] },
  { id: 'ind_w', countryId: 'ind', name: 'West India', pop: 280_000_000, terrain: 'coastal', isCoastal: true, dev: 52,
    resources: { oil: 15, food: 30 }, buildings: { navalBase: 1 },
    adjacent: ['ind_n', 'ind_s', 'ind_c'] },
  { id: 'ind_e', countryId: 'ind', name: 'East India', pop: 250_000_000, terrain: 'forest', isCoastal: true, dev: 40,
    resources: { food: 50, steel: 35 },
    adjacent: ['ind_n', 'ind_s', 'ind_c'] },
  { id: 'ind_c', countryId: 'ind', name: 'Central India', pop: 100_000_000, terrain: 'plains', isCoastal: false, dev: 35,
    resources: { steel: 30, food: 40 },
    adjacent: ['ind_n', 'ind_s', 'ind_w', 'ind_e'] },

  // ─── Brazil ───
  { id: 'bra_se', countryId: 'bra', name: 'Southeast', pop: 90_000_000, terrain: 'urban', isCoastal: true, dev: 65,
    resources: { food: 20, steel: 20 }, buildings: { militaryBase: 1 },
    adjacent: ['bra_ne', 'bra_s', 'bra_cw'] },
  { id: 'bra_ne', countryId: 'bra', name: 'Northeast', pop: 57_000_000, terrain: 'plains', isCoastal: true, dev: 40,
    resources: { food: 40 },
    adjacent: ['bra_se', 'bra_n'] },
  { id: 'bra_s', countryId: 'bra', name: 'South', pop: 30_000_000, terrain: 'plains', isCoastal: true, dev: 60,
    resources: { food: 60 },
    adjacent: ['bra_se', 'bra_cw'] },
  { id: 'bra_n', countryId: 'bra', name: 'North & Amazon', pop: 18_000_000, terrain: 'forest', isCoastal: true, dev: 30,
    resources: { food: 20, steel: 30 },
    adjacent: ['bra_ne', 'bra_cw'] },
  { id: 'bra_cw', countryId: 'bra', name: 'Center-West', pop: 17_000_000, terrain: 'plains', isCoastal: false, dev: 45,
    resources: { food: 70 },
    adjacent: ['bra_se', 'bra_s', 'bra_n'] },

  // ─── South Korea ───
  { id: 'kor_c', countryId: 'kor', name: 'Capital Region', pop: 26_000_000, terrain: 'urban', isCoastal: true, dev: 92,
    resources: { rareMetals: 60 }, buildings: { militaryBase: 2, airbase: 1 },
    adjacent: ['kor_s', 'kor_w', 'chn_e'] },
  { id: 'kor_s', countryId: 'kor', name: 'Gyeongsang', pop: 13_000_000, terrain: 'coastal', isCoastal: true, dev: 80,
    resources: { steel: 25, rareMetals: 20 }, buildings: { navalBase: 1 },
    adjacent: ['kor_c', 'kor_w'] },
  { id: 'kor_w', countryId: 'kor', name: 'Chungcheong', pop: 13_000_000, terrain: 'plains', isCoastal: false, dev: 75,
    resources: { food: 30, steel: 15 },
    adjacent: ['kor_c', 'kor_s'] },

  // ─── Turkey ───
  { id: 'tur_m', countryId: 'tur', name: 'Marmara', pop: 25_000_000, terrain: 'coastal', isCoastal: true, dev: 70,
    resources: { food: 15 }, buildings: { militaryBase: 1, navalBase: 1 },
    adjacent: ['tur_a'] },
  { id: 'tur_a', countryId: 'tur', name: 'Anatolia', pop: 35_000_000, terrain: 'plains', isCoastal: false, dev: 50,
    resources: { food: 50, steel: 30 },
    adjacent: ['tur_m', 'tur_e'] },
  { id: 'tur_e', countryId: 'tur', name: 'Eastern Turkey', pop: 24_000_000, terrain: 'mountain', isCoastal: false, dev: 40,
    resources: { steel: 25, oil: 10 },
    adjacent: ['tur_a', 'rus_s', 'irn_w'] },

  // ─── Saudi Arabia ───
  { id: 'sau_c', countryId: 'sau', name: 'Central (Riyadh)', pop: 10_000_000, terrain: 'desert', isCoastal: false, dev: 70,
    resources: { oil: 30 }, buildings: { militaryBase: 1 },
    adjacent: ['sau_e', 'sau_w', 'sau_s'] },
  { id: 'sau_e', countryId: 'sau', name: 'Eastern Province', pop: 5_000_000, terrain: 'desert', isCoastal: true, dev: 75,
    resources: { oil: 100 }, buildings: { navalBase: 1 },
    adjacent: ['sau_c', 'irn_s'] },
  { id: 'sau_w', countryId: 'sau', name: 'Western (Hejaz)', pop: 12_000_000, terrain: 'desert', isCoastal: true, dev: 55,
    resources: { food: 5 },
    adjacent: ['sau_c', 'sau_s', 'egy_s'] },
  { id: 'sau_s', countryId: 'sau', name: 'Southern', pop: 8_000_000, terrain: 'desert', isCoastal: true, dev: 40,
    resources: { food: 10 },
    adjacent: ['sau_c', 'sau_w'] },

  // ─── Australia ───
  { id: 'aus_nsw', countryId: 'aus', name: 'New South Wales', pop: 8_000_000, terrain: 'coastal', isCoastal: true, dev: 80,
    resources: { food: 20, rareMetals: 15 }, buildings: { navalBase: 1 },
    adjacent: ['aus_vic', 'aus_qld', 'aus_sa'] },
  { id: 'aus_vic', countryId: 'aus', name: 'Victoria', pop: 6_500_000, terrain: 'plains', isCoastal: true, dev: 78,
    resources: { food: 25 },
    adjacent: ['aus_nsw', 'aus_sa'] },
  { id: 'aus_qld', countryId: 'aus', name: 'Queensland', pop: 5_200_000, terrain: 'desert', isCoastal: true, dev: 70,
    resources: { steel: 50, food: 15 },
    adjacent: ['aus_nsw', 'aus_sa', 'aus_wa'] },
  { id: 'aus_wa', countryId: 'aus', name: 'Western Australia', pop: 2_700_000, terrain: 'desert', isCoastal: true, dev: 65,
    resources: { steel: 80, oil: 20 },
    adjacent: ['aus_qld', 'aus_sa'] },
  { id: 'aus_sa', countryId: 'aus', name: 'South Australia & NT', pop: 2_600_000, terrain: 'desert', isCoastal: true, dev: 55,
    resources: { steel: 40 },
    adjacent: ['aus_nsw', 'aus_vic', 'aus_qld', 'aus_wa'] },

  // ─── Canada ───
  { id: 'can_on', countryId: 'can', name: 'Ontario', pop: 14_700_000, terrain: 'forest', isCoastal: true, dev: 80,
    resources: { food: 20, rareMetals: 15 },
    adjacent: ['can_qc', 'can_pr', 'usa_mw'] },
  { id: 'can_qc', countryId: 'can', name: 'Quebec', pop: 8_600_000, terrain: 'forest', isCoastal: true, dev: 72,
    resources: { food: 15, steel: 10 },
    adjacent: ['can_on', 'can_pr', 'usa_ne'] },
  { id: 'can_bc', countryId: 'can', name: 'British Columbia', pop: 5_100_000, terrain: 'mountain', isCoastal: true, dev: 78,
    resources: { steel: 30, food: 10 }, buildings: { navalBase: 1 },
    adjacent: ['can_ab', 'usa_ak', 'usa_w'] },
  { id: 'can_ab', countryId: 'can', name: 'Alberta', pop: 4_400_000, terrain: 'plains', isCoastal: false, dev: 75,
    resources: { oil: 80 },
    adjacent: ['can_bc', 'can_pr'] },
  { id: 'can_pr', countryId: 'can', name: 'Prairies & North', pop: 5_200_000, terrain: 'arctic', isCoastal: true, dev: 55,
    resources: { food: 50, steel: 20 },
    adjacent: ['can_on', 'can_qc', 'can_ab'] },

  // ─── Italy ───
  { id: 'ita_n', countryId: 'ita', name: 'Northern Italy', pop: 28_000_000, terrain: 'urban', isCoastal: true, dev: 80,
    resources: { food: 15, rareMetals: 20 }, buildings: { militaryBase: 1 },
    adjacent: ['ita_c', 'fra_s', 'deu_s'] },
  { id: 'ita_c', countryId: 'ita', name: 'Central Italy', pop: 12_000_000, terrain: 'plains', isCoastal: true, dev: 72,
    resources: { food: 30 },
    adjacent: ['ita_n', 'ita_s'] },
  { id: 'ita_s', countryId: 'ita', name: 'Southern Italy', pop: 20_000_000, terrain: 'coastal', isCoastal: true, dev: 55,
    resources: { food: 40 }, buildings: { navalBase: 1 },
    adjacent: ['ita_c'] },

  // ─── Iran ───
  { id: 'irn_c', countryId: 'irn', name: 'Central Iran', pop: 30_000_000, terrain: 'desert', isCoastal: false, dev: 45,
    resources: { oil: 30 }, buildings: { militaryBase: 1 },
    adjacent: ['irn_w', 'irn_e', 'irn_s'] },
  { id: 'irn_w', countryId: 'irn', name: 'Western Iran', pop: 25_000_000, terrain: 'mountain', isCoastal: false, dev: 35,
    resources: { oil: 60, steel: 15 },
    adjacent: ['irn_c', 'tur_e'] },
  { id: 'irn_e', countryId: 'irn', name: 'Eastern Iran', pop: 15_000_000, terrain: 'desert', isCoastal: false, dev: 30,
    resources: { steel: 30 },
    adjacent: ['irn_c', 'irn_s'] },
  { id: 'irn_s', countryId: 'irn', name: 'Southern Iran', pop: 15_000_000, terrain: 'coastal', isCoastal: true, dev: 32,
    resources: { oil: 70 }, buildings: { navalBase: 1 },
    adjacent: ['irn_c', 'irn_e', 'sau_e'] },

  // ─── Egypt ───
  { id: 'egy_n', countryId: 'egy', name: 'Nile Delta', pop: 50_000_000, terrain: 'plains', isCoastal: true, dev: 50,
    resources: { food: 70 }, buildings: { militaryBase: 1 },
    adjacent: ['egy_c', 'isr_s'] },
  { id: 'egy_c', countryId: 'egy', name: 'Cairo Region', pop: 25_000_000, terrain: 'urban', isCoastal: false, dev: 55,
    resources: { food: 20 },
    adjacent: ['egy_n', 'egy_s'] },
  { id: 'egy_s', countryId: 'egy', name: 'Upper Egypt', pop: 29_000_000, terrain: 'desert', isCoastal: false, dev: 30,
    resources: { food: 40 },
    adjacent: ['egy_c', 'sau_w'] },

  // ─── Israel ───
  { id: 'isr_c', countryId: 'isr', name: 'Central District', pop: 5_000_000, terrain: 'urban', isCoastal: true, dev: 85,
    resources: { rareMetals: 40 }, buildings: { airbase: 1, militaryBase: 2 },
    adjacent: ['isr_s', 'isr_n'] },
  { id: 'isr_s', countryId: 'isr', name: 'Southern District', pop: 2_000_000, terrain: 'desert', isCoastal: false, dev: 65,
    resources: { steel: 20 }, buildings: { fortification: 1 },
    adjacent: ['isr_c', 'egy_n'] },
  { id: 'isr_n', countryId: 'isr', name: 'Northern District', pop: 2_000_000, terrain: 'mountain', isCoastal: false, dev: 70,
    resources: { food: 25 }, buildings: { fortification: 1 },
    adjacent: ['isr_c'] },

  // ─── Poland ───
  { id: 'pol_c', countryId: 'pol', name: 'Central Poland', pop: 12_000_000, terrain: 'plains', isCoastal: false, dev: 68,
    resources: { food: 20, steel: 10 }, buildings: { militaryBase: 1 },
    adjacent: ['pol_s', 'pol_n', 'deu_e'] },
  { id: 'pol_s', countryId: 'pol', name: 'Southern Poland', pop: 12_000_000, terrain: 'mountain', isCoastal: false, dev: 62,
    resources: { steel: 40 },
    adjacent: ['pol_c', 'pol_n'] },
  { id: 'pol_n', countryId: 'pol', name: 'Northern Poland', pop: 14_000_000, terrain: 'plains', isCoastal: true, dev: 60,
    resources: { food: 35 }, buildings: { navalBase: 1 },
    adjacent: ['pol_c', 'pol_s', 'deu_n', 'rus_w'] },

  // ─── Mexico ───
  { id: 'mex_c', countryId: 'mex', name: 'Central Mexico', pop: 45_000_000, terrain: 'urban', isCoastal: false, dev: 55,
    resources: { food: 20 }, buildings: { militaryBase: 1 },
    adjacent: ['mex_n', 'mex_s', 'mex_se'] },
  { id: 'mex_n', countryId: 'mex', name: 'Northern Mexico', pop: 40_000_000, terrain: 'desert', isCoastal: true, dev: 50,
    resources: { oil: 20, steel: 30 },
    adjacent: ['mex_c', 'usa_sw'] },
  { id: 'mex_s', countryId: 'mex', name: 'Southern Mexico', pop: 30_000_000, terrain: 'forest', isCoastal: true, dev: 35,
    resources: { food: 45 },
    adjacent: ['mex_c', 'mex_se'] },
  { id: 'mex_se', countryId: 'mex', name: 'Yucatán & SE', pop: 15_000_000, terrain: 'forest', isCoastal: true, dev: 40,
    resources: { oil: 40, food: 15 },
    adjacent: ['mex_c', 'mex_s'] },
];

export const INITIAL_PROVINCES: Province[] = PROVINCE_DEFS.map(makeProvince);

export function getProvincesForCountry(provinces: Record<string, Province>, countryId: string): Province[] {
  return Object.values(provinces).filter(p => p.countryId === countryId);
}
