import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as validators from "./validators.js";
const VERSION = "5.4.0-P17WI";
const MODULE_ID = "header/state/updaters";
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
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    logger.error?.(prefix, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(prefix, ...args);
    return;
  }
  if (level === "info") {
    logger.info?.(prefix, ...args);
    return;
  }
  if (_debugEnabled()) logger.debug?.(prefix, ...args);
};
class StateUpdaters {
  constructor(store) {
    this.store = store;
    this._debug = false;
    this._metrics = { updateCount: 0, lastUpdateAt: null };
  }
  updateConnectivity(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    const validated = validators.validateConnectivity(data);
    this.store._state.connectivity = { ...this.store._state.connectivity, ...validated };
    this.store._notifySubscribers();
  }
  updateAlerts(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    const validated = validators.validateAlerts(data);
    this.store._state.alerts = { ...this.store._state.alerts, ...validated };
    this.store._notifySubscribers();
  }
  updateSync(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    const validated = validators.validateSync(data);
    this.store._state.sync = { ...this.store._state.sync, ...validated };
    this.store._notifySubscribers();
  }
  updateHealth(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    const validated = validators.validateHealth(data);
    this.store._state.health = { ...this.store._state.health, ...validated };
    this.store._notifySubscribers();
  }
  updateErrors(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    const validated = validators.validateErrors(data);
    this.store._state.errors = { ...this.store._state.errors, ...validated };
    this.store._notifySubscribers();
  }
  setEnvironment(env) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    const validated = validators.validateEnvironment(env);
    this.store._state.environment = validated;
    this.store._notifySubscribers();
  }
  setScrolled(scrolled) {
    const validated = validators.validateScrolled(scrolled);
    if (this.store._state.scrolled !== validated) {
      this.store._state.scrolled = validated;
      this.store._notifySubscribers();
    }
  }
  updateNetworkQuality(data) {
    this._metrics.updateCount++;
    this._metrics.lastUpdateAt = Date.now();
    const validated = validators.validateNetworkQuality(data);
    this.store._state.networkQuality = { ...this.store._state.networkQuality, ...validated };
    this.store._notifySubscribers();
  }
  incrementConnectivityTimeout() {
    this.store._state.connectivity.timeoutCount += 1;
    this.store._notifySubscribers();
  }
  resetConnectivityTimeout() {
    this.store._state.connectivity.timeoutCount = 0;
    this.store._notifySubscribers();
  }
  incrementSyncFail() {
    this.store._state.sync.failCount += 1;
    this.store._notifySubscribers();
  }
  resetSyncFail() {
    this.store._state.sync.failCount = 0;
    this.store._notifySubscribers();
  }
  clearErrors() {
    this.store._state.errors = { count: 0, lastError: null, lastErrorAt: null };
    this.store._notifySubscribers();
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { updateCount: 0, lastUpdateAt: null };
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { hasStore: !!this.store, hasValidators: !!validators, loggerAvailable: !!logger };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
  }
}
function getVersion() {
  return VERSION;
}
var updaters_default = StateUpdaters;
export {
  MODULE_ID,
  StateUpdaters,
  VERSION,
  updaters_default as default,
  getPorts,
  getVersion,
  injectPorts
};
