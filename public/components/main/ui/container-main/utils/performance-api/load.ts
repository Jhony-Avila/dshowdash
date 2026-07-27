// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: load
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   METRIC_TYPES, METRIC_CATEGORIES from ./constants.js
//   shouldSample, addToHistory, calculatePercentile from ./utils.js
//
// PROVIDES:
//   recordLoad() — exported function
//   getLoadStats() — exported function
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
 * Performance API - Load Metrics
 * @module performance-api/load
 */
'use strict';

import { METRIC_TYPES, METRIC_CATEGORIES } from './constants.js';
import { shouldSample, addToHistory, calculatePercentile } from './utils.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.performance-api.load';

export function recordLoad(state: Record<string, unknown>, sampleRate: unknown, duration: number, resourceId: string | null = null, success = true) {
  if (!shouldSample(sampleRate)) return;

  // @ts-expect-error TS migration - TS2356
  (state.loadStats as Record<string, unknown>).totalLoads++;
  if (success) {
    // @ts-expect-error TS migration - TS2365
    (state.loadStats as Record<string, unknown>).totalLoadTime += duration;
    (state.loadStats as Record<string, unknown>).lastLoadTime = duration;
    // @ts-expect-error TS migration - TS2339
    (state.loadStats as Record<string, unknown>).avgLoadTime = state.loadStats.totalLoadTime / (state.loadStats.totalLoads - state.loadStats.failedLoads);
  } else {
    // @ts-expect-error TS migration - TS2356
    (state.loadStats as Record<string, unknown>).failedLoads++;
  }

  // @ts-expect-error TS migration - TS2339
  (state.loadStats as Record<string, unknown>).loadHistory.push({ duration, resourceId, success, timestamp: Date.now() });
  // @ts-expect-error TS migration - TS2339
  if ((state.loadStats as Record<string, unknown>).loadHistory.length > state.maxHistorySize) {
    // @ts-expect-error TS migration - TS2339
    (state.loadStats as Record<string, unknown>).loadHistory.shift();
  }

  addToHistory(state, {
    type: METRIC_TYPES.TIMING,
    name: 'load',
    category: METRIC_CATEGORIES.LOAD,
    value: duration,
    resourceId,
    success,
    timestamp: Date.now()
  });
}

export function getLoadStats(state: Record<string, unknown>) {
  // @ts-expect-error TS migration - TS2339
  const durations = (state.loadStats as Record<string, unknown>).loadHistory.filter((l: unknown) => l.success).map((l: unknown) => l.duration);
  return {
    // @ts-expect-error TS migration - TS2698
    ...(state as Record<string, unknown>).loadStats,
    // @ts-expect-error TS migration - TS2365
    successRate: (state.loadStats as Record<string, unknown>).totalLoads > 0 
      // @ts-expect-error TS migration - TS2362, TS2339
      ? `${(((state.loadStats as Record<string, unknown>).totalLoads - state.loadStats.failedLoads) / state.loadStats.totalLoads * 100).toFixed(1)}%`
      : '100%',
    p50: calculatePercentile(durations, 50),
    p90: calculatePercentile(durations, 90),
    p99: calculatePercentile(durations, 99)
  };
}
