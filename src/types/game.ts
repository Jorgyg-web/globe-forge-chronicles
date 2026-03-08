// Core game types - designed for future multiplayer serialization

export type CountryId = string;
export type ProvinceId = string;
export type PlayerId = string;

export interface GameState {
  turn: number;
  year: number;
  month: number;
  countries: Record<CountryId, Country>;
  provinces: Record<ProvinceId, Province>;
  wars: War[];
  alliances: Alliance[];
  tradeAgreements: TradeAgreement[];
  playerCountryId: CountryId;
  events: GameEvent[];
  speed: GameSpeed;
  paused: boolean;
}

// Province
export interface Province {
  id: ProvinceId;
  countryId: CountryId;
  name: string;
  population: number;
  gdpContribution: number;
  stability: number;
  corruption: number;
  unemployment: number;
  infrastructure: ProvinceInfrastructure;
  industry: ProvinceIndustry;
  military: ProvinceMilitary;
  resources: ProvinceResources;
  development: number; // 0-100 overall development index
}

export interface ProvinceInfrastructure {
  roads: number; // 0-10
  railways: number;
  ports: number;
  airports: number;
  powerPlants: number;
  communications: number;
}

export interface ProvinceIndustry {
  civilian: number; // 0-10 factory level
  military: number; // 0-10 military factory level
  energy: number; // 0-10
  research: number; // 0-10 research center level
}

export interface ProvinceMilitary {
  bases: number;
  garrison: number; // troops stationed
}

export interface ProvinceResources {
  oil: number; // 0-10 abundance
  minerals: number;
  agriculture: number;
  rareEarth: number;
}

export type GameSpeed = 'slow' | 'normal' | 'fast';

export interface Country {
  id: CountryId;
  name: string;
  code: string;
  continent: string;
  isPlayerControlled: boolean;
  economy: Economy;
  military: Military;
  diplomacy: DiplomacyState;
  government: Government;
  technology: TechnologyState;
  infrastructure: Infrastructure;
  population: number;
  stability: number; // 0-100
  approval: number; // 0-100
  color: string;
}

// Economy
export interface Economy {
  gdp: number;
  budget: Budget;
  taxRate: number; // 0-100
  inflation: number;
  unemployment: number;
  debt: number;
  sectors: EconomySectors;
  tradeBalance: number;
}

export interface Budget {
  revenue: number;
  expenses: number;
  militarySpending: number;
  infrastructureSpending: number;
  educationSpending: number;
  healthSpending: number;
  researchSpending: number;
}

export interface EconomySectors {
  agriculture: SectorLevel;
  energy: SectorLevel;
  manufacturing: SectorLevel;
  technology: SectorLevel;
  militaryIndustry: SectorLevel;
}

export interface SectorLevel {
  level: number; // 1-10
  output: number;
  workers: number;
  growth: number;
}

// Infrastructure
export interface Infrastructure {
  roads: number; // 1-10
  railways: number;
  ports: number;
  airports: number;
  powerPlants: number;
  communications: number;
}

// Military
export interface Military {
  units: MilitaryUnits;
  bases: number;
  factories: number;
  manpower: number;
  morale: number; // 0-100
  readiness: number; // 0-100
}

export interface MilitaryUnits {
  infantry: number;
  tanks: number;
  armoredVehicles: number;
  fighterJets: number;
  bombers: number;
  missiles: number;
  smallDrones: number;
  largeDrones: number;
  antiAir: number;
}

export type UnitType = keyof MilitaryUnits;

export interface UnitStats {
  name: string;
  cost: number;
  buildTime: number;
  attack: number;
  defense: number;
  strongAgainst: UnitType[];
  weakAgainst: UnitType[];
  icon: string;
}

// Diplomacy
export interface DiplomacyState {
  relations: Record<CountryId, number>; // -100 to 100
  embargoes: CountryId[];
}

export interface Alliance {
  id: string;
  name: string;
  members: CountryId[];
  type: 'military' | 'economic' | 'both';
}

export interface TradeAgreement {
  id: string;
  countries: [CountryId, CountryId];
  value: number;
  type: 'import' | 'export' | 'bilateral';
}

// Government
export interface Government {
  type: 'democracy' | 'authoritarian' | 'monarchy' | 'communist';
  corruption: number; // 0-100
  bureaucracyEfficiency: number; // 0-100
  policies: Policy[];
}

export interface Policy {
  id: string;
  name: string;
  category: 'economic' | 'military' | 'social' | 'foreign';
  active: boolean;
  effects: PolicyEffect[];
}

export interface PolicyEffect {
  target: string;
  modifier: number;
}

// Technology
export interface TechnologyState {
  researchPoints: number;
  researchPerTurn: number;
  researched: string[];
  currentResearch: string | null;
  currentProgress: number;
}

export interface Technology {
  id: string;
  name: string;
  category: 'military' | 'economy' | 'infrastructure' | 'industry' | 'energy';
  cost: number;
  prerequisites: string[];
  effects: TechEffect[];
  description: string;
}

export interface TechEffect {
  target: string;
  modifier: number;
  description: string;
}

// War
export interface War {
  id: string;
  attackers: CountryId[];
  defenders: CountryId[];
  startTurn: number;
  battles: Battle[];
  active: boolean;
}

export interface Battle {
  turn: number;
  attackerLosses: Partial<MilitaryUnits>;
  defenderLosses: Partial<MilitaryUnits>;
  winner: 'attacker' | 'defender' | 'draw';
  description: string;
}

// Events
export interface GameEvent {
  id: string;
  turn: number;
  type: 'war' | 'diplomacy' | 'economy' | 'military' | 'technology' | 'disaster' | 'political';
  title: string;
  description: string;
  countryId?: CountryId;
}

// Actions - for multiplayer command pattern
export type GameAction =
  | { type: 'SET_TAX_RATE'; countryId: CountryId; rate: number }
  | { type: 'SET_BUDGET'; countryId: CountryId; budget: Partial<Budget> }
  | { type: 'BUILD_UNITS'; countryId: CountryId; unitType: UnitType; quantity: number }
  | { type: 'BUILD_BASE'; countryId: CountryId }
  | { type: 'BUILD_FACTORY'; countryId: CountryId }
  | { type: 'UPGRADE_SECTOR'; countryId: CountryId; sector: keyof EconomySectors }
  | { type: 'UPGRADE_INFRASTRUCTURE'; countryId: CountryId; infra: keyof Infrastructure }
  | { type: 'DECLARE_WAR'; attackerId: CountryId; defenderId: CountryId }
  | { type: 'PROPOSE_ALLIANCE'; fromId: CountryId; toId: CountryId; allianceType: Alliance['type'] }
  | { type: 'PROPOSE_TRADE'; fromId: CountryId; toId: CountryId; value: number }
  | { type: 'SET_EMBARGO'; countryId: CountryId; targetId: CountryId }
  | { type: 'REMOVE_EMBARGO'; countryId: CountryId; targetId: CountryId }
  | { type: 'START_RESEARCH'; countryId: CountryId; techId: string }
  | { type: 'SET_CORRUPTION'; countryId: CountryId; level: number }
  | { type: 'UPGRADE_PROVINCE_INFRA'; provinceId: ProvinceId; infra: keyof ProvinceInfrastructure }
  | { type: 'UPGRADE_PROVINCE_INDUSTRY'; provinceId: ProvinceId; industry: keyof ProvinceIndustry }
  | { type: 'BUILD_PROVINCE_BASE'; provinceId: ProvinceId }
  | { type: 'GARRISON_PROVINCE'; provinceId: ProvinceId; troops: number }
  | { type: 'NEXT_TURN' }
  | { type: 'SET_SPEED'; speed: GameSpeed }
  | { type: 'TOGGLE_PAUSE' };
