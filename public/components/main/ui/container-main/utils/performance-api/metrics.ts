// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: metrics
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   calculatePercentile from ./utils.js
//
// PROVIDES:
//   increment() — exported function
//   decrement() — exported function
//   getCounter() — exported function
//   setGauge() — exported function
//   getGauge() — exported function
//   recordHistogram() — exported function
//   getHistogramStats() — exported function
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
 * Performance API - Counters, Gauges, Histograms
 * @module performance-api/metrics
 */
'use strict';

import { calculatePercentile } from './utils.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.performance-api.metrics';

export function increment(state: Record<string, unknown>, name: string, value = 1) {
  // @ts-expect-error TS migration - TS2339
  const current = (state.metrics as Record<string, unknown>).counters.get(name) || 0;
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).counters.set(name, current + value);
  // @ts-expect-error TS migration - TS2339
  return (state.metrics as Record<string, unknown>).counters.get(name);
}

export function decrement(state: Record<string, unknown>, name: string, value = 1) {
  return increment(state, name, -value);
}

export function getCounter(state: Record<string, unknown>, name: string) {
  // @ts-expect-error TS migration - TS2339
  return (state.metrics as Record<string, unknown>).counters.get(name) || 0;
}

export function setGauge(state: Record<string, unknown>, name: string, value: unknown) {
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).gauges.set(name, { value, timestamp: Date.now() });
}

export function getGauge(state: Record<string, unknown>, name: string) {
  // @ts-expect-error TS migration - TS2339
  return (state.metrics as Record<string, unknown>).gauges.get(name)?.value ?? null;
}

export function recordHistogram(state: Record<string, unknown>, name: string, value: unknown) {
  // @ts-expect-error TS migration - TS2339
  if (!(state.metrics as Record<string, unknown>).histograms.has(name)) {
    // @ts-expect-error TS migration - TS2339
    (state.metrics as Record<string, unknown>).histograms.set(name, []);
  }
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).histograms.get(name).push(value);
}

export function getHistogramStats(state: Record<string, unknown>, name: string) {
  // @ts-expect-error TS migration - TS2339
  const values = (state.metrics as Record<string, unknown>).histograms.get(name) || [];
  if (values.length === 0) return null;

  // @ts-expect-error TS migration - TS2365
  const sum = values.reduce((a: unknown, b: unknown) => (a as number) + b, 0);
  return {
    count: values.length,
    sum,
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    p50: calculatePercentile(values, 50),
    p90: calculatePercentile(values, 90),
    p99: calculatePercentile(values, 99)
  };
}
