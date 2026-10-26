/**
 * Pruebas de utils/formatters.ts (tarea 7.2 de tasks.md). Propiedad 11.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatHumidity, formatPrecipitation, formatTemperature } from '../utils/formatters';

const value = fc.double({ min: -1000, max: 1000, noNaN: true });

describe('formatters', () => {
  it('Propiedad 11: temperatura y precipitación con exactamente 1 decimal', () => {
    fc.assert(
      fc.property(value, (v) => {
        expect(formatTemperature(v)).toMatch(/^-?\d+\.\d °C$/);
        expect(formatPrecipitation(Math.abs(v))).toMatch(/^\d+\.\d mm$/);
      }),
      { numRuns: 100 },
    );
  });

  it('Propiedad 11: humedad como número entero sin punto decimal', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 100, noNaN: true }), (v) => {
        expect(formatHumidity(v)).toMatch(/^\d+ %$/);
      }),
      { numRuns: 100 },
    );
  });

  it('ejemplos concretos', () => {
    expect(formatTemperature(21.456)).toBe('21.5 °C');
    expect(formatHumidity(72.8)).toBe('73 %');
    expect(formatPrecipitation(0.04)).toBe('0.0 mm');
    expect(formatTemperature(17)).toBe('17.0 °C');
  });
});
