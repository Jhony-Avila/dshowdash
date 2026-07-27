import { createTelemetryPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-analytics/telemetry/logger";
const Ports = createTelemetryPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function Logger(options = {}) {
  options = options || {};
  this.prefix = options.prefix || "[analytics]";
  this.level = options.level || "info";
  this.enabled = options.enabled !== false;
  this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
  this._metrics = { debugCount: 0, infoCount: 0, warnCount: 0, errorCount: 0, lastLogAt: null };
  _initPorts();
}
Logger.prototype.debug = function(...args) {
  this._log("debug", Array.prototype.slice.call(args));
};
Logger.prototype.info = function(...args) {
  this._log("info", Array.prototype.slice.call(args));
};
Logger.prototype.warn = function(...args) {
  this._log("warn", Array.prototype.slice.call(args));
};
Logger.prototype.error = function(...args) {
  this._log("error", Array.prototype.slice.call(args));
};
Logger.prototype._log = function(level, args) {
  if (!this.enabled || this.levels[level] < this.levels[this.level]) return;
  const globalLogger = _getPort("logger");
  if (globalLogger) {
    const fn = globalLogger[level];
    if (typeof fn === "function") fn.apply(globalLogger, [this.prefix, ...args]);
  }
  this._metrics[`${level}Count`]++;
  this._metrics.lastLogAt = Date.now();
};
Logger.prototype.setLevel = function(level) {
  if (this.levels[level] !== void 0) this.level = level;
};
Logger.prototype.enable = function() {
  this.enabled = true;
};
Logger.prototype.disable = function() {
  this.enabled = false;
};
Logger.prototype.healthCheck = function() {
  const portsSnapshot = Ports.snapshot();
  const checks = { enabled: this.enabled, validLevel: this.levels[this.level] !== void 0, portsInitialized: portsSnapshot._initialized };
  let passed = 0;
  for (const k in checks) {
    if (checks[k]) passed++;
  }
  return { status: passed === 3 ? "healthy" : "degraded", checks, version: VERSION, moduleId: MODULE_ID };
};
Logger.prototype.info2 = function() {
  const portsSnapshot = Ports.snapshot();
  return { version: VERSION, moduleId: MODULE_ID, enabled: this.enabled, level: this.level, metrics: this._metrics, portsInitialized: portsSnapshot._initialized, healthCheck: this.healthCheck() };
};
Logger.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
var logger_default = Logger;
export {
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  getPorts,
  injectPorts
};
