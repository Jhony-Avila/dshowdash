import { VERSION, MODULE_ID, FOCUSABLE_SELECTORS } from "../constants.js";
import { getConfig, getStateSnapshot, getMetricsData, isTrapped, getTrapElement } from "../state.js";
function healthCheck() {
  const config = getConfig();
  const trapped = isTrapped();
  const trapElement = getTrapElement();
  const checks = {
    enabled: config.enabled,
    documentAvailable: typeof document !== "undefined",
    noStuckTrap: !trapped || !!trapElement
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  const total = keys.length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    state: getStateSnapshot(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function getMetrics() {
  return getMetricsData();
}
function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: config.enabled,
    config: Object.assign({}, config),
    state: getStateSnapshot(),
    metrics: getMetricsData(),
    focusableSelectors: FOCUSABLE_SELECTORS,
    timestamp: Date.now()
  };
}
var health_default = {
  healthCheck,
  getMetrics,
  info
};
export {
  health_default as default,
  getMetrics,
  healthCheck,
  info
};
