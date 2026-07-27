import { METRIC_TYPES } from "./constants.js";
import {
  isEnabled,
  getConfig,
  getRegionStore,
  getGlobalMetrics,
  getTimers,
  addSample,
  notifySubscribers
} from "./state.js";
const VERSION = "1.1.0-AAA";
const MODULE_ID = "app-shell.devtools.region-metrics.tracking";
function updateAggregated(region, type, duration) {
  const store = getRegionStore();
  if (!store[region]) return;
  const agg = store[region].aggregated;
  switch (type) {
    case METRIC_TYPES.RENDER:
      agg.renderCount++;
      agg.totalRenderTime += duration || 0;
      agg.avgRenderTime = agg.totalRenderTime / agg.renderCount;
      break;
    case METRIC_TYPES.UPDATE:
      agg.updateCount++;
      agg.totalUpdateTime += duration || 0;
      agg.avgUpdateTime = agg.totalUpdateTime / agg.updateCount;
      break;
    case METRIC_TYPES.VISIBILITY:
      agg.visibilityChanges++;
      break;
    case METRIC_TYPES.INTERACTION:
      agg.interactionCount++;
      break;
    case METRIC_TYPES.ERROR:
      agg.errorCount++;
      getGlobalMetrics().totalErrors++;
      break;
    case METRIC_TYPES.LOAD:
      agg.loadCount++;
      break;
  }
}
function _track(metricType, configKey, region, sampleData, duration) {
  if (!isEnabled()) return;
  const config = getConfig();
  if (configKey && !config[configKey]) return;
  const sample = Object.assign({ type: metricType, timestamp: Date.now() }, sampleData);
  const typeKey = metricType === "visibility" ? "visibility" : metricType;
  addSample(region, typeKey, sample);
  updateAggregated(region, metricType, duration);
  notifySubscribers({
    type: "metric",
    metricType,
    region,
    sample
  });
}
function trackRender(region, duration, context) {
  _track(METRIC_TYPES.RENDER, "trackRenderTime", region, { duration, context: context || {} }, duration);
}
function trackUpdate(region, duration, context) {
  _track(METRIC_TYPES.UPDATE, "trackUpdates", region, { duration, context: context || {} }, duration);
}
function trackVisibility(region, visible, context) {
  _track(METRIC_TYPES.VISIBILITY, "trackVisibility", region, { visible, context: context || {} });
}
function trackInteraction(region, interactionType, context) {
  _track(METRIC_TYPES.INTERACTION, "trackInteractions", region, { interactionType, context: context || {} });
}
function trackError(region, error, context) {
  _track(METRIC_TYPES.ERROR, "trackErrors", region, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null,
    context: context || {}
  });
}
function trackLoad(region, duration, context) {
  _track(METRIC_TYPES.LOAD, null, region, { duration, context: context || {} }, duration);
}
function startTimer(region, type) {
  const timers = getTimers();
  const timerId = `${region}:${type}:${Date.now()}`;
  timers[timerId] = {
    region,
    type,
    startTime: performance.now()
  };
  return timerId;
}
function endTimer(timerId, context) {
  const timers = getTimers();
  const timer = timers[timerId];
  if (!timer) return 0;
  const duration = performance.now() - timer.startTime;
  delete timers[timerId];
  switch (timer.type) {
    case "render":
      trackRender(timer.region, duration, context);
      break;
    case "update":
      trackUpdate(timer.region, duration, context);
      break;
    case "load":
      trackLoad(timer.region, duration, context);
      break;
  }
  return duration;
}
export {
  MODULE_ID,
  VERSION,
  endTimer,
  startTimer,
  trackError,
  trackInteraction,
  trackLoad,
  trackRender,
  trackUpdate,
  trackVisibility
};
