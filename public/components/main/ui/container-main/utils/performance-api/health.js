import { VERSION, MODULE_ID, METRIC_TYPES, METRIC_CATEGORIES } from "./constants.js";
import { getRenderStats } from "./render.js";
import { getLoadStats } from "./load.js";
function healthCheck(state) {
  const renderStats = getRenderStats(state);
  let status = "HEALTHY";
  if (renderStats.avgRenderTime > 100) status = "WARNING";
  if (renderStats.avgRenderTime > 500) status = "DEGRADED";
  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    render: {
      avg: `${renderStats.avgRenderTime.toFixed(2)}ms`,
      p90: `${renderStats.p90?.toFixed(2)}ms`,
      total: renderStats.totalRenders
    },
    load: {
      // @ts-expect-error TS migration - TS2339
      avg: `${state.loadStats.avgLoadTime.toFixed(2)}ms`,
      successRate: getLoadStats(state).successRate
    },
    // @ts-expect-error TS migration - TS2339
    historySize: state.metrics.history.length
  };
}
function info(config) {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    sampleRate: config.sampleRate,
    maxHistorySize: config.maxHistorySize,
    enableWebVitals: config.enableWebVitals,
    metricTypes: Object.keys(METRIC_TYPES),
    categories: Object.keys(METRIC_CATEGORIES)
  };
}
export {
  healthCheck,
  info
};
