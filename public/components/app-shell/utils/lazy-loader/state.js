import { LOAD_STATES, DEFAULT_CONFIG } from "./constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.lazy-loader.state";
const state = {
  modules: /* @__PURE__ */ new Map(),
  loadPromises: /* @__PURE__ */ new Map(),
  subscribers: [],
  config: {
    timeout: DEFAULT_CONFIG.timeout,
    retryAttempts: DEFAULT_CONFIG.retryAttempts,
    retryDelay: DEFAULT_CONFIG.retryDelay,
    preloadOnIdle: DEFAULT_CONFIG.preloadOnIdle,
    cacheModules: DEFAULT_CONFIG.cacheModules
  },
  metrics: {
    totalLoads: 0,
    successfulLoads: 0,
    failedLoads: 0,
    cachedHits: 0,
    totalLoadTime: 0
  }
};
const cache = state.modules;
const pending = state.loadPromises;
function ModuleEntry(name, loader, options) {
  this.name = name;
  this.loader = loader;
  this.options = options || {};
  this.state = LOAD_STATES.PENDING;
  this.module = null;
  this.error = null;
  this.loadTime = null;
  this.loadedAt = null;
  this.attempts = 0;
}
function getModules() {
  return state.modules;
}
function getModule(name) {
  return state.modules.get(name);
}
function setModule(name, entry) {
  state.modules.set(name, entry);
}
function deleteModule(name) {
  state.modules.delete(name);
}
function hasModule(name) {
  return state.modules.has(name);
}
function getLoadPromises() {
  return state.loadPromises;
}
function getLoadPromise(name) {
  return state.loadPromises.get(name);
}
function setLoadPromise(name, promise) {
  state.loadPromises.set(name, promise);
}
function deleteLoadPromise(name) {
  state.loadPromises.delete(name);
}
function hasLoadPromise(name) {
  return state.loadPromises.has(name);
}
function getSubscribers() {
  return state.subscribers;
}
function getConfig() {
  return state.config;
}
function updateConfig(options) {
  if (options.timeout !== void 0) state.config.timeout = Math.max(1e3, options.timeout);
  if (options.retryAttempts !== void 0) state.config.retryAttempts = Math.max(0, options.retryAttempts);
  if (options.retryDelay !== void 0) state.config.retryDelay = Math.max(100, options.retryDelay);
  if (options.preloadOnIdle !== void 0) state.config.preloadOnIdle = !!options.preloadOnIdle;
  if (options.cacheModules !== void 0) state.config.cacheModules = !!options.cacheModules;
}
function getMetrics() {
  return state.metrics;
}
function incrementMetric(name, value) {
  if (state.metrics[name] !== void 0) {
    state.metrics[name] += value || 1;
  }
}
function notifySubscribers(event) {
  for (let i = 0; i < state.subscribers.length; i++) {
    try {
      state.subscribers[i](event);
    } catch (e) {
    }
  }
}
var state_default = state;
export {
  MODULE_ID,
  ModuleEntry,
  VERSION,
  cache,
  state_default as default,
  deleteLoadPromise,
  deleteModule,
  getConfig,
  getLoadPromise,
  getLoadPromises,
  getMetrics,
  getModule,
  getModules,
  getSubscribers,
  hasLoadPromise,
  hasModule,
  incrementMetric,
  notifySubscribers,
  pending,
  setLoadPromise,
  setModule,
  updateConfig
};
