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
const id = "wechat-integration";
const capabilities = { type: "integration", reorderable: true, hideable: true, critical: false, rendersUI: true };
const MODULE_ID = "header/components/wechat-integration";
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
  eventBus.emit(UI_EVENTS.ACTION, { actionId: "header:wechat-integration", source: MODULE_ID, timestamp: Date.now(), meta: Object.assign({ kind: "ui" }, data) });
};
(function loadCSS() {
  const cssPath = "/components/header/components/wechat-integration/component.css";
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    document.head.appendChild(link);
  }
})();
const ICON_WECHAT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#07C160" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.11.24-.245 0-.06-.024-.12-.04-.178l-.325-1.233a.49.49 0 0 1 .178-.554c1.527-1.124 2.5-2.783 2.5-4.622 0-3.295-3.063-6.12-7.06-6.12zm-2.641 3.125c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.969-.983zm4.844 0c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.543.434-.983.969-.983z"/></svg>';
function WeChatIntegrationComponent(options) {
  options = options || {};
  this.container = options.container;
  this.store = new StateStore({ unreadCount: 0, status: "loading" });
  this.lifecycle = new LifecycleManager(this);
  this.logger = new Logger({ prefix: "[WeChat]", debug: false });
  this.telemetry = new TelemetryTracker();
  this.api = new IntegrationAPI();
  this.element = null;
  this.isDestroyed = false;
  this.polling = null;
  this.unsubscribe = null;
  this._metrics = { mountCount: 0, fetchCount: 0, lastMountAt: null, lastFetchAt: null };
}
WeChatIntegrationComponent.prototype.mount = function() {
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
WeChatIntegrationComponent.prototype.render = function() {
  const self = this;
  this.element = document.createElement("div");
  this.element.className = "wechat-integration-component";
  this.element.title = "WeChat";
  this.element.dataset.status = "loading";
  this.element.dataset.count = "0";
  this.element.setAttribute("data-uarps-trigger", "trigger:header:open-wechat-integration");
  this.element.innerHTML = `<div class="integration-icon">${ICON_WECHAT}</div><span class="integration-badge">0</span>`;
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
WeChatIntegrationComponent.prototype.updateUI = function(state) {
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
WeChatIntegrationComponent.prototype.fetchStatus = function() {
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
WeChatIntegrationComponent.prototype.startPolling = function() {
  const self = this;
  if (this.isDestroyed) return;
  this.polling = new PollingCoordinator({ interval: 6e4 });
  this.polling.onPoll(() => self.fetchStatus());
  this.polling.start();
};
WeChatIntegrationComponent.prototype.unmount = function() {
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
WeChatIntegrationComponent.prototype.healthCheck = function() {
  const eb = _getPort("eventBus");
  const checks = { isMounted: !!this.element, hasStore: !!this.store, hasGlobalEventBus: !!eb, pollingActive: !!this.polling, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: 5, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
};
WeChatIntegrationComponent.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, id, capabilities, mounted: !!this.element, unreadCount: this.store.getState().unreadCount, portsInitialized: Ports.isInitialized(), metrics: this._metrics };
};
var wechat_integration_default = WeChatIntegrationComponent;
export {
  MODULE_ID,
  VERSION,
  WeChatIntegrationComponent,
  capabilities,
  wechat_integration_default as default,
  getPorts,
  id,
  injectPorts
};
