import { WeatherData } from '../types/index';
import {
  formatTemperature,
  formatHumidity,
  formatPrecipitation,
} from '../utils/formatters';

/**
 * WeatherDisplay component.
 *
 * Renders current weather data (city name, temperature, humidity, precipitation)
 * inside a host element. Applies the formatter functions from `formatters.ts` so
 * that raw numeric values are never shown directly in the UI.
 *
 * If the city name returned by the Geocoding API is absent or empty, the component
 * falls back to the name the user originally typed in the search box (Req 4.7).
 */
export class WeatherDisplay {
  private readonly container: HTMLElement;

  /**
   * @param container - The DOM element that will host the rendered weather data.
   */
  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Renders weather data into the container.
   *
   * @param weather     - Raw weather values (temperature, humidity, precipitation).
   * @param apiCityName - City name as returned by the Geocoding API (may be empty).
   * @param userInput   - The city name the user typed; used as fallback when
   *                      `apiCityName` is absent or empty.
   */
  render(weather: WeatherData, apiCityName: string, userInput: string): void {
    // Req 4.7: fall back to user-typed name when the API returns nothing.
    const displayName =
      apiCityName && apiCityName.trim() !== '' ? apiCityName : userInput;

    this.container.innerHTML = `
      <div class="weather-display" aria-live="polite">
        <h2 class="weather-display__city">${escapeHtml(displayName)}</h2>
        <ul class="weather-display__data">
          <li class="weather-display__item weather-display__item--temperature">
            <span class="weather-display__label">Temperatura</span>
            <span class="weather-display__value">${escapeHtml(formatTemperature(weather.temperature))}</span>
          </li>
          <li class="weather-display__item weather-display__item--humidity">
            <span class="weather-display__label">Humedad</span>
            <span class="weather-display__value">${escapeHtml(formatHumidity(weather.humidity))}</span>
          </li>
          <li class="weather-display__item weather-display__item--precipitation">
            <span class="weather-display__label">Precipitación</span>
            <span class="weather-display__value">${escapeHtml(formatPrecipitation(weather.precipitation))}</span>
          </li>
        </ul>
      </div>
    `;
  }

  /**
   * Removes all rendered weather content from the container.
   * Called at the start of every new search so stale data is never shown
   * alongside a loading indicator (Req 4.6).
   */
  clear(): void {
    this.container.innerHTML = '';
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Escapes a string for safe insertion into HTML to prevent XSS.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
