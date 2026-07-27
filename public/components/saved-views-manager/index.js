import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { SAVED_VIEWS_EVENTS } from "/core/runtime/events/catalog/saved-views.events.js";
import { VERSION as MODULE_ID, VIEW_TYPES, createMetrics, logger } from "./config.js";
import * as state from "./state.js";
import * as api from "./api.js";
import * as helpers from "./helpers.js";
const VERSION = "2.8.0-P2-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => {
  Ports.init();
};
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _isDebugEnabled = () => {
  const cfg = _getPort("config");
  return !!cfg?.app?.debug;
};
let _metrics = createMetrics();
const _listeners = /* @__PURE__ */ new Map();
const emit = (event, data) => {
  const shortName = typeof event === "string" && event.indexOf("saved-views:") === 0 ? event.replace("saved-views:", "") : event;
  if (_listeners.has(shortName)) {
    for (const fn of _listeners.get(shortName)) {
      try {
        fn(data);
      } catch (e) {
        logger.error("Listener error:", { e });
      }
    }
  }
  const eb = _getPort("eventBus");
  if (eb && typeof eb.emit === "function") {
    const fullEvent = typeof event === "string" && event.indexOf("saved-views:") === 0 ? event : `saved-views:${event}`;
    eb.emit(fullEvent, data);
  }
};
const on = (event, callback) => {
  if (!_listeners.has(event)) _listeners.set(event, /* @__PURE__ */ new Set());
  _listeners.get(event).add(callback);
  return () => {
    _listeners.get(event).delete(callback);
  };
};
const off = (event, callback) => {
  if (_listeners.has(event)) {
    if (callback) _listeners.get(event).delete(callback);
    else _listeners.delete(event);
  }
};
const trackTelemetry = (action, data = {}) => {
  _metrics.lastActivity = Date.now();
  const tt = _getPort("telemetryTracker");
  if (tt && typeof tt.track === "function") {
    tt.track(`${MODULE_ID}:${action}`, { timestamp: Date.now(), ...data });
  }
};
const list = (options = {}) => api.list(options, state, _metrics, trackTelemetry, emit);
const get = (idOrKey) => api.get(idOrKey, trackTelemetry, emit);
const getTypes = () => api.getTypes(state, trackTelemetry);
const create = (viewData) => api.create(viewData, list, _metrics, trackTelemetry, emit);
const update = (viewId, updates) => api.update(viewId, updates, list, _metrics, trackTelemetry, emit);
const setDefault = (viewId) => api.setDefault(viewId, state, trackTelemetry, emit);
const remove = (viewId) => api.remove(viewId, state, _metrics, trackTelemetry, emit);
const apply = (viewId) => helpers.apply(viewId, get, _metrics, trackTelemetry, emit);
const saveCurrentView = (key, label, type, config, options = {}) => helpers.saveCurrentView(key, label, type, config, options, create);
const init = () => {
  if (state.isInitialized()) return Promise.resolve(true);
  _initPorts();
  api.createAbortController();
  return list().then(() => {
    state.setInitialized(true);
    trackTelemetry("ready", { viewsCount: state.getViews().length });
    emit(SAVED_VIEWS_EVENTS.READY, { initialized: true, viewsCount: state.getViews().length });
    logger.info(`${VERSION} initialized with ${state.getViews().length} views`);
    return true;
  }).catch((error) => {
    logger.error("Init error:", { error });
    emit(SAVED_VIEWS_EVENTS.ERROR, { action: "init", error: error.message });
    return false;
  });
};
const destroy = () => {
  api.abortAll();
  _listeners.clear();
  state.reset();
  logger.info("Destroyed");
};
const reset = () => {
  destroy();
  _metrics = createMetrics();
  logger.info("Reset complete");
};
const healthCheck = () => {
  const checks = { initialized: state.isInitialized(), hasViews: state.getViews().length >= 0, abortControllerActive: !!api.getAbortController() && !api.getAbortController().signal.aborted, lowErrorRate: _metrics.errorCount < (_metrics.listCount + _metrics.createCount) * 0.1 || _metrics.listCount === 0, portsInitialized: Ports.isInitialized() };
  let passed = 0, total = 0;
  for (const key of Object.keys(checks)) {
    total++;
    if (checks[key]) passed++;
  }
  const status = passed === total ? "HEALTHY" : passed >= total * 0.5 ? "DEGRADED" : "UNHEALTHY";
  return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
const getStatus = () => ({ name: MODULE_ID, version: VERSION, initialized: state.isInitialized(), viewsCount: state.getViews().length, ownedCount: state.getOwned().length, sharedCount: state.getShared().length, viewTypesCount: state.getViewTypes().length, metrics: { ..._metrics }, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() });
const info = () => ({ version: VERSION, moduleId: MODULE_ID, initialized: state.isInitialized(), portsInitialized: Ports.isInitialized(), viewsCount: state.getViews().length, ownedCount: state.getOwned().length, sharedCount: state.getShared().length, metrics: { ..._metrics } });
const getMetrics = () => ({ ..._metrics });
const SavedViewsManager = {
  init,
  destroy,
  reset,
  list,
  get,
  getTypes,
  create,
  update,
  setDefault,
  remove,
  apply,
  on,
  off,
  getByType: state.getByType,
  getDefault: state.getDefault,
  getShared: state.getShared,
  getOwned: state.getOwned,
  getViewById: state.getViewById,
  getViewByKey: state.getViewByKey,
  saveCurrentView,
  getViews: state.getViews,
  getViewTypes: state.getViewTypes,
  isInitialized: state.isInitialized,
  healthCheck,
  getStatus,
  info,
  getMetrics,
  getVersion: () => VERSION,
  injectPorts,
  getPorts,
  VIEW_TYPES,
  VERSION,
  MODULE_ID
};
if (typeof window !== "undefined") {
  window.__dev = window.__dev || {};
  window.__dev.savedViewsManager = SavedViewsManager;
  if (!isStrict()) {
    window.SavedViewsManager = SavedViewsManager;
  } else {
    Object.defineProperty(window, "SavedViewsManager", {
      get() {
        recordViolation("WINDOW_ACCESS", { module: MODULE_ID, property: "SavedViewsManager", access: "global-access" });
        return SavedViewsManager;
      },
      configurable: true
    });
  }
}
var saved_views_manager_default = SavedViewsManager;
export {
  MODULE_ID,
  SavedViewsManager,
  VERSION,
  VIEW_TYPES,
  saved_views_manager_default as default,
  getPorts,
  injectPorts
};
