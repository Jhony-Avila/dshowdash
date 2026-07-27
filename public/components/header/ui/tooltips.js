import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.4.0-ES6";
const MODULE_ID = "header/ui/tooltips";
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug;
};
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn.apply(logger, [prefix].concat(args));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info.apply(logger, [prefix].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [prefix].concat(args));
};
function TooltipsManager(config, logger) {
  this.config = config;
  this.logger = logger;
  this._debug = false;
  this._metrics = { mountCount: 0, unmountCount: 0, lastMountAt: null };
  this._isMounted = false;
  this._isDestroyed = false;
}
TooltipsManager.prototype.mount = function() {
  if (this._isDestroyed) {
    _log("warn", "TooltipsManager destruido - mount ignorado");
    return;
  }
  if (this._isMounted) {
    _log("warn", "TooltipsManager ja montado");
    return;
  }
  this._metrics.mountCount++;
  this._metrics.lastMountAt = Date.now();
  this._isMounted = true;
  _log("info", "Tooltips manager montado");
};
TooltipsManager.prototype.unmount = function() {
  if (!this._isMounted) {
    _log("warn", "TooltipsManager nao esta montado");
    return;
  }
  this._metrics.unmountCount++;
  this._isMounted = false;
  _log("info", "Tooltips manager desmontado");
};
TooltipsManager.prototype.getMetrics = function() {
  return { mountCount: this._metrics.mountCount, unmountCount: this._metrics.unmountCount, lastMountAt: this._metrics.lastMountAt, isMounted: this._isMounted, isDestroyed: this._isDestroyed };
};
TooltipsManager.prototype.resetMetrics = function() {
  this._metrics = { mountCount: 0, unmountCount: 0, lastMountAt: null };
};
TooltipsManager.prototype.healthCheck = function() {
  const checks = { notDestroyed: !this._isDestroyed, hasConfig: !!this.config };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
TooltipsManager.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, isMounted: this._isMounted, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
};
TooltipsManager.prototype.setDebug = function(enabled) {
  this._debug = !!enabled;
};
TooltipsManager.prototype.destroy = function() {
  if (this._isMounted) this.unmount();
  this._isDestroyed = true;
};
function getVersion() {
  return VERSION;
}
var tooltips_default = TooltipsManager;
export {
  MODULE_ID,
  TooltipsManager,
  VERSION,
  tooltips_default as default,
  getPorts,
  getVersion,
  injectPorts
};
