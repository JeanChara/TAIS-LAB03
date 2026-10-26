/**
 * Pruebas de WeatherController (tareas 9.2 y 9.3) y de integración extremo a
 * extremo (tarea 11.3). Propiedad 13 de design.md.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { WeatherController } from '../WeatherController';
import { CitySearchForm } from '../components/CitySearchForm';
import { WeatherDisplay } from '../components/WeatherDisplay';
import { ErrorMessage } from '../components/ErrorMessage';
import { createLoadingIndicator } from '../components/LoadingIndicator';
import type { ForecastResult, GeocodingResult } from '../types/index';
import { flush, jsonResponse, mockFetchError } from './helpers';

const COORDS: GeocodingResult = { success: true, data: { latitude: -16.4, longitude: -71.5, cityName: 'Arequipa' } };
const WEATHER: ForecastResult = { success: true, data: { temperature: 17, humidity: 51, precipitation: 0 } };

function makeDeps(geo: GeocodingResult, forecast: ForecastResult) {
  const calls: string[] = [];
  const deps = {
    searchForm: { enable: vi.fn(() => { calls.push('enable'); }) },
    weatherDisplay: {
      render: vi.fn(() => { calls.push('render'); }),
      clear: vi.fn(() => { calls.push('clear'); }),
    },
    errorMessage: {
      show: vi.fn((_m: string) => { calls.push('error'); }),
      clear: vi.fn(() => { calls.push('errorClear'); }),
    },
    loadingIndicator: {
      show: vi.fn(() => { calls.push('loadingShow'); }),
      hide: vi.fn(() => { calls.push('loadingHide'); }),
    },
    geocodeService: vi.fn(async (_c: string) => { calls.push('geocode'); return geo; }),
    forecastService: vi.fn(async (_a: number, _b: number) => { calls.push('forecast'); return forecast; }),
  };
  return { deps, calls };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WeatherController', () => {
  it('Propiedad 13: limpia el display antes de consultar el pronóstico', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), async (city) => {
        const { deps, calls } = makeDeps(COORDS, WEATHER);
        await new WeatherController(deps).handleSearch(city);
        expect(calls.indexOf('clear')).toBeLessThan(calls.indexOf('forecast'));
        expect(calls.indexOf('clear')).toBeLessThan(calls.indexOf('geocode'));
      }),
      { numRuns: 50 },
    );
  });

  it('flujo exitoso: geocodificación → pronóstico → render', async () => {
    const { deps, calls } = makeDeps(COORDS, WEATHER);
    await new WeatherController(deps).handleSearch('Arequipa');
    expect(deps.forecastService).toHaveBeenCalledWith(-16.4, -71.5);
    expect(deps.weatherDisplay.render).toHaveBeenCalledWith(
      { temperature: 17, humidity: 51, precipitation: 0 }, 'Arequipa', 'Arequipa',
    );
    expect(deps.errorMessage.show).not.toHaveBeenCalled();
    expect(calls).toEqual(['clear', 'errorClear', 'loadingShow', 'geocode', 'forecast', 'loadingHide', 'render', 'enable']);
  });

  it('CITY_NOT_FOUND: muestra el mensaje y no consulta el pronóstico', async () => {
    const { deps } = makeDeps({ success: false, error: { type: 'CITY_NOT_FOUND' } }, WEATHER);
    await new WeatherController(deps).handleSearch('Xyz999');
    expect(deps.errorMessage.show).toHaveBeenCalledWith(
      'No se encontró la ciudad ingresada. Verifica el nombre e intenta de nuevo.',
    );
    expect(deps.forecastService).not.toHaveBeenCalled();
    expect(deps.loadingIndicator.hide).toHaveBeenCalled();
    expect(deps.searchForm.enable).toHaveBeenCalled();
  });

  it('INCOMPLETE_DATA: muestra el mensaje de datos incompletos', async () => {
    const { deps } = makeDeps(COORDS, { success: false, error: { type: 'INCOMPLETE_DATA' } });
    await new WeatherController(deps).handleSearch('Arequipa');
    expect(deps.errorMessage.show).toHaveBeenCalledWith('Los datos meteorológicos recibidos están incompletos.');
    expect(deps.weatherDisplay.render).not.toHaveBeenCalled();
  });

  it('el indicador de carga se muestra al inicio y se oculta al terminar (éxito y error)', async () => {
    for (const forecast of [WEATHER, { success: false, error: { type: 'TIMEOUT' } } as ForecastResult]) {
      const { deps, calls } = makeDeps(COORDS, forecast);
      await new WeatherController(deps).handleSearch('Lima');
      expect(calls.filter((c) => c === 'loadingShow').length).toBe(1);
      expect(calls.filter((c) => c === 'loadingHide').length).toBe(1);
      expect(calls.indexOf('loadingShow')).toBeLessThan(calls.indexOf('loadingHide'));
    }
  });

  it('cada tipo de error muestra un mensaje que identifica el servicio', async () => {
    const forecastErrors: ForecastResult[] = [
      { success: false, error: { type: 'NETWORK_ERROR' } },
      { success: false, error: { type: 'TIMEOUT' } },
      { success: false, error: { type: 'SERVICE_ERROR', statusCode: 500 } },
      { success: false, error: { type: 'INVALID_RESPONSE' } },
    ];
    for (const f of forecastErrors) {
      const { deps } = makeDeps(COORDS, f);
      await new WeatherController(deps).handleSearch('Lima');
      expect(deps.errorMessage.show.mock.calls[0][0]).toContain('pronóstico');
    }
    const geoErrors: GeocodingResult[] = [
      { success: false, error: { type: 'NETWORK_ERROR' } },
      { success: false, error: { type: 'TIMEOUT' } },
      { success: false, error: { type: 'SERVICE_ERROR', statusCode: 503 } },
      { success: false, error: { type: 'INVALID_RESPONSE' } },
    ];
    for (const g of geoErrors) {
      const { deps } = makeDeps(g, WEATHER);
      await new WeatherController(deps).handleSearch('Lima');
      expect(deps.errorMessage.show.mock.calls[0][0]).toContain('geocodificación');
    }
  });
});

describe('Integración extremo a extremo (fetch simulado)', () => {
  function mountApp() {
    document.body.innerHTML = '<div id="s"></div><div id="l"></div><div id="e"></div><div id="w"></div>';
    const weatherDisplay = new WeatherDisplay(document.getElementById('w')!);
    const errorMessage = new ErrorMessage(document.getElementById('e')!);
    const loadingIndicator = createLoadingIndicator(document.getElementById('l')!);
    let form: CitySearchForm | null = null;
    const controller = new WeatherController({
      searchForm: { enable: () => form?.enable() },
      weatherDisplay,
      errorMessage,
      loadingIndicator,
    });
    form = new CitySearchForm({ onSearch: controller.getSearchHandler() });
    document.getElementById('s')!.appendChild(form.getElement());
    return {
      input: document.querySelector<HTMLInputElement>('#city-input')!,
      button: document.querySelector<HTMLButtonElement>('button[type="submit"]')!,
      error: document.getElementById('e')!,
      weather: document.getElementById('w')!,
    };
  }

  it('búsqueda exitosa: los datos aparecen en el DOM', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('geocoding')
        ? jsonResponse({ results: [{ name: 'Arequipa', latitude: -16.4, longitude: -71.5 }] })
        : jsonResponse({ current: { temperature_2m: 17, relative_humidity_2m: 51, precipitation: 0 } }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const app = mountApp();
    app.input.value = '  Arequipa ';
    app.button.click();
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(app.weather.textContent).toContain('Arequipa');
    expect(app.weather.textContent).toContain('17.0 °C');
    expect(app.weather.textContent).toContain('51 %');
    expect(app.weather.textContent).toContain('0.0 mm');
    expect(app.error.hidden).toBe(true);
  });

  it('falla de red: mensaje visible y campo accesible', async () => {
    mockFetchError(new TypeError('Failed to fetch'));
    const app = mountApp();
    app.input.value = 'Lima';
    app.button.click();
    await flush();
    expect(app.error.hidden).toBe(false);
    expect(app.error.textContent).toBe('El servicio de geocodificación no está disponible. Verifica tu conexión.');
    expect(app.input.disabled).toBe(false);
    expect(app.weather.innerHTML).toBe('');
  });
});
