import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import { LifecycleManager } from "./core/lifecycle.js";
import { StateStore } from "./state/store.js";
import { Logger } from "./telemetry/logger.js";
import { TelemetryTracker } from "./telemetry/tracker.js";
const VERSION = "8.6.0-ES6";
const id = "real-time-clock";
const capabilities = { type: "indicator", reorderable: true, hideable: true, critical: false, rendersUI: true };
const MODULE_ID = "header/components/real-time-clock";
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
  const cssPath = "/components/header/components/real-time-clock/component.css";
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    document.head.appendChild(link);
  }
})();
function RealTimeClockComponent(options) {
  options = options || {};
  this.container = options.container;
  this.store = new StateStore({ time: "" });
  this.eventBus = _getPort("eventBus");
  this.lifecycle = new LifecycleManager(this);
  const cfg = _getPort("config");
  this.logger = new Logger({ prefix: "[Clock]", debug: cfg && cfg.app && cfg.app.debug });
  this.telemetry = new TelemetryTracker();
  this.element = null;
  this.isDestroyed = false;
  this.intervalId = null;
  this.unsubscribe = null;
  this._metrics = { mountCount: 0, tickCount: 0, lastMountAt: null };
}
RealTimeClockComponent.prototype.mount = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  _initPorts();
  return this.lifecycle.mount().then(() => {
    self.render();
    self.startClock();
    self._metrics.mountCount++;
    self._metrics.lastMountAt = Date.now();
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.MOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};
RealTimeClockComponent.prototype.render = function() {
  const self = this;
  this.element = document.createElement("div");
  this.element.className = "real-time-clock-component";
  this.element.dataset.status = "ok";
  this.element.setAttribute("data-uarps-trigger", "trigger:header:open-real-time-clock");
  this.element.innerHTML = '<span class="clock-time">--:--</span>';
  if (this.container) this.container.appendChild(this.element);
  this.unsubscribe = this.store.subscribe((state) => {
    if (!self.element || self.isDestroyed) return;
    self.updateUI(state);
  });
};
RealTimeClockComponent.prototype.updateUI = function(state) {
  const timeEl = this.element.querySelector(".clock-time");
  if (timeEl) timeEl.textContent = state.time;
};
RealTimeClockComponent.prototype.startClock = function() {
  const self = this;
  const tick = () => {
    if (self.isDestroyed) return;
    const now = /* @__PURE__ */ new Date();
    const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    self.store.setState({ time });
    self._metrics.tickCount++;
  };
  tick();
  this.intervalId = setInterval(tick, 1e3);
};
RealTimeClockComponent.prototype.unmount = function() {
  const self = this;
  this.isDestroyed = true;
  return this.lifecycle.unmount().then(() => {
    if (self.intervalId) {
      clearInterval(self.intervalId);
      self.intervalId = null;
    }
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
RealTimeClockComponent.prototype.healthCheck = function() {
  const eb = _getPort("eventBus");
  const checks = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!eb, clockRunning: !!this.intervalId, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: 5, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
};
RealTimeClockComponent.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, id, capabilities, portsInitialized: Ports.isInitialized(), mounted: !!this.element, time: this.store.getState().time, metrics: this._metrics };
};
var real_time_clock_default = RealTimeClockComponent;
export {
  MODULE_ID,
  RealTimeClockComponent,
  VERSION,
  capabilities,
  real_time_clock_default as default,
  getPorts,
  id,
  injectPorts
};
