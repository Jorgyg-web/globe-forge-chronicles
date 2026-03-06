import { Country } from '@/types/game';

const makeSector = (level: number) => ({
  level,
  output: level * 100,
  workers: level * 50000,
  growth: 0.02,
});

const makeCountry = (
  id: string, name: string, code: string, continent: string,
  pop: number, gdp: number, mil: number, color: string,
  sectorBase: number = 3, infraBase: number = 3,
): Country => ({
  id, name, code, continent, color,
  isPlayerControlled: false,
  population: pop,
  stability: 60 + Math.floor(Math.random() * 30),
  approval: 50 + Math.floor(Math.random() * 30),
  economy: {
    gdp,
    budget: {
      revenue: gdp * 0.3,
      expenses: gdp * 0.28,
      militarySpending: gdp * 0.04,
      infrastructureSpending: gdp * 0.03,
      educationSpending: gdp * 0.04,
      healthSpending: gdp * 0.05,
      researchSpending: gdp * 0.02,
    },
    taxRate: 25,
    inflation: 2 + Math.random() * 3,
    unemployment: 3 + Math.random() * 8,
    debt: gdp * (0.4 + Math.random() * 0.8),
    sectors: {
      agriculture: makeSector(sectorBase),
      energy: makeSector(sectorBase),
      manufacturing: makeSector(sectorBase + 1),
      technology: makeSector(sectorBase),
      militaryIndustry: makeSector(Math.max(1, sectorBase - 1)),
    },
    tradeBalance: (Math.random() - 0.5) * gdp * 0.1,
  },
  military: {
    units: {
      infantry: mil * 100,
      tanks: Math.floor(mil * 8),
      armoredVehicles: Math.floor(mil * 15),
      fighterJets: Math.floor(mil * 3),
      bombers: Math.floor(mil * 1.5),
      missiles: Math.floor(mil * 5),
      smallDrones: Math.floor(mil * 20),
      largeDrones: Math.floor(mil * 8),
      antiAir: Math.floor(mil * 6),
    },
    bases: Math.max(1, Math.floor(mil / 2)),
    factories: Math.max(1, Math.floor(mil / 3)),
    manpower: pop * 0.01,
    morale: 60 + Math.floor(Math.random() * 30),
    readiness: 50 + Math.floor(Math.random() * 40),
  },
  diplomacy: {
    relations: {},
    embargoes: [],
  },
  government: {
    type: 'democracy',
    corruption: 10 + Math.floor(Math.random() * 40),
    bureaucracyEfficiency: 40 + Math.floor(Math.random() * 40),
    policies: [],
  },
  technology: {
    researchPoints: 0,
    researchPerTurn: Math.floor(gdp * 0.001),
    researched: [],
    currentResearch: null,
    currentProgress: 0,
  },
  infrastructure: {
    roads: infraBase,
    railways: infraBase,
    ports: Math.max(1, infraBase - 1),
    airports: Math.max(1, infraBase - 1),
    powerPlants: infraBase,
    communications: infraBase,
  },
});

export const INITIAL_COUNTRIES: Country[] = [
  makeCountry('usa', 'United States', 'US', 'North America', 331_000_000, 25_000_000, 50, '#4A90D9', 7, 8),
  makeCountry('chn', 'China', 'CN', 'Asia', 1_400_000_000, 18_000_000, 45, '#DE3533', 6, 7),
  makeCountry('rus', 'Russia', 'RU', 'Europe', 144_000_000, 2_200_000, 40, '#5C7A29', 5, 5),
  makeCountry('gbr', 'United Kingdom', 'GB', 'Europe', 67_000_000, 3_200_000, 20, '#2E5090', 6, 7),
  makeCountry('fra', 'France', 'FR', 'Europe', 67_000_000, 3_000_000, 18, '#3B5998', 6, 7),
  makeCountry('deu', 'Germany', 'DE', 'Europe', 83_000_000, 4_200_000, 15, '#555555', 7, 8),
  makeCountry('jpn', 'Japan', 'JP', 'Asia', 125_000_000, 5_100_000, 12, '#BC002D', 8, 9),
  makeCountry('ind', 'India', 'IN', 'Asia', 1_380_000_000, 3_500_000, 30, '#FF9933', 4, 4),
  makeCountry('bra', 'Brazil', 'BR', 'South America', 212_000_000, 1_900_000, 12, '#009B3A', 4, 4),
  makeCountry('kor', 'South Korea', 'KR', 'Asia', 52_000_000, 1_800_000, 15, '#003478', 7, 7),
  makeCountry('tur', 'Turkey', 'TR', 'Europe', 84_000_000, 900_000, 14, '#C8102E', 4, 5),
  makeCountry('sau', 'Saudi Arabia', 'SA', 'Middle East', 35_000_000, 1_100_000, 16, '#006C35', 5, 6),
  makeCountry('aus', 'Australia', 'AU', 'Oceania', 25_000_000, 1_700_000, 8, '#00843D', 6, 7),
  makeCountry('can', 'Canada', 'CA', 'North America', 38_000_000, 2_100_000, 8, '#FF0000', 6, 7),
  makeCountry('ita', 'Italy', 'IT', 'Europe', 60_000_000, 2_100_000, 10, '#008C45', 5, 6),
  makeCountry('irn', 'Iran', 'IR', 'Middle East', 85_000_000, 400_000, 18, '#239F40', 3, 3),
  makeCountry('egy', 'Egypt', 'EG', 'Africa', 104_000_000, 400_000, 12, '#C09300', 3, 3),
  makeCountry('isr', 'Israel', 'IL', 'Middle East', 9_000_000, 500_000, 14, '#0038B8', 7, 7),
  makeCountry('pol', 'Poland', 'PL', 'Europe', 38_000_000, 700_000, 8, '#DC143C', 5, 5),
  makeCountry('mex', 'Mexico', 'MX', 'North America', 130_000_000, 1_300_000, 8, '#006847', 4, 4),
];

export const initializeDiplomacy = (countries: Country[]): Country[] => {
  return countries.map(c => ({
    ...c,
    diplomacy: {
      ...c.diplomacy,
      relations: Object.fromEntries(
        countries
          .filter(o => o.id !== c.id)
          .map(o => {
            let base = Math.floor(Math.random() * 60) - 20;
            // Some preset relations
            if ((c.id === 'usa' && o.id === 'gbr') || (c.id === 'gbr' && o.id === 'usa')) base = 80;
            if ((c.id === 'usa' && o.id === 'can') || (c.id === 'can' && o.id === 'usa')) base = 85;
            if ((c.id === 'usa' && o.id === 'rus') || (c.id === 'rus' && o.id === 'usa')) base = -30;
            if ((c.id === 'usa' && o.id === 'chn') || (c.id === 'chn' && o.id === 'usa')) base = -20;
            if ((c.id === 'irn' && o.id === 'isr') || (c.id === 'isr' && o.id === 'irn')) base = -80;
            return [o.id, Math.max(-100, Math.min(100, base))];
          })
      ),
    },
  }));
};
