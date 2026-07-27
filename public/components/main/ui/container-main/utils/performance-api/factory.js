import { createLogger } from "../logger.js";
import { MODULE_ID, METRIC_CATEGORIES } from "./constants.js";
import { createState, resetState } from "./state.js";
import { observeWebVitals, getWebVitals, getWebVitalsRating } from "./web-vitals.js";
import { startTiming as doStartTiming, endTiming as doEndTiming, measure as doMeasure } from "./timing.js";
import { recordRender as doRecordRender, getRenderStats } from "./render.js";
import { recordLoad as doRecordLoad, getLoadStats } from "./load.js";
import { increment, decrement, getCounter, setGauge, getGauge, recordHistogram, getHistogramStats } from "./metrics.js";
import { getAllMetrics, getHistory, exportJSON, getMemoryInfo, getNavigationTiming, getBootMetricsReport } from "./aggregate.js";
import { healthCheck as doHealthCheck, info as doInfo } from "./health.js";
const VERSION = "1.0.0";
function createPerformanceAPI(options = {}) {
  const {
    sampleRate = 1,
    maxHistorySize = 100,
    enableWebVitals = true,
    debug = false
  } = options;
  const _logger = createLogger(MODULE_ID);
  const _state = createState(maxHistorySize);
  const _config = { sampleRate, maxHistorySize, enableWebVitals, debug };
  if (enableWebVitals) {
    observeWebVitals(_state, _logger);
  }
  return {
    startTiming(name, category = METRIC_CATEGORIES.CUSTOM) {
      doStartTiming(_state, name, category);
      return this;
    },
    endTiming(name) {
      return doEndTiming(_state, name, _logger, debug);
    },
    async measure(name, fn, category = METRIC_CATEGORIES.CUSTOM) {
      return doMeasure(_state, name, fn, category, _logger, debug);
    },
    recordRender(duration, panelId = null) {
      doRecordRender(_state, sampleRate, duration, panelId);
    },
    getRenderStats() {
      return getRenderStats(_state);
    },
    recordLoad(duration, resourceId = null, success = true) {
      doRecordLoad(_state, sampleRate, duration, resourceId, success);
    },
    getLoadStats() {
      return getLoadStats(_state);
    },
    increment(name, value = 1) {
      return increment(_state, name, value);
    },
    decrement(name, value = 1) {
      return decrement(_state, name, value);
    },
    getCounter(name) {
      return getCounter(_state, name);
    },
    setGauge(name, value) {
      setGauge(_state, name, value);
      return this;
    },
    getGauge(name) {
      return getGauge(_state, name);
    },
    recordHistogram(name, value) {
      recordHistogram(_state, name, value);
      return this;
    },
    getHistogramStats(name) {
      return getHistogramStats(_state, name);
    },
    getWebVitals() {
      return getWebVitals(_state);
    },
    getWebVitalsRating() {
      return getWebVitalsRating(_state);
    },
    getMemoryInfo,
    getNavigationTiming,
    getBootMetrics() {
      return getBootMetricsReport();
    },
    getAllMetrics() {
      return getAllMetrics(_state);
    },
    getHistory(limit = 50) {
      return getHistory(_state, limit);
    },
    reset() {
      resetState(_state);
      _logger.debug("Performance metrics reset");
    },
    exportJSON() {
      return exportJSON(_state);
    },
    healthCheck() {
      return doHealthCheck(_state);
    },
    info() {
      return doInfo(_config);
    }
  };
}
export {
  VERSION,
  createPerformanceAPI
};
