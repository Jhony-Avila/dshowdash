import { VERSION, MODULE_ID } from "./constants.js";
import { state, config, subscribers, metrics, scheduledMaintenance } from "./state.js";
import { getState } from "./core.js";
import { getScheduled } from "./schedule.js";
import { getConfig } from "./config.js";
function getMetrics() {
  return {
    activations: metrics.activations,
    deactivations: metrics.deactivations,
    bypasses: metrics.bypasses,
    currentlyActive: state.active
  };
}
function healthCheck() {
  const checks = {
    stateConsistent: state.active ? !!state.type : !state.type,
    noStaleSchedule: !scheduledMaintenance.value || scheduledMaintenance.value.scheduledFor > Date.now(),
    configValid: typeof config.showBanner === "boolean"
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
    active: state.active,
    type: state.type,
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
    state: getState(),
    scheduled: getScheduled(),
    config: getConfig(),
    metrics: getMetrics(),
    subscriberCount: subscribers.length,
    timestamp: Date.now()
  };
}
export {
  getMetrics,
  healthCheck,
  info
};
