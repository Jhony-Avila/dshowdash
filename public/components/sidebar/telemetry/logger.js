import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.8.0-ES6";
const MODULE_ID = "sidebar-logger";
const PREFIX = "[sidebar]";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function SidebarLogger(options = {}) {
  this._debug = options.debug !== void 0 ? options.debug : false;
  this._prefix = options.prefix || PREFIX;
  this._metrics = { debug: 0, info: 0, warn: 0, error: 0, total: 0 };
  _initPorts();
}
SidebarLogger.prototype._getLogger = () => _getPort("logger");
SidebarLogger.prototype.setDebug = function(value) {
  this._debug = value;
};
SidebarLogger.prototype.debug = function(...args) {
  if (!this._debug) return;
  const logger = this._getLogger();
  if (logger && logger.debug) logger.debug(...[this._prefix].concat(Array.prototype.slice.call(args)));
  this._metrics.debug++;
  this._metrics.total++;
};
SidebarLogger.prototype.info = function(...args) {
  const logger = this._getLogger();
  if (logger && logger.info) logger.info(...[this._prefix].concat(Array.prototype.slice.call(args)));
  this._metrics.info++;
  this._metrics.total++;
};
SidebarLogger.prototype.warn = function(...args) {
  const logger = this._getLogger();
  if (logger && logger.warn) logger.warn(...[this._prefix].concat(Array.prototype.slice.call(args)));
  this._metrics.warn++;
  this._metrics.total++;
};
SidebarLogger.prototype.error = function(...args) {
  const logger = this._getLogger();
  if (logger && logger.error) logger.error(...[this._prefix].concat(Array.prototype.slice.call(args)));
  this._metrics.error++;
  this._metrics.total++;
};
SidebarLogger.prototype.log = function(...args) {
  const logger = this._getLogger();
  if (logger && logger.info) logger.info(...[this._prefix].concat(Array.prototype.slice.call(args)));
  this._metrics.total++;
};
SidebarLogger.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
SidebarLogger.prototype.reset = function() {
  this._metrics = { debug: 0, info: 0, warn: 0, error: 0, total: 0 };
};
SidebarLogger.prototype.healthCheck = function() {
  const hasLogger = !!this._getLogger();
  const checks = { hasLogger, debugModeSet: typeof this._debug === "boolean", prefixSet: !!this._prefix, metricsTracking: this._metrics.total >= 0, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  for (const k in checks) {
    if (checks[k]) passed++;
  }
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, debugEnabled: this._debug, metrics: this._metrics, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
SidebarLogger.prototype.getInfo = function() {
  return { moduleId: MODULE_ID, version: VERSION, debugEnabled: this._debug, prefix: this._prefix, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics() };
};
function createLogger(options) {
  return new SidebarLogger(options);
}
let _defaultInstance = null;
function getDefaultLogger() {
  if (!_defaultInstance) _defaultInstance = new SidebarLogger();
  return _defaultInstance;
}
function getMetrics() {
  return getDefaultLogger().getMetrics();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() };
}
function healthCheck() {
  return getDefaultLogger().healthCheck();
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
var logger_default = { VERSION, MODULE_ID, SidebarLogger, createLogger, getDefaultLogger, info, getMetrics, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  SidebarLogger,
  VERSION,
  createLogger,
  logger_default as default,
  getDefaultLogger,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
