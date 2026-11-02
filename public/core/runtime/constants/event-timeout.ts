// Migrado para TypeScript: 2026-02-25
// Event Timeout - Protecao contra handlers travados
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Timeout para handlers que demoram mais que threshold
// @melhoria #17
'use strict';

/** Runtime-injected Logger (may be present at runtime via ports) */
declare const Logger: Record<string, (...args: unknown[]) => void> | undefined;

export const MODULE_ID = 'event-timeout' as const;
export const VERSION = '1.0.0' as const;

const DEFAULT_TIMEOUT_MS: number = 5000;

interface TimeoutMetrics {
  timeoutsTriggered: number;
  totalExecutions: number;
  slowestHandler: string | null;
  slowestTime: number;
}

interface ExecutionResult {
  ok: boolean;
  time: number;
  timedOut: boolean;
  handlerId: string;
  error?: string;
}

interface ExecuteOptions {
  timeoutMs?: number;
  handlerId?: string;
}

interface HandlerEntry {
  handler: (data: unknown) => unknown;
  id?: string;
}

interface EventTimeoutInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  defaultTimeoutMs: number;
  metrics: TimeoutMetrics;
}

const _metrics: TimeoutMetrics = {
  timeoutsTriggered: 0,
  totalExecutions: 0,
  slowestHandler: null,
  slowestTime: 0
};

function _trackSlowest(handlerId: string, elapsed: number): void {
  if (elapsed > _metrics.slowestTime) {
    _metrics.slowestTime = elapsed;
    _metrics.slowestHandler = handlerId;
  }
}

export function executeWithTimeout(handler: (data: unknown) => unknown, data: unknown, options?: ExecuteOptions): Promise<ExecutionResult> {
  options = options || {};
  const timeoutMs: number = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const handlerId: string = options.handlerId || 'unknown';
  const startTime: number = Date.now();

  _metrics.totalExecutions++;

  return new Promise<ExecutionResult>(resolve => {
    let resolved: boolean = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        _metrics.timeoutsTriggered++;
        if (typeof Logger !== 'undefined') (Logger as Record<string, (...args: unknown[]) => void>).warn(`[event-timeout] Handler ${handlerId} excedeu ${timeoutMs}ms`); else console.warn(`[event-timeout] Handler ${handlerId} excedeu ${timeoutMs}ms`);
        resolve({ ok: false, time: Date.now() - startTime, timedOut: true, handlerId });
      }
    }, timeoutMs);

    try {
      const result = handler(data);

      if (result && typeof (result as Record<string, unknown>).then === 'function') {
        (result as Promise<unknown>).then(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer!);
            const elapsed = Date.now() - startTime;
            _trackSlowest(handlerId, elapsed);
            resolve({ ok: true, time: elapsed, timedOut: false, handlerId });
          }
        }).catch((e: Error) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer!);
            resolve({ ok: false, time: Date.now() - startTime, timedOut: false, error: e.message, handlerId });
          }
        });
      } else {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer!);
          const elapsed = Date.now() - startTime;
          _trackSlowest(handlerId, elapsed);
          resolve({ ok: true, time: elapsed, timedOut: false, handlerId });
        }
      }
    } catch (e: unknown) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer!);
        resolve({ ok: false, time: Date.now() - startTime, timedOut: false, error: (e as Error).message, handlerId });
      }
    }
  });
}

export function executeAllWithTimeout(handlers: HandlerEntry[], data: unknown, options?: ExecuteOptions): Promise<ExecutionResult[]> {
  const promises: Promise<ExecutionResult>[] = [];
  for (let i = 0; i < handlers.length; i++) {
    const h = handlers[i];
    promises.push(executeWithTimeout(h.handler, data, {
      timeoutMs: (options && options.timeoutMs) || DEFAULT_TIMEOUT_MS,
      handlerId: h.id || `handler-${i}`
    }));
  }
  return Promise.all(promises);
}

export function getMetrics(): TimeoutMetrics {
  return Object.assign({}, _metrics);
}

export function resetMetrics(): void {
  _metrics.timeoutsTriggered = 0;
  _metrics.totalExecutions = 0;
  _metrics.slowestHandler = null;
  _metrics.slowestTime = 0;
}

export function info(): EventTimeoutInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
    metrics: Object.assign({}, _metrics)
  };
}

export default {
  MODULE_ID,
  VERSION,
  executeWithTimeout,
  executeAllWithTimeout,
  getMetrics,
  resetMetrics,
  info
};
