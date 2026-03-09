/**
 * Map Data Module - Public API
 * 
 * This module provides everything needed to load geographic data
 * and convert it to the format used by the game's map renderer.
 * 
 * Usage with GeoJSON files:
 * 
 *   import { getMapDataLoader, applyGeometriesToProvinces } from '@/map';
 *   
 *   const loader = getMapDataLoader();
 *   await loader.loadProvincesFromUrl('/data/provinces.geojson');
 *   const newProvinces = applyGeometriesToProvinces(
 *     gameState.provinces,
 *     loader.getProvinceGeometries()
 *   );
 * 
 * Usage with inline GeoJSON:
 * 
 *   import { MapDataLoader } from '@/map';
 *   
 *   const loader = new MapDataLoader();
 *   loader.loadProvincesFromGeoJSON(myGeoJsonData);
 *   const geometries = loader.getProvinceGeometries();
 * 
 * GeoJSON Province Feature Format:
 * {
 *   "type": "Feature",
 *   "properties": {
 *     "provinceId": "usa_ne",
 *     "provinceName": "Northeast",
 *     "countryId": "usa",
 *     "terrainType": "urban"
 *   },
 *   "geometry": {
 *     "type": "Polygon",
 *     "coordinates": [[[-74, 41], [-71, 42], ...]]
 *   }
 * }
 */

export { MapDataLoader, applyGeometriesToProvinces, getMapDataLoader } from './MapDataLoader';
export { normalizeGeometry, geometryCentroid, signedRingArea } from './geometryValidator';
export { projectPoint, ringToSvgPath, polygonToSvgPath, multiPolygonToSvgPath, normalizedGeometryToSvgPath, normalizedPolygonToSvgPath, getDefaultProjectionConfig } from './projection';
export type { ProjectionConfig } from './projection';
export type {
  GeoJSONFeatureCollection,
  GeoJSONFeature,
  GeoJSONGeometry,
  GeoJSONPolygon,
  GeoJSONMultiPolygon,
  ProvinceGeoProperties,
  CountryGeoProperties,
  ParsedProvinceGeometry,
  ParsedCountryGeometry,
} from './geoTypes';
