You are a senior game engine engineer specialized in map engines for grand strategy games.

Your task is to redesign the map system in this repository.

The current implementation uses GeoJSON polygons and currently only supports provinces for the United States.

This architecture is fragile and does not scale to a global strategy game.

Instead, redesign the province system using a color-indexed province map similar to the system used in Paradox games (Europa Universalis, Hearts of Iron).

Do not apply small patches. Perform a structural refactor of the map system.

---

GOAL

Implement a high-performance global province system based on a color map.

Countries will remain polygon-based (GeoJSON), but provinces will be represented using a color-indexed image.

---

NEW PROVINCE SYSTEM

Create a province map image:

map/provinces.png

Each unique RGB color represents one province.

Example:

RGB(255,0,0) = province 1
RGB(0,255,0) = province 2
RGB(0,0,255) = province 3

Create a data file:

map/province_data.json

Example structure:

{
"1": { "name": "California", "country": "USA" },
"2": { "name": "Texas", "country": "USA" }
}

---

PROVINCE DETECTION

Implement province detection using pixel lookup.

Algorithm:

1. Convert screen position → world coordinates
2. Convert world coordinates → pixel coordinates on provinces.png
3. Read pixel color
4. Convert RGB → province ID

---

MAP ENGINE ARCHITECTURE

Create the following architecture:

MapEngine
├ CameraController
├ CountryLayer
├ ProvinceLayer
├ ProvinceManager
├ LabelLayer
└ InteractionSystem

---

COUNTRY RENDERING

Keep the existing country rendering based on GeoJSON.

Countries should:

* render as polygons
* support hover
* support highlighting
* support selection

---

PROVINCE LAYER

ProvinceLayer should:

* load provinces.png
* cache pixel data
* detect province on mouse click
* support highlighting

---

ZOOM SYSTEM

Implement a proper camera system.

Requirements:

* smooth zoom
* deep zoom into provinces
* full world visible at max zoom-out
* world bounds clamping

Zoom must NOT scale the entire canvas.

Instead implement:

screen_position = project(world_position, camera)

---

LABEL SYSTEM

Implement a dedicated LabelLayer.

Labels must:

* remain sharp regardless of zoom
* scale font size inversely with zoom
* hide when zoomed out too far

Label placement must use polygon centroids.

---

WORLD BOUNDS

Ensure the maximum zoom-out shows the entire world perfectly inside the viewport.

Compute bounds from the country geometry.

---

PERFORMANCE

Implement:

* province pixel caching
* spatial index for countries
* minimal draw calls
* frustum culling

The system must support thousands of provinces.

---

OUTPUT

After analyzing the repository:

1. Refactor the map engine architecture
2. Implement the province color map system
3. Replace the current US-only province logic
4. Fix zoom limits
5. Implement correct label placement
6. Ensure the map works globally
