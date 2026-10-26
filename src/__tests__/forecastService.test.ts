/**
 * Pruebas de ForecastService (tareas 5.2 a 5.6 de tasks.md).
 * Propiedades 7, 8, 9 y 10 de design.md + casos unitarios.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { getForecast } from '../services/ForecastService';
import { emptyResponse, jsonResponse, mockFetch, mockFetchError } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

// JSON no distingue -0 de 0, por eso se normaliza -0 a 0 en los generadores.
const num = fc.double({ min: -1000, max: 1000, noNaN: true }).map((v) => (Object.is(v, -0) ? 0 : v));

describe('ForecastService', () => {
  it('Propiedad 7: round-trip — WeatherData conserva exactamente los valores de la API', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ temperature_2m: num, relative_humidity_2m: num, precipitation: num }),
        async (current) => {
          mockFetch(() => jsonResponse({ current }));
          const result = await getForecast(-16.4, -71.5);
          expect(result).toEqual({
            success: true,
            data: {
              temperature: current.temperature_2m,
              humidity: current.relative_humidity_2m,
              precipitation: current.precipitation,
            },
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Propiedad 10: si falta algún campo meteorológico → INCOMPLETE_DATA', async () => {
    const field = fc.oneof(num, fc.constant(null), fc.constant(undefined));
    await fc.assert(
      fc.asyncProperty(
        fc
          .record({ temperature_2m: field, relative_humidity_2m: field, precipitation: field })
          .filter((c) => Object.values(c).some((v) => v === null || v === undefined)),
        async (current) => {
          mockFetch(() => jsonResponse({ current }));
          const result = await getForecast(0, 0);
          expect(result).toEqual({ success: false, error: { type: 'INCOMPLETE_DATA' } });
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Propiedad 8: toda respuesta HTTP no-2xx genera SERVICE_ERROR con su código', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (status) => {
        mockFetch(() => emptyResponse(status));
        const result = await getForecast(0, 0);
        expect(result).toEqual({ success: false, error: { type: 'SERVICE_ERROR', statusCode: status } });
      }),
      { numRuns: 100 },
    );
  });

  it('Propiedad 9: una respuesta 2xx sin objeto current válido genera INVALID_RESPONSE', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('{json roto'),
          fc.constant(JSON.stringify({})),
          fc.constant(JSON.stringify({ current: null })),
          fc.constant(JSON.stringify({ current: 'texto' })),
        ),
        async (body) => {
          mockFetch(() => new Response(body, { status: 200 }));
          const result = await getForecast(0, 0);
          expect(result).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
        },
      ),
    );
  });

  it('error de red → NETWORK_ERROR', async () => {
    mockFetchError(new TypeError('Failed to fetch'));
    expect(await getForecast(0, 0)).toEqual({ success: false, error: { type: 'NETWORK_ERROR' } });
  });

  it('tiempo agotado → TIMEOUT', async () => {
    mockFetchError(new DOMException('aborted', 'AbortError'));
    expect(await getForecast(0, 0)).toEqual({ success: false, error: { type: 'TIMEOUT' } });
  });

  it('respuesta exitosa con los tres campos → WeatherData', async () => {
    mockFetch(() =>
      jsonResponse({ current: { temperature_2m: 17, relative_humidity_2m: 51, precipitation: 0 } }),
    );
    expect(await getForecast(-16.4, -71.5)).toEqual({
      success: true,
      data: { temperature: 17, humidity: 51, precipitation: 0 },
    });
  });
});
