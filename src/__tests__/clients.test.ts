/**
 * Pruebas de los clientes HTTP (tareas 3.2 y 3.4 de tasks.md).
 * Propiedades 3 y 6 de design.md + verificación del timeout de 10 s.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { fetchGeocoding } from '../clients/GeocodingClient';
import { fetchForecast } from '../clients/ForecastClient';
import { jsonResponse, mockFetch, mockHangingFetch } from './helpers';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('GeocodingClient', () => {
  it('Propiedad 3: la URL incluye el nombre codificado y count=1', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (city) => {
        const fetchMock = mockFetch(() => jsonResponse({}));
        await fetchGeocoding(city);
        const url = new URL(fetchMock.mock.calls[0][0]);
        expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
        expect(url.searchParams.get('name')).toBe(city);
        expect(url.searchParams.get('count')).toBe('1');
      }),
      { numRuns: 100 },
    );
  });

  it('cancela la petición si no hay respuesta en 10 segundos', async () => {
    vi.useFakeTimers();
    const { state } = mockHangingFetch();
    const pending = fetchGeocoding('Lima').catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(9_999);
    expect(state.signal?.aborted).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const error = (await pending) as DOMException;
    expect(state.signal?.aborted).toBe(true);
    expect(error.name).toBe('AbortError');
  });
});

describe('ForecastClient', () => {
  it('Propiedad 6: la URL incluye coordenadas y las tres variables actuales', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ min: -180, max: 180, noNaN: true }),
        async (lat, lon) => {
          const fetchMock = mockFetch(() => jsonResponse({}));
          await fetchForecast(lat, lon);
          const url = new URL(fetchMock.mock.calls[0][0]);
          expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
          expect(url.searchParams.get('latitude')).toBe(String(lat));
          expect(url.searchParams.get('longitude')).toBe(String(lon));
          expect(url.searchParams.get('current')).toBe(
            'temperature_2m,relative_humidity_2m,precipitation',
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('cancela la petición a los 10 segundos y lanza Error("TIMEOUT")', async () => {
    vi.useFakeTimers();
    const { state } = mockHangingFetch();
    const pending = fetchForecast(-16.4, -71.5).catch((e: unknown) => e);

    await vi.advanceTimersByTimeAsync(10_000);
    const error = (await pending) as Error;
    expect(state.signal?.aborted).toBe(true);
    expect(error.message).toBe('TIMEOUT');
  });
});
