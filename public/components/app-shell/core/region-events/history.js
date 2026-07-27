import { listeners, globalListeners, eventHistory, historyLimit } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-events.history";
function getHistory(filter) {
  filter = filter || {};
  let result = eventHistory.slice();
  if (filter.region) {
    result = result.filter((e) => e.region === filter.region);
  }
  if (filter.type) {
    result = result.filter((e) => e.type === filter.type);
  }
  if (filter.limit) {
    result = result.slice(-filter.limit);
  }
  return result;
}
function clearHistory() {
  eventHistory.length = 0;
}
function setHistoryLimit(limit) {
  historyLimit.value = Math.max(10, Math.min(1e3, limit));
}
function getListenerCounts() {
  const counts = {};
  const keys = Object.keys(listeners);
  for (let i = 0; i < keys.length; i++) {
    const regionName = keys[i];
    const regionListeners = listeners[regionName];
    let count = 0;
    const eventTypes = Object.keys(regionListeners);
    for (let j = 0; j < eventTypes.length; j++) {
      count += regionListeners[eventTypes[j]].length;
    }
    counts[regionName] = count;
  }
  counts._global = globalListeners.length;
  return counts;
}
export {
  MODULE_ID,
  VERSION,
  clearHistory,
  getHistory,
  getListenerCounts,
  setHistoryLimit
};
