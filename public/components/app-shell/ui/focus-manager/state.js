const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.focus-manager.state";
const focusHistory = [];
const savedFocus = /* @__PURE__ */ new Map();
const focusTraps = /* @__PURE__ */ new Map();
const focusGuards = /* @__PURE__ */ new Map();
const subscribers = [];
const currentFocus = {
  element: null,
  timestamp: null,
  source: null
};
const config = {
  historyLimit: 50,
  announceOnFocus: true,
  scrollIntoView: true,
  preventScroll: false,
  focusDelay: 0
};
const metrics = {
  focusChanges: 0,
  trapsActivated: 0,
  restores: 0,
  errors: 0
};
function incrementMetric(name) {
  if (metrics[name] !== void 0) {
    metrics[name]++;
  }
}
function notifySubscribers(event, data) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event, data);
    } catch (e) {
    }
  }
}
function resetMetrics() {
  metrics.focusChanges = 0;
  metrics.trapsActivated = 0;
  metrics.restores = 0;
  metrics.errors = 0;
}
function getMetrics() {
  return Object.assign({}, metrics);
}
export {
  MODULE_ID,
  VERSION,
  config,
  currentFocus,
  focusGuards,
  focusHistory,
  focusTraps,
  getMetrics,
  incrementMetric,
  metrics,
  notifySubscribers,
  resetMetrics,
  savedFocus,
  subscribers
};
