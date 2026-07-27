import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const MODULE_ID = "components.router.state.store";
const VERSION = "2.4.0-P18EC";
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
const _state = {
  initialized: false,
  currentRoute: null,
  previousRoute: null,
  params: {},
  query: {},
  meta: {},
  isNavigating: false,
  history: [],
  virtualRoute: null,
  attemptedRoute: null,
  attemptedOptions: null,
  error: null
};
let _subscribers = [];
const _metrics = { updates: 0, notifications: 0 };
function _emit(eventName, data) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {}));
}
function _notify() {
  _metrics.notifications++;
  const snapshot = getState();
  for (let i = 0; i < _subscribers.length; i++) {
    try {
      _subscribers[i](snapshot);
    } catch (e) {
    }
  }
}
function getState() {
  return { currentRoute: _state.currentRoute, previousRoute: _state.previousRoute, params: Object.assign({}, _state.params), query: Object.assign({}, _state.query), meta: Object.assign({}, _state.meta), isNavigating: _state.isNavigating, virtualRoute: _state.virtualRoute, error: _state.error };
}
function setRoute(route, params, query, meta) {
  _metrics.updates++;
  _state.previousRoute = _state.currentRoute;
  _state.currentRoute = route;
  _state.params = params || {};
  _state.query = query || {};
  _state.meta = meta || {};
  _state.history.push({ route, params, query, timestamp: Date.now() });
  if (_state.history.length > 50) _state.history.shift();
  _emit(ROUTER_EVENTS.STATE_CHANGED, getState());
  _notify();
  return { ok: true };
}
function setCurrentRoute(route) {
  return setRoute(route, route ? route.params : {}, route ? route.query : {}, route ? route.meta : {});
}
function setNavigating(isNavigating2) {
  _state.isNavigating = isNavigating2;
  _emit(ROUTER_EVENTS.STATE_NAVIGATING, { isNavigating: isNavigating2 });
  return { ok: true };
}
function setVirtualRoute(virtualRoute) {
  _state.virtualRoute = virtualRoute;
  _emit(ROUTER_EVENTS.VIRTUAL_ROUTE_CHANGED, { virtualRoute });
  return { ok: true };
}
function getVirtualRoute() {
  return _state.virtualRoute;
}
function setAttemptedRoute(path, options) {
  _state.attemptedRoute = path;
  _state.attemptedOptions = options || null;
  return { ok: true };
}
function getAttemptedRoute() {
  return _state.attemptedRoute ? { path: _state.attemptedRoute, options: _state.attemptedOptions } : null;
}
function clearAttemptedRoute() {
  _state.attemptedRoute = null;
  _state.attemptedOptions = null;
  return { ok: true };
}
function setError(error) {
  _state.error = error;
  return { ok: true };
}
function getError() {
  return _state.error;
}
function clearError() {
  _state.error = null;
  return { ok: true };
}
function getParams() {
  return Object.assign({}, _state.params);
}
function getQuery() {
  return Object.assign({}, _state.query);
}
function getMeta() {
  return Object.assign({}, _state.meta);
}
function getCurrentRoute() {
  return _state.currentRoute;
}
function getPreviousRoute() {
  return _state.previousRoute;
}
function getHistory() {
  return _state.history.slice();
}
function isNavigating() {
  return _state.isNavigating;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _subscribers.push(callback);
  return () => {
    const idx = _subscribers.indexOf(callback);
    if (idx >= 0) _subscribers.splice(idx, 1);
  };
}
function reset() {
  _state.currentRoute = null;
  _state.previousRoute = null;
  _state.params = {};
  _state.query = {};
  _state.meta = {};
  _state.isNavigating = false;
  _state.history = [];
  _state.virtualRoute = null;
  _state.attemptedRoute = null;
  _state.attemptedOptions = null;
  _state.error = null;
  _notify();
  return { ok: true };
}
function init(ctx) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}
function cleanup() {
  _subscribers = [];
  reset();
  _state.initialized = false;
  return { ok: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: "info" }, hasRoute: { ok: !!_state.currentRoute, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, currentRoute: _state.currentRoute, isNavigating: _state.isNavigating, historyLength: _state.history.length, subscribersCount: _subscribers.length, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function createVirtualRoute(config) {
  if (!config) return null;
  return {
    view: config.view || null,
    tab: config.tab || null,
    section: config.section || null,
    entity: config.entity || null,
    id: config.id || null,
    mode: config.mode || "default",
    page: config.page || null,
    sort: config.sort || null,
    filters: config.filters || null,
    panelId: config.panelId || null,
    panelIds: config.panelIds || [],
    params: config.params || {},
    timestamp: Date.now()
  };
}
const routerStore = {
  MODULE_ID,
  VERSION,
  init,
  cleanup,
  getState,
  setRoute,
  setCurrentRoute,
  setNavigating,
  setVirtualRoute,
  getVirtualRoute,
  setAttemptedRoute,
  getAttemptedRoute,
  clearAttemptedRoute,
  setError,
  getError,
  clearError,
  getParams,
  getQuery,
  getMeta,
  getCurrentRoute,
  getPreviousRoute,
  getHistory,
  isNavigating,
  subscribe,
  reset,
  healthCheck,
  info,
  getMetrics,
  injectPorts,
  getPorts
};
var store_default = routerStore;
export {
  MODULE_ID,
  VERSION,
  cleanup,
  clearAttemptedRoute,
  clearError,
  createVirtualRoute,
  store_default as default,
  getAttemptedRoute,
  getCurrentRoute,
  getError,
  getHistory,
  getMeta,
  getMetrics,
  getParams,
  getPorts,
  getPreviousRoute,
  getQuery,
  getState,
  getVirtualRoute,
  healthCheck,
  info,
  init,
  injectPorts,
  isNavigating,
  reset,
  routerStore,
  setAttemptedRoute,
  setCurrentRoute,
  setError,
  setNavigating,
  setRoute,
  setVirtualRoute,
  subscribe
};
