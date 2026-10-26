/**
 * GeocodingClient — HTTP client for the Open-Meteo Geocoding API.
 *
 * Responsibilities:
 *  - Build the request URL with the city name URL-encoded and count=1.
 *  - Enforce a 10-second timeout via AbortController + setTimeout.
 *  - Return the raw Response object so callers can inspect status and parse the body.
 *  - Throw on network failures or timeouts (the promise rejects).
 *
 * Requirements: 2.1, 2.4
 */

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const TIMEOUT_MS = 10_000;

/**
 * Fetches the raw geocoding response for the given city name.
 *
 * @param cityName - The city name to search for (will be URL-encoded).
 * @returns A promise that resolves to the raw {@link Response} from the API.
 * @throws {DOMException} With name `"AbortError"` if the request times out.
 * @throws {TypeError} On network-level failures (no connectivity, DNS failure, etc.).
 */
export async function fetchGeocoding(cityName: string): Promise<Response> {
  const url = new URL(GEOCODING_BASE_URL);
  url.searchParams.set('name', cityName); // encodes the value automatically
  url.searchParams.set('count', '1');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    return response;
  } finally {
    // Always clear the timeout to avoid memory leaks regardless of success or failure.
    clearTimeout(timeoutId);
  }
}
