import { VERSION, MODULE_ID, REGION_EVENTS } from "./constants.js";
import { initialized, domListenersAttached, eventHistory, historyLimit, metrics } from "./state.js";
import { getListenerCounts } from "./history.js";
function getMetrics() {
  return {
    eventsEmitted: metrics.eventsEmitted,
    listenersAdded: metrics.listenersAdded,
    listenersRemoved: metrics.listenersRemoved,
    errors: metrics.errors,
    historySize: eventHistory.length
  };
}
function healthCheck() {
  const listenerCounts = getListenerCounts();
  let totalListeners = 0;
  const keys = Object.keys(listenerCounts);
  for (let i = 0; i < keys.length; i++) {
    totalListeners += listenerCounts[keys[i]];
  }
  const checks = {
    initialized: initialized.value,
    domListenersAttached: domListenersAttached.value,
    noErrors: metrics.errors === 0,
    historyNotFull: eventHistory.length < historyLimit.value
  };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let j = 0; j < checkKeys.length; j++) {
    if (checks[checkKeys[j]]) passed++;
  }
  const total = checkKeys.length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${total}`,
    checks,
    totalListeners,
    listenerCounts,
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
    initialized: initialized.value,
    domListenersAttached: domListenersAttached.value,
    eventTypes: REGION_EVENTS,
    listenerCounts: getListenerCounts(),
    historySize: eventHistory.length,
    historyLimit: historyLimit.value,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
export {
  getMetrics,
  healthCheck,
  info
};
