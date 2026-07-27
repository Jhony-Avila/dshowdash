// =============================================================
// DEPENDENCY CONTRACT (v5.1.0-ENTERPRISE)
// =============================================================
// MODULE: header/components/weather-sp/utils/formatters
// PURPOSE: Weather data formatting utilities (temperature, humidity, wind)
// -------------------------------------------------------------
// PROVIDES:
//   Formatters.formatTemperature(temp)
//   Formatters.formatHumidity(humidity)
//   Formatters.formatWindSpeed(speed)
//   Formatters.getWeatherIcon(condition)
//   setDebug(enabled)
// =============================================================
// Weather SP - Formatters (Enterprise)
// @version 5.1.0-ENTERPRISE
// @changelog v5.1.0 - Removed console.* for enterprise compliance
'use strict';

export const VERSION = '5.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/weather-sp/utils/formatters';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
// @ts-expect-error strict migration — TS7005
function _log(level: string, ...args: unknown[]) { if (!_debug && level === 'debug') return; _logBuffer.push({ level, args, ts: Date.now() }); if (_logBuffer.length > 50) _logBuffer.shift(); }

export class Formatters { [key: string]: any;
  // @ts-expect-error TS migration - TS2345
  static formatTemperature(temp: unknown) { if (temp === null || temp === undefined) return '--°C'; return `${Math.round(temp)}°C`; }
  // @ts-expect-error TS migration - TS2345
  static formatHumidity(humidity: unknown) { if (humidity === null || humidity === undefined) return '--%'; return `${Math.round(humidity)}%`; }
  // @ts-expect-error TS migration - TS2345
  static formatWindSpeed(speed: unknown) { if (speed === null || speed === undefined) return '-- km/h'; return `${Math.round(speed)} km/h`; }
  static getWeatherIcon(condition: unknown) {
    const iconMap = { clear: '☀️', sunny: '☀️', cloudy: '☁️', partly_cloudy: '⛅', rain: '🌧️', storm: '⛈️', snow: '❄️', fog: '🌫️', default: '🌤️' };
    // @ts-expect-error TS migration - TS2339
    return (iconMap as Record<string,unknown>)[condition?.toLowerCase() as string] || iconMap.default;
  }
  static healthCheck() {
    const checks = { ready: true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
  }
  static info() { return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck() }; }
  // @ts-expect-error strict migration — TS7005
  static getLogs() { return [..._logBuffer]; }
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
export default Formatters;
