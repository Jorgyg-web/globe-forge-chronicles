# Globe Forge Chronicles --- Copilot Autonomous Development Agent

This document defines the **GitHub Copilot Agent instructions** for
continuing the development of the project **Globe Forge Chronicles**.

Copilot should use this file as **persistent context** when generating
code, features, and refactors.

The goal is to evolve the project into a **full grand strategy game
similar to Call of War / Hearts of Iron**.

------------------------------------------------------------------------

# Core Objective

Globe Forge Chronicles is a **grand strategy world simulation** where
players control countries and manage:

-   provinces
-   armies
-   economy
-   research
-   diplomacy
-   warfare

The map already supports:

-   world provinces
-   zoom and panning
-   armies
-   movement
-   UI panels

The system must now evolve into a **deep strategic simulation**.

------------------------------------------------------------------------

# Development Philosophy

Copilot should follow these rules when generating code.

### 1. Never break existing systems

The map engine, provinces, and country systems already exist and must
remain compatible.

### 2. Prefer modular systems

New systems should live in separate modules instead of monolithic files.

### 3. Optimize for performance

The map may contain **3000--6000 provinces** and **100+ armies**, so
rendering must be efficient.

### 4. Use deterministic game logic

All gameplay should be deterministic to support future multiplayer.

------------------------------------------------------------------------

# Core Game Systems

Copilot should implement the following systems progressively.

------------------------------------------------------------------------

# 1. Army System

Armies represent stacks of military units.

Structure:

``` ts
type Army = {
  id: string
  countryId: string
  provinceId: string
  targetProvinceId?: string
  movementProgress: number
  units: Unit[]
}
```

Movement must:

-   interpolate between province centroids
-   depend on terrain cost
-   depend on infrastructure level
-   use the slowest unit speed in the army

Terrain movement cost:

    plains: 1
    coastal: 1
    urban: 0.8
    forest: 1.4
    desert: 1.3
    mountain: 2
    arctic: 1.8

------------------------------------------------------------------------

# 2. Pathfinding

Province adjacency defines a graph.

``` ts
province.neighbors: string[]
```

Implement **A\* pathfinding** between provinces.

Armies should store:

``` ts
path: string[]
```

Movement logic:

-   follow next province in path
-   update provinceId when movementProgress reaches 1
-   pop next path node

------------------------------------------------------------------------

# 3. Combat System

Combat occurs when hostile armies occupy the same province.

Combat factors:

-   attack value
-   defense value
-   terrain bonus
-   fortifications
-   morale

Terrain modifiers:

    mountain +40% defense
    forest +20% defense
    desert -10% attack
    plains normal

Combat should last multiple turns.

Units lose health gradually.

Armies retreat when morale becomes low.

------------------------------------------------------------------------

# 4. Province System

Provinces are the primary gameplay unit.

Structure:

``` ts
type Province = {
 id: string
 countryId: string
 terrain: string
 population: number
 morale: number
 buildings: Building[]
}
```

------------------------------------------------------------------------

# 5. Building System

Buildings improve provinces.

Buildings:

    industry
    military_base
    airbase
    naval_base
    infrastructure
    fortifications
    radar

Effects:

    industry -> increases resource production
    military_base -> enables unit training
    infrastructure -> increases army movement speed
    fortifications -> improves defense

Buildings must have:

    level
    buildCost
    buildTime

------------------------------------------------------------------------

# 6. Military Production

Provinces with `military_base` can train units.

Production queue:

``` ts
productionQueue: ProductionItem[]
```

Example unit types:

    infantry
    motorized_infantry
    tank
    artillery
    fighter
    bomber
    destroyer
    submarine

Units spawn when training finishes.

------------------------------------------------------------------------

# 7. Resource System

Strategic resources:

    food
    steel
    oil
    rare_materials
    manpower

Provinces produce resources each turn.

Countries accumulate resources globally.

Buildings and units consume resources.

------------------------------------------------------------------------

# 8. Technology System

Add a research tree.

Categories:

    infantry
    armor
    air
    naval
    industry
    logistics

Research structure:

``` ts
type Technology = {
 name: string
 cost: number
 researchTime: number
 effects: Effect[]
}
```

Example effects:

    increase infantry attack
    increase tank speed
    increase industry output

------------------------------------------------------------------------

# 9. AI Countries

AI should:

-   recruit units
-   defend borders
-   attack enemies
-   capture nearby provinces
-   protect capital

AI loop should run periodically.

------------------------------------------------------------------------

# 10. Map Rendering Rules

Rendering priorities:

Layer order:

1 terrain 2 provinces 3 borders 4 armies 5 UI overlays

Zoom LOD:

Zoom \< 1.5: - show countries only

Zoom 1.5--2.5: - show provinces

Zoom \> 2.5: - show province labels - show armies

------------------------------------------------------------------------

# Code Architecture

Copilot should maintain this structure:

    src/
      components/
        map/
          MapRenderer
          ProvinceLayer
          ArmyLayer

      systems/
          combat
          movement
          economy
          ai

      data/
          provinces
          units
          terrain

      types/
          army
          province
          unit

Systems should not depend on UI.

Game logic must remain inside **systems/**.

------------------------------------------------------------------------

# Long Term Goals

The final game should support:

-   thousands of provinces
-   large scale wars
-   supply lines
-   encirclements
-   logistics
-   diplomacy
-   multiplayer

------------------------------------------------------------------------

# Copilot Behavior

When generating code:

1.  prefer TypeScript
2.  keep functions pure when possible
3.  avoid unnecessary React re-renders
4.  write modular systems
5.  optimize algorithms when map size grows

------------------------------------------------------------------------

# Final Goal

Transform Globe Forge Chronicles into a **fully featured grand strategy
game engine** capable of simulating world-scale warfare, economy, and
diplomacy.
