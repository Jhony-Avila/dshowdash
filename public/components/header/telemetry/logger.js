import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.6.0-ES6";
const MODULE_ID = "header/telemetry/logger";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
function Logger(config) {
  config = config || {};
  this.config = { prefix: config.prefix || "[Header]", enabled: config.debug || false, level: config.level || "info", instanceId: config.instanceId || "logger-default" };
  this._metrics = { totalLogs: 0, debugLogs: 0, infoLogs: 0, warnLogs: 0, errorLogs: 0, lastLogAt: null };
  this.history = [];
  this.maxHistorySize = 100;
  this.isDestroyed = false;
}
Logger.prototype.debug = function() {
  if (this.isDestroyed) return;
  const logger = _getPort("logger");
  if (logger && logger.debug) logger.debug(Array.prototype.slice.call(arguments).join(" "));
  this._track("debug");
};
Logger.prototype.info = function() {
  if (this.isDestroyed) return;
  const logger = _getPort("logger");
  if (logger && logger.info) logger.info(Array.prototype.slice.call(arguments).join(" "));
  this._track("info");
};
Logger.prototype.warn = function() {
  if (this.isDestroyed) return;
  const logger = _getPort("logger");
  if (logger && logger.warn) logger.warn(Array.prototype.slice.call(arguments).join(" "));
  this._track("warn");
};
Logger.prototype.error = function() {
  if (this.isDestroyed) return;
  const logger = _getPort("logger");
  if (logger && logger.error) logger.error(Array.prototype.slice.call(arguments).join(" "));
  this._track("error");
};
Logger.prototype.log = function(level) {
  const method = this[level];
  if (typeof method === "function") method.apply(this, Array.prototype.slice.call(arguments, 1));
};
Logger.prototype._track = function(level) {
  this._metrics.totalLogs++;
  this._metrics[`${level}Logs`]++;
  this._metrics.lastLogAt = Date.now();
  this.history.push({ level, timestamp: Date.now() });
  if (this.history.length > this.maxHistorySize) this.history.shift();
};
Logger.prototype.getMetrics = function() {
  return { totalLogs: this._metrics.totalLogs, debugLogs: this._metrics.debugLogs, infoLogs: this._metrics.infoLogs, warnLogs: this._metrics.warnLogs, errorLogs: this._metrics.errorLogs, lastLogAt: this._metrics.lastLogAt, historySize: this.history.length, isDestroyed: this.isDestroyed };
};
Logger.prototype.getHistory = function(limit) {
  return limit ? this.history.slice(-limit) : this.history.slice();
};
Logger.prototype.setLevel = function(level) {
  this.config.level = level;
  return true;
};
Logger.prototype.setEnabled = function(enabled) {
  this.config.enabled = !!enabled;
};
Logger.prototype.setDebug = function(enabled) {
  this.config.enabled = !!enabled;
};
Logger.prototype.clearHistory = function() {
  this.history = [];
};
Logger.prototype.resetMetrics = function() {
  this._metrics = { totalLogs: 0, debugLogs: 0, infoLogs: 0, warnLogs: 0, errorLogs: 0, lastLogAt: null };
};
Logger.prototype.healthCheck = function() {
  const globalLogger = _getPort("logger");
  const checks = { notDestroyed: !this.isDestroyed, globalLoggerReady: globalLogger && globalLogger.isReady && globalLogger.isReady() || !!globalLogger, hasLogger: !!globalLogger };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
Logger.prototype.getInfo = function() {
  return { version: VERSION, moduleId: MODULE_ID, instanceId: this.config.instanceId, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
};
Logger.prototype.getVersion = () => VERSION;
Logger.prototype.destroy = function() {
  if (this.isDestroyed) return;
  this.history = [];
  this.isDestroyed = true;
};
function getVersion() {
  return VERSION;
}
var logger_default = Logger;
export {
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  getPorts,
  getVersion,
  injectPorts
};
