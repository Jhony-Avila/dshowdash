import { MODULE_ID, VERSION, STATE_VERSION } from "./constants.js";
import { enabled, pendingChanges, metrics } from "./state.js";
import { getStorage } from "./storage.js";
function getMetrics() {
  return Object.assign({}, metrics, { pendingChanges: pendingChanges.size });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    stateVersion: STATE_VERSION,
    enabled: enabled.value,
    storageAvailable: !!getStorage(),
    pendingChanges: pendingChanges.size,
    metrics: getMetrics()
  };
}
function healthCheck() {
  const storage = getStorage();
  const checks = {
    enabled: enabled.value,
    storageAvailable: !!storage,
    lowValidationErrors: metrics.validationErrors < 10
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!enabled.value) status = "NOT_INITIALIZED";
  else if (!storage) status = "DEGRADED";
  else if (metrics.validationErrors >= 10) status = "DEGRADED";
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    stateVersion: STATE_VERSION,
    checks,
    metrics,
    timestamp: Date.now()
  };
}
export {
  getMetrics,
  healthCheck,
  info
};
