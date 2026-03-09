import { Technology, TechCategory } from '@/types/game';

export const TECHNOLOGIES: Technology[] = [
  { id: 'infantry_1', name: 'Infantry Drills I', category: 'infantry', cost: 30, researchTime: 2, prerequisites: [], effects: [{ target: 'infantry_attack', modifier: 0.1 }] },
  { id: 'infantry_2', name: 'Infantry Drills II', category: 'infantry', cost: 60, researchTime: 3, prerequisites: ['infantry_1'], effects: [{ target: 'infantry_attack', modifier: 0.12 }] },
  { id: 'infantry_3', name: 'Combined Arms Infantry', category: 'infantry', cost: 100, researchTime: 4, prerequisites: ['infantry_2'], effects: [{ target: 'infantry_attack', modifier: 0.15 }] },

  { id: 'motorized_1', name: 'Motorized Infantry', category: 'logistics', cost: 50, researchTime: 3, prerequisites: ['infantry_1'], effects: [{ target: 'logistics_speed', modifier: 0.1 }], unlocksUnit: 'motorizedInfantry' },

  { id: 'armor_1', name: 'Armor Doctrine I', category: 'armor', cost: 50, researchTime: 3, prerequisites: [], effects: [{ target: 'armor_attack', modifier: 0.12 }], unlocksUnit: 'armoredCar' },
  { id: 'armor_2', name: 'Armor Doctrine II', category: 'armor', cost: 100, researchTime: 4, prerequisites: ['armor_1'], effects: [{ target: 'armor_attack', modifier: 0.15 }, { target: 'tank_speed', modifier: 0.08 }], unlocksUnit: 'tank' },
  { id: 'armor_3', name: 'Armor Doctrine III', category: 'armor', cost: 160, researchTime: 5, prerequisites: ['armor_2'], effects: [{ target: 'armor_attack', modifier: 0.2 }, { target: 'tank_speed', modifier: 0.1 }] },
  { id: 'armor_4', name: 'Advanced Tank Warfare', category: 'armor', cost: 250, researchTime: 6, prerequisites: ['armor_3'], effects: [{ target: 'armor_attack', modifier: 0.25 }, { target: 'tank_speed', modifier: 0.12 }] },

  { id: 'aircraft_1', name: 'Air Doctrine I', category: 'air', cost: 60, researchTime: 3, prerequisites: [], effects: [{ target: 'air_attack', modifier: 0.1 }], unlocksUnit: 'fighter' },
  { id: 'aircraft_2', name: 'Air Doctrine II', category: 'air', cost: 120, researchTime: 4, prerequisites: ['aircraft_1'], effects: [{ target: 'air_attack', modifier: 0.15 }], unlocksUnit: 'bomber' },
  { id: 'aircraft_3', name: 'Air Doctrine III', category: 'air', cost: 200, researchTime: 5, prerequisites: ['aircraft_2'], effects: [{ target: 'air_attack', modifier: 0.2 }] },

  { id: 'naval_1', name: 'Naval Warfare I', category: 'naval', cost: 70, researchTime: 3, prerequisites: [], effects: [{ target: 'naval_attack', modifier: 0.12 }] },
  { id: 'naval_2', name: 'Naval Warfare II', category: 'naval', cost: 140, researchTime: 5, prerequisites: ['naval_1'], effects: [{ target: 'naval_attack', modifier: 0.18 }] },

  { id: 'support_1', name: 'Field Logistics', category: 'logistics', cost: 40, researchTime: 2, prerequisites: [], effects: [{ target: 'unit_production_speed', modifier: 0.1 }], unlocksUnit: 'artillery' },
  { id: 'support_2', name: 'Integrated Logistics', category: 'logistics', cost: 80, researchTime: 3, prerequisites: ['support_1'], effects: [{ target: 'unit_production_speed', modifier: 0.12 }, { target: 'logistics_speed', modifier: 0.08 }] },
  { id: 'support_3', name: 'Advanced Support Systems', category: 'logistics', cost: 150, researchTime: 4, prerequisites: ['support_2'], effects: [{ target: 'unit_production_speed', modifier: 0.15 }], unlocksUnit: 'missileSystem' },
  { id: 'drone_warfare', name: 'Drone Warfare', category: 'air', cost: 70, researchTime: 3, prerequisites: ['support_1'], effects: [{ target: 'air_attack', modifier: 0.1 }], unlocksUnit: 'drone' },

  { id: 'econ_1', name: 'Industrial Output I', category: 'industry', cost: 40, researchTime: 2, prerequisites: [], effects: [{ target: 'industry_output', modifier: 0.1 }] },
  { id: 'econ_2', name: 'Industrial Output II', category: 'industry', cost: 80, researchTime: 3, prerequisites: ['econ_1'], effects: [{ target: 'industry_output', modifier: 0.12 }] },
  { id: 'econ_3', name: 'Industrial Output III', category: 'industry', cost: 120, researchTime: 4, prerequisites: ['econ_2'], effects: [{ target: 'industry_output', modifier: 0.15 }] },
  { id: 'econ_4', name: 'Industrial Output IV', category: 'industry', cost: 180, researchTime: 5, prerequisites: ['econ_3'], effects: [{ target: 'industry_output', modifier: 0.18 }] },
];

export const TECH_CATEGORIES: TechCategory[] = ['infantry', 'armor', 'air', 'naval', 'industry', 'logistics'];

export const TECH_CATEGORY_INFO: Record<TechCategory, { name: string; icon: string; color: string }> = {
  infantry: { name: 'Infantry', icon: '🪖', color: 'hsl(120, 40%, 45%)' },
  armor: { name: 'Armor', icon: '🛡️', color: 'hsl(35, 80%, 50%)' },
  air: { name: 'Air', icon: '✈️', color: 'hsl(210, 60%, 55%)' },
  naval: { name: 'Naval', icon: '⚓', color: 'hsl(195, 60%, 50%)' },
  industry: { name: 'Industry', icon: '🏭', color: 'hsl(42, 100%, 58%)' },
  logistics: { name: 'Logistics', icon: '🚚', color: 'hsl(18, 70%, 55%)' },
};

export function getResearchPerTurn(provinces: { buildings: { type: string; level: number }[] }[]): number {
  let rp = 5;
  for (const prov of provinces) {
    for (const b of prov.buildings) {
      if (b.type === 'industrialComplex') rp += b.level * 2;
    }
  }
  return rp;
}
