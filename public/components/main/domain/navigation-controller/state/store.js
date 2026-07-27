const MODULE_ID = "navigation-controller-state";
const VERSION = "8.1.0-ABORT-FIX";
const DEFAULT_TIMEOUT_MS = 1e4;
const MAX_INTENT_HISTORY = 20;
function createState() {
  return {
    navigating: false,
    abortController: null,
    timeoutId: null,
    navigationQueue: [],
    currentNavigation: null,
    lastValidNavigation: null,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    intentHistory: [],
    cleanups: [],
    metrics: {
      navigationsCompleted: 0,
      navigationsFailed: 0,
      navigationsCancelled: 0,
      navigationsQueued: 0,
      navigationsTimedOut: 0,
      navigationsBlocked: 0,
      invalidRoutes: 0,
      intentsReceived: 0,
      intentsFromBroker: 0,
      totalNavigationTime: 0,
      avgNavigationTime: 0,
      lastNavigationTime: 0
    }
  };
}
function addToIntentHistory(state, entry) {
  state.intentHistory.unshift(entry);
  if (state.intentHistory.length > MAX_INTENT_HISTORY) {
    state.intentHistory.pop();
  }
}
function updateTimingMetrics(state, navigationTime) {
  const m = state.metrics;
  m.lastNavigationTime = navigationTime;
  m.totalNavigationTime += navigationTime;
  const totalNavigations = m.navigationsCompleted + 1;
  m.avgNavigationTime = Math.round(m.totalNavigationTime / totalNavigations);
}
function cleanup(state) {
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }
  state.navigating = false;
  state.abortController = null;
  state.currentNavigation = null;
}
function resetState(state) {
  state.navigating = false;
  state.abortController = null;
  state.timeoutId = null;
  state.navigationQueue = [];
  state.currentNavigation = null;
  state.intentHistory = [];
}
var store_default = {
  createState,
  addToIntentHistory,
  updateTimingMetrics,
  cleanup,
  resetState,
  DEFAULT_TIMEOUT_MS,
  MAX_INTENT_HISTORY
};
export {
  DEFAULT_TIMEOUT_MS,
  MAX_INTENT_HISTORY,
  MODULE_ID,
  VERSION,
  addToIntentHistory,
  cleanup,
  createState,
  store_default as default,
  resetState,
  updateTimingMetrics
};
