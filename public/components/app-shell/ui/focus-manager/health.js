import { VERSION, MODULE_ID } from "./constants.js";
import { focusHistory, savedFocus, focusTraps, focusGuards, subscribers, config, metrics } from "./state.js";
import { getConfig } from "./config.js";
import { getActiveTraps } from "./trap.js";
import { getSavedFocusKeys } from "./persistence.js";
function getMetrics() {
  return {
    focusChanges: metrics.focusChanges,
    trapsActivated: metrics.trapsActivated,
    restores: metrics.restores,
    activeTraps: focusTraps.size,
    activeGuards: focusGuards.size,
    savedFocusCount: savedFocus.size,
    historySize: focusHistory.length
  };
}
function healthCheck() {
  const checks = {
    noExcessiveTraps: focusTraps.size <= 5,
    noExcessiveGuards: focusGuards.size <= 10,
    historyNotFull: focusHistory.length < config.historyLimit
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${keys.length}`,
    checks,
    metrics: getMetrics(),
    currentFocus: document.activeElement?.tagName,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    metrics: getMetrics(),
    activeTraps: getActiveTraps(),
    savedFocusKeys: getSavedFocusKeys(),
    currentFocus: document.activeElement?.tagName,
    subscriberCount: subscribers.length,
    timestamp: Date.now()
  };
}
export {
  getMetrics,
  healthCheck,
  info
};
