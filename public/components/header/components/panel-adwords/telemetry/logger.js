import { createUiPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "header.panel-adwords.telemetry.logger";
const VERSION = "8.4.0-ES6";
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
let _metrics = { logs: 0, warns: 0, errors: 0 };
function Logger(options) {
  if (!options) options = {};
  this.prefix = options.prefix || "[panel-adwords]";
  this.debug = options.debug || false;
}
Logger.prototype.info = function(...args) {
  if (!this.debug) return;
  _metrics.logs++;
  const L = _getPort("logger");
  if (L && L.info) L.info(...[this.prefix].concat(Array.prototype.slice.call(args)));
  else if (L && L.debug) L.debug(...[this.prefix].concat(Array.prototype.slice.call(args)));
};
Logger.prototype.warn = function(...args) {
  _metrics.warns++;
  const L = _getPort("logger");
  if (L && L.warn) L.warn(...[this.prefix].concat(Array.prototype.slice.call(args)));
};
Logger.prototype.error = function(...args) {
  _metrics.errors++;
  const L = _getPort("logger");
  if (L && L.error) L.error(...[this.prefix].concat(Array.prototype.slice.call(args)));
};
Logger.prototype.debug = function(...args) {
  if (!this.debug) return;
  _metrics.logs++;
  const L = _getPort("logger");
  if (L && L.debug) L.debug(...[this.prefix].concat(Array.prototype.slice.call(args)));
};
Logger.prototype.getMetrics = () => Object.assign({}, _metrics);
Logger.prototype.resetMetrics = () => {
  _metrics = { logs: 0, warns: 0, errors: 0 };
};
Logger.prototype.healthCheck = function() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { loggerReady: !!_getPort("logger"), portsInitialized: Ports.isInitialized() }, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized() };
};
function getMetrics() {
  return Object.assign({}, _metrics);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { loggerReady: !!_getPort("logger"), portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized() };
}
export {
  Logger,
  MODULE_ID,
  VERSION,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
