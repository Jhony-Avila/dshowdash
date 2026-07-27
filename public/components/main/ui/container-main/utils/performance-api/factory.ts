// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: factory
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../logger.js
//   MODULE_ID, METRIC_CATEGORIES from ./constants.js
//   createState, resetState from ./state.js
//   observeWebVitals, getWebVitals, getWebVitalsRating from ./web-vitals.js
//   startTiming as doStartTiming, endTiming as doEndTiming, measure as doMeasure ...
//   recordRender as doRecordRender, getRenderStats from ./render.js
//   recordLoad as doRecordLoad, getLoadStats from ./load.js
//   increment, decrement, getCounter, setGauge, getGauge, recordHistogram, getHis...
//   getAllMetrics, getHistory, exportJSON, getMemoryInfo, getNavigationTiming, ge...
//   healthCheck as doHealthCheck, info as doInfo from ./health.js
//
// PROVIDES:
//   createPerformanceAPI() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Performance API - Factory
 * @module performance-api/factory
 */
'use strict';

import { createLogger } from '../logger.js';
import { MODULE_ID, METRIC_CATEGORIES } from './constants.js';
import { createState, resetState } from './state.js';
import { observeWebVitals, getWebVitals, getWebVitalsRating } from './web-vitals.js';
import { startTiming as doStartTiming, endTiming as doEndTiming, measure as doMeasure } from './timing.js';
import { recordRender as doRecordRender, getRenderStats } from './render.js';
import { recordLoad as doRecordLoad, getLoadStats } from './load.js';
import { increment, decrement, getCounter, setGauge, getGauge, recordHistogram, getHistogramStats } from './metrics.js';
import { getAllMetrics, getHistory, exportJSON, getMemoryInfo, getNavigationTiming, getBootMetricsReport } from './aggregate.js';
import { healthCheck as doHealthCheck, info as doInfo } from './health.js';

export const VERSION = '1.0.0';

export function createPerformanceAPI(options: Record<string, unknown> = {}) {
  const {
    sampleRate = 1.0,
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
    startTiming(name: string, category = METRIC_CATEGORIES.CUSTOM) {
      doStartTiming(_state, name, category);
      return this;
    },
    endTiming(name: string) {
      return doEndTiming(_state, name, _logger, (debug as boolean));
    },
    async measure(name: string, fn: (...args: unknown[]) => void, category = METRIC_CATEGORIES.CUSTOM) {
      return doMeasure(_state, name, fn, category, _logger, (debug as boolean));
    },
    recordRender(duration: number, panelId: string | null = null) {
      doRecordRender(_state, sampleRate, duration, panelId);
    },
    getRenderStats() {
      return getRenderStats(_state);
    },
    recordLoad(duration: number, resourceId: string | null = null, success = true) {
      doRecordLoad(_state, sampleRate, duration, resourceId, success);
    },
    getLoadStats() {
      return getLoadStats(_state);
    },
    increment(name: string, value = 1) {
      return increment(_state, name, value);
    },
    decrement(name: string, value = 1) {
      return decrement(_state, name, value);
    },
    getCounter(name: string) {
      return getCounter(_state, name);
    },
    setGauge(name: string, value: unknown) {
      setGauge(_state, name, value);
      return this;
    },
    getGauge(name: string) {
      return getGauge(_state, name);
    },
    recordHistogram(name: string, value: unknown) {
      recordHistogram(_state, name, value);
      return this;
    },
    getHistogramStats(name: string) {
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
      _logger.debug('Performance metrics reset');
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
