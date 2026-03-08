import { Country, Resources, CountryId } from '@/types/game';

const makeCountry = (
  id: string, name: string, code: string, continent: string,
  pop: number, color: string,
  startResources: Partial<Resources> = {},
  govType: Country['government']['type'] = 'democracy',
  researchSlots: number = 1,
  startTech: string[] = ['infantry_1'],
): Country => ({
  id, name, code, continent, color,
  isPlayerControlled: false,
  population: pop,
  stability: 60 + Math.floor(Math.random() * 30),
  approval: 50 + Math.floor(Math.random() * 30),
  resources: {
    food: 500, oil: 200, metal: 200, electronics: 100, money: 5000,
    ...startResources,
  },
  resourceIncome: { food: 0, oil: 0, metal: 0, electronics: 0, money: 0 }, // calculated per turn
  diplomacy: { relations: {}, embargoes: [] },
  government: {
    type: govType,
    corruption: 10 + Math.floor(Math.random() * 40),
    bureaucracyEfficiency: 40 + Math.floor(Math.random() * 40),
    policies: [],
  },
  technology: {
    researched: startTech,
    activeResearch: [],
  },
  researchSlots,
  militaryMorale: 60 + Math.floor(Math.random() * 30),
});

export const INITIAL_COUNTRIES: Country[] = [
  makeCountry('usa', 'United States', 'US', 'North America', 331_000_000, '#4A90D9',
    { food: 2000, oil: 1000, metal: 800, electronics: 600, money: 20000 }, 'democracy', 3,
    ['infantry_1', 'armor_1', 'aircraft_1', 'support_1', 'econ_1']),
  makeCountry('chn', 'China', 'CN', 'Asia', 1_400_000_000, '#DE3533',
    { food: 1500, oil: 600, metal: 1000, electronics: 500, money: 15000 }, 'communist', 3,
    ['infantry_1', 'armor_1', 'aircraft_1', 'support_1', 'econ_1']),
  makeCountry('rus', 'Russia', 'RU', 'Europe', 144_000_000, '#5C7A29',
    { food: 800, oil: 1200, metal: 900, electronics: 200, money: 8000 }, 'authoritarian', 2,
    ['infantry_1', 'armor_1', 'armor_2', 'support_1']),
  makeCountry('gbr', 'United Kingdom', 'GB', 'Europe', 67_000_000, '#2E5090',
    { food: 500, oil: 300, metal: 300, electronics: 400, money: 12000 }, 'democracy', 2,
    ['infantry_1', 'armor_1', 'aircraft_1', 'econ_1']),
  makeCountry('fra', 'France', 'FR', 'Europe', 67_000_000, '#3B5998',
    { food: 600, oil: 200, metal: 300, electronics: 350, money: 11000 }, 'democracy', 2,
    ['infantry_1', 'armor_1', 'aircraft_1', 'econ_1']),
  makeCountry('deu', 'Germany', 'DE', 'Europe', 83_000_000, '#555555',
    { food: 500, oil: 100, metal: 400, electronics: 500, money: 14000 }, 'democracy', 2,
    ['infantry_1', 'armor_1', 'armor_2', 'econ_1', 'econ_2']),
  makeCountry('jpn', 'Japan', 'JP', 'Asia', 125_000_000, '#BC002D',
    { food: 300, oil: 50, metal: 200, electronics: 800, money: 16000 }, 'democracy', 2,
    ['infantry_1', 'aircraft_1', 'econ_1', 'econ_2']),
  makeCountry('ind', 'India', 'IN', 'Asia', 1_380_000_000, '#FF9933',
    { food: 1000, oil: 200, metal: 500, electronics: 200, money: 6000 }, 'democracy', 2,
    ['infantry_1', 'armor_1', 'support_1']),
  makeCountry('bra', 'Brazil', 'BR', 'South America', 212_000_000, '#009B3A',
    { food: 1200, oil: 300, metal: 400, electronics: 100, money: 5000 }, 'democracy', 1,
    ['infantry_1', 'econ_1']),
  makeCountry('kor', 'South Korea', 'KR', 'Asia', 52_000_000, '#003478',
    { food: 200, oil: 50, metal: 200, electronics: 600, money: 10000 }, 'democracy', 2,
    ['infantry_1', 'armor_1', 'aircraft_1', 'econ_1']),
  makeCountry('tur', 'Turkey', 'TR', 'Europe', 84_000_000, '#C8102E',
    { food: 500, oil: 100, metal: 200, electronics: 80, money: 4000 }, 'democracy', 1,
    ['infantry_1', 'armor_1']),
  makeCountry('sau', 'Saudi Arabia', 'SA', 'Middle East', 35_000_000, '#006C35',
    { food: 100, oil: 2000, metal: 100, electronics: 50, money: 15000 }, 'monarchy', 1,
    ['infantry_1', 'aircraft_1']),
  makeCountry('aus', 'Australia', 'AU', 'Oceania', 25_000_000, '#00843D',
    { food: 400, oil: 200, metal: 500, electronics: 200, money: 8000 }, 'democracy', 1,
    ['infantry_1', 'armor_1', 'econ_1']),
  makeCountry('can', 'Canada', 'CA', 'North America', 38_000_000, '#FF0000',
    { food: 600, oil: 600, metal: 300, electronics: 200, money: 9000 }, 'democracy', 1,
    ['infantry_1', 'armor_1', 'econ_1']),
  makeCountry('ita', 'Italy', 'IT', 'Europe', 60_000_000, '#008C45',
    { food: 400, oil: 80, metal: 200, electronics: 250, money: 8000 }, 'democracy', 1,
    ['infantry_1', 'armor_1', 'econ_1']),
  makeCountry('irn', 'Iran', 'IR', 'Middle East', 85_000_000, '#239F40',
    { food: 300, oil: 800, metal: 200, electronics: 50, money: 3000 }, 'authoritarian', 1,
    ['infantry_1', 'support_1']),
  makeCountry('egy', 'Egypt', 'EG', 'Africa', 104_000_000, '#C09300',
    { food: 600, oil: 100, metal: 100, electronics: 30, money: 2000 }, 'authoritarian', 1,
    ['infantry_1']),
  makeCountry('isr', 'Israel', 'IL', 'Middle East', 9_000_000, '#0038B8',
    { food: 100, oil: 20, metal: 100, electronics: 300, money: 8000 }, 'democracy', 2,
    ['infantry_1', 'infantry_2', 'armor_1', 'armor_2', 'aircraft_1', 'support_1', 'support_2']),
  makeCountry('pol', 'Poland', 'PL', 'Europe', 38_000_000, '#DC143C',
    { food: 400, oil: 50, metal: 200, electronics: 100, money: 4000 }, 'democracy', 1,
    ['infantry_1', 'armor_1']),
  makeCountry('mex', 'Mexico', 'MX', 'North America', 130_000_000, '#006847',
    { food: 500, oil: 200, metal: 150, electronics: 60, money: 3000 }, 'democracy', 1,
    ['infantry_1']),
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
            if ((c.id === 'usa' && o.id === 'gbr') || (c.id === 'gbr' && o.id === 'usa')) base = 80;
            if ((c.id === 'usa' && o.id === 'can') || (c.id === 'can' && o.id === 'usa')) base = 85;
            if ((c.id === 'usa' && o.id === 'rus') || (c.id === 'rus' && o.id === 'usa')) base = -30;
            if ((c.id === 'usa' && o.id === 'chn') || (c.id === 'chn' && o.id === 'usa')) base = -20;
            if ((c.id === 'irn' && o.id === 'isr') || (c.id === 'isr' && o.id === 'irn')) base = -80;
            if ((c.id === 'usa' && o.id === 'kor') || (c.id === 'kor' && o.id === 'usa')) base = 70;
            if ((c.id === 'usa' && o.id === 'jpn') || (c.id === 'jpn' && o.id === 'usa')) base = 75;
            return [o.id, Math.max(-100, Math.min(100, base))];
          })
      ),
    },
  }));
};
