import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import WeatherAPI from "./api/fetch.js";
import { LifecycleManager } from "./core/lifecycle.js";
import { StateStore } from "./state/store.js";
import { Logger } from "./telemetry/logger.js";
import { TelemetryTracker } from "./telemetry/tracker.js";
import { PollingCoordinator } from "./core/polling.js";
const VERSION = "9.7.0-P1-UARPS";
const id = "weather-sp";
const capabilities = { type: "indicator", reorderable: true, hideable: true, critical: false, rendersUI: true };
const MODULE_ID = "header/components/weather-sp";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const emitUIAction = (data = {}) => {
  const eventBus = _getPort("eventBus");
  if (!eventBus || !eventBus.emit) return;
  eventBus.emit(UI_EVENTS.ACTION, { actionId: "header:weather-sp", source: MODULE_ID, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, data) });
};
(function loadCSS() {
  const cssPath = "/components/header/components/weather-sp/component.css";
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    document.head.appendChild(link);
  }
})();
const ICONS = { sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>', cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>', cloudRain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>', moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>' };
const getWeatherIcon = (code, isDay = true) => {
  if (code === 0) return isDay ? ICONS.sun : ICONS.moon;
  if (code >= 1 && code <= 48) return ICONS.cloud;
  return ICONS.cloudRain;
};
function WeatherSpComponent(options) {
  options = options || {};
  this.container = options.container;
  this.store = new StateStore({ temp: null, code: 0, isDay: true, status: "loading" });
  this.eventBus = _getPort("eventBus");
  this.lifecycle = new LifecycleManager(this);
  const cfg = _getPort("config");
  this.logger = new Logger({ prefix: "[Weather]", debug: cfg && cfg.app && cfg.app.debug });
  this.telemetry = new TelemetryTracker();
  this.api = new WeatherAPI();
  this.element = null;
  this.isDestroyed = false;
  this.polling = null;
  this.unsubscribe = null;
  this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
WeatherSpComponent.prototype.mount = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  _initPorts();
  return this.lifecycle.mount().then(() => {
    self.render();
    return self.fetchWeather();
  }).then(() => {
    self.startPolling();
    self._metrics.mountCount++;
    self._metrics.lastMountAt = Date.now();
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.MOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};
WeatherSpComponent.prototype.render = function() {
  const self = this;
  this.element = document.createElement("div");
  this.element.className = "weather-sp-component";
  this.element.title = "Clima S\xE3o Paulo";
  this.element.dataset.status = "loading";
  this.element.setAttribute("data-uarps-trigger", "trigger:header:open-weather-sp");
  this.element.innerHTML = `<div class="weather-icon">${ICONS.sun}</div><span class="weather-temp">--\xB0C</span>`;
  if (this.container) this.container.appendChild(this.element);
  this.element.style.cursor = "pointer";
  this.element.addEventListener("click", () => {
    emitUIAction({ clicked: true, value: self.store && self.store.getState ? self.store.getState().temp : null });
  });
  this.unsubscribe = this.store.subscribe((state) => {
    if (!self.element || self.isDestroyed) return;
    self.updateUI(state);
  });
};
WeatherSpComponent.prototype.updateUI = function(state) {
  const iconEl = this.element.querySelector(".weather-icon");
  const tempEl = this.element.querySelector(".weather-temp");
  if (state.temp !== null) {
    iconEl.innerHTML = getWeatherIcon(state.code, state.isDay);
    tempEl.textContent = `${Math.round(state.temp)}\xB0C`;
    this.element.dataset.status = "ok";
  } else {
    tempEl.textContent = "--\xB0C";
    this.element.dataset.status = "offline";
  }
};
WeatherSpComponent.prototype.fetchWeather = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  this._metrics.fetchCount++;
  this._metrics.lastFetchAt = Date.now();
  return this.api.fetchWeather().then((data) => {
    if (self.isDestroyed) return;
    self.store.setState({ temp: data.temperature, code: data.weathercode || 0, isDay: data.is_day !== 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.DATA_UPDATED, { componentId: id, moduleId: MODULE_ID, data: { temp: data.temperature }, timestamp: Date.now() });
  }).catch(() => {
    if (!self.isDestroyed) self.store.setState({ status: "offline" });
  });
};
WeatherSpComponent.prototype.startPolling = function() {
  const self = this;
  if (this.isDestroyed) return;
  if (this.polling) {
    this.polling.stop();
    this.polling = null;
  }
  this.polling = new PollingCoordinator({ interval: 3e5 });
  this.polling.onPoll(() => self.fetchWeather());
  this.polling.start();
};
WeatherSpComponent.prototype.unmount = function() {
  const self = this;
  this.isDestroyed = true;
  return this.lifecycle.unmount().then(() => {
    if (self.polling) {
      self.polling.stop();
      self.polling = null;
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
WeatherSpComponent.prototype.healthCheck = function() {
  const eb = _getPort("eventBus");
  const checks = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!eb, pollingActive: !!this.polling, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: 5, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
};
WeatherSpComponent.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, id, capabilities, portsInitialized: Ports.isInitialized(), mounted: !!this.element, temp: this.store.getState().temp, metrics: this._metrics };
};
var weather_sp_default = WeatherSpComponent;
export {
  MODULE_ID,
  VERSION,
  WeatherSpComponent,
  capabilities,
  weather_sp_default as default,
  getPorts,
  id,
  injectPorts
};
