import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { FOOTER_INTENTS } from "/core/runtime/events/catalog/footer.events.js";
import { FOOTER_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "7.1.0-EVENT-CONSTANTS";
const MODULE_ID = "footer.events";
const FOOTER_EVENTS = { REFRESH: "footer:refresh", ROUTE_CHANGED: "footer:route:changed" };
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
const _log = function(level, ...rest) {
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
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const _metrics = {
  initCount: 0,
  attachCount: 0,
  onlineEvents: 0,
  offlineEvents: 0,
  visibilityEvents: 0,
  refreshEvents: 0,
  authEvents: 0,
  intentShow: 0,
  intentHide: 0,
  intentRefresh: 0,
  errors: 0
};
function FooterEvents() {
  this._abortController = null;
  this._handlers = /* @__PURE__ */ new Map();
  this._initialized = false;
  this._attached = false;
  this._eventBus = null;
  this._globalState = null;
  this._appShell = null;
  this._cleanupFns = [];
  this._footerElement = null;
  this._store = null;
  this._callbacks = null;
}
FooterEvents.prototype.init = function(store, callbacks) {
  const self = this;
  callbacks = callbacks || {};
  if (this._initialized) return;
  _metrics.initCount++;
  this._store = store;
  this._callbacks = callbacks;
  this._abortController = new AbortController();
  const signal = this._abortController.signal;
  window.addEventListener("online", () => {
    _metrics.onlineEvents++;
    if (store && store.setOnline) store.setOnline(true);
    if (callbacks.onOnline) callbacks.onOnline();
  }, { signal });
  window.addEventListener("offline", () => {
    _metrics.offlineEvents++;
    if (store && store.setOnline) store.setOnline(false);
    if (callbacks.onOffline) callbacks.onOffline();
  }, { signal });
  document.addEventListener("visibilitychange", () => {
    _metrics.visibilityEvents++;
    if (document.visibilityState === "visible" && callbacks.onVisible) callbacks.onVisible();
  }, { signal });
  const eb = _getPort("eventBus");
  if (eb && eb.on) {
    const unsubLogin = eb.on(AUTH_EVENTS.LOGIN_SUCCESS, () => {
      _metrics.authEvents++;
      self.emit(AUTH_EVENTS.CHANGED, { authenticated: true });
    });
    const unsubLogout = eb.on(AUTH_EVENTS.LOGOUT, () => {
      _metrics.authEvents++;
      self.emit(AUTH_EVENTS.CHANGED, { authenticated: false });
    });
    if (typeof unsubLogin === "function") this._cleanupFns.push(unsubLogin);
    if (typeof unsubLogout === "function") this._cleanupFns.push(unsubLogout);
  }
  this._initialized = true;
  _log("info", "Events initialized");
};
FooterEvents.prototype.attach = function(context) {
  const self = this;
  context = context || {};
  if (this._attached) {
    _log("warn", "Already attached");
    return;
  }
  _metrics.attachCount++;
  const eventBus = context.eventBus || _getPort("eventBus");
  const globalState = context.globalState || _getPort("globalState");
  const appShell = _getPort("appShell");
  try {
    this._eventBus = eventBus;
    this._globalState = globalState;
    this._appShell = appShell;
    if (this._eventBus && this._eventBus.on) {
      const unsubRoute = this._eventBus.on(ROUTER_EVENTS.ROUTE_CHANGED, (data) => {
        self.emit(FOOTER_EVENTS.ROUTE_CHANGED, data);
      });
      if (typeof unsubRoute === "function") this._cleanupFns.push(unsubRoute);
      this._setupIntentsListeners();
    }
    this._attached = true;
    _log("info", `Events attached hasEventBus=${!!eventBus} hasGlobalState=${!!globalState} intentsReady=true`);
  } catch (error) {
    _metrics.errors++;
    _log("error", "Attach failed:", error.message);
  }
};
FooterEvents.prototype._setupIntentsListeners = function() {
  const self = this;
  if (!this._eventBus || !this._eventBus.on) return;
  const unsubShow = this._eventBus.on(FOOTER_INTENTS.SHOW, (data) => {
    _metrics.intentShow++;
    _log("info", "FOOTER_INTENTS.SHOW received", data);
    self._handleShowIntent(data);
  });
  if (typeof unsubShow === "function") this._cleanupFns.push(unsubShow);
  const unsubHide = this._eventBus.on(FOOTER_INTENTS.HIDE, (data) => {
    _metrics.intentHide++;
    _log("info", "FOOTER_INTENTS.HIDE received", data);
    self._handleHideIntent(data);
  });
  if (typeof unsubHide === "function") this._cleanupFns.push(unsubHide);
  const unsubRefresh = this._eventBus.on(FOOTER_INTENTS.REFRESH, (data) => {
    _metrics.intentRefresh++;
    _log("info", "FOOTER_INTENTS.REFRESH received", data);
    self._handleRefreshIntent(data);
  });
  if (typeof unsubRefresh === "function") this._cleanupFns.push(unsubRefresh);
  _log("info", "FOOTER_INTENTS listeners ready");
};
FooterEvents.prototype._handleShowIntent = function(data) {
  data = data || {};
  const footerEl = this._getFooterElement();
  if (!footerEl) {
    _log("warn", "Footer element not found for SHOW intent");
    return;
  }
  footerEl.classList.remove("dsd-footer--hidden");
  footerEl.removeAttribute("aria-hidden");
  footerEl.style.display = "";
  if (this._store && this._store.setState) {
    this._store.setState({ visible: true });
  }
  this.emit(FOOTER_EVENT_NAMES.SHOWN, { reason: data.reason || "intent", timestamp: Date.now() });
  _log("info", "Footer shown via intent");
};
FooterEvents.prototype._handleHideIntent = function(data) {
  data = data || {};
  const footerEl = this._getFooterElement();
  if (!footerEl) {
    _log("warn", "Footer element not found for HIDE intent");
    return;
  }
  footerEl.classList.add("dsd-footer--hidden");
  footerEl.setAttribute("aria-hidden", "true");
  if (this._store && this._store.setState) {
    this._store.setState({ visible: false });
  }
  this.emit(FOOTER_EVENT_NAMES.HIDDEN, { reason: data.reason || "intent", timestamp: Date.now() });
  _log("info", "Footer hidden via intent");
};
FooterEvents.prototype._handleRefreshIntent = function(data) {
  data = data || {};
  _metrics.refreshEvents++;
  this.emit(FOOTER_EVENTS.REFRESH, { timestamp: Date.now(), reason: data.reason || "intent" });
  if (this._callbacks && this._callbacks.onRefresh) {
    this._callbacks.onRefresh(data);
  }
  _log("info", "Footer refresh triggered via intent");
};
FooterEvents.prototype._getFooterElement = function() {
  if (this._footerElement && document.contains(this._footerElement)) {
    return this._footerElement;
  }
  let el = document.querySelector(".dsd-footer");
  if (!el) el = document.querySelector('[data-uarps-region="region:app:footer"]');
  if (!el) el = document.querySelector("#shell-footer-region > footer");
  if (!el) el = document.querySelector("#footer-root > footer");
  if (el) {
    this._footerElement = el;
  }
  return el;
};
FooterEvents.prototype.setFooterElement = function(el) {
  this._footerElement = el;
};
FooterEvents.prototype.on = function(event, handler) {
  const self = this;
  if (!this._handlers.has(event)) this._handlers.set(event, /* @__PURE__ */ new Set());
  this._handlers.get(event).add(handler);
  return () => {
    self.off(event, handler);
  };
};
FooterEvents.prototype.off = function(event, handler) {
  const set = this._handlers.get(event);
  if (set) set.delete(handler);
};
FooterEvents.prototype.emit = function(event, data) {
  const set = this._handlers.get(event);
  if (set) {
    set.forEach((h) => {
      try {
        h(data);
      } catch (e) {
        _metrics.errors++;
        _log("error", "Handler error:", e);
      }
    });
  }
};
FooterEvents.prototype.refresh = function() {
  _metrics.refreshEvents++;
  this.emit(FOOTER_EVENTS.REFRESH, { timestamp: Date.now() });
};
FooterEvents.prototype.cleanup = function() {
  for (let i = 0; i < this._cleanupFns.length; i++) {
    try {
      this._cleanupFns[i]();
    } catch (e) {
    }
  }
  this._cleanupFns = [];
  if (this._abortController) this._abortController.abort();
  this._handlers.clear();
  this._initialized = false;
  this._attached = false;
  this._footerElement = null;
  _log("info", "Events cleanup");
};
FooterEvents.prototype.destroy = function() {
  this.cleanup();
  this._eventBus = null;
  this._globalState = null;
  this._appShell = null;
  this._store = null;
  this._callbacks = null;
  _log("info", "Events destroyed");
};
FooterEvents.prototype.setDebug = (enabled) => {
};
FooterEvents.prototype.getMetrics = () => Object.assign({}, _metrics);
FooterEvents.prototype.info = function() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p0Spec: true,
    intentsReady: this._attached,
    initialized: this._initialized,
    attached: this._attached,
    handlerCount: this._handlers.size,
    hasFooterElement: !!this._footerElement,
    connections: {
      eventBus: !!this._eventBus,
      globalState: !!this._globalState,
      appShell: !!this._appShell
    },
    metrics: this.getMetrics(),
    healthCheck: this.healthCheck(),
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
};
FooterEvents.prototype.healthCheck = function() {
  const ps = Ports.snapshot();
  const checks = {
    initialized: this._initialized,
    attached: this._attached,
    intentsReady: this._attached && !!this._eventBus,
    lowErrors: _metrics.errors < 10,
    hasHandlers: this._handlers.size >= 0,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: _metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    p0Spec: true,
    timestamp: Date.now()
  };
};
const events = new FooterEvents();
var events_default = FooterEvents;
export {
  AUTH_EVENTS,
  FOOTER_EVENTS,
  FooterEvents,
  MODULE_ID,
  VERSION,
  events_default as default,
  events,
  getPorts,
  injectPorts
};
