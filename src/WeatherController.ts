/**
 * WeatherController — application layer orchestrator.
 *
 * Responsibilities:
 *  - Receive a trimmed city name from CitySearchForm via onSearch callback.
 *  - Clear previous WeatherDisplay and ErrorMessage at the start of each search.
 *  - Show LoadingIndicator while requests are in flight.
 *  - Call GeocodingService; on failure, show the appropriate error message
 *    and keep City_Input accessible.
 *  - On geocoding success, call ForecastService with the returned coordinates.
 *  - On forecast success, render WeatherDisplay with the weather data.
 *  - On forecast failure, show the appropriate error message.
 *  - Always hide the LoadingIndicator once a response or error arrives from
 *    ForecastService (or from GeocodingService when it fails before that point).
 *
 * Requirements: 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5,
 *               4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { geocode } from './services/GeocodingService';
import { getForecast } from './services/ForecastService';
import { CitySearchForm } from './components/CitySearchForm';
import { WeatherDisplay } from './components/WeatherDisplay';
import { ErrorMessage } from './components/ErrorMessage';
import type { GeocodingError, ForecastError } from './types/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Dependencies injected into WeatherController.
 * Using interfaces for each dependency makes the controller testable
 * without coupling it to concrete DOM implementations.
 */
export interface WeatherControllerDeps {
  /** The search form component. Used to call enable() after errors. */
  searchForm: Pick<CitySearchForm, 'enable'>;
  /** The weather display component. Used to render data and to clear state. */
  weatherDisplay: Pick<WeatherDisplay, 'render' | 'clear'>;
  /** The error message component. Used to show and clear error messages. */
  errorMessage: Pick<ErrorMessage, 'show' | 'clear'>;
  /** The loading indicator. Used to show/hide during requests. */
  loadingIndicator: { show: () => void; hide: () => void };
  /**
   * Optional overrides for the service calls. Primarily for testing.
   * When omitted, the real service functions are used.
   */
  geocodeService?: typeof geocode;
  forecastService?: typeof getForecast;
}

// ---------------------------------------------------------------------------
// Controller class
// ---------------------------------------------------------------------------

export class WeatherController {
  private readonly searchForm: WeatherControllerDeps['searchForm'];
  private readonly weatherDisplay: WeatherControllerDeps['weatherDisplay'];
  private readonly errorMessage: WeatherControllerDeps['errorMessage'];
  private readonly loadingIndicator: WeatherControllerDeps['loadingIndicator'];
  private readonly geocodeService: typeof geocode;
  private readonly forecastService: typeof getForecast;

  constructor(deps: WeatherControllerDeps) {
    this.searchForm = deps.searchForm;
    this.weatherDisplay = deps.weatherDisplay;
    this.errorMessage = deps.errorMessage;
    this.loadingIndicator = deps.loadingIndicator;
    this.geocodeService = deps.geocodeService ?? geocode;
    this.forecastService = deps.forecastService ?? getForecast;
  }

  /**
   * Entry point for every search request.
   *
   * Called by CitySearchForm with the trimmed city name (Req 1.5).
   * The trimming and empty-string validation are already handled in the form;
   * this method receives only valid, non-empty city names.
   *
   * @param cityName - Trimmed, non-empty city name from the search form.
   */
  async handleSearch(cityName: string): Promise<void> {
    // ── Req 4.6: clear stale state before issuing new requests ───────────────
    this.weatherDisplay.clear();
    this.errorMessage.clear();

    // ── Req 1.5 / 4.5: show loading indicator ────────────────────────────────
    this.loadingIndicator.show();

    // ── Step 1: Geocoding ─────────────────────────────────────────────────────
    const geoResult = await this.geocodeService(cityName);

    if (!geoResult.success) {
      // Geocoding failed — hide loading and show error; City_Input stays enabled
      // (Req 1.6, 2.3, 2.4)
      this.loadingIndicator.hide();
      this.errorMessage.show(geocodingErrorMessage(geoResult.error));
      // Req 1.6: keep City_Input accessible so the user can try again
      this.searchForm.enable();
      return;
    }

    const { latitude, longitude, cityName: apiCityName } = geoResult.data;

    // ── Step 2: Forecast ──────────────────────────────────────────────────────
    const forecastResult = await this.forecastService(latitude, longitude);

    // ── Req 4.5: hide loading indicator once forecast response is received ────
    this.loadingIndicator.hide();

    if (!forecastResult.success) {
      // Forecast failed — show error; City_Input stays enabled (Req 1.6, 3.3, 3.4, 3.5)
      this.errorMessage.show(forecastErrorMessage(forecastResult.error));
      // Req 1.6: keep City_Input accessible so the user can try again
      this.searchForm.enable();
      return;
    }

    // ── Req 4.1–4.4: render weather data ────────────────────────────────────
    this.weatherDisplay.render(forecastResult.data, apiCityName, cityName);
    // Ensure the form is enabled after a successful search too
    this.searchForm.enable();
  }

  /**
   * Returns an `onSearch` callback bound to this controller.
   * Pass this to CitySearchForm's constructor as `options.onSearch`.
   */
  getSearchHandler(): (cityName: string) => void {
    return (cityName: string) => {
      // Intentionally not awaited here: the controller's async logic runs
      // independently; any errors are already handled internally and will never
      // propagate as unhandled rejections because handleSearch catches nothing
      // externally but returns a resolved promise in all paths.
      void this.handleSearch(cityName);
    };
  }
}

// ---------------------------------------------------------------------------
// Error message helpers
// ---------------------------------------------------------------------------

/**
 * Maps a GeocodingError to a human-readable Spanish message.
 * Mirrors the error classification table in design.md § Error Handling.
 */
function geocodingErrorMessage(error: GeocodingError): string {
  switch (error.type) {
    case 'CITY_NOT_FOUND':
      return 'No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo.';
    case 'NETWORK_ERROR':
      return 'El servicio de geocodificación no está disponible. Verifica tu conexión.';
    case 'TIMEOUT':
      return 'El servicio de geocodificación no respondió a tiempo.';
    case 'SERVICE_ERROR':
      return 'El servicio de geocodificación retornó un error.';
    case 'INVALID_RESPONSE':
      return 'Los datos recibidos del servicio de geocodificación no son válidos.';
  }
}

/**
 * Maps a ForecastError to a human-readable Spanish message.
 * Mirrors the error classification table in design.md § Error Handling.
 */
function forecastErrorMessage(error: ForecastError): string {
  switch (error.type) {
    case 'NETWORK_ERROR':
      return 'El servicio de pronóstico no está disponible. Verifica tu conexión.';
    case 'TIMEOUT':
      return 'El servicio de pronóstico no respondió a tiempo.';
    case 'SERVICE_ERROR':
      return 'El servicio de pronóstico retornó un error.';
    case 'INCOMPLETE_DATA':
      return 'Los datos meteorológicos recibidos están incompletos.';
    case 'INVALID_RESPONSE':
      return 'Los datos recibidos del servicio de pronóstico no son válidos.';
  }
}
