import { emitUIAction } from "./event-helpers.js";
import { addListener, addKeyboardListener, runCleanups } from "./listener-helpers.js";
import { getIcon } from "./icons.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.7.0-ES6";
const MODULE_ID = "navrail-button-base";
const NAV_BUTTON_EVENTS = { MOUNTED: "navrail:button:mounted", CLICKED: "navrail:button:clicked", UNMOUNTED: "navrail:button:unmounted" };
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
function NavRailButtonBase(config) {
  if (!config) config = {};
  this._id = config.id || "unknown";
  this._label = config.label || "";
  this._icon = config.icon || "";
  this._area = "navrail";
  this._meta = config.meta || {};
  this._element = null;
  this._mounted = false;
  this._cleanups = [];
  this._metrics = { mountCount: 0, clickCount: 0, lastClickAt: null };
  this._initialized = false;
  this._ctx = null;
}
NavRailButtonBase.prototype.init = function(ctx) {
  if (this._initialized) return this;
  this._ctx = ctx || {};
  this._initialized = true;
  return this;
};
NavRailButtonBase.prototype.mount = function(hostEl, props) {
  if (!props) props = {};
  if (this._mounted && this._element && this._element.parentNode === hostEl) return this;
  if (this._mounted) this.unmount();
  this._element = this._createButton(props);
  this._attachEvents();
  if (hostEl) hostEl.appendChild(this._element);
  this._mounted = true;
  this._metrics.mountCount++;
  this._emitTelemetry(NAV_BUTTON_EVENTS.MOUNTED);
  return this;
};
NavRailButtonBase.prototype._createButton = function(props) {
  if (!props) props = {};
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `navrail-btn navrail-btn--${this._id}`;
  btn.setAttribute("aria-label", props.label || this._label);
  btn.setAttribute("data-button-id", this._id);
  btn.setAttribute("data-uarps-trigger", `trigger:navrail:${this._id}`);
  btn.setAttribute("tabindex", "0");
  btn.setAttribute("title", props.label || this._label);
  const iconSvg = getIcon(props.icon || this._icon);
  btn.innerHTML = `<span class="navrail-btn__icon" aria-hidden="true">${iconSvg}</span><span class="navrail-btn__label">${props.label || this._label}</span>`;
  return btn;
};
NavRailButtonBase.prototype._attachEvents = function() {
  const self = this;
  if (!this._element) return;
  addListener(this._element, "click", (e) => {
    self._handleClick(e);
  }, this._cleanups);
  addKeyboardListener(this._element, (e) => {
    self._handleClick(e);
  }, this._cleanups);
};
NavRailButtonBase.prototype._handleClick = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  this._metrics.clickCount++;
  this._metrics.lastClickAt = Date.now();
  const actionId = `${this._area}:${this._id}`;
  emitUIAction(actionId, this.getModuleId(), Object.assign({ label: this._label, icon: this._icon }, this._meta));
  this._emitTelemetry(NAV_BUTTON_EVENTS.CLICKED);
};
NavRailButtonBase.prototype._emitTelemetry = function(eventName) {
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(eventName, { buttonId: this._id, source: this.getModuleId(), timestamp: Date.now() });
  }
};
NavRailButtonBase.prototype.unmount = function() {
  if (!this._mounted) return this;
  runCleanups(this._cleanups);
  if (this._element && this._element.parentNode) this._element.parentNode.removeChild(this._element);
  this._element = null;
  this._mounted = false;
  this._emitTelemetry(NAV_BUTTON_EVENTS.UNMOUNTED);
  return this;
};
NavRailButtonBase.prototype.healthCheck = function() {
  const checks = { initialized: !!this._initialized, mounted: this._mounted, hasElement: !!this._element, hasId: !!this._id, portsInitialized: Ports.isInitialized() };
  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: score === total ? "HEALTHY" : score >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${score}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: this.getModuleId() };
};
NavRailButtonBase.prototype.info = function() {
  return { id: this._id, area: this._area, label: this._label, icon: this._icon, mounted: this._mounted, metrics: Object.assign({}, this._metrics), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: this.getModuleId() };
};
NavRailButtonBase.prototype.getModuleId = function() {
  return `navrail/components/${this._id}`;
};
NavRailButtonBase.prototype.getId = function() {
  return this._id;
};
NavRailButtonBase.prototype.getElement = function() {
  return this._element;
};
NavRailButtonBase.prototype.isMounted = function() {
  return this._mounted;
};
function createNavRailButton(config) {
  return new NavRailButtonBase(config);
}
var button_base_default = { NavRailButtonBase, createNavRailButton, NAV_BUTTON_EVENTS, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  MODULE_ID,
  NAV_BUTTON_EVENTS,
  NavRailButtonBase,
  VERSION,
  createNavRailButton,
  button_base_default as default,
  getPorts,
  injectPorts
};
