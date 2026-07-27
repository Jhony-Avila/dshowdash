// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, METRIC_TYPES, METRIC_CATEGORIES from ./constants.js
//   getRenderStats from ./render.js
//   getLoadStats from ./load.js
//
// PROVIDES:
//   healthCheck() — exported function
//   info() — exported function
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
 * Performance API - Health
 * @module performance-api/health
 */
'use strict';

import { VERSION, MODULE_ID, METRIC_TYPES, METRIC_CATEGORIES } from './constants.js';
import { getRenderStats } from './render.js';
import { getLoadStats } from './load.js';

export function healthCheck(state: Record<string, unknown>) {
  const renderStats = getRenderStats(state);
  let status = 'HEALTHY';

  if (renderStats.avgRenderTime > 100) status = 'WARNING';
  if (renderStats.avgRenderTime > 500) status = 'DEGRADED';

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
      avg: `${(state.loadStats as Record<string, unknown>).avgLoadTime.toFixed(2)}ms`,
      successRate: getLoadStats(state).successRate
    },
    // @ts-expect-error TS migration - TS2339
    historySize: (state.metrics as Record<string, unknown>).history.length
  };
}

export function info(config: Record<string, unknown>) {
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
