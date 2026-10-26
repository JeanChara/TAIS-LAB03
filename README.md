# Pronóstico del Clima — Weather Forecast App

Aplicación web de una sola página (SPA) que muestra el clima actual de cualquier ciudad. El usuario escribe el nombre de la ciudad y la aplicación muestra la **temperatura (°C)**, la **humedad relativa (%)** y la **precipitación (mm)**.

Proyecto desarrollado para el curso **Tópicos Avanzados en Ingeniería de Software** (UNSA), Práctica 03: *Spec-Driven Development (SDD)*. El código fue generado con **Kiro** a partir de las especificaciones de `.kiro/specs/`.

## ¿Cómo funciona?

La aplicación no tiene servidor propio: todo se ejecuta en el navegador y usa dos APIs públicas y gratuitas de [Open-Meteo](https://open-meteo.com/):

1. **Geocoding API**: convierte el nombre de la ciudad en coordenadas (latitud y longitud).
2. **Forecast API**: con esas coordenadas, obtiene el clima actual.

Si la ciudad no existe, si no hay conexión o si el servicio tarda más de 10 segundos, la aplicación muestra un mensaje de error claro y permite volver a intentarlo.

## Tecnologías

- **TypeScript** (vanilla, sin frameworks) + **Vite**
- **Vitest** + **jsdom** para pruebas unitarias y de integración
- **fast-check** para pruebas basadas en propiedades

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior (incluye npm)
- [Git](https://git-scm.com/) para clonar el repositorio

## Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/JeanChara/TAIS-LAB03.git
cd TAIS-LAB03

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run dev
```

Luego abre en el navegador la dirección que aparece en la terminal (por defecto http://localhost:5173).

### Otros comandos

| Comando | Descripción |
|---|---|
| `npm test` | Ejecuta la suite de pruebas (7 archivos, 45 pruebas) |
| `npm run build` | Verifica los tipos y genera la versión de producción en `dist/` |
| `npm run preview` | Sirve localmente la versión generada con `build` |

> **Windows:** si PowerShell muestra el error *"la ejecución de scripts está deshabilitada"*, ejecuta una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` o usa la terminal **Símbolo del sistema (cmd)**.

## Estructura del proyecto

```
├── .kiro/specs/             # Especificaciones usadas por Kiro
│   ├── requirements.md      #   Qué debe hacer la aplicación
│   ├── design.md            #   Arquitectura y propiedades de corrección
│   └── tasks.md             #   Plan de implementación
├── index.html               # Página principal
└── src/
    ├── main.ts              # Punto de entrada: conecta todas las capas
    ├── WeatherController.ts # Orquesta la búsqueda (capa de aplicación)
    ├── components/          # Interfaz: formulario, resultados, carga y errores
    ├── services/            # Validan y transforman las respuestas de la API
    ├── clients/             # Peticiones HTTP a Open-Meteo (timeout de 10 s)
    ├── utils/formatters.ts  # Formato de temperatura, humedad y precipitación
    ├── types/               # Tipos de datos compartidos
    └── __tests__/           # Pruebas unitarias, de propiedades e integración
```

## Pruebas

La suite verifica las **13 propiedades de corrección** definidas en `design.md`, el manejo de errores (red, timeout, HTTP no-2xx, datos incompletos) y un flujo completo de búsqueda con las APIs simuladas.

- `src/setup.test.ts`: verificación del entorno, generada por Kiro.
- `src/__tests__/`: pruebas de las tareas opcionales de `tasks.md`, generadas con un segundo asistente de IA (Claude), ya que Kiro no las ejecutó por límite de créditos.