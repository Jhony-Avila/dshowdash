import { createTelemetryPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-datahub/telemetry/logger";
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
class Logger {
  constructor(options = {}) {
    this.prefix = options.prefix || "[datahub]";
    this.level = options.level || "info";
    this.enabled = options.enabled !== false;
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
    this._metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0, lastLogAt: null };
    _initPorts();
  }
  debug(...args) {
    this._log("debug", args);
  }
  info(...args) {
    this._log("info", args);
  }
  warn(...args) {
    this._log("warn", args);
  }
  error(...args) {
    this._log("error", args);
  }
  _log(level, args) {
    if (!this.enabled || this.levels[level] < this.levels[this.level]) return;
    const globalLogger = _getPort("logger");
    globalLogger?.[level]?.(this.prefix, ...args);
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
    const ps = Ports.snapshot();
    const checks = { enabled: this.enabled, validLevel: this.levels[this.level] !== void 0, portsInitialized: ps._initialized };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? "HEALTHY" : "DEGRADED", checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
  info2() {
    return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, level: this.level, portsInitialized: Ports.snapshot()._initialized, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
}
function getVersion() {
  return VERSION;
}
export {
  Logger,
  MODULE_ID,
  VERSION,
  Logger as default,
  getPorts,
  getVersion,
  injectPorts
};
