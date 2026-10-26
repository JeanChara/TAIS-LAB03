/**
 * Punto de entrada principal de la aplicación weather-forecast-app.
 *
 * Responsabilidades (Tarea 11.1):
 *  - Construir la estructura DOM dentro de #app.
 *  - Instanciar los componentes UI (CitySearchForm, WeatherDisplay,
 *    ErrorMessage, LoadingIndicator) pasándoles sus contenedores DOM.
 *  - Instanciar WeatherController inyectando los componentes como dependencias.
 *  - Registrar el callback onSearch de CitySearchForm hacia WeatherController.
 *
 * Los clientes HTTP (GeocodingClient, ForecastClient) y los servicios
 * (GeocodingService, ForecastService) son usados directamente por
 * WeatherController a través de sus valores por defecto; no necesitan
 * instanciarse aquí.
 *
 * Requirements: 1.1, 1.2, 4.5
 */

import { CitySearchForm } from './components/CitySearchForm';
import { WeatherDisplay } from './components/WeatherDisplay';
import { ErrorMessage } from './components/ErrorMessage';
import { createLoadingIndicator } from './components/LoadingIndicator';
import { WeatherController } from './WeatherController';

// ---------------------------------------------------------------------------
// 1. Raíz de la aplicación
// ---------------------------------------------------------------------------

const appRoot = document.querySelector<HTMLDivElement>('#app');
if (!appRoot) {
  throw new Error('No se encontró el elemento raíz #app en el DOM.');
}

// ---------------------------------------------------------------------------
// 2. Construir la estructura DOM semántica dentro de #app
//    (completada en detalle en la Tarea 11.2; aquí se crean los contenedores
//    mínimos necesarios para conectar las capas)
// ---------------------------------------------------------------------------

// — Encabezado ——————————————————————————————————————————————————————————————
const header = document.createElement('header');
header.className = 'app-header';

const title = document.createElement('h1');
title.className = 'app-header__title';
title.textContent = 'Pronóstico del Tiempo';
header.appendChild(title);

// — Sección principal ———————————————————————————————————————————————————————
const main = document.createElement('main');
main.className = 'app-main';

// Zona del formulario de búsqueda
const searchZone = document.createElement('section');
searchZone.className = 'app-main__search';
searchZone.setAttribute('aria-label', 'Búsqueda de ciudad');

// Zona del indicador de carga
const loadingZone = document.createElement('div');
loadingZone.id = 'loading-zone';
loadingZone.className = 'app-main__loading';

// Zona de mensajes de error
const errorZone = document.createElement('div');
errorZone.id = 'error-zone';
errorZone.className = 'app-main__error';

// Zona de display del clima
const weatherZone = document.createElement('div');
weatherZone.id = 'weather-zone';
weatherZone.className = 'app-main__weather';

main.appendChild(searchZone);
main.appendChild(loadingZone);
main.appendChild(errorZone);
main.appendChild(weatherZone);

appRoot.appendChild(header);
appRoot.appendChild(main);

// ---------------------------------------------------------------------------
// 3. Instanciar los componentes UI
// ---------------------------------------------------------------------------

// WeatherDisplay recibe su contenedor en el constructor.
const weatherDisplay = new WeatherDisplay(weatherZone);

// ErrorMessage recibe su contenedor en el constructor.
const errorMessage = new ErrorMessage(errorZone);

// LoadingIndicator: fábrica que crea y monta el indicador en loadingZone.
const loadingIndicator = createLoadingIndicator(loadingZone);

// ---------------------------------------------------------------------------
// 4. Instanciar WeatherController antes de crear CitySearchForm,
//    para poder pasar getSearchHandler() como callback.
// ---------------------------------------------------------------------------

// CitySearchForm se instancia temporalmente después del controlador;
// usamos un marcador de posición para el onSearch y lo resolvemos a continuación.

const controller = new WeatherController({
  searchForm: {
    // El método enable() se delegará a la instancia real de CitySearchForm.
    // Se asigna después de crearla para evitar la dependencia circular.
    enable: () => searchForm.enable(),
  },
  weatherDisplay,
  errorMessage,
  loadingIndicator,
});

// ---------------------------------------------------------------------------
// 5. Instanciar CitySearchForm y registrar el callback hacia el controlador
// ---------------------------------------------------------------------------

const searchForm = new CitySearchForm({
  onSearch: controller.getSearchHandler(),
});

// Montar el formulario en la zona de búsqueda del DOM.
searchZone.appendChild(searchForm.getElement());
