# Combat System Documentation

## Overview
The combat system has been completely refactored to provide multi-turn battles with realistic mechanics including terrain effects, fortifications, morale tracking, and unit health degradation.

## Key Features

### Multi-Turn Battles
- Battles now last multiple turns (typically 50-100 turns depending on army sizes)
- Each turn applies damage rates of 0.5-1.5% casualty rates instead of 15% instant casualties
- Battles conclude when one side is defeated or morale collapses below critical thresholds

### Morale System
- **Army Morale**: Each army tracks morale (0-100)
  - Starts at 75 when created
  - Decreases during combat based on power disadvantage
  - Affects combat performance
  - Armies automatically retreat when morale drops below 20
- **Country Military Morale**: Affects overall army performance
- **Morale Loss**: 4-8% per round based on relative power, plus randomization

### Terrain Modifiers

Combat effectiveness varies by terrain:
- **Mountain**: +40% defense bonus
- **Forest**: +20% defense bonus
- **Desert**: -10% attack penalty
- **Jungle**: +25% defense bonus
- **Urban**: +25% defense bonus
- **Coastal**: +10% defense bonus
- **Arctic**: +10% defense bonus
- **Plains**: Normal (no modifier)

### Fortifications
- Fortifications provide defensive bonus: +12% per level (max 5 levels = +60%)
- Stacks with terrain bonuses
- Only benefits defenders

### Unit Health Degradation
- Units lose 1 health per round during combat
- Losing side units lose additional 2 health per round (total 3/round)
- Minimum health floor of 15 prevents complete degradation

### Special Building Effects

**Radar Station**
- Reduces attacker air power effectiveness
- Provides detection range bonuses

**Anti-Air Defense**
- Reduces aircraft attack power by 8% per level during combat
- Effective against air forces

### Combat Power Calculation

**Attack Power** factors:
- Unit attack stats
- Unit count (with diminishing returns after 20 units)
- Unit health percentage
- Unit level multiplier (9-10% per level)
- Unit type matchups (+30% vs weak armor, -25% vs strong armor)
- Country morale multiplier (0.5-1.0 range)
- Army morale multiplier (0.5-1.0 range)
- Terrain attack modifier (desert: -10%)

**Defense Power** factors:
- Unit defense stats + 50% of attack stats 
- Same multipliers as attack power
- +12% per fortification level
- +5% per radar level
- Terrain defense bonus

### Retreat Mechanics
- Armies automatically retreat (are removed) when morale drops below 20
- No manual retreat command needed - automatic during turn processing
- Retreating armies don't stay in province they're losing in

### Battle Conclusion
Battles end when:
1. One side has 0 units remaining, OR
2. Average army morale drops below 5 for either side

Winner determination:
- Attacker wins: Captures province, reduces defender morale
- Defender wins: Maintains control, no territorial changes
- Draw: Both sides defeated or morale collapse

### Province Capture
When attacker wins:
- Province switches to attacker control
- Province morale drops 40 points
- Province stability drops 30 points
- Defender country loses stability and military morale
- Conquest event generated

## Implementation Details

### New Type Additions
- `Army.morale`: Number (0-100)
- `ActiveBattle` enhancements with battle state tracking

### Key Functions
- `resolveBattleRound()`: Processes one round of a multi-turn battle
- `calculateCombatPower()`: Calculates effective combat strength
- `applyBattleRoundDamage()`: Applies casualties and morale loss
- `processCombat()`: Main battle processing with retreat checking

### Battle State
- Battles persist across multiple turns
- Army morale and unit health updated each turn
- Battle officially ends when conclusion conditions met

## Gameplay Impact

### Strategic Depth
- Battles take longer, allowing strategic retreats
- Morale management becomes important consideration
- Terrain choice and fortification levels matter
- Army composition and health tracking important

### Longer Campaigns
- Wars now take many turns instead of instant resolution
- Allows time for reinforcements or diplomatic solutions
- Creates dramatic escalation of conflicts

### Risk Management
- Weak armies can be defeated gradually
- Morale threshold provides crisis point
- Health degradation means damaged units become less effective

## Example Battle
1. Two armies of equal strength meet in forest terrain
2. Defender has fortification level 2
3. Battle lasts ~50 turns with gradual attrition
4. Each side loses ~0.75% of units per turn
5. Forest terrain gives defender +20% defense
6. Fortification adds +24% defense (2 × 12%)
7. If attacker's morale drops below 20 during fight, army automatically retreats
8. If defender wins, province remains unchanged but armies damaged
9. If attacker wins, province changes control with morale penalties
