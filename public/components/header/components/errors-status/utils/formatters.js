const VERSION = "5.1.0-ENTERPRISE";
const MODULE_ID = "header/components/errors-status/utils/formatters";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class Formatters {
  static formatErrorCount(count) {
    if (count === null || count === void 0) return "--";
    if (count === 0) return "\u2713";
    return count > 99 ? "99+" : String(count);
  }
  static formatTimestamp(ts) {
    if (!ts) return "--";
    return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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
