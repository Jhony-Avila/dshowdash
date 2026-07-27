import { VERSION, MODULE_ID, LOAD_STRATEGIES, IMAGE_QUALITY } from "../config/constants.js";
import { getFormatSupport } from "../core/format-detector.js";
function createMetrics() {
  return {
    totalImages: 0,
    loaded: 0,
    errors: 0,
    fromCache: 0,
    totalBytes: 0,
    avgLoadTime: 0,
    loadTimes: []
  };
}
function getMetricsReport(metrics, loader) {
  return {
    ...metrics,
    pending: loader?.getQueueLength() || 0,
    activeLoads: loader?.getActiveLoads() || 0,
    formatSupport: getFormatSupport()
  };
}
function performHealthCheck(metrics, config, loader, observer) {
  const report = getMetricsReport(metrics, loader);
  const errorRate = report.totalImages > 0 ? report.errors / report.totalImages : 0;
  let status = "HEALTHY";
  if (errorRate > 0.3) status = "ERROR";
  else if (errorRate > 0.1) status = "WARNING";
  else if (report.activeLoads >= config.maxConcurrent) status = "BUSY";
  return {
    status,
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: report,
    observerActive: observer?.isActive?.() || false
  };
}
function getInfo(images) {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalImages: images?.size || 0,
    formatSupport: getFormatSupport(),
    strategies: Object.keys(LOAD_STRATEGIES),
    qualities: Object.keys(IMAGE_QUALITY)
  };
}
var metrics_default = { createMetrics, getMetricsReport, performHealthCheck, getInfo };
export {
  createMetrics,
  metrics_default as default,
  getInfo,
  getMetricsReport,
  performHealthCheck
};
