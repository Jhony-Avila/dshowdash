import { METRIC_TYPES, METRIC_CATEGORIES } from "./constants.js";
import { shouldSample, addToHistory, calculatePercentile } from "./utils.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.performance-api.load";
function recordLoad(state, sampleRate, duration, resourceId = null, success = true) {
  if (!shouldSample(sampleRate)) return;
  state.loadStats.totalLoads++;
  if (success) {
    state.loadStats.totalLoadTime += duration;
    state.loadStats.lastLoadTime = duration;
    state.loadStats.avgLoadTime = state.loadStats.totalLoadTime / (state.loadStats.totalLoads - state.loadStats.failedLoads);
  } else {
    state.loadStats.failedLoads++;
  }
  state.loadStats.loadHistory.push({ duration, resourceId, success, timestamp: Date.now() });
  if (state.loadStats.loadHistory.length > state.maxHistorySize) {
    state.loadStats.loadHistory.shift();
  }
  addToHistory(state, {
    type: METRIC_TYPES.TIMING,
    name: "load",
    category: METRIC_CATEGORIES.LOAD,
    value: duration,
    resourceId,
    success,
    timestamp: Date.now()
  });
}
function getLoadStats(state) {
  const durations = state.loadStats.loadHistory.filter((l) => l.success).map((l) => l.duration);
  return {
    // @ts-expect-error TS migration - TS2698
    ...state.loadStats,
    // @ts-expect-error TS migration - TS2365
    successRate: state.loadStats.totalLoads > 0 ? `${((state.loadStats.totalLoads - state.loadStats.failedLoads) / state.loadStats.totalLoads * 100).toFixed(1)}%` : "100%",
    p50: calculatePercentile(durations, 50),
    p90: calculatePercentile(durations, 90),
    p99: calculatePercentile(durations, 99)
  };
}
export {
  MODULE_ID,
  VERSION,
  getLoadStats,
  recordLoad
};
