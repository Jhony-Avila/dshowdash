// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: render
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   METRIC_TYPES, METRIC_CATEGORIES from ./constants.js
//   shouldSample, addToHistory, calculatePercentile from ./utils.js
//
// PROVIDES:
//   recordRender() — exported function
//   getRenderStats() — exported function
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
 * Performance API - Render Metrics
 * @module performance-api/render
 */
'use strict';

import { METRIC_TYPES, METRIC_CATEGORIES } from './constants.js';
import { shouldSample, addToHistory, calculatePercentile } from './utils.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.performance-api.render';

export function recordRender(state: Record<string, unknown>, sampleRate: unknown, duration: number, panelId: string | null = null) {
  if (!shouldSample(sampleRate)) return;

  // @ts-expect-error TS migration - TS2356
  (state.renderStats as Record<string, unknown>).totalRenders++;
  // @ts-expect-error TS migration - TS2365
  (state.renderStats as Record<string, unknown>).totalRenderTime += duration;
  (state.renderStats as Record<string, unknown>).lastRenderTime = duration;
  // @ts-expect-error TS migration - TS2339
  (state.renderStats as Record<string, unknown>).avgRenderTime = state.renderStats.totalRenderTime / state.renderStats.totalRenders;
  // @ts-expect-error TS migration - TS2339
  (state.renderStats as Record<string, unknown>).minRenderTime = Math.min(state.renderStats.minRenderTime, duration);
  // @ts-expect-error TS migration - TS2339
  (state.renderStats as Record<string, unknown>).maxRenderTime = Math.max(state.renderStats.maxRenderTime, duration);

  // @ts-expect-error TS migration - TS2339
  (state.renderStats as Record<string, unknown>).renderHistory.push({ duration, panelId, timestamp: Date.now() });
  // @ts-expect-error TS migration - TS2339
  if ((state.renderStats as Record<string, unknown>).renderHistory.length > state.maxHistorySize) {
    // @ts-expect-error TS migration - TS2339
    (state.renderStats as Record<string, unknown>).renderHistory.shift();
  }

  addToHistory(state, {
    type: METRIC_TYPES.TIMING,
    name: 'render',
    category: METRIC_CATEGORIES.RENDER,
    value: duration,
    panelId,
    timestamp: Date.now()
  });
}

export function getRenderStats(state: Record<string, unknown>) {
  // @ts-expect-error TS migration - TS2339
  const durations = (state.renderStats as Record<string, unknown>).renderHistory.map((r: unknown) => r.duration);
  return {
    // @ts-expect-error TS migration - TS2698
    ...(state as Record<string, unknown>).renderStats,
    p50: calculatePercentile(durations, 50),
    p90: calculatePercentile(durations, 90),
    p99: calculatePercentile(durations, 99)
  };
}
