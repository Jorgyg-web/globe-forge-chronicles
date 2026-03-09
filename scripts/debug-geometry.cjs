// Quick diagnostic script - run with: node scripts/debug-geometry.cjs
const fs = require('fs');

const admin0 = JSON.parse(fs.readFileSync('public/data/world-land.geojson', 'utf8'));

function normalizeRing(ring) {
  const cleaned = [];
  for (const p of ring) {
    if (!Array.isArray(p) || p.length < 2 || !isFinite(p[0]) || !isFinite(p[1])) continue;
    if (cleaned.length === 0 || cleaned[cleaned.length - 1][0] !== p[0] || cleaned[cleaned.length - 1][1] !== p[1])
      cleaned.push([p[0], p[1]]);
  }
  if (cleaned.length < 3) return null;
  if (cleaned[0][0] !== cleaned[cleaned.length - 1][0] || cleaned[0][1] !== cleaned[cleaned.length - 1][1])
    cleaned.push([cleaned[0][0], cleaned[0][1]]);
  return cleaned.length >= 4 ? cleaned : null;
}

function signedArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return a / 2;
}

function projectPoint(lng, lat) {
  const radLat = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
  const mercY = Math.log(Math.tan(Math.PI / 4 + radLat / 2));
  const minMercY = Math.log(Math.tan(Math.PI / 4 + (-60 * Math.PI / 180) / 2));
  const maxMercY = Math.log(Math.tan(Math.PI / 4 + (85 * Math.PI / 180) / 2));
  return {
    x: 20 + ((lng + 180) / 360) * 760,
    y: 20 + (1 - (mercY - minMercY) / (maxMercY - minMercY)) * 410,
  };
}

function clipAgainstEdge(poly, isInside, intersect) {
  const out = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const c = poly[i], nx = poly[(i + 1) % n];
    if (isInside(c) && isInside(nx)) out.push(nx);
    else if (isInside(c) && !isInside(nx)) out.push(intersect(c, nx));
    else if (!isInside(c) && isInside(nx)) { out.push(intersect(c, nx)); out.push(nx); }
  }
  return out;
}

function intersectX(a, b, x) {
  if (Math.abs(b[0] - a[0]) < 1e-12) return [x, a[1]];
  const t = (x - a[0]) / (b[0] - a[0]);
  return [x, a[1] + t * (b[1] - a[1])];
}
function intersectY(a, b, y) {
  if (Math.abs(b[1] - a[1]) < 1e-12) return [a[0], y];
  const t = (y - a[1]) / (b[1] - a[1]);
  return [a[0] + t * (b[0] - a[0]), y];
}

function clipToRect(ring, minX, minY, maxX, maxY) {
  let r = ring;
  r = clipAgainstEdge(r, p => p[0] >= minX, (a, b) => intersectX(a, b, minX)); if (r.length < 3) return [];
  r = clipAgainstEdge(r, p => p[0] <= maxX, (a, b) => intersectX(a, b, maxX)); if (r.length < 3) return [];
  r = clipAgainstEdge(r, p => p[1] >= minY, (a, b) => intersectY(a, b, minY)); if (r.length < 3) return [];
  r = clipAgainstEdge(r, p => p[1] <= maxY, (a, b) => intersectY(a, b, maxY)); if (r.length < 3) return [];
  return r;
}

function ringToSvgPath(ring) {
  return ring.map(([lng, lat], i) => {
    const { x, y } = projectPoint(lng, lat);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ') + ' Z';
}

function computeBounds(pathD) {
  const coords = [];
  const regex = /[ML]\s*([\d.]+)[,\s]+([\d.]+)/gi;
  let match;
  while ((match = regex.exec(pathD)) !== null) {
    coords.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
  }
  if (coords.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  const minX = Math.min(...coords.map(c => c.x));
  const minY = Math.min(...coords.map(c => c.y));
  const maxX = Math.max(...coords.map(c => c.x));
  const maxY = Math.max(...coords.map(c => c.y));
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

// NEW approach: subdivide largest polygon only, remaining become their own provinces
function subdivideCountry(feature) {
  const geo = feature.geometry;
  const allPolygons = geo.type === 'MultiPolygon' ? geo.coordinates : [geo.coordinates];
  
  // Get all polygon rings with their areas
  const polygons = [];
  for (const polyCoords of allPolygons) {
    const ring = normalizeRing(polyCoords[0]);
    if (!ring) continue;
    const area = Math.abs(signedArea(ring));
    polygons.push({ ring, area, holes: polyCoords.slice(1).map(normalizeRing).filter(Boolean) });
  }
  
  // Sort largest first
  polygons.sort((a, b) => b.area - a.area);
  if (polygons.length === 0) return { provinces: 0, mainlandGridCells: 0, territories: 0 };
  
  const largest = polygons[0];
  const remaining = polygons.slice(1);
  
  // Only significant remaining count against mainland budget
  const significantRemaining = remaining.filter(p => p.area > 1.0);
  const target = (() => {
    // Use largest polygon bounds for target calc
    const lngs = largest.ring.map(p => p[0]);
    const lats = largest.ring.map(p => p[1]);
    const w = Math.max(...lngs) - Math.min(...lngs);
    const h = Math.max(...lats) - Math.min(...lats);
    const area = w * h;
    if (area < 4) return 1;
    return Math.max(2, Math.min(12, Math.ceil(Math.sqrt(area))));
  })();
  
  const mainlandTarget = Math.max(2, target - significantRemaining.length);
  
  // Subdivide largest
  const lngs = largest.ring.map(p => p[0]);
  const lats = largest.ring.map(p => p[1]);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const w = maxLng - minLng, h = maxLat - minLat;
  
  const aspect = Math.max(0.1, w / h);
  const cols = Math.max(1, Math.round(Math.sqrt(mainlandTarget * aspect)));
  const rows = Math.max(1, Math.round(mainlandTarget / cols));
  const cellW = w / cols, cellH = h / rows;
  
  let gridCells = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cMinLng = minLng + c * cellW;
      const cMaxLng = minLng + (c + 1) * cellW;
      const cMinLat = minLat + r * cellH;
      const cMaxLat = minLat + (r + 1) * cellH;
      
      const openRing = largest.ring.slice(0, -1);
      const clipped = clipToRect(openRing, cMinLng, cMinLat, cMaxLng, cMaxLat);
      if (clipped.length >= 3) {
        const closed = [...clipped, clipped[0]];
        if (Math.abs(signedArea(closed)) >= 0.01) {
          gridCells++;
        }
      }
    }
  }
  
  const territories = remaining.filter(p => p.area >= 0.05).length;
  
  return {
    provinces: gridCells + territories,
    mainlandGridCells: gridCells,
    territories,
    target,
    mainlandTarget,
    grid: `${rows}x${cols}`,
    polyCount: polygons.length,
    mainlandArea: largest.area.toFixed(1),
  };
}

const testCountries = ['FRA', 'ESP', 'DEU', 'BRA', 'CHN', 'RUS', 'NGA', 'EGY', 'IND', 'AUS', 'CAN', 'USA', 'GBR', 'JPN', 'IDN', 'ITA', 'NOR'];
let totalProvs = 0;

for (const iso of testCountries) {
  const feature = admin0.features.find(f => f.properties.adm0_a3 === iso);
  if (!feature) { console.log(iso + ': NOT FOUND'); continue; }
  const result = subdivideCountry(feature);
  totalProvs += result.provinces;
  console.log(`${iso}: ${result.provinces} provinces (mainland=${result.mainlandGridCells} grid=${result.grid} territories=${result.territories} polygons=${result.polyCount} mainlandArea=${result.mainlandArea})`);
}

// Count total for ALL countries
let grandTotal = 0;
for (const feature of admin0.features) {
  const result = subdivideCountry(feature);
  grandTotal += result.provinces;
}
console.log(`\nTotal provinces for all ${admin0.features.length} countries: ${grandTotal}`);

