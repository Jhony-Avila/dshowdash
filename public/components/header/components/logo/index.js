import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import { LifecycleManager } from "./core/lifecycle.js";
import { StateStore } from "./state/store.js";
import { Logger } from "./telemetry/logger.js";
import { TelemetryTracker } from "./telemetry/tracker.js";
const VERSION = "1.1.0-ES6";
const id = "logo";
const capabilities = { type: "brand", reorderable: false, hideable: false, critical: true, rendersUI: true };
const MODULE_ID = "header/components/logo";
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
  const cssPath = "/components/header/components/logo/component.css";
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    document.head.appendChild(link);
  }
})();
function LogoComponent(options) {
  options = options || {};
  this.container = options.container;
  this.config = options.config || {};
  this.store = new StateStore({ theme: "light", visible: true });
  this.eventBus = _getPort("eventBus");
  this.lifecycle = new LifecycleManager(this);
  const cfg = _getPort("config");
  this.logger = new Logger({ prefix: "[Logo]", debug: cfg && cfg.app && cfg.app.debug });
  this.telemetry = new TelemetryTracker();
  this.element = null;
  this.isDestroyed = false;
  this.unsubscribe = null;
  this._metrics = { mountCount: 0, clickCount: 0, lastMountAt: null };
}
LogoComponent.prototype.mount = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  _initPorts();
  return this.lifecycle.mount().then(() => {
    self.render();
    self.bindEvents();
    self._metrics.mountCount++;
    self._metrics.lastMountAt = Date.now();
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.MOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};
LogoComponent.prototype.render = function() {
  const self = this;
  this.element = document.createElement("a");
  this.element.className = "logo-component";
  this.element.href = "/";
  this.element.title = "DShow Dashboard - Ir para in\xEDcio";
  this.element.dataset.status = "ok";
  this.element.setAttribute("aria-label", "Logo DShow Dashboard - Ir para p\xE1gina inicial");
  this.element.innerHTML = '<img src="/assets/images/logo.png" alt="DShow Dashboard" class="logo-image" />';
  if (this.container) this.container.appendChild(this.element);
  this.unsubscribe = this.store.subscribe((state) => {
    if (!self.element || self.isDestroyed) return;
    self.updateUI(state);
  });
};
LogoComponent.prototype.updateUI = function(state) {
  if (!this.element) return;
  this.element.dataset.theme = state.theme;
  this.element.style.display = state.visible ? "flex" : "none";
};
LogoComponent.prototype.bindEvents = function() {
  const self = this;
  if (!this.element) return;
  this.element.addEventListener("click", (e) => {
    self._metrics.clickCount++;
    self.telemetry.track("logo:click", { timestamp: Date.now() });
    const eb2 = _getPort("eventBus");
    if (eb2 && eb2.emit) eb2.emit("logo:click", { timestamp: Date.now() });
  });
  const eb = _getPort("eventBus");
  if (eb && eb.on) {
    eb.on("theme:changed", (data) => {
      self.store.setState({ theme: data.theme || "light" });
    });
  }
};
LogoComponent.prototype.unmount = function() {
  const self = this;
  this.isDestroyed = true;
  return this.lifecycle.unmount().then(() => {
    if (self.unsubscribe) {
      self.unsubscribe();
      self.unsubscribe = null;
    }
    if (self.store) self.store.reset();
    if (self.element) {
      self.element.remove();
      self.element = null;
    }
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.UNMOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};
LogoComponent.prototype.healthCheck = function() {
  const eb = _getPort("eventBus");
  const checks = {
    isMounted: !!this.element,
    hasStore: !!this.store,
    hasGlobalEventBus: !!eb,
    imageLoaded: this.element ? !!this.element.querySelector("img") : false,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: 5,
    checks,
    portsInitialized: Ports.isInitialized(),
    version: VERSION,
    moduleId: MODULE_ID
  };
};
LogoComponent.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    id,
    capabilities,
    portsInitialized: Ports.isInitialized(),
    mounted: !!this.element,
    theme: this.store.getState().theme,
    metrics: this._metrics
  };
};
var logo_default = LogoComponent;
export {
  LogoComponent,
  MODULE_ID,
  VERSION,
  capabilities,
  logo_default as default,
  getPorts,
  id,
  injectPorts
};
