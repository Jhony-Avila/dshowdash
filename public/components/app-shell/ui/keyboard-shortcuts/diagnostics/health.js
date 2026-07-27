import { VERSION, MODULE_ID } from "../constants.js";
import {
  getShortcuts,
  getGroups,
  getActiveScope,
  isEnabled,
  getConfig,
  getMetrics as getStateMetrics,
  getSubscribers
} from "../state.js";
import { getGroupList } from "../core/registration.js";
function getMetrics() {
  const metrics = getStateMetrics();
  return {
    triggered: metrics.triggered,
    blocked: metrics.blocked,
    registered: metrics.registered,
    activeShortcuts: getShortcuts().size,
    groups: getGroups().size
  };
}
function healthCheck() {
  const shortcuts = getShortcuts();
  const checks = {
    enabled: isEnabled(),
    hasShortcuts: shortcuts.size > 0,
    noExcessiveShortcuts: shortcuts.size < 100,
    scopeValid: !!getActiveScope()
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed >= 3 ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    activeScope: getActiveScope(),
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: isEnabled(),
    activeScope: getActiveScope(),
    config: Object.assign({}, getConfig()),
    metrics: getMetrics(),
    groups: getGroupList(),
    shortcutCount: getShortcuts().size,
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
