/**
 * GeoJSON type definitions for the map data loader.
 */

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: GeoJSONGeometry;
}

export type GeoJSONGeometry =
  | GeoJSONPolygon
  | GeoJSONMultiPolygon
  | GeoJSONPoint;

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // [ring][point][lng, lat]
}

export interface GeoJSONMultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][]; // [polygon][ring][point][lng, lat]
}

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: number[]; // [lng, lat]
}

/**
 * Properties expected on province GeoJSON features.
 */
export interface ProvinceGeoProperties {
  provinceId: string;
  provinceName: string;
  countryId: string;
  terrainType: string;
}

/**
 * Properties expected on country GeoJSON features.
 */
export interface CountryGeoProperties {
  countryId: string;
  countryName: string;
  countryCode: string;
}

/**
 * Parsed province geometry ready for map rendering.
 */
export interface ParsedProvinceGeometry {
  provinceId: string;
  provinceName: string;
  countryId: string;
  terrainType: string;
  svgPath: string;
  centroid: { x: number; y: number };
  bounds: { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number };
}

/**
 * Parsed country geometry (outer border).
 */
export interface ParsedCountryGeometry {
  countryId: string;
  countryName: string;
  svgPath: string;
}
