/**
 * GeoJSON Map Data Loader
 * 
 * Responsible for:
 * - Loading GeoJSON files (countries and provinces)
 * - Parsing features and extracting properties
 * - Converting polygon geometries to SVG path strings
 * - Mapping parsed geometries to existing game provinces by provinceId
 * 
 * Usage:
 *   const loader = new MapDataLoader();
 *   await loader.loadProvinces('/data/provinces.geojson');
 *   const geometries = loader.getProvinceGeometries();
 *   applyGeometriesToGameState(gameState, geometries);
 */

import {
  GeoJSONFeatureCollection,
  GeoJSONFeature,
  ParsedProvinceGeometry,
  ParsedCountryGeometry,
  ProvinceGeoProperties,
  CountryGeoProperties,
} from './geoTypes';
import {
  polygonToSvgPath,
  multiPolygonToSvgPath,
  ProjectionConfig,
  getDefaultProjectionConfig,
} from './projection';
import { computeCentroid, computeBounds, updateProvinceGeometry, invalidateCentroidCache } from '@/data/provinceGeometry';
import { Province } from '@/types/game';

export class MapDataLoader {
  private projectionConfig: ProjectionConfig;
  private provinceGeometries: Map<string, ParsedProvinceGeometry> = new Map();
  private countryGeometries: Map<string, ParsedCountryGeometry> = new Map();
  private loaded = false;

  constructor(config?: Partial<ProjectionConfig>) {
    this.projectionConfig = { ...getDefaultProjectionConfig(), ...config };
  }

  /**
   * Load provinces from a GeoJSON FeatureCollection.
   * Each feature must have properties: provinceId, provinceName, countryId, terrainType.
   */
  loadProvincesFromGeoJSON(geojson: GeoJSONFeatureCollection): ParsedProvinceGeometry[] {
    const results: ParsedProvinceGeometry[] = [];

    for (const feature of geojson.features) {
      const parsed = this.parseProvinceFeature(feature);
      if (parsed) {
        this.provinceGeometries.set(parsed.provinceId, parsed);
        results.push(parsed);
      }
    }

    this.loaded = true;
    return results;
  }

  /**
   * Load countries from a GeoJSON FeatureCollection.
   * Each feature must have properties: countryId, countryName.
   */
  loadCountriesFromGeoJSON(geojson: GeoJSONFeatureCollection): ParsedCountryGeometry[] {
    const results: ParsedCountryGeometry[] = [];

    for (const feature of geojson.features) {
      const parsed = this.parseCountryFeature(feature);
      if (parsed) {
        this.countryGeometries.set(parsed.countryId, parsed);
        results.push(parsed);
      }
    }

    return results;
  }

  /**
   * Load provinces from a URL (fetch + parse).
   */
  async loadProvincesFromUrl(url: string): Promise<ParsedProvinceGeometry[]> {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[MapDataLoader] Failed to load provinces from ${url}: ${response.status}`);
      return [];
    }
    const geojson: GeoJSONFeatureCollection = await response.json();
    return this.loadProvincesFromGeoJSON(geojson);
  }

  /**
   * Load countries from a URL (fetch + parse).
   */
  async loadCountriesFromUrl(url: string): Promise<ParsedCountryGeometry[]> {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[MapDataLoader] Failed to load countries from ${url}: ${response.status}`);
      return [];
    }
    const geojson: GeoJSONFeatureCollection = await response.json();
    return this.loadCountriesFromGeoJSON(geojson);
  }

  /**
   * Get all parsed province geometries.
   */
  getProvinceGeometries(): Map<string, ParsedProvinceGeometry> {
    return this.provinceGeometries;
  }

  /**
   * Get all parsed country geometries.
   */
  getCountryGeometries(): Map<string, ParsedCountryGeometry> {
    return this.countryGeometries;
  }

  /**
   * Get a single province geometry by ID.
   */
  getProvinceGeometry(provinceId: string): ParsedProvinceGeometry | undefined {
    return this.provinceGeometries.get(provinceId);
  }

  /**
   * Check if GeoJSON data has been loaded.
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Convert a GeoJSON feature to SVG path string.
   */
  private featureToSvgPath(feature: GeoJSONFeature): string {
    const { geometry } = feature;
    if (geometry.type === 'Polygon') {
      return polygonToSvgPath(geometry.coordinates, this.projectionConfig);
    }
    if (geometry.type === 'MultiPolygon') {
      return multiPolygonToSvgPath(geometry.coordinates, this.projectionConfig);
    }
    return '';
  }

  /**
   * Parse a province GeoJSON feature into a ParsedProvinceGeometry.
   */
  private parseProvinceFeature(feature: GeoJSONFeature): ParsedProvinceGeometry | null {
    const props = feature.properties as Partial<ProvinceGeoProperties>;
    if (!props.provinceId) {
      console.warn('[MapDataLoader] Province feature missing provinceId, skipping', props);
      return null;
    }

    const svgPath = this.featureToSvgPath(feature);
    if (!svgPath) {
      console.warn(`[MapDataLoader] Could not convert geometry for province ${props.provinceId}`);
      return null;
    }

    const centroid = computeCentroid(svgPath);
    const bounds = computeBounds(svgPath);

    return {
      provinceId: props.provinceId,
      provinceName: props.provinceName ?? props.provinceId,
      countryId: props.countryId ?? 'unknown',
      terrainType: props.terrainType ?? 'plains',
      svgPath,
      centroid,
      bounds,
    };
  }

  /**
   * Parse a country GeoJSON feature into a ParsedCountryGeometry.
   */
  private parseCountryFeature(feature: GeoJSONFeature): ParsedCountryGeometry | null {
    const props = feature.properties as Partial<CountryGeoProperties>;
    if (!props.countryId) {
      console.warn('[MapDataLoader] Country feature missing countryId, skipping', props);
      return null;
    }

    const svgPath = this.featureToSvgPath(feature);
    if (!svgPath) return null;

    return {
      countryId: props.countryId,
      countryName: props.countryName ?? props.countryId,
      svgPath,
    };
  }
}

/**
 * Apply loaded GeoJSON geometries to existing game provinces.
 * Only updates the `geometry` field — does not modify gameplay data.
 * 
 * @param provinces - Current province records from game state
 * @param geometries - Parsed geometries from MapDataLoader
 * @returns Updated provinces with new geometry paths
 */
export function applyGeometriesToProvinces(
  provinces: Record<string, Province>,
  geometries: Map<string, ParsedProvinceGeometry>
): Record<string, Province> {
  const updated = { ...provinces };
  let applied = 0;
  let missing = 0;

  for (const [id, geo] of geometries) {
    if (updated[id]) {
      updated[id] = { ...updated[id], geometry: geo.svgPath };
      applied++;
    } else {
      console.warn(`[MapDataLoader] GeoJSON province "${id}" has no matching game province`);
      missing++;
    }
  }

  console.log(`[MapDataLoader] Applied ${applied} geometries, ${missing} unmatched, ${Object.keys(provinces).length - applied} provinces kept existing geometry`);
  return updated;
}

/**
 * Create a singleton loader instance.
 */
let defaultLoader: MapDataLoader | null = null;

export function getMapDataLoader(): MapDataLoader {
  if (!defaultLoader) {
    defaultLoader = new MapDataLoader();
  }
  return defaultLoader;
}
