/**
 * Pruebas de GeocodingService (tareas 4.2 a 4.5 de tasks.md).
 * Propiedades 4, 5, 8 y 9 de design.md + casos unitarios.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { geocode } from '../services/GeocodingService';
import { emptyResponse, jsonResponse, mockFetch, mockFetchError } from './helpers';

// JSON no distingue -0 de 0, por eso se normaliza -0 a 0 en los generadores.
const coord = (min: number, max: number) =>
  fc.double({ min, max, noNaN: true }).map((v) => (Object.is(v, -0) ? 0 : v));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GeocodingService', () => {
  it('Propiedad 4: extrae las coordenadas del primer resultado sin modificarlas', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          latitude: coord(-90, 90),
          longitude: coord(-180, 180),
          name: fc.string(),
        }),
        async (first) => {
          mockFetch(() => jsonResponse({ results: [first, { latitude: 0, longitude: 0, name: 'Otra' }] }));
          const result = await geocode('x');
          expect(result).toEqual({
            success: true,
            data: { latitude: first.latitude, longitude: first.longitude, cityName: first.name },
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Propiedad 5: latitud o longitud ausente o nula se trata como ciudad no encontrada', async () => {
    const missing = fc.constantFrom<number | null | undefined>(null, undefined);
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.record({ latitude: missing, longitude: fc.double({ noNaN: true }) }),
          fc.record({ latitude: fc.double({ noNaN: true }), longitude: missing }),
          fc.record({ latitude: missing, longitude: missing }),
        ),
        async (first) => {
          mockFetch(() => jsonResponse({ results: [{ name: 'X', ...first }] }));
          const result = await geocode('x');
          expect(result).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Propiedad 8: toda respuesta HTTP no-2xx genera SERVICE_ERROR con su código', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 300, max: 599 }), async (status) => {
        mockFetch(() => emptyResponse(status));
        const result = await geocode('Lima');
        expect(result).toEqual({ success: false, error: { type: 'SERVICE_ERROR', statusCode: status } });
      }),
      { numRuns: 100 },
    );
  });

  it('Propiedad 9: una respuesta 2xx con JSON inválido genera INVALID_RESPONSE', async () => {
    mockFetch(() => new Response('{esto no es json', { status: 200 }));
    expect(await geocode('Lima')).toEqual({ success: false, error: { type: 'INVALID_RESPONSE' } });
  });

  it('0 resultados → CITY_NOT_FOUND', async () => {
    mockFetch(() => jsonResponse({ results: [] }));
    expect(await geocode('Xyz999')).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
  });

  it('sin el campo results (respuesta real de Open-Meteo) → CITY_NOT_FOUND', async () => {
    mockFetch(() => jsonResponse({ generationtime_ms: 0.5 }));
    expect(await geocode('asdasdadasdas')).toEqual({ success: false, error: { type: 'CITY_NOT_FOUND' } });
  });

  it('error de red → NETWORK_ERROR', async () => {
    mockFetchError(new TypeError('Failed to fetch'));
    expect(await geocode('Lima')).toEqual({ success: false, error: { type: 'NETWORK_ERROR' } });
  });

  it('tiempo agotado (AbortError) → TIMEOUT', async () => {
    mockFetchError(new DOMException('aborted', 'AbortError'));
    expect(await geocode('Lima')).toEqual({ success: false, error: { type: 'TIMEOUT' } });
  });

  it('respuesta exitosa → Coordinates', async () => {
    mockFetch(() => jsonResponse({ results: [{ name: 'Arequipa', latitude: -16.39889, longitude: -71.535 }] }));
    expect(await geocode('Arequipa')).toEqual({
      success: true,
      data: { latitude: -16.39889, longitude: -71.535, cityName: 'Arequipa' },
    });
  });
});
