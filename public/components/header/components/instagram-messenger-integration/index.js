import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { COMPONENT_EVENTS } from "/core/runtime/events/catalog/component.events.js";
import IntegrationAPI from "./api/fetch.js";
import { LifecycleManager } from "./core/lifecycle.js";
import { StateStore } from "./state/store.js";
import { Logger } from "./telemetry/logger.js";
import { TelemetryTracker } from "./telemetry/tracker.js";
import { PollingCoordinator } from "./core/polling.js";
const VERSION = "9.7.0-P1-UARPS";
const id = "instagram-messenger-integration";
const capabilities = { type: "integration", reorderable: true, hideable: true, critical: false, rendersUI: true };
const MODULE_ID = "header/components/instagram-messenger-integration";
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
  eventBus.emit(UI_EVENTS.ACTION, { actionId: "header:instagram-messenger-integration", source: MODULE_ID, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, data) });
};
(function loadCSS() {
  const cssPath = "/components/header/components/instagram-messenger-integration/component.css";
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    document.head.appendChild(link);
  }
})();
const ICON_INSTAGRAM = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="ig-grad" gradientTransform="matrix(0 -1.982 -1.844 0 -132.522 -51.077)" gradientUnits="userSpaceOnUse" x1="-37.106" x2="-26.555" y1="-72.705" y2="-84.047"><stop offset="0" stop-color="#fd5"/><stop offset=".5" stop-color="#ff543e"/><stop offset="1" stop-color="#c837ab"/></linearGradient></defs><path d="m1.5 1.633c-1.886 1.959-1.5 4.04-1.5 10.362 0 5.25-.916 10.513 3.878 11.752 1.497.385 14.761.385 16.256-.002 1.996-.515 3.62-2.134 3.842-4.957.031-.394.031-13.185-.001-13.587-.236-3.007-2.087-4.74-4.526-5.091-.559-.081-.671-.105-3.539-.11-10.173.005-12.403-.448-14.41 1.633z" fill="url(#ig-grad)"/><path d="m11.998 3.139c-3.631 0-7.079-.323-8.396 3.057-.544 1.396-.465 3.209-.465 5.805 0 2.278-.073 4.419.465 5.804 1.314 3.382 4.79 3.058 8.394 3.058 3.477 0 7.062.362 8.395-3.058.545-1.41.465-3.196.465-5.804 0-3.462.191-5.697-1.488-7.375-1.7-1.7-3.999-1.487-7.374-1.487zm-.794 1.597c7.574-.012 8.538-.854 8.006 10.843-.189 4.137-3.339 3.683-7.211 3.683-7.06 0-7.263-.202-7.263-7.265 0-7.145.56-7.257 6.468-7.263zm5.524 1.471c-.587 0-1.063.476-1.063 1.063s.476 1.063 1.063 1.063 1.063-.476 1.063-1.063-.476-1.063-1.063-1.063zm-4.73 1.243c-2.513 0-4.55 2.038-4.55 4.551s2.037 4.55 4.55 4.55 4.549-2.037 4.549-4.55-2.036-4.551-4.549-4.551zm0 1.597c3.905 0 3.91 5.908 0 5.908-3.904 0-3.91-5.908 0-5.908z" fill="#fff"/></svg>';
function InstagramMessengerComponent(options) {
  options = options || {};
  this.container = options.container;
  this.store = new StateStore({ unreadCount: 0, status: "loading" });
  this.lifecycle = new LifecycleManager(this);
  this.logger = new Logger({ prefix: "[Instagram]", debug: false });
  this.telemetry = new TelemetryTracker();
  this.api = new IntegrationAPI();
  this.element = null;
  this.isDestroyed = false;
  this.polling = null;
  this.unsubscribe = null;
  this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
InstagramMessengerComponent.prototype.mount = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  _initPorts();
  return this.lifecycle.mount().then(() => {
    self.render();
    return self.fetchStatus();
  }).then(() => {
    self.startPolling();
    self._metrics.mountCount++;
    self._metrics.lastMountAt = Date.now();
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.MOUNTED, { componentId: id, moduleId: MODULE_ID, timestamp: Date.now() });
  });
};
InstagramMessengerComponent.prototype.render = function() {
  const self = this;
  this.element = document.createElement("div");
  this.element.className = "instagram-messenger-integration-component";
  this.element.title = "Instagram / Messenger";
  this.element.dataset.status = "loading";
  this.element.dataset.count = "0";
  this.element.setAttribute("data-uarps-trigger", "trigger:header:open-instagram-messenger-integration");
  this.element.innerHTML = `<div class="integration-icon">${ICON_INSTAGRAM}</div><span class="integration-badge">0</span>`;
  if (this.container) this.container.appendChild(this.element);
  this.element.style.cursor = "pointer";
  this.element.addEventListener("click", () => {
    emitUIAction({ clicked: true, value: self.store && self.store.getState ? self.store.getState().unreadCount : 0 });
  });
  this.unsubscribe = this.store.subscribe((state) => {
    if (!self.element || self.isDestroyed) return;
    self.updateUI(state);
  });
};
InstagramMessengerComponent.prototype.updateUI = function(state) {
  const badgeEl = this.element.querySelector(".integration-badge");
  if (state.unreadCount !== null) {
    this.element.dataset.count = String(state.unreadCount);
    this.element.dataset.status = state.unreadCount > 0 ? "has-unread" : "ok";
    badgeEl.textContent = state.unreadCount > 99 ? "99+" : state.unreadCount;
  } else {
    this.element.dataset.count = "0";
    this.element.dataset.status = "offline";
  }
};
InstagramMessengerComponent.prototype.fetchStatus = function() {
  const self = this;
  if (this.isDestroyed) return Promise.resolve();
  this._metrics.fetchCount++;
  this._metrics.lastFetchAt = Date.now();
  return this.api.fetchStatus().then((data) => {
    if (self.isDestroyed) return;
    self.store.setState({ unreadCount: data.unread_count || 0, status: "ok", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() });
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(COMPONENT_EVENTS.DATA_UPDATED, { componentId: id, moduleId: MODULE_ID, data: { unreadCount: data.unread_count }, timestamp: Date.now() });
  }).catch(() => {
    if (!self.isDestroyed) self.store.setState({ status: "offline" });
  });
};
InstagramMessengerComponent.prototype.startPolling = function() {
  const self = this;
  if (this.isDestroyed) return;
  this.polling = new PollingCoordinator({ interval: 6e4 });
  this.polling.onPoll(() => self.fetchStatus());
  this.polling.start();
};
InstagramMessengerComponent.prototype.unmount = function() {
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
InstagramMessengerComponent.prototype.healthCheck = function() {
  const eb = _getPort("eventBus");
  const checks = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!eb, pollingActive: !!this.polling, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: 5, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
};
InstagramMessengerComponent.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, id, capabilities, mounted: !!this.element, unreadCount: this.store.getState().unreadCount, portsInitialized: Ports.isInitialized(), metrics: this._metrics };
};
var instagram_messenger_integration_default = InstagramMessengerComponent;
export {
  InstagramMessengerComponent,
  MODULE_ID,
  VERSION,
  capabilities,
  instagram_messenger_integration_default as default,
  getPorts,
  id,
  injectPorts
};
