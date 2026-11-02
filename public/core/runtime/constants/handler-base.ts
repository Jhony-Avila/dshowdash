// Migrado para TypeScript: 2026-02-25
// Handler Base - Template padrao para handlers de RuntimeContext
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// @version 1.5.0-STRICT-MODE
// @description Factory para criar handlers padronizados
// @melhoria #08 - Padronizar interface dos handlers
// @changelog v1.5.0-STRICT-MODE - Added isStrict/recordViolation protection for window.* fallbacks
// @changelog v1.4.0-P2-ENTERPRISE - Migrado para Ports pattern (config.eventBus ou Ports fallback)
// @changelog v1.3.0-P18 - Strings soltas substituidas por constantes P18 (KERNEL_RUNTIME_EVENTS)
// @changelog v1.2.0-STEP8 - Fase 3B: window.RuntimeContext migrado para _resolveRuntimeContext() (windowAdapter → window fallback)
// @changelog v1.1.0 - Fix: window.EventBus (nao __eventBus), fallback RuntimeContext.subscribeWithReplay
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { KERNEL_RUNTIME_EVENTS } from '/core/runtime/events/catalog/kernel.events.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

/** Runtime-injected Logger (may be present at runtime via ports) */
declare const Logger: Record<string, (...args: unknown[]) => void> | undefined;

export const MODULE_ID = 'handler-base' as const;
export const VERSION = '1.5.0-STRICT-MODE' as const;

interface HandlerConfig {
  id?: string;
  version?: string;
  eventBus?: Record<string, unknown>;
  onSetup?: () => void;
  onUpdated?: (data: unknown) => void;
  onReady?: (data: unknown) => void;
  onCleanup?: () => void;
}

interface HandlerMetrics {
  updatesReceived: number;
  readyReceived: number;
  errorsCount: number;
  lastUpdateAt: number | null;
  setupAt: number | null;
  cleanupAt: number | null;
  eventSource: string | null;
}

interface SetupResult {
  ok: boolean;
  reason?: string;
  error?: string;
}

interface HealthCheckResult {
  status: string;
  handlerId: string;
  version: string;
  strictMode: boolean;
  eventSource: string | null;
  metrics: HandlerMetrics;
}

interface HandlerInfoResult {
  moduleId: string;
  version: string;
  setupDone: boolean;
  eventSource: string | null;
  cleanupCount: number;
  metrics: HandlerMetrics;
}

export interface Handler {
  id: string;
  version: string;
  setup: () => SetupResult;
  cleanup: () => void;
  healthCheck: () => HealthCheckResult;
  getMetrics: () => HandlerMetrics;
  info: () => HandlerInfoResult;
  isSetup: () => boolean;
}

interface HandlerBaseInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  description: string;
  strictMode: boolean;
  p2Enterprise: boolean;
  portsInitialized: boolean;
}

// P2 ENTERPRISE: Ports-based access as fallback
const _Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized: boolean = false;
function _initPorts(): void { if (_portsInitialized) return; _Ports.init(); _portsInitialized = true; }
function _getEventBus(): unknown { _initPorts(); return (_Ports as unknown as { getEventBus(): unknown }).getEventBus(); }

// ═══════════════════════════════════════════════════════════════
// RUNTIME CONTEXT RESOLVER (v1.2.0-STEP8)
// Canal oficial: windowAdapter.get → window fallback
// ═══════════════════════════════════════════════════════════════

function _resolveRuntimeContext(): unknown {
  if (typeof window === 'undefined') return null;
  // 1. windowAdapter (canal oficial)
  if ((window as unknown as Record<string, unknown>).Core && ((window as unknown as Record<string, unknown>).Core as Record<string, unknown>).windowAdapter && (((window as unknown as Record<string, unknown>).Core as Record<string, unknown>).windowAdapter as Record<string, unknown>).get) {
    const rc = (((window as unknown as Record<string, unknown>).Core as Record<string, unknown>).windowAdapter as Record<string, (...args: unknown[]) => unknown>).get('RuntimeContext');
    if (rc) return rc;
  }
  // 2. window fallback with strict mode protection (v1.5.0)
  if ((window as unknown as Record<string, unknown>).RuntimeContext) {
    if (isStrict()) return null;
    recordViolation('WINDOW_FALLBACK', { module: MODULE_ID, global: 'RuntimeContext', context: '_resolveRuntimeContext' });
    return (window as unknown as Record<string, unknown>).RuntimeContext;
  }
  return null;
}

export function createHandler(config?: HandlerConfig): Handler {
  config = config || {};
  const handlerId: string = config.id || 'unknown-handler';
  const handlerVersion: string = config.version || '1.0.0';
  let _setupDone: boolean = false;
  let _cleanups: Array<() => void> = [];
  const _metrics: HandlerMetrics = {
    updatesReceived: 0,
    readyReceived: 0,
    errorsCount: 0,
    lastUpdateAt: null,
    setupAt: null,
    cleanupAt: null,
    eventSource: null
  };

  function _safeCall(fn: () => void, label: string): void {
    try {
      fn();
    } catch (e: unknown) {
      _metrics.errorsCount++;
      if (typeof Logger !== 'undefined') (Logger as Record<string, (...args: unknown[]) => void>).warn(`[${handlerId}] Error in ${label}: ${(e as Error).message}`); else console.warn(`[${handlerId}] Error in ${label}:`, (e as Error).message);
    }
  }

  const handler: Handler = {
    id: handlerId,
    version: handlerVersion,

    setup(): SetupResult {
      if (_setupDone) return { ok: true, reason: 'already-setup' };
      try {
        if (config!.onSetup) config!.onSetup();

        // P2 ENTERPRISE: Prioridade: config.eventBus → Ports → window.EventBus fallback
        // v1.5.0: Strict mode protection for window.EventBus
        let eb: Record<string, unknown> | null = (config!.eventBus || _getEventBus()) as Record<string, unknown> | null;
        if (!eb && typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).EventBus) {
          if (!isStrict()) {
            recordViolation('WINDOW_EVENTBUS_FALLBACK', { module: MODULE_ID, context: 'createHandler.setup' });
            eb = (window as unknown as Record<string, unknown>).EventBus as Record<string, unknown>;
          }
        }

        if (eb && typeof (eb as Record<string, unknown>).on === 'function') {
          if (config!.onUpdated) {
            const updatedHandler = (data: unknown): void => {
              _metrics.updatesReceived++;
              _metrics.lastUpdateAt = Date.now();
              _safeCall(() => { config!.onUpdated!(data); }, 'onUpdated');
            };
            const unsub1 = (eb as Record<string, (...args: unknown[]) => unknown>).on(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED, updatedHandler);
            if (typeof unsub1 === 'function') _cleanups.push(unsub1 as () => void);
          }
          if (config!.onReady) {
            const readyHandler = (data: unknown): void => {
              _metrics.readyReceived++;
              _safeCall(() => { config!.onReady!(data); }, 'onReady');
            };
            const unsub2 = (eb as Record<string, (...args: unknown[]) => unknown>).on(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY, readyHandler);
            if (typeof unsub2 === 'function') _cleanups.push(unsub2 as () => void);
          }
          _metrics.eventSource = 'EventBus';
        } else {
          const rc = _resolveRuntimeContext() as Record<string, unknown> | null;
          if (rc && typeof rc.subscribeWithReplay === 'function' && config!.onUpdated) {
            const unsub = (rc.subscribeWithReplay as (cb: (snapshot: Record<string, unknown>, meta: Record<string, unknown>) => void, opts: Record<string, boolean>) => unknown)((snapshot: Record<string, unknown>, meta: Record<string, unknown>) => {
              _metrics.updatesReceived++;
              _metrics.lastUpdateAt = Date.now();
              _safeCall(() => {
                config!.onUpdated!({ snapshot, trigger: (meta && meta.trigger) || 'subscription' });
              }, 'onUpdated-replay');
            }, { replayReady: true, replayLastUpdate: true });
            if (typeof unsub === 'function') _cleanups.push(unsub as () => void);
            _metrics.eventSource = 'RuntimeContext.subscribeWithReplay';
          } else {
            _metrics.eventSource = 'none';
            _setupDone = true;
            _metrics.setupAt = Date.now();
            return { ok: false, reason: 'no-event-source' };
          }
        }

        _setupDone = true;
        _metrics.setupAt = Date.now();
        return { ok: true };
      } catch (e: unknown) {
        _metrics.errorsCount++;
        return { ok: false, error: (e as Error).message };
      }
    },

    cleanup(): void {
      if (!_setupDone) return;
      for (let i = 0; i < _cleanups.length; i++) {
        _safeCall(_cleanups[i], `cleanup-${i}`);
      }
      _cleanups = [];
      if (config!.onCleanup) {
        _safeCall(config!.onCleanup, 'onCleanup');
      }
      _setupDone = false;
      _metrics.cleanupAt = Date.now();
    },

    healthCheck(): HealthCheckResult {
      return {
        status: _setupDone ? 'HEALTHY' : 'NOT_CONFIGURED',
        handlerId,
        version: handlerVersion,
        strictMode: isStrict(),
        eventSource: _metrics.eventSource,
        metrics: Object.assign({}, _metrics)
      };
    },

    getMetrics(): HandlerMetrics {
      return Object.assign({}, _metrics);
    },

    info(): HandlerInfoResult {
      return {
        moduleId: handlerId,
        version: handlerVersion,
        setupDone: _setupDone,
        eventSource: _metrics.eventSource,
        cleanupCount: _cleanups.length,
        metrics: Object.assign({}, _metrics)
      };
    },

    isSetup(): boolean {
      return _setupDone;
    }
  };

  return handler;
}

export function info(): HandlerBaseInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    description: 'Factory para criar handlers padronizados de RuntimeContext',
    strictMode: isStrict(),
    p2Enterprise: true,
    portsInitialized: _portsInitialized
  };
}

export default {
  MODULE_ID,
  VERSION,
  createHandler,
  info
};
