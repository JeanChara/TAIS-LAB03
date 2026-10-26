/**
 * GeocodingService — business logic layer for geocoding operations.
 *
 * Responsibilities:
 *  - Call GeocodingClient and handle the raw Response.
 *  - Validate that results exist and are non-empty; return CITY_NOT_FOUND otherwise.
 *  - Validate that results[0].latitude and results[0].longitude are present numbers;
 *    return CITY_NOT_FOUND if either is missing or null.
 *  - Map results[0] to Coordinates without any value transformation.
 *  - Catch network/timeout errors and return the appropriate typed error.
 *  - Catch non-2xx HTTP responses and return SERVICE_ERROR with the status code.
 *  - Catch JSON parse failures and return INVALID_RESPONSE.
 *
 * Requirements: 2.2, 2.3, 2.4, 2.6, 5.1, 5.4, 5.5
 */

import { fetchGeocoding } from '../clients/GeocodingClient';
import type { Coordinates, GeocodingResult } from '../types/index';

/**
 * Shape of a single entry in the `results` array returned by the Geocoding API.
 * Only the fields we care about are declared; the rest are ignored.
 */
interface GeocodingApiResult {
  name?: string;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Shape of the JSON body returned by the Geocoding API.
 */
interface GeocodingApiResponse {
  results?: GeocodingApiResult[];
}

/**
 * Geocodes a city name into geographic coordinates.
 *
 * @param cityName - The name of the city to look up.
 * @returns A promise that always resolves to a {@link GeocodingResult}.
 *          Never rejects — all failures are encoded as typed errors.
 */
export async function geocode(cityName: string): Promise<GeocodingResult> {
  let response: Response;

  // ── 1. Network / timeout errors ──────────────────────────────────────────
  try {
    response = await fetchGeocoding(cityName);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { success: false, error: { type: 'TIMEOUT' } };
    }
    // TypeError (network failure) and any other unexpected throw
    return { success: false, error: { type: 'NETWORK_ERROR' } };
  }

  // ── 2. Non-2xx HTTP responses ─────────────────────────────────────────────
  if (!response.ok) {
    return {
      success: false,
      error: { type: 'SERVICE_ERROR', statusCode: response.status },
    };
  }

  // ── 3. JSON parse failures ────────────────────────────────────────────────
  let body: GeocodingApiResponse;
  try {
    body = (await response.json()) as GeocodingApiResponse;
  } catch {
    return { success: false, error: { type: 'INVALID_RESPONSE' } };
  }

  // ── 4. Empty or missing results ───────────────────────────────────────────
  if (!body.results || body.results.length === 0) {
    return { success: false, error: { type: 'CITY_NOT_FOUND' } };
  }

  const first = body.results[0];

  // ── 5. Missing or null lat/lon in the first result ────────────────────────
  if (
    first.latitude === null ||
    first.latitude === undefined ||
    typeof first.latitude !== 'number' ||
    first.longitude === null ||
    first.longitude === undefined ||
    typeof first.longitude !== 'number'
  ) {
    return { success: false, error: { type: 'CITY_NOT_FOUND' } };
  }

  // ── 6. Happy path — map to Coordinates without transformation ─────────────
  const coordinates: Coordinates = {
    latitude: first.latitude,
    longitude: first.longitude,
    cityName: first.name ?? '',
  };

  return { success: true, data: coordinates };
}
