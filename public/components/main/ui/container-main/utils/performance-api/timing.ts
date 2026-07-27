// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: timing
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   METRIC_TYPES, METRIC_CATEGORIES from ./constants.js
//   addToHistory from ./utils.js
//
// PROVIDES:
//   startTiming() — exported function
//   endTiming() — exported function
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
 * Performance API - Timing
 * @module performance-api/timing
 */
'use strict';

import { METRIC_TYPES, METRIC_CATEGORIES } from './constants.js';
import { addToHistory } from './utils.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.performance-api.timing';

export function startTiming(state: Record<string, unknown>, name: string, category = METRIC_CATEGORIES.CUSTOM) {
  const mark = `${name}_start`;
  performance.mark(mark);
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).marks.set(name, { mark, category, startTime: performance.now() });
}

export function endTiming(state: Record<string, unknown>, name: string, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }, debug: boolean) {
  // @ts-expect-error TS migration - TS2339
  const startData = (state.metrics as Record<string, unknown>).marks.get(name);
  if (!startData) {
    if (logger) logger.warn(`No start mark found for: ${name}`);
    return null;
  }

  const endMark = `${name}_end`;
  performance.mark(endMark);

  const duration = performance.now() - startData.startTime;

  // @ts-expect-error TS migration - TS2339
  if (!(state.metrics as Record<string, unknown>).timings.has(name)) {
    // @ts-expect-error TS migration - TS2339
    (state.metrics as Record<string, unknown>).timings.set(name, []);
  }
  // @ts-expect-error TS migration - TS2339
  (state.metrics as Record<string, unknown>).timings.get(name).push(duration);

  try {
    performance.measure(name, startData.mark, endMark);
  } catch (e) { /* ignore */ }

  addToHistory(state, {
    type: METRIC_TYPES.TIMING,
    name,
    category: startData.category,
    value: duration,
    timestamp: Date.now()
  });

  if (debug && logger) logger.debug(`Timing ${name}: ${duration.toFixed(2)}ms`);

  return duration;
}

export async function measure(state: Record<string, unknown>, name: string, fn: (...args: unknown[]) => void, category: string, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }, debug: boolean) {
  // @ts-expect-error TS migration - TS2345
  startTiming(state, name, category);
  try {
    const result = await fn();
    endTiming(state, name, logger, debug);
    return result;
  } catch (error) {
    endTiming(state, name, logger, debug);
    throw error;
  }
}
