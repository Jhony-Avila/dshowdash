// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.constants.runtime-guard
// PURPOSE: Guard que verifica se RuntimeContext está pronto
// ───────────────────────────────────────────────────────────────
// PROVIDES: setReady, whenReady, isReady, queueOperation, healthCheck
// @changelog v1.2.0-STRICT-MODE: Strict mode integration, added healthCheck
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

/** Runtime-injected Logger (may be present at runtime via ports) */
declare const Logger: Record<string, (...args: unknown[]) => void> | undefined;

export const MODULE_ID = 'core.runtime.constants.runtime-guard' as const;
export const VERSION = '1.2.0-STRICT-MODE' as const;

interface QueueItem {
  fn: (...args: unknown[]) => unknown;
  args: unknown[];
}

interface GuardOptions {
  queue?: boolean;
  fallback?: (() => unknown) | unknown;
}

interface RequireReadyResult {
  ok: boolean;
  reason?: string;
  operation?: string;
}

interface GuardMetrics {
  blockedCalls: number;
  queuedCalls: number;
  processedFromQueue: number;
  directCalls: number;
}

interface RuntimeGuardInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  strictMode: boolean;
  ready: boolean;
  queueSize: number;
  maxQueue: number;
  metrics: GuardMetrics;
}

interface RuntimeGuardHealthCheck {
  status: string;
  score: string;
  checks: Record<string, boolean>;
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  strictMode: boolean;
  metrics: GuardMetrics;
  timestamp: number;
}

let _ready: boolean = false;
let _queue: QueueItem[] = [];
const _maxQueue: number = 50;
const _metrics: GuardMetrics = {
  blockedCalls: 0,
  queuedCalls: 0,
  processedFromQueue: 0,
  directCalls: 0
};

export function markReady(): void {
  _ready = true;
  _processQueue();
}

export function markNotReady(): void {
  _ready = false;
}

export function isReady(): boolean {
  return _ready;
}

function _processQueue(): void {
  while (_queue.length > 0) {
    const item = _queue.shift()!;
    try {
      item.fn.apply(null, item.args || []);
      _metrics.processedFromQueue++;
    } catch (e: unknown) {
      if (typeof Logger !== 'undefined') (Logger as Record<string, (...args: unknown[]) => void>).warn(`[runtime-guard] Queued call failed: ${(e as Error).message}`); else console.warn('[runtime-guard] Queued call failed:', (e as Error).message);
    }
  }
}

export function guard<T extends (...args: unknown[]) => unknown>(fn: T, options?: GuardOptions): (...args: unknown[]) => unknown {
  options = options || {};
  return function(this: unknown, ...args: unknown[]): unknown {
    if (_ready) {
      _metrics.directCalls++;
      return fn.apply(this, args);
    }
    if (options!.queue && _queue.length < _maxQueue) {
      _metrics.queuedCalls++;
      _queue.push({ fn, args: Array.prototype.slice.call(args) });
      return undefined;
    }
    if (options!.fallback) {
      _metrics.blockedCalls++;
      return typeof options!.fallback === 'function' ? (options!.fallback as () => unknown)() : options!.fallback;
    }
    _metrics.blockedCalls++;
    return undefined;
  };
}

export function requireReady(operationName?: string): RequireReadyResult {
  if (!_ready) {
    _metrics.blockedCalls++;
    return {
      ok: false,
      reason: 'RuntimeContext not ready',
      operation: operationName || 'unknown'
    };
  }
  _metrics.directCalls++;
  return { ok: true };
}

export function getQueueSize(): number {
  return _queue.length;
}

export function clearQueue(): number {
  const dropped = _queue.length;
  _queue = [];
  return dropped;
}

export function getMetrics(): GuardMetrics {
  return Object.assign({}, _metrics);
}

export function reset(): void {
  _ready = false;
  _queue = [];
  _metrics.blockedCalls = 0;
  _metrics.queuedCalls = 0;
  _metrics.processedFromQueue = 0;
  _metrics.directCalls = 0;
}

export function info(): RuntimeGuardInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    ready: _ready,
    queueSize: _queue.length,
    maxQueue: _maxQueue,
    metrics: Object.assign({}, _metrics)
  };
}

export function healthCheck(): RuntimeGuardHealthCheck {
  const checks: Record<string, boolean> = {
    ready: _ready,
    queueNotFull: _queue.length < _maxQueue,
    lowBlockedCalls: _metrics.blockedCalls < 100
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : (_ready ? 'DEGRADED' : 'UNHEALTHY'),
    score: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}

export default {
  MODULE_ID,
  VERSION,
  markReady,
  markNotReady,
  isReady,
  guard,
  requireReady,
  getQueueSize,
  clearQueue,
  getMetrics,
  reset,
  info,
  healthCheck
};
