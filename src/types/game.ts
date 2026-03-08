// Core game types - designed for future multiplayer serialization

export type CountryId = string;
export type ProvinceId = string;
export type PlayerId = string;
export type ArmyId = string;

export interface GameState {
  turn: number;
  year: number;
  month: number;
  countries: Record<CountryId, Country>;
  provinces: Record<ProvinceId, Province>;
  armies: Record<ArmyId, Army>;
  wars: War[];
  alliances: Alliance[];
  tradeAgreements: TradeAgreement[];
  playerCountryId: CountryId;
  events: GameEvent[];
  speed: GameSpeed;
  paused: boolean;
  constructionQueue: ConstructionItem[];
  productionQueue: ProductionItem[];
}

// ─── Resources ───
export interface Resources {
  food: number;
  oil: number;
  metal: number;
  electronics: number;
  money: number;
}

export const RESOURCE_KEYS: (keyof Resources)[] = ['food', 'oil', 'metal', 'electronics', 'money'];

// ─── Buildings ───
export type BuildingType =
  // Economic
  | 'industry' | 'infrastructure' | 'resourceExtractor'
  // Military production
  | 'barracks' | 'tankFactory' | 'aircraftFactory' | 'navalBase'
  // Defensive
  | 'bunker' | 'antiAirDefense' | 'fortification';

export interface Building {
  type: BuildingType;
  level: number; // 1-5
}

export const BUILDING_INFO: Record<BuildingType, {
  name: string; category: 'economic' | 'military_production' | 'defensive';
  baseCost: Resources; buildTime: number; maxLevel: number;
  description: string;
}> = {
  industry: { name: 'Industry', category: 'economic', baseCost: { food: 0, oil: 0, metal: 500, electronics: 200, money: 2000 }, buildTime: 4, maxLevel: 5, description: 'Increases province production output' },
  infrastructure: { name: 'Infrastructure', category: 'economic', baseCost: { food: 0, oil: 100, metal: 300, electronics: 100, money: 1500 }, buildTime: 3, maxLevel: 5, description: 'Improves logistics and unit movement speed' },
  resourceExtractor: { name: 'Resource Extractor', category: 'economic', baseCost: { food: 0, oil: 0, metal: 400, electronics: 100, money: 1000 }, buildTime: 3, maxLevel: 5, description: 'Increases resource production' },
  barracks: { name: 'Barracks', category: 'military_production', baseCost: { food: 0, oil: 0, metal: 300, electronics: 50, money: 1000 }, buildTime: 3, maxLevel: 5, description: 'Produces infantry and support units' },
  tankFactory: { name: 'Tank Factory', category: 'military_production', baseCost: { food: 0, oil: 200, metal: 800, electronics: 300, money: 3000 }, buildTime: 5, maxLevel: 5, description: 'Produces armored vehicles and tanks' },
  aircraftFactory: { name: 'Aircraft Factory', category: 'military_production', baseCost: { food: 0, oil: 300, metal: 600, electronics: 500, money: 4000 }, buildTime: 6, maxLevel: 5, description: 'Produces aircraft and drones' },
  navalBase: { name: 'Naval Base', category: 'military_production', baseCost: { food: 0, oil: 400, metal: 700, electronics: 300, money: 5000 }, buildTime: 7, maxLevel: 5, description: 'Produces naval vessels' },
  bunker: { name: 'Bunker', category: 'defensive', baseCost: { food: 0, oil: 0, metal: 500, electronics: 50, money: 800 }, buildTime: 3, maxLevel: 5, description: 'Reduces damage to defending units' },
  antiAirDefense: { name: 'Anti-Air Defense', category: 'defensive', baseCost: { food: 0, oil: 100, metal: 400, electronics: 300, money: 1500 }, buildTime: 4, maxLevel: 5, description: 'Shoots down enemy aircraft' },
  fortification: { name: 'Fortification', category: 'defensive', baseCost: { food: 0, oil: 0, metal: 600, electronics: 100, money: 1200 }, buildTime: 4, maxLevel: 5, description: 'Defensive bonus for garrison' },
};

// ─── Province ───
export interface Province {
  id: ProvinceId;
  countryId: CountryId;
  originalCountryId: CountryId; // who originally owned it
  name: string;
  population: number;
  morale: number; // 0-100 affects production, rebellion
  stability: number; // 0-100
  corruption: number; // 0-100
  resourceProduction: Resources; // base production per turn
  buildings: Building[];
  terrain: TerrainType;
  isCoastal: boolean;
  development: number; // 0-100
  adjacentProvinces: ProvinceId[]; // for army movement
}

export type TerrainType = 'plains' | 'forest' | 'mountain' | 'desert' | 'urban' | 'coastal' | 'arctic';

export const TERRAIN_DEFENSE_BONUS: Record<TerrainType, number> = {
  plains: 0, forest: 0.15, mountain: 0.35, desert: -0.05, urban: 0.25, coastal: 0.1, arctic: 0.1,
};

// ─── Construction Queue ───
export type ConstructionCategory = 'building' | 'repair';

export interface ConstructionItem {
  id: string;
  countryId: CountryId;
  provinceId: ProvinceId;
  category: ConstructionCategory;
  buildingType: BuildingType;
  targetLevel: number;
  label: string;
  cost: Resources;
  turnsRequired: number;
  turnsRemaining: number;
  startedTurn: number;
}

// ─── Unit Production Queue ───
export interface ProductionItem {
  id: string;
  countryId: CountryId;
  provinceId: ProvinceId;
  unitType: UnitType;
  quantity: number;
  turnsRequired: number;
  turnsRemaining: number;
  cost: Resources;
}

// ─── Units ───
export type UnitType =
  | 'infantry' | 'motorizedInfantry' | 'armoredCar' | 'tank'
  | 'artillery' | 'antiTank' | 'antiAir'
  | 'fighter' | 'bomber' | 'drone'
  | 'missileSystem';

export type ArmorClass = 'unarmored' | 'light' | 'heavy' | 'aircraft';

export interface UnitStats {
  name: string;
  cost: Resources;
  buildTime: number; // turns
  health: number;
  attack: number;
  defense: number;
  speed: number; // provinces per turn
  range: number; // 0 = melee, 1+ = ranged
  supplyUsage: number;
  armorClass: ArmorClass;
  strongVs: ArmorClass[];
  weakVs: ArmorClass[];
  requiredBuilding: BuildingType;
  requiredResearch?: string;
  icon: string;
}

export interface ArmyUnit {
  type: UnitType;
  count: number;
  health: number; // 0-100 average health
  level: number; // tech level when produced
}

// ─── Army (stack of units on map) ───
export interface Army {
  id: ArmyId;
  countryId: CountryId;
  provinceId: ProvinceId;
  targetProvinceId: ProvinceId | null; // moving towards
  movementProgress: number; // 0-1
  units: ArmyUnit[];
  name: string;
}

export type GameSpeed = 'slow' | 'normal' | 'fast';

// ─── Country ───
export interface Country {
  id: CountryId;
  name: string;
  code: string;
  continent: string;
  isPlayerControlled: boolean;
  resources: Resources; // stockpile
  resourceIncome: Resources; // calculated per turn
  population: number;
  stability: number; // 0-100
  approval: number; // 0-100
  color: string;
  diplomacy: DiplomacyState;
  government: Government;
  technology: TechnologyState;
  researchSlots: number;
  militaryMorale: number; // 0-100
}

// ─── Diplomacy ───
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

// ─── Government ───
export interface Government {
  type: 'democracy' | 'authoritarian' | 'monarchy' | 'communist';
  corruption: number;
  bureaucracyEfficiency: number;
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

// ─── Technology / Research ───
export type TechCategory = 'infantry' | 'armor' | 'aircraft' | 'naval' | 'support' | 'economic';

export interface TechnologyState {
  researched: string[];
  activeResearch: ActiveResearch[];
}

export interface ActiveResearch {
  techId: string;
  progress: number; // 0 to cost
}

export interface Technology {
  id: string;
  name: string;
  category: TechCategory;
  tier: number; // 1-5 level
  cost: number;
  prerequisites: string[];
  effects: TechEffect[];
  description: string;
  unlocksUnit?: UnitType;
}

export interface TechEffect {
  target: string;
  modifier: number;
  description: string;
}

// ─── War & Combat ───
export interface War {
  id: string;
  attackers: CountryId[];
  defenders: CountryId[];
  startTurn: number;
  battles: BattleReport[];
  active: boolean;
}

export interface BattleReport {
  turn: number;
  provinceId: ProvinceId;
  attackerCountryId: CountryId;
  defenderCountryId: CountryId;
  attackerLosses: Partial<Record<UnitType, number>>;
  defenderLosses: Partial<Record<UnitType, number>>;
  winner: 'attacker' | 'defender' | 'draw';
  description: string;
  provinceCaptured: boolean;
}

// ─── Events ───
export interface GameEvent {
  id: string;
  turn: number;
  type: 'war' | 'diplomacy' | 'economy' | 'military' | 'technology' | 'disaster' | 'political' | 'construction' | 'production' | 'conquest';
  title: string;
  description: string;
  countryId?: CountryId;
}

// ─── Actions ───
export type GameAction =
  | { type: 'NEXT_TURN' }
  | { type: 'SET_SPEED'; speed: GameSpeed }
  | { type: 'TOGGLE_PAUSE' }
  // Province building
  | { type: 'BUILD_IN_PROVINCE'; provinceId: ProvinceId; buildingType: BuildingType }
  | { type: 'UPGRADE_BUILDING'; provinceId: ProvinceId; buildingType: BuildingType }
  | { type: 'CANCEL_CONSTRUCTION'; itemId: string }
  // Unit production
  | { type: 'PRODUCE_UNITS'; provinceId: ProvinceId; unitType: UnitType; quantity: number }
  | { type: 'CANCEL_PRODUCTION'; itemId: string }
  // Army
  | { type: 'CREATE_ARMY'; provinceId: ProvinceId; units: { type: UnitType; count: number }[]; name: string }
  | { type: 'MOVE_ARMY'; armyId: ArmyId; targetProvinceId: ProvinceId }
  | { type: 'MERGE_ARMIES'; armyIds: ArmyId[] }
  | { type: 'SPLIT_ARMY'; armyId: ArmyId; units: { type: UnitType; count: number }[] }
  // Research
  | { type: 'START_RESEARCH'; countryId: CountryId; techId: string }
  | { type: 'CANCEL_RESEARCH'; countryId: CountryId; techId: string }
  // Diplomacy
  | { type: 'DECLARE_WAR'; attackerId: CountryId; defenderId: CountryId }
  | { type: 'PROPOSE_ALLIANCE'; fromId: CountryId; toId: CountryId; allianceType: Alliance['type'] }
  | { type: 'PROPOSE_TRADE'; fromId: CountryId; toId: CountryId; value: number }
  | { type: 'SET_EMBARGO'; countryId: CountryId; targetId: CountryId }
  | { type: 'REMOVE_EMBARGO'; countryId: CountryId; targetId: CountryId }
  | { type: 'OFFER_PEACE'; fromId: CountryId; toId: CountryId };
