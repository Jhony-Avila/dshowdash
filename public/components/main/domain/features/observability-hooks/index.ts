

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//
// PROVIDES:
//   init(), destroy(), cleanup(),
//   registerHook(), before(), after(), onError(),
//   trigger(), getTraces(), clearTraces(), getHookCounts(),
//   getMetrics(), info(), healthCheck(),
//   HOOK_TYPES constants,
//   injectPorts(), getPorts()
//
// RECEIVES (via init — implicit from Ports):
//   eventBus — for navigation/panel lifecycle hooks
// ═══════════════════════════════════════════════════════════════
// MainFeature: Observability Hooks
// @version 1.0.0-ENTERPRISE-ES6
// @description Hooks para métricas, tracing e logging centralizados
// @category observability
// @priority CRITICAL (0)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const MODULE_ID = 'main.feature.observability-hooks';
export const VERSION = '1.0.0-ENTERPRISE';

const HOOK_TYPES = Object.freeze({
  BEFORE: 'before',
  AFTER: 'after',
  ERROR: 'error'
});

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let _enabled = false;
let _cleanups: Array<() => void> = [];
const _hooks: Record<string, Map<string, Array<(...args: unknown[]) => void>>> = {
  before: new Map(),  // operation -> [handlers]
  after: new Map(),
  error: new Map()
};

let _traces: Array<Record<string, unknown>> = [];
const MAX_TRACES = 100;

const _metrics = {
  inits: 0,
  hooksRegistered: 0,
  hooksExecuted: 0,
  tracesRecorded: 0,
  errors: 0
};

// ═══════════════════════════════════════════════════════════════
// TRACING
// ═══════════════════════════════════════════════════════════════

function _createTrace(operation: string, phase: string, data: Record<string, unknown>) {
  return {
    id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    operation,
    phase,
    timestamp: Date.now(),
    data
  };
}

function _recordTrace(trace: Record<string, unknown>) {
  _traces.unshift(trace);
  if (_traces.length > MAX_TRACES) {
    _traces.pop();
  }
  _metrics.tracesRecorded++;
}

// ═══════════════════════════════════════════════════════════════
// HOOK EXECUTION
// ═══════════════════════════════════════════════════════════════

function _executeHooks(type: string, operation: string, context: Record<string, unknown>) {
  const hookMap = _hooks[type];
  if (!hookMap) return;
  
  // Hooks específicos para a operação
  const handlers = hookMap.get(operation) || [];
  
  // Hooks globais (*)
  const globalHandlers = hookMap.get('*') || [];
  
  const allHandlers = handlers.concat(globalHandlers);
  
  for (let i = 0; i < allHandlers.length; i++) {
    try {
      allHandlers[i](context);
      _metrics.hooksExecuted++;
    } catch (e: any) {
      _metrics.errors++;
      console.debug('%c[ERROR]%c [ObservabilityHooks] Hook error:', 'color:#ef4444;font-weight:bold', 'color:inherit', e.message || e);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════

export function init(options: Record<string, unknown>) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  
  try {
    _initPorts();
    _metrics.inits++;
    
    const eb = _getPort('eventBus');
    
    if (eb && eb.on) {
      // Hook em navegação
      const navStartHandler = (data: Record<string, unknown>) => {
        const ctx = { event: 'navigation:start', data, timestamp: Date.now() };
        _executeHooks(HOOK_TYPES.BEFORE, 'navigation', ctx);
        _recordTrace(_createTrace('navigation', 'start', data));
      };
      
      const navCompleteHandler = (data: Record<string, unknown>) => {
        const ctx = { event: 'navigation:complete', data, timestamp: Date.now() };
        _executeHooks(HOOK_TYPES.AFTER, 'navigation', ctx);
        _recordTrace(_createTrace('navigation', 'complete', data));
      };
      
      const navErrorHandler = (data: Record<string, unknown>) => {
        const ctx = { event: 'navigation:error', data, timestamp: Date.now() };
        _executeHooks(HOOK_TYPES.ERROR, 'navigation', ctx);
        _recordTrace(_createTrace('navigation', 'error', data));
      };
      
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_START) {
        eb.on(MAIN_EVENTS.NAVIGATION_START, navStartHandler);
        _cleanups.push(() => { if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_START, navStartHandler); });
      }
      
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_COMPLETE) {
        eb.on(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler);
        _cleanups.push(() => { if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_COMPLETE, navCompleteHandler); });
      }
      
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_ERROR) {
        eb.on(MAIN_EVENTS.NAVIGATION_ERROR, navErrorHandler);
        _cleanups.push(() => { if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_ERROR, navErrorHandler); });
      }
      
      // Hook em panel lifecycle
      const panelMountHandler = (data: Record<string, unknown>) => {
        const ctx = { event: 'panel:mounted', data, timestamp: Date.now() };
        _executeHooks(HOOK_TYPES.AFTER, 'panel', ctx);
        _recordTrace(_createTrace('panel', 'mounted', data));
      };
      
      if (MAIN_EVENTS && MAIN_EVENTS.PANEL_MOUNTED) {
        eb.on(MAIN_EVENTS.PANEL_MOUNTED, panelMountHandler);
        _cleanups.push(() => { if (eb.off) eb.off(MAIN_EVENTS.PANEL_MOUNTED, panelMountHandler); });
      }
    }
    
    _enabled = true;
    
    return { ok: true, version: VERSION };
    
  } catch (e: any) {
    _metrics.errors++;
    return { ok: false, error: e.message };
  }
}

export function destroy() {
  for (let i = 0; i < _cleanups.length; i++) {
    try { _cleanups[i](); } catch (e: any) { }
  }
  _cleanups = [];
  
  _hooks.before.clear();
  _hooks.after.clear();
  _hooks.error.clear();
  
  _enabled = false;
  
  return { ok: true };
}

export const cleanup = destroy;

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Registra um hook
 * @param {string} type - 'before' | 'after' | 'error'
 * @param {string} operation - Nome da operação ou '*' para global
 * @param {Function} handler - Função handler
 * @returns {Function} Função para remover o hook
 */
export function registerHook(type: string, operation: string, handler: (...args: unknown[]) => void) {
  if (!_hooks[type]) {
    return () => {};
  }
  
  if (typeof handler !== 'function') {
    return () => {};
  }
  
  const hookMap = _hooks[type];
  if (!hookMap.has(operation)) {
    hookMap.set(operation, []);
  }
  
  // @ts-expect-error strict migration — TS2532
  hookMap.get(operation).push(handler);
  _metrics.hooksRegistered++;
  
  // Retorna função para remover
  return () => {
    const handlers = hookMap.get(operation);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx > -1) handlers.splice(idx, 1);
    }
  };
}

/**
 * Atalho para hook before
 */
export function before(operation: string, handler: (...args: unknown[]) => void) {
  return registerHook(HOOK_TYPES.BEFORE, operation, handler);
}

/**
 * Atalho para hook after
 */
export function after(operation: string, handler: (...args: unknown[]) => void) {
  return registerHook(HOOK_TYPES.AFTER, operation, handler);
}

/**
 * Atalho para hook error
 */
export function onError(operation: string, handler: (...args: unknown[]) => void) {
  return registerHook(HOOK_TYPES.ERROR, operation, handler);
}

/**
 * Dispara hooks manualmente
 */
export function trigger(type: string, operation: string, context: Record<string, unknown>) {
  _executeHooks(type, operation, context || {});
  return { ok: true };
}

/**
 * Retorna traces recentes
 */
export function getTraces(limit: number) {
  return limit ? _traces.slice(0, limit) : _traces.slice();
}

/**
 * Limpa traces
 */
export function clearTraces() {
  _traces = [];
  return { ok: true };
}

/**
 * Retorna contagem de hooks registrados
 */
export function getHookCounts() {
  const counts: Record<string, Record<string, number>> = {};

  for (const type in _hooks) {
    if (_hooks.hasOwnProperty(type)) {
      counts[type] = {};
      _hooks[type].forEach((handlers: Array<(...args: unknown[]) => void>, operation: string) => {
        counts[type][operation] = handlers.length;
      });
    }
  }

  return counts;
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getMetrics() {
  return Object.assign({}, _metrics, { tracesCount: _traces.length });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    hookTypes: HOOK_TYPES,
    hookCounts: getHookCounts(),
    metrics: getMetrics()
  };
}

export function healthCheck() {
  const checks = {
    enabled: _enabled,
    hasEventBus: !!_getPort('eventBus'),
    lowErrorRate: _metrics.errors < 10
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!_enabled) status = 'NOT_INITIALIZED';
  else if (_metrics.errors >= 10) status = 'DEGRADED';
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  MODULE_ID,
  VERSION,
  HOOK_TYPES,
  init,
  destroy,
  cleanup,
  registerHook,
  before,
  after,
  onError,
  trigger,
  getTraces,
  clearTraces,
  getHookCounts,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
