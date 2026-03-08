import { Technology, TechCategory } from '@/types/game';

// Research tree: each category has tiers 1-5
// Higher tiers unlock stronger units and grant bonuses

export const TECHNOLOGIES: Technology[] = [
  // ─── Infantry ───
  { id: 'infantry_1', name: 'Infantry Lv.1', category: 'infantry', tier: 1, cost: 30, prerequisites: [],
    effects: [{ target: 'infantry_attack', modifier: 0.1, description: '+10% infantry attack' }],
    description: 'Basic infantry training.', unlocksUnit: 'infantry' },
  { id: 'infantry_2', name: 'Infantry Lv.2', category: 'infantry', tier: 2, cost: 60, prerequisites: ['infantry_1'],
    effects: [{ target: 'infantry_defense', modifier: 0.15, description: '+15% infantry defense' }],
    description: 'Improved infantry equipment.' },
  { id: 'infantry_3', name: 'Infantry Lv.3', category: 'infantry', tier: 3, cost: 100, prerequisites: ['infantry_2'],
    effects: [{ target: 'infantry_attack', modifier: 0.2, description: '+20% infantry attack' }],
    description: 'Advanced combat tactics.' },
  { id: 'motorized_1', name: 'Motorized Troops', category: 'infantry', tier: 2, cost: 50, prerequisites: ['infantry_1'],
    effects: [{ target: 'speed', modifier: 0.2, description: '+20% movement speed' }],
    description: 'Motorized infantry transport.', unlocksUnit: 'motorizedInfantry' },

  // ─── Armor ───
  { id: 'armor_1', name: 'Armor Lv.1', category: 'armor', tier: 1, cost: 50, prerequisites: [],
    effects: [{ target: 'armor_defense', modifier: 0.15, description: '+15% armor defense' }],
    description: 'Light armored vehicles.', unlocksUnit: 'armoredCar' },
  { id: 'armor_2', name: 'Armor Lv.2', category: 'armor', tier: 2, cost: 100, prerequisites: ['armor_1'],
    effects: [{ target: 'armor_attack', modifier: 0.2, description: '+20% armor attack' }],
    description: 'Main battle tanks.', unlocksUnit: 'tank' },
  { id: 'armor_3', name: 'Armor Lv.3', category: 'armor', tier: 3, cost: 160, prerequisites: ['armor_2'],
    effects: [{ target: 'armor_defense', modifier: 0.25, description: '+25% armor defense' }],
    description: 'Composite reactive armor.' },
  { id: 'armor_4', name: 'Armor Lv.4', category: 'armor', tier: 4, cost: 250, prerequisites: ['armor_3'],
    effects: [{ target: 'armor_attack', modifier: 0.3, description: '+30% armor attack' }],
    description: 'Next-gen armor systems.' },

  // ─── Aircraft ───
  { id: 'aircraft_1', name: 'Aircraft Lv.1', category: 'aircraft', tier: 1, cost: 60, prerequisites: [],
    effects: [{ target: 'air_attack', modifier: 0.1, description: '+10% air attack' }],
    description: 'Basic air doctrine.', unlocksUnit: 'fighter' },
  { id: 'aircraft_2', name: 'Aircraft Lv.2', category: 'aircraft', tier: 2, cost: 120, prerequisites: ['aircraft_1'],
    effects: [{ target: 'air_attack', modifier: 0.2, description: '+20% air attack' }],
    description: 'Strategic bombing.', unlocksUnit: 'bomber' },
  { id: 'aircraft_3', name: 'Aircraft Lv.3', category: 'aircraft', tier: 3, cost: 200, prerequisites: ['aircraft_2'],
    effects: [{ target: 'air_defense', modifier: 0.25, description: '+25% air defense' }],
    description: 'Stealth technology.' },

  // ─── Naval (future expansion placeholder) ───
  { id: 'naval_1', name: 'Naval Lv.1', category: 'naval', tier: 1, cost: 70, prerequisites: [],
    effects: [{ target: 'naval_power', modifier: 0.15, description: '+15% naval power' }],
    description: 'Coastal defense fleet.' },
  { id: 'naval_2', name: 'Naval Lv.2', category: 'naval', tier: 2, cost: 140, prerequisites: ['naval_1'],
    effects: [{ target: 'naval_power', modifier: 0.25, description: '+25% naval power' }],
    description: 'Blue water navy.' },

  // ─── Support ───
  { id: 'support_1', name: 'Support Lv.1', category: 'support', tier: 1, cost: 40, prerequisites: [],
    effects: [{ target: 'support_effectiveness', modifier: 0.15, description: '+15% support units' }],
    description: 'Anti-tank and artillery.', unlocksUnit: 'artillery' },
  { id: 'support_2', name: 'Support Lv.2', category: 'support', tier: 2, cost: 80, prerequisites: ['support_1'],
    effects: [{ target: 'antiair_effectiveness', modifier: 0.2, description: '+20% anti-air' }],
    description: 'Anti-air defense systems.' },
  { id: 'support_3', name: 'Support Lv.3', category: 'support', tier: 3, cost: 150, prerequisites: ['support_2'],
    effects: [{ target: 'missile_attack', modifier: 0.3, description: '+30% missile attack' }],
    description: 'Advanced missile systems.', unlocksUnit: 'missileSystem' },
  { id: 'drone_warfare', name: 'Drone Warfare', category: 'support', tier: 2, cost: 70, prerequisites: ['support_1'],
    effects: [{ target: 'drone_attack', modifier: 0.25, description: '+25% drone effectiveness' }],
    description: 'Combat drone technology.', unlocksUnit: 'drone' },

  // ─── Economic ───
  { id: 'econ_1', name: 'Industrial Output', category: 'economic', tier: 1, cost: 40, prerequisites: [],
    effects: [{ target: 'production_speed', modifier: 0.1, description: '+10% production speed' }],
    description: 'Industrial automation.' },
  { id: 'econ_2', name: 'Advanced Logistics', category: 'economic', tier: 2, cost: 80, prerequisites: ['econ_1'],
    effects: [{ target: 'resource_production', modifier: 0.15, description: '+15% resource production' }],
    description: 'Supply chain optimization.' },
  { id: 'econ_3', name: 'Digital Economy', category: 'economic', tier: 3, cost: 120, prerequisites: ['econ_2'],
    effects: [{ target: 'money_production', modifier: 0.2, description: '+20% money production' }],
    description: 'Financial technology.' },
  { id: 'econ_4', name: 'Advanced Materials', category: 'economic', tier: 4, cost: 180, prerequisites: ['econ_3'],
    effects: [{ target: 'build_speed', modifier: 0.2, description: '+20% build speed' }],
    description: 'Next-gen material science.' },
];

export const TECH_CATEGORIES: TechCategory[] = ['infantry', 'armor', 'aircraft', 'naval', 'support', 'economic'];

export const TECH_CATEGORY_INFO: Record<TechCategory, { name: string; icon: string; color: string }> = {
  infantry: { name: 'Infantry', icon: '🪖', color: 'hsl(120, 40%, 45%)' },
  armor: { name: 'Armor', icon: '🛡️', color: 'hsl(35, 80%, 50%)' },
  aircraft: { name: 'Aircraft', icon: '✈️', color: 'hsl(210, 60%, 55%)' },
  naval: { name: 'Naval', icon: '⚓', color: 'hsl(195, 60%, 50%)' },
  support: { name: 'Support', icon: '🎯', color: 'hsl(0, 60%, 50%)' },
  economic: { name: 'Economic', icon: '📊', color: 'hsl(42, 100%, 58%)' },
};

export function getResearchPerTurn(provinces: { buildings: { type: string; level: number }[] }[]): number {
  let rp = 5; // base
  for (const prov of provinces) {
    for (const b of prov.buildings) {
      if (b.type === 'industry') rp += b.level * 2;
    }
  }
  return rp;
}
