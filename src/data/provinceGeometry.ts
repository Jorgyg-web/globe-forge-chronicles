/**
 * Province SVG path geometries — generated via Mercator projection from
 * approximate real-world lat/lng polygon vertices.
 *
 * The projection maps [-180..180] lng × [-60..85] lat onto an 800×450 SVG
 * viewBox with 20px padding, using the same `projectPoint` function that
 * the GeoJSON loader uses. This means GeoJSON-loaded polygons and these
 * placeholders share the same coordinate space and can coexist.
 *
 * To replace any province with real GeoJSON data, simply overwrite the
 * entry via `applyGeometriesToProvinces()`.
 */

import { projectPoint, getDefaultProjectionConfig, type ProjectionConfig } from '@/map/projection';

const CFG = getDefaultProjectionConfig();

/** Project a [lng, lat] pair and return "x,y" string */
function p(lng: number, lat: number): string {
  const { x, y } = projectPoint(lng, lat, CFG);
  return `${x},${y}`;
}

/** Build an SVG path from an array of [lng, lat] pairs */
function poly(coords: [number, number][]): string {
  return coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${p(c[0], c[1])}`).join(' ') + ' Z';
}

export const PROVINCE_GEOMETRY: Record<string, string> = {
  // ─── USA ───
  usa_ne: poly([[-80,43],[-72,44],[-68,42],[-70,38],[-75,37],[-80,40]]),
  usa_se: poly([[-90,37],[-80,40],[-75,37],[-78,30],[-82,28],[-90,30]]),
  usa_mw: poly([[-104,47],[-90,47],[-80,43],[-80,40],[-90,37],[-100,37],[-104,42]]),
  usa_sw: poly([[-115,37],[-100,37],[-90,30],[-97,26],[-105,26],[-115,32]]),
  usa_w: poly([[-125,48],[-115,47],[-115,37],[-115,32],[-120,33],[-125,38]]),
  usa_ak: poly([[-170,66],[-155,70],[-140,65],[-135,58],[-150,55],[-165,58]]),

  // ─── Canada ───
  can_on: poly([[-95,52],[-79,52],[-74,44],[-80,43],[-90,47],[-95,47]]),
  can_qc: poly([[-79,52],[-64,52],[-60,47],[-68,42],[-74,44]]),
  can_bc: poly([[-132,60],[-120,60],[-115,48],[-125,48],[-132,52]]),
  can_ab: poly([[-120,60],[-110,60],[-110,49],[-115,48],[-115,47]]),
  can_pr: poly([[-110,60],[-95,60],[-79,60],[-79,52],[-95,52],[-110,49]]),

  // ─── Mexico ───
  mex_n: poly([[-115,32],[-105,32],[-100,28],[-97,26],[-105,26]]),
  mex_c: poly([[-105,26],[-97,26],[-97,20],[-100,19],[-104,20]]),
  mex_s: poly([[-104,20],[-100,19],[-97,18],[-95,16],[-98,15],[-102,16]]),
  mex_se: poly([[-92,20],[-87,21],[-87,18],[-90,15],[-95,16],[-97,18]]),

  // ─── Brazil ───
  bra_se: poly([[-48,-18],[-40,-14],[-38,-18],[-42,-23],[-48,-24]]),
  bra_ne: poly([[-48,-4],[-35,-4],[-34,-10],[-40,-14],[-48,-12]]),
  bra_s: poly([[-55,-24],[-48,-24],[-42,-23],[-48,-28],[-53,-30],[-55,-28]]),
  bra_n: poly([[-70,-2],[-55,-2],[-48,-4],[-48,-12],[-55,-10],[-65,-5]]),
  bra_cw: poly([[-58,-10],[-48,-12],[-48,-18],[-48,-24],[-55,-24],[-58,-16]]),

  // ─── UK ───
  gbr_en: poly([[-5,51],[2,52],[2,53],[-1,54],[-3,53],[-5,52]]),
  gbr_sc: poly([[-6,55],[-3,58],[-1,57],[-1,54],[-3,53],[-6,54]]),
  gbr_wa: poly([[-5,51],[-5,52],[-3,53],[-3,51.5]]),
  gbr_ni: poly([[-8,54],[-6,55],[-5,55],[-5.5,54],[-7,53.5]]),

  // ─── France ───
  fra_n: poly([[-2,49],[3,50],[3,48],[0,47],[-2,47]]),
  fra_idf: poly([[0,47],[3,48],[3,47],[2,46],[0,46]]),
  fra_e: poly([[3,48],[7,48],[7,45],[5,44],[3,45],[3,47]]),
  fra_s: poly([[-2,47],[0,46],[2,46],[3,45],[5,44],[3,43],[0,43],[-2,43]]),

  // ─── Germany ───
  deu_n: poly([[6,54],[14,54],[14,52],[10,51],[6,51]]),
  deu_w: poly([[6,51],[6,54],[10,51],[7,49],[6,49]]),
  deu_s: poly([[7,49],[10,51],[14,51],[14,48],[10,47],[7,47]]),
  deu_e: poly([[10,51],[14,54],[14,51]]),

  // ─── Poland ───
  pol_n: poly([[14,54],[24,54],[24,52],[18,51],[14,52]]),
  pol_c: poly([[14,52],[18,51],[24,52],[24,50],[18,49],[14,50]]),
  pol_s: poly([[14,50],[18,49],[24,50],[24,49],[18,48],[14,49]]),

  // ─── Italy ───
  ita_n: poly([[7,46],[12,46],[13,44],[11,43],[7,44]]),
  ita_c: poly([[11,43],[13,44],[15,42],[14,40],[12,40]]),
  ita_s: poly([[14,40],[15,42],[18,40],[16,38],[14,37],[13,38]]),

  // ─── Russia ───
  rus_w: poly([[28,60],[45,60],[45,50],[40,48],[30,50],[28,55]]),
  rus_s: poly([[30,50],[40,48],[45,50],[50,45],[42,42],[35,43]]),
  rus_u: poly([[45,60],[60,60],[65,55],[60,50],[50,50],[45,50]]),
  rus_si: poly([[60,60],[100,65],[110,60],[100,55],[80,50],[65,55]]),
  rus_fe: poly([[110,60],[140,62],[145,55],[135,50],[120,50],[100,55]]),

  // ─── Turkey ───
  tur_m: poly([[26,42],[30,42],[30,40],[26,40]]),
  tur_a: poly([[30,40],[38,40],[38,37],[30,37],[30,40]]),
  tur_e: poly([[38,40],[44,40],[44,37],[38,37]]),

  // ─── Iran ───
  irn_w: poly([[44,38],[48,38],[50,35],[48,33],[44,33]]),
  irn_c: poly([[48,38],[56,38],[56,33],[50,33],[50,35]]),
  irn_e: poly([[56,38],[62,36],[62,30],[56,30],[56,33]]),
  irn_s: poly([[48,33],[56,33],[56,30],[54,25],[48,25]]),

  // ─── Saudi Arabia ───
  sau_c: poly([[42,28],[48,28],[48,22],[42,22]]),
  sau_e: poly([[48,28],[55,27],[55,22],[48,22]]),
  sau_w: poly([[36,28],[42,28],[42,22],[38,18],[36,20]]),
  sau_s: poly([[38,18],[42,22],[48,22],[45,16],[40,14]]),

  // ─── Israel ───
  isr_n: poly([[35,33],[36,33],[36,32],[35,32]]),
  isr_c: poly([[34,32],[36,32],[36,31],[34,31]]),
  isr_s: poly([[34,31],[36,31],[35,29],[34,29]]),

  // ─── Egypt ───
  egy_n: poly([[25,32],[35,32],[35,30],[30,30],[25,30]]),
  egy_c: poly([[30,30],[35,30],[35,27],[30,27]]),
  egy_s: poly([[30,27],[35,27],[35,22],[30,22]]),

  // ─── India ───
  ind_n: poly([[70,35],[82,35],[85,30],[80,27],[72,27]]),
  ind_w: poly([[68,27],[72,27],[72,20],[68,15],[66,20]]),
  ind_c: poly([[72,27],[80,27],[80,20],[72,20]]),
  ind_e: poly([[80,27],[88,27],[90,22],[85,18],[80,20]]),
  ind_s: poly([[72,20],[80,20],[85,18],[80,10],[75,8],[68,15]]),

  // ─── China ───
  chn_n: poly([[100,45],[120,45],[125,40],[115,38],[100,40]]),
  chn_w: poly([[75,42],[100,45],[100,40],[95,30],[80,30],[75,35]]),
  chn_c: poly([[100,40],[115,38],[110,30],[100,32],[95,30]]),
  chn_e: poly([[115,38],[125,40],[125,30],[120,28],[115,30],[110,30]]),
  chn_s: poly([[100,30],[110,30],[115,30],[120,28],[115,22],[105,22],[100,25]]),

  // ─── South Korea ───
  kor_c: poly([[126,38],[128,38],[128,37],[126,36.5]]),
  kor_w: poly([[126,36.5],[128,37],[127,35.5],[126,35.5]]),
  kor_s: poly([[127,35.5],[128,37],[130,36],[129,34.5],[127,34.5]]),

  // ─── Japan ───
  jpn_n: poly([[140,45],[145,44],[146,42],[142,41],[139,42]]),
  jpn_c: poly([[137,38],[140,38],[141,36],[139,35],[137,36]]),
  jpn_k: poly([[139,36],[141,36],[141,34.5],[139,34]]),
  jpn_kn: poly([[134,35],[137,36],[139,35],[137,34],[134,34]]),
  jpn_s: poly([[130,34],[134,34],[134,32],[131,31],[130,32]]),

  // ─── Australia ───
  aus_wa: poly([[114,-20],[125,-18],[128,-25],[128,-32],[120,-35],[114,-30]]),
  aus_sa: poly([[128,-25],[138,-22],[140,-30],[138,-35],[128,-35],[128,-32]]),
  aus_qld: poly([[138,-15],[150,-15],[153,-22],[150,-28],[140,-30],[138,-22]]),
  aus_nsw: poly([[148,-28],[153,-28],[153,-35],[150,-37],[148,-35],[148,-32]]),
  aus_vic: poly([[140,-35],[148,-35],[148,-38],[144,-39],[140,-38]]),
};

/**
 * Compute the centroid of an SVG path string.
 * Parses M, L, Z commands and averages all vertex coordinates.
 */
export function computeCentroid(pathD: string): { x: number; y: number } {
  const coords: { x: number; y: number }[] = [];
  const regex = /[ML]\s*([\d.]+)[,\s]+([\d.]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(pathD)) !== null) {
    coords.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
  }
  if (coords.length === 0) return { x: 0, y: 0 };
  const sumX = coords.reduce((s, c) => s + c.x, 0);
  const sumY = coords.reduce((s, c) => s + c.y, 0);
  return { x: sumX / coords.length, y: sumY / coords.length };
}

/**
 * Compute bounding box of an SVG path string.
 */
export function computeBounds(pathD: string): { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number } {
  const coords: { x: number; y: number }[] = [];
  const regex = /[ML]\s*([\d.]+)[,\s]+([\d.]+)/gi;
  let match: RegExpExecArray | null;
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

/** Pre-computed centroids cache — invalidated when geometry updates */
const centroidCache: Record<string, { x: number; y: number }> = {};

export function getProvinceCentroid(provinceId: string): { x: number; y: number } {
  if (centroidCache[provinceId]) return centroidCache[provinceId];
  const geo = PROVINCE_GEOMETRY[provinceId];
  if (!geo) return { x: 400, y: 225 };
  const c = computeCentroid(geo);
  centroidCache[provinceId] = c;
  return c;
}

/**
 * Update a province's geometry and invalidate its centroid cache.
 * Used by the GeoJSON loader when applying real geographic data.
 */
export function updateProvinceGeometry(provinceId: string, svgPath: string): void {
  PROVINCE_GEOMETRY[provinceId] = svgPath;
  delete centroidCache[provinceId];
}

/**
 * Invalidate all cached centroids (call after bulk geometry updates).
 */
export function invalidateCentroidCache(): void {
  for (const key of Object.keys(centroidCache)) {
    delete centroidCache[key];
  }
}
