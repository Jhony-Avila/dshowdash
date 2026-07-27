import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.7.0-P2-ENTERPRISE";
const MODULE_ID = "ticker.telemetry.logger";
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
function Logger(options = {}) {
  this.debug = options.debug || false;
  this.prefix = options.prefix || "[Ticker]";
  this._metrics = { infoCount: 0, warnCount: 0, errorCount: 0, debugCount: 0, lastLogAt: null };
  _initPorts();
}
Logger.prototype._getLogger = () => _getPort("logger");
Logger.prototype.info = function() {
  if (!this.debug) return;
  const logger = this._getLogger();
  if (logger && logger.info) logger.info.apply(logger, [this.prefix].concat(Array.prototype.slice.call(arguments)));
  this._metrics.infoCount++;
  this._metrics.lastLogAt = Date.now();
};
Logger.prototype.log = function() {
  if (!this.debug) return;
  const logger = this._getLogger();
  if (logger && logger.debug) logger.debug.apply(logger, [this.prefix].concat(Array.prototype.slice.call(arguments)));
  this._metrics.debugCount++;
  this._metrics.lastLogAt = Date.now();
};
Logger.prototype.warn = function() {
  const logger = this._getLogger();
  if (logger && logger.warn) logger.warn.apply(logger, [this.prefix].concat(Array.prototype.slice.call(arguments)));
  this._metrics.warnCount++;
  this._metrics.lastLogAt = Date.now();
};
Logger.prototype.error = function() {
  const logger = this._getLogger();
  if (logger && logger.error) logger.error.apply(logger, [this.prefix].concat(Array.prototype.slice.call(arguments)));
  this._metrics.errorCount++;
  this._metrics.lastLogAt = Date.now();
};
Logger.prototype.healthCheck = function() {
  const logger = this._getLogger();
  const checks = { ready: true, hasLogger: !!logger, loggerReady: !!(logger && logger.isReady ? logger.isReady() : logger), portsInitialized: Ports.isInitialized() };
  let passed = 0;
  for (const k in checks) {
    if (checks[k]) passed++;
  }
  return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
Logger.prototype.getInfo = function() {
  return { version: VERSION, moduleId: MODULE_ID, debugEnabled: this.debug, prefix: this.prefix, metrics: Object.assign({}, this._metrics), portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() };
};
Logger.prototype.setDebug = function(enabled) {
  this.debug = !!enabled;
};
Logger.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
Logger.prototype.resetMetrics = function() {
  this._metrics = { infoCount: 0, warnCount: 0, errorCount: 0, debugCount: 0, lastLogAt: null };
};
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { moduleLoaded: true, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  for (const k in checks) {
    if (checks[k]) passed++;
  }
  return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}
var logger_default = Logger;
export {
  Logger,
  MODULE_ID,
  VERSION,
  logger_default as default,
  getPorts,
  getVersion,
  healthCheck,
  info,
  injectPorts
};
