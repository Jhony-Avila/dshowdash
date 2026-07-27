

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-kernel
// PURPOSE: MainKernel - Enterprise Runtime Kernel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   STATUS — exported value
//   FEATURE_STATUS — exported value
//   KERNEL_EVENTS — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   shutdown() — exported function
//   registerFeature() — exported function
//   enableFeature() — exported function
//   disableFeature() — exported function
//   listFeatures() — exported function
//   getFeaturesByStatus() — exported function
//   getFeature() — exported function
//   getFeatureMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   exportDiagnostics() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.MainKernel
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'main-kernel';
export const VERSION = '1.2.0-ENTERPRISE';

interface InternalFeature {
  id: string;
  version: string;
  category: string;
  priority: number;
  dependencies: string[];
  status: string;
  registeredAt: number;
  enabledAt: number | null;
  disabledAt: number | null;
  initDurationMs: number | null;
  init?: (opts: Record<string, unknown>) => void;
  cleanup?: () => void;
  healthCheck?: () => Record<string, unknown>;
  info?: () => Record<string, unknown>;
  getMetrics?: () => Record<string, unknown>;
}

interface KernelMetrics {
  inits: number;
  featureRegistrations: number;
  featureEnables: number;
  featureDisables: number;
  featureErrors: number;
  totalInitTimeMs: number;
}

interface KernelState {
  status: string;
  features: Map<string, InternalFeature>;
  initTime: number | null;
  shutdownTime: number | null;
  metrics: KernelMetrics;
  [key: string]: unknown;
}

interface FeatureRegistrationDef {
  id: string;
  version?: string;
  category?: string;
  priority?: number;
  dependencies?: string[];
  init?: (opts: Record<string, unknown>) => void;
  cleanup?: () => void;
  destroy?: () => void;
  healthCheck?: () => Record<string, unknown>;
  info?: () => Record<string, unknown>;
  getMetrics?: () => Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const STATUS = Object.freeze({
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  READY: 'ready',
  DEGRADED: 'degraded',
  SHUTDOWN: 'shutdown',
  ERROR: 'error'
});

export const FEATURE_STATUS = Object.freeze({
  REGISTERED: 'registered',
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  DEGRADED: 'degraded',
  ERROR: 'error'
});

// Kernel Events (SUGESTÃO 05)
export const KERNEL_EVENTS = Object.freeze({
  READY: 'main-kernel:ready',
  SHUTDOWN: 'main-kernel:shutdown',
  FEATURE_REGISTERED: 'main-kernel:feature:registered',
  FEATURE_ENABLED: 'main-kernel:feature:enabled',
  FEATURE_DISABLED: 'main-kernel:feature:disabled',
  FEATURE_ERROR: 'main-kernel:feature:error',
  HEALTH_DEGRADED: 'main-kernel:health:degraded'
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

const _state: KernelState = {
  status: STATUS.IDLE,
  features: new Map<string, InternalFeature>(),
  initTime: null,
  shutdownTime: null,
  metrics: {
    inits: 0,
    featureRegistrations: 0,
    featureEnables: 0,
    featureDisables: 0,
    featureErrors: 0,
    totalInitTimeMs: 0
  }
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function _envelope(ok: boolean, data?: unknown, errors?: Array<{ code: string; message?: string }>) {
  return {
    ok,
    data,
    meta: {
      moduleId: MODULE_ID,
      version: VERSION,
      timestamp: new Date().toISOString(),
      status: _state.status
    },
    errors: errors || []
  };
}

function _track(eventName: string, payload: Record<string, unknown>) {
  try {
    const tk = _getPort('telemetry');
    if (tk?.track) tk.track(eventName, { moduleId: MODULE_ID, ...payload });
  } catch (e: any) { /* silent */ }
}

function _emit(eventName: string, data: Record<string, unknown>) {
  try {
    const eb = _getPort('eventBus');
    if (eb?.emit) eb.emit(eventName, { source: MODULE_ID, timestamp: Date.now(), ...data });
  } catch (e: any) { /* silent */ }
}

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════

export function init(ctx: Record<string, unknown> = {}) {
  if (_state.status !== STATUS.IDLE) {
    return _envelope(true, { alreadyInitialized: true });
  }
  
  try {
    _state.status = STATUS.INITIALIZING;
    _state.initTime = Date.now();
    _state.metrics.inits++;
    
    _initPorts();
    if (ctx.ports) Ports.inject(ctx.ports);
    
    _state.status = STATUS.READY;
    
    _emit(KERNEL_EVENTS.READY, { version: VERSION });
    _track('main-kernel:init', { version: VERSION });
    
    // SUGESTÃO 09: Expor via window para debugging (strict-aware)
    if (typeof window !== 'undefined') {
      if (!isStrict()) {
        (window as any).MainKernel = exports;
      } else {
        recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, property: 'window.MainKernel' });
      }
    }
    
    return _envelope(true, { initialized: true, version: VERSION });
  } catch (e: any) {
    _state.status = STATUS.ERROR;
    return _envelope(false, null, [{ code: 'INIT_ERROR', message: e.message }]);
  }
}

export function shutdown(reason = 'manual') {
  if (_state.status === STATUS.SHUTDOWN) {
    return _envelope(true, { alreadyShutdown: true });
  }
  
  // Disable all enabled features
  _state.features.forEach((f: InternalFeature, id: string) => {
    if (f.status === FEATURE_STATUS.ENABLED) {
      disableFeature(id);
    }
  });
  
  _state.status = STATUS.SHUTDOWN;
  _state.shutdownTime = Date.now();
  
  _emit(KERNEL_EVENTS.SHUTDOWN, { reason });
  
  // Remove from window
  if (typeof window !== 'undefined' && (window as any).MainKernel) {
    delete (window as any).MainKernel;
  }
  
  return _envelope(true, { shutdown: true, reason });
}

// ═══════════════════════════════════════════════════════════════
// FEATURE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function registerFeature(def: FeatureRegistrationDef) {
  if (!def?.id) {
    return _envelope(false, null, [{ code: 'INVALID', message: 'Feature id required' }]);
  }
  
  if (_state.features.has(def.id)) {
    return _envelope(false, null, [{ code: 'EXISTS', message: 'Already registered' }]);
  }
  
  _state.features.set(def.id, {
    id: def.id,
    version: def.version || '0.0.0',
    category: def.category || 'general',
    priority: def.priority ?? 2,
    dependencies: def.dependencies || [],
    status: FEATURE_STATUS.REGISTERED,
    registeredAt: Date.now(),
    enabledAt: null,
    disabledAt: null,
    initDurationMs: null,  // SUGESTÃO 14
    init: def.init,
    cleanup: def.cleanup || def.destroy,
    healthCheck: def.healthCheck,
    info: def.info,
    getMetrics: def.getMetrics
  });
  
  _state.metrics.featureRegistrations++;
  
  _emit(KERNEL_EVENTS.FEATURE_REGISTERED, { featureId: def.id, version: def.version });
  
  return _envelope(true, { featureId: def.id, registered: true });
}

export function enableFeature(id: string, opts: Record<string, unknown> = {}) {
  const f = _state.features.get(id);
  
  if (!f) {
    return _envelope(false, null, [{ code: 'NOT_FOUND' }]);
  }
  
  if (f.status === FEATURE_STATUS.ENABLED) {
    return _envelope(true, { alreadyEnabled: true });
  }
  
  // Check dependencies
  for (const dep of f.dependencies) {
    const d = _state.features.get(dep);
    if (!d || d.status !== FEATURE_STATUS.ENABLED) {
      return _envelope(false, null, [{ code: 'DEP_NOT_MET', message: dep }]);
    }
  }
  
  try {
    const startTime = Date.now();  // SUGESTÃO 14
    
    if (typeof f.init === 'function') {
      f.init(opts);
    }
    
    f.status = FEATURE_STATUS.ENABLED;
    f.enabledAt = Date.now();
    f.initDurationMs = Date.now() - startTime;  // SUGESTÃO 14
    
    _state.metrics.featureEnables++;
    _state.metrics.totalInitTimeMs += f.initDurationMs;
    
    // SUGESTÃO 05: Emit event
    _emit(KERNEL_EVENTS.FEATURE_ENABLED, { 
      featureId: id, 
      initDurationMs: f.initDurationMs 
    });
    
    return _envelope(true, { featureId: id, enabled: true, initDurationMs: f.initDurationMs });
  } catch (e: any) {
    f.status = FEATURE_STATUS.ERROR;
    _state.metrics.featureErrors++;
    
    // SUGESTÃO 05: Emit error event
    _emit(KERNEL_EVENTS.FEATURE_ERROR, { featureId: id, error: e.message });
    
    return _envelope(false, null, [{ code: 'ENABLE_ERROR', message: e.message }]);
  }
}

export function disableFeature(id: string, reason = 'manual') {
  const f = _state.features.get(id);
  
  if (!f) {
    return _envelope(false, null, [{ code: 'NOT_FOUND' }]);
  }
  
  if (f.status !== FEATURE_STATUS.ENABLED) {
    return _envelope(true, { alreadyDisabled: true });
  }
  
  try {
    if (typeof f.cleanup === 'function') {
      f.cleanup();
    }
    
    f.status = FEATURE_STATUS.DISABLED;
    f.disabledAt = Date.now();
    _state.metrics.featureDisables++;
    
    // SUGESTÃO 05: Emit event
    _emit(KERNEL_EVENTS.FEATURE_DISABLED, { featureId: id, reason });
    
    return _envelope(true, { featureId: id, disabled: true });
  } catch (e: any) {
    return _envelope(false, null, [{ code: 'DISABLE_ERROR', message: e.message }]);
  }
}

// ═══════════════════════════════════════════════════════════════
// FEATURE QUERIES
// ═══════════════════════════════════════════════════════════════

export function listFeatures() {
  const list: Array<{ id: string; version: string; status: string; category: string; priority: number; initDurationMs: number | null }> = [];
  _state.features.forEach((f: InternalFeature, id: string) => {
    list.push({
      id,
      version: f.version,
      status: f.status,
      category: f.category,
      priority: f.priority,
      initDurationMs: f.initDurationMs
    });
  });
  return _envelope(true, { features: list, count: list.length });
}

// SUGESTÃO 04: getFeaturesByStatus
export function getFeaturesByStatus(status: string) {
  const list: Array<{ id: string; version: string; category: string; enabledAt: number | null; initDurationMs: number | null }> = [];
  _state.features.forEach((f: InternalFeature, id: string) => {
    if (f.status === status) {
      list.push({
        id,
        version: f.version,
        category: f.category,
        enabledAt: f.enabledAt,
        initDurationMs: f.initDurationMs
      });
    }
  });
  return _envelope(true, { status, features: list, count: list.length });
}

export function getFeature(id: string) {
  const f = _state.features.get(id);
  if (!f) {
    return _envelope(false, null, [{ code: 'NOT_FOUND' }]);
  }
  return _envelope(true, {
    id: f.id,
    version: f.version,
    status: f.status,
    category: f.category,
    priority: f.priority,
    registeredAt: f.registeredAt,
    enabledAt: f.enabledAt,
    disabledAt: f.disabledAt,
    initDurationMs: f.initDurationMs
  });
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

// SUGESTÃO 26: getFeatureMetrics agregado
export function getFeatureMetrics() {
  const metrics: {
    kernel: KernelMetrics;
    features: Record<string, Record<string, unknown>>;
    totals: { registered: number; enabled: number; disabled: number; error: number };
  } = {
    kernel: { ..._state.metrics },
    features: {},
    totals: {
      registered: 0,
      enabled: 0,
      disabled: 0,
      error: 0
    }
  };

  _state.features.forEach((f: InternalFeature, id: string) => {
    // Count by status
    if (f.status === FEATURE_STATUS.REGISTERED) metrics.totals.registered++;
    else if (f.status === FEATURE_STATUS.ENABLED) metrics.totals.enabled++;
    else if (f.status === FEATURE_STATUS.DISABLED) metrics.totals.disabled++;
    else if (f.status === FEATURE_STATUS.ERROR) metrics.totals.error++;

    // Get feature-specific metrics
    if (typeof f.getMetrics === 'function') {
      try {
        metrics.features[id] = f.getMetrics();
      } catch (e: any) {
        metrics.features[id] = { error: (e as Error).message };
      }
    } else {
      metrics.features[id] = { initDurationMs: f.initDurationMs };
    }
  });
  
  return _envelope(true, metrics);
}

export function healthCheck() {
  const checks = {
    initialized: _state.status === STATUS.READY,
    notInError: _state.status !== STATUS.ERROR,
    hasFeatures: _state.features.size > 0
  };
  
  const featureHealth: Record<string, Record<string, unknown>> = {};
  let degradedCount = 0;

  _state.features.forEach((f: InternalFeature, id: string) => {
    if (typeof f.healthCheck === 'function') {
      try {
        featureHealth[id] = f.healthCheck();
        if (featureHealth[id].status === 'DEGRADED') degradedCount++;
      } catch (e: any) {
        featureHealth[id] = { status: 'ERROR', error: (e as Error).message };
        degradedCount++;
      }
    } else {
      featureHealth[id] = {
        status: f.status === FEATURE_STATUS.ERROR ? 'UNHEALTHY' : 'UNKNOWN'
      };
    }
  });
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (_state.status === STATUS.ERROR) status = 'UNHEALTHY';
  else if (passed < total || degradedCount > 0) {
    status = 'DEGRADED';
    _emit(KERNEL_EVENTS.HEALTH_DEGRADED, { degradedFeatures: degradedCount });
  }
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    features: featureHealth,
    uptime: _state.initTime ? Date.now() - _state.initTime : 0,
    timestamp: Date.now()
  };
}

export function info() {
  return _envelope(true, {
    moduleId: MODULE_ID,
    version: VERSION,
    status: _state.status,
    featuresCount: _state.features.size,
    uptime: _state.initTime ? Date.now() - _state.initTime : 0,
    metrics: _state.metrics
  });
}

// SUGESTÃO 20: Export diagnóstico completo em JSON
export function exportDiagnostics() {
  const features: Record<string, Record<string, unknown>> = {};
  _state.features.forEach((f: InternalFeature, id: string) => {
    features[id] = {
      id: f.id,
      version: f.version,
      status: f.status,
      category: f.category,
      priority: f.priority,
      registeredAt: f.registeredAt,
      enabledAt: f.enabledAt,
      disabledAt: f.disabledAt,
      initDurationMs: f.initDurationMs,
      healthCheck: typeof f.healthCheck === 'function' ? (() => { try { return f.healthCheck(); } catch (e: any) { return { error: e.message }; } })() : null,
      metrics: typeof f.getMetrics === 'function' ? (() => { try { return f.getMetrics(); } catch (e: any) { return { error: e.message }; } })() : null
    };
  });
  
  return {
    exportedAt: new Date().toISOString(),
    kernel: {
      moduleId: MODULE_ID,
      version: VERSION,
      status: _state.status,
      initTime: _state.initTime ? new Date(_state.initTime).toISOString() : null,
      uptime: _state.initTime ? Date.now() - _state.initTime : 0,
      metrics: { ..._state.metrics }
    },
    features,
    healthCheck: healthCheck()
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

const exports = {
  MODULE_ID,
  VERSION,
  STATUS,
  FEATURE_STATUS,
  KERNEL_EVENTS,
  init,
  shutdown,
  registerFeature,
  enableFeature,
  disableFeature,
  listFeatures,
  getFeaturesByStatus,
  getFeature,
  getFeatureMetrics,
  healthCheck,
  info,
  exportDiagnostics,
  injectPorts,
  getPorts
};

export default exports;
