const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "footer/components/status-lang/utils/formatters";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class Formatters {
  // @ts-expect-error TS migration - TS2339
  static formatLanguageCode(code) {
    const labels = { "pt-BR": "PT", "en-US": "EN", "es-ES": "ES", "zh-CN": "ZH" };
    return labels[code] || code.substring(0, 2).toUpperCase();
  }
  static formatLanguageName(code) {
    const names = { "pt-BR": "Portugu\xEAs", "en-US": "English", "es-ES": "Espa\xF1ol", "zh-CN": "\u4E2D\u6587" };
    return names[code] || code;
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
function getVersion() {
  return VERSION;
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
  getVersion,
  setDebug
};
