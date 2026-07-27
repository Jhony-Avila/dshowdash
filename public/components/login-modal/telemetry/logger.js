import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "login-modal-logger";
const VERSION = "5.7.1-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const LOG_LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
function Logger(config = {}) {
  this.logLevel = this._parseLogLevel(config.logLevel || "info");
  this.silent = config.silent || false;
  this.traceId = this._generateTraceId();
  this.context = config.context || {};
  this._metrics = { logs: 0, errors: 0 };
  _initPorts();
}
Logger.prototype._getLogger = () => _getPort("logger");
Logger.prototype._generateTraceId = () => `login-modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
Logger.prototype._parseLogLevel = (level) => {
  const upper = level.toUpperCase();
  return LOG_LEVELS[upper] !== void 0 ? LOG_LEVELS[upper] : LOG_LEVELS.INFO;
};
Logger.prototype.log = function(level, message, data, options) {
  const levelValue = LOG_LEVELS[level.toUpperCase()];
  if (levelValue > this.logLevel) return null;
  if (this.silent && level !== "error") return null;
  this._metrics.logs++;
  if (level === "error") this._metrics.errors++;
  const logger = this._getLogger();
  if (!logger) return { level, message, data };
  const ctx = { ...this.context, traceId: this.traceId, data };
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.call(logger, "[login-modal]", message, ctx);
  return { level, message, data };
};
Logger.prototype.error = function(message, data, options) {
  return this.log("error", message, data, options);
};
Logger.prototype.warn = function(message, data, options) {
  return this.log("warn", message, data, options);
};
Logger.prototype.info = function(message, data, options) {
  return this.log("info", message, data, options);
};
Logger.prototype.debug = function(message, data, options) {
  return this.log("debug", message, data, options);
};
Logger.prototype.getTraceId = function() {
  return this.traceId;
};
Logger.prototype.renewTraceId = function() {
  this.traceId = this._generateTraceId();
  return this.traceId;
};
Logger.prototype.setContext = function(key, value) {
  this.context[key] = value;
};
Logger.prototype.clearContext = function() {
  this.context = {};
};
Logger.prototype.setLogLevel = function(level) {
  this.logLevel = this._parseLogLevel(level);
};
Logger.prototype.setSilent = function(silent) {
  this.silent = silent;
};
Logger.prototype.info_module = function() {
  return { moduleId: MODULE_ID, version: VERSION, logLevel: this.logLevel, silent: this.silent, traceId: this.traceId, portsInitialized: Ports.isInitialized(), metrics: { ...this._metrics }, timestamp: Date.now() };
};
Logger.prototype.healthCheck = function() {
  const hasLogger = !!this._getLogger();
  const checks = { hasLogger, hasTraceId: !!this.traceId, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() });
const healthCheck = () => {
  const logger = _getPort("logger");
  const checks = { moduleLoaded: true, loggerClass: typeof Logger === "function", loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
var logger_default = Logger;
export {
  LOG_LEVELS,
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
