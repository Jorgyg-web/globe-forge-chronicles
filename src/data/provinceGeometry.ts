// Province SVG path geometries - placeholder polygons positioned on 800x450 map
// These can be replaced with real GeoJSON-derived paths later

export const PROVINCE_GEOMETRY: Record<string, string> = {
  // ─── USA ───
  usa_ne: 'M175,142 L200,138 L205,148 L198,160 L180,162 L172,155 Z',
  usa_se: 'M150,165 L180,162 L198,160 L200,180 L195,200 L170,205 L145,195 L140,180 Z',
  usa_mw: 'M120,145 L150,140 L175,142 L172,155 L180,162 L150,165 L130,170 L115,160 Z',
  usa_sw: 'M100,175 L130,170 L145,195 L140,210 L120,215 L95,210 L90,195 Z',
  usa_w: 'M82,145 L100,140 L120,145 L115,160 L130,170 L100,175 L85,170 L80,158 Z',
  usa_ak: 'M60,80 L85,75 L92,90 L85,105 L70,108 L58,98 Z',

  // ─── China ───
  chn_e: 'M620,145 L650,140 L658,155 L652,170 L635,175 L618,168 Z',
  chn_s: 'M595,175 L618,168 L635,175 L640,195 L625,200 L605,198 L590,190 Z',
  chn_n: 'M585,135 L620,130 L640,135 L650,140 L620,145 L600,148 L580,145 Z',
  chn_w: 'M555,145 L580,145 L600,148 L595,165 L595,175 L575,178 L555,170 L550,158 Z',
  chn_c: 'M595,155 L618,148 L618,168 L595,175 L575,178 L580,160 Z',

  // ─── Russia ───
  rus_w: 'M450,55 L490,50 L510,58 L505,80 L490,90 L470,88 L455,78 L448,65 Z',
  rus_s: 'M455,90 L490,90 L505,80 L510,95 L500,110 L480,115 L460,108 L450,98 Z',
  rus_u: 'M510,55 L545,50 L555,62 L550,78 L535,85 L515,80 L510,65 Z',
  rus_si: 'M555,48 L605,42 L620,52 L615,72 L595,80 L570,75 L555,65 Z',
  rus_fe: 'M620,48 L655,42 L665,55 L658,72 L640,78 L625,72 L618,58 Z',

  // ─── UK ───
  gbr_en: 'M372,118 L385,115 L390,122 L388,130 L380,132 L372,128 Z',
  gbr_sc: 'M374,108 L385,105 L390,112 L385,115 L372,118 L370,113 Z',
  gbr_wa: 'M368,122 L372,118 L372,128 L375,132 L370,135 L365,130 Z',
  gbr_ni: 'M358,110 L368,108 L370,113 L372,118 L365,120 L358,116 Z',

  // ─── France ───
  fra_idf: 'M388,148 L398,145 L405,150 L402,158 L393,160 L386,155 Z',
  fra_s: 'M386,160 L402,158 L410,165 L408,172 L398,175 L385,170 Z',
  fra_n: 'M380,140 L395,138 L398,145 L388,148 L383,150 L378,145 Z',
  fra_e: 'M398,148 L410,145 L415,152 L410,160 L405,165 L402,158 L405,150 Z',

  // ─── Germany ───
  deu_n: 'M408,122 L425,118 L430,125 L428,132 L418,135 L408,130 Z',
  deu_s: 'M408,135 L425,132 L430,138 L428,148 L418,150 L408,145 Z',
  deu_e: 'M425,125 L442,122 L448,130 L445,140 L432,142 L425,138 L428,132 Z',
  deu_w: 'M400,128 L408,122 L408,130 L408,135 L408,145 L398,145 L395,138 Z',

  // ─── Japan ───
  jpn_k: 'M685,145 L698,142 L702,150 L698,158 L688,160 L683,153 Z',
  jpn_kn: 'M680,158 L688,160 L692,166 L688,172 L680,174 L676,168 Z',
  jpn_c: 'M683,148 L685,145 L683,153 L688,160 L680,158 L678,152 Z',
  jpn_s: 'M672,168 L680,165 L684,172 L680,178 L672,178 L668,174 Z',
  jpn_n: 'M688,135 L698,132 L702,140 L698,142 L685,145 L683,140 Z',

  // ─── India ───
  ind_n: 'M555,200 L580,195 L590,205 L585,218 L570,222 L555,218 L548,210 Z',
  ind_s: 'M558,230 L575,228 L585,235 L580,248 L568,252 L555,248 L550,240 Z',
  ind_w: 'M545,215 L555,218 L558,230 L550,240 L540,238 L535,228 L538,218 Z',
  ind_e: 'M575,218 L590,215 L595,225 L590,235 L575,238 L570,230 Z',
  ind_c: 'M555,218 L575,218 L575,228 L558,230 L550,225 Z',

  // ─── Brazil ───
  bra_se: 'M245,300 L268,295 L275,310 L270,325 L255,330 L240,322 L238,310 Z',
  bra_ne: 'M260,270 L280,265 L290,278 L285,290 L268,295 L255,288 L252,278 Z',
  bra_s: 'M235,325 L255,330 L260,342 L252,355 L240,358 L228,350 L225,338 Z',
  bra_n: 'M235,268 L260,265 L260,270 L252,278 L250,290 L235,295 L225,288 L222,278 Z',
  bra_cw: 'M235,295 L250,290 L255,288 L245,300 L238,310 L235,325 L225,318 L220,305 Z',

  // ─── South Korea ───
  kor_c: 'M660,155 L672,152 L676,160 L672,168 L663,170 L658,163 Z',
  kor_s: 'M663,170 L672,168 L676,175 L672,180 L664,180 L660,175 Z',
  kor_w: 'M655,162 L663,158 L663,170 L660,175 L654,172 L652,168 Z',

  // ─── Turkey ───
  tur_m: 'M460,155 L475,152 L480,160 L475,168 L465,170 L458,163 Z',
  tur_a: 'M475,155 L495,152 L500,162 L495,172 L480,175 L475,168 Z',
  tur_e: 'M495,155 L510,150 L515,160 L510,170 L500,172 L495,165 Z',

  // ─── Saudi Arabia ───
  sau_c: 'M488,205 L505,200 L512,210 L508,220 L495,225 L485,218 Z',
  sau_e: 'M512,200 L525,195 L530,205 L525,215 L515,218 L512,210 Z',
  sau_w: 'M475,215 L488,210 L495,225 L490,232 L478,235 L472,225 Z',
  sau_s: 'M478,232 L490,232 L495,240 L488,248 L478,248 L472,242 Z',

  // ─── Australia ───
  aus_nsw: 'M680,335 L700,330 L708,342 L702,355 L688,358 L678,350 Z',
  aus_vic: 'M668,355 L688,358 L690,368 L682,375 L668,372 L662,365 Z',
  aus_qld: 'M672,315 L695,310 L705,325 L700,330 L680,335 L668,328 Z',
  aus_wa: 'M622,325 L645,318 L655,330 L652,348 L640,355 L625,350 L618,338 Z',
  aus_sa: 'M652,335 L668,328 L680,335 L678,350 L668,355 L662,365 L652,358 L648,345 Z',

  // ─── Canada ───
  can_on: 'M145,90 L170,85 L180,95 L175,108 L162,112 L148,108 L142,98 Z',
  can_qc: 'M180,82 L205,78 L215,88 L210,100 L195,105 L182,100 L178,90 Z',
  can_bc: 'M90,80 L110,75 L118,85 L115,98 L105,102 L90,100 L85,90 Z',
  can_ab: 'M115,78 L135,74 L142,84 L140,95 L130,100 L118,96 L115,88 Z',
  can_pr: 'M135,70 L165,65 L175,75 L170,85 L145,90 L135,85 L130,78 Z',

  // ─── Italy ───
  ita_n: 'M402,158 L415,155 L420,162 L416,170 L408,172 L400,168 Z',
  ita_c: 'M405,172 L416,170 L420,178 L415,185 L408,186 L402,180 Z',
  ita_s: 'M408,186 L418,184 L422,192 L418,200 L410,202 L404,196 Z',

  // ─── Iran ───
  irn_c: 'M505,178 L520,175 L528,185 L524,195 L512,198 L503,192 Z',
  irn_w: 'M498,172 L510,168 L518,175 L515,185 L505,188 L498,182 Z',
  irn_e: 'M524,180 L538,176 L545,185 L540,195 L530,198 L524,192 Z',
  irn_s: 'M512,198 L530,195 L535,205 L528,212 L515,212 L508,205 Z',

  // ─── Egypt ───
  egy_n: 'M440,200 L458,196 L465,205 L460,215 L448,218 L438,212 Z',
  egy_c: 'M442,218 L458,215 L462,225 L458,232 L445,235 L440,228 Z',
  egy_s: 'M445,235 L460,232 L465,242 L460,250 L448,252 L442,245 Z',

  // ─── Israel ───
  isr_c: 'M466,185 L474,183 L477,189 L474,195 L468,196 L465,191 Z',
  isr_s: 'M468,196 L476,195 L478,200 L475,205 L470,205 L467,200 Z',
  isr_n: 'M465,180 L474,178 L476,183 L474,188 L467,189 L464,185 Z',

  // ─── Poland ───
  pol_c: 'M430,122 L445,118 L450,126 L448,135 L438,138 L428,132 Z',
  pol_s: 'M430,138 L445,135 L450,142 L446,148 L436,150 L428,145 Z',
  pol_n: 'M425,112 L445,108 L450,116 L448,125 L435,128 L425,122 Z',

  // ─── Mexico ───
  mex_c: 'M108,218 L125,215 L132,225 L128,235 L118,238 L105,232 Z',
  mex_n: 'M100,210 L120,205 L128,215 L125,225 L112,228 L100,222 Z',
  mex_s: 'M112,235 L128,235 L135,245 L130,252 L118,255 L110,248 Z',
  mex_se: 'M128,240 L142,238 L148,248 L145,255 L135,258 L128,252 Z',
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

/** Pre-computed centroids cache */
const centroidCache: Record<string, { x: number; y: number }> = {};

export function getProvinceCentroid(provinceId: string): { x: number; y: number } {
  if (centroidCache[provinceId]) return centroidCache[provinceId];
  const geo = PROVINCE_GEOMETRY[provinceId];
  if (!geo) return { x: 400, y: 225 };
  const c = computeCentroid(geo);
  centroidCache[provinceId] = c;
  return c;
}
