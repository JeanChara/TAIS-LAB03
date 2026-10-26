/**
 * ForecastService — business logic layer for forecast operations.
 *
 * Responsibilities:
 *  - Call ForecastClient and handle the raw Response.
 *  - Validate that current.temperature_2m, current.relative_humidity_2m and
 *    current.precipitation are present numeric values; return INCOMPLETE_DATA otherwise.
 *  - Map the current object to WeatherData without any value transformation.
 *  - Catch network/timeout errors and return the appropriate typed error.
 *  - Catch non-2xx HTTP responses and return SERVICE_ERROR with the status code.
 *  - Catch JSON parse failures and return INVALID_RESPONSE.
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5, 5.2, 5.4, 5.5
 */

import { fetchForecast } from '../clients/ForecastClient';
import type { WeatherData, ForecastResult } from '../types/index';

/**
 * Shape of the `current` object returned by the Forecast API.
 * Only the three fields we require are declared; others are ignored.
 */
interface ForecastApiCurrent {
  temperature_2m?: number | null;
  relative_humidity_2m?: number | null;
  precipitation?: number | null;
}

/**
 * Shape of the JSON body returned by the Forecast API.
 */
interface ForecastApiResponse {
  current?: ForecastApiCurrent;
}

/**
 * Returns true only when `value` is a finite number (not null, undefined, or NaN).
 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value);
}

/**
 * Retrieves the current weather forecast for the given coordinates.
 *
 * @param lat - Latitude in decimal degrees (−90 to 90).
 * @param lon - Longitude in decimal degrees (−180 to 180).
 * @returns A promise that always resolves to a {@link ForecastResult}.
 *          Never rejects — all failures are encoded as typed errors.
 */
export async function getForecast(
  lat: number,
  lon: number,
): Promise<ForecastResult> {
  let response: Response;

  // ── 1. Network / timeout errors ──────────────────────────────────────────
  try {
    response = await fetchForecast(lat, lon);
  } catch (error) {
    if (error instanceof Error && error.message === 'TIMEOUT') {
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
  let body: ForecastApiResponse;
  try {
    body = (await response.json()) as ForecastApiResponse;
  } catch {
    return { success: false, error: { type: 'INVALID_RESPONSE' } };
  }

  // ── 4. Missing or malformed `current` object ──────────────────────────────
  if (!body.current || typeof body.current !== 'object') {
    return { success: false, error: { type: 'INVALID_RESPONSE' } };
  }

  const current = body.current;

  // ── 5. Missing, null, or non-numeric weather fields ───────────────────────
  if (
    !isFiniteNumber(current.temperature_2m) ||
    !isFiniteNumber(current.relative_humidity_2m) ||
    !isFiniteNumber(current.precipitation)
  ) {
    return { success: false, error: { type: 'INCOMPLETE_DATA' } };
  }

  // ── 6. Happy path — map to WeatherData without transformation ─────────────
  const weather: WeatherData = {
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
  };

  return { success: true, data: weather };
}
