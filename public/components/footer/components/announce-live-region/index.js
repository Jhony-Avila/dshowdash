import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.footer.announce-live-region";
const VERSION = "2.2.0-P18EC";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const _state = { initialized: false, element: null, queue: [], politeness: "polite" };
const _metrics = { announcements: 0 };
function announce(message, options) {
  options = options || {};
  _metrics.announcements++;
  if (!_state.element && typeof document !== "undefined") {
    _state.element = document.getElementById("live-region") || document.querySelector("[aria-live]");
  }
  if (_state.element) {
    _state.element.setAttribute("aria-live", options.politeness || _state.politeness);
    _state.element.textContent = message;
    setTimeout(() => {
      _state.element.textContent = "";
    }, options.clearAfter || 3e3);
    return { ok: true };
  }
  return { ok: false, reason: "No live region element" };
}
function setElement(element) {
  _state.element = element;
  return { ok: true };
}
function setPoliteness(level) {
  _state.politeness = level;
  return { ok: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  if (ctx && ctx.element) _state.element = ctx.element;
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, hasElement: { ok: !!_state.element, severity: "warn" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, hasElement: !!_state.element, politeness: _state.politeness, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function FooterAnnounceLiveRegion(options) {
  options = options || {};
  this._container = null;
  this._mounted = false;
  this._element = null;
}
FooterAnnounceLiveRegion.prototype.mount = function(container, config, integrations) {
  if (this._mounted) return Promise.resolve();
  init();
  this._container = container;
  this._element = document.createElement("div");
  this._element.id = "footer-live-region";
  this._element.className = "dsd-footer__live-region sr-only";
  this._element.setAttribute("role", "status");
  this._element.setAttribute("aria-live", "polite");
  this._element.setAttribute("aria-atomic", "true");
  this._container.appendChild(this._element);
  setElement(this._element);
  this._mounted = true;
  return Promise.resolve();
};
FooterAnnounceLiveRegion.prototype.destroy = function() {
  if (this._element && this._element.parentNode) {
    this._element.parentNode.removeChild(this._element);
  }
  this._element = null;
  _state.element = null;
  this._mounted = false;
};
FooterAnnounceLiveRegion.prototype.isLoaded = function() {
  return this._mounted;
};
FooterAnnounceLiveRegion.prototype.announce = (message, options) => announce(message, options);
FooterAnnounceLiveRegion.prototype.setPoliteness = (level) => setPoliteness(level);
FooterAnnounceLiveRegion.prototype.healthCheck = () => healthCheck();
FooterAnnounceLiveRegion.prototype.info = () => info();
var announce_live_region_default = FooterAnnounceLiveRegion;
export {
  FooterAnnounceLiveRegion,
  MODULE_ID,
  VERSION,
  announce,
  announce_live_region_default as default,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  setElement,
  setPoliteness
};
