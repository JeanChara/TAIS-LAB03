/**
 * Prueba de humo para verificar la cadena de herramientas de testing.
 * Confirma que Vitest, fast-check y Testing Library están correctamente configurados.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('Configuración del proyecto', () => {
  it('Vitest está configurado correctamente', () => {
    expect(true).toBe(true);
  });

  it('fast-check está disponible y funciona', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return typeof n === 'number';
      }),
    );
  });

  it('el entorno jsdom está disponible', () => {
    const div = document.createElement('div');
    div.textContent = 'hola';
    expect(div.textContent).toBe('hola');
  });
});
