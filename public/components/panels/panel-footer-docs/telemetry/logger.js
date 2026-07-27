const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-footer-docs/telemetry/logger";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
class Logger {
  constructor(options = {}) {
    this.prefix = options.prefix || "[panel]";
    this.level = options.level || "info";
    this.enabled = options.enabled !== false;
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this._metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0, lastLogAt: null };
  }
  debug(...args) {
    this._logMsg("debug", ...args);
  }
  info(...args) {
    this._logMsg("info", ...args);
  }
  warn(...args) {
    this._logMsg("warn", ...args);
  }
  error(...args) {
    this._logMsg("error", ...args);
  }
  _logMsg(level, ...args) {
    if (!this.enabled || this.levels[level] < this.levels[this.level]) return;
    _log(level, this.prefix, ...args);
    this._metrics[`${level}Count`]++;
    this._metrics.lastLogAt = Date.now();
  }
  setLevel(level) {
    if (this.levels[level] !== void 0) this.level = level;
  }
  enable() {
    this.enabled = true;
  }
  disable() {
    this.enabled = false;
  }
  healthCheck() {
    const checks = { enabled: this.enabled, validLevel: this.levels[this.level] !== void 0 };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info2() {
    return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, level: this.level, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    _debug = !!enabled;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0, lastLogAt: null };
  }
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
var logger_default = Logger;
export {
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  getLogs,
  getVersion,
  setDebug
};
