import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import { navigateToRoute } from "../_base/navigation-helper.js";
const VERSION = "8.8.0-ES6";
const id = "panel-bling";
const capabilities = { type: "panel", reorderable: true, hideable: true, critical: false, rendersUI: true };
const MODULE_ID = "header/components/panel-bling";
const PANEL_CONFIG = { id: "panel-bling", label: "Bling", route: "#/integrations/bling", icon: "/assets/icons/system/header/bling.svg" };
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
(function loadCSS() {
  const cssPath = "/components/header/components/panel-bling/component.css";
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    document.head.appendChild(link);
  }
})();
function _emit(event, data) {
  data = data || {};
  const bus = _getPort("eventBus");
  if (bus && bus.emit) bus.emit(event, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data));
}
function PanelBlingComponent(options) {
  options = options || {};
  this.container = options.container || null;
  this.element = null;
  this._isMounted = false;
  this._isDestroyed = false;
  this._clickHandler = null;
  this._metrics = { mountCount: 0, unmountCount: 0, clickCount: 0, errorCount: 0, lastMountAt: null, lastClickAt: null };
}
PanelBlingComponent.prototype.mount = function(container) {
  if (this._isDestroyed) {
    this._metrics.errorCount++;
    return Promise.resolve(this);
  }
  if (this._isMounted) return Promise.resolve(this);
  try {
    _initPorts();
    this.container = container || this.container;
    if (!this.container) throw new Error("Container required");
    this._render();
    this._attachEvents();
    this._isMounted = true;
    this._metrics.mountCount++;
    this._metrics.lastMountAt = Date.now();
    _emit(COMPONENT_EVENTS.MOUNTED, { componentId: PANEL_CONFIG.id, moduleId: MODULE_ID });
    return Promise.resolve(this);
  } catch (error) {
    this._metrics.errorCount++;
    _emit(COMPONENT_EVENTS.ERROR, { componentId: PANEL_CONFIG.id, moduleId: MODULE_ID, error: error.message });
    return Promise.reject(error);
  }
};
PanelBlingComponent.prototype._render = function() {
  this.element = document.createElement("button");
  this.element.type = "button";
  this.element.className = "header-panel-trigger panel-bling-trigger";
  this.element.title = PANEL_CONFIG.label;
  this.element.setAttribute("aria-label", `Abrir ${PANEL_CONFIG.label}`);
  this.element.setAttribute("aria-haspopup", "dialog");
  this.element.setAttribute("data-panel-trigger", PANEL_CONFIG.id);
  this.element.setAttribute("data-uarps-trigger", "trigger:header:open-panel-bling");
  this.element.innerHTML = `<img src="${PANEL_CONFIG.icon}" alt="${PANEL_CONFIG.label}" class="trigger-icon" loading="lazy" />`;
  this.container.appendChild(this.element);
};
PanelBlingComponent.prototype._attachEvents = function() {
  const self = this;
  if (!this.element) return;
  this._clickHandler = (e) => {
    e.preventDefault();
    self._metrics.clickCount++;
    self._metrics.lastClickAt = Date.now();
    navigateToRoute(PANEL_CONFIG.route, MODULE_ID);
  };
  this.element.addEventListener("click", this._clickHandler);
};
PanelBlingComponent.prototype._detachEvents = function() {
  if (this.element && this._clickHandler) {
    this.element.removeEventListener("click", this._clickHandler);
    this._clickHandler = null;
  }
};
PanelBlingComponent.prototype.unmount = function() {
  if (!this._isMounted || this._isDestroyed) return Promise.resolve(this);
  this._detachEvents();
  if (this.element) {
    this.element.remove();
    this.element = null;
  }
  this._isMounted = false;
  this._metrics.unmountCount++;
  _emit(COMPONENT_EVENTS.UNMOUNTED, { componentId: PANEL_CONFIG.id, moduleId: MODULE_ID });
  return Promise.resolve(this);
};
PanelBlingComponent.prototype.destroy = function() {
  if (this._isDestroyed) return;
  this.unmount();
  this._isDestroyed = true;
  this.container = null;
};
PanelBlingComponent.prototype.healthCheck = function() {
  const checks = { notDestroyed: !this._isDestroyed, isMounted: this._isMounted, hasElement: !!this.element, hasContainer: !!this.container, lowErrorRate: this._metrics.errorCount < 5, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
PanelBlingComponent.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, id, capabilities, config: Object.assign({}, PANEL_CONFIG), mounted: this._isMounted, destroyed: this._isDestroyed, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), healthCheck: this.healthCheck() };
};
PanelBlingComponent.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
PanelBlingComponent.prototype.isMounted = function() {
  return this._isMounted;
};
PanelBlingComponent.prototype.isDestroyed = function() {
  return this._isDestroyed;
};
PanelBlingComponent.prototype.getElement = function() {
  return this.element;
};
function createComponent(options) {
  return new PanelBlingComponent(options);
}
var panel_bling_default = PanelBlingComponent;
export {
  MODULE_ID,
  PanelBlingComponent,
  VERSION,
  capabilities,
  createComponent,
  panel_bling_default as default,
  getPorts,
  id,
  injectPorts
};
