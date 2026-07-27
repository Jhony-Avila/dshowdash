// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: utils
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   shouldSample() — exported function
//   addToHistory() — exported function
//   calculatePercentile() — exported function
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
 * Performance API - Utils
 * @module performance-api/utils
 */
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.performance-api.utils';

export function shouldSample(sampleRate: unknown) {
  // @ts-expect-error TS migration - TS2349
  return (Math.random as unknown as number)() < sampleRate;
}

export function addToHistory(state: Record<string, unknown>, entry: Record<string, unknown>) {
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).history.unshift(entry);
  // @ts-expect-error TS migration - TS2339
  if ((state.metrics as Record<string, unknown>).history.length > state.maxHistorySize) {
    // @ts-expect-error TS migration - TS2339
    (state.metrics as Record<string, unknown>).history.pop();
  }
}

export function calculatePercentile(arr: Record<string, unknown>, p: unknown) {
  if (arr.length === 0) return 0;
  // @ts-expect-error TS migration - TS2488
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(((p as number) / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
