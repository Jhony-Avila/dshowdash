import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "6.6.0-P17WI";
const MODULE_ID = "footer-a11y-announce";
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
const _metrics = { announceCount: 0, politeCount: 0, assertiveCount: 0 };
function FooterAnnounce() {
  this._region = null;
  this._queue = [];
  this._processing = false;
}
FooterAnnounce.prototype.init = function(container) {
  const liveRegion = container ? container.querySelector("[aria-live]") : null;
  this._region = liveRegion || this._createRegion(container);
  _log("info", "Announce initialized");
  return this;
};
FooterAnnounce.prototype._createRegion = (container) => {
  const region = document.createElement("div");
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  region.className = "sr-only";
  region.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);";
  if (container) container.appendChild(region);
  return region;
};
FooterAnnounce.prototype.announce = function(message, priority) {
  if (!message) return;
  priority = priority || "polite";
  _metrics.announceCount++;
  if (priority === "assertive") _metrics.assertiveCount++;
  else _metrics.politeCount++;
  this._queue.push({ message, priority });
  this._processQueue();
};
FooterAnnounce.prototype._processQueue = function() {
  const self = this;
  if (this._processing || this._queue.length === 0) return;
  this._processing = true;
  const item = this._queue.shift();
  const message = item.message;
  const priority = item.priority;
  if (this._region) {
    this._region.setAttribute("aria-live", priority);
    this._region.textContent = "";
    requestAnimationFrame(() => {
      if (self._region) self._region.textContent = message;
      setTimeout(() => {
        self._processing = false;
        self._processQueue();
      }, 1e3);
    });
  } else {
    this._processing = false;
  }
};
FooterAnnounce.prototype.clear = function() {
  this._queue = [];
  if (this._region) this._region.textContent = "";
};
FooterAnnounce.prototype.destroy = function() {
  this.clear();
  this._region = null;
  _log("info", "Announce destroyed");
};
FooterAnnounce.prototype.setDebug = (enabled) => {
};
FooterAnnounce.prototype.getMetrics = () => Object.assign({}, _metrics);
FooterAnnounce.prototype.info = function() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, hasRegion: !!this._region, queueLength: this._queue.length, metrics: this.getMetrics(), portsInitialized: ps._initialized, timestamp: Date.now() };
};
FooterAnnounce.prototype.healthCheck = function() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { hasRegion: !!this._region, hasLogger: !!_getPort("logger"), portsInitialized: ps._initialized }, metrics: this.getMetrics() };
};
const announce = new FooterAnnounce();
function getMetrics() {
  return announce.getMetrics();
}
function info() {
  return announce.info();
}
function healthCheck() {
  return announce.healthCheck();
}
var announce_default = FooterAnnounce;
export {
  FooterAnnounce,
  MODULE_ID,
  VERSION,
  announce,
  announce_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
