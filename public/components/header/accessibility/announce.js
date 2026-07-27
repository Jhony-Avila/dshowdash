import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { getAnnouncerRoot } from "../utils/overlay-root.js";
const VERSION = "2.4.0-ES6";
const MODULE_ID = "header.accessibility.announce";
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
function AnnounceManager(config, elements, timers, logger) {
  this.config = config;
  this.elements = elements;
  this.timers = timers;
  this.logger = logger;
  this.lastAnnouncement = "";
  this.lastAnnouncementTime = null;
  this._debug = false;
  this._metrics = { mountCount: 0, announcements: 0, cleared: 0, duplicatesSkipped: 0, lastAnnounceAt: null };
  this._isMounted = false;
  this._isDestroyed = false;
}
AnnounceManager.prototype.mount = function() {
  const self = this;
  if (self._isDestroyed) {
    _log("warn", "AnnounceManager destruido - mount ignorado");
    return;
  }
  if (self._isMounted) {
    _log("warn", "AnnounceManager ja montado");
    return;
  }
  self._metrics.mountCount++;
  if (!self.elements.statusLive) {
    const live = document.createElement("div");
    live.className = "header-status-live visually-hidden sr-only";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    live.setAttribute("data-announcer", "header-main");
    live.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    getAnnouncerRoot().appendChild(live);
    self.elements.statusLive = live;
    _log("info", "aria-live criado em overlay-root");
  }
  self._isMounted = true;
  _log("info", "Announce manager montado");
};
AnnounceManager.prototype.announce = function(message) {
  const self = this;
  if (!message || self._isDestroyed) return;
  const expireTime = self.config && self.config.accessibility && self.config.accessibility.announceExpire || 3e5;
  if (self.lastAnnouncementTime && Date.now() - self.lastAnnouncementTime > expireTime) self.lastAnnouncement = "";
  if (message === self.lastAnnouncement) {
    self._metrics.duplicatesSkipped++;
    return;
  }
  self.timers.clear("announce");
  const debounce = self.config && self.config.accessibility && self.config.accessibility.announceDebounce || 800;
  self.timers.set("announce", () => {
    if (self.elements.statusLive) {
      self.elements.statusLive.textContent = message;
      self.lastAnnouncement = message;
      self.lastAnnouncementTime = Date.now();
      self._metrics.announcements++;
      self._metrics.lastAnnounceAt = Date.now();
      _log("debug", "Announced:", message);
    }
  }, debounce);
};
AnnounceManager.prototype.clear = function() {
  if (this.elements.statusLive) this.elements.statusLive.textContent = "";
  this.lastAnnouncement = "";
  this.lastAnnouncementTime = null;
  this._metrics.cleared++;
};
AnnounceManager.prototype.unmount = function() {
  if (!this._isMounted) {
    _log("warn", "AnnounceManager nao esta montado");
    return;
  }
  this.clear();
  this.timers.clear("announce");
  this._isMounted = false;
  _log("info", "Announce manager desmontado");
};
AnnounceManager.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics, { isMounted: this._isMounted, isDestroyed: this._isDestroyed });
};
AnnounceManager.prototype.resetMetrics = function() {
  this._metrics = { mountCount: 0, announcements: 0, cleared: 0, duplicatesSkipped: 0, lastAnnounceAt: null };
};
AnnounceManager.prototype.healthCheck = function() {
  const ps = Ports.snapshot();
  const checks = { notDestroyed: !this._isDestroyed, hasConfig: !!this.config, hasTimers: !!this.timers, hasStatusLive: !!this.elements.statusLive || !this._isMounted, portsInitialized: ps._initialized };
  let passed = 0;
  let total = 0;
  const issues = [];
  for (const k in checks) {
    total++;
    if (checks[k]) passed++;
    else issues.push(k);
  }
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
AnnounceManager.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, isMounted: this._isMounted, lastAnnouncement: this.lastAnnouncement, metrics: this.getMetrics(), healthCheck: this.healthCheck() };
};
AnnounceManager.prototype.setDebug = function(enabled) {
  this._debug = !!enabled;
};
AnnounceManager.prototype.destroy = function() {
  if (this._isMounted) this.unmount();
  this._isDestroyed = true;
};
function getVersion() {
  return VERSION;
}
var announce_default = AnnounceManager;
export {
  AnnounceManager,
  MODULE_ID,
  VERSION,
  announce_default as default,
  getPorts,
  getVersion,
  injectPorts
};
