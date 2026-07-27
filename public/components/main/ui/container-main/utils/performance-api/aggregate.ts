// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: aggregate
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getBootMetrics from ../../core/boot-metrics.js
//   getRenderStats from ./render.js
//   getLoadStats from ./load.js
//   getWebVitalsRating from ./web-vitals.js
//   getHistogramStats from ./metrics.js
//
// PROVIDES:
//   getMemoryInfo() — exported function
//   getNavigationTiming() — exported function
//   getBootMetricsReport() — exported function
//   getAllMetrics() — exported function
//   getHistory() — exported function
//   exportJSON() — exported function
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
 * Performance API - Aggregate
 * @module performance-api/aggregate
 */
'use strict';

import { getBootMetrics } from '../../core/boot-metrics.js';
import { getRenderStats } from './render.js';
import { getLoadStats } from './load.js';
import { getWebVitalsRating } from './web-vitals.js';
import { getHistogramStats } from './metrics.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.performance-api.aggregate';

export function getMemoryInfo() {
  const perf = performance as any;
  if (perf.memory) {
    return {
      usedJSHeapSize: perf.memory.usedJSHeapSize,
      totalJSHeapSize: perf.memory.totalJSHeapSize,
      jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
      usagePercent: `${((perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100).toFixed(1)}%`
    };
  }
  return null;
}

export function getNavigationTiming() {
  if (!performance.getEntriesByType) return null;

  const navEntry = performance.getEntriesByType('navigation')[0] as any;
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

export function getBootMetricsReport() {
  const bootMetrics = getBootMetrics();
  return (bootMetrics.getReport as (...args: unknown[]) => unknown)();
}

export function getAllMetrics(state: Record<string, unknown>) {
  return {
    render: getRenderStats(state),
    load: getLoadStats(state),
    webVitals: getWebVitalsRating(state),
    memory: getMemoryInfo(),
    navigation: getNavigationTiming(),
    boot: getBootMetricsReport(),
    // @ts-expect-error TS migration - TS2769
    counters: Object.fromEntries((state.metrics as Record<string, unknown>).counters),
    // @ts-expect-error TS migration - TS2769
    gauges: Object.fromEntries((state.metrics as Record<string, unknown>).gauges),
    histograms: Object.fromEntries(
      // @ts-expect-error TS migration - TS2339
      Array.from((state.metrics as Record<string, unknown>).histograms.entries()).map(([k, v]) => [k, getHistogramStats(state, k)])
    ),
    timings: Object.fromEntries(
      // @ts-expect-error TS migration - TS2339
      Array.from((state.metrics as Record<string, unknown>).timings.entries()).map(([k, v]) => [k, {
        count: v.length,
        // @ts-expect-error TS migration - TS2365
        avg: v.reduce((a: unknown, b: unknown) => (a as number) + b, 0) / v.length,
        min: Math.min(...v),
        max: Math.max(...v)
      }])
    )
  };
}

export function getHistory(state: Record<string, unknown>, limit = 50) {
  // @ts-expect-error TS migration - TS2339
  return (state.metrics as Record<string, unknown>).history.slice(0, limit);
}

export function exportJSON(state: Record<string, unknown>) {
  return JSON.stringify(getAllMetrics(state), null, 2);
}
