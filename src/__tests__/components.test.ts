/**
 * Pruebas de los componentes de UI (tareas 8.2, 8.3, 8.4 y 8.6 de tasks.md).
 * Propiedades 1, 2 y 12 de design.md + casos unitarios.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { CitySearchForm } from '../components/CitySearchForm';
import { WeatherDisplay } from '../components/WeatherDisplay';
import { ErrorMessage } from '../components/ErrorMessage';
import { createLoadingIndicator } from '../components/LoadingIndicator';
import { formatHumidity, formatPrecipitation, formatTemperature } from '../utils/formatters';

function setupForm() {
  document.body.innerHTML = '';
  const onSearch = vi.fn((_city: string) => undefined);
  const form = new CitySearchForm({ onSearch });
  document.body.appendChild(form.getElement());
  const input = document.querySelector<HTMLInputElement>('#city-input')!;
  const button = document.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const message = document.querySelector<HTMLElement>('#city-input-error')!;
  return { onSearch, input, button, message };
}

const WHITESPACE = [' ', '\t', '\n', '\r'];

describe('CitySearchForm', () => {
  it('Propiedad 1: rechaza entradas vacías o de solo espacios y muestra el mensaje', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...WHITESPACE), { maxLength: 20 }).map((a) => a.join('')),
        (text) => {
          const { onSearch, input, button, message } = setupForm();
          input.value = text;
          button.click();
          expect(onSearch).not.toHaveBeenCalled();
          expect(message.hidden).toBe(false);
          expect(message.textContent).toBe('El nombre de la ciudad es obligatorio.');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Propiedad 2: envía el nombre recortado (trim)', () => {
    const ws = fc.array(fc.constantFrom(...WHITESPACE), { maxLength: 5 }).map((a) => a.join(''));
    fc.assert(
      fc.property(ws, fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0), ws,
        (left, core, right) => {
          const { onSearch, input, button } = setupForm();
          input.value = left + core + right;
          button.click();
          expect(onSearch).toHaveBeenCalledTimes(1);
          expect(onSearch).toHaveBeenCalledWith((left + core + right).trim());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('el campo tiene un máximo de 100 caracteres', () => {
    const { input } = setupForm();
    expect(input.maxLength).toBe(100);
  });

  it('busca al presionar Enter con el campo enfocado', () => {
    const { onSearch, input } = setupForm();
    input.value = 'Arequipa';
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('Arequipa');
  });

  it('oculta el mensaje de validación tras una búsqueda válida', () => {
    const { input, button, message } = setupForm();
    input.value = '   ';
    button.click();
    input.value = 'Lima';
    button.click();
    expect(message.hidden).toBe(true);
  });
});

describe('WeatherDisplay', () => {
  let container: HTMLElement;
  beforeEach(() => {
    document.body.innerHTML = '<div id="w"></div>';
    container = document.getElementById('w')!;
  });

  it('Propiedad 12: muestra ciudad y los tres valores con sus unidades', () => {
    const v = fc.double({ min: -100, max: 100, noNaN: true });
    fc.assert(
      fc.property(fc.string({ minLength: 1 }).filter((s) => s.trim() !== ''), v, fc.double({ min: 0, max: 100, noNaN: true }), fc.double({ min: 0, max: 500, noNaN: true }),
        (city, temperature, humidity, precipitation) => {
          const display = new WeatherDisplay(container);
          display.render({ temperature, humidity, precipitation }, city, 'entrada');
          const text = container.textContent ?? '';
          expect(container.querySelector('.weather-display__city')?.textContent).toBe(city);
          expect(text).toContain(formatTemperature(temperature));
          expect(text).toContain(formatHumidity(humidity));
          expect(text).toContain(formatPrecipitation(precipitation));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('usa el nombre ingresado si la API no devuelve nombre (req. 4.7)', () => {
    new WeatherDisplay(container).render({ temperature: 1, humidity: 2, precipitation: 3 }, '', 'Cusco');
    expect(container.querySelector('.weather-display__city')?.textContent).toBe('Cusco');
  });

  it('escapa HTML en el nombre de la ciudad (sin inyección de etiquetas)', () => {
    new WeatherDisplay(container).render({ temperature: 1, humidity: 2, precipitation: 3 }, '<img src=x onerror=alert(1)>', 'x');
    expect(container.querySelector('img')).toBeNull();
  });

  it('clear() vacía el contenido', () => {
    const d = new WeatherDisplay(container);
    d.render({ temperature: 1, humidity: 2, precipitation: 3 }, 'Lima', 'Lima');
    d.clear();
    expect(container.innerHTML).toBe('');
  });
});

describe('ErrorMessage y LoadingIndicator', () => {
  it('ErrorMessage muestra y limpia el mensaje', () => {
    const el = document.createElement('div');
    const e = new ErrorMessage(el);
    e.show('Error de prueba');
    expect(el.hidden).toBe(false);
    expect(el.textContent).toBe('Error de prueba');
    e.clear();
    expect(el.hidden).toBe(true);
  });

  it('LoadingIndicator alterna su visibilidad', () => {
    const el = document.createElement('div');
    const l = createLoadingIndicator(el);
    const indicator = el.firstElementChild as HTMLElement;
    expect(indicator.getAttribute('aria-hidden')).toBe('true');
    l.show();
    expect(indicator.getAttribute('aria-hidden')).toBe('false');
    l.hide();
    expect(indicator.getAttribute('aria-hidden')).toBe('true');
  });
});
