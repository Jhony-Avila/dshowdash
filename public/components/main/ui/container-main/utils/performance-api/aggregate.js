import { getBootMetrics } from "../../core/boot-metrics.js";
import { getRenderStats } from "./render.js";
import { getLoadStats } from "./load.js";
import { getWebVitalsRating } from "./web-vitals.js";
import { getHistogramStats } from "./metrics.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.performance-api.aggregate";
function getMemoryInfo() {
  const perf = performance;
  if (perf.memory) {
    return {
      usedJSHeapSize: perf.memory.usedJSHeapSize,
      totalJSHeapSize: perf.memory.totalJSHeapSize,
      jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
      usagePercent: `${(perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit * 100).toFixed(1)}%`
    };
  }
  return null;
}
function getNavigationTiming() {
  if (!performance.getEntriesByType) return null;
  const navEntry = performance.getEntriesByType("navigation")[0];
  if (!navEntry) return null;
  return {
    dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
    tcp: navEntry.connectEnd - navEntry.connectStart,
    ssl: navEntry.secureConnectionStart > 0 ? navEntry.connectEnd - navEntry.secureConnectionStart : 0,
    ttfb: navEntry.responseStart - navEntry.requestStart,
    download: navEntry.responseEnd - navEntry.responseStart,
    domInteractive: navEntry.domInteractive,
    domComplete: navEntry.domComplete,
    loadComplete: navEntry.loadEventEnd
  };
}
function getBootMetricsReport() {
  const bootMetrics = getBootMetrics();
  return bootMetrics.getReport();
}
function getAllMetrics(state) {
  return {
    render: getRenderStats(state),
    load: getLoadStats(state),
    webVitals: getWebVitalsRating(state),
    memory: getMemoryInfo(),
    navigation: getNavigationTiming(),
    boot: getBootMetricsReport(),
    // @ts-expect-error TS migration - TS2769
    counters: Object.fromEntries(state.metrics.counters),
    // @ts-expect-error TS migration - TS2769
    gauges: Object.fromEntries(state.metrics.gauges),
    histograms: Object.fromEntries(
      // @ts-expect-error TS migration - TS2339
      Array.from(state.metrics.histograms.entries()).map(([k, v]) => [k, getHistogramStats(state, k)])
    ),
    timings: Object.fromEntries(
      // @ts-expect-error TS migration - TS2339
      Array.from(state.metrics.timings.entries()).map(([k, v]) => [k, {
        count: v.length,
        // @ts-expect-error TS migration - TS2365
        avg: v.reduce((a, b) => a + b, 0) / v.length,
        min: Math.min(...v),
        max: Math.max(...v)
      }])
    )
  };
}
function getHistory(state, limit = 50) {
  return state.metrics.history.slice(0, limit);
}
function exportJSON(state) {
  return JSON.stringify(getAllMetrics(state), null, 2);
}
export {
  MODULE_ID,
  VERSION,
  exportJSON,
  getAllMetrics,
  getBootMetricsReport,
  getHistory,
  getMemoryInfo,
  getNavigationTiming
};
