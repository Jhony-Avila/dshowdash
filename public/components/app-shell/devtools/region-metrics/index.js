import { VERSION, MODULE_ID, METRIC_TYPES } from "./constants.js";
import {
  getRegionStore,
  getSubscribers,
  isEnabled,
  setEnabled,
  getTrackingStartedAt,
  setTrackingStartedAt,
  getTimers,
  getConfig,
  getGlobalMetrics,
  resetAll,
  resetRegion,
  configure,
  addSubscriber
} from "./state.js";
import {
  trackRender,
  trackUpdate,
  trackVisibility,
  trackInteraction,
  trackError,
  trackLoad,
  startTimer,
  endTimer
} from "./tracking.js";
function getRegionMetrics(region) {
  const store = getRegionStore();
  if (!store[region]) return null;
  const metrics = store[region];
  return {
    region,
    aggregated: Object.assign({}, metrics.aggregated),
    samples: {
      renders: metrics.renders.length,
      updates: metrics.updates.length,
      visibility: metrics.visibility.length,
      interactions: metrics.interactions.length,
      errors: metrics.errors.length,
      loads: metrics.loads.length
    },
    recentRenders: metrics.renders.slice(-10),
    recentUpdates: metrics.updates.slice(-10),
    recentErrors: metrics.errors.slice(-5)
  };
}
function getAllMetrics() {
  const store = getRegionStore();
  const result = {};
  const regions = Object.keys(store);
  for (let i = 0; i < regions.length; i++) {
    result[regions[i]] = getRegionMetrics(regions[i]);
  }
  return result;
}
function getPerformanceSummary() {
  const store = getRegionStore();
  const summary = {
    regions: {},
    totals: { renders: 0, updates: 0, errors: 0, interactions: 0, avgRenderTime: 0, avgUpdateTime: 0 },
    slowestRegion: null,
    mostActiveRegion: null,
    mostErrorsRegion: null
  };
  let totalRenderTime = 0;
  let totalUpdateTime = 0;
  let maxActivity = 0;
  let maxErrors = 0;
  let maxRenderTime = 0;
  const regions = Object.keys(store);
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const agg = store[region].aggregated;
    summary.regions[region] = {
      renders: agg.renderCount,
      updates: agg.updateCount,
      errors: agg.errorCount,
      interactions: agg.interactionCount,
      avgRenderTime: Math.round(agg.avgRenderTime * 100) / 100,
      avgUpdateTime: Math.round(agg.avgUpdateTime * 100) / 100
    };
    summary.totals.renders += agg.renderCount;
    summary.totals.updates += agg.updateCount;
    summary.totals.errors += agg.errorCount;
    summary.totals.interactions += agg.interactionCount;
    totalRenderTime += agg.totalRenderTime;
    totalUpdateTime += agg.totalUpdateTime;
    const activity = agg.renderCount + agg.updateCount + agg.interactionCount;
    if (activity > maxActivity) {
      maxActivity = activity;
      summary.mostActiveRegion = region;
    }
    if (agg.errorCount > maxErrors) {
      maxErrors = agg.errorCount;
      summary.mostErrorsRegion = region;
    }
    if (agg.avgRenderTime > maxRenderTime) {
      maxRenderTime = agg.avgRenderTime;
      summary.slowestRegion = region;
    }
  }
  if (summary.totals.renders > 0) summary.totals.avgRenderTime = Math.round(totalRenderTime / summary.totals.renders * 100) / 100;
  if (summary.totals.updates > 0) summary.totals.avgUpdateTime = Math.round(totalUpdateTime / summary.totals.updates * 100) / 100;
  return summary;
}
function getProblematicRegions(thresholds) {
  thresholds = thresholds || { maxAvgRenderTime: 100, maxErrors: 5 };
  const store = getRegionStore();
  const problems = [];
  const regions = Object.keys(store);
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const agg = store[region].aggregated;
    const issues = [];
    if (agg.avgRenderTime > thresholds.maxAvgRenderTime) {
      issues.push({ type: "slow-render", value: agg.avgRenderTime, threshold: thresholds.maxAvgRenderTime });
    }
    if (agg.errorCount > thresholds.maxErrors) {
      issues.push({ type: "high-errors", value: agg.errorCount, threshold: thresholds.maxErrors });
    }
    if (issues.length > 0) {
      problems.push({ region, issues });
    }
  }
  return problems;
}
function enable() {
  setEnabled(true);
  if (!getTrackingStartedAt()) setTrackingStartedAt(Date.now());
}
function disable() {
  setEnabled(false);
}
function getMetrics() {
  const gm = getGlobalMetrics();
  const started = getTrackingStartedAt();
  return {
    global: Object.assign({}, gm, { trackingDuration: started ? Date.now() - started : 0 }),
    byRegion: getAllMetrics()
  };
}
function healthCheck() {
  const problems = getProblematicRegions();
  const gm = getGlobalMetrics();
  const checks = {
    enabled: isEnabled(),
    trackingActive: !!getTrackingStartedAt(),
    noProblematicRegions: problems.length === 0,
    lowErrorRate: gm.totalErrors < 50
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return {
    status: passed === keys.length ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${passed}/${keys.length}`,
    checks,
    problematicRegions: problems.length > 0 ? problems : null,
    summary: getPerformanceSummary(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const gm = getGlobalMetrics();
  const started = getTrackingStartedAt();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: isEnabled(),
    trackingStartedAt: started,
    trackingDuration: started ? Date.now() - started : 0,
    trackedRegions: Object.keys(getRegionStore()),
    config: Object.assign({}, getConfig()),
    globalMetrics: Object.assign({}, gm),
    summary: getPerformanceSummary(),
    subscriberCount: getSubscribers().length,
    activeTimers: Object.keys(getTimers()).length,
    timestamp: Date.now()
  };
}
var region_metrics_default = {
  VERSION,
  MODULE_ID,
  METRIC_TYPES,
  trackRender,
  trackUpdate,
  trackVisibility,
  trackInteraction,
  trackError,
  trackLoad,
  startTimer,
  endTimer,
  getRegionMetrics,
  getAllMetrics,
  getPerformanceSummary,
  getProblematicRegions,
  enable,
  disable,
  isEnabled,
  reset: resetAll,
  resetRegion,
  configure,
  getConfig,
  subscribe: addSubscriber,
  getMetrics,
  healthCheck,
  info
};
export {
  METRIC_TYPES,
  MODULE_ID,
  VERSION,
  configure,
  region_metrics_default as default,
  disable,
  enable,
  endTimer,
  getAllMetrics,
  getConfig,
  getMetrics,
  getPerformanceSummary,
  getProblematicRegions,
  getRegionMetrics,
  healthCheck,
  info,
  isEnabled,
  resetAll as reset,
  resetRegion,
  startTimer,
  addSubscriber as subscribe,
  trackError,
  trackInteraction,
  trackLoad,
  trackRender,
  trackUpdate,
  trackVisibility
};
