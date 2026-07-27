import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import { navigateToRoute } from "../_base/navigation-helper.js";
import NotificationsAPI from "./api/fetch.js";
import { LifecycleManager } from "./core/lifecycle.js";
import { StateStore } from "./state/store.js";
import { Logger } from "./telemetry/logger.js";
import { TelemetryTracker } from "./telemetry/tracker.js";
import { PollingCoordinator } from "./core/polling.js";
const VERSION = "10.4.0-FASE-B";
const id = "notifications";
const capabilities = { type: "indicator", reorderable: true, hideable: false, critical: true, rendersUI: true };
const MODULE_ID = "header/components/notifications";
const ROUTE = "#/notificacoes";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
function _isAuthenticated() {
  const gs = _getPort("globalState");
  if (gs) {
    if (typeof gs.isAuthenticated === "function") {
      try {
        return gs.isAuthenticated();
      } catch (e) {
      }
    }
    if (typeof gs.getState === "function") {
      try {
        const state = gs.getState();
        if (state && state.auth && state.auth.isAuthenticated) return true;
      } catch (e) {
      }
    }
  }
  return false;
}
(function loadCSS() {
  const cssPath = "/components/header/components/notifications/component.css";
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    document.head.appendChild(link);
  }
})();
const emitUIAction = (data = {}) => {
  const eventBus = _getPort("eventBus");
  if (!eventBus || !eventBus.emit) return;
  eventBus.emit(UI_EVENTS.ACTION, { actionId: "header:notifications", source: MODULE_ID, timestamp: Date.now(), kind: "ui", meta: Object.assign({ label: "Notifica\xE7\xF5es" }, data) });
};
const ICON_BELL = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path d="M29.07 26.74 27 20.733V16a9.008 9.008 0 0 0-6-8.475V6a3 3 0 0 0-6 0v1.525A9.008 9.008 0 0 0 9 16v4.574l-2.285 6.285A2.339 2.339 0 0 0 8.914 30h5.228a3.981 3.981 0 0 0 7.716 0h5.06a2.34 2.34 0 0 0 2.152-3.26zM17 7V6a1 1 0 0 1 2 0v1zm1 24a1.993 1.993 0 0 1-1.722-1h3.444A1.993 1.993 0 0 1 18 31zm9.2-3.156a.334.334 0 0 1-.287.156h-18a.34.34 0 0 1-.32-.457L11 20.926V16a7 7 0 0 1 14 0v5.068l2.193 6.363.036.088a.335.335 0 0 1-.024.325z" fill="currentColor"/></svg>';
function NotificationsComponent(options) {
  options = options || {};
  this.container = options.container;
  this.store = new StateStore({ unreadCount: 0, status: "loading" });
  this.eventBus = _getPort("eventBus");
  this.lifecycle = new LifecycleManager(this);
  const cfg = _getPort("config");
  this.logger = new Logger({ prefix: "[Notifications]", debug: cfg && cfg.app && cfg.app.debug });
  this.telemetry = new TelemetryTracker();
  this.api = new NotificationsAPI();
  this.element = null;
  this.isDestroyed = false;
  this.polling = null;
  this.unsubscribe = null;
  this._metrics = { mountCount: 0, fetchCount: 0, clickCount: 0, lastMountAt: null, lastFetchAt: null, lastClickAt: null };
}
NotificationsComponent.prototype.mount = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  _initPorts();
  return this.lifecycle.mount().then(() => {
    self.render();
    return self.fetchNotifications();
  }).then(() => {
    self.startPolling();
    self._metrics.mountCount++;
    self._metrics.lastMountAt = Date.now();
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.MOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};
NotificationsComponent.prototype.render = function() {
  const self = this;
  this.element = document.createElement("div");
  this.element.className = "notifications-component";
  this.element.title = "Notifica\xE7\xF5es";
  this.element.dataset.status = "loading";
  this.element.dataset.count = "0";
  this.element.setAttribute("data-uarps-trigger", "trigger:header:open-notifications");
  this.element.innerHTML = `<div class="notifications-icon">${ICON_BELL}</div><span class="notifications-badge">0</span>`;
  this.element.addEventListener("click", () => {
    self._metrics.clickCount++;
    self._metrics.lastClickAt = Date.now();
    emitUIAction({ clicked: true, value: self.store && self.store.getState ? self.store.getState().unreadCount : 0 });
    navigateToRoute(ROUTE, MODULE_ID);
  });
  if (this.container) this.container.appendChild(this.element);
  this.unsubscribe = this.store.subscribe((state) => {
    if (!self.element || self.isDestroyed) return;
    self.updateUI(state);
  });
};
NotificationsComponent.prototype.updateUI = function(state) {
  const badgeEl = this.element.querySelector(".notifications-badge");
  if (state.unreadCount !== null) {
    this.element.dataset.count = String(state.unreadCount);
    this.element.dataset.status = state.unreadCount > 0 ? "has-unread" : "ok";
    badgeEl.textContent = state.unreadCount > 99 ? "99+" : state.unreadCount;
  } else {
    this.element.dataset.count = "0";
    this.element.dataset.status = "offline";
  }
};
NotificationsComponent.prototype.fetchNotifications = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  this._metrics.fetchCount++;
  this._metrics.lastFetchAt = Date.now();
  return this.api.fetchNotifications().then((data) => {
    if (self.isDestroyed) return;
    self.store.setState({ unreadCount: data.unread_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.DATA_UPDATED, { componentId: id, moduleId: MODULE_ID, data: { unreadCount: data.unread_count }, timestamp: Date.now() });
  }).catch(() => {
    if (!self.isDestroyed) self.store.setState({ status: "offline" });
  });
};
NotificationsComponent.prototype.startPolling = function() {
  const self = this;
  if (this.isDestroyed) return;
  const isAuthenticated = _isAuthenticated();
  if (!isAuthenticated) {
    const logger = _getPort("logger");
    if (logger && logger.info) logger.info(`[${MODULE_ID}] Polling skipped: not authenticated (expected on login)`);
    return;
  }
  this.polling = new PollingCoordinator({ interval: 3e4 });
  this.polling.onPoll(() => self.fetchNotifications());
  this.polling.start();
};
NotificationsComponent.prototype.unmount = function() {
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
NotificationsComponent.prototype.healthCheck = function() {
  const eb = _getPort("eventBus");
  const gs = _getPort("globalState");
  const checks = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!eb, pollingActive: !!this.polling, portsInitialized: Ports.isInitialized(), portsGlobalStateAvailable: !!gs };
  const passed = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;
  return { status: passed === maxScore ? "HEALTHY" : passed >= maxScore - 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
};
NotificationsComponent.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, id, capabilities, portsInitialized: Ports.isInitialized(), mounted: !!this.element, unreadCount: this.store.getState().unreadCount, metrics: this._metrics };
};
var notifications_default = NotificationsComponent;
export {
  MODULE_ID,
  NotificationsComponent,
  VERSION,
  capabilities,
  notifications_default as default,
  getPorts,
  id,
  injectPorts
};
