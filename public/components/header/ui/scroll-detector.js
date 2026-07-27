import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.4.0-ES6";
const MODULE_ID = "header/ui/scroll-detector";
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
const _log = function(level, ...args) {
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
function ScrollDetector(config, elements, store, logger) {
  this.config = config;
  this.elements = elements;
  this.store = store;
  this.logger = logger;
  this.ticking = false;
  this._onScroll = this.onScroll.bind(this);
  this._debug = false;
  this._metrics = { mountCount: 0, scrollEvents: 0, stateChanges: 0, lastScrollAt: null };
  this._isMounted = false;
  this._isDestroyed = false;
}
ScrollDetector.prototype.mount = function() {
  if (this._isDestroyed) {
    _log("warn", "ScrollDetector destruido - mount ignorado");
    return;
  }
  if (this._isMounted) {
    _log("warn", "ScrollDetector ja montado");
    return;
  }
  this._metrics.mountCount++;
  window.addEventListener("scroll", this._onScroll, { passive: true });
  this.handleScroll();
  this._isMounted = true;
  _log("info", "Scroll detector montado");
};
ScrollDetector.prototype.onScroll = function() {
  const self = this;
  this._metrics.scrollEvents++;
  this._metrics.lastScrollAt = Date.now();
  if (!this.ticking) {
    window.requestAnimationFrame(() => {
      self.handleScroll();
      self.ticking = false;
    });
    this.ticking = true;
  }
};
ScrollDetector.prototype.handleScroll = function() {
  if (this._isDestroyed) return;
  const threshold = this.config && this.config.ui && this.config.ui.scrollThreshold || 50;
  const scrolled = window.scrollY > threshold;
  const state = this.store.getState();
  if (scrolled !== state.scrolled) {
    this._metrics.stateChanges++;
    this.store.setScrolled(scrolled);
    if (this.elements.header) this.elements.header.classList.toggle("scrolled", scrolled);
    _log("debug", "Scroll state changed:", scrolled);
  }
};
ScrollDetector.prototype.unmount = function() {
  if (!this._isMounted) {
    _log("warn", "ScrollDetector nao esta montado");
    return;
  }
  window.removeEventListener("scroll", this._onScroll);
  this._isMounted = false;
  _log("info", "Scroll detector desmontado");
};
ScrollDetector.prototype.getMetrics = function() {
  return { mountCount: this._metrics.mountCount, scrollEvents: this._metrics.scrollEvents, stateChanges: this._metrics.stateChanges, lastScrollAt: this._metrics.lastScrollAt, isMounted: this._isMounted, isDestroyed: this._isDestroyed };
};
ScrollDetector.prototype.resetMetrics = function() {
  this._metrics = { mountCount: 0, scrollEvents: 0, stateChanges: 0, lastScrollAt: null };
};
ScrollDetector.prototype.healthCheck = function() {
  const checks = { notDestroyed: !this._isDestroyed, hasConfig: !!this.config, hasStore: !!this.store, hasElements: !!this.elements };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter((e) => !e[1]).map((e) => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
ScrollDetector.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, isMounted: this._isMounted, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
};
ScrollDetector.prototype.setDebug = function(enabled) {
  this._debug = !!enabled;
};
ScrollDetector.prototype.destroy = function() {
  if (this._isMounted) this.unmount();
  this._isDestroyed = true;
};
function getVersion() {
  return VERSION;
}
var scroll_detector_default = ScrollDetector;
export {
  MODULE_ID,
  ScrollDetector,
  VERSION,
  scroll_detector_default as default,
  getPorts,
  getVersion,
  injectPorts
};
