/**
 * ForecastClient — low-level HTTP client for the Open-Meteo Forecast API.
 *
 * Responsibility: construct the request URL, enforce a 10-second timeout via
 * AbortController, and return the raw Response object.  All business-logic
 * (parsing, validation, error mapping) is handled by ForecastService.
 */

const FORECAST_BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10_000;

/**
 * Fetches the current weather forecast for the given coordinates.
 *
 * @param latitude  - Latitude in decimal degrees (−90 to 90).
 * @param longitude - Longitude in decimal degrees (−180 to 180).
 * @returns The raw `Response` from the Forecast API.
 * @throws {Error} With message `'TIMEOUT'` when the request exceeds 10 seconds.
 * @throws {Error} Network errors propagated from the underlying `fetch` call.
 */
export async function fetchForecast(
  latitude: number,
  longitude: number,
): Promise<Response> {
  const url = new URL(FORECAST_BASE_URL);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,precipitation',
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    // AbortController fires a DOMException with name 'AbortError'.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    // Re-throw all other network errors as-is.
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
