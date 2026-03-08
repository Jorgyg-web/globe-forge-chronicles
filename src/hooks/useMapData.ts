/**
 * React hook for loading GeoJSON map data.
 * 
 * Provides a way to load province/country GeoJSON files and
 * apply the resulting geometries to the game state.
 * 
 * Usage:
 *   const { loadProvinces, loadCountries, isLoading, error } = useMapData();
 *   
 *   useEffect(() => {
 *     loadProvinces('/data/provinces.geojson');
 *   }, []);
 */

import { useState, useCallback, useRef } from 'react';
import { MapDataLoader, applyGeometriesToProvinces } from '@/map';
import { ParsedProvinceGeometry, ParsedCountryGeometry, GeoJSONFeatureCollection } from '@/map/geoTypes';
import { Province } from '@/types/game';

interface UseMapDataReturn {
  /** Load provinces from a GeoJSON URL */
  loadProvinces: (url: string) => Promise<ParsedProvinceGeometry[]>;
  /** Load provinces from inline GeoJSON data */
  loadProvincesFromData: (data: GeoJSONFeatureCollection) => ParsedProvinceGeometry[];
  /** Load countries from a GeoJSON URL */
  loadCountries: (url: string) => Promise<ParsedCountryGeometry[]>;
  /** Apply loaded geometries to game provinces (returns new province map) */
  applyToProvinces: (provinces: Record<string, Province>) => Record<string, Province>;
  /** Whether a load is in progress */
  isLoading: boolean;
  /** Last error message */
  error: string | null;
  /** Number of province geometries loaded */
  provinceCount: number;
  /** Number of country geometries loaded */
  countryCount: number;
  /** Access the underlying loader */
  loader: MapDataLoader;
}

export function useMapData(): UseMapDataReturn {
  const loaderRef = useRef(new MapDataLoader());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provinceCount, setProvinceCount] = useState(0);
  const [countryCount, setCountryCount] = useState(0);

  const loadProvinces = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await loaderRef.current.loadProvincesFromUrl(url);
      setProvinceCount(results.length);
      return results;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load provinces';
      setError(msg);
      console.error('[useMapData]', msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProvincesFromData = useCallback((data: GeoJSONFeatureCollection) => {
    setError(null);
    try {
      const results = loaderRef.current.loadProvincesFromGeoJSON(data);
      setProvinceCount(results.length);
      return results;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to parse provinces';
      setError(msg);
      return [];
    }
  }, []);

  const loadCountries = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await loaderRef.current.loadCountriesFromUrl(url);
      setCountryCount(results.length);
      return results;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load countries';
      setError(msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyToProvinces = useCallback((provinces: Record<string, Province>) => {
    return applyGeometriesToProvinces(provinces, loaderRef.current.getProvinceGeometries());
  }, []);

  return {
    loadProvinces,
    loadProvincesFromData,
    loadCountries,
    applyToProvinces,
    isLoading,
    error,
    provinceCount,
    countryCount,
    loader: loaderRef.current,
  };
}
