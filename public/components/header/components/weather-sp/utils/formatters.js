const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/weather-sp/utils/formatters";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class Formatters {
  // @ts-expect-error TS migration - TS2345
  static formatTemperature(temp) {
    if (temp === null || temp === void 0) return "--\xB0C";
    return `${Math.round(temp)}\xB0C`;
  }
  // @ts-expect-error TS migration - TS2345
  static formatHumidity(humidity) {
    if (humidity === null || humidity === void 0) return "--%";
    return `${Math.round(humidity)}%`;
  }
  // @ts-expect-error TS migration - TS2345
  static formatWindSpeed(speed) {
    if (speed === null || speed === void 0) return "-- km/h";
    return `${Math.round(speed)} km/h`;
  }
  static getWeatherIcon(condition) {
    const iconMap = { clear: "\u2600\uFE0F", sunny: "\u2600\uFE0F", cloudy: "\u2601\uFE0F", partly_cloudy: "\u26C5", rain: "\u{1F327}\uFE0F", storm: "\u26C8\uFE0F", snow: "\u2744\uFE0F", fog: "\u{1F32B}\uFE0F", default: "\u{1F324}\uFE0F" };
    return iconMap[condition?.toLowerCase()] || iconMap.default;
  }
  static healthCheck() {
    const checks = { ready: true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 1 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 1, scoreDisplay: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  static info() {
    return { version: VERSION, moduleId: MODULE_ID, healthCheck: this.healthCheck() };
  }
  // @ts-expect-error strict migration — TS7005
  static getLogs() {
    return [..._logBuffer];
  }
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
var formatters_default = Formatters;
export {
  Formatters,
  MODULE_ID,
  VERSION,
  formatters_default as default,
  getLogs,
  setDebug
};
