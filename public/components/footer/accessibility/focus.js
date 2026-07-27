import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.5.0-P17WI";
const MODULE_ID = "footer-a11y-focus";
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
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const _metrics = { saves: 0, restores: 0 };
function FooterFocusManager() {
  this._lastFocused = null;
  this._trapActive = false;
  this._container = null;
}
FooterFocusManager.prototype.saveFocus = function() {
  _metrics.saves++;
  this._lastFocused = document.activeElement;
  _log("info", "Focus saved");
};
FooterFocusManager.prototype.restoreFocus = function() {
  if (this._lastFocused && typeof this._lastFocused.focus === "function") {
    try {
      _metrics.restores++;
      this._lastFocused.focus();
      _log("info", "Focus restored");
    } catch (e) {
      _log("warn", "Could not restore focus");
    }
  }
  this._lastFocused = null;
};
FooterFocusManager.prototype.setContainer = function(container) {
  this._container = container;
};
FooterFocusManager.prototype.focusFirst = function() {
  if (!this._container) return;
  const focusable = this._container.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable) focusable.focus();
};
FooterFocusManager.prototype.focusLast = function() {
  if (!this._container) return;
  const focusables = this._container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusables.length > 0) focusables[focusables.length - 1].focus();
};
FooterFocusManager.prototype.getMetrics = () => Object.assign({}, _metrics);
FooterFocusManager.prototype.info = function() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, hasContainer: !!this._container, hasSavedFocus: !!this._lastFocused, trapActive: this._trapActive, metrics: this.getMetrics(), portsInitialized: ps._initialized, timestamp: Date.now() };
};
FooterFocusManager.prototype.healthCheck = function() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { focusManagerReady: true, hasLogger: !!_getPort("logger"), portsInitialized: ps._initialized }, metrics: this.getMetrics() };
};
const focusManager = new FooterFocusManager();
function getMetrics() {
  return focusManager.getMetrics();
}
function info() {
  return focusManager.info();
}
function healthCheck() {
  return focusManager.healthCheck();
}
var focus_default = focusManager;
export {
  MODULE_ID,
  VERSION,
  focus_default as default,
  focusManager,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
