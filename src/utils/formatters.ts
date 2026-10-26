/**
 * Utility functions for formatting weather data values into display strings.
 */

/**
 * Formats a temperature value for display.
 * @param value - Temperature in °C.
 * @returns String with one decimal place and the °C unit, e.g. "21.3 °C".
 */
export function formatTemperature(value: number): string {
  return value.toFixed(1) + ' °C';
}

/**
 * Formats a humidity value for display.
 * @param value - Relative humidity in %.
 * @returns Rounded integer string with the % unit, e.g. "65 %".
 */
export function formatHumidity(value: number): string {
  return Math.round(value) + ' %';
}

/**
 * Formats a precipitation value for display.
 * @param value - Precipitation in mm.
 * @returns String with one decimal place and the mm unit, e.g. "1.4 mm".
 */
export function formatPrecipitation(value: number): string {
  return value.toFixed(1) + ' mm';
}
