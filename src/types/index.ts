/**
 * Domain types and interfaces for the weather-forecast-app.
 * These types are shared across all layers: clients, services, components, and utils.
 */

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

/**
 * Geographic coordinates returned by the Geocoding API.
 * Values are stored without any transformation.
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
  /** City name as returned by the Geocoding API. */
  cityName: string;
}

/**
 * Current weather data returned by the Forecast API.
 * All values are raw (no formatting applied at this layer).
 */
export interface WeatherData {
  /** Current temperature in °C (temperature_2m). */
  temperature: number;
  /** Relative humidity in % (relative_humidity_2m). */
  humidity: number;
  /** Precipitation in mm. */
  precipitation: number;
}

/**
 * Application state discriminated union.
 * Represents the four possible states of the UI at any point in time.
 */
export type AppState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; cityName: string; weather: WeatherData }
  | { status: 'error'; message: string };

// ---------------------------------------------------------------------------
// Geocoding result types
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all error types that can occur
 * during a geocoding request.
 */
export type GeocodingError =
  | { type: 'CITY_NOT_FOUND' }
  | { type: 'NETWORK_ERROR' }
  | { type: 'TIMEOUT' }
  | { type: 'SERVICE_ERROR'; statusCode: number }
  | { type: 'INVALID_RESPONSE' };

/**
 * Result type for a geocoding operation.
 * On success, contains the extracted Coordinates.
 * On failure, contains a typed GeocodingError.
 */
export type GeocodingResult =
  | { success: true; data: Coordinates }
  | { success: false; error: GeocodingError };

// ---------------------------------------------------------------------------
// Forecast result types
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all error types that can occur
 * during a forecast request.
 */
export type ForecastError =
  | { type: 'NETWORK_ERROR' }
  | { type: 'TIMEOUT' }
  | { type: 'SERVICE_ERROR'; statusCode: number }
  | { type: 'INCOMPLETE_DATA' }
  | { type: 'INVALID_RESPONSE' };

/**
 * Result type for a forecast operation.
 * On success, contains the extracted WeatherData.
 * On failure, contains a typed ForecastError.
 */
export type ForecastResult =
  | { success: true; data: WeatherData }
  | { success: false; error: ForecastError };
