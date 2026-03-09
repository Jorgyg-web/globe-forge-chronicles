You are a senior game engine engineer specializing in map rendering systems for strategy games.

Your task is to analyze this repository and completely stabilize and redesign the map system.

The current system has the following problems:

• Maximum zoom level is too limited
• Province labels become blurry when zooming
• Only United States provinces render correctly
• Provinces in other countries do not load or render
• Geometry becomes unstable at high zoom levels
• Borders sometimes overlap or break
• Rendering pipeline is fragile

Do NOT apply small patches.

Instead perform a full architectural review and refactor the map system where necessary.

---

STEP 1 — REPOSITORY ANALYSIS

Analyze the entire repository and identify:

• Map renderer implementation
• Camera / zoom system
• Province loading logic
• GeoJSON or map data loaders
• Projection system
• Province label rendering
• Coordinate system used
• Any filtering that limits rendering to the United States

Explain the root causes of the current issues.

---

STEP 2 — FIX ZOOM ARCHITECTURE

The map must support deep zoom levels.

The current system likely scales the entire canvas or map container.

This must be replaced with a proper camera system.

Requirements:

• camera-based zoom
• no scaling of geometry buffers
• stable rendering at all zoom levels
• adjustable max zoom

Implement a CameraController with:

* position
* zoom
* bounds
* smooth zooming

---

STEP 3 — FIX LABEL RENDERING

Province names must remain sharp regardless of zoom.

Move label rendering to a dedicated layer:

MapRenderer
├─ ProvinceLayer
├─ BorderLayer
└─ LabelLayer

Labels must:

• not be affected by geometry scaling
• dynamically adjust font size based on zoom
• hide when zoom level is too low

---

STEP 4 — FIX GLOBAL PROVINCE SUPPORT

Currently only the United States renders correctly.

Find the cause:

• hardcoded dataset
• filtering logic
• incorrect GeoJSON structure
• projection issues

Modify the loader to support world provinces.

Ensure the system supports:

• multipolygons
• islands
• enclaves
• large countries

---

STEP 5 — GEOMETRY STABILITY

Implement geometry normalization:

• polygon winding correction
• multipolygon support
• centroid calculation
• geometry validation
• prevention of self-intersections

---

STEP 6 — RENDERING PIPELINE

Implement a robust pipeline:

GeoJSON
↓
Geometry validation
↓
Projection conversion
↓
Triangulation
↓
Renderable mesh
↓
Rendering layers

---

STEP 7 — PERFORMANCE IMPROVEMENTS

Implement:

• geometry caching
• spatial index (quadtree)
• frustum culling
• batched rendering

The system must scale to thousands of provinces.

---

STEP 8 — MAP ENGINE STRUCTURE

Create the following architecture:

MapEngine
├─ MapRenderer
├─ CameraController
├─ ProvinceLayer
├─ LabelLayer
├─ BorderRenderer
├─ GeoDataLoader
└─ SpatialIndex

---

STEP 9 — OUTPUT

After analyzing the repository:

1. List the exact causes of the current bugs.
2. Show the improved map architecture.
3. Provide the refactored implementation.
4. Fix zoom limits and label blurriness.
5. Ensure provinces render globally.

Focus on stability, correctness, and scalability.
