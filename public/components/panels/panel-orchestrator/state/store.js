import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { SCHEDULER_MODES, HEALTH_STATES } from "../bus/events-map.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-orchestrator.state.store";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug || false;
};
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
  if (_debug() && logger.debug) logger.debug(`[${MODULE_ID}]`, ...args);
};
function createInitialState() {
  return { status: "INITIALIZING", currentPreset: null, previousPreset: null, activePanels: [], registeredModules: /* @__PURE__ */ new Map(), moduleHealth: /* @__PURE__ */ new Map(), schedulerMode: SCHEDULER_MODES.ACTIVE, lastLayoutChange: null, lastHealthCheck: null, errorCount: 0, warningCount: 0, startTime: Date.now(), config: { maxPanels: 6, healthCheckInterval: 3e4, maxRetries: 3, circuitBreakerThreshold: 5 }, metrics: { totalMounts: 0, totalUnmounts: 0, totalErrors: 0, totalPresetChanges: 0, avgMountTime: 0 } };
}
function OrchestratorStore() {
  this.state = createInitialState();
  this.listeners = /* @__PURE__ */ new Set();
  this.history = [];
  this.maxHistory = 50;
  this.initialized = false;
  this.destroyed = false;
}
OrchestratorStore.prototype.getVersion = () => VERSION;
OrchestratorStore.prototype.isInitialized = function() {
  return this.initialized || this.state.status !== "INITIALIZING";
};
OrchestratorStore.prototype.getState = function() {
  return Object.assign({}, this.state);
};
OrchestratorStore.prototype.get = function(key) {
  return this.state[key];
};
OrchestratorStore.prototype.set = function(key, value) {
  const oldValue = this.state[key];
  this.state[key] = value;
  this._recordHistory(key, oldValue, value);
  this._notifyListeners({ key, oldValue, newValue: value });
};
OrchestratorStore.prototype.update = function(updates) {
  const changes = [];
  Object.keys(updates).forEach((key) => {
    const value = updates[key];
    const oldValue = this.state[key];
    this.state[key] = value;
    changes.push({ key, oldValue, newValue: value });
    this._recordHistory(key, oldValue, value);
  });
  this._notifyListeners({ changes });
};
OrchestratorStore.prototype._recordHistory = function(key, oldValue, newValue) {
  this.history.push({ key, oldValue, newValue, timestamp: Date.now() });
  if (this.history.length > this.maxHistory) this.history.shift();
};
OrchestratorStore.prototype._notifyListeners = function(change) {
  this.listeners.forEach((listener) => {
    try {
      listener(change, this.state);
    } catch (error) {
      _log("error", "Listener error:", error);
    }
  });
};
OrchestratorStore.prototype.subscribe = function(listener) {
  if (typeof listener !== "function") return () => {
  };
  this.listeners.add(listener);
  return () => this.listeners.delete(listener);
};
OrchestratorStore.prototype.getListenerCount = function() {
  return this.listeners.size;
};
OrchestratorStore.prototype.setStatus = function(status) {
  this.set("status", status);
  if (status === "READY" || status === "RUNNING") this.initialized = true;
};
OrchestratorStore.prototype.setCurrentPreset = function(preset) {
  this.set("previousPreset", this.state.currentPreset);
  this.set("currentPreset", preset);
  this.state.metrics.totalPresetChanges++;
};
OrchestratorStore.prototype.setActivePanels = function(panels) {
  this.set("activePanels", panels);
  this.set("lastLayoutChange", Date.now());
};
OrchestratorStore.prototype.registerModule = function(id, config) {
  this.state.registeredModules.set(id, config);
  this._notifyListeners({ key: "registeredModules", moduleId: id, action: "register" });
};
OrchestratorStore.prototype.unregisterModule = function(id) {
  this.state.registeredModules.delete(id);
  this.state.moduleHealth.delete(id);
  this._notifyListeners({ key: "registeredModules", moduleId: id, action: "unregister" });
};
OrchestratorStore.prototype.setModuleHealth = function(id, health) {
  this.state.moduleHealth.set(id, { state: health, timestamp: Date.now() });
};
OrchestratorStore.prototype.getModuleHealth = function(id) {
  return this.state.moduleHealth.get(id) || { state: HEALTH_STATES.UNKNOWN, timestamp: null };
};
OrchestratorStore.prototype.setSchedulerMode = function(mode) {
  const values = Object.values(SCHEDULER_MODES);
  if (values.indexOf(mode) !== -1) this.set("schedulerMode", mode);
};
OrchestratorStore.prototype.incrementError = function() {
  this.state.errorCount++;
  this.state.metrics.totalErrors++;
};
OrchestratorStore.prototype.incrementWarning = function() {
  this.state.warningCount++;
};
OrchestratorStore.prototype.recordMount = function(timeMs) {
  this.state.metrics.totalMounts++;
  const total = this.state.metrics.totalMounts;
  const current = this.state.metrics.avgMountTime;
  this.state.metrics.avgMountTime = (current * (total - 1) + timeMs) / total;
};
OrchestratorStore.prototype.recordUnmount = function() {
  this.state.metrics.totalUnmounts++;
};
OrchestratorStore.prototype.getMetrics = function() {
  return Object.assign({}, this.state.metrics);
};
OrchestratorStore.prototype.getHistory = function() {
  return this.history.slice();
};
OrchestratorStore.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, status: this.state.status, listenerCount: this.listeners.size, historyCount: this.history.length, modulesCount: this.state.registeredModules.size, portsInitialized: Ports.isInitialized() };
};
OrchestratorStore.prototype.reset = function() {
  const newState = createInitialState();
  newState.startTime = this.state.startTime;
  this.state = newState;
  this.destroyed = false;
  this._notifyListeners({ key: "reset", action: "full_reset" });
};
OrchestratorStore.prototype.destroy = function() {
  this.listeners.clear();
  this.history = [];
  this.state = createInitialState();
  this.initialized = false;
  this.destroyed = true;
};
OrchestratorStore.prototype.toJSON = function() {
  return Object.assign({ version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }, this.state, { registeredModules: Array.from(this.state.registeredModules.entries()), moduleHealth: Array.from(this.state.moduleHealth.entries()) });
};
const orchestratorStore = new OrchestratorStore();
var store_default = orchestratorStore;
export {
  MODULE_ID,
  OrchestratorStore,
  VERSION,
  store_default as default,
  getPorts,
  injectPorts,
  orchestratorStore
};
