import { METRIC_TYPES, METRIC_CATEGORIES } from "./constants.js";
import { shouldSample, addToHistory, calculatePercentile } from "./utils.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.performance-api.render";
function recordRender(state, sampleRate, duration, panelId = null) {
  if (!shouldSample(sampleRate)) return;
  state.renderStats.totalRenders++;
  state.renderStats.totalRenderTime += duration;
  state.renderStats.lastRenderTime = duration;
  state.renderStats.avgRenderTime = state.renderStats.totalRenderTime / state.renderStats.totalRenders;
  state.renderStats.minRenderTime = Math.min(state.renderStats.minRenderTime, duration);
  state.renderStats.maxRenderTime = Math.max(state.renderStats.maxRenderTime, duration);
  state.renderStats.renderHistory.push({ duration, panelId, timestamp: Date.now() });
  if (state.renderStats.renderHistory.length > state.maxHistorySize) {
    state.renderStats.renderHistory.shift();
  }
  addToHistory(state, {
    type: METRIC_TYPES.TIMING,
    name: "render",
    category: METRIC_CATEGORIES.RENDER,
    value: duration,
    panelId,
    timestamp: Date.now()
  });
}
function getRenderStats(state) {
  const durations = state.renderStats.renderHistory.map((r) => r.duration);
  return {
    // @ts-expect-error TS migration - TS2698
    ...state.renderStats,
    p50: calculatePercentile(durations, 50),
    p90: calculatePercentile(durations, 90),
    p99: calculatePercentile(durations, 99)
  };
}
export {
  MODULE_ID,
  VERSION,
  getRenderStats,
  recordRender
};
