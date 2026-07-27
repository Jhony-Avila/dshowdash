import { VERSION, MODULE_ID, LOAD_STATES } from "../constants.js";
import { getConfig, getMetrics as getStateMetrics, getSubscribers, getModules } from "../state.js";
import { listModules } from "../queries/module-queries.js";
function getMetrics() {
  const metrics = getStateMetrics();
  const modules = getModules();
  const avgLoadTime = metrics.successfulLoads > 0 ? Math.round(metrics.totalLoadTime / metrics.successfulLoads) : 0;
  let loadedCount = 0;
  modules.forEach((entry) => {
    if (entry.state === LOAD_STATES.LOADED) loadedCount++;
  });
  return {
    totalLoads: metrics.totalLoads,
    successfulLoads: metrics.successfulLoads,
    failedLoads: metrics.failedLoads,
    cachedHits: metrics.cachedHits,
    avgLoadTime,
    registeredModules: modules.size,
    loadedModules: loadedCount
  };
}
function healthCheck() {
  const metrics = getMetrics();
  const moduleList = listModules();
  const errorModules = moduleList.filter((m) => m.state === LOAD_STATES.ERROR);
  const checks = {
    noErrorModules: errorModules.length === 0,
    lowFailureRate: metrics.totalLoads === 0 || metrics.failedLoads / metrics.totalLoads < 0.2,
    goodCacheRate: metrics.totalLoads === 0 || metrics.cachedHits > 0 || metrics.totalLoads < 5
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  let status = "UNHEALTHY";
  if (passed === keys.length) status = "HEALTHY";
  else if (passed >= 1) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${keys.length}`,
    checks,
    metrics,
    errorModules: errorModules.length > 0 ? errorModules : null,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: {
      timeout: config.timeout,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      preloadOnIdle: config.preloadOnIdle,
      cacheModules: config.cacheModules
    },
    metrics: getMetrics(),
    modules: listModules(),
    subscriberCount: getSubscribers().length,
    timestamp: Date.now()
  };
}
var health_default = {
  getMetrics,
  healthCheck,
  info
};
export {
  health_default as default,
  getMetrics,
  healthCheck,
  info
};
