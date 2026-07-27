import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { DOMHelpers } from "../utils/dom.js";
const VERSION = "2.4.0-ES6";
const MODULE_ID = "header.accessibility.roving-tabindex";
const hasWindow = typeof window !== "undefined";
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
function RovingTabindex(config, elements, logger) {
  this.config = config;
  this.elements = elements;
  this.logger = logger;
  this.resizeObserver = null;
  this.mutationObserver = null;
  this._onKeyDown = this.onKeyDown.bind(this);
  this._onResize = DOMHelpers.debounce(this.update.bind(this), 200);
  this._debug = false;
  this._metrics = { mountCount: 0, keyEvents: 0, updates: 0, lastKeyAt: null };
  this._isMounted = false;
  this._isDestroyed = false;
}
RovingTabindex.prototype.mount = function() {
  const self = this;
  if (self._isDestroyed) {
    _log("debug", "RovingTabindex destruido - mount ignorado");
    return;
  }
  if (self._isMounted) {
    _log("debug", "RovingTabindex ja montado");
    return;
  }
  if (!self.config || !self.config.accessibility || !self.config.accessibility.rovingTabindexEnabled) {
    _log("debug", "RovingTabindex desabilitado via config");
    return;
  }
  const tray = self.elements && self.elements.statusTray;
  if (!tray) {
    _log("debug", "Status tray nao encontrado - roving tabindex desabilitado");
    return;
  }
  self._metrics.mountCount++;
  self.update();
  tray.addEventListener("keydown", self._onKeyDown);
  if (hasWindow && window.ResizeObserver) {
    self.resizeObserver = new ResizeObserver(self._onResize);
    self.resizeObserver.observe(tray);
  }
  if (hasWindow && window.MutationObserver) {
    self.mutationObserver = new MutationObserver(() => {
      self.update();
    });
    self.mutationObserver.observe(tray, { attributes: true, subtree: true, attributeFilter: ["class", "style", "data-status"] });
  }
  self._isMounted = true;
  _log("info", "Roving tabindex montado");
};
RovingTabindex.prototype.onKeyDown = function(e) {
  const current = document.activeElement;
  if (!current || !current.classList || !current.classList.contains("status-icon")) return;
  this._metrics.keyEvents++;
  this._metrics.lastKeyAt = Date.now();
  const icons = this.getVisibleIcons();
  const currentIndex = icons.indexOf(current);
  let nextIndex;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    nextIndex = (currentIndex + 1) % icons.length;
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    nextIndex = (currentIndex - 1 + icons.length) % icons.length;
  } else if (e.key === "Home") {
    e.preventDefault();
    nextIndex = 0;
  } else if (e.key === "End") {
    e.preventDefault();
    nextIndex = icons.length - 1;
  } else return;
  if (icons[currentIndex]) icons[currentIndex].setAttribute("tabindex", "-1");
  if (icons[nextIndex]) {
    icons[nextIndex].setAttribute("tabindex", "0");
    icons[nextIndex].focus();
  }
};
RovingTabindex.prototype.update = function() {
  if (this._isDestroyed) return;
  this._metrics.updates++;
  const icons = this.getVisibleIcons();
  for (let i = 0; i < icons.length; i++) {
    icons[i].setAttribute("tabindex", i === 0 ? "0" : "-1");
  }
};
RovingTabindex.prototype.getVisibleIcons = function() {
  const tray = this.elements && this.elements.statusTray;
  if (!tray) return [];
  return DOMHelpers.getVisibleElements(tray, ".status-icon");
};
RovingTabindex.prototype.unmount = function() {
  if (!this._isMounted) {
    _log("debug", "RovingTabindex nao esta montado");
    return;
  }
  const tray = this.elements && this.elements.statusTray;
  if (tray) tray.removeEventListener("keydown", this._onKeyDown);
  if (this.resizeObserver) {
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
  }
  if (this.mutationObserver) {
    this.mutationObserver.disconnect();
    this.mutationObserver = null;
  }
  this._isMounted = false;
  _log("debug", "Roving tabindex desmontado");
};
RovingTabindex.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics, { isMounted: this._isMounted, isDestroyed: this._isDestroyed });
};
RovingTabindex.prototype.resetMetrics = function() {
  this._metrics = { mountCount: 0, keyEvents: 0, updates: 0, lastKeyAt: null };
};
RovingTabindex.prototype.healthCheck = function() {
  const ps = Ports.snapshot();
  const checks = { notDestroyed: !this._isDestroyed, hasConfig: !!this.config, hasElements: !!this.elements, portsInitialized: ps._initialized };
  let passed = 0;
  let total = 0;
  const issues = [];
  for (const k in checks) {
    total++;
    if (checks[k]) passed++;
    else issues.push(k);
  }
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
RovingTabindex.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, isMounted: this._isMounted, metrics: this.getMetrics(), healthCheck: this.healthCheck() };
};
RovingTabindex.prototype.setDebug = function(enabled) {
  this._debug = !!enabled;
};
RovingTabindex.prototype.destroy = function() {
  if (this._isMounted) this.unmount();
  this._isDestroyed = true;
};
function getVersion() {
  return VERSION;
}
var roving_tabindex_default = RovingTabindex;
export {
  MODULE_ID,
  RovingTabindex,
  VERSION,
  roving_tabindex_default as default,
  getPorts,
  getVersion,
  injectPorts
};
