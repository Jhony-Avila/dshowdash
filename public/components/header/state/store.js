import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { StateUpdaters } from "./updaters.js";
import { StateSnapshots } from "./snapshots.js";
const VERSION = "5.5.0-P17WI";
const MODULE_ID = "header/state/store";
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
const _debugEnabled = () => _getPort("config")?.app?.debug || false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (_debugEnabled()) logger.debug?.(`[${MODULE_ID}]`, ...args);
};
const getInitialEnvironment = () => {
  if (typeof window !== "undefined" && window.Environment) {
    try {
      const env = window.Environment.get("environment");
      if (env) return env;
    } catch (e) {
    }
  }
  return "PROD";
};
class StateStore {
  // @ts-expect-error strict migration — TS2322
  constructor(logger = null) {
    this.logger = logger;
    this._metrics = { updateCount: 0, subscribeCount: 0, notifyCount: 0, snapshotCount: 0, rollbackCount: 0, lastUpdateAt: null };
    const initialEnv = getInitialEnvironment();
    this._state = { connectivity: { online: true, rttMs: null, lastCheckAt: Date.now(), timeoutCount: 0 }, alerts: { critical: 0, warning: 0, lastCheckAt: null }, sync: { busy: false, status: "idle", lastSyncAt: null, failCount: 0 }, health: { status: "unknown", checks: {}, responseTimeMs: null, degradedReason: null, lastCheckAt: null }, errors: { count: 0, lastError: null, lastErrorAt: null }, environment: initialEnv, scrolled: false, networkQuality: { rtt: null, effectiveType: null, downlink: null, status: "unknown" } };
    this._subscribers = /* @__PURE__ */ new Set();
    this._isNotifying = false;
    this._pendingNotification = false;
    this.updaters = new StateUpdaters(this);
    this.snapshots = new StateSnapshots(10);
    this.snapshots.capture(this._state);
  }
  subscribe(callback) {
    if (typeof callback !== "function") throw new TypeError("Subscriber deve ser uma fun\xE7\xE3o");
    this._subscribers.add(callback);
    this._metrics.subscribeCount++;
    return () => {
      this._subscribers.delete(callback);
    };
  }
  _notifySubscribers() {
    if (this._isNotifying) {
      this._pendingNotification = true;
      return;
    }
    this._isNotifying = true;
    this._metrics.notifyCount++;
    const stateCopy = this.getState();
    this._subscribers.forEach((callback) => {
      try {
        callback(stateCopy);
      } catch (error) {
        _log("error", "Erro no subscriber:", error);
      }
    });
    this._isNotifying = false;
    if (this._pendingNotification) {
      this._pendingNotification = false;
      this._notifySubscribers();
    }
  }
  getState() {
    return JSON.parse(JSON.stringify(this._state));
  }
  updateConnectivity(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    this.updaters.updateConnectivity(data);
  }
  updateAlerts(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    this.updaters.updateAlerts(data);
  }
  updateSync(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    this.updaters.updateSync(data);
  }
  updateHealth(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    this.updaters.updateHealth(data);
  }
  updateErrors(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    this.updaters.updateErrors(data);
  }
  setEnvironment(env) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    this.updaters.setEnvironment(env);
  }
  setScrolled(scrolled) {
    this.updaters.setScrolled(scrolled);
  }
  updateNetworkQuality(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    this.updaters.updateNetworkQuality(data);
  }
  incrementConnectivityTimeout() {
    this.updaters.incrementConnectivityTimeout();
  }
  resetConnectivityTimeout() {
    this.updaters.resetConnectivityTimeout();
  }
  incrementSyncFail() {
    this.updaters.incrementSyncFail();
  }
  resetSyncFail() {
    this.updaters.resetSyncFail();
  }
  clearErrors() {
    this.updaters.clearErrors();
  }
  snapshot() {
    this._metrics.snapshotCount++;
    return this.snapshots.capture(this._state);
  }
  rollback(index = -1) {
    try {
      const previousState = this.snapshots.rollback(index);
      this._state = JSON.parse(JSON.stringify(previousState));
      this._notifySubscribers();
      this._metrics.rollbackCount++;
      _log("info", `Rollback para snapshot ${index}`);
      return true;
    } catch (error) {
      _log("error", "Erro no rollback:", error);
      return false;
    }
  }
  getSnapshots() {
    return this.snapshots.getAll();
  }
  reset() {
    const initialEnv = getInitialEnvironment();
    this._state = { connectivity: { online: true, rttMs: null, lastCheckAt: Date.now(), timeoutCount: 0 }, alerts: { critical: 0, warning: 0, lastCheckAt: null }, sync: { busy: false, status: "idle", lastSyncAt: null, failCount: 0 }, health: { status: "unknown", checks: {}, responseTimeMs: null, degradedReason: null, lastCheckAt: null }, errors: { count: 0, lastError: null, lastErrorAt: null }, environment: initialEnv, scrolled: false, networkQuality: { rtt: null, effectiveType: null, downlink: null, status: "unknown" } };
    this._subscribers.clear();
    this._isNotifying = false;
    this._pendingNotification = false;
    this.snapshots.clear();
    this.snapshots.capture(this._state);
    _log("info", "Store resetado");
  }
  getMetrics() {
    return { subscriberCount: this._subscribers.size, snapshotCount: this.snapshots.getCount(), isNotifying: this._isNotifying, pendingNotification: this._pendingNotification, ...this._metrics };
  }
  healthCheck() {
    const checks = { hasState: !!this._state, hasUpdaters: !!this.updaters, hasSnapshots: !!this.snapshots, notNotifying: !this._isNotifying };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), subscriberCount: this._subscribers.size, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), subscriberCount: this._subscribers.size, metrics: this._metrics, healthCheck: this.healthCheck() };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, subscribeCount: 0, notifyCount: 0, snapshotCount: 0, rollbackCount: 0, lastUpdateAt: null };
  }
}
function getVersion() {
  return VERSION;
}
var store_default = StateStore;
export {
  MODULE_ID,
  StateStore,
  VERSION,
  store_default as default,
  getPorts,
  getVersion,
  injectPorts
};
