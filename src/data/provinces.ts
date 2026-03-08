import { Province } from '@/types/game';

const p = (
  id: string, countryId: string, name: string,
  pop: number, gdp: number, dev: number,
  resources: Partial<Province['resources']> = {},
): Province => ({
  id, countryId, name,
  population: pop,
  gdpContribution: gdp,
  stability: 50 + Math.floor(Math.random() * 40),
  corruption: 5 + Math.floor(Math.random() * 30),
  unemployment: 2 + Math.random() * 10,
  development: dev,
  infrastructure: {
    roads: Math.floor(dev / 15) + 1,
    railways: Math.floor(dev / 20) + 1,
    ports: Math.random() > 0.5 ? Math.floor(dev / 25) + 1 : 0,
    airports: Math.floor(dev / 30) + 1,
    powerPlants: Math.floor(dev / 20) + 1,
    communications: Math.floor(dev / 15) + 1,
  },
  industry: {
    civilian: Math.floor(dev / 15) + 1,
    military: Math.floor(dev / 25),
    energy: Math.floor(dev / 20) + 1,
    research: Math.floor(dev / 30),
  },
  military: { bases: Math.floor(dev / 40), garrison: Math.floor(pop * 0.001) },
  resources: { oil: 0, minerals: 0, agriculture: 0, rareEarth: 0, ...resources },
});

export const INITIAL_PROVINCES: Province[] = [
  // USA
  p('usa_ne', 'usa', 'Northeast', 56_000_000, 4_500_000, 85, { minerals: 2 }),
  p('usa_se', 'usa', 'Southeast', 85_000_000, 4_000_000, 70, { agriculture: 7 }),
  p('usa_mw', 'usa', 'Midwest', 68_000_000, 3_800_000, 75, { agriculture: 8, minerals: 4 }),
  p('usa_sw', 'usa', 'Southwest', 42_000_000, 2_800_000, 72, { oil: 6, minerals: 5 }),
  p('usa_w', 'usa', 'West Coast', 53_000_000, 6_200_000, 90, { rareEarth: 2 }),
  p('usa_ak', 'usa', 'Alaska & Pacific', 27_000_000, 3_700_000, 65, { oil: 8, minerals: 3 }),

  // China
  p('chn_e', 'chn', 'East China', 450_000_000, 6_000_000, 80, { minerals: 3 }),
  p('chn_s', 'chn', 'South China', 350_000_000, 4_500_000, 75, { agriculture: 6 }),
  p('chn_n', 'chn', 'North China', 300_000_000, 3_500_000, 70, { minerals: 7, oil: 3 }),
  p('chn_w', 'chn', 'West China', 200_000_000, 2_500_000, 45, { rareEarth: 9, minerals: 6 }),
  p('chn_c', 'chn', 'Central China', 100_000_000, 1_500_000, 60, { agriculture: 8 }),

  // Russia
  p('rus_w', 'rus', 'Western Russia', 80_000_000, 1_000_000, 65, { oil: 4, minerals: 5 }),
  p('rus_s', 'rus', 'Southern Russia', 25_000_000, 400_000, 50, { agriculture: 6, oil: 3 }),
  p('rus_u', 'rus', 'Urals', 15_000_000, 350_000, 55, { minerals: 9, oil: 5 }),
  p('rus_si', 'rus', 'Siberia', 14_000_000, 300_000, 35, { oil: 8, minerals: 7, rareEarth: 4 }),
  p('rus_fe', 'rus', 'Far East', 10_000_000, 150_000, 30, { minerals: 5, oil: 3 }),

  // UK
  p('gbr_en', 'gbr', 'England', 56_000_000, 2_600_000, 82),
  p('gbr_sc', 'gbr', 'Scotland', 5_500_000, 300_000, 75, { oil: 5 }),
  p('gbr_wa', 'gbr', 'Wales', 3_200_000, 150_000, 65, { minerals: 4 }),
  p('gbr_ni', 'gbr', 'N. Ireland', 1_900_000, 100_000, 60),

  // France
  p('fra_idf', 'fra', 'Île-de-France', 12_000_000, 1_000_000, 90),
  p('fra_s', 'fra', 'South France', 20_000_000, 700_000, 72, { agriculture: 6 }),
  p('fra_n', 'fra', 'North France', 18_000_000, 650_000, 70, { agriculture: 5 }),
  p('fra_e', 'fra', 'East France', 17_000_000, 650_000, 68, { minerals: 3 }),

  // Germany
  p('deu_n', 'deu', 'North Germany', 25_000_000, 1_200_000, 82),
  p('deu_s', 'deu', 'South Germany', 30_000_000, 1_800_000, 88, { minerals: 3 }),
  p('deu_e', 'deu', 'East Germany', 16_000_000, 700_000, 72),
  p('deu_w', 'deu', 'West Germany', 12_000_000, 500_000, 80),

  // Japan
  p('jpn_k', 'jpn', 'Kantō', 44_000_000, 2_200_000, 95),
  p('jpn_kn', 'jpn', 'Kansai', 22_000_000, 1_100_000, 88),
  p('jpn_c', 'jpn', 'Chūbu', 22_000_000, 900_000, 82),
  p('jpn_s', 'jpn', 'Kyūshū & South', 20_000_000, 500_000, 75),
  p('jpn_n', 'jpn', 'Hokkaido & North', 17_000_000, 400_000, 70, { agriculture: 6 }),

  // India
  p('ind_n', 'ind', 'North India', 450_000_000, 900_000, 45, { agriculture: 7 }),
  p('ind_s', 'ind', 'South India', 300_000_000, 1_000_000, 55, { rareEarth: 3 }),
  p('ind_w', 'ind', 'West India', 280_000_000, 900_000, 52, { oil: 2 }),
  p('ind_e', 'ind', 'East India', 250_000_000, 500_000, 40, { minerals: 5, agriculture: 6 }),
  p('ind_c', 'ind', 'Central India', 100_000_000, 200_000, 35, { minerals: 4 }),

  // Brazil
  p('bra_se', 'bra', 'Southeast', 90_000_000, 900_000, 65),
  p('bra_ne', 'bra', 'Northeast', 57_000_000, 300_000, 40, { agriculture: 5 }),
  p('bra_s', 'bra', 'South', 30_000_000, 350_000, 60, { agriculture: 7 }),
  p('bra_n', 'bra', 'North & Amazon', 18_000_000, 150_000, 30, { minerals: 4, agriculture: 3 }),
  p('bra_cw', 'bra', 'Center-West', 17_000_000, 200_000, 45, { agriculture: 8 }),

  // South Korea
  p('kor_c', 'kor', 'Capital Region', 26_000_000, 1_000_000, 92),
  p('kor_s', 'kor', 'Gyeongsang', 13_000_000, 450_000, 80, { minerals: 3 }),
  p('kor_w', 'kor', 'Chungcheong', 13_000_000, 350_000, 75),

  // Turkey
  p('tur_m', 'tur', 'Marmara', 25_000_000, 350_000, 70),
  p('tur_a', 'tur', 'Anatolia', 35_000_000, 300_000, 50, { agriculture: 6, minerals: 4 }),
  p('tur_e', 'tur', 'Eastern Turkey', 24_000_000, 250_000, 40, { minerals: 3 }),

  // Saudi Arabia
  p('sau_c', 'sau', 'Central (Riyadh)', 10_000_000, 400_000, 70),
  p('sau_e', 'sau', 'Eastern Province', 5_000_000, 500_000, 75, { oil: 10 }),
  p('sau_w', 'sau', 'Western (Hejaz)', 12_000_000, 150_000, 55),
  p('sau_s', 'sau', 'Southern', 8_000_000, 50_000, 40),

  // Australia
  p('aus_nsw', 'aus', 'New South Wales', 8_000_000, 600_000, 80),
  p('aus_vic', 'aus', 'Victoria', 6_500_000, 450_000, 78),
  p('aus_qld', 'aus', 'Queensland', 5_200_000, 350_000, 70, { minerals: 6 }),
  p('aus_wa', 'aus', 'Western Australia', 2_700_000, 250_000, 65, { minerals: 9, oil: 3 }),
  p('aus_sa', 'aus', 'South Australia & NT', 2_600_000, 150_000, 55, { minerals: 5 }),

  // Canada
  p('can_on', 'can', 'Ontario', 14_700_000, 850_000, 80),
  p('can_qc', 'can', 'Quebec', 8_600_000, 400_000, 72),
  p('can_bc', 'can', 'British Columbia', 5_100_000, 350_000, 78, { minerals: 4 }),
  p('can_ab', 'can', 'Alberta', 4_400_000, 350_000, 75, { oil: 9 }),
  p('can_pr', 'can', 'Prairies & North', 5_200_000, 150_000, 55, { agriculture: 7, minerals: 3 }),

  // Italy
  p('ita_n', 'ita', 'Northern Italy', 28_000_000, 1_100_000, 80),
  p('ita_c', 'ita', 'Central Italy', 12_000_000, 500_000, 72, { agriculture: 5 }),
  p('ita_s', 'ita', 'Southern Italy', 20_000_000, 500_000, 55, { agriculture: 6 }),

  // Iran
  p('irn_c', 'irn', 'Central Iran', 30_000_000, 150_000, 45, { oil: 4 }),
  p('irn_w', 'irn', 'Western Iran', 25_000_000, 100_000, 35, { oil: 7 }),
  p('irn_e', 'irn', 'Eastern Iran', 15_000_000, 80_000, 30, { minerals: 4 }),
  p('irn_s', 'irn', 'Southern Iran', 15_000_000, 70_000, 32, { oil: 8 }),

  // Egypt
  p('egy_n', 'egy', 'Nile Delta', 50_000_000, 200_000, 50, { agriculture: 8 }),
  p('egy_c', 'egy', 'Cairo Region', 25_000_000, 150_000, 55),
  p('egy_s', 'egy', 'Upper Egypt', 29_000_000, 50_000, 30, { agriculture: 5 }),

  // Israel
  p('isr_c', 'isr', 'Central District', 5_000_000, 300_000, 85),
  p('isr_s', 'isr', 'Southern District', 2_000_000, 100_000, 65, { minerals: 3 }),
  p('isr_n', 'isr', 'Northern District', 2_000_000, 100_000, 70, { agriculture: 4 }),

  // Poland
  p('pol_c', 'pol', 'Central Poland', 12_000_000, 300_000, 68),
  p('pol_s', 'pol', 'Southern Poland', 12_000_000, 200_000, 62, { minerals: 5 }),
  p('pol_n', 'pol', 'Northern Poland', 14_000_000, 200_000, 60, { agriculture: 5 }),

  // Mexico
  p('mex_c', 'mex', 'Central Mexico', 45_000_000, 550_000, 55),
  p('mex_n', 'mex', 'Northern Mexico', 40_000_000, 450_000, 50, { oil: 3, minerals: 4 }),
  p('mex_s', 'mex', 'Southern Mexico', 30_000_000, 200_000, 35, { agriculture: 6 }),
  p('mex_se', 'mex', 'Yucatán & SE', 15_000_000, 100_000, 40, { oil: 5 }),
];

export function getProvincesForCountry(provinces: Record<string, Province>, countryId: string): Province[] {
  return Object.values(provinces).filter(p => p.countryId === countryId);
}
