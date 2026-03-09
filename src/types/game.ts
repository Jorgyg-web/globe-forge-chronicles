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
  activeBattles: ActiveBattle[];
}

export interface ActiveBattle {
  provinceId: ProvinceId;
  attackerCountryId: CountryId;
  defenderCountryId: CountryId;
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
  | 'industrialComplex' | 'infrastructure' | 'resourceExtractor'
  | 'militaryBase' | 'airbase' | 'navalBase'
  | 'fortification' | 'radar' | 'antiAirDefense';

export interface Building {
  type: BuildingType;
  level: number;
}

export interface BuildingInfo {
  name: string;
  category: 'economic' | 'military_production' | 'defensive';
  baseCost: Resources;
  buildTime: number;
  maxLevel: number;
  description: string;
  bonuses: {
    production?: number;      // % increase per level
    movementSpeed?: number;   // % increase per level
    resourceYield?: number;   // % increase per level
    defenseBonus?: number;    // % increase per level
    unitTraining?: boolean;   // enables unit training
    aircraftProduction?: boolean;
    navalProduction?: boolean;
    radarRange?: number;      // detection range bonus per level
    antiAirEfficiency?: number; // % per level
  };
}

export const BUILDING_INFO: Record<BuildingType, BuildingInfo> = {
  industrialComplex: {
    name: 'Industrial Complex',
    category: 'economic',
    baseCost: { food: 0, oil: 100, metal: 600, electronics: 250, money: 2500 },
    buildTime: 4,
    maxLevel: 5,
    description: 'Increases province production output and manufacturing capacity',
    bonuses: { production: 15 },
  },
  infrastructure: {
    name: 'Infrastructure',
    category: 'economic',
    baseCost: { food: 0, oil: 150, metal: 400, electronics: 100, money: 1800 },
    buildTime: 3,
    maxLevel: 5,
    description: 'Improves logistics, unit movement speed, and supply efficiency',
    bonuses: { movementSpeed: 20 },
  },
  resourceExtractor: {
    name: 'Resource Extractor',
    category: 'economic',
    baseCost: { food: 0, oil: 50, metal: 450, electronics: 80, money: 1200 },
    buildTime: 3,
    maxLevel: 5,
    description: 'Increases extraction of local resources',
    bonuses: { resourceYield: 18 },
  },
  militaryBase: {
    name: 'Military Base',
    category: 'military_production',
    baseCost: { food: 0, oil: 200, metal: 700, electronics: 200, money: 3500 },
    buildTime: 5,
    maxLevel: 5,
    description: 'Trains infantry, tanks, artillery and support units',
    bonuses: { unitTraining: true },
  },
  airbase: {
    name: 'Airbase',
    category: 'military_production',
    baseCost: { food: 0, oil: 350, metal: 550, electronics: 450, money: 4500 },
    buildTime: 6,
    maxLevel: 5,
    description: 'Produces fighters, bombers, and drones',
    bonuses: { aircraftProduction: true },
  },
  navalBase: {
    name: 'Naval Base',
    category: 'military_production',
    baseCost: { food: 0, oil: 450, metal: 800, electronics: 350, money: 5500 },
    buildTime: 7,
    maxLevel: 5,
    description: 'Produces naval vessels and enables sea operations',
    bonuses: { navalProduction: true },
  },
  fortification: {
    name: 'Fortifications',
    category: 'defensive',
    baseCost: { food: 0, oil: 50, metal: 700, electronics: 100, money: 1500 },
    buildTime: 4,
    maxLevel: 5,
    description: 'Provides defensive bonus during combat and protects garrison',
    bonuses: { defenseBonus: 12 },
  },
  radar: {
    name: 'Radar Station',
    category: 'defensive',
    baseCost: { food: 0, oil: 100, metal: 300, electronics: 500, money: 2000 },
    buildTime: 3,
    maxLevel: 5,
    description: 'Detects enemy movement and improves anti-air targeting',
    bonuses: { radarRange: 1, antiAirEfficiency: 10 },
  },
  antiAirDefense: {
    name: 'Anti-Air Defense',
    category: 'defensive',
    baseCost: { food: 0, oil: 120, metal: 450, electronics: 350, money: 1800 },
    buildTime: 4,
    maxLevel: 5,
    description: 'Shoots down enemy aircraft attacking the province',
    bonuses: { antiAirEfficiency: 18 },
  },
};

// ─── Province ───
export interface Province {
  id: ProvinceId;
  countryId: CountryId;
  originalCountryId: CountryId;
  name: string;
  population: number;
  morale: number;
  stability: number;
  corruption: number;
  resourceProduction: Resources;
  buildings: Building[];
  terrain: TerrainType;
  isCoastal: boolean;
  development: number;
  adjacentProvinces: ProvinceId[];
  geometry: string; // SVG path string for map rendering
}

export type TerrainType = 'plains' | 'forest' | 'mountain' | 'desert' | 'jungle' | 'urban' | 'coastal' | 'arctic';

export const TERRAIN_DEFENSE_BONUS: Record<TerrainType, number> = {
  plains: 0, forest: 0.2, mountain: 0.4, desert: -0.05, jungle: 0.25, urban: 0.25, coastal: 0.1, arctic: 0.1,
};

/** Higher = slower movement */
export const TERRAIN_MOVEMENT_COST: Record<TerrainType, number> = {
  plains: 1, forest: 1.4, mountain: 2, desert: 1.3, jungle: 1.6, urban: 0.8, coastal: 1, arctic: 1.8,
};

/** Supply efficiency multiplier (1 = normal, lower = worse) */
export const TERRAIN_SUPPLY_EFFICIENCY: Record<TerrainType, number> = {
  plains: 1, forest: 0.85, mountain: 0.7, desert: 0.6, jungle: 0.55, urban: 1.1, coastal: 0.95, arctic: 0.5,
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
  buildTime: number;
  health: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
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
  health: number;
  level: number;
}

// ─── Army ───
export interface Army {
  id: ArmyId;
  countryId: CountryId;
  provinceId: ProvinceId;
  targetProvinceId: ProvinceId | null;
  movementProgress: number;
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
  resources: Resources;
  resourceIncome: Resources;
  population: number;
  stability: number;
  approval: number;
  color: string;
  diplomacy: DiplomacyState;
  government: Government;
  technology: TechnologyState;
  researchSlots: number;
  militaryMorale: number;
}

// ─── Diplomacy ───
export interface DiplomacyState {
  relations: Record<CountryId, number>;
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

// ─── Technology ───
export type TechCategory = 'infantry' | 'armor' | 'aircraft' | 'naval' | 'support' | 'economic';

export interface TechnologyState {
  researched: string[];
  activeResearch: ActiveResearch[];
}

export interface ActiveResearch {
  techId: string;
  progress: number;
}

export interface Technology {
  id: string;
  name: string;
  category: TechCategory;
  tier: number;
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
  | { type: 'BUILD_IN_PROVINCE'; provinceId: ProvinceId; buildingType: BuildingType }
  | { type: 'UPGRADE_BUILDING'; provinceId: ProvinceId; buildingType: BuildingType }
  | { type: 'CANCEL_CONSTRUCTION'; itemId: string }
  | { type: 'PRODUCE_UNITS'; provinceId: ProvinceId; unitType: UnitType; quantity: number }
  | { type: 'CANCEL_PRODUCTION'; itemId: string }
  | { type: 'CREATE_ARMY'; provinceId: ProvinceId; units: { type: UnitType; count: number }[]; name: string }
  | { type: 'MOVE_ARMY'; armyId: ArmyId; targetProvinceId: ProvinceId }
  | { type: 'MERGE_ARMIES'; armyIds: ArmyId[] }
  | { type: 'SPLIT_ARMY'; armyId: ArmyId; units: { type: UnitType; count: number }[] }
  | { type: 'START_RESEARCH'; countryId: CountryId; techId: string }
  | { type: 'CANCEL_RESEARCH'; countryId: CountryId; techId: string }
  | { type: 'DECLARE_WAR'; attackerId: CountryId; defenderId: CountryId }
  | { type: 'PROPOSE_ALLIANCE'; fromId: CountryId; toId: CountryId; allianceType: Alliance['type'] }
  | { type: 'PROPOSE_TRADE'; fromId: CountryId; toId: CountryId; value: number }
  | { type: 'SET_EMBARGO'; countryId: CountryId; targetId: CountryId }
  | { type: 'REMOVE_EMBARGO'; countryId: CountryId; targetId: CountryId }
  | { type: 'OFFER_PEACE'; fromId: CountryId; toId: CountryId };
