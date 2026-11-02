// Migrado para TypeScript: 2026-02-25
// Event Throttle/Debounce - Protecao contra rajadas de eventos
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Debounce e throttle para eventos RUNTIME_CONTEXT_UPDATED
// @melhoria #22
'use strict';

export const MODULE_ID = 'event-throttle' as const;
export const VERSION = '1.0.0' as const;

interface DebouncedFunction {
  (this: unknown, ...args: unknown[]): void;
  cancel: () => void;
  flush: () => void;
}

interface ThrottledFunction {
  (this: unknown, ...args: unknown[]): void;
  cancel: () => void;
}

interface BatchedFunction {
  (data: Record<string, unknown>): void;
  cancel: () => void;
  getPending: () => { hasPending: boolean; batchCount: number };
}

interface EventThrottleInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  available: string[];
}

export function debounce(fn: (...args: unknown[]) => void, delayMs: number): DebouncedFunction {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = function(this: unknown): void {
    const context = this;
    const args = arguments;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(context, Array.from(args));
    }, delayMs);
  } as DebouncedFunction;
  debounced.cancel = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  debounced.flush = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      fn(...[]);
    }
  };
  return debounced;
}

export function throttle(fn: (...args: unknown[]) => void, intervalMs: number): ThrottledFunction {
  let lastCall: number = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const throttled = function(this: unknown): void {
    const context = this;
    const args = arguments;
    const now = Date.now();
    const remaining = intervalMs - (now - lastCall);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastCall = now;
      fn.apply(context, Array.from(args));
    } else if (!timer) {
      timer = setTimeout(() => {
        lastCall = Date.now();
        timer = null;
        fn.apply(context, Array.from(args));
      }, remaining);
    }
  } as ThrottledFunction;
  throttled.cancel = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return throttled;
}

export function batchLatest(handler: (data: Record<string, unknown>) => void, windowMs?: number): BatchedFunction {
  windowMs = windowMs || 100;
  let latestData: Record<string, unknown> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let batchCount: number = 0;
  const _windowMs = windowMs;

  const batched = ((data: Record<string, unknown>): void => {
    latestData = data;
    batchCount++;
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        const processData = latestData;
        const count = batchCount;
        latestData = null;
        batchCount = 0;
        if (processData) {
          processData._batchInfo = { eventsInBatch: count, windowMs: _windowMs };
          handler(processData);
        }
      }, _windowMs);
    }
  }) as BatchedFunction;
  batched.cancel = (): void => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    latestData = null;
    batchCount = 0;
  };
  batched.getPending = (): { hasPending: boolean; batchCount: number } => ({
    hasPending: !!timer,
    batchCount
  });
  return batched;
}

export function info(): EventThrottleInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    available: ['debounce', 'throttle', 'batchLatest']
  };
}

export default {
  MODULE_ID,
  VERSION,
  debounce,
  throttle,
  batchLatest,
  info
};
