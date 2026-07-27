// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createState() — exported function
//   resetState() — exported function
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
 * Performance API - State
 * @module performance-api/state
 */
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.performance-api.state';

export function createState(maxHistorySize: unknown) {
  return {
    metrics: {
      timings: new Map(),
      counters: new Map(),
      gauges: new Map(),
      histograms: new Map(),
      history: [] as unknown[],
      marks: new Map(),
      measures: new Map()
    },
    renderStats: {
      totalRenders: 0,
      totalRenderTime: 0,
      lastRenderTime: 0,
      avgRenderTime: 0,
      minRenderTime: Infinity,
      maxRenderTime: 0,
      renderHistory: [] as unknown[]
    },
    loadStats: {
      totalLoads: 0,
      totalLoadTime: 0,
      lastLoadTime: 0,
      avgLoadTime: 0,
      failedLoads: 0,
      loadHistory: [] as unknown[]
    },
    webVitals: {
      LCP: null as Record<string, unknown> | null,
      FID: null as Record<string, unknown> | null,
      CLS: null as string | null,
      FCP: null as Record<string, unknown> | null,
      TTFB: null as Record<string, unknown> | null,
      INP: null as Record<string, unknown> | null
    },
    maxHistorySize
  };
}

export function resetState(state: Record<string, unknown>) {
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).timings.clear();
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).counters.clear();
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).gauges.clear();
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).histograms.clear();
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).history.length = 0;
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).marks.clear();
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).measures.clear();

  // @ts-expect-error strict migration — TS2769
  Object.assign(state.renderStats, {
    totalRenders: 0, totalRenderTime: 0, lastRenderTime: 0,
    avgRenderTime: 0, minRenderTime: Infinity, maxRenderTime: 0,
    renderHistory: []
  });

  // @ts-expect-error strict migration — TS2769
  Object.assign(state.loadStats, {
    totalLoads: 0, totalLoadTime: 0, lastLoadTime: 0,
    avgLoadTime: 0, failedLoads: 0, loadHistory: []
  });
}
