import { Technology } from '@/types/game';

export const TECHNOLOGIES: Technology[] = [
  // Military
  { id: 'adv_infantry', name: 'Advanced Infantry Training', category: 'military', cost: 50, prerequisites: [], effects: [{ target: 'infantry_attack', modifier: 0.2, description: '+20% infantry attack' }], description: 'Modern combat tactics and equipment.' },
  { id: 'armor_tech', name: 'Composite Armor', category: 'military', cost: 80, prerequisites: [], effects: [{ target: 'tank_defense', modifier: 0.25, description: '+25% tank defense' }], description: 'Advanced composite materials for armor.' },
  { id: 'drone_warfare', name: 'Drone Warfare', category: 'military', cost: 100, prerequisites: ['adv_infantry'], effects: [{ target: 'drone_attack', modifier: 0.3, description: '+30% drone effectiveness' }], description: 'Autonomous combat drone systems.' },
  { id: 'stealth_tech', name: 'Stealth Technology', category: 'military', cost: 150, prerequisites: ['armor_tech'], effects: [{ target: 'aircraft_defense', modifier: 0.3, description: '+30% aircraft survivability' }], description: 'Radar-evading technology.' },
  { id: 'hypersonic', name: 'Hypersonic Missiles', category: 'military', cost: 200, prerequisites: ['stealth_tech'], effects: [{ target: 'missile_attack', modifier: 0.5, description: '+50% missile attack' }], description: 'Next-generation hypersonic delivery systems.' },

  // Economy
  { id: 'digital_economy', name: 'Digital Economy', category: 'economy', cost: 60, prerequisites: [], effects: [{ target: 'gdp_growth', modifier: 0.05, description: '+5% GDP growth' }], description: 'Digital transformation of the economy.' },
  { id: 'trade_networks', name: 'Trade Networks', category: 'economy', cost: 70, prerequisites: ['digital_economy'], effects: [{ target: 'trade_value', modifier: 0.15, description: '+15% trade value' }], description: 'Advanced logistics and trade routes.' },
  { id: 'fintech', name: 'Financial Technology', category: 'economy', cost: 90, prerequisites: ['digital_economy'], effects: [{ target: 'tax_efficiency', modifier: 0.1, description: '+10% tax efficiency' }], description: 'Modern financial systems.' },

  // Infrastructure
  { id: 'smart_grid', name: 'Smart Grid', category: 'infrastructure', cost: 80, prerequisites: [], effects: [{ target: 'power_efficiency', modifier: 0.2, description: '+20% power output' }], description: 'Intelligent power distribution.' },
  { id: 'high_speed_rail', name: 'High-Speed Rail', category: 'infrastructure', cost: 100, prerequisites: ['smart_grid'], effects: [{ target: 'logistics', modifier: 0.25, description: '+25% logistics' }], description: 'Ultra-fast railway connections.' },
  { id: 'fiber_optics', name: 'Fiber Optics Network', category: 'infrastructure', cost: 70, prerequisites: [], effects: [{ target: 'communications', modifier: 0.3, description: '+30% communications' }], description: 'Nationwide fiber optic infrastructure.' },

  // Industry
  { id: 'automation', name: 'Industrial Automation', category: 'industry', cost: 90, prerequisites: [], effects: [{ target: 'manufacturing_output', modifier: 0.2, description: '+20% manufacturing' }], description: 'Robotic manufacturing systems.' },
  { id: 'adv_materials', name: 'Advanced Materials', category: 'industry', cost: 110, prerequisites: ['automation'], effects: [{ target: 'all_production', modifier: 0.1, description: '+10% all production' }], description: 'Next-gen materials science.' },

  // Energy
  { id: 'renewable', name: 'Renewable Energy', category: 'energy', cost: 60, prerequisites: [], effects: [{ target: 'energy_output', modifier: 0.15, description: '+15% energy output' }], description: 'Solar, wind, and hydro power.' },
  { id: 'nuclear_fusion', name: 'Nuclear Fusion', category: 'energy', cost: 250, prerequisites: ['renewable', 'smart_grid'], effects: [{ target: 'energy_output', modifier: 0.5, description: '+50% energy output' }], description: 'Clean limitless energy.' },
];
