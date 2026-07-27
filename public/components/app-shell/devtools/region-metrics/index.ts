// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION, MODULE_ID, METRIC_TYPES from ./constants.js
//   getRegionStore, getSubscribers, isEnabled, setEnabled,
//     getTrackingStartedAt, etc from ./state.js
//   trackRender, trackUpdate, trackVisibility,
//     trackInteraction, trackError, trackLoad,
//     startTimer, endTimer from ./tracking.js
//
// PROVIDES:
//   trackRender(), trackUpdate(), trackVisibility(),
//   trackInteraction(), trackError(), trackLoad(),
//   startTimer(), endTimer(), getRegionMetrics(),
//   getAllMetrics(), getPerformanceSummary(),
//   getProblematicRegions(), enable(), disable(),
//   isEnabled(), configure(), subscribe(),
//   reset(), resetRegion(), getConfig(),
//   getMetrics(), healthCheck(), info(),
//   VERSION, MODULE_ID, METRIC_TYPES
// ═══════════════════════════════════════════════════════════════
/**
 * Region Metrics — Orquestrador
 * @module app-shell/devtools/region-metrics
 * @version 1.1.0-P2-ENTERPRISE
 * @description Sprint 8 Fase 2: Melhoria #26 - Métricas por Região (modularizado v1.1.0)
 */
'use strict';

import { VERSION, MODULE_ID, METRIC_TYPES } from './constants.js';
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
} from './state.js';
import {

  trackRender,
  trackUpdate,
  trackVisibility,
  trackInteraction,
  trackError,
  trackLoad,
  startTimer,
  endTimer
} from './tracking.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// ── Getters ─────────────────────────────────────────────────────────

function getRegionMetrics(region: DynObj) {
  const store = getRegionStore();
  if (!(store as DynObj)[region]) return null;

  const metrics = (store as DynObj)[region];
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
    (result as DynObj)[regions[i]] = getRegionMetrics(regions[i]);
  }
  return result;
}

function getPerformanceSummary() {
  const store = getRegionStore();
  const summary = {
    regions: {},
    totals: { renders: 0, updates: 0, errors: 0, interactions: 0, avgRenderTime: 0, avgUpdateTime: 0 },
    slowestRegion: null as DynObj,
    mostActiveRegion: null as DynObj,
    mostErrorsRegion: null as DynObj
  };

  let totalRenderTime = 0;
  let totalUpdateTime = 0;
  let maxActivity = 0;
  let maxErrors = 0;
  let maxRenderTime = 0;
  const regions = Object.keys(store);

  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const agg = (store as DynObj)[region].aggregated;

    (summary.regions as DynObj)[region] = {
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
    if (activity > maxActivity) { maxActivity = activity; summary.mostActiveRegion = region; }
    if (agg.errorCount > maxErrors) { maxErrors = agg.errorCount; summary.mostErrorsRegion = region; }
    if (agg.avgRenderTime > maxRenderTime) { maxRenderTime = agg.avgRenderTime; summary.slowestRegion = region; }
  }

  if (summary.totals.renders > 0) summary.totals.avgRenderTime = Math.round((totalRenderTime / summary.totals.renders) * 100) / 100;
  if (summary.totals.updates > 0) summary.totals.avgUpdateTime = Math.round((totalUpdateTime / summary.totals.updates) * 100) / 100;

  return summary;
}

function getProblematicRegions(thresholds?: DynObj) {
  thresholds = thresholds || { maxAvgRenderTime: 100, maxErrors: 5 };
  const store = getRegionStore();
  const problems = [];
  const regions = Object.keys(store);

  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const agg = (store as DynObj)[region].aggregated;
    const issues = [];

    if (agg.avgRenderTime > thresholds.maxAvgRenderTime) {
      issues.push({ type: 'slow-render', value: agg.avgRenderTime, threshold: thresholds.maxAvgRenderTime });
    }
    if (agg.errorCount > thresholds.maxErrors) {
      issues.push({ type: 'high-errors', value: agg.errorCount, threshold: thresholds.maxErrors });
    }
    if (issues.length > 0) {
      problems.push({ region, issues });
    }
  }

  return problems;
}

// ── Control ─────────────────────────────────────────────────────────

function enable() {
  setEnabled(true);
  if (!getTrackingStartedAt()) setTrackingStartedAt(Date.now());
}

function disable() {
  setEnabled(false);
}

// ── Health & Info ───────────────────────────────────────────────────

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
    if ((checks as DynObj)[keys[i]]) passed++;
  }

  return {
    status: passed === keys.length ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'),
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

// ── Exports ─────────────────────────────────────────────────────────

export { VERSION, MODULE_ID, METRIC_TYPES };
export {
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
  configure,
  addSubscriber as subscribe,
  getMetrics,
  healthCheck,
  info
};
export { resetAll as reset, resetRegion, getConfig };

export default {
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
