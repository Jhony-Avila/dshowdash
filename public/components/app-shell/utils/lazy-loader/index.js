import { VERSION, MODULE_ID, LOAD_STATES } from "./constants.js";
import { getConfig as _getConfig, updateConfig, getSubscribers } from "./state.js";
import { load } from "./core/loader.js";
import { register, unregister, loadMany, preload } from "./core/registry.js";
import { isLoaded, getState, getModule, getModuleInfo, listModules } from "./queries/module-queries.js";
import { invalidate, invalidateAll } from "./cache/invalidation.js";
import { getMetrics, healthCheck, info } from "./diagnostics/health.js";
function configure(options) {
  updateConfig(options);
}
function getConfig() {
  const config = _getConfig();
  return {
    timeout: config.timeout,
    retryAttempts: config.retryAttempts,
    retryDelay: config.retryDelay,
    preloadOnIdle: config.preloadOnIdle,
    cacheModules: config.cacheModules
  };
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  const subscribers = getSubscribers();
  subscribers.push(callback);
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}
var lazy_loader_default = {
  VERSION,
  MODULE_ID,
  LOAD_STATES,
  register,
  unregister,
  load,
  loadMany,
  preload,
  isLoaded,
  getState,
  getModule,
  getModuleInfo,
  listModules,
  invalidate,
  invalidateAll,
  configure,
  getConfig,
  subscribe,
  getMetrics,
  healthCheck,
  info
};
export {
  LOAD_STATES,
  MODULE_ID,
  VERSION,
  configure,
  lazy_loader_default as default,
  getConfig,
  getMetrics,
  getModule,
  getModuleInfo,
  getState,
  healthCheck,
  info,
  invalidate,
  invalidateAll,
  isLoaded,
  listModules,
  load,
  loadMany,
  preload,
  register,
  subscribe,
  unregister
};
