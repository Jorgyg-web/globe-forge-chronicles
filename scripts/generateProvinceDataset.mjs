import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_GEOJSON = path.join(ROOT, 'public', 'map', 'provinces.geojson');
const OUT_DATA = path.join(ROOT, 'public', 'map', 'province_data.json');
const WORLD_LAND = path.join(ROOT, 'public', 'data', 'world-land.geojson');
const SOURCE_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';
const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKIDATA_CHUNK = 150;

const ISO_REMAP = {
  GBR: 'gbr', USA: 'usa', US1: 'usa', FRA: 'fra', DEU: 'deu',
  RUS: 'rus', CHN: 'chn', JPN: 'jpn', IND: 'ind',
  BRA: 'bra', KOR: 'kor', TUR: 'tur', SAU: 'sau',
  AUS: 'aus', CAN: 'can', ITA: 'ita', IRN: 'irn',
  EGY: 'egy', ISR: 'isr', POL: 'pol', MEX: 'mex',
};

function isoToGameId(iso) {
  return ISO_REMAP[iso] ?? String(iso || '').toLowerCase();
}

function slugifyProvinceKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 32) || 'region';
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function ringArea(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

function geometryArea(geometry) {
  if (!geometry) return 1;
  if (geometry.type === 'Polygon') {
    const [outer, ...holes] = geometry.coordinates;
    return Math.max(1, Math.abs(ringArea(outer)) - holes.reduce((sum, ring) => sum + Math.abs(ringArea(ring)), 0));
  }
  if (geometry.type === 'MultiPolygon') {
    return Math.max(1, geometry.coordinates.reduce((sum, polygon) => {
      const [outer, ...holes] = polygon;
      return sum + Math.abs(ringArea(outer)) - holes.reduce((inner, ring) => inner + Math.abs(ringArea(ring)), 0);
    }, 0));
  }
  return 1;
}

function buildProvinceId(properties) {
  const countryId = properties.countryId || isoToGameId(properties.adm0_a3 || properties.iso_a2 || properties.iso_a3 || properties.sov_a3);
  const rawName = properties.provinceName || properties.name_en || properties.name || properties.gn_name || 'Province';
  const stableKey = properties.ne_id
    || properties.adm1_code
    || properties.diss_me
    || properties.gn_id
    || properties.woe_id
    || properties.wikidataid
    || properties.iso_3166_2
    || properties.code_hasc
    || properties.postal
    || rawName;
  const suffix = slugifyProvinceKey(`${rawName}_${stableKey}`);
  return `${countryId}_${suffix}`;
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'user-agent': 'globe-forge-chronicles/1.0',
      accept: 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

async function fetchWikidataPopulationMap(qids) {
  const result = new Map();
  const chunks = chunk(qids.filter(qid => /^Q\d+$/.test(qid)), WIKIDATA_CHUNK);

  for (let index = 0; index < chunks.length; index++) {
    const ids = chunks[index];
    const values = ids.map(id => `wd:${id}`).join(' ');
    const query = `
      SELECT ?item ?population ?date WHERE {
        VALUES ?item { ${values} }
        OPTIONAL {
          ?item p:P1082 ?stmt .
          ?stmt ps:P1082 ?population .
          OPTIONAL { ?stmt pq:P585 ?date . }
        }
      }
    `;

    const response = await fetch(`${WIKIDATA_ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, {
      headers: {
        'user-agent': 'globe-forge-chronicles/1.0',
        accept: 'application/sparql-results+json',
      },
    });

    if (!response.ok) {
      console.warn(`Wikidata chunk ${index + 1}/${chunks.length} failed: ${response.status}`);
      continue;
    }

    const data = await response.json();
    const bestById = new Map();
    for (const binding of data.results.bindings) {
      const qid = binding.item?.value?.split('/').pop();
      const population = Number(binding.population?.value);
      const dateValue = binding.date?.value ? Date.parse(binding.date.value) : -Infinity;
      if (!qid || !Number.isFinite(population)) continue;
      const current = bestById.get(qid);
      if (!current || dateValue > current.dateValue || (dateValue === current.dateValue && population > current.population)) {
        bestById.set(qid, { population, dateValue });
      }
    }

    for (const [qid, value] of bestById) {
      result.set(qid, Math.round(value.population));
    }

    console.log(`Wikidata populations: chunk ${index + 1}/${chunks.length} done`);
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  return result;
}

async function main() {
  const [sourceGeoJson, worldLand] = await Promise.all([
    fetchJson(SOURCE_URL),
    fs.readFile(WORLD_LAND, 'utf8').then(JSON.parse),
  ]);

  const countryPopulation = new Map();
  for (const feature of worldLand.features || []) {
    const props = feature.properties || {};
    const iso = props.adm0_a3 || props.iso_a3 || props.sov_a3;
    if (!iso || iso === '-99') continue;
    countryPopulation.set(isoToGameId(iso), Number(props.pop_est) || 0);
  }

  const features = [];
  const metadataById = {};
  const wikidataIds = new Set();

  for (const feature of sourceGeoJson.features || []) {
    const props = { ...(feature.properties || {}) };
    const iso = props.adm0_a3 || props.iso_a3 || props.iso_a2 || props.sov_a3;
    if (!iso || iso === '-99' || !feature.geometry) continue;

    const countryId = isoToGameId(iso);
    const provinceId = buildProvinceId({ ...props, countryId });
    const provinceName = props.name_en || props.name || props.gn_name || provinceId;
    const area = geometryArea(feature.geometry);
    const wikidataId = typeof props.wikidataid === 'string' && /^Q\d+$/.test(props.wikidataid) ? props.wikidataid : null;
    if (wikidataId) wikidataIds.add(wikidataId);

    props.countryId = countryId;
    props.countryName = props.admin || props.geonunit || iso;
    props.provinceId = provinceId;
    props.provinceName = provinceName;
    props.labelLng = Number.isFinite(props.longitude) ? props.longitude : null;
    props.labelLat = Number.isFinite(props.latitude) ? props.latitude : null;
    props.wikidataId = wikidataId;

    features.push({
      type: 'Feature',
      properties: props,
      geometry: feature.geometry,
    });

    metadataById[provinceId] = {
      id: provinceId,
      name: provinceName,
      country: countryId,
      countryName: props.countryName,
      population: 0,
      populationSource: wikidataId ? 'wikidata-pending' : 'estimated-area-share',
      type: props.type_en || props.type || 'Admin-1',
      wikidataId,
      iso3166_2: props.iso_3166_2 || null,
      labelLng: props.labelLng,
      labelLat: props.labelLat,
      areaWeight: area,
      countryPopulation: countryPopulation.get(countryId) || 0,
    };
  }

  console.log(`Prepared ${features.length} province features`);
  const populationByWikidata = await fetchWikidataPopulationMap([...wikidataIds]);

  const provincesByCountry = new Map();
  for (const meta of Object.values(metadataById)) {
    if (meta.wikidataId && populationByWikidata.has(meta.wikidataId)) {
      meta.population = populationByWikidata.get(meta.wikidataId);
      meta.populationSource = 'wikidata';
    }
    if (!provincesByCountry.has(meta.country)) {
      provincesByCountry.set(meta.country, []);
    }
    provincesByCountry.get(meta.country).push(meta);
  }

  for (const [countryId, provinces] of provincesByCountry) {
    const totalCountryPopulation = countryPopulation.get(countryId)
      || provinces.reduce((sum, province) => sum + province.population, 0)
      || provinces.length * 500_000;

    const known = provinces.filter(province => province.population > 0);
    const unknown = provinces.filter(province => province.population <= 0);
    const totalKnownPopulation = known.reduce((sum, province) => sum + province.population, 0);
    const totalKnownArea = known.reduce((sum, province) => sum + Math.max(1, province.areaWeight), 0);
    const totalUnknownArea = unknown.reduce((sum, province) => sum + Math.max(1, province.areaWeight), 0);

    if (unknown.length === 0) continue;

    if (known.length > 0 && totalKnownArea > 0) {
      const density = totalKnownPopulation / totalKnownArea;
      let assigned = 0;
      for (let i = 0; i < unknown.length; i++) {
        const province = unknown[i];
        const isLast = i === unknown.length - 1;
        const estimated = isLast
          ? Math.max(1, Math.round(Math.max(totalCountryPopulation - totalKnownPopulation - assigned, 1)))
          : Math.max(1, Math.round(density * Math.max(1, province.areaWeight)));
        province.population = estimated;
        province.populationSource = 'estimated-known-density';
        assigned += estimated;
      }
    } else {
      let assigned = 0;
      for (let i = 0; i < unknown.length; i++) {
        const province = unknown[i];
        const isLast = i === unknown.length - 1;
        const estimated = isLast
          ? Math.max(1, Math.round(totalCountryPopulation - assigned))
          : Math.max(1, Math.round(totalCountryPopulation * (Math.max(1, province.areaWeight) / Math.max(totalUnknownArea, 1))));
        province.population = estimated;
        province.populationSource = 'estimated-area-share';
        assigned += estimated;
      }
    }
  }

  for (const feature of features) {
    const provinceId = feature.properties.provinceId;
    feature.properties.population = metadataById[provinceId].population;
    feature.properties.populationSource = metadataById[provinceId].populationSource;
  }

  const provinceData = {};
  for (const [id, meta] of Object.entries(metadataById)) {
    provinceData[id] = {
      id: meta.id,
      name: meta.name,
      country: meta.country,
      countryName: meta.countryName,
      population: meta.population,
      populationSource: meta.populationSource,
      type: meta.type,
      wikidataId: meta.wikidataId,
      iso3166_2: meta.iso3166_2,
      labelLng: meta.labelLng,
      labelLat: meta.labelLat,
    };
  }

  await fs.writeFile(OUT_GEOJSON, JSON.stringify({ type: 'FeatureCollection', features }));
  await fs.writeFile(OUT_DATA, JSON.stringify(provinceData));

  const sourced = Object.values(provinceData).filter(entry => entry.populationSource === 'wikidata').length;
  console.log(`Wrote ${OUT_GEOJSON}`);
  console.log(`Wrote ${OUT_DATA}`);
  console.log(`Population coverage from Wikidata: ${sourced}/${Object.keys(provinceData).length}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
